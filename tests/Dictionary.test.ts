import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { NoSqlFile } from '../src/core/Database';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Dictionary - Basic Operations (Simple Mode)', () => {
  const testDataPath = path.join(__dirname, '../data/test');
  let db: NoSqlFile;

  beforeEach(async () => {
    // Clean test directory
    await fs.rm(testDataPath, { recursive: true, force: true });
    await fs.mkdir(testDataPath, { recursive: true });

    // Create database instance
    db = new NoSqlFile(testDataPath);
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(testDataPath, { recursive: true, force: true });
  });

  test('should set and get a key-value pair', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark');

    const value = config.get('theme');
    expect(value).toBe('dark');
  });

  test('should persist data to YAML file', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark');
    await config.set('language', 'en');

    // Check file exists
    const filePath = path.join(testDataPath, 'config.yaml');
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    // Check file content
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('theme: dark');
    expect(content).toContain('language: en');
  });

  test('should update existing key', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark');
    await config.set('theme', 'light');

    const value = config.get('theme');
    expect(value).toBe('light');
  });

  test('should return undefined for non-existent key', async () => {
    const config = await db.dictionary('config');

    const value = config.get('nonexistent');
    expect(value).toBeUndefined();
  });

  test('should delete a key-value pair', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark');
    await config.delete('theme');

    const value = config.get('theme');
    expect(value).toBeUndefined();
  });

  test('should persist deletion to disk', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark');
    await config.set('language', 'en');
    await config.delete('theme');

    const filePath = path.join(testDataPath, 'config.yaml');
    const content = await fs.readFile(filePath, 'utf-8');

    expect(content).not.toContain('theme');
    expect(content).toContain('language: en');
  });

  test('should store different value types', async () => {
    const config = await db.dictionary('config');

    await config.set('string', 'hello');
    await config.set('number', 42);
    await config.set('boolean', true);
    await config.set('null', null);

    expect(config.get('string')).toBe('hello');
    expect(config.get('number')).toBe(42);
    expect(config.get('boolean')).toBe(true);
    expect(config.get('null')).toBe(null);
  });

  test('should store objects and arrays', async () => {
    const config = await db.dictionary('config');

    const obj = { nested: { value: 'test' } };
    const arr = [1, 2, 3];

    await config.set('object', obj);
    await config.set('array', arr);

    expect(config.get('object')).toEqual(obj);
    expect(config.get('array')).toEqual(arr);
  });
});

describe('Dictionary - JSON Format', () => {
  const testDataPath = path.join(__dirname, '../data/test');
  let db: NoSqlFile;

  beforeEach(async () => {
    // Clean test directory
    await fs.rm(testDataPath, { recursive: true, force: true });
    await fs.mkdir(testDataPath, { recursive: true });

    // Create database instance with JSON format
    db = new NoSqlFile(testDataPath, { format: 'json' });
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(testDataPath, { recursive: true, force: true });
  });

  test('should set and get in JSON format', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark');

    const value = config.get('theme');
    expect(value).toBe('dark');
  });

  test('should persist data to JSON file', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark');
    await config.set('language', 'en');

    // Check file exists
    const filePath = path.join(testDataPath, 'config.json');
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    // Check file content
    const content = await fs.readFile(filePath, 'utf-8');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsed = JSON.parse(content);

    expect(parsed).toEqual({ theme: 'dark', language: 'en' });
  });

  test('should write valid JSON format', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark');
    await config.set('debug', true);
    await config.set('count', 42);

    const filePath = path.join(testDataPath, 'config.json');
    const content = await fs.readFile(filePath, 'utf-8');

    // Should not throw
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    expect(() => JSON.parse(content)).not.toThrow();
  });
});

