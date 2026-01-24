/**
 * Handoff types for subagent communication protocol.
 *
 * These types define the structured format for communication between
 * orchestrator and subagents (Researcher, Planner, Executor).
 */

/**
 * Type of handoff document
 */
export type HandoffType = 'findings' | 'plan' | 'problem';

/**
 * Status of the handoff
 */
export type HandoffStatus = 'complete' | 'partial' | 'failed';

/**
 * Confidence level for findings
 */
export type Confidence = 'high' | 'medium' | 'low';

/**
 * Severity level for problems
 */
export type Severity = 'blocker' | 'warning' | 'info';

/**
 * Base frontmatter fields common to all handoff types
 */
export type BaseFrontmatter = {
  version: string;
  type: HandoffType;
  status: HandoffStatus;
  created: string;
  phase: string;
  agent: string;
};

/**
 * Frontmatter for findings documents (from Researcher)
 */
export type FindingsFrontmatter = BaseFrontmatter & {
  type: 'findings';
  confidence: Confidence;
};

/**
 * Frontmatter for plan documents (from Planner)
 */
export type PlanFrontmatter = BaseFrontmatter & {
  type: 'plan';
  tasks_created: number;
  task_ids: string[];
};

/**
 * Frontmatter for problem documents (from Executor)
 */
export type ProblemFrontmatter = BaseFrontmatter & {
  type: 'problem';
  severity: Severity;
  related_task: string;
};

/**
 * Generic handoff file structure
 */
export type HandoffFile<T extends BaseFrontmatter> = {
  frontmatter: T;
  body: string;
};
