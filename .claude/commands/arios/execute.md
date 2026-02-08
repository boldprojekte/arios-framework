---
description: Enter ARIOS execution workflow to run planned tasks
---

# /arios:execute

## Purpose

Execute tasks from the current plan, wave by wave.

## Variables

**Dynamic:** $WAVE (optional specific wave number)
**Static:** .planning/STATE.md, .planning/config.json, .planning/roadmaps/

**Checkpoint config (in .planning/config.json):**
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
- `startCommand`: Command to start the app (e.g., "npm run dev")
- `startReadyPattern`: Regex to detect app is ready (e.g., "ready on|listening on")
- `testCommand`: Command to run tests (e.g., "npm test")
- `startTimeout`: Timeout for app start (default: 30000ms)
- `testTimeout`: Timeout for tests (default: 120000ms)

## Context

- `!ls .planning/ 2>/dev/null || echo "NO_PLANNING"`
- @.planning/STATE.md - Current project position
- @.planning/config.json - Project settings

## Instructions

- **FIRST:** Check prerequisite - PLAN.md must exist for the phase
- If prerequisite fails: display refusal message and STOP (do NOT proceed)
- Show brief status line before starting
- Route to orchestrator for execution; never execute tasks directly
- After each wave, run checkpoint verification if configured
- Checkpoint passes when: app runs successfully AND tests pass
- Missing checkpoint config = skip verification (greenfield/early stages)
- On checkpoint failure: pause and show diagnostic, ask user to fix or continue
- After wave completion, show wave completion prompt
- After phase completion, show stage completion prompt

## Workflow

1. **Prerequisite check (MANDATORY - before anything else):**
   - Use Glob to check for `.planning/phases/{phase}/*-PLAN.md`
   - If PLAN.md found: proceed to step 2
   - If NOT found: display refusal message and STOP:
     ```
     ## Cannot Execute

     No execution plan found for this phase.

     Expected: `.planning/phases/{phase}/{phase}-*-PLAN.md`

     ---

     Run first: `/plan {phase}`

     Execution requires a plan to work from.
     ```
   - Do NOT offer "continue anyway" option. STOP here.
2. Check ARIOS initialized (ls .planning/ succeeds)
   - If not: "ARIOS not initialized. Run `arios init` first."
3. Read STATE.md for current position and active roadmap/phase
4. Display status: "Phase X/Y, Plan M/N"
5. Analyze phase complexity:
   - Read all PLAN.md files in current phase directory
   - Parse frontmatter to extract: wave number, depends_on array, plan ID
   - Apply complexity detection thresholds:
     * Simple: planCount <= 2 AND maxWave === 1
     * Complex: planCount >= 6 OR maxWave >= 3 OR avgDeps >= 2
     * Moderate: everything else
   - Display: "Detected: {level} ({planCount} plans, {maxWave} waves)"
6. Build and display wave schedule:
   - Group plans by wave number from frontmatter
   - For each wave, list plan IDs with execution mode:
     * Multiple plans in wave: "(parallel)"
     * Single plan in wave: "(sequential)"
   - Display schedule as formatted list
7. If $WAVE specified, use it; otherwise orchestrator determines next wave
8. **Display execution start (see Execution Start section below)**
9. Route to /arios:orchestrate execute
10. Checkpoint verification (after orchestrator returns):
    - If checkpoint config exists in .planning/config.json:
      * Run startCommand, wait for startReadyPattern or startTimeout
      * If app starts: run testCommand, check exit code
      * Display result: "Checkpoint: PASSED" or "Checkpoint: FAILED"
      * On failure: show diagnostic and prompt user for action
    - If no checkpoint config: skip checkpoint (greenfield/early stages)
11. After completion:
    - If more waves remain: "Next wave: /arios:execute"
    - If phase complete: "Phase complete. Next: /arios:ideate for next phase"

## Execution Start

**After complexity analysis, before spawning orchestrator:**

Display execution summary with dashboard link:
```
## Starting Execution

Phase: {phase_name}
Complexity: {level}
Plans: {count} in {wave_count} waves

Dashboard: http://localhost:3456

Delegating to orchestrator...
```

This ensures users see the dashboard link early, even if they /execute directly without going through /arios.

## Report

```
ARIOS Execution

Status: Phase {X}/{Y}, Plan {M}/{N}
Plan: {path to PLAN.md}
Complexity: {simple|moderate|complex}
Waves: {count}

Schedule:
Wave 1: 05-06, 05-07, 05-08 (parallel)
Wave 2: 05-09 (sequential)
Wave 3: 05-10 (sequential)

[Routing to orchestrator for execution...]

Checkpoint: {PASSED|FAILED|SKIPPED}
- App starts: {yes|no|n/a}
- Tests pass: {yes|no|n/a}
```

After wave completion (more waves remain), show:

```
---

Wave {N} complete. {remaining} wave(s) remaining.

Continue: `/execute {phase}`

---
```

After phase completion (all waves done), show stage completion prompt:

```
---

Stage complete: Phase {X} execution finished

Next: `/ideate` (if more features to build) or `/arios:status` (to review)

_Tip: Run `/clear` first for fresh context_

---
```
