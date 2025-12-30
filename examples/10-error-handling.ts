/**
 * Example 10: Error Handling and Best Practices
 * 
 * This example demonstrates proper error handling and
 * recovery strategies for nosql-file operations.
 */

import { NoSqlFile } from '../src';
import * as fs from 'fs/promises';

interface Data {
  id: number;
  value: string;
}

async function errorHandlingExample() {
  console.log('=== Error Handling Example ===\n');

  const db = new NoSqlFile('./data');

  // 1. Try-Catch for synchronous errors
  console.log('1. Basic try-catch:');
  try {
    const collection = await db.collection<Data>('error-demo');
    await collection.insert({ id: 1, value: 'test' });
    console.log('   Insert successful\n');
  } catch (error) {
    console.error('   Error:', (error as Error).message);
  }

  // 2. Event-based error handling
  console.log('2. Event-based error handling:');
  const collection = await db.collection<Data>('error-events');

  collection.on('error', (error) => {
    console.error('   Write error caught by event:', error.message);
  });

  collection.on('written', () => {
    console.log('   Write successful');
  });

  await collection.insert({ id: 1, value: 'data' });

  // 3. Handling fast mode errors
  console.log('\n3. Fast mode with error handling:');
  const fastCollection = await db.collection<Data>('fast-mode-demo');

  let errorOccurred = false;
  fastCollection.on('error', (error) => {
    console.error('   Background write failed:', error.message);
    errorOccurred = true;
  });

  fastCollection.on('written', () => {
    if (!errorOccurred) {
      console.log('   Background write completed');
    }
  });

  await fastCollection.insert({ id: 1, value: 'fast data' }, { mode: 'fast' });
  await new Promise(resolve => setTimeout(resolve, 100)); // Wait for background write

  // 4. Discard changes on error
  console.log('\n4. Discard changes on error:');
  const discardDemo = await db.collection<Data>('discard-demo');
  await discardDemo.insert({ id: 1, value: 'original' });

  try {
    // Make some changes
    await discardDemo.insert({ id: 2, value: 'temp' }, { mode: 'memory' });
    await discardDemo.insert({ id: 3, value: 'temp2' }, { mode: 'memory' });
    console.log('   In-memory count:', discardDemo.count());

    // Simulate an error condition
    const shouldFail = true;
    if (shouldFail) {
      throw new Error('Simulated validation error');
    }

    await discardDemo.sync();
  } catch (error) {
    console.log('   Error occurred:', (error as Error).message);
    console.log('   Discarding changes...');
    await discardDemo.discard();
    console.log('   Restored to saved state. Count:', discardDemo.count());
  }

  // 5. Validate before write
  console.log('\n5. Validation before write:');
  const validated = await db.collection<Data>('validated-data');

  const validateData = (data: Data): void => {
    if (!data.id || data.id <= 0) {
      throw new Error('Invalid ID: must be positive');
    }
    if (!data.value || data.value.trim() === '') {
      throw new Error('Invalid value: cannot be empty');
    }
  };

  try {
    const invalidData = { id: 0, value: '' };
    validateData(invalidData);
    await validated.insert(invalidData);
  } catch (error) {
    console.log('   Validation failed:', (error as Error).message);
  }

  try {
    const validData = { id: 1, value: 'valid' };
    validateData(validData);
    await validated.insert(validData);
    console.log('   Valid data inserted');
  } catch (error) {
    console.error('   Unexpected error:', (error as Error).message);
  }

  // 6. Graceful shutdown
  console.log('\n6. Graceful shutdown:');
  const shutdownDemo = await db.collection<Data>('shutdown-demo');

  // Make changes with fast mode
  await shutdownDemo.insert({ id: 1, value: 'data1' }, { mode: 'fast' });
  await shutdownDemo.insert({ id: 2, value: 'data2' }, { mode: 'fast' });

  console.log('   Closing database (waiting for pending writes)...');
  await db.close(); // Ensures all pending writes complete
  console.log('   Database closed safely');

  // 7. File permission errors (demonstration)
  console.log('\n7. Handling file permission errors:');
  const permissionDemo = await db.collection<Data>('permission-demo');
  await permissionDemo.insert({ id: 1, value: 'test' });

  // Make the file read-only
  const filePath = './data/permission-demo.yaml';
  try {
    await fs.chmod(filePath, 0o444); // Read-only
    console.log('   Made file read-only');

    await permissionDemo.insert({ id: 2, value: 'will fail' });
  } catch (error) {
    console.log('   Expected error:', (error as Error).message);
  } finally {
    // Restore write permission
    try {
      await fs.chmod(filePath, 0o644);
      console.log('   Restored write permission');
    } catch {
      // File might not exist
    }
  }

  console.log('\nExample completed!');
  console.log('\nBest Practices:');
  console.log('  1. Always use try-catch for async operations');
  console.log('  2. Listen to error events for background operations');
  console.log('  3. Validate data before inserting');
  console.log('  4. Use discard() to rollback on errors');
  console.log('  5. Call close() for graceful shutdown');
}

// Run the example
errorHandlingExample().catch(console.error);
