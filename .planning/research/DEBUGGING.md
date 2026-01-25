# Debugging & Recovery Patterns for Agentic Systems

**Researched:** 2026-01-25
**Domain:** AI agent debugging, state recovery, error detection, human escalation
**Confidence:** HIGH (patterns from multiple verified sources)

## Executive Summary

Debugging agentic AI systems differs fundamentally from debugging traditional software. The core challenge is that agents fail silently through drift and semantic errors, not just through crashes and exceptions. Research reveals three key insights for ARIOS:

1. **State drift is the primary failure mode**, not code errors. An agent's understanding can diverge from reality without triggering any traditional error signals.

2. **Detection requires semantic analysis**, not just error checking. Comparing "what the agent believes" versus "what's actually true" catches problems before they cascade.

3. **Escalation decisions should be rules-based with clear thresholds**. Confidence scoring, retry counts, and behavioral signals determine when to self-correct vs. involve the user.

---

## Common Failure Modes

### Category 1: State Synchronization Failures

These occur when ARIOS's tracked state diverges from actual project reality.

| Failure Mode | Description | How It Manifests |
|--------------|-------------|------------------|
| **Stale State** | STATE.md doesn't reflect recent manual changes | ARIOS suggests work already done |
| **Phantom Progress** | STATE.md says "complete" but files are broken | False confidence, later failures |
| **Lost Context** | Session ends without capturing decisions | Same questions asked repeatedly |
| **Conflicting Sources** | STATE.md disagrees with PLAN.md or SUMMARY.md | Contradictory behavior |

**Root cause:** File-based state is modified by both ARIOS and users, with no locking mechanism.

### Category 2: Semantic Drift

These occur when the agent's understanding diverges from user intent without explicit errors.

| Failure Mode | Description | How It Manifests |
|--------------|-------------|------------------|
| **Goal Drift** | Agent optimizes for wrong objective | Correct code, wrong feature |
| **Assumption Drift** | Implicit assumptions become invalid | Solutions don't fit context |
| **Context Collapse** | Long sessions lose important context | Earlier decisions forgotten |
| **Terminology Mismatch** | Agent and user use same words differently | Confusion, rework |

**Root cause:** LLMs are stateless; context must be reconstructed each session, and reconstruction can lose nuance.

### Category 3: Cascading Failures

These occur when an early mistake propagates through the system.

| Failure Mode | Description | How It Manifests |
|--------------|-------------|------------------|
| **Error Propagation** | One bad decision compounds | Each subsequent step fails worse |
| **Dependency Chain Break** | Wave 1 output doesn't match Wave 2 input | Integration failures at boundaries |
| **Fix Loop** | Debug attempt introduces new errors | Thrashing without progress |
| **Silent Corruption** | Partial fix leaves hidden inconsistencies | Works now, fails later |

**Root cause:** Agents often lack the ability to detect that their own previous output was incorrect.

### Category 4: User-Agent Misalignment

These occur when human and AI have different mental models.

| Failure Mode | Description | How It Manifests |
|--------------|-------------|------------------|
| **Scope Creep Blindness** | User expects X, agent delivers X+Y+Z | Over-engineering |
| **Implicit Requirements** | User assumed something obvious | Missing critical features |
| **Communication Breakdown** | Multiple clarifications don't resolve confusion | Frustration, repeated cycles |
| **Confidence Mismatch** | Agent confident when user skeptical, or vice versa | Trust erosion |

**Root cause:** Natural language is inherently ambiguous; agents may not surface uncertainty.

---

## Detection Strategies

### Strategy 1: State Integrity Checking

Detect when tracked state diverges from filesystem reality.

```
INTEGRITY CHECK PROTOCOL

1. Hash Validation
   - Read STATE.md checksum field
   - Recalculate hash from current frontmatter
   - If mismatch: external modification detected

2. Cross-File Consistency
   - Compare phase/planIndex in STATE.md
   - Check corresponding PLAN.md exists
   - Verify SUMMARY.md exists for "complete" status

3. Timestamp Sanity
   - lastActivity should not be in future
   - File mtime should be >= lastActivity
   - Recent changes should have recent timestamps

4. Orphan Detection
   - SUMMARY.md without corresponding state update
   - Plans marked complete without verification
   - State pointing to non-existent plans
```

