import * as fs from 'fs/promises';
import * as path from 'path';
import { NoSqlFile } from '../src/core/Database';
import { Collection } from '../src/core/Collection';
import { Dictionary } from '../src/core/Dictionary';

describe('Disable Metadata', () => {
  const testDataPath = path.join(__dirname, '../data/test-disable-metadata');

  beforeAll(async () => {
    await fs.mkdir(testDataPath, { recursive: true });
  });

  beforeEach(async () => {
    // Clean before each test to ensure fresh state
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

  describe('Database with disableMetadata option', () => {
    it('should not create metadata files when disabled globally', async () => {
      const db = new NoSqlFile(testDataPath, { disableMetadata: true });
      const users = await db.collection<{ name: string }>('users');

      await users.insert({ name: 'Alice' });

      const metaFilePath = path.join(testDataPath, 'users.meta.yaml');
      const metaExists = await fs.access(metaFilePath).then(() => true).catch(() => false);
      expect(metaExists).toBe(false);
    });

    it('should throw error when trying to set metadata with disabled option', async () => {
      const db = new NoSqlFile(testDataPath, { disableMetadata: true });
      const users = await db.collection<{ name: string }>('users');

      await users.insert({ name: 'Alice' });

      await expect(users.setMeta({ version: 1 })).rejects.toThrow('Metadata is disabled for this data store');
    });

    it('should throw error when trying to get metadata with disabled option', async () => {
      const db = new NoSqlFile(testDataPath, { disableMetadata: true });
      const users = await db.collection<{ name: string }>('users');

      await users.insert({ name: 'Alice' });

      await expect(users.getMeta()).rejects.toThrow('Metadata is disabled for this data store');
    });

    it('should throw error when trying to get all metadata with disabled option', async () => {
      const db = new NoSqlFile(testDataPath, { disableMetadata: true });
      const users = await db.collection<{ name: string }>('users');

      await users.insert({ name: 'Alice' });

      await expect(users.getAllMeta()).rejects.toThrow('Metadata is disabled for this data store');
    });
  });

  describe('Dictionary with disableMetadata option', () => {
    it('should not create metadata files for dictionary when disabled', async () => {
      const db = new NoSqlFile(testDataPath, { disableMetadata: true });
      const config = await db.dictionary('config-disabled');

      await config.set('theme', 'dark');

      const metaFilePath = path.join(testDataPath, 'config-disabled.meta.yaml');
      const metaExists = await fs.access(metaFilePath).then(() => true).catch(() => false);
      expect(metaExists).toBe(false);
    });

    it('should allow override at dictionary level', async () => {
      const db = new NoSqlFile(testDataPath, { disableMetadata: true });
      const config = await db.dictionary('config-override', { disableMetadata: false });

      await config.set('theme', 'dark');

      const metaFilePath = path.join(testDataPath, 'config-override.meta.yaml');
      const metaExists = await fs.access(metaFilePath).then(() => true).catch(() => false);
      expect(metaExists).toBe(true);
    });

    it('should not create metadata files for splited dictionary when disabled', async () => {
      const db = new NoSqlFile(testDataPath, { disableMetadata: true });
      const cache = await db.dictionary('cache-splited', { splited: true });

      await cache.set('key1', 'value1');

      const metaFilePath = path.join(testDataPath, 'cache-splited.meta.yaml');
      const metaExists = await fs.access(metaFilePath).then(() => true).catch(() => false);
      expect(metaExists).toBe(false);
    });
  });

  describe('Direct Collection instantiation', () => {
    it('should not create metadata when disabled directly', async () => {
      const collection = new Collection<{ name: string }>('users', testDataPath, 'yaml', undefined, true);
      await collection.load();

      await collection.insert({ name: 'Alice' });

      const metaFilePath = path.join(testDataPath, 'users.meta.yaml');
      const metaExists = await fs.access(metaFilePath).then(() => true).catch(() => false);
      expect(metaExists).toBe(false);
    });

    it('should throw error when accessing metadata methods', async () => {
      const collection = new Collection<{ name: string }>('users', testDataPath, 'yaml', undefined, true);
      await collection.load();

      await collection.insert({ name: 'Alice' });

      await expect(collection.setMeta({ version: 1 })).rejects.toThrow('Metadata is disabled');
      await expect(collection.getMeta()).rejects.toThrow('Metadata is disabled');
    });
  });

  describe('Direct Dictionary instantiation', () => {
    it('should not create metadata when disabled directly', async () => {
      const dict = new Dictionary('config-direct', testDataPath, 'yaml', false, undefined, true);
      await dict.load();

      await dict.set('theme', 'dark');

      const metaFilePath = path.join(testDataPath, 'config-direct.meta.yaml');
      const metaExists = await fs.access(metaFilePath).then(() => true).catch(() => false);
      expect(metaExists).toBe(false);
    });

    it('should throw error when accessing metadata methods', async () => {
      const dict = new Dictionary('config-direct2', testDataPath, 'yaml', false, undefined, true);
      await dict.load();

      await dict.set('theme', 'dark');

      await expect(dict.setMeta({ version: 1 })).rejects.toThrow('Metadata is disabled');
      await expect(dict.getMeta()).rejects.toThrow('Metadata is disabled');
    });
  });

  describe('Mixed metadata settings', () => {
    it('should work with metadata enabled for some and disabled for others', async () => {
      const db = new NoSqlFile(testDataPath);
      const users = await db.collection<{ name: string }>('users');
      const posts = await db.collection<{ title: string }>('posts');

      await users.insert({ name: 'Alice' });
      await posts.insert({ title: 'Hello' });

      await users.setMeta({ version: 1 });
      await posts.setMeta({ version: 2 });

      const usersMeta = await users.getMeta();
      const postsMeta = await posts.getMeta();

      expect(usersMeta.version).toBe(1);
      expect(postsMeta.version).toBe(2);
    });
  });
});
