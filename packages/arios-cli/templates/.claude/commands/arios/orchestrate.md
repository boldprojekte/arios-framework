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

## Dashboard Coordination

**Before starting execution, ensure dashboard server is running:**

1. **Probe dashboard port:**
   ```
   Use Bash tool:
   command: "curl -s -o /dev/null -w '%{http_code}' http://localhost:3456 || echo 'not_running'"
   timeout: 3000
   ```

2. **If not running (response != 200), start it:**
   ```
   Use Bash tool:
   command: "npx tsx packages/arios-dashboard/src/server.ts"
   run_in_background: true
   timeout: 5000
   ```
   Wait 2 seconds for server to initialize.

3. **Verify it's now running:**
   ```
   Use Bash tool:
   command: "curl -s -o /dev/null -w '%{http_code}' http://localhost:3456"
   timeout: 3000
   ```
   If still not running, log warning but continue (dashboard is nice-to-have, not required).

4. **Post dashboard link once at execution start:**
   ```
   Dashboard: http://localhost:3456
   ```

**Note:** Dashboard is NOT auto-opened. User clicks link if they want visual monitoring. Some users prefer CLI-only.

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
   - **Ensure dashboard running (see Dashboard Coordination section above)**
   - Post dashboard link once: "Dashboard: http://localhost:3456"
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
        - Display: "Recovery attempt {attempt}/3..."
        - Spawn unified recovery agent:
          ```
          Use Task tool to spawn .claude/agents/recovery-agent.md

          <failure_context>
          type: task_failure
          wave: {N}
          plan_id: {phase-plan}
          attempt: {attempt}
          error: {checkpoint_error_output}
          files_affected: [files modified in this wave]
          recent_commits: [commits from this wave]
          </failure_context>
          ```
        - Parse recovery agent return message
        - If "RECOVERY COMPLETE" with "Fixed: true":
            - Re-run checkpoint verification
            - If passes: break, continue to next wave
        - If "RECOVERY FAILED":
            - Continue to next attempt

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
      - Check if failed plan has downstream dependencies:
        - Parse PLAN.md frontmatter for plans that depend_on this plan
        - If no downstream dependencies: offer Skip option
        - If has downstream dependencies: NO Skip option (would cascade)

      - Prompt user:
        If no downstream deps:
          "Task {X} failed 3x: [error]. Options: Debug (d), Skip (s), Abort (a)"
        If has downstream deps:
          "Task {X} failed 3x: [error]. Cannot skip (downstream tasks depend on it). Options: Debug (d), Abort (a)"
      - Handle user choice:
        * debug (d): reset attempt counter, restart recovery from step 3a
        * skip (s): log warning, continue to next wave (only if no downstream deps)
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
- Each attempt spawns fresh recovery agent (no context pollution)
- Recovery agent has full context: error output, affected files, recent commits
- Commits from recovery attempts use format: "fix({phase}): {description}"
- Re-verify checkpoint after each fix attempt before continuing

## Spawning Recovery Agent

**Used for:** Both task failures during execution AND verification failures between waves.

**Pre-spawn context gathering:**
1. Collect error/gap details from the failed checkpoint or verification
2. List files affected (modified in this wave or flagged by verifier)
3. Get recent commits for context (from this wave)
4. Determine failure type (task_failure or verification_failure)

**Display announcement:**
```
## Delegating to Recovery Agent

**Purpose:** Diagnose and fix {failure type}
**Scope:** {affected files}
**Attempt:** {N}/3

Spawning recovery agent...
```

**Then use Task tool:**
```
Use Task tool to spawn .claude/agents/recovery-agent.md

<failure_context>
type: {task_failure | verification_failure}
wave: {N}
plan_id: {phase-plan or "verification"}
attempt: {attempt}
error: {error details}
files_affected: [list]
recent_commits: [list]
</failure_context>
```

**After recovery agent returns:**
Parse return message:
- Look for "## RECOVERY COMPLETE" or "## RECOVERY FAILED"
- Extract Fixed status (true/false)
- Extract diagnosis and fix description

If RECOVERY COMPLETE with Fixed: true:
  - Re-verify checkpoint/verification
  - If passes: continue execution
  - If fails: increment attempt, retry recovery

If RECOVERY FAILED:
  - Increment attempt counter
  - If attempts < 3: retry with fresh recovery agent
  - If attempts >= 3: prompt user (see exhaustion handling)

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

1. **Pre-load content** (see inlined content pattern above)
   ```
   For each plan in wave:
     - Use Read tool to load {plan_path} content
     - Store content for inlining in prompt
   Use Read tool to load .planning/STATE.md content once (shared across wave)
   ```

2. **Announce wave start (MINIMAL - single line):**
   ```
   Starting wave {N} ({plan_count} plans)
   ```
   No detailed breakdown. User has dashboard for details.

3. **Spawn wave-executors** (parallel or sequential)
   ```
   If wave.canParallelize (multiple plans):
     - Spawn wave-executor for EACH plan using concurrent Task calls
     - Multiple Task calls in same message = parallel execution
     - Wait for all wave-executors in wave to complete
   Else:
     - Spawn wave-executor for single plan
     - Wait for completion
   ```

4. **Collect results** (let all finish)
   - Let all wave-executors finish (don't stop on first failure)
   - Per CONTEXT.md: "Tasks in same wave are independent by definition"
   - Collect all return messages

5. **Announce wave completion (MINIMAL - summary only):**
   ```
   Wave {N} complete: {passed}/{total} plans passed
   ```
   If failures:
   ```
   Wave {N} complete: {passed}/{total} plans passed
   Failed: {plan_id_1}, {plan_id_2}
   ```

6. **Silent verification** (Phase 9 - no announcement unless issues found)
   - Verification runs but only reports if issues found
   - Auto-fix via recovery agent before blocking

7. **Proceed to next wave** (no pause, no confirmation)

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

**During execution (per wave):**
```
Starting wave {N} ({count} plans)
[execution happens]
Wave {N} complete: {passed}/{total} plans passed
```

**On completion:**
```
## Phase Execution Complete

Waves: {completed}/{total}
Plans: {passed}/{total}
Duration: {time}

Dashboard: http://localhost:3456 (for detailed review)

Next: {suggested action}
```

**On failure (after recovery exhausted):**
```
## Phase Execution Blocked

Wave {N} failed after 3 recovery attempts.
Error: {brief description}

Options: Debug (d), Skip (s), Abort (a)
```

**Detailed progress is in the dashboard.** Chat stays clean for user to see orchestrator actions clearly.
