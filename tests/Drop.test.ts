import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { NoSqlFile } from '../src/core/Database';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Collection - Drop Operations', () => {
  const testDataPath = path.join(__dirname, '../data/test-drop');
  let db: NoSqlFile;

  beforeEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
    await fs.mkdir(testDataPath, { recursive: true });
    db = new NoSqlFile(testDataPath);
  });

  afterEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
  });

  test('should drop a collection and delete its file', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });
    await users.insert({ id: 2, name: 'Jane' });

    const filePath = path.join(testDataPath, 'users.yaml');
    let fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    // Drop the collection
    await users.drop();

    // File should be deleted
    fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(false);

    // Memory should be cleared
    expect(users.count()).toBe(0);
  });

  test('should handle dropping non-existent collection file', async () => {
    const users = await db.collection('users');

    // Don't insert anything, so no file is created
    // Should not throw
    await users.drop();

    expect(users.count()).toBe(0);
  });

  test('should drop collection with JSON format', async () => {
    const dbJson = new NoSqlFile(testDataPath, { format: 'json' });
    const users = await dbJson.collection('users');

    await users.insert({ id: 1, name: 'John' });

    const filePath = path.join(testDataPath, 'users.json');
    let fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    await users.drop();

    fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(false);
  });
});

describe('Dictionary - Drop Operations', () => {
  const testDataPath = path.join(__dirname, '../data/test-drop');
  let db: NoSqlFile;

  beforeEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
    await fs.mkdir(testDataPath, { recursive: true });
    db = new NoSqlFile(testDataPath);
  });

  afterEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
  });

  test('should drop a dictionary (simple mode) and delete its file', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark');
    await config.set('language', 'en');

    const filePath = path.join(testDataPath, 'config.yaml');
    let fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    // Drop the dictionary
    await config.drop();

    // File should be deleted
    fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(false);

    // Memory should be cleared
    expect(config.keys()).toHaveLength(0);
  });

  test('should drop a dictionary (splited mode) and delete its directory', async () => {
    const cache = await db.dictionary('cache', { splited: true });

    await cache.set('user1', { id: 1, name: 'John' });
    await cache.set('user2', { id: 2, name: 'Jane' });
    await cache.set('settings', { theme: 'dark' });

    const dirPath = path.join(testDataPath, 'cache');
    let dirExists = await fs.access(dirPath).then(() => true).catch(() => false);
    expect(dirExists).toBe(true);

    // Drop the dictionary
    await cache.drop();

    // Directory should be deleted
    dirExists = await fs.access(dirPath).then(() => true).catch(() => false);
    expect(dirExists).toBe(false);

    // Memory should be cleared
    expect(cache.keys()).toHaveLength(0);
  });

  test('should handle dropping non-existent dictionary file', async () => {
    const config = await db.dictionary('config');

    // Don't set anything, so no file is created
    // Should not throw
    await config.drop();

    expect(config.keys()).toHaveLength(0);
  });

  test('should handle dropping non-existent dictionary directory', async () => {
    const cache = await db.dictionary('cache', { splited: true });

    // Don't set anything, so no directory is created
    // Should not throw
    await cache.drop();

    expect(cache.keys()).toHaveLength(0);
  });
});

describe('NoSqlFile - Drop Methods', () => {
  const testDataPath = path.join(__dirname, '../data/test-drop');
  let db: NoSqlFile;

  beforeEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
    await fs.mkdir(testDataPath, { recursive: true });
    db = new NoSqlFile(testDataPath);
  });

  afterEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
  });

  test('should drop collection via NoSqlFile.dropCollection()', async () => {
    const users = await db.collection('users');
    await users.insert({ id: 1, name: 'John' });

    const filePath = path.join(testDataPath, 'users.yaml');
    let fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    // Drop via database method
    await db.dropCollection('users');

    // File should be deleted
    fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(false);

    // Creating new collection with same name should start fresh
    const newUsers = await db.collection('users');
    expect(newUsers.count()).toBe(0);
  });

  test('should drop dictionary via NoSqlFile.dropDictionary()', async () => {
    const config = await db.dictionary('config');
    await config.set('theme', 'dark');

    const filePath = path.join(testDataPath, 'config.yaml');
    let fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    // Drop via database method
    await db.dropDictionary('config');

    // File should be deleted
    fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(false);

    // Creating new dictionary with same name should start fresh
    const newConfig = await db.dictionary('config');
    expect(newConfig.keys()).toHaveLength(0);
  });

  test('should drop splited dictionary via NoSqlFile.dropDictionary()', async () => {
    const cache = await db.dictionary('cache', { splited: true });
    await cache.set('user1', { id: 1, name: 'John' });

    const dirPath = path.join(testDataPath, 'cache');
    let dirExists = await fs.access(dirPath).then(() => true).catch(() => false);
    expect(dirExists).toBe(true);

    // Drop via database method with splited option
    await db.dropDictionary('cache', { splited: true });

    // Directory should be deleted
    dirExists = await fs.access(dirPath).then(() => true).catch(() => false);
    expect(dirExists).toBe(false);
  });

  test('should handle dropping non-existent collection', async () => {
    // Should not throw
    await db.dropCollection('nonexistent');
  });

  test('should handle dropping non-existent dictionary', async () => {
    // Should not throw
    await db.dropDictionary('nonexistent');
  });

  test('should drop multiple collections', async () => {
    const users = await db.collection('users');
    const posts = await db.collection('posts');

    await users.insert({ id: 1, name: 'John' });
    await posts.insert({ id: 1, title: 'Hello' });

    await db.dropCollection('users');
    await db.dropCollection('posts');

    const usersPath = path.join(testDataPath, 'users.yaml');
    const postsPath = path.join(testDataPath, 'posts.yaml');

    const usersExists = await fs.access(usersPath).then(() => true).catch(() => false);
    const postsExists = await fs.access(postsPath).then(() => true).catch(() => false);

    expect(usersExists).toBe(false);
    expect(postsExists).toBe(false);
  });
});

