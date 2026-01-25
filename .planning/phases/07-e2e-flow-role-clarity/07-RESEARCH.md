# Phase 7: E2E Flow & Role Clarity - Research

**Researched:** 2026-01-25
**Domain:** End-to-end workflow orchestration, role separation, error recovery, documentation
**Confidence:** HIGH

## Summary

This phase ensures the complete `/ideate` → `/plan` → `/execute` workflow functions end-to-end with clear separation between stages and roles. The research focuses on four key areas: stage transition patterns with explicit breaks, role visibility for orchestrator and subagent operations, intelligent error recovery with retry logic, and user-facing documentation.

The codebase already has solid foundations from v1.0. The main implementation work involves:
1. **Stage transitions**: Adding prerequisite checks and explicit "next step" prompts
2. **Role visibility**: Announcing agent spawns with purpose and summarizing results
3. **Error recovery**: Adding retry logic (3 attempts) with intelligent escalation
4. **Documentation**: In-CLI help enhancements and README updates

**Primary recommendation:** Implement explicit stage boundaries with prerequisite checks, enhance orchestrator to announce delegations and summarize subagent results, and add documentation after verifying workflow functions correctly.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| gray-matter | 4.x | Parse YAML frontmatter from Markdown | Already in project, de facto standard |
| Claude Code Task tool | Built-in | Subagent spawning and coordination | Native Claude Code, already in use |
| fs-extra | 11.x | File operations | Already in project stack |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Claude Code MCP Tool Search | Built-in | Intelligent MCP routing | When researching with MCPs |
| AskUserQuestion | Built-in | Structured user prompts | For stage completion prompts, resume options |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| File-based prerequisite checks | In-memory state | Files are persistent, survive /clear |
| Manual MCP routing | MCP Tool Search | Tool Search is automatic as of 2026 |

**Installation:**
```bash
# No new dependencies required - all tools already available
```

## Architecture Patterns

### Recommended Orchestration Flow

```
User runs /arios
    │
    ├── /arios detects state (resume flow or fresh)
    │   └── If resume: AskUserQuestion for confirmation
    │
    └── User chooses /ideate
        │
        ├── Stage: /ideate
        │   └── Orchestrator spawns researcher (announces: "Spawning researcher...")
        │   └── Researcher writes CONTEXT.md
        │   └── Orchestrator summarizes: "Research complete: N findings. See CONTEXT.md"
        │   └── Exit prompt: "▶ Next: /plan 7" + "(/clear first → fresh context)"
        │
        ├── Stage: /plan (prerequisite: CONTEXT.md exists)
        │   └── Checks prerequisite → refuses if no CONTEXT.md
        │   └── Orchestrator spawns planner (announces purpose)
        │   └── Planner writes PLAN.md, creates Tasks
        │   └── Exit prompt: "▶ Next: /execute 7"
        │
        └── Stage: /execute (prerequisite: PLAN.md exists)
            └── Checks prerequisite → refuses if no PLAN.md
            └── Orchestrator spawns executor(s) (announces purpose)
            └── Wave execution with checkpoints
            └── Exit prompt: "▶ Phase complete"
```

### Pattern 1: Explicit Stage Boundaries

**What:** Hard prerequisite checks and explicit stage completion prompts.

**When to use:** At every stage transition.

**Implementation:**
```typescript
// Stage prerequisite check pattern
const prerequisiteCheck = {
  '/ideate': null, // No prerequisite - can always ideate
  '/plan': 'CONTEXT.md', // Requires ideation context
  '/execute': 'PLAN.md' // Requires plan
};

// Check before proceeding
function checkPrerequisite(stage: string, phaseDir: string): boolean {
  const required = prerequisiteCheck[stage];
  if (!required) return true;

  const path = `${phaseDir}/${required}`;
  return fs.existsSync(path);
}
```

**Stage completion prompt pattern:**
```markdown
---

✓ Ideation complete

▶ Next: `/plan 7`

_Tip: Run `/clear` first for fresh context_

---
```

### Pattern 2: Orchestrator Role Visibility

**What:** Orchestrator announces every delegation and summarizes all subagent results.

**When to use:** Every time orchestrator spawns or receives from subagent.

**Announcement pattern:**
```markdown
## Spawning Researcher

Delegating to researcher agent to investigate: {topic}
- Purpose: {what researcher will do}
- Output: {where findings will be written}

[Subagent output stays internal - user sees via Ctrl+O if curious]
```

**Summary pattern:**
```markdown
## Research Complete

Found: 3 patterns, 2 concerns
Confidence: HIGH

Key findings:
- {finding 1 - one line}
- {finding 2 - one line}

Full details: `.planning/phases/07/.../RESEARCH.md`
```

### Pattern 3: Intelligent Error Recovery (3-Attempt Pattern)

