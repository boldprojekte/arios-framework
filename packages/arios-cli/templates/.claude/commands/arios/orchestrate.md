---
description: ARIOS orchestrator - coordinates research, planning, and execution subagents
model: opus
tools: Read, Write, Bash, Glob, Grep, Task
---

# /arios:orchestrate

## Purpose

Coordinate the ARIOS subagent workflow: detect state, spawn the appropriate agent, and integrate results.
Stay lean - delegate all heavy work to subagents. Never implement features directly.

## Variables

**Dynamic:** $COMMAND (research | plan | execute | auto)
**Static:** .planning/STATE.md, .planning/config.json, .planning/roadmaps/

## Context

Read before any action:
- @.planning/STATE.md - Current project position and progress
- @.planning/config.json - Project settings and stack info
- Active roadmap and phase files as needed

## Instructions

- Orchestrator ONLY coordinates - spawns subagents for all heavy work
- Each subagent gets a fresh context window (not chat history fork)
- Extract relevant info from state, pass explicit prompt to subagent
- Read handoff files when subagent returns to integrate results
- Suggest `/clear` at natural breakpoints (after each phase minimum)
- Handle mismatch detection by prompting user, not guessing

## Workflow

1. Read STATE.md to determine current position
2. If $COMMAND == "auto": detect appropriate action from state
   - No findings file for phase? Research needed
   - Findings exist but no plan? Planning needed
   - Plan exists? Execution needed
3. If research needed:
   - Ask user to confirm research topic
   - Spawn researcher with topic, phase context, output path
4. If planning needed:
   - Spawn planner with findings path, phase context, output path
5. If execution needed:
   - **Extract codebase patterns before spawning executor**
   - Spawn executor with plan path, wave number, task IDs, problems path, **patterns path**
6. After subagent returns:
   - Read handoff file (findings/plan/wave-result)
   - Update STATE.md with progress
   - Report results to user
7. Suggest next action or `/clear` if context getting full

## Pattern Extraction (Before Execution)

**Purpose:** Ensure generated code matches existing codebase conventions.

**Steps:**
1. Use Glob tool to find existing code files:
   - Pattern: "src/**/*.{ts,tsx}" or "**/*.{ts,tsx}"
   - Limit to 5 files for analysis

2. Use Read tool on 3-5 representative files to analyze:
   - Indentation (tabs vs spaces, count spaces)
   - Quote style (single vs double)
   - Semicolon usage (yes/no)
   - Component structure (functional, class)
   - Export style (named, default)

3. Use Write tool to persist patterns to .planning/patterns.json:
   ```json
   {
     "indentation": { "type": "spaces", "size": 2 },
     "quotes": "single",
     "semicolons": true,
     "confidence": "high",
     "examples": {
       "component": "export function MyComponent() {...}",
       "function": "const myFunc = () => {...}"
     }
   }
   ```

**Greenfield fallback:** If Glob finds no existing code files:
   - Write default patterns.json with sensible defaults:
     * indentation: { "type": "spaces", "size": 2 }
     * quotes: "single"
     * semicolons: true
     * naming: kebab-case files, camelCase functions, PascalCase components

## Spawn Patterns

**Researcher:**
```
Use Task tool to spawn .claude/agents/researcher.md

Provide:
- Research topic/question
- Phase name and context
- Output path: .planning/roadmaps/{roadmap}/{phase}/findings.md
```

**Planner:**
```
Use Task tool to spawn .claude/agents/planner.md

Provide:
- Findings file path (from researcher)
- Phase name and CONTEXT.md path
- Output path: .planning/roadmaps/{roadmap}/{phase}/plan.md
```

**Executor:**
```
Use Task tool to spawn .claude/agents/executor.md

Provide:
- Plan file path
- Wave number to execute
- Task IDs for this wave
- Problems directory: .planning/roadmaps/{roadmap}/{phase}/problems/
- Patterns file path: .planning/patterns.json

Task description MUST include:
"Read .planning/patterns.json for code style context before executing tasks"
```

## Report

After each action, output:

```
## ARIOS Status

**Current:** {phase name} - {status}
**Action:** Spawned {agent} for {purpose}

### Results
{Summary from handoff file}

### Next
{Suggested next action or /clear recommendation}
```
