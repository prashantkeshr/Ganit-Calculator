import { history } from '../history.js';
import { router } from '../router.js';

let currentCategory = null;
let tape = null;

const NO_TAPE = new Set(['history', 'about', 'privacy', '']);

function getCategoryFromPath(path) {
  if (!path) return null;
  const seg = path.replace(/^\//, '').split('/')[0];
  if (NO_TAPE.has(seg)) return null;
  const remap = { 'time': 'datetime', 'datetime': 'datetime', 'volume': 'area', 'unit-converter': 'unit' };
  return remap[seg] || seg;
}

function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60000)   return 'just now';
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000)return `${Math.floor(d / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString('en', { day: 'numeric', month: 'short' });
}

async function refresh() {
  if (!tape) return;
  if (!currentCategory) { tape.classList.add('tape-hidden'); return; }

  const items = await history.getAll({ limit: 20, category: currentCategory });
  if (!items.length) { tape.classList.add('tape-hidden'); return; }

  tape.classList.remove('tape-hidden');
  const list = tape.querySelector('.calc-tape-list');
  if (!list) return;

  list.innerHTML = items.map(e => `
    <div class="calc-tape-entry${e.starred ? ' starred' : ''}" data-id="${e.id}">
      <div class="calc-tape-body">
        <div class="calc-tape-expr">${e.expression || e.tool || e.category || '—'}</div>
        ${e.result != null ? `<div class="calc-tape-result">= ${e.result}</div>` : ''}
        <div class="calc-tape-time">${timeAgo(e.timestamp)}</div>
      </div>
      <div class="calc-tape-acts">
        <button class="cta-star${e.starred ? ' on' : ''}" data-id="${e.id}" title="${e.starred ? 'Unsave' : 'Save'}">${e.starred ? '★' : '☆'}</button>
        <button class="cta-del" data-id="${e.id}" title="Delete">×</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.cta-star').forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      const starred = await history.toggleStar(parseInt(btn.dataset.id));
      btn.textContent = starred ? '★' : '☆';
      btn.classList.toggle('on', starred);
      btn.closest('.calc-tape-entry').classList.toggle('starred', starred);
    });
  });

  list.querySelectorAll('.cta-del').forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      await history.delete(parseInt(btn.dataset.id));
      btn.closest('.calc-tape-entry').remove();
      if (!list.querySelector('.calc-tape-entry')) tape.classList.add('tape-hidden');
    });
  });
}

export function initCalcTape() {
  tape = document.getElementById('calc-tape');
  if (!tape) return;

  tape.innerHTML = `
    <div class="calc-tape-header">
      <span class="calc-tape-title">Recent</span>
      <button class="calc-tape-clear btn btn-icon" title="Clear category history">🗑</button>
    </div>
    <div class="calc-tape-list"></div>
  `;

  tape.querySelector('.calc-tape-clear').addEventListener('click', async () => {
    if (!currentCategory || !confirm('Clear history for this category?')) return;
    await history.clear(currentCategory);
    tape.classList.add('tape-hidden');
  });

  history.on('add',    () => refresh());
  history.on('delete', () => refresh());
  history.on('clear',  () => refresh());
  history.on('star',   () => refresh());

  router.onChange(({ path }) => {
    currentCategory = getCategoryFromPath(path);
    refresh();
  });

  currentCategory = getCategoryFromPath(router.current?.path || '/basic');
  refresh();
}
