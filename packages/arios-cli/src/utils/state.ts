/**
 * State utilities for project state persistence.
 *
 * Provides functions to load, save, and manage project state stored in
 * .planning/STATE.md with YAML frontmatter. Used by orchestrator workflows
 * (execute-phase, verify-phase) for session continuity.
 */

import matter from 'gray-matter';
import { createHash } from 'node:crypto';
import * as path from 'node:path';
import fs from 'fs-extra';
import type {
  DecisionRecord,
  DriftResult,
  PhaseStatus,
  ProjectState,
  StateConflict,
  StateFrontmatter
} from '../types/state.js';

/**
 * Calculate checksum of meaningful state fields.
 *
 * Hashes only fields that represent actual state (phase, planIndex, status).
 * Excludes checksum and lastActivity (metadata, not state).
 *
 * @param frontmatter - State frontmatter to hash
 * @returns First 8 characters of MD5 hash
 */
export function calculateChecksum(frontmatter: Omit<StateFrontmatter, 'checksum'>): string {
  // Hash only meaningful fields, not metadata
  const meaningful = {
    phase: frontmatter.phase,
    planIndex: frontmatter.planIndex,
    totalPhases: frontmatter.totalPhases,
    totalPlans: frontmatter.totalPlans,
    status: frontmatter.status
  };

  return createHash('md5')
    .update(JSON.stringify(meaningful))
    .digest('hex')
    .slice(0, 8);
}

/**
 * Load project state from STATE.md file.
 *
 * Reads file with gray-matter, parses frontmatter, and performs
 * conflict detection by comparing stored vs calculated checksum.
 *
 * @param statePath - Path to STATE.md file
 * @returns Object with state (or null if not found) and conflict info
 */
export async function loadProjectState(
  statePath: string
): Promise<{ state: ProjectState | null; conflict: StateConflict | null }> {
  try {
    const content = await fs.readFile(statePath, 'utf-8');
    const parsed = matter(content);

    // Parse frontmatter with defaults for missing fields
    const frontmatter: StateFrontmatter = {
      version: (parsed.data.version as string) ?? '1.0.0',
      phase: (parsed.data.phase as number) ?? 1,
      planIndex: (parsed.data.planIndex as number) ?? 0,
      totalPhases: (parsed.data.totalPhases as number) ?? 1,
      totalPlans: (parsed.data.totalPlans as number) ?? 1,
      status: (parsed.data.status as PhaseStatus) ?? 'not-started',
      lastActivity: (parsed.data.lastActivity as string) ?? '',
      checksum: (parsed.data.checksum as string) ?? ''
    };

    // Extract decisions from body (look for YAML list or markdown bullets)
    const decisions = extractDecisions(parsed.content);

    const state: ProjectState = {
      frontmatter,
      decisions,
      body: parsed.content.trim()
    };

    // Calculate current checksum for conflict detection
    const actualChecksum = calculateChecksum(frontmatter);
    const storedChecksum = frontmatter.checksum;

    // Check for conflict (only if stored checksum exists)
    if (storedChecksum && storedChecksum !== actualChecksum) {
      const conflict: StateConflict = {
        hasConflict: true,
        expectedChecksum: storedChecksum,
        actualChecksum,
        message: 'State file was modified outside ARIOS. Content has changed since last save.'
      };
      return { state, conflict };
    }

    return {
      state,
      conflict: {
        hasConflict: false,
        expectedChecksum: storedChecksum || actualChecksum,
        actualChecksum,
        message: ''
      }
    };
  } catch (err) {
    // File doesn't exist - not an error, just no state yet
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { state: null, conflict: null };
    }
    // Re-throw other errors
    throw err;
  }
}

/**
 * Save project state to STATE.md file atomically.
 *
 * Calculates new checksum, updates lastActivity, and writes using
 * atomic pattern (write to .tmp, then rename) to prevent corruption.
 *
 * @param statePath - Path to STATE.md file
 * @param state - Project state to save
 */
