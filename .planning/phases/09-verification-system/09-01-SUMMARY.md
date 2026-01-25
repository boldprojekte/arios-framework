---
phase: "09"
plan: "01"
status: complete
completed: "2026-01-25"
duration: "2 min"
commits:
  - "c1b4cbc: feat(09-01): create verifier agent prompt structure"

subsystem: verification
tags: [verifier, subagent, verification, gap-detection, integration-check]

dependency-graph:
  requires: ["08-02 (recovery-agent)"]
  provides: ["verifier-agent for wave verification"]
  affects: ["09-02 (orchestrator verification flow)", "09-03 (phase verification)"]

tech-stack:
  added: []
  patterns: ["VERIFICATION COMPLETE return format", "gaps structured format", "3-tier verification model"]

key-files:
  created:
    - packages/arios-cli/templates/.claude/agents/verifier-agent.md
  modified: []

decisions:
  - id: "verifier-internal"
    choice: "Verifier communicates with orchestrator only, not user"
    rationale: "User sees orchestrator summaries, verifier provides actionable data for recovery"
  - id: "gaps-structured-format"
    choice: "Gaps reported as structured YAML in <gaps> block"
    rationale: "Enables orchestrator and recovery agent to parse programmatically"
  - id: "recommendation-enum"
    choice: "Four recommendation values: continue, recovery_needed, needs_review, human_review"
    rationale: "Clear decision tree for orchestrator to act on verification results"
---

# Phase 09 Plan 01: Verifier Agent Summary

Verification subagent that runs npm scripts, detects stubs with grep patterns, checks integration of parallel work, and returns structured gap reports for orchestrator to act on.

## Tasks Completed

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Create verifier agent prompt structure | done | c1b4cbc |
| 2 | Add stub detection and integration check patterns | done | (combined with Task 1) |

## Changes Made

- `packages/arios-cli/templates/.claude/agents/verifier-agent.md`: Created 322-line verifier agent prompt with:
  - Role section emphasizing internal communication (not user-facing)
  - verification_context input format for orchestrator spawning
  - Stub detection patterns (TODO/FIXME/XXX, empty returns, placeholder renders)
  - Integration check patterns (export/import consistency, API route consumption)
  - Timeout handling (5-minute total, per-command budgets)
  - VERIFICATION COMPLETE output format with structured gaps
  - Decision logic for recommendation (continue/recovery_needed/needs_review/human_review)
  - Two examples (clean verification, gaps found)

## Execution Notes

Tasks 1 and 2 were combined efficiently in a single commit since all content was logically coherent. No deviations from plan requirements.

## Verification

All plan verification criteria passed:
- verifier-agent.md exists (322 lines >= 150 minimum)
- Has frontmatter with name, description, tools, model
- Has role section explaining internal communication pattern
- Has verification_context input format
- Has stub detection patterns (TODO/FIXME/empty implementations)
- Has integration check patterns (export/import consistency)
- Has output format with ## VERIFICATION COMPLETE header
- Has recommendation logic (continue/recovery_needed/needs_review/human_review)

## Deviations from Plan

None - plan executed exactly as written (with efficient task combination).

## Next Phase Readiness

Ready for 09-02 (Orchestrator Verification Flow):
- verifier-agent.md provides complete agent prompt
- VERIFICATION COMPLETE format ready for orchestrator parsing
- Gaps format compatible with recovery-agent.md failure_context
