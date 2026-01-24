/**
 * Quality enforcement and validation module.
 *
 * Provides the public API for code quality enforcement:
 * - validateQuality: Full analysis with result
 * - formatPatternsForPrompt: Generate style guidance for executor prompts
 * - getPatternsOrDefault: Get patterns with sensible defaults for new projects
 *
 * Per RESEARCH.md Pitfall #6: "Extract patterns from existing code,
 * include in executor context, enforce via linting."
 */

import type { CodebasePatterns, QualityConfig, QualityResult } from '../types/quality.js';
import { extractPatterns } from './pattern-extractor.js';

/** Default sample limit for pattern extraction */
const DEFAULT_SAMPLE_LIMIT = 5;

/** Default source directories to analyze */
const DEFAULT_SRC_DIRS = ['src'];

/**
 * Validate quality by extracting patterns from existing codebase.
 *
 * This is the primary public API used by the executor to analyze
 * a project's coding patterns before generating code.
 *
 * @param config - Quality configuration
 * @returns Quality result with extracted patterns and confidence level
 */
export async function validateQuality(config: QualityConfig): Promise<QualityResult> {
  return extractPatterns(config);
}

/**
 * Format patterns as text suitable for including in executor prompts.
 *
 * Creates a human-readable summary of coding patterns that can be
 * included in AI prompts to ensure generated code matches existing style.
 *
 * @param patterns - Extracted codebase patterns
 * @returns Formatted text for prompt inclusion
 *
 * @example
 * ```
 * Code Style:
 * - Indentation: 2 spaces
 * - Quotes: single
 * - Semicolons: yes
 *
 * Example component:
 * export function Button({ label }...
 * ```
 */
export function formatPatternsForPrompt(patterns: CodebasePatterns): string {
  const lines: string[] = [];

  // Code style section
  lines.push('Code Style:');
  lines.push(`- Indentation: ${patterns.indentation}`);
  lines.push(`- Quotes: ${patterns.quotes}`);
  lines.push(`- Semicolons: ${patterns.semicolons ? 'yes' : 'no'}`);

  // Import/export style if known
  if (patterns.importStyle !== 'unknown') {
    lines.push(`- Import style: ${patterns.importStyle}`);
  }
  if (patterns.exportStyle !== 'unknown') {
    lines.push(`- Export style: ${patterns.exportStyle}`);
  }

  // Naming conventions if known
  const { namingConventions } = patterns;
  if (namingConventions.files !== 'unknown' ||
      namingConventions.functions !== 'unknown' ||
      namingConventions.components !== 'unknown') {
    lines.push('');
    lines.push('Naming Conventions:');
    if (namingConventions.files !== 'unknown') {
      lines.push(`- Files: ${namingConventions.files}`);
    }
    if (namingConventions.functions !== 'unknown') {
      lines.push(`- Functions: ${namingConventions.functions}`);
    }
    if (namingConventions.components !== 'unknown') {
      lines.push(`- Components: ${namingConventions.components}`);
    }
  }

  // Examples if available
  if (patterns.examples.component) {
    lines.push('');
    lines.push('Example component:');
    lines.push(truncateExample(patterns.examples.component, 200));
  }

  if (patterns.examples.function) {
    lines.push('');
    lines.push('Example function:');
    lines.push(truncateExample(patterns.examples.function, 200));
  }

  if (patterns.examples.api) {
    lines.push('');
    lines.push('Example API handler:');
    lines.push(truncateExample(patterns.examples.api, 200));
  }

  return lines.join('\n');
}

/**
 * Truncate an example to a maximum length.
 *
 * @param example - Code example string
 * @param maxLength - Maximum character length
 * @returns Truncated example with ellipsis if needed
 */
function truncateExample(example: string, maxLength: number): string {
  if (example.length <= maxLength) {
    return example;
  }
  return example.slice(0, maxLength) + '...';
}

/**
 * Create default patterns for new projects.
 *
 * @returns Sensible defaults: 2 spaces, single quotes, semicolons
 */
function createDefaultPatterns(): CodebasePatterns {
  return {
    namingConventions: {
      files: 'kebab-case',
      functions: 'camelCase',
      components: 'PascalCase'
    },
    importStyle: 'named imports',
    exportStyle: 'named exports',
    indentation: '2 spaces',
    quotes: 'single',
    semicolons: true,
    examples: {}
  };
}

/**
 * Get codebase patterns or return sensible defaults.
 *
 * Attempts to extract patterns from the project. If no files are found
 * (new project), returns sensible defaults that match modern TypeScript
 * conventions.
 *
 * @param projectDir - Root project directory path
 * @returns Extracted patterns or sensible defaults
 */
export async function getPatternsOrDefault(projectDir: string): Promise<CodebasePatterns> {
  const config: QualityConfig = {
    projectDir,
    srcDirs: DEFAULT_SRC_DIRS,
    sampleLimit: DEFAULT_SAMPLE_LIMIT
  };

  const result = await extractPatterns(config);

  // If no files analyzed, return defaults
  if (result.analyzed === 0) {
    return createDefaultPatterns();
  }

  return result.patterns;
}

/**
 * Create a full quality analysis with custom configuration.
 *
 * Convenience function for running quality analysis with specific
 * source directories and sample limits.
 *
 * @param projectDir - Root project directory path
 * @param options - Optional configuration overrides
 * @returns Full quality result
 */
export async function analyzeQuality(
  projectDir: string,
  options?: {
    srcDirs?: string[];
    sampleLimit?: number;
  }
): Promise<QualityResult> {
  const config: QualityConfig = {
    projectDir,
    srcDirs: options?.srcDirs ?? DEFAULT_SRC_DIRS,
    sampleLimit: options?.sampleLimit ?? DEFAULT_SAMPLE_LIMIT
  };

  return validateQuality(config);
}
