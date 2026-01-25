# Phase 9: Verification System - Research

**Researched:** 2026-01-25
**Domain:** Verification subagent architecture, 3-tier verification model, parallel work integration
**Confidence:** HIGH

## Summary

This research focuses on how to implement the ARIOS verification system by analyzing existing GSD patterns (gsd-verifier, gsd-plan-checker, gsd-integration-checker, gsd-debugger) and the established ARIOS orchestrator-subagent communication patterns.

The ARIOS verification system differs from GSD in a key way: the **verifier communicates with the orchestrator, not directly with the user**. It provides enough context for the recovery agent to fix issues autonomously. Users only see verification results when auto-repair is exhausted or at phase-end checkpoints.

The 3-tier verification model (auto, wave, phase) maps cleanly to the existing wave execution structure from Phase 8. Auto-verification runs inline during execution, wave-verification runs between waves, and phase-verification triggers human review at phase boundaries.

**Primary recommendation:** Create a `verifier-agent.md` that returns structured verification results to the orchestrator, using the established `## X COMPLETE/FAILED` pattern from Phase 7. The orchestrator decides whether to spawn recovery or escalate based on the verifier's report.

## Standard Stack

This phase uses existing ARIOS infrastructure with no new external dependencies.

### Core
| Component | Location | Purpose | Why Standard |
|-----------|----------|---------|--------------|
| verifier-agent.md | `.claude/agents/` | Verification subagent prompt | Follows established ARIOS agent pattern |
| orchestrate.md updates | `.claude/commands/arios/` | Verification integration | Extends existing orchestrator |
| recovery-agent.md | `.claude/agents/` | Already exists from Phase 8 | Handles verification_failure type |

### Supporting
| Component | Location | Purpose | When to Use |
|-----------|----------|---------|-------------|
| .planning/config.json | Project root | npm scripts for verification | When configured (test, build, lint) |
| Bash tool | Claude Code native | Running npm scripts | Always for auto-verification |
| Grep/Read tools | Claude Code native | Code inspection | For code review checks |

### Existing Patterns to Reuse
| Pattern | Source | Apply To |
|---------|--------|----------|
| Compact return format | Phase 7 (07-02) | Verifier returns to orchestrator |
| Inline content loading | Phase 8 (08-01) | Loading changed files for review |
| Recovery spawning | Phase 8 (08-02) | Spawning recovery on failure |
| Task tool parallel calls | Phase 8 (08-01) | Parallel diff aggregation |

## Architecture Patterns

### Recommended Structure

```
packages/arios-cli/templates/.claude/
├── agents/
│   ├── verifier-agent.md       # NEW: verification subagent
│   └── recovery-agent.md       # EXISTS: handles verification_failure
├── commands/
│   └── arios/
│       └── orchestrate.md      # UPDATE: add verification flow
```

### Pattern 1: Verifier as Internal Agent (Not User-Facing)

**What:** Verifier reports to orchestrator, not user. Orchestrator decides next action.

**When to use:** Always - this is the core architectural decision from CONTEXT.md.

**Derived from GSD:**
- gsd-verifier writes VERIFICATION.md with structured gaps
- gsd-plan-checker returns structured issues for planner
- Both provide actionable output for the next agent, not human presentation

**ARIOS adaptation:**
```markdown
## VERIFICATION COMPLETE

**Status:** passed | gaps_found | needs_review
**Wave:** {N}
**Checks:** auto | wave | phase

### Results
- npm test: {PASS/FAIL}
- npm build: {PASS/FAIL}
- Code review: {PASS/gaps_found}

### Gaps (if any)
<gaps>
- type: {stub_detected | wiring_missing | type_error}
  file: {path}
  issue: {description}
  severity: {blocker | warning}
</gaps>

### Recommendation
{continue | recovery_needed | human_review}
```

**Key insight:** The orchestrator parses this and decides:
- `passed` + `continue` → proceed to next wave
- `gaps_found` + `recovery_needed` → spawn recovery-agent.md
- `needs_review` + `human_review` → pause for user

### Pattern 2: 3-Tier Verification Model

**What:** Different verification depth at different execution points.

**When to use:** As defined in requirements VERIF-02.

**Tier structure:**

