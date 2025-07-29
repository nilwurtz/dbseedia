import { afterAll, beforeAll, beforeEach } from "vitest";
import { DbSeedia } from "../src/index.js";
import type { ConnectionConfig, LoadStrategy } from "../src/interfaces/index.js";
import { MAIN_DB_CONFIG } from "./config/database.js";
import { PostgresHelper } from "./utils/postgres-helper.js";

export interface TestContext {
  helper: PostgresHelper;
  connectionConfig: ConnectionConfig;
  dbSeedia: DbSeedia;
}

export function setupE2EHooks(strategy: LoadStrategy = "truncate") {
  let helper: PostgresHelper;
  let connectionConfig: ConnectionConfig;
  let dbSeedia: DbSeedia;

  beforeAll(async () => {
    // 共通データベース設定を使用
    connectionConfig = MAIN_DB_CONFIG;

    // PostgreSQL操作用ヘルパーを作成
    helper = new PostgresHelper(connectionConfig);
    await helper.connect();

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
    if (helper) {
      await helper.disconnect();
    }
  });

  beforeEach(async () => {
    if (helper) {
      // テーブルのクリアのみ実行（スキーマ再作成はしない）
      await helper.truncateTables();
    }
  });

  return () => ({
    helper,
    connectionConfig,
    dbSeedia,
  });
}
