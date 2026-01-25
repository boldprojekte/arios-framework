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

3. **If checkpoint fails:**
   - Display diagnostic: what failed (start or tests) and error output
   - Prompt user: "Fix the issue and press Enter to re-verify, or type 'skip' to continue, or 'abort' to stop"
   - If re-verify (Enter): repeat steps 2a-2f
   - If skip: log warning and continue to next wave
   - If abort: stop execution entirely

4. **If no checkpoint config:** Checkpoint skipped (greenfield/early stages - nothing to verify)

## Spawn Patterns

**Researcher:**
```
Use Task tool to spawn .claude/agents/researcher.md

Provide:
- Research topic/question
- Phase name and context
- Output path: .planning/roadmaps/{roadmap}/{phase}/findings.md
```

**Planner:**
```
Use Task tool to spawn .claude/agents/planner.md

Provide:
- Findings file path (from researcher)
- Phase name and CONTEXT.md path
- Output path: .planning/roadmaps/{roadmap}/{phase}/plan.md
```

**Executor:**
```
Use Task tool to spawn .claude/agents/executor.md

Provide:
- Plan file path
- Wave number to execute
- Task IDs for this wave
- Problems directory: .planning/roadmaps/{roadmap}/{phase}/problems/
- Patterns file path: .planning/patterns.json
- Plans-in-wave count for progress tracking

Task description MUST include:
"Read .planning/patterns.json for code style context before executing tasks"
```

**Executor (wave execution):**
```
For each wave in schedule:
  If wave.canParallelize (multiple plans):
    Spawn executor for each plan in parallel using concurrent Task calls
    Wait for all executors in wave to complete
  Else:
    Spawn executor for single plan
    Wait for completion

  Report wave completion before next wave:
  "Wave {n}: Complete ({count}/{count} plans)"
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

### Results
{Summary from handoff file}

### Next
{Suggested next action or /clear recommendation}
```

**On checkpoint failure, prompt user:**
```
Checkpoint FAILED after Wave {n}

App starts: {yes|no}
Tests pass: {yes|no}

Error output:
{error details from Bash tool}

Options:
- Press Enter to re-verify after fixing
- Type 'skip' to continue anyway (not recommended)
- Type 'abort' to stop execution

Your choice:
```
