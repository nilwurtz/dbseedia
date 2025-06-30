import { GenericContainer, StartedTestContainer } from "testcontainers";
import type { ConnectionConfig } from "../../src/interfaces/index.js";

export class PostgresTestContainer {
  private container: StartedTestContainer | null = null;
  private readonly image = "postgres:16-alpine";
  private readonly database = "testdb";
  private readonly username = "testuser";
  private readonly password = "testpass";

  async start(): Promise<ConnectionConfig> {
    this.container = await new GenericContainer(this.image)
      .withEnvironment({
        POSTGRES_DB: this.database,
        POSTGRES_USER: this.username,
        POSTGRES_PASSWORD: this.password,
      })
      .withExposedPorts(5432)
      .withWaitStrategy(
        // Wait for PostgreSQL to be ready
        import("testcontainers").then(({ Wait }) =>
          Wait.forLogMessage(
            "database system is ready to accept connections",
            2,
          ),
        ),
      )
      .start();

    const host = this.container.getHost();
    const port = this.container.getMappedPort(5432);

    return {
      host,
      port,
      database: this.database,
      username: this.username,
      password: this.password,
      ssl: false,
    };
  }

  async stop(): Promise<void> {
    if (this.container) {
      await this.container.stop();
      this.container = null;
    }
  }

  async executeQuery(query: string): Promise<any[]> {
    if (!this.container) {
      throw new Error("Container not started");
    }

    const result = await this.container.exec([
      "psql",
      "-U",
      this.username,
      "-d",
      this.database,
      "-c",
      query,
      "-t", // tuples only
      "-A", // unaligned
    ]);

    return result.output.split("\n").filter((line) => line.trim());
  }

  async createTable(
    tableName: string,
    columns: Array<{ name: string; type: string }>,
  ): Promise<void> {
    const columnDefs = columns
      .map((col) => `${col.name} ${col.type}`)
      .join(", ");
    const createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs});`;

    await this.executeQuery(createTableQuery);
  }
}