describe('Dictionary - Initial Load', () => {
  const testDataPath = path.join(__dirname, '../data/test');
  let db: NoSqlFile;

  beforeEach(async () => {
    // Clean test directory
    await fs.rm(testDataPath, { recursive: true, force: true });
    await fs.mkdir(testDataPath, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(testDataPath, { recursive: true, force: true });
  });

  test('should load existing YAML data on initialization', async () => {
    const filePath = path.join(testDataPath, 'config.yaml');
    await fs.writeFile(filePath, 'theme: dark\nlanguage: en\n');

    db = new NoSqlFile(testDataPath);
    const config = await db.dictionary('config');

    expect(config.get('theme')).toBe('dark');
    expect(config.get('language')).toBe('en');
  });

  test('should load existing JSON data on initialization', async () => {
    const filePath = path.join(testDataPath, 'config.json');
    await fs.writeFile(filePath, JSON.stringify({ theme: 'dark', language: 'en' }));

    db = new NoSqlFile(testDataPath, { format: 'json' });
    const config = await db.dictionary('config');

    expect(config.get('theme')).toBe('dark');
    expect(config.get('language')).toBe('en');
  });

  test('should initialize empty dictionary if file does not exist', async () => {
    db = new NoSqlFile(testDataPath);
    const config = await db.dictionary('config');

    expect(config.keys()).toHaveLength(0);
  });

  test('should preserve loaded data and add new keys', async () => {
    const filePath = path.join(testDataPath, 'config.yaml');
    await fs.writeFile(filePath, 'theme: dark\n');

    db = new NoSqlFile(testDataPath);
    const config = await db.dictionary('config');

    await config.set('language', 'en');

    expect(config.get('theme')).toBe('dark');
    expect(config.get('language')).toBe('en');
  });
});

describe('Dictionary - EventEmitter', () => {
  const testDataPath = path.join(__dirname, '../data/test');
  let db: NoSqlFile;

  beforeEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
    await fs.mkdir(testDataPath, { recursive: true });
    db = new NoSqlFile(testDataPath);
  });

  afterEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
  });

  test('should emit "written" event after successful set', async () => {
    const config = await db.dictionary('config');

    const writtenPromise = new Promise<void>((resolve) => {
      config.on('written', () => {
        resolve();
      });
    });

    await config.set('theme', 'dark');
    await writtenPromise;
  });

  test('should emit "written" event after manual sync', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark', { mode: 'memory' });

    const writtenPromise = new Promise<void>((resolve) => {
      config.on('written', () => {
        resolve();
      });
    });

    await config.sync();
    await writtenPromise;
  });

  test('should emit "error" event on write failure', async () => {
    const invalidDb = new NoSqlFile('/invalid/nonexistent/path');
    const invalidDict = await invalidDb.dictionary('config');

    let errorEmitted = false;
    invalidDict.on('error', () => {
      errorEmitted = true;
    });

    await expect(invalidDict.set('theme', 'dark')).rejects.toThrow();
    expect(errorEmitted).toBe(true);
  });

  test('should emit "written" event multiple times for multiple sets', async () => {
    const config = await db.dictionary('config');

    let writtenCount = 0;
    config.on('written', () => {
      writtenCount++;
    });

    await config.set('theme', 'dark');
    await config.set('language', 'en');
    await config.set('debug', true);

    expect(writtenCount).toBe(3);
  });

  test('should allow multiple listeners on "written" event', async () => {
    const config = await db.dictionary('config');

    let listener1Called = false;
    let listener2Called = false;

    config.on('written', () => {
      listener1Called = true;
    });

    config.on('written', () => {
      listener2Called = true;
    });

    await config.set('theme', 'dark');

    expect(listener1Called).toBe(true);
    expect(listener2Called).toBe(true);
  });
});

describe('Dictionary - Utility Methods', () => {
  const testDataPath = path.join(__dirname, '../data/test');
  let db: NoSqlFile;

  beforeEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
    await fs.mkdir(testDataPath, { recursive: true });
    db = new NoSqlFile(testDataPath);
  });

  afterEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
  });

  test('should return all keys', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark');
    await config.set('language', 'en');
    await config.set('debug', true);

    const keys = config.keys();
    expect(keys).toHaveLength(3);
    expect(keys).toContain('theme');
    expect(keys).toContain('language');
    expect(keys).toContain('debug');
  });

  test('should return all values', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark');
    await config.set('language', 'en');
    await config.set('debug', true);

    const values = config.values();
    expect(values).toHaveLength(3);
    expect(values).toContain('dark');
    expect(values).toContain('en');
    expect(values).toContain(true);
  });

  test('should return all key-value pairs', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark');
    await config.set('language', 'en');

    const all = config.getAll();
    expect(all).toEqual({ theme: 'dark', language: 'en' });
  });

  test('should check if key exists', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark');

    expect(config.has('theme')).toBe(true);
    expect(config.has('nonexistent')).toBe(false);
  });

  test('should clear all key-value pairs', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark');
    await config.set('language', 'en');

    await config.clear();

    expect(config.keys()).toHaveLength(0);
    expect(config.get('theme')).toBeUndefined();
  });

  test('should persist clear to disk', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark');
    await config.set('language', 'en');

    await config.clear();

    const filePath = path.join(testDataPath, 'config.yaml');
    const content = await fs.readFile(filePath, 'utf-8');

    expect(content.trim()).toBe('{}');
  });

  test('should emit "written" event after clear', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark');

    const writtenPromise = new Promise<void>((resolve) => {
      config.on('written', () => {
        resolve();
      });
    });

    await config.clear();
    await writtenPromise;
  });

  test('should clear empty dictionary without error', async () => {
    const config = await db.dictionary('config');

    await expect(config.clear()).resolves.not.toThrow();
    expect(config.keys()).toHaveLength(0);
  });
});

