---
phase: 07-e2e-flow-role-clarity
plan: 01
subsystem: workflow
tags: [commands, slash-commands, prerequisites, stage-transitions]

# Dependency graph
requires:
  - phase: 03-entry-points
    provides: Original command template structure
provides:
  - Hard prerequisite enforcement on /plan and /execute commands
  - Stage completion prompts with Next suggestions
  - Consistent /clear tip across all stage transitions
affects: [08-parallel-execution, 09-verification-system]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prerequisite check pattern: Glob for file existence, refusal message, STOP"
    - "Stage completion prompt pattern: Stage complete, Findings/Plan path, Next suggestion, /clear tip"

key-files:
  created: []
  modified:
    - packages/arios-cli/templates/.claude/commands/arios/plan.md
    - packages/arios-cli/templates/.claude/commands/arios/execute.md
    - packages/arios-cli/templates/.claude/commands/arios/ideate.md

key-decisions:
  - "Hard refusal over soft warning: No 'continue anyway' option for missing prerequisites"
  - "Consistent completion format: Stage complete, file path, Next command, /clear tip"
  - "Ideate has no prerequisites: Can run at any point in workflow"

patterns-established:
  - "Prerequisite check: Use Glob to check file existence, display refusal message with 'Run first:' if missing"
  - "Stage completion: Formatted block with Stage complete, Findings/Plan path, Next suggestion, /clear tip"

# Metrics
duration: 2min
completed: 2026-01-25
---

# Phase 7 Plan 01: Stage Transition Hardening Summary

**Hard prerequisite enforcement on /plan and /execute with consistent stage completion prompts across all workflow commands**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-25T14:34:05Z
- **Completed:** 2026-01-25T14:36:19Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- /plan command now refuses to proceed without CONTEXT.md, showing "Run first: /ideate" message
- /execute command now refuses to proceed without PLAN.md, showing "Run first: /plan" message
- All three commands have consistent stage completion prompts with Next and /clear tip
- Removed "continue anyway" options for hard enforcement of workflow sequence

## Task Commits

Each task was committed atomically:

1. **Task 1: Add hard prerequisite check to /plan command** - `7ce7052` (feat)
2. **Task 2: Add hard prerequisite check to /execute command** - `a9df73f` (feat)
3. **Task 3: Add stage completion prompt to /ideate command** - `e4db870` (feat)

## Files Created/Modified
- `packages/arios-cli/templates/.claude/commands/arios/plan.md` - Added mandatory CONTEXT.md prerequisite check and stage completion prompt
- `packages/arios-cli/templates/.claude/commands/arios/execute.md` - Added mandatory PLAN.md prerequisite check and wave/phase completion prompts
- `packages/arios-cli/templates/.claude/commands/arios/ideate.md` - Added stage completion prompt with CONTEXT.md path reference

## Decisions Made
- Hard refusal over soft warning: Removed "continue anyway" option because planning without ideation or executing without a plan produces poor results
- Consistent completion format: All stage completion prompts follow the same structure for predictable user experience
- Ideate confirmed as prerequisite-free: Can run at any point, making it the natural entry point to the workflow

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Stage boundaries now enforced - users cannot accidentally skip workflow stages
- Completion prompts guide users through the ideate -> plan -> execute flow
- Ready for E2E-02 (simplified autonomous mode) and other Phase 7 plans

---
*Phase: 07-e2e-flow-role-clarity*
*Completed: 2026-01-25*
