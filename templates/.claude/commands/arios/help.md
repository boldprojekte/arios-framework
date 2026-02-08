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

### Workflow Commands (in order)

| Command | Purpose | Prerequisites |
|---------|---------|---------------|
| `/arios:ideate` | Explore ideas, clarify requirements | None (can run anytime) |
| `/arios:plan` | Create execution plan from ideation | Requires CONTEXT.md |
| `/arios:execute` | Build from plan, wave by wave | Requires PLAN.md |

### Entry, Mode, and Utility

| Command | When to Use |
|---------|-------------|
| `/arios` | Start here - detects state, suggests next action |
| `/arios:init` | Initialize ARIOS from Claude Code |
| `/arios:status` | Check current position anytime |
| `/arios:start` | Complete setup after init |
| `/arios:feature` | Enter Feature-Mode directly |
| `/arios:project` | Enter Project-Mode directly |
| `/arios:change-mode` | Switch between Feature-Mode and Project-Mode |
| `/arios:switch-feature` | Switch active feature folder |
| `/arios:recover` | Rebuild missing or inconsistent STATE.md |
| `/arios:reset` | Archive active planning state and start fresh |
| `/arios:orchestrate` | Run orchestrator stage manually (research/plan/execute) |
| `/arios:update` | Update ARIOS templates in this project |
| `/arios:help` | This reference |

### Typical Flow

/arios          Detects fresh project
    |
/arios:ideate         Explore what to build
    |           (creates CONTEXT.md)
/arios:plan           Structure the approach
    |           (creates PLAN.md)
/arios:execute        Build it wave by wave
    |           (checkpoints verify each wave)
Done!

### Prerequisites Explained

- **CONTEXT.md** - Created by `/arios:ideate`. Contains ideation findings, requirements, decisions.
- **PLAN.md** - Created by `/arios:plan`. Contains execution tasks organized into waves.

If you run a command without its prerequisite, you'll see a clear message explaining what to run first.

### Behind the Scenes

ARIOS uses specialized agents for heavy work:

| You Run | ARIOS Spawns | What It Does |
|---------|--------------|--------------|
| `/arios:ideate` | Researcher | Investigates external knowledge, codebase patterns |
| `/arios:plan` | Planner | Creates structured execution plans |
| `/arios:execute` | Executor | Implements tasks from the plan |

You see summaries from the orchestrator. Full details available via Ctrl+O.

### Tips

- Run `/clear` between stages for fresh context
- `/arios:ideate` works anytime - for new features or research
- `/arios` is your friendly starting point
- Checkpoints verify each wave before proceeding
- If something fails, ARIOS tries to fix it (3 attempts) before asking you
```
