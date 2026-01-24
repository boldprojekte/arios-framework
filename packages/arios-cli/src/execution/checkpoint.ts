/**
 * Checkpoint verification module.
 *
 * Enables execution to pause at points where user can verify the app works.
 * Per CONTEXT.md: "Testable = app runs + tests pass"
 */

import { spawn, type ChildProcess } from 'node:child_process';
import type { CheckpointConfig, CheckpointResult } from '../types/execution.js';

/** Default timeout for app start (30 seconds) */
const DEFAULT_START_TIMEOUT = 30000;

/** Default timeout for test execution (2 minutes) */
const DEFAULT_TEST_TIMEOUT = 120000;

/**
 * Verify a checkpoint by running app start and test commands.
 *
 * Returns passed: true only when BOTH appRuns AND testsPass are true.
 * Missing commands default to true (no app/tests to verify).
 *
 * @param cwd - Working directory to run commands in
 * @param config - Checkpoint configuration
 * @returns Checkpoint verification result
 */
export async function verifyCheckpoint(
  cwd: string,
  config: CheckpointConfig
): Promise<CheckpointResult> {
  const output: string[] = [];
  const errors: string[] = [];

  // Default to true if not configured (nothing to verify)
  let appRuns = true;
  let testsPass = true;

  // Verify app starts if startCommand configured
  if (config.startCommand) {
    const startResult = await verifyAppStart(cwd, config, output, errors);
    appRuns = startResult;
  }

  // Verify tests pass if testCommand configured AND app runs
  if (config.testCommand && appRuns) {
    const testResult = await verifyTests(cwd, config, output, errors);
    testsPass = testResult;
  }

  // Per CONTEXT.md: "testable = app runs + tests pass"
  const passed = appRuns && testsPass;

  return {
    appRuns,
    testsPass,
    passed,
    output: output.join('\n'),
    errors
  };
}

/**
 * Verify that the app starts successfully.
 *
 * Spawns the start command and waits for the ready pattern or timeout.
 *
 * @param cwd - Working directory
 * @param config - Checkpoint configuration
 * @param output - Array to collect output
 * @param errors - Array to collect errors
 * @returns true if app started successfully
 */
async function verifyAppStart(
  cwd: string,
  config: CheckpointConfig,
  output: string[],
  errors: string[]
): Promise<boolean> {
  const timeout = config.startTimeout ?? DEFAULT_START_TIMEOUT;
  const readyPattern = config.startReadyPattern
    ? new RegExp(config.startReadyPattern)
    : null;

  return new Promise<boolean>((resolve) => {
    let child: ChildProcess | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let resolved = false;

    const cleanup = (result: boolean) => {
      if (resolved) return;
      resolved = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (child) {
        // Kill process tree
        try {
          child.kill('SIGTERM');
        } catch {
          // Process may already be dead
        }
        child = null;
      }

      resolve(result);
    };

    try {
      // Parse command into program and args
      const [program, ...args] = parseCommand(config.startCommand!);

      child = spawn(program, args, {
        cwd,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      output.push(`[checkpoint] Starting: ${config.startCommand}`);

      // Collect stdout
      child.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        output.push(text);

        // Check for ready pattern
        if (readyPattern && readyPattern.test(text)) {
          output.push('[checkpoint] App ready signal detected');
          cleanup(true);
        }
      });

      // Collect stderr
      child.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        output.push(text);
      });

      // Handle process exit
      child.on('error', (err) => {
        errors.push(`[checkpoint] Start error: ${err.message}`);
        cleanup(false);
      });

      child.on('close', (code) => {
        if (!resolved) {
          // Process exited before ready pattern matched
          if (code === 0 && !readyPattern) {
            // No ready pattern and exited successfully
            output.push('[checkpoint] Start command completed successfully');
            cleanup(true);
          } else {
            errors.push(`[checkpoint] Start command exited with code ${code}`);
            cleanup(false);
          }
        }
      });

      // Set timeout
      timeoutId = setTimeout(() => {
        if (!resolved) {
          errors.push(`[checkpoint] Start timeout after ${timeout}ms`);
          cleanup(false);
        }
      }, timeout);
    } catch (err) {
      errors.push(`[checkpoint] Failed to spawn start command: ${err}`);
      cleanup(false);
    }
  });
}

/**
 * Verify that tests pass.
 *
 * Spawns the test command and waits for exit code.
 *
 * @param cwd - Working directory
 * @param config - Checkpoint configuration
 * @param output - Array to collect output
 * @param errors - Array to collect errors
 * @returns true if tests passed (exit code 0)
 */
async function verifyTests(
  cwd: string,
  config: CheckpointConfig,
  output: string[],
  errors: string[]
): Promise<boolean> {
  const timeout = config.testTimeout ?? DEFAULT_TEST_TIMEOUT;

  return new Promise<boolean>((resolve) => {
    let child: ChildProcess | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let resolved = false;

    const cleanup = (result: boolean) => {
      if (resolved) return;
      resolved = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (child) {
        try {
          child.kill('SIGTERM');
        } catch {
          // Process may already be dead
        }
        child = null;
      }

      resolve(result);
    };

    try {
      const [program, ...args] = parseCommand(config.testCommand!);

      child = spawn(program, args, {
        cwd,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      output.push(`[checkpoint] Running tests: ${config.testCommand}`);

      // Collect stdout
      child.stdout?.on('data', (data: Buffer) => {
        output.push(data.toString());
      });

      // Collect stderr
      child.stderr?.on('data', (data: Buffer) => {
        output.push(data.toString());
      });

      // Handle process exit
      child.on('error', (err) => {
        errors.push(`[checkpoint] Test error: ${err.message}`);
        cleanup(false);
      });

      child.on('close', (code) => {
        if (code === 0) {
          output.push('[checkpoint] Tests passed');
          cleanup(true);
        } else {
          errors.push(`[checkpoint] Tests failed with exit code ${code}`);
          cleanup(false);
        }
      });

      // Set timeout
      timeoutId = setTimeout(() => {
        if (!resolved) {
          errors.push(`[checkpoint] Test timeout after ${timeout}ms`);
          cleanup(false);
        }
      }, timeout);
    } catch (err) {
      errors.push(`[checkpoint] Failed to spawn test command: ${err}`);
      cleanup(false);
    }
  });
}

/**
 * Parse a command string into program and arguments.
 *
 * Simple parsing - splits on spaces. For complex commands,
 * the shell: true option handles quoting.
 *
 * @param command - Command string
 * @returns [program, ...args]
 */
function parseCommand(command: string): string[] {
  return command.split(/\s+/).filter(Boolean);
}
