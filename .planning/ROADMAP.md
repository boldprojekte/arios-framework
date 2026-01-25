# Roadmap: ARIOS v2

## Overview

ARIOS v2 transforms from a manual planner into a full orchestration system leveraging Claude Code's subagent and task capabilities. The journey builds from CLAUDE.md integration (system context) through subagent architecture and slash command routing, then adds state persistence, intelligent execution flow, and finally task visibility. Each phase delivers a testable capability increment.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

### Milestone v1.0 (Complete)

- [x] **Phase 1: Foundation** - CLAUDE.md integration and professional project structure
- [x] **Phase 2: Subagent System** - Orchestrator pattern with specialized subagent files and structured handoffs
- [x] **Phase 3: Entry Points** - Slash commands, context detection, and project type routing
- [x] **Phase 4: State Management** - Session persistence and project memory
- [x] **Phase 5: Execution Flow** - Checkpoints, complexity scaling, and approach selection
- [x] **Phase 6: Task Visibility** - Task system integration and HTML dashboard

### Milestone v1.1: Polish & Complete

- [ ] **Phase 7: E2E Flow & Role Clarity** - Complete workflow from ideation through execution with clear orchestration
- [ ] **Phase 8: Parallel Execution** - Wave-based parallel task execution with fresh contexts
- [ ] **Phase 9: Verification System** - Verifier subagent with 3-tier verification model
- [ ] **Phase 10: Debug & Recovery** - State integrity checks, self-correction, and escalation
- [ ] **Phase 11: State & Dashboard Polish** - Session resume, state validation, and dashboard interaction

## Phase Details

### Phase 1: Foundation
**Goal**: System context loads automatically and projects start with professional structure
**Depends on**: Nothing (first phase)
**Requirements**: CORE-02, QUAL-01
**Success Criteria** (what must be TRUE):
  1. Opening Claude Code in a project with ARIOS installed loads system context automatically
  2. New projects created through ARIOS have SOTA folder structure and configuration
  3. CLAUDE.md points to ARIOS system files and is recognized by Claude Code
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — CLI package structure and ARIOS templates
- [x] 01-02-PLAN.md — Init and update command implementation

### Phase 2: Subagent System
**Goal**: Orchestrator can spawn specialized subagents that persist findings for consumption
**Depends on**: Phase 1
**Requirements**: AGENT-01, AGENT-02, AGENT-03
**Success Criteria** (what must be TRUE):
  1. Orchestrator can spawn subagent with specific role and instructions
  2. Researcher, planner, and executor subagent prompts exist and are loadable
  3. Subagents write structured findings to files that orchestrator reads on completion
  4. Handoff format is consistent and parseable across all subagent types
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Handoff utilities and TypeScript types
- [x] 02-02-PLAN.md — Subagent prompt files (researcher, planner, executor)
- [x] 02-03-PLAN.md — Orchestrator command and init integration

### Phase 3: Entry Points
**Goal**: Users invoke ARIOS through slash commands that detect project context and route appropriately
**Depends on**: Phase 2
**Requirements**: CORE-01, CORE-04, UX-04
**Success Criteria** (what must be TRUE):
  1. User can type /ideate, /plan, or /execute to enter ARIOS workflows
  2. System detects whether project is greenfield or brownfield and adapts behavior
  3. Context-aware routing suggests logical next command based on project state
  4. Supporting commands exist for workflow control (status, help, etc.)
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — Smart entry point (/arios) and status command
- [x] 03-02-PLAN.md — Core workflow commands (/ideate, /plan, /execute) and help

### Phase 4: State Management
**Goal**: Project context persists across sessions enabling seamless continuation
**Depends on**: Phase 3
**Requirements**: CORE-03
**Success Criteria** (what must be TRUE):
  1. Closing and reopening Claude Code preserves project state
  2. User can resume exactly where they left off without re-explaining context
  3. State includes phase position, decisions made, and accumulated context
**Plans**: 4 plans

Plans:
- [x] 04-01-PLAN.md — State types and persistence utilities
- [x] 04-02-PLAN.md — Session continuity integration
- [x] 04-03-PLAN.md — Fix STATE.md format (gap closure)
- [x] 04-04-PLAN.md — Complete path migration (gap closure)

### Phase 5: Execution Flow
**Goal**: Execution adapts to complexity with testable checkpoints and user-chosen approach
**Depends on**: Phase 4
**Requirements**: UX-02, UX-03, QUAL-02, QUAL-03
**Success Criteria** (what must be TRUE):
  1. Simple tasks execute in one wave; complex tasks break into phased waves
  2. Execution pauses at points where user can actually test the app works
  3. User can choose ground-up or UI-first approach at project start
  4. Generated code follows best practices and matches existing codebase patterns
  5. Checkpoint failures prevent building on broken foundation
**Plans**: 10 plans

Plans:
- [x] 05-01-PLAN.md — Complexity detection and wave scheduling
- [x] 05-02-PLAN.md — Testable checkpoint verification
- [x] 05-03-PLAN.md — Approach selection and configuration
- [x] 05-04-PLAN.md — Recovery flow with retry logic
- [x] 05-05-PLAN.md — Code pattern extraction and quality enforcement
- [x] 05-06-PLAN.md — Wire approach selection into /ideate (gap closure)
- [x] 05-07-PLAN.md — Wire complexity and waves into /execute (gap closure)
- [x] 05-08-PLAN.md — Wire quality patterns into executor template (gap closure)
- [x] 05-09-PLAN.md — Wire checkpoint into execution flow (gap closure)
- [x] 05-10-PLAN.md — Wire recovery into checkpoint failures (gap closure)

