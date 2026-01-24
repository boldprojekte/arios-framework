# Phase 4: State Management - Research

**Researched:** 2026-01-24
**Domain:** CLI state persistence, session continuity, file-based state management
**Confidence:** HIGH

## Summary

State management for CLI tools in Node.js has a well-established ecosystem centered around file-based persistence. The research revealed that **project-local markdown files with YAML frontmatter** (already used in ARIOS via `gray-matter`) combined with **`conf`** for user preferences is the standard approach. This aligns perfectly with ARIOS's existing architecture and the user decisions in CONTEXT.md.

The key insight is that ARIOS needs **two distinct state storage patterns**: (1) project state stored in `.planning/STATE.md` (markdown with frontmatter for human readability and git-friendliness), and (2) user preferences stored via `conf` in OS-appropriate locations. State conflict detection should use content hashing rather than timestamps, and the recovery flow should be collaborative (ask user) rather than automated.

**Primary recommendation:** Use the existing `gray-matter` library for project state (STATE.md) and add `conf` for user preferences. Implement simple hash-based conflict detection with collaborative resolution.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| gray-matter | ^4.0.3 | YAML frontmatter parsing | Already in ARIOS, battle-tested (30M+ repos), supports YAML/JSON |
| conf | ^12.x | User preferences storage | XDG-compliant, schema validation, migrations, atomic writes |
| fs-extra | ^11.2.0 | File operations | Already in ARIOS, promise-based, ensureDir, atomic operations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| chokidar | ^5.x | File watching | Only if real-time state sync needed (defer for now) |
| env-paths | ^3.x | OS-appropriate paths | For user preference location if not using conf |
| ajv | ^8.x | JSON Schema validation | State schema validation (conf has this built-in) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| gray-matter + conf | lowdb | lowdb is simpler but lacks frontmatter support for human-readable markdown |
| gray-matter + conf | node-persist | localStorage-style API but less flexible for structured state |
| gray-matter | JSON files | JSON lacks comments and is less human-friendly for state inspection |

**Installation:**
```bash
npm install conf
# gray-matter and fs-extra already installed
```

## Architecture Patterns

### Recommended Project Structure
```
.planning/
├── STATE.md                 # Project state (phase position, decisions)
├── PROJECT.md               # Project definition (existing)
└── phases/
    └── XX-name/
        └── *-CONTEXT.md     # Phase-specific decisions (existing)

~/.config/arios-nodejs/      # User preferences (via conf)
└── config.json              # Persisted user settings
```

### Pattern 1: Layered State Model
**What:** Separate project state (git-tracked) from user preferences (user-local)
**When to use:** Always - this is the core architecture pattern
**Example:**
```typescript
// Source: CONTEXT.md decisions + XDG Base Directory Specification
interface StateLayer {
  project: ProjectState;     // .planning/STATE.md - git tracked
  user: UserPreferences;     // ~/.config/arios-nodejs/ - user local
}

interface ProjectState {
  phase: number;
  planIndex: number;
  status: 'in-progress' | 'complete' | 'blocked';
  lastActivity: string;
  decisions: Decision[];
  negativeDecisions: Decision[];  // Explicitly tracked per CONTEXT.md
}

interface UserPreferences {
  language: string;
  verbosity: 'minimal' | 'normal' | 'verbose';
  // Other user-specific settings
}
```

