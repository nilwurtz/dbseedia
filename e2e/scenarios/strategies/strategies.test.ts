import { describe, it, expect } from "vitest";
import { setupE2EHooks } from "../../execution-hooks.js";

describe("Loading Strategy Scenarios", () => {
  const getContext = setupE2EHooks();

  it("should handle truncate strategy", async () => {
    await getContext().dbSeedia.loadFrom("./e2e/fixtures");

    let userCount = await getContext().testContainer.executeQuery(
      "SELECT COUNT(*) FROM users",
    );
    expect(parseInt(userCount[0])).toBe(3);

    const truncateDbSeedia = getContext().dbSeedia.withStrategy("truncate");
    await truncateDbSeedia.connect();
    await truncateDbSeedia.loadFrom("./e2e/fixtures");
    await truncateDbSeedia.disconnect();

    userCount = await getContext().testContainer.executeQuery(
      "SELECT COUNT(*) FROM users",
    );
    expect(parseInt(userCount[0])).toBe(3);
  });

  it("should support fluent interface", async () => {
    const fluentDbSeedia = getContext()
      .dbSeedia.withStrategy("truncate")
      .withOptions({
        batchSize: 500,
      });

    await fluentDbSeedia.connect();
    await fluentDbSeedia.loadFrom("./e2e/fixtures", {
      tables: ["users"],
    });
    await fluentDbSeedia.disconnect();

    const userCount = await getContext().testContainer.executeQuery(
      "SELECT COUNT(*) FROM users",
    );
    expect(parseInt(userCount[0])).toBe(3);
  });
});
