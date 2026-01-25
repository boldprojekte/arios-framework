---
description: Smart ARIOS entry - detects state and routes to appropriate workflow
---

# /arios

## Purpose

Detect project state and provide a friendly entry point, helping users pick up where they left off or get started with clear options.

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

**Extract from frontmatter:**
- phase, phaseName (current position)
- planIndex, totalPlans (progress within phase)
- totalPhases (overall progress)
- status (e.g., "in-progress", "ready-for-planning")
- lastActivity (when last worked on)
- checksum (first 8 chars of MD5 hash)

**Conflict detection:**
- Calculate MD5 hash of: phase + planIndex + status (concatenated)
- Compare first 8 characters to stored checksum
- If they don't match: state was modified externally

**If conflict detected:**
Display friendly conflict message:
```
## State Changed

Something changed since your last session.

Current state: Phase {phase}, {status}
Expected checksum: {stored}
Actual checksum: {calculated}

**Options:**
1. **Continue with current state** - Proceed as-is
2. **Show details** - See what might have changed

What would you like to do? (1/2):
```
Wait for user input before proceeding.

**If no conflict:**
Display welcome message:
```
## Welcome Back

You were working on:

| Progress | Phase | Status |
|----------|-------|--------|
| {phase}/{totalPhases} | {phaseName} | {status} |

**Last activity:** {lastActivity}
**Next action:** {determined from status - see Status Interpretation below}

---

**Options:**

1. **Continue** - {action based on status}
2. **Status** - See full project overview
3. **Other** - Start something different

What would you like to do? (1/2/3):
```

**Handle user choice:**
- 1 (Continue): Route to appropriate command based on status (see Status Interpretation)
- 2 (Status): Run `/arios:status`
- 3 (Other): Show available commands:
  ```
  Available commands:
  - `/ideate` - Explore ideas and clarify requirements
  - `/plan` - Create structured implementation plans
  - `/execute` - Build from plans with testable checkpoints
  - `/arios:status` - See full project overview
  - `/arios:help` - See all available commands
  ```

### 2. Brownfield ARIOS Flow (.planning/ exists but no STATE.md)

Display helpful recovery message:
```
## ARIOS Initialized

ARIOS is set up but state file is missing.

**Options:**
1. **Check files** - Run `/arios:status` to see what exists
2. **Recover state** - Run `/arios:recover` to rebuild state

What would you like to do? (1/2):
```

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

Display welcome message:
```
## Welcome to ARIOS

**Detected:** {Greenfield|Brownfield} {stack info if any}

ARIOS helps you build software through:
- `/ideate` - Explore what to build
- `/plan` - Structure the approach
- `/execute` - Build it step by step

**To get started:**

Run `/arios:init` to initialize ARIOS for this project.

Would you like to initialize? (yes/no):
```

If user confirms, run `/arios:init`.
If user declines, show available commands with `/arios:help`.

## Workflow

1. Check if @.planning/STATE.md exists and has YAML frontmatter
2. If valid state exists:
   - Parse frontmatter for position and checksum
   - Check for state conflict (checksum mismatch)
   - If conflict: show State Changed message, ask user (1/2)
   - If no conflict: show Welcome Back message, offer options (1/2/3)
3. If .planning/ exists but no STATE.md:
   - Show ARIOS Initialized message, offer recovery options (1/2)
4. If no .planning/:
   - Run greenfield/brownfield detection
   - Show Welcome to ARIOS message with detection results
   - Offer initialization (yes/no)
5. Route based on user selection using Status Interpretation table

## Status Interpretation

Map project status to suggested action:

| Status | Meaning | Suggested Action |
|--------|---------|------------------|
| `ready-for-planning` | Phase has CONTEXT.md, needs planning | `/plan {phase}` |
| `ready-for-execution` | Phase has PLAN.md, ready to build | `/execute {phase}` |
| `in-progress` | Execution started, waves remaining | `/execute {phase}` (continue) |
| `phase-complete` | All plans in phase done | `/ideate` for next phase |
| `blocked` | Issue preventing progress | Show blocker details |

**Autonomous routing:**
When user selects "Continue" (option 1), route automatically:
- Read status from STATE.md frontmatter
- Determine appropriate command from table above
- Execute that command (no additional confirmation needed)

## Report

### Resume Report (Welcome Back)
```
## Welcome Back

You were working on:

| Progress | Phase | Status |
|----------|-------|--------|
| {phase}/{totalPhases} | {phaseName} | {status} |

**Last activity:** {lastActivity}
**Next action:** {action from Status Interpretation}

---

**Options:**

1. **Continue** - {action description}
2. **Status** - See full project overview
3. **Other** - Start something different

What would you like to do? (1/2/3):
```

### Fresh Start Report (Welcome to ARIOS)
```
## Welcome to ARIOS

**Detected:** {Greenfield|Brownfield} {stack info if detected}

ARIOS helps you build software through:
- `/ideate` - Explore what to build
- `/plan` - Structure the approach
- `/execute` - Build it step by step

**To get started:**

Run `/arios:init` to initialize ARIOS for this project.

Would you like to initialize? (yes/no):
```
