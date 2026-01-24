# Phase 5: Execution Flow - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Execution adapts to complexity with testable checkpoints and user-chosen approach. Simple tasks execute in one wave; complex tasks break into phased waves. Execution pauses at testable checkpoints. User can choose ground-up, balanced (default), or UI-first approach. Checkpoint failures trigger debug subagent auto-fix before allowing continuation.

</domain>

<decisions>
## Implementation Decisions

### Complexity Detection
- Hybrid signals: combine plan count + task dependencies + estimated scope
- No user override — trust the detection (affects quality guarantees)
- Brief communication: "Detected: complex (3 waves)" — minimal, move on
- Claude's discretion on exact thresholds for simple vs complex

### Checkpoint Behavior
- Testable = app runs + tests pass (combination)
- On failure: auto-fix via debug subagent that writes a debug plan, executor runs it
- Retry limit: 2-3 attempts before hard stop
- After retries exhausted: stop with diagnostic output

### Approach Selection
- Offered at project start only
- User can change only by explicit request (not re-offered)
- Three approaches:
  - **Balanced** (default/best practice): interleave UI and logic as needed
  - **Ground-up**: Claude interprets per project domain
  - **UI-first**: mockup with stubs first, then wire real logic
- Approach stored in project config, persists across sessions

### Wave Execution
- Maximize parallelism, but only for truly independent work
- After parallel work completes: verify integration
  - First: automated checks (tests, type-check)
  - Then: integration subagent reviews for conflicts if needed
- If integration conflicts found:
  - Auto-resolve if straightforward
  - If complex: debug agent writes plan, executor runs it (same pattern as checkpoint failures)
- Minimal progress output in CLI — detailed visibility in task system UI (Phase 6)

### Claude's Discretion
- Exact complexity thresholds
- What "ground-up" means per project type
- Wave structure optimization per phase
- Verbosity adjustments based on context

</decisions>

<specifics>
## Specific Ideas

- Pattern reuse: debug subagent + plan + executor is the standard recovery flow (checkpoints AND integration conflicts)
- "Like GSD" — parallel agents get their work checked for compatibility after completion
- Task system UI (Phase 6) handles detailed progress; CLI stays minimal

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-execution-flow*
*Context gathered: 2026-01-24*
