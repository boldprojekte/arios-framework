# Phase 12: State & Dashboard Polish - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Mode-aware session resume, state validation before execution, and dashboard interactivity. Users can resume where they left off, state drift is detected and handled, and dashboard allows viewing task details and adding notes.

</domain>

<decisions>
## Implementation Decisions

### Session Resume UX
- Action-first presentation — show quick action buttons, context available if user wants it
- Minimal context display — phase name + last completed task only (keep it fast)
- Auto-continue interrupted tasks — agent verifies what was completed before proceeding
- No manual "restart vs skip" prompt — agent figures out state and continues

### State Validation Behavior
- Validation runs before each /execute (not on resume)
- Drift = file changes OR state/file mismatch (state claims progress that files don't show)
- Auto-fix metadata silently (timestamps, checksums)
- Prompt for structural issues with options: Fix it / Reset state / Abort
- User always sees what drifted before choosing action

### Dashboard Interactions
- Slide-out panel from right when clicking task
- Main view compresses (doesn't overlay)
- Panel width is resizable
- Width persists while panel is open (not across sessions)
- Available actions: View task details, Mark complete, Add note
- Notes written to state file — Claude reads on next action
- Status updates only (no streaming logs) — execution output stays in CLI

### Mode-Specific State
- Feature-Mode gets full tracking (same as Project-Mode, minus roadmap/phases)
- Separate folder structure: `.planning/features/feature-{name}/STATE.md`
- Feature state archives to `.planning/archive/feature-{name}/` on completion
- Multiple features can be active at once — user switches between them

### Claude's Discretion
- Exact slide-out panel animations and styling
- How to display drift details (list vs diff view)
- Feature switching UI/command design
- Note format in state files

</decisions>

<specifics>
## Specific Ideas

- "Notes are very valuable to give more context to you" — notes from dashboard should be easy to add and clearly visible to Claude
- Auto-continue philosophy: agent checks what was done and where it can continue, no user prompt needed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-state-dashboard-polish*
*Context gathered: 2026-01-25*
