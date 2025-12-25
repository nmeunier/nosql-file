# NoSQL YAML Database Library - Specifications

## 1. Overview
TypeScript library that emulates a NoSQL database with persistence in YAML/JSON files.

**Environment:** Node.js only (not for browsers or frontend frameworks)

## 2. Core Features

### 2.1 Supported Data Types
- **Collections**: Arrays of objects (equivalent to tables), supports nested objects and arrays (structure is preserved, not flattened)
- **Dictionaries**: Key-value objects, values can be scalars, objects, or arrays (structure is preserved)

### 2.2 CRUD Operations
- **Create**: Insert documents
- **Read**: Retrieve documents with filtering
- **Update**: Modify existing documents
- **Delete**: Remove documents

### 2.3 Persistence
- Load YAML files into memory at startup
- Work with in-memory data structures for performance
- Write to disk using configurable strategies (async, fast, or memory-only)
- Support manual synchronization for memory-mode data

## 3. Architecture

### 3.1 Main Classes
- `Database`: Main manager for the database instance
- `Collection`: Manages arrays of documents
- `Dictionary`: Manages key-value objects

### 3.2 Project Structure
```
project/
├── src/
│   ├── core/
│   │   ├── Database.ts
│   │   ├── Collection.ts
│   │   └── Dictionary.ts
│   ├── utils/
│   │   └── YamlHandler.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── docs/
│   └── SPECIFICATIONS.md
├── package.json
├── tsconfig.json
└── README.md
```

### 3.3 Data Storage Structure

#### Collections
```
data/
├── users.yaml          # Array of user objects (YAML format)
├── products.json       # Array of product objects (JSON format)
```

#### Dictionaries: Simple Mode
Store the entire dictionary in a single file (YAML or JSON):

```
data/
├── metadata.yaml       # Single file with all key-value pairs (YAML)
├── preferences.json    # Single file with all key-value pairs (JSON)
```

**Example `metadata.yaml`:**
```yaml
theme: dark
language: en
debug: true
api_key: secret123
```

**Example `preferences.json`:**
```json
{
  "theme": "dark",
  "language": "en",
  "debug": true,
  "api_key": "secret123"
}
```

#### Dictionaries: Splited Mode
For dictionaries storing large objects or arrays, use a folder-based structure where each key-value pair becomes a separate file (YAML or JSON):

```
data/
├── config/             # Dictionary folder (splited mode)
│   ├── theme.yaml
│   ├── userSettings.json
│   ├── debug.yaml
│   └── apiConfig.json
├── cache/              # Dictionary folder (splited mode)
│   ├── userData.json
│   └── sessionData.json
```

**Each file contains a complete value (can be scalar, object, or array):**
```yaml
# config/theme.yaml
dark
```

```json
// config/userSettings.json
{
  "notifications": true,
  "language": "en",
  "theme": {
    "primary": "#007bff",
    "secondary": "#6c757d"
  }
}
```

```json
// cache/userData.json
[
  { "id": 1, "name": "John", "email": "john@example.com" },
  { "id": 2, "name": "Jane", "email": "jane@example.com" }
]
```

## 4. Data Persistence Strategies

### 4.1 Memory-First Architecture
All collections and dictionaries are loaded into memory at initialization:
- Data is read from YAML files into memory structures
- All operations (insert, update, delete, find) work on in-memory data
- Write modes are specified per operation, not globally

### 4.2 Write Modes (per operation)

#### Async Mode (default)
```typescript
const db = new Database('./data');
const users = db.collection('users');

// Default behavior - waits for write completion
await users.insert({ id: 1, name: 'John' });

// Explicit async mode (same as default)
await users.insert({ id: 2, name: 'Jane' }, { mode: 'async' });

// Events are always emitted, can be listened to
users.on('written', () => console.log('Async write completed'));
users.on('error', (err) => console.error('Write failed:', err));
```