| Tier | Trigger | Checks | Handled By |
|------|---------|--------|------------|
| Auto | During task execution | Syntax, compile, basic runtime | Executor directly |
| Wave | Between waves | npm scripts, code review, integration | Verifier agent |
| Phase | At phase end | Human review, manual testing | User |

**Implementation mapping:**

```
AUTO VERIFICATION (inline)
- Already exists in executor task completion flow
- Task <verify> element runs after each task
- Exit code checked, errors trigger recovery

WAVE VERIFICATION (verifier agent)
- Orchestrator spawns verifier after wave completes
- Verifier runs configured npm scripts (test, build, lint)
- Verifier does code review on aggregated diff
- Returns structured result for orchestrator decision

PHASE VERIFICATION (human checkpoint)
- At phase end, orchestrator presents summary
- User reviews what was built
- User tests manually with provided instructions
- User approves or reports issues → new repair cycle
```

### Pattern 3: Aggregated Diff for Parallel Work Review

**What:** After parallel waves, verifier gets combined diff from ALL executors.

**When to use:** When wave has multiple parallel plans (e.g., Wave 1 with 08-01, 08-02, 08-03).

**Derived from CONTEXT.md:**
> "After parallel waves: verifier gets aggregated diff from ALL parallel executors"

**Implementation:**
```markdown
# In orchestrate.md, after parallel wave completes:

1. Collect commit hashes from all wave-executor returns
2. Generate aggregated diff:
   ```
   git diff {first_commit}^..{last_commit}
   ```
3. Pass diff content to verifier (inlined, not @-reference)
4. Verifier reviews combined changes for:
   - Import/export consistency
   - Type compatibility
   - Semantic coherence
   - No conflicting modifications
```

### Pattern 4: Orchestrator as Decision Point

**What:** Orchestrator interprets verifier output and decides action.

**When to use:** After every verification call.

**Decision tree:**
```
Parse verifier return message

IF status == "passed":
  Continue to next wave

ELSE IF status == "gaps_found":
  FOR each gap with severity == "blocker":
    Spawn recovery-agent with verification_failure context
    IF recovery succeeds:
      Re-run verification
    IF recovery fails (3x):
      Escalate to user with summary

ELSE IF status == "needs_review":
  Present phase summary to user
  Wait for approval or issues
  IF issues reported:
    Spawn recovery-agent
    Re-verify
    Re-present to user
```

### Anti-Patterns to Avoid

- **Verifier talks to user:** Verifier is internal. User sees orchestrator summaries only.
- **Single verification depth:** Always check at all three tiers, not just one.
- **Full dump on failure:** User gets brief summary, not raw error output.
- **Immediate user escalation:** Always try auto-repair first (3 attempts).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Running npm scripts | Custom script runner | Bash tool directly | Already available, well-tested |
| Detecting stubs | Regex parsing | Grep patterns from gsd-verifier | Proven stub detection patterns |
| Diff aggregation | Custom diff logic | `git diff` command | Git handles merge base correctly |
| Recovery orchestration | New recovery system | Existing recovery-agent.md | Already handles verification_failure |

**Key insight:** The recovery-agent.md from Phase 8 already supports `type: verification_failure`. The verifier just needs to produce output that orchestrator can pass to recovery.

## Common Pitfalls

### Pitfall 1: Verifier Blocking on First Failure

**What goes wrong:** Verification stops at first error, missing other issues.

**Why it happens:** Natural to exit early on failure.

**How to avoid:** Collect all issues before returning. Report all gaps in structured format.

**Warning signs:** Recovery agent fixes one thing, then another gap appears on next verification.

### Pitfall 2: Parallel Work Conflicts Missed

**What goes wrong:** Two parallel executors modify same file differently, both succeed, but integration fails.

**Why it happens:** Each executor sees clean state, doesn't know about sibling changes.

**How to avoid:**
- Aggregated diff review catches conflicting modifications
- Verifier looks for same-file changes from different commits
- Type checking catches incompatible changes

**Warning signs:** Build passes for each plan individually, fails when combined.

### Pitfall 3: Over-verification Slowing Execution

**What goes wrong:** Verification takes longer than execution, frustrating user.

**Why it happens:** Running all checks after every wave regardless of complexity.

