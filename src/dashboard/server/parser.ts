/**
 * Parser module for .planning directory files
 *
 * Extracts tasks, phases, and state from markdown files with YAML frontmatter
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, basename, dirname, relative } from 'node:path';
import matter from 'gray-matter';
import type { Task, Phase, DashboardState, TaskStatus } from '../types/dashboard.js';

/** Result types for file parsing */
export type ParsedPlanFile = Task;
export type ParsedSummaryFile = { duration?: string; completedAt?: string; summary?: string };
export type ParsedStateFile = { currentPhase: number; currentPlan: number };
export type ParsedRoadmapFile = { phases: Phase[]; roadmap: string };
export type ParsedFile = ParsedPlanFile | ParsedSummaryFile | ParsedStateFile | ParsedRoadmapFile | null;

type RuntimePlanningConfig = {
  mode?: 'feature' | 'project' | null;
  feature_name?: string | null;
  active_feature?: string | null;
};

type ParsePlanOptions = {
  stateFilePath?: string;
  featurePhaseMap?: Map<string, number>;
};

function toPosixPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Parse a single file and return typed data
 */
export function parseFile(
  filePath: string,
  planningDir: string
): ParsedFile {
  const fileName = basename(filePath);

  // Detect file type and delegate to specific parser
  if (fileName.endsWith('-PLAN.md')) {
    return parsePlanFile(filePath, planningDir);
  } else if (fileName.endsWith('-SUMMARY.md')) {
    return parseSummaryFile(filePath);
  } else if (fileName === 'STATE.md') {
    return parseStateFile(filePath);
  } else if (fileName === 'ROADMAP.md') {
    return parseRoadmapFile(filePath);
  }

  return null;
}

/**
 * Parse PLAN.md files into Task objects
 * Supports both Project-Mode (phase/plan) and Feature-Mode (plan_id/title) formats
 */
export function parsePlanFile(
  filePath: string,
  planningDir: string,
  options: ParsePlanOptions = {}
): Task | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content: body } = matter(content);
    const normalizedFilePath = toPosixPath(filePath);

    // Detect mode from file path (more reliable than frontmatter fields)
    const isFeatureMode = normalizedFilePath.includes('/features/feature-');

    let phaseStr: string;
    let planNum: number;
    let taskName: string;

    if (isFeatureMode) {
      // Feature-Mode format: prefer plan_id/id from frontmatter, fallback to filename.
      const planId = (frontmatter.plan_id || frontmatter.id) as string | undefined;

      // Extract feature name from path: .planning/features/feature-{name}/01-PLAN.md
      const pathParts = normalizedFilePath.split('/');
      const featureFolder = pathParts.find(p => p.startsWith('feature-'));
      phaseStr = featureFolder || 'feature';

      if (planId) {
        planNum = parseInt(planId.split('-').pop() || planId, 10) || 1;
      } else {
        const featureFileMatch = basename(filePath).match(/^(\d+)-PLAN\.md$/);
        planNum = featureFileMatch ? parseInt(featureFileMatch[1], 10) : 1;
      }

      taskName = (frontmatter.title as string) || `Plan ${planNum}`;
    } else {
      // Project-Mode format: phase + plan (or extract from id/filename)
      const phase = frontmatter.phase as string | undefined;
      let plan = frontmatter.plan as number | undefined;

      // Fallback: extract plan number from id field (e.g., "01-02" → 2)
      if (plan === undefined && frontmatter.id) {
        const idStr = String(frontmatter.id);
        const idParts = idStr.split('-');
        if (idParts.length >= 2) {
          plan = parseInt(idParts[idParts.length - 1], 10);
        }
      }

      // Fallback: extract plan number from filename (e.g., "01-02-PLAN.md" → 2)
      if (plan === undefined) {
        const fileMatch = basename(filePath).match(/^\d+-(\d+)-PLAN\.md$/);
        if (fileMatch) {
          plan = parseInt(fileMatch[1], 10);
        }
      }

      if (!phase || plan === undefined) {
        return null;
      }

      phaseStr = phase;
      planNum = plan;

      // Extract task name from title frontmatter, <objective> section, or ## Objective heading
      taskName = (frontmatter.title as string) || '';
      if (!taskName) {
        const objectiveMatch = body.match(/<objective>\s*([^\n]+)/) || body.match(/## Objective\s*\n\s*([^\n]+)/);
        taskName = objectiveMatch ? objectiveMatch[1].trim() : `Plan ${planNum}`;
      }
    }

    // Parse phase number from string like "05-execution-flow" or just "05".
    // Feature-Mode uses synthetic phase numbering to avoid "00-*" IDs.
    let phaseNum = 0;
    if (isFeatureMode) {
      phaseNum = options.featurePhaseMap?.get(phaseStr) ?? 1;
    } else {
      const phaseMatch = phaseStr.match(/^(\d+)/);
      phaseNum = phaseMatch ? parseInt(phaseMatch[1], 10) : 0;
    }

    // Build task ID
    const id = `${String(phaseNum).padStart(2, '0')}-${String(planNum).padStart(2, '0')}`;

    const name = taskName;

    // Determine status by checking for SUMMARY.md
    const summaryPath = filePath.replace('-PLAN.md', '-SUMMARY.md');
    let status: TaskStatus = 'pending';

    if (existsSync(summaryPath)) {
      status = 'complete';
    } else {
      // Check if this is the current plan from STATE.md
      const stateFilePath = options.stateFilePath || join(planningDir, 'STATE.md');
      if (existsSync(stateFilePath)) {
        const stateData = parseStateFile(stateFilePath);
        if (
          stateData &&
          stateData.currentPhase === phaseNum &&
          stateData.currentPlan === planNum
        ) {
          status = 'in-progress';
        }
      }
    }

    // Get summary data if available
    let summary: string | undefined;
    let duration: string | undefined;
    let completedAt: string | undefined;

    if (status === 'complete' && existsSync(summaryPath)) {
      const summaryData = parseSummaryFile(summaryPath);
      if (summaryData) {
        duration = summaryData.duration;
        completedAt = summaryData.completedAt;
        summary = summaryData.summary;
      }
    }

    return {
      id,
      phase: phaseStr,
      plan: planNum,
      wave: (frontmatter.wave as number) || 1,
      dependsOn: (frontmatter.depends_on as string[]) || [],
      status,
      name,
      summary,
      duration,
      completedAt,
      filesModified: frontmatter.files_modified as string[] | undefined,
      planPath: filePath,
      notes: (frontmatter.notes as Array<{ timestamp: string; content: string }>) || [],
    };
  } catch (err) {
    console.error(`Error parsing plan file ${filePath}:`, err);
    return null;
  }
}

