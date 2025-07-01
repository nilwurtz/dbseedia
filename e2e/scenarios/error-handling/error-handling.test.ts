import { describe, expect, it } from "vitest";
import { FileParseError, FileNotFoundError } from "../../../src/errors/index.js";
import { setupE2EHooks } from "../../execution-hooks.js";

describe("エラーハンドリング", () => {
  const getContext = setupE2EHooks();

  it("table-ordering.txtが存在しない場合、FileNotFoundErrorが発生すること", async () => {
    await expect(getContext().dbSeedia.loadFrom("./e2e/scenarios/error-handling/fixtures/no-ordering")).rejects.toThrow(
      FileNotFoundError,
    );
  });

  it("table-ordering.txtに記載されたテーブルのCSVファイルが存在しない場合、FileNotFoundErrorが発生すること", async () => {
    await expect(getContext().dbSeedia.loadFrom("./e2e/scenarios/error-handling/fixtures/missing-csv")).rejects.toThrow(
      FileNotFoundError,
    );

    // エラーメッセージが適切であることを確認
    try {
      await getContext().dbSeedia.loadFrom("./e2e/scenarios/error-handling/fixtures/missing-csv");
    } catch (error) {
      expect(error).toBeInstanceOf(FileNotFoundError);
      expect((error as Error).message).toContain("File not found");
    }
  });

  it("存在しないディレクトリを指定した場合、FileNotFoundErrorが発生すること", async () => {
    await expect(
      getContext().dbSeedia.loadFrom("./e2e/scenarios/error-handling/fixtures/non-existent"),
    ).rejects.toThrow(FileNotFoundError);
  });

  it("table-ordering.txtが空の場合、エラーが発生すること", async () => {
    await expect(
      getContext().dbSeedia.loadFrom("./e2e/scenarios/error-handling/fixtures/empty-ordering"),
    ).rejects.toThrow(FileParseError);
  });

  it("CSVファイルもTSVファイルも存在しない場合、FileNotFoundErrorが発生すること", async () => {
    await expect(
      getContext().dbSeedia.loadFrom("./e2e/scenarios/error-handling/fixtures/no-data-files"),
    ).rejects.toThrow(FileNotFoundError);
  });

  it("破損したCSVファイルの場合、エラーが発生すること", async () => {
    await expect(
      getContext().dbSeedia.loadFrom("./e2e/scenarios/error-handling/fixtures/corrupted-csv"),
    ).rejects.toThrow(FileParseError);
  });
});
