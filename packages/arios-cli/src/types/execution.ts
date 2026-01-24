/**
 * Execution types for phase execution orchestration.
 *
 * These types support complexity detection, wave scheduling, and
 * execution state management.
 */

/**
 * Complexity level of a phase execution.
 *
 * - simple: 1-2 plans, single wave
 * - moderate: 3-5 plans, 2 waves, low dependencies
 * - complex: 6+ plans, 3+ waves, or high dependencies
 */
export type ComplexityLevel = 'simple' | 'moderate' | 'complex';

/**
 * Metadata extracted from a plan's frontmatter.
 *
 * Used for complexity detection and wave scheduling.
 */
export type PlanMeta = {
  /** Plan identifier (e.g., "05-01") */
  id: string;
  /** Phase name (e.g., "05-execution-flow") */
  phase: string;
  /** Plan number within phase (1, 2, 3...) */
  plan: number;
  /** Execution wave number (1, 2, 3...) */
  wave: number;
  /** Plan IDs this plan depends on */
  dependsOn: string[];
  /** Files this plan modifies */
  filesModified: string[];
  /** Whether this plan runs autonomously */
  autonomous: boolean;
  /** Count of tasks in the plan */
  estimatedTasks: number;
};

/**
 * Result of complexity detection.
 *
 * Includes the detected level and a brief CLI message.
 */
export type ComplexityResult = {
  /** Detected complexity level */
  level: ComplexityLevel;
  /** Number of execution waves */
  waves: number;
  /** Total number of plans in the phase */
  planCount: number;
  /** Brief CLI message (e.g., "Detected: complex (3 waves)") */
  message: string;
};

/**
 * Schedule for a single execution wave.
 *
 * Plans in the same wave can potentially run in parallel.
 */
export type WaveSchedule = {
  /** Wave number (1, 2, 3...) */
  wave: number;
  /** Plan IDs in this wave */
  plans: string[];
  /** Whether plans in this wave can run in parallel */
  canParallelize: boolean;
};

/**
 * Configuration for checkpoint verification.
 *
 * Defines how to verify that the app runs and tests pass.
 */
export type CheckpointConfig = {
  /** Command to start the app (e.g., "npm run dev") */
  startCommand?: string;
  /** Regex pattern to match in stdout when app is ready (e.g., "ready on port") */
  startReadyPattern?: string;
  /** Timeout for app start in milliseconds (default: 30000) */
  startTimeout?: number;
  /** Command to run tests (e.g., "npm test") */
  testCommand?: string;
  /** Timeout for test execution in milliseconds (default: 120000) */
  testTimeout?: number;
};

/**
 * Result of checkpoint verification.
 *
 * Per CONTEXT.md: "testable = app runs + tests pass"
 */
export type CheckpointResult = {
  /** Whether the app started successfully (or true if no startCommand) */
  appRuns: boolean;
  /** Whether tests passed (or true if no testCommand) */
  testsPass: boolean;
  /** Overall pass: appRuns AND testsPass */
  passed: boolean;
  /** Combined output from commands for logging */
  output: string;
  /** Any error messages collected during verification */
  errors: string[];
};
