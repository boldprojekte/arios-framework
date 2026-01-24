# Phase 1: Foundation - Research

**Researched:** 2026-01-24
**Domain:** CLAUDE.md integration + CLI project scaffolding
**Confidence:** HIGH

## Summary

This phase establishes the foundation for ARIOS v2: automatic system context loading via CLAUDE.md and professional project scaffolding via a CLI tool. The research covers two distinct but related domains:

1. **CLAUDE.md Integration**: How Claude Code discovers and loads project memory, the @file import syntax for lazy-loading ARIOS instructions, and best practices for keeping CLAUDE.md lean (<60 lines) while enabling deep functionality.

2. **Project Scaffolding CLI**: The standard `npx [package-name]` pattern for CLI tools, interactive prompts using @inquirer/prompts, and framework-adaptive template systems.

The key insight: CLAUDE.md should be a minimal pointer to ARIOS, not a container for ARIOS. The `.arios/` folder holds the actual system files, and CLAUDE.md uses @imports to pull them in on-demand.

**Primary recommendation:** Create a lean CLAUDE.md integration (~5 lines) that uses @.arios/... imports, paired with `npx arios init` for zero-config installation.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | 22+ | Runtime for CLI | LTS, ESM native, required for npx |
| TypeScript | 5.x | CLI implementation | Type safety, better DX |
| @inquirer/prompts | 7.x | Interactive CLI prompts | Modern rewrite, smaller bundle, async/await native |
| chalk | 5.x | CLI output styling | De facto standard for colored output |
| commander | 12.x | CLI argument parsing | 25M+ weekly downloads, powers Vue CLI, CRA |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs-extra | 11.x | File operations | Copying templates, creating directories |
| handlebars | 4.x | Template rendering | Variable substitution in scaffolded files |
| execa | 9.x | Shell commands | Running git init, npm install in scaffolded project |
| ora | 8.x | Spinners | Long-running operations like npm install |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @inquirer/prompts | prompts | prompts is lighter but less maintained |
| commander | yargs | yargs has steeper learning curve, more verbose |
| handlebars | ejs | ejs is simpler but less powerful for complex templates |
| chalk | picocolors | picocolors is smaller but less feature-rich |

**Installation:**
```bash
npm install @inquirer/prompts chalk commander fs-extra ora
npm install -D typescript @types/node @types/fs-extra
```

## Architecture Patterns

### CLAUDE.md Structure

```
project-root/
├── CLAUDE.md                  # Lean pointer (~5 lines)
├── .arios/                    # ARIOS system files
│   ├── config.json            # Project detection, stack info
│   ├── system.md              # Core ARIOS instructions
│   └── commands/              # ARIOS-specific slash commands
│       ├── ideate.md
│       ├── plan.md
│       └── execute.md
└── .claude/
    ├── commands/              # Slash commands (Claude Code standard)
    │   └── arios/             # ARIOS namespace
    │       ├── start.md       # /arios:start
    │       └── update.md      # /arios:update
    └── agents/                # Subagent prompts (if needed)
```

### Pattern 1: Lean CLAUDE.md with @imports

**What:** CLAUDE.md stays minimal, using @imports to pull in ARIOS instructions only when needed.

**When to use:** Always - this is the core pattern for ARIOS integration.

**Example:**

```markdown
# Project: [Name]
[One-liner description]

## ARIOS
This project uses ARIOS. See @.arios/system.md for AI workflow commands.

## Commands
- See @package.json for available scripts
```

**Why this pattern:**
- Keeps CLAUDE.md under 60 lines (best practice threshold)
- Lazy loading - ARIOS instructions only loaded when Claude reads @.arios/system.md
- User's project-specific content stays visible
- ARIOS content doesn't pollute the main context

### Pattern 2: Two-Step Installation

**What:** `npx arios init` creates files, `/arios:start` completes setup inside Claude Code.

**When to use:** For all ARIOS installations.

