import type { ConnectionConfig } from "../../src/interfaces/index.js";

/**
 * E2Eテスト用のデータベース接続設定
 * docker-compose.yml の設定と一致させる必要がある
 */

/** メインデータベース接続設定 */
export const MAIN_DB_CONFIG: ConnectionConfig = {
  host: "localhost",
  port: 5432,
  database: "testdb",
  username: "testuser",
  password: "testpass",
  ssl: false,
};

/** アナリティクスデータベース接続設定 */
export const ANALYTICS_DB_CONFIG: ConnectionConfig = {
  host: "localhost",
  port: 5433,
  database: "analyticsdb",
  username: "testuser",
  password: "testpass",
  ssl: false,
};

/** マルチデータベース設定用の配列 */
export const MULTI_DB_CONFIGS = [
  MAIN_DB_CONFIG,
  {
    name: "analytics",
    ...ANALYTICS_DB_CONFIG,
  },
] as const;
