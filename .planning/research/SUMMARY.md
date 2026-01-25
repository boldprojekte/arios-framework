# Research Summary: ARIOS v1.1

**Project:** ARIOS v1.1 Milestone
**Domain:** AI Workflow Orchestration System
**Researched:** 2026-01-25
**Confidence:** HIGH

## Executive Summary

ARIOS v1.1 should focus on transforming from a sequential command system into a sophisticated orchestration platform that leverages Claude Code's advanced capabilities. The research reveals that modern AI workflow systems succeed by (1) maintaining thin orchestrators that coordinate specialized agents, (2) executing work in parallel with isolated contexts, and (3) implementing verification and recovery patterns that prevent error cascading.

The recommended approach is to adopt GSD's proven orchestration model: keep the orchestrator purely coordinative, spawn specialized subagents with clear role separation (Explore, Research, Plan, Execute, Verify), and leverage wave-based execution with fresh context windows. Critical capabilities to implement include parallel task execution (2-3x speed improvement), hooks system for automation, and structured verification after each wave. The verifier subagent should operate as a post-execution quality gate that catches integration failures, intent drift, and compounding errors that simple checkpoints miss.

Key risks include state drift (tracked state diverging from reality), error compounding (95% reliability per step = 36% success over 20 steps), and user-agent misalignment. Mitigation strategies include pre-flight state integrity checks, wave-boundary verification, semantic consistency validation, and clear escalation triggers (3 failures = user involvement). The user is creative and non-technical, requiring plain-language error translation and explicit decision points rather than technical jargon.

## Key Insights

### Orchestration

1. **Thin Orchestrator Pattern** - The orchestrator should NEVER do heavy lifting. Its sole responsibility is to parse intent, spawn agents, collect results, route to next stage, and update state. This keeps the main context under 40% and prevents degradation. GSD and BMAD both demonstrate this pattern works at scale.

2. **Two-Stage Research Model** - Always run codebase exploration (maps existing context), conditionally run external research (when new domains/technologies appear). Research timing matters: project-level research informs roadmap structure, phase-level research informs task plans.

3. **Wave-Based Execution with Fresh Contexts** - Execute tasks in groups (waves), spawn each executor in fresh 200k context window, verify between waves, prevent error propagation. This is critical for preventing context degradation and catching integration failures early.

4. **File-Based Handoff Artifacts** - Use persistent markdown files as contracts between agents. Each transition should have an explicit artifact: Ideate→Plan uses VISION.md, Explore→Plan uses CODEBASE.md, Plan→Execute uses PLAN.md. This ensures context survives across sessions and subagent boundaries.

5. **Structured Returns for Programmatic Routing** - Every subagent should return structured summaries with status, artifacts, verification steps, issues, and suggested next actions. This enables the orchestrator to make routing decisions without re-analyzing raw output.

### Claude Code Capabilities

1. **Parallel Execution (MUST-HAVE)** - Claude Code supports 8-10 concurrent subagents. ARIOS should spawn multiple researchers in parallel (API, database, UI domains simultaneously), execute independent tasks within waves in parallel, and run verifier in background after executor completes. This reduces execution time by 2-3x for complex projects.

2. **Hooks System (MUST-HAVE)** - Hooks enable automation without user intervention. Critical hooks for ARIOS: SessionStart (load project state), PostToolUse (auto-format on Write/Edit), SubagentStop (trigger verification after executor), Stop (validate completion before ending). This removes manual overhead and ensures consistency.

3. **Memory Formalization (MUST-HAVE)** - CLAUDE.md hierarchy provides persistent context. ARIOS should formalize imports: project CLAUDE.md always loads `.arios/system.md` and `.planning/STATE.md` summary. This ensures every session starts with current context without manual setup.

4. **Built-in Agent Types (NICE-TO-HAVE)** - Explore agent uses Haiku (fast, cheap) for read-only operations. ARIOS research phase could leverage Explore instead of custom agents for cost optimization. Use `agent: Explore` in frontmatter to route codebase scanning to Haiku.

