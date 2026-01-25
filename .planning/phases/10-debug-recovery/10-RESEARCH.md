# Phase 10: Debug & Recovery - Research

**Researched:** 2026-01-25
**Domain:** State integrity validation, self-correction patterns, error escalation, user-friendly error presentation
**Confidence:** HIGH

## Summary

This research investigates how to implement ARIOS debug and recovery capabilities based on the locked decisions from CONTEXT.md. The phase adds three new concerns to the existing execution infrastructure:

1. **State integrity checks** that run before each phase (at `/execute` initiation) to catch corruption or drift before execution begins
2. **Self-correction behavior** that spawns fresh recovery agents (up to 3 attempts) before bothering the user
3. **Clear escalation with plain-language errors** that explain impact, not technical details

The existing recovery-agent.md and verification system from Phase 9 provide the foundation. This phase extends them with pre-execution validation, improved retry semantics (fresh spawn per attempt), and human-friendly error formatting.

**Primary recommendation:** Implement integrity checking as a pre-flight step in orchestrate.md. Enhance the existing recovery flow with attempt counting and fresh agent spawning. Create error message templates that translate technical failures into impact-focused language.

## Standard Stack

This phase uses existing ARIOS infrastructure with no new external dependencies.

### Core
| Component | Location | Purpose | Why Standard |
|-----------|----------|---------|--------------|
| orchestrate.md | `.claude/commands/arios/` | Integrity check + escalation logic | Extends existing orchestrator |
| recovery-agent.md | `.claude/agents/` | Self-correction attempts | Already exists, enhance spawn pattern |
| debug.log | `.planning/debug.log` | Error history | Per CONTEXT.md decision |

### Supporting
| Component | Location | Purpose | When to Use |
|-----------|----------|---------|-------------|
| STATE.md | `.planning/STATE.md` | State to validate | Every integrity check |
| PLAN.md files | `.planning/phases/*/` | Cross-reference for drift | When checking file references |
| config.json | `.planning/config.json` | Recovery settings | For max attempts config |

### Existing Patterns to Reuse
| Pattern | Source | Apply To |
|---------|--------|----------|
| Recovery agent spawning | Phase 8 (08-02) | Fresh spawn on each retry |
| Verification flow | Phase 9 (09-01, 09-02) | Pre-execution integrity similar to wave verification |
| Compact return format | Phase 7 (07-02) | Escalation message structure |
| User prompt pattern | Phase 8 (08-02) | "Options: Debug (d), Skip (s), Abort (a)" |

## Architecture Patterns

### Recommended Structure

```
packages/arios-cli/templates/.claude/
├── commands/
│   └── arios/
│       └── orchestrate.md      # UPDATE: add integrity check before execution
└── agents/
    └── recovery-agent.md       # EXISTS: enhance with fresh spawn semantics
```

```
.planning/
├── debug.log                   # NEW: append-only error log
└── STATE.md                    # CHECKED: integrity validation target
```

### Pattern 1: Pre-Execution Integrity Check

**What:** Before any phase execution begins, validate state files to catch corruption or drift.

**When to use:** At `/execute` initiation, before spawning any wave-executors.

**Derived from CONTEXT.md:**
> "Run before each phase (at /execute initiation), not between waves"
> "Check for: file mismatch (STATE.md references missing files), progress drift (STATE.md disagrees with plan completion)"
> "Auto-fix issues when possible, only surface what can't be repaired"

**Implementation:**

```markdown
# In orchestrate.md, before execution starts

## Pre-Execution Integrity Check

1. **Read STATE.md** using Read tool

2. **Validate file references:**
   - For current phase/planIndex, verify PLAN.md exists
   - For plans marked complete, verify SUMMARY.md exists
   - Use Glob tool to check file existence

3. **Detect progress drift:**
   - STATE.md says plan X is complete
   - But SUMMARY.md for plan X doesn't exist
   - OR STATE.md phase doesn't match roadmap

4. **Auto-fix when possible:**
   - Missing checksum: recalculate and update
   - Stale lastActivity: update to today
   - Display one-liner: "Fixed STATE.md drift"
   - Continue execution

5. **Surface unfixable issues:**
   - Missing PLAN.md for current position
   - STATE.md references non-existent phase
   - Display: "State integrity check found issues that need attention"
   - Present issue + options (don't auto-fix structural problems)
```

