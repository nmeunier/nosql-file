import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { NoSqlFile } from '../src/core/Database';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Collection - Basic Operations', () => {
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

  test('should insert and retrieve a document', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });

    const allUsers = users.getAll();
    expect(allUsers).toHaveLength(1);
    expect(allUsers[0]).toEqual({ id: 1, name: 'John' });
  });

  test('should persist data to YAML file', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });

    // Check file exists
    const filePath = path.join(testDataPath, 'users.yaml');
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    // Check file content
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('id: 1');
    expect(content).toContain('name: John');
  });

  test('should write multiple documents to YAML file', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });
    await users.insert({ id: 2, name: 'Jane' });
    await users.insert({ id: 3, name: 'Bob' });

    const filePath = path.join(testDataPath, 'users.yaml');
    const content = await fs.readFile(filePath, 'utf-8');

    expect(content).toContain('id: 1');
    expect(content).toContain('name: John');
    expect(content).toContain('id: 2');
    expect(content).toContain('name: Jane');
    expect(content).toContain('id: 3');
    expect(content).toContain('name: Bob');
  });

  test('should overwrite file content on sync', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });

    const filePath = path.join(testDataPath, 'users.yaml');
    const firstContent = await fs.readFile(filePath, 'utf-8');

    await users.insert({ id: 2, name: 'Jane' });

    const secondContent = await fs.readFile(filePath, 'utf-8');

    expect(firstContent).not.toEqual(secondContent);
    expect(secondContent).toContain('id: 1');
    expect(secondContent).toContain('id: 2');
  });

  test('should write valid YAML format', async () => {
    const products = await db.collection('products');

    await products.insert({
      id: 1,
      name: 'Laptop',
      price: 999.99,
      tags: ['electronics', 'computers'],
    });

    const filePath = path.join(testDataPath, 'products.yaml');
    const content = await fs.readFile(filePath, 'utf-8');

    expect(content).toContain('id: 1');
    expect(content).toContain('name: Laptop');
    expect(content).toContain('price: 999.99');
    expect(content).toContain('tags:');
    expect(content).toContain('electronics');
    expect(content).toContain('computers');
  });
});

describe('Collection - JSON Format', () => {
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

  test('should insert and retrieve a document in JSON', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });

    const allUsers = users.getAll();
    expect(allUsers).toHaveLength(1);
    expect(allUsers[0]).toEqual({ id: 1, name: 'John' });
  });

  test('should persist data to JSON file', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });

    // Check file exists
    const filePath = path.join(testDataPath, 'users.json');
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    // Check file content
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('"id": 1');
    expect(content).toContain('"name": "John"');
  });

  test('should write multiple documents to JSON file', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });
    await users.insert({ id: 2, name: 'Jane' });
    await users.insert({ id: 3, name: 'Bob' });

    const filePath = path.join(testDataPath, 'users.json');
    const content = await fs.readFile(filePath, 'utf-8');

    expect(content).toContain('"id": 1');
    expect(content).toContain('"name": "John"');
    expect(content).toContain('"id": 2');
    expect(content).toContain('"name": "Jane"');
    expect(content).toContain('"id": 3');
    expect(content).toContain('"name": "Bob"');
  });

  test('should write valid JSON format', async () => {
    const products = await db.collection('products');

    await products.insert({
      id: 1,
      name: 'Laptop',
      price: 999.99,
      tags: ['electronics', 'computers'],
    });

    const filePath = path.join(testDataPath, 'products.json');
    const content = await fs.readFile(filePath, 'utf-8');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsed = JSON.parse(content);

    expect(parsed).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(parsed[0]).toEqual({
      id: 1,
      name: 'Laptop',
      price: 999.99,
      tags: ['electronics', 'computers'],
    });
  });

  test('should parse JSON file content correctly', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John', age: 30 });
    await users.insert({ id: 2, name: 'Jane', age: 25 });

    const filePath = path.join(testDataPath, 'users.json');
    const content = await fs.readFile(filePath, 'utf-8');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsed = JSON.parse(content);

    expect(parsed).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(parsed[0].age).toBe(30);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(parsed[1].age).toBe(25);
  });
});

