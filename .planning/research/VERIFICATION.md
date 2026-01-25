# Verification Patterns for AI-Generated Code

**Context:** ARIOS v1.1 verifier subagent design
**Researched:** 2026-01-25
**Confidence:** MEDIUM-HIGH (multiple authoritative sources, verified patterns)

## Executive Summary

Verification in AI workflow systems must go beyond "code runs and tests pass." Research reveals that AI-generated code contains 1.7x more defects than human-written code, with 75% more errors in logic alone. The verifier subagent should address three critical gaps: (1) integration verification across parallel work, (2) intent alignment with original requirements, and (3) early detection to prevent error compounding.

ARIOS already has checkpoint verification (app runs + tests pass). The verifier subagent should operate as a **post-execution quality gate** that catches what checkpoints miss.

---

## Verification Dimensions

### 1. Code Quality Verification

**What checkpoints already cover:**
- App starts successfully
- Tests pass (exit code 0)

**What verifier should add:**

| Check | Method | Why |
|-------|--------|-----|
| **Static analysis** | Run ESLint/TypeScript compiler | Catches type errors, unused variables, patterns that compile but indicate bugs |
| **Style consistency** | Compare against patterns.json | Code should match project conventions (already partially in executor) |
| **Security scan** | Run npm audit / Snyk-like checks | AI hallucinates dependencies; some may be malicious or non-existent |
| **Dependency verification** | Verify packages exist in registry | AI invents package names; attackers can register them |
| **No TODO/FIXME left** | Grep for incomplete markers | AI sometimes inserts placeholders and moves on |

**Priority checks (HIGH value/effort ratio):**
1. TypeScript compilation with strict mode
2. Dependency existence verification
3. Linting errors (not warnings)

**Implementation note:** These checks are deterministic and fast. Run them automatically, fail hard on errors.

---

### 2. Integration Verification

**The parallel work problem:**

ARIOS spawns multiple executors in waves. Each executor works in isolation with its own context window. Common integration failures:

| Failure Mode | Cause | Detection Method |
|--------------|-------|------------------|
| **Import conflicts** | Two files export same name | TypeScript compiler, static analysis |
| **Semantic conflicts** | Code compiles but behavior conflicts | Integration tests, differential testing |
| **Shared state races** | Parallel writes to same state | File modification timestamp analysis |
| **Contract violations** | Module A expects interface B didn't provide | TypeScript strict mode, interface tests |

**Verification approaches:**

1. **Post-wave integration build**
   - After each wave completes, run full TypeScript compilation
   - Catches import/export mismatches before next wave starts
   - ARIOS already has waves; add integration check between them

2. **Cross-file consistency**
   - Extract all exports from new/modified files
   - Extract all imports from new/modified files
   - Verify all imports resolve to actual exports
   - Flag unused exports (may indicate incomplete integration)

3. **Semantic conflict detection**
   - If tests exist: Run full test suite (not just affected tests)
   - If no tests: Flag for human review with specific integration questions

**Research finding:** SafeMerge and TIM tools use symbolic execution to detect semantic conflicts. This is complex for ARIOS scope, but the principle applies: textual merge success does not mean semantic success.

---

### 3. Intent Alignment Verification

**The hardest problem:** Code works but doesn't solve the original problem.

**Why this happens:**
- AI pattern-matches without true understanding
- Edge cases not covered in original prompt
- Subtle logic flaws in common-case-focused implementations
- Architectural drift from original design

**Verification approaches:**

| Approach | Implementation | Confidence |
|----------|----------------|------------|
| **Requirement traceability** | Map completed tasks back to REQUIREMENTS.md items | HIGH |
| **Semantic embedding comparison** | Compare original intent embedding with implementation summary | MEDIUM (experimental) |
| **Human checkpoint** | Show user what was built, ask "does this match what you wanted?" | HIGH |
| **LLM self-review** | Have different model review implementation against requirements | MEDIUM |

**Practical recommendation for ARIOS:**

Intent alignment is fundamentally a human judgment. The verifier should:
1. Generate a summary of what was built (not code, narrative)
2. Map changes back to requirements/plan items
3. Highlight any areas of ambiguity or deviation
4. Present to user with specific questions

**Research finding (formal verification):** Astrogator system achieves 83% proof of correctness and 92% detection of incorrect code by using formal query languages. While impractical for general ARIOS use, the principle suggests value in having users confirm formal specification matches intent before execution.

---

## Verification Timing

### When to Verify (Decision Matrix)

| Trigger | Verification Type | Rationale |
|---------|------------------|-----------|
| **Per-task** | None (overkill) | Executor already verifies task-level. Adding more slows execution. |
| **Per-wave** | Integration checks | Parallel work may conflict. Catch before next wave builds on errors. |
| **Per-phase** | Full verification | Phase is logical boundary. Human checkpoint natural here. |
| **Pre-checkpoint** | Automated only | Fast checks before blocking for human. |
| **Post-checkpoint** | Intent alignment | User is already engaged; ask about intent. |

