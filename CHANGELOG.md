# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added wildcard exports pattern (`"./*"`) in package.json to simplify submodule imports
- Added explicit `./package.json` export for package metadata access

### Changed

- Updated @biomejs/biome from 2.0.6 to 2.1.2
- Updated @types/node from ^24.0.8 to ^24.1.0
- Applied Biome configuration migration for schema compatibility
- Improved CommonJS dynamic import compatibility with proper exports configuration

## [0.0.3] - 2025-07-29

### Added

- Added dual package support for both ESM and CommonJS (#1)
  - Created separate TypeScript configurations: `tsconfig.esm.json` and `tsconfig.cjs.json`
  - Build outputs to `dist/esm/` and `dist/cjs/` directories respectively
  - Updated package.json exports field to support both module systems

### Changed

- Migrated E2E test environment from TestContainers to docker-compose

## [0.0.2] - 2025-07-01

### Fixed

- Fixed papaparse ESM import issue that prevented npm package from working correctly
- Changed from named import `import { parse } from "papaparse"` to default import `import Papa from "papaparse"`

### Added

- Added sample/basic/ directory with TypeScript + Testcontainers usage example
- Added comprehensive test scenarios demonstrating basic loading, truncate strategy, and fluent API

### Changed

- Package is now fully functional as npm dependency

## [0.0.1] - 2024-07-01

### Added

- Initial release of dbseedia library
- Core PostgreSQL COPY FROM implementation
- Support for CSV and TSV file formats
- Table ordering support via table-ordering.txt
- Truncate data loading strategy
- Fluent interface API
- TypeScript support with full type definitions
- ESM module support
- Unit tests and E2E test suite

### Known Issues

- ESM import issue with papaparse package (fixed in 0.0.2)

[Unreleased]: https://github.com/nilwurtz/dbseedia/compare/v0.0.3...HEAD
[0.0.3]: https://github.com/nilwurtz/dbseedia/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/nilwurtz/dbseedia/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/nilwurtz/dbseedia/releases/tag/v0.0.1