describe('Collection - Initial Load', () => {
  const testDataPath = path.join(__dirname, '../data/test');

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
    // Create a YAML file with initial data
    const filePath = path.join(testDataPath, 'users.yaml');
    const initialData = `- id: 1
  name: John
- id: 2
  name: Jane
`;
    await fs.writeFile(filePath, initialData, 'utf-8');

    // Create database and load collection
    const db = new NoSqlFile(testDataPath);
    const users = await db.collection('users');

    // Verify data was loaded
    const allUsers = users.getAll();
    expect(allUsers).toHaveLength(2);
    expect(allUsers[0]).toEqual({ id: 1, name: 'John' });
    expect(allUsers[1]).toEqual({ id: 2, name: 'Jane' });
  });

  test('should load existing JSON data on initialization', async () => {
    // Create a JSON file with initial data
    const filePath = path.join(testDataPath, 'users.json');
    const initialData = JSON.stringify([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ]);
    await fs.writeFile(filePath, initialData, 'utf-8');

    // Create database with JSON format and load collection
    const db = new NoSqlFile(testDataPath, { format: 'json' });
    const users = await db.collection('users');

    // Verify data was loaded
    const allUsers = users.getAll();
    expect(allUsers).toHaveLength(2);
    expect(allUsers[0]).toEqual({ id: 1, name: 'John' });
    expect(allUsers[1]).toEqual({ id: 2, name: 'Jane' });
  });

  test('should initialize empty collection if file does not exist', async () => {
    const db = new NoSqlFile(testDataPath);
    const users = await db.collection('users');

    const allUsers = users.getAll();
    expect(allUsers).toHaveLength(0);
  });

  test('should preserve loaded data and add new documents', async () => {
    // Create a YAML file with initial data
    const filePath = path.join(testDataPath, 'users.yaml');
    const initialData = `- id: 1
  name: John
`;
    await fs.writeFile(filePath, initialData, 'utf-8');

    // Create database and load collection
    const db = new NoSqlFile(testDataPath);
    const users = await db.collection('users');

    // Add new document
    await users.insert({ id: 2, name: 'Jane' });

    // Verify both old and new data are present
    const allUsers = users.getAll();
    expect(allUsers).toHaveLength(2);
    expect(allUsers[0]).toEqual({ id: 1, name: 'John' });
    expect(allUsers[1]).toEqual({ id: 2, name: 'Jane' });
  });
});

describe('Collection - EventEmitter', () => {
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

  test('should emit "written" event after successful insert', async () => {
    const users = await db.collection('users');

    const writtenPromise = new Promise<void>((resolve) => {
      users.on('written', () => {
        resolve();
      });
    });

    await users.insert({ id: 1, name: 'John' });
    await writtenPromise;
  });

  test('should emit "written" event after manual sync', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' }, { mode: 'memory' });

    const writtenPromise = new Promise<void>((resolve) => {
      users.on('written', () => {
        resolve();
      });
    });

    await users.sync();
    await writtenPromise;
  });

  test('should emit "error" event on write failure', async () => {
    // Create an invalid path to force an error
    const invalidDb = new NoSqlFile('/invalid/nonexistent/path');
    const invalidCollection = await invalidDb.collection('users');

    const errorPromise = new Promise<Error>((resolve) => {
      invalidCollection.on('error', (error: Error) => {
        resolve(error);
      });
    });

    try {
      await invalidCollection.insert({ id: 1, name: 'John' });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Expected to throw
    }

    const error = await errorPromise;
    expect(error).toBeDefined();
  });

  test('should emit "written" event multiple times for multiple inserts', async () => {
    const users = await db.collection('users');

    let writtenCount = 0;
    users.on('written', () => {
      writtenCount++;
    });

    await users.insert({ id: 1, name: 'John' });
    await users.insert({ id: 2, name: 'Jane' });
    await users.insert({ id: 3, name: 'Bob' });

    expect(writtenCount).toBe(3);
  });

  test('should allow multiple listeners on "written" event', async () => {
    const users = await db.collection('users');

    let listener1Called = false;
    let listener2Called = false;

    users.on('written', () => {
      listener1Called = true;
    });

    users.on('written', () => {
      listener2Called = true;
    });

    await users.insert({ id: 1, name: 'John' });

    expect(listener1Called).toBe(true);
    expect(listener2Called).toBe(true);
  });
});