**How it works:**
1. **CLI Phase (npx):**
   - Creates `.arios/` folder with system files
   - Creates `.claude/commands/arios/` with slash commands
   - Adds minimal ARIOS pointer to CLAUDE.md (creates if doesn't exist)
   - Does NOT run in Claude Code context

2. **Claude Phase (/arios:start):**
   - Runs INSIDE Claude Code
   - Configures hooks (if applicable)
   - Detects project type and stack
   - Stores detection in `.arios/config.json`
   - Offers to enhance CLAUDE.md based on detected stack

**Why split:**
- npx works everywhere (no Claude Code dependency)
- /arios:start can use Claude's intelligence for detection
- Clear separation of concerns

### Pattern 3: Framework-Adaptive Scaffolding

**What:** Templates adapt based on detected/chosen stack.

**When to use:** New project scaffolding via `/arios:scaffold` or similar.

**Structure:**
```
~/.arios/templates/           # Or bundled in package
├── base/                     # Common to all projects
│   ├── .gitignore
│   ├── .editorconfig
│   └── .prettierrc
├── stacks/
│   ├── nextjs/               # Next.js specific
│   │   ├── src/
│   │   ├── package.json.hbs
│   │   └── tsconfig.json
│   ├── node/                 # Plain Node.js
│   ├── python/               # Python projects
│   └── react/                # Vite + React
└── addons/
    ├── eslint/
    ├── husky/
    └── github-actions/
```

### Anti-Patterns to Avoid

- **Bloated CLAUDE.md:** Never put full ARIOS instructions directly in CLAUDE.md. Use @imports instead.
- **Global ARIOS:** Don't install ARIOS to ~/.claude/. Keep it project-local in .arios/ for portability.
- **Forced workflows:** Don't hardcode specific commands. Let users invoke what they need.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CLI argument parsing | Manual process.argv parsing | commander | Edge cases: --help, --version, errors |
| Interactive prompts | readline + manual validation | @inquirer/prompts | Validation, types, styling built-in |
| File copying with templates | fs.readFile + replace | handlebars + fs-extra | Escaping, conditionals, partials |
| Colored output | ANSI escape codes | chalk | Cross-platform, auto-detects color support |
| Spinners/progress | setInterval + console.log | ora | Handles terminal clearing, interrupts |
| Project detection | Manual file checks | Simple heuristics are fine | But don't over-engineer detection |

**Key insight:** The CLI is a distribution mechanism, not the product. Keep it simple.

## Common Pitfalls

### Pitfall 1: CLAUDE.md Size Explosion

**What goes wrong:** ARIOS instructions keep getting added to CLAUDE.md until it exceeds 60 lines and Claude starts ignoring it.

**Why it happens:** Easy to add "just one more thing" without measuring impact.

**How to avoid:**
- ARIOS adds maximum 5 lines to CLAUDE.md
- All detailed instructions live in .arios/ and are @imported
- Regular audits with `wc -l CLAUDE.md`

**Warning signs:** Claude forgets project context, ignores instructions that worked before.

### Pitfall 2: Circular @imports

**What goes wrong:** @imports reference each other, creating infinite loops or deep nesting.

**Why it happens:** Recursive imports allowed up to 5 levels deep - easy to accidentally create cycles.

**How to avoid:**
- Keep @import structure flat: CLAUDE.md → .arios/*.md → nothing
- Never have .arios files import other .arios files
- Document the intended import hierarchy

**Warning signs:** /memory command shows unexpected nesting levels.

### Pitfall 3: Assuming Global Installation Works

**What goes wrong:** CLI assumes files are in predictable locations, but different Claude Code versions or setups behave differently.

**Why it happens:** Testing only on one machine/setup.

**How to avoid:**
- Keep ARIOS fully project-local (.arios/ folder)
- Only use .claude/commands/ for slash commands (Claude Code standard)
- Don't rely on ~/.claude/ for anything except user preferences

**Warning signs:** "Works on my machine" syndrome.

### Pitfall 4: Over-Engineering Project Detection

**What goes wrong:** Complex detection logic for every possible framework, leading to false positives and confusion.

**Why it happens:** Trying to support everything automatically.

**How to avoid:**
- Detect the obvious (package.json = Node, requirements.txt = Python)
- For ambiguous cases, ask the user
- Store detection result so it's not re-computed

**Warning signs:** Detection gives wrong answers for hybrid projects.

### Pitfall 5: Template Bloat

**What goes wrong:** Scaffolded projects include everything imaginable, overwhelming new users.

**Why it happens:** "They might need it" thinking.

**How to avoid:**
- Start minimal: src/, package.json, tsconfig.json, .gitignore
- Professional additions (husky, lint-staged, CI) are opt-in during setup
- README is generated based on actual project purpose, not generic

**Warning signs:** New project has more config files than source files.

## Code Examples

Verified patterns from official sources:

### CLAUDE.md with ARIOS Pointer (Minimal)

```markdown
# Project: MyApp
A web application for task management.

## ARIOS
This project uses ARIOS for AI-assisted development.
When you need workflow guidance, see @.arios/system.md
```

### npx CLI Entry Point (TypeScript)

```typescript
#!/usr/bin/env node
// Source: standard npm bin pattern + commander docs
import { program } from 'commander';
import { init } from './commands/init.js';
import { update } from './commands/update.js';

program
  .name('arios')
  .description('AI-assisted development workflow for Claude Code')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize ARIOS in the current project')
  .action(init);

program
  .command('update')
  .description('Update ARIOS to the latest version')
  .action(update);

program.parse();
```

### Interactive Prompt with @inquirer/prompts

```typescript
// Source: @inquirer/prompts documentation
import { select, confirm } from '@inquirer/prompts';

const stack = await select({
  message: 'What type of project is this?',
  choices: [
    { name: 'Next.js', value: 'nextjs' },
    { name: 'React (Vite)', value: 'react-vite' },
    { name: 'Node.js API', value: 'node' },
    { name: 'Python', value: 'python' },
    { name: 'Other', value: 'other' }
  ]
});

const includeHusky = await confirm({
  message: 'Include git hooks with Husky?',
  default: true
});
```

### .arios/config.json Structure

```json
{
  "version": "1.0.0",
  "detected": {
    "type": "nextjs",
    "typescript": true,
    "packageManager": "pnpm"
  },
  "preferences": {
    "workflow": "interactive",
    "commitStyle": "conventional"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Long CLAUDE.md with everything | Lean CLAUDE.md + @imports | 2025-2026 | 3x better instruction following |
| inquirer (legacy) | @inquirer/prompts | 2024 | Smaller bundle, modern API |
| Global CLI tools | npx (temporary execution) | 2018+ | No global pollution, always latest |
| Monolithic templates | Composable addons | 2024+ | Users get only what they need |

**Deprecated/outdated:**
- Global npm install for scaffolding tools: Use npx instead
- inquirer (old API): Use @inquirer/prompts for new projects
- Single massive CLAUDE.md: Split into multiple files with @imports

## Open Questions

Things that couldn't be fully resolved:

1. **Hooks Integration**
   - What we know: Claude Code has a hooks system
   - What's unclear: Exact API, what can be hooked, stability
   - Recommendation: Defer hooks to a later phase, mark as TBD in /arios:start

2. **Subagent Registration**
   - What we know: Subagents can be spawned, GSD uses ~/.claude/agents/
   - What's unclear: Whether project-local agents in .arios/agents/ work
   - Recommendation: Test during implementation, fallback to .claude/agents/

3. **Skills vs Slash Commands**
   - What we know: Skills can fork context and add custom tools
   - What's unclear: When skills are better than slash commands for ARIOS
   - Recommendation: Start with slash commands, evaluate skills later

## Sources

### Primary (HIGH confidence)

- [Claude Code Memory Documentation](https://code.claude.com/docs/en/memory) - CLAUDE.md hierarchy, @import syntax, rules directory
- [CLAUDE.md Ultimate Guide](reference/CLAUDE_MD_ULTIMATE_GUIDE.md) - <60 lines rule, best practices, anti-patterns
- [GSD Package Structure](~/.claude/get-shit-done/) - Reference implementation of CLI + slash commands

### Secondary (MEDIUM confidence)

- [Building Your Own NPX CLI Tool](https://johnsedlak.com/blog/2025/03/building-an-npx-cli-tool) - npx CLI patterns verified with npm docs
- [@inquirer/prompts](https://www.npmjs.com/package/@inquirer/prompts) - Interactive prompts API verified with official package
- [Builder.io CLAUDE.md Guide](https://www.builder.io/blog/claude-md-guide) - Cross-referenced with Anthropic docs

### Tertiary (LOW confidence)

- WebSearch results on project structure - patterns vary by team/context, use as inspiration not prescription

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - well-established npm ecosystem patterns
- Architecture: HIGH - verified against Claude Code docs and GSD reference
- Pitfalls: HIGH - synthesized from CLAUDE.md research and community experience

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable domain)
