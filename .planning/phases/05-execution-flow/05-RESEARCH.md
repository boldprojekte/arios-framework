# Phase 5: Execution Flow - Research

**Researched:** 2026-01-25
**Domain:** Task execution orchestration, complexity detection, checkpoint systems, code quality enforcement
**Confidence:** HIGH

## Summary

Phase 5 implements ARIOS's execution engine: the system that adapts to project complexity, executes work in waves, pauses at testable checkpoints, and ensures generated code matches codebase patterns. This research covers complexity detection algorithms (topological sort, dependency graph analysis), wave-based parallel execution, checkpoint verification patterns (app runs + tests pass), debug subagent recovery flows, approach selection (ground-up/balanced/UI-first), and code quality enforcement.

The key insights from research:

1. **Complexity detection uses hybrid signals**: Plan count + task dependencies + estimated scope combine into a simple formula. Topological sort (DFS-based, O(V+E)) identifies dependency depth and parallelization potential. The critical path length determines wave count.

2. **Wave execution follows established patterns**: Execute independent tasks in parallel (Wave 1), wait for completion, verify integration, then proceed to Wave 2. This mirrors CI/CD gate patterns and task scheduler designs. The typescript-graph library provides ready-made DAG and topological sort.

3. **Checkpoint = app runs + tests pass**: This is the "testable" definition from CONTEXT.md. CI/CD patterns show this combination catches most integration issues. The debug subagent pattern (debug plan -> executor runs it) reuses existing infrastructure.

4. **Code quality enforcement uses existing tools**: ESLint + Prettier handle formatting/linting. Codebase pattern matching uses AST analysis (typescript-eslint, semgrep patterns) or simpler grep-based pattern extraction from existing code.

**Primary recommendation:** Build complexity detection as a pure function operating on plan frontmatter (wave counts, depends_on arrays). Implement wave execution as a state machine. Reuse the existing debug subagent pattern for checkpoint failures and integration conflicts.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| typescript-graph | ^2.x | DAG construction and topological sort | TypeScript-native, provides `topologicallySortedNodes()`, cycle detection built-in |
| gray-matter | ^4.0.3 | Parse PLAN.md frontmatter for wave/depends_on | Already in ARIOS stack from Phase 4 |
| conf | ^12.x | Store approach selection in project config | Already in ARIOS stack from Phase 4 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| topological-sort-group | ^1.x | Group tasks by execution wave | If typescript-graph grouping insufficient |
| eslint | ^9.x | Code quality enforcement | Already likely in user projects |
| prettier | ^3.x | Formatting consistency | Already likely in user projects |
| typescript-eslint | ^8.x | TypeScript-aware linting | For pattern enforcement in TS projects |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| typescript-graph | Hand-rolled topological sort | typescript-graph handles edge cases, cycle detection, and is well-tested |
| topological-sort-group | Manual wave assignment | Manual is fine for small graphs; library helps with complex dependencies |
| eslint for patterns | semgrep | semgrep more powerful but heavier; eslint already in most projects |

**Installation:**
```bash
npm install typescript-graph
# gray-matter and conf already installed from Phase 4
```

## Architecture Patterns

### Recommended Project Structure

```
packages/arios-cli/src/
├── execution/
│   ├── complexity.ts       # Complexity detection logic
│   ├── wave-scheduler.ts   # Wave assignment and execution order
│   ├── checkpoint.ts       # Checkpoint verification (run + test)
│   └── recovery.ts         # Debug subagent invocation
├── quality/
│   ├── pattern-extractor.ts # Extract patterns from existing code
│   └── enforcement.ts       # Code quality validation
└── config/
    └── approach.ts          # Approach selection (ground-up/balanced/UI-first)
```

### Pattern 1: Complexity Detection Algorithm

**What:** Hybrid signal analysis combining plan count, dependency depth, and scope estimates.

**When to use:** At execution start to determine wave strategy.

