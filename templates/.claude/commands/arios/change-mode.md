---
description: Change ARIOS mode (Feature-Mode or Project-Mode)
---

# /arios:change-mode

## Purpose

Override the current ARIOS mode if the system detected incorrectly. Use this when:
- System detected Feature-Mode but you want full project planning
- System detected Project-Mode but you just want to add a quick feature

## Context

- @.planning/STATE.md
- @.planning/config.json
- @.planning/ROADMAP.md

## Instructions

### 1. Check Current State

Read config.json and STATE.md to determine current mode and work status.

**Display current mode:**
```
## Current Mode

Mode: {Feature-Mode|Project-Mode|Not set}
Status: {active work description or "No active work"}
```

### 2. Offer Mode Switch

**If active work in progress:**

```
## Active Work Detected

You have active {mode} work: {phaseName}
Progress: {planIndex}/{totalPlans}

Changing mode will:
- Archive current work to .planning/archive/
- Clear state for fresh start

Are you sure you want to switch modes? (yes/no):
```

Wait for confirmation before proceeding.

**If no active work:**

```
Switch to:
1. Feature-Mode - focused, single-phase work
2. Project-Mode - multi-phase roadmap

Which mode? (1/2):
```

### 3. Execute Mode Change

**If user confirms switch with active work:**

1. Archive current work:
   - If Feature-Mode: Move `.planning/features/feature-{name}/` to `.planning/archive/feature-{name}/`
   - If Project-Mode: Move current phase to `.planning/archive/`
2. Clear STATE.md (reset frontmatter)
3. Update config.json with new mode
4. Display confirmation

**If no active work:**

1. Update config.json with new mode:
   ```json
   {
     "mode": "{feature|project}",
     ...
   }
   ```
2. Display confirmation

### 4. Display Confirmation

```
## Mode Changed

Previous: {old mode}
New: {new mode}

{If had active work: "Previous work archived to .planning/archive/"}

Run `/arios` to start with new mode.
```

## Workflow

1. Read config.json for current mode
2. Read STATE.md for work status
3. Display current mode and status
4. If active work: confirm archival, handle choice
5. If no active work: offer mode selection
6. Update config.json with new mode
7. If archiving: move files to archive
8. Display confirmation

## Report

### Mode Changed
```
## Mode Changed

Previous: {old mode}
New: {new mode}

Run `/arios` to start with new mode.
```

### Change Cancelled
```
Mode change cancelled. Current mode: {mode}
```
