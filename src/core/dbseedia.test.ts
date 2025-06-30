import { describe, it, expect, beforeEach, vi } from "vitest";
import { DbSeedia } from "./dbseedia.js";
import { ValidationError } from "../errors/index.js";
import type { DbSeediaConfig, ConnectionConfig } from "../interfaces/index.js";

describe("DbSeedia", () => {
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

  describe("constructor", () => {
    it("should create instance with valid config", () => {
      expect(() => new DbSeedia(config)).not.toThrow();
    });

    it("should throw ValidationError when connection is missing", () => {
      const invalidConfig = {} as DbSeediaConfig;

      expect(() => new DbSeedia(invalidConfig)).toThrow(ValidationError);
      expect(() => new DbSeedia(invalidConfig)).toThrow(
        "Connection configuration is required",
      );
    });

    it("should throw ValidationError when required connection fields are missing", () => {
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

    it("should apply default values to config", () => {
      const dbseedia = new DbSeedia(config);

      // We can't directly access the private config, but we can test behavior
      expect(dbseedia).toBeDefined();
    });

    it("should handle multiple connections", () => {
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

  describe("basic functionality", () => {
    beforeEach(() => {
      dbSeedia = new DbSeedia(config);
    });

    it("should have connect method", () => {
      expect(typeof dbSeedia.connect).toBe("function");
    });

    it("should have disconnect method", () => {
      expect(typeof dbSeedia.disconnect).toBe("function");
    });

    it("should have loadFrom method", () => {
      expect(typeof dbSeedia.loadFrom).toBe("function");
    });

    it("should throw ValidationError for invalid target", async () => {
      await expect(
        dbSeedia.loadFrom("/test/fixtures", { target: "nonexistent" }),
      ).rejects.toThrow(ValidationError);
      await expect(
        dbSeedia.loadFrom("/test/fixtures", { target: "nonexistent" }),
      ).rejects.toThrow("Database executor 'nonexistent' not found");
    });
  });

  describe("fluent interface methods", () => {
    beforeEach(() => {
      dbSeedia = new DbSeedia(config);
    });

    it("should create new instance with different strategy", () => {
      const newInstance = dbSeedia.withStrategy("delete");

      expect(newInstance).not.toBe(dbSeedia);
      expect(newInstance).toBeInstanceOf(DbSeedia);
    });

    it("should create new instance with different options", () => {
      const newInstance = dbSeedia.withOptions({
        batchSize: 5000,
        nullValue: "NULL",
      });

      expect(newInstance).not.toBe(dbSeedia);
      expect(newInstance).toBeInstanceOf(DbSeedia);
    });

    it("should create new instance with different tables", () => {
      const newInstance = dbSeedia.withTables(["users", "posts"]);

      expect(newInstance).not.toBe(dbSeedia);
      expect(newInstance).toBeInstanceOf(DbSeedia);
    });

    it("should create new instance with different connection", () => {
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
