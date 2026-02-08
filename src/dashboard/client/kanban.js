/**
 * ARIOS Dashboard - Kanban Board Renderer
 *
 * Renders tasks grouped by status in a Kanban-style board.
 * Each task displays as a card with name, ID, wave, and dependencies.
 */

import { drawDependencyLines } from './lines.js';

// Store tasks reference for line drawing
let currentTasks = [];

/**
 * Render the Kanban board with tasks grouped by status
 * @param {Array} tasks - Array of task objects
 * @param {Function} onTaskClick - Callback when a task card is clicked (receives taskId)
 * @param {Set} changedTaskIds - Set of task IDs that changed (for update animation)
 */
export function renderKanban(tasks, onTaskClick, changedTaskIds = new Set()) {
  // Get column containers
  const pendingContainer = document.getElementById('pending-tasks');
  const inProgressContainer = document.getElementById('in-progress-tasks');
  const completeContainer = document.getElementById('complete-tasks');

  // Get count elements
  const pendingCount = document.getElementById('pending-count');
  const inProgressCount = document.getElementById('in-progress-count');
  const completeCount = document.getElementById('complete-count');

  // Group tasks by status
  const grouped = {
    pending: tasks.filter(t => t.status === 'pending'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    complete: tasks.filter(t => t.status === 'complete')
  };

  // Update counts
  if (pendingCount) pendingCount.textContent = grouped.pending.length;
  if (inProgressCount) inProgressCount.textContent = grouped['in-progress'].length;
  if (completeCount) completeCount.textContent = grouped.complete.length;

  // Render each column
  renderColumn(pendingContainer, grouped.pending, onTaskClick, changedTaskIds);
  renderColumn(inProgressContainer, grouped['in-progress'], onTaskClick, changedTaskIds);
  renderColumn(completeContainer, grouped.complete, onTaskClick, changedTaskIds);

  // Store tasks for line drawing and draw after layout complete
  currentTasks = tasks;
  requestAnimationFrame(() => {
    drawDependencyLines(currentTasks);
  });
}

/**
 * Render a single column with task cards
 * @param {HTMLElement} container - The column container element
 * @param {Array} tasks - Tasks for this column
 * @param {Function} onTaskClick - Click handler
 * @param {Set} changedTaskIds - Changed task IDs for animation
 */
function renderColumn(container, tasks, onTaskClick, changedTaskIds) {
  if (!container) return;

  // Clear existing content
  container.innerHTML = '';

  // Create and append task cards
  tasks.forEach(task => {
    const card = createTaskCard(task, onTaskClick, changedTaskIds.has(task.id));
    container.appendChild(card);
  });
}

/**
 * Create a task card element
 * @param {Object} task - Task data
 * @param {Function} onClick - Click handler
 * @param {boolean} isChanged - Whether to show update animation
 * @returns {HTMLElement} The task card element
 */
function createTaskCard(task, onClick, isChanged = false) {
  const card = document.createElement('div');
  card.className = 'task-card' + (isChanged ? ' updated' : '');
  card.dataset.taskId = task.id;

  // Build dependencies display
  const depsDisplay = task.dependsOn && task.dependsOn.length > 0
    ? `<div class="task-deps">Depends: ${task.dependsOn.join(', ')}</div>`
    : '';

  // Build duration display
  const durationDisplay = task.duration
    ? `<div class="task-duration">${task.duration}</div>`
    : '';

  card.innerHTML = `
    <div class="task-header">
      <span class="task-id">${task.id}</span>
      <span class="task-wave">Wave ${task.wave || '-'}</span>
    </div>
    <div class="task-name">${task.name || 'Unnamed task'}</div>
    ${depsDisplay}
    ${durationDisplay}
  `;

  // Add click handler
  card.addEventListener('click', () => onClick(task.id));

  return card;
}
