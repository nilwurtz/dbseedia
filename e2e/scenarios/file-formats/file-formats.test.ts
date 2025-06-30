import { describe, expect, it } from "vitest";
import { setupE2EHooks } from "../../execution-hooks.js";

describe("ファイル形式機能", () => {
  const getContext = setupE2EHooks();

  it("CSVとTSVファイルを正しくロードできること", async () => {
    await getContext().dbSeedia.loadFrom("./e2e/scenarios/file-formats/fixtures");

    const users = await getContext().testContainer.executeQuery("SELECT name, email FROM users WHERE id = 1");
    expect(users[0]).toContain("John Doe");
    expect(users[0]).toContain("john@example.com");

    const posts = await getContext().testContainer.executeQuery("SELECT title, content FROM posts WHERE id = 1");
    expect(posts[0]).toContain("First Post");
    expect(posts[0]).toContain("This is the first post");
  });

  it("存在しないファイルを適切にエラー処理できること", async () => {
    await expect(async () => {
      await getContext().dbSeedia.loadFrom("./e2e/nonexistent");
    }).rejects.toThrow();
  });
});
