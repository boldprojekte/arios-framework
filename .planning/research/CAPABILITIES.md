# Claude Code Capabilities for ARIOS v1.1

**Researched:** 2026-01-25
**Confidence:** HIGH (Official documentation verified via WebFetch)
**Focus:** Underutilized capabilities ARIOS could leverage

---

## Currently Used by ARIOS

ARIOS v1.0 leverages these Claude Code capabilities:

| Capability | How ARIOS Uses It |
|------------|-------------------|
| **Slash Commands** | Entry points: `/arios:ideate`, `/arios:plan`, `/arios:execute` via `.claude/commands/` |
| **Custom Subagents** | Researcher, Planner, Executor agents in `.claude/agents/` |
| **Task Tool** | Spawning subagents from orchestrator |
| **Read/Write/Edit** | File operations for plans, findings, state |
| **WebSearch/WebFetch** | Research agent gathers external information |
| **Bash** | Running commands, git operations |

**Current Gap:** ARIOS uses basic subagent delegation but misses advanced patterns like parallel execution, background tasks, hooks automation, and structured task tracking.

---

## Underutilized Capabilities

### 1. Task Tool Advanced Patterns

**What it offers:**

| Pattern | Description | Source |
|---------|-------------|--------|
| **Parallel Execution** | Run up to 8-10 concurrent subagents simultaneously | [Claude Code Subagent Deep Dive](https://cuong.io/blog/2025/06/24-claude-code-subagent-deep-dive) |
| **Background Tasks** | Press Ctrl+B to background a running task; continue working while agent runs | [Apidog Blog](https://apidog.com/blog/claude-code-background-tasks/) |
| **Thoroughness Levels** | Explore agent supports quick/medium/very-thorough modes | Official docs |
| **Subagent Resume** | Continue existing subagent work with full context instead of starting fresh | Official docs |
| **Context Isolation** | Each subagent gets its own context window, preventing pollution | [Zach Wills](https://zachwills.net/how-to-use-claude-code-subagents-to-parallelize-development/) |

**How ARIOS could use this:**

```
CURRENT (Sequential):
  Orchestrator -> Researcher (wait) -> Planner (wait) -> Executor

WITH PARALLEL EXECUTION:
  Orchestrator spawns:
    - Researcher 1 (API research)     \
    - Researcher 2 (Database patterns) |-- Run in parallel
    - Researcher 3 (UI conventions)   /
  -> Combine findings -> Planner
```

**Specific use cases:**
1. **Multi-domain research**: Spawn parallel researchers for different aspects (frontend, backend, database, deployment)
2. **Wave execution**: Execute independent tasks within a wave in parallel
3. **Background code review**: Run code reviewer in background after executor completes each wave
4. **Resume blocked tasks**: When executor reports blocked task, resume it with additional context

**Priority:** MUST-HAVE for v1.1 - Dramatically reduces execution time for complex projects.

---

### 2. Built-in Agent Types

**What it offers:**

Claude Code includes optimized built-in subagents:

| Agent | Model | Tools | Purpose |
|-------|-------|-------|---------|
| **Explore** | Haiku (fast) | Read-only | Codebase discovery, file search, analysis |
| **Plan** | Inherit | Read-only | Research for plan mode |
| **General-purpose** | Inherit | All | Multi-step tasks requiring modification |
| **Bash** | Inherit | Bash | Terminal commands in separate context |

**Key insight:** Explore uses Haiku (fast, cheap) for read operations. Custom agents default to inherited model but can specify `model: haiku` or `model: sonnet`.

**How ARIOS could use this:**

| Current ARIOS Agent | Could Use Built-in | Why |
|---------------------|-------------------|-----|
| Researcher | `Explore` or `agent: Explore` | Research is read-only; Explore is optimized for this with Haiku model |
| Planner | Custom (current) | Needs Write access for plan files |
| Executor | Custom (current) | Needs full tool access |

**Specific use cases:**
1. **Pre-execution scan**: Use Explore to scan codebase before execution wave
2. **Pattern detection**: Use Explore with `very-thorough` to analyze code patterns
3. **Cost optimization**: Route read-only research to Haiku-powered Explore

**Configuration in subagent frontmatter:**
```yaml
---
name: arios-scanner
description: Quick codebase scan before execution
agent: Explore  # Uses built-in Explore configuration
---
```

**Priority:** NICE-TO-HAVE for v1.1 - Good optimization, not blocking.

---

### 3. Hooks System

**What it offers:**

Hooks run shell commands or LLM prompts at specific lifecycle points:

| Hook Event | When It Fires | Use Case |
|------------|---------------|----------|
| `SessionStart` | Session begins | Load project context, set environment |
| `UserPromptSubmit` | User sends message | Validate prompts, add context |
| `PreToolUse` | Before tool runs | Validate operations, block dangerous actions |
| `PostToolUse` | After tool succeeds | Run linters, format code, log activity |
| `SubagentStart` | Subagent spawns | Set up agent-specific context |
| `SubagentStop` | Subagent finishes | Capture results, trigger next step |
| `Stop` | Claude finishes | Verify work complete, suggest next steps |
| `Setup` | --init or --maintenance | One-time setup operations |

**Configuration location:** `.claude/settings.json` or subagent frontmatter

**Example hook configuration:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$CLAUDE_PROJECT_DIR/$1\""
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "executor",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/post-execution-verify.sh"
          }
        ]
      }
    ]
  }
}
```

**How ARIOS could use this:**

| Automation | Hook Event | Action |
|------------|------------|--------|
| **Auto-format on write** | PostToolUse (Write\|Edit) | Run Prettier/linter |
| **Wave verification** | SubagentStop (executor) | Run test suite after wave |
| **Session context** | SessionStart | Inject current STATE.md summary |
| **Pre-commit checks** | PreToolUse (Bash git commit) | Validate changes before commit |
| **Prompt enrichment** | UserPromptSubmit | Add project context to user prompts |
| **Stop validation** | Stop | Check all tasks complete before ending |

**Prompt-based hooks (LLM evaluation):**
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check if all tasks are complete. Context: $ARGUMENTS. Return {\"ok\": true} to stop, or {\"ok\": false, \"reason\": \"...\"} to continue."
          }
        ]
      }
    ]
  }
}
```

