import { describe, expect, it } from "vitest";
import { setupE2EHooks } from "../../execution-hooks.js";

describe("Delete戦略機能（シンプル）", () => {
  const getContext = setupE2EHooks();

  it("delete戦略でtagsテーブルのデータを削除してからロードできること", async () => {
    // 最初にtagsデータをロード（外部キー制約なし）
    await getContext().dbSeedia.loadFrom("./e2e/scenarios/nullable-columns/fixtures-mixed-values");

    // 初期データが正しくロードされたことを確認
    let tagCount = await getContext().helper.executeQuery("SELECT COUNT(*) FROM tags");
    expect(parseInt(tagCount[0])).toBe(4);

    // 特定のタグの存在を確認
    const originalTags = await getContext().helper.executeQuery("SELECT name FROM tags ORDER BY id");
    expect(originalTags[0]).toBe("Technology");
    expect(originalTags[1]).toBe("Lifestyle");

    // delete戦略でDbSeediaを作成し、同じデータを再ロード
    const deleteDbSeedia = getContext().dbSeedia.withStrategy("delete");
    await deleteDbSeedia.connect();
    await deleteDbSeedia.loadFrom("./e2e/scenarios/nullable-columns/fixtures-mixed-values");

    // delete戦略では一度削除されてから同じデータがロードされるため、結果は同じになる
    tagCount = await getContext().helper.executeQuery("SELECT COUNT(*) FROM tags");
    expect(parseInt(tagCount[0])).toBe(4);

    // データの内容も同じであることを確認
    const newTags = await getContext().helper.executeQuery("SELECT name FROM tags ORDER BY id");
    expect(newTags[0]).toBe("Technology");
    expect(newTags[1]).toBe("Lifestyle");

    await deleteDbSeedia.disconnect();
  });

  it("delete戦略とtruncate戦略でtagsテーブルの結果が同じになること", async () => {
    // データベースを空の状態でスタート

    // truncate戦略でロード
    await getContext().dbSeedia.loadFrom("./e2e/scenarios/nullable-columns/fixtures-mixed-values");

    const truncateTagCount = await getContext().helper.executeQuery("SELECT COUNT(*) FROM tags");
    const truncateTags = await getContext().helper.executeQuery("SELECT name FROM tags ORDER BY id");

    // データベースをリセット
    await getContext().helper.resetDatabase();

    // delete戦略でロード
    const deleteDbSeedia = getContext().dbSeedia.withStrategy("delete");
    await deleteDbSeedia.connect();
    await deleteDbSeedia.loadFrom("./e2e/scenarios/nullable-columns/fixtures-mixed-values");

    const deleteTagCount = await getContext().helper.executeQuery("SELECT COUNT(*) FROM tags");
    const deleteTags = await getContext().helper.executeQuery("SELECT name FROM tags ORDER BY id");

    // 結果が同じことを確認
    expect(deleteTagCount).toEqual(truncateTagCount);
    expect(deleteTags).toEqual(truncateTags);

    await deleteDbSeedia.disconnect();
  });

  it("delete戦略でフルエントインターフェースが使用できること", async () => {
    // フルエントインターフェースでdelete戦略を使用
    const fluentDeleteDbSeedia = getContext().dbSeedia.withStrategy("delete").withOptions({
      batchSize: 500,
    });

    await fluentDeleteDbSeedia.connect();
    await fluentDeleteDbSeedia.loadFrom("./e2e/scenarios/nullable-columns/fixtures-mixed-values");

    // データが正しくロードされたことを確認
    const tagCount = await getContext().helper.executeQuery("SELECT COUNT(*) FROM tags");
    expect(parseInt(tagCount[0])).toBe(4);

    // データの内容を確認
    const tags = await getContext().helper.executeQuery("SELECT name FROM tags ORDER BY id");
    expect(tags[0]).toBe("Technology");
    expect(tags[1]).toBe("Lifestyle");
    expect(tags[2]).toBe("Business");
    expect(tags[3]).toBe("Sports");

    await fluentDeleteDbSeedia.disconnect();
  });
});
