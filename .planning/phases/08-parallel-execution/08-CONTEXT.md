# Phase 8: Parallel Execution - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Wave-based parallel execution within the ARIOS orchestration system. Waves (not individual tasks) can run in parallel when independent. Each wave has its own executor agent that runs its tasks sequentially. The orchestrating executor coordinates wave-executors and monitors their progress.

**Hierarchy clarification:**
- Phase → Waves → Tasks
- Parallelism happens at the **wave level**, not task level
- Wave A and Wave B can run in parallel if they have no dependencies
- Within each wave, tasks execute sequentially by that wave's executor agent
- "Up to 8 concurrent" means up to 8 wave-executors running in parallel

</domain>

<decisions>
## Implementation Decisions

### Progress Visibility
- Dashboard is the primary view for monitoring parallel execution
- Claude Code chat gets minimal announcements only
- Wave start: Single line — "Starting wave 2 (4 tasks)"
- Wave complete: Summary with counts — "Wave 2 complete: 4/4 tasks passed"
- No auto-open dashboard — just post the link, user clicks if they want it
- Dashboard server must be running for link to work (orchestrator ensures this)

### Failure Handling
- If one task fails mid-wave: let sibling tasks finish (collect all results)
- Rationale: Tasks in same wave are independent by definition (wave structure encodes dependencies)
- Auto-retry failed tasks up to 3 times before asking user
- After 3 failed retries: prompt user — "Task D failed 3x: [error]. Debug / Skip / Abort?"
- Skip option available only if no downstream tasks depend on the failed one
- Dependency check determines whether skip is offered

### Wave Transitions
- Verification runs between waves but is silent unless it finds issues
- If verification finds issues: auto-fix attempt via recovery agent, block only if fix fails
- Single "recovery agent" handles both task failures AND verification issues (not separate agents)
- Rationale: Same core pattern — something went wrong, diagnose, fix
- Waves auto-continue without pause — flow automatically until checkpoint or failure

### Concurrency / Wave Parallelism
- Planner determines which waves can run in parallel (marks it in PLAN.md)
- Planner has the whole picture of phase, project, and wave contents
- Orchestrator relies on plan but can override if it sees a problem
- If orchestrator has doubts about parallel marking: fall back to sequential (safer)
- No user prompt for override decision — orchestrator decides conservatively

### Claude's Discretion
- Exact format of wave parallelism marking in PLAN.md
- How orchestrator detects "doubt" about parallel safety
- Recovery agent implementation details
- Dashboard server startup coordination

</decisions>

<specifics>
## Specific Ideas

- "The system has to decide intelligently what can run parallel and what has to be in a normal chain"
- "If he has doubts he can still decide, but usually he is relying on the plan"
- Wave executor model: one executor agent per wave, doing its tasks sequentially, orchestrated from above

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-parallel-execution*
*Context gathered: 2026-01-25*