**Example:**
```typescript
// Source: CONTEXT.md decisions + dependency graph research
import { DirectedAcyclicGraph } from 'typescript-graph';
import matter from 'gray-matter';

interface PlanMeta {
  id: string;
  wave: number;
  dependsOn: string[];
  filesModified: string[];
  estimatedTasks: number;
}

interface ComplexityResult {
  level: 'simple' | 'moderate' | 'complex';
  waves: number;
  planCount: number;
  criticalPathLength: number;
  message: string;
}

function detectComplexity(plans: PlanMeta[]): ComplexityResult {
  // Build dependency graph
  const dag = new DirectedAcyclicGraph<string>((id) => id);

  for (const plan of plans) {
    dag.insert(plan.id);
    for (const dep of plan.dependsOn) {
      dag.insert(dep);
      dag.addEdge(dep, plan.id);
    }
  }

  // Get topological order and critical path
  const sorted = dag.topologicallySortedNodes();
  const maxWave = Math.max(...plans.map(p => p.wave));
  const planCount = plans.length;

  // Hybrid signals: plan count + wave depth + avg dependencies
  const avgDeps = plans.reduce((sum, p) => sum + p.dependsOn.length, 0) / planCount;

  // Thresholds (Claude's discretion per CONTEXT.md)
  // Simple: 1-2 plans, 1 wave, minimal dependencies
  // Moderate: 3-5 plans, 2 waves, some dependencies
  // Complex: 6+ plans, 3+ waves, significant dependencies

  if (planCount <= 2 && maxWave === 1) {
    return {
      level: 'simple',
      waves: 1,
      planCount,
      criticalPathLength: 1,
      message: `Detected: simple (${planCount} plan${planCount > 1 ? 's' : ''}, 1 wave)`
    };
  }

  if (planCount <= 5 && maxWave <= 2 && avgDeps < 2) {
    return {
      level: 'moderate',
      waves: maxWave,
      planCount,
      criticalPathLength: maxWave,
      message: `Detected: moderate (${planCount} plans, ${maxWave} waves)`
    };
  }

  return {
    level: 'complex',
    waves: maxWave,
    planCount,
    criticalPathLength: maxWave,
    message: `Detected: complex (${planCount} plans, ${maxWave} waves)`
  };
}
```

### Pattern 2: Wave-Based Execution State Machine

**What:** Execute plans by wave, with verification gates between waves.

**When to use:** For all phase execution, adapting to detected complexity.

**Example:**
```typescript
// Source: CI/CD checkpoint patterns + CONTEXT.md wave execution decisions
type WaveStatus = 'pending' | 'running' | 'verifying' | 'complete' | 'failed';

interface WaveState {
  wave: number;
  plans: string[];
  status: WaveStatus;
  results: Map<string, 'success' | 'failed'>;
}

interface ExecutionState {
  complexity: ComplexityResult;
  waves: WaveState[];
  currentWave: number;
  overallStatus: 'running' | 'paused' | 'complete' | 'failed';
}

async function executePhase(plans: PlanMeta[]): Promise<ExecutionState> {
  const complexity = detectComplexity(plans);

  // Group plans by wave
  const waveGroups = new Map<number, string[]>();
  for (const plan of plans) {
    const wave = plan.wave;
    if (!waveGroups.has(wave)) {
      waveGroups.set(wave, []);
    }
    waveGroups.get(wave)!.push(plan.id);
  }

  const state: ExecutionState = {
    complexity,
    waves: Array.from(waveGroups.entries())
      .sort(([a], [b]) => a - b)
      .map(([wave, planIds]) => ({
        wave,
        plans: planIds,
        status: 'pending',
        results: new Map()
      })),
    currentWave: 1,
    overallStatus: 'running'
  };

  // Execute wave by wave
  for (const waveState of state.waves) {
    waveState.status = 'running';

    // Execute plans in parallel within wave
    // (actual spawning done by orchestrator)
    const results = await executeWavePlans(waveState.plans);

    // Verify integration after parallel work
    waveState.status = 'verifying';
    const integrationOk = await verifyIntegration(results);

    if (!integrationOk) {
      // Debug subagent pattern: write debug plan, executor runs it
      const fixed = await attemptAutoFix(results);
      if (!fixed) {
        waveState.status = 'failed';
        state.overallStatus = 'failed';
        return state;
      }
    }

    waveState.status = 'complete';
    state.currentWave++;
  }

  state.overallStatus = 'complete';
  return state;
}
```

