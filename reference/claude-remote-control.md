# Claude Remote Control: Terminal Streaming Setup

How to let Claude (API) control Claude Code (CLI) through a browser-accessible terminal.

## Overview

This setup creates a feedback loop where:
1. Claude (API instance) sends commands via `tmux send-keys`
2. User sees execution in browser via `ttyd`
3. Claude captures output via `tmux capture-pane`

```
┌─────────────┐     tmux send-keys      ┌─────────────┐
│   Claude    │ ──────────────────────▶ │    tmux     │
│   (API)     │                         │   session   │
│             │ ◀────────────────────── │             │
└─────────────┘   tmux capture-pane     └──────┬──────┘
                                               │
                                               │ ttyd (WebSocket)
                                               ▼
                                        ┌─────────────┐
                                        │   Browser   │
                                        │ localhost:  │
                                        │    7681     │
                                        └─────────────┘
```

## ARIOS E2E Test Environment

We have a dedicated isolated test environment set up:

```
/Users/j.franke/Projects/
├── Arios_v2/                       # Main development repo
│   └── tests/e2e/scripts/
│       └── claude-control.sh       # Test automation script
│
└── arios_v2_test/                  # Isolated test environment
    ├── .claude/
    │   ├── commands/arios/         # ARIOS slash commands installed
    │   │   ├── arios.md
    │   │   ├── status.md
    │   │   ├── execute.md
    │   │   └── ...
    │   └── agents/                 # Subagent prompts
    ├── .planning/
    │   ├── STATE.md                # Test state with YAML frontmatter
    │   └── ROADMAP.md              # Test roadmap
    └── package.json
```

**Why separate folder?**
- Claude Code walks up directory tree for CLAUDE.md
- Isolated environment = no interference from main project
- Can reset/recreate test state anytime
- Realistic user environment

### Quick Start

```bash
# From Arios_v2 repo:
./tests/e2e/scripts/claude-control.sh setup
# Open http://localhost:7681

# Run tests
./tests/e2e/scripts/claude-control.sh test-status
./tests/e2e/scripts/claude-control.sh test-all

# Cleanup
./tests/e2e/scripts/claude-control.sh cleanup
```

### Reset Test Environment

```bash
# Recreate test state
rm -rf /Users/j.franke/Projects/arios_v2_test/.planning/*

# Copy fresh templates
cp -r packages/arios-cli/templates/.claude/commands/arios \
      /Users/j.franke/Projects/arios_v2_test/.claude/commands/
```

## Prerequisites

```bash
# Install ttyd (terminal sharing)
brew install ttyd

# tmux is usually pre-installed on macOS
which tmux || brew install tmux
```

## Manual Setup

### 1. Create tmux session

```bash
# Create a named tmux session in test project
tmux new-session -d -s arios-e2e -c /Users/j.franke/Projects/arios_v2_test
```

### 2. Start ttyd pointing to tmux

```bash
# -W = writable (allows input from browser)
# -p = port
ttyd -W -p 7681 tmux attach-session -t arios-e2e &
```

### 3. Open browser

Navigate to: **http://localhost:7681**

You now see the terminal in your browser.

## Send Keys Reference

### Basic Commands

```bash
# Send text command
tmux send-keys -t arios-e2e 'your-command-here' Enter

# Just press Enter
tmux send-keys -t arios-e2e Enter
```

### Arrow Keys & Navigation

```bash
# Arrow keys
tmux send-keys -t arios-e2e Up
tmux send-keys -t arios-e2e Down
tmux send-keys -t arios-e2e Left
tmux send-keys -t arios-e2e Right

# Page navigation
tmux send-keys -t arios-e2e PageUp
tmux send-keys -t arios-e2e PageDown
tmux send-keys -t arios-e2e Home
tmux send-keys -t arios-e2e End
```

### Modifier Keys

```bash
# Ctrl combinations
tmux send-keys -t arios-e2e C-c      # Ctrl+C (interrupt)
tmux send-keys -t arios-e2e C-d      # Ctrl+D (EOF/submit in Claude Code)
tmux send-keys -t arios-e2e C-z      # Ctrl+Z (suspend)
tmux send-keys -t arios-e2e C-l      # Ctrl+L (clear screen)
tmux send-keys -t arios-e2e C-a      # Ctrl+A (start of line)
tmux send-keys -t arios-e2e C-e      # Ctrl+E (end of line)

# Alt combinations
tmux send-keys -t arios-e2e M-x      # Alt+X
tmux send-keys -t arios-e2e M-b      # Alt+B (word back)
tmux send-keys -t arios-e2e M-f      # Alt+F (word forward)

# Shift combinations
tmux send-keys -t arios-e2e S-Tab    # Shift+Tab
tmux send-keys -t arios-e2e S-Up     # Shift+Up

# Ctrl+Arrow combinations
tmux send-keys -t arios-e2e C-Up
tmux send-keys -t arios-e2e C-Down
tmux send-keys -t arios-e2e C-Left   # Word left
tmux send-keys -t arios-e2e C-Right  # Word right
```

### Special Keys

