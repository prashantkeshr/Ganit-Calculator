import { history } from '../history.js';
import { CATEGORIES, TOOLS, getToolsByCategory } from '../registry.js';

let overlay = null;
let isOpen = false;
let _tab = 'calculators'; // default tab is now the calculator hub
let _q = '';

function renderCalcHub(body) {
  body.innerHTML = `
    <div class="db-hub">
      <div class="db-hub-title">All Calculators</div>
      <div class="db-hub-grid">
        ${CATEGORIES.map(cat => {
          const tools = getToolsByCategory(cat.id);
          const firstPath = tools[0]?.path || '/';
          return `
            <a class="db-hub-tile" href="#${firstPath}" data-cat="${cat.id}">
              <span class="db-hub-ico">${cat.icon}</span>
              <span class="db-hub-lbl">${cat.label}</span>
              <span class="db-hub-cnt">${tools.length} tool${tools.length !== 1 ? 's' : ''}</span>
            </a>
          `;
        }).join('')}
      </div>
    </div>
  `;
  // Close dashboard when navigating
  body.querySelectorAll('.db-hub-tile').forEach(a => {
    a.addEventListener('click', () => close());
  });
}

function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60000)   return 'just now';
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000)return `${Math.floor(d / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString('en', { day: 'numeric', month: 'short' });
}

function catLabel(id) { return CATEGORIES.find(c => c.id === id)?.label || id; }
function catIcon(id)  { return CATEGORIES.find(c => c.id === id)?.icon || '🧮'; }

function pathForEntry(e) {
  if (e.path) return e.path;
  const t = TOOLS.find(t => t.category === e.category);
  return t?.path || '/';
}

async function render() {
  if (!overlay || !isOpen) return;
  const body = overlay.querySelector('.db-body');

  if (_tab === 'calculators') { renderCalcHub(body); return; }

  let items = _tab === 'saved'
    ? await history.getAll({ limit: 500, starred: true })
    : await history.getAll({ limit: 500 });

  if (_q) {
    const q = _q.toLowerCase();
    items = items.filter(e =>
      (e.expression || '').toLowerCase().includes(q) ||
      String(e.result ?? '').toLowerCase().includes(q) ||
      (e.tool || '').toLowerCase().includes(q) ||
      (e.category || '').toLowerCase().includes(q)
    );
  }

  if (!items.length) {
    body.innerHTML = `<div class="db-empty">${
      _q ? `No results for "${_q}"` : _tab === 'saved' ? 'No saved calculations yet.' : 'No history yet. Start calculating!'
    }</div>`;
    return;
  }

  // Group by category, preserve insertion order (most recent category first)
  const order = [], groups = {};
  items.forEach(e => {
    const c = e.category || 'other';
    if (!groups[c]) { groups[c] = []; order.push(c); }
    groups[c].push(e);
  });

  body.innerHTML = order.map(cat => `
    <div class="db-group">
      <div class="db-group-hd">
        <span class="db-cat-ico">${catIcon(cat)}</span>
        <span class="db-cat-lbl">${catLabel(cat)}</span>
        <span class="db-cat-cnt">${groups[cat].length}</span>
      </div>
      <div class="db-entries">
        ${groups[cat].slice(0, 10).map(e => `
          <div class="db-entry${e.starred ? ' starred' : ''}" data-id="${e.id}" data-path="${pathForEntry(e)}">
            <div class="db-entry-body">
              <div class="db-expr">${e.expression || e.tool || '—'}</div>
              ${e.result != null ? `<div class="db-result">= ${e.result}</div>` : ''}
              <div class="db-time">${timeAgo(e.timestamp)}</div>
            </div>
            <div class="db-entry-acts">
              <button class="dbe-star${e.starred ? ' on' : ''}" data-id="${e.id}">${e.starred ? '★' : '☆'}</button>
              <button class="dbe-del" data-id="${e.id}">×</button>
            </div>
          </div>
        `).join('')}
        ${groups[cat].length > 10 ? `<div class="db-more">+${groups[cat].length - 10} more in <a href="#/history">history</a></div>` : ''}
      </div>
    </div>
  `).join('');

  body.querySelectorAll('.db-entry').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('button, a')) return;
      const p = el.dataset.path;
      if (p) { window.location.hash = '#' + p; close(); }
    });
  });

  body.querySelectorAll('.dbe-star').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const starred = await history.toggleStar(parseInt(btn.dataset.id));
      btn.textContent = starred ? '★' : '☆';
      btn.classList.toggle('on', starred);
      btn.closest('.db-entry').classList.toggle('starred', starred);
      if (_tab === 'saved' && !starred) btn.closest('.db-entry').remove();
    });
  });

  body.querySelectorAll('.dbe-del').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await history.delete(parseInt(btn.dataset.id));
      btn.closest('.db-entry').remove();
    });
  });
}

function close() {
  if (!overlay) return;
  overlay.classList.add('hidden');
  isOpen = false;
}

export function initDashboard() {
  overlay = document.getElementById('dashboard-overlay');
  if (!overlay) return;

  overlay.innerHTML = `
    <div class="db-modal">
      <div class="db-header">
        <div class="db-title"><span>📊</span> Dashboard</div>
        <div class="db-toolbar">
          <input type="search" class="db-search" placeholder="Search history…" autocomplete="off" />
          <div class="db-tabs">
            <button class="form-tab active" data-tab="calculators">🧮 Calculators</button>
            <button class="form-tab" data-tab="all">History</button>
            <button class="form-tab" data-tab="saved">★ Saved</button>
          </div>
          <button class="db-clear btn btn-sm btn-danger">Clear</button>
          <button class="db-close btn btn-icon" title="Close (Esc)">✕</button>
        </div>
      </div>
      <div class="db-body"></div>
    </div>
  `;

  const searchInput = overlay.querySelector('.db-search');
  searchInput.addEventListener('input', (e) => { _q = e.target.value.trim(); render(); });

  overlay.querySelectorAll('.form-tab[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      overlay.querySelectorAll('.form-tab[data-tab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      _tab = tab.dataset.tab;
      render();
    });
  });

  overlay.querySelector('.db-clear').addEventListener('click', async () => {
    if (!confirm('Clear all calculation history?')) return;
    await history.clear();
    render();
  });

  overlay.querySelector('.db-close').addEventListener('click', close);

  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) close(); });

  history.on('add', () => { if (isOpen) render(); });
}

export function openDashboard() {
  if (!overlay) return;
  overlay.classList.remove('hidden');
  isOpen = true;
  _q = '';
  _tab = 'calculators';
  const si = overlay.querySelector('.db-search');
  if (si) si.value = '';
  overlay.querySelectorAll('.form-tab[data-tab]').forEach(t => t.classList.toggle('active', t.dataset.tab === 'calculators'));
  render();
}
