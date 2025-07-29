import { describe, expect, it } from "vitest";
import { setupE2EHooks } from "../../execution-hooks.js";

describe("Nullable カラム機能", () => {
  const getContext = setupE2EHooks();

  it("CSVにカラムが存在しない場合、nullableなカラムにはNULLが入ること", async () => {
    // description カラムがCSVに存在しないケース
    await getContext().dbSeedia.loadFrom("./e2e/scenarios/nullable-columns/fixtures-missing-column");

    // 全てのレコードがロードされることを確認
    const tagCount = await getContext().helper.executeQuery("SELECT COUNT(*) FROM tags");
    expect(Number(tagCount[0].count)).toBe(3);

    // description カラムがすべてNULLになることを確認
    const nullDescriptions = await getContext().helper.executeQuery(
      "SELECT COUNT(*) FROM tags WHERE description IS NULL",
    );
    expect(Number(nullDescriptions[0].count)).toBe(3);

    // 具体的なデータを確認
    const tags = await getContext().helper.executeQuery("SELECT id, name, description FROM tags ORDER BY id");
    expect(tags.length).toBe(3);
    expect(tags[0]).toEqual({ id: 1, name: "Technology", description: null });
    expect(tags[1]).toEqual({ id: 2, name: "Lifestyle", description: null });
    expect(tags[2]).toEqual({ id: 3, name: "Business", description: null });
  });

  it("CSVのカラムが空文字の場合、nullableなカラムにはNULLが入ること", async () => {
    // description カラムが空文字のケース
    await getContext().dbSeedia.loadFrom("./e2e/scenarios/nullable-columns/fixtures-empty-values");

    // 全てのレコードがロードされることを確認
    const tagCount = await getContext().helper.executeQuery("SELECT COUNT(*) FROM tags");
    expect(Number(tagCount[0].count)).toBe(3);

    // description カラムがすべてNULLになることを確認
    const nullDescriptions = await getContext().helper.executeQuery(
      "SELECT COUNT(*) FROM tags WHERE description IS NULL",
    );
    expect(Number(nullDescriptions[0].count)).toBe(3);

    // 具体的なデータを確認
    const tags = await getContext().helper.executeQuery("SELECT id, name, description FROM tags ORDER BY id");
    expect(tags.length).toBe(3);
    expect(tags[0]).toEqual({ id: 1, name: "Technology", description: null });
    expect(tags[1]).toEqual({ id: 2, name: "Lifestyle", description: null });
    expect(tags[2]).toEqual({ id: 3, name: "Business", description: null });
  });

  it("CSVに値とnullが混在する場合、適切に処理されること", async () => {
    // description カラムに値と空文字が混在するケース
    await getContext().dbSeedia.loadFrom("./e2e/scenarios/nullable-columns/fixtures-mixed-values");

    // 全てのレコードがロードされることを確認
    const tagCount = await getContext().helper.executeQuery("SELECT COUNT(*) FROM tags");
    expect(Number(tagCount[0].count)).toBe(4);

    // null と non-null の数を確認
    const nullDescriptions = await getContext().helper.executeQuery(
      "SELECT COUNT(*) FROM tags WHERE description IS NULL",
    );
    expect(Number(nullDescriptions[0].count)).toBe(2); // id=2,4 が空文字なのでNULL

    const nonNullDescriptions = await getContext().helper.executeQuery(
      "SELECT COUNT(*) FROM tags WHERE description IS NOT NULL",
    );
    expect(Number(nonNullDescriptions[0].count)).toBe(2); // id=1,3 に値がある

    // 具体的なデータを確認
    const tags = await getContext().helper.executeQuery("SELECT id, name, description FROM tags ORDER BY id");
    expect(tags.length).toBe(4);
    expect(tags[0]).toEqual({ id: 1, name: "Technology", description: "Tech related posts" }); // 値がある場合
    expect(tags[1]).toEqual({ id: 2, name: "Lifestyle", description: null }); // descriptionがNULL
    expect(tags[2]).toEqual({ id: 3, name: "Business", description: "Business and finance" });
    expect(tags[3]).toEqual({ id: 4, name: "Sports", description: null }); // descriptionがNULL
  });
});
