# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2026-02-07

### Fixed
- Fixed YAML metadata files generating anchor references (`&a1`, `*a1`) for duplicate timestamp values
  - Added `aliasDuplicateObjects: false` option to YAML serialization
  - Modified `MetadataManager.touch()` to create distinct string instances for `createdAt` and `updatedAt`
  - Metadata files now display clean, readable timestamps without YAML anchors

## [1.2.0] - 2026-02-01

### Added

#### Synchronous Operations
- Added synchronous methods for `Collection` class:
  - `loadSync()` - Load documents from disk synchronously
  - `insertSync(document)` - Insert document and persist synchronously
  - `updateSync(query, updates)` - Update matching documents synchronously
  - `deleteSync(query)` - Delete matching documents synchronously
  - `clearSync()` - Clear all documents synchronously
  - `discardSync()` - Reload from disk synchronously

- Added synchronous methods for `Dictionary` class:
  - `loadSync()` - Load key-value pairs from disk synchronously (supports simple and splited modes)
  - `setSync(key, value)` - Set and persist key-value pair synchronously
  - `deleteSync(key)` - Delete and persist synchronously
  - `clearSync()` - Clear all keys synchronously
  - `discardSync()` - Reload from disk synchronously

- Added synchronous file handlers:
  - `JsonHandler.readSync()` - Read JSON files synchronously
  - `JsonHandler.writeSync()` - Write JSON files synchronously
  - `YamlHandler.readSync()` - Read YAML files synchronously
  - `YamlHandler.writeSync()` - Write YAML files synchronously

#### Documentation
- Added complete examples for synchronous configuration loading:
  - `examples/10-sync-config.ts` - Basic synchronous operations examples
  - `examples/11-real-world-config.ts` - Real-world application integration patterns
- Added comprehensive documentation in `docs/SYNC_OPERATIONS.md`
- Updated README.md with synchronous operations section
- Added release notes in `docs/RELEASE_v1.2.0.md`

#### Tests
- Added 37 new tests for synchronous operations
- Improved test coverage to 96.31% (from ~94%)
- Added tests for both YAML and JSON formats
- Added tests for simple and splited Dictionary modes

### Changed
- Updated README.md to reflect new synchronous capabilities
- Updated examples documentation

### Fixed
- Improved test coverage for Dictionary.ts from 88% to 95%

### Important Notes

WARNING: **Synchronous methods bypass file locking** and should only be used in single-threaded contexts such as:
- Application startup (before concurrent access)
- CLI tools and scripts
- Initial configuration loading (e.g., application bootstrap)

Do NOT use synchronous methods during application runtime with concurrent access.

## [1.1.0] - Previous release

(Previous changelog entries...)

---

[1.2.0]: https://github.com/nmeunier/nosql-file/compare/v1.1.0...v1.2.0
