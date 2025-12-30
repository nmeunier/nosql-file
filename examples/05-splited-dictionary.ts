/**
 * Example 5: Splited Dictionary
 * 
 * This example demonstrates splited mode for dictionaries,
 * where each key is stored in a separate file.
 * This is useful for:
 * - Large values
 * - Many keys
 * - Partial updates (update one key without rewriting all data)
 */

import { NoSqlFile } from '../src';

interface UserProfile {
  username: string;
  bio: string;
  avatar: string;
  preferences: Record<string, unknown>;
}

async function splitedDictionaryExample() {
  console.log('=== Splited Dictionary Example ===\n');

  const db = new NoSqlFile('./data');

  // Create a splited dictionary
  console.log('Creating user cache (splited mode)...');
  const userCache = await db.dictionary('user-cache', { splited: true });

  // Each set() creates a separate file
  console.log('\nAdding user profiles...');

  await userCache.set('user:1001', {
    username: 'alice',
    bio: 'Software developer and coffee enthusiast',
    avatar: 'https://example.com/avatars/alice.jpg',
    preferences: { theme: 'dark', language: 'en' }
  });

  await userCache.set('user:1002', {
    username: 'bob',
    bio: 'Designer & photographer',
    avatar: 'https://example.com/avatars/bob.jpg',
    preferences: { theme: 'light', language: 'fr' }
  });

  await userCache.set('user:1003', {
    username: 'charlie',
    bio: 'Product manager',
    avatar: 'https://example.com/avatars/charlie.jpg',
    preferences: { theme: 'dark', language: 'es' }
  });

  console.log('3 user profiles stored in separate files');

  // Retrieve a specific user
  console.log('\nRetrieving user:1001:');
  const alice = userCache.get('user:1001') as UserProfile;
  console.log(alice);

  // Update one user (only updates that one file)
  console.log('\nUpdating user:1002 bio...');
  const bob = userCache.get('user:1002') as UserProfile;
  bob.bio = 'Designer, photographer & UI/UX expert';
  await userCache.set('user:1002', bob);
  console.log('Only user:1002.yaml was updated');

  // List all cached users
  console.log('\nAll cached user keys:');
  console.log(userCache.keys());

  // Delete one user (removes only that file)
  console.log('\nDeleting user:1003...');
  await userCache.delete('user:1003');
  console.log('user:1003.yaml deleted');

  console.log('\nExample completed!');
  console.log('Check ./data/user-cache/ directory:');
  console.log('  - Each key is in a separate .yaml file');
  console.log('  - Efficient for large datasets');
  console.log('  - Partial updates without rewriting everything');
}

// Run the example
splitedDictionaryExample().catch(console.error);
