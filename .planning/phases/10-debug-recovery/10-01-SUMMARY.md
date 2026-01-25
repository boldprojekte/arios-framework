---
phase: 10-debug-recovery
plan: 01
subsystem: execution
tags: [state-validation, integrity-check, error-handling, orchestrator]

# Dependency graph
requires:
  - phase: 09-verification-system
    provides: verification infrastructure that integrity checks complement
provides:
  - Pre-execution state validation
  - Auto-fix pattern for STATE.md drift
  - User prompt pattern for unfixable issues
  - Debug log template for error persistence
affects: [10-02, 10-03, 10-04, execution-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Auto-fix vs user-prompt decision tree for state issues"
    - "Silent success, visible only on intervention pattern"

key-files:
  created:
    - packages/arios-cli/templates/.planning/debug.log
  modified:
    - packages/arios-cli/templates/.claude/commands/arios/orchestrate.md

key-decisions:
  - "Checksum and future timestamp are auto-fixable (silent)"
  - "Missing files and out-of-range require user decision"
  - "Three options for unfixable: Continue, Reset, Abort"
  - "Debug.log only records escalated errors, not auto-fixes"

patterns-established:
  - "Integrity check runs after state read, before dashboard"
  - "Auto-fixable issues show one-liner, not prompt"

# Metrics
duration: 1min
completed: 2026-01-25
---

# Phase 10 Plan 01: Pre-Execution State Integrity Checks Summary

**State integrity validation with 5 checks, auto-fix pattern for drift, and user prompt pattern for unfixable issues**

## Performance

- **Duration:** 1 min
- **Started:** 2026-01-25T18:25:39Z
- **Completed:** 2026-01-25T18:26:54Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added State Integrity Check section to orchestrate.md with 5 validation checks
- Defined auto-fix pattern for checksum mismatch and future timestamp issues
- Defined user prompt pattern with Continue/Reset/Abort options for unfixable issues
- Created debug.log template file for error persistence

## Task Commits

Each task was committed atomically:

1. **Task 1: Add state integrity check section** - `3a6f83a` (feat)
2. **Task 2: Create debug.log template** - `839b783` (feat)

## Files Created/Modified

- `packages/arios-cli/templates/.claude/commands/arios/orchestrate.md` - Added State Integrity Check section with 5 checks, auto-fix and user-prompt patterns
- `packages/arios-cli/templates/.planning/debug.log` - Template for error persistence with format documentation

## Decisions Made

1. **Auto-fixable vs User-prompt categorization:**
   - Auto-fixable: Checksum mismatch (recalculate), Future timestamp (set to today)
   - User-prompt: Missing SUMMARY.md, Missing PLAN.md, Phase out of range
   - Rationale: Auto-fix for issues that have one obvious correct resolution; prompt for issues requiring user judgment

2. **Three-option user prompt (Continue/Reset/Abort):**
   - Continue: Proceed despite issue (user accepts risk)
   - Reset: Fix by reverting to last valid state
   - Abort: Stop execution for manual investigation
   - Rationale: Covers all reasonable user responses without being overwhelming

3. **Debug.log scope - escalated errors only:**
   - Auto-fixed issues are not logged
   - Only errors that required user escalation (3 retries failed) are recorded
   - Rationale: Keeps log clean and meaningful; auto-fixes are expected and routine

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- State integrity validation documented and positioned in execution flow
- Ready for 10-02 which adds recovery agent escalation logging
- debug.log template ready for population by recovery flow

---
*Phase: 10-debug-recovery*
*Completed: 2026-01-25*
