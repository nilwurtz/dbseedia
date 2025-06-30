import { describe, it, expect, beforeEach } from "vitest";
import { DefaultDataTransformer } from "./data-transformer.js";
import { DataTransformError } from "../errors/index.js";
import type { ParsedData, TableSchema } from "../interfaces/index.js";

describe("デフォルトデータ変換", () => {
  let transformer: DefaultDataTransformer;

  beforeEach(() => {
    transformer = new DefaultDataTransformer();
  });

  describe("データ変換", () => {
    const basicSchema: TableSchema = {
      name: "users",
      columns: [
        { name: "id", type: "integer" },
        { name: "name", type: "varchar" },
        { name: "email", type: "varchar" },
      ],
    };

    it("ヘッダー付きデータを変換できること", async () => {
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

    it("スキーマを使用してヘッダーなしデータを変換できること", async () => {
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

    it("デフォルトnull値でnull値を正しく処理できること", async () => {
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

    it("カスタムnull値でnull値を正しく処理できること", async () => {
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

    it("空データを処理できること", async () => {
      const parsedData: ParsedData = {
        headers: ["id", "name", "email"],
        rows: [],
      };

      const result = await transformer.transform(parsedData, basicSchema);

      expect(result.columns).toEqual(["id", "name", "email"]);
      expect(result.values).toEqual([]);
    });

    it("完全に空のデータを処理できること", async () => {
      const parsedData: ParsedData = {
        headers: [],
        rows: [],
      };

      const result = await transformer.transform(parsedData, basicSchema);

      expect(result.columns).toEqual(["id", "name", "email"]);
      expect(result.values).toEqual([]);
    });

    it("ヘッダーがないのにデータ行が存在する場合にDataTransformErrorが投げられること", async () => {
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

    it("null値でない値を元の形で保持できること", async () => {
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

    it("異なる列数のデータを処理できること", async () => {
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
