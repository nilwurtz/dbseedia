import postgres from "postgres";
import { ConnectionError, DatabaseError } from "../errors/index.js";
import type { ConnectionConfig, LoadStrategy, TransformedData } from "../interfaces/index.js";

export interface DbRepository {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  execute(tableName: string, data: TransformedData, strategy: LoadStrategy): Promise<void>;
  truncateTable(tableName: string): Promise<void>;
  deleteTableData(tableName: string): Promise<void>;
  executeSQL(sql: string): Promise<void>;
}

export class PostgresDbRepository implements DbRepository {
  private sql: postgres.Sql | null = null;
  private config: ConnectionConfig;

  constructor(config: ConnectionConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      this.sql = postgres({
        host: this.config.host,
        port: this.config.port || 5432,
        database: this.config.database,
        username: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl || false,
        onnotice: this.config.verbose ? console.log : () => {},
      });

      await this.sql.unsafe("SELECT 1");
    } catch (error) {
      throw new ConnectionError(
        `Failed to connect to database: ${this.config.host}:${this.config.port || 5432}/${this.config.database}`,
        error as Error,
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.sql) {
      await this.sql.end();
      this.sql = null;
    }
  }

  async execute(tableName: string, data: TransformedData, strategy: LoadStrategy): Promise<void> {
    if (!this.sql) {
      throw new DatabaseError("Database connection not established");
    }

    try {
      await this.sql.begin(async (sql) => {
        if (strategy === "truncate") {
          await this.truncateTable(tableName);
        } else if (strategy === "delete") {
          await this.deleteTableData(tableName);
        }

        if (data.values.length === 0) {
          return;
        }

        const columnNames = data.columns.join(", ");
        const insertQuery = `INSERT INTO ${tableName} (${columnNames}) VALUES `;
        const valueRows = data.values.map(
          (row) =>
            "(" +
            row.map((value) => (value === null ? "NULL" : `'${String(value).replace(/'/g, "''")}'`)).join(", ") +
            ")",
        );

        const batchSize = 1000;
        for (let i = 0; i < valueRows.length; i += batchSize) {
          const batch = valueRows.slice(i, i + batchSize);
          await sql.unsafe(insertQuery + batch.join(", "));
        }
      });
    } catch (error) {
      throw new DatabaseError(
        `Failed to load data into table '${tableName}': ${(error as Error).message}`,
        error as Error,
      );
    }
  }

  async truncateTable(tableName: string): Promise<void> {
    if (!this.sql) {
      throw new DatabaseError("Database connection not established");
    }

    try {
      await this.sql.unsafe(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
    } catch (error) {
      throw new DatabaseError(`Failed to truncate table '${tableName}': ${(error as Error).message}`, error as Error);
    }
  }

  async deleteTableData(tableName: string): Promise<void> {
    if (!this.sql) {
      throw new DatabaseError("Database connection not established");
    }

    try {
      await this.sql.unsafe(`DELETE FROM ${tableName}`);
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete data from table '${tableName}': ${(error as Error).message}`,
        error as Error,
      );
    }
  }

  async executeSQL(sql: string): Promise<void> {
    if (!this.sql) {
      throw new DatabaseError("Database connection not established");
    }

    try {
      await this.sql.unsafe(sql);
    } catch (error) {
      throw new DatabaseError(`Failed to execute SQL: ${(error as Error).message}`, error as Error);
    }
  }
}