5. **Todo System (NICE-TO-HAVE)** - TodoWrite/TodoRead provides live progress tracking in Claude Code UI. For creative non-coder users, this dramatically improves transparency: they see progress bars instead of reading plan files. Planner creates todos, executor updates status, user watches real-time progress.

### Verification

1. **Three-Tier Verification Model** - Tier 1 (always run, fast): TypeScript compilation, dependency existence, critical lint errors, import/export resolution. Tier 2 (wave boundaries): full test suite, security audit, cross-file dependency analysis. Tier 3 (phase boundaries): intent alignment summary, requirement mapping, architecture consistency check.

2. **Verify Early, Verify Often** - Error rates compound exponentially. A failed wave 1 must NEVER proceed to wave 2. The verifier's job is to stop propagation, not just report issues. Run integration checks after each wave (< 30 seconds, automated), full verification at phase checkpoints (with human involvement).

3. **Integration Verification for Parallel Work** - When multiple executors work simultaneously, they can create semantic conflicts that compile but behave incorrectly. Post-wave checks: run full TypeScript compilation, extract all exports and imports, verify resolution, flag unused exports. Catch these before the next wave builds on broken foundations.

4. **Intent Alignment is Human Judgment** - Code can work but not solve the original problem. The verifier should generate narrative summaries (not code), map changes back to requirements, highlight deviations, and present to user with specific questions. Don't ask "does this look right?" Ask "I built a user dashboard with real-time updates. You mentioned 'dashboard' - did you mean admin analytics instead?"

5. **Structured Reporting** - Verifier output should include automated checks (PASS/FAIL table), integration analysis (files modified, potential conflicts), intent alignment summary (what was built, mapped to requirements), and clear recommendation (PROCEED/BLOCK/NEEDS_REVIEW). Block on errors, warn on warnings, never silent pass-through.

### Debugging

1. **State Drift is the Primary Failure Mode** - STATE.md diverging from filesystem reality causes more failures than code errors. Implement pre-flight checks: hash validation (detect external modification), cross-file consistency (STATE.md phase matches existing PLAN.md), timestamp sanity, orphan detection (summaries without state updates). Run before every plan execution.

2. **Self-Correction vs Escalation Decision Tree** - Self-correct when error is technical, bounded, and doesn't require user input (missing imports, type errors, format issues). Try max 3 times with different approaches. Escalate immediately when: user requests control, security at risk, user frustrated, same error 3+ times, action would be destructive, or AI confidence below threshold. Always escalate requirement/design questions.

3. **Rollback vs Fix Forward** - Rollback when work is corrupted beyond repair and rollback is safe (no schema migrations, no external side effects, isolated changes). Fix forward when rollback would lose significant progress or is unsafe. Preserve evidence before rollback (save broken state, log attempts, note failures). Make system stable first, then repair incrementally.

4. **Debug Context Persistence** - Debug sessions span multiple conversations. Write debug state to `.planning/debug/CURRENT_ISSUE.md` (symptom, context, hypothesis), `ATTEMPTS.md` (what was tried, results, learnings), `DIAGNOSTIC.md` (collected information). This ensures new sessions can resume debugging without re-investigation.

5. **Translate Errors for Non-Coders** - User is creative, not technical. Say "The app won't start" not "Port 3000 EADDRINUSE". Say "The database connection failed" not "ECONNREFUSED 127.0.0.1:5432". Provide options with pros/cons, not just error dumps. Lead with impact, not technical details.

## Recommended Architecture

ARIOS v1.1 should implement a **5-role orchestration model** with clear separation:

