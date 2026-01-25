# Phase 6: Task Visibility - Research

**Researched:** 2026-01-25
**Domain:** Real-time HTML dashboard with file watching and task visualization
**Confidence:** HIGH

## Summary

This phase builds a read-only HTML dashboard that provides real-time visibility into ARIOS task execution. The core architecture is a Node.js server that watches `.planning` directory files using Chokidar, broadcasts changes to the browser via Server-Sent Events (SSE), and renders task data in a modern Linear-inspired UI with switchable Kanban/List views.

The dashboard parses existing `.planning` files (PLAN.md, SUMMARY.md, STATE.md, ROADMAP.md) rather than requiring a new task system. File watching with Chokidar v5 provides reliable cross-platform change detection, and SSE delivers one-way updates to the browser without the complexity of WebSockets. The UI uses vanilla JavaScript with CSS custom properties for theming, keeping dependencies minimal while achieving a polished look.

**Primary recommendation:** Build a lightweight Node.js HTTP server with Chokidar file watching and SSE streaming to a single-page HTML dashboard that parses existing `.planning` markdown files.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| chokidar | ^5.0.0 | File system watching | ESM-only, ~30M repos, reliable cross-platform events, automatic reconnection |
| marked | ^16.3.0 | Markdown to HTML | Fast, lightweight, browser + Node support, no plugins needed |
| leader-line | ^1.2.4 | Dependency line rendering | SVG-based, customizable path types, works with any HTML elements |
| node:http | built-in | HTTP server | Zero dependencies, sufficient for serving static HTML + SSE |
| node:fs | built-in | File reading | Core Node.js, used with chokidar for content reads |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| gray-matter | ^4.0.3 | YAML frontmatter parsing | Already in project, parse PLAN.md frontmatter for task metadata |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| chokidar | node:fs.watch | Native but unreliable events, no recursive watching on some platforms |
| SSE | WebSockets | WebSockets add bidirectional complexity not needed for read-only dashboard |
| leader-line | Custom SVG | Hand-rolling SVG path calculations is error-prone for connection points |
| marked | remark | Remark is more powerful but heavier; marked is sufficient for rendering |

**Installation:**
```bash
npm install chokidar@^5 marked@^16 leader-line@^1.2.4
```

## Architecture Patterns

### Recommended Project Structure
```
packages/arios-dashboard/
  src/
    server/
      index.ts           # HTTP server + SSE endpoint
      watcher.ts         # Chokidar file watching
      parser.ts          # Markdown file parsing (PLAN, SUMMARY, STATE, ROADMAP)
    client/
      index.html         # Single-page dashboard
      styles.css         # Linear-inspired dark theme
      app.js             # Dashboard logic, EventSource, view switching
      kanban.js          # Kanban board rendering
      list.js            # List view rendering
      roadmap.js         # ROADMAP.md visualization
      lines.js           # Leader-line dependency connections
    types/
      dashboard.ts       # Type definitions
```

### Pattern 1: File-Watch-to-SSE Pipeline
**What:** Chokidar watches `.planning` directory, emits events, server reads changed files, parses content, broadcasts via SSE to all connected clients.
**When to use:** Real-time updates from file system to browser without polling.
**Example:**
```typescript
// Source: https://github.com/paulmillr/chokidar README
import chokidar from 'chokidar';
import { createServer } from 'node:http';

const clients: Set<ServerResponse> = new Set();

// File watcher
const watcher = chokidar.watch('.planning', {
  ignored: /node_modules/,
  persistent: true,
  ignoreInitial: false,
  awaitWriteFinish: {
    stabilityThreshold: 300,
    pollInterval: 100
  }
});

watcher.on('all', (event, path) => {
  const data = parseFile(path);
  broadcast({ event, path, data });
});

// SSE broadcaster
function broadcast(payload: unknown) {
  const message = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    client.write(message);
  }
}
```

### Pattern 2: Server-Sent Events Endpoint
**What:** HTTP endpoint that keeps connection open and streams events in `text/event-stream` format.
**When to use:** One-way server-to-client real-time updates.
**Example:**
```typescript
// Source: MDN Using server-sent events
import { createServer } from 'node:http';

createServer((req, res) => {
  if (req.url === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    clients.add(res);
    req.on('close', () => clients.delete(res));

    // Send initial state
    res.write(`data: ${JSON.stringify(getFullState())}\n\n`);
  } else {
    // Serve static files
    serveStatic(req, res);
  }
}).listen(3456);
```

### Pattern 3: Client EventSource with Auto-Reconnect
**What:** Browser EventSource API connects to SSE endpoint with built-in reconnection.
**When to use:** Receiving real-time updates in browser.
**Example:**
```javascript
// Source: MDN EventSource documentation
const eventSource = new EventSource('/events');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateDashboard(data);
};

eventSource.onerror = (err) => {
  console.error('SSE connection error:', err);
  updateConnectionStatus('disconnected');
  // EventSource auto-reconnects
};

eventSource.onopen = () => {
  updateConnectionStatus('connected');
};
```

