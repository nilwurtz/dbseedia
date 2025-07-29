import { describe, expect, it } from "vitest";
import { setupE2EHooks } from "../../execution-hooks.js";

describe("ファイル形式機能", () => {
  const getContext = setupE2EHooks();

  it("CSVとTSVファイルを正しくロードできること", async () => {
    await getContext().dbSeedia.loadFrom("./e2e/scenarios/file-formats/fixtures");

    const users = await getContext().helper.executeQuery("SELECT name, email FROM users WHERE id = 1");
    expect(users[0].name).toBe("John Doe");
    expect(users[0].email).toBe("john@example.com");

    const posts = await getContext().helper.executeQuery("SELECT title, content FROM posts WHERE id = 1");
    expect(posts[0].title).toBe("First Post");
    expect(posts[0].content).toBe("This is the first post");
  });

  it("存在しないファイルを適切にエラー処理できること", async () => {
    await expect(async () => {
      await getContext().dbSeedia.loadFrom("./e2e/nonexistent");
    }).rejects.toThrow();
  });
});