**Behavior:**
- Operation returns a Promise
- Waits for disk write completion before resolving
- Emits 'written' event when disk write succeeds
- Emits 'error' event if write fails
- Throws error if write fails
- **Default mode:** Used when no mode is specified
- Best for: Consistency-critical operations

#### Fast Mode
```typescript
const users = db.collection('users');

// Returns immediately, write happens in background
users.insert({ id: 1, name: 'John' }, { mode: 'fast' });

// Listen for write events
users.on('written', () => console.log('Saved to disk'));
users.on('error', (err) => console.error('Write failed:', err));
```

**Behavior:**
- Operation returns immediately (no Promise needed)
- Write to disk happens asynchronously in background
- Emits 'written' event when successfully saved
- Emits 'error' event if write fails
- Best for: Performance-first scenarios where eventual consistency is acceptable

#### Memory-Only Mode
```typescript
const users = db.collection('users');

// Memory-only mode - no automatic write
await users.insert({ id: 1, name: 'John' }, { mode: 'memory' });
await users.insert({ id: 2, name: 'Jane' }, { mode: 'memory' });

// Manual synchronization required
await users.sync(); // Writes both to disk
// or
await db.syncAll(); // Syncs all collections and dictionaries
```

**Behavior:**
- Operations only modify memory
- No automatic disk writes
- Explicit `sync()` or `syncAll()` writes data to disk
- Returns Promise that resolves when write completes
- Best for: Batch operations

### 4.3 Batch Operations & Memory-Only Mode

For batch operations, use memory mode to defer all writes until explicit sync:

```typescript
const users = db.collection('users');

// Use memory mode for batch operations
await users.insert({ id: 1, name: 'John' }, { mode: 'memory' });  // Stays in memory
await users.insert({ id: 2, name: 'Jane' }, { mode: 'memory' });  // Stays in memory
await users.insert({ id: 3, name: 'Bob' }, { mode: 'memory' });   // Stays in memory
await users.sync();  // All writes go to disk together

// Back to normal operations with default async mode
await users.insert({ id: 4, name: 'Alice' });  // Immediate write
```

**Delete Optimization:**
- When deleting, items are removed from memory immediately
- Deleted item IDs are tracked internally
- During `sync()`, only tracked deletions are written to disk
- Avoids expensive re-serialization of all items
- Especially beneficial for large collections

**Default Behavior:**
- Default write mode: `'async'` (waits for write completion)
- Available modes: `'async'`, `'fast'`, `'memory'`
- All data is loaded into memory on Database initialization
- Collections and dictionaries maintain in-memory representation

### 5.1 Database Initialization

Create a new Database instance pointing to a data folder:

```typescript
// Default: YAML format
const db = new Database('./data');

// Specify JSON format
const dbJson = new Database('./data', { format: 'json' });

// Specify YAML format explicitly
const dbYaml = new Database('./data', { format: 'yaml' });
```

The `./data` folder will contain:
- `collectionName.yaml` (or `.json`) for each collection
- `dictionaryName.yaml` (or `.json`) for each dictionary (simple mode)
- `dictionaryName/` folder with individual files for each key-value pair (splited mode)

### 5.2 Collection Operations
```typescript
// Create/access collection
const users = db.collection('users');

// Insert - uses default async mode
await users.insert({ id: 1, name: 'John' });

// Insert with explicit fast mode
users.insert({ id: 2, name: 'Jane' }, { mode: 'fast' });

// Find (no write mode needed)
users.find({ name: 'John' });

// Update - uses default async mode
await users.update({ id: 1 }, { name: 'Jane' });

// Update with explicit mode
await users.update({ id: 1 }, { name: 'Jane' }, { mode: 'fast' });

// Delete - uses default async mode
await users.delete({ id: 1 });
```

### 5.3 Dictionary Operations

