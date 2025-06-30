import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { DbSeedia } from "../../../src/index.js";
import { PostgresTestContainer } from "../../utils/test-container.js";
import type { ConnectionConfig } from "../../../src/interfaces/index.js";

describe("File Format Scenarios", () => {
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

  it("should load CSV and TSV files correctly", async () => {
    await dbSeedia.loadFrom("./e2e/fixtures");

    const users = await testContainer.executeQuery(
      "SELECT name, email FROM users WHERE id = 1"
    );
    expect(users[0]).toContain("John Doe");
    expect(users[0]).toContain("john@example.com");

    const posts = await testContainer.executeQuery(
      "SELECT title, content FROM posts WHERE id = 1"
    );
    expect(posts[0]).toContain("First Post");
    expect(posts[0]).toContain("This is the first post");
  });

  it("should handle empty files gracefully", async () => {
    await expect(async () => {
      await dbSeedia.loadFrom("./e2e/nonexistent");
    }).rejects.toThrow();
  });
});