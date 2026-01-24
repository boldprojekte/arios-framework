# Phase 2: Subagent System - Research

**Researched:** 2026-01-24
**Domain:** Claude Code subagent architecture, orchestrator patterns, structured handoff protocols
**Confidence:** HIGH

## Summary

This phase implements ARIOS's subagent system: an orchestrator that spawns specialized agents (Researcher, Planner, Executor) which persist findings to files for consumption. The research covers Claude Code's native Task system for spawning subagents, the agent prompt file format (YAML frontmatter + Markdown), handoff protocols for structured result passing, and integration with Claude Code's Task persistence system.

The key technical discoveries:

1. **Claude Code supports custom subagents** via `.claude/agents/` directory with Markdown files containing YAML frontmatter. Subagents receive fresh context windows and return results to the orchestrator.

2. **Task persistence is stable** via `CLAUDE_CODE_TASK_LIST_ID` in `.claude/settings.json`. Tasks survive `/clear` and are stored in `~/.claude/tasks/{task-list-id}/`.

3. **Subagents cannot spawn subagents** - this is a system constraint. The orchestrator must handle all subagent coordination from the main conversation.

4. **Handoff via files** is the proven pattern for persisting subagent findings. Subagents write structured Markdown with YAML frontmatter; orchestrators read on completion.

**Primary recommendation:** Implement three custom subagents (researcher.md, planner.md, executor.md) in `.claude/agents/`, each producing versioned findings files in `.arios/` with YAML frontmatter for metadata. Planner writes Claude Tasks directly.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| gray-matter | 4.x | Parse YAML frontmatter from Markdown | De facto standard (12M+ weekly downloads), used by Gatsby, VitePress, Astro |
| Claude Code Task System | Built-in | Task persistence and subagent spawning | Native feature, no external deps |
| fs-extra | 11.x | File operations | Already in Phase 1 stack |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| yaml | 2.x | YAML parsing/serialization | If gray-matter insufficient for complex YAML |
| date-fns | 4.x | Timestamp formatting | For versioned file naming |
| zod | 3.x | Schema validation | Validate handoff file structure |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| gray-matter | front-matter | Lighter but less featured, gray-matter is battle-tested |
| YAML frontmatter | JSON files | Frontmatter is human-readable and matches Claude Code agent format |
| File-based handoffs | Task comments | Files survive `/clear`, comments may not |

**Installation:**
```bash
npm install gray-matter
# Optional if needed:
npm install zod date-fns
```

## Architecture Patterns

### Recommended Project Structure

```
project/
├── .claude/
│   ├── settings.json          # Contains CLAUDE_CODE_TASK_LIST_ID
│   └── agents/                # Custom subagent prompts
│       ├── researcher.md      # Research subagent
│       ├── planner.md         # Planning subagent (writes Tasks)
│       └── executor.md        # Execution subagent
│
└── .arios/
    ├── STATE.md               # Global state: active roadmap, phase
    ├── config.json            # ARIOS settings
    └── roadmaps/
        └── v1-current/
            └── phases/
                └── 02-subagent-system/
                    ├── 02-STATE.md           # Phase index
                    ├── researcher/
                    │   └── findings-001.md   # Versioned findings
                    ├── planner/
                    │   └── plan-001.md       # Versioned plans
                    └── problems/
                        └── problem-{timestamp}.md
```

### Pattern 1: Subagent Prompt Files

**What:** Custom subagents defined as Markdown files with YAML frontmatter in `.claude/agents/`.

**When to use:** All ARIOS subagents.

**Format:**
```markdown
---
name: researcher
description: Researches implementation approaches. Spawned by orchestrator when domain is unclear or requires current documentation.
tools: Read, Grep, Glob, Bash, WebSearch, WebFetch
model: inherit
---

<role>
You are an ARIOS researcher. You investigate implementation approaches
and document findings for the planner to consume.
</role>

<input>
Research prompt from orchestrator with:
- Topic/question to research
- Context about the phase
- Specific areas to investigate
</input>

<output>
Write findings to: `.arios/roadmaps/{roadmap}/phases/{phase}/researcher/findings-{version}.md`
</output>
```

