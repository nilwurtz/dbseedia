# DbSeedia

[![npm version](https://badge.fury.io/js/dbseedia.svg)](https://badge.fury.io/js/dbseedia)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/nilwurtz/dbseedia)](https://github.com/nilwurtz/dbseedia/releases)

Database test data loader library inspired by DBUnit, for PostgreSQL with CSV and TSV support.

## Features

- High-performance data loading using PostgreSQL's COPY FROM command
- Support for CSV and TSV file formats
- Multiple loading strategies (truncate, delete)
- Table ordering support with `table-ordering.txt`
- Multi-database connection support
- TypeScript-first with full type safety
- ESM module support

## Installation

```bash
npm install dbseedia
```

## Quick Start

```typescript
import { DbSeedia } from 'dbseedia';

const dbSeedia = new DbSeedia({
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    username: 'postgres',
    password: 'password'
  }
});

// Connect to database
await dbSeedia.connect();

// Load test data from fixtures directory
await dbSeedia.loadFrom('./fixtures');

// Disconnect when done
await dbSeedia.disconnect();
```

## Configuration

### Basic Configuration

```typescript
const config = {
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    username: 'postgres',
    password: 'password'
  },
  strategy: 'truncate',    // 'truncate' | 'delete'
  separator: ',',          // CSV separator
  encoding: 'utf8',        // File encoding
  nullValue: '',           // Value to treat as NULL
  batchSize: 1000         // Batch processing size
};
```

### Multi-Database Support

```typescript
const config = {
  connection: [
    { 
      name: 'main', 
      host: 'localhost', 
      database: 'app_test',
      username: 'postgres',
      password: 'password'
    },
    { 
      name: 'analytics', 
      host: 'analytics-db', 
      database: 'analytics_test',
      username: 'postgres',
      password: 'password'
    }
  ]
};

// Load to specific database
await dbSeedia.loadFrom('./fixtures', { target: 'analytics' });
```

## File Structure

Organize your test data files in a directory structure:

```
fixtures/
├── table-ordering.txt    # Optional: defines table loading order
├── users.csv            # User data
├── posts.tsv            # Post data (TSV format)
└── comments.csv         # Comment data
```

### Table Ordering

Create a `table-ordering.txt` file to specify the order in which tables should be loaded:

```
users
posts
comments
```

If no ordering file is provided, tables are loaded in alphabetical order.

## Loading Strategies

### Truncate (Default)

Clears all data from the table before loading:

```typescript
await dbSeedia.loadFrom('./fixtures', { strategy: 'truncate' });
```

### Delete

Deletes specific records before loading (useful for partial updates):

```typescript
await dbSeedia.loadFrom('./fixtures', { strategy: 'delete' });
```

## API Reference

### DbSeedia Class

#### Constructor

```typescript
new DbSeedia(config: DbSeediaConfig)
```

#### Methods

- `connect(): Promise<void>` - Connect to database(s)
- `disconnect(): Promise<void>` - Disconnect from database(s)
- `loadFrom(directory: string, options?: LoadOptions): Promise<void>` - Load data from directory

#### Fluent Interface

- `withStrategy(strategy: LoadStrategy): DbSeedia` - Set loading strategy
- `withOptions(options: Partial<DbSeediaConfig>): DbSeedia` - Update configuration
- `withTables(tables: string[]): DbSeedia` - Specify tables to load
- `withConnection(connection: ConnectionConfig): DbSeedia` - Update connection

### Types

```typescript
interface DbSeediaConfig {
  connection: ConnectionConfig | ConnectionConfig[];
  strategy?: 'truncate' | 'delete';
  separator?: string;
  encoding?: string;
  nullValue?: string;
  batchSize?: number;
}

interface ConnectionConfig {
  name?: string;
  host: string;
  port?: number;
  database: string;
  username: string;
  password?: string;
}

interface LoadOptions {
  strategy?: 'truncate' | 'delete';
  tables?: string[];
  target?: string;
}
```

## Error Handling

DbSeedia provides specific error types for different failure scenarios:

- `FileParseError` - File reading or parsing issues
- `DataTransformError` - Data conversion problems
- `DatabaseError` - PostgreSQL operation failures
- `ConnectionError` - Database connection issues
- `ValidationError` - Configuration validation errors

```typescript
import { DbSeedia, FileParseError, DatabaseError } from 'dbseedia';

try {
  await dbSeedia.loadFrom('./fixtures');
} catch (error) {
  if (error instanceof FileParseError) {
    console.error('File parsing failed:', error.message);
  } else if (error instanceof DatabaseError) {
    console.error('Database operation failed:', error.message);
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm run test

# Run E2E tests
npm run e2e

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Rancher Desktop
For development with Rancher Desktop, you can use the following command to link the Docker socket:

```bash
sudo ln -s $HOME/.rd/docker.sock /var/run/docker.sock
```

## Requirements

- Node.js 20.0.0 or higher
- PostgreSQL database
- TypeScript 5.8+ (for development)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
