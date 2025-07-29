import { describe, expect, it } from "vitest";
import { setupE2EHooks } from "../../execution-hooks.js";

describe("テーブル読み込み順序機能", () => {
  const getContext = setupE2EHooks();

  it("外部キー制約に違反する順序でのロードはエラーになること", async () => {
    const dbSeedia = getContext().dbSeedia.withStrategy("truncate");
    await dbSeedia.connect();

    try {
      // 外部キー制約違反を確実に発生させるため、間違った順序で定義されたfixtureを使用
      // projectsはemployeesテーブルのlead_employee_idを参照するが、employees前にprojectsがロードされるためエラーになる
      await dbSeedia.loadFrom("./e2e/scenarios/ordering/fixtures-fk-test-wrong-order");

      // ここまで到達すると外部キー制約が正しく適用されていない
      throw new Error("Expected foreign key constraint error did not occur");
    } catch (error) {
      // 外部キー制約エラーが発生することを確認
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Failed to load data");
    }
  });

  it("正しい順序でのロードは成功すること", async () => {
    const dbSeedia = getContext().dbSeedia.withStrategy("truncate");
    await dbSeedia.connect();

    // 正しい順序（departments -> employees -> projects）でロード
    await dbSeedia.loadFrom("./e2e/scenarios/ordering/fixtures-fk-test");

    // すべてのテーブルにデータが正常にロードされたことを確認
    const deptCount = await getContext().helper.executeQuery("SELECT COUNT(*) FROM departments");
    const empCount = await getContext().helper.executeQuery("SELECT COUNT(*) FROM employees");
    const projCount = await getContext().helper.executeQuery("SELECT COUNT(*) FROM projects");

    expect(Number(deptCount[0].count)).toBe(3);
    expect(Number(empCount[0].count)).toBe(4);
    expect(Number(projCount[0].count)).toBe(3);
  });
});
