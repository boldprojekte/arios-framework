# Phase 4: State Management - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Project context persists across sessions enabling seamless continuation. User can resume exactly where they left off without re-explaining context. State includes phase position, decisions made, and accumulated context.

**Reference inspiration:** GSD's state management patterns — learn from battle-tested approaches, improve with ARIOS-specific needs.

</domain>

<decisions>
## Implementation Decisions

### Resume Experience
- Discussion/conversation state is ephemeral — OK to lose on session end
- Active coding work tracked via Claude's task system, not ARIOS state
- On resume: show status + suggest next action
- Agent internally loads full context when proceeding with work
- Bot treats all sessions the same regardless of time gap — user asks for refresher if needed

### State Boundaries
- Ideation decisions: Persist ALL with reasoning (planner needs the "why")
- Execution decisions: Less critical to persist (task tool handles work state)
- Partial work: Tracked by Claude's task system, not duplicated in ARIOS state
- User preferences: Store in separate config location, not mixed with project state
- Negative decisions: Explicitly tracked — as important as positive ones, prevents re-suggesting rejected ideas

### Session Transitions
- `/arios` detects resume vs fresh start and adapts behavior accordingly
- Status display: Mini table + brief text (not verbose paragraphs)
- Suggestions: Offer choice ("Continue with X, or do something else?") — not assertive
- Manual override: Warn about state implications, then comply if user insists

### State Conflicts
- Never auto-fix or block silently when state doesn't match reality
- Ask user what happened — changes may be intentional
- Dedicated recovery slash command to resync state
- Collaborative approach: ARIOS proposes fix, user confirms

### Claude's Discretion
- Exact state file format and structure
- Technical implementation of state diffing/conflict detection
- Specific recovery algorithm internals
- Performance optimizations for state loading

</decisions>

<specifics>
## Specific Ideas

- Learn from GSD's state patterns (STATE.md, RESUME.md approach) — adopt what works, improve what doesn't
- State should enable agents to work autonomously without re-asking user for already-decided things
- Recovery flow should feel collaborative, not accusatory ("Something changed" not "You broke it")

</specifics>

<deferred>
## Deferred Ideas

- `/arios:recover` slash command for state resync — implement as part of this phase or add to backlog depending on scope
- Multi-user state handling (if multiple people work on same project) — future consideration

</deferred>

---

*Phase: 04-state-management*
*Context gathered: 2026-01-24*
