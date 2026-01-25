---
phase: 06-task-visibility
plan: 05
subsystem: ui
tags: [leader-line, svg, dependency-visualization, kanban]

# Dependency graph
requires:
  - phase: 06-02
    provides: Task parsing and SSE data structure with dependsOn field
  - phase: 06-03
    provides: CSS custom properties including accent color
  - phase: 06-04
    provides: Kanban view rendering with task cards
provides:
  - Leader-line dependency visualization module
  - Visual connection lines between dependent tasks
  - Line lifecycle management (clear on view switch, update on resize/scroll)
affects: [ui-enhancements, future-dashboard-features]

# Tech tracking
tech-stack:
  added: [leader-line@1.2.4]
  patterns: [debounced event handlers, requestAnimationFrame for layout-complete timing]

key-files:
  created:
    - packages/arios-dashboard/src/client/lines.js
  modified:
    - packages/arios-dashboard/src/client/index.html
    - packages/arios-dashboard/src/client/kanban.js
    - packages/arios-dashboard/src/client/app.js

key-decisions:
  - "Leader-line loaded via CDN script tag (browser-only library)"
  - "Lines drawn after requestAnimationFrame to ensure layout complete"
  - "Debounced resize (100ms) and scroll (50ms) handlers for performance"
  - "Lines cleared before view/tab switch, redrawn after render"

patterns-established:
  - "Debounce utility pattern for event handler throttling"
  - "requestAnimationFrame for post-render DOM operations"

# Metrics
duration: 2min
completed: 2026-01-25
---

# Phase 6 Plan 5: Dependency Lines Summary

**Leader-line SVG dependency visualization connecting task cards in Kanban view with fluid dashed lines**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-25T10:30:00Z
- **Completed:** 2026-01-25T10:32:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created lines.js module with clearLines, drawDependencyLines, updateLinePositions exports
- Integrated Leader-line library via CDN in index.html
- Lines render from dependency task to dependent task with styled appearance (fluid path, dashed, arrow endpoint)
- Lines update on resize/scroll and clear on view/tab switch

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement dependency line drawing** - `dcbb6d8` (feat)
2. **Task 2: Integrate lines into Kanban and app.js** - `76dffe6` (feat)

## Files Created/Modified
- `packages/arios-dashboard/src/client/lines.js` - Leader-line dependency visualization module with clearLines, drawDependencyLines, updateLinePositions
- `packages/arios-dashboard/src/client/index.html` - Added Leader-line CDN script tag
- `packages/arios-dashboard/src/client/kanban.js` - Import lines.js and call drawDependencyLines after render
- `packages/arios-dashboard/src/client/app.js` - Line lifecycle management (clear, update, debounce utility)

## Decisions Made
- Leader-line loaded via CDN (browser-only library, cannot be imported as ESM module)
- Use requestAnimationFrame to draw lines after DOM layout is complete
- Debounce resize at 100ms, scroll at 50ms for performance without lag
- Lines only drawn when Kanban board is visible (not in List view)

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dependency lines functional in Kanban view
- Ready for next plan (06-06 or 06-07)

---
*Phase: 06-task-visibility*
*Completed: 2026-01-25*
