# ARIOS v1.0

**AI-assisted development orchestration for Claude Code.**

ARIOS transforms Claude Code from a code assistant into a full project orchestration system. It manages the entire development lifecycle: ideation, planning, and execution — with real-time visibility through a dashboard.

## Quick Start

```bash
# In your project directory
npx arios init

# Open Claude Code
claude

# Start the workflow
/arios
```

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        ARIOS WORKFLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   /arios ──► Detects project state, suggests next action        │
│      │                                                          │
│      ▼                                                          │
│   /ideate ──► Gather requirements, choose approach              │
│      │         (ground-up or UI-first)                          │
│      ▼                                                          │
│   /plan ──► Create phased implementation plans                  │
│      │       (ROADMAP.md, PLAN.md files)                        │
│      ▼                                                          │
│   /execute ──► Run plans with checkpoints                       │
│      │          (wave scheduling, parallel execution)           │
│      ▼                                                          │
│   Dashboard ──► Real-time task visibility                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

### 1. Install ARIOS in your project

```bash
cd your-project
npx arios init
```

This creates:
```
your-project/
├── .arios/
│   ├── config.json      # Project configuration
│   └── system.md        # System context for Claude
├── .claude/
│   ├── commands/arios/  # Slash commands
│   │   ├── arios.md     # Smart entry point
│   │   ├── ideate.md    # Ideation workflow
│   │   ├── plan.md      # Planning workflow
│   │   ├── execute.md   # Execution workflow
│   │   ├── status.md    # Project status
│   │   └── ...
│   └── agents/          # Subagent prompts
│       ├── researcher.md
│       ├── planner.md
│       └── executor.md
└── CLAUDE.md            # Claude Code configuration
```

### 2. Open Claude Code

```bash
claude
```

ARIOS commands are now available as `/arios:*` slash commands.

## Slash Commands

| Command | Purpose |
|---------|---------|
| `/arios` | Smart entry — detects state, suggests next action |
| `/arios:status` | Show current phase, plan, progress |
| `/arios:ideate` | Start ideation — requirements, approach selection |
| `/arios:plan` | Create implementation plans |
| `/arios:execute` | Run plans with wave scheduling |
| `/arios:help` | Show all commands |

## The Workflow

### Phase 1: Ideation (`/ideate`)

**What happens:**
1. You describe what you want to build
2. ARIOS spawns a **Researcher** subagent to analyze requirements
3. You choose a development approach:
   - **Ground-up**: Backend first, then frontend
   - **UI-first**: Mockups first, then implementation
4. Requirements are saved to `.planning/REQUIREMENTS.md`

**Output:**
- `REQUIREMENTS.md` — Structured requirements with IDs
- `config.json` — Updated with chosen approach

### Phase 2: Planning (`/plan`)

**What happens:**
1. ARIOS spawns a **Planner** subagent
2. Planner creates a phased roadmap from requirements
3. Each phase gets detailed PLAN.md files with:
   - Tasks broken into waves (parallel execution groups)
   - Dependencies between tasks
   - Verification criteria

**Output:**
```
.planning/
├── ROADMAP.md           # Phase overview
├── REQUIREMENTS.md      # Traced requirements
└── phases/
    ├── 01-foundation/
    │   ├── 01-01-PLAN.md
    │   └── 01-02-PLAN.md
    ├── 02-feature-x/
    │   ├── 02-01-PLAN.md
    │   └── ...
    └── ...
```

### Phase 3: Execution (`/execute`)

**What happens:**
1. ARIOS detects complexity (simple/moderate/complex)
2. Plans are grouped into waves for parallel execution
3. **Executor** subagents run each plan:
   - Execute tasks in order
   - Commit after each task
   - Pause at checkpoints for verification
4. On checkpoint failure → **Recovery flow** with debug subagent

**Output:**
- Code changes committed per task
- `*-SUMMARY.md` for each completed plan
- Updated `STATE.md` tracking progress

## Subagent System

ARIOS uses specialized subagents for different tasks:

```
┌─────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                           │
│         (coordinates workflow, spawns subagents)            │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌───────────┐  ┌───────────┐  ┌───────────┐
│ RESEARCHER│  │  PLANNER  │  │ EXECUTOR  │
│           │  │           │  │           │
│ • Analyze │  │ • Create  │  │ • Run     │
│   domain  │  │   roadmap │  │   tasks   │
│ • Gather  │  │ • Break   │  │ • Commit  │
│   context │  │   into    │  │   changes │
│ • Write   │  │   phases  │  │ • Verify  │
│   findings│  │ • Assign  │  │   checks  │
│           │  │   waves   │  │           │
└───────────┘  └───────────┘  └───────────┘
```

### Handoff Protocol

Subagents communicate via structured YAML frontmatter:

```yaml
---
type: research_complete
status: success
findings:
  - key: "auth_approach"
    value: "JWT with refresh tokens"
next_action: "proceed_to_planning"
---
```

## Dashboard

Real-time task visibility via browser:

```bash
npx arios dashboard
# Opens http://localhost:3456
```

### Features

- **Kanban Board** — Tasks grouped by status (Pending, In Progress, Complete)
- **List View** — Sortable table of all tasks
- **Roadmap View** — Phase progress overview
- **Dependency Lines** — Visual connections between related tasks
- **Real-time Updates** — SSE-powered, no refresh needed

### Architecture

```
┌─────────────┐     File changes      ┌─────────────┐
│  .planning/ │ ───────────────────► │   Watcher   │
│    files    │      (chokidar)       │   (parser)  │
└─────────────┘                       └──────┬──────┘
                                             │
                                             │ SSE broadcast
                                             ▼
                                      ┌─────────────┐
                                      │   Browser   │
                                      │  Dashboard  │
                                      └─────────────┘
```

## State Management

ARIOS persists state across sessions:

### STATE.md

```yaml
---
version: "1.0.0"
phase: 3
planIndex: 2
totalPhases: 6
status: "in-progress"
lastActivity: "2026-01-25"
phaseName: "Entry Points"
---
```

### Session Resume

When you reopen Claude Code:

```
/arios
```

ARIOS detects existing state and offers to resume:

```
Detection: Existing ARIOS project
Position: Phase 3, Plan 2 of 4
Last activity: Completed 03-01-PLAN.md

Resume execution? (yes/no)
```

## Execution Flow

### Complexity Detection

| Complexity | Plans | Waves | Behavior |
|------------|-------|-------|----------|
| Simple | 1-2 | 1 | Sequential execution |
| Moderate | 3-5 | 2-3 | Wave-based parallel |
| Complex | 6+ | 4+ | Full orchestration |

### Wave Scheduling

Plans with the same `wave` number execute in parallel:

```
Wave 1: [Plan 01, Plan 03]  ──► Execute in parallel
            │
            ▼
Wave 2: [Plan 02, Plan 04]  ──► Execute after Wave 1
            │
            ▼
Wave 3: [Plan 05]           ──► Execute after Wave 2
```

### Checkpoints

Plans can define verification checkpoints:

```yaml
checkpoint:
  type: "app-runs"
  command: "npm run dev"
  verify: "Server started on port 3000"
```

On checkpoint failure:
1. Execution pauses
2. Debug subagent analyzes error
3. Fix attempted (max 3 retries)
4. User prompted if unresolved

## File Structure

```
your-project/
├── .arios/
│   ├── config.json          # Project settings
│   └── system.md            # Claude system context
├── .claude/
│   ├── commands/arios/      # Slash commands (9 files)
│   └── agents/              # Subagent prompts (3 files)
├── .planning/
│   ├── config.json          # Detected stack settings
│   ├── PROJECT.md           # Project overview
│   ├── ROADMAP.md           # Phase breakdown
│   ├── REQUIREMENTS.md      # Traced requirements
│   ├── STATE.md             # Current position
│   └── phases/
│       ├── 01-phase-name/
│       │   ├── 01-CONTEXT.md
│       │   ├── 01-01-PLAN.md
│       │   ├── 01-01-SUMMARY.md
│       │   └── ...
│       └── ...
├── CLAUDE.md                # Claude Code config
└── package.json
```

## CLI Commands

```bash
# Initialize ARIOS in current project
npx arios init

# Start dashboard
npx arios dashboard
npx arios dashboard --port 4000
npx arios dashboard --no-open
```

## Development Approaches

### Ground-up (Backend First)

```
1. Data models & database
2. API endpoints
3. Business logic
4. Frontend components
5. Integration & polish
```

### UI-first (Frontend First)

```
1. UI mockups & components
2. State management
3. API integration
4. Backend implementation
5. Database & persistence
```

## Best Practices

1. **Let ARIOS detect** — Run `/arios` first, don't skip to specific commands
2. **Review plans** — Check PLAN.md files before execution
3. **Use checkpoints** — Define verification points for critical features
4. **Watch the dashboard** — Real-time visibility helps catch issues early
5. **Commit often** — ARIOS commits after each task for easy rollback

## Troubleshooting

### "No project state found"

Run `/arios:start` to initialize `.planning/` directory.

### Slash commands not appearing

Ensure ARIOS is installed: `npx arios init`

### Dashboard not updating

Check that the watcher is running and `.planning/` files are being modified.

### Checkpoint failures

1. Check the error message
2. Run the command manually to debug
3. Fix and re-run `/arios:execute`

---

**v1.0** — Built with Claude Code + ARIOS orchestration
