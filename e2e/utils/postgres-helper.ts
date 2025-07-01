import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PostgresContainer } from "./postgres-container.js";
import { SchemaLoader } from "./schema-loader.js";

/**
 * PostgreSQL固有の操作に専念したクラス
 * データベースクエリ、スキーマ管理、データ操作を担当
 */
export class PostgresHelper {
  private schemaInitialized: boolean = false;

  constructor(private readonly container: PostgresContainer) {}

  async executeQuery(query: string): Promise<string[]> {
    const testContainer = this.container.getContainer();
    const config = this.container.getConnectionConfig();

    if (!testContainer || !config) {
      throw new Error("Container not started");
    }

    console.debug(`[PostgresHelper] Executing query: ${query}`);

    const result = await testContainer.exec([
      "psql",
      "-U",
      config.username,
      "-d",
      config.database,
      "-c",
      query,
      "--csv", // output in CSV format
      "-t", // tuples only
      "-A", // unaligned
    ]);

    console.debug(`[PostgresHelper] Query exit code: ${result.exitCode}`);
    console.debug(`[PostgresHelper] Query output: \n${result.output}`);

    if (result.exitCode !== 0) {
      console.error(`[PostgresHelper] Query failed with exit code ${result.exitCode}`);
      console.error(`[PostgresHelper] Error output: ${result.output}`);
    }

    return result.output.split("\n").filter((line) => line.trim());
  }

  async initializeSchema(): Promise<void> {
    const testContainer = this.container.getContainer();
    const config = this.container.getConnectionConfig();

    if (!testContainer || !config) {
      throw new Error("Container not started");
    }

    if (this.schemaInitialized) {
      console.log("[PostgresHelper] Schema already initialized, skipping");
      return;
    }

    console.log("[PostgresHelper] Initializing database schema...");

    const currentDir = dirname(fileURLToPath(import.meta.url));
    const schemaDir = join(currentDir, "..", "schema");

    const schemaLoader = new SchemaLoader(config);

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
    const testContainer = this.container.getContainer();
    const config = this.container.getConnectionConfig();

    if (!testContainer || !config) {
      throw new Error("Container not started");
    }

    console.debug("[PostgresHelper] Truncating all tables...");

    const result = await testContainer.exec([
      "psql",
      "-U",
      config.username,
      "-d",
      config.database,
      "-c",
      "TRUNCATE TABLE users, posts, comments, tags, departments, employees, projects RESTART IDENTITY CASCADE",
      "-q", // quiet mode
    ]);

    if (result.exitCode !== 0) {
      console.error(`[PostgresHelper] Truncate failed with exit code ${result.exitCode}`);
      console.error(`[PostgresHelper] Error output: ${result.output}`);
    } else {
      console.debug("[PostgresHelper] All tables truncated successfully");
    }
  }

  async resetDatabase(): Promise<void> {
    await this.initializeSchema();
    await this.truncateTables();
  }

  async createTable(tableName: string, columns: Array<{ name: string; type: string }>): Promise<void> {
    const columnDefs = columns.map((col) => `${col.name} ${col.type}`).join(", ");
    const createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs});`;

    console.log(`[PostgresHelper] Creating table: ${tableName}`);
    await this.executeQuery(createTableQuery);
    console.log(`[PostgresHelper] Table ${tableName} created successfully`);
  }

  async copyDataFromCSV(tableName: string, csvPath: string): Promise<void> {
    const testContainer = this.container.getContainer();
    const config = this.container.getConnectionConfig();

    if (!testContainer || !config) {
      throw new Error("Container not started");
    }

    console.log(`[PostgresHelper] Copying data from CSV: ${csvPath} to table: ${tableName}`);

    const copyCommand = `\\copy ${tableName} FROM '${csvPath}' DELIMITER ',' CSV HEADER`;

    const result = await testContainer.exec(["psql", "-U", config.username, "-d", config.database, "-c", copyCommand]);

    console.debug(`[PostgresHelper] CSV copy exit code: ${result.exitCode}`);
    console.debug(`[PostgresHelper] CSV copy output: ${result.output}`);

    if (result.exitCode !== 0) {
      console.error(`[PostgresHelper] CSV copy failed with exit code ${result.exitCode}`);
      console.error(`[PostgresHelper] Error output: ${result.output}`);
    } else {
      console.log(`[PostgresHelper] Successfully copied data from ${csvPath} to ${tableName}`);
    }
  }

  async copyDataFromTSV(tableName: string, tsvPath: string): Promise<void> {
    const testContainer = this.container.getContainer();
    const config = this.container.getConnectionConfig();

    if (!testContainer || !config) {
      throw new Error("Container not started");
    }

    console.log(`[PostgresHelper] Copying data from TSV: ${tsvPath} to table: ${tableName}`);

    const copyCommand = `\\copy ${tableName} FROM '${tsvPath}' DELIMITER E'\\t' CSV HEADER`;

    const result = await testContainer.exec(["psql", "-U", config.username, "-d", config.database, "-c", copyCommand]);

    console.debug(`[PostgresHelper] TSV copy exit code: ${result.exitCode}`);
    console.debug(`[PostgresHelper] TSV copy output: ${result.output}`);

    if (result.exitCode !== 0) {
      console.error(`[PostgresHelper] TSV copy failed with exit code ${result.exitCode}`);
      console.error(`[PostgresHelper] Error output: ${result.output}`);
    } else {
      console.log(`[PostgresHelper] Successfully copied data from ${tsvPath} to ${tableName}`);
    }
  }
}
