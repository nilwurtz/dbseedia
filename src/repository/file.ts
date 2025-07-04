import { readFile } from "node:fs/promises";
import Papa from "papaparse";
import { FileNotFoundError, FileParseError } from "../errors/index.js";
import type { ParsedData, ParseOptions } from "../interfaces/index.js";

export interface FileRepository {
  readCsv(filePath: string, options?: ParseOptions): Promise<ParsedData>;
  readTableOrdering(filePath: string): Promise<string[]>;
}

export class CsvFileRepository implements FileRepository {
  async readCsv(filePath: string, options: ParseOptions = {}): Promise<ParsedData> {
    try {
      const content = await readFile(filePath, {
        encoding: (options.encoding as BufferEncoding) || "utf8",
      });

      const parseResult = Papa.parse(content, {
        delimiter: options.separator || ",",
        header: false,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        transform: (value: string) => value.trim(),
      });

      if (parseResult.errors.length > 0) {
        throw new Error(`CSV parsing errors: ${parseResult.errors.map((e) => e.message).join(", ")}`);
      }

      const rows = parseResult.data as string[][];
      if (rows.length === 0) {
        return { headers: [], rows: [] };
      }

      const headers = options.header !== false ? rows[0] || [] : [];
      const dataRows = options.header !== false ? rows.slice(1) : rows;

      return {
        headers,
        rows: dataRows,
      };
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        throw new FileNotFoundError(`CSV file not found: ${filePath}`, err);
      }
      throw new FileParseError(`Failed to read CSV file: ${filePath}`, err);
    }
  }

  async readTableOrdering(filePath: string): Promise<string[]> {
    try {
      const content = await readFile(filePath, { encoding: "utf8" });
      return content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"));
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        throw new FileNotFoundError(`Table ordering file not found: ${filePath}`, err);
      }
      throw new FileParseError(`Failed to read table ordering file: ${filePath}`, err);
    }
  }
}