/**
 * Parse SUMMARY.md files for completion data
 */
export function parseSummaryFile(
  filePath: string
): { duration?: string; completedAt?: string; summary?: string } | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content: body } = matter(content);

    // Extract one-liner summary from body (first non-empty line after frontmatter heading)
    const lines = body.split('\n').filter((line) => line.trim());
    let summary: string | undefined;

    // Look for one-liner section or first substantive paragraph
    const oneLinerMatch = body.match(/## One-Liner\s*\n\s*([^\n]+)/i);
    if (oneLinerMatch) {
      summary = oneLinerMatch[1].trim();
    } else if (lines.length > 1) {
      // Skip heading, get first content line
      summary = lines.find(
        (line) => !line.startsWith('#') && line.trim().length > 0
      );
    }

    return {
      duration: frontmatter.duration as string | undefined,
      completedAt: frontmatter.completed as string | undefined,
      summary,
    };
  } catch (err) {
    console.error(`Error parsing summary file ${filePath}:`, err);
    return null;
  }
}

/**
 * Parse STATE.md for current position
 */
export function parseStateFile(
  filePath: string
): { currentPhase: number; currentPlan: number } | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const { data: frontmatter } = matter(content);

    const currentPhase = frontmatter.phase as number | undefined;
    const currentPlan = frontmatter.planIndex as number | undefined;

    if (currentPhase === undefined || currentPlan === undefined) {
      return null;
    }

    return {
      currentPhase,
      currentPlan,
    };
  } catch (err) {
    console.error(`Error parsing state file ${filePath}:`, err);
    return null;
  }
}

/**
 * Parse ROADMAP.md for phases and raw content
 */
export function parseRoadmapFile(
  filePath: string
): { phases: Phase[]; roadmap: string } | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const phases: Phase[] = [];

    // Parse phase list from markdown checkboxes
    // Pattern: - [x] **Phase 1: Foundation** - description
    // or: - [ ] **Phase 6: Task Visibility** - description
    const phaseRegex =
      /- \[([ x])\] \*\*Phase (\d+): ([^*]+)\*\*/g;
    let match;

    while ((match = phaseRegex.exec(content)) !== null) {
      const isComplete = match[1] === 'x';
      const phaseNum = parseInt(match[2], 10);
      const fullName = match[3].trim();

      // Generate slug name from full name
      const name = fullName.toLowerCase().replace(/\s+/g, '-');

      // Count plans for this phase from content
      // Pattern: - [x] 01-01-PLAN.md or - [ ] 06-01-PLAN.md
      const phaseSection = content.substring(
        content.indexOf(`Phase ${phaseNum}:`),
        content.indexOf(`Phase ${phaseNum + 1}:`) > -1
          ? content.indexOf(`Phase ${phaseNum + 1}:`)
          : content.length
      );

      const planMatches = phaseSection.match(/- \[([ x])\] \d+-\d+-PLAN\.md/g) || [];
      const plansComplete = planMatches.filter((p) => p.includes('[x]')).length;
      const plansTotal = planMatches.length;

      // Determine status
      let status: 'complete' | 'in-progress' | 'pending' = 'pending';
      if (isComplete) {
        status = 'complete';
      } else if (plansComplete > 0) {
        status = 'in-progress';
      }

      phases.push({
        id: phaseNum,
        name,
        fullName,
        status,
        plansTotal,
        plansComplete,
      });
    }

    return {
      phases,
      roadmap: content,
    };
  } catch (err) {
    console.error(`Error parsing roadmap file ${filePath}:`, err);
    return null;
  }
}

