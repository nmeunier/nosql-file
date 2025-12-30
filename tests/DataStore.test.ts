import * as path from 'path';
import * as fs from 'fs/promises';
import { Collection } from '../src/core/Collection';
import { Dictionary } from '../src/core/Dictionary';

describe('DataStore', () => {
  const testDataPath = path.join(__dirname, '../data/test-datastore');

  beforeAll(async () => {
    await fs.mkdir(testDataPath, { recursive: true });
  });

  afterEach(async () => {
    try {
      const files = await fs.readdir(testDataPath);
      for (const file of files) {
        const filePath = path.join(testDataPath, file);
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
          await fs.rm(filePath, { recursive: true });
        } else {
          await fs.unlink(filePath);
        }
      }
    } catch {
      // Directory might not exist
    }
  });

  afterAll(async () => {
    try {
      await fs.rm(testDataPath, { recursive: true });
    } catch {
      // Directory might not exist
    }
  });

  describe('discard()', () => {
    it('should discard in-memory changes in Collection', async () => {
      const collection = new Collection<{ name: string }>('test', testDataPath, 'yaml');
      await collection.load();

      await collection.insert({ name: 'Alice' });
      expect(collection.getAll()).toHaveLength(1);

      await collection.insert({ name: 'Bob' }, { mode: 'memory' });
      expect(collection.getAll()).toHaveLength(2);

      await collection.discard();
      expect(collection.getAll()).toHaveLength(1);
      expect(collection.getAll()[0]?.name).toBe('Alice');
    });

    it('should discard in-memory changes in Dictionary', async () => {
      const dict = new Dictionary('config', testDataPath, 'yaml');
      await dict.load();

      await dict.set('key1', 'value1');
      expect(dict.get('key1')).toBe('value1');

      await dict.set('key2', 'value2', { mode: 'memory' });
      expect(dict.get('key2')).toBe('value2');

      await dict.discard();
      expect(dict.get('key1')).toBe('value1');
      expect(dict.get('key2')).toBeUndefined();
    });
  });

  describe('getFileLockManager()', () => {
    it('should return the FileLockManager instance from Collection', async () => {
      const collection = new Collection<{ id: number }>('test', testDataPath, 'yaml');
      await collection.load();

      const lockManager = collection.getFileLockManager();
      expect(lockManager).toBeDefined();
      expect(typeof lockManager.acquireReadLock).toBe('function');
      expect(typeof lockManager.acquireWriteLock).toBe('function');
    });

    it('should return the FileLockManager instance from Dictionary', async () => {
      const dict = new Dictionary('config', testDataPath, 'yaml');
      await dict.load();

      const lockManager = dict.getFileLockManager();
      expect(lockManager).toBeDefined();
      expect(typeof lockManager.acquireReadLock).toBe('function');
      expect(typeof lockManager.acquireWriteLock).toBe('function');
    });
  });
});
