import { describe, expect, it } from "vitest";
import { FileParseError } from "../../../src/errors/index.js";
import { setupE2EHooks } from "../../execution-hooks.js";

describe("エラーハンドリング", () => {
  const getContext = setupE2EHooks();

  it("table-ordering.txtが存在しない場合、エラーが発生すること", async () => {
    await expect(getContext().dbSeedia.loadFrom("./e2e/scenarios/error-handling/fixtures/no-ordering")).rejects.toThrow(
      FileParseError,
    );
  });

  it("table-ordering.txtに記載されたテーブルのCSVファイルが存在しない場合、エラーが発生すること", async () => {
    await expect(getContext().dbSeedia.loadFrom("./e2e/scenarios/error-handling/fixtures/missing-csv")).rejects.toThrow(
      FileParseError,
    );

    // エラーメッセージが適切であることを確認
    try {
      await getContext().dbSeedia.loadFrom("./e2e/scenarios/error-handling/fixtures/missing-csv");
    } catch (error) {
      expect(error).toBeInstanceOf(FileParseError);
      expect((error as Error).message).toContain("Failed to load data from directory");
    }
  });

  it("存在しないディレクトリを指定した場合、エラーが発生すること", async () => {
    await expect(
      getContext().dbSeedia.loadFrom("./e2e/scenarios/error-handling/fixtures/non-existent"),
    ).rejects.toThrow(FileParseError);
  });

  it("table-ordering.txtが空の場合、エラーが発生すること", async () => {
    await expect(
      getContext().dbSeedia.loadFrom("./e2e/scenarios/error-handling/fixtures/empty-ordering"),
    ).rejects.toThrow(FileParseError);
  });

  it("CSVファイルもTSVファイルも存在しない場合、エラーが発生すること", async () => {
    await expect(
      getContext().dbSeedia.loadFrom("./e2e/scenarios/error-handling/fixtures/no-data-files"),
    ).rejects.toThrow(FileParseError);
  });

  it("破損したCSVファイルの場合、エラーが発生すること", async () => {
    await expect(
      getContext().dbSeedia.loadFrom("./e2e/scenarios/error-handling/fixtures/corrupted-csv"),
    ).rejects.toThrow(FileParseError);
  });
});
