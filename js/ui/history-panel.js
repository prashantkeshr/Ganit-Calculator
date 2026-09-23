import { history } from '../history.js';

function formatEntry(entry) {
  if (entry.expression) return entry.expression;
  if (entry.tool) return entry.tool;
  if (entry.category) return entry.category;
  return '—';
}

function entryHtml(entry) {
  return `
    <div class="history-item${entry.starred ? ' starred' : ''}" data-id="${entry.id}" data-expr="${encodeURIComponent(entry.expression || '')}" role="listitem">
      <button class="history-star btn btn-icon${entry.starred ? ' active' : ''}" data-id="${entry.id}" title="${entry.starred ? 'Unsave' : 'Save'}">
        ${entry.starred ? '★' : '☆'}
      </button>
      <div class="history-item-inner" style="flex:1;min-width:0">
        <div class="history-expr">${formatEntry(entry)}</div>
        ${entry.result !== undefined && entry.result !== null ? `<div class="history-result">= ${entry.result}</div>` : ''}
        <div class="history-meta">${new Date(entry.timestamp).toLocaleTimeString()} · ${entry.category || ''}</div>
      </div>
      <button class="history-del btn btn-icon" data-id="${entry.id}" aria-label="Delete">×</button>
    </div>
  `;
}

export function initHistoryPanel() {
  const el = document.createElement('aside');
  el.id = 'history-panel';
  el.className = 'history-panel';
  el.setAttribute('aria-label', 'Calculation history');
  el.innerHTML = `
    <div class="history-header">
      <h2>History</h2>
      <div class="history-actions">
        <button id="history-clear" class="btn btn-sm btn-danger">Clear All</button>
        <button id="history-close" class="btn btn-icon" aria-label="Close history">×</button>
      </div>
    </div>
    <div class="history-tabs">
      <button class="history-tab active" data-tab="all">All</button>
      <button class="history-tab" data-tab="saved">★ Saved</button>
    </div>
    <div class="history-list" id="history-list" role="list"></div>
  `;
  document.body.appendChild(el);

  let activeTab = 'all';

  async function refresh() {
    const items = activeTab === 'saved'
      ? await history.getAll({ limit: 200, starred: true })
      : await history.getAll({ limit: 100 });

    const list = el.querySelector('#history-list');
    if (!items.length) {
      list.innerHTML = activeTab === 'saved'
        ? '<div class="history-empty">No saved calculations yet.<br>Click ☆ on any entry to save it.</div>'
        : '<div class="history-empty">No calculations yet</div>';
      return;
    }

    // Group by date
    const groups = {};
    items.forEach(item => {
      const d = new Date(item.timestamp);
      const key = d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    list.innerHTML = Object.entries(groups).map(([date, entries]) => `
      <div class="history-group">
        <div class="history-group-label">${date}</div>
        ${entries.map(entryHtml).join('')}
      </div>
    `).join('');

    // Click inner to reuse
    list.querySelectorAll('.history-item-inner').forEach(item => {
      item.addEventListener('click', () => {
        const expr = decodeURIComponent(item.closest('.history-item').dataset.expr);
        document.dispatchEvent(new CustomEvent('ganit:history-use', { detail: { expr } }));
        toggle(false);
      });
    });

    // Star toggle
    list.querySelectorAll('.history-star').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        const starred = await history.toggleStar(id);
        btn.textContent = starred ? '★' : '☆';
        btn.classList.toggle('active', starred);
        btn.closest('.history-item').classList.toggle('starred', starred);
        btn.title = starred ? 'Unsave' : 'Save';
        if (activeTab === 'saved' && !starred) btn.closest('.history-item').remove();
      });
    });

    // Delete
    list.querySelectorAll('.history-del').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await history.delete(parseInt(btn.dataset.id));
        refresh();
      });
    });
  }

  el.querySelector('#history-clear').addEventListener('click', async () => {
    const msg = activeTab === 'saved'
      ? 'Clear all saved calculations?'
      : 'Clear all history?';
    if (!confirm(msg)) return;
    if (activeTab === 'saved') {
      const items = await history.getAll({ starred: true });
      for (const item of items) {
        item.starred = false;
        await history.toggleStar(item.id);
      }
    } else {
      await history.clear();
    }
    refresh();
  });

  el.querySelector('#history-close').addEventListener('click', () => toggle(false));

  // Tab switching
  el.querySelectorAll('.history-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      el.querySelectorAll('.history-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      refresh();
    });
  });

  history.on('add', refresh);
  history.on('delete', refresh);
  history.on('clear', refresh);
  history.on('star', refresh);

  function toggle(open) {
    el.classList.toggle('open', open);
    if (open) refresh();
  }

  document.addEventListener('ganit:toggle-history', (e) => toggle(e.detail?.open ?? !el.classList.contains('open')));

  refresh();
  return { toggle, refresh };
}
