export interface WriteOptions {
  mode?: 'async' | 'fast' | 'memory';
}

export interface DatabaseOptions {
  format?: 'yaml' | 'json';
}

export interface DictionaryOptions {
  splited?: boolean;
}
