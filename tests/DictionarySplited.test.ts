import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { NoSqlFile } from '../src/core/Database';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Dictionary - Splited Mode (YAML)', () => {
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

  test('should set and get a key-value pair in splited mode', async () => {
    const cache = await db.dictionary('cache', { splited: true });

    await cache.set('theme', 'dark');

    const value = cache.get('theme');
    expect(value).toBe('dark');
  });

  test('should create directory and separate files for each key', async () => {
    const cache = await db.dictionary('cache', { splited: true });

    await cache.set('theme', 'dark');
    await cache.set('language', 'en');

    // Check directory exists
    const dirPath = path.join(testDataPath, 'cache');
    const dirExists = await fs.stat(dirPath).then(s => s.isDirectory()).catch(() => false);
    expect(dirExists).toBe(true);

    // Check individual files exist
    const themeFile = path.join(dirPath, 'theme.yaml');
    const langFile = path.join(dirPath, 'language.yaml');

    expect(await fs.access(themeFile).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.access(langFile).then(() => true).catch(() => false)).toBe(true);

    // Check file contents
    const themeContent = await fs.readFile(themeFile, 'utf-8');
    const langContent = await fs.readFile(langFile, 'utf-8');

    expect(themeContent.trim()).toBe('dark');
    expect(langContent.trim()).toBe('en');
  });

  test('should update existing key file', async () => {
    const cache = await db.dictionary('cache', { splited: true });

    await cache.set('theme', 'dark');
    await cache.set('theme', 'light');

    const value = cache.get('theme');
    expect(value).toBe('light');

    const themeFile = path.join(testDataPath, 'cache', 'theme.yaml');
    const content = await fs.readFile(themeFile, 'utf-8');
    expect(content.trim()).toBe('light');
  });

  test('should delete individual key file', async () => {
    const cache = await db.dictionary('cache', { splited: true });

    await cache.set('theme', 'dark');
    await cache.set('language', 'en');
    await cache.delete('theme');

    const value = cache.get('theme');
    expect(value).toBeUndefined();

    // Theme file should be deleted
    const themeFile = path.join(testDataPath, 'cache', 'theme.yaml');
    const themeExists = await fs.access(themeFile).then(() => true).catch(() => false);
    expect(themeExists).toBe(false);

    // Language file should still exist
    const langFile = path.join(testDataPath, 'cache', 'language.yaml');
    const langExists = await fs.access(langFile).then(() => true).catch(() => false);
    expect(langExists).toBe(true);
  });

  test('should store complex objects in splited mode', async () => {
    const cache = await db.dictionary('cache', { splited: true });

    const userData = [
      { id: 1, name: 'John', email: 'john@example.com' },
      { id: 2, name: 'Jane', email: 'jane@example.com' }
    ];

    const userSettings = {
      notifications: true,
      language: 'en',
      theme: { primary: '#007bff', secondary: '#6c757d' }
    };

    await cache.set('userData', userData);
    await cache.set('userSettings', userSettings);

    expect(cache.get('userData')).toEqual(userData);
    expect(cache.get('userSettings')).toEqual(userSettings);

    // Check files contain proper YAML
    const userDataFile = path.join(testDataPath, 'cache', 'userData.yaml');
    const userSettingsFile = path.join(testDataPath, 'cache', 'userSettings.yaml');

    const userDataContent = await fs.readFile(userDataFile, 'utf-8');
    const userSettingsContent = await fs.readFile(userSettingsFile, 'utf-8');

    expect(userDataContent).toContain('id: 1');
    expect(userDataContent).toContain('name: John');
    expect(userSettingsContent).toContain('notifications: true');
    expect(userSettingsContent).toContain('primary: "#007bff"');
  });

  test('should load existing splited data on initialization', async () => {
    const dirPath = path.join(testDataPath, 'cache');
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(path.join(dirPath, 'theme.yaml'), 'dark\n');
    await fs.writeFile(path.join(dirPath, 'language.yaml'), 'en\n');

    db = new NoSqlFile(testDataPath);
    const cache = await db.dictionary('cache', { splited: true });

    expect(cache.get('theme')).toBe('dark');
    expect(cache.get('language')).toBe('en');
    expect(cache.keys()).toHaveLength(2);
  });

  test('should initialize empty dictionary if directory does not exist', async () => {
    const cache = await db.dictionary('cache', { splited: true });

    expect(cache.keys()).toHaveLength(0);
  });

  test('should clear all files in splited mode', async () => {
    const cache = await db.dictionary('cache', { splited: true });

    await cache.set('theme', 'dark');
    await cache.set('language', 'en');
    await cache.set('debug', true);

    await cache.clear();

    expect(cache.keys()).toHaveLength(0);

    // All files should be deleted
    const dirPath = path.join(testDataPath, 'cache');
    const files = await fs.readdir(dirPath).catch(() => []);

    // Directory should exist but be empty (or only contain non-yaml files)
    const yamlFiles = files.filter(f => f.endsWith('.yaml'));
    expect(yamlFiles).toHaveLength(0);
  });

  test('should work with memory mode in splited mode', async () => {
    const cache = await db.dictionary('cache', { splited: true });

    await cache.set('theme', 'dark', { mode: 'memory' });
    await cache.set('language', 'en', { mode: 'memory' });

    // Data should be in memory
    expect(cache.get('theme')).toBe('dark');
    expect(cache.get('language')).toBe('en');

    // But files should not exist yet
    const dirPath = path.join(testDataPath, 'cache');
    const dirExists = await fs.stat(dirPath).then(() => true).catch(() => false);
    expect(dirExists).toBe(false);

    // Sync manually
    await cache.sync();

    // Now files should exist
    const themeFile = path.join(dirPath, 'theme.yaml');
    const langFile = path.join(dirPath, 'language.yaml');

    expect(await fs.access(themeFile).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.access(langFile).then(() => true).catch(() => false)).toBe(true);
  });

  test('should emit written event after set in splited mode', async () => {
    const cache = await db.dictionary('cache', { splited: true });

    const writtenPromise = new Promise<void>((resolve) => {
      cache.on('written', () => {
        resolve();
      });
    });

    await cache.set('theme', 'dark');
    await writtenPromise;
  });

  test('should handle fast mode in splited mode', async () => {
    const cache = await db.dictionary('cache', { splited: true });

    await cache.set('theme', 'dark', { mode: 'fast' });

    // Value should be in memory immediately
    expect(cache.get('theme')).toBe('dark');

    // Wait for async write
    await new Promise((resolve) => setTimeout(resolve, 100));

    // File should exist
    const themeFile = path.join(testDataPath, 'cache', 'theme.yaml');
    expect(await fs.access(themeFile).then(() => true).catch(() => false)).toBe(true);
  });
});

