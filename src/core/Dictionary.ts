import * as path from 'path';
import * as fs from 'fs/promises';
import { WriteOptions } from '../types';
import { YamlHandler } from '../utils/YamlHandler';
import { JsonHandler } from '../utils/JsonHandler';
import { FileLockManager } from '../utils/FileLockManager';
import { DataStore } from './DataStore';

/**
 * Dictionary - A key-value store with flexible storage modes
 * 
 * @extends DataStore
 * 
 * Supports two storage modes:
 * - **simple**: Single file containing all key-value pairs
 * - **splited**: Directory with individual files per key (efficient for large values)
 * 
 * @example
 * ```typescript
 * // Simple mode - all data in one file
 * const config = new Dictionary('config', './data');
 * 
 * // Splited mode - each key in separate file
 * const cache = new Dictionary('cache', './data', 'yaml', true);
 * ```
 */
export class Dictionary extends DataStore {
  /** Key-value data store */
  private data: Record<string, unknown> = {};

  /** True if using splited mode (directory with per-key files) */
  private splited: boolean;

  /** Tracks keys that have been modified (splited mode) */
  private dirtyKeys: Set<string> = new Set();

  /** Tracks keys that have been deleted (splited mode) */
  private deletedKeys: Set<string> = new Set();

  /**
   * Create a new Dictionary instance
   * 
   * @param {string} name - Dictionary name
   * @param {string} dataPath - Directory path where data will be stored
   * @param {'yaml' | 'json'} format - Data format, defaults to 'yaml'
   * @param {boolean} splited - Use splited mode (per-key files), defaults to false
   * @param {FileLockManager} [fileLockManager] - Optional custom lock manager
   */
  constructor(
    name: string,
    dataPath: string,
    format: 'yaml' | 'json' = 'yaml',
    splited: boolean = false,
    fileLockManager?: FileLockManager,
  ) {
    let filePath: string;
    if (splited) {
      // In splited mode, filePath is a directory
      filePath = path.join(dataPath, name);
    } else {
      // In simple mode, filePath is a single file
      const extension = format === 'json' ? 'json' : 'yaml';
      filePath = path.join(dataPath, `${name}.${extension}`);
    }
    super(filePath, format, fileLockManager);
    this.splited = splited;
  }

  /**
   * Load data from disk
   * 
   * @returns {Promise<void>}
   */
  async load(): Promise<void> {
    const releaseLock = await this.fileLockManager.acquireReadLock(this.filePath);
    try {
      if (this.splited) {
        await this.loadSplited();
      } else {
        await this.loadSimple();
      }
    } finally {
      releaseLock();
    }
  }

  /**
   * Load from a single file (simple mode)
   * 
   * @private
   * @returns {Promise<void>}
   */
  private async loadSimple(): Promise<void> {
    const content: unknown = this.format === 'json'
      ? await JsonHandler.read(this.filePath)
      : await YamlHandler.read(this.filePath);

    if (content && typeof content === 'object' && !Array.isArray(content)) {
      this.data = content as Record<string, unknown>;
    } else {
      // File doesn't exist or is empty - initialize with empty object
      this.data = {};
    }
  }