**What:** Orchestrator retries failed subagents with adjusted context before escalating to user.

**When to use:** When subagent fails or checkpoint fails.

**Implementation flow:**
```
Attempt 1: Initial execution
    ↓ fail
Attempt 2: Retry with enhanced context ("Previous attempt failed because...")
    ↓ fail
Attempt 3: Retry with different approach ("Trying alternative...")
    ↓ fail
Escalate: Ask user with options
    "Recovery exhausted. Options: retry (r), skip (s), abort (a)"
```

**Error message format:**
```markdown
## Checkpoint Failed

**What failed:** Tests - 3 failures in auth.test.ts
**Impact:** Cannot proceed to next wave (Wave 2 depends on auth)

**Recovery:** Attempt 1/3
Spawning debug agent to diagnose...

[If all attempts fail:]

**Recovery exhausted** (3/3 attempts)

Last error:
```
TypeError: Cannot read property 'user' of undefined
  at AuthService.validate (auth.service.ts:42)
```

Options:
- `retry` (r) - Reset and try recovery again
- `skip` (s) - Continue anyway (not recommended)
- `abort` (a) - Stop execution, preserve state
```

### Pattern 4: MCP-Aware Research Routing

**What:** Researcher leverages appropriate MCPs based on research topic.

**When to use:** During /ideate research phase.

**Routing logic:**
```typescript
// Research topic → MCP mapping (Claude's discretion on implementation)
const mcpRouting = {
  'supabase': 'mcp__supabase__',
  'database': 'mcp__supabase__',
  'auth': 'mcp__supabase__',
  'documentation': 'mcp__context7__',
  'library': 'mcp__context7__',
  'framework': 'mcp__context7__',
  'external API': 'WebSearch + WebFetch',
  'codebase': 'Grep, Glob, Read tools'
};
```

**Fallback chain:**
1. Try relevant MCP if available
2. Fall back to WebSearch + WebFetch for external knowledge
3. Use codebase tools (Grep, Glob, Read) for local patterns

### Pattern 5: Greenfield vs Brownfield Adaptation

**What:** Same commands produce appropriate behavior based on project type.

**When to use:** Automatically on every command.

**Brownfield adaptations:**
- `/ideate` explores existing codebase before external research
- `/plan` uses detected patterns from existing code
- `/execute` matches code style to existing patterns

**Greenfield adaptations:**
- `/ideate` focuses on external research and architecture
- `/plan` creates foundational structure
- `/execute` uses sensible defaults for code style

### Anti-Patterns to Avoid

- **Auto-continue between stages:** Never automatically move from /ideate to /plan. Always pause for explicit user action.
- **Orchestrator doing heavy work:** Orchestrator only spawns, waits, integrates. Never writes implementation code directly.
- **Raw subagent output to user:** User sees orchestrator's summary. Subagent details stay internal (Ctrl+O for curious users).
- **Immediate escalation on failure:** Always try 3 automatic recovery attempts before asking user.
- **Ignoring existing patterns:** In brownfield projects, always extract and follow existing code patterns.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Stage prerequisite checks | Complex state machine | File existence checks | Simple, persistent, debuggable |
| MCP tool discovery | Manual routing logic | MCP Tool Search (built-in) | Automatic 85% token savings |
| User prompting | Custom input handling | AskUserQuestion tool | Native Claude Code, structured responses |
| Subagent spawning | Shell scripts | Task tool | Native, parallel support, context isolation |
| Resume detection | Complex state parsing | STATE.md YAML frontmatter | Human-readable, version-controlled |

**Key insight:** Claude Code 2026 provides most orchestration infrastructure. Leverage it.

## Common Pitfalls

### Pitfall 1: Context Pollution from Verbose Subagent Output

**What goes wrong:** Subagent returns full research findings to orchestrator, filling context with details that don't help coordination.

**Why it happens:** Assuming orchestrator needs all details to route correctly.

**How to avoid:**
- Subagents return structured summary (5-10 lines max)
- Full findings written to files
- Orchestrator reads files only when needed

**Warning signs:** Main context > 50% full after single research cycle, "I'm running low on context" messages.

### Pitfall 2: Silent Stage Transitions

**What goes wrong:** User doesn't realize they're in a new stage, gets confused about what happened.

**Why it happens:** Trying to be "seamless" ends up being invisible.

**How to avoid:**
- Clear stage completion prompts with visual breaks
- Explicit "Next:" suggestions
- Never auto-advance between stages

**Warning signs:** User asks "what just happened?", "where am I now?", or runs commands out of sequence.

### Pitfall 3: Escalating Too Early or Too Late

**What goes wrong:** Either user is bothered with every minor issue, or issues compound until system is stuck.

**Why it happens:** No clear escalation policy.

**How to avoid:**
- 3-attempt automatic recovery before escalation
- Clear escalation triggers: "After 3 attempts, ask user with options"
- Error messages show impact, not just technical details

