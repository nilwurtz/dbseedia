import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DbSeedia, type DbSeediaConfig } from 'dbseedia';
import postgres from 'postgres';

describe('DbSeedia Basic Usage', () => {
  let container: StartedPostgreSqlContainer;
  let sql: ReturnType<typeof postgres>;
  let config: DbSeediaConfig;
  let dbSeedia: DbSeedia;

  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer('postgres:16')
      .withDatabase('test_db')
      .withUsername('testuser')
      .withPassword('testpass')
      .start();

    // Setup database connection
    const connectionUri = container.getConnectionUri();
    sql = postgres(connectionUri);

    // Create test tables
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100),
        age INTEGER
      )
    `;

    await sql`
      CREATE TABLE posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(200),
        content TEXT
      )
    `;

    await sql`
      CREATE TABLE comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id),
        author_name VARCHAR(100),
        content TEXT
      )
    `;

    // Configure DbSeedia
    config = {
      connection: {
        host: container.getHost(),
        port: container.getPort(),
        database: 'test_db',
        username: 'testuser',
        password: 'testpass',
      },
    };
  });

  beforeEach(async () => {
    // Clean up data before each test
    await sql`TRUNCATE users, posts, comments CASCADE`;
  });

  afterEach(async () => {
    if (dbSeedia) {
      await dbSeedia.disconnect();
    }
    // Clean up data after each test
    await sql`TRUNCATE users, posts, comments CASCADE`;
  });

  afterAll(async () => {
    await sql?.end();
    await container?.stop();
  });

  it('should load test data with basic configuration', async () => {
    // Load test data using DbSeedia
    dbSeedia = new DbSeedia(config);
    await dbSeedia.connect();
    await dbSeedia.loadFrom('./fixtures');

    // Verify data was loaded correctly
    const users = await sql`SELECT * FROM users ORDER BY id`;
    expect(users).toHaveLength(3);
    expect(users[0]).toMatchObject({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
    });

    const posts = await sql`SELECT * FROM posts ORDER BY id`;
    expect(posts).toHaveLength(4);
    expect(posts[0]).toMatchObject({
      id: 1,
      user_id: 1,
      title: 'First Post',
      content: 'This is the first post by John',
    });

    const comments = await sql`SELECT * FROM comments ORDER BY id`;
    expect(comments).toHaveLength(4);
    expect(comments[0]).toMatchObject({
      id: 1,
      post_id: 1,
      author_name: 'Alice',
      content: 'Great post!',
    });
  });

  it('should truncate and reload data', async () => {
    // First load test data
    dbSeedia = new DbSeedia(config);
    await dbSeedia.connect();
    await dbSeedia.loadFrom('./fixtures');
    await dbSeedia.disconnect();
    
    // Add some extra data with a unique ID
    await sql`INSERT INTO users (id, name, email, age) VALUES (99, 'Extra User', 'extra@example.com', 40)`;
    
    // Verify extra data exists
    let users = await sql`SELECT * FROM users`;
    expect(users).toHaveLength(4);

    // Reload with truncate strategy (default)
    dbSeedia = new DbSeedia(config);
    await dbSeedia.connect();
    await dbSeedia.loadFrom('./fixtures');

    // Verify original data is restored and extra data is removed
    users = await sql`SELECT * FROM users ORDER BY id`;
    expect(users).toHaveLength(3);
    expect(users.map(u => u.name)).toEqual(['John Doe', 'Jane Smith', 'Bob Johnson']);
  });

  it('should work with fluent interface', async () => {
    // Use fluent interface
    dbSeedia = new DbSeedia(config).withStrategy('truncate');
    await dbSeedia.connect();
    await dbSeedia.loadFrom('./fixtures');

    // Verify data was loaded
    const users = await sql`SELECT * FROM users`;
    expect(users).toHaveLength(3);
  });
});