describe('Collection - Find Operations', () => {
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

  test('should find all documents when no query provided', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John', age: 30 });
    await users.insert({ id: 2, name: 'Jane', age: 25 });
    await users.insert({ id: 3, name: 'Bob', age: 35 });

    const results = users.find();
    expect(results).toHaveLength(3);
  });

  test('should find documents by single property', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John', age: 30 });
    await users.insert({ id: 2, name: 'Jane', age: 25 });
    await users.insert({ id: 3, name: 'John', age: 35 });

    const results = users.find({ name: 'John' });
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({ id: 1, name: 'John', age: 30 });
    expect(results[1]).toEqual({ id: 3, name: 'John', age: 35 });
  });

  test('should find documents by multiple properties (AND logic)', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John', age: 30 });
    await users.insert({ id: 2, name: 'John', age: 25 });
    await users.insert({ id: 3, name: 'Jane', age: 30 });

    const results = users.find({ name: 'John', age: 30 });
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ id: 1, name: 'John', age: 30 });
  });

  test('should return empty array when no matches found', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John', age: 30 });
    await users.insert({ id: 2, name: 'Jane', age: 25 });

    const results = users.find({ name: 'NonExistent' });
    expect(results).toHaveLength(0);
    expect(results).toEqual([]);
  });

  test('should return empty array when collection is empty', async () => {
    const users = await db.collection('users');

    const results = users.find({ name: 'John' });
    expect(results).toHaveLength(0);
  });

  test('should find documents with different data types', async () => {
    const products = await db.collection('products');

    await products.insert({ id: 1, name: 'Laptop', price: 999.99, inStock: true });
    await products.insert({ id: 2, name: 'Mouse', price: 29.99, inStock: false });
    await products.insert({ id: 3, name: 'Keyboard', price: 79.99, inStock: true });

    const inStockProducts = products.find({ inStock: true });
    expect(inStockProducts).toHaveLength(2);
    expect(inStockProducts[0]).toBeDefined();
    expect(inStockProducts[1]).toBeDefined();
    expect(inStockProducts[0]?.name).toBe('Laptop');
    expect(inStockProducts[1]?.name).toBe('Keyboard');
  });

  test('should find documents by numeric properties', async () => {
    const products = await db.collection('products');

    await products.insert({ id: 1, name: 'Laptop', price: 999.99 });
    await products.insert({ id: 2, name: 'Mouse', price: 29.99 });
    await products.insert({ id: 3, name: 'Tablet', price: 999.99 });

    const results = products.find({ price: 999.99 });
    expect(results).toHaveLength(2);
  });

  test('should match nested object properties', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John', address: { city: 'Paris', country: 'France' } });
    await users.insert({ id: 2, name: 'Jane', address: { city: 'London', country: 'UK' } });

    // Simple property match (not deep)
    const results = users.find({ name: 'John' });
    expect(results).toHaveLength(1);
    expect(results[0]).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    expect((results[0] as any).address.city).toBe('Paris');
  });

  test('should return new array instance, not reference to internal data', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });

    const results1 = users.find();
    const results2 = users.find();

    expect(results1).not.toBe(results2);
    expect(results1).toEqual(results2);
  });
});