**Warning signs:** User says "why is it asking me this?" (too early) or "why didn't you tell me sooner?" (too late).

### Pitfall 4: Greenfield Treated Like Brownfield

**What goes wrong:** System tries to analyze patterns in empty codebase, fails or produces nonsense.

**Why it happens:** Assuming code always exists.

**How to avoid:**
- Detect project type early (find command in /arios)
- Skip pattern extraction for greenfield
- Use sensible defaults instead

**Warning signs:** Errors about "no files found", analysis returning empty results, spending time on non-existent patterns.

### Pitfall 5: Documentation Before Verification

**What goes wrong:** Docs describe intended behavior, not actual behavior. Confuses users.

**Why it happens:** Trying to document during development.

**How to avoid:**
- CONTEXT decision: "Implementation first, docs after verified working"
- Test workflow manually before documenting
- Update docs when behavior is confirmed

**Warning signs:** Docs don't match actual behavior, users report "it doesn't work like the docs say".

## Code Examples

Verified patterns based on CONTEXT.md decisions and existing codebase.

### Stage Completion Prompt

```markdown
<!-- In /ideate command -->
## Stage Complete

✓ Ideation complete for Phase 7: E2E Flow & Role Clarity

### Summary
- Explored: {topic}
- Confidence: {HIGH/MEDIUM/LOW}
- Findings: `.planning/phases/07-e2e-flow-role-clarity/CONTEXT.md`

---

▶ **Next:** `/plan 7`

_Tip: Run `/clear` first for fresh context_

---
```

### Prerequisite Check (in /plan command)

