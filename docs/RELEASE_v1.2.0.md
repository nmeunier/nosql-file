# Release Notes - v1.2.0

## New Feature: Synchronous Operations

### Overview

Added synchronous methods for `Collection` and `Dictionary` classes to support scenarios where configuration needs to be loaded synchronously, such as Application application startup.

### What's New

#### Synchronous Methods for Collection
- `loadSync()` - Load documents from disk synchronously
- `insertSync(document)` - Insert document and persist
- `updateSync(query, updates)` - Update matching documents  
- `deleteSync(query)` - Delete matching documents
- `clearSync()` - Clear all documents
- `discardSync()` - Reload from disk

#### Synchronous Methods for Dictionary
- `loadSync()` - Load key-value pairs from disk synchronously
- `setSync(key, value)` - Set and persist key-value pair
- `deleteSync(key)` - Delete and persist
- `clearSync()` - Clear all keys
- `discardSync()` - Reload from disk

#### Handler Utilities
- `JsonHandler.readSync()` / `writeSync()` - Synchronous JSON operations
- `YamlHandler.readSync()` / `writeSync()` - Synchronous YAML operations

### Use Cases

Perfect for:
- **Application configuration loading** at application startup
- **JWT secrets** and sensitive configuration
- **CLI tools** and scripts
- **Initial data seeding**
- **Feature flags** loaded before app starts

### Example: Application Configuration

```typescript
import { Dictionary } from 'nosql-file';

async function bootstrap() {
  // Load config synchronously before app creation
  const config = new Dictionary('config', './config', 'yaml');
  config.loadSync();
  
  const jwtSecret = config.get('JWT_SECRET') as string;
  const port = config.get('PORT') as number || 3000;
  
  process.env.JWT_SECRET = jwtSecret;
  
  const app = await NestFactory.create(AppModule);
  await app.listen(port);
}
```

### Important Safety Notes

**Synchronous methods bypass file locking** and should ONLY be used in:
- Single-threaded contexts (application startup)
- No concurrent file access scenarios
- Before async operations begin

**DO NOT use during:**
- Application runtime with concurrent users
- Request handlers or background jobs
- Mixed with async operations on the same instance

### Documentation

- New examples: `examples/10-application-config-sync.ts` and `examples/11-application-real-world.ts`
- Updated README with synchronous operations section
- New documentation: `docs/SYNC_OPERATIONS.md`

### Testing

- 260 tests passing (28 new tests for sync operations)
- 93.98% code coverage maintained
- Full test coverage for both simple and splited Dictionary modes

### Backward Compatibility

**100% backward compatible** - No breaking changes
- All existing async methods unchanged
- Synchronous methods are purely additive
- No changes to existing behavior

### What's Included

#### Source Files Modified
- `src/utils/JsonHandler.ts` - Added sync methods
- `src/utils/YamlHandler.ts` - Added sync methods
- `src/core/Collection.ts` - Added 6 sync methods
- `src/core/Dictionary.ts` - Added 6 sync methods + internal helpers

#### Tests Added
- `tests/Handlers.test.ts` - Sync handler tests
- `tests/Collection.test.ts` - Sync collection tests  
- `tests/Dictionary.test.ts` - Sync dictionary tests

#### Examples Added
- `examples/10-application-config-sync.ts` - Complete Application examples
- `examples/11-application-real-world.ts` - Real-world practical example

#### Documentation Added
- `docs/SYNC_OPERATIONS.md` - Complete implementation guide
- Updated `README.md` - Synchronous operations section
- Updated `examples/README.md` - New example listings

### Upgrade Guide

No changes required! Simply upgrade:

```bash
npm install nosql-file@^1.2.0
```

Then start using synchronous methods where appropriate:

```typescript
// Before (async - still works!)
const users = await db.collection('users');
await users.insert({ name: 'Alice' });

// After (sync - for startup only!)
const config = new Dictionary('config', './data');
config.loadSync();
const jwtSecret = config.get('JWT_SECRET');
```

### Bug Fixes

None - this is a feature-only release.

### Future Plans

Considering for future releases:
- Constructor option for "sync mode" 
- Batch sync operations
- Environment-based configuration profiles

### Contributors

- Implementation and documentation by the nosql-file team
- Inspired by real-world Application use cases

### License

MIT License - See LICENSE file

---

**Full Changelog**: [v1.1.0...v1.2.0](https://github.com/nmeunier/nosql-file/compare/v1.1.0...v1.2.0)

**Questions?** Open an issue on [GitHub](https://github.com/nmeunier/nosql-file/issues)
