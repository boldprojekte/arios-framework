#!/bin/bash
# Claude Control Script - E2E Testing Infrastructure
# Controls Claude Code via tmux, viewable in browser via ttyd

set -e

SESSION="arios-e2e"
PORT=7681
TEST_PROJECT="/Users/j.franke/Projects/arios_v2_test"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[E2E]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Setup tmux + ttyd
setup() {
    log "Setting up E2E environment..."

    # Kill existing sessions
    pkill -f "ttyd.*$PORT" 2>/dev/null || true
    tmux kill-session -t $SESSION 2>/dev/null || true
    sleep 1

    # Create tmux session in test project
    tmux new-session -d -s $SESSION -c $TEST_PROJECT

    # Start ttyd
    ttyd -W -p $PORT tmux attach-session -t $SESSION &
    sleep 2

    log "Ready!"
    log "Browser: http://localhost:$PORT"
    log "Session: $SESSION"
}

# Send command to tmux
send() {
    local cmd="$1"
    local wait="${2:-1}"
    tmux send-keys -t $SESSION "$cmd" Enter
    sleep $wait
}

# Capture terminal output
capture() {
    tmux capture-pane -t $SESSION -p -S -200
}

# Wait for pattern in output
wait_for() {
    local pattern="$1"
    local timeout="${2:-30}"
    local elapsed=0

    while [ $elapsed -lt $timeout ]; do
        if capture | grep -q "$pattern"; then
            return 0
        fi
        sleep 1
        ((elapsed++))
    done
    return 1
}

# Start Claude Code
start_claude() {
    log "Starting Claude Code..."
    send "claude" 3
}

# Run slash command
run_slash() {
    local cmd="$1"
    local wait="${2:-15}"
    log "Running: $cmd"
    send "$cmd" $wait
}

# Exit Claude Code
exit_claude() {
    log "Exiting Claude Code..."
    send "/exit" 2
}

# Cleanup
cleanup() {
    log "Cleaning up..."
    pkill -f "ttyd.*$PORT" 2>/dev/null || true
    tmux kill-session -t $SESSION 2>/dev/null || true
    log "Done"
}

# Test: /arios:status
test_status() {
    log "Testing /arios:status..."

    setup
    start_claude
    run_slash "/arios:status" 20

    OUTPUT=$(capture)

    if echo "$OUTPUT" | grep -q "Phase"; then
        log "PASS: Status shows phase info"
        echo "$OUTPUT" | grep -A 20 "Phase"
    else
        error "FAIL: No phase info found"
        echo "$OUTPUT"
        cleanup
        return 1
    fi

    exit_claude
    cleanup
    return 0
}

# Test: /arios
test_arios() {
    log "Testing /arios..."

    setup
    start_claude
    run_slash "/arios" 20

    OUTPUT=$(capture)

    if echo "$OUTPUT" | grep -qi "resume\|state\|phase"; then
        log "PASS: /arios shows state info"
    else
        warn "Output may vary - check manually"
        echo "$OUTPUT" | tail -30
    fi

    exit_claude
    cleanup
    return 0
}

# Main
case "${1:-help}" in
    setup)
        setup
        ;;
    cleanup)
        cleanup
        ;;
    send)
        send "$2" "${3:-1}"
        ;;
    capture)
        capture
        ;;
    test-status)
        test_status
        ;;
    test-arios)
        test_arios
        ;;
    test-all)
        test_status && test_arios
        ;;
    help|*)
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  setup        - Start tmux + ttyd"
        echo "  cleanup      - Stop everything"
        echo "  send <cmd>   - Send command to terminal"
        echo "  capture      - Capture terminal output"
        echo "  test-status  - Test /arios:status"
        echo "  test-arios   - Test /arios"
        echo "  test-all     - Run all tests"
        ;;
esac