**Implementation for ARIOS:**
```typescript
interface IntegrityResult {
  valid: boolean;
  issues: IntegrityIssue[];
  autoFixable: IntegrityIssue[];
  requiresUser: IntegrityIssue[];
}

type IntegrityIssue =
  | { type: 'checksum_mismatch'; expected: string; actual: string }
  | { type: 'orphan_summary'; planId: string }
  | { type: 'missing_plan'; planId: string }
  | { type: 'status_mismatch'; expected: string; actual: string }
  | { type: 'future_timestamp'; field: string; value: string };
```

### Strategy 2: Semantic Consistency Checking

Detect when agent understanding diverges from reality.

```
SEMANTIC CHECK PROTOCOL

1. Expectation Verification
   - Before acting, state what you expect to find
   - After reading, compare against expectation
   - Discrepancy = potential drift

2. Summary Validation
   - Ask agent to summarize current understanding
   - Compare summary against source files
   - Missing/incorrect items = drift

3. Decision Trail Audit
   - Each decision should trace to a user request or requirement
   - Orphan decisions (no clear origin) = potential drift
   - Contradictory decisions = definite drift

4. Goal Alignment Check
   - Periodically restate the objective
   - Verify current work serves that objective
   - Work without clear connection = goal drift
```

**Detection heuristics:**
- Agent writes code that doesn't match any requirement in PROJECT.md or CONTEXT.md
- Agent references decisions not found in STATE.md decisions list
- Agent claims something is "complete" but no SUMMARY.md exists
- Agent proposes to undo recently completed work

### Strategy 3: Behavioral Signal Detection

Monitor patterns that indicate trouble.

| Signal | Indicates | Response |
|--------|-----------|----------|
| Same error 3+ times | Fix not working | Change approach or escalate |
| Circular conversation | Misunderstanding | Explicit clarification needed |
| Decreasing confidence | Entering unknown territory | Slow down, verify more |
| Increasing complexity | Possible overengineering | Step back, simplify |
| User repeating themselves | Not being heard | Active acknowledgment |

**Trigger thresholds for ARIOS:**
```
AUTOMATIC ESCALATION TRIGGERS:
- 3 consecutive checkpoint failures
- Same diagnostic in 2+ debug attempts
- User says "that's not what I meant" or similar
- Plan execution takes 5x longer than similar past plans
- Generated code fails to compile/run 3+ times

SELF-CORRECTION TRIGGERS:
- Single checkpoint failure
- Type errors in generated code
- Missing imports or dependencies
- Formatting inconsistencies
- Minor deviations from codebase patterns
```

### Strategy 4: Proactive Sanity Checks

Verify understanding before it matters.

```
PRE-EXECUTION CHECK:
Before executing a plan, verify:
[ ] Plan still exists and hasn't been modified
[ ] Dependencies are marked complete
[ ] No blocking issues in STATE.md
[ ] Understanding matches plan requirements

POST-EXECUTION CHECK:
After completing a plan, verify:
[ ] All files_modified actually exist
[ ] Code compiles/runs
[ ] Tests pass (if applicable)
[ ] SUMMARY.md accurately reflects what was done
```

---

## Recovery Patterns

### Pattern 1: Self-Correction (AI Fixes Itself)

Use when: Error is technical, bounded, and doesn't require new information from user.

```
SELF-CORRECTION FLOW:

1. Detect Issue
   - Checkpoint failure
   - Type/syntax error
   - Missing dependency

2. Diagnose
   - Read error output
   - Identify root cause
   - Determine if fixable without user input

3. Attempt Fix (max 3 attempts)
   - Apply targeted fix
   - Re-run verification
   - If still failing, try different approach

4. Report Outcome
   - Success: Log fix, continue
   - Failure: Escalate with diagnostic
```

**Appropriate for:**
- Missing imports
- Type errors
- Formatting issues
- Simple logic bugs with clear error messages
- Configuration issues (wrong port, missing env var)

**Not appropriate for:**
- Ambiguous requirements
- Design decisions
- Feature scope questions
- Errors without clear diagnostic

### Pattern 2: Rollback (Undo and Retry)

Use when: Work in progress is corrupted beyond easy repair.