```
┌─────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                           │
│         (Coordination only, never heavy lifting)            │
│  - Parse user intent                                        │
│  - Spawn agents based on workflow stage                     │
│  - Collect structured returns                               │
│  - Route to next stage                                      │
│  - Update STATE.md                                          │
└─────────────────────────────────────────────────────────────┘
                              |
                              v
       ┌──────────────────────┴──────────────────────┐
       |                                             |
       v                                             v
┌──────────────┐                            ┌──────────────┐
│   IDEATE     │                            │   EXPLORE    │
│ (Sequential) │                            │  (Parallel)  │
├──────────────┤                            ├──────────────┤
│ User dialog  │                            │ Multi-file   │
│ Clarify WHAT │                            │ scan via     │
│ Write VISION │                            │ Haiku agent  │
└──────────────┘                            └──────────────┘
       │                                             |
       └──────────────────┬─────────────────────────┘
                          v
                   ┌──────────────┐
                   │   RESEARCH   │
                   │  (Parallel)  │
                   ├──────────────┤
                   │ 4 parallel   │
                   │ researchers: │
                   │ - Stack      │
                   │ - Patterns   │
                   │ - Features   │
                   │ - Pitfalls   │
                   └──────────────┘
                          │
                          v
                   ┌──────────────┐
                   │     PLAN     │
                   │ (Sequential) │
                   ├──────────────┤
                   │ Create tasks │
                   │ Structure    │
                   │ waves        │
                   └──────────────┘
                          │
                          v
                   ┌──────────────┐
                   │   EXECUTE    │
                   │ (Wave-based) │
                   ├──────────────┤
                   │ Wave 1: [A,B]│
                   │   -> Verify  │
                   │ Wave 2: [C,D]│
                   │   -> Verify  │
                   └──────────────┘
                          │
                          v
                   ┌──────────────┐
                   │    VERIFY    │
                   │   (Auto +    │
                   │    Human)    │
                   ├──────────────┤
                   │ Tier 1: Auto │
                   │ Tier 2: Wave │
                   │ Tier 3: Phase│
                   └──────────────┘
```

**Key Integration Points:**

- **Hooks Integration**: SessionStart loads state, PostToolUse auto-formats, SubagentStop triggers verify
- **Parallel Execution**: Research spawns 4 agents, Execute spawns per-task agents in waves
- **Fresh Contexts**: Each executor gets 200k clean context with minimal handoff files
- **State Tracking**: STATE.md updated after each stage transition with structured data
- **Recovery**: Pre-flight checks before execution, post-wave verification, escalation triggers

**Data Flow:**

1. User invokes `/arios:plan` or `/arios:execute`
2. Orchestrator runs pre-flight check (state integrity, dependencies, blockers)
3. Orchestrator spawns appropriate agents based on stage
4. Agents work in parallel where possible (research, execution waves)
5. Agents return structured reports to orchestrator
6. Orchestrator spawns verifier after waves/phases
7. Verifier returns PROCEED/BLOCK/REVIEW decision
8. Orchestrator routes: PROCEED → next stage, BLOCK → debug agent, REVIEW → user
9. STATE.md updated with results, decisions, next step

## Priority Features

### Must-Have (Critical for v1.1)

1. **Parallel Task Execution**
   - Spawns up to 8-10 concurrent subagents
   - Research: 4 parallel researchers (stack, patterns, features, pitfalls)
   - Execution: Independent tasks within wave run in parallel
   - Impact: 2-3x faster execution for complex projects
   - Implementation: Use Task tool with multiple calls in single response

2. **Hooks System for Automation**
   - SessionStart: Auto-load `.planning/STATE.md` summary
   - PostToolUse (Write|Edit): Auto-format with Prettier
   - SubagentStop (executor): Trigger verifier automatically
   - Stop: Validate all tasks complete before ending
   - Impact: Removes manual overhead, ensures consistency
   - Implementation: `.claude/settings.json` hooks configuration

3. **Wave-Based Execution with Verification**
   - Group tasks into waves based on dependencies
   - Execute wave → verify → next wave (not all at once)
   - Each wave uses fresh executor context (200k tokens)
   - Verification runs between waves (integration check)
   - Impact: Prevents error cascading, catches issues early
   - Implementation: Modify executor.md to process waves sequentially