### Pattern 2: State File with YAML Frontmatter
**What:** Use YAML frontmatter for structured data, markdown body for human context
**When to use:** For project state that needs to be both machine-readable and human-inspectable
**Example:**
```typescript
// Source: Existing ARIOS handoff.ts pattern + gray-matter docs
import matter from 'gray-matter';

interface StateFrontmatter {
  version: string;
  phase: number;
  planIndex: number;
  status: string;
  lastActivity: string;
  checksum: string;  // For conflict detection
}

async function readState(path: string): Promise<StateFile> {
  const content = await fs.readFile(path, 'utf-8');
  const parsed = matter(content);
  return {
    frontmatter: parsed.data as StateFrontmatter,
    body: parsed.content.trim()
  };
}

async function writeState(path: string, state: StateFile): Promise<void> {
  // Calculate checksum of meaningful state for conflict detection
  const checksum = calculateChecksum(state.frontmatter);
  const frontmatter = { ...state.frontmatter, checksum };
  const content = matter.stringify(state.body, frontmatter);

  await fs.ensureDir(path.dirname(path));
  await fs.writeFile(path, content, 'utf-8');
}
```

### Pattern 3: Conf for User Preferences
**What:** Use `conf` library for user-scoped preferences with schema validation
**When to use:** For preferences that should persist across projects and not be git-tracked
**Example:**
```typescript
// Source: sindresorhus/conf GitHub README
import Conf from 'conf';

const userPrefs = new Conf({
  projectName: 'arios',
  schema: {
    language: {
      type: 'string',
      default: 'en'
    },
    verbosity: {
      type: 'string',
      enum: ['minimal', 'normal', 'verbose'],
      default: 'normal'
    }
  },
  migrations: {
    '1.0.0': store => {
      // Future migration logic
    }
  }
});

// Atomic writes are automatic
userPrefs.set('language', 'de');
const lang = userPrefs.get('language');
```

### Pattern 4: Hash-Based Conflict Detection
**What:** Use content checksum to detect state drift, not timestamps
**When to use:** When loading state to detect if file was modified outside ARIOS
**Example:**
```typescript
// Source: Research on CLI state conflict detection best practices
import { createHash } from 'crypto';

function calculateChecksum(data: object): string {
  // Hash only meaningful fields, not metadata
  const meaningful = {
    phase: data.phase,
    planIndex: data.planIndex,
    status: data.status,
    decisions: data.decisions
  };
  return createHash('md5')
    .update(JSON.stringify(meaningful))
    .digest('hex')
    .slice(0, 8);  // Short hash sufficient for conflict detection
}

function detectConflict(stored: string, current: string): boolean {
  return stored !== current;
}
```

### Anti-Patterns to Avoid
- **Storing conversation state:** Per CONTEXT.md, discussion state is ephemeral - don't persist it
- **Duplicating Claude's task state:** Active coding work is tracked by Claude's task system
- **Auto-fixing state conflicts:** Always ask user, per CONTEXT.md decisions
- **Mixing project and user state:** Keep them in separate locations with different lifecycles
- **Using timestamps for conflict detection:** Use content hashes instead - more reliable

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom regex/parsing | gray-matter | Edge cases with delimiters, encoding, nested content |
| XDG-compliant paths | Platform detection logic | conf (built-in) or env-paths | Windows/macOS/Linux differences are subtle |
| Atomic file writes | Rename tricks | conf or fs-extra | Race conditions, crash safety, cross-platform |
| JSON Schema validation | Manual validation | conf schema option (uses ajv) | Edge cases, type coercion, clear error messages |
| State migrations | Version checking code | conf migrations | Semver range support, ordered execution |

**Key insight:** The Node.js CLI ecosystem has mature solutions for state persistence. Custom solutions add bugs without adding value. The conf library alone handles XDG paths, atomic writes, schema validation, and migrations.

## Common Pitfalls

### Pitfall 1: State File Corruption on Crash
**What goes wrong:** Process crashes mid-write, leaving truncated or malformed state file
**Why it happens:** Direct file writes aren't atomic
**How to avoid:** Use `conf` for user prefs (atomic by default) or write-rename pattern for STATE.md
**Warning signs:** Partial JSON, truncated YAML frontmatter, encoding issues

### Pitfall 2: State Drift Without Detection
**What goes wrong:** User manually edits state file, ARIOS overwrites their changes
**Why it happens:** No mechanism to detect external modifications
**How to avoid:** Store checksum in state, validate on load, ask user on conflict
**Warning signs:** User reports "lost changes", state reverting unexpectedly