#### Simple Mode
```typescript
// Create/access dictionary (simple mode - single file, persistent by default)
const config = db.dictionary('config');

// Set - uses default async mode
await config.set('theme', 'dark');

// Get
config.get('theme');

// Update - uses default async mode
await config.set('theme', 'light');

// Update with explicit fast mode
config.set('theme', 'light', { mode: 'fast' });

// Delete - uses default async mode
await config.delete('theme');
```

#### Splited Mode
```typescript
// Create/access dictionary in splited mode (folder-based, for storing large objects/arrays)
const cache = db.dictionary('cache', { splited: true });

// Set - can store complex objects or arrays
await cache.set('userData', [
  { id: 1, name: 'John', email: 'john@example.com' },
  { id: 2, name: 'Jane', email: 'jane@example.com' }
]);

// Get
cache.get('userData'); // Returns the array

// Set - can store nested objects
await cache.set('userSettings', {
  notifications: true,
  language: 'en',
  theme: { primary: '#007bff', secondary: '#6c757d' }
});

// Get
cache.get('userSettings'); // Returns the nested object

// Update with explicit fast mode
cache.set('userData', updatedArray, { mode: 'fast' });

// Delete
await cache.delete('userData');
```

## 6. Public API Reference

### 6.1 Database Methods

#### Constructor
- `constructor(dataPath: string, options?: DatabaseOptions)`
  - `dataPath`: Path to the directory where all data files are stored
  - `options.format`: File format ('yaml' or 'json', default: 'yaml')

#### Collection Management
- `collection(name: string): Collection`
  - Get or create a collection

#### Dictionary Management
- `dictionary(name: string, options?: DictionaryOptions): Dictionary`
  - Get or create a dictionary
  - `options.splited`: Use folder-based storage for large objects (default: false)

#### Synchronization
- `async syncAll(): Promise<void>`
  - Synchronize all collections and dictionaries to disk
  - Flushes all deferred writes

#### Cleanup
- `close(): void`
  - Close the database and release resources
  - Flushes pending writes if any

### 6.2 Collection Methods

#### Create/Insert
- `async insert(document: any, options?: WriteOptions): Promise<void>`
  - Add a new document to the collection
  - `options.mode`: 'async' (default), 'fast', or 'memory'
  - Default behavior: waits for write completion ('async' mode)
  - Use 'memory' mode for batch operations without automatic writes

#### Read/Find
- `find(query?: QueryObject): any[]`
  - Find documents matching the query
  - Query supports simple property matching (property = value)
  - Returns array of matching documents
  - If no query provided, returns all documents
  - All properties in query object must match (AND logic)

**Example:**
```typescript
const users = db.collection('users');

// Find all users
users.find();

// Find users with name = 'John'
users.find({ name: 'John' });

// Find users matching multiple properties (AND)
users.find({ name: 'John', age: 30 });

// Returns empty array if no matches
users.find({ name: 'NonExistent' }); // []
```

#### Update
- `async update(query: QueryObject, updates: any, options?: WriteOptions): Promise<void>`
  - Update documents matching the query
  - Applies updates to all matching documents
  - `options.mode`: 'async' (default), 'fast', or 'memory'

#### Delete
- `async delete(query: QueryObject, options?: WriteOptions): Promise<void>`
  - Delete documents matching the query
  - `options.mode`: 'async' (default), 'fast', or 'memory'

#### Utilities
- `getAll(): any[]`
  - Get all documents in the collection

- `count(): number`
  - Get the number of documents in the collection

- `clear(): void`
  - Clear all documents from the collection (memory only until sync)

- `async sync(): Promise<void>`
  - Synchronize collection data to disk
  - Writes all pending changes to disk

#### Events
- `on(event: 'written', listener: () => void): void`
  - Emitted when a write operation completes successfully

- `on(event: 'error', listener: (error: Error) => void): void`
  - Emitted when a write operation fails

### 6.3 Dictionary Methods

#### Set/Create
- `async set(key: string, value: any, options?: WriteOptions): Promise<void>`
  - Set or update a key-value pair
  - `options.mode`: 'async' (default), 'fast', or 'memory'
  - Default behavior: waits for write completion ('async' mode)
  - Use 'memory' mode for batch operations without automatic writes

