---
description: Smart ARIOS entry - detects state and routes to appropriate workflow
---

# /arios

## Purpose

Detect project state and provide a friendly entry point, helping users pick up where they left off or get started with clear options.

## Context

Load state if exists:
- @.planning/STATE.md

Load config for mode:
- @.planning/config.json

Check for roadmap (Project-Mode indicator):
- `!ls .planning/ROADMAP.md 2>/dev/null || echo "NO_ROADMAP"`

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

**Determine mode:**
- Read `.planning/config.json` if it exists
- Extract `mode` field: "feature" or "project"
- **v1.1 simplification:** If ROADMAP.md exists AND mode is not explicitly set, treat as Project-Mode
- If no mode field and no ROADMAP.md: proceed to Mode Detection (Section 4) after showing resume options

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

**If no conflict - Feature-Mode resume (mode: "feature"):**
Display feature-specific welcome message:
```
## Welcome Back to your feature: {phaseName}

Progress: {planIndex}/{totalPlans} plans
Status: {status}

**Last activity:** {lastActivity}

---

**Options:**

1. **Continue** - {action based on status}
2. **Status** - See feature overview
3. **Finish** - Complete and archive this feature

What would you like to do? (1/2/3):
```

**Handle Feature-Mode user choice:**
- 1 (Continue): Route to appropriate command based on status (see Status Interpretation)
- 2 (Status): Run `/arios:status`
- 3 (Finish): Archive and complete feature (see Feature-Mode Finish below)

**If no conflict - Project-Mode resume (mode: "project" or ROADMAP.md exists):**
Display project welcome message:
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

**Handle Project-Mode user choice:**
- 1 (Continue): Route to appropriate command based on status (see Status Interpretation)
- 2 (Status): Run `/arios:status`
- 3 (Other): Show available commands:
  ```
  Available commands:
  - `/ideate` - Explore ideas and clarify requirements
  - `/plan` - Create structured implementation plans
  - `/execute` - Build from plans with testable checkpoints
  - `/arios:status` - See full project overview
  - `/arios:change-mode` - Override detected mode (switch between Feature-Mode and Project-Mode)
  - `/arios:help` - See all available commands
  ```

#### Feature-Mode Finish (Option 3)

When user selects "Finish" in Feature-Mode:

1. **Confirm completion:**
   ```
   Complete and archive "{phaseName}"?

   This will:
   - Move feature files to .planning/archive/feature-{name}/
   - Clear mode from config
   - Reset state for next task

   Confirm? (yes/no):
   ```

2. **If user confirms:**
   - Move `.planning/phases/feature-{name}/` to `.planning/archive/feature-{name}/`
   - Update `.planning/config.json`: remove or null the `mode` field
   - Reset STATE.md to clean state (remove phase-specific frontmatter)
   - Display completion message:
     ```
     ## Feature Complete

     **Feature:** {phaseName}
     **Archived to:** .planning/archive/feature-{name}/

     Run `/arios` to start something new.
     ```

3. **If user declines:**
   - Return to resume options

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

**After initialization, proceed to Mode Detection (Section 4).**

### 4. Mode Detection (After Init or When No Mode Set)

This conversation runs after initialization or when STATE.md exists but has no mode set in config.json.

**Check if mode detection needed:**
- Read `.planning/config.json` if it exists
- If `mode` field exists and is "feature" or "project": Skip detection, proceed to appropriate workflow
- If no mode field or mode is null: Run mode detection conversation

#### Opening Question

Start with an open-ended question to let user express their mental model:

```
What would you like to build?
```

Wait for user response.

#### Scope Analysis

Analyze the user's response for scope indicators:

**Single feature keywords (Feature-Mode signals):**
- "add", "fix", "update", "change", "implement X", "improve"
- "a feature", "one thing", "this endpoint", "this page"
- Specific, bounded tasks: "login page", "dark mode", "export to CSV"