**Key fields (from official docs):**

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique identifier (lowercase, hyphens) |
| `description` | Yes | When Claude should delegate to this subagent |
| `tools` | No | Tools available (inherits all if omitted) |
| `model` | No | `sonnet`, `opus`, `haiku`, or `inherit` (default: inherit) |
| `permissionMode` | No | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` |
| `skills` | No | Skills to preload into context |
| `hooks` | No | Lifecycle hooks for this subagent |

### Pattern 2: Orchestrator-Worker Pattern

**What:** Lean orchestrator spawns specialized workers, collects results, routes to next step.

**When to use:** All ARIOS workflows.

**Flow:**
```
Orchestrator (main conversation)
    │
    ├── Evaluates state (.arios/STATE.md)
    ├── Decides: research needed? planning needed? execution?
    │
    ├── Spawns Researcher (fresh context)
    │   └── Writes findings-001.md
    │   └── Returns "RESEARCH COMPLETE" to orchestrator
    │
    ├── Reads findings, spawns Planner (fresh context)
    │   └── Reads findings-001.md
    │   └── Writes plan-001.md AND Claude Tasks
    │   └── Returns "PLAN COMPLETE" to orchestrator
    │
    └── Spawns Executor (per wave, fresh context)
        └── Reads plan, executes tasks
        └── Updates Task status
        └── Writes problems if encountered
        └── Returns "WAVE COMPLETE" to orchestrator
```

**Key insight:** Orchestrator never does heavy lifting. It spawns, waits, integrates results. Main context stays lean (~30-40% usage).

### Pattern 3: Structured Handoff via Files

**What:** Subagents write Markdown files with YAML frontmatter; orchestrators read on completion.

**When to use:** All inter-agent communication.

**Format:**
```markdown
---
version: "001"
type: findings
status: complete
created: 2026-01-24T15:30:00Z
phase: 02-subagent-system
agent: researcher
---

# Research Findings: [Topic]

## Summary
[Key findings in 2-3 paragraphs]

## Recommendations
1. [Specific recommendation]
2. [Specific recommendation]