**Priority:** MUST-HAVE for v1.1 - Enables automation without user intervention.

---

### 4. Todo System (TodoWrite/TodoRead)

**What it offers:**

Built-in task tracking visible in Claude Code UI:

| Tool | Purpose |
|------|---------|
| `TodoWrite` | Create/update task list |
| `TodoRead` | Read current tasks |

**Task schema:**
```json
{
  "id": "string",
  "content": "string",
  "status": "pending" | "in_progress" | "completed",
  "priority": "high" | "medium" | "low",
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

**Key insight from system prompt:** "Use these tools VERY frequently to ensure task tracking and giving the user visibility into progress. These tools are EXTREMELY helpful for planning tasks and breaking down larger complex tasks into smaller steps."

**How ARIOS could use this:**

| Current ARIOS | With Todo System |
|---------------|------------------|
| Tasks in plan files only | Tasks visible in Claude Code UI |
| No real-time progress | Live progress tracking |
| User must read files | User sees progress immediately |

**Integration pattern:**
```
Planner creates plan -> Also creates todos for each task
Executor starts wave -> Updates todos to in_progress
Executor completes task -> Updates todos to completed
User sees: Live progress bar in Claude Code
```

**Specific use cases:**
1. **Wave tracking**: Create todos for each wave, show aggregate progress
2. **Blocking visibility**: Mark blocked tasks in todo list with reason
3. **User transparency**: Non-technical users see progress without reading files

**Priority:** NICE-TO-HAVE for v1.1 - Great UX, not core functionality.

---

### 5. AskUserQuestion Patterns

**What it offers:**

Structured user input collection:
- Multiple choice questions
- Clarifying questions before action
- 60-second timeout per question
- 4-6 question limit per session

**Key patterns discovered:**

| Pattern | Description | Source |
|---------|-------------|--------|
| **Spec-Based Development** | Start with minimal spec, Claude interviews you, produces detailed spec | [Blog Post](https://torqsoftware.com/blog/2026/2026-01-14-claude-ask-user-question/) |
| **Plan Mode Integration** | Plan mode triggers clarifying questions before proposing changes | Official docs |
| **Prompt Improver Hook** | UserPromptSubmit hook enriches vague prompts via questions | [GitHub](https://github.com/severity1/claude-code-prompt-improver) |

**How ARIOS could use this:**

| Workflow Stage | Current | With AskUserQuestion |
|----------------|---------|---------------------|
| Ideation | Free-form input | Structured interview to clarify intent |
| Planning | User approves plan | Claude asks about unclear requirements |
| Execution | User reviews results | Claude asks before ambiguous decisions |

**Specific use cases:**
1. **Ideation interview**: "You mentioned a 'dashboard'. Should it be: (1) Admin overview (2) User dashboard (3) Analytics dashboard?"
2. **Architecture decisions**: "This could be built with: (1) REST API (2) GraphQL (3) tRPC. Your preference?"
3. **Ambiguous execution**: "The spec says 'fast loading'. Should I prioritize: (1) Initial load speed (2) Navigation speed (3) Data refresh speed?"

**Priority:** NICE-TO-HAVE for v1.1 - Improves UX for creative non-coder user.

---

### 6. Skills System (Enhanced Slash Commands)

**What it offers:**

Skills are enhanced slash commands with:
- Supporting files (templates, examples, scripts)
- Model/agent invocation control
- Dynamic context injection via `!`command\`\`
- `context: fork` for subagent execution

**Key differences from current commands:**

| Feature | Current Commands | Skills |
|---------|-----------------|--------|
| Structure | Single .md file | Directory with SKILL.md + supporting files |
| Dynamic context | No | Yes, via `!`command\`\` |
| Subagent execution | No | Yes, via `context: fork` |
| Model control | No | Yes, via `model:` field |
| Auto-invocation | User only | Claude can invoke automatically |

**Example skill structure:**
```
.claude/skills/arios-research/
  SKILL.md           # Main instructions
  templates/
    findings.md      # Template for research output
  examples/
    good-research.md # Example of high-quality research
