import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { CsvFileRepository } from "./file.js";
import { FileParseError } from "../errors/index.js";

describe("CSVファイルリポジトリ", () => {
  let fileRepository: CsvFileRepository;
  let tempDir: string;

  beforeEach(async () => {
    fileRepository = new CsvFileRepository();
    tempDir = join(process.cwd(), "temp-test");
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("CSV読み込み", () => {
    it("ヘッダー付きCSVファイルの読み込みができること", async () => {
      const csvContent =
        "name,age,email\nJohn,25,john@example.com\nJane,30,jane@example.com";
      const csvPath = join(tempDir, "users.csv");
      await writeFile(csvPath, csvContent);

      const result = await fileRepository.readCsv(csvPath, { header: true });

      expect(result.headers).toEqual(["name", "age", "email"]);
      expect(result.rows).toEqual([
        ["John", "25", "john@example.com"],
        ["Jane", "30", "jane@example.com"],
      ]);
    });

    it("ヘッダーなしCSVファイルの読み込みができること", async () => {
      const csvContent = "John,25,john@example.com\nJane,30,jane@example.com";
      const csvPath = join(tempDir, "users.csv");
      await writeFile(csvPath, csvContent);

      const result = await fileRepository.readCsv(csvPath, { header: false });

      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([
        ["John", "25", "john@example.com"],
        ["Jane", "30", "jane@example.com"],
      ]);
    });

    it("カスタム区切り文字でTSVファイルを処理できること", async () => {
      const tsvContent = "name\tage\temail\nJohn\t25\tjohn@example.com";
      const tsvPath = join(tempDir, "users.tsv");
      await writeFile(tsvPath, tsvContent);

      const result = await fileRepository.readCsv(tsvPath, {
        header: true,
        separator: "\t",
      });

      expect(result.headers).toEqual(["name", "age", "email"]);
      expect(result.rows).toEqual([["John", "25", "john@example.com"]]);
    });

    it("空ファイルを適切に処理できること", async () => {
      const csvPath = join(tempDir, "empty.csv");
      await writeFile(csvPath, "");

      const result = await fileRepository.readCsv(csvPath);

      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
    });

    it("存在しないCSVファイルでFileParseErrorが投げられること", async () => {
      const nonExistentPath = join(tempDir, "non-existent.csv");

      await expect(fileRepository.readCsv(nonExistentPath)).rejects.toThrow(
        FileParseError,
      );
    });

    it("ヘッダーと値の空白文字をトリミングできること", async () => {
      const csvContent = " name , age , email \n John , 25 , john@example.com ";
      const csvPath = join(tempDir, "users.csv");
      await writeFile(csvPath, csvContent);

      const result = await fileRepository.readCsv(csvPath, { header: true });

      expect(result.headers).toEqual(["name", "age", "email"]);
      expect(result.rows).toEqual([["John", "25", "john@example.com"]]);
    });
  });

  describe("テーブル順序読み込み", () => {
    it("テーブル順序ファイルを読み込めること", async () => {
      const orderingContent = "users\nposts\ncomments";
      const orderingPath = join(tempDir, "table-ordering.txt");
      await writeFile(orderingPath, orderingContent);

      const result = await fileRepository.readTableOrdering(orderingPath);

      expect(result).toEqual(["users", "posts", "comments"]);
    });

    it("空行とコメントを無視できること", async () => {
      const orderingContent =
        "users\n\n# This is a comment\nposts\n\ncomments\n# Another comment";
      const orderingPath = join(tempDir, "table-ordering.txt");
      await writeFile(orderingPath, orderingContent);

      const result = await fileRepository.readTableOrdering(orderingPath);

      expect(result).toEqual(["users", "posts", "comments"]);
    });

    it("存在しない順序ファイルでFileParseErrorが投げられること", async () => {
      const nonExistentPath = join(tempDir, "non-existent.txt");

      await expect(
        fileRepository.readTableOrdering(nonExistentPath),
      ).rejects.toThrow(FileParseError);
    });

    it("空の順序ファイルを処理できること", async () => {
      const orderingPath = join(tempDir, "empty-ordering.txt");
      await writeFile(orderingPath, "");

      const result = await fileRepository.readTableOrdering(orderingPath);

      expect(result).toEqual([]);
    });
  });
});
