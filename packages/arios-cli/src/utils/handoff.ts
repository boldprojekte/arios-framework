/**
 * Handoff utilities for subagent communication.
 *
 * Provides functions to parse and write handoff files with YAML frontmatter.
 */

import matter from 'gray-matter';
import * as path from 'node:path';
import fs from 'fs-extra';
import type { BaseFrontmatter, HandoffFile, HandoffType } from '../types/handoff.js';

/**
 * Parse a handoff file and extract frontmatter and body.
 *
 * @param filePath - Path to the handoff file
 * @returns Parsed handoff file with typed frontmatter and markdown body
 */
export async function parseHandoffFile<T extends BaseFrontmatter>(
  filePath: string
): Promise<HandoffFile<T>> {
  const content = await fs.readFile(filePath, 'utf-8');
  const parsed = matter(content);

  return {
    frontmatter: parsed.data as T,
    body: parsed.content.trim()
  };
}

/**
 * Write a handoff file with YAML frontmatter.
 *
 * @param dirPath - Directory to write the file to
 * @param frontmatter - Typed frontmatter object
 * @param body - Markdown body content
 * @returns Full path to the written file
 */
export async function writeHandoffFile<T extends BaseFrontmatter>(
  dirPath: string,
  frontmatter: T,
  body: string
): Promise<string> {
  await fs.ensureDir(dirPath);

  // Generate filename based on type and version
  const filename = `${frontmatter.type}-${frontmatter.version}.md`;
  const filePath = path.join(dirPath, filename);

  // Format as YAML frontmatter + markdown body
  const content = matter.stringify(body, frontmatter);

  await fs.writeFile(filePath, content, 'utf-8');

  return filePath;
}

/**
 * Get the next version number for a handoff type in a directory.
 *
 * Scans for existing files and returns the next major version.
 * E.g., if 001 and 001.1 exist, returns "002".
 *
 * @param dirPath - Directory to scan
 * @param type - Handoff type to look for
 * @returns Next version string (e.g., "002")
 */
export async function getNextVersion(
  dirPath: string,
  type: HandoffType
): Promise<string> {
  try {
    const files = await fs.readdir(dirPath);

    // Filter files matching the type pattern
    const pattern = new RegExp(`^${type}-(\\d{3})(?:\\.(\\d+))?\\.md$`);
    const versions: number[] = [];

    for (const file of files) {
      const match = file.match(pattern);
      if (match) {
        // Extract major version number
        versions.push(parseInt(match[1], 10));
      }
    }

    if (versions.length === 0) {
      return '001';
    }

    // Get the highest major version and increment
    const maxVersion = Math.max(...versions);
    const nextVersion = maxVersion + 1;

    // Pad to 3 digits
    return nextVersion.toString().padStart(3, '0');
  } catch (error) {
    // Directory doesn't exist or can't be read - start at 001
    return '001';
  }
}

/**
 * Format a timestamp in ISO 8601 format.
 *
 * @returns ISO 8601 timestamp string
 */
export function formatTimestamp(): string {
  return new Date().toISOString();
}