### Recommended ARIOS Flow

```
Wave 1 complete
    |
    v
[Quick integration check]  <-- Verifier: compile, lint, dependency check
    |                           (< 30 seconds, automated)
    |
    v (if passes)
Wave 2 executes...
    |
    v
Wave N complete (phase checkpoint)
    |
    v
[Full verification]  <-- Verifier: integration + quality + security
    |
    v
[Human checkpoint]  <-- Existing: "Does app run? Do tests pass?"
    |
    v
[Intent alignment]  <-- Verifier: "Here's what was built. Match your intent?"
    |
    v (if all pass)
Next phase begins
```

### Error Compounding Prevention

**Critical insight from research:** Error rates compound exponentially. 95% reliability per step = only 36% success over 20 steps.

**Implications for ARIOS:**
- Verify early, verify often
- A failed wave 1 should NEVER proceed to wave 2
- The verifier's job is to stop propagation, not just report

**Detection before compounding:**
1. **After wave 1:** Most critical. Foundation errors affect everything.
2. **After any wave with shared state changes:** Database, global config, shared types.
3. **Before human-facing output:** Integration and intent checks before showing user.

---

## Reporting Patterns

### Report Structure for Verifier Output

```markdown
## Verification Report

**Phase:** {phase_number}
**Wave:** {wave_number}
**Status:** PASSED | FAILED | NEEDS_REVIEW

### Automated Checks

| Check | Result | Details |
|-------|--------|---------|
| TypeScript compilation | PASS/FAIL | {error count, first error} |
| Linting | PASS/FAIL | {error count} |
| Dependency audit | PASS/FAIL | {missing/vulnerable packages} |
| Integration build | PASS/FAIL | {unresolved imports} |

### Integration Analysis

**Files modified this wave:** {count}
**Files with potential conflicts:** {list if any}
**Cross-file dependencies verified:** YES/NO

### Intent Alignment Summary

**What was built:**
- {narrative summary, 2-3 sentences}

**Mapped to requirements:**
- REQ-01: {status}
- REQ-02: {status}

**Deviations or ambiguities:**
- {any areas where implementation differs from plan}

### Recommendation

{PROCEED | BLOCK | NEEDS_HUMAN_REVIEW}

**If BLOCK:** {specific failure that must be fixed}
**If NEEDS_HUMAN_REVIEW:** {specific question for user}
```

### Surfacing Issues to User

**Severity levels:**

| Level | Action | Example |
|-------|--------|---------|
| **BLOCKING** | Stop execution, require fix | TypeScript won't compile, tests fail |
| **WARNING** | Continue but highlight | Linting warnings, unused exports |
| **INFO** | Log for review | Style deviations, TODOs found |
| **REVIEW** | Ask user | Intent alignment questions |

**User experience considerations:**
- Don't overwhelm with noise
- Lead with actionable items
- Provide context for failures (not just "TypeScript error" but "line 42: expected string, got number")
- If human review needed, ask specific questions (not "does this look right?")

---

## Recommendations for ARIOS Verifier

### Subagent Design

**Role:** Post-execution verification specialist

**Spawned by:** Orchestrator after wave/phase completion

**Inputs:**
- Phase/wave number that just completed
- List of files modified
- Original plan/requirements references
- Previous verification reports (for trend analysis)

**Outputs:**
- Verification report (markdown)
- PROCEED/BLOCK/REVIEW decision
- Specific questions for user (if REVIEW)

### Verification Checklist (Prioritized)

**Tier 1: Automated, Fast, Always Run**
1. TypeScript/build compilation
2. Dependency existence check (npm ls, verify resolution)
3. Critical linting errors (not warnings)
4. Import/export resolution

**Tier 2: Automated, After Waves with Integration Risk**
5. Full test suite run
6. Security audit (npm audit)
7. Cross-file dependency analysis

**Tier 3: Human-Assisted, At Phase Boundaries**
8. Intent alignment summary
9. Requirement mapping review
10. Architecture consistency check

### Integration with Existing ARIOS Components

**checkpoint.ts:** Keep as-is. Verifier adds to, not replaces.

