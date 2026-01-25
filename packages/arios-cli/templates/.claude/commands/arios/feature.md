---
description: Enter Feature-Mode directly, skipping mode detection conversation
---

# /arios:feature

## Purpose

Enter Feature-Mode directly for focused, single-phase work. Skips the mode detection conversation but still checks for active work.

## Context

- @.planning/STATE.md
- @.planning/config.json

## Instructions

### 1. Check for Active Work

Read STATE.md and config.json if they exist.

**If active work exists (status is NOT "complete" or "phase-complete"):**

Display:
```
## Active Work in Progress

You have active {mode} work: {phaseName}

Complete current work first, or run `/arios:reset` to start fresh.

**Current status:** {status}
**Progress:** {planIndex}/{totalPlans}
```

Stop here - do not proceed.

**If project has ROADMAP.md (existing project work):**

Display:
```
## Existing Project Detected

This project has an active roadmap. Starting a new feature would conflict with project work.

Options:
1. Continue with project: `/arios` to resume
2. Start fresh: `/arios:reset` to clear state and start new feature

What would you like to do? (1/2):
```

Handle user choice accordingly.

### 2. Enter Feature-Mode

If no active work or user confirmed reset:

1. Clear any stale state (if exists)
2. Write to .planning/config.json: `{ "mode": "feature", ... }`
3. Display:
   ```
   ## Feature-Mode

   Ready for focused, single-phase work.

   What feature would you like to build?
   ```
4. Wait for user response
5. Mirror understanding: "Got it - you want to [feature]. Let me plan that."
6. Route to `/ideate` with feature context

### 3. Feature Context for Ideation

When routing to /ideate, pass context indicating Feature-Mode:
- Single-phase workflow (no multi-phase roadmap)
- Phase folder will be `.planning/phases/feature-{name}/`
- On completion: archive to `.planning/archive/`

## Workflow

1. Check for active work in STATE.md
2. If active: display warning, stop
3. If has ROADMAP.md: ask about conflict, handle choice
4. Clear stale state
5. Write mode to config.json
6. Display Feature-Mode entry message
7. Wait for user's feature description
8. Route to /ideate with feature context

## Report

### Feature-Mode Entry
```
## Feature-Mode

Ready for focused, single-phase work.

What feature would you like to build?
```

### Blocked by Active Work
```
## Active Work in Progress

You have active {mode} work: {phaseName}

Complete current work first, or run `/arios:reset` to start fresh.
```
