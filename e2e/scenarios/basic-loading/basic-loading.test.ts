import { describe, expect, it } from "vitest";
import { setupE2EHooks } from "../../execution-hooks.js";

describe("基本ロード機能", () => {
  const getContext = setupE2EHooks();

  it("フィクスチャディレクトリからデータをロードできること", async () => {
    await getContext().dbSeedia.loadFrom("./e2e/scenarios/basic-loading/fixtures");

    const userRows = await getContext().testContainer.executeQuery("SELECT * FROM users");
    expect(userRows.length).toBe(3);

    const postRows = await getContext().testContainer.executeQuery("SELECT * FROM posts");
    expect(postRows.length).toBe(3);

    const commentRows = await getContext().testContainer.executeQuery("SELECT * FROM comments");
    expect(commentRows.length).toBe(3);
  });

  it("table-ordering.txtに指定された全テーブルがロードされること", async () => {
    await getContext().dbSeedia.loadFrom("./e2e/scenarios/basic-loading/fixtures");

    const userCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM users");
    expect(parseInt(userCount[0])).toBe(3);

    const postCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM posts");
    expect(parseInt(postCount[0])).toBe(3);

    const commentCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM comments");
    expect(parseInt(commentCount[0])).toBe(3);
  });

  it("table-ordering.txtに指定されていないテーブルはCSVがあってもロードされないこと", async () => {
    // CSVファイルが存在するがtable-ordering.txtに記載されていないtags.csvを含むフィクスチャを使用
    await getContext().dbSeedia.loadFrom("./e2e/scenarios/basic-loading/fixtures-with-extra");

    // table-ordering.txtに指定されたテーブルは正常にロードされる
    const userCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM users");
    expect(parseInt(userCount[0])).toBe(3);

    const postCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM posts");
    expect(parseInt(postCount[0])).toBe(3);

    const commentCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM comments");
    expect(parseInt(commentCount[0])).toBe(3);

    // table-ordering.txtに指定されていないtagsテーブルはロードされない（0件のまま）
    const tagCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM tags");
    expect(parseInt(tagCount[0])).toBe(0);
  });
});
