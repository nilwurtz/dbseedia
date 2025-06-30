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

describe("PostgresDbRepository", () => {
  let dbRepository: PostgresDbRepository;
  let config: ConnectionConfig;
  let mockSql: any;
  let mockPostgres: any;

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

  describe("connect", () => {
    it("should connect successfully", async () => {
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

    it("should throw ConnectionError when connection fails", async () => {
      mockSql.unsafe.mockRejectedValue(new Error("Connection failed"));

      await expect(dbRepository.connect()).rejects.toThrow(ConnectionError);
      await expect(dbRepository.connect()).rejects.toThrow(
        "Failed to connect to database: localhost:5432/test_db",
      );
    });

    it("should use default port when not specified", async () => {
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

  describe("disconnect", () => {
    it("should disconnect successfully", async () => {
      mockSql.unsafe.mockResolvedValue([{ "?column?": 1 }]);
      await dbRepository.connect();

      await dbRepository.disconnect();

      expect(mockSql.end).toHaveBeenCalled();
    });

    it("should handle disconnect when not connected", async () => {
      await dbRepository.disconnect();

      expect(mockSql.end).not.toHaveBeenCalled();
    });
  });

  describe("execute", () => {
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

    it("should execute truncate strategy successfully", async () => {
      mockSql.begin.mockImplementation(async (callback) => {
        return await callback(mockSql);
      });

      await dbRepository.execute("users", testData, "truncate");

      expect(mockSql.begin).toHaveBeenCalled();
      expect(mockSql.unsafe).toHaveBeenCalledWith(
        "TRUNCATE TABLE users RESTART IDENTITY CASCADE",
      );
      expect(mockSql.unsafe).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO users (name, age) VALUES"),
      );
    });

    it("should handle empty data", async () => {
      const emptyData: TransformedData = {
        columns: ["name", "age"],
        values: [],
      };

      mockSql.begin.mockImplementation(async (callback) => {
        return await callback(mockSql);
      });

      await dbRepository.execute("users", emptyData, "truncate");

      expect(mockSql.begin).toHaveBeenCalled();
      expect(mockSql.unsafe).toHaveBeenCalledWith(
        "TRUNCATE TABLE users RESTART IDENTITY CASCADE",
      );
      expect(mockSql.unsafe).not.toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO"),
      );
    });

    it("should throw DatabaseError when not connected", async () => {
      await dbRepository.disconnect();

      await expect(
        dbRepository.execute("users", testData, "truncate"),
      ).rejects.toThrow(DatabaseError);
      await expect(
        dbRepository.execute("users", testData, "truncate"),
      ).rejects.toThrow("Database connection not established");
    });

    it("should throw DatabaseError when execution fails", async () => {
      mockSql.begin.mockRejectedValue(new Error("Execution failed"));

      await expect(
        dbRepository.execute("users", testData, "truncate"),
      ).rejects.toThrow(DatabaseError);
      await expect(
        dbRepository.execute("users", testData, "truncate"),
      ).rejects.toThrow("Failed to load data into table 'users'");
    });

    it("should process data in batches", async () => {
      const largeData: TransformedData = {
        columns: ["id"],
        values: Array.from({ length: 2500 }, (_, i) => [i.toString()]),
      };

      mockSql.begin.mockImplementation(async (callback) => {
        return await callback(mockSql);
      });

      await dbRepository.execute("test_table", largeData, "truncate");

      const insertCalls = mockSql.unsafe.mock.calls.filter((call) =>
        call[0].includes("INSERT INTO"),
      );
      expect(insertCalls.length).toBe(3);
    });
  });

  describe("truncateTable", () => {
    beforeEach(async () => {
      mockSql.unsafe.mockResolvedValue([{ "?column?": 1 }]);
      await dbRepository.connect();
    });

    it("should truncate table successfully", async () => {
      await dbRepository.truncateTable("users");

      expect(mockSql.unsafe).toHaveBeenCalledWith(
        "TRUNCATE TABLE users RESTART IDENTITY CASCADE",
      );
    });

    it("should throw DatabaseError when not connected", async () => {
      await dbRepository.disconnect();

      await expect(dbRepository.truncateTable("users")).rejects.toThrow(
        DatabaseError,
      );
      await expect(dbRepository.truncateTable("users")).rejects.toThrow(
        "Database connection not established",
      );
    });

    it("should throw DatabaseError when truncate fails", async () => {
      mockSql.unsafe.mockRejectedValue(new Error("Truncate failed"));

      await expect(dbRepository.truncateTable("users")).rejects.toThrow(
        DatabaseError,
      );
      await expect(dbRepository.truncateTable("users")).rejects.toThrow(
        "Failed to truncate table 'users'",
      );
    });
  });

  describe("executeSQL", () => {
    beforeEach(async () => {
      mockSql.unsafe.mockResolvedValue([{ "?column?": 1 }]);
      await dbRepository.connect();
    });

    it("should execute SQL successfully", async () => {
      await dbRepository.executeSQL("CREATE INDEX idx_name ON users(name)");

      expect(mockSql.unsafe).toHaveBeenCalledWith(
        "CREATE INDEX idx_name ON users(name)",
      );
    });

    it("should throw DatabaseError when not connected", async () => {
      await dbRepository.disconnect();

      await expect(dbRepository.executeSQL("SELECT 1")).rejects.toThrow(
        DatabaseError,
      );
      await expect(dbRepository.executeSQL("SELECT 1")).rejects.toThrow(
        "Database connection not established",
      );
    });

    it("should throw DatabaseError when SQL execution fails", async () => {
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