```
ROLLBACK FLOW:

1. Identify Rollback Point
   - Last successful checkpoint
   - Last known good state
   - Beginning of current plan

2. Preserve Evidence
   - Save current broken state for debugging
   - Log what was attempted
   - Note what failed and why

3. Restore Previous State
   - Revert files to checkpoint state
   - Update STATE.md to match
   - Clear partial progress markers

4. Retry with Modifications
   - Different approach to same goal
   - Or escalate if approach unclear
```

**Rollback is safe when:**
- No schema migrations have run
- No external API calls with side effects
- No user data has been modified
- Changes are isolated to the current plan

**Rollback is unsafe when:**
- Database state has changed
- External services have been notified
- Other systems depend on current state
- Significant time has passed (context lost)

### Pattern 3: Fix Forward (Repair and Continue)

Use when: Rollback is unsafe or would lose significant progress.

```
FIX FORWARD FLOW:

1. Stabilize Current State
   - Make system runnable (even if not fully correct)
   - Prevent further degradation
   - Add temporary workarounds if needed

2. Document the Problem
   - What went wrong
   - What's currently broken
   - What needs to be fixed

3. Plan Incremental Fixes
   - Break repair into small, verifiable steps
   - Each step should leave system stable
   - Test after each step

4. Execute Repair Sequence
   - Apply fixes one at a time
   - Verify stability after each
   - Be prepared to pause and escalate
```

**Fix forward is preferred when:**
- Rolling back would lose significant work
- The issue is localized and understood
- A clear path to resolution exists
- Time pressure exists

### Pattern 4: User Escalation (Ask for Help)

Use when: AI cannot resolve the issue autonomously.

```
ESCALATION FLOW:

1. Summarize Situation
   - What was being attempted
   - What went wrong
   - What has been tried

2. Present Options
   - Option A: Suggested fix with tradeoffs
   - Option B: Alternative approach
   - Option C: User decides how to proceed

3. Provide Context
   - Relevant file paths
   - Error messages
   - Diagnostic information

4. Wait for Direction
   - Do not proceed without user input
   - Accept user's choice gracefully
   - Adapt based on feedback
```

---

## User Escalation Decision Framework

### When to Escalate Immediately

**ALWAYS escalate when:**
- User explicitly requests human control
- Security or data integrity is at risk
- User expresses frustration or confusion
- Same error occurs 3+ times with different fixes
- Proposed action would be destructive or irreversible
- AI confidence is below threshold for the action's risk level

### Escalation Decision Tree

```
ISSUE DETECTED
     |
     v
Is this a code/technical error?
     |
     +--> YES --> Is the error message clear?
     |               |
     |               +--> YES --> Can I fix without changing requirements?
     |               |               |
     |               |               +--> YES --> SELF-CORRECT (max 3 tries)
     |               |               |               |
     |               |               |               v
     |               |               |           Still failing?
     |               |               |               |
     |               |               |               +--> YES --> ESCALATE
     |               |               |               |
     |               |               |               +--> NO --> Continue
     |               |               |
     |               |               +--> NO --> ESCALATE (scope question)
     |               |
     |               +--> NO --> Try 2 diagnostic approaches
     |                               |
     |                               v
     |                           Found root cause?
     |                               |
     |                               +--> YES --> SELF-CORRECT
     |                               |
     |                               +--> NO --> ESCALATE
     |
     +--> NO --> Is this a requirement/design question?
                     |
                     +--> YES --> ESCALATE (always)
                     |
                     +--> NO --> Is user involved in current decision?
                                     |
                                     +--> YES --> ESCALATE
                                     |
                                     +--> NO --> Log concern, continue
```

### Escalation Message Template

```markdown
## Attention Needed

**What happened:**
[Brief description of the issue]

**What I tried:**
1. [First attempt and result]
2. [Second attempt and result]
3. [Third attempt and result, if applicable]

**What I think the problem is:**
[Diagnosis or "I'm not sure"]

**Options:**

1. **[Option A]** - [Brief description]
   - Pros: [advantages]
   - Cons: [disadvantages]

2. **[Option B]** - [Brief description]
   - Pros: [advantages]
   - Cons: [disadvantages]

3. **Tell me what to do**
   - If you have a specific fix in mind

**Relevant files:**
- [file path 1]
- [file path 2]

How would you like to proceed?
```

