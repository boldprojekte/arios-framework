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

## Workflow

1. Check ARIOS initialized (ls .planning/ succeeds)
   - If not: "ARIOS not initialized. Run `arios init` first."
2. Read STATE.md for current position
3. Check if approach is set:
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
4. Display status: "Phase X/Y, Plan M/N | Approach: {approach}"
5. If $TOPIC provided:
   - Confirm: "Ideating on: {topic}. Proceed? (yes/no)"
6. If no $TOPIC:
   - Ask: "What would you like to explore or research?"
7. Route to /arios:orchestrate research with the topic
8. After completion, show stage completion prompt (see Report section)

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
