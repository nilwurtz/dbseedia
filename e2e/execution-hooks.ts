import { beforeAll, afterAll, beforeEach } from "vitest";
import { DbSeedia } from "../src/index.js";
import { PostgresTestContainer } from "./utils/test-container.js";
import type { ConnectionConfig } from "../src/interfaces/index.js";

export interface TestContext {
  testContainer: PostgresTestContainer;
  connectionConfig: ConnectionConfig;
  dbSeedia: DbSeedia;
}

export function setupE2EHooks(strategy: string = "truncate") {
  let testContainer: PostgresTestContainer;
  let connectionConfig: ConnectionConfig;
  let dbSeedia: DbSeedia;

  beforeAll(async () => {
    testContainer = new PostgresTestContainer();
    connectionConfig = await testContainer.start();

    dbSeedia = new DbSeedia({
      connection: connectionConfig,
      strategy: strategy as any,
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