---

## State Management During Debugging

### Preserving Context Across Debug Sessions

**Problem:** Debug sessions may span multiple conversations, losing context.

**Solution:** Write debug context to files.

```
.planning/debug/
├── CURRENT_ISSUE.md      # Active issue being debugged
├── ATTEMPTS.md           # What has been tried
└── DIAGNOSTIC.md         # Collected information
```

**CURRENT_ISSUE.md format:**
```markdown
---
created: 2026-01-25
status: investigating
attempts: 2
maxAttempts: 3
---

# Current Issue

## Symptom
[What the user sees / what failed]

## Context
- Phase: [X]
- Plan: [Y]
- Last successful action: [Z]

## Related Files
- [file path]: [why relevant]

## Working Hypothesis
[Current best guess at root cause]
```

**ATTEMPTS.md format:**
```markdown
# Debug Attempts

## Attempt 1 - [timestamp]
**Hypothesis:** [what we thought was wrong]
**Action:** [what we tried]
**Result:** [what happened]
**Learning:** [what this told us]

## Attempt 2 - [timestamp]
...
```

### State Snapshots for Rollback

Before any potentially risky operation, capture state:

```typescript
interface StateSnapshot {
  timestamp: string;
  trigger: string;  // What action is about to happen
  state: {
    stateMd: string;      // Full content of STATE.md
    currentPlan: string;  // Full content of current plan
    modifiedFiles: Map<string, string>;  // Files that will be changed
  };
  canRollback: boolean;  // Whether rollback is safe
  rollbackNote: string;  // Why rollback might be unsafe
}
```

### Recovery State Machine

```
NORMAL
  |
  v
ISSUE_DETECTED --> Is it recoverable? --> NO --> ESCALATED
  |                                               |
  | YES                                           v
  v                                          [Wait for user]
DIAGNOSING                                        |
  |                                               v
  v                                          USER_DIRECTED
ATTEMPTING_FIX                                    |
  |                                               v
  +--> Success --> NORMAL                    [Execute user fix]
  |                                               |
  +--> Failure --> attempts < max?                v
                      |                      NORMAL (or back to ISSUE_DETECTED)
                      +--> YES --> DIAGNOSING
                      |
                      +--> NO --> ESCALATED
```

---

## Recommendations for ARIOS Debug Capability

### 1. Implement Pre-Flight Checks

Before every plan execution:
```typescript
async function preFlightCheck(planId: string): Promise<PreFlightResult> {
  return {
    stateIntegrity: await checkStateIntegrity(),
    planExists: await verifyPlanExists(planId),
    dependenciesMet: await checkDependencies(planId),
    noBlockers: await checkBlockers(),
    estimatedRisk: calculateRisk(planId)
  };
}
```

### 2. Add Debug Mode Command

```
/arios:debug

Enters debug mode with:
- Enhanced logging
- State snapshots before actions
- Confirmation prompts for risky operations
- Detailed diagnostic output
```

### 3. Create Issue Detection Hooks

```typescript
// After every significant action
async function postActionCheck(action: Action, result: Result): Promise<void> {
  const issues = await detectIssues(action, result);

  if (issues.length > 0) {
    const severity = maxSeverity(issues);

    if (severity === 'critical') {
      await escalateImmediately(issues);
    } else if (severity === 'warning') {
      await logForReview(issues);
    }
  }
}
```

### 4. Build Recovery Infrastructure

**Required files:**
- `.planning/debug/` directory for debug state
- Recovery functions in orchestrator
- Rollback capabilities for each action type

**Required state tracking:**
- Last successful checkpoint
- Current issue (if any)
- Debug attempts history
- Rollback points

### 5. User Communication Patterns

**For non-coders, prioritize clarity:**

DO:
- "Something went wrong while creating the login page"
- "I tried to fix it 3 times but couldn't"
- "Here are two options for how to proceed"

DON'T:
- "TypeError: Cannot read property 'map' of undefined"
- "The dependency injection container failed to resolve"
- Technical jargon without context

**Translate errors to impact:**
- "The app won't start" (not "Port 3000 EADDRINUSE")
- "The database connection failed" (not "ECONNREFUSED 127.0.0.1:5432")
- "Something is configured incorrectly" (not "Missing environment variable")

