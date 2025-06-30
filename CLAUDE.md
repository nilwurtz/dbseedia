# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**dbseedia** is a database test data loader library similar to dbUnit, designed for high-performance data loading using PostgreSQL's COPY FROM command. The project provides both a core library and planned CLI tool for loading CSV/TSV test data with table ordering support.

## Architecture

### Core Design Pattern

The project follows a layered architecture with three main components:

- **CLI Tool**: Command parser and user interface
- **Core Library**: DbSeedia core with business logic
- **Database Executor**: PostgreSQL connection and COPY operations

### Key Interfaces

- `FileReader`: Handles CSV/TSV parsing and table-ordering.txt
- `DataTransformer`: Converts parsed data to database format
- `DatabaseExecutor`: Manages database connections and COPY operations
- `DbSeedia`: Main API class with fluent interface

## Technology Stack

- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL via postgres.js
- **CSV Parsing**: papaparse
- **Testing**: Vitest
- **Build**: tsc
- **Node Version**: 22.16.0 (managed via mise)

## Development Commands

Since the project is in initial setup phase, standard commands will be:

```bash
# Environment setup
mise install                    # Install Node.js 22.16.0

# Development (when package.json exists)
npm install                     # Install dependencies
npm run build                   # TypeScript compilation
npm run test                    # Run Vitest tests
npm run lint                    # ESLint checking
npm run typecheck              # TypeScript type checking
```

## Key Features

### Data Loading Strategies

- **Truncate**: Clear table before loading (default)
- **Delete**: Delete specific records before loading
- **Upsert**: Update or insert (future phase)

### Performance Optimizations

- PostgreSQL COPY FROM for high-speed data loading
- Batch processing (default: 1000 rows)
- Transaction-based operations
- Optional foreign key constraint disabling

### Multi-Database Support

Supports multiple database connections with named configurations:

```typescript
const config = {
  connection: [
    { name: "main", host: "localhost", database: "app_test" },
    { name: "analytics", host: "analytics-db", database: "analytics_test" },
  ],
};
```

## File Structure Expectations

### Test Data Format

```
fixtures/
├── table-ordering.txt    # Table loading order
├── users.csv            # User data
├── posts.tsv            # Post data (TSV format)
└── comments.csv         # Comment data
```

### Configuration

- ESM modules (`"type": "module"`)
- Node.js 20+ compatibility
- TypeScript-first development

## Error Handling

Hierarchical error system:

- `FileParseError`: File reading issues
- `DataTransformError`: Data conversion problems
- `DatabaseError`: PostgreSQL operation failures
- `ConnectionError`: Database connection issues
- `ValidationError`: Configuration validation

## Development Phases

- **Phase 1**: Core PostgreSQL COPY FROM implementation
- **Phase 2**: Schema validation, auto-increment handling
- **Phase 3**: CLI tool, configuration files, advanced features

## Notes

- Project uses mise for Node.js version management
- Minimal dependencies strategy
- Focus on PostgreSQL initially (MySQL support planned)
- Designed for high-performance test data loading scenarios