#### Get/Read
- `get(key: string): any`
  - Get the value associated with a key
  - Returns undefined if key doesn't exist

#### Delete
- `async delete(key: string, options?: WriteOptions): Promise<void>`
  - Delete a key-value pair
  - `options.mode`: 'async' (default), 'fast', or 'memory'

#### Utilities
- `getAll(): Record<string, any>`
  - Get all key-value pairs as an object

- `keys(): string[]`
  - Get all keys in the dictionary

- `values(): any[]`
  - Get all values in the dictionary

- `has(key: string): boolean`
  - Check if a key exists

- `clear(): void`
  - Clear all key-value pairs (memory only until sync)

- `async sync(): Promise<void>`
  - Synchronize dictionary data to disk
  - Writes all pending changes to disk

#### Events
- `on(event: 'written', listener: () => void): void`
  - Emitted when a write operation completes successfully

- `on(event: 'error', listener: (error: Error) => void): void`
  - Emitted when a write operation fails

## 7. Concurrency & File Locking

To handle concurrent access to files safely:

### 7.1 Internal Lock Management
Each `Database` instance manages locks internally to prevent simultaneous writes to the same file:

```typescript
const db = new Database('./data');
```

- Lock management is per-instance (multiple Database instances can coexist)
- Implement in-memory lock queue per file path within the instance
- Each file operation (read/write/delete) acquires a lock before accessing
- Simple queue system: first-come, first-served for write operations
- Multiple concurrent reads allowed, but exclusive write access

### 7.2 Implementation Approach
- No external dependencies for locking
- Use native Node.js `fs/promises` module
- Lock management via in-memory Map structure per instance
- Automatic lock release after operation completion with timeout handling

### 7.3 Singleton Usage Pattern
To ensure a single Database instance across your application, create it in a service:

```typescript
// src/services/DatabaseService.ts
class DatabaseService {
  private static instance: Database;
  
  static getInstance(): Database {
    if (!this.instance) {
      this.instance = new Database('./data');
    }
    return this.instance;
  }
}

export default DatabaseService;
```

### 7.4 Conflict Resolution
- Last-write-wins strategy for concurrent updates
- Automatic retries on lock acquisition failures
- Configurable timeout for lock acquisition (default: 5 seconds)

## 8. Dependencies

### Minimal Dependencies
The library uses only essential packages:
- **yaml**: Parse and stringify YAML files (optional, required only for YAML format)
- **TypeScript**: Type safety and compilation (development only)

### Built-in Implementations
- File locking: Custom in-memory lock manager
- JSON format: Native JavaScript JSON module
- File operations: Node.js native `fs/promises` module
- Query engine: Simple property matching with dot notation support
- Error handling: File system error handling and event emission

## 9. Design Decisions

### 9.1 Data Structure
- **Nested objects**: Preserved as-is, no flattening or transformation
- **Collections**: Store documents with their complete structure (objects and arrays)
- **Dictionaries**: Store values of any type (scalars, objects, arrays) without transformation

### 9.2 File Handling
- **No chunking or lazy loading**: Complete files are loaded into memory
- **Loading strategy**: Collections and dictionaries are loaded on first access (lazy initialization)
- **Cache management**: In-memory data remains until Database instance is closed (no automatic eviction)

### 9.3 Testing Approach
- **Development methodology**: Test-Driven Development (TDD)
- **Tests must be written before implementation**
- **Coverage target**: All public API methods and edge cases

### 9.4 Validation
- **No schema validation**: Free-form structure allowed
- **No type constraints**: Documents can have any structure
- **Developer responsibility**: Application code must handle data validation

### 9.5 Future Features (Not Implemented)
- **Indexing**: No indexing strategy for now, linear search only
- **Transactions**: No transaction support
- **Query optimization**: Basic property matching only