### 6. Confidence Scoring System

```typescript
type ConfidenceLevel = 'high' | 'medium' | 'low';

interface ActionConfidence {
  level: ConfidenceLevel;
  reason: string;
  proceedAutonomously: boolean;
}

function assessConfidence(action: Action): ActionConfidence {
  // High confidence: clear requirements, proven patterns, low risk
  // Medium confidence: some ambiguity, but reasonable guess
  // Low confidence: significant uncertainty, high risk

  if (action.risk === 'high' || action.ambiguity === 'high') {
    return { level: 'low', reason: '...', proceedAutonomously: false };
  }
  // ...
}
```

### 7. Debug Session Persistence

When a debug session ends without resolution:

```markdown
# Debug Session Paused

**Issue:** [description]
**Status:** Awaiting user input / Scheduled for later / Blocked

**To resume:**
Run `/arios:debug` to continue investigating.

**Context preserved in:**
- .planning/debug/CURRENT_ISSUE.md
- .planning/debug/ATTEMPTS.md
```

---

## Quality Checklist

- [x] Common failure modes identified (4 categories, 16 specific modes)
- [x] Detection strategies included (4 strategies with implementation guidance)
- [x] Recovery vs escalation decision tree provided
- [x] State preservation patterns documented
- [x] ARIOS-specific recommendations included
- [x] Non-coder user considerations addressed

---

## Sources

### Primary (HIGH confidence)
- [Understanding and Mitigating Failure Modes in LLM-Based Multi-Agent Systems - MarkTechPost](https://www.marktechpost.com/2025/03/25/understanding-and-mitigating-failure-modes-in-llm-based-multi-agent-systems/)
- [Why Multi-Agent LLM Systems Fail (and How to Fix Them) - Augment Code](https://www.augmentcode.com/guides/why-multi-agent-llm-systems-fail-and-how-to-fix-them)
- [Error Recovery and Fallback Strategies in AI Agent Development - GoCodeo](https://www.gocodeo.com/post/error-recovery-and-fallback-strategies-in-ai-agent-development)
- [When to hand off to a human: How to set effective AI escalation rules - Replicant](https://www.replicant.com/blog/when-to-hand-off-to-a-human-how-to-set-effective-ai-escalation-rules)
- [Service Recovery: Rolling Back vs. Forward Fixing - LinkedIn](https://www.linkedin.com/pulse/service-recovery-rolling-back-vs-forward-fixing-mohamed-el-geish)

### Secondary (MEDIUM confidence)
- [Ensuring Reliability in AI Agents: Overcoming Drift and Inconsistencies - Medium](https://medium.com/@kuldeep.paul08/ensuring-reliability-in-ai-agents-overcoming-drift-and-inconsistencies-ed878c57155e)
- [Context Observability Agent: Monitoring Semantic Integrity - Akira AI](https://www.akira.ai/blog/context-observability-agent)
- [Designing Escalation and Override Workflows for AI Agents - Cobbai](https://cobbai.com/blog/ai-agent-escalation-design)
- [5 Recovery Strategies for Multi-Agent LLM Failures - newline](https://www.newline.co/@zaoyang/5-recovery-strategies-for-multi-agent-llm-failures--673fe4c4)
- [Self-Correcting AI Agents: How to Build AI That Learns From Its Mistakes - newline](https://www.newline.co/@LouisSanna/self-correcting-ai-agents-how-to-build-ai-that-learns-from-its-mistakes--414dc7ad)

### Tertiary (ARIOS-specific context)
- ARIOS STATE.md patterns from Phase 4 research
- ARIOS execution flow recovery from Phase 5 research
- Existing ARIOS decisions in STATE.md

---

## Metadata

**Confidence breakdown:**
- Failure modes: HIGH - Well-documented in multi-agent research literature
- Detection strategies: HIGH - Proven patterns from production systems
- Recovery patterns: HIGH - Standard software engineering practices adapted for agents
- Escalation framework: MEDIUM - Principles clear, specific thresholds need tuning
- ARIOS recommendations: MEDIUM - Based on existing ARIOS architecture, implementation untested

**Research date:** 2026-01-25
**Valid until:** 2026-04-25 (90 days - rapidly evolving domain, revisit for new patterns)
