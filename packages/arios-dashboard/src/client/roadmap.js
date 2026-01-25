/**
 * ARIOS Dashboard - Roadmap View Renderer
 *
 * Renders project phases as summary cards with progress bars,
 * followed by the full roadmap markdown content.
 */

// Use marked from CDN (loaded via script tag in HTML or imported if available)
// For now, use dynamic import with fallback to simple rendering
let marked = null;

/**
 * Initialize marked library
 * Attempts to use global marked or falls back to simple rendering
 */
async function initMarked() {
  if (marked) return;

  // Try to use global marked (from CDN)
  if (typeof window !== 'undefined' && window.marked) {
    marked = window.marked;
    return;
  }

  // Fallback: no marked available, will use simple rendering
  marked = null;
}

/**
 * Render the Roadmap view with phase cards and markdown content
 * @param {Array} phases - Array of phase objects with progress info
 * @param {string} roadmapMd - Raw ROADMAP.md content
 */
export async function renderRoadmap(phases, roadmapMd) {
  const container = document.getElementById('roadmap-content');
  if (!container) return;

  // Clear existing content
  container.innerHTML = '';

  // Initialize marked if not done
  await initMarked();

  // Render phase summary cards
  const cardsSection = renderPhaseCards(phases);
  container.appendChild(cardsSection);

  // Render full roadmap markdown
  const markdownSection = renderMarkdownContent(roadmapMd);
  container.appendChild(markdownSection);
}

/**
 * Create phase summary cards with progress bars
 * @param {Array} phases - Phase data
 * @returns {HTMLElement} Container with phase cards
 */
function renderPhaseCards(phases) {
  const section = document.createElement('div');
  section.className = 'roadmap-phases';

  if (!phases || phases.length === 0) {
    section.innerHTML = '<p class="empty-state">No phases available</p>';
    return section;
  }

  phases.forEach(phase => {
    const card = createPhaseCard(phase);
    section.appendChild(card);
  });

  return section;
}

/**
 * Create a single phase card with progress bar
 * @param {Object} phase - Phase data
 * @returns {HTMLElement} Phase card element
 */
function createPhaseCard(phase) {
  const card = document.createElement('div');
  card.className = 'phase-card';

  // Determine status class
  const statusClass = phase.status || 'pending';

  // Calculate progress percentage
  const progress = phase.plansTotal > 0
    ? Math.round((phase.plansComplete / phase.plansTotal) * 100)
    : 0;

  card.innerHTML = `
    <div class="phase-header">
      <span class="phase-number">${String(phase.id).padStart(2, '0')}</span>
      <span class="phase-name">${formatPhaseName(phase.name)}</span>
      <span class="phase-status ${statusClass}">${statusClass}</span>
    </div>
    <div class="phase-progress">
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
      <span class="progress-text">${phase.plansComplete}/${phase.plansTotal} plans</span>
    </div>
  `;

  return card;
}

/**
 * Format phase name from kebab-case to Title Case
 * @param {string} name - Phase name (e.g., "execution-flow")
 * @returns {string} Formatted name (e.g., "Execution Flow")
 */
function formatPhaseName(name) {
  if (!name) return 'Unknown Phase';
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Render markdown content to HTML
 * @param {string} markdown - Raw markdown string
 * @returns {HTMLElement} Container with rendered HTML
 */
function renderMarkdownContent(markdown) {
  const section = document.createElement('div');
  section.className = 'roadmap-markdown';

  if (!markdown) {
    section.innerHTML = '<p class="empty-state">No roadmap content available</p>';
    return section;
  }

  // Use marked if available, otherwise simple rendering
  if (marked && typeof marked.parse === 'function') {
    try {
      section.innerHTML = marked.parse(markdown);
    } catch (error) {
      console.error('[roadmap.js] Marked parsing error:', error);
      section.innerHTML = renderSimpleMarkdown(markdown);
    }
  } else {
    section.innerHTML = renderSimpleMarkdown(markdown);
  }

  return section;
}

/**
 * Simple markdown to HTML conversion (fallback when marked not available)
 * @param {string} markdown - Raw markdown
 * @returns {string} HTML string
 */
function renderSimpleMarkdown(markdown) {
  return markdown
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```[\s\S]*?```/g, (match) => {
      const code = match.slice(3, -3).trim();
      return `<pre><code>${escapeHtml(code)}</code></pre>`;
    })
    // Inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive li elements in ul
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    // Paragraphs (lines not starting with tags)
    .split('\n\n')
    .map(para => {
      para = para.trim();
      if (!para) return '';
      if (para.startsWith('<')) return para;
      return `<p>${para}</p>`;
    })
    .join('\n');
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