describe('Collection - Update Operations', () => {
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

  test('should update a single document', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John', age: 30 });
    await users.insert({ id: 2, name: 'Jane', age: 25 });

    await users.update({ id: 1 }, { name: 'John Doe', age: 31 });

    const results = users.find({ id: 1 });
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ id: 1, name: 'John Doe', age: 31 });
  });

  test('should update multiple documents matching query', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John', status: 'active' });
    await users.insert({ id: 2, name: 'Jane', status: 'active' });
    await users.insert({ id: 3, name: 'Bob', status: 'inactive' });

    await users.update({ status: 'active' }, { status: 'verified' });

    const verified = users.find({ status: 'verified' });
    expect(verified).toHaveLength(2);
  });

  test('should update only specified properties', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John', age: 30, email: 'john@example.com' });

    await users.update({ id: 1 }, { age: 31 });

    const results = users.find({ id: 1 });
    expect(results[0]).toEqual({ id: 1, name: 'John', age: 31, email: 'john@example.com' });
  });

  test('should not update if no documents match query', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John', age: 30 });

    await users.update({ id: 999 }, { name: 'Updated' });

    const all = users.find();
    expect(all).toHaveLength(1);
    expect(all[0]).toEqual({ id: 1, name: 'John', age: 30 });
  });

  test('should persist updates to disk', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John', age: 30 });
    await users.update({ id: 1 }, { age: 31 });

    const filePath = path.join(testDataPath, 'users.yaml');
    const content = await fs.readFile(filePath, 'utf-8');

    expect(content).toContain('age: 31');
    expect(content).not.toContain('age: 30');
  });

  test('should emit "written" event after update', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });

    const writtenPromise = new Promise<void>((resolve) => {
      users.once('written', () => {
        resolve();
      });
    });

    await users.update({ id: 1 }, { name: 'John Doe' });
    await writtenPromise;
  });
});

describe('Collection - Delete Operations', () => {
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

  test('should delete a single document', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });
    await users.insert({ id: 2, name: 'Jane' });

    await users.delete({ id: 1 });

    const all = users.find();
    expect(all).toHaveLength(1);
    expect(all[0]).toEqual({ id: 2, name: 'Jane' });
  });

  test('should delete multiple documents matching query', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John', status: 'inactive' });
    await users.insert({ id: 2, name: 'Jane', status: 'active' });
    await users.insert({ id: 3, name: 'Bob', status: 'inactive' });

    await users.delete({ status: 'inactive' });

    const all = users.find();
    expect(all).toHaveLength(1);
    expect(all[0]).toEqual({ id: 2, name: 'Jane', status: 'active' });
  });

  test('should not delete if no documents match query', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });
    await users.insert({ id: 2, name: 'Jane' });

    await users.delete({ id: 999 });

    const all = users.find();
    expect(all).toHaveLength(2);
  });

  test('should persist deletions to disk', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });
    await users.insert({ id: 2, name: 'Jane' });

    await users.delete({ id: 1 });

    const filePath = path.join(testDataPath, 'users.yaml');
    const content = await fs.readFile(filePath, 'utf-8');

    expect(content).toContain('id: 2');
    expect(content).toContain('name: Jane');
    expect(content).not.toContain('name: John');
  });

  test('should emit "written" event after delete', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });

    const writtenPromise = new Promise<void>((resolve) => {
      users.once('written', () => {
        resolve();
      });
    });

    await users.delete({ id: 1 });
    await writtenPromise;
  });

  test('should delete all documents if query matches all', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John', active: true });
    await users.insert({ id: 2, name: 'Jane', active: true });

    await users.delete({ active: true });

    const all = users.find();
    expect(all).toHaveLength(0);
  });
});