### Pattern 3: Testable Checkpoint Verification

**What:** Checkpoint = app runs + tests pass (per CONTEXT.md).

**When to use:** At checkpoints and wave boundaries.

**Example:**
```typescript
// Source: CONTEXT.md checkpoint decisions + CI/CD patterns
interface CheckpointResult {
  appRuns: boolean;
  testsPass: boolean;
  passed: boolean;
  details: {
    appOutput?: string;
    testOutput?: string;
    errors?: string[];
  };
}

async function verifyCheckpoint(
  projectDir: string,
  config: { startCmd?: string; testCmd?: string }
): Promise<CheckpointResult> {
  const result: CheckpointResult = {
    appRuns: false,
    testsPass: false,
    passed: false,
    details: {}
  };

  // 1. Check app runs (if applicable)
  if (config.startCmd) {
    try {
      // Start app, wait for ready signal, then stop
      const appCheck = await checkAppStarts(projectDir, config.startCmd);
      result.appRuns = appCheck.success;
      result.details.appOutput = appCheck.output;
    } catch (err) {
      result.appRuns = false;
      result.details.errors = [String(err)];
    }
  } else {
    // No app to run (library project, etc.)
    result.appRuns = true;
  }

  // 2. Check tests pass
  if (config.testCmd) {
    try {
      const testCheck = await runTests(projectDir, config.testCmd);
      result.testsPass = testCheck.exitCode === 0;
      result.details.testOutput = testCheck.output;
    } catch (err) {
      result.testsPass = false;
      result.details.errors = [...(result.details.errors || []), String(err)];
    }
  } else {
    // No tests configured
    result.testsPass = true;
  }

  // Per CONTEXT.md: testable = app runs + tests pass
  result.passed = result.appRuns && result.testsPass;
  return result;
}
```

### Pattern 4: Debug Subagent Recovery Flow

**What:** On checkpoint failure, spawn debug subagent that writes debug plan, executor runs it.

**When to use:** Checkpoint failures, integration conflicts.

**Example:**
```typescript
// Source: CONTEXT.md decisions - same pattern for checkpoints AND integration conflicts
interface RecoveryAttempt {
  attempt: number;
  diagnosis: string;
  debugPlanPath: string;
  result: 'fixed' | 'failed';
}

interface RecoveryResult {
  fixed: boolean;
  attempts: RecoveryAttempt[];
  finalDiagnostic?: string;
}

async function attemptRecovery(
  failure: CheckpointResult | IntegrationConflict,
  maxAttempts: number = 3  // Per CONTEXT.md: 2-3 attempts
): Promise<RecoveryResult> {
  const result: RecoveryResult = {
    fixed: false,
    attempts: []
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // 1. Spawn debug subagent to diagnose and write debug plan
    const diagnosis = await spawnDebugSubagent(failure);

    // 2. Executor runs the debug plan
    const executionResult = await executeDebugPlan(diagnosis.planPath);

    result.attempts.push({
      attempt,
      diagnosis: diagnosis.summary,
      debugPlanPath: diagnosis.planPath,
      result: executionResult.success ? 'fixed' : 'failed'
    });

    if (executionResult.success) {
      // Re-verify checkpoint
      const recheck = await verifyCheckpoint(/* ... */);
      if (recheck.passed) {
        result.fixed = true;
        return result;
      }
    }
  }

  // Retries exhausted: stop with diagnostic output (per CONTEXT.md)
  result.finalDiagnostic = generateDiagnosticReport(result.attempts);
  return result;
}
```

### Pattern 5: Approach Selection and Storage

**What:** User chooses ground-up, balanced, or UI-first at project start.

**When to use:** Project initialization, stored in config.

