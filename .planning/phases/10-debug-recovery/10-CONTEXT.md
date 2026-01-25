# Phase 10: Debug & Recovery - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

System recovers from errors gracefully with user-appropriate escalation. State integrity checks catch corruption/drift before execution. Self-correction attempts fixes before asking user. Error messages are plain language with clear action options.

</domain>

<decisions>
## Implementation Decisions

### Integrity Checks
- Run before each phase (at /execute initiation), not between waves
- Check for: file mismatch (STATE.md references missing files), progress drift (STATE.md disagrees with plan completion)
- Schema violations are NOT checked (Claude handles malformed YAML gracefully)
- Auto-fix issues when possible, only surface what can't be repaired
- Brief mention when auto-fixing: "Fixed STATE.md drift" as one-liner, then continue

### Self-Correction Behavior
- Auto-retry on both build/test failures AND verification gaps (stub detected, etc.)
- 3 attempts maximum before escalating to user
- Progress indicator during retries: "Fixing issue (attempt 2/3)..."
- Fresh agent spawn for each retry attempt — avoids compounding bad assumptions
- When 3 attempts fail: show detailed diagnosis (what went wrong, what was tried, recommendations) before asking user

### Escalation Triggers
- ALWAYS escalate (never auto-retry):
  - Ambiguous requirements (Claude unsure what user wants)
  - Extreme destructive actions (drop database, delete critical files)
  - External service issues (API auth, rate limits, network)
- Minor destructive actions (overwriting files) are OK without asking
- Single urgency level — all escalations presented the same way, no confusing severity tiers
- Minimal action options: just "Retry" and "Skip" — keep choices simple
- If user skips: ask how to proceed with downstream dependencies (don't auto-cascade or blindly continue)

### Error Presentation
- Contextual verbosity: what failed + why + what it affects, then options
- Technical details (stack traces) hidden by default — plain language summary only
- Error log: append to `.planning/debug.log` with timestamp and summary

### Claude's Discretion
- Error message tone (neutral vs reassuring) — pick what fits context
- How to phrase "what it affects" — adapt to the specific failure
- Debug log format details

</decisions>

<specifics>
## Specific Ideas

- "Fixing issue (attempt 2/3)..." — progress indicator pattern
- Fresh spawn philosophy: "avoids compounding bad assumptions from previous attempt"
- Keep escalation options minimal — user shouldn't face complex choices when things break

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-debug-recovery*
*Context gathered: 2026-01-25*
