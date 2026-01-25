# Phase 11: Smart Entry & Mode Detection - Research

**Researched:** 2026-01-25
**Domain:** Conversational routing and workflow orchestration
**Confidence:** HIGH

## Summary

This research examines how to implement conversational mode detection for ARIOS, enabling the system to route users to Feature-Mode (single-phase, scoped work) or Project-Mode (multi-phase, open-ended work) based on natural conversation rather than explicit commands.

The core insight from examining the existing codebase is that mode detection is a **routing layer concern**, not an execution layer concern. The execution infrastructure (Phases 8-10: parallel execution, verification, recovery) is already mode-agnostic. This phase adds a conversational detection layer on top of the existing `/arios` entry point.

The implementation extends the existing `/arios.md` command pattern and introduces a `mode` field in STATE.md that affects which workflow path is followed. Feature-Mode skips roadmap creation and works within a single "feature" pseudo-phase. Project-Mode follows the full multi-phase roadmap flow.

**Primary recommendation:** Extend `/arios.md` to include a mode detection conversation that runs BEFORE the current detection logic, storing the detected mode in STATE.md and routing to appropriate workflows.

## Standard Stack

This phase uses existing ARIOS patterns. No new libraries needed.

### Core Components

| Component | Location | Purpose | Modification Needed |
|-----------|----------|---------|---------------------|
| `/arios.md` | `.claude/commands/arios/arios.md` | Entry point command | Add mode detection conversation before routing |
| `/orchestrate.md` | `.claude/commands/arios/orchestrate.md` | Execution orchestrator | Add mode-aware routing logic |
| `STATE.md` | `.planning/STATE.md` | Project state | Add `mode` field to frontmatter |
| `config.json` | `.planning/config.json` | Project config | Add `mode` field (persists across sessions) |

### New Commands

| Command | Purpose | Behavior |
|---------|---------|----------|
| `/arios:feature` | Explicit Feature-Mode entry | Skip detection, enter Feature-Mode |
| `/arios:project` | Explicit Project-Mode entry | Skip detection, enter Project-Mode |

### Alternatives Considered

| Instead of | Could Use | Why Not |
|------------|-----------|---------|
| Explicit `/feature` and `/project` commands only | N/A | User decided conversational detection is primary (CONTEXT.md) |
| TypeScript mode detection module | Claude-native conversation | Slash commands instruct Claude directly (04-02 decision) |
| Automatic mode switching mid-work | Binary complete-or-restart | User decided against mid-work changes (CONTEXT.md) |

## Architecture Patterns

### Mode Detection Flow

```
/arios (entry)
    |
    v
[Check existing state] --(STATE.md exists with mode)--> [Resume flow]
    |
    v (no state or no mode)
[Mode Detection Conversation] <--> [User]
    |
    v (mode confirmed)
[Store mode in STATE.md and config.json]
    |
    v
[Route to Feature-Mode or Project-Mode workflow]
```

### Feature-Mode File Structure

Feature-Mode uses the same `.planning/` structure but lighter:

```
.planning/
├── STATE.md           # mode: "feature", phase: "feature-{name}"
├── config.json        # mode: "feature" persisted
└── phases/
    └── feature-{name}/
        ├── {name}-CONTEXT.md
        ├── {name}-RESEARCH.md (optional, per user)
        ├── {name}-01-PLAN.md
        ├── {name}-01-SUMMARY.md
        └── ... (may have multiple plans/waves)
```

**Key difference from Project-Mode:**
- No ROADMAP.md (single phase)
- Phase folder uses `feature-{name}` naming instead of numbered phases
- Completion archives to `.planning/archive/feature-{name}/`

### Project-Mode File Structure (existing)

```
.planning/
├── STATE.md           # mode: "project", phase: N
├── config.json        # mode: "project"
├── ROADMAP.md
└── phases/
    ├── 01-foundation/
    ├── 02-feature/
    └── ...
```

### Pattern 1: Mode Detection Conversation

**What:** A natural conversation that reveals work scope without explicit mode selection.

**When to use:** Fresh start or when `/arios` detects no active state.

**Example conversation flow:**

```markdown
## Welcome to ARIOS

What would you like to build?
> [User describes idea]

[Claude mirrors understanding, asks clarifying question if needed]
> [User clarifies]

[Claude determines scope from description]

That sounds like [a focused feature / a larger project with multiple phases].
[Feature-Mode / Project-Mode] - does that match what you're thinking?
> [User confirms or corrects]

[Proceed with confirmed mode]
```

**Key elements:**
1. Open-ended first question (let user dump mental model)
2. Mirroring and clarification (1-3 exchanges max for simple, more for unclear)
3. Explicit mode confirmation before proceeding
4. Binary choice: Feature or Project

### Pattern 2: Context-Aware Resume

**What:** Resume behavior differs based on existing mode.

**When to use:** STATE.md exists with mode field.

