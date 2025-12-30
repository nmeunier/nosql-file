import * as path from 'path';
import * as fs from 'fs/promises';
import { NoSqlFile, Collection, Dictionary, WriteOptions, DatabaseOptions, DictionaryOptions, Metadata } from '../src/index';

describe('Index exports', () => {
  const testDataPath = path.join(__dirname, '../data/test-index');

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

  it('should export NoSqlFile class', () => {
    expect(NoSqlFile).toBeDefined();
    const db = new NoSqlFile(testDataPath);
    expect(db).toBeInstanceOf(NoSqlFile);
  });

  it('should export Collection class', async () => {
    expect(Collection).toBeDefined();
    const collection = new Collection<{ id: number }>('test', testDataPath);
    expect(collection).toBeInstanceOf(Collection);
    await collection.load();
    await collection.insert({ id: 1 });
    expect(collection.getAll()).toHaveLength(1);
  });

  it('should export Dictionary class', async () => {
    expect(Dictionary).toBeDefined();
    const dict = new Dictionary('config', testDataPath);
    expect(dict).toBeInstanceOf(Dictionary);
    await dict.load();
    await dict.set('key', 'value');
    expect(dict.get('key')).toBe('value');
  });

  it('should export WriteOptions type', () => {
    const options: WriteOptions = { mode: 'async' };
    expect(options.mode).toBe('async');

    const fastOptions: WriteOptions = { mode: 'fast' };
    expect(fastOptions.mode).toBe('fast');

    const memoryOptions: WriteOptions = { mode: 'memory' };
    expect(memoryOptions.mode).toBe('memory');
  });

  it('should export DatabaseOptions type', () => {
    const options: DatabaseOptions = { format: 'json' };
    expect(options.format).toBe('json');
  });

  it('should export DictionaryOptions type', () => {
    const options: DictionaryOptions = {
      splited: true
    };
    expect(options.splited).toBe(true);
  });

  it('should export Metadata type', async () => {
    const collection = new Collection<{ id: number }>('meta-test', testDataPath);
    await collection.load();
    await collection.insert({ id: 1 });

    const metadata: Metadata = {
      version: 1,
      tags: ['test'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      custom: { author: 'test' }
    };

    await collection.setMeta(metadata);
    const retrievedMeta = await collection.getMeta();

    expect(retrievedMeta.version).toBe(1);
    expect(retrievedMeta.tags).toEqual(['test']);
    expect(retrievedMeta.custom).toEqual({ author: 'test' });
  });

  it('should work with all exports together', async () => {
    const db = new NoSqlFile(testDataPath);
    const users = await db.collection<{ name: string }>('users');

    await users.insert({ name: 'Alice' }, { mode: 'async' });
    await users.setMeta({ version: 1, tags: ['production'] });

    const meta = await users.getMeta();
    expect(meta.version).toBe(1);
    expect(users.getAll()).toHaveLength(1);
  });
});
