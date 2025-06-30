import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { DbSeedia } from "../../../src/index.js";
import { PostgresTestContainer } from "../../utils/test-container.js";
import type { ConnectionConfig } from "../../../src/interfaces/index.js";

describe("Basic Loading Scenarios", () => {
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

  it("should load data from fixtures directory", async () => {
    await dbSeedia.loadFrom("./e2e/fixtures");

    const userCount = await testContainer.executeQuery(
      "SELECT COUNT(*) FROM users"
    );
    expect(parseInt(userCount[0])).toBe(3);

    const postCount = await testContainer.executeQuery(
      "SELECT COUNT(*) FROM posts"
    );
    expect(parseInt(postCount[0])).toBe(3);

    const commentCount = await testContainer.executeQuery(
      "SELECT COUNT(*) FROM comments"
    );
    expect(parseInt(commentCount[0])).toBe(3);
  });

  it("should load specific tables only", async () => {
    await dbSeedia.loadFrom("./e2e/fixtures", {
      tables: ["users"],
    });

    const userCount = await testContainer.executeQuery(
      "SELECT COUNT(*) FROM users"
    );
    expect(parseInt(userCount[0])).toBe(3);

    const postCount = await testContainer.executeQuery(
      "SELECT COUNT(*) FROM posts"
    );
    expect(parseInt(postCount[0])).toBe(0);

    const commentCount = await testContainer.executeQuery(
      "SELECT COUNT(*) FROM comments"
    );
    expect(parseInt(commentCount[0])).toBe(0);
  });
});