# Phase 6: Task Visibility - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Real-time visibility into task execution through an HTML dashboard. The dashboard displays task status from Claude Code's Task system and shows roadmap progress. Read-only visualization — all control stays in CLI.

</domain>

<decisions>
## Implementation Decisions

### Dashboard Structure
- Sidebar navigation with tabs: Roadmap, Tasks
- Sidebar is collapsible for more content space
- Modern/minimal visual style (Linear-inspired: clean, whitespace, subtle accents)
- Balanced information density with click-to-expand for details

### Real-time Updates
- File-watching approach — observe Claude Code's task files in .planning
- Subtle visual feedback when data changes (brief highlight, fades out)
- Small connection status indicator for file-watch health
- No manual refresh button — fully automatic updates

### Task Representation
- Dual view: switchable between Kanban (columns by status) and List view
- Standard info per task: name, status, owner, dependencies
- Dependencies shown as connecting lines between related tasks
- Progress displayed as progress bar

### Roadmap View
- Parse and render ROADMAP.md in clean, readable format
- Visual representation of phase completion status

### User Interaction
- Read-only dashboard — control stays in CLI to avoid sync issues
- Click-to-expand for full task details (description, logs, output)
- Log/output display for tasks within expanded view
- No keyboard shortcuts — mouse-only interaction

### Claude's Discretion
- Exact file-watching implementation details
- Connecting line rendering approach (SVG, CSS, etc.)
- Specific color palette within modern/minimal theme
- How to parse and display ROADMAP.md attractively

</decisions>

<specifics>
## Specific Ideas

- "Kanban oder Liste" — user wants both with toggle
- "Linear-Style" mentioned as reference for clean, modern aesthetic
- Task files from Claude Code's Task system should be the data source
- Roadmap parsing should make it "look good" — not just raw markdown

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-task-visibility*
*Context gathered: 2026-01-25*