**Example:**
```typescript
// Source: CONTEXT.md approach selection decisions
import Conf from 'conf';

type Approach = 'ground-up' | 'balanced' | 'ui-first';

interface ProjectConfig {
  approach: Approach;
  approachSetAt: string;
}

const projectConfig = new Conf<ProjectConfig>({
  projectName: 'arios',
  cwd: process.cwd(),  // Project-local, not global
  defaults: {
    approach: 'balanced',  // Default per CONTEXT.md
    approachSetAt: ''
  }
});

function setApproach(approach: Approach): void {
  projectConfig.set('approach', approach);
  projectConfig.set('approachSetAt', new Date().toISOString());
}

function getApproach(): Approach {
  return projectConfig.get('approach');
}

// Approach interpretation per CONTEXT.md:
// - balanced: interleave UI and logic as needed (default)
// - ground-up: Claude interprets per project domain (data layer first, etc.)
// - ui-first: mockup with stubs first, then wire real logic

function getApproachGuidance(approach: Approach, projectType: string): string {
  switch (approach) {
    case 'balanced':
      return 'Interleave UI and logic as each feature requires';

    case 'ground-up':
      // Claude's discretion per project type
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
```

### Anti-Patterns to Avoid

- **Overcomplicating complexity detection:** Simple thresholds work. Don't build ML models for plan count analysis.
- **Sequential when parallel possible:** If plans have no dependency, run them in parallel (Wave 1).
- **Auto-fixing without limit:** Per CONTEXT.md, 2-3 retry attempts then hard stop. Infinite loops waste time.
- **Ignoring existing codebase patterns:** Generated code must match project conventions, not generic patterns.
- **Storing approach globally:** Approach is project-specific, stored in project config, not user preferences.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Topological sort | Custom graph traversal | typescript-graph | Handles cycles, edge cases, well-tested |
| Wave grouping | Manual wave assignment | Pre-computed in PLAN.md frontmatter | Planner already assigns waves |
| Code formatting | Regex-based formatters | Prettier | Handles all edge cases, configurable |
| Code linting | Custom AST rules | ESLint + typescript-eslint | Ecosystem of existing rules |
| Pattern extraction | Manual code analysis | Grep existing code + reference in prompts | Simple, effective, no library needed |

**Key insight:** The execution engine orchestrates existing infrastructure (subagents, file persistence, verification commands). Don't rebuild what already exists.

## Common Pitfalls

### Pitfall 1: Complexity Detection False Positives

**What goes wrong:** Simple project detected as complex, leading to unnecessary wave splitting.

**Why it happens:** Only counting plans without considering actual work scope.

**How to avoid:** Use hybrid signals (plan count + dependency depth + task count). Simple phase with 3 independent setup plans is still simple.

**Warning signs:** User sees "Detected: complex (3 waves)" for basic CRUD app.

### Pitfall 2: Checkpoint Timeout Issues

**What goes wrong:** App takes too long to start, checkpoint verification times out.

**Why it happens:** No timeout handling for app startup verification.

**How to avoid:** Configurable timeouts, graceful handling of slow starts, clear error messages.

**Warning signs:** Checkpoint fails with "timeout" even when app eventually works.

### Pitfall 3: Infinite Debug Loop

**What goes wrong:** Debug subagent keeps trying to fix unfixable issue.

**Why it happens:** No retry limit or same fix attempted repeatedly.

**How to avoid:** Per CONTEXT.md: 2-3 retry limit, then hard stop with diagnostic output.

**Warning signs:** Execution stuck in "fixing" state for extended time.

### Pitfall 4: Wave Synchronization Failures

**What goes wrong:** Wave 2 starts before Wave 1 fully completes, causing missing dependencies.

**Why it happens:** Parallel execution without proper completion tracking.

**How to avoid:** Clear wave boundaries, all plans in wave must complete before next wave starts.

**Warning signs:** "File not found" or "undefined" errors at wave boundaries.

### Pitfall 5: Approach Selection Drift

**What goes wrong:** Approach changes mid-project, causing inconsistent architecture.

**Why it happens:** Re-offering approach selection when not needed.

**How to avoid:** Per CONTEXT.md: offered at project start only, user can change only by explicit request.

**Warning signs:** Half the codebase is ground-up, half is UI-first.

### Pitfall 6: Generated Code Style Mismatch

