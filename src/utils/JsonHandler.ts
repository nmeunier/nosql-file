import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';

export class JsonHandler {
  static async read(filePath: string): Promise<unknown> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  static async write(filePath: string, data: unknown): Promise<void> {
    // Ensure parent directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Synchronously read JSON from a file
   * 
   * @param {string} filePath - Path to the JSON file
   * @returns {unknown} Parsed JSON data, or null if file doesn't exist
   */
  static readSync(filePath: string): unknown {
    try {
      const content = fsSync.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Synchronously write JSON to a file
   * 
   * @param {string} filePath - Path to the JSON file
   * @param {unknown} data - Data to serialize as JSON
   */
  static writeSync(filePath: string, data: unknown): void {
    // Ensure parent directory exists
    const dir = path.dirname(filePath);
    fsSync.mkdirSync(dir, { recursive: true });

    const content = JSON.stringify(data, null, 2);
    fsSync.writeFileSync(filePath, content, 'utf-8');
  }
}
