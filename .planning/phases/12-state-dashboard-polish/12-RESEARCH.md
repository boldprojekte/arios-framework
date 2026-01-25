# Phase 12: State & Dashboard Polish - Research

**Researched:** 2026-01-25
**Domain:** Session resume, state validation, dashboard interactivity (vanilla JS)
**Confidence:** HIGH

## Summary

Phase 12 focuses on three interconnected areas: (1) reliable session resume so users can return days later and continue exactly where they left off, (2) state validation before `/execute` to detect drift and file/state mismatches, and (3) dashboard polish with a slide-out detail panel supporting task notes. The research confirms that ARIOS already has solid foundations in place from Phases 4 and 6 that can be extended rather than replaced.

The existing `gray-matter` + checksum approach from Phase 4 handles state persistence well. The dashboard's SSE pipeline from Phase 6 provides reliable live updates. The key additions are: (a) action-first resume UX with auto-continue for interrupted tasks, (b) drift detection comparing state claims against actual files, (c) a CSS transform-based slide-out panel replacing the current modal, and (d) notes written to state files that Claude reads on next action.

**Primary recommendation:** Extend existing state utilities with drift detection that compares STATE.md claims against file system reality, convert the modal to a slide-out panel using CSS transforms for performance, and add a notes field to task state that persists to the relevant PLAN.md or STATE.md file.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| gray-matter | ^4.0.3 | YAML frontmatter parsing | Already in ARIOS, handles state file read/write |
| chokidar | ^5.x | File watching | Already in dashboard, reliable cross-platform watching |
| node:crypto | built-in | Checksum generation | Already used for MD5 checksums in state.ts |
| node:fs/promises | built-in | File operations | Standard Node.js async file access |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs-extra | ^11.2.0 | Enhanced file ops | Already in ARIOS, atomic writes via write-rename pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom slide panel | Split.js | Library adds dependency; CSS transforms are sufficient for this use case |
| MD5 checksum | SHA-256 | SHA-256 is more secure but MD5 is sufficient for drift detection (not security) |
| File watching | Polling | Polling less efficient; chokidar already works well |

**Installation:**
```bash
# No new dependencies required - everything is already installed
```

## Architecture Patterns

### Recommended Project Structure
```
.planning/
├── STATE.md                      # Project-Mode state (frontmatter + decisions)
├── config.json                   # Mode setting, workflow flags
├── features/
│   └── feature-{name}/
│       ├── STATE.md              # Feature-Mode state (same format, no phases)
│       └── XX-PLAN.md            # Feature plans
├── archive/
│   └── feature-{name}/           # Archived features on completion
└── phases/
    └── XX-name/
        ├── XX-NN-PLAN.md         # Plan files with optional notes field
        └── XX-NN-SUMMARY.md      # Completion summaries
```

### Pattern 1: Action-First Resume UX
**What:** Show quick action buttons immediately, context available on demand
**When to use:** Every session resume (when STATE.md exists with progress)
**Example:**
```markdown
## Resume Pattern (what Claude displays)

Welcome Back to ARIOS

Phase 11 (Smart Entry & Mode Detection) - Plan 7 complete

[Continue to Phase 12] [View Status] [Other]
```

**Key principle:** Don't dump context. User knows their project - show actions, not history.

### Pattern 2: Auto-Continue Interrupted Tasks
**What:** Agent verifies what was completed before proceeding, no user prompt needed
**When to use:** When resuming a task that was interrupted mid-execution
**Example:**
```typescript
// Agent behavior (not TypeScript code - this describes Claude's actions)
// 1. Read last task's PLAN.md
// 2. Check which actions have corresponding file changes
// 3. Continue from first incomplete action
// 4. No "restart vs skip" prompt - just figure out state and continue
```

