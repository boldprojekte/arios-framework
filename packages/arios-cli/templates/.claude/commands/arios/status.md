---
description: Show ARIOS project status and suggest next action
---

# /arios:status

## Purpose

Display current project position and what to do next.

## Context

Check ARIOS initialization:
- `!ls .arios/ 2>/dev/null || echo "NO_ARIOS"`

Load state and config:
- @.arios/STATE.md
- @.arios/config.json

## Instructions

- If no .arios/: show "No ARIOS project. Use /arios:init"
- Otherwise: show phase, plan, and progress
- Always suggest next action inline (not boxed)
- Keep output concise and scannable

## Workflow

1. Check for .arios/ directory
2. If missing: report uninitialized state
3. Read STATE.md for position and progress
4. Read config.json for project type
5. Display status summary
6. Suggest next command

## Report

```
ARIOS Status

Position: Phase X/Y, Plan M/N
Project: [brownfield/greenfield]
Stack: [from config]

Next: [suggested command]
```
