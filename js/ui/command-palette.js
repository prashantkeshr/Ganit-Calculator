import { TOOLS, searchTools } from '../registry.js';
import { router } from '../router.js';
import { history } from '../history.js';

export function initCommandPalette() {
  const el = document.createElement('div');
  el.id = 'command-palette';
  el.className = 'cmd-palette';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Command palette');
  el.innerHTML = `
    <div class="cmd-backdrop"></div>
    <div class="cmd-dialog">
      <div class="cmd-header">
        <img src="assets/brand/ganit.png" alt="Ganit" class="cmd-logo" />
        <input type="search" class="cmd-input" id="cmd-input" placeholder="Search calculators, tools…" autocomplete="off" spellcheck="false">
        <kbd class="cmd-esc">ESC</kbd>
      </div>
      <div class="cmd-results" id="cmd-results" role="listbox"></div>
      <div class="cmd-footer">
        <span>↑↓ navigate</span><span>↵ open</span><span>ESC close</span>
      </div>
    </div>
  `;
  document.body.appendChild(el);

  const input = el.querySelector('#cmd-input');
  const results = el.querySelector('#cmd-results');
  let selectedIdx = 0;
  let currentItems = [];

  function open() {
    el.classList.add('open');
    input.value = '';
    input.focus();
    renderResults('');
  }

  function close() {
    el.classList.remove('open');
    input.blur();
  }

  function renderResults(query) {
    const tools = query ? searchTools(query) : TOOLS.slice(0, 20);
    currentItems = tools;
    selectedIdx = 0;
    results.innerHTML = tools.length
      ? tools.map((t, i) => `
          <div class="cmd-item ${i === 0 ? 'selected' : ''}" role="option" data-idx="${i}" data-path="${t.path}">
            <span class="cmd-item-label">${highlight(t.label, query)}</span>
            <span class="cmd-item-cat">${t.category}</span>
          </div>
        `).join('')
      : '<div class="cmd-empty">No results</div>';
    results.querySelectorAll('.cmd-item').forEach(item => {
      item.addEventListener('click', () => navigate(item.dataset.path));
      item.addEventListener('mouseenter', () => setSelected(parseInt(item.dataset.idx)));
    });
  }

  function highlight(label, query) {
    if (!query) return label;
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return label.replace(re, '<mark>$1</mark>');
  }

  function setSelected(idx) {
    selectedIdx = Math.max(0, Math.min(idx, currentItems.length - 1));
    results.querySelectorAll('.cmd-item').forEach((item, i) => {
      item.classList.toggle('selected', i === selectedIdx);
      if (i === selectedIdx) item.scrollIntoView({ block: 'nearest' });
    });
  }

  function navigate(path) {
    router.go(path);
    close();
  }

  input.addEventListener('input', (e) => renderResults(e.target.value));

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(selectedIdx + 1); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(selectedIdx - 1); }
    if (e.key === 'Enter') {
      const item = currentItems[selectedIdx];
      if (item) navigate(item.path);
    }
    if (e.key === 'Escape') close();
  });

  el.querySelector('.cmd-backdrop').addEventListener('click', close);

  // Keyboard shortcut Ctrl+K / Cmd+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      el.classList.contains('open') ? close() : open();
    }
    if (e.key === 'Escape' && el.classList.contains('open')) close();
  });

  // Custom event from header search button
  document.addEventListener('ganit:command-palette', (e) => {
    if (e.detail?.open) open(); else close();
  });

  return { open, close };
}
