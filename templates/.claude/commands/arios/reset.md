---
description: Reset ARIOS runtime state with mode-aware cleanup
---

# /arios:reset

## Purpose

Reset ARIOS runtime state safely so the user can start a new task or project.

## Context

- @.planning/config.json
- @.planning/STATE.md
- `!find .planning -maxdepth 3 -type f 2>/dev/null | sort`

## Instructions

1. Read mode and active context from `.planning/config.json`.
2. Show what reset will clear (state, active mode, in-progress planning artifacts).
3. Ask for explicit confirmation.
4. On confirmation:
   - Feature-Mode:
     - Archive active feature folder to `.planning/archive/feature-{name}-{timestamp}/` if it exists.
   - Project-Mode:
     - Archive `.planning/ROADMAP.md`, `.planning/STATE.md`, and `.planning/phases/` to `.planning/archive/project-{timestamp}/`.
   - Clear runtime mode fields in `.planning/config.json`:
     - `mode: null`
     - `feature_name: null`
     - `active_feature: null`
   - Keep user preferences like `approach`, `checkpoint`, and `recovery`.
5. Report what was archived and that `/arios` can start fresh.

## Workflow

1. Inspect runtime state
2. Ask confirmation
3. Archive mode-specific artifacts
4. Reset runtime mode fields
5. Report completion

## Report

### Confirmation Prompt
```
Reset ARIOS runtime state?

This will archive current planning files and clear active mode.
Proceed? (yes/no)
```

### Reset Complete
```
ARIOS runtime reset complete.

Archived: {archive path}
Config updated: mode cleared

Next: `/arios`
```
