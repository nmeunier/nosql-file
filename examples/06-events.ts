/**
 * Example 6: Event Emitters
 * 
 * This example demonstrates how to listen to events emitted by
 * Collections and Dictionaries for observability and error handling.
 */

import { NoSqlFile } from '../src';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

async function eventsExample() {
  console.log('=== Event Emitters Example ===\n');

  const db = new NoSqlFile('./data');
  const logs = await db.collection<LogEntry>('app-logs');

  // Event 1: 'written' - Emitted after successful write
  console.log('Setting up "written" event listener...');
  let writeCount = 0;
  logs.on('written', () => {
    writeCount++;
    console.log(`  Data written to disk (write #${writeCount})`);
  });

  // Event 2: 'error' - Emitted on write errors
  console.log('Setting up "error" event listener...\n');
  logs.on('error', (error) => {
    console.error('  Write error:', error.message);
  });

  // Insert with async mode - will trigger 'written' event
  console.log('Inserting log entries...');
  await logs.insert({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: 'Application started'
  });

  await logs.insert({
    timestamp: new Date().toISOString(),
    level: 'DEBUG',
    message: 'Debug mode enabled'
  });

  // Fast mode - 'written' event fires when background write completes
  console.log('\nInserting with fast mode...');
  await logs.insert({
    timestamp: new Date().toISOString(),
    level: 'WARN',
    message: 'Memory usage high'
  }, { mode: 'fast' });
  console.log('  (waiting for background write to complete...)');

  // Wait for the last write to complete
  await new Promise(resolve => setTimeout(resolve, 100));

  // Using once() for one-time event
  console.log('\nSetting up one-time listener...');
  logs.once('written', () => {
    console.log('  This will only fire once');
  });

  await logs.insert({
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message: 'Connection failed'
  });

  await logs.insert({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: 'Retry successful'
  });
  console.log('  (one-time listener did not fire for second insert)');

  // Event listeners work with dictionaries too
  console.log('\nTesting with dictionary...');
  const metrics = await db.dictionary('metrics');

  let metricsWrites = 0;
  metrics.on('written', () => {
    metricsWrites++;
    console.log(`  Metrics written (write #${metricsWrites})`);
  });

  await metrics.set('requests', 1234);
  await metrics.set('errors', 5);

  console.log(`\nExample completed!`);
  console.log(`Total log writes: ${writeCount}`);
  console.log(`Total metrics writes: ${metricsWrites}`);
}

// Run the example
eventsExample().catch(console.error);