### Pattern 4: CSS Custom Properties for Theming
**What:** CSS variables define color palette, switched via data attribute for themes.
**When to use:** Dark theme dashboard with consistent colors.
**Example:**
```css
/* Source: https://design.dev/guides/dark-mode-css/ */
:root {
  /* Linear-inspired dark palette */
  --bg-primary: #0d0d0d;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #262626;
  --text-primary: #fafafa;
  --text-secondary: #a3a3a3;
  --accent: #7c5cff;
  --accent-dim: rgba(124, 92, 255, 0.1);
  --border: #333333;
  --success: #22c55e;
  --warning: #eab308;
  --error: #ef4444;
}

/* Subtle update highlight animation */
@keyframes highlight-fade {
  0% { background-color: var(--accent-dim); }
  100% { background-color: transparent; }
}

.updated {
  animation: highlight-fade 1.5s ease-out;
}
```

### Anti-Patterns to Avoid
- **Polling instead of file watching:** Creates unnecessary CPU load and delayed updates
- **WebSocket for one-way data:** SSE is simpler and auto-reconnects; WebSocket adds unneeded complexity
- **Inline styles for theming:** Use CSS custom properties for maintainability
- **Manual refresh button:** Defeats purpose of real-time; rely on SSE
- **Reading files in client:** All file parsing happens server-side, client receives parsed JSON

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File watching | fs.watch wrapper | chokidar | Cross-platform issues, duplicate events, no recursive on some OS |
| Markdown parsing | Regex parsing | marked | Edge cases in markdown spec, GFM support, code blocks |
| Connecting lines | Manual SVG paths | leader-line | Attachment points, responsive updates, path types |
| YAML frontmatter | Regex extraction | gray-matter | Already in project, handles edge cases |
| SSE reconnection | Custom reconnect logic | EventSource API | Browser handles reconnection automatically |

**Key insight:** The dashboard's value is in data presentation and UX, not reinventing established browser/Node.js primitives.

## Common Pitfalls

### Pitfall 1: File Change Spam
**What goes wrong:** Rapid file changes during execution flood SSE with events.
**Why it happens:** Multiple PLAN.md, SUMMARY.md files update during wave execution.
**How to avoid:** Use chokidar's `awaitWriteFinish` option and debounce broadcasts (100-300ms).
**Warning signs:** Browser becomes sluggish, EventSource queue backs up.

### Pitfall 2: Leader-Line Position Drift
**What goes wrong:** Connecting lines don't update when elements move (scroll, expand).
**Why it happens:** LeaderLine calculates positions at creation time.
**How to avoid:** Call `line.position()` after any layout change; use ResizeObserver.
**Warning signs:** Lines point to wrong positions after scrolling or expanding cards.

### Pitfall 3: SSE Connection Limit
**What goes wrong:** Multiple browser tabs hit 6-connection limit per domain.
**Why it happens:** HTTP/1.1 limits concurrent connections; each tab opens SSE.
**How to avoid:** Use unique port (3456), or document single-tab limitation. HTTP/2 would solve but adds complexity.
**Warning signs:** Additional tabs fail to connect or existing connections drop.

### Pitfall 4: State Initialization Race
**What goes wrong:** Dashboard renders before initial file scan completes.
**Why it happens:** chokidar's `ready` event fires after initial scan; client connects before.
**How to avoid:** Send full state snapshot on SSE connection, not just incremental updates.
**Warning signs:** Dashboard shows partial or empty state on first load.

### Pitfall 5: Cross-Origin Issues in Development
**What goes wrong:** Browser blocks EventSource connections.
**Why it happens:** Running HTML from file:// or different port than SSE server.
**How to avoid:** Serve HTML from same Node.js server that provides SSE endpoint.
**Warning signs:** CORS errors in browser console, SSE never connects.

## Code Examples

Verified patterns from official sources:

### Chokidar File Watcher Setup
```typescript
// Source: https://github.com/paulmillr/chokidar
import chokidar from 'chokidar';

const watcher = chokidar.watch('.planning', {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: false, // emit events for existing files on startup
  awaitWriteFinish: {
    stabilityThreshold: 300, // wait 300ms after last write
    pollInterval: 100
  },
  depth: 5 // phases/XX-name/PLAN.md is 3 levels deep
});

watcher
  .on('add', path => handleFile('add', path))
  .on('change', path => handleFile('change', path))
  .on('unlink', path => handleFile('unlink', path))
  .on('ready', () => console.log('Initial scan complete'))
  .on('error', error => console.error('Watcher error:', error));
```

### SSE Server Response
```typescript
// Source: MDN Server-sent events
function handleSSE(req: IncomingMessage, res: ServerResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // disable nginx buffering
  });

  // Keep-alive comment every 30s to prevent timeout
  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
    clients.delete(res);
  });

  clients.add(res);
}
```

### Marked Markdown Rendering
```typescript
// Source: https://marked.js.org/
import { marked } from 'marked';

// Configure for safe rendering
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true // Convert \n to <br>
});

function renderMarkdown(content: string): string {
  return marked.parse(content);
}
```

