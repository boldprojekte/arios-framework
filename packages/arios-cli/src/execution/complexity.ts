/**
 * Complexity detection for phase execution.
 *
 * Analyzes plan metadata to determine execution complexity,
 * which affects wave scheduling and parallelization strategy.
 */

import type { PlanMeta, ComplexityResult, ComplexityLevel } from '../types/execution.js';

/**
 * Detect complexity level from an array of plan metadata.
 *
 * Uses hybrid signals: plan count, wave depth, and average dependencies.
 *
 * Thresholds:
 * - Simple: planCount <= 2 AND maxWave === 1
 * - Complex: planCount >= 6 OR maxWave >= 3 OR avgDeps >= 2
 * - Moderate: everything else
 *
 * @param plans - Array of plan metadata from frontmatter
 * @returns Complexity result with level, wave count, and CLI message
 */
export function detectComplexity(plans: PlanMeta[]): ComplexityResult {
  // Handle empty plans array
  if (plans.length === 0) {
    return {
      level: 'simple',
      waves: 0,
      planCount: 0,
      message: 'Detected: simple (0 plans, 0 waves)'
    };
  }

  const planCount = plans.length;
  const maxWave = Math.max(...plans.map(p => p.wave));
  const avgDeps = plans.reduce((sum, p) => sum + p.dependsOn.length, 0) / planCount;

  // Determine complexity level using hybrid signal thresholds
  let level: ComplexityLevel;

  // Simple: few plans, single wave
  if (planCount <= 2 && maxWave === 1) {
    level = 'simple';
  }
  // Complex: many plans, deep waves, or high dependencies
  else if (planCount >= 6 || maxWave >= 3 || avgDeps >= 2) {
    level = 'complex';
  }
  // Moderate: everything else
  else {
    level = 'moderate';
  }

  // Generate brief CLI message per CONTEXT.md specification
  const planLabel = planCount === 1 ? 'plan' : 'plans';
  const waveLabel = maxWave === 1 ? 'wave' : 'waves';
  const message = `Detected: ${level} (${planCount} ${planLabel}, ${maxWave} ${waveLabel})`;

  return {
    level,
    waves: maxWave,
    planCount,
    message
  };
}
