import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { DbSeedia } from "../../../src/index.js";
import { PostgresTestContainer } from "../../utils/test-container.js";
import type { ConnectionConfig } from "../../../src/interfaces/index.js";

describe("Loading Strategy Scenarios", () => {
  let testContainer: PostgresTestContainer;
  let connectionConfig: ConnectionConfig;
  let dbSeedia: DbSeedia;

  beforeAll(async () => {
    testContainer = new PostgresTestContainer();
    connectionConfig = await testContainer.start();

    dbSeedia = new DbSeedia({
      connection: connectionConfig,
      strategy: "truncate",
    });

    await dbSeedia.connect();
  }, 60000);

  afterAll(async () => {
    if (dbSeedia) {
      await dbSeedia.disconnect();
    }
    if (testContainer) {
      await testContainer.stop();
    }
  });

  beforeEach(async () => {
    await testContainer.resetDatabase();
    await testContainer.setupTestTables();
  });

  it("should handle truncate strategy", async () => {
    await dbSeedia.loadFrom("./e2e/fixtures");

    let userCount = await testContainer.executeQuery(
      "SELECT COUNT(*) FROM users"
    );
    expect(parseInt(userCount[0])).toBe(3);

    const truncateDbSeedia = dbSeedia.withStrategy("truncate");
    await truncateDbSeedia.connect();
    await truncateDbSeedia.loadFrom("./e2e/fixtures");
    await truncateDbSeedia.disconnect();

    userCount = await testContainer.executeQuery("SELECT COUNT(*) FROM users");
    expect(parseInt(userCount[0])).toBe(3);
  });

  it("should support fluent interface", async () => {
    const fluentDbSeedia = dbSeedia.withStrategy("truncate").withOptions({
      batchSize: 500,
    });

    await fluentDbSeedia.connect();
    await fluentDbSeedia.loadFrom("./e2e/fixtures", {
      tables: ["users"],
    });
    await fluentDbSeedia.disconnect();

    const userCount = await testContainer.executeQuery(
      "SELECT COUNT(*) FROM users"
    );
    expect(parseInt(userCount[0])).toBe(3);
  });
});