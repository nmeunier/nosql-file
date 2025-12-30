/**
 * Example 7: Metadata
 * 
 * This example demonstrates storing metadata separately from data,
 * useful for version tracking, timestamps, tags, and custom fields.
 */

import { NoSqlFile } from '../src';

interface User {
  id: number;
  name: string;
  email: string;
}

async function metadataExample() {
  console.log('=== Metadata Example ===\n');

  const db = new NoSqlFile('./data');
  const users = await db.collection<User>('users-with-meta');

  // Insert some data
  console.log('Inserting users...');
  await users.insert({ id: 1, name: 'Alice', email: 'alice@example.com' });
  await users.insert({ id: 2, name: 'Bob', email: 'bob@example.com' });

  // Timestamps are automatically created
  console.log('\nAutomatic timestamps:');
  let meta = await users.getMeta();
  console.log('  createdAt:', meta.createdAt);
  console.log('  updatedAt:', meta.updatedAt);

  // Set metadata with version and tags
  console.log('\nSetting metadata...');
  await users.setMeta({
    version: 1,
    tags: ['users', 'authentication', 'production'],
    custom: {
      author: 'John Doe',
      description: 'User authentication database',
      environment: 'production'
    }
  });

  meta = await users.getMeta();
  console.log('Metadata:', meta);

  // Update data - updatedAt will be automatically updated
  console.log('\nUpdating user data...');
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  await users.update({ id: 1 }, { email: 'alice.new@example.com' });

  meta = await users.getMeta();
  console.log('updatedAt after change:', meta.updatedAt);

  // Add more custom metadata (merges with existing)
  console.log('\nAdding more custom metadata...');
  await users.setMeta({
    custom: {
      lastBackup: new Date().toISOString(),
      dataSource: 'user-registration-api'
    }
  });

  meta = await users.getMeta();
  console.log('Custom metadata:', meta.custom);

  // Get all metadata at once
  console.log('\nAll metadata:');
  const allMeta = await users.getAllMeta();
  console.log(JSON.stringify(allMeta, null, 2));

  // Metadata works with dictionaries too
  console.log('\n--- Dictionary Metadata ---');
  const config = await db.dictionary('app-config');

  await config.set('theme', 'dark');
  await config.set('language', 'en');

  await config.setMeta({
    version: 2,
    tags: ['configuration', 'settings'],
    custom: {
      configType: 'user-preferences',
      lastModifiedBy: 'admin'
    }
  });

  const configMeta = await config.getMeta();
  console.log('Config metadata:', configMeta);

  console.log('\nExample completed!');
  console.log('Check:');
  console.log('  - ./data/users-with-meta.yaml (data)');
  console.log('  - ./data/users-with-meta.meta.yaml (metadata)');
  console.log('  - ./data/app-config.yaml (data)');
  console.log('  - ./data/app-config.meta.yaml (metadata)');
  console.log('\nMetadata is stored separately to keep data files clean!');
}

// Run the example
metadataExample().catch(console.error);
