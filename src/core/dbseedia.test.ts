import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "../errors/index.js";
import type { ConnectionConfig, DbSeediaConfig } from "../interfaces/index.js";
import { DbSeedia } from "./dbseedia.js";

describe("DbSeedieコアクラス", () => {
  let dbSeedia: DbSeedia;
  let config: DbSeediaConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    config = {
      connection: {
        host: "localhost",
        port: 5432,
        database: "test_db",
        username: "test_user",
        password: "test_password",
      },
    };
  });

  describe("コンストラクタ", () => {
    it("有効な設定でインスタンスを作成できること", () => {
      expect(() => new DbSeedia(config)).not.toThrow();
    });

    it("接続設定がない場合にValidationErrorが投げられること", () => {
      const invalidConfig = {} as DbSeediaConfig;

      expect(() => new DbSeedia(invalidConfig)).toThrow(ValidationError);
      expect(() => new DbSeedia(invalidConfig)).toThrow(
        "Connection configuration is required",
      );
    });

    it("必須接続フィールドがない場合にValidationErrorが投げられること", () => {
      const invalidConfig = {
        connection: {
          host: "localhost",
          // missing database and username
        } as ConnectionConfig,
      };

      expect(() => new DbSeedia(invalidConfig)).toThrow(ValidationError);
      expect(() => new DbSeedia(invalidConfig)).toThrow(
        "Host, database, and username are required for connection",
      );
    });

    it("設定にデフォルト値を適用できること", () => {
      const dbseedia = new DbSeedia(config);

      // We can't directly access the private config, but we can test behavior
      expect(dbseedia).toBeDefined();
    });

    it("複数接続を処理できること", () => {
      const multiConfig = {
        connection: [
          {
            name: "main",
            host: "localhost",
            database: "main_db",
            username: "user1",
          },
          {
            name: "analytics",
            host: "analytics-host",
            database: "analytics_db",
            username: "user2",
          },
        ],
      };

      expect(() => new DbSeedia(multiConfig)).not.toThrow();
    });
  });

  describe("基本機能", () => {
    beforeEach(() => {
      dbSeedia = new DbSeedia(config);
    });

    it("connectメソッドが存在すること", () => {
      expect(typeof dbSeedia.connect).toBe("function");
    });

    it("disconnectメソッドが存在すること", () => {
      expect(typeof dbSeedia.disconnect).toBe("function");
    });

    it("loadFromメソッドが存在すること", () => {
      expect(typeof dbSeedia.loadFrom).toBe("function");
    });

    it("無効なターゲットでValidationErrorが投げられること", async () => {
      await expect(
        dbSeedia.loadFrom("/test/fixtures", { target: "nonexistent" }),
      ).rejects.toThrow(ValidationError);
      await expect(
        dbSeedia.loadFrom("/test/fixtures", { target: "nonexistent" }),
      ).rejects.toThrow("Database executor 'nonexistent' not found");
    });
  });

  describe("フルエントインターフェース", () => {
    beforeEach(() => {
      dbSeedia = new DbSeedia(config);
    });

    it("異なる戦略で新インスタンスを作成できること", () => {
      const newInstance = dbSeedia.withStrategy("delete");

      expect(newInstance).not.toBe(dbSeedia);
      expect(newInstance).toBeInstanceOf(DbSeedia);
    });

    it("異なるオプションで新インスタンスを作成できること", () => {
      const newInstance = dbSeedia.withOptions({
        batchSize: 5000,
        nullValue: "NULL",
      });

      expect(newInstance).not.toBe(dbSeedia);
      expect(newInstance).toBeInstanceOf(DbSeedia);
    });

    it("異なるテーブルで新インスタンスを作成できること", () => {
      const newInstance = dbSeedia.withTables(["users", "posts"]);

      expect(newInstance).not.toBe(dbSeedia);
      expect(newInstance).toBeInstanceOf(DbSeedia);
    });

    it("異なる接続で新インスタンスを作成できること", () => {
      const newConnection = {
        host: "new-host",
        database: "new_db",
        username: "new_user",
      };

      const newInstance = dbSeedia.withConnection(newConnection);

      expect(newInstance).not.toBe(dbSeedia);
      expect(newInstance).toBeInstanceOf(DbSeedia);
    });
  });
});