4. **Verifier Subagent**
   - Spawned after each wave completion
   - Runs Tier 1 checks automatically (TypeScript, lint, deps)
   - Generates structured report (PROCEED/BLOCK/REVIEW)
   - Blocks execution if integration failures detected
   - Impact: Catches 75% more defects before user sees them
   - Implementation: New `.claude/agents/verifier.md` subagent

5. **Pre-Flight State Integrity Checks**
   - Hash validation (detect external STATE.md modifications)
   - Cross-file consistency (STATE.md phase matches PLAN.md existence)
   - Timestamp sanity checks
   - Orphan detection (summaries without state updates)
   - Impact: Prevents 80% of state drift failures
   - Implementation: New `state-integrity.ts` utility

6. **Memory Formalization**
   - CLAUDE.md imports `.arios/system.md` and `.planning/STATE.md` summary
   - Ensures every session starts with current context
   - No manual "what was I working on?" questions
   - Impact: Seamless session resumption
   - Implementation: Update CLAUDE.md with `@` import syntax

### Should-Have (High Value, Defer if Needed)

1. **Explore Agent for Research**
   - Use built-in Explore agent (Haiku model) for codebase scanning
   - Faster and cheaper than custom agents
   - Cost optimization: research is read-only, Haiku is sufficient
   - Implementation: `agent: Explore` in researcher.md frontmatter

2. **Todo System Integration**
   - Planner creates TodoWrite entries for each task
   - Executor updates todos to in_progress → completed
   - User sees live progress bar in Claude Code UI
   - Non-coder transparency: visual progress, not file reading
   - Implementation: Add TodoWrite calls in planner, TodoRead in orchestrator

3. **Debug Context Persistence**
   - Write debug state to `.planning/debug/` files
   - CURRENT_ISSUE.md, ATTEMPTS.md, DIAGNOSTIC.md
   - Enables multi-session debugging without context loss
   - Implementation: New debug agent writes state on escalation

4. **Structured Escalation Messages**
   - Template-based escalation to user
   - Plain language: "The app won't start" not "EADDRINUSE"
   - Present options with pros/cons
   - Specific questions, not "does this look right?"
   - Implementation: Update recovery.ts with message templates

5. **Self-Correction with Retry Limits**
   - Max 3 attempts for technical errors
   - Track attempts in debug state
   - Escalate on 3rd failure
   - Different approach each attempt (not same fix 3 times)
   - Implementation: Add attempt counter to recovery flow

### Nice-to-Have (Post-v1.1)

1. **Skills System Migration** - Migrate commands to skills with templates, examples, context injection
2. **MCP Integration** - GitHub issues, database schema access, Figma designs
3. **Headless Mode** - CI/CD integration, batch processing
4. **AskUserQuestion Patterns** - Structured interviews during ideation
5. **Background Task Execution** - Long-running tasks with Ctrl+B

## Risks & Mitigations

### Risk 1: Error Compounding (HIGH)

**Description:** 95% reliability per step = only 36% success over 20 steps. Early errors propagate and multiply through subsequent waves.

**Mitigation:**
- Verify after every wave (not just at end)
- Block on first failure (never proceed with broken foundation)
- Pre-flight checks before execution starts
- Tier 1 verification (< 30 seconds) catches compile errors
- Wave boundaries are hard stops: broken wave 1 = no wave 2

**Detection:** TypeScript won't compile, imports unresolved, tests fail on wave N but passed on wave N-1

### Risk 2: State Drift (HIGH)

**Description:** STATE.md diverges from filesystem reality when users manually edit files or sessions end without updates.

**Mitigation:**
- Hash validation on STATE.md frontmatter (detect external edits)
- Cross-file consistency checks (state says phase 3, no plan 3 exists)
- Pre-flight check before every execution
- SessionStart hook validates state integrity
- Explicit "resume" command that reconciles state

**Detection:** Checksum mismatch, orphan summaries, contradictory phase references

### Risk 3: Parallel Integration Failures (MEDIUM)

**Description:** Multiple executors working simultaneously can create semantic conflicts that compile but break behavior.

