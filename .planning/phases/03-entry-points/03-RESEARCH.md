# Phase 3: Entry Points - Research

**Researched:** 2026-01-24
**Domain:** Claude Code slash commands, project context detection, workflow routing
**Confidence:** HIGH

## Summary

This phase creates the user-facing entry points to ARIOS: slash commands that detect project context and route users to appropriate workflows. The research confirms that Claude Code's slash command system is well-documented and mature, supporting custom commands via Markdown files with frontmatter metadata.

Key findings: Commands are created as `.md` files in `.claude/commands/`, support frontmatter for tool restrictions and model selection, and can embed dynamic context via bash execution with `!` prefix or file references with `@` prefix. Project detection is done through file system inspection (checking for code files, config files, and existing ARIOS state).

**Primary recommendation:** Create ARIOS entry point commands following the Input-Workflow-Output template pattern already established in PROJECT.md, leveraging existing orchestrator infrastructure from Phase 2.

## Standard Stack

### Core

| Component | Purpose | Why Standard |
|-----------|---------|--------------|
| `.claude/commands/*.md` | Command definition files | Native Claude Code approach, no external dependencies |
| YAML frontmatter | Command metadata (tools, model, description) | Native Claude Code feature, well-supported |
| `!` bash embedding | Dynamic context injection | Enables state detection before Claude processes request |
| `@` file references | Content inclusion | Native syntax for pulling file contents into prompts |

### Supporting

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| `$ARGUMENTS` / `$1`, `$2` | Argument handling | When commands accept user input |
| `allowed-tools` frontmatter | Tool restriction | Security-sensitive commands |
| `model` frontmatter | Model selection | Performance-critical or cost-sensitive commands |

### No External Dependencies

This phase requires **no new npm packages**. Everything is pure Markdown files processed by Claude Code natively.

## Architecture Patterns

### Recommended Command Structure

Based on PROJECT.md's Input-Workflow-Output template pattern:

```
.claude/commands/arios/
├── ideate.md          # /arios:ideate - Creative exploration phase
├── plan.md            # /arios:plan - Planning phase
├── execute.md         # /arios:execute - Execution phase
├── arios.md           # /arios - Smart entry point (detects state)
├── status.md          # /arios:status - Show current position
└── help.md            # /arios:help - Command reference
```

### Pattern 1: Smart Entry Point with State Detection

**What:** Main `/arios` command that reads project state and suggests appropriate next action
**When to use:** Users who don't know which command to run next

**Example structure:**
```markdown
---
description: ARIOS smart entry - detects state and suggests next command
---

# /arios

## Purpose
Detect project state and suggest appropriate next action.

## Context
Read current state:
- !`ls .arios/ 2>/dev/null || echo "no-arios"`
- !`ls .arios/roadmaps/*/findings.md 2>/dev/null | head -1`
- !`ls .arios/roadmaps/*/plan.md 2>/dev/null | head -1`
- @.arios/STATE.md (if exists)

## Workflow
1. Check if ARIOS initialized (.arios/ exists)
2. Check for active roadmap
3. Detect current phase position
4. Suggest next logical command with confirmation
```

### Pattern 2: Detection with Inline Heuristics

**What:** Commands that determine project type (greenfield/brownfield) dynamically
**When to use:** Commands that need to adapt behavior based on project context

