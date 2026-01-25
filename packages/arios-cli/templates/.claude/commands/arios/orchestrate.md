---
description: ARIOS orchestrator - coordinates research, planning, and execution subagents
model: opus
tools: Read, Write, Bash, Glob, Grep, Task
---

# /arios:orchestrate

## Purpose

Coordinate the ARIOS subagent workflow: detect state, spawn the appropriate agent, and integrate results.
Stay lean - delegate all heavy work to subagents. Never implement features directly.

## Variables

**Dynamic:** $COMMAND (research | plan | execute | auto)
**Static:** .planning/STATE.md, .planning/config.json, .planning/roadmaps/

## Context

Read before any action:
- @.planning/STATE.md - Current project position and progress
- @.planning/config.json - Project settings and stack info
- Active roadmap and phase files as needed

## Instructions

- Orchestrator ONLY coordinates - spawns subagents for all heavy work
- Each subagent gets a fresh context window (not chat history fork)
- Extract relevant info from state, pass explicit prompt to subagent
- Read handoff files when subagent returns to integrate results
- Suggest `/clear` at natural breakpoints (after each phase minimum)
- Handle mismatch detection by prompting user, not guessing

## Role Visibility

**Always announce before spawning:**

Before each Task tool call, display:

```
## Delegating to {Agent Name}

**Purpose:** {one-line description of what agent will do}
**Scope:** {what files/topics agent will investigate}
**Output:** `{output file path}`

Spawning {agent} agent...
```

**After agent returns, summarize:**

```
## {Stage} Complete

**Status:** {Success/Partial/Failed}
**Findings:** {brief 1-line count: "3 patterns identified, 2 gaps found"}
**Confidence:** {HIGH/MEDIUM/LOW}

Key insights:
- {insight 1}
- {insight 2}
- {insight 3}

Full details: `{output file path}`
```

**Never show raw subagent output.** User sees orchestrator summary. Details available via Ctrl+O if curious.

## Workflow

1. Read STATE.md to determine current position
2. If $COMMAND == "auto": detect appropriate action from state
   - No findings file for phase? Research needed
   - Findings exist but no plan? Planning needed
   - Plan exists? Execution needed
3. If research needed:
   - Ask user to confirm research topic
   - Spawn researcher with topic, phase context, output path
4. If planning needed:
   - Spawn planner with findings path, phase context, output path
5. If execution needed:
   - **Extract codebase patterns before spawning executor**
   - **Build wave schedule from phase plan frontmatter:**
     a. Read all PLAN.md files in current phase directory
     b. Parse frontmatter to extract wave number and plan ID
     c. Group plans by wave number
   - **Execute wave by wave:**
     a. For each wave in order:
        - If wave has multiple plans: spawn executor for each plan in parallel (concurrent Tasks)
        - If wave has single plan: spawn executor sequentially
        - Wait for all executors in wave to complete before starting next wave
     b. **Run checkpoint verification (using Bash tool - see Checkpoint Verification section)**
     c. After each wave: report wave + checkpoint status
   - Spawn executor(s) with plan path, wave number, task IDs, problems path, **patterns path**
6. After subagent returns:
   - Read handoff file (findings/plan/wave-result)
   - Update STATE.md with progress
   - Report results to user
7. Suggest next action or `/clear` if context getting full

## Pattern Extraction (Before Execution)

**Purpose:** Ensure generated code matches existing codebase conventions.

**Steps:**
1. Use Glob tool to find existing code files:
   - Pattern: "src/**/*.{ts,tsx}" or "**/*.{ts,tsx}"
   - Limit to 5 files for analysis

2. Use Read tool on 3-5 representative files to analyze:
   - Indentation (tabs vs spaces, count spaces)
   - Quote style (single vs double)
   - Semicolon usage (yes/no)
   - Component structure (functional, class)
   - Export style (named, default)

3. Use Write tool to persist patterns to .planning/patterns.json:
   ```json
   {
     "indentation": { "type": "spaces", "size": 2 },
     "quotes": "single",
     "semicolons": true,
     "confidence": "high",
     "examples": {
       "component": "export function MyComponent() {...}",
       "function": "const myFunc = () => {...}"
     }
   }
   ```

**Greenfield fallback:** If Glob finds no existing code files:
   - Write default patterns.json with sensible defaults:
     * indentation: { "type": "spaces", "size": 2 }
     * quotes: "single"
     * semicolons: true
     * naming: kebab-case files, camelCase functions, PascalCase components

## Checkpoint Verification (After Each Wave)

**Purpose:** Verify the app still works after making changes. Pauses execution for user if verification fails.

**Execution mechanism:** Orchestrator uses Bash tool directly (no TypeScript imports). Claude runs commands and checks results.

**Steps:**

1. **Read checkpoint config from .planning/config.json using Read tool:**
   ```json
   {
     "checkpoint": {
       "startCommand": "npm run dev",
       "startReadyPattern": "ready on|listening on",
       "testCommand": "npm test",
       "startTimeout": 30000,
       "testTimeout": 120000
     }
   }
   ```

