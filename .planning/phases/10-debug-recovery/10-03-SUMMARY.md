---
phase: 10-debug-recovery
plan: 03
subsystem: recovery
tags: [escalation, user-messaging, recovery-agent, orchestrator]

# Dependency graph
requires:
  - phase: 10-02
    provides: Fresh spawn philosophy and attempt history tracking
  - phase: 10-04
    provides: Plain-language error presentation patterns
provides:
  - ALWAYS-ESCALATE category classification for recovery
  - RECOVERY ESCALATE output format for immediate user escalation
  - Escalation handling flow in orchestrator
affects: [11-smart-entry, 12-state-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [immediate-escalation, category-based-messaging]

key-files:
  created: []
  modified:
    - packages/arios-cli/templates/.claude/agents/recovery-agent.md
    - packages/arios-cli/templates/.claude/commands/arios/orchestrate.md

key-decisions:
  - "Three ALWAYS-ESCALATE categories: ambiguous requirements, extreme destructive, external service"
  - "RECOVERY ESCALATE skips retry loop entirely (no attempt counter increment)"
  - "User always sees category-specific 'Why I'm asking' explanation"
  - "Escalations logged to debug.log after user responds"

patterns-established:
  - "Immediate escalation: detect -> flag -> skip fix -> explain to user"
  - "Category-specific messaging: ambiguous (decide), destructive (approve), external (can't fix)"

# Metrics
duration: 1min
completed: 2026-01-25
---

# Phase 10 Plan 03: Escalation Triggers Summary

**ALWAYS-ESCALATE pattern matching with RECOVERY ESCALATE output format and user-appropriate messaging in orchestrator**

## Performance

- **Duration:** 1 min
- **Started:** 2026-01-25T18:32:56Z
- **Completed:** 2026-01-25T18:34:05Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added ALWAYS-ESCALATE categories table with detection patterns
- Added RECOVERY ESCALATE output format for immediate user escalation
- Added Handling Escalation section in orchestrator with clear user messaging
- Ensured user always knows WHY AI is asking for help

## Task Commits

Each task was committed atomically:

1. **Task 1: Add escalation detection to recovery-agent.md** - `2adaea3` (feat)
2. **Task 2: Add escalation handling to orchestrate.md** - `e456fb9` (feat)

## Files Created/Modified

- `packages/arios-cli/templates/.claude/agents/recovery-agent.md` - Added Escalation Detection section with ALWAYS-ESCALATE categories and RECOVERY ESCALATE output format
- `packages/arios-cli/templates/.claude/commands/arios/orchestrate.md` - Added Handling Escalation section with user presentation and response handling

## Decisions Made

- Three ALWAYS-ESCALATE categories: ambiguous requirements, extreme destructive, external service
- RECOVERY ESCALATE skips retry loop entirely (no attempt counter increment)
- User always sees category-specific "Why I'm asking" explanation
- Minimal options: Retry, Skip, Abort (consistent with existing patterns)
- Escalations logged to debug.log after user responds

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Recovery system now has complete escalation classification
- Three categories (ambiguous, destructive, external) never auto-retry
- User always informed why AI needs help
- Ready for Phase 11: Smart Entry & Mode Detection

---
*Phase: 10-debug-recovery*
*Completed: 2026-01-25*
