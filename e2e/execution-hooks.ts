import { afterAll, beforeAll, beforeEach } from "vitest";
import { DbSeedia } from "../src/index.js";
import type { ConnectionConfig, LoadStrategy } from "../src/interfaces/index.js";
import { PostgresContainer } from "./utils/postgres-container.js";
import { PostgresHelper } from "./utils/postgres-helper.js";

export interface TestContext {
  container: PostgresContainer;
  helper: PostgresHelper;
  connectionConfig: ConnectionConfig;
  dbSeedia: DbSeedia;
}

export function setupE2EHooks(strategy: LoadStrategy = "truncate") {
  let container: PostgresContainer;
  let helper: PostgresHelper;
  let connectionConfig: ConnectionConfig;
  let dbSeedia: DbSeedia;

  beforeAll(async () => {
    // シングルトンコンテナを使用
    container = PostgresContainer.getMainInstance();
    connectionConfig = await container.start();

    // PostgreSQL操作用ヘルパーを作成
    helper = new PostgresHelper(container);

    // スキーマを1度だけ初期化
    await helper.initializeSchema();

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
    if (helper) {
      // テーブルのクリアのみ実行（スキーマ再作成はしない）
      await helper.truncateTables();
    }
  });

  return () => ({
    container,
    helper,
    connectionConfig,
    dbSeedia,
  });
}
