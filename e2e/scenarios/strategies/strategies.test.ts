import { describe, expect, it } from "vitest";
import { setupE2EHooks } from "../../execution-hooks.js";

describe("ロード戦略機能", () => {
  const getContext = setupE2EHooks();

  it("truncate戦略を処理できること", async () => {
    await getContext().dbSeedia.loadFrom("./e2e/scenarios/strategies/fixtures");

    let userCount = await getContext().helper.executeQuery("SELECT COUNT(*) FROM users");
    expect(Number(userCount[0].count)).toBe(3);

    const truncateDbSeedia = getContext().dbSeedia.withStrategy("truncate");
    await truncateDbSeedia.connect();
    await truncateDbSeedia.loadFrom("./e2e/scenarios/strategies/fixtures");
    await truncateDbSeedia.disconnect();

    userCount = await getContext().helper.executeQuery("SELECT COUNT(*) FROM users");
    expect(Number(userCount[0].count)).toBe(3);
  });

  it("フルエントインターフェースをサポートできること", async () => {
    const fluentDbSeedia = getContext().dbSeedia.withStrategy("truncate").withOptions({
      batchSize: 500,
    });

    await fluentDbSeedia.connect();
    await fluentDbSeedia.loadFrom("./e2e/scenarios/strategies/fixtures");
    await fluentDbSeedia.disconnect();

    const userCount = await getContext().helper.executeQuery("SELECT COUNT(*) FROM users");
    expect(Number(userCount[0].count)).toBe(3);

    const postCount = await getContext().helper.executeQuery("SELECT COUNT(*) FROM posts");
    expect(Number(postCount[0].count)).toBe(3);

    const commentCount = await getContext().helper.executeQuery("SELECT COUNT(*) FROM comments");
    expect(Number(commentCount[0].count)).toBe(3);
  });
});
