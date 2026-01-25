---
description: Enter ARIOS ideation workflow for creative exploration
---

# /arios:ideate

## Purpose

Start creative exploration for new features, project direction, or problem research.

## Variables

**Dynamic:** $TOPIC (optional ideation topic)
**Static:** .planning/STATE.md, .planning/config.json

## Context

- `!ls .planning/ 2>/dev/null || echo "NO_PLANNING"`
- @.planning/STATE.md - Current project position
- @.planning/config.json - Project settings, approach, AND mode field

## Instructions

- Ideation has NO prerequisites - can be run at any point in the workflow
- Show brief status line before starting
- On first ideation (no approach set in config.json), prompt user to choose development approach
- If $TOPIC provided, use it; otherwise ask user what to explore
- Route to orchestrator for research; never do research directly
- After completion, show stage completion prompt with next step

## Mode-Aware Routing

**Read mode from config.json before proceeding:**

1. Read `.planning/config.json` if it exists
2. Extract `mode` field: "feature" or "project"
3. If no mode field: treat as "project" (legacy behavior)

**Route based on mode:**

| Mode | Ideation Output | Next Step |
|------|-----------------|-----------|
| Feature-Mode | Single CONTEXT.md in `feature-{name}/` | `/plan` for feature |
| Project-Mode | ROADMAP.md with multi-phase structure | `/plan {phase}` for phases |

### Feature-Mode Ideation

When mode == "feature":

1. **Do NOT create ROADMAP.md** - Feature-Mode has no multi-phase roadmap
2. **Create feature phase folder:** `.planning/phases/feature-{name}/`
   - Name derived from user's feature description (kebab-case, max 30 chars)
3. **Create CONTEXT.md** in feature folder with:
   - Feature goal and scope
   - Success criteria
   - Technical considerations
4. **Update STATE.md** with feature as single phase:
   ```yaml
   phase: 1
   totalPhases: 1
   phaseName: "feature-{name}"
   ```
5. **Route to:** `/plan` (single feature phase)

### Project-Mode Ideation

When mode == "project":

1. Follow standard ideation workflow
2. Create ROADMAP.md with phases
3. Create phase folders with numbered naming: `01-xxx/`, `02-xxx/`
4. Route to: `/plan {phase}` for first phase

## Workflow

1. Check ARIOS initialized (ls .planning/ succeeds)
   - If not: "ARIOS not initialized. Run `arios init` first."
2. Read STATE.md for current position
3. **Check mode in config.json:**
   - Read `.planning/config.json` and extract mode field
   - Default to "project" if no mode field
4. Check if approach is set:
   - Use Read tool to check .planning/config.json
   - If file exists, look for "approach" and "approachSetAt" fields
   - If approachSetAt has a value (not empty string): approach already set, skip selection
   - If no approachSetAt or empty string (approach never explicitly set):
     1. Present approach selection prompt:
        ```
        Before we begin ideation, let's set your development approach:

        1. **ground-up** - Build foundation first (data models -> business logic -> API -> UI)
        2. **balanced** - Interleave UI and logic as each feature requires (default)
        3. **ui-first** - Visual mockups with stub data first, then wire real data

        Which approach? (1/2/3 or name):
        ```
     2. Wait for user choice
     3. Use Read tool to get current config.json content (or assume {} if not exists)
     4. Use Write tool to update .planning/config.json with:
        ```json
        {
          "approach": "{user choice: ground-up|balanced|ui-first}",
          "approachSetAt": "{current ISO timestamp}"
        }
        ```
     5. Acknowledge: "Approach set to: {choice}"
5. Display status: "Phase X/Y, Plan M/N | Approach: {approach}"
6. If $TOPIC provided:
   - Confirm: "Ideating on: {topic}. Proceed? (yes/no)"
7. If no $TOPIC:
   - Ask: "What would you like to explore or research?"
8. **Branch based on mode:**
   - **If mode == "feature":** Follow Feature-Mode Ideation (see Mode-Aware Routing section above)
   - **If mode == "project":** Follow Project-Mode Ideation (see Mode-Aware Routing section above)
9. After completion, show stage completion prompt (see Report section)

## Report

```
ARIOS Ideation

Status: Phase {X}/{Y}, Plan {M}/{N}
Approach: {approach}
Topic: {ideation topic}

[Routing to orchestrator for research...]
```

After ideation completes, show stage completion prompt:

```
---

Stage complete: Ideation finished for {topic}

Findings: `.planning/phases/{phase}/{phase}-CONTEXT.md`

Next: `/plan {phase}`

_Tip: Run `/clear` first for fresh context_

---
```
