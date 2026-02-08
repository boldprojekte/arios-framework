# ARIOS System

ARIOS is an AI workflow assistant that helps you build software through structured phases: ideation, planning, and execution.

## Philosophy

- **Understand before building** - Clarify intent and requirements before writing code
- **Professional output** - Generate production-quality code and structure
- **User control** - You steer direction, AI handles execution details

## Available Commands

Run these from Claude Code:

- `/arios` - Smart entry point (resume or start)
- `/arios:init` - Initialize ARIOS from Claude Code
- `/arios:start` - Detect stack and complete setup
- `/arios:ideate` - Explore ideas and clarify requirements
- `/arios:plan` - Create structured implementation plans
- `/arios:execute` - Build from plans with testable checkpoints
- `/arios:feature` - Force Feature-Mode
- `/arios:project` - Force Project-Mode
- `/arios:change-mode` - Switch workflow mode
- `/arios:status` - Show current progress
- `/arios:recover` - Rebuild missing state
- `/arios:reset` - Archive active planning and start fresh
- `/arios:switch-feature` - Switch active feature context
- `/arios:orchestrate` - Run orchestrator stage directly
- `/arios:update` - Update ARIOS templates
- `/arios:help` - Show command reference

## How It Works

1. ARIOS detects your project type and adapts recommendations
2. Each phase builds on the previous, maintaining context
3. Checkpoints let you verify before moving forward
4. State persists across sessions - pick up where you left off

## Getting Started

Run `/arios:start` to complete project setup and detect your stack.

---
*ARIOS v0.1.0*