function loadRuntimeConfig(planningDir: string): RuntimePlanningConfig {
  const configPath = join(planningDir, 'config.json');
  if (!existsSync(configPath)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(configPath, 'utf-8')) as RuntimePlanningConfig;
  } catch {
    return {};
  }
}

function normalizeFeatureFolder(featureName: string): string {
  return featureName.startsWith('feature-') ? featureName : `feature-${featureName}`;
}

function detectMode(
  planningDir: string,
  config: RuntimePlanningConfig
): 'feature' | 'project' {
  if (config.mode === 'feature' || config.mode === 'project') {
    return config.mode;
  }

  const featuresDir = join(planningDir, 'features');
  const roadmapPath = join(planningDir, 'ROADMAP.md');
  return existsSync(featuresDir) && !existsSync(roadmapPath) ? 'feature' : 'project';
}

function getFeatureFolders(featuresDir: string): string[] {
  if (!existsSync(featuresDir)) {
    return [];
  }

  return readdirSync(featuresDir)
    .filter(f => f.startsWith('feature-') && statSync(join(featuresDir, f)).isDirectory())
    .sort();
}

function resolveActiveFeatureFolder(
  config: RuntimePlanningConfig,
  featureFolders: string[]
): string | null {
  const preferred = config.active_feature || config.feature_name;
  if (!preferred) {
    return featureFolders.length === 1 ? featureFolders[0] : null;
  }

  const normalized = normalizeFeatureFolder(preferred);
  return featureFolders.includes(normalized) ? normalized : null;
}

function resolveStateFilePath(
  planningDir: string,
  mode: 'feature' | 'project',
  activeFeatureFolder: string | null,
  featureFolders: string[]
): string {
  const rootStatePath = join(planningDir, 'STATE.md');

  if (mode === 'project') {
    return rootStatePath;
  }

  if (activeFeatureFolder) {
    const activeStatePath = join(planningDir, 'features', activeFeatureFolder, 'STATE.md');
    if (existsSync(activeStatePath)) {
      return activeStatePath;
    }
  }

  for (const folder of featureFolders) {
    const candidate = join(planningDir, 'features', folder, 'STATE.md');
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return rootStatePath;
}

function buildFeaturePhaseMap(
  featureFolders: string[],
  activeFeatureFolder: string | null
): Map<string, number> {
  const map = new Map<string, number>();
  let index = 1;

  if (activeFeatureFolder && featureFolders.includes(activeFeatureFolder)) {
    map.set(activeFeatureFolder, index);
    index += 1;
  }

  for (const folder of featureFolders) {
    if (!map.has(folder)) {
      map.set(folder, index);
      index += 1;
    }
  }

  return map;
}

/**
 * Recursively find all relevant files in planning directory
 */
function findPlanningFiles(dir: string, files: string[] = []): string[] {
  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Recurse into subdirectories (phases)
        findPlanningFiles(fullPath, files);
      } else if (stat.isFile()) {
        // Collect relevant files
        if (
          entry.endsWith('-PLAN.md') ||
          entry.endsWith('-SUMMARY.md') ||
          entry === 'STATE.md' ||
          entry === 'ROADMAP.md'
        ) {
          files.push(fullPath);
        }
      }
    }
  } catch (err) {
    console.error(`Error scanning directory ${dir}:`, err);
  }

  return files;
}

/**
 * Parse all files and return a map of tasks and phases
 */
