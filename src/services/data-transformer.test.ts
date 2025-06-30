import { describe, it, expect, beforeEach } from "vitest";
import { DefaultDataTransformer } from "./data-transformer.js";
import { DataTransformError } from "../errors/index.js";
import type { ParsedData, TableSchema } from "../interfaces/index.js";

describe("DefaultDataTransformer", () => {
  let transformer: DefaultDataTransformer;

  beforeEach(() => {
    transformer = new DefaultDataTransformer();
  });

  describe("transform", () => {
    const basicSchema: TableSchema = {
      name: "users",
      columns: [
        { name: "id", type: "integer" },
        { name: "name", type: "varchar" },
        { name: "email", type: "varchar" },
      ],
    };

    it("should transform parsed data with headers", async () => {
      const parsedData: ParsedData = {
        headers: ["id", "name", "email"],
        rows: [
          ["1", "John", "john@example.com"],
          ["2", "Jane", "jane@example.com"],
        ],
      };

      const result = await transformer.transform(parsedData, basicSchema);

      expect(result.columns).toEqual(["id", "name", "email"]);
      expect(result.values).toEqual([
        ["1", "John", "john@example.com"],
        ["2", "Jane", "jane@example.com"],
      ]);
    });

    it("should transform parsed data without headers using schema", async () => {
      const parsedData: ParsedData = {
        headers: [],
        rows: [
          ["1", "John", "john@example.com"],
          ["2", "Jane", "jane@example.com"],
        ],
      };

      const result = await transformer.transform(parsedData, basicSchema);

      expect(result.columns).toEqual(["id", "name", "email"]);
      expect(result.values).toEqual([
        ["1", "John", "john@example.com"],
        ["2", "Jane", "jane@example.com"],
      ]);
    });

    it("should handle null values correctly with default null value", async () => {
      const parsedData: ParsedData = {
        headers: ["id", "name", "email"],
        rows: [
          ["1", "John", ""],
          ["2", "", "jane@example.com"],
        ],
      };

      const result = await transformer.transform(parsedData, basicSchema);

      expect(result.values).toEqual([
        ["1", "John", null],
        ["2", null, "jane@example.com"],
      ]);
    });

    it("should handle null values correctly with custom null value", async () => {
      const customTransformer = new DefaultDataTransformer("NULL");
      const parsedData: ParsedData = {
        headers: ["id", "name", "email"],
        rows: [
          ["1", "John", "NULL"],
          ["2", "NULL", "jane@example.com"],
        ],
      };

      const result = await customTransformer.transform(parsedData, basicSchema);

      expect(result.values).toEqual([
        ["1", "John", null],
        ["2", null, "jane@example.com"],
      ]);
    });

    it("should handle empty data", async () => {
      const parsedData: ParsedData = {
        headers: ["id", "name", "email"],
        rows: [],
      };

      const result = await transformer.transform(parsedData, basicSchema);

      expect(result.columns).toEqual(["id", "name", "email"]);
      expect(result.values).toEqual([]);
    });

    it("should handle completely empty data", async () => {
      const parsedData: ParsedData = {
        headers: [],
        rows: [],
      };

      const result = await transformer.transform(parsedData, basicSchema);

      expect(result.columns).toEqual(["id", "name", "email"]);
      expect(result.values).toEqual([]);
    });

    it("should throw DataTransformError when headers missing but rows exist", async () => {
      const parsedData: ParsedData = {
        headers: [],
        rows: [["1", "John", "john@example.com"]],
      };

      const schemaWithoutColumns: TableSchema = {
        name: "users",
        columns: [],
      };

      await expect(
        transformer.transform(parsedData, schemaWithoutColumns),
      ).rejects.toThrow(DataTransformError);
      await expect(
        transformer.transform(parsedData, schemaWithoutColumns),
      ).rejects.toThrow("Failed to transform data for table: users");
    });

    it("should preserve original values when not matching null value", async () => {
      const customTransformer = new DefaultDataTransformer("NULL");
      const parsedData: ParsedData = {
        headers: ["id", "name", "note"],
        rows: [
          ["1", "John", ""],
          ["2", "Jane", "0"],
          ["3", "Bob", "false"],
        ],
      };

      const result = await customTransformer.transform(parsedData, basicSchema);

      expect(result.values).toEqual([
        ["1", "John", ""],
        ["2", "Jane", "0"],
        ["3", "Bob", "false"],
      ]);
    });

    it("should handle data with different column counts", async () => {
      const parsedData: ParsedData = {
        headers: ["id", "name"],
        rows: [
          ["1", "John"],
          ["2", "Jane"],
        ],
      };

      const result = await transformer.transform(parsedData, basicSchema);

      expect(result.columns).toEqual(["id", "name"]);
      expect(result.values).toEqual([
        ["1", "John"],
        ["2", "Jane"],
      ]);
    });
  });
});
