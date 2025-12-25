export type LockType = 'read' | 'write';

interface LockRequest {
  type: LockType;
  resolve: () => void;
  reject: (error: Error) => void;
  timeoutId: NodeJS.Timeout;
}

interface FileLock {
  activeReadCount: number;
  isWriteLocked: boolean;
  queue: LockRequest[];
}

/**
 * Manages file-level locks to prevent concurrent write access
 * and handle multiple concurrent read operations
 */
export class FileLockManager {
  private locks: Map<string, FileLock> = new Map();
  private readonly lockTimeout: number;

  constructor(timeoutMs: number = 5000) {
    this.lockTimeout = timeoutMs;
  }

  /**
   * Acquire a read lock on a file path
   * Multiple reads can be concurrent, but blocked if write is active
   */
  async acquireReadLock(filePath: string): Promise<() => void> {
    const lock = this.getOrCreateLock(filePath);

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.removeLockRequest(filePath, lockRequest);
        reject(new Error(`Read lock timeout for ${filePath}`));
      }, this.lockTimeout);

      const lockRequest: LockRequest = {
        type: 'read',
        resolve: () => {
          clearTimeout(timeoutId);
          lock.activeReadCount++;
          resolve(() => this.releaseReadLock(filePath));
        },
        reject,
        timeoutId,
      };

      lock.queue.push(lockRequest);
      this.processLockQueue(filePath);
    });
  }

  /**
   * Acquire a write lock on a file path
   * Exclusive lock - no other reads/writes allowed while active
   */
  async acquireWriteLock(filePath: string): Promise<() => void> {
    const lock = this.getOrCreateLock(filePath);

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.removeLockRequest(filePath, lockRequest);
        reject(new Error(`Write lock timeout for ${filePath}`));
      }, this.lockTimeout);

      const lockRequest: LockRequest = {
        type: 'write',
        resolve: () => {
          clearTimeout(timeoutId);
          lock.isWriteLocked = true;
          resolve(() => this.releaseWriteLock(filePath));
        },
        reject,
        timeoutId,
      };

      lock.queue.push(lockRequest);
      this.processLockQueue(filePath);
    });
  }

  /**
   * Process the lock queue in FIFO order
   * Read locks can be granted concurrently
   * Write locks get exclusive access
   */
  private processLockQueue(filePath: string): void {
    const lock = this.locks.get(filePath);
    if (!lock) return;

    while (lock.queue.length > 0) {
      const request = lock.queue[0];
      if (!request) break;

      if (request.type === 'read') {
        // Reads can proceed unless write is locked
        if (!lock.isWriteLocked) {
          lock.queue.shift();
          request.resolve();
        } else {
          // Blocked by write lock
          break;
        }
      } else {
        // Write request
        // Can only proceed if no active reads and no write lock
        if (lock.activeReadCount === 0 && !lock.isWriteLocked) {
          lock.queue.shift();
          request.resolve();
        } else {
          // Blocked by reads or existing write
          break;
        }
      }
    }
  }

  private releaseReadLock(filePath: string): void {
    const lock = this.locks.get(filePath);
    if (lock) {
      lock.activeReadCount = Math.max(0, lock.activeReadCount - 1);
      this.processLockQueue(filePath);

      // Clean up lock if no longer needed
      if (lock.activeReadCount === 0 && !lock.isWriteLocked && lock.queue.length === 0) {
        this.locks.delete(filePath);
      }
    }
  }

  private releaseWriteLock(filePath: string): void {
    const lock = this.locks.get(filePath);
    if (lock) {
      lock.isWriteLocked = false;
      this.processLockQueue(filePath);

      // Clean up lock if no longer needed
      if (lock.activeReadCount === 0 && !lock.isWriteLocked && lock.queue.length === 0) {
        this.locks.delete(filePath);
      }
    }
  }

  private getOrCreateLock(filePath: string): FileLock {
    if (!this.locks.has(filePath)) {
      this.locks.set(filePath, {
        activeReadCount: 0,
        isWriteLocked: false,
        queue: [],
      });
    }
    return this.locks.get(filePath)!;
  }

  private removeLockRequest(filePath: string, request: LockRequest): void {
    const lock = this.locks.get(filePath);
    if (lock) {
      const index = lock.queue.indexOf(request);
      if (index > -1) {
        lock.queue.splice(index, 1);
      }
    }
  }

  /**
   * Get lock statistics for testing/debugging
   */
  getStats(filePath: string) {
    const lock = this.locks.get(filePath);
    if (!lock) {
      return { activeReadCount: 0, isWriteLocked: false, queueLength: 0 };
    }
    return {
      activeReadCount: lock.activeReadCount,
      isWriteLocked: lock.isWriteLocked,
      queueLength: lock.queue.length,
    };
  }
}