describe('Dictionary - Fast Mode', () => {
  const testDataPath = path.join(__dirname, '../data/test');
  let db: NoSqlFile;

  beforeEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
    await fs.mkdir(testDataPath, { recursive: true });
    db = new NoSqlFile(testDataPath);
  });

  afterEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
  });

  test('should set in fast mode without waiting', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark', { mode: 'fast' });

    // Value should be in memory immediately
    expect(config.get('theme')).toBe('dark');

    // Wait for background write to complete
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  test('should emit "written" event after fast set completes', async () => {
    const config = await db.dictionary('config');

    const writtenPromise = new Promise<void>((resolve) => {
      config.on('written', () => {
        resolve();
      });
    });

    await config.set('theme', 'dark', { mode: 'fast' });

    await writtenPromise;
  });

  test('should delete in fast mode without waiting', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark');
    await config.delete('theme', { mode: 'fast' });

    // Value should be removed from memory immediately
    expect(config.get('theme')).toBeUndefined();
  });

  test('should persist fast mode operations to disk eventually', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark', { mode: 'fast' });

    // Wait for async write
    await new Promise((resolve) => setTimeout(resolve, 100));

    const filePath = path.join(testDataPath, 'config.yaml');
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });

  test('should handle multiple fast mode operations', async () => {
    const config = await db.dictionary('config');

    await config.set('key1', 'value1', { mode: 'fast' });
    await config.set('key2', 'value2', { mode: 'fast' });
    await config.set('key3', 'value3', { mode: 'fast' });

    // All values should be in memory
    expect(config.get('key1')).toBe('value1');
    expect(config.get('key2')).toBe('value2');
    expect(config.get('key3')).toBe('value3');

    // Wait for writes to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    const filePath = path.join(testDataPath, 'config.yaml');
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('key1: value1');
    expect(content).toContain('key2: value2');
    expect(content).toContain('key3: value3');
  });
});

describe('Dictionary - Memory-Only Mode', () => {
  const testDataPath = path.join(__dirname, '../data/test');
  let db: NoSqlFile;

  beforeEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
    await fs.mkdir(testDataPath, { recursive: true });
    db = new NoSqlFile(testDataPath);
  });

  afterEach(async () => {
    await fs.rm(testDataPath, { recursive: true, force: true });
  });

  test('should not auto-sync when mode is memory', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark', { mode: 'memory' });

    // File should not exist yet
    const filePath = path.join(testDataPath, 'config.yaml');
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(false);

    // Data should be in memory
    expect(config.get('theme')).toBe('dark');
  });

  test('should perform multiple operations without writing to disk', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark', { mode: 'memory' });
    await config.set('language', 'en', { mode: 'memory' });
    await config.set('debug', true, { mode: 'memory' });
    await config.delete('language', { mode: 'memory' });

    // File should not exist
    const filePath = path.join(testDataPath, 'config.yaml');
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(false);

    // Data should be correct in memory
    expect(config.get('theme')).toBe('dark');
    expect(config.get('language')).toBeUndefined();
    expect(config.get('debug')).toBe(true);
  });

  test('should write to disk on manual sync', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark', { mode: 'memory' });
    await config.set('language', 'en', { mode: 'memory' });

    // Manually sync
    await config.sync();

    // File should now exist
    const filePath = path.join(testDataPath, 'config.yaml');
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('theme: dark');
    expect(content).toContain('language: en');
  });

  test('should switch between memory and async modes', async () => {
    const config = await db.dictionary('config');

    await config.set('key1', 'value1', { mode: 'memory' });

    const filePath = path.join(testDataPath, 'config.yaml');
    let fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(false);

    // Use async mode (default)
    await config.set('key2', 'value2');

    // File should now exist
    fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });

  test('should batch operations in memory-only mode', async () => {
    const config = await db.dictionary('config');

    // Batch operations
    await config.set('key1', 'value1', { mode: 'memory' });
    await config.set('key2', 'value2', { mode: 'memory' });
    await config.set('key3', 'value3', { mode: 'memory' });
    await config.set('key4', 'value4', { mode: 'memory' });

    expect(config.keys()).toHaveLength(4);

    // Sync all at once
    await config.sync();

    const filePath = path.join(testDataPath, 'config.yaml');
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('key1: value1');
    expect(content).toContain('key4: value4');
  });

  test('should not emit "written" event without sync in memory mode', async () => {
    const config = await db.dictionary('config');

    let writtenEmitted = false;
    config.on('written', () => {
      writtenEmitted = true;
    });

    await config.set('theme', 'dark', { mode: 'memory' });

    // Wait a bit to ensure no event is emitted
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(writtenEmitted).toBe(false);
  });

  test('should emit "written" event on manual sync', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark', { mode: 'memory' });

    const writtenPromise = new Promise<void>((resolve) => {
      config.once('written', () => {
        resolve();
      });
    });

    await config.sync();
    await writtenPromise;
  });

  test('should clear in memory-only mode without writing', async () => {
    const config = await db.dictionary('config');

    await config.set('theme', 'dark', { mode: 'memory' });
    await config.set('language', 'en', { mode: 'memory' });

    await config.clear({ mode: 'memory' });

    expect(config.keys()).toHaveLength(0);

    // File should not exist
    const filePath = path.join(testDataPath, 'config.yaml');
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(false);
  });

  test('should respect explicit mode parameter', async () => {
    const config = await db.dictionary('config');

    // Explicit async mode should sync immediately
    await config.set('theme', 'dark', { mode: 'async' });

    const filePath = path.join(testDataPath, 'config.yaml');
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });
});
