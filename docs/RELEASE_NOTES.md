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
