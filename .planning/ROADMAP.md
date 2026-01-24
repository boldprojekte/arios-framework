# Roadmap: ARIOS v2

## Overview

ARIOS v2 transforms from a manual planner into a full orchestration system leveraging Claude Code's subagent and task capabilities. The journey builds from CLAUDE.md integration (system context) through subagent architecture and slash command routing, then adds state persistence, intelligent execution flow, and finally task visibility. Each phase delivers a testable capability increment.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - CLAUDE.md integration and professional project structure
- [x] **Phase 2: Subagent System** - Orchestrator pattern with specialized subagent files and structured handoffs
- [ ] **Phase 3: Entry Points** - Slash commands, context detection, and project type routing
- [ ] **Phase 4: State Management** - Session persistence and project memory
- [ ] **Phase 5: Execution Flow** - Checkpoints, complexity scaling, and approach selection
- [ ] **Phase 6: Task Visibility** - Task system integration and HTML dashboard

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
- [ ] 03-01-PLAN.md — Smart entry point (/arios) and status command
- [ ] 03-02-PLAN.md — Core workflow commands (/ideate, /plan, /execute) and help

### Phase 4: State Management
**Goal**: Project context persists across sessions enabling seamless continuation
**Depends on**: Phase 3
**Requirements**: CORE-03
**Success Criteria** (what must be TRUE):
  1. Closing and reopening Claude Code preserves project state
  2. User can resume exactly where they left off without re-explaining context
  3. State includes phase position, decisions made, and accumulated context
**Plans**: TBD

Plans:
- [ ] 04-01: State file structure and persistence
- [ ] 04-02: Session continuity protocol

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
**Plans**: TBD

Plans:
- [ ] 05-01: Complexity detection and wave planning
- [ ] 05-02: Testable checkpoint system
- [ ] 05-03: Approach selection (ground-up vs UI-first)
- [ ] 05-04: Code quality enforcement

### Phase 6: Task Visibility
**Goal**: User has real-time visibility into task execution through dashboard
**Depends on**: Phase 5
**Requirements**: AGENT-04, UX-01
**Success Criteria** (what must be TRUE):
  1. Task system tracks all work units and enables parallel execution
  2. HTML dashboard shows real-time task status and progress
  3. User can interact with dashboard to view details or take action
  4. Dashboard updates automatically without manual refresh
**Plans**: TBD

Plans:
- [ ] 06-01: Task system integration
- [ ] 06-02: HTML dashboard implementation
- [ ] 06-03: Real-time updates and interactivity

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-01-24 |
| 2. Subagent System | 3/3 | Complete | 2026-01-24 |
| 3. Entry Points | 0/2 | Not started | - |
| 4. State Management | 0/2 | Not started | - |
| 5. Execution Flow | 0/4 | Not started | - |
| 6. Task Visibility | 0/3 | Not started | - |

---
*Created: 2026-01-24*
*Depth: standard (5-8 phases)*
*Coverage: 15/15 requirements mapped*