### Pitfall 3: Negative Decisions Lost
**What goes wrong:** ARIOS re-suggests ideas user already rejected
**Why it happens:** Only tracking positive decisions, not rejections
**How to avoid:** Per CONTEXT.md, explicitly track negative decisions in state
**Warning signs:** User frustration at re-explaining "I already said no to that"

### Pitfall 4: Overly Verbose Resume Display
**What goes wrong:** Resume screen shows walls of text, user skips reading it
**Why it happens:** Trying to show "everything" for context
**How to avoid:** Per CONTEXT.md, use mini table + brief text, not verbose paragraphs
**Warning signs:** User complaints about long status output

### Pitfall 5: Conflating Fresh Start with Resume
**What goes wrong:** Same behavior whether user has existing state or starting fresh
**Why it happens:** Not checking for existing state on entry
**How to avoid:** Per CONTEXT.md, `/arios` detects resume vs fresh start and adapts
**Warning signs:** Confused new users seeing "resume" prompts, returning users not getting context

## Code Examples

Verified patterns from official sources:

### Loading Project State with Conflict Detection
```typescript
// Source: gray-matter docs + ARIOS handoff.ts pattern
import matter from 'gray-matter';
import { createHash } from 'crypto';
import fs from 'fs-extra';

interface ProjectState {
  frontmatter: {
    version: string;
    phase: number;
    planIndex: number;
    status: string;
    lastActivity: string;
    checksum: string;
  };
  body: string;
}

async function loadProjectState(statePath: string): Promise<{
  state: ProjectState | null;
  conflict: boolean;
  expectedChecksum?: string;
  actualChecksum?: string;
}> {
  try {
    const content = await fs.readFile(statePath, 'utf-8');
    const parsed = matter(content);
    const state: ProjectState = {
      frontmatter: parsed.data as ProjectState['frontmatter'],
      body: parsed.content.trim()
    };

    // Calculate current checksum
    const actualChecksum = calculateChecksum(state.frontmatter);
    const storedChecksum = state.frontmatter.checksum;

    if (storedChecksum && storedChecksum !== actualChecksum) {
      return {
        state,
        conflict: true,
        expectedChecksum: storedChecksum,
        actualChecksum
      };
    }

    return { state, conflict: false };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { state: null, conflict: false };
    }
    throw err;
  }
}

function calculateChecksum(data: object): string {
  const { checksum, lastActivity, ...meaningful } = data;
  return createHash('md5')
    .update(JSON.stringify(meaningful))
    .digest('hex')
    .slice(0, 8);
}
```

### Saving Project State Atomically
```typescript
// Source: gray-matter docs + fs-extra best practices
import matter from 'gray-matter';
import fs from 'fs-extra';
import path from 'node:path';

async function saveProjectState(
  statePath: string,
  state: ProjectState
): Promise<void> {
  // Update checksum and timestamp
  const checksum = calculateChecksum(state.frontmatter);
  const updatedFrontmatter = {
    ...state.frontmatter,
    checksum,
    lastActivity: new Date().toISOString().split('T')[0]
  };

  const content = matter.stringify(state.body, updatedFrontmatter);

  // Ensure directory exists
  await fs.ensureDir(path.dirname(statePath));

  // Write atomically (write to temp, then rename)
  const tempPath = `${statePath}.tmp`;
  await fs.writeFile(tempPath, content, 'utf-8');
  await fs.rename(tempPath, statePath);
}
```

