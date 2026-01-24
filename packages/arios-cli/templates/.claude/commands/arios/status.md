---
description: Show ARIOS project status and suggest next action
---

# /arios:status

## Purpose

Display current project position with decisions history and suggest next action.

## Context

Load state and config:
- @.planning/STATE.md
- @.planning/ROADMAP.md

## Instructions

### 1. Read State Directly

Read @.planning/STATE.md with your Read tool.

**If file not found:**
Show: "No project state found. Run `/arios` to get started."
Stop processing.

**If file exists:**
Parse the YAML frontmatter between `---` markers and extract:
- phase, planIndex, totalPhases, totalPlans
- status, lastActivity
- phaseName (if available)

### 2. Display Mini Table Format

Show status as a concise mini table (per CONTEXT.md - not verbose paragraphs):

```
## Project Status

| Phase | Plan | Status | Last Active |
|-------|------|--------|-------------|
| 2/6   | 1/3  | in-progress | 2026-01-24 |

Currently working on: Phase 2 - Subagent System
```

### 3. Parse Decisions from Body

Look for decisions in the markdown body (after frontmatter).
Decisions are typically bullet points with dates.

**Positive decisions:** Regular decisions made
**Negative decisions:** Marked with "rejected" or under "Rejected Ideas" section

Display last 5 positive decisions and last 3 negative decisions (if any):

```
### Recent Decisions
- [2026-01-24] ESM-only with NodeNext module resolution
- [2026-01-24] gray-matter for YAML frontmatter parsing
- [2026-01-24] Orchestrator stays lean - only coordinates

### Rejected Ideas
- [2026-01-24] Full Handlebars templating (too complex for needs)
- [2026-01-24] Interface-based types (aliases preferred)
```

If no negative decisions exist, omit the "Rejected Ideas" section.

### 4. Non-Assertive Suggestion

End with a choice, not an assertion:

"Continue with current phase, or `/arios:help` for other options?"

## Workflow

1. Read @.planning/STATE.md
2. If missing: show uninitialized message, stop
3. Parse YAML frontmatter for position data
4. Display mini status table
5. Parse decisions from markdown body
6. Show recent positive decisions (up to 5)
7. Show rejected ideas if any (up to 3)
8. End with non-assertive continuation suggestion

## Report

```
## Project Status

| Phase | Plan | Status | Last Active |
|-------|------|--------|-------------|
| X/Y   | M/N  | [status] | [date] |

Currently working on: [phase name]

### Recent Decisions
- [date] decision text
- [date] decision text

### Rejected Ideas
- [date] rejected idea (reason)

Continue with current phase, or `/arios:help` for other options?
```