  /**
   * Load from directory with per-key files (splited mode)
   * 
   * @private
   * @returns {Promise<void>}
   */
  private async loadSplited(): Promise<void> {
    try {
      const files = await fs.readdir(this.filePath);

      for (const file of files) {
        const ext = path.extname(file);
        const key = path.basename(file, ext);
        const filePath = path.join(this.filePath, file);

        // Only load files with matching format
        if ((this.format === 'json' && ext === '.json') ||
          (this.format === 'yaml' && ext === '.yaml')) {
          const content: unknown = this.format === 'json'
            ? await JsonHandler.read(filePath)
            : await YamlHandler.read(filePath);

          this.data[key] = content;
        }
      }
    } catch (error) {
      // Directory doesn't exist yet, that's fine - start with empty data
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Set a key-value pair
   * 
   * @param {string} key - Key name
   * @param {unknown} value - Value to store
   * @param {WriteOptions} [options] - Write options (mode: 'async' | 'fast' | 'memory')
   * @returns {Promise<void>}
   */
  async set(key: string, value: unknown, options?: WriteOptions): Promise<void> {
    this.data[key] = value;

    const mode = options?.mode ?? 'async'; // Default to 'async'

    if (this.splited) {
      this.dirtyKeys.add(key);
      this.deletedKeys.delete(key); // In case it was marked for deletion
    }

    if (mode === 'async') {
      await this.sync(key);
    } else if (mode === 'fast') {
      // Fire and forget - sync in background
      void this.sync(key).catch(() => {
        // Error is emitted via event emitter
      });
    }
    // mode === 'memory' - no sync, only in-memory update
  }

  /**
   * Get the value for a key
   * 
   * @param {string} key - Key name
   * @returns {unknown} The stored value, or undefined if key doesn't exist
   */
  get(key: string): unknown {
    return this.data[key];
  }

  /**
   * Delete a key-value pair
   * 
   * @param {string} key - Key name
   * @param {WriteOptions} [options] - Write options (mode: 'async' | 'fast' | 'memory')
   * @returns {Promise<void>}
   */
  async delete(key: string, options?: WriteOptions): Promise<void> {
    delete this.data[key];

    const mode = options?.mode ?? 'async'; // Default to 'async'

    if (this.splited) {
      this.deletedKeys.add(key);
      this.dirtyKeys.delete(key);
    }

    if (mode === 'async') {
      await this.sync(key);
    } else if (mode === 'fast') {
      // Fire and forget - sync in background
      void this.sync(key).catch(() => {
        // Error is emitted via event emitter
      });
    }
    // mode === 'memory' - no sync, only in-memory update
  }

  /**
   * Get all key-value pairs
   * 
   * @returns {Record<string, unknown>} Copy of all data
   */
  getAll(): Record<string, unknown> {
    return { ...this.data };
  }

  /**
   * Get all keys
   * 
   * @returns {string[]} Array of all keys
   */
  keys(): string[] {
    return Object.keys(this.data);
  }

  /**
   * Get all values
   * 
   * @returns {unknown[]} Array of all values
   */
  values(): unknown[] {
    return Object.values(this.data);
  }

  /**
   * Check if a key exists
   * 
   * @param {string} key - Key name
   * @returns {boolean}
   */
  has(key: string): boolean {
    return key in this.data;
  }

  /**
   * Clear all key-value pairs
   * 
   * @param {WriteOptions} [options] - Write options (mode: 'async' | 'fast' | 'memory')
   * @returns {Promise<void>}
   */
  async clear(options?: WriteOptions): Promise<void> {
    if (this.splited) {
      // Mark all current keys for deletion
      Object.keys(this.data).forEach(key => this.deletedKeys.add(key));
      this.dirtyKeys.clear();
    }

    this.data = {};

    const mode = options?.mode ?? 'async'; // Default to 'async'

    if (mode === 'async') {
      await this.sync();
    } else if (mode === 'fast') {
      // Fire and forget - sync in background
      void this.sync().catch(() => {
        // Error is emitted via event emitter
      });
    }
  }

  /**
   * Sync data to disk with lock management
   * 
   * @param {string} [specificKey] - Optional specific key to sync (splited mode)
   * @returns {Promise<void>}
   */
  async sync(specificKey?: string): Promise<void> {
    const releaseLock = await this.fileLockManager.acquireWriteLock(this.filePath);

    try {
      if (this.splited) {
        await this.syncSplited(specificKey);
      } else {
        await this.serialize();
      }
      // Update metadata timestamp after successful write
      await this.metadataManager.touch();
      this.emit('written');
    } catch (error) {
      this.emit('error', error);
      throw error;
    } finally {
      releaseLock();
    }
  }

  /**
   * Serialize key-value pairs to file format
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
   * Clear in-memory data and tracking sets
   * 
   * @protected
   */
  protected clearData(): void {
    this.data = {};
    this.dirtyKeys.clear();
    this.deletedKeys.clear();
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

  /**
   * Sync splited mode data to individual key files
   * 
   * @private
   * @param {string} [specificKey] - Optional specific key to sync
   * @returns {Promise<void>}
   */
  private async syncSplited(specificKey?: string): Promise<void> {
    // Ensure directory exists
    await fs.mkdir(this.filePath, { recursive: true });

    if (specificKey) {
      // Sync only the specific key
      if (this.deletedKeys.has(specificKey)) {
        await this.deleteKeyFile(specificKey);
        this.deletedKeys.delete(specificKey);
      } else if (this.dirtyKeys.has(specificKey)) {
        await this.writeKeyFile(specificKey, this.data[specificKey]);
        this.dirtyKeys.delete(specificKey);
      }
    } else {
      // Sync all dirty keys
      for (const key of this.dirtyKeys) {
        await this.writeKeyFile(key, this.data[key]);
      }
      this.dirtyKeys.clear();

      // Delete all marked keys
      for (const key of this.deletedKeys) {
        await this.deleteKeyFile(key);
      }
      this.deletedKeys.clear();
    }
  }

  /**
   * Write a single key's value to file (splited mode)
   * 
   * @private
   * @param {string} key - Key name
   * @param {unknown} value - Value to write
   * @returns {Promise<void>}
   */
  private async writeKeyFile(key: string, value: unknown): Promise<void> {
    const extension = this.format === 'json' ? 'json' : 'yaml';
    const keyFilePath = path.join(this.filePath, `${key}.${extension}`);

    if (this.format === 'json') {
      await JsonHandler.write(keyFilePath, value);
    } else {
      await YamlHandler.write(keyFilePath, value);
    }
  }

  /**
   * Delete a key's file (splited mode)
   * 
   * @private
   * @param {string} key - Key name
   * @returns {Promise<void>}
   */
  private async deleteKeyFile(key: string): Promise<void> {
    const extension = this.format === 'json' ? 'json' : 'yaml';
    const keyFilePath = path.join(this.filePath, `${key}.${extension}`);

    try {
      await fs.unlink(keyFilePath);
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
