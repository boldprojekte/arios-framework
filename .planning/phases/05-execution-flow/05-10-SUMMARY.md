---
phase: 05-execution-flow
plan: 10
subsystem: execution
tags: [recovery, checkpoint, debug-subagent, retry-logic, orchestrator]

# Dependency graph
requires:
  - phase: 05-09
    provides: checkpoint verification with pass/fail detection
provides:
  - recovery flow on checkpoint failure
  - debug subagent spawning for automatic fix attempts
  - bounded retry (max 3 attempts)
  - user escalation after exhaustion
affects: [phase-6, orchestrator-usage, checkpoint-handling]

# Tech tracking
tech-stack:
  added: []
  patterns: [recovery-first checkpoint handling, debug subagent pattern]

key-files:
  created: []
  modified:
    - packages/arios-cli/templates/.claude/commands/arios/orchestrate.md

key-decisions:
  - "Recovery triggers automatically on checkpoint failure (no immediate user prompt)"
  - "Max 3 recovery attempts before escalating to user"
  - "Debug subagent receives full error context for diagnosis"
  - "User options after exhaustion: retry, skip, abort"

patterns-established:
  - "Recovery-first: attempt automatic fix before user intervention"
  - "Bounded retry: max attempts prevent infinite loops"

# Metrics
duration: 1min
completed: 2026-01-25
---

# Phase 5 Plan 10: Recovery Flow Wiring Summary

**Recovery flow with debug subagent triggered on checkpoint failures, bounded to 3 attempts before user escalation**

## Performance

- **Duration:** 1 min
- **Started:** 2026-01-25T06:49:13Z
- **Completed:** 2026-01-25T06:50:18Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Checkpoint failures now trigger automatic recovery instead of immediate user prompt
- Debug subagent spawned with full error context (output, failed component, wave number)
- Recovery bounded to max 3 attempts with checkpoint re-verification after each fix
- User prompted only after all recovery attempts exhausted
- Recovery status section added to execution report

## Task Commits

Each task was committed atomically:

1. **Task 1: Add recovery flow to orchestrator** - `6b39bfa` (feat)

## Files Created/Modified
- `packages/arios-cli/templates/.claude/commands/arios/orchestrate.md` - Added recovery flow section, recovery configuration, recovery status in report

## Decisions Made
- Recovery triggers automatically on checkpoint failure (recovery-first approach)
- Max 3 recovery attempts aligns with CONTEXT.md "2-3 attempts" guidance
- Debug subagent spawned as general-purpose Task (no specialized agent needed)
- User gets three options after exhaustion: retry (r), skip (s), abort (a)
- Recovery configuration can be overridden in .planning/config.json

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 5 (Execution Flow) gap closure complete
- All 10 plans in Phase 5 executed
- Ready for Phase 6 integration/polish

---
*Phase: 05-execution-flow*
*Completed: 2026-01-25*
