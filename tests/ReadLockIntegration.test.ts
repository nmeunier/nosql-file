import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { NoSqlFile } from '../src/core/Database';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Read Lock Integration - Collection', () => {
  const testDataPath = path.join(__dirname, '../data/read-lock');
  let db: NoSqlFile;

  beforeEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
    await fs.mkdir(testDataPath, { recursive: true });
    db = new NoSqlFile(testDataPath);
  });

  afterEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
  });

  test('Collection.load() waits for active write lock', async () => {
    const users = await db.collection('users');
    await users.insert({ id: 1, name: 'Alice' });

    // Compute file path for users collection (yaml default)
    const filePath = path.join(testDataPath, 'users.yaml');

    // Acquire a write lock to simulate ongoing write
    const releaseWrite = await db.getFileLockManager().acquireWriteLock(filePath);

    let finished = false;
    const p = users.discard().then(() => {
      finished = true;
    });

    // Give time for discard to attempt load and get queued on read lock
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(finished).toBe(false);

    // Release the write lock so read can proceed
    releaseWrite();

    await p;
    expect(finished).toBe(true);
  });
});

describe('Read Lock Integration - Dictionary (splited)', () => {
  const testDataPath = path.join(__dirname, '../data/read-lock');
  let db: NoSqlFile;

  beforeEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
    await fs.mkdir(testDataPath, { recursive: true });
    db = new NoSqlFile(testDataPath);
  });

  afterEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
  });

  test('Dictionary.load() (splited) waits for active write lock on directory', async () => {
    const cache = await db.dictionary('cache', { splited: true });
    await cache.set('theme', 'dark'); // ensure directory exists

    const dirPath = path.join(testDataPath, 'cache');

    // Acquire a write lock for the directory
    const releaseWrite = await db.getFileLockManager().acquireWriteLock(dirPath);

    let finished = false;
    const p = cache.discard().then(() => {
      finished = true;
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(finished).toBe(false);

    releaseWrite();

    await p;
    expect(finished).toBe(true);
  });
});