describe('Dictionary - Splited Mode (JSON)', () => {
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

  test('should create JSON files in splited mode', async () => {
    const cache = await db.dictionary('cache', { splited: true });

    await cache.set('theme', 'dark');
    await cache.set('language', 'en');

    // Check individual JSON files exist
    const dirPath = path.join(testDataPath, 'cache');
    const themeFile = path.join(dirPath, 'theme.json');
    const langFile = path.join(dirPath, 'language.json');

    expect(await fs.access(themeFile).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.access(langFile).then(() => true).catch(() => false)).toBe(true);

    // Check file contents are valid JSON
    const themeContent = await fs.readFile(themeFile, 'utf-8');
    const langContent = await fs.readFile(langFile, 'utf-8');

    expect(JSON.parse(themeContent)).toBe('dark');
    expect(JSON.parse(langContent)).toBe('en');
  });

  test('should store complex objects in JSON splited mode', async () => {
    const cache = await db.dictionary('cache', { splited: true });

    const userData = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' }
    ];

    await cache.set('userData', userData);

    const userDataFile = path.join(testDataPath, 'cache', 'userData.json');
    const content = await fs.readFile(userDataFile, 'utf-8');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsed = JSON.parse(content);

    expect(parsed).toEqual(userData);
  });

  test('should load existing JSON splited data', async () => {
    const dirPath = path.join(testDataPath, 'cache');
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(path.join(dirPath, 'theme.json'), JSON.stringify('dark'));
    await fs.writeFile(path.join(dirPath, 'count.json'), JSON.stringify(42));

    db = new NoSqlFile(testDataPath, { format: 'json' });
    const cache = await db.dictionary('cache', { splited: true });

    expect(cache.get('theme')).toBe('dark');
    expect(cache.get('count')).toBe(42);
  });
});

describe('Dictionary - Mixed Mode (Simple and Splited)', () => {
  const testDataPath = path.join(__dirname, '../data/test');
  let db: NoSqlFile;

  beforeEach(async () => {
    // Clean test directory
    await fs.rm(testDataPath, { recursive: true, force: true });
    await fs.mkdir(testDataPath, { recursive: true });

    db = new NoSqlFile(testDataPath);
  });

  afterEach(async () => {
    // Cleanup
    await fs.rm(testDataPath, { recursive: true, force: true });
  });

  test('should handle both simple and splited dictionaries independently', async () => {
    const config = await db.dictionary('config'); // Simple mode
    const cache = await db.dictionary('cache', { splited: true }); // Splited mode

    await config.set('theme', 'dark');
    await cache.set('userData', [1, 2, 3]);

    // Check simple mode creates a file
    const configFile = path.join(testDataPath, 'config.yaml');
    expect(await fs.access(configFile).then(() => true).catch(() => false)).toBe(true);

    // Check splited mode creates a directory
    const cacheDir = path.join(testDataPath, 'cache');
    expect(await fs.stat(cacheDir).then(s => s.isDirectory()).catch(() => false)).toBe(true);

    // Both should work independently
    expect(config.get('theme')).toBe('dark');
    expect(cache.get('userData')).toEqual([1, 2, 3]);
  });

  test('should allow same name with different modes', async () => {
    const dictSimple = await db.dictionary('data'); // Simple mode
    const dictSplited = await db.dictionary('data', { splited: true }); // Splited mode

    await dictSimple.set('key1', 'value1');
    await dictSplited.set('key2', 'value2');

    // They should be completely independent
    expect(dictSimple.get('key1')).toBe('value1');
    expect(dictSimple.get('key2')).toBeUndefined();

    expect(dictSplited.get('key2')).toBe('value2');
    expect(dictSplited.get('key1')).toBeUndefined();

    // Check file structure
    const simpleFile = path.join(testDataPath, 'data.yaml');
    const splitedDir = path.join(testDataPath, 'data');

    expect(await fs.access(simpleFile).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.stat(splitedDir).then(s => s.isDirectory()).catch(() => false)).toBe(true);
  });
});