describe('Collection - Fast Mode', () => {
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

  test('should insert in fast mode without waiting', async () => {
    const users = await db.collection('users');

    // Fast mode should return immediately
    const startTime = Date.now();
    await users.insert({ id: 1, name: 'John' }, { mode: 'fast' });
    const duration = Date.now() - startTime;

    // Should return almost immediately (< 50ms)
    expect(duration).toBeLessThan(50);

    // Data should be in memory immediately
    const results = users.find({ id: 1 });
    expect(results).toHaveLength(1);
  });

  test('should emit "written" event after fast insert completes', async () => {
    const users = await db.collection('users');

    const writtenPromise = new Promise<void>((resolve) => {
      users.once('written', () => {
        resolve();
      });
    });

    await users.insert({ id: 1, name: 'John' }, { mode: 'fast' });

    // Wait for the background write to complete
    await writtenPromise;

    // Verify file was written
    const filePath = path.join(testDataPath, 'users.yaml');
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });

  test('should update in fast mode without waiting', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });

    const startTime = Date.now();
    await users.update({ id: 1 }, { name: 'John Doe' }, { mode: 'fast' });
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(50);

    const results = users.find({ id: 1 });
    expect(results[0]?.name).toBe('John Doe');
  });

  test('should delete in fast mode without waiting', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });
    await users.insert({ id: 2, name: 'Jane' });

    const startTime = Date.now();
    await users.delete({ id: 1 }, { mode: 'fast' });
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(50);

    const results = users.find();
    expect(results).toHaveLength(1);
  });

  test('should persist fast mode operations to disk eventually', async () => {
    const users = await db.collection('users');

    const writtenPromise = new Promise<void>((resolve) => {
      users.once('written', () => {
        resolve();
      });
    });

    await users.insert({ id: 1, name: 'John' }, { mode: 'fast' });

    // Wait for background write
    await writtenPromise;

    // Verify data was persisted
    const filePath = path.join(testDataPath, 'users.yaml');
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('name: John');
  });

  test('should handle multiple fast mode operations', async () => {
    const users = await db.collection('users');

    let writtenCount = 0;
    users.on('written', () => {
      writtenCount++;
    });

    // Multiple fast mode inserts
    await users.insert({ id: 1, name: 'John' }, { mode: 'fast' });
    await users.insert({ id: 2, name: 'Jane' }, { mode: 'fast' });
    await users.insert({ id: 3, name: 'Bob' }, { mode: 'fast' });

    // Data should be in memory immediately
    expect(users.find()).toHaveLength(3);

    // Wait for all background writes
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(writtenCount).toBe(3);
  });
});

describe('Collection - Utility Methods', () => {
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

  test('should return count of documents in collection', async () => {
    const users = await db.collection('users');

    expect(users.count()).toBe(0);

    await users.insert({ id: 1, name: 'John' });
    expect(users.count()).toBe(1);

    await users.insert({ id: 2, name: 'Jane' });
    await users.insert({ id: 3, name: 'Bob' });
    expect(users.count()).toBe(3);
  });

  test('should update count after delete', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });
    await users.insert({ id: 2, name: 'Jane' });
    expect(users.count()).toBe(2);

    await users.delete({ id: 1 });
    expect(users.count()).toBe(1);
  });

  test('should clear all documents from collection', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });
    await users.insert({ id: 2, name: 'Jane' });
    await users.insert({ id: 3, name: 'Bob' });

    expect(users.count()).toBe(3);

    await users.clear();

    expect(users.count()).toBe(0);
    expect(users.find()).toHaveLength(0);
  });

  test('should persist clear to disk', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });
    await users.insert({ id: 2, name: 'Jane' });

    await users.clear();

    const filePath = path.join(testDataPath, 'users.yaml');
    const content = await fs.readFile(filePath, 'utf-8');

    // Should contain empty array
    expect(content.trim()).toBe('[]');
  });

  test('should emit "written" event after clear', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' });

    const writtenPromise = new Promise<void>((resolve) => {
      users.once('written', () => {
        resolve();
      });
    });

    await users.clear();
    await writtenPromise;
  });

  test('should clear empty collection without error', async () => {
    const users = await db.collection('users');

    expect(users.count()).toBe(0);
    await users.clear();
    expect(users.count()).toBe(0);
  });

  test('should count documents loaded from file', async () => {
    // Create a YAML file with initial data
    const filePath = path.join(testDataPath, 'users.yaml');
    const initialData = `- id: 1
  name: John
- id: 2
  name: Jane
- id: 3
  name: Bob
`;
    await fs.writeFile(filePath, initialData, 'utf-8');

    const db2 = new NoSqlFile(testDataPath);
    const users = await db2.collection('users');

    expect(users.count()).toBe(3);
  });
});

