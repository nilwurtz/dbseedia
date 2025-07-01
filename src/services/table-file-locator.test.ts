import { access } from "node:fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FileNotFoundError } from "../errors/index.js";
import { type TableFileInfo, TableFileLocator } from "./table-file-locator.js";

vi.mock("node:fs/promises", () => ({
  access: vi.fn(),
}));

const mockAccess = vi.mocked(access);

describe("TableFileLocator", () => {
  let locator: TableFileLocator;

  beforeEach(() => {
    vi.clearAllMocks();
    locator = new TableFileLocator();
  });

  describe("locateTableFile", () => {
    it("should locate CSV file when it exists", async () => {
      mockAccess.mockResolvedValueOnce(undefined);

      const result = await locator.locateTableFile("/fixtures", "users");

      expect(result).toEqual({
        filePath: "/fixtures/users.csv",
        separator: ",",
      } satisfies TableFileInfo);
      expect(mockAccess).toHaveBeenCalledWith("/fixtures/users.csv");
      expect(mockAccess).toHaveBeenCalledTimes(1);
    });

    it("should locate TSV file when CSV doesn't exist but TSV does", async () => {
      mockAccess.mockRejectedValueOnce(new Error("CSV not found"));
      mockAccess.mockResolvedValueOnce(undefined);

      const result = await locator.locateTableFile("/fixtures", "posts");

      expect(result).toEqual({
        filePath: "/fixtures/posts.tsv",
        separator: "\t",
      } satisfies TableFileInfo);
      expect(mockAccess).toHaveBeenCalledWith("/fixtures/posts.csv");
      expect(mockAccess).toHaveBeenCalledWith("/fixtures/posts.tsv");
      expect(mockAccess).toHaveBeenCalledTimes(2);
    });

    it("should throw FileNotFoundError when neither CSV nor TSV exists", async () => {
      mockAccess.mockRejectedValue(new Error("File not found"));

      await expect(locator.locateTableFile("/fixtures", "nonexistent")).rejects.toThrow(FileNotFoundError);
      await expect(locator.locateTableFile("/fixtures", "nonexistent")).rejects.toThrow(
        "No data file (CSV or TSV) found for table: nonexistent",
      );

      expect(mockAccess).toHaveBeenCalledWith("/fixtures/nonexistent.csv");
      expect(mockAccess).toHaveBeenCalledWith("/fixtures/nonexistent.tsv");
      expect(mockAccess).toHaveBeenCalledTimes(4);
    });

    it("should handle directory paths correctly", async () => {
      mockAccess.mockResolvedValueOnce(undefined);

      await locator.locateTableFile("/path/to/fixtures", "products");

      expect(mockAccess).toHaveBeenCalledWith("/path/to/fixtures/products.csv");
    });
  });
});
