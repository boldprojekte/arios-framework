/**
 * Wave scheduling utilities for phase execution.
 *
 * Groups plans by wave number and formats schedule messages for CLI output.
 */

import type { PlanMeta, WaveSchedule } from '../types/execution.js';

/**
 * Build a wave schedule from plan metadata.
 *
 * Groups plans by their pre-computed wave number (from PLAN.md frontmatter).
 * Plans in the same wave can potentially run in parallel.
 *
 * @param plans - Array of plan metadata from frontmatter
 * @returns Sorted array of wave schedules
 */
export function buildWaveSchedule(plans: PlanMeta[]): WaveSchedule[] {
  // Handle empty plans array
  if (plans.length === 0) {
    return [];
  }

  // Group plans by wave number
  const waveMap = new Map<number, string[]>();

  for (const plan of plans) {
    const wave = plan.wave;
    if (!waveMap.has(wave)) {
      waveMap.set(wave, []);
    }
    waveMap.get(wave)!.push(plan.id);
  }

  // Convert to sorted array of WaveSchedule
  const schedule: WaveSchedule[] = [];

  const sortedWaves = Array.from(waveMap.entries()).sort((a, b) => a[0] - b[0]);

  for (const [wave, planIds] of sortedWaves) {
    schedule.push({
      wave,
      plans: planIds,
      canParallelize: planIds.length > 1
    });
  }

  return schedule;
}

/**
 * Format wave schedule as a multi-line CLI message.
 *
 * Output format:
 * - Wave {n}: {plan-ids} (parallel)
 * - Wave {n}: {plan-id} (sequential)
 *
 * @param schedule - Array of wave schedules
 * @returns Formatted string for CLI output
 */
export function formatWaveMessage(schedule: WaveSchedule[]): string {
  if (schedule.length === 0) {
    return 'No waves to execute';
  }

  const lines = schedule.map(w => {
    const planList = w.plans.join(', ');
    const mode = w.canParallelize ? '(parallel)' : '(sequential)';
    return `Wave ${w.wave}: ${planList} ${mode}`;
  });

  return lines.join('\n');
}
