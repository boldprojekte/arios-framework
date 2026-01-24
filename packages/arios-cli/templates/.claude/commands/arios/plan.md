---
description: Enter ARIOS planning workflow to create an execution plan
---

# /arios:plan

## Purpose

Create or continue an execution plan from ideation findings.

## Variables

**Dynamic:** $PHASE (optional phase to plan)
**Static:** .planning/STATE.md, .planning/config.json, .planning/roadmaps/

## Context

- `!ls .planning/ 2>/dev/null || echo "NO_PLANNING"`
- @.planning/STATE.md - Current project position
- @.planning/config.json - Project settings

## Instructions

- Show brief status line before starting
- Check for findings file from ideation/research phase
- Warn if no findings exist, but allow continuation with confirmation
- Route to orchestrator for planning; never do planning directly
- After completion, suggest /arios:execute as next step

## Workflow

1. Check ARIOS initialized (ls .planning/ succeeds)
   - If not: "ARIOS not initialized. Run `arios init` first."
2. Read STATE.md for current position and active roadmap/phase
3. Display status: "Phase X/Y, Plan M/N"
4. Check for findings file in current phase directory
   - Path: .planning/roadmaps/{roadmap}/{phase}/findings.md
5. If no findings found:
   - Warn: "No findings found for current phase."
   - Ask: "Run /arios:ideate first, or continue anyway? (ideate/continue)"
   - If ideate: suggest running /arios:ideate
   - If continue: proceed with warning noted
6. Route to /arios:orchestrate plan
7. After completion, show: "Next: /arios:execute"

## Report

```
ARIOS Planning

Status: Phase {X}/{Y}, Plan {M}/{N}
Findings: {path or "not found"}

[Routing to orchestrator for planning...]

Next: /arios:execute
```
