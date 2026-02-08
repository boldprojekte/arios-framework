---
description: Switch active feature context in Feature-Mode
---

# /arios:switch-feature

## Purpose

Switch the active feature context when multiple feature folders exist.

## Context

- @.planning/config.json
- `!find .planning/features -maxdepth 1 -type d -name 'feature-*' 2>/dev/null | sort`

## Instructions

1. List available feature folders under `.planning/features/feature-*`.
2. If no features exist: explain and stop.
3. Ask user to choose feature by index or name.
4. Normalize selection to `feature-{name}` folder.
5. Update `.planning/config.json`:
   - `mode: "feature"`
   - `feature_name: {name}`
   - `active_feature: {name}`
6. Confirm switch and suggest `/arios:status` or `/arios:execute`.

## Workflow

1. Discover features
2. Ask user choice
3. Validate selection
4. Update config
5. Report success

## Report

### No Features
```
No feature folders found in `.planning/features/`.

Create one first with `/arios:feature` -> `/arios:ideate`.
```

### Switched
```
Active feature switched to: feature-{name}

Next:
- `/arios:status`
- `/arios:execute`
```
