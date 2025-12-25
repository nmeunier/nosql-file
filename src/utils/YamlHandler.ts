import * as fs from 'fs/promises';
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

    const content = yaml.stringify(data);
    await fs.writeFile(filePath, content, 'utf-8');
  }
}