```bash
# Common special keys
tmux send-keys -t arios-e2e Escape
tmux send-keys -t arios-e2e Tab
tmux send-keys -t arios-e2e BSpace   # Backspace
tmux send-keys -t arios-e2e DC       # Delete
tmux send-keys -t arios-e2e Space

# Function keys
tmux send-keys -t arios-e2e F1
tmux send-keys -t arios-e2e F2
# ... F3-F12
```

### Claude Code Specific Patterns

```bash
# Navigate menu (e.g., Trust Dialog)
tmux send-keys -t arios-e2e Down     # Next option
tmux send-keys -t arios-e2e Up       # Previous option
tmux send-keys -t arios-e2e Enter    # Select

# Cancel dialog
tmux send-keys -t arios-e2e Escape

# Autocomplete
tmux send-keys -t arios-e2e Tab      # Accept suggestion
tmux send-keys -t arios-e2e Escape   # Dismiss

# Multiline input
tmux send-keys -t arios-e2e 'first line'
tmux send-keys -t arios-e2e Enter
tmux send-keys -t arios-e2e 'second line'
tmux send-keys -t arios-e2e C-d      # Submit (Ctrl+D)

# Interrupt running command
tmux send-keys -t arios-e2e Escape   # Or C-c

# Exit Claude Code
tmux send-keys -t arios-e2e '/exit' Enter
```

## Capture Output

```bash
# Current visible pane
tmux capture-pane -t arios-e2e -p

# With scrollback history (last 100 lines)
tmux capture-pane -t arios-e2e -p -S -100

# Full history
tmux capture-pane -t arios-e2e -p -S -1000 -E 1000

# Tail last N lines
tmux capture-pane -t arios-e2e -p | tail -20

# Search for pattern
tmux capture-pane -t arios-e2e -p | grep -A 10 "Phase"
```

## Example: Full E2E Test Flow

```bash
#!/bin/bash
SESSION="arios-e2e"
TEST_DIR="/Users/j.franke/Projects/arios_v2_test"

# 1. Setup
tmux kill-session -t $SESSION 2>/dev/null
tmux new-session -d -s $SESSION -c $TEST_DIR
ttyd -W -p 7681 tmux attach-session -t $SESSION &
sleep 2

# 2. Start Claude Code
tmux send-keys -t $SESSION 'claude' Enter
sleep 3

# 3. Handle Trust Dialog (if appears)
# Press Enter to confirm "Yes, proceed"
tmux send-keys -t $SESSION Enter
sleep 3

# 4. Run slash command
tmux send-keys -t $SESSION '/arios:status' Enter
sleep 20

# 5. Capture and verify output
OUTPUT=$(tmux capture-pane -t $SESSION -p)
if echo "$OUTPUT" | grep -q "Phase"; then
    echo "✓ PASS: Status shows phase info"
else
    echo "✗ FAIL: No phase info found"
fi

# 6. Test navigation
tmux send-keys -t $SESSION '/arios:help' Enter
sleep 10

# 7. Exit Claude Code
tmux send-keys -t $SESSION '/exit' Enter
sleep 2

# 8. Cleanup
pkill -f "ttyd.*7681"
tmux kill-session -t $SESSION
echo "✓ Test complete"
```

## Gotchas & Tips

### 1. Quote handling
Avoid complex quotes and special characters:
```bash
# Bad - quotes get mangled
tmux send-keys -t arios-e2e 'echo "Hello World"' Enter

# Better - simple strings
tmux send-keys -t arios-e2e 'echo Hello' Enter
```

### 2. TUI applications (like Claude Code)
Claude Code redraws the screen. `capture-pane` may miss output:
- Wait longer (`sleep 15-30`)
- Capture multiple times
- Look for specific markers in output

### 3. Command timing
Always add sleeps between commands:
```bash
tmux send-keys -t arios-e2e 'command1' Enter
sleep 2  # Wait for execution
tmux send-keys -t arios-e2e 'command2' Enter
```

### 4. Session persistence
tmux session persists even if ttyd dies:
```bash
# Reattach ttyd to existing session
ttyd -W -p 7681 tmux attach-session -t arios-e2e &
```

### 5. Debugging
Watch what's happening:
```bash
# In another terminal, attach to same session
tmux attach-session -t arios-e2e

# Or use ttyd in browser
open http://localhost:7681
```

## Use Cases

1. **E2E Testing**: Automate slash command testing
2. **Demo Recording**: Show Claude Code in action
3. **Remote Pair Programming**: Share terminal with team
4. **Debugging**: Watch Claude Code behavior in real-time
5. **CI/CD**: Automated testing in pipelines (headless)

## Cleanup

```bash
# Stop ttyd
pkill -f ttyd

# Kill specific session
tmux kill-session -t arios-e2e

# Or kill all tmux
tmux kill-server
```

## Security Note

ttyd with `-W` flag allows anyone with browser access to control your terminal. For local testing only. For remote access, use:
- SSH tunneling
- Authentication (`ttyd -c user:pass`)
- Firewall rules

---

*Created: 2026-01-24*
*Tested with: ttyd 1.7.7, tmux 3.x, Claude Code 2.1.19*
*E2E Test: Successfully tested /arios:status in isolated environment*
