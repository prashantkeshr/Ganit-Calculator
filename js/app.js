import { router } from './router.js';
import { themeManager } from './theme.js';
import { i18n } from './i18n.js';
import { store } from './store.js';
import { renderSidebar } from './ui/sidebar.js';
import { initCommandPalette } from './ui/command-palette.js';
import { initHistoryPanel } from './ui/history-panel.js';
import { injectFooter, BRAND } from './brand.js';
import { mathEngine } from './math-engine.js';
import './api/js-api.js';
import './keyboard.js';

// ---- Lazy calculator imports ----
const CALC_MODULES = {
  '/basic':                  () => import('./calculators/basic.js').then(m => m.renderBasic),
  '/scientific':             () => import('./calculators/scientific.js').then(m => m.renderScientific),
  '/engineering':            () => import('./calculators/engineering.js').then(m => m.renderEngineering),
  '/programmer':             () => import('./calculators/programmer.js').then(m => ({ fn: m.renderProgrammer, sub: null })),
  '/programmer/:sub':        () => import('./calculators/programmer.js').then(m => m.renderProgrammer),
  '/graph':                  () => import('./calculators/graph.js').then(m => m.renderGraph),
  '/equation/:sub':          () => import('./calculators/equation.js').then(m => m.renderEquation),
  '/financial/:sub':         () => import('./calculators/financial.js').then(m => m.renderFinancial),
  '/health/:sub':            () => import('./calculators/health.js').then(m => m.renderHealth),
  '/percentage':             () => import('./calculators/percentage.js').then(m => m.renderPercentage),
  '/area':                   () => import('./calculators/area.js').then(m => m.renderArea),
  '/volume':                 () => import('./calculators/area.js').then(m => m.renderArea),
  '/age':                    () => import('./calculators/age.js').then(m => m.renderAge),
  '/currency':               () => import('./calculators/currency.js').then(m => m.renderCurrency),
  '/matrix':                 () => import('./calculators/matrix.js').then(m => m.renderMatrix),
  '/statistics/:sub':        () => import('./calculators/statistics.js').then(m => m.renderStatistics),
  '/physics/:sub':           () => import('./calculators/physics.js').then(m => m.renderPhysics),
  '/construction/:sub':      () => import('./calculators/construction.js').then(m => m.renderConstruction),
  '/datetime/:sub':          () => import('./calculators/datetime.js').then(m => m.renderDatetime),
};

let currentCleanup = null;

async function renderCalc(path, params) {
  const main = document.getElementById('main-content');
  if (!main) return;

  // Call cleanup for previous calculator (remove keyboard listeners etc.)
  if (currentCleanup) { try { currentCleanup(); } catch {} currentCleanup = null; }

  // Update page title
  document.title = `${formatTitle(path)} — Calculator ~ by Ganit Technology`;

  // Find matching route
  let loader = null;
  for (const [pattern, mod] of Object.entries(CALC_MODULES)) {
    if (matchPattern(pattern, path)) { loader = mod; break; }
  }

  if (!loader) {
    // Default to basic
    loader = CALC_MODULES['/basic'];
  }

  // Loading state
  main.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>Loading…</p></div>';

  try {
    const renderFn = await loader();
    main.innerHTML = '';
    const sub = params?.sub || null;

    if (typeof renderFn === 'function') {
      await renderFn(main, sub);
    } else if (renderFn?.fn) {
      await renderFn.fn(main, sub);
    }
    currentCleanup = main._cleanup || null;
  } catch (err) {
    console.error('Failed to load calculator:', err);
    main.innerHTML = `<div class="error-page"><h2>Could not load tool</h2><p>${err.message}</p><a href="#/" class="btn btn-calc-primary">Go Home</a></div>`;
  }
}

function matchPattern(pattern, path) {
  const pp = pattern.split('/'), pathP = path.split('/');
  if (pp.length !== pathP.length) return false;
  return pp.every((seg, i) => seg.startsWith(':') || seg === pathP[i]);
}

