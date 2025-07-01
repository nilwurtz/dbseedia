import { beforeEach, describe, expect, it } from "vitest";
import { ValidationError } from "../errors/index.js";
import type { DbSeediaConfig } from "../interfaces/index.js";
import { type ConfigValidatorInterface, DbSeediaConfigValidator } from "./config-validator.js";

describe("DbSeediaConfigValidator", () => {
  let validator: ConfigValidatorInterface;

  beforeEach(() => {
    validator = new DbSeediaConfigValidator();
  });

  describe("validateAndApplyDefaults", () => {
    it("should validate and apply defaults to minimal valid config", () => {
      const config: DbSeediaConfig = {
        connection: {
          host: "localhost",
          database: "test_db",
          username: "user",
          password: "pass",
        },
      };

      const result = validator.validateAndApplyDefaults(config);

      expect(result).toEqual({
        connection: {
          host: "localhost",
          database: "test_db",
          username: "user",
          password: "pass",
        },
        strategy: "truncate",
        separator: ",",
        encoding: "utf8",
        nullValue: "",
        batchSize: 1000,
      });
    });

    it("should preserve existing non-default values", () => {
      const config: DbSeediaConfig = {
        connection: {
          host: "localhost",
          database: "test_db",
          username: "user",
          password: "pass",
        },
        strategy: "delete",
        separator: "\t",
        encoding: "latin1",
        nullValue: "NULL",
        batchSize: 500,
      };

      const result = validator.validateAndApplyDefaults(config);

      expect(result).toEqual(config);
    });

    it("should handle multiple connections array", () => {
      const config: DbSeediaConfig = {
        connection: [
          {
            name: "main",
            host: "localhost",
            database: "main_db",
            username: "user1",
            password: "pass1",
          },
          {
            name: "analytics",
            host: "analytics-host",
            database: "analytics_db",
            username: "user2",
            password: "pass2",
          },
        ],
      };

      const result = validator.validateAndApplyDefaults(config);

      expect(result.connection).toEqual(config.connection);
      expect(result.strategy).toBe("truncate");
    });

    it("should throw ValidationError when connection is missing", () => {
      const config = {} as DbSeediaConfig;

      expect(() => validator.validateAndApplyDefaults(config)).toThrow(ValidationError);
      expect(() => validator.validateAndApplyDefaults(config)).toThrow("Connection configuration is required");
    });

    it("should throw ValidationError when connection host is missing", () => {
      const config: DbSeediaConfig = {
        connection: {
          database: "test_db",
          username: "user",
          password: "pass",
        } as Partial<typeof config.connection>,
      };

      expect(() => validator.validateAndApplyDefaults(config)).toThrow(ValidationError);
      expect(() => validator.validateAndApplyDefaults(config)).toThrow(
        "Host, database, and username are required for connection",
      );
    });

    it("should throw ValidationError when connection database is missing", () => {
      const config: DbSeediaConfig = {
        connection: {
          host: "localhost",
          username: "user",
          password: "pass",
        } as Partial<typeof config.connection>,
      };

      expect(() => validator.validateAndApplyDefaults(config)).toThrow(ValidationError);
      expect(() => validator.validateAndApplyDefaults(config)).toThrow(
        "Host, database, and username are required for connection",
      );
    });

    it("should throw ValidationError when connection username is missing", () => {
      const config: DbSeediaConfig = {
        connection: {
          host: "localhost",
          database: "test_db",
          password: "pass",
        } as Partial<typeof config.connection>,
      };

      expect(() => validator.validateAndApplyDefaults(config)).toThrow(ValidationError);
      expect(() => validator.validateAndApplyDefaults(config)).toThrow(
        "Host, database, and username are required for connection",
      );
    });

    it("should validate all connections in array", () => {
      const config: DbSeediaConfig = {
        connection: [
          {
            name: "main",
            host: "localhost",
            database: "main_db",
            username: "user1",
            password: "pass1",
          },
          {
            name: "invalid",
            host: "localhost",
            // missing database and username
            password: "pass2",
          } as Partial<(typeof config.connection)[0]>,
        ],
      };

      expect(() => validator.validateAndApplyDefaults(config)).toThrow(ValidationError);
      expect(() => validator.validateAndApplyDefaults(config)).toThrow(
        "Host, database, and username are required for connection",
      );
    });
  });
});