export function parseAllFiles(
  planningDir: string
): Map<string, Task | Phase> {
  const result = new Map<string, Task | Phase>();
  const files = findPlanningFiles(planningDir);
  const config = loadRuntimeConfig(planningDir);
  const mode = detectMode(planningDir, config);
  const featuresDir = join(planningDir, 'features');
  const featureFolders = getFeatureFolders(featuresDir);
  const activeFeatureFolder = resolveActiveFeatureFolder(config, featureFolders);
  const featurePhaseMap = buildFeaturePhaseMap(featureFolders, activeFeatureFolder);
  const stateFilePath = resolveStateFilePath(
    planningDir,
    mode,
    activeFeatureFolder,
    featureFolders
  );

  for (const filePath of files) {
    const fileName = basename(filePath);
    const normalizedFilePath = toPosixPath(filePath);

    if (fileName.endsWith('-PLAN.md')) {
      if (
        mode === 'feature' &&
        activeFeatureFolder &&
        !normalizedFilePath.includes(`/features/${activeFeatureFolder}/`)
      ) {
        continue;
      }

      const task = parsePlanFile(filePath, planningDir, {
        stateFilePath,
        featurePhaseMap
      });
      if (task) {
        result.set(task.id, task);
      }
    }
  }

  // Parse roadmap for phases
  const roadmapPath = join(planningDir, 'ROADMAP.md');
  if (mode === 'project' && existsSync(roadmapPath)) {
    const roadmapData = parseRoadmapFile(roadmapPath);
    if (roadmapData) {
      for (const phase of roadmapData.phases) {
        result.set(`phase-${phase.id}`, phase);
      }
    }
  }

  return result;
}

/**
 * Build complete dashboard state from planning directory
 * Supports both Project-Mode and Feature-Mode structures
 */
export function buildDashboardState(planningDir: string): DashboardState {
  const tasks: Task[] = [];
  const phases: Phase[] = [];
  let currentPhase = 1;
  let currentPlan = 1;
  let roadmap = '';

  const runtimeConfig = loadRuntimeConfig(planningDir);
  const featuresDir = join(planningDir, 'features');
  const roadmapPath = join(planningDir, 'ROADMAP.md');
  const mode = detectMode(planningDir, runtimeConfig);
  const isFeatureMode = mode === 'feature';
  const featureFolders = getFeatureFolders(featuresDir);
  const activeFeatureFolder = resolveActiveFeatureFolder(runtimeConfig, featureFolders);
  const featurePhaseMap = buildFeaturePhaseMap(featureFolders, activeFeatureFolder);
  const stateFilePath = resolveStateFilePath(
    planningDir,
    mode,
    activeFeatureFolder,
    featureFolders
  );

  if (existsSync(stateFilePath)) {
    const stateData = parseStateFile(stateFilePath);
    if (stateData) {
      currentPhase = stateData.currentPhase;
      currentPlan = stateData.currentPlan;
    }
  }

  // Parse ROADMAP.md for phases (Project-Mode only)
  if (mode === 'project' && existsSync(roadmapPath)) {
    const roadmapData = parseRoadmapFile(roadmapPath);
    if (roadmapData) {
      phases.push(...roadmapData.phases);
      roadmap = roadmapData.roadmap;
    }
  }

  // Parse all PLAN.md files for tasks
  const files = findPlanningFiles(planningDir);
  for (const filePath of files) {
    const normalizedFilePath = toPosixPath(filePath);
    if (basename(filePath).endsWith('-PLAN.md')) {
      if (
        isFeatureMode &&
        activeFeatureFolder &&
        !normalizedFilePath.includes(`/features/${activeFeatureFolder}/`)
      ) {
        continue;
      }

      const task = parsePlanFile(filePath, planningDir, {
        stateFilePath,
        featurePhaseMap
      });
      if (task) {
        tasks.push(task);
      }
    }
  }

  // Feature-Mode: create synthetic phase from feature folders
  if (isFeatureMode && phases.length === 0 && tasks.length > 0) {
    for (const folder of featureFolders) {
      const featureName = folder.replace('feature-', '');
      const featureTasks = tasks.filter(t => t.phase.includes(folder));
      if (featureTasks.length === 0) {
        continue;
      }
      const completeTasks = featureTasks.filter(t => t.status === 'complete');
      const phaseId = featurePhaseMap.get(folder) || 1;

      phases.push({
        id: phaseId,
        name: featureName,
        fullName: featureName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        status: completeTasks.length === featureTasks.length && featureTasks.length > 0
          ? 'complete'
          : featureTasks.some(t => t.status === 'in-progress')
            ? 'in-progress'
            : 'pending',
        plansTotal: featureTasks.length,
        plansComplete: completeTasks.length,
      });
    }
  }

  // Sort tasks by phase and plan number
  tasks.sort((a, b) => {
    const phaseA = parseInt(a.id.split('-')[0], 10) || 0;
    const phaseB = parseInt(b.id.split('-')[0], 10) || 0;
    if (phaseA !== phaseB) return phaseA - phaseB;
    const planA = parseInt(a.id.split('-')[1], 10) || a.plan;
    const planB = parseInt(b.id.split('-')[1], 10) || b.plan;
    return planA - planB;
  });

  return {
    tasks,
    phases,
    currentPhase,
    currentPlan,
    roadmap,
    connectionStatus: 'connected',
  };
}
