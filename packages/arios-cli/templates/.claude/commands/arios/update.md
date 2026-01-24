---
description: Update ARIOS to the latest version
---

# /arios:update

## Purpose

Update ARIOS files to the latest version while preserving user customizations.

## Context

- @.planning/config.json - User preferences to preserve

## Instructions

1. Check current ARIOS version in .planning/config.json
2. Show what's new in the update (changelog)
3. Ask for confirmation before applying
4. Update system files, preserving user preferences
5. Report changes made

## Workflow

1. Read current version from .planning/config.json
2. Compare with latest version
3. If already latest, report and exit
4. Show changelog summary
5. Ask: "Apply update? (yes/no)"
6. If yes, update files preserving preferences
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
