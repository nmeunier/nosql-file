import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

export class YamlHandler {
  static async read(filePath: string): Promise<unknown> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return yaml.parse(content) as unknown;
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

    // Disable YAML anchors to avoid &a1, *a1 references
    const content = yaml.stringify(data, {
      aliasDuplicateObjects: false
    });
    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Synchronously read YAML from a file
   * 
   * @param {string} filePath - Path to the YAML file
   * @returns {unknown} Parsed YAML data, or null if file doesn't exist
   */
  static readSync(filePath: string): unknown {
    try {
      const content = fsSync.readFileSync(filePath, 'utf-8');
      return yaml.parse(content) as unknown;
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Synchronously write YAML to a file
   * 
   * @param {string} filePath - Path to the YAML file
   * @param {unknown} data - Data to serialize as YAML
   */
  static writeSync(filePath: string, data: unknown): void {
    // Ensure parent directory exists
    const dir = path.dirname(filePath);
    fsSync.mkdirSync(dir, { recursive: true });

    // Disable YAML anchors to avoid &a1, *a1 references
    const content = yaml.stringify(data, {
      aliasDuplicateObjects: false
    });
    fsSync.writeFileSync(filePath, content, 'utf-8');
  }
}
