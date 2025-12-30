/**
 * Example 8: Schema Migration with Metadata
 * 
 * This example demonstrates using metadata for version tracking
 * and performing schema migrations.
 */

import { NoSqlFile, Metadata } from '../src';

// Version 1 schema
interface UserV1 {
  id: number;
  name: string;
  email: string;
}

// Version 2 schema (split name into firstName/lastName)
interface UserV2 {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

// Version 3 schema (add createdAt timestamp)
interface UserV3 {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

async function schemaMigrationExample() {
  console.log('=== Schema Migration Example ===\n');

  const db = new NoSqlFile('./data');
  const users = await db.collection<UserV1 | UserV2 | UserV3>('migration-demo');

  // Check current schema version
  const meta = await users.getMeta();
  const currentVersion = meta.version || 0;

  console.log(`Current schema version: ${currentVersion}\n`);

  if (currentVersion === 0) {
    // Initialize with V1 schema
    console.log('Initializing with V1 schema...');
    await users.insert({ id: 1, name: 'Alice Johnson', email: 'alice@example.com' } as UserV1);
    await users.insert({ id: 2, name: 'Bob Smith', email: 'bob@example.com' } as UserV1);
    await users.insert({ id: 3, name: 'Charlie Brown', email: 'charlie@example.com' } as UserV1);

    await users.setMeta({
      version: 1,
      tags: ['users', 'v1-schema'],
      custom: {
        schemaDescription: 'Single name field',
        createdDate: new Date().toISOString()
      }
    });

    console.log('Initialized with V1 schema (3 users)');
    console.log('Sample data:', users.getAll());
  }

  if (currentVersion === 1) {
    // Migrate V1 to V2: Split name into firstName/lastName
    console.log('\n--- Migrating V1 to V2 ---');
    console.log('Splitting name field into firstName and lastName...');

    const v1Users = users.getAll() as UserV1[];
    await users.clear({ mode: 'memory' });

    for (const user of v1Users) {
      const nameParts = user.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      await users.insert({
        id: user.id,
        firstName,
        lastName,
        email: user.email
      } as UserV2, { mode: 'memory' });
    }

    await users.sync();

    await users.setMeta({
      version: 2,
      custom: {
        schemaDescription: 'Split name into firstName and lastName',
        migratedAt: new Date().toISOString(),
        migratedFrom: 1
      }
    });

    console.log('Migrated to V2 schema');
    console.log('Sample data:', users.getAll());
  }

  if (currentVersion === 2) {
    // Migrate V2 to V3: Add createdAt timestamp
    console.log('\n--- Migrating V2 to V3 ---');
    console.log('Adding createdAt timestamp...');

    const v2Users = users.getAll() as UserV2[];
    await users.clear({ mode: 'memory' });

    const now = new Date().toISOString();
    for (const user of v2Users) {
      await users.insert({
        ...user,
        createdAt: now
      } as UserV3, { mode: 'memory' });
    }

    await users.sync();

    await users.setMeta({
      version: 3,
      custom: {
        schemaDescription: 'Added createdAt timestamp',
        migratedAt: new Date().toISOString(),
        migratedFrom: 2
      }
    });

    console.log('Migrated to V3 schema');
    console.log('Sample data:', users.getAll());
  }

  if (currentVersion === 3) {
    console.log('\nDatabase is up to date (V3)');
  }

  // Display final metadata
  console.log('\n--- Final Metadata ---');
  const finalMeta = await users.getAllMeta();
  console.log(JSON.stringify(finalMeta, null, 2));

  console.log('\nExample completed!');
  console.log('Run this script multiple times to see migrations in action.');
}

// Run the example
schemaMigrationExample().catch(console.error);
