import { describe, it, expect } from "vitest";
import { setupE2EHooks } from "../../execution-hooks.js";

describe("File Format Scenarios", () => {
  const getContext = setupE2EHooks();

  it("should load CSV and TSV files correctly", async () => {
    await getContext().dbSeedia.loadFrom("./e2e/fixtures");

    const users = await getContext().testContainer.executeQuery(
      "SELECT name, email FROM users WHERE id = 1",
    );
    expect(users[0]).toContain("John Doe");
    expect(users[0]).toContain("john@example.com");

    const posts = await getContext().testContainer.executeQuery(
      "SELECT title, content FROM posts WHERE id = 1",
    );
    expect(posts[0]).toContain("First Post");
    expect(posts[0]).toContain("This is the first post");
  });

  it("should handle empty files gracefully", async () => {
    await expect(async () => {
      await getContext().dbSeedia.loadFrom("./e2e/nonexistent");
    }).rejects.toThrow();
  });
});
