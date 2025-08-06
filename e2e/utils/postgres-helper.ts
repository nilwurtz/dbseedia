import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import type { ConnectionConfig } from "../../src/interfaces/index.js";
import { SchemaLoader } from "./schema-loader.js";

/**
 * PostgreSQL固有の操作に専念したクラス（docker-compose環境用）
 * データベースクエリ、スキーマ管理、データ操作を担当
 */
export class PostgresHelper {
  private schemaInitialized: boolean = false;
  private sql: postgres.Sql | null = null;

  constructor(private readonly config: ConnectionConfig) {}

  async connect(): Promise<void> {
    if (!this.sql) {
      this.sql = postgres({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        username: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl || false,
        onnotice: this.config.verbose ? console.log : () => {},
      });
    }
  }

  async disconnect(): Promise<void> {
    if (this.sql) {
      await this.sql.end();
      this.sql = null;
    }
  }

  async executeQuery(query: string): Promise<unknown[]> {
    if (!this.sql) {
      throw new Error("Not connected to database");
    }

    console.debug(`[PostgresHelper] Executing query: ${query}`);

    const result = await this.sql.unsafe(query);
    return result;
  }

  async initializeSchema(): Promise<void> {
    if (this.schemaInitialized) {
      console.log("[PostgresHelper] Schema already initialized, skipping");
      return;
    }

    console.log("[PostgresHelper] Initializing database schema...");

    const currentDir = dirname(fileURLToPath(import.meta.url));
    const schemaDir = join(currentDir, "..", "schema");

    const schemaLoader = new SchemaLoader(this.config);

    await schemaLoader.connect();
    try {
      await schemaLoader.loadSchemaFromDirectory(schemaDir);
      this.schemaInitialized = true;
      console.log("[PostgresHelper] Database schema initialization completed");
    } finally {
      await schemaLoader.disconnect();
    }
  }

  async truncateTables(): Promise<void> {
    if (!this.sql) {
      throw new Error("Not connected to database");
    }

    console.debug("[PostgresHelper] Truncating all tables...");

    try {
      await this
        .sql`TRUNCATE TABLE users, posts, comments, tags, departments, employees, projects RESTART IDENTITY CASCADE`;
      console.debug("[PostgresHelper] All tables truncated successfully");
    } catch (error) {
      console.error("[PostgresHelper] Truncate failed:", error);
      throw error;
    }
  }

  async resetDatabase(): Promise<void> {
    await this.initializeSchema();
    await this.truncateTables();
  }

  async createTable(tableName: string, columns: Array<{ name: string; type: string }>): Promise<void> {
    if (!this.sql) {
      throw new Error("Not connected to database");
    }

    const columnDefs = columns.map((col) => `${col.name} ${col.type}`).join(", ");
    const createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs});`;

    console.log(`[PostgresHelper] Creating table: ${tableName}`);
    await this.sql.unsafe(createTableQuery);
    console.log(`[PostgresHelper] Table ${tableName} created successfully`);
  }
}
