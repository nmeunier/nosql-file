export interface WriteOptions {
  mode?: 'async' | 'fast' | 'memory';
}

export interface DatabaseOptions {
  format?: 'yaml' | 'json';
  disableMetadata?: boolean;
}

export interface DictionaryOptions {
  splited?: boolean;
  disableMetadata?: boolean;
}

/**
 * Metadata structure for Collections and Dictionaries
 * 
 * @interface Metadata
 * @property {string} [createdAt] - ISO 8601 timestamp of creation
 * @property {string} [updatedAt] - ISO 8601 timestamp of last update
 * @property {number} [version] - Version number for data schema
 * @property {string[]} [tags] - Tags for categorization
 * @property {Record<string, unknown>} [custom] - Custom metadata fields
 */
export interface Metadata {
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  tags?: string[];
  custom?: Record<string, unknown>;
}