**Checks to perform:**

| Check | Auto-fixable | Requires User |
|-------|--------------|---------------|
| Checksum mismatch | Yes - recalculate | No |
| Missing SUMMARY.md for "complete" plan | No | Yes - confirm completion status |
| Missing PLAN.md for current position | No | Yes - which plan to execute? |
| Future timestamp | Yes - set to now | No |
| Phase number out of range | No | Yes - reset position? |

### Pattern 2: Fresh Spawn for Self-Correction

**What:** Each retry attempt spawns a completely new recovery agent, avoiding compounding bad assumptions.

**When to use:** On any recoverable failure (task failure, verification failure).

**Derived from CONTEXT.md:**
> "Fresh agent spawn for each retry attempt — avoids compounding bad assumptions"
> "Progress indicator during retries: 'Fixing issue (attempt 2/3)...'"

**Current pattern (Phase 8):**
```markdown
FOR attempt = 1 to 3:
  Spawn recovery-agent with failure_context
```

**Enhanced pattern (this phase):**
```markdown
FOR attempt = 1 to 3:
  Display: "Fixing issue (attempt {attempt}/3)..."

  Spawn FRESH recovery-agent with:
  <failure_context>
  type: {task_failure | verification_failure}
  attempt: {attempt}
  previous_attempts: [
    {attempt: 1, diagnosis: "...", result: "..."},
    {attempt: 2, diagnosis: "...", result: "..."}
  ]
  error: {current error}
  files_affected: [...]
  </failure_context>

  Parse recovery result

  IF recovery succeeds:
    Re-verify
    IF passes: break, continue execution

  # Key: even if this attempt fails, spawn FRESH agent next time
  # Previous agent's context is NOT retained
```

**Why fresh spawn matters:**
- Agent 1 might develop a flawed mental model
- Agent 2 starting fresh can see what Agent 1 missed
- Avoids "more of the same" fixes that don't work
- Each agent sees full history but forms independent hypothesis

### Pattern 3: Escalation Trigger Classification

**What:** Categorize failures into "always escalate" vs "auto-retry" based on failure type, not just retry count.

**When to use:** Before deciding to spawn recovery agent.

**Derived from CONTEXT.md:**
> "ALWAYS escalate (never auto-retry):
>   - Ambiguous requirements (Claude unsure what user wants)
>   - Extreme destructive actions (drop database, delete critical files)
>   - External service issues (API auth, rate limits, network)"

**Decision tree:**

```
FAILURE DETECTED
     |
     v
Is this an ALWAYS-ESCALATE category?
     |
     +--> Ambiguous requirements? --> YES --> ESCALATE IMMEDIATELY
     |
     +--> Extreme destructive action? --> YES --> ESCALATE IMMEDIATELY
     |
     +--> External service issue? --> YES --> ESCALATE IMMEDIATELY
     |
     +--> NO to all --> Continue to retry logic
                            |
                            v
                     Attempt < 3?
                            |
                            +--> YES --> FRESH spawn recovery agent
                            |
                            +--> NO --> ESCALATE with diagnosis
```

**Detection heuristics for ALWAYS-ESCALATE:**

| Category | Detection Patterns |
|----------|-------------------|
| Ambiguous requirements | Recovery agent returns "need clarification", error mentions "unclear", "ambiguous", or "which approach" |
| Extreme destructive | Proposed action includes: DROP TABLE, rm -rf, delete production, reset database |
| External service | Error contains: 401, 403, rate limit, ECONNREFUSED, network timeout, API key |

### Pattern 4: Plain-Language Error Presentation

**What:** Translate technical errors into impact-focused language users understand.

**When to use:** When escalating to user (after 3 attempts or always-escalate trigger).

**Derived from CONTEXT.md:**
> "Technical details (stack traces) hidden by default — plain language summary only"
> "Contextual verbosity: what failed + why + what it affects, then options"
> "Single urgency level — all escalations presented the same way"

