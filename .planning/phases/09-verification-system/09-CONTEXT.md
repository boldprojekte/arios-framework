# Phase 9: Verification System - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Automatic verification that catches issues after each wave before they compound. Verifier agent checks work, reports to orchestrator (not user), enables auto-repair cycle. User only sees results when auto-repair exhausted or at phase-end checkpoints.

Key insight: Verifier communicates with orchestrator/executor, NOT directly with user. It provides enough context for recovery agent to fix issues autonomously.

</domain>

<decisions>
## Implementation Decisions

### Verification Triggers
- Claude decides when to run verification based on wave complexity
- Uses configured npm scripts (test, build, lint) when available
- Fallback: syntax check if no scripts configured (code must parse)
- 5-minute timeout for verification runs

### Code Review (Critical for Parallel Execution)
- Context-aware review: changed files + adjacent files that could be affected
- After parallel waves: verifier gets aggregated diff from ALL parallel executors
- Checks: import/export consistency, type compatibility, semantic coherence
- Verifier must understand combined changes, not just individual diffs

### Failure Handling
- Auto-repair first: spawn recovery agent with full error context
- 3 retry attempts before escalating to user
- User sees short summary on escalation (not full technical dump)
- Skip allowed ONLY if downstream waves don't depend on failed wave

### Verifier Output Format
- Returns to orchestrator with enough info to spawn targeted recovery
- Includes: what failed, where, what was attempted, suggested fix direction
- Orchestrator decides: spawn recovery or escalate to user

### Human Review Triggers
- At phase end: user reviews and tests what was built
- When auto-repair exhausted (3 attempts failed)

### Human Review Experience
- Summary of what was built and what works
- Concrete test instructions: what to test, how to test, what to expect
- Test instruction detail adapts to feature complexity
- Chat-based feedback: user can ask questions, report issues
- If issues reported: new repair cycle, then re-test

### Claude's Discretion
- What counts as "related code" for integration checks
- How detailed test instructions should be per feature
- When to be conservative vs pragmatic on edge-case conflicts
- Verification timing based on wave complexity

</decisions>

<specifics>
## Specific Ideas

- "Der Verifier soll ja gar nicht dem User groß viel sagen — er kommuniziert ja nicht mit dem User" — verifier is internal, reports to orchestrator
- "Bei parallelen Sachen wo der eine nicht weiß was der andere gemacht hat" — critical to aggregate parallel diffs for combined review
- "Wenn der Nutzer was testen soll die Anweisung was genau" — explicit test instructions, not vague "check if it works"
- Verification is part of the execution loop, not a user-facing step

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-verification-system*
*Context gathered: 2026-01-25*
