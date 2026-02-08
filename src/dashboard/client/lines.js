/**
 * ARIOS Dashboard - Dependency Line Visualization
 *
 * Uses Leader-line library (browser-only) to draw SVG lines
 * connecting dependent tasks in the Kanban view.
 *
 * Leader-line is loaded via script tag in index.html and
 * available as global LeaderLine constructor.
 */

// Active line instances for cleanup
let lines = [];

/**
 * Clear all existing dependency lines
 * Call before switching views or redrawing
 */
export function clearLines() {
  lines.forEach(line => {
    try {
      line.remove();
    } catch (e) {
      // Line may already be removed if element was destroyed
    }
  });
  lines = [];
}

/**
 * Draw dependency lines between task cards in Kanban view
 * Lines go from dependency (source) to dependent (target) task
 *
 * @param {Array} tasks - Array of task objects with id and dependsOn
 */
export function drawDependencyLines(tasks) {
  // Clear existing lines first
  clearLines();

  // Check if LeaderLine is available (browser-only)
  if (typeof LeaderLine === 'undefined') {
    console.warn('[lines.js] LeaderLine not available');
    return;
  }

  // Check if Kanban board is visible
  const kanbanBoard = document.getElementById('kanban-board');
  if (!kanbanBoard || kanbanBoard.classList.contains('hidden')) {
    return;
  }

  // Build map of task elements by ID
  const taskElements = new Map();
  document.querySelectorAll('.task-card[data-task-id]').forEach(card => {
    taskElements.set(card.dataset.taskId, card);
  });

  // Draw lines for each task with dependencies
  tasks.forEach(task => {
    if (!task.dependsOn || task.dependsOn.length === 0) return;

    const targetElement = taskElements.get(task.id);
    if (!targetElement) return;

    task.dependsOn.forEach(depId => {
      const sourceElement = taskElements.get(depId);
      if (!sourceElement) return;

      // Both elements must be visible in viewport
      if (!isElementVisible(sourceElement) || !isElementVisible(targetElement)) {
        return;
      }

      try {
        const line = new LeaderLine(
          sourceElement,
          targetElement,
          {
            color: 'rgba(124, 92, 255, 0.5)', // accent color, semi-transparent
            size: 2,
            path: 'fluid',
            startSocket: 'right',
            endSocket: 'left',
            startPlug: 'disc',
            endPlug: 'arrow1',
            dash: { len: 4, gap: 4 }
          }
        );
        lines.push(line);
      } catch (e) {
        console.warn('[lines.js] Failed to create line:', e.message);
      }
    });
  });
}

/**
 * Update positions of all existing lines
 * Call after scroll, resize, or layout change
 */
export function updateLinePositions() {
  lines.forEach(line => {
    try {
      line.position();
    } catch (e) {
      // Element may have been removed
    }
  });
}

/**
 * Check if an element is visible in the DOM
 * @param {HTMLElement} el - Element to check
 * @returns {boolean} True if element is visible
 */
function isElementVisible(el) {
  return el.offsetParent !== null;
}