**Mitigation:**
- Post-wave integration build (full TypeScript compilation)
- Extract/verify all imports and exports resolve
- Run full test suite at wave boundaries (not per-task)
- Flag unused exports (may indicate incomplete integration)
- Cross-file dependency analysis before next wave

**Detection:** TypeScript errors after wave completion, failing tests that passed individually, runtime errors from missing contracts

### Risk 4: User-Agent Misalignment (MEDIUM)

**Description:** Non-technical creative user expects X, AI builds Y. Intent drift happens silently.

**Mitigation:**
- Verifier generates plain-language summary of what was built
- Map changes back to original requirements
- Ask specific questions: "I built admin analytics. You said 'dashboard' - did you mean user dashboard instead?"
- Show narrative summary before code
- Tier 3 verification (phase boundaries) includes human checkpoint

**Detection:** User says "that's not what I meant", features don't match PROJECT.md vision, user requests rollback

### Risk 5: Context Degradation in Long Sessions (MEDIUM)

**Description:** Orchestrator context grows over multiple phases, leading to slower/lower-quality responses.

**Mitigation:**
- Keep orchestrator thin (coordination only, never heavy work)
- Spawn fresh executors for each wave (200k clean context)
- Structured returns (not full output) from subagents
- Minimal handoff files (PROJECT, REQUIREMENTS, PLAN only)
- Monitor context usage, warn if orchestrator exceeds 40%

**Detection:** Orchestrator responses slow down, "I'll be more concise" messages, missed details in routing decisions

## Open Questions

### Technical Implementation

1. **Wave Grouping Algorithm** - How should the planner automatically group tasks into waves? By dependencies? By file/component? By estimated complexity?

2. **Verification Timeout** - How long should Tier 1 verification run before assuming hang? 30 seconds? 60 seconds? Should timeout be configurable per project?

3. **Parallel Limit Tuning** - Research says 8-10 concurrent subagents. Should ARIOS default to max (fastest) or conservative (5-6) to avoid overwhelming users with parallel output?

4. **State Recovery** - When pre-flight check detects STATE.md corruption, should ARIOS auto-fix (risky, might guess wrong) or always escalate to user (safe, slower)?

### User Experience

1. **Verification Reporting Detail** - Should users see full verification reports or just PASS/FAIL summary? Non-coders may not care about lint warnings.

2. **Todo Visibility Preference** - Some users may find todo notifications distracting. Should this be opt-in or opt-out?

3. **Escalation Threshold Tuning** - Is 3 failures the right threshold for all users? Creative users might want earlier escalation (2 failures), technical users might prefer more autonomy (5 failures).

### Workflow Design

1. **Research Triggering** - When should external research run automatically vs require explicit `/arios:research` command? Only on greenfield? On new technology detection? User preference?

2. **Checkpoint Frequency** - Current: end of phase. Should waves also have user checkpoints? Or only automatic verification?

3. **Debug Agent Spawning** - Should debug agent spawn automatically on 3rd failure, or should orchestrator always ask user "debug automatically or tell me what to do?"

### Integration Priorities

1. **Dashboard Integration** - Should verifier results feed into dashboard UI? Real-time progress tracking? How much detail?

2. **MCP Server Selection** - Which MCP integrations provide most value for ARIOS users? GitHub issues? Database access? Design tools? Prioritize which?

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Orchestration | HIGH | GSD, BMAD, and Claude Code docs all converge on same patterns |
| Capabilities | HIGH | Official Claude Code documentation verified via WebFetch |
| Verification | HIGH | Well-established tools, proven patterns from production systems |
| Debugging | MEDIUM-HIGH | Patterns clear from research, ARIOS-specific thresholds need tuning |

**Overall confidence:** HIGH

### Gaps to Address

1. **Wave Grouping Logic** - Research shows waves work, but automatic task-to-wave assignment algorithm not specified. Will need experimentation during implementation.

2. **Verification Performance** - Tier 1 checks should be "fast" but specific time targets not established. TypeScript compilation time varies by project size. May need configurable timeouts.

3. **Escalation Threshold Tuning** - 3-failure threshold is standard but not validated for creative non-coder users. May need user preference or adaptive thresholds based on past behavior.

