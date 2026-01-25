# Phase 7: E2E Flow & Role Clarity - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete `/ideate` → `/plan` → `/execute` workflow functioning end-to-end. Clear separation between orchestrator, subagents, and skills. User-facing documentation for command usage. Implementation fixes first, documentation after verified working.

</domain>

<decisions>
## Implementation Decisions

### Stage transitions
- Explicit stage breaks — never auto-continue between /ideate, /plan, /execute
- Each stage ends with clear "next step" prompt: `▶ Next: /plan 7` with `/clear first → fresh context` as subtext
- Hard prerequisite check — /plan refuses if no CONTEXT.md, /execute refuses if no PLAN.md
- /arios (smart entry) shows menu and uses AskUserQuestion to offer resume option

### Role visibility
- Announce agent spawns with name + purpose: "Spawning researcher to investigate codebase patterns..."
- Orchestrator always announces when delegating vs doing something itself
- Subagent output stays internal (user sees via Ctrl+O if curious)
- Orchestrator summarizes subagent findings in compact, human-digestible format: "Research complete: found 3 patterns, 2 concerns. See RESEARCH.md"

### Error recovery
- Orchestrator retries failed subagents with adjusted context before escalating (3 attempts)
- Researcher leverages MCPs intelligently: Context7, Exa, Ref, Supabase MCP, etc. based on what's being researched
- Fallback to standard WebSearch and WebFetch if no relevant MCP
- Autonomous feel — contact user when needed, not for every decision
- On execution failure (e.g., checkpoint fails after 3 attempts): ask user immediately with options
- Error messages show technical detail + impact: what failed AND what it means for the workflow

### Documentation scope
- Implementation first, docs after verified working
- Both in-CLI help AND README sections
- In-CLI: brief with context hints (1-2 lines per command explaining when to use)
- README: user-focused with light "How it works" architecture section
- No dedicated docs/ folder — README is the single source

### Claude's Discretion
- Exact wording of stage completion prompts
- How to detect which MCP is relevant for a given research task
- README structure and section ordering
- Error message formatting

</decisions>

<specifics>
## Specific Ideas

- "Feeling should be autonomous in general" — don't flash user with everything
- "Intelligent routing" for research — use Supabase MCP for Supabase questions, codebase tools for codebase questions
- User sees orchestrator's summary, not raw subagent output
- /arios should feel like a friendly starting point that helps you pick up where you left off

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-e2e-flow-role-clarity*
*Context gathered: 2026-01-25*
