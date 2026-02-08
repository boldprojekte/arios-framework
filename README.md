# ARIOS

AI-assisted development workflow for Claude Code.

ARIOS brings structure to AI-driven development. Instead of ad-hoc prompting, you work through a clear pipeline: **ideate, plan, execute** — with specialized agents, automatic checkpoints, and a real-time dashboard.

## Installation

```bash
npm install github:boldprojekte/arios-framework
```

## Setup

Two steps — one in the Terminal, one in Claude Code:

```bash
# 1. Terminal: Initialize ARIOS in your project
npx arios init
```

This creates:
- `.claude/agents/` — 6 specialized AI agents
- `.claude/commands/arios/` — namespaced `/arios:*` commands
- `.planning/` — runtime workflow config + planning state
- `.arios/` — install metadata + system prompt
- `CLAUDE.md` — Claude Code entry point with ARIOS section

```bash
# 2. Claude Code: Complete setup (detects your stack)
/arios:start
```

ARIOS detects runtime/tooling (Node/Python/Go/Rust), TypeScript usage, and package manager. For greenfield projects, the actual product/project type stays unset until you describe what to build. Runtime configuration is saved to `.planning/config.json`.

After that, you're ready:

```bash
/arios
```

## How It Works

ARIOS has three core stages. Each stage builds on the previous one:

```
/arios:ideate    →    /arios:plan    →    /arios:execute
   |               |              |
Research &     Create task    Build wave by
explore        structure      wave with
ideas          with waves     checkpoints
   |               |              |
CONTEXT.md     PLAN.md        SUMMARY.md
```

### Stage 1: Ideate (`/arios:ideate`)

Creative exploration and requirements gathering. ARIOS spawns a **Researcher agent** that investigates your codebase, patterns, and approaches.

**Output:** `CONTEXT.md` — findings, requirements, and decisions.

**No prerequisites** — you can run `/arios:ideate` at any point.

### Stage 2: Plan (`/arios:plan`)

Creates a structured execution plan from ideation findings. ARIOS spawns a **Planner agent** that breaks the work into numbered tasks organized in waves.

**Output:** `PLAN.md` files — tasks with dependencies, grouped into waves for parallel/sequential execution.

**Prerequisite:** `CONTEXT.md` must exist (run `/arios:ideate` first).

### Stage 3: Execute (`/arios:execute`)

Builds your project wave by wave. ARIOS spawns an **Executor agent** (or **Wave-Executor** for parallel tasks) that implements each task from the plan.

After each wave, ARIOS runs **checkpoint verification**:
- Starts your app (`npm run dev` or configured command)
- Runs your tests (`npm test` or configured command)
- If a checkpoint fails: pauses, shows diagnostics, and the **Recovery agent** attempts to fix (3 automatic retries before asking you)

**Output:** `SUMMARY.md` files — results for each completed task.

**Prerequisite:** `PLAN.md` must exist (run `/arios:plan` first).

## Two Modes

ARIOS supports two modes of working:

### Feature-Mode

For focused, single-feature work. No roadmap, no phases — just one feature from idea to completion.

```bash
/arios:feature            # Enter Feature-Mode directly
# or
/arios              # Auto-detects, asks "What would you like to build?"
```

**File structure:**
```
.planning/features/feature-dark-mode/
  CONTEXT.md        # Ideation findings
  STATE.md          # Progress tracking
  01-PLAN.md        # Task 1
  02-PLAN.md        # Task 2
  01-SUMMARY.md     # Task 1 results
```

When done, `/arios` offers a **Finish** option that archives the feature.

### Project-Mode

For multi-phase projects with a full roadmap. Think: building an entire app from scratch.

```bash
/arios:project            # Enter Project-Mode directly
# or
/arios              # Auto-detects based on your description
```

**File structure:**
```
.planning/
  ROADMAP.md        # Phase overview
  STATE.md          # Progress tracking
  phases/
    01-foundation/
      01-CONTEXT.md
      01-01-PLAN.md
      01-01-SUMMARY.md
      01-02-PLAN.md
    02-auth-system/
      02-CONTEXT.md
      02-01-PLAN.md
```

Each phase goes through the full ideate → plan → execute cycle.

**Switch modes anytime:** `/arios:change-mode`

## Commands

### Workflow (in order)

| Command | Purpose | Prerequisites |
|---------|---------|---------------|
| `/arios:ideate` | Explore ideas, research approaches | None |
| `/arios:plan` | Create execution plan with waves | `CONTEXT.md` |
| `/arios:execute` | Build wave by wave with checkpoints | `PLAN.md` |

