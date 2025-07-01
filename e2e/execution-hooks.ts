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
    // シングルトンコンテナを使用
    testContainer = PostgresTestContainer.getMainInstance();
    connectionConfig = await testContainer.start();

    // スキーマを1度だけ初期化
    await testContainer.initializeSchema();

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
    // コンテナは停止しない（他のテストで再利用）
  });

  beforeEach(async () => {
    if (testContainer) {
      // テーブルのクリアのみ実行（スキーマ再作成はしない）
      await testContainer.truncateTables();
    }
  });

  return () => ({
    testContainer,
    connectionConfig,
    dbSeedia,
  });
}
