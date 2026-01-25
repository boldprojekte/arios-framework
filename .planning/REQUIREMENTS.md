# Requirements: ARIOS v2

**Defined:** 2026-01-24
**Core Value:** The AI truly understands what you want and builds it professionally, without you needing to be a coder.

## v1.0 Requirements (Validated)

Requirements shipped in v1.0. These are locked.

### Core System

- [x] **CORE-01**: Slash commands as entry points (/ideate, /plan, /execute and supporting commands)
- [x] **CORE-02**: CLAUDE.md integration for automatic system context loading on session start
- [x] **CORE-04**: Context-aware routing that detects project state and suggests next steps

### Subagent Architecture

- [x] **AGENT-01**: Orchestrator pattern where main agent coordinates and spawns subagent work
- [x] **AGENT-02**: Subagent prompt files for specialized roles (researcher, explorer, planner, executor)
- [x] **AGENT-03**: Structured handoffs where subagents write findings to files for orchestrator consumption

### User Experience

- [x] **UX-02**: Testable checkpoints that pause execution at points where user can verify the app works
- [x] **UX-03**: User-choosable approach allowing ground-up or UI-first development per project
- [x] **UX-04**: Greenfield vs brownfield detection with workflows adapted to each context

### Output Quality

- [x] **QUAL-01**: SOTA project setup with professional structure as foundation for all projects
- [x] **QUAL-02**: Complexity scaling where simple tasks run in one wave, complex in phased waves
- [x] **QUAL-03**: Production-ready code following best practices and existing codebase patterns

## v1.1 Requirements

Requirements for v1.1 milestone: Polish & Complete.

### E2E Flow & Orchestration

- [ ] **E2E-01**: Full /ideate → /plan → /execute workflow functions end-to-end
- [ ] **E2E-02**: Clear role separation — ideate (WHAT), explore (codebase), research (external), plan (structure), execute (build)
- [ ] **E2E-03**: Thin orchestrator pattern — coordinator never implements, only spawns and integrates
- [ ] **E2E-04**: Workflow adapts correctly to greenfield vs brownfield projects
- [ ] **E2E-05**: Clear documentation of when to use slash command vs subagent vs skill

### Parallel Execution

- [ ] **EXEC-01**: Parallel task execution within waves (up to 8 concurrent tasks)
- [ ] **EXEC-02**: Fresh executor contexts per wave to prevent context degradation
- [ ] **EXEC-03**: Wave boundaries enforce verification before proceeding

### Verification

- [ ] **VERIF-01**: Verifier subagent checks work after each wave completes
- [ ] **VERIF-02**: 3-tier verification model — auto (always), wave (boundaries), phase (human review)
- [ ] **VERIF-03**: Integration validation ensures parallel work fits together correctly
- [ ] **VERIF-04**: Verification failures block progression until resolved

### Debugging & Recovery

- [ ] **DEBUG-01**: State integrity checks validate files before execution begins
- [ ] **DEBUG-02**: Self-correction attempts up to 3 times before escalating to user
- [ ] **DEBUG-03**: Clear escalation triggers — user always knows why AI is asking for help
- [ ] **DEBUG-04**: Plain-language error messages — impact-focused, not technical jargon

### Dashboard Polish

- [ ] **DASH-01**: Polish click-for-details interaction
- [ ] **DASH-02**: Live updates work reliably during execution

### State & Context

- [ ] **STATE-01**: Session resume — pick up exactly where you left off
- [ ] **STATE-02**: State validation on session start detects corruption or drift
- [ ] **STATE-03**: v1.0 gaps closed — CORE-03, AGENT-04, UX-01 fully working

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Features

- **ADV-01**: Hooks integration for custom automation triggers
- **ADV-02**: Multiple project support within single workspace
- **ADV-03**: Custom subagent creation by user
- **ADV-04**: Cross-file consistency checks (discussed, deferred)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Claude Code built-in planning mode | User wants own system with control over workflow |
| Fully autonomous operation | User must verify at checkpoints to catch issues early |
| Single rigid workflow | Must adapt to task type and user preference |
| Mobile interface | Desktop/CLI focus for v1 |
| Configurable concurrency limits | Default 8 is sufficient for v1.1 |
| Configurable verification depth | Default 3-tier model covers needs |
| Persistent debug context across sessions | Self-correction within session is enough for v1.1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| E2E-01 | TBD | Pending |
| E2E-02 | TBD | Pending |
| E2E-03 | TBD | Pending |
| E2E-04 | TBD | Pending |
| E2E-05 | TBD | Pending |
| EXEC-01 | TBD | Pending |
| EXEC-02 | TBD | Pending |
| EXEC-03 | TBD | Pending |
| VERIF-01 | TBD | Pending |
| VERIF-02 | TBD | Pending |
| VERIF-03 | TBD | Pending |
| VERIF-04 | TBD | Pending |
| DEBUG-01 | TBD | Pending |
| DEBUG-02 | TBD | Pending |
| DEBUG-03 | TBD | Pending |
| DEBUG-04 | TBD | Pending |
| DASH-01 | TBD | Pending |
| DASH-02 | TBD | Pending |
| STATE-01 | TBD | Pending |
| STATE-02 | TBD | Pending |
| STATE-03 | TBD | Pending |

**Coverage:**
- v1.1 requirements: 21 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 21

---
*Requirements defined: 2026-01-24*
*Last updated: 2026-01-25 — v1.1 requirements added*
