/**
 * Example: Using NoSQL File with Application Configuration (Synchronous)
 * 
 * This example demonstrates how to use synchronous methods to load
 * configuration at Application application startup, particularly useful
 * for reading JWT secrets and other sensitive configuration data.
 */

import { Dictionary } from '../src/core/Dictionary';
import { Collection } from '../src/core/Collection';
import * as path from 'path';

// ============================================
// Example 1: Dictionary for Configuration
// ============================================

interface AppConfig {
  JWT_SECRET: string;
  DATABASE_URL: string;
  PORT: number;
  REDIS_HOST: string;
  REDIS_PORT: number;
}

/**
 * Load configuration synchronously for Application
 * This can be used in ConfigModule or main.ts before app starts
 */
function loadConfig(): AppConfig {
  const dataPath = path.join(__dirname, 'data');
  const config = new Dictionary('app-config', dataPath, 'yaml');

  // Load configuration synchronously - perfect for Application startup
  config.loadSync();

  // Access configuration values
  const jwtSecret = config.get('JWT_SECRET') as string;
  const databaseUrl = config.get('DATABASE_URL') as string;
  const port = config.get('PORT') as number;
  const redisHost = config.get('REDIS_HOST') as string;
  const redisPort = config.get('REDIS_PORT') as number;

  return {
    JWT_SECRET: jwtSecret || 'default-secret',
    DATABASE_URL: databaseUrl || 'postgresql://localhost:5432/mydb',
    PORT: port || 3000,
    REDIS_HOST: redisHost || 'localhost',
    REDIS_PORT: redisPort || 6379,
  };
}

// Usage in Application
console.log('=== Dictionary Configuration Example ===');
const appConfig = loadConfig();
console.log('JWT Secret:', appConfig.JWT_SECRET);
console.log('Database URL:', appConfig.DATABASE_URL);
console.log('Port:', appConfig.PORT);

// ============================================
// Example 2: Collection for Feature Flags
// ============================================

interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
}

/**
 * Load feature flags synchronously
 */
function loadFeatureFlags(): Map<string, boolean> {
  const dataPath = path.join(__dirname, 'data');
  const flags = new Collection<FeatureFlag>('feature-flags', dataPath, 'yaml');

  // Load synchronously
  flags.loadSync();

  // Convert to Map for easy access
  const flagMap = new Map<string, boolean>();
  flags.getAll().forEach(flag => {
    flagMap.set(flag.name, flag.enabled);
  });

  return flagMap;
}

// Usage
console.log('\n=== Feature Flags Example ===');
const featureFlags = loadFeatureFlags();
console.log('Feature flags loaded:', featureFlags.size);
console.log('AI_CHAT enabled:', featureFlags.get('AI_CHAT') ?? false);
console.log('BETA_FEATURES enabled:', featureFlags.get('BETA_FEATURES') ?? false);

// ============================================
// Example 3: Application ConfigService Integration
// ============================================

/**
 * Example ConfigService for Application using synchronous loading
 */
class ConfigService {
  private config: Dictionary;

  constructor(configPath: string) {
    this.config = new Dictionary('config', configPath, 'yaml');
    this.config.loadSync(); // Load configuration synchronously
  }

  get(key: string): any {
    return this.config.get(key);
  }

  getString(key: string, defaultValue: string = ''): string {
    return (this.config.get(key) as string) || defaultValue;
  }

  getNumber(key: string, defaultValue: number = 0): number {
    const value = this.config.get(key);
    return typeof value === 'number' ? value : defaultValue;
  }

  getBoolean(key: string, defaultValue: boolean = false): boolean {
    const value = this.config.get(key);
    return typeof value === 'boolean' ? value : defaultValue;
  }
}

// Usage in Application
console.log('\n=== ConfigService Example ===');
const configService = new ConfigService(path.join(__dirname, 'data'));
console.log('JWT_SECRET from service:', configService.getString('JWT_SECRET'));
console.log('PORT from service:', configService.getNumber('PORT', 3000));

// ============================================
// Example 4: Pre-populate Config (Setup Script)
// ============================================

/**
 * Setup script to create initial configuration files
 * Run this once to create your config files
 */
function setupConfigFiles() {
  const dataPath = path.join(__dirname, 'data');

  // Create app config
  const appConfig = new Dictionary('app-config', dataPath, 'yaml');
  appConfig.loadSync();

  appConfig.setSync('JWT_SECRET', 'super-secret-key-change-in-production');
  appConfig.setSync('DATABASE_URL', 'postgresql://localhost:5432/mydb');
  appConfig.setSync('PORT', 3000);
  appConfig.setSync('REDIS_HOST', 'localhost');
  appConfig.setSync('REDIS_PORT', 6379);
  appConfig.setSync('NODE_ENV', 'development');
  appConfig.setSync('LOG_LEVEL', 'debug');

  console.log('\n=== Config files created ===');
  console.log('Config saved to:', path.join(dataPath, 'app-config.yaml'));

  // Create feature flags
  const flags = new Collection<FeatureFlag>('feature-flags', dataPath, 'yaml');
  flags.loadSync();

  flags.insertSync({ name: 'AI_CHAT', enabled: true, description: 'Enable AI chat feature' });
  flags.insertSync({ name: 'BETA_FEATURES', enabled: false, description: 'Enable beta features' });
  flags.insertSync({ name: 'EMAIL_NOTIFICATIONS', enabled: true });

  console.log('Feature flags saved to:', path.join(dataPath, 'feature-flags.yaml'));
}

// Uncomment to run setup
// setupConfigFiles();

// ============================================
// Example 5: Application Main.ts Integration
// ============================================

/**
 * Example of how to use in your application main.ts
 * 
 * ```typescript
 * import { Dictionary } from 'nosql-file';
 * import * as path from 'path';
 * 
 * const config = new Dictionary('config', path.join(__dirname, '../config'), 'yaml');
 * config.loadSync();
 * 
 * const port = config.get('PORT') as number || 3000;
 * const jwtSecret = config.get('JWT_SECRET') as string;
 * 
 * // Set environment variables
 * process.env.JWT_SECRET = jwtSecret;
 * 
 * // Start your application
 * // await startApp(port);
 * ```
 */

console.log('\nAll examples completed successfully!');
console.log('\nRemember: Synchronous methods bypass file locking.');
console.log('    Only use them in single-threaded contexts like app startup.');
