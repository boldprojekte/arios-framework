---
description: Show ARIOS command reference and usage guide
---

# /arios:help

## Purpose

Display available ARIOS commands and workflow guidance.

## Instructions

Display the command reference below. This is a static documentation command.

## Report

```
## ARIOS Commands

**Entry Points:**
- /arios - Smart entry, detects state and suggests next action
- /arios:ideate - Creative exploration for features or direction
- /arios:plan - Create or continue a plan from ideation
- /arios:execute - Execute tasks from current plan

**Utilities:**
- /arios:status - Show current project position
- /arios:help - This reference
- /arios:start - Initial project setup (run after arios init)
- /arios:update - Update ARIOS to latest version

**Workflow:**
1. Initialize: `arios init` (CLI command)
2. Setup: /arios:start
3. Work: /arios:ideate -> /arios:plan -> /arios:execute
4. Check: /arios:status anytime

**Tips:**
- Use /arios to auto-detect what to do next
- /arios:ideate works anytime, not just for new projects
- Commands warn but don't block if run out of sequence
- Use /clear at natural breakpoints to free context
```
