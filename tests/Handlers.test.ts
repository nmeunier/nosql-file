import * as path from 'path';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import { JsonHandler } from '../src/utils/JsonHandler';
import { YamlHandler } from '../src/utils/YamlHandler';

describe('JsonHandler - Synchronous Operations', () => {
  const testDataPath = path.join(__dirname, '../data/test-handlers-sync');

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

  describe('readSync', () => {
    it('should read valid JSON synchronously', () => {
      const filePath = path.join(testDataPath, 'valid-sync.json');
      const data = { name: 'test', value: 123 };

      fsSync.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

      const result = JsonHandler.readSync(filePath);
      expect(result).toEqual(data);
    });

    it('should return null for non-existent files', () => {
      const filePath = path.join(testDataPath, 'nonexistent-sync.json');
      const result = JsonHandler.readSync(filePath);
      expect(result).toBeNull();
    });

    it('should throw error for invalid JSON', () => {
      const filePath = path.join(testDataPath, 'invalid-sync.json');
      fsSync.writeFileSync(filePath, '{ invalid json }', 'utf-8');

      expect(() => JsonHandler.readSync(filePath)).toThrow();
    });
  });

  describe('writeSync', () => {
    it('should write valid JSON synchronously', () => {
      const filePath = path.join(testDataPath, 'write-sync.json');
      const data = { name: 'test', value: 456 };

      JsonHandler.writeSync(filePath, data);

      const content = fsSync.readFileSync(filePath, 'utf-8');
      expect(JSON.parse(content)).toEqual(data);
    });

    it('should create parent directory if needed', () => {
      const filePath = path.join(testDataPath, 'nested', 'deep', 'file-sync.json');
      const data = { nested: true };

      JsonHandler.writeSync(filePath, data);

      expect(fsSync.existsSync(filePath)).toBe(true);
      const content = fsSync.readFileSync(filePath, 'utf-8');
      expect(JSON.parse(content)).toEqual(data);
    });
  });
});

describe('YamlHandler - Synchronous Operations', () => {
  const testDataPath = path.join(__dirname, '../data/test-handlers-sync');

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

  describe('readSync', () => {
    it('should read valid YAML synchronously', () => {
      const filePath = path.join(testDataPath, 'valid-sync.yaml');
      const data = 'name: test\nvalue: 123\n';

      fsSync.writeFileSync(filePath, data, 'utf-8');

      const result = YamlHandler.readSync(filePath);
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should return null for non-existent files', () => {
      const filePath = path.join(testDataPath, 'nonexistent-sync.yaml');
      const result = YamlHandler.readSync(filePath);
      expect(result).toBeNull();
    });

    it('should throw error for invalid YAML', () => {
      const filePath = path.join(testDataPath, 'invalid-sync.yaml');
      fsSync.writeFileSync(filePath, 'key: [invalid, unclosed', 'utf-8');

      expect(() => YamlHandler.readSync(filePath)).toThrow();
    });
  });

  describe('writeSync', () => {
    it('should write valid YAML synchronously', () => {
      const filePath = path.join(testDataPath, 'write-sync.yaml');
      const data = { name: 'test', value: 456 };

      YamlHandler.writeSync(filePath, data);

      const content = fsSync.readFileSync(filePath, 'utf-8');
      expect(content).toContain('name: test');
      expect(content).toContain('value: 456');
    });

    it('should create parent directory if needed', () => {
      const filePath = path.join(testDataPath, 'nested', 'deep', 'file-sync.yaml');
      const data = { nested: true };

      YamlHandler.writeSync(filePath, data);

      expect(fsSync.existsSync(filePath)).toBe(true);
    });
  });
});

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
