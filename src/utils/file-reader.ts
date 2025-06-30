import { readFile } from "fs/promises";
import { parse } from "papaparse";
import type {
  FileReader,
  ParseOptions,
  ParsedData,
} from "../interfaces/index.js";
import { FileParseError } from "../errors/index.js";

export class CsvFileReader implements FileReader {
  async readCSV(
    filePath: string,
    options: ParseOptions = {},
  ): Promise<ParsedData> {
    try {
      const content = await readFile(filePath, {
        encoding: (options.encoding as BufferEncoding) || "utf8",
      });

      const parseResult = parse(content, {
        delimiter: options.separator || ",",
        header: false,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        transform: (value: string) => value.trim(),
      });

      if (parseResult.errors.length > 0) {
        throw new Error(
          `CSV parsing errors: ${parseResult.errors.map((e) => e.message).join(", ")}`,
        );
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
      throw new FileParseError(
        `Failed to read CSV file: ${filePath}`,
        error as Error,
      );
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
      throw new FileParseError(
        `Failed to read table ordering file: ${filePath}`,
        error as Error,
      );
    }
  }
}