**Error translation template:**

```markdown
## Something Went Wrong

**What happened:** {plain language description}
**Why it matters:** {impact on the feature/project}

{If user might want details}
<details>
<summary>Technical details</summary>
{stack trace, error codes, etc.}
</details>

**Options:**
- **Retry (r)** - I'll try again with a fresh approach
- **Skip (s)** - Continue without this {if allowed}

{Note: Skip only shown if no downstream dependencies}
```

**Translation examples:**

| Technical Error | Plain Language |
|-----------------|----------------|
| `TypeError: Cannot read property 'map' of undefined` | "The code tried to process a list that doesn't exist yet" |
| `ECONNREFUSED 127.0.0.1:5432` | "The database isn't running or can't be reached" |
| `Module not found: 'react'` | "A required package is missing from the project" |
| `ETIMEDOUT` | "A network request took too long and was cancelled" |
| `EACCES: permission denied` | "The system blocked access to a file or folder" |
| `Unexpected token` | "There's a typo or syntax error in the code" |

### Pattern 5: Debug Log Persistence

**What:** Append errors to `.planning/debug.log` for persistent history.

**When to use:** On every escalation (not on self-corrected errors).

**Derived from CONTEXT.md:**
> "Error log: append to .planning/debug.log with timestamp and summary"

**Log format:**

```
---
timestamp: 2026-01-25T14:30:00Z
phase: 10
plan: 10-02
error_type: verification_failure
attempts: 3
outcome: escalated_to_user
---
What failed: Wave 2 verification found stub in userService.ts
What was tried:
- Attempt 1: Implemented createUser with mock data (test still failed)
- Attempt 2: Added proper async/await (different error)
- Attempt 3: Fixed return type (still failing - unclear requirements)
User action: Provided clarification about user schema
Resolution: Implemented per user clarification
---

```