function formatTitle(path) {
  const parts = path.split('/').filter(Boolean);
  if (!parts.length) return 'Basic Calculator';
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

async function boot() {
  // Show splash for 1.2s
  const splash = document.getElementById('splash');
  const app    = document.getElementById('app');

  // Apply theme
  themeManager.apply();

  // Load locale
  await i18n.setLocale(i18n.locale);

  // Apply angle mode to math engine
  mathEngine.setMode(store.get('angleMode') || 'DEG');

  // Render sidebar
  const sidebarContainer = document.getElementById('sidebar-container');
  if (sidebarContainer) renderSidebar(sidebarContainer);

  // Init command palette & history
  initCommandPalette();
  initHistoryPanel();

  // Init header actions
  const histBtn = document.getElementById('header-history');
  if (histBtn) {
    histBtn.addEventListener('click', () =>
      document.dispatchEvent(new CustomEvent('ganit:toggle-history', { detail: { open: true } })));
  }

  const themeBtn = document.getElementById('header-theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = themeManager.cycle();
      themeBtn.title = `Theme: ${next.label}`;
    });
  }

  const kbBtn = document.getElementById('header-kbd');
  if (kbBtn) {
    kbBtn.addEventListener('click', () =>
      document.dispatchEvent(new CustomEvent('ganit:command-palette', { detail: { open: true } })));
  }

  const searchBtn = document.getElementById('header-search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () =>
      document.dispatchEvent(new CustomEvent('ganit:command-palette', { detail: { open: true } })));
  }

  const sidebarToggle = document.getElementById('header-sidebar-toggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () =>
      document.dispatchEvent(new CustomEvent('ganit:toggle-sidebar')));
  }

  // Listen for close-overlays (Escape)
  document.addEventListener('ganit:close-overlays', () => {
    document.dispatchEvent(new CustomEvent('ganit:toggle-history', { detail: { open: false } }));
  });

  // Register routes
  router
    .on('/', ({ params }) => renderCalc('/basic', params))
    .on('/basic', ({ params }) => renderCalc('/basic', params))
    .on('/scientific', ({ params }) => renderCalc('/scientific', params))
    .on('/engineering', ({ params }) => renderCalc('/engineering', params))
    .on('/programmer', ({ params }) => renderCalc('/programmer', { ...params, sub: 'base-converter' }))
    .on('/programmer/:sub', ({ params }) => renderCalc('/programmer/:sub', params))
    .on('/graph', ({ params }) => renderCalc('/graph', params))
    .on('/equation/:sub', ({ params }) => renderCalc('/equation/:sub', params))
    .on('/equation', ({ params }) => renderCalc('/equation/:sub', { ...params, sub: 'linear' }))
    .on('/financial/:sub', ({ params }) => renderCalc('/financial/:sub', params))
    .on('/financial', ({ params }) => renderCalc('/financial/:sub', { ...params, sub: 'loan' }))
    .on('/health/:sub', ({ params }) => renderCalc('/health/:sub', params))
    .on('/health', ({ params }) => renderCalc('/health/:sub', { ...params, sub: 'bmi' }))
    .on('/percentage', ({ params }) => renderCalc('/percentage', params))
    .on('/area', ({ params }) => renderCalc('/area', params))
    .on('/volume', ({ params }) => renderCalc('/volume', params))
    .on('/age', ({ params }) => renderCalc('/age', params))
    .on('/currency', ({ params }) => renderCalc('/currency', params))
    .on('/matrix', ({ params }) => renderCalc('/matrix', params))
    .on('/statistics/:sub', ({ params }) => renderCalc('/statistics/:sub', params))
    .on('/statistics', ({ params }) => renderCalc('/statistics/:sub', { ...params, sub: 'descriptive' }))
    .on('/physics/:sub', ({ params }) => renderCalc('/physics/:sub', params))
    .on('/physics', ({ params }) => renderCalc('/physics/:sub', { ...params, sub: 'kinematics' }))
    .on('/construction/:sub', ({ params }) => renderCalc('/construction/:sub', params))
    .on('/construction', ({ params }) => renderCalc('/construction/:sub', { ...params, sub: 'concrete' }))
    .on('/datetime/:sub', ({ params }) => renderCalc('/datetime/:sub', params))
    .on('/datetime', ({ params }) => renderCalc('/datetime/:sub', { ...params, sub: 'diff' }))
    .on('/about', () => renderAbout())
    .on('/privacy', () => renderPrivacy());

  // Show app, hide splash
  setTimeout(() => {
    if (splash) splash.classList.add('hidden');
    if (app) app.classList.remove('hidden');
    router.start();
  }, 800);

  // Register SW
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  }
}

