import { describe, expect, it } from "vitest";
import { setupE2EHooks } from "../../execution-hooks.js";

describe("基本ロード機能", () => {
  const getContext = setupE2EHooks();

  it("フィクスチャディレクトリからデータをロードできること", async () => {
    await getContext().dbSeedia.loadFrom("./e2e/fixtures");

    const userCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM users");
    expect(parseInt(userCount[0])).toBe(3);

    const postCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM posts");
    expect(parseInt(postCount[0])).toBe(3);

    const commentCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM comments");
    expect(parseInt(commentCount[0])).toBe(3);
  });

  it("指定したテーブルのみをロードできること", async () => {
    await getContext().dbSeedia.loadFrom("./e2e/fixtures", {
      tables: ["users"],
    });

    const userCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM users");
    expect(parseInt(userCount[0])).toBe(3);

    const postCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM posts");
    expect(parseInt(postCount[0])).toBe(0);

    const commentCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM comments");
    expect(parseInt(commentCount[0])).toBe(0);
  });
});
