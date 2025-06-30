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
  });

  it("外部キー制約に違反する順序でのロードはエラーになること", async () => {
    const dbSeedia = getContext().dbSeedia.withStrategy("truncate");
    await dbSeedia.connect();

    try {
      // 外部キー制約違反を確実に発生させるため、projectsテーブルのみロードを試行
      // projectsはemployeesテーブルのlead_employee_idを参照するが、employeesテーブルが空のためエラーになる
      await dbSeedia.loadFrom("./e2e/scenarios/ordering/fixtures-fk-test-wrong-order", {
        tables: ["projects"],
      });

      // データがロードされているか確認（外部キー制約エラーの場合は0になるはず）
      const projectCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM projects");

      // もしここまで到達した場合、外部キー制約が正しく適用されていない
      expect(parseInt(projectCount[0])).toBe(0); // データがロードされていないことを期待
    } catch (error) {
      // 外部キー制約エラーが発生することを確認
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Failed to load data");
    }
  });

  it("正しい順序でのロードは成功すること（新しいスキーマ）", async () => {
    const dbSeedia = getContext().dbSeedia.withStrategy("truncate");
    await dbSeedia.connect();

    // 正しい順序（departments -> employees -> projects）でロード
    await dbSeedia.loadFrom("./e2e/scenarios/ordering/fixtures-fk-test");

    // すべてのテーブルにデータが正常にロードされたことを確認
    const deptCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM departments");
    const empCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM employees");
    const projCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM projects");

    expect(parseInt(deptCount[0])).toBe(3);
    expect(parseInt(empCount[0])).toBe(4);
    expect(parseInt(projCount[0])).toBe(3);
  });
});