**recovery.ts:** Wire verifier failures into recovery flow:
- Verifier BLOCK -> spawn debug subagent
- Verifier REVIEW -> pause for human (don't auto-retry)

**executor.md:** Add verification step after wave completion:
- Executor completes wave
- Orchestrator spawns verifier
- Verifier reports
- Orchestrator decides next action

### Anti-Patterns to Avoid

| Anti-Pattern | Why Bad | Instead |
|--------------|---------|---------|
| **Declare victory too early** | Running one test and moving on misses regressions | Run full suite at wave boundaries |
| **Silent pass-through** | "No errors found" without checking | Always generate report showing what was checked |
| **AI reviewing AI without structure** | Can miss same errors | Use deterministic checks; LLM review for intent only |
| **Blocking on warnings** | Stops velocity for minor issues | Block only on errors; warn on warnings |
| **Skipping verification for "simple" changes** | Simple changes cause integration issues too | Always verify; make it fast enough to not matter |

### Verification Subagent Prompt Structure

```markdown
---
name: verifier
description: Validates work quality, integration, and intent alignment after execution
tools: Read, Bash, Grep, Glob
model: inherit
---

<role>
You are the ARIOS verifier. You validate work AFTER executors complete.

Your job: Catch what checkpoints miss.
- Integration issues across parallel work
- Intent drift from original requirements
- Quality issues that compile but indicate problems

You DO NOT fix issues. You report them clearly so orchestrator can decide.
</role>

<input>
From orchestrator:
- Phase and wave just completed
- Files modified (list)
- Plan reference
- Requirements reference
- Previous verification reports
</input>

<verification_protocol>
1. Run automated checks (TypeScript, lint, dependencies)
2. Analyze integration (imports/exports, cross-file)
3. Generate intent summary (what was built vs what was requested)
4. Produce structured report
5. Return PROCEED/BLOCK/REVIEW decision
</verification_protocol>

<output>
## VERIFICATION COMPLETE

**Decision:** PROCEED | BLOCK | REVIEW

### Report
{structured report per template}

### For Orchestrator
{specific next action recommendation}
</output>
```

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Automated verification checks | HIGH | Well-established tools, deterministic |
| Timing recommendations | HIGH | Matches industry patterns for CI/CD |
| Integration verification | MEDIUM | Patterns are clear; ARIOS-specific implementation needs design |
| Intent alignment | MEDIUM | Human judgment required; AI assist is supplementary |
| Error compounding prevention | HIGH | Mathematical basis, well-documented in research |

---

## Sources

**AI Code Verification Patterns:**
- [Zencoder - How to Use AI in Coding Best Practices 2026](https://zencoder.ai/blog/how-to-use-ai-in-coding)
- [Addy Osmani - LLM Coding Workflow 2026](https://addyosmani.com/blog/ai-coding-workflow/)
- [Qodo - AI Code Review Tools 2026](https://www.qodo.ai/blog/best-ai-code-review-tools-2026/)
- [GetDX - AI Code Enterprise Adoption 2025](https://getdx.com/blog/ai-code-enterprise-adoption/)
- [OpenSSF - Security-Focused Guide for AI Code](https://best.openssf.org/Security-Focused-Guide-for-AI-Code-Assistant-Instructions)

**Multi-Agent Verification:**
- [Anthropic - How We Built Our Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Galileo - Multi-Agent Coordination Failure Mitigation](https://galileo.ai/blog/multi-agent-coordination-failure-mitigation)
- [Microsoft - AI Agent Orchestration Patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)
- [PubNub - Best Practices for Claude Code Subagents](https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/)

**LLM Code Quality Research:**
- [Rethinking Verification for LLM Code Generation (arxiv)](https://arxiv.org/abs/2507.06920)
- [Quality Assurance of LLM-generated Code: NFQCs (arxiv)](https://arxiv.org/html/2511.10271v1)
- [Formal Verification of LLM-Generated Code (arxiv)](https://arxiv.org/abs/2507.13290)
- [GitHub Docs - Review AI-Generated Code](https://docs.github.com/en/copilot/tutorials/review-ai-generated-code)

**Error Compounding & Cascading Failures:**
- [OWASP ASI08 - Cascading Failures in Agentic AI 2026](https://adversa.ai/blog/cascading-failures-in-agentic-ai-complete-owasp-asi08-security-guide-2026/)
- [Partnership on AI - Real-Time Failure Detection](https://partnershiponai.org/resource/prioritizing-real-time-failure-detection-in-ai-agents/)
- [Galileo - Agent Failure Modes Guide](https://galileo.ai/blog/agent-failure-modes-guide)
- [Substack - Agent Failure Modes: Compounding Errors](https://pleasebringstrangethings.substack.com/p/agent-failure-modes-compounding-errors)

**Parallel Integration:**
- [GitHub - Semantic-Merge-Conflict-Detection](https://github.com/brendon-ng/Semantic-Merge-Conflict-Detection)
- [Mergify - Parallel Checks](https://docs.mergify.com/merge-queue/parallel-checks/)

**AI Workflow Orchestration:**
- [Medium - AI Agent Workflow Orchestration 2026](https://medium.com/@dougliles/ai-agent-workflow-orchestration-d49715b8b5e3)
- [Zapier - Human-in-the-Loop in AI Workflows](https://zapier.com/blog/human-in-the-loop/)