### Leader-Line Dependency Connections
```javascript
// Source: https://anseki.github.io/leader-line/
// Note: leader-line is browser-only, not Node.js

// Basic dependency line
const line = new LeaderLine(
  document.getElementById('task-05-01'),
  document.getElementById('task-05-02'),
  {
    color: '#7c5cff',
    size: 2,
    path: 'fluid',
    startSocket: 'right',
    endSocket: 'left',
    startPlug: 'disc',
    endPlug: 'arrow1'
  }
);

// Update position after scroll/resize
window.addEventListener('resize', () => {
  lines.forEach(line => line.position());
});
```

### HTML5 Drag-and-Drop (Read-Only Reference)
```javascript
// Note: Dashboard is read-only per CONTEXT.md, but including pattern for reference
// Source: MDN Drag and Drop API

// For visual drag feedback only (no state mutation)
card.setAttribute('draggable', 'false'); // Explicitly disable for read-only
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling files | File watching + SSE | ~2020 | Real-time updates without CPU waste |
| WebSocket for everything | SSE for one-way data | ~2022 | Simpler implementation, auto-reconnect |
| jQuery-based dashboards | Vanilla JS + CSS custom properties | ~2023 | No dependencies, better performance |
| Bootstrap dark mode | CSS custom properties with prefers-color-scheme | ~2024 | More control, smaller bundle |
| chokidar v3 (CommonJS) | chokidar v5 (ESM-only) | Nov 2025 | Matches project's ESM-only constraint |

**Deprecated/outdated:**
- fs.watch/fs.watchFile raw usage: Too unreliable, use chokidar
- chokidar v3/v4 with globs: v5 removed glob support, use simpler path watching
- Socket.io for dashboards: Overkill for one-way updates, SSE is sufficient

## Task Data Structure

The dashboard parses existing `.planning` files:

### PLAN.md Frontmatter (tasks)
```yaml
---
phase: 05-execution-flow
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [...]
autonomous: true
---
```

### STATE.md Frontmatter (position)
```yaml
---
version: "1.0.0"
phase: 5
planIndex: 10
totalPhases: 6
totalPlans: 10
status: "phase-complete"
lastActivity: "2026-01-25"
---
```

### SUMMARY.md (completed tasks)
```yaml
---
phase: 05-execution-flow
plan: 01
duration: 2min
completed: 2026-01-24
---
```

**Parsed data structure for dashboard:**
```typescript
type Task = {
  id: string;           // "05-01"
  phase: string;        // "05-execution-flow"
  plan: number;         // 1
  wave: number;         // 1
  dependsOn: string[];  // ["05-00"]
  status: 'pending' | 'in-progress' | 'complete';
  name?: string;        // From objective section
  summary?: string;     // From SUMMARY.md if exists
  duration?: string;    // From SUMMARY.md
  completedAt?: string; // From SUMMARY.md
};

type DashboardState = {
  tasks: Task[];
  phases: Phase[];
  currentPhase: number;
  currentPlan: number;
  roadmap: string;      // Raw ROADMAP.md for rendering
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
};
```

## Open Questions

Things that couldn't be fully resolved:

1. **Leader-line with view switching**
   - What we know: Lines need repositioning when switching Kanban/List views
   - What's unclear: Whether to destroy and recreate lines or just reposition
   - Recommendation: Recreate lines on view switch for simplicity; LeaderLine instances are lightweight

2. **Dashboard port selection**
   - What we know: Need unique port to avoid conflicts
   - What's unclear: Whether to use fixed port (3456) or dynamic assignment
   - Recommendation: Fixed port 3456 for predictability; document in help output

3. **Browser tab limitation**
   - What we know: HTTP/1.1 limits to ~6 SSE connections per domain
   - What's unclear: If users will open multiple dashboard tabs
   - Recommendation: Document single-tab recommendation; defer HTTP/2 upgrade unless needed

## Sources

### Primary (HIGH confidence)
- [paulmillr/chokidar GitHub](https://github.com/paulmillr/chokidar) - v5 ESM-only API, options, events
- [MDN Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) - EventSource API, SSE format, headers
- [marked.js.org](https://marked.js.org/) - Basic usage, browser/Node installation
- [anseki/leader-line GitHub](https://github.com/anseki/leader-line) - Constructor, path types, position()

### Secondary (MEDIUM confidence)
- [Linear design blog](https://linear.app/now/how-we-redesigned-the-linear-ui) - Design philosophy reference
- [design.dev Dark Mode CSS Guide](https://design.dev/guides/dark-mode-css/) - CSS custom properties patterns
- [npm-compare.com chokidar comparison](https://npm-compare.com/chokidar,fsevents,gaze,node-watch,watch) - Library comparison data

### Tertiary (LOW confidence)
- WebSearch results for Linear-style design - General trend info, not authoritative
- Medium articles on Kanban boards - Implementation patterns, not official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official GitHub/docs
- Architecture: HIGH - Patterns from MDN and official library documentation
- Pitfalls: MEDIUM - Based on common issues in documentation and GitHub issues
- UI design: MEDIUM - Linear-inspired is subjective; CSS patterns are verified

**Research date:** 2026-01-25
**Valid until:** ~60 days (stable domain, no rapidly changing libraries)
