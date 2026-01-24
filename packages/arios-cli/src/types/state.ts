/**
 * State types for project state persistence.
 *
 * These types define the structure for project state stored in .planning/STATE.md
 * with YAML frontmatter. Used by orchestrator workflows for session continuity.
 */

/**
 * Phase execution status
 */
export type PhaseStatus = 'not-started' | 'in-progress' | 'complete' | 'blocked';

/**
 * Decision record for tracking both positive and negative decisions.
 *
 * Per CONTEXT.md: Negative decisions are explicitly tracked to prevent
 * re-suggesting rejected ideas.
 */
export type DecisionRecord = {
  /** Unique identifier for the decision */
  id: string;
  /** The decision made (what was decided) */
  decision: string;
  /** Reasoning behind the decision (the "why") */
  reasoning: string;
  /** Phase where decision was made (e.g., "01-01") */
  phase: string;
  /** Date of decision in ISO format (YYYY-MM-DD) */
  date: string;
  /** True for negative decisions (rejected ideas) */
  rejected?: boolean;
};

/**
 * State frontmatter stored as YAML in STATE.md.
 *
 * This is the machine-readable portion of state that enables
 * position tracking and conflict detection.
 */
export type StateFrontmatter = {
  /** Schema version for future migrations */
  version: string;
  /** Current phase number */
  phase: number;
  /** Current plan index within phase */
  planIndex: number;
  /** Total phases in project */
  totalPhases: number;
  /** Total plans in current phase */
  totalPlans: number;
  /** Current execution status */
  status: PhaseStatus;
  /** Last activity date in ISO format (YYYY-MM-DD) */
  lastActivity: string;
  /** MD5 checksum for conflict detection (first 8 chars) */
  checksum: string;
};

/**
 * Full project state combining frontmatter and body.
 *
 * The body contains human-readable markdown with decisions list
 * and other context for manual inspection.
 */
export type ProjectState = {
  /** Structured frontmatter data */
  frontmatter: StateFrontmatter;
  /** Decision records extracted from or stored in body */
  decisions: DecisionRecord[];
  /** Human-readable markdown content */
  body: string;
};

/**
 * Result of state conflict detection.
 *
 * Per CONTEXT.md: Never auto-fix conflicts. This type provides
 * information for collaborative resolution with user.
 */
export type StateConflict = {
  /** Whether a conflict was detected */
  hasConflict: boolean;
  /** Checksum stored in state file */
  expectedChecksum: string;
  /** Checksum calculated from current content */
  actualChecksum: string;
  /** Human-readable conflict description */
  message: string;
};