**How to avoid:**
- Claude decides verification depth based on wave complexity (per CONTEXT.md)
- Simple waves: quick syntax + test only
- Complex waves: full review
- 5-minute timeout prevents runaway verification

**Warning signs:** User complains about execution speed, verification logs show long waits.

### Pitfall 4: User Sees Technical Error Dumps

**What goes wrong:** Verification failure shows raw stack traces to user.

**Why it happens:** Verifier output passed directly to user instead of summarized.

**How to avoid:**
- Verifier returns structured gaps, not raw errors
- Orchestrator summarizes for user: "Verification found 2 issues. Attempting auto-fix..."
- Only on escalation: brief summary of what failed

**Warning signs:** User sees "TypeError: Cannot read property 'map' of undefined at..." in chat.

### Pitfall 5: Skipping Downstream Dependency Check

**What goes wrong:** User skips failed verification, then downstream waves fail.

**Why it happens:** Skip offered without checking dependencies.

**How to avoid:**
- Check if failed wave has downstream dependencies
- Only offer skip if no downstream depends_on this wave
- Already implemented in Phase 8 recovery flow, apply same logic

**Warning signs:** User skips, then next wave immediately fails because missing prerequisite.

## Code Examples

### Verifier Agent Return Format

```markdown
# Derived from Phase 7 compact return pattern (07-02)

## VERIFICATION COMPLETE

**Status:** gaps_found
**Wave:** 2
**Tier:** wave

### Checks
| Check | Result | Details |
|-------|--------|---------|
| npm test | PASS | 42 tests passed |
| npm build | PASS | Built in 3.2s |
| npm lint | FAIL | 2 errors |
| Code review | gaps_found | 1 stub, 1 wiring issue |

### Gaps
<gaps>
- type: lint_error
  file: src/components/TaskList.tsx
  issue: "Unexpected any type"
  severity: warning

- type: stub_detected
  file: src/services/userService.ts
  issue: "createUser function contains TODO placeholder"
  severity: blocker

- type: wiring_missing
  file: src/components/Dashboard.tsx
  issue: "Fetches from /api/users but useAuth not called"
  severity: blocker
</gaps>

### Recommendation
recovery_needed
```

### Orchestrator Verification Integration

```markdown
# In orchestrate.md, "Checkpoint Verification" section update

## Wave Verification (After Each Wave)

1. **Collect wave results:**
   - Parse return messages from all wave-executors
   - Aggregate commit hashes and file lists

2. **Spawn verifier:**
   ```
   ## Delegating to Verifier

   **Purpose:** Verify wave {N} changes
   **Scope:** {file count} files across {plan count} plans
   **Tier:** wave

   Spawning verifier agent...
   ```

   Task tool prompt:
   ```
   <verification_context>
   wave: {N}
   tier: wave
   plans_completed: [{plan IDs}]
   files_changed: [{aggregated file list}]
   commits: [{commit hashes}]
   diff: |
     {aggregated diff content - inlined}
   config:
     test_command: {from config.json}
     build_command: {from config.json}
     lint_command: {from config.json}
   </verification_context>
   ```

3. **Parse verifier return:**
   - Look for "## VERIFICATION COMPLETE"
   - Extract Status: passed | gaps_found | needs_review
   - Extract Gaps section if present

4. **Act on result:**
   IF status == "passed":
     Display: "Wave {N} verified. Continuing..."
     Proceed to next wave

   ELSE IF status == "gaps_found":
     Display: "Wave {N} verification found issues. Auto-fixing..."
     FOR attempt = 1 to 3:
       Spawn recovery-agent with gaps as failure_context
       Re-run verification
       IF passes: break
     IF still failing:
       Escalate to user with summary

5. **Human review at phase end:**
   After all waves complete:
   ```
   ## Phase {N} Complete - Review Required

   **Built:** {summary of what was created}
   **Tests:** {pass/fail count}

   ### Test Instructions
   1. {specific test step}
   2. {specific test step}
   3. {expected behavior}

   Please test and type "approved" or describe issues.
   ```
```

### Stub Detection Patterns

