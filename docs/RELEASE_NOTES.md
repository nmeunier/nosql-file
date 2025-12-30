# nosql-file v1.1.0

## New Features

### Metadata Support

Collections and Dictionaries now support metadata storage in separate files, keeping your data files clean while allowing you to track version information, timestamps, tags, and custom fields.

**Key Features:**
- **Automatic timestamps**: `createdAt` and `updatedAt` are automatically managed
- **Version tracking**: Track schema versions for migrations
- **Tags**: Categorize your data stores
- **Custom fields**: Add any custom metadata you need
- **Separate files**: Metadata stored in `.meta.yaml` or `.meta.json` files

**Example:**

```typescript
const users = await db.collection('users');

// Set metadata
await users.setMeta({
  version: 1,
  tags: ['users', 'authentication'],
  custom: { author: 'John Doe' }
});

// Get metadata (includes auto-updated timestamps)
const meta = await users.getMeta();
console.log(meta.createdAt);  // ISO 8601 timestamp
console.log(meta.updatedAt);  // Updated on each sync
```

**File Structure:**
```
data/
  users.yaml       # Your data
  users.meta.yaml  # Metadata (separate)
```

**API Methods:**
- `setMeta(metadata: Partial<Metadata>)`: Set or update metadata
- `getMeta()`: Get metadata
- `getAllMeta()`: Get all metadata (alias)

**Documentation:**
- See [METADATA.md](METADATA.md) for complete documentation
- See [examples/07-metadata.ts](examples/07-metadata.ts) for basic usage
- See [examples/08-schema-migration.ts](examples/08-schema-migration.ts) for version tracking

### Generic Collection Type Support

The `collection()` method is now generic, allowing for proper TypeScript type inference:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const users = await db.collection<User>('users');
// users is now typed as Collection<User>
```

## Improvements

- 10 comprehensive examples added in `examples/` directory covering all library features
- Improved TypeScript type safety with `unknown` instead of `any`
- Better documentation with complete API examples

## Test Coverage

- **193 passing tests** (up from 181)
- 95%+ code coverage maintained

## Breaking Changes

None - This release is fully backward compatible

---

# nosql-file v1.0.1

## Breaking Changes

### Class Rename: Database → NoSqlFile

The main class has been renamed from `Database` to `NoSqlFile` to avoid naming conflicts with existing database libraries and improve clarity.

**Migration Guide:**

```typescript
// Before (v1.0.0)
import { Database } from 'nosql-file';
const db = new Database('./data');

// After (v1.0.1)
import { NoSqlFile } from 'nosql-file';
const db = new NoSqlFile('./data');
```

**Note:** All functionality remains identical - only the class name has changed. This is a simple find-and-replace operation in your codebase.

## What's Included

- **NoSqlFile** class (formerly Database)
- **Collection** class (array-based storage)
- **Dictionary** class (key-value storage)
- Full TypeScript support with generics
- YAML and JSON formats
- File locking for concurrent access (read/write locks)
- Multiple write modes (async, fast, memory)
- Event emitters for observability
- Splited dictionary mode for large datasets
- 181 passing tests with 95%+ coverage

## Bug Fixes

None in this release.

## Documentation

- Updated all code examples to use `NoSqlFile`
- Updated API documentation
- Added comprehensive migration guide

## Getting Started

```bash
npm install nosql-file
```

```typescript
import { NoSqlFile } from 'nosql-file';

const db = new NoSqlFile('./data');
const config = await db.dictionary('config');
await config.set('theme', 'dark');
```

## Notes

- Recommended Node.js: >=18 (LTS)
- For multi-process scenarios, prefer a shared volume; locks are in-process
- See [README](https://github.com/nmeunier/nosql-file#readme) for best practices and limitations

## Full Changelog

See [CHANGELOG](https://github.com/nmeunier/nosql-file#changelog) for complete version history.

## Thank You

Thank you for using nosql-file! If you encounter any issues, please [open an issue](https://github.com/nmeunier/nosql-file/issues) on GitHub.

---

# nosql-file v1.0.0

A lightweight, file-based data store for Node.js focused on configurations and small datasets, with YAML/JSON serialization and safe concurrent writes.

## Highlights
- Collections (array-based) and Dictionaries (key-value)
- YAML and JSON formats with automatic serialization
- Write modes: async (default), fast (background), memory-only
- File-level locking with read/write locks (FIFO, timeouts)
- Splited dictionary mode: one file per key for large values
- Full TypeScript support
- Extensive test coverage (181 tests)
- CI/CD: GitHub Actions for tests/build + npm publish on tags

## Getting Started
```bash
npm install nosql-file
```

```ts
import { Database } from 'nosql-file';
const db = new Database('./data');
const config = await db.dictionary('config');
await config.set('theme', 'dark');
```

## Notes
- Recommended Node.js: >=18 (LTS)
- For multi-process scenarios, prefer a shared volume; locks are in-process
- See README for best practices and limitations
