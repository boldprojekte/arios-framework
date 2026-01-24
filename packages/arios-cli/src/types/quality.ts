/**
 * Quality types for code pattern extraction and enforcement.
 *
 * These types define the structure for analyzing existing codebase patterns
 * and ensuring generated code matches project conventions. Used by execution
 * engine to maintain style consistency.
 */

/**
 * Naming conventions detected in the codebase.
 *
 * Tracks naming patterns for different code elements to ensure
 * generated code matches existing style.
 */
export type NamingConventions = {
  /** File naming pattern (e.g., "kebab-case", "camelCase") */
  files: string;
  /** Function naming pattern (e.g., "camelCase") */
  functions: string;
  /** Component naming pattern (e.g., "PascalCase") */
  components: string;
};

/**
 * Code patterns extracted from existing codebase.
 *
 * Per RESEARCH.md Pitfall #6: Extract patterns from existing code,
 * include in executor context for style consistency.
 */
export type CodebasePatterns = {
  /** Naming conventions for files, functions, components */
  namingConventions: NamingConventions;
  /** Import style (e.g., "named imports", "default imports") */
  importStyle: string;
  /** Export style (e.g., "named exports", "default exports") */
  exportStyle: string;
  /** Indentation style (e.g., "2 spaces", "tabs") */
  indentation: string;
  /** Quote style for strings */
  quotes: 'single' | 'double';
  /** Whether lines end with semicolons */
  semicolons: boolean;
  /** Code examples from existing codebase */
  examples: {
    /** Example React/TSX component snippet */
    component?: string;
    /** Example function snippet */
    function?: string;
    /** Example API route/handler snippet */
    api?: string;
  };
};

/**
 * Configuration for quality analysis.
 *
 * Controls which directories to analyze and how many files to sample.
 */
export type QualityConfig = {
  /** Root project directory path */
  projectDir: string;
  /** Source directories to analyze (e.g., ["src"]) */
  srcDirs: string[];
  /** Maximum files to analyze (default: 5) */
  sampleLimit: number;
};

/**
 * Result of quality/pattern analysis.
 *
 * Includes extracted patterns, analysis metrics, and confidence level
 * based on sample size and consistency.
 */
export type QualityResult = {
  /** Extracted codebase patterns */
  patterns: CodebasePatterns;
  /** Number of files analyzed */
  analyzed: number;
  /** Confidence level based on sample size and consistency */
  confidence: 'high' | 'medium' | 'low';
};
