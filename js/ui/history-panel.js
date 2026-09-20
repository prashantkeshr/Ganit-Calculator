import { history } from '../history.js';

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
    <div class="history-list" id="history-list" role="list"></div>
  `;
  document.body.appendChild(el);

  async function refresh() {
    const items = await history.getAll({ limit: 100 });
    const list = el.querySelector('#history-list');
    if (!items.length) {
      list.innerHTML = '<div class="history-empty">No calculations yet</div>';
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
        ${entries.map(entry => `
          <div class="history-item" data-expr="${encodeURIComponent(entry.expression || '')}" role="listitem">
            <div class="history-item-inner">
              <div class="history-expr">${entry.expression || entry.tool || entry.category || ''}</div>
              ${entry.result ? `<div class="history-result">${entry.result}</div>` : ''}
              <div class="history-meta">${new Date(entry.timestamp).toLocaleTimeString()} · ${entry.category}</div>
            </div>
            <button class="history-del btn btn-icon" data-id="${entry.id}" aria-label="Delete">×</button>
          </div>
        `).join('')}
      </div>
    `).join('');

    // Click to reuse
    list.querySelectorAll('.history-item-inner').forEach(item => {
      item.addEventListener('click', () => {
        const expr = decodeURIComponent(item.closest('.history-item').dataset.expr);
        document.dispatchEvent(new CustomEvent('ganit:history-use', { detail: { expr } }));
        toggle(false);
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
    if (confirm('Clear all history?')) { await history.clear(); refresh(); }
  });
  el.querySelector('#history-close').addEventListener('click', () => toggle(false));

  history.on('add', refresh);
  history.on('delete', refresh);
  history.on('clear', refresh);

  function toggle(open) {
    el.classList.toggle('open', open);
    if (open) refresh();
  }

  // Toggle button in header
  document.addEventListener('ganit:toggle-history', (e) => toggle(e.detail?.open ?? !el.classList.contains('open')));

  refresh();
  return { toggle, refresh };
}
