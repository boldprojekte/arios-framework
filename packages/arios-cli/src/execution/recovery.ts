/**
 * Recovery flow for checkpoint failures.
 *
 * When a checkpoint fails (app doesn't run or tests don't pass),
 * this module orchestrates recovery attempts:
 * 1. Spawn debug subagent to diagnose the failure
 * 2. Debug subagent writes a debug plan
 * 3. Execute the debug plan
 * 4. Re-verify the checkpoint
 * 5. Repeat up to maxAttempts (default: 3)
 *
 * Per CONTEXT.md: "2-3 attempts before hard stop, then stop with diagnostic output"
 */

import type {
  CheckpointResult,
  CheckpointConfig,
  RecoveryAttempt,
  RecoveryResult,
  RecoveryConfig,
} from '../types/execution.js';
import { verifyCheckpoint } from './checkpoint.js';

/**
 * Attempt to recover from a checkpoint failure.
 *
 * Spawns debug subagent for diagnosis, executes debug plan,
 * and re-verifies. Repeats until fixed or maxAttempts reached.
 *
 * @param cwd - Working directory for the project
 * @param failure - The failed checkpoint result to recover from
 * @param config - Recovery configuration (maxAttempts, checkpointConfig)
 * @returns Recovery result with all attempts and final diagnostic
 */
export async function attemptRecovery(
  cwd: string,
  failure: CheckpointResult,
  config: RecoveryConfig
): Promise<RecoveryResult> {
  const maxAttempts = config.maxAttempts || 3;
  const result: RecoveryResult = {
    fixed: false,
    attempts: [],
  };

  for (let i = 1; i <= maxAttempts; i++) {
    // Create record for this attempt
    const attempt: RecoveryAttempt = {
      attempt: i,
      diagnosis: '',
      debugPlanPath: '',
      result: 'failed',
    };

    // Step 1: Spawn debug subagent to diagnose and write plan
    const debugResult = await spawnDebugSubagent(cwd, failure);
    attempt.diagnosis = debugResult.diagnosis;
    attempt.debugPlanPath = debugResult.planPath;

    // Step 2: Execute the debug plan
    const execResult = await executeDebugPlan(debugResult.planPath);

    if (execResult.success) {
      // Step 3: Re-verify the checkpoint
      const verifyResult = await verifyCheckpoint(cwd, config.checkpointConfig);

      if (verifyResult.passed) {
        // Recovery succeeded
        attempt.result = 'fixed';
        result.attempts.push(attempt);
        result.fixed = true;
        return result;
      }
    }

    // Attempt failed, record and continue
    attempt.result = 'failed';
    result.attempts.push(attempt);
  }

  // All attempts exhausted, generate final diagnostic
  result.finalDiagnostic = generateDiagnostic(result.attempts);
  return result;
}

/**
 * Spawn a debug subagent to diagnose checkpoint failure.
 *
 * The debug subagent analyzes the failure, determines the root cause,
 * and writes a debug plan for the executor to run.
 *
 * TODO: Wire to Task tool to spawn debug agent when orchestrator commands implemented.
 * Debug agent writes plan to .planning/debug/debug-{timestamp}-PLAN.md
 *
 * @param cwd - Working directory for the project
 * @param failure - The failed checkpoint result to diagnose
 * @returns Diagnosis summary and path to debug plan
 */
export async function spawnDebugSubagent(
  cwd: string,
  failure: CheckpointResult
): Promise<{ diagnosis: string; planPath: string }> {
  // TODO: Implement actual subagent spawning via Task tool
  // For now, return placeholder values
  const timestamp = Date.now();

  return {
    diagnosis: `[STUB] Debug subagent would analyze failure: appRuns=${failure.appRuns}, testsPass=${failure.testsPass}`,
    planPath: `${cwd}/.planning/debug/debug-${timestamp}-PLAN.md`,
  };
}

/**
 * Execute a debug plan written by the debug subagent.
 *
 * The executor processes the debug plan to apply fixes.
 *
 * TODO: Wire to executor invocation when orchestrator commands implemented.
 *
 * @param planPath - Path to the debug plan to execute
 * @returns Whether the debug plan executed successfully
 */
export async function executeDebugPlan(
  planPath: string
): Promise<{ success: boolean }> {
  // TODO: Implement actual plan execution via executor
  // For now, return failure (stub behavior)
  return { success: false };
}

/**
 * Generate diagnostic output from all recovery attempts.
 *
 * Called when all retries are exhausted. Provides structured
 * output for manual debugging.
 *
 * @param attempts - All recovery attempts made
 * @returns Formatted diagnostic string
 */
export function generateDiagnostic(attempts: RecoveryAttempt[]): string {
  const lines: string[] = [
    '=== Recovery Failed ===',
    '',
    `Total attempts: ${attempts.length}`,
    '',
    '--- Attempt Details ---',
  ];

  for (const attempt of attempts) {
    lines.push('');
    lines.push(`Attempt ${attempt.attempt}:`);
    lines.push(`  Diagnosis: ${attempt.diagnosis}`);
    lines.push(`  Debug Plan: ${attempt.debugPlanPath}`);
    lines.push(`  Result: ${attempt.result}`);
  }

  lines.push('');
  lines.push('--- Recommendation ---');
  lines.push('Automatic recovery exhausted. Manual investigation required.');
  lines.push('Check the debug plans above for diagnostic information.');
  lines.push('Common causes:');
  lines.push('  - Missing dependencies');
  lines.push('  - Configuration errors');
  lines.push('  - Type mismatches');
  lines.push('  - Integration conflicts');

  return lines.join('\n');
}