export async function saveProjectState(
  statePath: string,
  state: ProjectState
): Promise<void> {
  // Calculate new checksum (excluding the checksum field itself)
  const { checksum: _oldChecksum, ...frontmatterWithoutChecksum } = state.frontmatter;
  const newChecksum = calculateChecksum(frontmatterWithoutChecksum);

  // Update frontmatter with new checksum and current date
  const updatedFrontmatter: StateFrontmatter = {
    ...state.frontmatter,
    checksum: newChecksum,
    lastActivity: new Date().toISOString().split('T')[0]
  };

  // Format the state as markdown with YAML frontmatter
  const formattedBody = formatStateMarkdown(state);
  const content = matter.stringify(formattedBody, updatedFrontmatter);

  // Ensure parent directory exists
  await fs.ensureDir(path.dirname(statePath));

  // Atomic write: write to temp file, then rename
  const tempPath = `${statePath}.tmp`;
  await fs.writeFile(tempPath, content, 'utf-8');
  await fs.rename(tempPath, statePath);
}

/**
 * Detect if there's a conflict between stored and current state.
 *
 * Standalone function for quick conflict check without full state load.
 *
 * @param storedChecksum - Checksum stored in state file
 * @param frontmatter - Current frontmatter to compare
 * @returns Conflict detection result
 */
export function detectConflict(
  storedChecksum: string,
  frontmatter: Omit<StateFrontmatter, 'checksum'>
): StateConflict {
  const actualChecksum = calculateChecksum(frontmatter);
  const hasConflict = storedChecksum !== actualChecksum;

  return {
    hasConflict,
    expectedChecksum: storedChecksum,
    actualChecksum,
    message: hasConflict
      ? 'State file was modified outside ARIOS. Content has changed since last save.'
      : ''
  };
}

/**
 * Format project state as human-readable markdown.
 *
 * Creates readable body content with decisions list and status table.
 *
 * @param state - Project state to format
 * @returns Formatted markdown string
 */
export function formatStateMarkdown(state: ProjectState): string {
  const { frontmatter, decisions } = state;

  // Status table
  const statusTable = `
## Status

| Phase | Plan | Total Phases | Total Plans | Status |
|-------|------|--------------|-------------|--------|
| ${frontmatter.phase} | ${frontmatter.planIndex} | ${frontmatter.totalPhases} | ${frontmatter.totalPlans} | ${frontmatter.status} |
`.trim();

  // Decisions list
  let decisionsSection = '\n\n## Decisions\n\n';
  if (decisions.length === 0) {
    decisionsSection += 'No decisions recorded yet.';
  } else {
    for (const decision of decisions) {
      const prefix = decision.rejected ? '[REJECTED] ' : '';
      decisionsSection += `- **${prefix}${decision.id}** (${decision.phase}, ${decision.date}): ${decision.decision}\n`;
      if (decision.reasoning) {
        decisionsSection += `  - Reasoning: ${decision.reasoning}\n`;
      }
    }
  }

  return `${statusTable}${decisionsSection}`;
}

/**
 * Detect drift between state claims and file system reality.
 *
 * Checks for:
 * 1. Checksum mismatch (state file modified) - auto-fixable
 * 2. State claims completion but SUMMARY.md missing - not auto-fixable
 * 3. State references PLAN.md that doesn't exist - not auto-fixable
 *
 * @param statePath - Path to STATE.md file
 * @param planningDir - Path to .planning directory
 * @returns DriftResult describing what drifted and whether it can be auto-fixed
 */