**Project keywords (Project-Mode signals):**
- "build", "create app", "new project", "from scratch", "complete"
- "application", "platform", "system", "product"
- Multi-feature indicators: "and also", "plus", "including", multiple features listed
- Scope uncertainty: "not sure how big", "might need a lot"

**Unclear signals:**
- Vague descriptions without scope markers
- Single words or very short responses
- Questions back at you

#### Mirror and Confirm

Based on scope analysis:

**If clearly single feature:**
```
I understand you'd like to [mirror their description]. This sounds like a focused feature.

Feature-Mode - correct?
```

**If clearly project scope:**
```
That sounds like a full project - [mirror understanding]. This would involve multiple phases of work.

Project-Mode - correct?
```

**If unclear after initial response:**
Ask ONE clarifying question:
```
To help me understand the scope: is this one focused piece of functionality, or are you building something larger with multiple parts?
```

Then determine mode from their clarification.

**If still unclear after 2-3 exchanges:**
Default to Feature-Mode (easier to upgrade later):
```
Let's start in Feature-Mode. If the scope grows, we can expand to Project-Mode.

Feature-Mode - proceeding?
```

#### User Confirmation

Binary choice - user either:
1. **Confirms:** "yes", "correct", "that's right", "proceed"
2. **Corrects:** "actually this is bigger/smaller", "no, I meant...", explains why not

**If user corrects:**
- Adjust mode based on their explanation
- Re-confirm: "Got it - [Project-Mode|Feature-Mode] instead. Correct?"

#### Store Mode

Once mode is confirmed:

1. **Update config.json:**
   Read `.planning/config.json`, add or update the `mode` field:
   ```json
   {
     "mode": "feature"  // or "project"
     // ... other existing fields
   }
   ```

2. **Display mode entry:**
   ```
   Entering {Feature-Mode|Project-Mode}. Let's get started.
   ```

#### Route Based on Mode

**Feature-Mode:**
- Route to `/ideate` with feature context
- Single-phase workflow: the feature becomes one "phase" with plans
- Skip roadmap creation

**Project-Mode:**
- Route to `/ideate` with project context
- Full multi-phase roadmap workflow

#### Professional Tone Examples

Good:
- "I understand you'd like to add authentication. Let me plan that."
- "That sounds like a complete application. We'll map out the phases."
- "Got it - a focused update to the dashboard. Feature-Mode works well for this."

Avoid:
- "Cool!" or overly casual language
- "Is this a feature or a project?" (don't ask directly)
- Excessive clarifying questions (max 2-3 exchanges)

## Workflow

1. Check if @.planning/STATE.md exists and has YAML frontmatter
2. If valid state exists:
   - Parse frontmatter for position and checksum
   - Determine mode from config.json (or ROADMAP.md presence for v1.1 simplification)
   - Check for state conflict (checksum mismatch)
   - If conflict: show State Changed message, ask user (1/2)
   - If no conflict and Feature-Mode: show Feature-Mode Welcome Back, offer options (1/2/3 with Finish)
   - If no conflict and Project-Mode: show Project-Mode Welcome Back, offer options (1/2/3 with Other)
   - If no mode set: after resume options, proceed to Mode Detection (Section 4)
3. If .planning/ exists but no STATE.md:
   - Show ARIOS Initialized message, offer recovery options (1/2)
4. If no .planning/:
   - Run greenfield/brownfield detection
   - Show Welcome to ARIOS message with detection results
   - Offer initialization (yes/no)
   - After init: proceed to Mode Detection (Section 4)
5. Route based on user selection using Status Interpretation table
6. Mode Detection (Section 4) runs when needed to ask "What would you like to build?" and detect Feature-Mode vs Project-Mode

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

### Feature-Mode Resume Report
```
## Welcome Back to your feature: {phaseName}

Progress: {planIndex}/{totalPlans} plans
Status: {status}

**Last activity:** {lastActivity}

---

**Options:**

1. **Continue** - {action based on status}
2. **Status** - See feature overview
3. **Finish** - Complete and archive this feature

What would you like to do? (1/2/3):
```

### Project-Mode Resume Report (Welcome Back)
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