**What goes wrong:** AI generates code with different style than existing codebase.

**Why it happens:** No pattern extraction or style guidance in prompts.

**How to avoid:** Extract patterns from existing code, include in executor context, enforce via linting.

**Warning signs:** PR review feedback about inconsistent naming, formatting, patterns.

## Code Examples

### Complete Complexity Detection Module

```typescript
// Source: typescript-graph docs + research synthesis
import { DirectedAcyclicGraph } from 'typescript-graph';
import matter from 'gray-matter';
import fs from 'fs-extra';
import path from 'path';

interface PlanFrontmatter {
  phase: string;
  plan: number;
  wave: number;
  depends_on: string[];
  files_modified: string[];
  autonomous: boolean;
}

export async function loadPlanMeta(phaseDir: string): Promise<PlanFrontmatter[]> {
  const plans: PlanFrontmatter[] = [];
  const files = await fs.readdir(phaseDir);

  for (const file of files) {
    if (file.endsWith('-PLAN.md')) {
      const content = await fs.readFile(path.join(phaseDir, file), 'utf-8');
      const { data } = matter(content);
      plans.push(data as PlanFrontmatter);
    }
  }

  return plans.sort((a, b) => a.plan - b.plan);
}

export function detectComplexity(plans: PlanFrontmatter[]): {
  level: 'simple' | 'moderate' | 'complex';
  waves: number;
  message: string;
} {
  if (plans.length === 0) {
    return { level: 'simple', waves: 0, message: 'No plans to execute' };
  }

  const maxWave = Math.max(...plans.map(p => p.wave));
  const planCount = plans.length;
  const avgDeps = plans.reduce((s, p) => s + p.depends_on.length, 0) / planCount;

  // Simple: few plans, single wave
  if (planCount <= 2 && maxWave === 1) {
    return {
      level: 'simple',
      waves: 1,
      message: `Detected: simple (${planCount} plan${planCount > 1 ? 's' : ''})`
    };
  }

  // Complex: many plans, deep waves, high dependencies
  if (planCount >= 6 || maxWave >= 3 || avgDeps >= 2) {
    return {
      level: 'complex',
      waves: maxWave,
      message: `Detected: complex (${planCount} plans, ${maxWave} waves)`
    };
  }

  // Moderate: everything else
  return {
    level: 'moderate',
    waves: maxWave,
    message: `Detected: moderate (${planCount} plans, ${maxWave} waves)`
  };
}
```

### Wave Execution Scheduler

```typescript
// Source: Task scheduler patterns + CONTEXT.md parallel execution decisions
export interface WaveSchedule {
  wave: number;
  plans: string[];
  canParallelize: boolean;
}

export function buildWaveSchedule(plans: PlanFrontmatter[]): WaveSchedule[] {
  // Group by wave (pre-computed by planner)
  const waveMap = new Map<number, string[]>();

  for (const plan of plans) {
    const key = plan.wave;
    if (!waveMap.has(key)) {
      waveMap.set(key, []);
    }
    waveMap.get(key)!.push(`${plan.phase}-${String(plan.plan).padStart(2, '0')}`);
  }

  // Convert to sorted array
  const schedule: WaveSchedule[] = [];
  for (const [wave, planIds] of Array.from(waveMap.entries()).sort((a, b) => a[0] - b[0])) {
    schedule.push({
      wave,
      plans: planIds,
      canParallelize: planIds.length > 1  // Per CONTEXT.md: maximize parallelism
    });
  }

  return schedule;
}

export function formatWaveMessage(schedule: WaveSchedule[]): string {
  const lines = schedule.map(w => {
    const parallel = w.canParallelize ? '(parallel)' : '';
    return `Wave ${w.wave}: ${w.plans.join(', ')} ${parallel}`;
  });
  return lines.join('\n');
}
```

### Checkpoint Verification Runner