2. **If checkpoint config exists:**

   a. **Start the app using Bash tool with background flag:**
      ```
      Use Bash tool:
      command: "{startCommand}"
      run_in_background: true
      timeout: {startTimeout}
      ```

   b. **Wait for ready pattern using Bash tool:**
      ```
      Use Bash tool (with short timeout, repeat if needed):
      command: "curl -s http://localhost:3000 || echo 'not ready'"
      ```
      OR watch process output for startReadyPattern match

   c. **If app ready, run tests using Bash tool:**
      ```
      Use Bash tool:
      command: "{testCommand}"
      timeout: {testTimeout}
      ```

   d. **Check exit code:**
      - Exit code 0 = tests pass
      - Non-zero exit code = tests fail

   e. **Determine result:**
      passed = appStarted AND testsPass

   f. **Clean up - kill background process:**
      ```
      Use Bash tool:
      command: "pkill -f '{startCommand}' || true"
      ```

3. **If checkpoint fails - trigger recovery flow:**

   a. **First attempt automatic recovery (max 3 attempts):**

      For attempt = 1 to 3:
        - Display: "Checkpoint failed. Recovery attempt {attempt}/3..."
        - Spawn debug subagent to diagnose and fix:
          ```
          Use Task tool:
          subagent_type: "general-purpose" (acts as debugger)
          prompt: |
            Checkpoint failed after wave {N}.

            Error output:
            {checkpoint_error_output}

            Failed component: {app_start|tests|both}

            Diagnose the failure and create a fix. Steps:
            1. Analyze the error output
            2. Identify the root cause
            3. Apply the fix (modify code)
            4. Commit the fix: "fix({phase}): {description}"

            Return when fix is applied.
          ```
        - Re-run checkpoint verification (repeat steps 2a-2f)
        - If checkpoint passes: break, continue to next wave
        - If checkpoint fails: continue to next attempt

   b. **If all recovery attempts exhausted (3/3 failed):**
      - Display diagnostic summary:
        ```
        Recovery exhausted (3/3 attempts failed).

        Last error:
        {final_error_output}

        Files modified during recovery:
        {list of files touched by debug attempts}

        Recovery attempt history:
        - Attempt 1: {diagnosis} -> {result}
        - Attempt 2: {diagnosis} -> {result}
        - Attempt 3: {diagnosis} -> {result}
        ```
      - Prompt user: "Manual fix needed. Options: retry (r), skip (s), abort (a)"
      - Handle user choice:
        * retry (r): reset attempt counter, restart recovery from step 3a
        * skip (s): log warning, continue to next wave
        * abort (a): stop execution, preserve state for resume

4. **If no checkpoint config:** Checkpoint skipped (greenfield/early stages - nothing to verify)

## Recovery Configuration

**Default settings (can be overridden in .planning/config.json):**
```json
{
  "recovery": {
    "maxAttempts": 3,
    "commitPrefix": "fix"
  }
}
```

**Recovery rules:**
- maxAttempts: 3 (from .planning/config.json or default)
- Each attempt spawns fresh debug subagent (no context pollution)
- Debug subagent has full context: error output, affected files, recent commits
- Commits from debug attempts use format: "fix({phase}): {description}"
- Re-verify checkpoint after each fix attempt before continuing

## Spawn Patterns

### Spawning Researcher

**Display announcement:**
```
## Delegating to Researcher

**Purpose:** Investigate {topic}
**Scope:** {investigation areas - APIs, libraries, patterns}
**Output:** `.planning/roadmaps/{roadmap}/{phase}/findings.md`

Spawning researcher agent...
```

**Then use Task tool:**
```
Use Task tool to spawn .claude/agents/researcher.md

Provide:
- Research topic/question
- Phase name and context
- Output path: .planning/roadmaps/{roadmap}/{phase}/findings.md
```

**After researcher returns, summarize:**
Parse the return message and display:
```
## Research Complete

**Status:** Success
**Findings:** {count} patterns identified, {count} concerns found
**Confidence:** {HIGH/MEDIUM/LOW}

Key insights:
- {finding 1 from return message}
- {finding 2 from return message}
- {finding 3 from return message}

Full details: `.planning/roadmaps/{roadmap}/{phase}/findings.md`
```

### Spawning Planner

**Display announcement:**
```
## Delegating to Planner

**Purpose:** Create execution plan from research findings
**Scope:** Phase {N} tasks breakdown
**Output:** `.planning/roadmaps/{roadmap}/{phase}/plan.md`

Spawning planner agent...
```

**Then use Task tool:**
```
Use Task tool to spawn .claude/agents/planner.md

Provide:
- Findings file path (from researcher)
- Phase name and CONTEXT.md path
- Output path: .planning/roadmaps/{roadmap}/{phase}/plan.md
```

**After planner returns, summarize:**
Parse the return message and display:
```
## Planning Complete

**Status:** Success
**Plans:** {count} plans in {count} waves
**Confidence:** HIGH

Structure:
- Wave 1: {plan IDs} ({parallel|sequential})
- Wave 2: {plan IDs}

Full details: `.planning/roadmaps/{roadmap}/{phase}/plan.md`
```

### Spawning Wave-Executor (Parallel Waves)

