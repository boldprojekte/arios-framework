/**
 * ARIOS Dashboard - Core Application
 *
 * Manages:
 * - SSE connection for real-time updates
 * - Application state
 * - UI event handlers
 * - View navigation
 */

// Import view renderers
import { renderKanban } from './kanban.js';
import { renderList } from './list.js';
import { renderRoadmap } from './roadmap.js';
import { clearLines, updateLinePositions } from './lines.js';

// ============================================
// State Management
// ============================================

const state = {
  tasks: [],
  phases: [],
  currentPhase: 0,
  currentPlan: 0,
  roadmap: '',
  connectionStatus: 'disconnected',
  currentView: 'kanban',
  currentTab: 'tasks',
  selectedTaskId: null
};

// ============================================
// DOM Elements
// ============================================

const elements = {
  // Sidebar
  sidebar: null,
  sidebarToggle: null,
  navItems: null,
  connectionStatus: null,

  // Header
  pageTitle: null,
  phaseIndicator: null,
  viewToggle: null,
  toggleButtons: null,

  // Views
  tasksView: null,
  roadmapView: null,
  kanbanBoard: null,
  listView: null,
  listContent: null,
  roadmapContent: null,

  // Kanban columns
  pendingTasks: null,
  inProgressTasks: null,
  completeTasks: null,
  pendingCount: null,
  inProgressCount: null,
  completeCount: null,

  // Panel (slide-out detail panel)
  detailPanel: null,
  panelTitle: null,
  panelBody: null,
  panelClose: null,
  panelResizer: null,
  mainContent: null
};

// ============================================
// EventSource Connection
// ============================================

let eventSource = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000;

function connectSSE() {
  if (eventSource) {
    eventSource.close();
  }

  eventSource = new EventSource('/events');

  eventSource.onopen = () => {
    state.connectionStatus = 'connected';
    reconnectAttempts = 0;
    updateConnectionStatus();
    console.log('[ARIOS] SSE connected');
  };

  eventSource.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      handleMessage(message);
    } catch (error) {
      console.error('[ARIOS] Failed to parse SSE message:', error);
    }
  };

  eventSource.onerror = (error) => {
    state.connectionStatus = 'disconnected';
    updateConnectionStatus();
    console.error('[ARIOS] SSE connection error:', error);
    // EventSource will auto-reconnect, but we track state
    reconnectAttempts++;
    if (reconnectAttempts > 1) {
      state.connectionStatus = 'reconnecting';
      updateConnectionStatus();
    }
  };
}

function handleMessage(message) {
  console.log('[ARIOS] Received message:', message.type);

  if (message.type === 'initial' || message.type === 'update') {
    const { tasks, phases, currentPhase, currentPlan, roadmap } = message.payload;

    // Track which tasks changed for update animation
    const previousTaskIds = new Set(state.tasks.map(t => t.id));
    const changedTaskIds = new Set();

    if (tasks) {
      tasks.forEach(task => {
        if (!previousTaskIds.has(task.id)) {
          changedTaskIds.add(task.id);
        } else {
          const prevTask = state.tasks.find(t => t.id === task.id);
          if (prevTask && prevTask.status !== task.status) {
            changedTaskIds.add(task.id);
          }
        }
      });
      state.tasks = tasks;
    }

    if (phases) state.phases = phases;
    if (currentPhase !== undefined) state.currentPhase = currentPhase;
    if (currentPlan !== undefined) state.currentPlan = currentPlan;
    if (roadmap !== undefined) state.roadmap = roadmap;

    render(changedTaskIds);
  }
}

// ============================================
// Utilities
// ============================================

