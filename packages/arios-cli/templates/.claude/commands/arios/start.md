---
description: Complete ARIOS setup and detect project stack
---

# /arios:start

## Purpose

Complete ARIOS setup inside Claude Code by detecting project type and configuring the environment.

## Context

- @.arios/config.json - Current project configuration
- @package.json - Node.js project indicator
- @requirements.txt - Python project indicator
- @go.mod - Go project indicator

## Instructions

1. Detect project type by checking for indicator files
2. Identify TypeScript usage (tsconfig.json, .ts files)
3. Detect package manager (npm, pnpm, yarn, bun)
4. Update .arios/config.json with detection results
5. Offer to enhance CLAUDE.md with stack-specific guidance (optional)

## Workflow

1. Read existing .arios/config.json
2. Scan for project indicators
3. Ask user to confirm if detection is ambiguous
4. Write updated config
5. Report what was configured

## Report

```
ARIOS Setup Complete

Detected:
- Type: [detected type]
- TypeScript: [yes/no]
- Package Manager: [detected]

Configuration saved to .arios/config.json
```