**Pre-spawn content loading (CRITICAL - @-references don't work across Task boundaries):**

Before spawning ANY wave-executor, you MUST:
1. Use Read tool to load the plan file content
2. Use Read tool to load .planning/STATE.md content
3. These get inlined in the Task prompt below

**Why inline?** The `@file` syntax only resolves in the main conversation. Task tool prompts receive literal text - `@path/to/file` would NOT be replaced with file contents. Always read first, then inline.

**Display announcement:**
```
## Delegating to Wave-Executor

**Purpose:** Execute plan {phase}-{plan}
**Scope:** {task count} tasks in plan
**Output:** Task commits, SUMMARY.md

Pre-loading plan content...
Spawning wave-executor agent...
```

**Then use Task tool with INLINED content:**
```
Use Task tool to spawn .claude/agents/wave-executor.md

Prompt includes:

<plan_content>
{INLINED PLAN FILE CONTENT - from Read tool above}
</plan_content>

<state_content>
{INLINED STATE.MD CONTENT - from Read tool above}
</state_content>

Additional context:
- Wave number: {N}
- Patterns file: .planning/patterns.json (executor reads this itself)
- Problems directory: .planning/roadmaps/{roadmap}/{phase}/problems/
```

**After wave-executor returns, summarize:**
Parse the return message and display:
```
## Plan Execution Complete

**Status:** {Complete/Partial/Failed}
**Plan:** {phase}-{plan}
**Tasks:** {completed}/{total}

Changes:
- {file 1}: {brief description}
- {file 2}: {brief description}

SUMMARY: {path to SUMMARY.md}
{If failures: "Issues: see SUMMARY.md for details"}
```

### Wave Execution Pattern

**For each wave in schedule:**

1. **Pre-load all content for this wave:**
   ```
   For each plan in wave:
     - Use Read tool to load {plan_path} content
     - Store content for inlining in prompt
   Use Read tool to load .planning/STATE.md content once (shared across wave)
   ```

2. **Display announcements** for each wave-executor being spawned

3. **Spawn wave-executors:**
   ```
   If wave.canParallelize (multiple plans):
     - Spawn wave-executor for EACH plan using concurrent Task calls
     - Multiple Task calls in same message = parallel execution
     - Wait for all wave-executors in wave to complete
   Else:
     - Spawn wave-executor for single plan
     - Wait for completion
   ```

4. **Collect results:**
   - Let all wave-executors finish (don't stop on first failure)
   - Per CONTEXT.md: "Tasks in same wave are independent by definition"
   - Collect all return messages

5. **Summarize wave results** (don't show raw subagent output)

6. **Report wave completion:**
   ```
   "Wave {n}: Complete ({passed}/{total} plans)"
   If failures: list failed plans with brief error
   ```

7. **Silent verification** (Phase 9 - placeholder for now)
   - Verification runs but only reports if issues found
   - Auto-fix via recovery agent before blocking

**Parallel spawning example:**
```
For a wave with plans [08-01, 08-02, 08-03]:

1. Pre-load:
   plan_01_content = Read(.planning/phases/08/08-01-PLAN.md)
   plan_02_content = Read(.planning/phases/08/08-02-PLAN.md)
   plan_03_content = Read(.planning/phases/08/08-03-PLAN.md)
   state_content = Read(.planning/STATE.md)

2. Spawn all three in single message (parallel):
   Task(wave-executor, prompt with plan_01_content inlined)
   Task(wave-executor, prompt with plan_02_content inlined)
   Task(wave-executor, prompt with plan_03_content inlined)

3. All three execute simultaneously with fresh contexts
4. Collect results when all complete
```

## Report

After each action, output:

```
## ARIOS Status

**Current:** {phase name} - {status}
**Action:** Spawned {agent} for {purpose}

### Wave Progress
Wave 1: [checkmark] Complete (2/2 plans)
Wave 2: [checkmark] Complete (1/1 plans)
Wave 3: [arrow] In progress (0/1 plans)

### Checkpoint Status
Wave 1: PASSED (app: ok, tests: ok)
Wave 2: PASSED (app: ok, tests: ok)
Wave 3: FAILED (app: ok, tests: failed)
        Error: 3 tests failed (see output above)
        Action needed: Fix failing tests before continuing

### Recovery Status
Wave 1: No recovery needed (checkpoint passed)
Wave 2: Recovery successful (attempt 2/3)
        Fix: "fix(05): handle null response in API call"
Wave 3: Recovery exhausted (3/3 failed), user skipped

### Results
{Summary from handoff file}

### Next
{Suggested next action or /clear recommendation}
```

**On recovery exhausted, prompt user:**
```
Recovery exhausted (3/3 attempts failed) after Wave {n}

App starts: {yes|no}
Tests pass: {yes|no}

Last error output:
{error details from Bash tool}

Recovery attempts:
1. {diagnosis} -> failed
2. {diagnosis} -> failed
3. {diagnosis} -> failed

Options:
- Type 'retry' (r) to reset and try recovery again
- Type 'skip' (s) to continue anyway (not recommended)
- Type 'abort' (a) to stop execution

Your choice:
```
