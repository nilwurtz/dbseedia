export interface ConnectionConfig {
  name?: string;
  host: string;
  port?: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean | object;
}

export interface DbSeediaConfig {
  connection: ConnectionConfig | ConnectionConfig[];
  strategy?: "truncate" | "delete";
  separator?: "," | "\t" | string;
  encoding?: string;
  nullValue?: string;
  batchSize?: number;
  [key: string]: unknown;
}

export interface LoadOptions {
  target?: string;
  tables?: string[];
  strategy?: "truncate" | "delete";
}

export interface ParseOptions {
  separator?: string;
  encoding?: string;
  header?: boolean;
}

export interface ParsedData {
  headers: string[];
  rows: string[][];
}

export interface TransformedData {
  columns: string[];
  values: (string | number | boolean | null)[][];
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
}

export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
}

export type LoadStrategy = "truncate" | "delete";

export interface FileReader {
  readCSV(filePath: string, options: ParseOptions): Promise<ParsedData>;
  readTableOrdering(filePath: string): Promise<string[]>;
}

export interface DataTransformer {
  transform(data: ParsedData, schema: TableSchema): Promise<TransformedData>;
}

export interface DatabaseExecutor {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  execute(tableName: string, data: TransformedData, strategy: LoadStrategy): Promise<void>;
  truncateTable(tableName: string): Promise<void>;
  executeSQL(sql: string): Promise<void>;
}