## Sources
- [Source 1]
- [Source 2]
```

**Why this format:**
- Human-readable (can be reviewed/edited)
- Machine-parseable (gray-matter extracts frontmatter)
- Version-controlled (git-friendly)
- Matches Claude Code agent file format

### Pattern 4: Task System Integration

**What:** Planner writes Claude Tasks directly; Executor updates task status.

**When to use:** Planning and execution phases.

**Configuration (.claude/settings.json):**
```json
{
  "env": {
    "CLAUDE_CODE_TASK_LIST_ID": "arios-{roadmap}"
  }
}
```

**Task operations available to subagents:**
- `TaskCreate` - Create new task with title, description, dependencies
- `TaskList` - Get all tasks with status
- `TaskUpdate` - Update status, description, priority
- `TaskGet` - Get specific task details
- `TaskDelete` - Remove task

**Status values:** `todo`, `in_progress`, `done`, `blocked`

### Anti-Patterns to Avoid

- **Orchestrator doing heavy work:** Orchestrator should only coordinate. Spawn subagents for actual work.
- **Subagents spawning subagents:** Not supported by Claude Code. Chain via orchestrator instead.
- **Implicit handoffs:** Always write explicit files. Don't rely on return values alone (lost on `/clear`).
- **Single findings file:** Use versioning (001, 001.1, 002) to preserve history.
- **Bloated subagent prompts:** Keep prompts focused. Use `@file` references for context.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom regex | gray-matter | Edge cases: multi-line, escaping, types |
| Task persistence | Custom file storage | Claude Code Task system | Built-in, survives `/clear`, multi-session |
| Subagent spawning | Shell scripts calling claude | Task tool with subagent_type | Native, parallel support, context isolation |
| Agent prompt format | Custom JSON/YAML | .claude/agents/*.md | Claude Code standard, auto-loaded |
| Version numbering | Custom logic | Simple increment with patch notation | 001, 001.1, 002 is sufficient |

**Key insight:** Claude Code provides robust infrastructure for agent orchestration. Use it.

## Common Pitfalls

### Pitfall 1: Context Pollution from Heavy Operations

**What goes wrong:** Orchestrator reads large codebases or performs extensive searches, degrading response quality.

**Why it happens:** Trying to be thorough in the main conversation.

**How to avoid:**
- Orchestrator ONLY coordinates - never reads codebase directly
- Spawn subagents for all heavy operations (even "simple" searches)
- Subagents return summaries, not raw data

**Warning signs:** Main conversation context usage > 40%, degraded responses, "I notice I'm running low on context" messages.

### Pitfall 2: Lost State on /clear

**What goes wrong:** User runs `/clear` and ARIOS forgets where it was.

**Why it happens:** Relying on conversation history instead of files.

**How to avoid:**
- `.arios/STATE.md` is the source of truth - always read first
- Subagent findings written to files immediately
- Task system persisted via `CLAUDE_CODE_TASK_LIST_ID`
- Every significant state change written to disk

**Warning signs:** User says "where were we?" after `/clear`, orchestrator asks questions already answered.

### Pitfall 3: The Handoff Problem (Context Amnesia)

**What goes wrong:** Subagent starts with blank slate, lacks crucial project knowledge, produces generic solutions.

**Why it happens:** Orchestrator doesn't provide sufficient context to subagent.

**How to avoid:**
- Orchestrator extracts and passes relevant context explicitly
- Subagents read `.arios/` files for project context
- Handoff files include enough context to be standalone
- Use `@file` references for essential files

**Warning signs:** Subagent asks "what framework are you using?", produces code that doesn't match project patterns.

### Pitfall 4: Subagent-Spawns-Subagent Trap

**What goes wrong:** Attempting nested subagent spawning, which fails silently or errors.

**Why it happens:** Assuming subagents have full capabilities.

**How to avoid:**
- Design for flat hierarchy: orchestrator -> subagents (no nesting)
- If multi-step research needed, orchestrator chains: spawn researcher 1, read results, spawn researcher 2
- Plan subagent for "mega-phases" if truly complex

**Warning signs:** Subagent returns incomplete results, errors about Task tool unavailability.

### Pitfall 5: Planner-Executor Translation Gap

**What goes wrong:** Planner writes plans, but executor interprets them differently.

**Why it happens:** Plans are vague, leave room for interpretation.

**How to avoid:**
- Planner writes Claude Tasks directly (locked in CONTEXT.md decision)
- Tasks have explicit `<files>`, `<action>`, `<verify>`, `<done>` sections
- No ambiguous language ("add authentication" vs specific JWT implementation)
- Executor reads tasks, not just plan files

**Warning signs:** Executor asks clarifying questions, implements differently than intended.

## Code Examples

Verified patterns from official sources and GSD reference implementation.

### Subagent Prompt File (researcher.md)

```markdown
---
name: researcher
description: Investigates implementation approaches when domain is unclear. Spawned by ARIOS orchestrator for research tasks.
tools: Read, Grep, Glob, Bash, WebSearch, WebFetch
model: inherit
---

<role>
You are an ARIOS researcher. You investigate implementation approaches
and document findings for consumption by the planner.

You are spawned by the ARIOS orchestrator when:
- Domain is unclear or requires current documentation
- External APIs or libraries need investigation
- Architecture decisions need research

Your job: Answer the research question and write findings to a file.
</role>

<input>
You receive from orchestrator:
- Research question/topic
- Phase context
- Specific areas to investigate
- Output file path
</input>

<workflow>
1. Read .arios/STATE.md for project context
2. Read phase CONTEXT.md if exists (locked decisions)
3. Investigate using available tools
4. Write findings to specified path
5. Return structured completion message
</workflow>

<output>
Write to: The path provided by orchestrator
Format: Markdown with YAML frontmatter

Return message:
## RESEARCH COMPLETE

**Topic:** {topic}
**Confidence:** [HIGH/MEDIUM/LOW]

### Key Findings
- [Finding 1]
- [Finding 2]

### File Created
`{path}`

### Ready for Planning
Research complete. Planner can proceed.
</output>
```

### Findings File Format

```markdown
---
version: "001"
type: findings
status: complete
created: 2026-01-24T15:30:00Z
phase: 02-subagent-system
agent: researcher
confidence: high
---

# Research Findings: Subagent Architecture

## Summary

Claude Code supports custom subagents via `.claude/agents/` directory.
Each subagent runs in isolated context and returns results to orchestrator.

## Key Findings

### 1. Subagent Spawning
- Use Task tool with custom subagent_type
- Up to 7 parallel subagents supported
- Fresh context window per subagent

### 2. Task Persistence
- Configure via CLAUDE_CODE_TASK_LIST_ID
- Stored in ~/.claude/tasks/{id}/
- Survives /clear and restarts

