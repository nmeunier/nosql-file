import * as path from 'path';
import { WriteOptions } from '../types';
import { YamlHandler } from '../utils/YamlHandler';
import { JsonHandler } from '../utils/JsonHandler';
import { FileLockManager } from '../utils/FileLockManager';
import { DataStore } from './DataStore';

/**
 * Collection - A generic document store for array-based data
 * 
 * @template T - The document type, defaults to Record<string, unknown>
 * @extends DataStore
 * 
 * Supports CRUD operations (insert, find, update, delete) on documents
 * with three write modes: async, fast, and memory.
 * 
 * @example
 * ```typescript
 * const users = new Collection<User>('users', './data');
 * await users.insert({ name: 'Alice', age: 30 });
 * const results = users.find({ age: 30 });
 * ```
 */
export class Collection<T = Record<string, unknown>> extends DataStore {
  /** Array of documents */
  private data: T[] = [];

  /**
   * Create a new Collection instance
   * 
   * @param {string} name - Collection name (used as filename)
   * @param {string} dataPath - Directory path where data will be stored
   * @param {'yaml' | 'json'} format - Data format, defaults to 'yaml'
   * @param {FileLockManager} [fileLockManager] - Optional custom lock manager
   */
  constructor(name: string, dataPath: string, format: 'yaml' | 'json' = 'yaml', fileLockManager?: FileLockManager) {
    const extension = format === 'json' ? 'json' : 'yaml';
    const filePath = path.join(dataPath, `${name}.${extension}`);
    super(filePath, format, fileLockManager);
  }

  /**
   * Load documents from disk
   * 
   * @returns {Promise<void>}
   */
  async load(): Promise<void> {
    const releaseLock = await this.fileLockManager.acquireReadLock(this.filePath);
    try {
      const content: unknown = this.format === 'json'
        ? await JsonHandler.read(this.filePath)
        : await YamlHandler.read(this.filePath);

      if (Array.isArray(content)) {
        this.data = content as T[];
      } else {
        // File doesn't exist or is empty - initialize with empty array
        this.data = [];
      }
    } finally {
      releaseLock();
    }
  }

  /**
   * Insert a single document
   * 
   * @param {T} document - Document to insert
   * @param {WriteOptions} [options] - Write options (mode: 'async' | 'fast' | 'memory')
   * @returns {Promise<void>}
   */
  async insert(document: T, options?: WriteOptions): Promise<void> {
    this.data.push(document);

    const mode = options?.mode ?? 'async'; // Default to 'async'

    if (mode === 'async') {
      await this.sync();
    } else if (mode === 'fast') {
      // Fire and forget - sync in background
      void this.sync().catch(() => {
        // Error is emitted via event emitter
      });
    }
    // mode === 'memory' - no sync, only in-memory update
  }

  /**
   * Get all documents
   * 
   * @returns {T[]} Copy of all documents
   */
  getAll(): T[] {
    return [...this.data];
  }

  /**
   * Get the number of documents
   * 
   * @returns {number} Document count
   */
  count(): number {
    return this.data.length;
  }

  /**
   * Clear all documents
   * 
   * @param {WriteOptions} [options] - Write options (mode: 'async' | 'fast' | 'memory')
   * @returns {Promise<void>}
   */
  async clear(options?: WriteOptions): Promise<void> {
    this.data = [];

    const mode = options?.mode ?? 'async'; // Default to 'async'

    if (mode === 'async') {
      await this.sync();
    } else if (mode === 'fast') {
      // Fire and forget - sync in background
      void this.sync().catch(() => {
        // Error is emitted via event emitter
      });
    }
    // mode === 'memory' - no sync, only in-memory update
  }

  /**
   * Find documents matching a query
   * 
   * Uses AND logic - all query properties must match
   * 
   * @param {Partial<T>} [query] - Query object, empty or omitted returns all documents
   * @returns {T[]} Array of matching documents
   */
  find(query?: Partial<T>): T[] {
    // If no query provided, return all documents
    if (!query || Object.keys(query).length === 0) {
      return [...this.data];
    }

    // Filter documents matching all query properties (AND logic)
    return this.data.filter((doc) => {
      return Object.entries(query).every(([key, value]) => {
        return doc[key as keyof T] === value;
      });
    });
  }

  /**
   * Update documents matching a query
   * 
   * @param {Partial<T>} query - Query to match documents
   * @param {Partial<T>} updates - Properties to update
   * @param {WriteOptions} [options] - Write options (mode: 'async' | 'fast' | 'memory')
   * @returns {Promise<void>}
   */
  async update(query: Partial<T>, updates: Partial<T>, options?: WriteOptions): Promise<void> {
    // Find all matching documents and update them
    this.data = this.data.map((doc) => {
      const matches = Object.entries(query).every(([key, value]) => {
        return doc[key as keyof T] === value;
      });

      if (matches) {
        return { ...doc, ...updates };
      }
      return doc;
    });

    const mode = options?.mode ?? 'async'; // Default to 'async'

    if (mode === 'async') {
      await this.sync();
    } else if (mode === 'fast') {
      // Fire and forget - sync in background
      void this.sync().catch(() => {
        // Error is emitted via event emitter
      });
    }
    // mode === 'memory' - no sync, only in-memory update
  }

  /**
   * Delete documents matching a query
   * 
   * @param {Partial<T>} query - Query to match documents
   * @param {WriteOptions} [options] - Write options (mode: 'async' | 'fast' | 'memory')
   * @returns {Promise<void>}
   */
  async delete(query: Partial<T>, options?: WriteOptions): Promise<void> {
    // Filter out documents that match the query
    this.data = this.data.filter((doc) => {
      return !Object.entries(query).every(([key, value]) => {
        return doc[key as keyof T] === value;
      });
    });

    const mode = options?.mode ?? 'async'; // Default to 'async'

    if (mode === 'async') {
      await this.sync();
    } else if (mode === 'fast') {
      // Fire and forget - sync in background
      void this.sync().catch(() => {
        // Error is emitted via event emitter
      });
    }
    // mode === 'memory' - no sync, only in-memory update
  }

  /**
   * Serialize documents to file format
   * 
   * @returns {Promise<void>}
   */
  async serialize(): Promise<void> {
    if (this.format === 'json') {
      await JsonHandler.write(this.filePath, this.data);
    } else {
      await YamlHandler.write(this.filePath, this.data);
    }
  }

  /**
   * Clear in-memory data
   * 
   * @protected
   */
  protected clearData(): void {
    this.data = [];
  }

  /**
   * Discard in-memory changes and reload from disk
   * 
   * @returns {Promise<void>}
   */
  async discard(): Promise<void> {
    this.clearData();
    await this.load();
  }
}

