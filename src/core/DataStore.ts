import * as fs from 'fs/promises';
import { EventEmitter } from 'events';
import { FileLockManager } from '../utils/FileLockManager';

/**
 * Abstract base class for Collection and Dictionary
 * Handles common functionality like file I/O, locking, and events
 * 
 * @abstract
 * @extends EventEmitter
 * 
 * @emits written - Emitted when data is successfully synchronized to disk
 * @emits error - Emitted when an error occurs during sync
 */
export abstract class DataStore extends EventEmitter {
  /** File path where data is persisted */
  protected filePath: string;

  /** Data format: 'yaml' or 'json' */
  protected format: 'yaml' | 'json';

  /** File lock manager for concurrent access control */
  protected fileLockManager: FileLockManager;

  /**
   * Create a new DataStore instance
   * 
   * @param {string} filePath - Path to the file (or directory in splited mode)
   * @param {'yaml' | 'json'} format - Data format, defaults to 'yaml'
   * @param {FileLockManager} [fileLockManager] - Optional custom lock manager
   */
  constructor(filePath: string, format: 'yaml' | 'json' = 'yaml', fileLockManager?: FileLockManager) {
    super();
    this.filePath = filePath;
    this.format = format;
    this.fileLockManager = fileLockManager || new FileLockManager();
  }

  /**
   * Load data from disk
   * Subclasses must implement this
   * 
   * @abstract
   * @returns {Promise<void>}
   */
  abstract load(): Promise<void>;

  /**
   * Serialize and write data to disk
   * Subclasses must implement this
   * 
   * @abstract
   * @returns {Promise<void>}
   */
  abstract serialize(): Promise<void>;

  /**
   * Sync data to disk with lock management
   * Handles error emission and lock release
   * 
   * @returns {Promise<void>}
   * @emits written
   * @emits error
   */
  async sync(): Promise<void> {
    const releaseLock = await this.fileLockManager.acquireWriteLock(this.filePath);

    try {
      await this.serialize();
      this.emit('written');
    } catch (error) {
      this.emit('error', error);
      throw error;
    } finally {
      releaseLock();
    }
  }

  /**
   * Discard in-memory changes and reload from disk
   * 
   * @returns {Promise<void>}
   */
  async discard(): Promise<void> {
    await this.load();
  }

  /**
   * Drop the entire data store (delete file/directory and clear memory)
   * 
   * @returns {Promise<void>}
   */
  async drop(): Promise<void> {
    const releaseLock = await this.fileLockManager.acquireWriteLock(this.filePath);

    try {
      // Check if it's a directory (splited mode) or file
      try {
        const stats = await fs.stat(this.filePath);
        if (stats.isDirectory()) {
          await fs.rm(this.filePath, { recursive: true, force: true });
        } else {
          await fs.unlink(this.filePath);
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
        // File/directory doesn't exist, that's fine
      }

      // Clear in-memory data
      this.clearData();
    } finally {
      releaseLock();
    }
  }

  /**
   * Clear all in-memory data
   * Subclasses must implement this
   * 
   * @abstract
   * @protected
   */
  protected abstract clearData(): void;

  /**
   * Get the lock manager (for testing purposes)
   * 
   * @returns {FileLockManager}
   */
  getFileLockManager(): FileLockManager {
    return this.fileLockManager;
  }
}
