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

- Show brief status line before starting
- Check for plan file from planning phase
- Warn if no plan exists, but allow continuation with confirmation
- Route to orchestrator for execution; never execute tasks directly
- After each wave, run checkpoint verification if configured
- Checkpoint passes when: app runs successfully AND tests pass
- Missing checkpoint config = skip verification (greenfield/early stages)
- On checkpoint failure: pause and show diagnostic, ask user to fix or continue
- After wave completion, show next wave info or phase completion

## Workflow

1. Check ARIOS initialized (ls .planning/ succeeds)
   - If not: "ARIOS not initialized. Run `arios init` first."
2. Read STATE.md for current position and active roadmap/phase
3. Display status: "Phase X/Y, Plan M/N"
4. Check for plan file in current phase directory
   - Path: .planning/roadmaps/{roadmap}/{phase}/plan.md
5. If no plan found:
   - Warn: "No plan found for current phase."
   - Ask: "Run /arios:plan first, or continue anyway? (plan/continue)"
   - If plan: suggest running /arios:plan
   - If continue: proceed with warning noted
6. Analyze phase complexity:
   - Read all PLAN.md files in current phase directory
   - Parse frontmatter to extract: wave number, depends_on array, plan ID
   - Apply complexity detection thresholds:
     * Simple: planCount <= 2 AND maxWave === 1
     * Complex: planCount >= 6 OR maxWave >= 3 OR avgDeps >= 2
     * Moderate: everything else
   - Display: "Detected: {level} ({planCount} plans, {maxWave} waves)"
7. Build and display wave schedule:
   - Group plans by wave number from frontmatter
   - For each wave, list plan IDs with execution mode:
     * Multiple plans in wave: "(parallel)"
     * Single plan in wave: "(sequential)"
   - Display schedule as formatted list
8. If $WAVE specified, use it; otherwise orchestrator determines next wave
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

## Report

```
ARIOS Execution

Status: Phase {X}/{Y}, Plan {M}/{N}
Plan: {path or "not found"}
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

{Completion message or next wave info}
```
