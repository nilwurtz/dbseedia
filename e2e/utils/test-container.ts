import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import type { ConnectionConfig } from "../../src/interfaces/index.js";
import { SchemaLoader } from "./schema-loader.js";

export class PostgresTestContainer {
  private static mainInstance: PostgresTestContainer | null = null;
  private static analyticsInstance: PostgresTestContainer | null = null;

  private container: StartedTestContainer | null = null;
  private connectionConfig: ConnectionConfig | null = null;
  private schemaInitialized: boolean = false;
  private readonly image = "postgres:16-alpine";
  private readonly database = "testdb";
  private readonly username = "testuser";
  private readonly password = "testpass";

  static getMainInstance(): PostgresTestContainer {
    if (!PostgresTestContainer.mainInstance) {
      PostgresTestContainer.mainInstance = new PostgresTestContainer();
    }
    return PostgresTestContainer.mainInstance;
  }

  static getAnalyticsInstance(): PostgresTestContainer {
    if (!PostgresTestContainer.analyticsInstance) {
      PostgresTestContainer.analyticsInstance = new PostgresTestContainer();
    }
    return PostgresTestContainer.analyticsInstance;
  }

  async start(): Promise<ConnectionConfig> {
    // 既に起動済みの場合は既存の接続設定を返す
    if (this.container && this.connectionConfig) {
      console.log("[TestContainer] Container already started, reusing existing connection");
      return this.connectionConfig;
    }

    console.log("[TestContainer] Starting PostgreSQL container...");

    this.container = await new GenericContainer(this.image)
      .withEnvironment({
        POSTGRES_DB: this.database,
        POSTGRES_USER: this.username,
        POSTGRES_PASSWORD: this.password,
      })
      .withExposedPorts(5432)
      .withWaitStrategy(
        // Wait for PostgreSQL to be ready
        await import("testcontainers").then(({ Wait }) =>
          Wait.forLogMessage("database system is ready to accept connections", 2),
        ),
      )
      .start();

    const host = this.container.getHost();
    const port = this.container.getMappedPort(5432);

    this.connectionConfig = {
      host,
      port,
      database: this.database,
      username: this.username,
      password: this.password,
      ssl: false,
    };

    console.log(`[TestContainer] PostgreSQL container started successfully at ${host}:${port}`);

    return this.connectionConfig;
  }

  async stop(): Promise<void> {
    if (this.container) {
      console.log("[TestContainer] Stopping PostgreSQL container...");
      await this.container.stop();
      this.container = null;
      console.log("[TestContainer] PostgreSQL container stopped successfully");
    }
  }

  async executeQuery(query: string): Promise<string[]> {
    if (!this.container) {
      throw new Error("Container not started");
    }

    console.log(`[TestContainer] Executing query: ${query}`);

    const result = await this.container.exec([
      "psql",
      "-U",
      this.username,
      "-d",
      this.database,
      "-c",
      query,
      "--csv", // output in CSV format
      "-t", // tuples only
      "-A", // unaligned
    ]);

    console.log(`[TestContainer] Query exit code: ${result.exitCode}`);
    console.log(`[TestContainer] Query output: \n${result.output}`);

    if (result.exitCode !== 0) {
      console.error(`[TestContainer] Query failed with exit code ${result.exitCode}`);
      console.error(`[TestContainer] Error output: ${result.output}`);
    }

    return result.output.split("\n").filter((line) => line.trim());
  }

  async createTable(tableName: string, columns: Array<{ name: string; type: string }>): Promise<void> {
    const columnDefs = columns.map((col) => `${col.name} ${col.type}`).join(", ");
    const createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs});`;

    console.log(`[TestContainer] Creating table: ${tableName}`);
    await this.executeQuery(createTableQuery);
    console.log(`[TestContainer] Table ${tableName} created successfully`);
  }

  async initializeSchema(): Promise<void> {
    if (!this.container) {
      throw new Error("Container not started");
    }

    if (this.schemaInitialized) {
      console.log("[TestContainer] Schema already initialized, skipping");
      return;
    }

    console.log("[TestContainer] Initializing database schema...");

    const currentDir = dirname(fileURLToPath(import.meta.url));
    const schemaDir = join(currentDir, "..", "schema");

    const schemaLoader = new SchemaLoader({
      host: this.container.getHost(),
      port: this.container.getMappedPort(5432),
      database: this.database,
      username: this.username,
      password: this.password,
      ssl: false,
    });

    await schemaLoader.connect();
    try {
      await schemaLoader.loadSchemaFromDirectory(schemaDir);
      this.schemaInitialized = true;
      console.log("[TestContainer] Database schema initialization completed");
    } finally {
      await schemaLoader.disconnect();
    }
  }

  async truncateTables(): Promise<void> {
    if (!this.container) {
      throw new Error("Container not started");
    }

    console.log("[TestContainer] Truncating all tables...");

    const result = await this.container.exec([
      "psql",
      "-U",
      this.username,
      "-d",
      this.database,
      "-c",
      "TRUNCATE TABLE users, posts, comments, tags, departments, employees, projects RESTART IDENTITY CASCADE",
      "-q", // quiet mode
    ]);

    if (result.exitCode !== 0) {
      console.error(`[TestContainer] Truncate failed with exit code ${result.exitCode}`);
      console.error(`[TestContainer] Error output: ${result.output}`);
    } else {
      console.log("[TestContainer] All tables truncated successfully");
    }
  }

  async resetDatabase(): Promise<void> {
    await this.initializeSchema();
    await this.truncateTables();
  }

  async copyDataFromCSV(tableName: string, csvPath: string): Promise<void> {
    if (!this.container) {
      throw new Error("Container not started");
    }

    console.log(`[TestContainer] Copying data from CSV: ${csvPath} to table: ${tableName}`);

    const copyCommand = `\\copy ${tableName} FROM '${csvPath}' DELIMITER ',' CSV HEADER`;

    const result = await this.container.exec(["psql", "-U", this.username, "-d", this.database, "-c", copyCommand]);

    console.log(`[TestContainer] CSV copy exit code: ${result.exitCode}`);
    console.log(`[TestContainer] CSV copy output: ${result.output}`);

    if (result.exitCode !== 0) {
      console.error(`[TestContainer] CSV copy failed with exit code ${result.exitCode}`);
      console.error(`[TestContainer] Error output: ${result.output}`);
    } else {
      console.log(`[TestContainer] Successfully copied data from ${csvPath} to ${tableName}`);
    }
  }

  async copyDataFromTSV(tableName: string, tsvPath: string): Promise<void> {
    if (!this.container) {
      throw new Error("Container not started");
    }

    console.log(`[TestContainer] Copying data from TSV: ${tsvPath} to table: ${tableName}`);

    const copyCommand = `\\copy ${tableName} FROM '${tsvPath}' DELIMITER E'\\t' CSV HEADER`;

    const result = await this.container.exec(["psql", "-U", this.username, "-d", this.database, "-c", copyCommand]);

    console.log(`[TestContainer] TSV copy exit code: ${result.exitCode}`);
    console.log(`[TestContainer] TSV copy output: ${result.output}`);

    if (result.exitCode !== 0) {
      console.error(`[TestContainer] TSV copy failed with exit code ${result.exitCode}`);
      console.error(`[TestContainer] Error output: ${result.output}`);
    } else {
      console.log(`[TestContainer] Successfully copied data from ${tsvPath} to ${tableName}`);
    }
  }
}
