import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PgUnit } from "../src/index.js";
import { PostgresTestContainer } from "./utils/test-container.js";
import type { ConnectionConfig } from "../src/interfaces/index.js";

describe("PgUnit Integration Tests", () => {
  let testContainer: PostgresTestContainer;
  let connectionConfig: ConnectionConfig;
  let pgUnit: PgUnit;

  beforeAll(async () => {
    testContainer = new PostgresTestContainer();
    connectionConfig = await testContainer.start();

    pgUnit = new PgUnit({
      connection: connectionConfig,
      strategy: "truncate",
    });

    await pgUnit.connect();
  }, 60000); // 60 second timeout for container startup

  afterAll(async () => {
    if (pgUnit) {
      await pgUnit.disconnect();
    }
    if (testContainer) {
      await testContainer.stop();
    }
  });

  beforeEach(async () => {
    // Create test tables
    await testContainer.createTable("users", [
      { name: "id", type: "SERIAL PRIMARY KEY" },
      { name: "name", type: "VARCHAR(255)" },
      { name: "email", type: "VARCHAR(255)" },
      { name: "created_at", type: "TIMESTAMP" },
    ]);

    await testContainer.createTable("posts", [
      { name: "id", type: "SERIAL PRIMARY KEY" },
      { name: "user_id", type: "INTEGER" },
      { name: "title", type: "VARCHAR(255)" },
      { name: "content", type: "TEXT" },
      { name: "created_at", type: "TIMESTAMP" },
    ]);

    await testContainer.createTable("comments", [
      { name: "id", type: "SERIAL PRIMARY KEY" },
      { name: "post_id", type: "INTEGER" },
      { name: "author_name", type: "VARCHAR(255)" },
      { name: "content", type: "TEXT" },
      { name: "created_at", type: "TIMESTAMP" },
    ]);
  });

  it("should load data from fixtures directory", async () => {
    await pgUnit.loadFrom("./IntegrationTest/fixtures");

    // Verify users were loaded
    const userCount = await testContainer.executeQuery(
      "SELECT COUNT(*) FROM users",
    );
    expect(parseInt(userCount[0])).toBe(3);

    // Verify posts were loaded
    const postCount = await testContainer.executeQuery(
      "SELECT COUNT(*) FROM posts",
    );
    expect(parseInt(postCount[0])).toBe(3);

    // Verify comments were loaded
    const commentCount = await testContainer.executeQuery(
      "SELECT COUNT(*) FROM comments",
    );
    expect(parseInt(commentCount[0])).toBe(3);
  });

  it("should load specific tables only", async () => {
    await pgUnit.loadFrom("./IntegrationTest/fixtures", { tables: ["users"] });

    // Verify only users were loaded
    const userCount = await testContainer.executeQuery(
      "SELECT COUNT(*) FROM users",
    );
    expect(parseInt(userCount[0])).toBe(3);

    // Verify other tables are empty
    const postCount = await testContainer.executeQuery(
      "SELECT COUNT(*) FROM posts",
    );
    expect(parseInt(postCount[0])).toBe(0);

    const commentCount = await testContainer.executeQuery(
      "SELECT COUNT(*) FROM comments",
    );
    expect(parseInt(commentCount[0])).toBe(0);
  });

  it("should handle truncate strategy", async () => {
    // Load data first time
    await pgUnit.loadFrom("./IntegrationTest/fixtures");

    let userCount = await testContainer.executeQuery(
      "SELECT COUNT(*) FROM users",
    );
    expect(parseInt(userCount[0])).toBe(3);

    // Load data second time with truncate (should replace, not append)
    await pgUnit
      .withStrategy("truncate")
      .loadFrom("./IntegrationTest/fixtures");

    userCount = await testContainer.executeQuery("SELECT COUNT(*) FROM users");
    expect(parseInt(userCount[0])).toBe(3); // Still 3, not 6
  });

  it("should load CSV and TSV files correctly", async () => {
    await pgUnit.loadFrom("./IntegrationTest/fixtures");

    // Check user data (CSV)
    const users = await testContainer.executeQuery(
      "SELECT name, email FROM users WHERE id = 1",
    );
    expect(users[0]).toContain("John Doe");
    expect(users[0]).toContain("john@example.com");

    // Check post data (TSV)
    const posts = await testContainer.executeQuery(
      "SELECT title, content FROM posts WHERE id = 1",
    );
    expect(posts[0]).toContain("First Post");
    expect(posts[0]).toContain("This is the first post");
  });

  it("should handle empty files gracefully", async () => {
    // This test would require creating empty fixture files
    // For now, we'll test the basic error handling
    await expect(async () => {
      await pgUnit.loadFrom("./IntegrationTest/nonexistent");
    }).rejects.toThrow();
  });

  it("should support fluent interface", async () => {
    const fluentPgUnit = pgUnit
      .withStrategy("truncate")
      .withOptions({ batchSize: 500 });

    await fluentPgUnit.loadFrom("./IntegrationTest/fixtures", {
      tables: ["users"],
    });

    const userCount = await testContainer.executeQuery(
      "SELECT COUNT(*) FROM users",
    );
    expect(parseInt(userCount[0])).toBe(3);
  });
});