function renderAbout() {
  const main = document.getElementById('main-content');
  document.title = 'About — Calculator ~ by Ganit Technology';
  main.innerHTML = `
    <div class="about-page">
      <div class="about-hero">
        <img src="assets/brand/ganit.png" alt="Ganit Technology" class="about-logo-img" />
        <h1>Calculator ~ by Ganit Technology</h1>
        <p class="about-tagline">${BRAND.tagline}</p>
        <div class="version-badge">v${BRAND.version}</div>
      </div>
      <div class="about-content">
        <section>
          <h2>About Ganit Technology</h2>
          <p>Ganit Technology (from Sanskrit <em>gaṇita</em>, meaning mathematics) builds tools that make complex calculations accessible to everyone. Calculator is our flagship product — a universal, privacy-first calculator that runs entirely in your browser.</p>
        </section>
        <section>
          <h2>Powered by Dhurta Organisation</h2>
          <p><a href="${BRAND.links.parent}" target="_blank" rel="noopener">Dhurta Organisation</a> is committed to building open, educational technology for the world. This project is part of the Dhurta ecosystem alongside <a href="https://dhurta.org/veda" target="_blank" rel="noopener">VEDA</a> and <a href="https://dhurta.org/kernal" target="_blank" rel="noopener">KERNAL</a>.</p>
        </section>
        <section>
          <h2>Features</h2>
          <ul>
            <li>45+ calculators across 18 categories</li>
            <li>100% offline after first load (PWA)</li>
            <li>No tracking, no ads, no data collection</li>
            <li>Full JavaScript API (window.Ganit)</li>
            <li>Web Component: &lt;ganit-calc&gt;</li>
            <li>24 languages with RTL support</li>
            <li>15+ themes including Ganit brand theme</li>
          </ul>
        </section>
        <section>
          <h2>Open Source</h2>
          <p>Calculator is open source under the <strong>MIT License</strong>.</p>
          <p>${BRAND.copyright}</p>
          <a href="${BRAND.links.github}" class="btn btn-calc-primary" target="_blank" rel="noopener">View on GitHub</a>
        </section>
      </div>
    </div>
  `;
}

function renderPrivacy() {
  const main = document.getElementById('main-content');
  document.title = 'Privacy — Calculator ~ by Ganit Technology';
  main.innerHTML = `
    <div class="privacy-page">
      <h1>Privacy Pledge</h1>
      <div class="privacy-pledge">
        <p>Calculator ~ by Ganit Technology <strong>never collects, transmits, or sells your data.</strong> Everything runs in your browser. Verified by design.</p>
        <p>Powered by Dhurta Organisation.</p>
      </div>
      <h2>What we do</h2>
      <ul>
        <li>✅ Store your calculation history locally in your browser (IndexedDB)</li>
        <li>✅ Store your preferences (theme, locale, precision) in localStorage</li>
        <li>✅ Cache the app for offline use (Service Worker)</li>
      </ul>
      <h2>What we don't do</h2>
      <ul>
        <li>❌ Send any data to servers</li>
        <li>❌ Use cookies (except functional storage)</li>
        <li>❌ Load any third-party tracking scripts</li>
        <li>❌ Show advertisements</li>
        <li>❌ Require any login or account</li>
        <li>❌ Access your camera, microphone, or location</li>
      </ul>
      <p><strong>Your calculations stay on your device. Always.</strong></p>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', boot);
