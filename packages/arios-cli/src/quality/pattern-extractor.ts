/**
 * Pattern extraction from existing codebase.
 *
 * Analyzes existing TypeScript/TSX files to detect coding patterns
 * (indentation, quotes, semicolons) and extract examples for style guidance.
 * Used by executor to ensure generated code matches project conventions.
 *
 * Per RESEARCH.md: "Start simple: indentation, quotes, semicolons, one example
 * of each file type. Expand if quality issues arise."
 */

import fs from 'fs-extra';
import * as path from 'node:path';
import type { CodebasePatterns, QualityConfig, QualityResult } from '../types/quality.js';

/** Directories to skip during file search */
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage']);

/** File extensions to analyze */
const ANALYZABLE_EXTENSIONS = ['.ts', '.tsx'];

/**
 * Find files recursively in a directory.
 *
 * Searches for TypeScript files while skipping common ignored directories.
 * Returns up to the specified limit of files.
 *
 * @param dir - Directory to search
 * @param extensions - File extensions to include
 * @param limit - Maximum files to return
 * @returns Array of file paths
 */
async function findFiles(dir: string, extensions: string[], limit: number): Promise<string[]> {
  const results: string[] = [];

  async function walk(currentDir: string): Promise<void> {
    if (results.length >= limit) return;

    let items: fs.Dirent[];
    try {
      items = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      // Directory may not exist or not be readable
      return;
    }

    for (const item of items) {
      if (results.length >= limit) break;

      const fullPath = path.join(currentDir, item.name);

      if (item.isDirectory()) {
        // Skip ignored directories
        if (!IGNORED_DIRS.has(item.name) && !item.name.startsWith('.')) {
          await walk(fullPath);
        }
      } else if (item.isFile()) {
        // Check extension
        const ext = path.extname(item.name);
        if (extensions.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  }

  await walk(dir);
  return results;
}

/**
 * Detect indentation style from file content.
 *
 * Checks first indented line for tabs vs spaces.
 *
 * @param content - File content
 * @returns Indentation description (e.g., "2 spaces", "tabs")
 */
function detectIndentation(content: string): string {
  const match = content.match(/^( +|\t)/m);
  if (!match) return 'unknown';

  if (match[0] === '\t') {
    return 'tabs';
  }

  return `${match[0].length} spaces`;
}

/**
 * Detect quote style from file content.
 *
 * Counts single vs double quotes (excluding those in strings/comments
 * is not perfect but sufficient for pattern detection).
 *
 * @param content - File content
 * @returns 'single' or 'double'
 */
function detectQuotes(content: string): 'single' | 'double' {
  const singleQuotes = (content.match(/'/g) || []).length;
  const doubleQuotes = (content.match(/"/g) || []).length;
  return singleQuotes > doubleQuotes ? 'single' : 'double';
}

/**
 * Detect semicolon usage from file content.
 *
 * Checks if majority of statement lines end with semicolons.
 *
 * @param content - File content
 * @returns true if semicolons are used
 */
function detectSemicolons(content: string): boolean {
  const lines = content.split('\n').filter(line => {
    const trimmed = line.trim();
    // Skip empty lines, comments, and bracket-only lines
    return trimmed.length > 0 &&
           !trimmed.startsWith('//') &&
           !trimmed.startsWith('/*') &&
           !trimmed.startsWith('*') &&
           trimmed !== '{' &&
           trimmed !== '}' &&
           trimmed !== '};';
  });

  if (lines.length === 0) return true;

  const withSemi = lines.filter(line => line.trim().endsWith(';')).length;
  return withSemi > lines.length / 2;
}

/**
 * Extract a component example from TSX content.
 *
 * Looks for exported function components.
 *
 * @param content - TSX file content
 * @returns Component snippet or undefined
 */
function extractComponentExample(content: string): string | undefined {
  // Match exported function component
  const match = content.match(
    /export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)[^{]*\{[\s\S]{0,400}/
  );

  if (match) {
    // Truncate and add ellipsis
    const snippet = match[0].slice(0, 200);
    return snippet.endsWith('}') ? snippet : snippet + '...';
  }

  return undefined;
}

/**
 * Extract a function example from TS content.
 *
 * Looks for exported functions (non-component).
 *
 * @param content - TS file content
 * @returns Function snippet or undefined
 */
function extractFunctionExample(content: string): string | undefined {
  // Match exported function
  const match = content.match(
    /export\s+(?:async\s+)?function\s+\w+\s*\([^)]*\)[^{]*\{[\s\S]{0,300}/
  );

  if (match) {
    const snippet = match[0].slice(0, 200);
    return snippet.endsWith('}') ? snippet : snippet + '...';
  }

  return undefined;
}

/**
 * Create default patterns for projects with no existing code.
 *
 * @returns Sensible default patterns
 */
function createDefaultPatterns(): CodebasePatterns {
  return {
    namingConventions: {
      files: 'unknown',
      functions: 'unknown',
      components: 'unknown'
    },
    importStyle: 'unknown',
    exportStyle: 'unknown',
    indentation: '2 spaces',
    quotes: 'single',
    semicolons: true,
    examples: {}
  };
}

/**
 * Calculate confidence level based on analysis.
 *
 * @param analyzed - Number of files analyzed
 * @param hasConsistentPatterns - Whether patterns were consistent
 * @returns Confidence level
 */
function calculateConfidence(analyzed: number, hasConsistentPatterns: boolean): 'high' | 'medium' | 'low' {
  if (analyzed >= 5 && hasConsistentPatterns) {
    return 'high';
  }
  if (analyzed >= 2) {
    return 'medium';
  }
  return 'low';
}

/**
 * Extract patterns from existing codebase.
 *
 * Analyzes TypeScript/TSX files in the specified source directories
 * to detect coding patterns and extract examples for style guidance.
 *
 * Per RESEARCH.md Pitfall #6: "Extract patterns from existing code,
 * include in executor context, enforce via linting."
 *
 * @param config - Quality configuration
 * @returns Quality result with extracted patterns
 */
export async function extractPatterns(config: QualityConfig): Promise<QualityResult> {
  const patterns = createDefaultPatterns();

  // Collect all files from all source directories
  let allFiles: string[] = [];
  for (const srcDir of config.srcDirs) {
    const fullDir = path.join(config.projectDir, srcDir);
    const files = await findFiles(fullDir, ANALYZABLE_EXTENSIONS, config.sampleLimit);
    allFiles = allFiles.concat(files);
    if (allFiles.length >= config.sampleLimit) break;
  }

  // Limit to sample size
  const filesToAnalyze = allFiles.slice(0, config.sampleLimit);

  if (filesToAnalyze.length === 0) {
    return {
      patterns,
      analyzed: 0,
      confidence: 'low'
    };
  }

  // Track pattern consistency
  const indentations: string[] = [];
  const quoteStyles: ('single' | 'double')[] = [];
  const semicolonStyles: boolean[] = [];

  // Analyze each file
  for (const file of filesToAnalyze) {
    let content: string;
    try {
      content = await fs.readFile(file, 'utf-8');
    } catch {
      continue;
    }

    // Detect patterns
    const indentation = detectIndentation(content);
    if (indentation !== 'unknown') {
      indentations.push(indentation);
    }

    quoteStyles.push(detectQuotes(content));
    semicolonStyles.push(detectSemicolons(content));

    // Extract examples
    if (file.endsWith('.tsx') && !patterns.examples.component) {
      patterns.examples.component = extractComponentExample(content);
    } else if (file.endsWith('.ts') && !patterns.examples.function) {
      patterns.examples.function = extractFunctionExample(content);
    }
  }

  // Aggregate patterns (use most common)
  if (indentations.length > 0) {
    const indentCounts = new Map<string, number>();
    for (const indent of indentations) {
      indentCounts.set(indent, (indentCounts.get(indent) || 0) + 1);
    }
    patterns.indentation = Array.from(indentCounts.entries())
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  if (quoteStyles.length > 0) {
    const singleCount = quoteStyles.filter(q => q === 'single').length;
    patterns.quotes = singleCount >= quoteStyles.length / 2 ? 'single' : 'double';
  }

  if (semicolonStyles.length > 0) {
    const semiCount = semicolonStyles.filter(s => s).length;
    patterns.semicolons = semiCount >= semicolonStyles.length / 2;
  }

  // Check pattern consistency for confidence
  const isConsistent =
    indentations.length > 0 && new Set(indentations).size === 1 &&
    quoteStyles.length > 0 && new Set(quoteStyles).size === 1;

  return {
    patterns,
    analyzed: filesToAnalyze.length,
    confidence: calculateConfidence(filesToAnalyze.length, isConsistent)
  };
}