**Flow for Feature-Mode resume:**
```
"Welcome Back to your feature: {name}

Progress: {waves done}/{total waves}
Status: {status}

Options:
1. Continue - {next action}
2. Status - See feature overview
3. Finish - Complete and archive this feature

What would you like to do? (1/2/3):"
```

**Flow for Project-Mode resume:**
```
"Welcome Back

Phase: {phase}/{total} - {phaseName}
Status: {status}

Options:
1. Continue - {next action}
2. Status - See full project overview
3. Other - Start something different

What would you like to do? (1/2/3):"
```

### Pattern 3: Explicit Commands

**What:** Commands that skip detection conversation.

**When to use:** User knows what mode they want.

**`/arios:feature` behavior:**
1. Check for active state
2. If active work exists: "Active work in progress. Complete or reset first."
3. If no active work: Skip detection, enter Feature-Mode
4. Ask: "What feature would you like to build?"
5. Proceed directly to ideation

**`/arios:project` behavior:**
1. Check for active state
2. If active work exists: "Active work in progress. Complete or reset first."
3. If no active work: Skip detection, enter Project-Mode
4. Proceed to full project ideation (roadmap creation)

### Anti-Patterns to Avoid

- **Checklist questioning:** Don't ask "Is this a feature or project?" directly. Understand scope from description.
- **Over-detection:** If user is clearly describing a single feature ("add a login page"), don't ask 5 clarifying questions.
- **Premature mode lock:** Always confirm detected mode before proceeding.
- **Hidden mode:** Always tell user which mode they're in when entering it.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mode persistence | Custom storage | STATE.md frontmatter + config.json | Already have state management pattern |
| Phase folder creation | Manual mkdir | Existing phase creation in planner | Consistent structure |
| Archive behavior | Custom archive logic | Existing phase completion pattern | Phase archival works same way |
| Conversation flow | Rigid script | Claude's natural conversation | GSD ideate reference shows this works |

**Key insight:** Mode detection is a routing decision, not a new system. Use existing patterns, add a routing layer.

## Common Pitfalls

### Pitfall 1: Mode Detection Loops

**What goes wrong:** User gives vague answer, Claude asks more questions, user gets frustrated.
**Why it happens:** Trying to be too precise about scope detection.
**How to avoid:**
- If unclear after 2-3 exchanges, default to Feature-Mode (easier to upgrade)
- Let user correct after confirmation: "Actually this is bigger than I thought"
**Warning signs:** More than 3 back-and-forth exchanges about scope.

### Pitfall 2: Mode Leakage in Resume

**What goes wrong:** Resume flow doesn't respect stored mode.
**Why it happens:** Forgot to check mode field in STATE.md.
**How to avoid:** Always read mode from STATE.md frontmatter before routing.
**Warning signs:** Project-Mode prompts showing for Feature-Mode work.

### Pitfall 3: Feature-Mode Scope Creep

**What goes wrong:** Feature grows larger than single phase during planning.
**Why it happens:** User underestimated scope initially.
**How to avoid:**
- During planning, if planner detects 5+ plans or complex dependencies: pause
- Ask: "This feature is getting complex. Would you like to switch to Project-Mode?"
- Offer explicit upgrade path
**Warning signs:** Feature-Mode plan has more than 4-5 plans or multi-wave dependencies.

### Pitfall 4: Explicit Commands Ignoring Active State

**What goes wrong:** User runs `/arios:feature` while Project-Mode work is active.
**Why it happens:** Commands don't check for active state.
**How to avoid:**
- All explicit commands check STATE.md first
- If status != "complete" and mode != requested mode: block with helpful message
**Warning signs:** Orphaned STATE.md files, inconsistent mode fields.

### Pitfall 5: Missing Mode Confirmation

**What goes wrong:** System detects mode but proceeds without user agreement.
**Why it happens:** Skipping the confirmation step to "be faster".
**How to avoid:** Always confirm: "Feature-Mode - correct?" User says yes or describes why not.
**Warning signs:** User frustration about being "stuck" in wrong mode.

## Code Examples

### Example 1: STATE.md with Mode

```yaml
---
version: "1.1.0"
mode: "feature"
phase: "feature-auth"
planIndex: 1
totalPlans: 2
status: "in-progress"
lastActivity: "2026-01-25"
checksum: "a1b2c3d4"
phaseName: "Add Authentication"
---

# Project State

## Current Position

Mode: Feature
Feature: Add Authentication
Plan: 1 of 2
Status: In progress
```

### Example 2: Feature-Mode Entry in arios.md

