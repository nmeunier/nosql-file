/**
 * Example 1: Basic Collection Usage
 * 
 * This example demonstrates basic CRUD operations with a Collection,
 * which stores data as an array of documents.
 */

import { NoSqlFile } from '../src';

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

async function basicCollectionExample() {
  console.log('=== Basic Collection Example ===\n');

  // Create database instance
  const db = new NoSqlFile('./data');

  // Get or create a collection
  const users = await db.collection<User>('users');

  // INSERT: Add documents
  console.log('Inserting users...');
  await users.insert({ id: 1, name: 'Alice Johnson', email: 'alice@example.com', age: 30 });
  await users.insert({ id: 2, name: 'Bob Smith', email: 'bob@example.com', age: 25 });
  await users.insert({ id: 3, name: 'Charlie Brown', email: 'charlie@example.com', age: 30 });

  // READ: Get all documents
  console.log('\nAll users:');
  const allUsers = users.getAll();
  console.log(allUsers);

  // FIND: Query documents
  console.log('\nUsers aged 30:');
  const thirtyYearOlds = users.find({ age: 30 });
  console.log(thirtyYearOlds);

  // UPDATE: Modify documents
  console.log('\nUpdating Bob\'s age...');
  await users.update({ id: 2 }, { age: 26 });
  console.log('Bob after update:', users.find({ id: 2 }));

  // COUNT: Get document count
  console.log(`\nTotal users: ${users.count()}`);

  // DELETE: Remove documents
  console.log('\nDeleting Charlie...');
  await users.delete({ id: 3 });
  console.log(`Users after deletion: ${users.count()}`);

  // CLEAR: Remove all documents
  console.log('\nClearing all users...');
  await users.clear();
  console.log(`Users after clear: ${users.count()}`);

  console.log('\nExample completed! Check ./data/users.yaml');
}

// Run the example
basicCollectionExample().catch(console.error);
