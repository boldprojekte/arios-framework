# Requirements: ARIOS v2

**Defined:** 2026-01-24
**Core Value:** The AI truly understands what you want and builds it professionally, without you needing to be a coder.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core System

- [ ] **CORE-01**: Slash commands as entry points (/ideate, /plan, /execute and supporting commands)
- [ ] **CORE-02**: CLAUDE.md integration for automatic system context loading on session start
- [ ] **CORE-03**: State management system that persists project context across sessions
- [ ] **CORE-04**: Context-aware routing that detects project state and suggests next steps

### Subagent Architecture

- [ ] **AGENT-01**: Orchestrator pattern where main agent coordinates and spawns subagent work
- [ ] **AGENT-02**: Subagent prompt files for specialized roles (researcher, explorer, planner, executor)
- [ ] **AGENT-03**: Structured handoffs where subagents write findings to files for orchestrator consumption
- [ ] **AGENT-04**: Task system integration for tracking work and enabling parallel execution

### User Experience

- [ ] **UX-01**: HTML dashboard for real-time visibility into tasks and ability to interact
- [ ] **UX-02**: Testable checkpoints that pause execution at points where user can verify the app works
- [ ] **UX-03**: User-choosable approach allowing ground-up or UI-first development per project
- [ ] **UX-04**: Greenfield vs brownfield detection with workflows adapted to each context

### Output Quality

- [ ] **QUAL-01**: SOTA project setup with professional structure as foundation for all projects
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
| CORE-01 | TBD | Pending |
| CORE-02 | TBD | Pending |
| CORE-03 | TBD | Pending |
| CORE-04 | TBD | Pending |
| AGENT-01 | TBD | Pending |
| AGENT-02 | TBD | Pending |
| AGENT-03 | TBD | Pending |
| AGENT-04 | TBD | Pending |
| UX-01 | TBD | Pending |
| UX-02 | TBD | Pending |
| UX-03 | TBD | Pending |
| UX-04 | TBD | Pending |
| QUAL-01 | TBD | Pending |
| QUAL-02 | TBD | Pending |
| QUAL-03 | TBD | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 0
- Unmapped: 15

---
*Requirements defined: 2026-01-24*
*Last updated: 2026-01-24 after initial definition*
