# Orchestration Patterns

**Researched:** 2026-01-25
**Confidence:** HIGH (multiple systems analyzed with official documentation)

## Systems Analyzed

| System | Focus | Complexity | Source |
|--------|-------|------------|--------|
| [GSD (Get Shit Done)](https://github.com/glittercowboy/get-shit-done) | Solo dev efficiency | Medium | Official GitHub, README |
| [BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD) | Agile team simulation | High (26 agents) | Official docs, analysis posts |
| [Spec-Kit](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/) | Spec-driven development | Low | GitHub Blog |
| Claude Code Built-ins | Native capabilities | Low | [Official Docs](https://code.claude.com/docs/en/sub-agents) |

---

## Key Patterns

### Role Separation

**GSD Pattern: Thin Orchestrator + Specialized Agents**

GSD employs the clearest role separation:

| Role | Responsibility | When Active |
|------|----------------|-------------|
| Orchestrator | Spawns agents, waits, integrates results | Always (never does heavy lifting) |
| Researchers (4 parallel) | Investigate stack, features, architecture, pitfalls | Project init, per-phase planning |
| Planner | Creates atomic XML-structured task plans | After discuss, before execute |
| Checker | Verifies plans against requirements | Post-planning loop |
| Executors (parallel) | Implement tasks in fresh 200k-token contexts | Execute phase |
| Verifier | Validates codebase delivers phase promises | Post-execution |
| Debuggers | Diagnose failures, create fix plans | When verification fails |

Key insight: "The orchestrator never does heavy lifting - it spawns agents, waits, and integrates results."

**BMAD Pattern: Domain Expert Agents**

BMAD uses 26 agents organized by expertise domain:

| Agent | Domain | Key Responsibility |
|-------|--------|-------------------|
| Analyst (Mary) | Business | Brainstorming, market research, project brief |
| PM (John) | Requirements | PRD creation from project brief |
| Architect (Winston) | Technical | System design, component boundaries |
| Scrum Master (Bob) | Process | Story files, sprint planning |
| Developer (Amelia) | Implementation | Code with tests on branches |
| QA (Tea/Murat) | Quality | Test architecture |
| BMad-Master | Coordination | Orchestrates all agents |

Key insight: BMAD mimics a real agile team with explicit handoff artifacts between roles.

**Spec-Kit Pattern: Simple Two-Role Model**

Spec-Kit uses minimal separation:
- **Human**: Steers, validates, makes judgment calls
- **Coding Agent**: Generates artifacts (spec, plan, tasks, code)

Stages (not agents): Specify -> Plan -> Tasks -> Implement

**Claude Code Built-in Pattern: Purpose-Scoped Subagents**

Built-in subagents optimized for specific purposes:
- **Explore**: Read-only codebase search/analysis (fast)
- **Plan**: Research during plan mode (prevents nesting)
- **General-purpose**: Complex multi-step tasks requiring exploration + action

---

### Research Timing

**GSD: Two-Stage Research Model**

1. **Project Initialization** (optional but recommended)
   - Domain ecosystem investigation
   - 4 parallel researchers: stack, features, architecture, pitfalls
   - Output: `.planning/research/` files
   - Informs: Roadmap structure, technology decisions

2. **Per-Phase Planning**
   - Targeted research guided by CONTEXT.md decisions
   - Output: Implementation-specific findings
   - Informs: Task plans

```
/gsd:new-project
  |
  +--> [Research] 4 parallel researchers
  |         |
  |         +--> STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md
  |
  +--> [Roadmap] Uses research to structure phases

/gsd:plan-phase N
  |
  +--> [Research] Phase-specific investigation
  |         |
  |         +--> Guided by {phase}-CONTEXT.md
  |
  +--> [Plan] Creates atomic tasks from research
```

**BMAD: Front-Loaded Research via Analyst**

Research happens first, before PM involvement:
1. Analyst conducts brainstorming, market research
2. Analyst produces Project Brief
3. PM takes brief as input, creates PRD
4. Architect takes PRD, creates design

Workflow: `Analyst -> PM -> Architect -> PO -> SM -> Dev`

Research is optional in BMAD (invoked via `/research` command) but recommended.

**Spec-Kit: Implicit Discovery in Specify Phase**

Research is embedded in specification:
- Specify phase = "reflect and refine" to capture user needs
- No explicit research agent
- Discovery happens through human-agent iteration

**Recommendation for ARIOS:**

Use GSD's two-stage model:
1. **Explore** (codebase) - Always runs, maps existing code
2. **Research** (external) - Conditional, runs when:
   - New technology decisions needed
   - Unfamiliar domain
   - Architecture patterns unclear

---

### Subagent Coordination

**Parallel vs Sequential Patterns**

| Pattern | When to Use | Example |
|---------|-------------|---------|
| Parallel | Independent tasks, no dependencies | 4 researchers investigating different domains |
| Sequential | Output of A is input to B | Analyst -> PM -> Architect |
| Wave | Groups of parallel tasks with checkpoints | Execute 3 tasks, verify, next wave |

**GSD Wave Execution:**

```
Wave 1: [Task A, Task B, Task C] -> Verify
         |        |        |
         v        v        v
      commit   commit   commit

Wave 2: [Task D, Task E] -> Verify
```

Each task runs in fresh 200k context. Main context stays at 30-40%.

**BMAD Sequential with Artifacts:**

Each agent produces explicit artifact before handoff:
- Analyst -> `project-brief.md`
- PM -> `prd.md`
- Architect -> `architecture.md`
- etc.

Handoff prompts embedded in workflow: "Project brief is complete. Save it as docs/project-brief.md, then create the PRD."

**Context Window Management:**

GSD critical insight: "Each plan is small enough to execute in a fresh context window. No degradation, no 'I'll be more concise now.'"

Pattern: Keep main orchestrator lean, spawn fresh agents for heavy lifting.

**Subagent Limitations:**

From Claude Code docs:
- Subagents cannot spawn other subagents (prevents infinite nesting)
- Subagents start with blank slate (the "handoff problem")
- Must provide detailed brief or risk "context amnesia"

---

### Context Handoffs

**File-Based Handoff (GSD + BMAD)**

Both systems use persistent files as the handoff mechanism:

| File | Purpose | Written By | Read By |
|------|---------|------------|---------|
| PROJECT.md | Vision, always loaded | Human + Orchestrator | Everyone |
| REQUIREMENTS.md | Scoped features | Orchestrator | Planners, Executors |
| STATE.md | Position, decisions, blockers | Orchestrator | Resume logic |
| {phase}-CONTEXT.md | Implementation preferences | Discuss phase | Research, Planning |
| {phase}-PLAN.md | Atomic tasks, verification steps | Planner | Executors |
| research/*.md | Domain findings | Researchers | Planners |

**Fresh Executor Pattern (GSD):**

Executors receive minimal context:
1. PROJECT.md (vision)
2. REQUIREMENTS.md (scope)
3. Relevant research files
4. Current PLAN.md

This keeps context below 40%, preventing degradation.

**Artifact-as-Contract (BMAD):**

BMAD treats artifacts as contracts:
- "Source code is no longer the sole source of truth - documentation (PRDs, architecture designs, user stories) is"
- Code is "downstream derivative" of specifications
- Ensures traceability at scale

**Structured Returns:**

For programmatic coordination, agents return structured data:

```markdown
## TASK COMPLETE

**Status:** SUCCESS
**Artifacts:** [list of files created/modified]
**Verification:** [how to verify this worked]
**Next Step:** [suggested next action]
```

---

## Comparison Matrix

| Capability | GSD | BMAD | Spec-Kit | ARIOS v1.0 |
|------------|-----|------|----------|------------|
| Role count | 6 specialized | 26 agents | 2 (human + agent) | 3 (/ideate, /plan, /execute) |
| Research timing | Init + per-phase | Front-loaded via Analyst | Implicit in Specify | None explicit |
| Parallel execution | Yes (researchers, executors) | Party mode | Not explicit | Not yet |
| Context isolation | Fresh 200k per executor | Step-file architecture | Not specified | Subagent spawning |
| Handoff mechanism | Markdown files | Artifacts + handoff prompts | Progressive specs | Markdown files |
| Human checkpoints | /verify-work | Sprint reviews | Review gates | Testable checkpoints |
| Complexity scaling | Phases + waves | Levels 0-4 | Not explicit | Simple vs complex |

---

## Recommendations for ARIOS

### 1. Adopt Clear Role Separation (5 Roles)

Map ARIOS stages to distinct responsibilities:

| ARIOS Role | Purpose | Parallel? |
|------------|---------|-----------|
| Ideate | Capture WHAT user wants to build | No |
| Explore | Map existing codebase context | Yes (could be multi-file) |
| Research | External knowledge acquisition | Yes (stack, patterns, pitfalls) |
| Plan | Structure HOW to build it | No |
| Execute | Build the thing | Yes (wave-based) |

**Key principle:** Ideate and Plan are sequential (human involved). Explore, Research, and Execute can parallelize.

### 2. Implement Two-Stage Research

**Stage 1: Codebase Exploration (Always)**
- Runs automatically during /plan or /execute in brownfield
- Maps: folder structure, tech stack, naming conventions
- Output: CODEBASE-CONTEXT.md

**Stage 2: External Research (Conditional)**
- Triggers when:
  - Greenfield project (no codebase to explore)
  - User requests unfamiliar technology
  - Architecture decisions needed
- Spawns parallel researchers (like GSD)
- Output: research/*.md files

### 3. Use Wave-Based Execution with Fresh Contexts

Instead of one long execution:

```
/execute
  |
  +--> Complexity check
  |
  +--> If simple: Single wave, all tasks
  |
  +--> If complex:
        |
        Wave 1: [Independent tasks] -> Checkpoint -> User verify
        Wave 2: [Dependent tasks] -> Checkpoint -> User verify
        Wave N: ...
```

Each wave spawns fresh executors with:
- PROJECT.md
- Relevant research
- Current wave's PLAN.md only

### 4. Explicit Handoff Artifacts

Standardize file-based handoffs:

| Transition | Artifact | Contains |
|------------|----------|----------|
| Ideate -> Plan | VISION.md | WHAT, requirements, constraints |
| Explore -> Plan | CODEBASE.md | Stack, patterns, conventions |
| Research -> Plan | research/*.md | External findings |
| Plan -> Execute | {phase}-PLAN.md | Atomic tasks, verification |
| Execute -> Verify | {phase}-EXECUTION.md | What was built, how to test |

### 5. Keep Orchestrator Thin

The orchestrator should ONLY:
- Parse user intent
- Determine which agents to spawn
- Collect agent results
- Route to next stage
- Update state files

The orchestrator should NEVER:
- Write significant code
- Make architectural decisions
- Perform research
- Execute implementation tasks

This keeps main context lean for coordination.

### 6. Adopt Structured Returns

Every subagent returns structured summary:

```markdown
## COMPLETE

**Result:** SUCCESS | PARTIAL | BLOCKED
**Summary:** [1-2 sentences]
**Artifacts:** [files created/modified]
**Verification:** [how to test this worked]
**Issues:** [any problems encountered]
**Next:** [suggested next step]
```

This enables programmatic routing and state updates.

---

## Implementation Priority

For ARIOS v1.1, prioritize in this order:

1. **Explore phase** - Codebase mapping before planning
   - Highest value for brownfield projects
   - Prevents planning without context

2. **Research phase** - External knowledge when needed
   - Parallel researchers (stack, patterns)
   - Conditional trigger (not every project needs it)

3. **Wave execution** - Fresh contexts per wave
   - Prevents context degradation
   - Enables verification checkpoints

4. **Thin orchestrator** - Coordination only
   - Extract heavy logic to subagents
   - Keep main context under 40%

---

## Sources

### Primary
- [GSD GitHub Repository](https://github.com/glittercowboy/get-shit-done) - Official docs and README
- [BMAD-METHOD GitHub](https://github.com/bmad-code-org/BMAD-METHOD) - Official framework
- [Claude Code Subagent Docs](https://code.claude.com/docs/en/sub-agents) - Official documentation
- [GitHub Spec-Kit Blog](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/) - Official announcement

### Supporting
- [BMAD Architecture Deep Dive](https://www.vibesparking.com/en/blog/ai/bmad/2026-01-15-bmad-agents-workflows-tasks-files-architecture/) - Agent/workflow analysis
- [Anthropic Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) - Official best practices
- [BMAD Agent Roles](https://docs.bmad-method.org/explanation/core-concepts/agent-roles/) - Role definitions
- [Context Engineering Under the Hood](https://blog.lmcache.ai/en/2025/12/23/context-engineering-reuse-pattern-under-the-hood-of-claude-code/) - Technical analysis

---

*Research conducted for ARIOS v1.1 milestone: Clear orchestration logic*
