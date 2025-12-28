import { Collection } from './Collection';
import { Dictionary } from './Dictionary';
import { DatabaseOptions, DictionaryOptions } from '../types';
import { FileLockManager } from '../utils/FileLockManager';

/**
 * NoSqlFile - Main database manager for collections and dictionaries
 * 
 * Manages the lifecycle of collections and dictionaries, handles shared
 * file locking, and provides bulk operations like syncAll() and close().
 * 
 * @example
 * ```typescript
 * const db = new NoSqlFile('./data', { format: 'json' });
 * 
 * const users = await db.collection('users');
 * const config = await db.dictionary('config');
 * 
 * await db.syncAll();  // Sync all changes
 * await db.close();    // Close and sync
 * ```
 */
export class NoSqlFile {
  /** Path where all data is stored */
  private dataPath: string;

  /** Default data format for new collections/dictionaries */
  private format: 'yaml' | 'json';

  /** Cache of loaded collections */
  private collections: Map<string, Collection> = new Map();

  /** Cache of loaded dictionaries */
  private dictionaries: Map<string, Dictionary> = new Map();

  /** Shared lock manager for concurrent access control */
  private fileLockManager: FileLockManager = new FileLockManager();

  /**
   * Create a new NoSqlFile instance
   * 
   * @param {string} dataPath - Directory path where all data will be stored
   * @param {DatabaseOptions} [options] - Configuration options
   * @param {string} [options.format='yaml'] - Default data format
   */
  constructor(dataPath: string, options?: DatabaseOptions) {
    this.dataPath = dataPath;
    this.format = options?.format || 'yaml';
  }

  /**
   * Get or create a collection
   * 
   * Lazy-loads the collection from disk on first access
   * 
   * @param {string} name - Collection name
   * @returns {Promise<Collection>} The collection instance
   */
  async collection(name: string): Promise<Collection> {
    if (!this.collections.has(name)) {
      const collection = new Collection(name, this.dataPath, this.format, this.fileLockManager);
      await collection.load();
      this.collections.set(name, collection);
    }
    return this.collections.get(name)!;
  }

  /**
   * Get or create a dictionary
   * 
   * Lazy-loads the dictionary from disk on first access
   * 
   * @param {string} name - Dictionary name
   * @param {DictionaryOptions} [options] - Configuration options
   * @param {boolean} [options.splited=false] - Use splited mode (per-key files)
   * @returns {Promise<Dictionary>} The dictionary instance
   */
  async dictionary(name: string, options?: DictionaryOptions): Promise<Dictionary> {
    const key = `${name}-${options?.splited || false}`;
    if (!this.dictionaries.has(key)) {
      const dictionary = new Dictionary(name, this.dataPath, this.format, options?.splited, this.fileLockManager);
      await dictionary.load();
      this.dictionaries.set(key, dictionary);
    }
    return this.dictionaries.get(key)!;
  }

  /**
   * Synchronize all collections and dictionaries to disk
   * 
   * @returns {Promise<void>}
   */
  async syncAll(): Promise<void> {
    const syncPromises: Promise<void>[] = [];

    // Sync all collections
    for (const collection of this.collections.values()) {
      syncPromises.push(collection.sync());
    }

    // Sync all dictionaries
    for (const dictionary of this.dictionaries.values()) {
      syncPromises.push(dictionary.sync());
    }

    await Promise.all(syncPromises);
  }

  /**
   * Close the database (sync all pending writes)
   * 
   * @returns {Promise<void>}
   */
  async close(): Promise<void> {
    // Sync all pending writes before closing
    await this.syncAll();
  }

  /**
   * Discard all in-memory changes and reload from disk
   * 
   * @returns {Promise<void>}
   */
  async discardAll(): Promise<void> {
    const discardPromises: Promise<void>[] = [];

    // Discard all collections
    for (const collection of this.collections.values()) {
      discardPromises.push(collection.discard());
    }

    // Discard all dictionaries
    for (const dictionary of this.dictionaries.values()) {
      discardPromises.push(dictionary.discard());
    }

    await Promise.all(discardPromises);
  }

  /**
   * Delete a collection and its data file
   * 
   * @param {string} name - Collection name
   * @returns {Promise<void>}
   */
  async dropCollection(name: string): Promise<void> {
    const collection = this.collections.get(name);
    if (collection) {
      await collection.drop();
      this.collections.delete(name);
    }
  }

  /**
   * Delete a dictionary and its data (file or directory)
   * 
   * @param {string} name - Dictionary name
   * @param {DictionaryOptions} [options] - Configuration options
   * @param {boolean} [options.splited=false] - Must match the mode used to create it
   * @returns {Promise<void>}
   */
  async dropDictionary(name: string, options?: DictionaryOptions): Promise<void> {
    const key = `${name}-${options?.splited || false}`;
    const dictionary = this.dictionaries.get(key);
    if (dictionary) {
      await dictionary.drop();
      this.dictionaries.delete(key);
    }
  }

  /**
   * Get the shared lock manager (for internal use and testing)
   * 
   * @returns {FileLockManager}
   */
  getFileLockManager(): FileLockManager {
    return this.fileLockManager;
  }
}
