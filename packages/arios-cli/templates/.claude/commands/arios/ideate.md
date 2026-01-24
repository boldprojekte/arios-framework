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
- @.planning/config.json - Project settings

## Instructions

- Show brief status line before starting
- Ideation is always valid - can be run at any point in the workflow
- If $TOPIC provided, use it; otherwise ask user what to explore
- Route to orchestrator for research; never do research directly
- After completion, suggest /arios:plan as next step

## Workflow

1. Check ARIOS initialized (ls .planning/ succeeds)
   - If not: "ARIOS not initialized. Run `arios init` first."
2. Read STATE.md for current position
3. Display status: "Phase X/Y, Plan M/N"
4. If $TOPIC provided:
   - Confirm: "Ideating on: {topic}. Proceed? (yes/no)"
5. If no $TOPIC:
   - Ask: "What would you like to explore or research?"
6. Route to /arios:orchestrate research with the topic
7. After completion, show: "Next: /arios:plan"

## Report

```
ARIOS Ideation

Status: Phase {X}/{Y}, Plan {M}/{N}
Topic: {ideation topic}

[Routing to orchestrator for research...]

Next: /arios:plan
```
