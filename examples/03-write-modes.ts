/**
 * Example 3: Write Modes
 * 
 * This example demonstrates the three write modes:
 * - async: Wait for write completion (default, safest)
 * - fast: Fire and forget (background write)
 * - memory: No disk write (memory only)
 */

import { NoSqlFile } from '../src';

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

async function writeModesExample() {
  console.log('=== Write Modes Example ===\n');

  const db = new NoSqlFile('./data');
  const tasks = await db.collection<Task>('tasks');

  // MODE 1: Async (default) - Wait for write completion
  console.log('1. ASYNC MODE (default)');
  const start1 = Date.now();
  await tasks.insert({ id: 1, title: 'Buy groceries', completed: false }, { mode: 'async' });
  console.log(`   Completed in ${Date.now() - start1}ms`);
  console.log('   Data is safely written to disk\n');

  // MODE 2: Fast - Fire and forget, write in background
  console.log('2. FAST MODE');
  const start2 = Date.now();
  await tasks.insert({ id: 2, title: 'Call dentist', completed: false }, { mode: 'fast' });
  console.log(`   Returned in ${Date.now() - start2}ms`);
  console.log('   Write happens in background\n');

  // Listen to the 'written' event to know when fast writes complete
  tasks.once('written', () => {
    console.log('   Fast write completed!\n');
  });

  // MODE 3: Memory - No disk write (great for batch operations)
  console.log('3. MEMORY MODE');
  console.log('   Adding multiple tasks in memory...');
  const start3 = Date.now();
  for (let i = 3; i <= 10; i++) {
    await tasks.insert(
      { id: i, title: `Task ${i}`, completed: false },
      { mode: 'memory' }
    );
  }
  console.log(`   Added 8 tasks in ${Date.now() - start3}ms`);
  console.log('   All in memory, no disk writes yet\n');

  // Manually sync to disk
  console.log('   Syncing to disk...');
  await tasks.sync();
  console.log('   All changes written at once\n');

  console.log(`Total tasks in memory: ${tasks.count()}`);

  // Use case: Batch operations with memory mode
  console.log('\n4. BATCH UPDATE EXAMPLE');
  console.log('   Updating all tasks to completed (memory mode)...');
  for (let i = 1; i <= 10; i++) {
    await tasks.update({ id: i }, { completed: true }, { mode: 'memory' });
  }
  console.log('   Syncing batch update...');
  await tasks.sync();
  console.log('   All tasks updated in one write\n');

  console.log('Example completed! Check ./data/tasks.yaml');
}

// Run the example
writeModesExample().catch(console.error);
