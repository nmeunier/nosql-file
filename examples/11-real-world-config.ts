/**
 * PRACTICAL EXAMPLE: Real Application Application Startup with nosql-file
 * 
 * This example shows how to integrate nosql-file synchronously in a real
 * Application application for loading configuration at startup.
 */

import { Dictionary } from '../src/core/Dictionary';
import * as path from 'path';

// ============================================
// STEP 1: Create Configuration Service
// ============================================

/**
 * ConfigService that loads configuration synchronously
 * This can be used as a provider in Application
 */
class AppConfigService {
  private config: Dictionary;
  private loaded: boolean = false;

  constructor(configPath: string) {
    this.config = new Dictionary('app-config', configPath, 'yaml');
  }

  /**
   * Load configuration synchronously
   * Call this BEFORE Application app.create()
   */
  loadSync(): void {
    if (!this.loaded) {
      this.config.loadSync();
      this.loaded = true;
      console.log('Configuration loaded synchronously');
    }
  }

  /**
   * Get configuration value with type safety
   */
  get<T = any>(key: string): T | undefined {
    return this.config.get(key) as T;
  }

  /**
   * Get string with default value
   */
  getString(key: string, defaultValue: string = ''): string {
    const value = this.config.get(key);
    return typeof value === 'string' ? value : defaultValue;
  }

  /**
   * Get number with default value
   */
  getNumber(key: string, defaultValue: number = 0): number {
    const value = this.config.get(key);
    return typeof value === 'number' ? value : defaultValue;
  }

  /**
   * Get boolean with default value
   */
  getBoolean(key: string, defaultValue: boolean = false): boolean {
    const value = this.config.get(key);
    return typeof value === 'boolean' ? value : defaultValue;
  }

  /**
   * Get required value (throws if not found)
   */
  getRequired<T = any>(key: string): T {
    const value = this.config.get(key);
    if (value === undefined) {
      throw new Error(`Required configuration key "${key}" not found`);
    }
    return value as T;
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.config.has(key);
  }

  /**
   * Get all configuration
   */
  getAll(): Record<string, unknown> {
    return this.config.getAll();
  }
}

// ============================================
// STEP 2: Simulated Application Main.ts
// ============================================

/**
 * This is how you would use it in your Application main.ts
 */
async function applicationBootstrap() {
  console.log('Starting Application...\n');

  const configPath = path.join(__dirname, 'data');
  const configService = new AppConfigService(configPath);

  // CRITICAL: Load config synchronously BEFORE app creation
  configService.loadSync();

  // Now you can access all configuration synchronously
  const jwtSecret = configService.getRequired<string>('JWT_SECRET');
  const databaseUrl = configService.getString('DATABASE_URL', 'postgresql://localhost:5432/mydb');
  const port = configService.getNumber('PORT', 3000);
  const nodeEnv = configService.getString('NODE_ENV', 'development');
  const logLevel = configService.getString('LOG_LEVEL', 'info');
  const redisHost = configService.getString('REDIS_HOST', 'localhost');
  const redisPort = configService.getNumber('REDIS_PORT', 6379);

  console.log('Configuration loaded:');
  console.log(`   JWT_SECRET: ${jwtSecret.substring(0, 20)}...`);
  console.log(`   DATABASE_URL: ${databaseUrl}`);
  console.log(`   PORT: ${port}`);
  console.log(`   NODE_ENV: ${nodeEnv}`);
  console.log(`   LOG_LEVEL: ${logLevel}`);
  console.log(`   REDIS: ${redisHost}:${redisPort}`);

  // Set environment variables (if needed for other libraries)
  process.env.JWT_SECRET = jwtSecret;
  process.env.DATABASE_URL = databaseUrl;
  process.env.PORT = port.toString();

  // Here you would create your application
  // const app = await createApp({
  //   logger: logLevel,
  // });

  console.log(`\nApplication would be running on: http://localhost:${port}`);
  console.log(`   Environment: ${nodeEnv}`);
  console.log(`   JWT authentication configured`);
}

// ============================================
// STEP 3: Validation Example
// ============================================

/**
 * Validate configuration on startup
 */
function validateConfig(configService: AppConfigService): void {
  const requiredKeys = [
    'JWT_SECRET',
    'DATABASE_URL',
    'PORT'
  ];

  const missing: string[] = [];

  for (const key of requiredKeys) {
    if (!configService.has(key)) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required configuration keys: ${missing.join(', ')}`);
  }

  // Validate JWT_SECRET length
  const jwtSecret = configService.getString('JWT_SECRET');
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for security');
  }

  console.log('Configuration validation passed');
}

// ============================================
// STEP 4: Example with Configuration Profiles
// ============================================

/**
 * Support for multiple configuration profiles (dev, staging, prod)
 */
class MultiProfileConfigService {
  private config: Dictionary;
  private profile: string;

  constructor(configPath: string, profile: string = 'development') {
    this.profile = profile;
    // Load different config file based on profile
    const configName = `config.${profile}`;
    this.config = new Dictionary(configName, configPath, 'yaml');
  }

  loadSync(): void {
    this.config.loadSync();
    console.log(`Configuration loaded for profile: ${this.profile}`);
  }

  get<T = any>(key: string): T | undefined {
    return this.config.get(key) as T;
  }

  getProfile(): string {
    return this.profile;
  }
}

// ============================================
// STEP 5: Run Demo
// ============================================

async function main() {
  try {
    // Run the application bootstrap simulation
    await applicationBootstrap();

    // Validate configuration
    console.log('\nRunning validation...');
    const configPath = path.join(__dirname, 'data');
    const configService = new AppConfigService(configPath);
    configService.loadSync();
    validateConfig(configService);

    // Example with profiles
    console.log('\nMulti-profile example:');
    const devConfig = new MultiProfileConfigService(configPath, 'development');
    devConfig.loadSync();
    console.log(`   Profile: ${devConfig.getProfile()}`);

    console.log('\n' + '='.repeat(60));
    console.log('All examples completed successfully!');
    console.log('='.repeat(60));
    console.log('\nKey Takeaways:');
    console.log('   1. Load config synchronously BEFORE app.create()');
    console.log('   2. Use getRequired() for critical configuration');
    console.log('   3. Validate configuration on startup');
    console.log('   4. Set process.env for compatibility with other libs');
    console.log('   5. Synchronous methods are safe ONLY at startup');

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the demo
main();