```

**How ARIOS could use this:**

| Current | With Skills |
|---------|-------------|
| `/arios:ideate` command | `ideation` skill with interview template |
| Inline research | `research` skill with `context: fork` runs in Explore agent |
| Manual pattern loading | `code-style` skill injects patterns automatically |

**Specific use cases:**
1. **Research with templates**: Skill bundles research template, Claude fills it in
2. **Code generation patterns**: Skill includes example components, Claude matches style
3. **Auto-loaded context**: Skill with `user-invocable: false` adds context when relevant

**Priority:** NICE-TO-HAVE for v1.1 - Natural evolution of current commands.

---

### 7. MCP (Model Context Protocol) Integration

**What it offers:**

Connect Claude Code to external tools and data sources:
- 1200+ available MCP servers
- Database access (Postgres, etc.)
- Issue trackers (GitHub, Linear)
- Monitoring systems
- Custom APIs

**How ARIOS could use this:**

| Use Case | MCP Server |
|----------|------------|
| GitHub issue integration | `mcp__github__` for reading/creating issues |
| Database schema research | `mcp__postgres__` for schema analysis |
| Design integration | `mcp__figma__` for design context |
| Documentation | `mcp__notion__` for spec documents |

**Specific use cases:**
1. **Issue-to-execution**: Research reads GitHub issue, planner creates tasks, executor implements
2. **Schema-aware planning**: Planner reads actual database schema via MCP
3. **Design-to-code**: Research pulls Figma designs, executor implements

**Priority:** NICE-TO-HAVE for v1.1 - Powerful but requires setup per project.

---

### 8. Headless Mode for Automation

**What it offers:**

Run Claude Code programmatically:
```bash
claude -p "Run tests and fix failures" \
  --allowedTools "Bash,Read,Edit,Write" \
  --max-turns 10 \
  --output-format json
