# Phase 8: Parallel Execution - Research

**Researched:** 2026-01-25
**Domain:** Wave-based parallel execution, subagent orchestration, verification coordination, failure recovery
**Confidence:** HIGH

## Summary

Phase 8 implements ARIOS's wave-level parallel execution: multiple wave-executors running simultaneously when waves are marked parallel by the planner, each with fresh context windows, orchestrated by a central coordinator. This research covers Claude Code's Task tool for parallel spawning (up to 7-10 concurrent agents), wave executor architecture, orchestrator coordination patterns, failure handling with auto-retry, silent verification between waves, and the unified recovery agent pattern.

The key insights from research:

1. **Claude Code Task tool enables parallel execution**: Up to 7 agents run simultaneously (10 concurrent operations max). Task tool blocks until completion, no polling needed. Each subagent starts with a fresh context window (~200k tokens available). Multiple Task calls in a single message spawn in parallel.

2. **GSD provides proven patterns**: Wave-based execution with pre-computed wave numbers in PLAN.md frontmatter. Orchestrator stays lean (10-15% context), spawning subagents for all heavy work. File-based handoffs via SUMMARY.md survive context resets.

3. **Fresh executor contexts prevent degradation**: Each wave-executor spawns fresh with 100% available context. The orchestrator inlines plan content rather than using @-references (Task boundaries don't resolve @). This matches CONTEXT.md decision "no degradation from prior waves."

4. **Failure handling is well-defined**: Let sibling tasks finish (waves are independent by definition), auto-retry up to 3 times, single recovery agent handles both task failures AND verification issues. Orchestrator can override parallel marking if it detects problems.

**Primary recommendation:** Implement wave-level parallelism using Claude Code's Task tool with the GSD pattern: discover plans, group by wave number, spawn wave-executors in parallel (one per wave), collect results, run silent verification, proceed to next wave. The orchestrator coordinates but never executes. Recovery agent handles all failure types.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Claude Code Task tool | Built-in | Spawn parallel subagents | Native, blocks until complete, up to 7 parallel |
| gray-matter | 4.0.3 | Parse PLAN.md frontmatter for wave/parallel flags | Already in ARIOS (Phase 5) |
| chokidar | 5.0.0 | File watching for dashboard live updates | Already in arios-dashboard |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| p-limit | 6.x | Limit concurrent operations (safety cap) | If Task tool parallelism needs throttling |
| chalk | 5.x | CLI output formatting | Already in arios-cli |
| date-fns | 4.x | Timestamp formatting for execution tracking | Performance metrics |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Task tool | Background subagents | Background auto-denies permissions, Task is synchronous and reliable |
| gray-matter | front-matter | gray-matter already in stack, more featured |
| Single recovery agent | Separate debug + verification agents | CONTEXT.md decision: unified recovery is simpler |

**Installation:**
```bash
# No new dependencies needed - using existing Task tool and libraries
# Optional if throttling needed:
npm install p-limit
```

## Architecture Patterns

### Recommended Project Structure

```
packages/arios-cli/src/
├── execution/
│   ├── complexity.ts           # Already exists - complexity detection
│   ├── wave-scheduler.ts       # Already exists - wave grouping
│   ├── parallel-orchestrator.ts  # NEW - coordinates wave-executors
│   ├── wave-executor.ts          # NEW - executes plans in fresh context
│   ├── checkpoint.ts           # Already exists - verification
│   └── recovery.ts             # Already exists - needs recovery agent wiring
│
.arios/agents/
├── wave-executor.md            # NEW - agent prompt for wave execution
├── recovery-agent.md           # NEW - unified recovery for failures + verification
└── verifier.md                 # Already exists (Phase 9 - silent between waves)
```

### Pattern 1: Wave-Level Parallelism via Task Tool

**What:** Spawn multiple wave-executors in parallel using Task tool with inlined content.

**When to use:** When waves are marked as parallelizable in PLAN.md frontmatter.

**Key insight from GSD:** The `@` syntax does not work across Task() boundaries. Content must be inlined in the prompt.

**Example:**
```typescript
// Source: GSD execute-phase.md pattern
interface WaveExecutionConfig {
  waveNumber: number;
  plans: PlanMeta[];
  canParallel: boolean;
}

async function executeWavesParallel(waves: WaveExecutionConfig[]): Promise<WaveResult[]> {
  // Group parallel-capable waves
  const parallelWaves = waves.filter(w => w.canParallel && w.plans.length > 0);
  const sequentialWaves = waves.filter(w => !w.canParallel);

  // For parallel waves, spawn all wave-executors at once
  // Task tool blocks until all complete - no polling needed

  // Read content BEFORE spawning (@ doesn't work across Task boundaries)
  const planContents = new Map<string, string>();
  for (const wave of parallelWaves) {
    for (const plan of wave.plans) {
      planContents.set(plan.id, await readFile(plan.path, 'utf-8'));
    }
  }
  const stateContent = await readFile('.planning/STATE.md', 'utf-8');

  // Spawn parallel executors
  // In actual orchestrator, this would be Task tool calls:
  // Task(prompt="...", subagent_type="wave-executor", model="sonnet")

  return results;
}
```

### Pattern 2: Orchestrator Coordination (Thin Orchestrator)

**What:** Orchestrator discovers, groups, spawns, and collects - never executes.

**When to use:** All parallel execution coordination.

**Critical principle from GSD:** "The orchestrator's job is coordination, not execution."

**Example:**
```typescript
// Source: GSD execute-phase workflow + CONTEXT.md decisions
interface OrchestratorState {
  phase: string;
  waves: WaveState[];
  currentWave: number;
  dashboardUrl?: string;
}

async function orchestratePhase(phaseDir: string): Promise<PhaseResult> {
  // 1. Discover plans (read frontmatter only - stay lean)
  const plans = await discoverPlans(phaseDir);

  // 2. Group by wave (pre-computed by planner)
  const waves = buildWaveSchedule(plans);

  // 3. Check for parallel override (orchestrator safety)
  for (const wave of waves) {
    if (wave.canParallelize && detectDependencyConflict(wave)) {
      // Per CONTEXT.md: "fall back to sequential (safer)"
      wave.canParallelize = false;
      console.log(`Wave ${wave.wave}: overriding to sequential (conflict detected)`);
    }
  }

  // 4. Execute waves sequentially, plans within wave in parallel
  for (const wave of waves) {
    // Minimal announcement per CONTEXT.md
    console.log(`Starting wave ${wave.wave} (${wave.plans.length} tasks)`);

    const results = await executeWave(wave);

    // Let sibling tasks finish per CONTEXT.md
    // Collect all results before checking failures

    // Summary announcement
    const passed = results.filter(r => r.success).length;
    console.log(`Wave ${wave.wave} complete: ${passed}/${results.length} tasks passed`);

    // 5. Silent verification (Phase 9 - verifier runs but only reports issues)
    const verification = await runSilentVerification(wave);
    if (!verification.passed) {
      // Auto-fix via recovery agent
      const fixed = await attemptRecovery(verification.issues);
      if (!fixed) {
        // Block progression per CONTEXT.md
        return { status: 'blocked', wave: wave.wave, issues: verification.issues };
      }
    }
  }

  return { status: 'complete', waves: waves.length };
}
```

### Pattern 3: Fresh Executor Context with Inlined Content

**What:** Each wave-executor receives plan content inlined in prompt, ensuring fresh 200k context.

**When to use:** All wave-executor spawning.

**Why:** From GSD research - `@file` references don't resolve across Task boundaries.

**Example:**
```markdown
<!-- Wave-executor spawn prompt pattern -->
<objective>
Execute plan {plan_number} of phase {phase_number}-{phase_name}.

Commit each task atomically. Create SUMMARY.md. Update STATE.md.
</objective>

<context>
Plan:
{INLINED_PLAN_CONTENT}

Project state:
{INLINED_STATE_CONTENT}
</context>

<success_criteria>
- [ ] All tasks executed
- [ ] Each task committed individually
- [ ] SUMMARY.md created in plan directory
</success_criteria>
```

### Pattern 4: Parallel Wave Marking in PLAN.md

**What:** Planner marks waves as parallel-capable in frontmatter; orchestrator can override.

**When to use:** Plan creation (planner decides), execution (orchestrator checks).

**Per CONTEXT.md:** "Planner determines which waves can run in parallel (marks it in PLAN.md)"

**Example frontmatter:**
```yaml
---
phase: "08-parallel-execution"
plan: 1
wave: 1
parallel_wave: true  # Can run with other wave 1 plans
autonomous: true
depends_on: []
files_modified:
  - "src/execution/parallel-orchestrator.ts"
---
```

**Orchestrator override logic:**
```typescript
// Source: CONTEXT.md decision
function detectDependencyConflict(wave: WaveSchedule): boolean {
  // Check for file conflicts (multiple plans modifying same file)
  const allFiles = wave.plans.flatMap(p => p.filesModified);
  const uniqueFiles = new Set(allFiles);
  if (uniqueFiles.size < allFiles.length) {
    return true; // File conflict - run sequential
  }

  // Check for unresolved dependencies
  for (const plan of wave.plans) {
    for (const dep of plan.dependsOn) {
      // If dependency is in same wave and not marked parallel-safe
      if (wave.plans.some(p => p.id === dep)) {
        return true; // Intra-wave dependency - run sequential
      }
    }
  }

  return false;
}
```

### Pattern 5: Failure Handling with Auto-Retry

**What:** Let sibling tasks finish, auto-retry failed tasks up to 3 times, unified recovery agent.

**When to use:** Any task failure during wave execution.

**Per CONTEXT.md:**
- "If one task fails mid-wave: let sibling tasks finish"
- "Auto-retry failed tasks up to 3 times before asking user"
- "Single recovery agent handles both task failures AND verification issues"

**Example:**
```typescript
// Source: CONTEXT.md decisions + existing recovery.ts pattern
interface FailureContext {
  type: 'task_failure' | 'verification_failure';
  wave: number;
  planId: string;
  error: string;
  attempt: number;
}

async function handleWaveFailure(
  wave: WaveState,
  failures: FailureContext[]
): Promise<RecoveryResult> {
  const maxRetries = 3;

  for (const failure of failures) {
    // Auto-retry up to 3 times
    for (let attempt = failure.attempt + 1; attempt <= maxRetries; attempt++) {
      // Spawn unified recovery agent
      const recoveryResult = await spawnRecoveryAgent({
        type: failure.type,
        context: failure,
        attempt,
      });

      if (recoveryResult.fixed) {
        // Re-verify the fix
        const verification = await verifyFix(failure);
        if (verification.passed) {
          break; // Success
        }
      }
    }
  }

  // After 3 failed retries: prompt user
  const unresolvedFailures = failures.filter(f => f.attempt >= maxRetries);
  if (unresolvedFailures.length > 0) {
    // Per CONTEXT.md: "Task D failed 3x: [error]. Debug / Skip / Abort?"
    const response = await promptUser({
      message: `Task ${unresolvedFailures[0].planId} failed 3x: ${unresolvedFailures[0].error}`,
      options: ['Debug', 'Skip', 'Abort'],
      // Skip only available if no downstream dependencies
      skipAvailable: !hasDownstreamDependencies(unresolvedFailures[0].planId),
    });

    return { action: response.toLowerCase() as 'debug' | 'skip' | 'abort' };
  }

  return { action: 'continue' };
}
```

### Pattern 6: Silent Verification Between Waves

**What:** Verification runs after each wave but only reports if issues found.

**When to use:** Wave boundaries.

**Per CONTEXT.md:** "Verification runs between waves but is silent unless it finds issues"

**Example:**
```typescript
// Source: CONTEXT.md decisions + GSD verifier pattern
async function runSilentVerification(wave: WaveState): Promise<VerificationResult> {
  // Spawn verifier in background-like mode
  const result = await spawnVerifier({
    wave: wave.wave,
    plans: wave.plans,
    silent: true, // Don't output unless issues found
  });

  if (result.status === 'passed') {
    // Silent - no output
    return result;
  }

  if (result.status === 'gaps_found') {
    // Auto-fix via recovery agent
    console.log(`Verification found issues in wave ${wave.wave}, attempting auto-fix...`);

    const fixed = await spawnRecoveryAgent({
      type: 'verification_failure',
      gaps: result.gaps,
    });

    if (fixed.success) {
      // Re-verify
      return runSilentVerification(wave);
    }

    // Block only if fix fails
    return { ...result, blocked: true };
  }

  return result;
}
```

### Anti-Patterns to Avoid

- **Orchestrator doing execution:** Orchestrator spawns, waits, collects - never reads codebase or executes tasks directly.
- **Relying on @-references across Task boundaries:** Always inline content in Task prompts.
- **Stopping wave on first failure:** Let sibling tasks complete (they're independent by definition).
- **Separate agents for task vs verification failures:** Use unified recovery agent per CONTEXT.md.
- **Verbose verification output:** Silent unless issues found.
- **Polling for Task completion:** Task tool blocks automatically.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parallel subagent spawning | Custom process spawning | Claude Code Task tool | Native, handles blocking, concurrency limits |
| Wave assignment | Runtime dependency analysis | Pre-computed in PLAN.md frontmatter | Planner has full context during planning |
| Task completion tracking | Polling loops | Task tool blocking | Built-in, reliable |
| PLAN.md parsing | Custom YAML parser | gray-matter | Already in stack, handles edge cases |
| Dashboard updates | Custom file polling | chokidar (already in dashboard) | Battle-tested, handles edge cases |

**Key insight:** Claude Code's Task tool provides robust parallel execution. GSD provides proven orchestration patterns. Use them.

## Common Pitfalls

### Pitfall 1: Context Bleed Between Waves

**What goes wrong:** Wave-executor inherits context from previous waves, causing degradation.

**Why it happens:** Reusing executors or passing too much state between waves.

**How to avoid:** Fresh executor per wave with inlined content only. No executor reuse.

**Warning signs:** Executor says "I'll be more concise now" or responses get shorter.

### Pitfall 2: @-Reference Failure Across Task Boundaries

**What goes wrong:** Task prompt uses `@.planning/phases/...` but executor can't read the file.

**Why it happens:** @-references only resolve in the main conversation, not Task prompts.

**How to avoid:** Read file content BEFORE spawning, inline in prompt.

**Warning signs:** "File not found" errors from wave-executor, empty content in executor.

### Pitfall 3: Premature Wave Failure Stop

**What goes wrong:** Wave stops immediately when one task fails, losing results from sibling tasks.

**Why it happens:** Treating task failure as wave failure.

**How to avoid:** Per CONTEXT.md - let sibling tasks finish, collect all results, THEN handle failures.

**Warning signs:** "Wave failed" with partial completion, sibling tasks never executed.

### Pitfall 4: Infinite Recovery Loop

**What goes wrong:** Recovery agent keeps retrying the same fix, never succeeding.

**Why it happens:** No attempt tracking or different-fix-each-time logic.

**How to avoid:** 3-retry limit per CONTEXT.md, escalate to user after exhaustion.

**Warning signs:** Recovery taking much longer than expected, same error repeated.

### Pitfall 5: Orchestrator Context Pollution

**What goes wrong:** Orchestrator reads too much (all SUMMARYs, full codebase), degrading coordination quality.

**Why it happens:** Trying to be thorough in the main context.

**How to avoid:** Orchestrator only reads frontmatter/metadata, spawns agents for heavy work.

**Warning signs:** Main context usage > 30%, degraded orchestrator responses.

### Pitfall 6: Dashboard Server Not Running

**What goes wrong:** Execution produces links to dashboard but server isn't started.

**Why it happens:** Orchestrator assumes dashboard is running.

**How to avoid:** Per CONTEXT.md - orchestrator ensures dashboard server is running before posting link.

**Warning signs:** Dashboard links return connection refused.

## Code Examples

### Wave-Executor Agent Prompt

```markdown
---
name: wave-executor
description: Executes a single plan within a wave. Spawned by parallel orchestrator with fresh context.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

<role>
You are an ARIOS wave-executor. You execute a single PLAN.md file atomically.

You are spawned by the parallel orchestrator with:
- Complete plan content (inlined)
- Project state (inlined)

Your context is fresh. Execute the plan completely.
</role>

<workflow>
1. Parse the plan from your prompt context
2. Execute each task in order
3. Commit after each task with format: {type}({phase}-{plan}): {task-name}
4. Create SUMMARY.md when complete
5. Return structured completion message
</workflow>

<output>
Return:

## PLAN COMPLETE

**Plan:** {phase}-{plan}
**Tasks:** {completed}/{total}
**Commits:** [list of commit hashes]
**SUMMARY:** {path}

OR

## PLAN FAILED

**Plan:** {phase}-{plan}
**Task:** {failed_task_number} - {name}
**Error:** {description}
**Attempt:** {N}
</output>
```

### Recovery Agent Prompt

```markdown
---
name: recovery-agent
description: Handles both task failures and verification issues. Unified recovery pattern.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

<role>
You are an ARIOS recovery agent. You diagnose and fix both:
- Task execution failures (code errors, build failures)
- Verification failures (stub detection, wiring issues)

Same core pattern: something went wrong, diagnose, fix.
</role>

<workflow>
1. Analyze the failure context provided
2. Identify root cause
3. Implement fix
4. Verify fix works
5. Return structured result
</workflow>

<output>
## RECOVERY COMPLETE

**Type:** {task_failure | verification_failure}
**Fixed:** {true | false}
**Diagnosis:** {what was wrong}
**Fix:** {what was done}
**Commits:** [if any]

OR

## RECOVERY FAILED

**Type:** {type}
**Attempt:** {N}
**Diagnosis:** {what was found}
**Blocker:** {why fix couldn't be applied}
</output>
```

### Parallel Orchestration Flow

```typescript
// Source: GSD execute-phase.md + CONTEXT.md decisions
async function executePhaseParallel(phaseDir: string): Promise<PhaseResult> {
  // 1. Ensure dashboard is running (per CONTEXT.md)
  const dashboardUrl = await ensureDashboardRunning();

  // 2. Discover plans and group by wave
  const plans = await discoverPlans(phaseDir);
  const waves = buildWaveSchedule(plans);

  console.log(`Phase execution: ${plans.length} plans across ${waves.length} waves`);

  // 3. Execute each wave
  for (const wave of waves) {
    // Minimal announcement per CONTEXT.md
    console.log(`Starting wave ${wave.wave} (${wave.plans.length} tasks)`);

    // Read all plan content upfront (@ doesn't work in Task)
    const planContents = await Promise.all(
      wave.plans.map(async p => ({
        id: p.id,
        content: await readFile(p.path, 'utf-8')
      }))
    );
    const stateContent = await readFile('.planning/STATE.md', 'utf-8');

    // 4. Spawn wave-executors in parallel
    if (wave.canParallelize && wave.plans.length > 1) {
      // Multiple Task() calls in single message = parallel
      const results = await Promise.all(
        planContents.map(plan =>
          spawnWaveExecutor({
            planId: plan.id,
            planContent: plan.content,
            stateContent,
          })
        )
      );

      // 5. Collect results - let all finish per CONTEXT.md
      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        await handleWaveFailures(failures);
      }
    } else {
      // Sequential execution
      for (const plan of planContents) {
        await spawnWaveExecutor({
          planId: plan.id,
          planContent: plan.content,
          stateContent,
        });
      }
    }

    // Summary per CONTEXT.md
    console.log(`Wave ${wave.wave} complete: X/Y tasks passed`);

    // 6. Silent verification
    const verification = await runSilentVerification(wave);
    if (verification.blocked) {
      return { status: 'blocked', wave: wave.wave, issues: verification.gaps };
    }
  }

  return { status: 'complete' };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sequential task execution | Wave-based parallel | 2025+ | 3-4x faster for multi-task phases |
| Single executor reuse | Fresh executor per wave | Current | Prevents context degradation |
| Separate failure agents | Unified recovery agent | CONTEXT.md decision | Simpler mental model |
| Verbose verification | Silent unless issues | CONTEXT.md decision | Less noise |
| Background polling | Task tool blocking | 2025+ | Simpler, more reliable |

**Deprecated/outdated:**
- Polling loops for Task completion: Task tool blocks automatically
- @-references in Task prompts: Must inline content
- Separate debug vs verification agents: Unified recovery pattern

## Open Questions

### 1. Exact Parallel Limit

**What we know:** Claude Code supports 7 simultaneous subagents, 10 concurrent operations total.

**What's unclear:** Whether 8 wave-executors (per CONTEXT.md) is within limits.

**Recommendation:** Start with 7 (documented limit), test with 8. If issues, throttle to 7.

### 2. Dashboard Server Lifecycle

**What we know:** CONTEXT.md says "orchestrator ensures dashboard server is running."

**What's unclear:** Exact mechanism - spawn on demand? Assume already running?

**Recommendation:** Check if running (port probe), spawn if not, post link regardless.

### 3. Recovery Agent Model Selection

**What we know:** GSD uses model profiles (opus/sonnet/haiku).

**What's unclear:** Which model for recovery agent.

**Recommendation:** Use sonnet (balanced). Recovery needs good reasoning but not opus-level.

## Sources

### Primary (HIGH confidence)

- [Claude Code Task tool documentation](https://code.claude.com/docs/en/sub-agents) - Official parallel subagent docs
- GSD execute-phase.md workflow - Proven parallel execution patterns
- GSD gsd-executor.md - Wave executor agent prompt patterns
- GSD gsd-verifier.md - Silent verification patterns
- CONTEXT.md (08-parallel-execution) - User decisions locked for this phase

### Secondary (MEDIUM confidence)

- [Claude Code Multi-Agent Parallel Coding](https://medium.com/@codecentrevibe/claude-code-multi-agent-parallel-coding-83271c4675fa) - Community patterns
- [ClaudeLog Task Agent Tools](https://claudelog.com/mechanics/task-agent-tools/) - Task tool mechanics
- [Best practices for Claude Code subagents](https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/) - Performance considerations
- Existing ARIOS execution/ modules - Current implementation to extend

### Tertiary (LOW confidence)

- WebSearch results on parallel AI agent coordination - General patterns, verify against official docs

## Metadata

**Confidence breakdown:**
- Wave-level parallelism: HIGH - Task tool is native, GSD patterns proven
- Fresh executor contexts: HIGH - Direct CONTEXT.md requirement, GSD implements it
- Failure handling: HIGH - CONTEXT.md decisions explicit
- Recovery agent: HIGH - CONTEXT.md specifies unified agent
- Dashboard coordination: MEDIUM - Some implementation details unclear

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable domain, Claude Code updates may change limits)