```markdown
### Fresh Start with Mode Detection

If no STATE.md exists:

1. Display welcome:
   ```
   ## Welcome to ARIOS

   What would you like to build?
   ```

2. Wait for user response.

3. Analyze response for scope indicators:
   - Single feature keywords: "add", "fix", "update", "change", "implement X"
   - Project keywords: "build", "create app", "new project", "from scratch"
   - Multi-feature indicators: "and also", "plus", "including"

4. Mirror understanding and determine mode:
   - If clearly single feature: "Got it - you want to [feature]. Feature-Mode - correct?"
   - If clearly project scope: "That sounds like a full project with multiple phases. Project-Mode - correct?"
   - If unclear: Ask one clarifying question, then decide

5. On user confirmation:
   - Store mode in config.json: `{ "mode": "feature" }` or `{ "mode": "project" }`
   - Proceed to appropriate workflow
```

### Example 3: Explicit Command Template

```markdown
# /arios:feature

## Purpose

Enter Feature-Mode directly, skipping mode detection conversation.

## Context

- @.planning/STATE.md
- @.planning/config.json

## Instructions

1. Check for active state:
   - Read STATE.md frontmatter
   - If status is NOT "complete" or "phase-complete":
     - Display: "Active work in progress. Complete current {mode} work first, or run `/arios:reset` to start fresh."
     - Stop here.

2. If no active work:
   - Clear any stale state
   - Write to config.json: `{ "mode": "feature" }`
   - Display: "Entering Feature-Mode. What feature would you like to build?"
   - Wait for user response
   - Route to ideation with feature context
```

### Example 4: Mode-Aware Orchestrator Routing

```markdown
## Mode-Aware Execution

In orchestrate.md, after reading STATE.md:

1. Extract mode from frontmatter:
   ```
   mode: {feature | project}
   ```

2. Route based on mode:

   **Feature-Mode:**
   - Skip roadmap checks
   - Phase is always the single feature phase
   - After feature complete: archive and clear mode

   **Project-Mode:**
   - Follow multi-phase roadmap flow
   - Phase transitions as normal
   - No mode change during execution
```

### Example 5: Feature-Mode Completion

```markdown
## Feature Complete Flow

When Feature-Mode work reaches status "complete":

1. Display completion message:
   ```
   ## Feature Complete

   **Feature:** {name}
   **Plans executed:** {count}
   **Duration:** {time}

   The feature has been archived to `.planning/archive/feature-{name}/`

   Ready for next task. Run `/arios` to continue.
   ```

2. Archive feature folder:
   - Move `.planning/phases/feature-{name}/` to `.planning/archive/feature-{name}/`

3. Clear mode:
   - Remove mode from config.json (or set to null)
   - Archive STATE.md or reset to clean state

4. Ready for next `/arios` call (fresh detection)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Explicit mode selection via commands | Conversational detection with command fallback | Phase 11 | More natural entry, reduces user cognitive load |
| Single workflow for all work | Mode-aware workflow routing | Phase 11 | Features don't need full roadmap overhead |
| No mid-flow scope adjustment | Upgrade prompt during planning | Phase 11 | Catches scope creep early |

**Note:** This is new functionality. No deprecated patterns to document.

## Open Questions

### 1. Archive Structure for Features

**What we know:** Features complete and archive to `.planning/archive/`
**What's unclear:** Exact archive folder naming - timestamp-based or feature-name-based?
**Recommendation:** Use `feature-{name}-{date}` for uniqueness if same feature is built twice.

### 2. v1.1 Simplification - Existing Roadmap Always Resumes as Project

**What we know:** CONTEXT.md specifies this as v1.1 simplification.
**What's unclear:** Edge case where user has completed project and wants to add feature.
**Recommendation:** If project is complete (all phases done), allow fresh mode detection. If mid-project, always resume as Project-Mode.

### 3. Scope Creep Detection Thresholds

**What we know:** During planning, we should detect when Feature-Mode work is too large.
**What's unclear:** Exact thresholds (5 plans? 3 waves? Dependencies?)
**Recommendation:** Start with 4+ plans OR 2+ waves as upgrade prompt trigger. Tune based on experience.

## Sources

### Primary (HIGH confidence)

- `.claude/commands/arios/arios.md` - Current entry point patterns
- `.claude/commands/arios/orchestrate.md` - Execution orchestration patterns
- `.planning/phases/11-smart-entry-mode-detection/11-CONTEXT.md` - User decisions
- `.planning/STATE.md` - State management patterns
- `reference/planner/ideate.md` - Conversation patterns from GSD ideate

### Secondary (MEDIUM confidence)

- `.planning/ROADMAP.md` - Multi-phase structure for Project-Mode reference
- Prior phase CONTEXT.md files - Decision patterns

## Metadata

**Confidence breakdown:**
- Mode detection pattern: HIGH - Based on existing arios.md + user decisions in CONTEXT.md
- File structure: HIGH - Uses existing .planning/ patterns with minor additions
- Conversation flow: HIGH - Follows GSD ideate patterns, adapted for mode detection
- Feature-Mode archival: MEDIUM - Follows phase completion pattern, minor uncertainty on naming

**Research date:** 2026-01-25
**Valid until:** N/A (internal design, no external dependencies)
