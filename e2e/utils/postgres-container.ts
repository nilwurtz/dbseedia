import { GenericContainer, type StartedTestContainer } from "testcontainers";
import type { ConnectionConfig } from "../../src/interfaces/index.js";

/**
 * TestContainer のライフサイクル管理に専念したクラス
 * PostgreSQL固有の操作は含まない
 */
export class PostgresContainer {
  private static mainInstance: PostgresContainer | null = null;
  private static analyticsInstance: PostgresContainer | null = null;

  private container: StartedTestContainer | null = null;
  private connectionConfig: ConnectionConfig | null = null;
  private readonly image = "postgres:16-alpine";
  private readonly database = "testdb";
  private readonly username = "testuser";
  private readonly password = "testpass";

  static getMainInstance(): PostgresContainer {
    if (!PostgresContainer.mainInstance) {
      PostgresContainer.mainInstance = new PostgresContainer();
    }
    return PostgresContainer.mainInstance;
  }

  static getAnalyticsInstance(): PostgresContainer {
    if (!PostgresContainer.analyticsInstance) {
      PostgresContainer.analyticsInstance = new PostgresContainer();
    }
    return PostgresContainer.analyticsInstance;
  }

  async start(): Promise<ConnectionConfig> {
    // 既に起動済みの場合は既存の接続設定を返す
    if (this.container && this.connectionConfig) {
      console.log("[PostgresContainer] Container already started, reusing existing connection");
      return this.connectionConfig;
    }

    console.log("[PostgresContainer] Starting PostgreSQL container...");

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

    console.log(`[PostgresContainer] PostgreSQL container started successfully at ${host}:${port}`);

    return this.connectionConfig;
  }

  async stop(): Promise<void> {
    if (this.container) {
      console.log("[PostgresContainer] Stopping PostgreSQL container...");
      await this.container.stop();
      this.container = null;
      this.connectionConfig = null;
      console.log("[PostgresContainer] PostgreSQL container stopped successfully");
    }
  }

  getContainer(): StartedTestContainer | null {
    return this.container;
  }

  getConnectionConfig(): ConnectionConfig | null {
    return this.connectionConfig;
  }

  isStarted(): boolean {
    return this.container !== null && this.connectionConfig !== null;
  }
}
