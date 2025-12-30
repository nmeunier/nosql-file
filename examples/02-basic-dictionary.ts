/**
 * Example 2: Basic Dictionary Usage
 * 
 * This example demonstrates key-value storage with a Dictionary,
 * which is ideal for configuration and settings.
 */

import { NoSqlFile } from '../src';

async function basicDictionaryExample() {
  console.log('=== Basic Dictionary Example ===\n');

  // Create database instance
  const db = new NoSqlFile('./data');

  // Get or create a dictionary
  const config = await db.dictionary('config');

  // SET: Store key-value pairs
  console.log('Setting configuration values...');
  await config.set('appName', 'My Application');
  await config.set('apiUrl', 'https://api.example.com');
  await config.set('timeout', 5000);
  await config.set('debug', true);
  await config.set('features', { darkMode: true, notifications: false });

  // GET: Retrieve values
  console.log('\nRetrieving values:');
  console.log('App Name:', config.get('appName'));
  console.log('Timeout:', config.get('timeout'));
  console.log('Features:', config.get('features'));

  // HAS: Check if key exists
  console.log('\nChecking keys:');
  console.log('Has "apiUrl"?', config.has('apiUrl'));
  console.log('Has "missing"?', config.has('missing'));

  // KEYS & VALUES: List all keys and values
  console.log('\nAll keys:', config.keys());
  console.log('All values:', config.values());

  // GET ALL: Retrieve all data
  console.log('\nAll configuration:');
  console.log(config.getAll());

  // DELETE: Remove a key
  console.log('\nDeleting "debug" key...');
  await config.delete('debug');
  console.log('Has "debug" after delete?', config.has('debug'));

  // CLEAR: Remove all keys
  console.log('\nClearing all configuration...');
  await config.clear();
  console.log('Keys after clear:', config.keys());

  console.log('\nExample completed! Check ./data/config.yaml');
}

// Run the example
basicDictionaryExample().catch(console.error);