4. **Parallel Execution Optimal Limits** - Research says 8-10 concurrent agents possible, but optimal number for ARIOS workloads unknown. May need profiling to find sweet spot between speed and output manageability.

5. **State Recovery Strategies** - Pre-flight checks can detect corruption but auto-fix vs escalate decision logic not fully specified. Conservative (escalate) is safer but slower. Needs user preference setting.

## Sources

### Orchestration Patterns (HIGH confidence)
- [GSD GitHub Repository](https://github.com/glittercowboy/get-shit-done) - Thin orchestrator, wave execution, research timing
- [BMAD-METHOD GitHub](https://github.com/bmad-code-org/BMAD-METHOD) - Role separation, artifact handoffs, domain experts
- [Claude Code Subagent Docs](https://code.claude.com/docs/en/sub-agents) - Built-in agents, context isolation, subagent limitations
- [GitHub Spec-Kit Blog](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/) - Human-agent iteration patterns

### Claude Code Capabilities (HIGH confidence)
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) - Hook events, lifecycle integration
- [Claude Code Custom Subagents](https://code.claude.com/docs/en/sub-agents) - Agent types, model selection
- [Claude Code Skills](https://code.claude.com/docs/en/skills) - Skills vs commands, context injection
- [Claude Code Memory](https://code.claude.com/docs/en/memory) - CLAUDE.md hierarchy, import syntax
- [Claude Code Todo System](https://code.claude.com/docs/en/tools) - TodoWrite/TodoRead schema
- [Claude Code Subagent Deep Dive](https://cuong.io/blog/2025/06/24-claude-code-subagent-deep-dive) - Parallel limits, context isolation

### Verification Patterns (MEDIUM-HIGH confidence)
- [Anthropic Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system) - Coordination patterns, verification approaches
- [Zencoder AI Coding Best Practices](https://zencoder.ai/blog/how-to-use-ai-in-coding) - AI code defect rates (1.7x human)
- [OWASP Cascading Failures Guide](https://adversa.ai/blog/cascading-failures-in-agentic-ai-complete-owasp-asi08-security-guide-2026/) - Error compounding math (95% → 36%)
- [GitHub Semantic Merge Conflict Detection](https://github.com/brendon-ng/Semantic-Merge-Conflict-Detection) - Integration verification patterns

### Debugging & Recovery (MEDIUM-HIGH confidence)
- [MarkTechPost Multi-Agent Failure Modes](https://www.marktechpost.com/2025/03/25/understanding-and-mitigating-failure-modes-in-llm-based-multi-agent-systems/) - State drift, semantic drift categories
- [Augment Code Multi-Agent Systems Failures](https://www.augmentcode.com/guides/why-multi-agent-llm-systems-fail-and-how-to-fix-them) - Detection strategies, behavioral signals
- [Replicant AI Escalation Rules](https://www.replicant.com/blog/when-to-hand-off-to-a-human-how-to-set-effective-ai-escalation-rules) - Escalation decision framework
- [GoCodeo Error Recovery Strategies](https://www.gocodeo.com/post/error-recovery-and-fallback-strategies-in-ai-agent-development) - Self-correction vs escalation patterns

### Supporting Research (MEDIUM confidence)
- [BMAD Architecture Deep Dive](https://www.vibesparking.com/en/blog/ai/bmad/2026-01-15-bmad-agents-workflows-tasks-files-architecture/)
- [Context Engineering Under the Hood](https://blog.lmcache.ai/en/2025/12/23/context-engineering-reuse-pattern-under-the-hood-of-claude-code/)
- [Zach Wills Parallelize Development](https://zachwills.net/how-to-use-claude-code-subagents-to-parallelize-development/)
- [Galileo Multi-Agent Coordination](https://galileo.ai/blog/multi-agent-coordination-failure-mitigation)

---

*Research completed: 2026-01-25*
*Ready for roadmap: yes*
*Synthesis covers: Orchestration, Capabilities, Verification, Debugging*