```typescript
// Source: CI/CD checkpoint patterns + CONTEXT.md testable definition
import { execa } from 'execa';

export interface VerificationConfig {
  startCommand?: string;
  startReadyPattern?: RegExp;  // e.g., /ready on port/
  startTimeout?: number;       // ms
  testCommand?: string;
  testTimeout?: number;        // ms
}

export interface VerificationResult {
  appRuns: boolean;
  testsPass: boolean;
  passed: boolean;
  output: string;
  errors: string[];
}

export async function runVerification(
  cwd: string,
  config: VerificationConfig
): Promise<VerificationResult> {
  const result: VerificationResult = {
    appRuns: true,
    testsPass: true,
    passed: true,
    output: '',
    errors: []
  };

  // 1. Verify app starts (if configured)
  if (config.startCommand) {
    try {
      const [cmd, ...args] = config.startCommand.split(' ');
      const proc = execa(cmd, args, { cwd, timeout: config.startTimeout || 30000 });

      // Wait for ready signal or timeout
      // In practice, this would use a more sophisticated ready detection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          proc.kill();
          reject(new Error('App start timeout'));
        }, config.startTimeout || 30000);

        proc.stdout?.on('data', (data) => {
          const text = data.toString();
          if (config.startReadyPattern?.test(text)) {
            clearTimeout(timeout);
            proc.kill();
            resolve(true);
          }
        });

        proc.on('error', reject);
      });

      result.appRuns = true;
      result.output += 'App started successfully\n';
    } catch (err) {
      result.appRuns = false;
      result.errors.push(`App start failed: ${err}`);
    }
  }

  // 2. Run tests (if configured)
  if (config.testCommand && result.appRuns) {
    try {
      const [cmd, ...args] = config.testCommand.split(' ');
      const { stdout, stderr, exitCode } = await execa(cmd, args, {
        cwd,
        timeout: config.testTimeout || 120000,
        reject: false
      });

      result.testsPass = exitCode === 0;
      result.output += stdout;
      if (stderr) result.errors.push(stderr);
    } catch (err) {
      result.testsPass = false;
      result.errors.push(`Test run failed: ${err}`);
    }
  }

  result.passed = result.appRuns && result.testsPass;
  return result;
}
```

### Code Pattern Extraction

