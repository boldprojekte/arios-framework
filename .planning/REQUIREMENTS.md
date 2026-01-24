# Requirements: ARIOS v2

**Defined:** 2026-01-24
**Core Value:** The AI truly understands what you want and builds it professionally, without you needing to be a coder.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core System

- [x] **CORE-01**: Slash commands as entry points (/ideate, /plan, /execute and supporting commands)
- [x] **CORE-02**: CLAUDE.md integration for automatic system context loading on session start
- [ ] **CORE-03**: State management system that persists project context across sessions
- [x] **CORE-04**: Context-aware routing that detects project state and suggests next steps

### Subagent Architecture

- [x] **AGENT-01**: Orchestrator pattern where main agent coordinates and spawns subagent work
- [x] **AGENT-02**: Subagent prompt files for specialized roles (researcher, explorer, planner, executor)
- [x] **AGENT-03**: Structured handoffs where subagents write findings to files for orchestrator consumption
- [ ] **AGENT-04**: Task system integration for tracking work and enabling parallel execution

### User Experience

- [ ] **UX-01**: HTML dashboard for real-time visibility into tasks and ability to interact
- [ ] **UX-02**: Testable checkpoints that pause execution at points where user can verify the app works
- [ ] **UX-03**: User-choosable approach allowing ground-up or UI-first development per project
- [x] **UX-04**: Greenfield vs brownfield detection with workflows adapted to each context

### Output Quality

- [x] **QUAL-01**: SOTA project setup with professional structure as foundation for all projects
- [ ] **QUAL-02**: Complexity scaling where simple tasks run in one wave, complex in phased waves
- [ ] **QUAL-03**: Production-ready code following best practices and existing codebase patterns

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Features

- **ADV-01**: Hooks integration for custom automation triggers
- **ADV-02**: Multiple project support within single workspace
- **ADV-03**: Custom subagent creation by user

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Claude Code built-in planning mode | User wants own system with control over workflow |
| Fully autonomous operation | User must verify at checkpoints to catch issues early |
| Single rigid workflow | Must adapt to task type and user preference |
| Mobile interface | Desktop/CLI focus for v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 3: Entry Points | Complete |
| CORE-02 | Phase 1: Foundation | Complete |
| CORE-03 | Phase 4: State Management | Pending |
| CORE-04 | Phase 3: Entry Points | Complete |
| AGENT-01 | Phase 2: Subagent System | Complete |
| AGENT-02 | Phase 2: Subagent System | Complete |
| AGENT-03 | Phase 2: Subagent System | Complete |
| AGENT-04 | Phase 6: Task Visibility | Pending |
| UX-01 | Phase 6: Task Visibility | Pending |
| UX-02 | Phase 5: Execution Flow | Pending |
| UX-03 | Phase 5: Execution Flow | Pending |
| UX-04 | Phase 3: Entry Points | Complete |
| QUAL-01 | Phase 1: Foundation | Complete |
| QUAL-02 | Phase 5: Execution Flow | Pending |
| QUAL-03 | Phase 5: Execution Flow | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-01-24*
*Last updated: 2026-01-24 — Traceability complete after roadmap creation*