### Entry & Navigation

| Command | Purpose |
|---------|---------|
| `/arios` | Smart entry — detects state, routes to next step |
| `/arios:init` | Initialize ARIOS from Claude Code |
| `/arios:start` | Complete setup after `npx arios init` |
| `/arios:status` | Show current progress |
| `/arios:help` | Command reference |

### Mode Selection

| Command | Purpose |
|---------|---------|
| `/arios:feature` | Enter Feature-Mode directly |
| `/arios:project` | Enter Project-Mode directly |
| `/arios:change-mode` | Switch between modes |

### Advanced

| Command | Purpose |
|---------|---------|
| `/arios:orchestrate` | Full orchestration (research + planning + execution) |
| `/arios:update` | Update ARIOS to latest version |
| `/arios:recover` | Rebuild missing/inconsistent state |
| `/arios:reset` | Archive active planning state and start fresh |
| `/arios:switch-feature` | Switch active feature folder |

## Agents

You don't interact with agents directly — the orchestrator spawns them behind the scenes.

| Agent | What it does | Spawned by |
|-------|-------------|------------|
| **Researcher** | Investigates codebase, external patterns, approaches | `/arios:ideate` |
| **Planner** | Creates execution plans with task waves and dependencies | `/arios:plan` |
| **Executor** | Implements individual tasks from plans | `/arios:execute` |
| **Wave-Executor** | Runs multiple tasks in parallel within a wave | `/arios:execute` (complex phases) |
| **Verifier** | Validates that a phase actually achieves its goals | After phase execution |
| **Recovery** | Diagnoses and fixes checkpoint failures automatically | On execution errors |

## Dashboard

Real-time browser dashboard showing task progress:

```bash
npx arios dashboard
```

Opens at `http://localhost:3456` with:
- Kanban board view of all tasks
- Phase progress bars
- Real-time updates (tasks move as agents work)

Options:
```bash
npx arios dashboard --port 8080    # Custom port
npx arios dashboard --no-open      # Don't auto-open browser
```

## Typical Session

```bash
# First time setup
npm install github:boldprojekte/arios-framework
npx arios init
# In Claude Code:
/arios:start

# Start working
/arios                    # "What would you like to build?"
                          # → "Add user authentication"
                          # → ARIOS detects: Feature-Mode

/arios:ideate                   # Researcher investigates auth approaches
                          # → Creates CONTEXT.md

/arios:plan                     # Planner creates execution structure
                          # → Creates 01-PLAN.md, 02-PLAN.md, 03-PLAN.md

/arios:execute                  # Executor builds wave by wave
                          # → Checkpoint after each wave
                          # → Creates SUMMARY.md for each task

/arios                    # "Welcome back — Feature complete!"
                          # → [Continue] [Status] [Finish]
```

**Tip:** Run `/clear` between stages for fresh context.

## Checkpoint Configuration

Configure automatic verification in `.planning/config.json`:

```json
{
  "checkpoint": {
    "startCommand": "npm run dev",
    "startReadyPattern": "ready on|listening on",
    "testCommand": "npm test",
    "startTimeout": 30000,
    "testTimeout": 120000
  }
}
```

If no checkpoint config is set, verification is skipped (useful for greenfield projects or early stages).

## Development Approach

On first `/arios:ideate`, ARIOS asks you to pick a development approach:

| Approach | Strategy |
|----------|----------|
| **ground-up** | Data models → business logic → API → UI |
| **balanced** | Interleave UI and logic per feature (default) |
| **ui-first** | Visual mockups with stub data first, then wire real data |

This is stored in `.planning/config.json` and influences how the Planner structures tasks.

## Resuming Work

ARIOS tracks state across sessions. When you return:

```bash
/arios
```

```
## Welcome Back

Phase 2 (Auth System) - Plan 3 of 5

[Continue] [Status] [Other]
```

- **Continue** — picks up exactly where you left off
- **Status** — shows full project overview
- **Other** — lists all available commands

## Updating

```bash
# 1. Pull latest version from GitHub
npm install github:boldprojekte/arios-framework

# 2. Update commands and agents in your project
npx arios update
```

This updates ARIOS commands and agents to the latest version. Runtime config (`.planning/config.json`), planning state (`.planning/`), and install metadata (`.arios/config.json`) are preserved.

## Requirements

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- Node.js >= 22.0.0

## License

MIT
