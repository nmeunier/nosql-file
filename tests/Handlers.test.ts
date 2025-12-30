import * as path from 'path';
import * as fs from 'fs/promises';
import { JsonHandler } from '../src/utils/JsonHandler';
import { YamlHandler } from '../src/utils/YamlHandler';

describe('JsonHandler error handling', () => {
  const testDataPath = path.join(__dirname, '../data/test-handlers');

  beforeAll(async () => {
    await fs.mkdir(testDataPath, { recursive: true });
  });

  afterAll(async () => {
    try {
      await fs.rm(testDataPath, { recursive: true });
    } catch {
      // Directory might not exist
    }
  });

  describe('read errors', () => {
    it('should return null for non-existent files', async () => {
      const filePath = path.join(testDataPath, 'nonexistent.json');
      const result = await JsonHandler.read(filePath);
      expect(result).toBeNull();
    });

    it('should throw error for invalid JSON', async () => {
      const filePath = path.join(testDataPath, 'invalid.json');
      await fs.writeFile(filePath, '{ invalid json }', 'utf-8');

      await expect(JsonHandler.read(filePath)).rejects.toThrow();
    });

    it('should throw error for corrupted JSON file', async () => {
      const filePath = path.join(testDataPath, 'corrupted.json');
      await fs.writeFile(filePath, '{"key": "value"', 'utf-8');

      await expect(JsonHandler.read(filePath)).rejects.toThrow();
    });
  });

  describe('write', () => {
    it('should write valid JSON', async () => {
      const filePath = path.join(testDataPath, 'valid.json');
      const data = { name: 'test', value: 123 };

      await JsonHandler.write(filePath, data);

      const content = await fs.readFile(filePath, 'utf-8');
      expect(JSON.parse(content)).toEqual(data);
    });

    it('should create parent directory if needed', async () => {
      const filePath = path.join(testDataPath, 'nested', 'deep', 'file.json');
      const data = { nested: true };

      await JsonHandler.write(filePath, data);

      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });
});

describe('YamlHandler error handling', () => {
  const testDataPath = path.join(__dirname, '../data/test-handlers');

  beforeAll(async () => {
    await fs.mkdir(testDataPath, { recursive: true });
  });

  afterAll(async () => {
    try {
      await fs.rm(testDataPath, { recursive: true });
    } catch {
      // Directory might not exist
    }
  });

  describe('read errors', () => {
    it('should return null for non-existent files', async () => {
      const filePath = path.join(testDataPath, 'nonexistent.yaml');
      const result = await YamlHandler.read(filePath);
      expect(result).toBeNull();
    });

    it('should throw error for invalid YAML', async () => {
      const filePath = path.join(testDataPath, 'invalid.yaml');
      await fs.writeFile(filePath, 'key: [invalid, unclosed', 'utf-8');

      await expect(YamlHandler.read(filePath)).rejects.toThrow();
    });

    it('should throw error for corrupted YAML with tabs', async () => {
      const filePath = path.join(testDataPath, 'tabs.yaml');
      await fs.writeFile(filePath, 'key:\n\tvalue', 'utf-8');

      await expect(YamlHandler.read(filePath)).rejects.toThrow();
    });
  });

  describe('write', () => {
    it('should write valid YAML', async () => {
      const filePath = path.join(testDataPath, 'valid.yaml');
      const data = { name: 'test', value: 123 };

      await YamlHandler.write(filePath, data);

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('name: test');
      expect(content).toContain('value: 123');
    });

    it('should create parent directory if needed', async () => {
      const filePath = path.join(testDataPath, 'nested', 'deep', 'file.yaml');
      const data = { nested: true };

      await YamlHandler.write(filePath, data);

      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });
});
