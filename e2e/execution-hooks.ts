import { afterAll, beforeAll, beforeEach } from "vitest";
import { DbSeedia } from "../src/index.js";
import type { ConnectionConfig, LoadStrategy } from "../src/interfaces/index.js";
import { PostgresTestContainer } from "./utils/test-container.js";

export interface TestContext {
  testContainer: PostgresTestContainer;
  connectionConfig: ConnectionConfig;
  dbSeedia: DbSeedia;
}

export function setupE2EHooks(strategy: LoadStrategy = "truncate") {
  let testContainer: PostgresTestContainer;
  let connectionConfig: ConnectionConfig;
  let dbSeedia: DbSeedia;

  beforeAll(async () => {
    testContainer = new PostgresTestContainer();
    connectionConfig = await testContainer.start();

    dbSeedia = new DbSeedia({
      connection: connectionConfig,
      strategy: strategy,
    });

    await dbSeedia.connect();
  }, 60000);

  afterAll(async () => {
    if (dbSeedia) {
      await dbSeedia.disconnect();
    }
    if (testContainer) {
      await testContainer.stop();
    }
  });

  beforeEach(async () => {
    if (testContainer) {
      await testContainer.resetDatabase();
      await testContainer.setupTestTables();
    }
  });

  return () => ({
    testContainer,
    connectionConfig,
    dbSeedia,
  });
}