```typescript
// Source: Codebase pattern matching research
import fs from 'fs-extra';
import path from 'path';

interface CodebasePatterns {
  namingConventions: {
    files: string;       // e.g., "kebab-case", "camelCase"
    functions: string;   // e.g., "camelCase"
    components: string;  // e.g., "PascalCase"
  };
  importStyle: string;   // e.g., "named imports", "default imports"
  exportStyle: string;   // e.g., "named exports", "default exports"
  indentation: string;   // e.g., "2 spaces", "tabs"
  quotes: string;        // e.g., "single", "double"
  semicolons: boolean;
  examples: {
    component?: string;
    function?: string;
    api?: string;
  };
}

export async function extractPatterns(srcDir: string): Promise<CodebasePatterns> {
  const patterns: CodebasePatterns = {
    namingConventions: { files: 'unknown', functions: 'unknown', components: 'unknown' },
    importStyle: 'unknown',
    exportStyle: 'unknown',
    indentation: 'unknown',
    quotes: 'unknown',
    semicolons: true,
    examples: {}
  };

  // Find sample files
  const tsFiles = await findFiles(srcDir, '**/*.{ts,tsx}');
  if (tsFiles.length === 0) return patterns;

  // Analyze first few files for patterns
  const samples = tsFiles.slice(0, 5);

  for (const file of samples) {
    const content = await fs.readFile(file, 'utf-8');

    // Detect indentation
    const indentMatch = content.match(/^( +|\t)/m);
    if (indentMatch) {
      patterns.indentation = indentMatch[0] === '\t' ? 'tabs' : `${indentMatch[0].length} spaces`;
    }

    // Detect quotes
    const singleQuotes = (content.match(/'/g) || []).length;
    const doubleQuotes = (content.match(/"/g) || []).length;
    patterns.quotes = singleQuotes > doubleQuotes ? 'single' : 'double';

    // Detect semicolons
    const lines = content.split('\n').filter(l => l.trim());
    const withSemi = lines.filter(l => l.trim().endsWith(';')).length;
    patterns.semicolons = withSemi > lines.length / 2;

    // Store example component or function
    if (file.endsWith('.tsx') && !patterns.examples.component) {
      const componentMatch = content.match(/export (?:default )?function \w+\([^)]*\)[^{]*\{[\s\S]{0,500}/);
      if (componentMatch) {
        patterns.examples.component = componentMatch[0].slice(0, 300) + '...';
      }
    }
  }

  return patterns;
}

async function findFiles(dir: string, pattern: string): Promise<string[]> {
  // Simplified - in practice use glob
  const results: string[] = [];
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
      results.push(...await findFiles(fullPath, pattern));
    } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.tsx'))) {
      results.push(fullPath);
    }
  }

  return results;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sequential task execution | Wave-based parallel execution | 2024+ | 2-3x faster for complex phases |
| Manual complexity assessment | Automated detection from dependency graph | 2025+ | Consistent, reproducible decisions |
| Retry forever on failure | Bounded retries (2-3) with diagnostic output | Best practice | Prevents infinite loops, surfaces real issues |
| Generic code generation | Codebase-aware pattern matching | 2024+ | Generated code matches existing style |
| regex-based code formatting | AST-based tools (Prettier, ESLint) | 2020+ | Handles all edge cases correctly |

**Deprecated/outdated:**
- Manual wave assignment during execution: Pre-compute in planner, execute from frontmatter
- Global approach configuration: Project-local, persists across sessions
- Unlimited retry attempts: Bounded retries are the standard

## Open Questions

### 1. Optimal Retry Count

**What we know:** CONTEXT.md says "2-3 attempts" - this is a reasonable range.

**What's unclear:** Whether 2 or 3 is better default.

**Recommendation:** Start with 3, make configurable. 3 allows for: initial fix attempt, adjustment, final try.

### 2. Integration Verification Depth

**What we know:** After parallel work, verify integration (tests, type-check, then subagent review if needed).

**What's unclear:** How much automated checking before invoking subagent review.

**Recommendation:** Start with automated only (tests + type-check). Add subagent review only if automated checks pass but integration issues remain suspected.

### 3. Pattern Extraction Granularity

**What we know:** Need to match existing codebase patterns.

**What's unclear:** How much pattern detail to extract and pass to executor.

**Recommendation:** Start simple: indentation, quotes, semicolons, one example of each file type. Expand if quality issues arise.

## Sources

### Primary (HIGH confidence)

- [typescript-graph npm](https://www.npmjs.com/package/typescript-graph) - DAG and topological sort API
- [CONTEXT.md](../05-execution-flow/05-CONTEXT.md) - User decisions on complexity, checkpoints, approach, waves
- [GSD Executor](~/.claude/agents/gsd-executor.md) - Reference implementation of checkpoint and deviation handling
- [GSD Planner](~/.claude/agents/gsd-planner.md) - Reference implementation of wave assignment

### Secondary (MEDIUM confidence)

- [ESLint Flat Config Guide](https://advancedfrontends.com/eslint-flat-config-typescript-javascript/) - Modern linting configuration
- [typescript-eslint Shared Configs](https://typescript-eslint.io/users/configs/) - Stylistic rule enforcement
- [Azure Retry Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry) - Retry with backoff best practices
- [CI/CD Security Checklist](https://www.sentinelone.com/cybersecurity-101/cloud-security/ci-cd-security-checklist/) - Checkpoint verification patterns

### Tertiary (LOW confidence)

- WebSearch results on AI code generation pattern matching - General approaches, verify with specific implementations
- Medium articles on topological sort - Conceptual understanding, verify with library docs

## Metadata

**Confidence breakdown:**
- Complexity detection: HIGH - Based on established graph algorithms and clear CONTEXT.md decisions
- Wave execution: HIGH - Mirrors existing GSD patterns and CI/CD practices
- Checkpoint verification: HIGH - CONTEXT.md provides clear "app runs + tests pass" definition
- Code quality enforcement: MEDIUM - Standard tools (ESLint/Prettier) are clear, pattern extraction approach less validated
- Debug recovery: HIGH - Reuses existing subagent pattern from CONTEXT.md

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable domain, established patterns)