### Phase 6: Task Visibility
**Goal**: User has real-time visibility into task execution through dashboard
**Depends on**: Phase 5
**Requirements**: AGENT-04, UX-01
**Success Criteria** (what must be TRUE):
  1. Task system tracks all work units and enables parallel execution
  2. HTML dashboard shows real-time task status and progress
  3. User can interact with dashboard to view details or take action
  4. Dashboard updates automatically without manual refresh
**Plans**: 7 plans

Plans:
- [x] 06-01-PLAN.md — Dashboard package setup, types, and HTTP server
- [x] 06-02-PLAN.md — File watcher and parser with SSE pipeline
- [x] 06-03-PLAN.md — Dashboard HTML, CSS, and core JavaScript
- [x] 06-04-PLAN.md — Task views (Kanban, List, Roadmap)
- [x] 06-05-PLAN.md — Dependency lines with Leader-line
- [x] 06-06-PLAN.md — CLI dashboard command integration
- [x] 06-07-PLAN.md — Human verification checkpoint

---

### Phase 7: E2E Flow & Role Clarity
**Goal**: Full workflow functions end-to-end with clear orchestration roles
**Depends on**: Phase 6 (v1.0 foundation)
**Requirements**: E2E-01, E2E-02, E2E-03, E2E-04, E2E-05
**Success Criteria** (what must be TRUE):
  1. User can run /ideate -> /plan -> /execute and build a working feature without manual intervention between stages
  2. Each stage (ideate, explore, research, plan, execute) has a clear, distinct purpose visible to the user
  3. Orchestrator never implements directly - only coordinates and spawns specialized agents
  4. Same workflow produces correct behavior for both greenfield and brownfield projects
  5. User can look up when to use slash command vs subagent vs skill (documentation exists)
**Plans**: TBD (created during planning)

### Phase 8: Parallel Execution
**Goal**: Tasks execute in parallel within waves with fresh contexts
**Depends on**: Phase 7
**Requirements**: EXEC-01, EXEC-02, EXEC-03
**Success Criteria** (what must be TRUE):
  1. User sees multiple tasks executing simultaneously during a wave (up to 8 concurrent)
  2. Each wave starts fresh - context from previous wave does not degrade new execution
  3. Wave N+1 does not start until wave N passes verification
**Plans**: TBD (created during planning)

### Phase 9: Verification System
**Goal**: Verifier catches issues before they compound
**Depends on**: Phase 8
**Requirements**: VERIF-01, VERIF-02, VERIF-03, VERIF-04
**Success Criteria** (what must be TRUE):
  1. After each wave completes, a verifier automatically checks the work
  2. User sees appropriate verification depth: auto checks always run, wave checks at boundaries, human review at phase end
  3. When multiple parallel tasks modify related code, verifier catches integration conflicts
  4. If verification fails, execution stops until issue is resolved (no building on broken foundation)
**Plans**: TBD (created during planning)

### Phase 10: Debug & Recovery
**Goal**: System recovers from errors gracefully with user-appropriate escalation
**Depends on**: Phase 9
**Requirements**: DEBUG-01, DEBUG-02, DEBUG-03, DEBUG-04
**Success Criteria** (what must be TRUE):
  1. Before execution begins, state integrity check catches corruption or drift
  2. When errors occur, system attempts self-correction (up to 3 times) before asking user
  3. User always knows WHY the AI is asking for help (clear escalation triggers)
  4. Error messages describe impact in plain language, not technical jargon
**Plans**: TBD (created during planning)

### Phase 11: State & Dashboard Polish
**Goal**: Sessions resume seamlessly and dashboard is fully interactive
**Depends on**: Phase 10
**Requirements**: STATE-01, STATE-02, STATE-03, DASH-01, DASH-02
**Success Criteria** (what must be TRUE):
  1. User can close Claude Code, return days later, and resume exactly where they left off
  2. On session start, state validation detects if files have drifted and alerts user
  3. v1.0 gaps (CORE-03, AGENT-04, UX-01) are fully closed and working
  4. User can click dashboard tasks to see details and take actions
  5. Dashboard updates live during execution without manual refresh
**Plans**: TBD (created during planning)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11

### Milestone v1.0 (Complete)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-01-24 |
| 2. Subagent System | 3/3 | Complete | 2026-01-24 |
| 3. Entry Points | 2/2 | Complete | 2026-01-24 |
| 4. State Management | 4/4 | Complete | 2026-01-24 |
| 5. Execution Flow | 10/10 | Complete | 2026-01-25 |
| 6. Task Visibility | 7/7 | Complete | 2026-01-25 |

### Milestone v1.1: Polish & Complete

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 7. E2E Flow & Role Clarity | 0/TBD | Pending | — |
| 8. Parallel Execution | 0/TBD | Pending | — |
| 9. Verification System | 0/TBD | Pending | — |
| 10. Debug & Recovery | 0/TBD | Pending | — |
| 11. State & Dashboard Polish | 0/TBD | Pending | — |

---
*Created: 2026-01-24*
*Updated: 2026-01-25 (v1.1 phases added)*
*Depth: standard (5-8 phases per milestone)*
*Coverage: v1.0 15/15, v1.1 21/21 requirements mapped*