```

**Key flags:**
- `-p` / `--print`: Non-interactive mode
- `--allowedTools`: Restrict available tools
- `--output-format json`: Parseable output
- `--continue` / `--resume`: Continue previous session
- `--dangerously-skip-permissions`: Full automation (use carefully)

**How ARIOS could use this:**

| Use Case | Implementation |
|----------|----------------|
| **CI/CD integration** | Run ARIOS phases in GitHub Actions |
| **Scheduled execution** | Cron job runs execution waves |
| **Batch processing** | Script runs multiple ARIOS instances in parallel |

**Priority:** NICE-TO-HAVE for v1.1 - Advanced use case, not core workflow.

---

### 9. Memory System (CLAUDE.md Hierarchy)

**What it offers:**

Hierarchical persistent context:
1. Enterprise (managed settings)
2. User (`~/.claude/CLAUDE.md`)
3. Project (`./CLAUDE.md`)
4. Local (`./CLAUDE.local.md` - gitignored)

**Features:**
- Import files with `@path/to/import` syntax
- Recursive imports (max depth 5)
- `/memory` command to view loaded files

**How ARIOS could use this:**

| Level | ARIOS Use |
|-------|-----------|
| Project CLAUDE.md | Always load `.arios/system.md`, current state summary |
| Local CLAUDE.local.md | Developer-specific preferences |
| Import syntax | `@.planning/STATE.md` for current position |

**Priority:** MUST-HAVE for v1.1 - Already partially used, should formalize.

---

## Priority for v1.1

### Must-Have

| Capability | Impact | Effort |
|------------|--------|--------|
| **Parallel Task Execution** | 2-3x faster research/execution | Medium |
| **Hooks System** | Automation without user intervention | Medium |
| **Memory Formalization** | Consistent context loading | Low |

### Nice-to-Have

| Capability | Impact | Effort |
|------------|--------|--------|
| **Built-in Agent Types** | Cost optimization (Haiku for research) | Low |
| **Todo System** | Better UX for progress visibility | Medium |
| **AskUserQuestion** | Better UX for creative user | Medium |
| **Skills Migration** | Cleaner command organization | Medium |
| **MCP Integration** | Project-specific integrations | High |
| **Headless Mode** | CI/CD automation | High |

---

## Implementation Recommendations

### Quick Wins (Can implement immediately)

1. **Add hooks for auto-formatting**
   ```json
   // .claude/settings.json
   {
     "hooks": {
       "PostToolUse": [{
         "matcher": "Write|Edit",
         "hooks": [{"type": "command", "command": "npx prettier --write"}]
       }]
     }
   }
   ```

2. **Use Explore for research agents**
   ```yaml
   # .claude/agents/researcher.md
   ---
   name: researcher
   agent: Explore  # Use built-in Explore, faster and cheaper
   ---
   ```

3. **Formalize CLAUDE.md imports**
   ```markdown
   <!-- CLAUDE.md -->
   @.arios/system.md
   @.planning/STATE.md
   ```

### Medium-Term (v1.1 milestone)

1. **Parallel research pattern**
   - Orchestrator spawns multiple researchers in parallel
   - Each researcher writes to separate file
   - Synthesizer agent combines findings

2. **Hooks automation**
   - SessionStart: Load project state
   - SubagentStop: Trigger next workflow step
   - PostToolUse: Format code, run linters
   - Stop: Validate completion

3. **Todo integration**
   - Planner creates todos alongside plan files
   - Executor updates todo status
   - User sees live progress

### Future (Post-v1.1)

1. **MCP integrations** for specific project types
2. **Headless mode** for CI/CD pipelines
3. **Skills system** migration from commands

---

## Sources

### Official Documentation (HIGH confidence)
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Claude Code Custom Subagents](https://code.claude.com/docs/en/sub-agents)
- [Claude Code Skills](https://code.claude.com/docs/en/skills)
- [Claude Code Memory](https://code.claude.com/docs/en/memory)
- [Claude Code Headless Mode](https://code.claude.com/docs/en/headless)
- [Claude Code MCP Integration](https://code.claude.com/docs/en/mcp)

### Community Resources (MEDIUM confidence)
- [Claude Code Subagent Deep Dive](https://cuong.io/blog/2025/06/24-claude-code-subagent-deep-dive)
- [How to Parallelize Claude Code](https://zachwills.net/how-to-use-claude-code-subagents-to-parallelize-development/)
- [Background Tasks Overview](https://apidog.com/blog/claude-code-background-tasks/)
- [AskUserQuestion Guide](https://torqsoftware.com/blog/2026/2026-01-14-claude-ask-user-question/)

### GitHub Resources (MEDIUM confidence)
- [Claude Code System Prompts](https://github.com/Piebald-AI/claude-code-system-prompts)
- [Awesome Claude Code Subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)
- [Prompt Improver Hook](https://github.com/severity1/claude-code-prompt-improver)
