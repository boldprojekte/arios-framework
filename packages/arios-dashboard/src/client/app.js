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

  // Modal
  modal: null,
  modalTitle: null,
  modalBody: null,
  modalClose: null,
  modalOverlay: null
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

  // Modal close handlers
  elements.modalClose?.addEventListener('click', closeModal);
  elements.modalOverlay?.addEventListener('click', closeModal);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.selectedTaskId) {
      closeModal();
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

  // Update modal content
  if (elements.modalTitle) {
    elements.modalTitle.textContent = task.name || `Task ${task.id}`;
  }

  if (elements.modalBody) {
    elements.modalBody.innerHTML = renderTaskDetailHTML(task);
  }

  // Open modal
  elements.modal?.classList.add('open');
}

function closeModal() {
  state.selectedTaskId = null;
  elements.modal?.classList.remove('open');
}

function renderTaskDetailHTML(task) {
  const statusClass = task.status.replace(' ', '-');
  const deps = task.dependsOn?.length > 0 ? task.dependsOn.join(', ') : 'None';

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

  // Modal
  elements.modal = document.getElementById('task-modal');
  elements.modalTitle = document.getElementById('modal-title');
  elements.modalBody = document.getElementById('modal-body');
  elements.modalClose = document.getElementById('modal-close');
  elements.modalOverlay = elements.modal?.querySelector('.modal-overlay');
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

export { state, render, setView, setTab, showTaskDetail, closeModal };
