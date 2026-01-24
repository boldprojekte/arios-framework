---
description: Smart ARIOS entry - detects state and routes to appropriate workflow
---

# /arios

## Purpose

Detect project state and suggest the appropriate next action, with user confirmation before proceeding.

## Context

Check ARIOS initialization:
- `!ls .arios/ 2>/dev/null || echo "NO_ARIOS"`

Detect code presence for greenfield/brownfield:
- `!find . -maxdepth 2 \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" \) ! -path "*/node_modules/*" ! -path "*/.git/*" 2>/dev/null | head -5`

Detect config files:
- `!ls package.json tsconfig.json requirements.txt go.mod Cargo.toml 2>/dev/null`

Load state if exists:
- @.arios/STATE.md

## Instructions

- Always show detection result first ("Detected: Brownfield with TypeScript/React")
- Show brief status line if ARIOS initialized ("Phase 2/5, Plan 1/3")
- Suggest next action with confirmation prompt
- Handle ambiguity by asking, not guessing
- Never proceed without user confirmation

## Workflow

1. Check if .arios/ directory exists
2. If no .arios/:
   - Detect code files present (greenfield/brownfield)
   - Detect tech stack from config files
   - Show detection: "Detected: [Greenfield/Brownfield] project [with stack info]"
   - Suggest: "Initialize ARIOS? Run `/arios:init`"
   - Wait for confirmation
3. If .arios/ exists:
   - Read STATE.md for current position
   - Show status line: "Phase X/Y, Plan M/N"
   - Determine next action from state:
     - No roadmap? Suggest `/arios:ideate`
     - Roadmap but no plan for phase? Suggest research/planning
     - Plan exists? Suggest `/arios:execute`
   - Ask: "Continue with [suggested action]?"
4. If user confirms:
   - Route to appropriate command or spawn orchestrator
5. If user declines:
   - Show available commands

## Report

```
ARIOS

Detection: [Greenfield/Brownfield] [with stack info if detected]
Position: [Phase X/Y, Plan M/N OR "Not initialized"]

Suggested: [next command]

Proceed? (yes/no)
```
