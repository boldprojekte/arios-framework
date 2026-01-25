# ARIOS

AI-assisted development workflow for Claude Code.

## What ARIOS Does

ARIOS helps you build software by:
1. **Understanding what you want** before writing code
2. **Planning the approach** with clear structure
3. **Building professionally** with quality checks at each step

## Quick Start

```bash
# In your project directory
npx arios init

# Then in Claude Code
/arios
```

## Workflow

```
/arios      Start here - ARIOS detects your project state
   |
/ideate     Explore ideas, clarify requirements
   |        Creates: CONTEXT.md
/plan       Structure the implementation approach
   |        Creates: PLAN.md with tasks in waves
/execute    Build it wave by wave
   |        Runs checkpoints to verify each wave
Done!
```

### Commands

| Command | What it does | When to use |
|---------|-------------|-------------|
| `/arios` | Smart entry point | Always start here |
| `/ideate` | Creative exploration | New features, research, direction changes |
| `/plan` | Create execution plan | After ideation, when ready to build |
| `/execute` | Run the plan | After planning, to build the feature |
| `/arios:status` | Show progress | Check where you are anytime |
| `/arios:help` | Command reference | Quick lookup |

### Tips

- **Run `/clear` between stages** - Keeps context fresh
- **`/ideate` works anytime** - Not just for new projects
- **Checkpoints verify each wave** - Catches issues early
- **ARIOS tries to fix failures** - 3 automatic attempts before asking you

## How it Works

ARIOS uses an **orchestrator pattern**:

```
You run /ideate
       |
       v
  Orchestrator
       |
       v
  Spawns Researcher agent
       |
       v
  Researcher investigates, writes findings
       |
       v
  Orchestrator summarizes for you
       |
       v
  You see: "Research complete: 3 patterns found. See CONTEXT.md"
```

**What you see:** Orchestrator summaries and prompts
**What happens behind the scenes:** Specialized agents do the heavy lifting

### Agents

| Agent | Purpose | When spawned |
|-------|---------|--------------|
| Researcher | Investigate approaches, patterns | During `/ideate` |
| Planner | Create execution structure | During `/plan` |
| Executor | Implement tasks | During `/execute` |

### Files ARIOS Creates

```
.planning/
  STATE.md        Your progress, decisions, context
  config.json     Project settings
  phases/
    01-name/
      01-CONTEXT.md   Ideation findings
      01-01-PLAN.md   Execution plan
      01-01-SUMMARY.md Results
```

## Requirements

- Claude Code CLI
- Node.js 18+

## License

MIT