**Example detection logic:**
```markdown
## Context
Detect project type:
- !`find . -maxdepth 3 \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" \) ! -path "*/node_modules/*" 2>/dev/null | head -5`
- !`ls package.json requirements.txt go.mod Cargo.toml 2>/dev/null`

## Instructions
If code files found: Brownfield - existing codebase
If only config files or empty: Greenfield - new project
Show detection result to user before proceeding
```

### Pattern 3: Phase Commands with Routing

**What:** Core workflow commands (/ideate, /plan, /execute) that route to orchestrator
**When to use:** The three primary ARIOS workflow phases

**Example structure:**
```markdown
---
description: Enter ARIOS planning phase
model: opus
tools: Read, Write, Bash, Glob, Grep, Task
---

# /arios:plan

## Purpose
Create or continue a plan for the current ARIOS project.

## Context
@.arios/STATE.md
@.arios/config.json

## Workflow
1. Validate ARIOS initialized
2. Show brief status line: "Phase X/Y, Plan M/N"
3. Check prerequisites (ideation complete if needed)
4. Spawn planner subagent with appropriate context
```

### Anti-Patterns to Avoid

- **Hardcoded file extensions for detection:** Let Claude determine contextually what "code" means. The list of extensions changes over time and varies by ecosystem.
- **Silent detection without user feedback:** Always show detection results. Users need to confirm Claude's understanding is correct.
- **Blocking on missing prerequisites:** Warn but allow continuation with confirmation. Users may have good reasons to work out of sequence.
- **Duplicating orchestrator logic in commands:** Entry points should route to the existing orchestrator, not reimplement coordination logic.

## Don't Hand-Roll

Problems with existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Command parsing | Argument parser | `$ARGUMENTS`, `$1`, `$2` | Native Claude Code syntax |
| Tool restrictions | Custom permission system | `allowed-tools` frontmatter | Native feature |
| Model selection | Custom routing | `model` frontmatter | Native feature |
| Context loading | Custom file loader | `@` file references | Native feature |
| Bash execution | Custom shell wrapper | `!` bash embedding | Native feature |

**Key insight:** Claude Code has a mature command system. The entry points phase is about creating well-structured Markdown files, not building infrastructure.

## Common Pitfalls

### Pitfall 1: Overly Complex Detection Logic

**What goes wrong:** Commands try to detect every possible project type with elaborate heuristics
**Why it happens:** Trying to anticipate all edge cases upfront
**How to avoid:** Let Claude interpret contextually. Provide indicators, not rules.
**Warning signs:** Detection logic exceeds 10 lines of bash, or handles more than 3 project types

### Pitfall 2: Missing User Confirmation

**What goes wrong:** Commands take action based on detection without user verification
**Why it happens:** Assuming detection is always accurate
**How to avoid:** Always show detection result and wait for confirmation before proceeding
**Warning signs:** Commands that silently change behavior based on detected state

### Pitfall 3: Inconsistent Status Display

**What goes wrong:** Each command formats status differently, confusing users
**Why it happens:** Commands developed independently without coordination
**How to avoid:** Define a single status format used by all commands
**Warning signs:** Commands showing phase/plan numbers in different formats or locations

### Pitfall 4: Blocking Out-of-Sequence Commands

**What goes wrong:** Commands refuse to run if prerequisites aren't met
**Why it happens:** Trying to enforce "correct" workflow
**How to avoid:** Warn clearly, but allow with confirmation ("No plan exists. Continue anyway?")
**Warning signs:** Commands that exit with error instead of offering to continue

## Code Examples

### Command with State Detection (Verified Pattern from GSD)

```markdown
---
description: Check project progress and route to next action
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
---

# /arios:status

## Purpose
Show current ARIOS project state and suggest next action.

## Context
!`ls .arios/ 2>/dev/null || echo "NO_ARIOS"`
@.arios/STATE.md

## Workflow
1. Check if ARIOS initialized
2. If no .arios/: suggest /arios:init
3. Read STATE.md for current position
4. Display: "Phase X/Y, Plan M/N"
5. Show what's next based on state

## Report
```
ARIOS Status

Position: Phase X/Y, Plan M/N
Project: [brownfield/greenfield]
Stack: [detected stack]

Next: [suggested command]
```
```

### Greenfield/Brownfield Detection Pattern

```markdown
## Context
Detect project type:
- !`find . -maxdepth 2 \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" \) ! -path "*/node_modules/*" ! -path "*/.git/*" 2>/dev/null | wc -l | tr -d ' '`

## Instructions
CODE_COUNT is the count of source files found.

If CODE_COUNT == 0:
  - Greenfield project (no code present)
  - Offer project setup

If CODE_COUNT > 0:
  - Brownfield project (existing codebase)
  - Detect tech stack from files found

Always display: "Detected: [Greenfield/Brownfield] project [with Stack]"
If uncertain: "Detected as Brownfield (uncertain)" with explanation
```

### Smart Entry Point Routing Pattern

```markdown
## Workflow
1. Read .arios/STATE.md if exists
2. Determine current position:
   - No .arios/: "No ARIOS project. Initialize with /arios:init"
   - No roadmap: "Ready to ideate. Start with /arios:ideate"
   - Has findings, no plan: "Ready to plan. Continue with /arios:plan"
   - Has plan, incomplete: "Ready to execute. Continue with /arios:execute"
   - Phase complete: "Phase X complete. Start Phase X+1 with /arios:plan"
3. Show suggestion with confirmation
4. User confirms or chooses different action
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.claude/commands/*.md` only | Skills (`.claude/skills/*/SKILL.md`) also supported | 2025 | Skills support additional features like supporting files |
| Manual context loading | `@` file references + `!` bash embedding | Native | Commands can dynamically load context |
| Fixed model per install | `model` frontmatter per command | Native | Different commands can use different models |

**Current best practice:** Use `.claude/commands/` for simple commands. Commands still work identically to skills for basic use cases. Skills provide additional features (supporting files, auto-invocation) when needed.

## Open Questions

### 1. Detection Uncertainty Threshold

**What we know:** Detection should show uncertainty when unclear
**What's unclear:** How to quantify uncertainty (file count threshold? specific indicators?)
**Recommendation:** Leave to Claude's discretion as specified in CONTEXT.md. Start simple, refine based on user feedback.

### 2. Nested Command Directory Structure

**What we know:** Commands can be organized in subdirectories (`arios/ideate.md` creates `/arios:ideate`)
**What's unclear:** Whether deep nesting is worth the complexity
**Recommendation:** Use single level (`arios/*.md`) for ARIOS commands. Keeps things simple.

### 3. Model Selection per Command

**What we know:** `model` frontmatter allows specifying Claude model per command
**What's unclear:** Whether different ARIOS commands need different models
**Recommendation:** Default to user's configured model. Only specify if specific commands need cost optimization (e.g., status checks on Haiku).

## Sources

### Primary (HIGH confidence)
- Claude Code documentation (slash commands) - Command file structure, frontmatter options, argument handling
- GSD slash commands (`/Users/j.franke/.claude/commands/gsd/`) - Proven patterns for progress, help, new-project, execute-phase
- ARIOS Phase 2 implementation (`packages/arios-cli/templates/.claude/commands/arios/`) - Existing orchestrate.md and start.md patterns

### Secondary (MEDIUM confidence)
- WebSearch results for "Claude Code slash commands 2026" - Confirmed Skills vs Commands evolution
- WebSearch results for "brownfield greenfield detection" - Community patterns for project type detection
- BioErrorLog tutorial on custom slash commands - Frontmatter syntax verification

### Tertiary (LOW confidence)
- Community tools (claude-code-flow, ClaudeKit) - Alternative approaches, not verified against official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Native Claude Code features, well-documented
- Architecture patterns: HIGH - Based on proven GSD patterns and existing ARIOS infrastructure
- Detection heuristics: MEDIUM - Approach is sound, exact thresholds may need tuning
- Pitfalls: HIGH - Derived from observed patterns in GSD and community tools

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable domain, native Claude Code features)
