import { describe, it, expect, beforeEach, vi } from "vitest";
import { PostgresDbRepository } from "./db.js";
import { DatabaseError, ConnectionError } from "../errors/index.js";
import type { ConnectionConfig, TransformedData } from "../interfaces/index.js";

vi.mock("postgres", () => {
  const mockSql = {
    begin: vi.fn(),
    end: vi.fn(),
    unsafe: vi.fn(),
  };

  const mockPostgres = vi.fn(() => mockSql);

  return {
    default: mockPostgres,
  };
});

describe("PostgreSQLデータベースリポジトリ", () => {
  let dbRepository: PostgresDbRepository;
  let config: ConnectionConfig;
  let mockSql: {
    begin: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
    unsafe: ReturnType<typeof vi.fn>;
  };
  let mockPostgres: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const postgres = await import("postgres");
    mockPostgres = vi.mocked(postgres.default);

    mockSql = {
      begin: vi.fn(),
      end: vi.fn(),
      unsafe: vi.fn(),
    };

    mockPostgres.mockReturnValue(mockSql);

    config = {
      host: "localhost",
      port: 5432,
      database: "test_db",
      username: "test_user",
      password: "test_password",
    };
    dbRepository = new PostgresDbRepository(config);
  });

  describe("接続", () => {
    it("正常に接続できること", async () => {
      mockSql.unsafe.mockImplementation((query: string) => {
        if (query === "SELECT 1") {
          return Promise.resolve([{ "?column?": 1 }]);
        }
      });

      await dbRepository.connect();

      expect(mockPostgres).toHaveBeenCalledWith({
        host: "localhost",
        port: 5432,
        database: "test_db",
        username: "test_user",
        password: "test_password",
        ssl: false,
      });
      expect(mockSql.unsafe).toHaveBeenCalledWith("SELECT 1");
    });

    it("接続失敗時にConnectionErrorが投げられること", async () => {
      mockSql.unsafe.mockRejectedValue(new Error("Connection failed"));

      await expect(dbRepository.connect()).rejects.toThrow(ConnectionError);
      await expect(dbRepository.connect()).rejects.toThrow(
        "Failed to connect to database: localhost:5432/test_db",
      );
    });

    it("ポートが指定されていない場合にデフォルトポートを使用すること", async () => {
      const configWithoutPort = { ...config };
      delete configWithoutPort.port;
      dbRepository = new PostgresDbRepository(configWithoutPort);

      mockSql.unsafe.mockResolvedValue([{ "?column?": 1 }]);

      await dbRepository.connect();

      expect(mockPostgres).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 5432,
        }),
      );
    });
  });

  describe("切断", () => {
    it("正常に切断できること", async () => {
      mockSql.unsafe.mockResolvedValue([{ "?column?": 1 }]);
      await dbRepository.connect();

      await dbRepository.disconnect();

      expect(mockSql.end).toHaveBeenCalled();
    });

    it("未接続状態での切断を適切に処理できること", async () => {
      await dbRepository.disconnect();

      expect(mockSql.end).not.toHaveBeenCalled();
    });
  });

  describe("実行", () => {
    const testData: TransformedData = {
      columns: ["name", "age"],
      values: [
        ["John", "25"],
        ["Jane", "30"],
      ],
    };

    beforeEach(async () => {
      mockSql.unsafe.mockResolvedValue([{ "?column?": 1 }]);
      await dbRepository.connect();
    });

    it("truncate戦略で正常に実行できること", async () => {
      mockSql.begin.mockImplementation(
        async (callback: (sql: typeof mockSql) => Promise<unknown>) => {
          return await callback(mockSql);
        },
      );

      await dbRepository.execute("users", testData, "truncate");

      expect(mockSql.begin).toHaveBeenCalled();
      expect(mockSql.unsafe).toHaveBeenCalledWith(
        "TRUNCATE TABLE users RESTART IDENTITY CASCADE",
      );
      expect(mockSql.unsafe).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO users (name, age) VALUES"),
      );
    });

    it("空データを適切に処理できること", async () => {
      const emptyData: TransformedData = {
        columns: ["name", "age"],
        values: [],
      };

      mockSql.begin.mockImplementation(
        async (callback: (sql: typeof mockSql) => Promise<unknown>) => {
          return await callback(mockSql);
        },
      );

      await dbRepository.execute("users", emptyData, "truncate");

      expect(mockSql.begin).toHaveBeenCalled();
      expect(mockSql.unsafe).toHaveBeenCalledWith(
        "TRUNCATE TABLE users RESTART IDENTITY CASCADE",
      );
      expect(mockSql.unsafe).not.toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO"),
      );
    });

    it("未接続状態での実行時にDatabaseErrorが投げられること", async () => {
      await dbRepository.disconnect();

      await expect(
        dbRepository.execute("users", testData, "truncate"),
      ).rejects.toThrow(DatabaseError);
      await expect(
        dbRepository.execute("users", testData, "truncate"),
      ).rejects.toThrow("Database connection not established");
    });

    it("実行失敗時にDatabaseErrorが投げられること", async () => {
      mockSql.begin.mockRejectedValue(new Error("Execution failed"));

      await expect(
        dbRepository.execute("users", testData, "truncate"),
      ).rejects.toThrow(DatabaseError);
      await expect(
        dbRepository.execute("users", testData, "truncate"),
      ).rejects.toThrow("Failed to load data into table 'users'");
    });

    it("データをバッチ処理できること", async () => {
      const largeData: TransformedData = {
        columns: ["id"],
        values: Array.from({ length: 2500 }, (_, i) => [i.toString()]),
      };

      mockSql.begin.mockImplementation(
        async (callback: (sql: typeof mockSql) => Promise<unknown>) => {
          return await callback(mockSql);
        },
      );

      await dbRepository.execute("test_table", largeData, "truncate");

      const insertCalls = mockSql.unsafe.mock.calls.filter((call: unknown[]) =>
        call[0].includes("INSERT INTO"),
      );
      expect(insertCalls.length).toBe(3);
    });
  });

  describe("テーブルTRUNCATE", () => {
    beforeEach(async () => {
      mockSql.unsafe.mockResolvedValue([{ "?column?": 1 }]);
      await dbRepository.connect();
    });

    it("テーブルを正常にTRUNCATEできること", async () => {
      await dbRepository.truncateTable("users");

      expect(mockSql.unsafe).toHaveBeenCalledWith(
        "TRUNCATE TABLE users RESTART IDENTITY CASCADE",
      );
    });

    it("未接続状態でのTRUNCATE時にDatabaseErrorが投げられること", async () => {
      await dbRepository.disconnect();

      await expect(dbRepository.truncateTable("users")).rejects.toThrow(
        DatabaseError,
      );
      await expect(dbRepository.truncateTable("users")).rejects.toThrow(
        "Database connection not established",
      );
    });

    it("TRUNCATE失敗時にDatabaseErrorが投げられること", async () => {
      mockSql.unsafe.mockRejectedValue(new Error("Truncate failed"));

      await expect(dbRepository.truncateTable("users")).rejects.toThrow(
        DatabaseError,
      );
      await expect(dbRepository.truncateTable("users")).rejects.toThrow(
        "Failed to truncate table 'users'",
      );
    });
  });

  describe("SQL実行", () => {
    beforeEach(async () => {
      mockSql.unsafe.mockResolvedValue([{ "?column?": 1 }]);
      await dbRepository.connect();
    });

    it("SQL文を正常に実行できること", async () => {
      await dbRepository.executeSQL("CREATE INDEX idx_name ON users(name)");

      expect(mockSql.unsafe).toHaveBeenCalledWith(
        "CREATE INDEX idx_name ON users(name)",
      );
    });

    it("未接続状態でのSQL実行時にDatabaseErrorが投げられること", async () => {
      await dbRepository.disconnect();

      await expect(dbRepository.executeSQL("SELECT 1")).rejects.toThrow(
        DatabaseError,
      );
      await expect(dbRepository.executeSQL("SELECT 1")).rejects.toThrow(
        "Database connection not established",
      );
    });

    it("SQL実行失敗時にDatabaseErrorが投げられること", async () => {
      mockSql.unsafe.mockRejectedValue(new Error("SQL execution failed"));

      await expect(dbRepository.executeSQL("INVALID SQL")).rejects.toThrow(
        DatabaseError,
      );
      await expect(dbRepository.executeSQL("INVALID SQL")).rejects.toThrow(
        "Failed to execute SQL",
      );
    });
  });
});
