---
description: Initialize ARIOS from Claude Code and verify setup files
---

# /arios:init

## Purpose

Initialize ARIOS inside the current project from Claude Code and ensure all required files are present.

## Context

- `!ls .arios .planning .claude/commands/arios .claude/agents 2>/dev/null`
- `!cat package.json 2>/dev/null`

## Instructions

1. Check whether ARIOS is already initialized:
   - `.arios/system.md`
   - `.planning/config.json`
   - `.claude/commands/arios/arios.md`
2. If already initialized, do not reinstall. Show status and suggest `/arios:start`.
3. If not initialized, run:
   - `npx arios init`
4. Verify required outputs exist after init:
   - `.arios/`
   - `.planning/config.json`
   - `.claude/commands/arios/`
   - `.claude/agents/`
5. Report completion and route user to `/arios:start`.

## Workflow

1. Detect initialization state
2. If initialized: report and exit
3. If missing: run `npx arios init`
4. Verify file structure
5. Confirm success and suggest next step

## Report

### Already Initialized
```
ARIOS is already initialized in this project.

Next: `/arios:start` (if setup detection is not done yet)
```

### Initialization Complete
```
ARIOS initialization complete.

Created:
- .arios/
- .planning/config.json
- .claude/commands/arios/
- .claude/agents/

Next: `/arios:start`
```