export async function detectDrift(
  statePath: string,
  planningDir: string
): Promise<DriftResult> {
  const details: string[] = [];

  // Load state
  const { state, conflict } = await loadProjectState(statePath);

  if (!state) {
    // No state file - not really drift, just uninitialized
    return {
      drifted: false,
      type: 'none',
      details: [],
      autoFixable: false
    };
  }

  // Check 1: Checksum mismatch (file changed outside ARIOS)
  if (conflict?.hasConflict) {
    return {
      drifted: true,
      type: 'file_changes',
      details: ['State checksum mismatch - file was modified outside ARIOS'],
      autoFixable: true
    };
  }

  const { phase, planIndex, status, phaseName } = state.frontmatter as StateFrontmatter & { phaseName?: string };

  // Pad phase and plan numbers to 2 digits for file matching
  const paddedPhase = String(phase).padStart(2, '0');
  const paddedPlan = String(planIndex).padStart(2, '0');

  // Find the phase directory (pattern: XX-name or feature-name)
  const phasesDir = path.join(planningDir, 'phases');

  // Check 2: If state claims complete or in-progress, verify SUMMARY.md exists for current plan
  if (status === 'complete' || status === 'in-progress') {
    // Find phase directory
    const phaseDir = await findPhaseDir(phasesDir, phase, phaseName);

    if (phaseDir) {
      // Check if SUMMARY.md exists for the current plan (if status is complete for that plan)
      // For 'complete' status at phase level, check if the last plan has SUMMARY
      if (status === 'complete') {
        const summaryPattern = `${paddedPhase}-${paddedPlan}-SUMMARY.md`;
        const summaryPath = path.join(phaseDir, summaryPattern);

        if (!fs.existsSync(summaryPath)) {
          // Try to find any summary matching the plan
          const files = await fs.readdir(phaseDir);
          const hasSummary = files.some(f =>
            f.includes('-SUMMARY.md') && f.startsWith(`${paddedPhase}-${paddedPlan}`)
          );

          if (!hasSummary) {
            details.push(
              `State claims plan ${paddedPhase}-${paddedPlan} complete but SUMMARY.md not found`
            );
          }
        }
      }
    }
  }

  // Check 3: Verify current PLAN.md exists
  const phaseDir = await findPhaseDir(phasesDir, phase, phaseName);

  if (phaseDir) {
    // Look for PLAN.md matching current phase/plan
    const files = await fs.readdir(phaseDir);
    const hasPlan = files.some(f =>
      f.includes('-PLAN.md') && f.startsWith(`${paddedPhase}-${paddedPlan}`)
    );

    if (!hasPlan && status !== 'phase_complete') {
      details.push(
        `State references plan ${paddedPhase}-${paddedPlan} but PLAN.md not found`
      );
    }
  } else if (status !== 'not-started') {
    details.push(`Phase directory for phase ${phase} not found`);
  }

  // Return results
  if (details.length > 0) {
    return {
      drifted: true,
      type: 'state_mismatch',
      details,
      autoFixable: false
    };
  }

  return {
    drifted: false,
    type: 'none',
    details: [],
    autoFixable: false
  };
}

/**
 * Find the phase directory matching the given phase number.
 *
 * @param phasesDir - Path to .planning/phases directory
 * @param phase - Phase number to find
 * @param phaseName - Optional phase name for matching
 * @returns Path to phase directory or null if not found
 */
async function findPhaseDir(
  phasesDir: string,
  phase: number,
  phaseName?: string
): Promise<string | null> {
  try {
    const dirs = await fs.readdir(phasesDir);
    const paddedPhase = String(phase).padStart(2, '0');

    // First try to match by phase number prefix (e.g., "12-state-dashboard-polish")
    const matchingDir = dirs.find(d => d.startsWith(`${paddedPhase}-`));

    if (matchingDir) {
      return path.join(phasesDir, matchingDir);
    }

    // Try feature-mode pattern if phaseName is provided
    if (phaseName && phaseName.startsWith('feature-')) {
      const featureDir = dirs.find(d => d === phaseName);
      if (featureDir) {
        return path.join(phasesDir, featureDir);
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract decisions from markdown body.
 *
 * Parses bullet points in Decisions section to reconstruct decision records.
 * This is a best-effort extraction for backwards compatibility.
 *
 * @param body - Markdown body content
 * @returns Array of decision records
 */
function extractDecisions(body: string): DecisionRecord[] {
  const decisions: DecisionRecord[] = [];

  // Look for Decisions section
  const decisionsMatch = body.match(/## Decisions\s*\n([\s\S]*?)(?=\n## |$)/);
  if (!decisionsMatch) {
    return decisions;
  }

  const decisionsText = decisionsMatch[1];

  // Parse bullet points: - **[REJECTED] ID** (phase, date): decision
  const bulletPattern = /- \*\*(\[REJECTED\] )?(.+?)\*\* \(([^,]+), ([^)]+)\): (.+)/g;
  let match;

  while ((match = bulletPattern.exec(decisionsText)) !== null) {
    const [, rejectedMarker, id, phase, date, decision] = match;
    decisions.push({
      id,
      decision,
      reasoning: '', // Reasoning may be on next line, simplified extraction
      phase,
      date,
      rejected: !!rejectedMarker
    });
  }

  return decisions;
}
