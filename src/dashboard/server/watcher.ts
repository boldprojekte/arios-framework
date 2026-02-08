/**
 * File watcher module using Chokidar
 *
 * Watches .planning directory for changes and triggers state updates
 */

import chokidar, { type FSWatcher } from 'chokidar';
import { basename } from 'node:path';
import { parseFile, buildDashboardState, type ParsedFile } from './parser.js';
import type { DashboardState, Task } from '../types/dashboard.js';

/** Debounce timeout in milliseconds */
const DEBOUNCE_MS = 100;

/**
 * Create a file watcher for the planning directory
 *
 * @param planningDir - Path to .planning directory
 * @param onStateChange - Callback when state changes
 * @returns Chokidar FSWatcher instance
 */
export function createWatcher(
  planningDir: string,
  onStateChange: (state: DashboardState) => void
): FSWatcher {
  // Internal state for tracking
  let debounceTimer: NodeJS.Timeout | null = null;
  let pendingUpdate = false;

  /**
   * Debounced state rebuild and broadcast
   */
  function scheduleUpdate(): void {
    pendingUpdate = true;

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      if (pendingUpdate) {
        const state = buildDashboardState(planningDir);
        onStateChange(state);
        pendingUpdate = false;
      }
      debounceTimer = null;
    }, DEBOUNCE_MS);
  }

  /**
   * Check if file should be processed
   */
  function isRelevantFile(filePath: string): boolean {
    const fileName = basename(filePath);
    return (
      fileName.endsWith('-PLAN.md') ||
      fileName.endsWith('-SUMMARY.md') ||
      fileName === 'STATE.md' ||
      fileName === 'ROADMAP.md'
    );
  }

  /**
   * Handle file add event
   */
  function handleAdd(filePath: string): void {
    if (!isRelevantFile(filePath)) return;

    console.log(`[watcher] File added: ${filePath}`);
    scheduleUpdate();
  }

  /**
   * Handle file change event
   */
  function handleChange(filePath: string): void {
    if (!isRelevantFile(filePath)) return;

    console.log(`[watcher] File changed: ${filePath}`);
    scheduleUpdate();
  }

  /**
   * Handle file unlink (delete) event
   */
  function handleUnlink(filePath: string): void {
    if (!isRelevantFile(filePath)) return;

    console.log(`[watcher] File removed: ${filePath}`);
    scheduleUpdate();
  }

  /**
   * Handle watcher error
   */
  function handleError(error: unknown): void {
    console.error(`[watcher] Error:`, error);
  }

  /**
   * Handle ready event (initial scan complete)
   */
  function handleReady(): void {
    console.log(`[watcher] Initial scan complete for ${planningDir}`);
    // Send initial state
    const state = buildDashboardState(planningDir);
    onStateChange(state);
  }

  // Create watcher with polling for reliable cross-platform change detection
  const watcher = chokidar.watch(planningDir, {
    // Watch recursively to depth 5 (phases/XX-name/files)
    depth: 5,

    // Ignore dotfiles except the planning directory itself
    ignored: (path, stats) => {
      // Don't ignore the root planning directory
      if (path === planningDir) return false;

      // Ignore node_modules and other common directories
      if (
        path.includes('node_modules') ||
        path.includes('.git') ||
        path.includes('dist')
      ) {
        return true;
      }

      // Ignore hidden files (but not the planning dir which might be .planning)
      const fileName = basename(path);
      if (fileName.startsWith('.') && stats?.isFile()) {
        return true;
      }

      return false;
    },

    // Don't emit events for initial files (we'll build state in ready handler)
    ignoreInitial: false,

    // Use polling for reliable change detection on macOS
    // Native FSEvents can miss file modifications
    usePolling: true,
    interval: 500,

    // Persistent watching
    persistent: true,
  });

  // Attach event handlers
  watcher
    .on('add', handleAdd)
    .on('change', handleChange)
    .on('unlink', handleUnlink)
    .on('ready', handleReady)
    .on('error', handleError);

  return watcher;
}