describe('Drop with Memory Mode', () => {
  const testDataPath = path.join(__dirname, '../data/test-drop');
  let db: NoSqlFile;

  beforeEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
    await fs.mkdir(testDataPath, { recursive: true });
    db = new NoSqlFile(testDataPath);
  });

  afterEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
  });

  test('should drop collection with unsynced memory changes', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });
    await users.insert({ id: 2, name: 'Jane' }, { mode: 'memory' });
    await users.insert({ id: 3, name: 'Bob' }, { mode: 'memory' });

    expect(users.count()).toBe(3);

    // Drop should remove file and clear all memory
    await users.drop();

    expect(users.count()).toBe(0);

    const filePath = path.join(testDataPath, 'users.yaml');
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(false);
  });

  test('should drop dictionary with unsynced memory changes', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark');
    await config.set('language', 'en', { mode: 'memory' });
    await config.set('debug', true, { mode: 'memory' });

    expect(config.keys()).toHaveLength(3);

    // Drop should remove file and clear all memory
    await config.drop();

    expect(config.keys()).toHaveLength(0);

    const filePath = path.join(testDataPath, 'config.yaml');
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(false);
  });
});

describe('Drop - Edge Cases and Error Handling', () => {
  const testDataPath = path.join(__dirname, '../data/test-drop-edge');
  let db: NoSqlFile;

  beforeEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
    await fs.mkdir(testDataPath, { recursive: true });
    db = new NoSqlFile(testDataPath);
  });

  afterEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
  });

  test('should handle drop on file with permission errors', async () => {
    const users = await db.collection('users');
    await users.insert({ id: 1, name: 'John' });

    const dirPath = testDataPath;

    // Make the parent directory read-only on Unix systems to prevent file deletion
    if (process.platform !== 'win32') {
      await fs.chmod(dirPath, 0o555);

      // Drop should throw because of permission denied (cannot delete file in read-only directory)
      await expect(users.drop()).rejects.toThrow();

      // Restore permissions for cleanup
      await fs.chmod(dirPath, 0o755);
    } else {
      // On Windows, just verify drop works normally
      await users.drop();
      expect(users.count()).toBe(0);
    }
  });

  test('should successfully drop splited dictionary directory', async () => {
    const cache = await db.dictionary('cache', { splited: true });

    // Add multiple keys to create multiple files
    await cache.set('key1', { data: 'value1' });
    await cache.set('key2', { data: 'value2' });
    await cache.set('key3', { data: 'value3' });

    const dirPath = path.join(testDataPath, 'cache');

    // Verify directory exists with files
    const files = await fs.readdir(dirPath);
    expect(files.length).toBe(3);

    // Drop should remove entire directory
    await cache.drop();

    const dirExists = await fs.access(dirPath).then(() => true).catch(() => false);
    expect(dirExists).toBe(false);
    expect(cache.keys()).toHaveLength(0);
  });

  test('should handle drop when file is locked by another operation', async () => {
    const users = await db.collection('users');
    await users.insert({ id: 1, name: 'John' });

    // Start a slow write operation to hold the lock
    const slowWrite = users.insert({ id: 2, name: 'Jane' });

    // Try to drop while write is in progress
    // Both operations should complete without deadlock
    await Promise.all([slowWrite, users.drop()]);

    // After drop, collection should be empty
    expect(users.count()).toBe(0);
  });

  test('should handle concurrent drops safely', async () => {
    const users = await db.collection('users');
    await users.insert({ id: 1, name: 'John' });

    // Multiple concurrent drop attempts should not cause errors
    await Promise.all([
      users.drop(),
      users.drop(),
      users.drop()
    ]);

    expect(users.count()).toBe(0);
  });

  test('should drop and allow immediate recreation', async () => {
    const users = await db.collection('users');
    await users.insert({ id: 1, name: 'John' });

    expect(users.count()).toBe(1);

    // Drop collection
    await users.drop();
    expect(users.count()).toBe(0);

    // Immediately insert new data
    await users.insert({ id: 2, name: 'Jane' });
    expect(users.count()).toBe(1);

    // Verify the new data
    const found = users.find({ id: 2 });
    expect(found).toHaveLength(1);
    expect(found[0]?.name).toBe('Jane');
  });

  test('should clear dirty keys tracking on dictionary drop (splited mode)', async () => {
    const cache = await db.dictionary('cache', { splited: true });

    // Set values with memory mode to create dirty keys
    await cache.set('key1', 'value1');
    await cache.set('key2', 'value2', { mode: 'memory' });
    await cache.set('key3', 'value3', { mode: 'memory' });

    // Drop should clear everything including dirty keys tracking
    await cache.drop();

    expect(cache.keys()).toHaveLength(0);

    // After drop, new operations should work normally
    await cache.set('newKey', 'newValue');
    expect(cache.get('newKey')).toBe('newValue');
  });

  test('should handle drop on collection after multiple operations', async () => {
    const users = await db.collection('users');

    // Perform various operations
    await users.insert({ id: 1, name: 'Alice' });
    await users.insert({ id: 2, name: 'Bob' });
    await users.update({ id: 1 }, { name: 'Alice Updated' });
    await users.delete({ id: 2 });
    await users.insert({ id: 3, name: 'Charlie' }, { mode: 'memory' });

    expect(users.count()).toBe(2);

    // Drop should clear everything
    await users.drop();

    expect(users.count()).toBe(0);
    expect(users.getAll()).toEqual([]);
  });
});