**Log rules:**
- Append-only (never delete entries)
- Only log escalations (self-corrected errors don't need history)
- Include what was tried (helps debug similar future issues)
- Include resolution (tracks successful patterns)

### Anti-Patterns to Avoid

- **Immediate user prompt on first failure:** Always try self-correction first (3 attempts)
- **Same agent retrying:** Each attempt must be fresh spawn to avoid compounding errors
- **Technical error dumps:** User sees plain language, technical details hidden by default
- **Multiple urgency levels:** Single escalation presentation (no "WARNING" vs "CRITICAL")
- **Auto-cascading on skip:** If user skips, ask about downstream dependencies

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Retry logic | Custom retry framework | Simple loop in orchestrator | 3 fixed attempts is simple enough |
| Error translation | Complex error parser | Pattern matching in prompts | LLM can translate naturally |
| File existence check | Custom file system code | Glob/Read tools | Already available, well-tested |
| State diff detection | Full diff algorithm | Checksum comparison | Simple, fast, catches external changes |

**Key insight:** The orchestrator's existing conditional logic + recovery-agent spawning handles most of this. Enhancements are prompt-level, not code-level.

## Common Pitfalls

### Pitfall 1: Integrity Check Blocks Everything

**What goes wrong:** Overly strict integrity check refuses to proceed on minor issues.

**Why it happens:** Natural to treat any anomaly as a blocker.

**How to avoid:**
- Auto-fix what's fixable (checksum, timestamps)
- Only block on structural issues (missing required files)
- Use brief one-liner for auto-fixes, don't alarm user

**Warning signs:** User complains they can never start execution because "something is always wrong."

### Pitfall 2: Retry Loop Never Exits

**What goes wrong:** Same error keeps occurring, 3 retries burn time without progress.

**Why it happens:** All three attempts try the same flawed approach.

**How to avoid:**
- Include previous_attempts in failure_context
- Fresh spawn ensures independent analysis
- Recovery agent should review what was tried before attempting

**Warning signs:** Three attempts take 30 seconds total (no real work being done).

### Pitfall 3: Escalation Message Is Scary

**What goes wrong:** User sees escalation and panics, thinks something is badly broken.

**Why it happens:** Technical language, urgent tone, too many details.

**How to avoid:**
- Neutral tone ("Something went wrong" not "CRITICAL ERROR")
- Plain language (what happened, why it matters)
- Simple options (Retry, Skip, Abort - not complex menus)

**Warning signs:** User frequently chooses Abort when Retry would have worked.

### Pitfall 4: Skip Cascades Failures

**What goes wrong:** User skips a failed step, but downstream steps depend on it.

**Why it happens:** Skip offered without checking dependencies.

**How to avoid:**
- Check if skipped step has downstream dependencies
- If yes: no Skip option (explain why)
- If user still wants to skip: explicitly ask "downstream will fail, continue?"

**Warning signs:** User skips, then immediately gets another failure.

### Pitfall 5: Always-Escalate Too Broad

**What goes wrong:** Too many things trigger immediate escalation, system feels overly cautious.

**Why it happens:** Over-classifying errors as "ambiguous" or "destructive."

**How to avoid:**
- Specific detection patterns for each always-escalate category
- When in doubt, try self-correction first
- Only truly destructive actions (DROP, rm -rf, etc.) bypass retry

**Warning signs:** User rarely sees "Fixing issue (attempt X/3)" because everything escalates immediately.

## Code Examples

### Integrity Check in Orchestrate.md

```markdown
## Pre-Execution Integrity Check

Before spawning any executors, validate state:

1. **Read current state:**
   ```
   Use Read tool: .planning/STATE.md
   ```

2. **Verify file references exist:**
   ```
   Use Glob tool: .planning/phases/{phase}/{phase}-{planIndex}-PLAN.md
   ```

   If file doesn't exist:
   - Display: "State references plan {phase}-{planIndex} but file doesn't exist"
   - Options: "Reset to previous plan (r), Specify correct plan (s), Abort (a)"

3. **Check for progress drift:**
   For each plan marked complete in STATE.md:
   ```
   Use Glob tool: .planning/phases/{phase}/{phase}-{plan}-SUMMARY.md
   ```

   If SUMMARY.md doesn't exist but marked complete:
   - Auto-fix: Update STATE.md to mark incomplete
   - Display: "Fixed STATE.md drift (plan {plan} marked as pending)"

4. **Verify checksum:**
   Recalculate checksum from frontmatter (excluding checksum field)

   If mismatch:
   - Auto-fix: Update checksum
   - Display: "Fixed STATE.md checksum"

5. **Result:**
   IF all checks pass OR all issues auto-fixed:
     Continue to execution
   ELSE:
     Present unfixable issues with options
```

### Enhanced Recovery Spawning

```markdown
## Recovery Flow (3 Attempts, Fresh Spawn)

FOR attempt = 1 to 3:

  Display: "Fixing issue (attempt {attempt}/3)..."

  # Build previous attempts summary (for attempts 2+)
  previous_summary = []
  IF attempt > 1:
    FOR prev in 1 to attempt-1:
      previous_summary.append({
        attempt: prev,
        diagnosis: {diagnosis from that attempt},
        result: {what happened}
      })

  # Spawn FRESH recovery agent
  Use Task tool to spawn .claude/agents/recovery-agent.md

  <failure_context>
  type: {task_failure | verification_failure}
  wave: {N}
  plan_id: {phase-plan}
  attempt: {attempt}
  previous_attempts: {previous_summary as YAML}
  error: {current error message}
  files_affected: [{list}]
  recent_commits: [{list}]
  </failure_context>

  # Parse result
  IF "RECOVERY COMPLETE" with "Fixed: true":
    Re-run verification
    IF passes:
      Display: "Issue fixed on attempt {attempt}"
      BREAK, continue execution

  IF "RECOVERY FAILED":
    # Log this attempt's diagnosis
    Record: {attempt: attempt, diagnosis: from return, result: "failed"}
    # Continue to next attempt (fresh spawn)

# If loop exits without success
Display escalation message (see Pattern 4)
```

### Escalation Message Template

```markdown
## Something Went Wrong

**What happened:** {plain language - e.g., "The user service couldn't be created"}

**Why it matters:** {impact - e.g., "The login feature won't work until this is fixed"}

**What I tried:**
1. {Attempt 1 diagnosis} - {result}
2. {Attempt 2 diagnosis} - {result}
3. {Attempt 3 diagnosis} - {result}

<details>
<summary>Technical details</summary>

```
{raw error output}
```

Files examined:
- {file1}
- {file2}

</details>

**Options:**
- **Retry (r)** - I'll try again with a fresh approach
{IF no downstream dependencies:}
- **Skip (s)** - Continue without this step
{ENDIF}
- **Abort (a)** - Stop execution, preserve state for later

```

### Debug Log Append

```markdown
# After escalation (in orchestrate.md)

Use Bash tool:
command: "echo '---
timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)
phase: {phase}
plan: {plan}
error_type: {type}
attempts: 3
outcome: {escalated_to_user | user_resolved | user_skipped | user_aborted}
---
What failed: {plain language summary}
What was tried:
- Attempt 1: {diagnosis}
- Attempt 2: {diagnosis}
- Attempt 3: {diagnosis}
---
' >> .planning/debug.log"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No integrity check | Pre-execution validation | This phase | Catch drift before it causes failures |
| Same agent retries | Fresh spawn per attempt | This phase | Independent analysis, avoid compounding |
| Technical error dumps | Plain language + hidden details | This phase | Non-coders understand what went wrong |
| Immediate user prompt | 3 auto-retries first | This phase | Fewer interruptions for fixable issues |

**What's new in this phase:**
- Integrity check as explicit pre-flight step
- Previous attempts passed to fresh recovery agents
- Always-escalate category detection
- Plain-language error translation
- Debug log for error history

## Open Questions

1. **Integrity check timing**
   - What we know: Run at /execute initiation (per CONTEXT.md)
   - What's unclear: Should it also run after user returns from pause?
   - Recommendation: Yes, run after any pause since user may have edited files

2. **Previous attempts format**
   - What we know: Fresh agent should see what was tried
   - What's unclear: How detailed should previous attempt summaries be?
   - Recommendation: Keep brief (diagnosis + result), don't overwhelm context

3. **Debug log location**
   - What we know: .planning/debug.log per CONTEXT.md
   - What's unclear: Should it be gitignored?
   - Recommendation: Include in git (helps debug across sessions), but respect commit_docs setting

## Sources

### Primary (HIGH confidence)
- ARIOS existing implementation:
  - `packages/arios-cli/templates/.claude/agents/recovery-agent.md` - Current recovery pattern
  - `packages/arios-cli/templates/.claude/commands/arios/orchestrate.md` - Current execution flow
  - `.planning/phases/08-parallel-execution/08-02-PLAN.md` - Recovery flow creation
  - `.planning/phases/09-verification-system/09-RESEARCH.md` - Verification patterns

- GSD debugging patterns:
  - `/Users/j.franke/.claude/agents/gsd-debugger.md` - Hypothesis testing, debug file protocol

- Prior research:
  - `.planning/research/DEBUGGING.md` - Comprehensive failure modes and recovery patterns

### Secondary (MEDIUM confidence)
- [Command Line Interface Guidelines](https://clig.dev/) - CLI error handling best practices
- [Error-Message Guidelines - NN/G](https://www.nngroup.com/articles/error-message-guidelines/) - Plain language UX patterns
- [When to hand off to a human - Replicant](https://www.replicant.com/blog/when-to-hand-off-to-a-human-how-to-set-effective-ai-escalation-rules) - Escalation trigger design
- [Human-in-the-loop in AI workflows - Zapier](https://zapier.com/blog/human-in-the-loop/) - HITL integration patterns

### Tertiary (LOW confidence)
- [Retry pattern best practices - AWS](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/retry-backoff.html) - General retry guidance (not directly applicable to LLM agents)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components are existing ARIOS patterns
- Architecture: HIGH - Directly derived from CONTEXT.md decisions and prior phases
- Pitfalls: HIGH - Based on prior debugging research and logical analysis
- Code examples: MEDIUM - Patterns clear, specific syntax needs validation during implementation

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (stable internal patterns, 30-day validity)