### User Preferences with Conf
```typescript
// Source: sindresorhus/conf GitHub README
import Conf from 'conf';

interface UserPrefs {
  language: string;
  verbosity: 'minimal' | 'normal' | 'verbose';
  showHints: boolean;
}

const userPrefs = new Conf<UserPrefs>({
  projectName: 'arios',
  schema: {
    language: {
      type: 'string',
      default: 'en'
    },
    verbosity: {
      type: 'string',
      enum: ['minimal', 'normal', 'verbose'],
      default: 'normal'
    },
    showHints: {
      type: 'boolean',
      default: true
    }
  }
});

// Usage
function getUserPreference<K extends keyof UserPrefs>(key: K): UserPrefs[K] {
  return userPrefs.get(key);
}

function setUserPreference<K extends keyof UserPrefs>(
  key: K,
  value: UserPrefs[K]
): void {
  userPrefs.set(key, value);
}
```

### Status Display Format
```typescript
// Source: CONTEXT.md decision - mini table + brief text
function formatStatusDisplay(state: ProjectState): string {
  const { phase, planIndex, status, lastActivity } = state.frontmatter;

  // Mini table format per CONTEXT.md
  const table = `
| Phase | Plan | Status | Last Active |
|-------|------|--------|-------------|
| ${phase} | ${planIndex} | ${status} | ${lastActivity} |
`.trim();

  // Brief suggestion, not assertive per CONTEXT.md
  const suggestion = status === 'in-progress'
    ? `Continue with Phase ${phase}, or explore other options?`
    : `Phase ${phase} complete. Ready to move forward?`;

  return `${table}\n\n${suggestion}`;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| configstore | conf | 2020+ | conf is the modern successor, same author |
| ~/.config everywhere | XDG_STATE_HOME | XDG spec 0.8 | Proper separation of config vs state vs cache |
| JSON config files | YAML/frontmatter + JSON | Ongoing | Human-readable state files gaining popularity |
| Timestamp-based conflict | Content hash conflict | Best practice | More reliable, ignores irrelevant metadata changes |

**Deprecated/outdated:**
- configstore: Still works but author recommends conf for new projects
- Manual platform detection: Use conf or env-paths instead
- Direct fs.writeFile for state: Use atomic write pattern or conf

## Open Questions

Things that couldn't be fully resolved:

1. **File watching for real-time sync**
   - What we know: chokidar v5 is the standard, works with Node.js 20+
   - What's unclear: Whether ARIOS needs real-time sync or load-on-demand is sufficient
   - Recommendation: Start with load-on-demand (simpler), add watching only if needed

2. **Recovery command implementation**
   - What we know: CONTEXT.md mentions dedicated recovery command, deferred decision
   - What's unclear: Whether to include `/arios:recover` in this phase or later
   - Recommendation: Plan for it but mark as stretch goal

3. **State schema versioning**
   - What we know: conf has migration support for user prefs
   - What's unclear: Best approach for STATE.md schema migrations
   - Recommendation: Include version field in frontmatter, add migration logic when needed

## Sources

### Primary (HIGH confidence)
- [sindresorhus/conf](https://github.com/sindresorhus/conf) - Full API documentation, configuration options, migration support
- [jonschlinkert/gray-matter](https://github.com/jonschlinkert/gray-matter) - YAML frontmatter parsing, battle-tested in 30M+ repos
- [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir/latest/) - Standard for state/config/cache locations

### Secondary (MEDIUM confidence)
- [lirantal/nodejs-cli-apps-best-practices](https://github.com/lirantal/nodejs-cli-apps-best-practices) - Stateful experiences, XDG compliance guidance
- [paulmillr/chokidar](https://github.com/paulmillr/chokidar) - File watching API and best practices
- [sindresorhus/env-paths](https://github.com/sindresorhus/env-paths) - OS-appropriate path generation

### Tertiary (LOW confidence)
- WebSearch results for CLI state recovery patterns - General checkpoint/resume concepts
- WebSearch results for YAML vs JSON - Performance considerations (verify before critical decisions)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - conf and gray-matter are established, well-documented libraries
- Architecture: HIGH - Patterns align with existing ARIOS code and CONTEXT.md decisions
- Pitfalls: MEDIUM - Based on best practices docs and common CLI development issues

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - stable domain, mature libraries)
