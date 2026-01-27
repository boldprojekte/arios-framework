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

## v1.1 Requirements (Validated)

Requirements shipped in v1.1. These are locked.

### E2E Flow & Orchestration

- [x] **E2E-01**: Full /ideate → /plan → /execute workflow functions end-to-end
- [x] **E2E-02**: Clear role separation — ideate (WHAT), explore (codebase), research (external), plan (structure), execute (build)
- [x] **E2E-03**: Thin orchestrator pattern — coordinator never implements, only spawns and integrates
- [x] **E2E-04**: Workflow adapts correctly to greenfield vs brownfield projects
- [x] **E2E-05**: Clear documentation of when to use slash command vs subagent vs skill

### Parallel Execution

- [x] **EXEC-01**: Parallel task execution within waves (up to 8 concurrent tasks)
- [x] **EXEC-02**: Fresh executor contexts per wave to prevent context degradation
- [x] **EXEC-03**: Wave boundaries enforce verification before proceeding

### Verification

- [x] **VERIF-01**: Verifier subagent checks work after each wave completes
- [x] **VERIF-02**: 3-tier verification model — auto (always), wave (boundaries), phase (human review)
- [x] **VERIF-03**: Integration validation ensures parallel work fits together correctly
- [x] **VERIF-04**: Verification failures block progression until resolved

### Debugging & Recovery

- [x] **DEBUG-01**: State integrity checks validate files before execution begins
- [x] **DEBUG-02**: Self-correction attempts up to 3 times before escalating to user
- [x] **DEBUG-03**: Clear escalation triggers — user always knows why AI is asking for help
- [x] **DEBUG-04**: Plain-language error messages — impact-focused, not technical jargon

### Mode Detection

- [x] **MODE-01**: Conversational entry point detects work scale
- [x] **MODE-02**: Feature-Mode provides streamlined single-phase workflow
- [x] **MODE-03**: Mode selection persists and can be changed mid-session

## v1.2 Requirements

Requirements for v1.2 milestone: Visibility & Refinement.

### Gap Closure

- [ ] **GAP-01**: Click dashboard task to see details in slide-out panel
- [ ] **GAP-02**: Dashboard live updates work reliably during execution
- [ ] **GAP-03**: Session resume — pick up exactly where you left off
- [ ] **GAP-04**: State validation on session start detects corruption or drift
- [ ] **GAP-05**: Drift detection integrated into /execute flow
- [ ] **GAP-06**: Dashboard server start UX — smart start from any directory

### Execution Diagram

- [ ] **DIAG-01**: Mermaid diagram of /arios entry point flow (mode detection, routing)
- [ ] **DIAG-02**: Mermaid diagram of /ideate flow (all decision branches, file outputs)
- [ ] **DIAG-03**: Mermaid diagram of /plan flow (subagent spawns, file writes)
- [ ] **DIAG-04**: Mermaid diagram of /execute flow (waves, verification, recovery)
- [ ] **DIAG-05**: Mermaid diagram of supporting commands (/status, /help, mode commands)
- [ ] **DIAG-06**: Master diagram linking all flows together

### Refinement Flow

- [ ] **REFINE-01**: DIAGRAM-NOTES.md template for user annotations
- [ ] **REFINE-02**: /arios:refine command reads notes and starts discussion
- [ ] **REFINE-03**: Implement changes from discussion (edit prompts, adjust flows)

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

### v1.0 Requirements (Complete)

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 3 | Complete |
| CORE-02 | Phase 1 | Complete |
| CORE-03 | Phase 4 | Complete |
| CORE-04 | Phase 3 | Complete |
| AGENT-01 | Phase 2 | Complete |
| AGENT-02 | Phase 2 | Complete |
| AGENT-03 | Phase 2 | Complete |
| AGENT-04 | Phase 6 | Complete |
| UX-01 | Phase 6 | Complete |
| UX-02 | Phase 5 | Complete |
| UX-03 | Phase 5 | Complete |
| UX-04 | Phase 3 | Complete |
| QUAL-01 | Phase 1 | Complete |
| QUAL-02 | Phase 5 | Complete |
| QUAL-03 | Phase 5 | Complete |

### v1.1 Requirements (Complete)

| Requirement | Phase | Status |
|-------------|-------|--------|
| E2E-01 | Phase 7 | Complete |
| E2E-02 | Phase 7 | Complete |
| E2E-03 | Phase 7 | Complete |
| E2E-04 | Phase 7 | Complete |
| E2E-05 | Phase 7 | Complete |
| EXEC-01 | Phase 8 | Complete |
| EXEC-02 | Phase 8 | Complete |
| EXEC-03 | Phase 8 | Complete |
| VERIF-01 | Phase 9 | Complete |
| VERIF-02 | Phase 9 | Complete |
| VERIF-03 | Phase 9 | Complete |
| VERIF-04 | Phase 9 | Complete |
| DEBUG-01 | Phase 10 | Complete |
| DEBUG-02 | Phase 10 | Complete |
| DEBUG-03 | Phase 10 | Complete |
| DEBUG-04 | Phase 10 | Complete |
| MODE-01 | Phase 11 | Complete |
| MODE-02 | Phase 11 | Complete |
| MODE-03 | Phase 11 | Complete |
| DASH-01 | Phase 12 | Complete |
| DASH-02 | Phase 12 | Complete |
| STATE-01 | Phase 12 | Complete |
| STATE-02 | Phase 12 | Complete |
| STATE-03 | Phase 12 | Complete |

### v1.2 Requirements

| Requirement | Phase | Status |
|-------------|-------|--------|
| GAP-01 | — | Pending |
| GAP-02 | — | Pending |
| GAP-03 | — | Pending |
| GAP-04 | — | Pending |
| GAP-05 | — | Pending |
| GAP-06 | — | Pending |
| DIAG-01 | — | Pending |
| DIAG-02 | — | Pending |
| DIAG-03 | — | Pending |
| DIAG-04 | — | Pending |
| DIAG-05 | — | Pending |
| DIAG-06 | — | Pending |
| REFINE-01 | — | Pending |
| REFINE-02 | — | Pending |
| REFINE-03 | — | Pending |

**Coverage:**
- v1.0 requirements: 15/15 complete
- v1.1 requirements: 24/24 complete
- v1.2 requirements: 15 total, 0 mapped to phases (pending roadmap)

---
*Requirements defined: 2026-01-24*
*Last updated: 2026-01-26 — v1.2 requirements defined*
