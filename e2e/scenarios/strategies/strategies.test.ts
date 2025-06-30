import { describe, expect, it } from "vitest";
import { setupE2EHooks } from "../../execution-hooks.js";

describe("ロード戦略機能", () => {
  const getContext = setupE2EHooks();

  it("truncate戦略を処理できること", async () => {
    await getContext().dbSeedia.loadFrom("./e2e/fixtures");

    let userCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM users");
    expect(parseInt(userCount[0])).toBe(3);

    const truncateDbSeedia = getContext().dbSeedia.withStrategy("truncate");
    await truncateDbSeedia.connect();
    await truncateDbSeedia.loadFrom("./e2e/fixtures");
    await truncateDbSeedia.disconnect();

    userCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM users");
    expect(parseInt(userCount[0])).toBe(3);
  });

  it("フルエントインターフェースをサポートできること", async () => {
    const fluentDbSeedia = getContext().dbSeedia.withStrategy("truncate").withOptions({
      batchSize: 500,
    });

    await fluentDbSeedia.connect();
    await fluentDbSeedia.loadFrom("./e2e/fixtures", {
      tables: ["users"],
    });
    await fluentDbSeedia.disconnect();

    const userCount = await getContext().testContainer.executeQuery("SELECT COUNT(*) FROM users");
    expect(parseInt(userCount[0])).toBe(3);
  });
});