### Pattern 3: Drift Detection Before Execute
**What:** Validate state claims against file system reality before `/execute`
**When to use:** Every `/execute` invocation (not on resume)
**Example:**
```typescript
// Source: CONTEXT.md decision + existing state.ts pattern
interface DriftCheck {
  drifted: boolean;
  type: 'file_changes' | 'state_mismatch';
  details: string[];
  recommendation: 'auto_fix' | 'prompt_user';
}

// Drift types:
// 1. file_changes: Files modified outside ARIOS since last activity
// 2. state_mismatch: State claims progress that files don't show
//    (e.g., state says task X complete, but output files don't exist)

// Auto-fix silently: metadata (timestamps, checksums)
// Prompt user: structural issues (missing files, wrong state)
```

### Pattern 4: CSS Transform Slide-Out Panel
**What:** Panel slides in from right, main view compresses (doesn't overlay)
**When to use:** When user clicks a task in dashboard
**Example:**
```css
/* Source: CodyHouse CSS Slide-in Panel pattern */
.detail-panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 400px;
  background: var(--bg-secondary);
  transform: translate3d(100%, 0, 0);
  transition: transform var(--transition-normal);
  z-index: 50;
}

.detail-panel.open {
  transform: translate3d(0, 0, 0);
}

/* Main content compresses instead of overlaying */
.main-content {
  transition: margin-right var(--transition-normal);
}

.main-content.panel-open {
  margin-right: 400px;
}
```

### Pattern 5: Resizable Panel via Drag Handle
**What:** User can drag divider to resize panel width
**When to use:** Panel is open and user wants to adjust
**Example:**
```javascript
// Source: MFPanels/Split.js pattern adapted for vanilla JS
const resizer = document.querySelector('.panel-resizer');
let isResizing = false;
let startX, startWidth;

resizer.addEventListener('mousedown', (e) => {
  isResizing = true;
  startX = e.clientX;
  startWidth = panel.offsetWidth;
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
});

function handleMouseMove(e) {
  if (!isResizing) return;
  const delta = startX - e.clientX;
  const newWidth = Math.max(300, Math.min(800, startWidth + delta));
  panel.style.width = `${newWidth}px`;
  mainContent.style.marginRight = `${newWidth}px`;
}

function handleMouseUp() {
  isResizing = false;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
}
```

### Pattern 6: Notes in State Files
**What:** User adds notes via dashboard, Claude reads on next action
**When to use:** User wants to communicate context to Claude
**Example:**
```yaml
# In PLAN.md frontmatter or STATE.md body
---
phase: "12-state-dashboard-polish"
plan: 1
wave: 1
notes:
  - timestamp: "2026-01-25T14:30:00Z"
    content: "Skip the animation for now, focus on functionality"
  - timestamp: "2026-01-25T15:00:00Z"
    content: "User tested and confirmed resize works"
---
```

### Anti-Patterns to Avoid
- **Verbose resume context:** Don't show walls of text - action buttons first
- **Auto-fixing structural issues:** Per CONTEXT.md, always ask user for non-metadata problems
- **Modal overlay:** Per CONTEXT.md, use slide-out that compresses main view
- **Width persistence across sessions:** Per CONTEXT.md, only persist while panel open
- **Streaming logs to dashboard:** Per CONTEXT.md, status updates only - execution output stays in CLI

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom regex | gray-matter | Already in ARIOS, handles edge cases |
| File watching | fs.watch | chokidar | Already in dashboard, handles platform quirks |
| Atomic file writes | Direct fs.writeFile | Write-rename pattern (already in state.ts) | Prevents corruption on crash |
| Checksum calculation | Custom hash | node:crypto createHash | Standard, reliable, already used |
| SSE reconnection | Custom retry logic | EventSource built-in | Browser handles reconnection automatically |

**Key insight:** ARIOS Phases 4 and 6 already implemented the hard parts. This phase extends existing patterns rather than building new infrastructure.

## Common Pitfalls

### Pitfall 1: False Positive Drift Detection
**What goes wrong:** Flagging drift when timestamps changed but content didn't
**Why it happens:** Comparing file mtimes instead of content checksums
**How to avoid:** Calculate content checksum, compare to stored checksum, ignore metadata
**Warning signs:** User repeatedly told files drifted when they made no changes

### Pitfall 2: SSE Connection Drops Go Unnoticed
**What goes wrong:** Dashboard shows stale data without indicating disconnection
**Why it happens:** No visual feedback when EventSource reconnects
**How to avoid:** Track connection state, show reconnecting indicator (already implemented in app.js)
**Warning signs:** Dashboard and CLI show different task states

### Pitfall 3: Panel Resize Causes Layout Reflow Storm
**What goes wrong:** Janky animation as user drags resize handle
**Why it happens:** Updating width causes layout recalculation every frame
**How to avoid:** Use CSS transforms where possible, debounce updates if needed
**Warning signs:** Visible lag when resizing, high CPU during drag

### Pitfall 4: Notes Lost on State Update
**What goes wrong:** Notes disappear when state is updated by execution
**Why it happens:** State save doesn't preserve notes field
**How to avoid:** Load existing notes before save, merge with any new notes
**Warning signs:** User-added notes vanish after task completion

### Pitfall 5: Feature-Mode State Overwrites Project-Mode State
**What goes wrong:** Switching modes corrupts existing state
**Why it happens:** Same STATE.md path used for both modes
**How to avoid:** Feature-Mode uses `.planning/features/feature-{name}/STATE.md`, Project-Mode uses `.planning/STATE.md`
**Warning signs:** Phase/plan numbers don't match after mode switch

## Code Examples

Verified patterns from existing codebase and official sources:

### Drift Detection Implementation
```typescript
// Source: Extending existing state.ts pattern
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import matter from 'gray-matter';

interface DriftResult {
  drifted: boolean;
  type: 'none' | 'file_changes' | 'state_mismatch';
  details: string[];
  autoFixable: boolean;
}

function detectDrift(statePath: string, planningDir: string): DriftResult {
  const content = readFileSync(statePath, 'utf-8');
  const { data: frontmatter } = matter(content);

  // Check 1: Checksum mismatch (existing pattern)
  const storedChecksum = frontmatter.checksum;
  const calculatedChecksum = calculateChecksum(frontmatter);

  if (storedChecksum !== calculatedChecksum) {
    return {
      drifted: true,
      type: 'file_changes',
      details: ['State file modified outside ARIOS'],
      autoFixable: true, // Just update checksum
    };
  }

  // Check 2: State claims vs file reality
  const currentPhase = frontmatter.phase;
  const currentPlan = frontmatter.planIndex;
  const status = frontmatter.status;

  if (status === 'complete' || status === 'in-progress') {
    // Verify claimed progress actually exists
    const summaryPath = `${planningDir}/phases/${currentPhase}-*/` +
      `${currentPhase}-${String(currentPlan).padStart(2, '0')}-SUMMARY.md`;

    // If state claims complete but SUMMARY.md missing, that's drift
    if (status === 'complete' && !existsSync(summaryPath)) {
      return {
        drifted: true,
        type: 'state_mismatch',
        details: [`State claims plan ${currentPlan} complete but SUMMARY.md missing`],
        autoFixable: false, // Need user decision
      };
    }
  }

  return { drifted: false, type: 'none', details: [], autoFixable: false };
}
```

### Slide-Out Panel CSS
```css
/* Source: CodyHouse pattern + CONTEXT.md decisions */
.detail-panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 400px;
  min-width: 300px;
  max-width: 800px;
  background-color: var(--bg-secondary);
  border-left: 1px solid var(--border);
  transform: translate3d(100%, 0, 0);
  transition: transform var(--transition-normal);
  z-index: 50;
  display: flex;
  flex-direction: column;
}

.detail-panel.open {
  transform: translate3d(0, 0, 0);
}

/* Resizer handle */
.panel-resizer {
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
  cursor: ew-resize;
  background: transparent;
}

.panel-resizer:hover {
  background: var(--accent);
}

/* Main content compression */
.main-content {
  transition: margin-right var(--transition-normal);
}

.main-content.panel-open {
  margin-right: 400px;
}
```

### Note Addition to State File
```typescript
// Source: Extending gray-matter stringify pattern
interface TaskNote {
  timestamp: string;
  content: string;
}

async function addNoteToTask(
  planPath: string,
  note: string
): Promise<void> {
  const content = await fs.readFile(planPath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);

  // Initialize or append to notes array
  const notes: TaskNote[] = frontmatter.notes || [];
  notes.push({
    timestamp: new Date().toISOString(),
    content: note,
  });

  // Update frontmatter with notes
  const updatedFrontmatter = { ...frontmatter, notes };
  const updatedContent = matter.stringify(body, updatedFrontmatter);

  // Atomic write
  const tempPath = `${planPath}.tmp`;
  await fs.writeFile(tempPath, updatedContent, 'utf-8');
  await fs.rename(tempPath, planPath);
}
```

### SSE Last-Event-ID for Reliability
```javascript
// Source: MDN Server-Sent Events + existing app.js
// Server side: Add event IDs for resumption
function broadcast(message, eventId) {
  const data = `id: ${eventId}\ndata: ${JSON.stringify(message)}\n\n`;
  for (const client of clients) {
    client.write(data);
  }
}

// Client side: EventSource handles Last-Event-ID automatically
// On reconnect, browser sends Last-Event-ID header
// Server can resume from that point
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Modal dialogs for details | Slide-out panels | 2023+ | Better UX, maintains context |
| Polling for updates | SSE/WebSockets | Established | Lower latency, less overhead |
| Fixed-width panels | Resizable panels | Established | User control over layout |
| Session state lost on close | Persistent state files | Established | Seamless resume |

**Deprecated/outdated:**
- Position-based animations (left/right): Use CSS transforms for 60fps
- Manual SSE reconnection: EventSource handles this automatically
- localStorage for session state: File-based state is more reliable and inspectable

## Open Questions

Things that couldn't be fully resolved:

1. **Multiple active features UX**
   - What we know: CONTEXT.md says multiple features can be active, user switches between them
   - What's unclear: How exactly does switching work? Command? Dashboard UI?
   - Recommendation: Implement `/arios:switch-feature {name}` command, defer dashboard UI to later

2. **Note visibility to Claude**
   - What we know: Notes written to state file, Claude reads on next action
   - What's unclear: Should notes appear in PLAN.md frontmatter or separate notes file?
   - Recommendation: Add to PLAN.md frontmatter (keeps related data together)

3. **Verification of v1.0 gaps**
   - What we know: CORE-03, AGENT-04, UX-01 marked "Complete" in REQUIREMENTS.md
   - What's unclear: What specific verification is needed to "close" these gaps in Phase 12?
   - Recommendation: Add explicit verification tasks that exercise each requirement end-to-end

## Sources

### Primary (HIGH confidence)
- Existing ARIOS codebase: `packages/arios-cli/src/utils/state.ts`, `packages/arios-dashboard/src/`
- gray-matter npm package: Already verified working in ARIOS
- node:crypto documentation: Built-in Node.js module
- MDN Server-Sent Events: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events

### Secondary (MEDIUM confidence)
- CodyHouse CSS Slide-in Panel: https://codyhouse.co/gem/css-slide-in-panel/
- MFPanels resizable panels: https://methodfish.com/Projects/MFPanels/docs/README
- W3Schools Collapsed Sidepanel: https://www.w3schools.com/howto/howto_js_collapse_sidepanel.asp
- Node.js CLI Apps Best Practices: https://github.com/lirantal/nodejs-cli-apps-best-practices

### Tertiary (LOW confidence)
- WebSearch results for SSE reliability patterns (verified against MDN)
- WebSearch results for resizable panel implementations (verified against existing dashboard code)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use in ARIOS
- Architecture: HIGH - Patterns extend existing code, decisions locked in CONTEXT.md
- Pitfalls: HIGH - Based on existing codebase analysis and established patterns

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable domain, no new libraries)