describe('Collection - Memory-Only Mode', () => {
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

  test('should not auto-sync when mode is memory', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' }, { mode: 'memory' });

    // File should not exist yet
    const filePath = path.join(testDataPath, 'users.yaml');
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(false);

    // Data should be in memory
    expect(users.count()).toBe(1);
  });

  test('should perform multiple operations without writing to disk', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' }, { mode: 'memory' });
    await users.insert({ id: 2, name: 'Jane' }, { mode: 'memory' });
    await users.update({ id: 1 }, { name: 'John Doe' }, { mode: 'memory' });
    await users.delete({ id: 2 }, { mode: 'memory' });

    // File should not exist
    const filePath = path.join(testDataPath, 'users.yaml');
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(false);

    // Data should be correct in memory
    expect(users.count()).toBe(1);
    const results = users.find({ id: 1 });
    expect(results[0]?.name).toBe('John Doe');
  });

  test('should write to disk on manual sync', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' }, { mode: 'memory' });
    await users.insert({ id: 2, name: 'Jane' }, { mode: 'memory' });

    // Manually sync
    await users.sync();

    // File should now exist
    const filePath = path.join(testDataPath, 'users.yaml');
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);

    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('name: John');
    expect(content).toContain('name: Jane');
  });

  test('should switch between memory and async modes', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' }, { mode: 'memory' });

    const filePath = path.join(testDataPath, 'users.yaml');
    let fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(false);

    // Use async mode (default)
    await users.insert({ id: 2, name: 'Jane' });

    // File should now exist
    fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });

  test('should batch operations in memory-only mode', async () => {
    const users = await db.collection('users');

    // Batch insert
    await users.insert({ id: 1, name: 'John' }, { mode: 'memory' });
    await users.insert({ id: 2, name: 'Jane' }, { mode: 'memory' });
    await users.insert({ id: 3, name: 'Bob' }, { mode: 'memory' });
    await users.insert({ id: 4, name: 'Alice' }, { mode: 'memory' });

    expect(users.count()).toBe(4);

    // Sync all at once
    await users.sync();

    const filePath = path.join(testDataPath, 'users.yaml');
    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toContain('id: 1');
    expect(content).toContain('id: 4');
  });

  test('should not emit "written" event without sync in memory mode', async () => {
    const users = await db.collection('users');

    let writtenEmitted = false;
    users.on('written', () => {
      writtenEmitted = true;
    });

    await users.insert({ id: 1, name: 'John' }, { mode: 'memory' });

    // Wait a bit to ensure no event is emitted
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(writtenEmitted).toBe(false);
  });

  test('should emit "written" event on manual sync', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' }, { mode: 'memory' });

    const writtenPromise = new Promise<void>((resolve) => {
      users.once('written', () => {
        resolve();
      });
    });

    await users.sync();
    await writtenPromise;
  });

  test('should clear in memory-only mode without writing', async () => {
    const users = await db.collection('users');

    await users.insert({ id: 1, name: 'John' }, { mode: 'memory' });
    await users.insert({ id: 2, name: 'Jane' }, { mode: 'memory' });

    await users.clear({ mode: 'memory' });

    expect(users.count()).toBe(0);

    // File should not exist
    const filePath = path.join(testDataPath, 'users.yaml');
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(false);
  });

  test('should respect explicit mode parameter', async () => {
    const users = await db.collection('users');

    // Explicit async mode should sync immediately
    await users.insert({ id: 1, name: 'John' }, { mode: 'async' });

    const filePath = path.join(testDataPath, 'users.yaml');
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });
});
