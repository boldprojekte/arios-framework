---
description: Enter Project-Mode directly, skipping mode detection conversation
---

# /arios:project

## Purpose

Enter Project-Mode directly for multi-phase project work. Skips the mode detection conversation but still checks for active work.

## Context

- @.planning/STATE.md
- @.planning/config.json
- @.planning/ROADMAP.md

## Instructions

### 1. Check for Active Work

Read STATE.md and config.json if they exist.

**If active Feature-Mode work exists:**

Display:
```
## Active Feature in Progress

You have an active feature: {phaseName}

Complete the feature first, or run `/arios:reset` to start fresh project.

**Current status:** {status}
**Progress:** {planIndex}/{totalPlans}
```

Stop here - do not proceed.

**If active Project-Mode work exists (has ROADMAP.md):**

Display:
```
## Existing Project Detected

You already have a project in progress.

Phase: {phase}/{totalPhases} - {phaseName}
Status: {status}

Run `/arios` to continue with your project.
```

Stop here - user should use /arios to resume.

### 2. Enter Project-Mode

If no active work:

1. Write to .planning/config.json: `{ "mode": "project", ... }`
2. Display:
   ```
   ## Project-Mode

   Ready for multi-phase project work with full roadmap.

   What project would you like to build?
   ```
3. Wait for user response
4. Mirror understanding: "Got it - you want to build [project]. Let me help you plan this."
5. Route to `/ideate` with project context

### 3. Project Context for Ideation

When routing to /ideate, pass context indicating Project-Mode:
- Multi-phase roadmap workflow
- Will create ROADMAP.md
- Phase folders will be numbered `.planning/phases/01-xxx/`, `.planning/phases/02-xxx/`

## Workflow

1. Check for active work in STATE.md
2. If active feature: display warning, stop
3. If active project: display resume message, stop
4. Write mode to config.json
5. Display Project-Mode entry message
6. Wait for user's project description
7. Route to /ideate with project context

## Report

### Project-Mode Entry
```
## Project-Mode

Ready for multi-phase project work with full roadmap.

What project would you like to build?
```

### Blocked by Active Feature
```
## Active Feature in Progress

You have an active feature: {phaseName}

Complete the feature first, or run `/arios:reset` to start fresh project.
```

### Existing Project
```
## Existing Project Detected

You already have a project in progress.

Run `/arios` to continue with your project.
```
