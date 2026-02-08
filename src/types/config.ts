/**
 * Configuration types for project settings.
 *
 * These types define the structure for project configuration stored in
 * .planning/config.json. Used by approach selection and other project-level
 * settings that persist across sessions.
 */

/**
 * Development approach for project execution.
 *
 * Per CONTEXT.md:
 * - balanced (default): Interleave UI and logic as each feature requires
 * - ground-up: Claude interprets per project domain (data layer first, etc.)
 * - ui-first: Mockup with stubs first, then wire real logic
 *
 * Offered at project start only. User can change only by explicit request.
 */
export type Approach = 'ground-up' | 'balanced' | 'ui-first';

/**
 * Runtime mode for ARIOS workflow.
 */
export type AriosMode = 'feature' | 'project';

/**
 * Checkpoint commands and timeouts for verification.
 */
export type RuntimeCheckpointConfig = {
  startCommand?: string;
  startReadyPattern?: string;
  testCommand?: string;
  buildCommand?: string;
  lintCommand?: string;
  startTimeout?: number;
  testTimeout?: number;
};

/**
 * Recovery loop configuration.
 */
export type RuntimeRecoveryConfig = {
  maxAttempts?: number;
  commitPrefix?: string;
};

/**
 * Project configuration stored in .planning/config.json.
 *
 * Project-local configuration that persists across sessions.
 * Stored in .planning/ to keep it project-scoped (not global).
 */
export type ProjectConfig = {
  /** Selected development approach */
  approach: Approach;
  /** ISO date when approach was set (empty if default) */
  approachSetAt: string;
  /** Active workflow mode */
  mode?: AriosMode | null;
  /** Current feature slug in Feature-Mode */
  feature_name?: string | null;
  /** Optional active feature selector for multi-feature workspaces */
  active_feature?: string | null;
  /** Optional verification configuration used during execution */
  checkpoint?: RuntimeCheckpointConfig;
  /** Optional recovery behavior overrides */
  recovery?: RuntimeRecoveryConfig;
  /** Preserve forward-compatible config keys */
  [key: string]: unknown;
};
