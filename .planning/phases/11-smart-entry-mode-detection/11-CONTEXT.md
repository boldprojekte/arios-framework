# Phase 11: Smart Entry & Mode Detection - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Conversational routing that adapts ARIOS to work scale. `/arios` detects whether work is Feature-Mode (single-phase, scoped) or Project-Mode (multi-phase, open-ended) and routes accordingly. Execution, verification, and recovery infrastructure (Phases 8-10) remain mode-agnostic.

</domain>

<decisions>
## Implementation Decisions

### Conversation Flow
- Context-aware opening: check existing state first, only ask if unclear
- Keep asking until confident about work scale (3+ exchanges if needed)
- Confirm detected mode before proceeding: "Sounds like a feature — does that match what you're thinking?"
- Professional assistant tone: "I understand you'd like to add authentication. Let me plan that."

### Mode Boundaries
- Binary: Feature-Mode or Project-Mode, no middle ground
- Project-Mode triggered by scope requiring multiple phases
- Feature-Mode for work that fits in a single phase
- "Complete project" (building from scratch) is automatically Project-Mode
- If Feature-Mode work grows larger during planning: ask user if they want to switch to Project-Mode
- v1.1 simplification: If roadmap already exists, always resume in Project-Mode. Context-based detection of "quick feature outside roadmap" deferred to v1.2.

### Override & Correction
- Both inline correction ("actually this is bigger") and explicit commands (/arios:feature, /arios:project) available
- Once mode is set, user must complete or restart — no mid-work mode changes
- Binary confirmation: "Feature-Mode — correct?" User says yes or describes why not
- Explicit mode commands (/arios:feature, /arios:project) skip detection conversation but still check for active work/state

### Feature-Mode Scope
- Single-phase workflow: waves and tasks, no multi-phase roadmap
- Uses same .planning/ directory structure — same patterns, lighter content
- Full stages: discuss → research → plan → execute (same as a Project-Mode phase)
- On completion: archive to .planning/archive/ (same as phase completion)

### Claude's Discretion
- Exact phrasing of detection questions
- How to handle edge cases in scope detection
- Error messaging when explicit commands conflict with active state

</decisions>

<specifics>
## Specific Ideas

- Mode detection is about scope, not complexity: "If it fits in one phase, that's great"
- The confirmation prompt is binary — user says yes or explains why not
- Explicit commands respect active state: "skip but be aware of things that are active"

</specifics>

<deferred>
## Deferred Ideas

- Context-based mode detection within existing projects (quick feature outside roadmap) — v1.2
- Mode switching mid-work — decided against for v1.1, could revisit

</deferred>

---

*Phase: 11-smart-entry-mode-detection*
*Context gathered: 2026-01-25*
