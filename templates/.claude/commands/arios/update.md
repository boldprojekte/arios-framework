---
description: Update ARIOS to the latest version
---

# /arios:update

## Purpose

Update ARIOS files to the latest version while preserving user customizations.

## Context

- @.arios/config.json - ARIOS install metadata/version
- @.planning/config.json - Runtime workflow preferences

## Instructions

1. Check current ARIOS version in .arios/config.json
2. Show what's new in the update (changelog)
3. Ask for confirmation before applying
4. Update system files, preserving user preferences
5. Report changes made

## Workflow

1. Read current version from .arios/config.json
2. Compare with latest version
3. If already latest, report and exit
4. Show changelog summary
5. Ask: "Apply update? (yes/no)"
6. If yes, update files while preserving:
   - `.planning/config.json` runtime preferences
   - `.planning/` project state
7. Report completion

## Report

```
ARIOS Update

Current: [old version]
Latest: [new version]

Changes:
- [change 1]
- [change 2]

[Status message]
```
