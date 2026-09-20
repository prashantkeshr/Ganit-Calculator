import { CATEGORIES, TOOLS, getToolsByCategory } from '../registry.js';
import { router } from '../router.js';

export function renderSidebar(container) {
  const nav = document.createElement('nav');
  nav.className = 'ganit-sidebar';
  nav.setAttribute('aria-label', 'Calculator categories');

  nav.innerHTML = `
    <div class="sidebar-search">
      <div class="sidebar-search-wrap">
        <span class="sidebar-search-icon">🔍</span>
        <input
          type="search"
          class="sidebar-search-input"
          id="sidebar-search"
          placeholder="Search tools…"
          aria-label="Search calculators"
          autocomplete="off"
        />
      </div>
    </div>

    <div class="sidebar-nav" id="sidebar-nav">
      ${CATEGORIES.map(cat => `
        <div class="sidebar-category" data-cat="${cat.id}">
          <button class="sidebar-cat-btn" data-cat="${cat.id}" aria-expanded="true">
            <span class="cat-icon">${cat.icon}</span>
            <span class="cat-label">${cat.label}</span>
            <span class="cat-chevron">▾</span>
          </button>
          <ul class="sidebar-tool-list" role="list">
            ${getToolsByCategory(cat.id).map(tool => `
              <li>
                <a class="sidebar-tool-link" href="#${tool.path}" data-path="${tool.path}">
                  ${tool.label}
                </a>
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('')}
    </div>

    <div class="sidebar-footer">
      <img src="assets/brand/ganit.png" alt="Ganit Technology" class="sidebar-footer-logo" title="Ganit Technology · Powered by Dhurta Organisation" />
    </div>
  `;

  container.appendChild(nav);

  // Category collapse/expand
  nav.querySelectorAll('.sidebar-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
    });
  });

  // Sidebar search filter
  const searchInput = nav.querySelector('#sidebar-search');
  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    nav.querySelectorAll('.sidebar-category').forEach(catEl => {
      let anyVisible = false;
      catEl.querySelectorAll('.sidebar-tool-link').forEach(link => {
        const match = !q || link.textContent.toLowerCase().includes(q);
        link.parentElement.style.display = match ? '' : 'none';
        if (match) anyVisible = true;
      });
      catEl.style.display = anyVisible || !q ? '' : 'none';
      if (q && anyVisible) {
        const btn = catEl.querySelector('.sidebar-cat-btn');
        btn?.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Click on search redirects to command palette on mobile
  searchInput.addEventListener('focus', (e) => {
    if (window.innerWidth < 768) {
      e.target.blur();
      document.dispatchEvent(new CustomEvent('ganit:command-palette', { detail: { open: true } }));
    }
  });

  // Active link highlight
  function updateActive(path) {
    nav.querySelectorAll('.sidebar-tool-link').forEach(link => {
      const isActive = link.dataset.path === path ||
        (path?.startsWith(link.dataset.path + '/') && link.dataset.path !== '/');
      link.classList.toggle('active', isActive);
    });
  }

  router.onChange(({ path }) => updateActive(path));
  updateActive(router.current?.path || '/basic');

  // Sidebar toggle via header button
  document.addEventListener('ganit:toggle-sidebar', () => {
    document.querySelector('.app')?.classList.toggle('sidebar-collapsed');
  });

  return nav;
}
