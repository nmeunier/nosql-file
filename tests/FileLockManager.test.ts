import { FileLockManager } from '../src/utils/FileLockManager';

describe('FileLockManager', () => {
  let lockManager: FileLockManager;
  const testPath = '/test/file.yaml';

  beforeEach(() => {
    lockManager = new FileLockManager();
  });

  describe('Read locks', () => {
    it('should allow multiple concurrent read locks', async () => {
      const readLocks: Array<() => void> = [];

      // Acquire 3 read locks
      for (let i = 0; i < 3; i++) {
        const release = await lockManager.acquireReadLock(testPath);
        readLocks.push(release);
      }

      // All should be acquired successfully
      expect(readLocks).toHaveLength(3);

      // Release all
      readLocks.forEach(release => release());
    });

    it('should track active read count correctly', async () => {
      const stats1 = lockManager.getStats(testPath);
      expect(stats1.activeReadCount).toBe(0);

      const release1 = await lockManager.acquireReadLock(testPath);
      const stats2 = lockManager.getStats(testPath);
      expect(stats2.activeReadCount).toBe(1);

      const release2 = await lockManager.acquireReadLock(testPath);
      const stats3 = lockManager.getStats(testPath);
      expect(stats3.activeReadCount).toBe(2);

      release1();
      const stats4 = lockManager.getStats(testPath);
      expect(stats4.activeReadCount).toBe(1);

      release2();
      const stats5 = lockManager.getStats(testPath);
      expect(stats5.activeReadCount).toBe(0);
    });
  });

  describe('Write locks', () => {
    it('should give exclusive access to write lock', async () => {
      const writeLock = await lockManager.acquireWriteLock(testPath);
      const stats = lockManager.getStats(testPath);

      expect(stats.isWriteLocked).toBe(true);

      writeLock();

      const statsAfter = lockManager.getStats(testPath);
      expect(statsAfter.isWriteLocked).toBe(false);
    });

    it('should block read locks while write is held', async () => {
      const writeLock = await lockManager.acquireWriteLock(testPath);
      const stats = lockManager.getStats(testPath);
      expect(stats.queueLength).toBe(0);

      // Try to acquire read lock - should be queued
      let readLockAcquired = false;
      const readLockPromise = lockManager.acquireReadLock(testPath).then(() => {
        readLockAcquired = true;
      });

      // Give a small delay to ensure the read request is queued
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(readLockAcquired).toBe(false);

      // Release write lock
      writeLock();

      // Now read lock should be acquired
      await readLockPromise;
      expect(readLockAcquired).toBe(true);
    });

    it('should block write locks while read is held', async () => {
      const readLock = await lockManager.acquireReadLock(testPath);
      let writeLockAcquired = false;

      const writeLockPromise = lockManager.acquireWriteLock(testPath).then(() => {
        writeLockAcquired = true;
      });

      // Give a small delay
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(writeLockAcquired).toBe(false);

      // Release read lock
      readLock();

      // Now write lock should be acquired
      await writeLockPromise;
      expect(writeLockAcquired).toBe(true);
    });

    it('should block write locks while multiple reads are held', async () => {
      const readLock1 = await lockManager.acquireReadLock(testPath);
      const readLock2 = await lockManager.acquireReadLock(testPath);

      let writeLockAcquired = false;
      const writeLockPromise = lockManager.acquireWriteLock(testPath).then(() => {
        writeLockAcquired = true;
      });

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(writeLockAcquired).toBe(false);

      // Release first read lock - write should still be blocked
      readLock1();
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(writeLockAcquired).toBe(false);

      // Release second read lock - now write should acquire
      readLock2();
      await writeLockPromise;
      expect(writeLockAcquired).toBe(true);
    });
  });

  describe('FIFO ordering', () => {
    it('should process requests in FIFO order', async () => {
      const order: string[] = [];

      const writeLock = await lockManager.acquireWriteLock(testPath);

      // Queue multiple requests  
      let release1: (() => void) = () => { };
      const p1 = lockManager.acquireReadLock(testPath).then((r) => {
        release1 = r;
        order.push('read1');
      });

      let release2: (() => void) = () => { };
      const p2 = lockManager.acquireWriteLock(testPath).then((r) => {
        release2 = r;
        order.push('write1');
      });

      let release3: (() => void) = () => { };
      const p3 = lockManager.acquireReadLock(testPath).then((r) => {
        release3 = r;
        order.push('read2');
      });

      await new Promise(resolve => setTimeout(resolve, 20));
      expect(order).toEqual([]);

      // Release write lock - read1 should go first (FIFO)
      writeLock();
      await p1;
      expect(order).toEqual(['read1']);

      // Release read1 - write1 should go next
      release1();
      await p2;
      expect(order).toEqual(['read1', 'write1']);

      // Release write1 - read2 should go last
      release2();
      await p3;
      expect(order).toEqual(['read1', 'write1', 'read2']);
      release3();
    }, 15000);
  });

  describe('Lock statistics', () => {
    it('should return correct stats for each file path', async () => {
      const path1 = '/test/file1.yaml';
      const path2 = '/test/file2.yaml';

      const lock1 = await lockManager.acquireReadLock(path1);
      const lock2 = await lockManager.acquireWriteLock(path2);

      const stats1 = lockManager.getStats(path1);
      expect(stats1.activeReadCount).toBe(1);
      expect(stats1.isWriteLocked).toBe(false);

      const stats2 = lockManager.getStats(path2);
      expect(stats2.activeReadCount).toBe(0);
      expect(stats2.isWriteLocked).toBe(true);

      lock1();
      lock2();
    });

    it('should report queue length correctly', async () => {
      const writeLock = await lockManager.acquireWriteLock(testPath);
      const stats1 = lockManager.getStats(testPath);
      expect(stats1.queueLength).toBe(0);

      // Queue requests
      const promises = [
        lockManager.acquireReadLock(testPath),
        lockManager.acquireReadLock(testPath),
        lockManager.acquireWriteLock(testPath),
      ];

      await new Promise(resolve => setTimeout(resolve, 10));

      const stats2 = lockManager.getStats(testPath);
      // The queue should contain pending requests
      expect(stats2.queueLength).toBeGreaterThan(0);

      writeLock();

      // Wait for locks to resolve, handling both successes and errors
      const results = await Promise.allSettled(promises);

      // Filter and get the successful releases
      const successfulReleases: Array<() => void> = [];
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          successfulReleases.push(result.value);
        }
      });

      // Release the successful locks
      successfulReleases.forEach(release => release());
    }, 15000);
  });

  describe('Timeout handling', () => {
    it('should support custom timeout for write locks', async () => {
      const shortTimeoutManager = new FileLockManager(100); // 100ms timeout

      // Block with a read lock
      const readLock = await shortTimeoutManager.acquireReadLock(testPath);

      // Try to acquire write lock with timeout
      let timedOut = false;
      try {
        await shortTimeoutManager.acquireWriteLock(testPath);
      } catch (error) {
        timedOut = true;
        expect((error as Error).message).toContain('timeout');
      }

      expect(timedOut).toBe(true);
      readLock();
    }, 5000);

    it('should handle timeout gracefully when lock eventually becomes available', async () => {
      const shortTimeoutManager = new FileLockManager(100);
      const readLock = await shortTimeoutManager.acquireReadLock(testPath);

      let lockAcquired = false;
      let timedOut = false;

      shortTimeoutManager.acquireWriteLock(testPath).then(() => {
        lockAcquired = true;
      }).catch(() => {
        timedOut = true;
      });

      // Wait for timeout to occur
      await new Promise(resolve => setTimeout(resolve, 200));

      // Timeout should have occurred
      expect(timedOut).toBe(true);
      expect(lockAcquired).toBe(false);

      readLock();
    }, 5000);
  });

  describe('Edge cases', () => {
    it('should handle repeated acquire/release cycles', async () => {
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const lock = await lockManager.acquireWriteLock(testPath);
        lock();
      }

      const stats = lockManager.getStats(testPath);
      expect(stats.activeReadCount).toBe(0);
      expect(stats.isWriteLocked).toBe(false);
      expect(stats.queueLength).toBe(0);
    });

    it('should handle multiple file paths independently', async () => {
      const paths = ['/test/file1.yaml', '/test/file2.yaml', '/test/file3.yaml'];
      const locks: Array<() => void> = [];

      // Acquire locks on all paths
      for (const path of paths) {
        const lock = await lockManager.acquireWriteLock(path);
        locks.push(lock);
      }

      // Verify all are locked
      for (const path of paths) {
        const stats = lockManager.getStats(path);
        expect(stats.isWriteLocked).toBe(true);
      }

      // Release all
      locks.forEach(lock => lock());

      // Verify all are unlocked
      for (const path of paths) {
        const stats = lockManager.getStats(path);
        expect(stats.isWriteLocked).toBe(false);
      }
    });

    it('should handle no lock information for unknown paths', () => {
      const stats = lockManager.getStats('/unknown/path.yaml');
      expect(stats.activeReadCount).toBe(0);
      expect(stats.isWriteLocked).toBe(false);
      expect(stats.queueLength).toBe(0);
    });
  });

  describe('Stress tests', () => {
    it('should handle many concurrent reads', async () => {
      const promises = [];
      const count = 50;

      for (let i = 0; i < count; i++) {
        promises.push(lockManager.acquireReadLock(testPath));
      }

      const locks = await Promise.all(promises);
      const stats = lockManager.getStats(testPath);
      expect(stats.activeReadCount).toBe(count);

      locks.forEach(lock => lock());

      const statsAfter = lockManager.getStats(testPath);
      expect(statsAfter.activeReadCount).toBe(0);
    });

    it('should handle interleaved read/write operations', async () => {
      const iterations = 20;
      let readCount = 0;
      let writeCount = 0;

      for (let i = 0; i < iterations; i++) {
        if (i % 2 === 0) {
          const lock = await lockManager.acquireReadLock(testPath);
          readCount++;
          lock();
        } else {
          const lock = await lockManager.acquireWriteLock(testPath);
          writeCount++;
          lock();
        }
      }

      expect(readCount).toBe(10);
      expect(writeCount).toBe(10);

      const stats = lockManager.getStats(testPath);
      expect(stats.activeReadCount).toBe(0);
      expect(stats.isWriteLocked).toBe(false);
    });
  });
});
