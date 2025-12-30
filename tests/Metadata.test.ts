import * as fs from 'fs/promises';
import * as path from 'path';
import { Collection } from '../src/core/Collection';
import { Dictionary } from '../src/core/Dictionary';
import { Metadata } from '../src/types';
import { MetadataManager } from '../src/utils/MetadataManager';

describe('Metadata', () => {
  const testDataPath = path.join(__dirname, '../data/test-metadata');

  beforeAll(async () => {
    await fs.mkdir(testDataPath, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test files
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

  describe('Collection metadata (YAML)', () => {
    it('should auto-update metadata timestamps on sync', async () => {
      const collection = new Collection<{ name: string }>('users', testDataPath, 'yaml');
      await collection.load();

      await collection.insert({ name: 'Alice' });

      const meta = await collection.getMeta();
      expect(meta.createdAt).toBeDefined();
      expect(meta.updatedAt).toBeDefined();
      expect(new Date(meta.createdAt!).getTime()).toBeLessThanOrEqual(new Date(meta.updatedAt!).getTime());
    });

    it('should persist custom metadata', async () => {
      const collection = new Collection<{ name: string }>('users', testDataPath, 'yaml');
      await collection.load();

      await collection.setMeta({
        version: 1,
        tags: ['users', 'auth'],
        custom: { author: 'John Doe', env: 'production' }
      });

      const meta = await collection.getMeta();
      expect(meta.version).toBe(1);
      expect(meta.tags).toEqual(['users', 'auth']);
      expect(meta.custom).toEqual({ author: 'John Doe', env: 'production' });
    });

    it('should store metadata in separate .meta.yaml file', async () => {
      const collection = new Collection<{ name: string }>('users', testDataPath, 'yaml');
      await collection.load();

      // Insert data to create the main file
      await collection.insert({ name: 'Alice' });

      await collection.setMeta({ version: 1 });

      const metaFilePath = path.join(testDataPath, 'users.meta.yaml');
      const metaFileExists = await fs.access(metaFilePath).then(() => true).catch(() => false);
      expect(metaFileExists).toBe(true);

      // Verify main data file is not polluted
      const dataFilePath = path.join(testDataPath, 'users.yaml');
      const dataContent = await fs.readFile(dataFilePath, 'utf-8');
      expect(dataContent).not.toContain('version:');
      expect(dataContent).not.toContain('createdAt:');
    });

    it('should merge custom metadata fields', async () => {
      const collection = new Collection<{ name: string }>('config', testDataPath, 'yaml');
      await collection.load();

      await collection.setMeta({
        custom: { field1: 'value1', field2: 'value2' }
      });

      await collection.setMeta({
        custom: { field2: 'updated', field3: 'value3' }
      });

      const meta = await collection.getMeta();
      expect(meta.custom).toEqual({
        field1: 'value1',
        field2: 'updated',
        field3: 'value3'
      });
    });

    it('should delete metadata when dropping collection', async () => {
      const collection = new Collection<{ name: string }>('temp', testDataPath, 'yaml');
      await collection.load();
      await collection.insert({ name: 'Test' });

      const metaFilePath = path.join(testDataPath, 'temp.meta.yaml');
      const metaExists = await fs.access(metaFilePath).then(() => true).catch(() => false);
      expect(metaExists).toBe(true);

      await collection.drop();

      const metaExistsAfter = await fs.access(metaFilePath).then(() => true).catch(() => false);
      expect(metaExistsAfter).toBe(false);
    });
  });

  describe('Collection metadata (JSON)', () => {
    it('should store metadata in .meta.json file', async () => {
      const collection = new Collection<{ name: string }>('users', testDataPath, 'json');
      await collection.load();

      await collection.setMeta({ version: 2, tags: ['json'] });

      const metaFilePath = path.join(testDataPath, 'users.meta.json');
      const metaFileExists = await fs.access(metaFilePath).then(() => true).catch(() => false);
      expect(metaFileExists).toBe(true);

      const metaContent = await fs.readFile(metaFilePath, 'utf-8');
      const parsedMeta = JSON.parse(metaContent) as Metadata;
      expect(parsedMeta.version).toBe(2);
      expect(parsedMeta.tags).toEqual(['json']);
    });

    it('should auto-update timestamps on insert', async () => {
      const collection = new Collection<{ id: number }>('items', testDataPath, 'json');
      await collection.load();

      const before = new Date();
      await collection.insert({ id: 1 });
      const after = new Date();

      const meta = await collection.getMeta();
      const updatedAt = new Date(meta.updatedAt!);
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Dictionary metadata (simple mode)', () => {
    it('should auto-update metadata on set', async () => {
      const dict = new Dictionary('config', testDataPath, 'yaml', false);
      await dict.load();

      await dict.set('key1', 'value1');

      const meta = await dict.getMeta();
      expect(meta.createdAt).toBeDefined();
      expect(meta.updatedAt).toBeDefined();
    });

    it('should persist metadata separately from data', async () => {
      const dict = new Dictionary('settings', testDataPath, 'yaml', false);
      await dict.load();

      await dict.set('theme', 'dark');
      await dict.setMeta({ version: 3, tags: ['settings'] });

      const metaFilePath = path.join(testDataPath, 'settings.meta.yaml');
      const metaExists = await fs.access(metaFilePath).then(() => true).catch(() => false);
      expect(metaExists).toBe(true);

      const dataContent = await fs.readFile(path.join(testDataPath, 'settings.yaml'), 'utf-8');
      expect(dataContent).toContain('theme:');
      expect(dataContent).not.toContain('version:');
    });
  });

  describe('Dictionary metadata (splited mode)', () => {
    it('should store metadata for splited dictionary', async () => {
      const dict = new Dictionary('cache', testDataPath, 'yaml', true);
      await dict.load();

      await dict.set('key1', { data: 'value1' });
      await dict.setMeta({ version: 1, tags: ['cache'] });

      // Metadata should be in cache.meta.yaml (not in the directory)
      const metaFilePath = path.join(testDataPath, 'cache.meta.yaml');
      const metaExists = await fs.access(metaFilePath).then(() => true).catch(() => false);
      expect(metaExists).toBe(true);

      const meta = await dict.getMeta();
      expect(meta.version).toBe(1);
      expect(meta.tags).toEqual(['cache']);
    });

    it('should auto-update timestamps on splited dictionary operations', async () => {
      const dict = new Dictionary('store', testDataPath, 'json', true);
      await dict.load();

      const before = new Date();
      await dict.set('item1', { name: 'Item 1' });
      const after = new Date();

      const meta = await dict.getMeta();
      const updatedAt = new Date(meta.updatedAt!);
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('getAllMeta', () => {
    it('should return all metadata fields', async () => {
      const collection = new Collection<{ id: number }>('full', testDataPath, 'yaml');
      await collection.load();

      await collection.insert({ id: 1 });
      await collection.setMeta({
        version: 10,
        tags: ['tag1', 'tag2'],
        custom: { field: 'value' }
      });

      const allMeta = await collection.getAllMeta();
      expect(allMeta.version).toBe(10);
      expect(allMeta.tags).toEqual(['tag1', 'tag2']);
      expect(allMeta.custom).toEqual({ field: 'value' });
      expect(allMeta.createdAt).toBeDefined();
      expect(allMeta.updatedAt).toBeDefined();
    });
  });

  describe('MetadataManager direct methods', () => {
    it('should check if metadata file exists', async () => {
      const collection = new Collection<{ id: number }>('exists-test', testDataPath, 'yaml');
      await collection.load();

      const manager = (collection as unknown as { metadataManager: MetadataManager }).metadataManager;
      let exists = await manager.exists();
      expect(exists).toBe(false);

      await collection.insert({ id: 1 });
      exists = await manager.exists();
      expect(exists).toBe(true);
    });

    it('should get metadata file path', async () => {
      const collection = new Collection<{ id: number }>('path-test', testDataPath, 'yaml');
      await collection.load();

      const manager = (collection as unknown as { metadataManager: MetadataManager }).metadataManager;
      const metaPath = manager.getMetaFilePath();
      expect(metaPath).toContain('path-test.meta.yaml');
    });

    it('should handle deleteMeta', async () => {
      const collection = new Collection<{ id: number }>('delete-test', testDataPath, 'yaml');
      await collection.load();

      await collection.insert({ id: 1 });
      await collection.setMeta({ version: 1 });

      const manager = (collection as unknown as { metadataManager: MetadataManager }).metadataManager;
      let exists = await manager.exists();
      expect(exists).toBe(true);

      await manager.deleteMeta();
      exists = await manager.exists();
      expect(exists).toBe(false);

      await manager.deleteMeta();
      exists = await manager.exists();
      expect(exists).toBe(false);
    });
  });
});
