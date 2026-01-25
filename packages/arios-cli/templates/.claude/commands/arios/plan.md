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
- @.planning/config.json - Project settings AND mode field

## Instructions

- **FIRST:** Check prerequisite - CONTEXT.md must exist for the phase
- If prerequisite fails: display refusal message and STOP (do NOT proceed)
- Show brief status line before starting
- Route to orchestrator for planning; never do planning directly
- After completion, show stage completion prompt with next step

## Mode-Aware Planning

**Read mode from config.json before planning:**

1. Read `.planning/config.json` and extract mode field
2. Default to "project" if no mode field

### Feature-Mode Planning

When mode == "feature":

1. **Phase structure:** Single phase in `feature-{name}/` folder
2. **Prerequisite check:** Look for CONTEXT.md in feature folder
   - Use Glob: `.planning/phases/feature-*/*-CONTEXT.md`
3. **No roadmap dependency:** Don't check for ROADMAP.md
4. **Plan output:** Create plans numbered within feature:
   - `feature-{name}/feature-01-PLAN.md`
   - `feature-{name}/feature-02-PLAN.md`
5. **Route to:** `/arios:orchestrate plan` with feature context

### Project-Mode Planning

When mode == "project":

1. **Phase structure:** Numbered phases from ROADMAP.md
2. **Prerequisite check:** Standard CONTEXT.md check in numbered phase folder
   - Use Glob: `.planning/phases/{phase}/*-CONTEXT.md`
3. **Requires ROADMAP.md:** Multi-phase coordination
4. **Plan output:** Plans numbered by phase:
   - `{phase}/{phase}-01-PLAN.md`
   - `{phase}/{phase}-02-PLAN.md`
5. **Route to:** `/arios:orchestrate plan` with phase context

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
