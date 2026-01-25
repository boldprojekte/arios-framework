---
phase: 08-parallel-execution
plan: 02
subsystem: execution
tags: [recovery, subagent, error-handling, failure-recovery]

# Dependency graph
requires:
  - phase: 08-parallel-execution
    provides: Wave-level parallel execution framework
provides:
  - Unified recovery agent for both task and verification failures
  - Recovery agent spawning pattern in orchestrator
  - Downstream dependency check for Skip option
affects: [09-verification, 10-debug-recovery]

# Tech tracking
tech-stack:
  added: []
  patterns: [unified-recovery-pattern, failure-context-format]

key-files:
  created:
    - packages/arios-cli/templates/.claude/agents/recovery-agent.md
  modified:
    - packages/arios-cli/templates/.claude/commands/arios/orchestrate.md

key-decisions:
  - "Single recovery agent handles both task_failure and verification_failure"
  - "Recovery agent spawned with inlined failure_context (not @-references)"
  - "Skip option conditional on downstream dependency check"
  - "3-attempt limit per failure before user prompt"

patterns-established:
  - "Unified recovery: diagnose -> fix -> verify -> commit"
  - "failure_context format: type, wave, plan_id, attempt, error, files_affected, recent_commits"
  - "Structured return: RECOVERY COMPLETE or RECOVERY FAILED"

# Metrics
duration: 2min
completed: 2026-01-25
---

# Phase 8 Plan 2: Unified Recovery Agent Summary

**Single recovery agent handles both task failures and verification failures with structured failure context and downstream dependency awareness**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-25T15:57:34Z
- **Completed:** 2026-01-25T15:59:46Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created unified recovery-agent.md that handles both task_failure and verification_failure types
- Updated orchestrator to spawn recovery-agent.md instead of generic debug subagent
- Added downstream dependency check before offering Skip option to user

## Task Commits

Each task was committed atomically:

1. **Task 1: Create unified recovery agent prompt** - `d8f43da` (feat)
2. **Task 2: Update orchestrator failure handling** - `de00ef0` (feat)

## Files Created/Modified
- `packages/arios-cli/templates/.claude/agents/recovery-agent.md` - Unified recovery agent handling both failure types
- `packages/arios-cli/templates/.claude/commands/arios/orchestrate.md` - Recovery agent spawning and dependency check

## Decisions Made
- **Unified agent pattern:** Per CONTEXT.md, single recovery agent handles both task failures AND verification failures (same core pattern: diagnose, fix, verify)
- **Structured failure context:** Orchestrator inlines failure_context with type, wave, plan_id, attempt, error, files_affected, recent_commits
- **Structured output format:** Recovery agent returns RECOVERY COMPLETE or RECOVERY FAILED with specific fields
- **Downstream dependency awareness:** Skip option only offered if failed plan has no downstream dependencies

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Recovery agent ready for use by orchestrator
- Verification failures (Phase 9) can use same recovery-agent.md
- Pattern established for failure handling throughout execution layer

---
*Phase: 08-parallel-execution*
*Completed: 2026-01-25*
