---
phase: 05-execution-flow
plan: 06
subsystem: cli
tags: [ideate, approach, config, slash-commands]

# Dependency graph
requires:
  - phase: 05-03
    provides: approach storage API (config.json functions)
provides:
  - Approach selection UI in ideate command
  - First-ideation approach prompt
  - Approach display in status output
affects: [orchestrate, execute, planner]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Read/Write tool for config.json persistence
    - approachSetAt field to detect first-run

key-files:
  created: []
  modified:
    - packages/arios-cli/templates/.claude/commands/arios/ideate.md

key-decisions:
  - "Check approachSetAt field (not approach) to detect if selection needed"
  - "Three options with descriptions matching approach.ts guidance"
  - "Approach shown in both status line and Report section"

patterns-established:
  - "Config check before action: Read config.json, check field, then proceed"

# Metrics
duration: 2min
completed: 2026-01-25
---

# Phase 05 Plan 06: Approach Selection UI Summary

**Wired approach selection into /arios:ideate command with Read/Write tool persistence to config.json**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-25T08:00:00Z
- **Completed:** 2026-01-25T08:02:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Added workflow step 3 to check config.json for existing approach
- Integrated approach selection prompt for first ideation
- Three options documented: ground-up, balanced (default), ui-first
- Approach now displayed in status output and Report section

## Task Commits

Each task was committed atomically:

1. **Task 1: Add approach selection to ideate command** - `7fb1f63` (feat)

## Files Created/Modified

- `packages/arios-cli/templates/.claude/commands/arios/ideate.md` - Added approach selection workflow step 3, updated status display to include approach

## Decisions Made

- Check `approachSetAt` field (empty string = never set) rather than just `approach` field to determine if selection is needed - aligns with approach.ts hasApproachSet() logic
- Approach descriptions match those in approach.ts getApproachGuidance() for consistency
- Status line shows "Phase X/Y, Plan M/N | Approach: {approach}" format

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Approach selection UI complete and integrated
- Ready for remaining gap closure plans (05-07 through 05-10)
- Closes Truth 1: "User is prompted to choose approach on first /ideate"

---
*Phase: 05-execution-flow*
*Completed: 2026-01-25*
