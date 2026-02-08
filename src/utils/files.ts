import fs from 'fs-extra';
import path from 'node:path';

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

/**
 * Copy template directory recursively, excluding .hbs files
 * (those go through template rendering instead)
 */
export async function copyTemplates(
  srcDir: string,
  destDir: string,
  options?: { exclude?: string[] }
): Promise<void> {
  const excludePatterns = options?.exclude ?? [];

  await fs.copy(srcDir, destDir, {
    filter: (src: string) => {
      const basename = path.basename(src);

      // Skip .hbs files (template files)
      if (basename.endsWith('.hbs')) {
        return false;
      }

      // Skip excluded patterns
      for (const pattern of excludePatterns) {
        if (basename === pattern || src.includes(pattern)) {
          return false;
        }
      }

      return true;
    }
  });
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read a file as string
 */
export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

/**
 * Write string to file
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}
