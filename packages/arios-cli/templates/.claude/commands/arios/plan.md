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

- **FIRST:** Check prerequisite - CONTEXT.md must exist for the phase
- If prerequisite fails: display refusal message and STOP (do NOT proceed)
- Show brief status line before starting
- Route to orchestrator for planning; never do planning directly
- After completion, show stage completion prompt with next step

## Workflow

1. **Prerequisite check (MANDATORY - before anything else):**
   - Use Glob to check for `.planning/phases/{phase}/*-CONTEXT.md`
   - If CONTEXT.md found: proceed to step 2
   - If NOT found: display refusal message and STOP:
     ```
     ## Cannot Plan

     No ideation context found for this phase.

     Expected: `.planning/phases/{phase}/{phase}-CONTEXT.md`

     ---

     Run first: `/ideate`

     Planning requires ideation findings as input.
     ```
   - Do NOT offer "continue anyway" option. STOP here.
2. Check ARIOS initialized (ls .planning/ succeeds)
   - If not: "ARIOS not initialized. Run `arios init` first."
3. Read STATE.md for current position and active roadmap/phase
4. Display status: "Phase X/Y, Plan M/N"
5. Route to /arios:orchestrate plan
6. After completion, show stage completion prompt (see Report section)

## Report

```
ARIOS Planning

Status: Phase {X}/{Y}, Plan {M}/{N}
Context: {path to CONTEXT.md}

[Routing to orchestrator for planning...]
```

After planning completes, show stage completion prompt:

```
---

Stage complete: Planning finished for Phase {X}

Next: `/execute {phase}`

_Tip: Run `/clear` first for fresh context_

---
```
