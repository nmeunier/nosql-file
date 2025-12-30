import * as path from 'path';
import * as fs from 'fs/promises';
import { Metadata } from '../types';
import { YamlHandler } from './YamlHandler';
import { JsonHandler } from './JsonHandler';

/**
 * MetadataManager - Manages metadata files for Collections and Dictionaries
 * 
 * Metadata is stored in separate files (*.meta.yaml or *.meta.json) to avoid
 * polluting the main data files.
 * 
 * @example
 * ```typescript
 * const manager = new MetadataManager('/data/users.yaml', 'yaml');
 * await manager.setMeta({ version: 1, tags: ['users', 'auth'] });
 * const meta = await manager.getMeta();
 * ```
 */
export class MetadataManager {
  /** Path to the metadata file */
  private metaFilePath: string;

  /** Data format: 'yaml' or 'json' */
  private format: 'yaml' | 'json';

  /**
   * Create a new MetadataManager
   * 
   * @param {string} dataFilePath - Path to the main data file
   * @param {'yaml' | 'json'} format - Format for the metadata file
   */
  constructor(dataFilePath: string, format: 'yaml' | 'json') {
    this.format = format;

    // Generate metadata file path
    // For 'users.yaml' -> 'users.meta.yaml'
    // For 'users.json' -> 'users.meta.json'
    const parsedPath = path.parse(dataFilePath);
    const extension = format === 'json' ? 'json' : 'yaml';
    this.metaFilePath = path.join(
      parsedPath.dir,
      `${parsedPath.name}.meta.${extension}`
    );
  }

  /**
   * Get the metadata file path
   * 
   * @returns {string} Path to the metadata file
   */
  getMetaFilePath(): string {
    return this.metaFilePath;
  }

  /**
   * Check if metadata file exists
   * 
   * @returns {Promise<boolean>} True if metadata file exists
   */
  async exists(): Promise<boolean> {
    try {
      await fs.access(this.metaFilePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load metadata from disk
   * 
   * @returns {Promise<Metadata>} Metadata object (empty if file doesn't exist)
   */
  async getMeta(): Promise<Metadata> {
    try {
      const content: unknown = this.format === 'json'
        ? await JsonHandler.read(this.metaFilePath)
        : await YamlHandler.read(this.metaFilePath);

      if (content && typeof content === 'object' && !Array.isArray(content)) {
        return content as Metadata;
      }
      return {};
    } catch {
      // File doesn't exist or is invalid
      return {};
    }
  }

  /**
   * Get all metadata including all fields
   * 
   * @returns {Promise<Metadata>} Complete metadata object
   */
  async getAllMeta(): Promise<Metadata> {
    return this.getMeta();
  }

  /**
   * Set or update metadata fields
   * 
   * @param {Partial<Metadata>} metadata - Metadata fields to set/update
   * @returns {Promise<void>}
   */
  async setMeta(metadata: Partial<Metadata>): Promise<void> {
    // Load existing metadata
    const existingMeta = await this.getMeta();

    // Merge with new metadata
    const updatedMeta: Metadata = {
      ...existingMeta,
      ...metadata,
    };

    // Merge custom fields if provided
    if (metadata.custom && existingMeta.custom) {
      updatedMeta.custom = {
        ...existingMeta.custom,
        ...metadata.custom,
      };
    }

    // Write to disk
    if (this.format === 'json') {
      await JsonHandler.write(this.metaFilePath, updatedMeta);
    } else {
      await YamlHandler.write(this.metaFilePath, updatedMeta);
    }
  }

  /**
   * Update the 'updatedAt' timestamp
   * 
   * @returns {Promise<void>}
   */
  async touch(): Promise<void> {
    const existingMeta = await this.getMeta();

    // Set createdAt if it doesn't exist
    if (!existingMeta.createdAt) {
      existingMeta.createdAt = new Date().toISOString();
    }

    // Always update updatedAt
    existingMeta.updatedAt = new Date().toISOString();

    await this.setMeta(existingMeta);
  }

  /**
   * Delete the metadata file
   * 
   * @returns {Promise<void>}
   */
  async deleteMeta(): Promise<void> {
    try {
      await fs.unlink(this.metaFilePath);
    } catch {
      // File doesn't exist - no action needed
    }
  }
}
