---
description: Rebuild ARIOS STATE.md from existing planning files
---

# /arios:recover

## Purpose

Recover ARIOS runtime state when `.planning/STATE.md` is missing or inconsistent.

## Context

- @.planning/config.json
- @.planning/ROADMAP.md
- `!find .planning -maxdepth 4 -type f 2>/dev/null | sort`

## Instructions

1. Read mode from `.planning/config.json` (default: project).
2. Recover mode-aware state from filesystem:

### Feature-Mode
- Resolve active feature folder from `feature_name`/`active_feature`.
- If missing, list feature folders and pick the most recently modified one.
- Determine progress from files:
  - `CONTEXT.md` exists -> ideation done
  - `*-PLAN.md` count -> total plans
  - `*-SUMMARY.md` count -> completed plans
- Recreate `.planning/features/feature-{name}/STATE.md` with:
  - `phase: 1`
  - `planIndex: {first incomplete plan or totalPlans}`
  - `totalPhases: 1`
  - `totalPlans: {plan count}`
  - `status: ready-for-planning | ready-for-execution | in-progress | phase-complete`
  - `phaseName: feature-{name}`

### Project-Mode
- Read roadmap + phase folders under `.planning/phases/`.
- Determine current phase and plan from existing PLAN/SUMMARY files.
- Recreate `.planning/STATE.md` with accurate phase/plan/status totals.

3. Validate recovered state against available files.
4. Report recovered position and suggest next command.

## Workflow

1. Read config and planning files
2. Infer mode and progress
3. Rebuild correct STATE.md location
4. Validate consistency
5. Report and continue

## Report

```
State recovery complete.

Recovered:
- Mode: {feature|project}
- Phase: {X}/{Y}
- Plan: {M}/{N}
- Status: {status}

Next: {recommended /arios:* command}
```
