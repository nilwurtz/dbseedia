import { describe, expect, it } from "vitest";
import { setupE2EHooks } from "../../execution-hooks.js";

describe("Nullable カラム機能", () => {
  const getContext = setupE2EHooks();

  it("CSVにカラムが存在しない場合、nullableなカラムにはNULLが入ること", async () => {
    // description カラムがCSVに存在しないケース
    await getContext().dbSeedia.loadFrom("./e2e/scenarios/nullable-columns/fixtures-missing-column");

    // 全てのレコードがロードされることを確認
    const tagCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM tags");
    expect(parseInt(tagCount[0])).toBe(3);

    // description カラムがすべてNULLになることを確認
    const nullDescriptions = await getContext().testContainer.executeQuery(
      "SELECT COUNT(*) FROM tags WHERE description IS NULL"
    );
    expect(parseInt(nullDescriptions[0])).toBe(3);

    // 具体的なデータを確認（パイプ区切りの文字列として返される）
    const tags = await getContext().testContainer.executeQuery(
      "SELECT id, name, description FROM tags ORDER BY id"
    );
    expect(tags.length).toBe(3);
    expect(tags[0]).toBe("1|Technology|"); // descriptionがNULLの場合は末尾が空
    expect(tags[1]).toBe("2|Lifestyle|");
    expect(tags[2]).toBe("3|Business|");
  });

  it("CSVのカラムが空文字の場合、nullableなカラムにはNULLが入ること", async () => {
    // description カラムが空文字のケース
    await getContext().dbSeedia.loadFrom("./e2e/scenarios/nullable-columns/fixtures-empty-values");

    // 全てのレコードがロードされることを確認
    const tagCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM tags");
    expect(parseInt(tagCount[0])).toBe(3);

    // description カラムがすべてNULLになることを確認
    const nullDescriptions = await getContext().testContainer.executeQuery(
      "SELECT COUNT(*) FROM tags WHERE description IS NULL"
    );
    expect(parseInt(nullDescriptions[0])).toBe(3);

    // 具体的なデータを確認（パイプ区切りの文字列として返される）
    const tags = await getContext().testContainer.executeQuery(
      "SELECT id, name, description FROM tags ORDER BY id"
    );
    expect(tags.length).toBe(3);
    expect(tags[0]).toBe("1|Technology|"); // descriptionがNULLの場合は末尾が空
    expect(tags[1]).toBe("2|Lifestyle|");
    expect(tags[2]).toBe("3|Business|");
  });

  it("CSVに値とnullが混在する場合、適切に処理されること", async () => {
    // description カラムに値と空文字が混在するケース
    await getContext().dbSeedia.loadFrom("./e2e/scenarios/nullable-columns/fixtures-mixed-values");

    // 全てのレコードがロードされることを確認
    const tagCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM tags");
    expect(parseInt(tagCount[0])).toBe(4);

    // null と non-null の数を確認
    const nullDescriptions = await getContext().testContainer.executeQuery(
      "SELECT COUNT(*) FROM tags WHERE description IS NULL"
    );
    expect(parseInt(nullDescriptions[0])).toBe(2); // id=2,4 が空文字なのでNULL

    const nonNullDescriptions = await getContext().testContainer.executeQuery(
      "SELECT COUNT(*) FROM tags WHERE description IS NOT NULL"
    );
    expect(parseInt(nonNullDescriptions[0])).toBe(2); // id=1,3 に値がある

    // 具体的なデータを確認（パイプ区切りの文字列として返される）
    const tags = await getContext().testContainer.executeQuery(
      "SELECT id, name, description FROM tags ORDER BY id"
    );
    expect(tags.length).toBe(4);
    expect(tags[0]).toBe("1|Technology|Tech related posts"); // 値がある場合
    expect(tags[1]).toBe("2|Lifestyle|"); // descriptionがNULLの場合は末尾が空
    expect(tags[2]).toBe("3|Business|Business and finance");
    expect(tags[3]).toBe("4|Sports|"); // descriptionがNULLの場合は末尾が空
  });
});