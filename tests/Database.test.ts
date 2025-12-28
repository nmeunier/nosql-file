import * as fs from 'fs/promises';
import * as path from 'path';
import { NoSqlFile } from '../src/core/Database';

describe('NoSqlFile', () => {
  const dataPath = path.join(__dirname, 'test-database');

  beforeEach(async () => {
    // Clean up before each test
    try {
      await fs.rm(dataPath, { recursive: true, force: true });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Ignore
    }
    await fs.mkdir(dataPath, { recursive: true });
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await fs.rm(dataPath, { recursive: true, force: true });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Ignore
    }
  });

  describe('syncAll', () => {
    it('should sync all collections', async () => {
      const db = new NoSqlFile(dataPath);

      const users = await db.collection('users');
      const posts = await db.collection('posts');

      await users.insert({ name: 'Alice' });
      await posts.insert({ title: 'Hello World' });

      // Sync all collections
      await db.syncAll();

      // Verify files were written
      const usersFile = path.join(dataPath, 'users.yaml');
      const postsFile = path.join(dataPath, 'posts.yaml');

      const usersExists = await fs
        .access(usersFile)
        .then(() => true)
        .catch(() => false);
      const postsExists = await fs
        .access(postsFile)
        .then(() => true)
        .catch(() => false);

      expect(usersExists).toBe(true);
      expect(postsExists).toBe(true);
    });

    it('should sync all dictionaries', async () => {
      const db = new NoSqlFile(dataPath);

      const settings = await db.dictionary('settings');
      const metadata = await db.dictionary('metadata');

      await settings.set('theme', 'dark');
      await metadata.set('version', '1.0.0');

      // Sync all
      await db.syncAll();

      // Verify files were written
      const settingsFile = path.join(dataPath, 'settings.yaml');
      const metadataFile = path.join(dataPath, 'metadata.yaml');

      const settingsExists = await fs
        .access(settingsFile)
        .then(() => true)
        .catch(() => false);
      const metadataExists = await fs
        .access(metadataFile)
        .then(() => true)
        .catch(() => false);

      expect(settingsExists).toBe(true);
      expect(metadataExists).toBe(true);
    });

    it('should sync both collections and dictionaries together', async () => {
      const db = new NoSqlFile(dataPath);

      const users = await db.collection('users');
      const settings = await db.dictionary('settings');

      await users.insert({ name: 'Bob' });
      await settings.set('language', 'en');

      // Sync everything
      await db.syncAll();

      // Load fresh database and verify data
      const db2 = new NoSqlFile(dataPath);
      const users2 = await db2.collection('users');
      const settings2 = await db2.dictionary('settings');

      await users2.load();
      await settings2.load();

      const allUsers = users2.getAll();
      const language = await settings2.get('language');

      expect(allUsers).toHaveLength(1);
      expect(allUsers[0]?.name).toBe('Bob');
      expect(language).toBe('en');
    });

    it('should handle empty database', async () => {
      const db = new NoSqlFile(dataPath);

      // Don't create any collections or dictionaries
      // Should not throw
      await db.syncAll();

      expect(true).toBe(true);
    });

    it('should handle sync errors gracefully', async () => {
      const db = new NoSqlFile(dataPath);
      const users = await db.collection('users');

      // Make dataPath read-only to trigger write error
      await users.insert({ name: 'Charlie' });
      await fs.chmod(dataPath, 0o444);

      try {
        // Should throw or handle error
        await db.syncAll().catch(() => {
          // Expected
        });
      } finally {
        // Restore permissions
        await fs.chmod(dataPath, 0o755);
      }
    });

    it('should sync with fast mode', async () => {
      const db = new NoSqlFile(dataPath);
      const users = await db.collection('users');

      // Use fast mode
      await users.insert({ name: 'Diana' }, { mode: 'fast' });

      // Sync all - should write the background sync if not done yet
      await db.syncAll();

      // Verify data was written
      const db2 = new NoSqlFile(dataPath);
      const users2 = await db2.collection('users');
      await users2.load();

      const allUsers = users2.getAll();
      expect(allUsers).toHaveLength(1);
      expect(allUsers[0]?.name).toBe('Diana');
    });
  });

  describe('close', () => {
    it('should have close method', async () => {
      const db = new NoSqlFile(dataPath);
      expect(typeof db.close).toBe('function');

      // Should not throw
      await db.close();
    });

    it('should complete pending syncs before closing', async () => {
      const db = new NoSqlFile(dataPath);
      const users = await db.collection('users');

      // Insert with fast mode (background sync)
      await users.insert({ name: 'Eve' }, { mode: 'fast' });

      // Close should complete all pending operations
      await db.close();

      // Verify data was synced
      const db2 = new NoSqlFile(dataPath);
      const users2 = await db2.collection('users');
      await users2.load();

      const allUsers = users2.getAll();
      expect(allUsers).toHaveLength(1);
      expect(allUsers[0]?.name).toBe('Eve');
    });

    it('should work with multiple collections and dictionaries', async () => {
      const db = new NoSqlFile(dataPath);

      const users = await db.collection('users');
      const posts = await db.collection('posts');
      const settings = await db.dictionary('settings');

      await users.insert({ name: 'Frank' });
      await posts.insert({ title: 'Test' });
      await settings.set('theme', 'light');

      // Close should work without errors
      await db.close();

      // Verify all data is accessible after reopening
      const db2 = new NoSqlFile(dataPath);
      const users2 = await db2.collection('users');
      const posts2 = await db2.collection('posts');
      const settings2 = await db2.dictionary('settings');

      await users2.load();
      await posts2.load();
      await settings2.load();

      expect(users2.getAll()).toHaveLength(1);
      expect(posts2.getAll()).toHaveLength(1);
      expect(await settings2.get('theme')).toBe('light');
    });
  });

  describe('FileLockManager integration', () => {
    it('should provide access to FileLockManager', () => {
      const db = new NoSqlFile(dataPath);
      const lockManager = db.getFileLockManager();

      expect(lockManager).toBeDefined();
      expect(typeof lockManager.acquireReadLock).toBe('function');
      expect(typeof lockManager.acquireWriteLock).toBe('function');
    });

    it('should use FileLockManager for concurrent operations', async () => {
      const db = new NoSqlFile(dataPath);
      const users = await db.collection('users');

      // Perform multiple concurrent operations
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(users.insert({ id: i }));
      }

      await Promise.all(promises);

      // All should be written correctly due to locking
      await db.syncAll();

      const db2 = new NoSqlFile(dataPath);
      const users2 = await db2.collection('users');
      await users2.load();

      const allUsers = users2.getAll();
      expect(allUsers).toHaveLength(5);
    });
  });
});
