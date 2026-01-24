---
description: Enter ARIOS execution workflow to run planned tasks
---

# /arios:execute

## Purpose

Execute tasks from the current plan, wave by wave.

## Variables

**Dynamic:** $WAVE (optional specific wave number)
**Static:** .arios/STATE.md, .arios/config.json, .arios/roadmaps/

## Context

- `!ls .arios/ 2>/dev/null || echo "NO_ARIOS"`
- @.arios/STATE.md - Current project position
- @.arios/config.json - Project settings

## Instructions

- Show brief status line before starting
- Check for plan file from planning phase
- Warn if no plan exists, but allow continuation with confirmation
- Route to orchestrator for execution; never execute tasks directly
- After wave completion, show next wave info or phase completion

## Workflow

1. Check ARIOS initialized (ls .arios/ succeeds)
   - If not: "ARIOS not initialized. Run `arios init` first."
2. Read STATE.md for current position and active roadmap/phase
3. Display status: "Phase X/Y, Plan M/N"
4. Check for plan file in current phase directory
   - Path: .arios/roadmaps/{roadmap}/{phase}/plan.md
5. If no plan found:
   - Warn: "No plan found for current phase."
   - Ask: "Run /arios:plan first, or continue anyway? (plan/continue)"
   - If plan: suggest running /arios:plan
   - If continue: proceed with warning noted
6. If $WAVE specified, use it; otherwise orchestrator determines next wave
7. Route to /arios:orchestrate execute
8. After completion:
   - If more waves remain: "Next wave: /arios:execute"
   - If phase complete: "Phase complete. Next: /arios:ideate for next phase"

## Report

```
ARIOS Execution

Status: Phase {X}/{Y}, Plan {M}/{N}
Plan: {path or "not found"}
Wave: {current}/{total}

[Routing to orchestrator for execution...]

{Completion message or next wave info}
```
