# nosql-file

[![npm version](https://img.shields.io/npm/v/nosql-file)](https://www.npmjs.com/package/nosql-file)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://github.com/nmeunier/nosql-file/workflows/Tests%20%26%20Build/badge.svg)](https://github.com/nmeunier/nosql-file/actions)
[![codecov](https://codecov.io/gh/nmeunier/nosql-file/branch/main/graph/badge.svg?token=YOUR_CODECOV_TOKEN)](https://codecov.io/gh/nmeunier/nosql-file)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen.svg)](https://nodejs.org/)

A flexible, file-based data storage library for Node.js with support for YAML and JSON formats, featuring concurrent access control, multiple write modes, and both array and key-value storage options.

## Features

- **Dual Storage Types**: Collections (array-based) and Dictionaries (key-value)
- **Multiple Formats**: YAML and JSON support with automatic serialization
- **Write Modes**: Async, fast (background), and memory-only modes
- **File Locking**: Built-in concurrent access control with FileLockManager
- **Splited Mode**: Store dictionary values in separate files for better performance with large datasets
- **Event Emitters**: Observable writes and errors for reactive applications
- **Type-Safe**: Full TypeScript support with generics
- **No Dependencies**: Core functionality with minimal external dependencies
- **Comprehensive Testing**: 172 tests with 95%+ code coverage

## Installation

```bash
npm install nosql-file
```

## Quick Start

### Basic Usage with Collections

```typescript
import { Database } from 'nosql-file';

// Create a database instance
const db = new Database('./data');

// Get a collection (array-based storage)
const users = await db.collection('users');

// Insert documents
await users.insert({ id: 1, name: 'Alice', age: 30 });
await users.insert({ id: 2, name: 'Bob', age: 25 });

// Query documents
const adults = users.find({ age: 30 });
console.log(adults); // [{ id: 1, name: 'Alice', age: 30 }]

// Update documents
await users.update({ id: 1 }, { age: 31 });

// Delete documents
await users.delete({ id: 2 });

// Get all documents
const all = users.getAll();
console.log(`Total users: ${users.count()}`);

// Clear all data
await users.clear();
```

### Basic Usage with Dictionaries

```typescript
import { Database } from 'nosql-file';

const db = new Database('./data');

// Get a dictionary (key-value storage)
const config = await db.dictionary('config');

// Set key-value pairs
await config.set('apiUrl', 'https://api.example.com');
await config.set('timeout', 5000);
await config.set('debug', true);

// Get values
const apiUrl = config.get('apiUrl');

// Check existence
if (config.has('timeout')) {
  console.log(`Timeout: ${config.get('timeout')}ms`);
}

// List all keys/values
const keys = config.keys();
const allValues = config.values();

// Delete a key
await config.delete('debug');

// Get all data
const all = config.getAll();

// Clear all
await config.clear();
```

## API Documentation

### Database

Main class for managing collections and dictionaries.

#### Constructor

```typescript
const db = new Database(dataPath, options);
```

- `dataPath`: Directory where data files will be stored
- `options.format`: 'yaml' or 'json' (default: 'yaml')

#### Methods

- `collection(name)`: Promise<Collection> - Get or create a collection
- `dictionary(name, options)`: Promise<Dictionary> - Get or create a dictionary
  - `options.splited`: boolean - Use splited mode (default: false)
- `syncAll()`: Promise<void> - Sync all collections and dictionaries to disk
- `discardAll()`: Promise<void> - Reload all data from disk, discarding changes
- `dropCollection(name)`: Promise<void> - Delete a collection and its data
- `dropDictionary(name, options)`: Promise<void> - Delete a dictionary and its data
- `close()`: Promise<void> - Sync all pending writes before closing

### Collection

Generic array-based document storage.

#### Constructor

```typescript
const collection = new Collection<T>(name, dataPath, format, fileLockManager);
```

- `name`: Collection name (used as filename)
- `dataPath`: Directory path
- `format`: 'yaml' or 'json' (default: 'yaml')
- `fileLockManager`: Optional custom lock manager

#### Methods

- `insert(document, options)`: Promise<void> - Add a document
- `find(query)`: T[] - Find documents matching query (empty query returns all)
- `update(query, updates, options)`: Promise<void> - Update matching documents
- `delete(query, options)`: Promise<void> - Delete matching documents
- `getAll()`: T[] - Get all documents
- `count()`: number - Get document count
- `clear(options)`: Promise<void> - Delete all documents
- `sync()`: Promise<void> - Manually sync to disk
- `discard()`: Promise<void> - Reload from disk, discarding changes
- `drop()`: Promise<void> - Delete the collection file and clear memory

#### Events

- `written` - Emitted after successful sync
- `error` - Emitted when an error occurs

### Dictionary

Key-value storage with two modes.

#### Constructor

```typescript
const dict = new Dictionary(name, dataPath, format, splited, fileLockManager);
```

- `name`: Dictionary name
- `dataPath`: Directory path
- `format`: 'yaml' or 'json' (default: 'yaml')
- `splited`: Use splited mode - one file per key (default: false)
- `fileLockManager`: Optional custom lock manager

#### Methods

- `set(key, value, options)`: Promise<void> - Set a key-value pair
- `get(key)`: unknown - Get value by key
- `delete(key, options)`: Promise<void> - Delete a key
- `has(key)`: boolean - Check if key exists
- `keys()`: string[] - Get all keys
- `values()`: unknown[] - Get all values
- `getAll()`: Record<string, unknown> - Get all data
- `clear(options)`: Promise<void> - Delete all keys
- `sync(specificKey)`: Promise<void> - Manually sync to disk
- `discard()`: Promise<void> - Reload from disk, discarding changes
- `drop()`: Promise<void> - Delete the dictionary file/directory and clear memory

#### Events

- `written` - Emitted after successful sync
- `error` - Emitted when an error occurs

### Write Modes

All write operations (insert, update, delete, set, etc.) support an `options` parameter with a `mode` property:

```typescript
// Async mode (default) - wait for write completion
await collection.insert(doc, { mode: 'async' });

// Fast mode - fire and forget, write in background
await collection.insert(doc, { mode: 'fast' });

// Memory mode - only update in-memory, no disk write
await collection.insert(doc, { mode: 'memory' });
```

## Advanced Usage

### Typed Collections

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

const users = await db.collection<User>('users');

// Type-safe operations
await users.insert({
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  age: 30
});

const result = users.find({ age: 30 });
// result is User[]
```

### Splited Mode (Large Values)

For dictionaries with large or numerous values, use splited mode:

```typescript
// Each key stored in separate file
const cache = await db.dictionary('cache', { splited: true });

await cache.set('largeData', { /* large object */ });
await cache.set('config', { /* another object */ });

// More efficient for partial updates
await cache.set('config', newConfigValue);
```

### Event Handling

```typescript
const collection = await db.collection('users');

collection.on('written', () => {
  console.log('Data successfully saved');
});

collection.on('error', (error) => {
  console.error('Write error:', error);
});

await collection.insert({ name: 'Alice' });
```

### Error Handling

```typescript
const collection = await db.collection('users');

try {
  await collection.insert({ name: 'Bob' });
} catch (error) {
  console.error('Failed to insert:', error);
}
```

### Concurrent Access

File locking automatically handles concurrent access:

```typescript
const dict = await db.dictionary('shared');

// Multiple concurrent writes are automatically queued
Promise.all([
  dict.set('key1', 'value1'),
  dict.set('key2', 'value2'),
  dict.set('key3', 'value3')
]);
```

## Storage Structure

### Simple Collection/Dictionary

```
./data/
  users.yaml        # All users in one file
  config.yaml       # All config in one file
```

### Splited Dictionary

```
./data/
  cache/            # Cache dictionary directory
    user_1.yaml
    user_2.yaml
    user_3.yaml
```

## Configuration

### Default Behavior

- Format: YAML
- Collection: array-based storage, single file per collection
- Dictionary: key-value storage, single file per dictionary
- Write mode: async (wait for completion)
- Lock timeout: 5 seconds

### Custom FileLockManager

```typescript
import { FileLockManager } from 'nosql-file';

const lockManager = new FileLockManager();
const collection = new Collection('users', './data', 'yaml', lockManager);
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm test -- --coverage
```

## Performance Considerations

1. **Splited Mode**: Use for dictionaries with large or numerous values
2. **Fast Mode**: Use when fire-and-forget is acceptable (background writes)
3. **Memory Mode**: Use for temporary changes before explicit sync
4. **Batch Operations**: Group multiple operations before syncing

## Limitations

- File-based storage is slower than in-memory databases
- Not suitable for high-frequency write operations (thousands per second)
- Best suited for configuration, caching, and moderate data persistence
- Large datasets should use splited mode for dictionaries

## Data Formats

### YAML Format

Clean, human-readable format. Default choice.

```yaml
- id: 1
  name: Alice
  age: 30
- id: 2
  name: Bob
  age: 25
```

### JSON Format

Standard JSON format. Use when YAML is not preferred.

```json
[
  { "id": 1, "name": "Alice", "age": 30 },
  { "id": 2, "name": "Bob", "age": 25 }
]
```

## Best Practices

1. Always await database operations to ensure data consistency
2. Use typed collections for better type safety
3. Handle errors appropriately with try/catch
4. Call `db.close()` before application shutdown
5. Use splited mode for dictionaries with large values
6. Prefer async mode for critical writes, fast mode for non-critical
7. Monitor the 'error' event for production applications

## License

MIT

## Contributing

Contributions are welcome. Please ensure tests pass and coverage remains above 95%.

## Changelog

### Version 1.0.0

- Initial release
- Collection and Dictionary support
- YAML and JSON formats
- File locking for concurrent access (read/write locks)
- Multiple write modes (async, fast, memory)
- Comprehensive test suite (181 tests)
- Full TypeScript support
- GitHub Actions CI/CD pipelines
