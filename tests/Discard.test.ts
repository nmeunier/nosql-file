import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { Database } from '../src/core/Database';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Collection - Discard Operations', () => {
  const testDataPath = path.join(__dirname, '../data/test-discard');
  let db: Database;

  beforeEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
    await fs.mkdir(testDataPath, { recursive: true });
    db = new Database(testDataPath);
  });

  afterEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
  });

  test('should discard memory-only changes in Collection', async () => {
    const users = await db.collection('users');

    // Insert with sync
    await users.insert({ id: 1, name: 'John' });

    // Insert in memory only
    await users.insert({ id: 2, name: 'Jane' }, { mode: 'memory' });
    await users.insert({ id: 3, name: 'Bob' }, { mode: 'memory' });

    expect(users.count()).toBe(3);

    // Discard memory changes
    await users.discard();

    // Should only have the synced document
    expect(users.count()).toBe(1);
    expect(users.getAll()[0]).toEqual({ id: 1, name: 'John' });
  });

  test('should discard updates made in memory mode', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });
    await users.insert({ id: 2, name: 'Jane' });

    // Update in memory only
    await users.update({ id: 1 }, { name: 'Johnny' }, { mode: 'memory' });

    const updated = users.find({ id: 1 });
    expect(updated[0]?.name).toBe('Johnny');

    // Discard changes
    await users.discard();

    const restored = users.find({ id: 1 });
    expect(restored[0]?.name).toBe('John');
  });

  test('should discard deletes made in memory mode', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });
    await users.insert({ id: 2, name: 'Jane' });

    // Delete in memory only
    await users.delete({ id: 1 }, { mode: 'memory' });
    expect(users.count()).toBe(1);

    // Discard changes
    await users.discard();

    // Both should be back
    expect(users.count()).toBe(2);
  });
});

describe('Dictionary - Discard Operations', () => {
  const testDataPath = path.join(__dirname, '../data/test-discard');
  let db: Database;

  beforeEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
    await fs.mkdir(testDataPath, { recursive: true });
    db = new Database(testDataPath);
  });

  afterEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
  });

  test('should discard memory-only changes in Dictionary (simple mode)', async () => {
    const config = await db.dictionary('config');

    // Set with sync
    await config.set('theme', 'dark');

    // Set in memory only
    await config.set('language', 'en', { mode: 'memory' });
    await config.set('debug', true, { mode: 'memory' });

    expect(config.keys()).toHaveLength(3);

    // Discard memory changes
    await config.discard();

    // Should only have the synced key
    expect(config.keys()).toHaveLength(1);
    expect(config.get('theme')).toBe('dark');
    expect(config.get('language')).toBeUndefined();
  });

  test('should discard updates made in memory mode in Dictionary', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark');
    await config.set('language', 'en');

    // Update in memory only
    await config.set('theme', 'light', { mode: 'memory' });
    expect(config.get('theme')).toBe('light');

    // Discard changes
    await config.discard();

    expect(config.get('theme')).toBe('dark');
  });

  test('should discard deletes made in memory mode in Dictionary', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark');
    await config.set('language', 'en');

    // Delete in memory only
    await config.delete('theme', { mode: 'memory' });
    expect(config.has('theme')).toBe(false);

    // Discard changes
    await config.discard();

    // Should be back
    expect(config.has('theme')).toBe(true);
    expect(config.get('theme')).toBe('dark');
  });

  test('should discard memory-only changes in Dictionary (splited mode)', async () => {
    const cache = await db.dictionary('cache', { splited: true });

    // Set user1 and ensure fully synced
    await cache.set('user1', { id: 1, name: 'John' });

    // Set in memory only (these won't be persisted)
    await cache.set('user2', { id: 2, name: 'Jane' }, { mode: 'memory' });
    await cache.set('user3', { id: 3, name: 'Bob' }, { mode: 'memory' });

    expect(cache.keys()).toHaveLength(3);

    // Discard all memory changes (will reload from disk files)
    // user2 and user3 were never synced, so they'll be lost
    await cache.discard();

    // Should only have user1 which was synced
    expect(cache.keys()).toHaveLength(1);
    expect(cache.get('user1')).toEqual({ id: 1, name: 'John' });
    expect(cache.get('user2')).toBeUndefined();
  });
});

describe('Database - Discard All', () => {
  const testDataPath = path.join(__dirname, '../data/test-discard');
  let db: Database;

  beforeEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
    await fs.mkdir(testDataPath, { recursive: true });
    db = new Database(testDataPath);
  });

  afterEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
  });

  test('should discard all collections and dictionaries', async () => {
    const users = await db.collection('users');
    const config = await db.dictionary('config');

    // Insert with sync
    await users.insert({ id: 1, name: 'John' });
    await config.set('theme', 'dark');

    // Insert in memory only
    await users.insert({ id: 2, name: 'Jane' }, { mode: 'memory' });
    await config.set('language', 'en', { mode: 'memory' });

    expect(users.count()).toBe(2);
    expect(config.keys()).toHaveLength(2);

    // Discard all
    await db.discardAll();

    expect(users.count()).toBe(1);
    expect(config.keys()).toHaveLength(1);
  });

  test('should handle discardAll with empty database', async () => {
    // Should not throw
    await db.discardAll();
  });

  test('should handle discardAll with no memory changes', async () => {
    const users = await db.collection('users');
    await users.insert({ id: 1, name: 'John' });

    await db.discardAll();

    // Should still have the data
    expect(users.count()).toBe(1);
  });
});