## Recommendations

1. Use file-based handoffs for persistence
2. Keep orchestrator lean
3. Chain subagents via orchestrator (no nesting)

## Sources

- https://code.claude.com/docs/en/sub-agents
- Reference implementation: GSD agents
```

### Orchestrator Spawn Pattern

```markdown
<!-- In orchestrator slash command -->
## Spawning Researcher

Based on phase state, research is needed for: [topic]

Spawning researcher subagent with prompt:

---
**Research Request**

**Topic:** [specific topic]
**Phase:** 02-subagent-system
**Context:** See .arios/roadmaps/v1-current/phases/02-subagent-system/02-CONTEXT.md

**Questions to Answer:**
1. [Specific question]
2. [Specific question]

**Output Path:** .arios/roadmaps/v1-current/phases/02-subagent-system/researcher/findings-001.md

**Return when complete with structured message.**
---

[Spawn researcher subagent with above prompt]
```

### Task List ID Configuration

```json
// .claude/settings.json
{
  "env": {
    "CLAUDE_CODE_TASK_LIST_ID": "arios-v1"
  },
  "permissions": {
    "allow": ["WebSearch"]
  }
}
```

### Parsing Findings with gray-matter

```typescript
// Source: gray-matter npm documentation
import matter from 'gray-matter';
import { readFile } from 'fs/promises';

interface FindingsFrontmatter {
  version: string;
  type: 'findings' | 'plan' | 'problem';
  status: 'complete' | 'partial' | 'failed';
  created: string;
  phase: string;
  agent: string;
  confidence?: 'high' | 'medium' | 'low';
}

async function parseFindingsFile(path: string) {
  const content = await readFile(path, 'utf-8');
  const { data, content: body } = matter(content);

  return {
    frontmatter: data as FindingsFrontmatter,
    body
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single long conversation | Orchestrator + subagents | 2025-2026 | Context stays lean, quality maintained |
| Manual task tracking | Claude Code Task system | 2025 | Persistent, survives /clear |
| Global agents only | Project-local .claude/agents/ | 2025 | Project-specific workflows |
| Implicit state | File-based state (.arios/) | Current | Explicit, recoverable, git-friendly |

**Deprecated/outdated:**
- Using ~/.claude/ for project-specific agents: Use project-local .claude/agents/
- Relying on conversation history for state: Use file-based state
- Monolithic agent prompts: Split into focused subagents

## Open Questions

Things that couldn't be fully resolved:

1. **Exact Task tool schema**
   - What we know: Task tool spawns subagents with description and prompt
   - What's unclear: Full parameter schema, optional fields
   - Recommendation: Use documented patterns, test during implementation

2. **Background vs Foreground subagent behavior**
   - What we know: Background subagents auto-deny permissions, foreground prompts user
   - What's unclear: Best mode for ARIOS subagents
   - Recommendation: Start with foreground (default), evaluate background for parallel execution

3. **Task comment persistence**
   - What we know: Tasks have comments feature
   - What's unclear: Whether comments survive /clear reliably
   - Recommendation: Use file-based handoffs as primary, comments as supplementary

## Sources

### Primary (HIGH confidence)

- [Claude Code Subagents Documentation](https://code.claude.com/docs/en/sub-agents) - Official docs on agent format, spawning, configuration
- [Claude Code Task Tool Ultimate Guide](reference/Claude_Code_Task_Tool_Ultimate_Guide.md) - Local reference, verified patterns
- [GSD Agent Implementation](~/.claude/agents/gsd-*.md) - Working reference implementation

### Secondary (MEDIUM confidence)

- [Piebald-AI System Prompts](https://github.com/Piebald-AI/claude-code-system-prompts) - Community-maintained prompt documentation
- [gray-matter npm](https://www.npmjs.com/package/gray-matter) - YAML frontmatter parsing
- [ClaudeLog Task Tools](https://claudelog.com/mechanics/task-agent-tools/) - Community documentation

### Tertiary (LOW confidence)

- WebSearch results on orchestrator patterns - Community variations, use for inspiration
- Blog posts on multi-agent coordination - Implementation details may vary

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - gray-matter is de facto standard, Task system is native
- Architecture: HIGH - Verified against official docs and working GSD implementation
- Pitfalls: HIGH - Synthesized from multiple sources and GSD experience

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable domain, Claude Code updates may change specifics)
