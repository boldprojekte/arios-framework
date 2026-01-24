# Phase 3: Entry Points - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Slash commands that detect project context and route users to appropriate ARIOS workflows. Users can invoke /ideate, /plan, /execute directly, or use /arios as a smart entry point. Detection identifies project type and state to guide routing.

</domain>

<decisions>
## Implementation Decisions

### Command naming & structure
- Three core commands: /ideate, /plan, /execute (clear phase separation)
- /arios as smart entry point that detects state and suggests appropriate command
- Helper commands: /status, /help (minimal set)
- /ideate available anytime (not just greenfield) — can brainstorm new features on existing projects

### Project detection behavior
- Greenfield = no code present (empty folder or only config files)
- Claude determines what counts as "code" contextually (not hardcoded rules)
- Detection always shown to user: "Detected: Brownfield project with React/TypeScript"
- Detect: tech stack (language, framework) AND structure (monorepo, src/ layout, test setup)

### Routing & suggestions
- /arios shows suggestion with confirmation: "You're at Phase 2. Start /plan?" — user confirms
- Always suggest next step after command completion: "Next: /plan"
- Inline text format for suggestions (simple, not boxed)
- Brief status line at every command start: "Phase 2/5, Plan 1/3"
- Out-of-sequence commands: warning + require confirmation ("No plan exists. Continue anyway?")

### Ambiguity handling
- Uncertain detection: show best guess with note ("Detected as Brownfield (uncertain)")
- Multiple valid next steps: recommend one, mention alternative ("Recommended: /plan (or /ideate for new feature)")
- Empty directory: offer project setup ("No project detected. Initialize ARIOS?")
- Unknown tech stacks: work universally — ARIOS is language-agnostic

### Claude's Discretion
- Exact detection heuristics for "code present"
- Format of status line display
- Wording of confirmation prompts
- How to display detected tech stack and structure

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-entry-points*
*Context gathered: 2026-01-24*
