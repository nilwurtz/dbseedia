import { describe, expect, it } from "vitest";
import { setupE2EHooks } from "../../execution-hooks.js";

describe("テーブル読み込み順序機能", () => {
  const getContext = setupE2EHooks();

  it("table-ordering.txtに指定された順序でテーブルにデータが投入されること", async () => {
    const dbSeedia = getContext().dbSeedia.withStrategy("truncate");
    await dbSeedia.connect();

    // このテストは実装がtable-ordering.txtを尊重するため成功する
    // スキーマの外部キー制約が正しい順序を強制する:
    // users -> posts -> comments (table-ordering.txtで指定された通り)
    await dbSeedia.loadFrom("./e2e/scenarios/ordering/fixtures");

    // すべてのテーブルにデータが正常にロードされたことを確認
    const userCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM users");
    const postCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM posts");
    const commentCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM comments");

    expect(parseInt(userCount[0])).toBe(3);
    expect(parseInt(postCount[0])).toBe(3);
    expect(parseInt(commentCount[0])).toBe(3);

    await dbSeedia.disconnect();
  });
});
