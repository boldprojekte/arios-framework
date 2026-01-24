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
};