```bash
# From gsd-verifier stub detection - reuse in verifier-agent.md

# Universal stub patterns
grep -E "(TODO|FIXME|XXX|HACK|PLACEHOLDER)" "$file"
grep -E "implement|add later|coming soon|will be" "$file" -i

# Empty implementations
grep -E "return null|return undefined|return \{\}|return \[\]" "$file"
grep -E "=> \{\}" "$file"

# Placeholder content
grep -E "placeholder|lorem ipsum" "$file" -i

# React component stubs
grep -E "return <div>.*</div>$" "$file"  # Single-line placeholder render

# Handler stubs
grep -E "onClick=\{\(\) => \{\}\}" "$file"
grep -E "onSubmit.*preventDefault\(\)$" "$file"
```

### Integration Check Patterns

```bash
# From gsd-integration-checker - reuse for parallel work validation

# Check exports are imported
check_export_used() {
  local export_name="$1"
  local source_file="$2"

  # Count imports of this export
  local imports=$(grep -r "import.*$export_name" src/ \
    --include="*.ts" --include="*.tsx" 2>/dev/null | \
    grep -v "$source_file" | wc -l)

  [ "$imports" -gt 0 ] && echo "USED" || echo "ORPHANED"
}

# Check API endpoints are called
check_api_consumed() {
  local route="$1"

  local fetches=$(grep -r "fetch.*['\"]$route\|axios.*['\"]$route" src/ \
    --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)

  [ "$fetches" -gt 0 ] && echo "CONSUMED" || echo "ORPHANED"
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual verification | Automated verifier subagent | This phase | Consistent checking |
| User sees all errors | Orchestrator summarizes | This phase | Better UX |
| Stop on first failure | Collect all gaps | This phase | Efficient recovery |
| Single verification point | 3-tier model | This phase | Appropriate depth |

**What's new in this phase:**
- Verifier as subagent (not inline orchestrator logic)
- Structured gap reporting
- Aggregated diff review for parallel work
- Human review only at phase end

## Open Questions

1. **Verification timeout granularity**
   - What we know: 5-minute overall timeout per CONTEXT.md
   - What's unclear: Should individual npm scripts have separate timeouts?
   - Recommendation: Use 5-minute total, let Claude manage individual command timeouts within that

2. **Conflicting file modifications**
   - What we know: Aggregated diff review should catch these
   - What's unclear: How to auto-resolve vs escalate
   - Recommendation: Flag as blocker gap, let recovery attempt, escalate if unresolvable

3. **Verification depth heuristics**
   - What we know: Claude decides based on wave complexity
   - What's unclear: What defines "complex enough" for full review
   - Recommendation: Let Claude's discretion drive this, document heuristics as they emerge

## Sources

### Primary (HIGH confidence)
- GSD agents (direct codebase analysis):
  - `/Users/j.franke/.claude/agents/gsd-verifier.md` - Goal-backward verification, stub detection, 3-level artifact checking
  - `/Users/j.franke/.claude/agents/gsd-plan-checker.md` - Structured issue reporting, dimension-based verification
  - `/Users/j.franke/.claude/agents/gsd-integration-checker.md` - Cross-phase wiring, export/import mapping
  - `/Users/j.franke/.claude/agents/gsd-debugger.md` - Hypothesis testing, recovery patterns
  - `/Users/j.franke/.claude/agents/gsd-executor.md` - Task commit protocol, deviation handling

- ARIOS existing implementation:
  - `.planning/phases/08-parallel-execution/08-02-PLAN.md` - Recovery agent creation
  - `packages/arios-cli/templates/.claude/agents/recovery-agent.md` - Unified recovery pattern
  - `packages/arios-cli/templates/.claude/commands/arios/orchestrate.md` - Current orchestrator flow
  - `.planning/phases/07-e2e-flow-role-clarity/07-02-PLAN.md` - Compact return format pattern

- Phase context:
  - `.planning/phases/09-verification-system/09-CONTEXT.md` - User decisions for this phase

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` - Accumulated project decisions affecting verification design
- `.planning/REQUIREMENTS.md` - VERIF-01 through VERIF-04 specifications

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components are existing ARIOS patterns
- Architecture: HIGH - Directly derived from GSD agents and CONTEXT.md decisions
- Pitfalls: HIGH - Identified from GSD patterns and logical analysis

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (stable internal patterns, 30-day validity)
