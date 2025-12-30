/**
 * Example 9: Disable Metadata
 * 
 * Demonstrates how to disable metadata file creation globally or per collection/dictionary.
 * This is useful for temporary data (logs, caches) or performance-critical applications.
 */

import { NoSqlFile, Collection, Dictionary } from '../src';
import * as path from 'path';
import * as fs from 'fs/promises';

const examplesDataPath = path.join(__dirname, 'data');

async function example09() {
  console.log('=== Example 9: Disable Metadata ===\n');

  // Clean up before starting
  await fs.rm(examplesDataPath, { recursive: true, force: true });
  await fs.mkdir(examplesDataPath, { recursive: true });

  // 1. Disable metadata globally
  console.log('1. Global metadata disable:');
  const db = new NoSqlFile(examplesDataPath, { disableMetadata: true });

  // Collections won't create .meta files
  const logs = await db.collection('logs');
  await logs.insert({ timestamp: new Date().toISOString(), level: 'info', message: 'Application started' });
  await logs.insert({ timestamp: new Date().toISOString(), level: 'debug', message: 'Loading config' });

  console.log('   ✓ Logs collection created WITHOUT metadata file');
  console.log(`   ✓ ${logs.count()} log entries`);

  // Verify no metadata file was created
  const logsMetaPath = path.join(examplesDataPath, 'logs.meta.yaml');
  const logsMetaExists = await fs.access(logsMetaPath).then(() => true).catch(() => false);
  console.log(`   ✓ logs.meta.yaml exists: ${logsMetaExists}\n`);

  // 2. Override for specific dictionary
  console.log('2. Override metadata setting for specific dictionary:');
  const config = await db.dictionary('config', { disableMetadata: false });
  await config.set('app.name', 'MyApp');
  await config.set('app.version', '1.0.0');

  // Set metadata for config (enabled via override)
  await config.setMeta({
    version: 1,
    tags: ['configuration', 'production'],
    custom: { environment: 'production' }
  });

  console.log('   ✓ Config dictionary created WITH metadata file (override)');
  console.log(`   ✓ ${config.keys().length} config keys`);

  const configMetaPath = path.join(examplesDataPath, 'config.meta.yaml');
  const configMetaExists = await fs.access(configMetaPath).then(() => true).catch(() => false);
  console.log(`   ✓ config.meta.yaml exists: ${configMetaExists}\n`);

  // 3. Direct instantiation with metadata disabled
  console.log('3. Direct instantiation with metadata disabled:');
  const cache = new Dictionary('cache', examplesDataPath, 'yaml', false, undefined, true);
  await cache.set('user:123', { name: 'Alice', lastSeen: Date.now() });
  await cache.set('user:456', { name: 'Bob', lastSeen: Date.now() });

  console.log('   ✓ Cache dictionary created WITHOUT metadata file');
  console.log(`   ✓ ${cache.keys().length} cache entries`);

  const cacheMetaPath = path.join(examplesDataPath, 'cache.meta.yaml');
  const cacheMetaExists = await fs.access(cacheMetaPath).then(() => true).catch(() => false);
  console.log(`   ✓ cache.meta.yaml exists: ${cacheMetaExists}\n`);

  // 4. Error handling when metadata is disabled
  console.log('4. Error handling when accessing metadata methods:');
  try {
    await logs.getMeta();
    console.log('   ✗ Expected error not thrown');
  } catch (error) {
    if (error instanceof Error) {
      console.log(`   ✓ Error thrown: ${error.message}`);
    }
  }

  try {
    await cache.setMeta({ version: 1 });
    console.log('   ✗ Expected error not thrown');
  } catch (error) {
    if (error instanceof Error) {
      console.log(`   ✓ Error thrown: ${error.message}\n`);
    }
  }

  // 5. Mixed settings - some with metadata, some without
  console.log('5. Mixed settings in same database:');
  const tempUsers = await db.collection('temp-users'); // No metadata (global setting)
  await tempUsers.insert({ name: 'Charlie', temp: true });

  const users = new Collection('users', examplesDataPath, 'yaml', undefined, false); // WITH metadata
  await users.insert({ id: 1, name: 'Alice', email: 'alice@example.com' });
  await users.setMeta({ version: 1, tags: ['users', 'production'] });

  console.log('   ✓ temp-users: no metadata (global setting)');
  console.log('   ✓ users: with metadata (explicit instantiation)');

  // Check files
  const tempUsersMetaExists = await fs.access(path.join(examplesDataPath, 'temp-users.meta.yaml')).then(() => true).catch(() => false);
  const usersMetaExists = await fs.access(path.join(examplesDataPath, 'users.meta.yaml')).then(() => true).catch(() => false);
  console.log(`   ✓ temp-users.meta.yaml exists: ${tempUsersMetaExists}`);
  console.log(`   ✓ users.meta.yaml exists: ${usersMetaExists}\n`);

  // Summary
  console.log('=== Summary ===');
  console.log('When to disable metadata:');
  console.log('  • Temporary data (logs, caches) that doesn\'t need tracking');
  console.log('  • Performance-critical applications with frequent writes');
  console.log('  • Reduced file system clutter');
  console.log('  • When metadata features are not needed\n');

  console.log('Files created:');
  const files = await fs.readdir(examplesDataPath);
  files.sort();
  for (const file of files) {
    console.log(`  - ${file}`);
  }

  await db.close();
}

// Run the example
example09().catch(console.error);
