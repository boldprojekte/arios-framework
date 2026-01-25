/**
 * ARIOS Dashboard - List View Renderer
 *
 * Renders tasks as table rows sorted by phase and plan number.
 * Each row displays: ID, Name, Status, Wave, Dependencies, Duration.
 */

/**
 * Render the List view with tasks as table rows
 * @param {Array} tasks - Array of task objects
 * @param {Function} onTaskClick - Callback when a row is clicked (receives taskId)
 * @param {Set} changedTaskIds - Set of task IDs that changed (for update animation)
 */
export function renderList(tasks, onTaskClick, changedTaskIds = new Set()) {
  const container = document.getElementById('list-content');
  if (!container) return;

  // Clear existing content
  container.innerHTML = '';

  // Sort tasks by phase, then plan number
  const sortedTasks = [...tasks].sort((a, b) => {
    // Extract phase number (e.g., "05" from "05-01")
    const phaseA = parseInt(a.id.split('-')[0], 10) || 0;
    const phaseB = parseInt(b.id.split('-')[0], 10) || 0;

    if (phaseA !== phaseB) return phaseA - phaseB;

    // Then by plan number
    const planA = parseInt(a.id.split('-')[1], 10) || 0;
    const planB = parseInt(b.id.split('-')[1], 10) || 0;
    return planA - planB;
  });

  // Create table structure
  const table = document.createElement('table');
  table.className = 'list-table';

  // Create header
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th class="col-id">ID</th>
      <th class="col-name">Name</th>
      <th class="col-status">Status</th>
      <th class="col-wave">Wave</th>
      <th class="col-deps">Dependencies</th>
      <th class="col-duration">Duration</th>
    </tr>
  `;
  table.appendChild(thead);

  // Create body
  const tbody = document.createElement('tbody');

  sortedTasks.forEach(task => {
    const row = createTaskRow(task, onTaskClick, changedTaskIds.has(task.id));
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

/**
 * Create a table row for a task
 * @param {Object} task - Task data
 * @param {Function} onClick - Click handler
 * @param {boolean} isChanged - Whether to show update animation
 * @returns {HTMLElement} The table row element
 */
function createTaskRow(task, onClick, isChanged = false) {
  const row = document.createElement('tr');
  row.className = 'list-row' + (isChanged ? ' updated' : '');
  row.dataset.taskId = task.id;

  // Status class for badge styling
  const statusClass = task.status.replace(' ', '-');

  // Dependencies display
  const depsDisplay = task.dependsOn && task.dependsOn.length > 0
    ? task.dependsOn.join(', ')
    : '-';

  row.innerHTML = `
    <td class="col-id"><code>${task.id}</code></td>
    <td class="col-name">${task.name || 'Unnamed task'}</td>
    <td class="col-status">
      <span class="status-badge ${statusClass}">${task.status}</span>
    </td>
    <td class="col-wave">${task.wave || '-'}</td>
    <td class="col-deps">${depsDisplay}</td>
    <td class="col-duration">${task.duration || '-'}</td>
  `;

  // Add click handler
  row.addEventListener('click', () => onClick(task.id));

  // Add hover effect via CSS (row hover class added in styles.css)
  return row;
}
