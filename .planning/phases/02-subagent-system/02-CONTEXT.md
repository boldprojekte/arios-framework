# Phase 2: Subagent System - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Orchestrator spawning specialized subagents that persist findings for consumption. Includes:
- Orchestrator pattern implementation
- Subagent prompt files (Researcher, Planner, Executor)
- Handoff protocol and file structure
- Integration with Claude Code's Task system

NOT in scope: Slash commands (Phase 3), State persistence across sessions (Phase 4), Execution flow/waves (Phase 5), Dashboard (Phase 6).

</domain>

<decisions>
## Implementation Decisions

### Handoff Format
- Markdown with YAML frontmatter (human-readable + metadata)
- Versioned files per subagent: `findings-001.md`, `findings-002.md`
- Patches/additions: `001.1`, `001.2` notation
- Phase-level index (`02-STATE.md`) tracks which version is current
- Files replace per run, versioning provides history without depending on git

### State Architecture
- ARIOS files (`.arios/`) = Source of truth for "where are we"
- Claude Tasks = Execution layer, real-time visibility
- Task persistence via `CLAUDE_CODE_TASK_LIST_ID` in `.claude/settings.json`
- Tasks stored in `~/.claude/tasks/{task-list-id}/`
- One active task list at a time (system constraint)

### Hierarchy
```
Project (eternal)
└── Roadmap (v1, v2, v3... — pausable/switchable)
    └── Phase (1, 2, 3...)
        └── Wave (parallel execution group)
            └── Task (individual work unit)
```

### Roadmap Lifecycle
- Multiple roadmaps over project lifetime (projects never "done")
- Explicit switching: pause current → switch task list ID → resume other
- STATE.md always shows what's active
- Snapshot state on pause for recovery

### Subagent Roles

**Explorer:**
- Use Claude Code built-in (no custom agent needed)

**Researcher:**
- Custom agent in `.claude/agents/researcher.md`
- Trigger: Orchestrator recommends, USER decides
- Use cases: unclear dependencies, things not in training data, external APIs
- Input: Task description + codebase access
- Output: `researcher/findings-001.md`
- Does NOT write Claude Tasks

**Planner:**
- Custom agent in `.claude/agents/planner.md`
- Input: Findings (if research done) + CONTEXT.md (user decisions)
- Output: `planner/plan-001.md` AND Claude Tasks
- DOES write Claude Tasks (key decision — avoids translation step)

**Executor:**
- Custom agent in `.claude/agents/executor.md`
- Executes at WAVE level (not individual tasks — that's overkill)
- Works with Claude Task system (updates status, marks complete)
- Can create new tasks if problems require (trusted to set dependencies)
- Problem reporting: writes `problems/problem-{timestamp}.md`, links in task comment

**Orchestrator:**
- Coordinates everything, stays lean
- Manages state sync between ARIOS files and Claude Tasks
- Routes to appropriate subagent
- Evaluates if research needed, asks user
- Suggests `/clear` at natural breakpoints (at least after each phase)
- Handles mismatch detection with simple user prompts

### Context Management
- Subagents get FRESH context window (not chat history fork)
- Orchestrator extracts relevant info, passes explicit prompt to subagent
- Subagent reads files as needed, returns structured result
- Orchestrator stays lean by delegating heavy work

### Problem Handling
- Executor writes detailed problem to `problems/problem-{timestamp}.md`
- Links in Claude Task comment for orchestrator visibility
- Executor can create new tasks for discovered issues
- Executor trusted to set dependencies correctly (validation can be added later)
- Orchestrator decides: continue or stop based on severity

### File Organization
```
project/
├── .claude/                      # Claude Code (required location)
│   ├── settings.json             # Task-List-ID, permissions
│   ├── agents/                   # Subagent prompts
│   │   ├── researcher.md
│   │   ├── planner.md
│   │   └── executor.md
│   └── commands/                 # Slash commands (Phase 3)
│
└── .arios/                       # ARIOS artifacts
    ├── PROJECT.md                # Vision, constants
    ├── STATE.md                  # Global: active roadmap, phase, position
    ├── config.json               # ARIOS-specific settings
    └── roadmaps/
        └── v1-current/
            ├── ROADMAP.md
            └── phases/
                └── 02-subagent-system/
                    ├── 02-STATE.md       # Phase index
                    ├── 02-CONTEXT.md     # User decisions
                    ├── researcher/
                    │   └── findings-001.md
                    ├── planner/
                    │   └── plan-001.md
                    └── problems/
                        └── problem-{timestamp}.md
```

### UX Principles
- `arios` = universal smart entry point, context-aware routing
- System figures out state, user just says what they want
- Mismatch detection → simple question, no tech jargon
- Flexibility: can use parts (just plan, just execute) without full workflow
- Complexity hidden, not exposed

### Context Hygiene
- `/clear` recommended at least after each phase
- Natural breakpoints when user tests anyway
- Orchestrator proactively suggests when context getting full

### Claude's Discretion
- Exact orchestrator implementation patterns
- Error message wording
- Retry logic details
- Internal state file formats (as long as readable)

</decisions>

<specifics>
## Specific Ideas

- Task system persistence via `CLAUDE_CODE_TASK_LIST_ID` environment variable in settings.json — proven pattern from research
- Wave-based parallel execution inspired by GSD but integrated with Claude Tasks
- "Files as truth, tasks as view" — robust even if task persistence has issues
- Subagent prompts should be loadable and testable independently
- Executor should feel like GSD's executor but with Task system integration

</specifics>

<deferred>
## Deferred Ideas

- Slash commands and entry points — Phase 3
- Session persistence and resume — Phase 4
- Complexity scaling and approach selection — Phase 5
- HTML dashboard for task visibility — Phase 6
- Global ARIOS installation (currently project-wide only)
- Orchestrator validation of executor-created tasks (trust for now)

</deferred>

---

*Phase: 02-subagent-system*
*Context gathered: 2026-01-24*
