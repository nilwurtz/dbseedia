import { access } from "node:fs/promises";
import { join } from "node:path";
import { FileNotFoundError } from "../errors/index.js";

export interface TableFileInfo {
  filePath: string;
  separator: string;
}

export interface TableFileLocatorInterface {
  locateTableFile(directory: string, tableName: string): Promise<TableFileInfo>;
}

export class TableFileLocator implements TableFileLocatorInterface {
  async locateTableFile(directory: string, tableName: string): Promise<TableFileInfo> {
    const csvFile = join(directory, `${tableName}.csv`);
    const tsvFile = join(directory, `${tableName}.tsv`);

    try {
      await access(csvFile);
      return {
        filePath: csvFile,
        separator: ",",
      };
    } catch {
      try {
        await access(tsvFile);
        return {
          filePath: tsvFile,
          separator: "\t",
        };
      } catch {
        throw new FileNotFoundError(`No data file (CSV or TSV) found for table: ${tableName}`);
      }
    }
  }
}
