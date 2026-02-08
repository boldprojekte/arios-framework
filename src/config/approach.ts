/**
 * Approach selection and configuration storage.
 *
 * Provides functions to get, set, and query project development approach.
 * Per CONTEXT.md: Approach is offered at project start only, user can change
 * only by explicit request. Stored in .planning/config.json (project-local).
 *
 * Note: The actual selection UI prompt (offering the user the choice) is
 * implemented by the orchestrator's /arios:ideate command, not by this module.
 * This module provides the storage and retrieval API that the orchestrator uses.
 */

import fs from 'fs-extra';
import * as path from 'node:path';
import type { Approach, ProjectConfig } from '../types/config.js';

/** Default configuration when no config file exists */
const DEFAULT_CONFIG: ProjectConfig = {
  approach: 'balanced',
  approachSetAt: '',
  mode: null,
  feature_name: null,
  active_feature: null
};

/** Config file path relative to project root */
const CONFIG_PATH = '.planning/config.json';

/**
 * Load project configuration from .planning/config.json.
 *
 * @param projectDir - Project root directory
 * @returns Project configuration (defaults if file doesn't exist)
 */
async function loadConfig(projectDir: string): Promise<ProjectConfig> {
  const configPath = path.join(projectDir, CONFIG_PATH);

  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const parsed = JSON.parse(content) as Partial<ProjectConfig>;

    // Merge with defaults to ensure required fields exist while preserving
    // unknown keys for forward compatibility.
    return {
      ...parsed,
      approach: parsed.approach ?? DEFAULT_CONFIG.approach,
      approachSetAt: parsed.approachSetAt ?? DEFAULT_CONFIG.approachSetAt,
      mode: parsed.mode ?? DEFAULT_CONFIG.mode,
      feature_name: parsed.feature_name ?? DEFAULT_CONFIG.feature_name,
      active_feature: parsed.active_feature ?? DEFAULT_CONFIG.active_feature
    };
  } catch (err) {
    // File doesn't exist or invalid JSON - return defaults
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { ...DEFAULT_CONFIG };
    }
    // For parse errors, also return defaults (corrupted config)
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save project configuration to .planning/config.json.
 *
 * @param projectDir - Project root directory
 * @param config - Configuration to save
 */
async function saveConfig(projectDir: string, config: ProjectConfig): Promise<void> {
  const configPath = path.join(projectDir, CONFIG_PATH);

  // Ensure .planning directory exists
  await fs.ensureDir(path.dirname(configPath));

  // Write config with pretty formatting for human readability
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Get the current project development approach.
 *
 * Returns 'balanced' if no approach has been explicitly set.
 *
 * @param projectDir - Project root directory
 * @returns Current approach setting
 */
export async function getApproach(projectDir: string): Promise<Approach> {
  const config = await loadConfig(projectDir);
  return config.approach;
}

/**
 * Set the project development approach.
 *
 * Per CONTEXT.md: Offered at project start only. This function is called
 * by the orchestrator when user makes their initial selection.
 *
 * @param projectDir - Project root directory
 * @param approach - Approach to set
 */
export async function setApproach(projectDir: string, approach: Approach): Promise<void> {
  const config = await loadConfig(projectDir);

  config.approach = approach;
  config.approachSetAt = new Date().toISOString();

  await saveConfig(projectDir, config);
}

/**
 * Check if approach was explicitly set by user.
 *
 * Used by orchestrator to determine if selection prompt should be shown
 * at project start. Per CONTEXT.md: only offer at project start if not
 * already set.
 *
 * @param projectDir - Project root directory
 * @returns True if approach was explicitly set, false if using default
 */
export async function hasApproachSet(projectDir: string): Promise<boolean> {
  const config = await loadConfig(projectDir);
  // approachSetAt is empty string if approach was never explicitly set
  return config.approachSetAt !== '';
}

/**
 * Get guidance string for the selected approach.
 *
 * Returns a description of how to execute work based on the approach.
 * Per CONTEXT.md, ground-up interpretation varies by project type.
 *
 * @param approach - The development approach
 * @param projectType - Optional project type for ground-up customization
 * @returns Guidance string for the approach
 */
export function getApproachGuidance(approach: Approach, projectType?: string): string {
  switch (approach) {
    case 'balanced':
      return 'Interleave UI and logic as each feature requires';

    case 'ground-up':
      // Claude's discretion per project type (per CONTEXT.md)
      if (projectType === 'api' || projectType === 'backend') {
        return 'Data models -> Business logic -> API routes -> Tests';
      } else if (projectType === 'fullstack') {
        return 'Schema -> API -> Core UI -> Features';
      } else {
        return 'Foundation -> Core logic -> Integration -> UI';
      }

    case 'ui-first':
      return 'Visual mockups with stub data -> Wire real API calls -> Implement backend';
  }
}

// Re-export Approach type for convenience
export type { Approach } from '../types/config.js';
