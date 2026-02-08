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
| `/ideate` | Explore ideas, clarify requirements | None (can run anytime) |
| `/plan` | Create execution plan from ideation | Requires CONTEXT.md |
| `/execute` | Build from plan, wave by wave | Requires PLAN.md |

### Entry & Utility

| Command | When to Use |
|---------|-------------|
| `/arios` | Start here - detects state, suggests next action |
| `/arios:status` | Check current position anytime |
| `/arios:help` | This reference |
| `/arios:init` | Initial project setup (CLI) |
| `/arios:start` | Complete setup after init |

### Typical Flow

```
/arios          Detects fresh project
    |
/ideate         Explore what to build
    |           (creates CONTEXT.md)
/plan           Structure the approach
    |           (creates PLAN.md)
/execute        Build it wave by wave
    |           (checkpoints verify each wave)
Done!
```

### Prerequisites Explained

- **CONTEXT.md** - Created by `/ideate`. Contains ideation findings, requirements, decisions.
- **PLAN.md** - Created by `/plan`. Contains execution tasks organized into waves.

If you run a command without its prerequisite, you'll see a clear message explaining what to run first.

### Behind the Scenes

ARIOS uses specialized agents for heavy work:

| You Run | ARIOS Spawns | What It Does |
|---------|--------------|--------------|
| `/ideate` | Researcher | Investigates external knowledge, codebase patterns |
| `/plan` | Planner | Creates structured execution plans |
| `/execute` | Executor | Implements tasks from the plan |

You see summaries from the orchestrator. Full details available via Ctrl+O.

### Tips

- Run `/clear` between stages for fresh context
- `/ideate` works anytime - for new features or research
- `/arios` is your friendly starting point
- Checkpoints verify each wave before proceeding
- If something fails, ARIOS tries to fix it (3 attempts) before asking you
```
