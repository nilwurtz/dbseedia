# DbSeedia Basic Usage Sample

This sample demonstrates the basic usage of [dbseedia](https://www.npmjs.com/package/dbseedia) with TypeScript and Testcontainers.

## Overview

This example shows how to:
- Set up dbseedia with PostgreSQL using Testcontainers
- Load test data from CSV files
- Use different loading strategies
- Work with the fluent interface

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the tests:
```bash
npm test
```

## Project Structure

```
basic/
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vitest.config.ts      # Vitest test configuration
├── basic-usage.test.ts   # Test demonstrating basic usage
├── fixtures/             # Test data files
│   ├── table-ordering.txt
│   ├── users.csv
│   ├── posts.csv
│   └── comments.csv
└── README.md            # This file
```

## Key Features Demonstrated

### 1. Basic Data Loading

```typescript
const config = {
  connection: {
    host: container.getHost(),
    port: container.getFirstMappedPort(),
    database: 'test_db',
    username: 'testuser',
    password: 'testpass',
  },
  fixturesDirectory: './fixtures',
};

const dbSeedia = new DbSeedia(config);
await dbSeedia.load();
```

### 2. Table Ordering

The `table-ordering.txt` file specifies the order in which tables should be loaded:
```
users
posts
comments
```

This ensures foreign key relationships are respected.

### 3. Fluent Interface

```typescript
await new DbSeedia(config)
  .withStrategy('truncate')
  .load();
```

### 4. Testcontainers Integration

The sample uses Testcontainers to provide an isolated PostgreSQL instance for testing:

```typescript
container = await new PostgreSqlContainer('postgres:16')
  .withDatabase('test_db')
  .withUsername('testuser')
  .withPassword('testpass')
  .start();
```

## Test Data

The sample includes three related tables:

- **users**: Basic user information
- **posts**: Blog posts with foreign keys to users
- **comments**: Comments with foreign keys to posts

All data is loaded from CSV files in the `fixtures/` directory.

## Running the Tests

The tests demonstrate:
1. Loading initial test data
2. Truncating and reloading data
3. Using the fluent interface

Each test uses a fresh PostgreSQL container to ensure isolation.