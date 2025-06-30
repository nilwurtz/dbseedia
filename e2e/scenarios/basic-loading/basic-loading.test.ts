import { describe, it, expect } from "vitest";
import { setupE2EHooks } from "../../execution-hooks.js";

describe("Basic Loading Scenarios", () => {
  const getContext = setupE2EHooks();

  it("should load data from fixtures directory", async () => {
    await getContext().dbSeedia.loadFrom("./e2e/fixtures");

    const userCount = await getContext().testContainer.executeQuery(
      "SELECT COUNT(*) FROM users",
    );
    expect(parseInt(userCount[0])).toBe(3);

    const postCount = await getContext().testContainer.executeQuery(
      "SELECT COUNT(*) FROM posts",
    );
    expect(parseInt(postCount[0])).toBe(3);

    const commentCount = await getContext().testContainer.executeQuery(
      "SELECT COUNT(*) FROM comments",
    );
    expect(parseInt(commentCount[0])).toBe(3);
  });

  it("should load specific tables only", async () => {
    await getContext().dbSeedia.loadFrom("./e2e/fixtures", {
      tables: ["users"],
    });

    const userCount = await getContext().testContainer.executeQuery(
      "SELECT COUNT(*) FROM users",
    );
    expect(parseInt(userCount[0])).toBe(3);

    const postCount = await getContext().testContainer.executeQuery(
      "SELECT COUNT(*) FROM posts",
    );
    expect(parseInt(postCount[0])).toBe(0);

    const commentCount = await getContext().testContainer.executeQuery(
      "SELECT COUNT(*) FROM comments",
    );
    expect(parseInt(commentCount[0])).toBe(0);
  });
});