/**
 * Debounce function execution
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// ============================================
// UI Event Handlers
// ============================================

function setupEventListeners() {
  // Sidebar toggle
  elements.sidebarToggle?.addEventListener('click', toggleSidebar);

  // Tab navigation
  elements.navItems?.forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      setTab(tab);
    });
  });

  // View toggle (Kanban/List)
  elements.toggleButtons?.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      setView(view);
    });
  });

  // Panel close and resize handlers
  elements.panelClose?.addEventListener('click', closePanel);
  elements.panelResizer?.addEventListener('mousedown', handleResizeStart);

  // Keyboard shortcuts - Escape closes panel
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.selectedTaskId) {
      closePanel();
    }
  });

  // Resize handler for dependency line repositioning
  window.addEventListener('resize', debounce(() => {
    if (state.currentView === 'kanban' && state.currentTab === 'tasks') {
      updateLinePositions();
    }
  }, 100));

  // Scroll handler for Kanban container
  elements.kanbanBoard?.addEventListener('scroll', debounce(() => {
    if (state.currentView === 'kanban' && state.currentTab === 'tasks') {
      updateLinePositions();
    }
  }, 50));
}

function toggleSidebar() {
  elements.sidebar?.classList.toggle('collapsed');
}

function setTab(tab) {
  if (tab === state.currentTab) return;
  state.currentTab = tab;

  // Clear dependency lines when switching tabs
  clearLines();

  // Update nav items
  elements.navItems?.forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tab);
  });

  // Update page title
  if (elements.pageTitle) {
    elements.pageTitle.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
  }

  // Show/hide views
  if (elements.tasksView) {
    elements.tasksView.classList.toggle('active', tab === 'tasks');
  }
  if (elements.roadmapView) {
    elements.roadmapView.classList.toggle('active', tab === 'roadmap');
  }

  // Show/hide view toggle (only for tasks)
  if (elements.viewToggle) {
    elements.viewToggle.style.display = tab === 'tasks' ? 'flex' : 'none';
  }

  // Re-render tasks if switching to tasks tab (to redraw lines)
  if (tab === 'tasks' && state.currentView === 'kanban') {
    renderTasks();
  }
}

function setView(view) {
  if (view === state.currentView) return;
  state.currentView = view;

  // Clear dependency lines before switching views
  clearLines();

  // Update toggle buttons
  elements.toggleButtons?.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  // Show/hide board views
  if (elements.kanbanBoard) {
    elements.kanbanBoard.classList.toggle('hidden', view !== 'kanban');
  }
  if (elements.listView) {
    elements.listView.classList.toggle('hidden', view !== 'list');
  }

  // Re-render tasks for new view (kanban will redraw lines)
  renderTasks();
}

function showTaskDetail(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  state.selectedTaskId = taskId;

  // Update panel content
  if (elements.panelTitle) {
    elements.panelTitle.textContent = task.name || `Task ${task.id}`;
  }

  if (elements.panelBody) {
    elements.panelBody.innerHTML = renderTaskDetailHTML(task);

    // Attach event listener to Add Note button
    const addNoteBtn = document.getElementById('add-note-btn');
    addNoteBtn?.addEventListener('click', handleAddNote);
  }

  // Open panel and compress main content
  elements.detailPanel?.classList.add('open');
  elements.mainContent?.classList.add('panel-open');
}

async function handleAddNote(e) {
  const taskId = e.target.dataset.taskId;
  const planPath = e.target.dataset.planPath;
  const input = document.getElementById('note-input');
  const content = input?.value?.trim();

  if (!content) return;

  try {
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, content, planPath })
    });

    if (response.ok) {
      input.value = '';
      // Re-render to show new note (will come via SSE update when file changes)
      console.log('[ARIOS] Note added successfully');
    } else {
      const error = await response.json();
      console.error('[ARIOS] Failed to add note:', error);
    }
  } catch (error) {
    console.error('[ARIOS] Failed to add note:', error);
  }
}

function closePanel() {
  state.selectedTaskId = null;
  elements.detailPanel?.classList.remove('open');
  elements.mainContent?.classList.remove('panel-open');
  // Reset panel width to default
  if (elements.detailPanel) {
    elements.detailPanel.style.width = '';
  }
  if (elements.mainContent) {
    elements.mainContent.style.marginRight = '';
  }
}

function renderTaskDetailHTML(task) {
  const statusClass = task.status.replace(' ', '-');
  const deps = task.dependsOn?.length > 0 ? task.dependsOn.join(', ') : 'None';

  // Notes section
  const notesSection = task.notes?.length > 0
    ? task.notes.map(note => `
        <div class="note-item">
          <span class="note-time">${new Date(note.timestamp).toLocaleString()}</span>
          <p class="note-content">${note.content}</p>
        </div>
      `).join('')
    : '<p class="empty-state">No notes yet</p>';

  return `
    <div class="detail-section">
      <div class="detail-label">Task ID</div>
      <div class="detail-value"><code>${task.id}</code></div>
    </div>
    <div class="detail-section">
      <div class="detail-label">Phase</div>
      <div class="detail-value">${task.phase}</div>
    </div>
    <div class="detail-section">
      <div class="detail-label">Status</div>
      <div class="detail-value">
        <span class="status-badge ${statusClass}">${task.status}</span>
      </div>
    </div>
    <div class="detail-section">
      <div class="detail-label">Wave</div>
      <div class="detail-value">${task.wave || 'N/A'}</div>
    </div>
    <div class="detail-section">
      <div class="detail-label">Dependencies</div>
      <div class="detail-value">${deps}</div>
    </div>
    ${task.summary ? `
    <div class="detail-section">
      <div class="detail-label">Summary</div>
      <div class="detail-value">${task.summary}</div>
    </div>
    ` : ''}
    ${task.duration ? `
    <div class="detail-section">
      <div class="detail-label">Duration</div>
      <div class="detail-value">${task.duration}</div>
    </div>
    ` : ''}
    ${task.completedAt ? `
    <div class="detail-section">
      <div class="detail-label">Completed</div>
      <div class="detail-value">${task.completedAt}</div>
    </div>
    ` : ''}
    <div class="detail-section notes-section">
      <div class="detail-label">Notes</div>
      <div class="notes-list">
        ${notesSection}
      </div>
      <div class="add-note-form">
        <textarea
          id="note-input"
          class="note-textarea"
          placeholder="Add a note for Claude..."
          rows="2"
        ></textarea>
        <button id="add-note-btn" class="add-note-btn" data-task-id="${task.id}" data-plan-path="${task.planPath || ''}">
          Add Note
        </button>
      </div>
    </div>
  `;
}

// ============================================
// Render Functions
// ============================================

function render(changedTaskIds = new Set()) {
  updateConnectionStatus();
  updatePhaseIndicator();
  renderTasks(changedTaskIds);
  renderRoadmapView();
}

function updateConnectionStatus() {
  if (!elements.connectionStatus) return;

  // Remove all status classes
  elements.connectionStatus.classList.remove('connected', 'disconnected', 'reconnecting');
  elements.connectionStatus.classList.add(state.connectionStatus);

  const statusText = elements.connectionStatus.querySelector('.status-text');
  if (statusText) {
    switch (state.connectionStatus) {
      case 'connected':
        statusText.textContent = 'Connected';
        break;
      case 'disconnected':
        statusText.textContent = 'Disconnected';
        break;
      case 'reconnecting':
        statusText.textContent = 'Reconnecting...';
        break;
    }
  }
}

function updatePhaseIndicator() {
  if (!elements.phaseIndicator) return;

  const totalPhases = state.phases.length || 0;
  elements.phaseIndicator.textContent = `Phase ${state.currentPhase} of ${totalPhases}`;
}

function renderTasks(changedTaskIds = new Set()) {
  console.log('[app.js] renderTasks called with', state.tasks.length, 'tasks');

  if (state.currentView === 'kanban') {
    renderKanban(state.tasks, showTaskDetail, changedTaskIds);
  } else {
    renderList(state.tasks, showTaskDetail, changedTaskIds);
  }
}

async function renderRoadmapView() {
  console.log('[app.js] renderRoadmapView called');
  await renderRoadmap(state.phases, state.roadmap);
}

// ============================================
// Initialization
// ============================================

function initElements() {
  // Sidebar
  elements.sidebar = document.getElementById('sidebar');
  elements.sidebarToggle = document.getElementById('sidebar-toggle');
  elements.navItems = document.querySelectorAll('.nav-item');
  elements.connectionStatus = document.getElementById('connection-status');

  // Header
  elements.pageTitle = document.getElementById('page-title');
  elements.phaseIndicator = document.getElementById('phase-indicator');
  elements.viewToggle = document.getElementById('view-toggle');
  elements.toggleButtons = document.querySelectorAll('.toggle-btn');

  // Views
  elements.tasksView = document.getElementById('tasks-view');
  elements.roadmapView = document.getElementById('roadmap-view');
  elements.kanbanBoard = document.getElementById('kanban-board');
  elements.listView = document.getElementById('list-view');
  elements.listContent = document.getElementById('list-content');
  elements.roadmapContent = document.getElementById('roadmap-content');

  // Kanban columns
  elements.pendingTasks = document.getElementById('pending-tasks');
  elements.inProgressTasks = document.getElementById('in-progress-tasks');
  elements.completeTasks = document.getElementById('complete-tasks');
  elements.pendingCount = document.getElementById('pending-count');
  elements.inProgressCount = document.getElementById('in-progress-count');
  elements.completeCount = document.getElementById('complete-count');

  // Panel (slide-out detail panel)
  elements.detailPanel = document.getElementById('detail-panel');
  elements.panelTitle = document.getElementById('panel-title');
  elements.panelBody = document.getElementById('panel-body');
  elements.panelClose = document.getElementById('panel-close');
  elements.panelResizer = document.getElementById('panel-resizer');
  elements.mainContent = document.querySelector('.main-content');
}

// ============================================
// Panel Resize State and Handlers
// ============================================

let isResizing = false;
let startX = 0;
let startWidth = 0;

function handleResizeStart(e) {
  isResizing = true;
  startX = e.clientX;
  startWidth = elements.detailPanel.offsetWidth;
  elements.panelResizer.classList.add('active');
  document.addEventListener('mousemove', handleResizeMove);
  document.addEventListener('mouseup', handleResizeEnd);
  e.preventDefault();
}

function handleResizeMove(e) {
  if (!isResizing) return;
  const delta = startX - e.clientX;
  const newWidth = Math.max(300, Math.min(800, startWidth + delta));
  elements.detailPanel.style.width = `${newWidth}px`;
  elements.mainContent.style.marginRight = `${newWidth}px`;
}

function handleResizeEnd() {
  isResizing = false;
  elements.panelResizer.classList.remove('active');
  document.removeEventListener('mousemove', handleResizeMove);
  document.removeEventListener('mouseup', handleResizeEnd);
}

function init() {
  console.log('[ARIOS] Dashboard initializing...');

  initElements();
  setupEventListeners();
  connectSSE();

  // Initial render with empty state
  render();

  console.log('[ARIOS] Dashboard initialized');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ============================================
// Exports (for view module integration in 06-04)
// ============================================

export { state, render, setView, setTab, showTaskDetail, closePanel };