```markdown
<!-- /plan command prerequisite check -->

## Instructions

1. Check for CONTEXT.md:
   - Path: `.planning/phases/{phase-folder}/*-CONTEXT.md`
   - If exists: Proceed with planning
   - If missing: Show message and refuse

### If CONTEXT.md Missing

Display:
```
## Cannot Plan

No ideation context found for this phase.

Expected: `.planning/phases/07-e2e-flow-role-clarity/07-CONTEXT.md`

▶ **Run first:** `/ideate`

Planning requires ideation findings as input.
```

Wait for user to run /ideate - do NOT proceed.
```

### Orchestrator Announcement Pattern

```markdown
<!-- In orchestrator when spawning -->

## Delegating to Researcher

**Purpose:** Investigate codebase patterns for E2E workflow
**Scope:** Existing slash commands, agent files, handoff patterns
**Output:** `.planning/phases/07-e2e-flow-role-clarity/07-RESEARCH.md`

Spawning researcher agent...

---

<!-- After researcher returns -->

## Research Complete

**Status:** Success
**Findings:** 4 patterns identified, 2 gaps discovered
**Confidence:** HIGH

Key insights:
- Stage commands exist but lack prerequisite checks
- Orchestrator spawns agents but doesn't announce purpose
- Error recovery is ad-hoc, needs 3-attempt pattern
- Documentation is minimal, needs expansion

Full details: `07-RESEARCH.md`

---
```

### Error Recovery Flow

```markdown
<!-- In orchestrator checkpoint handling -->

## Checkpoint Failed

**Wave:** 2
**What failed:** Tests - 3 assertions failed
**Files affected:** `src/auth/auth.service.ts`, `src/auth/auth.test.ts`

### Recovery Attempt 1/3

Spawning debug agent with context:
- Error output from failed tests
- Recent changes (git diff)
- Related files

---

<!-- After debug agent returns -->

### Recovery Attempt 1: Fixed

**Fix applied:** Added null check for user object
**Commit:** `fix(07): handle undefined user in auth service`

Re-running checkpoint verification...

---

<!-- If checkpoint passes -->

### Checkpoint Passed

Wave 2 verification successful after recovery.

Proceeding to Wave 3...

---

<!-- If all 3 attempts fail -->

### Recovery Exhausted (3/3)

All automatic recovery attempts failed.

**Last error:**
```
TypeError: Cannot read property 'id' of null
  at AuthService.validateToken (auth.service.ts:67)
```

**Recovery history:**
1. Added null check → still fails (different error)
2. Fixed token parsing → still fails (auth config issue)
3. Reset auth config → still fails (root cause unclear)

**Options:**
- `retry` (r) - Reset counter, try recovery again
- `skip` (s) - Continue to next wave (issues may compound)
- `abort` (a) - Stop execution, preserve state for manual fix

Your choice:
```

### /arios Smart Entry with Resume

```markdown
<!-- /arios command with resume detection -->

## Resume Detection

Read STATE.md and parse frontmatter:
- phase: 7
- planIndex: 2
- status: "in-progress"
- lastActivity: "2026-01-25T14:30:00Z"

### If Valid State

Use AskUserQuestion to offer resume:

"Welcome back! You were working on:

| Phase | Plan | Status |
|-------|------|--------|
| 7/11  | 2/3  | in-progress |

**Phase 7:** E2E Flow & Role Clarity
**Last action:** Executing plan 2, wave 1 complete

Options:
1. **Continue** - Resume from Wave 2
2. **Status** - See full project status
3. **Other** - Start fresh or different action

Your choice:"
```

### In-CLI Help Enhancement

```markdown
<!-- Enhanced /arios:help report -->

## ARIOS Commands

### Workflow (in order)

| Command | Purpose | Prerequisites |
|---------|---------|---------------|
| `/ideate` | Explore ideas, clarify requirements | None (can run anytime) |
| `/plan` | Create execution plan from ideation | Requires CONTEXT.md |
| `/execute` | Build from plan, wave by wave | Requires PLAN.md |

### Entry Points

| Command | When to Use |
|---------|-------------|
| `/arios` | Start here - detects state, suggests next action |
| `/arios:status` | Check current position anytime |
| `/arios:help` | This reference |

### Typical Flow

```
/arios → detects fresh project
  ↓
/ideate → explore what to build
  ↓ (creates CONTEXT.md)
/plan → structure the approach
  ↓ (creates PLAN.md + Tasks)
/execute → build it wave by wave
  ↓ (checkpoints verify each wave)
Done!
```

### Subagents (spawned automatically)

ARIOS uses specialized agents for heavy work:

| Agent | Purpose | When Used |
|-------|---------|-----------|
| Researcher | Investigate external knowledge | /ideate for external research |
| Planner | Create structured plans | /plan |
| Executor | Implement tasks | /execute |

You see orchestrator summaries. Full details via Ctrl+O.

### Tips

- Run `/clear` between stages for fresh context
- `/ideate` works anytime, not just for new projects
- Checkpoints verify each wave before proceeding
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Auto-continue between stages | Explicit stage boundaries | 2026 | Users maintain control |
| Raw subagent output | Orchestrator summaries | 2025-2026 | Cleaner UX |
| Immediate escalation | 3-attempt recovery | 2025 | Less user interruption |
| One model for everything | MCP-aware routing | 2026 | Right tool for right job |
| Preload all MCP tools | MCP Tool Search | Jan 2026 | 85% token savings |

**Deprecated/outdated:**
- Automatic stage transitions without user confirmation
- Showing raw subagent output (keep internal)
- Single-attempt failure handling (always try 3x)

## Open Questions

Things that couldn't be fully resolved:

1. **Exact wording of stage completion prompts**
   - What we know: Should be clear, include "Next:" suggestion
   - What's unclear: Exact formatting, tone, emoji usage
   - Recommendation: Claude's discretion per CONTEXT.md

2. **MCP routing specifics**
   - What we know: Use relevant MCPs based on research topic
   - What's unclear: Exact detection logic for "which MCP fits this question"
   - Recommendation: Claude's discretion, MCP Tool Search helps automatically

3. **README structure**
   - What we know: User-focused, light architecture section, no separate docs folder
   - What's unclear: Exact section ordering, depth of detail
   - Recommendation: Create after implementation verified, Claude's discretion on structure

## Sources

### Primary (HIGH confidence)

- Existing codebase: `/packages/arios-cli/templates/.claude/` - Current command and agent implementations
- `.planning/research/ORCHESTRATION.md` - Prior research on orchestration patterns
- `.planning/research/CAPABILITIES.md` - Claude Code capabilities research
- `.planning/phases/07-e2e-flow-role-clarity/07-CONTEXT.md` - User decisions for this phase
- [Claude Code Subagent Docs](https://code.claude.com/docs/en/sub-agents) - Official documentation
- [MCP Tool Search announcement](https://medium.com/@joe.njenga/claude-code-just-cut-mcp-context-bloat-by-46-9-51k-tokens-down-to-8-5k-with-new-tool-search-ddf9e905f734) - 2026 feature

### Secondary (MEDIUM confidence)

- [Azure AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns) - Industry patterns
- [Deloitte AI Agent Orchestration](https://www.deloitte.com/us/en/insights/industry/technology/technology-media-and-telecom-predictions/2026/ai-agent-orchestration.html) - Enterprise practices
- [Multi-Agent Orchestration patterns](https://github.com/wshobson/agents) - Community implementations

### Tertiary (LOW confidence)

- General web search results on orchestration patterns - For context only

## Metadata

**Confidence breakdown:**
- Stage transition patterns: HIGH - Based on CONTEXT.md decisions and existing codebase
- Role visibility: HIGH - Clear requirements from CONTEXT.md
- Error recovery: HIGH - Industry-standard 3-attempt pattern, verified in GSD
- Documentation: MEDIUM - Will be refined during implementation

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable patterns, minimal external dependencies)
