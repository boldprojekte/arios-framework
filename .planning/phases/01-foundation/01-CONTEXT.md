# Phase 1: Foundation - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

CLAUDE.md integration and professional project structure. System context loads automatically when Claude Code opens a project with ARIOS. New projects get SOTA folder structure and configuration.

</domain>

<decisions>
## Implementation Decisions

### CLAUDE.md Structure
- CLAUDE.md stays lean — brief mention that ARIOS is installed + @file syntax to pull in instructions
- ARIOS files live in `.arios/` folder at project root (visible, project-local)
- Lazy loading — Claude Code only reads ARIOS files when user invokes an ARIOS command
- Minimal guidance standard: brief project context + ARIOS pointer (2-3 lines max)
- CLAUDE.md subagent for intelligent expansion is optional, comes later

### Folder Scaffolding
- Framework-adaptive — Opus analyzes purpose and creates SOTA folder structure for the detected/chosen stack
- Full starter — complete working project with configs, dependencies, sample files ready to run
- Optional professional additions: git workflows, linting, pre-commit hooks — asked during setup
- Generated README — Claude writes contextual README based on project purpose and stack, best practices, human-facing
- README updates happen when user requests them

### Installation Experience
- CLI tool for installation: `npx arios init` or similar
- Two-step process:
  1. CLI creates `.arios/` folder, adds subagents and slash commands/skills to `.claude/`
  2. `/arios:start` completes setup inside Claude Code (hooks, CLAUDE.md additions, TBD runtime config)
- Zero-config — just run the command, sensible defaults, no prompts or flags needed
- `/arios:update` command — updates ARIOS, shows what's new, asks user confirmation before applying

### Project Type Handling
- Explorer subagent for detection — orchestrator prompts explore agent to look for indicators intelligently
- Ask to clarify for ambiguous/unknown projects ("I found X and Y — which is primary?")
- Stack-awareness when relevant — primarily at setup, but adapts if project evolved outside ARIOS
- Store and persist in `.arios/config` — ask user to confirm if obvious changes detected

### Claude's Discretion
- Exact file/folder names within `.arios/`
- Implementation of the explore agent prompt
- How to structure the CLI tool internally
- Specific default configs per framework

</decisions>

<specifics>
## Specific Ideas

- "like GSD" for the update experience — show what's new, user confirms before applying
- Professional setup includes the things a professional would do: linting, git workflows, pre-commit hooks
- Keep CLAUDE.md from "exploding" — best practice is lean

</specifics>

<deferred>
## Deferred Ideas

- CLAUDE.md subagent for intelligent expansion — optional feature, user has research on this
- Hooks configuration — part of /arios:start but details TBD (future phase)

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-01-24*
