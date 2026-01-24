---
description: Smart ARIOS entry - detects state and routes to appropriate workflow
---

# /arios

## Purpose

Detect project state and suggest the appropriate next action, with user confirmation before proceeding.

## Context

Load state if exists:
- @.planning/STATE.md

Check ARIOS initialization:
- `!ls .planning/ 2>/dev/null || echo "NO_PLANNING"`

Detect code presence for greenfield/brownfield:
- `!find . -maxdepth 2 \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" \) ! -path "*/node_modules/*" ! -path "*/.git/*" 2>/dev/null | head -5`

Detect config files:
- `!ls package.json tsconfig.json requirements.txt go.mod Cargo.toml 2>/dev/null`

## Instructions

### Detection Order

1. **First: Check for existing state (resume detection)**
2. **Second: Check for .planning/ directory (brownfield ARIOS)**
3. **Third: Detect greenfield vs brownfield codebase**

### 1. Resume Flow (STATE.md exists with frontmatter)

Read @.planning/STATE.md and parse the YAML frontmatter between `---` markers.

**Extract these fields from frontmatter:**
- phase, planIndex (current position)
- totalPhases, totalPlans (totals)
- status (e.g., "in-progress", "phase-complete")
- checksum (first 8 chars of MD5 hash)

**Conflict detection:**
- Calculate MD5 hash of: phase + planIndex + status (concatenated)
- Compare first 8 characters to stored checksum
- If they don't match: state was modified externally

**If conflict detected:**
Show collaborative message (never auto-fix):
```
State file was modified. Something changed since last session.
- (continue with loaded state)
- (describe what changed so we can reconcile)
```
Wait for user input before proceeding.

**If no conflict:**
Show mini status table:
```
| Phase | Plan | Status |
|-------|------|--------|
| 2/6   | 1/3  | in-progress |
```

Then offer choice (non-assertive):
"Continue with Phase 2, or explore other options?"

### 2. Brownfield ARIOS Flow (.planning/ exists but no STATE.md)

- ARIOS was initialized but state file is missing or corrupted
- Show: "ARIOS initialized but state is missing."
- Suggest: "Run `/arios:status` to check files, or `/arios:recover` to rebuild state."

### 3. Fresh Start Flow (no .planning/ directory)

Detect greenfield vs brownfield:
- **Greenfield:** No code files found (empty or config-only project)
- **Brownfield:** Code files exist (project has implementation)

Detect tech stack from config files:
- package.json = JavaScript/TypeScript
- tsconfig.json = TypeScript
- requirements.txt = Python
- go.mod = Go
- Cargo.toml = Rust

Show detection result:
"Detected: [Greenfield/Brownfield] project [with stack info]"

Suggest initialization:
"Initialize ARIOS? Run `/arios:init`"

Wait for confirmation before proceeding.

## Workflow

1. Check if @.planning/STATE.md exists and has YAML frontmatter
2. If valid state exists:
   - Parse frontmatter for position and checksum
   - Check for state conflict (checksum mismatch)
   - If conflict: show collaborative message, ask user
   - If no conflict: show mini table, offer continuation choice
3. If .planning/ exists but no STATE.md:
   - Report missing state, suggest recovery options
4. If no .planning/:
   - Run greenfield/brownfield detection
   - Show detection results with stack info
   - Suggest `/arios:init`
5. If user confirms suggested action:
   - Route to appropriate command or spawn orchestrator
6. If user declines:
   - Show available commands with `/arios:help`

## Report

### Resume Report (when STATE.md exists)
```
ARIOS

| Phase | Plan | Status |
|-------|------|--------|
| X/Y   | M/N  | [status] |

Continue with [current phase name], or explore other options?
```

### Fresh Start Report (no STATE.md)
```
ARIOS

Detection: [Greenfield/Brownfield] [with stack info if detected]
Position: Not initialized

Suggested: /arios:init

Proceed? (yes/no)
```
