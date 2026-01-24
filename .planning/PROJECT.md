# ARIOS v2

## What This Is

A personal AI programming system for Claude Code that acts as a creative's coding partner. ARIOS understands intent before building, adapts to task complexity, and delivers professional implementations while keeping the user in control. It's built to leverage Claude Code's full capabilities — subagents, task system, context management — in a way that reflects the user's own workflow philosophy.

## Core Value

**The AI truly understands what you want and builds it professionally, without you needing to be a coder.** If everything else fails, this must work: intent → clarity → professional output.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Slash commands as entry points (/ideate, /plan, /execute, and supporting commands)
- [ ] CLAUDE.md integration for automatic system context loading
- [ ] Subagent prompt files (researcher, explorer, executor, planner, etc.)
- [ ] State management system that persists across sessions
- [ ] Task system integration throughout the workflow
- [ ] HTML dashboard for real-time task visibility and interaction
- [ ] Context-aware routing that suggests next steps but allows flexibility
- [ ] Greenfield vs brownfield detection with adapted workflows
- [ ] Complexity scaling — simple tasks = one wave, complex = phased waves
- [ ] Testable checkpoints — pause at verifiable points, not arbitrary phases
- [ ] Professional project setup with SOTA structure as foundation
- [ ] Proper subagent handoffs — findings persist and surface to orchestrator
- [ ] User-choosable approach (ground-up vs UI-first with mocks)

### Out of Scope

- Relying on Claude Code's built-in planning mode — user wants their own system
- Fully autonomous operation without checkpoints — user needs to verify
- Single rigid workflow — must adapt to task type and user preference

## Context

**User Profile:**
- Creative mind, not a professional coder
- Sees AI as a partner, not a tool to babysit
- Wants to steer direction but trust execution
- Values professional output without needing to understand implementation details

**Starting Point:**
- Existing "planner" system with 3 stages: ideate (IDEON), plan (ARIOS), execute (ARIOS)
- Works but doesn't leverage Claude Code's full capabilities
- Manual workflow — no subagents, no task system, no orchestration
- Reference folder contains prior work and research materials

**Technical Environment:**
- Claude Code CLI with Task tool, AskUserQuestion, slash commands
- Subagent spawning via Task tool with specialized agent types
- State persistence via markdown files
- Hooks system available (not yet explored by user)

**Prompt Philosophy:**
- Every line must earn its place — not too verbose, not too sparse
- Leave room for LLM to think — Opus is smart, don't over-specify
- Consistency in structure reduces agent confusion
- Slash commands ≠ subagent prompts (different structures for different purposes)

**Slash Command Template (Input-Workflow-Output):**
```
---
description: [capability]
model: [model]
tools: [allowed tools]
---

# Title

## Purpose
[1-2 sentences - direct instruction]

## Variables
- dynamic: $ARG1
- static: ./path

## Context
[Map of relevant files/structure]

## Instructions
[Rules - the HOW, not WHAT]

## Workflow
[Numbered steps with conditionals/loops]

## Report
[Output format]
```

**Subagent Prompts:**
- More focused: role + task + output
- Less orchestration structure, more task clarity
- Reference GSD agents as patterns

## Constraints

- **Context window**: Must manage context deliberately — not too much, not too little
- **Subagent handoffs**: Subagents can't call back to orchestrator; must use files or structured returns
- **User verification**: System must pause at points where user can actually test the app
- **Flexibility**: Must support different approaches (ground-up, UI-first) per user choice

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep ARIOS name | Brand continuity, user preference | — Pending |
| Build own system vs use Claude Code planning | User wants control over workflow and philosophy | — Pending |
| Subagents write to files for handoffs | Persistence across context, orchestrator reads when ready | — Pending |
| Testable checkpoints over arbitrary phases | Prevents building on broken foundation | — Pending |
| Input-Workflow-Output template for slash commands | Consistency reduces confusion, proven structure from IndyDevDan | — Pending |
| Lean prompts that leave room for LLM thinking | Opus is smart, over-specification hurts more than helps | — Pending |

---
*Last updated: 2026-01-24 after prompt philosophy added*
