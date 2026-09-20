/* ======================================================
   Ganit Calculator — Web Component
   <ganit-calc type="basic"> / <omni-calc type="scientific">
   Calculator ~ by Ganit Technology | Dhurta Organisation
   ====================================================== */

const IFRAME_ORIGIN = location.origin;

const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
<style>
  :host {
    display: block;
    border: 1px solid #334155;
    border-radius: 12px;
    overflow: hidden;
    font-family: system-ui, sans-serif;
    background: #0F172A;
    min-width: 280px;
  }
  .wc-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px;
    background: #1E293B;
    border-bottom: 1px solid #334155;
    font-size: 0.75rem; color: #94A3B8;
  }
  .wc-brand { font-weight: 700; color: #4F46E5; }
  .wc-body  { padding: 12px; }
  .wc-input {
    width: 100%; padding: 10px 12px;
    background: #0F172A; border: 1px solid #334155;
    border-radius: 8px; color: #E2E8F0;
    font-size: 1rem; font-family: 'Courier New', monospace;
    box-sizing: border-box;
  }
  .wc-input:focus { outline: none; border-color: #4F46E5; }
  .wc-result {
    margin-top: 8px; padding: 8px 12px;
    background: #1E293B; border-radius: 8px;
    font-size: 1.25rem; font-weight: 700; font-family: 'Courier New', monospace;
    color: #4F46E5; min-height: 2rem; word-break: break-all;
  }
  .wc-error { color: #EF4444; font-size: 0.875rem; }
  .wc-footer { font-size: 0.7rem; color: #475569; text-align: right; padding: 4px 12px 8px; }
</style>
<div class="wc-header">
  <span class="wc-brand">Calculator</span>
  <span>by Ganit Technology</span>
</div>
<div class="wc-body">
  <input class="wc-input" type="text" placeholder="Enter expression…" autocomplete="off" spellcheck="false" />
  <div class="wc-result" aria-live="polite"></div>
</div>
<div class="wc-footer">Powered by Dhurta Organisation · BETA v0.1.0</div>
`;

class GanitCalc extends HTMLElement {
  static get observedAttributes() {
    return ['type', 'theme', 'expression'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));
    this._input  = this.shadowRoot.querySelector('.wc-input');
    this._result = this.shadowRoot.querySelector('.wc-result');
  }

  connectedCallback() {
    this._input.addEventListener('input', () => this._evaluate());
    this._input.addEventListener('keydown', e => {
      if (e.key === 'Enter') this._evaluate(true);
    });
    const expr = this.getAttribute('expression');
    if (expr) { this._input.value = expr; this._evaluate(); }
  }

  attributeChangedCallback(name, _old, value) {
    if (name === 'expression' && this._input) {
      this._input.value = value;
      this._evaluate();
    }
  }

  _evaluate(commit = false) {
    const expr = this._input.value.trim();
    if (!expr) { this._result.textContent = ''; return; }

    try {
      if (window.Ganit) {
        const r = window.Ganit.tryEvaluate ? window.Ganit.tryEvaluate(expr) : window.Ganit.evaluate(expr);
        if (r && r.result !== undefined) {
          this._result.className = 'wc-result';
          this._result.textContent = r.formatted ?? r.result;
          if (commit) this.dispatchEvent(new CustomEvent('ganit-result', { detail: r, bubbles: true }));
          return;
        }
      }
      // Fallback: simple eval replacement via shunting-yard if API not loaded
      this._result.className = 'wc-result';
      this._result.textContent = '…';
    } catch (err) {
      this._result.className = 'wc-result wc-error';
      this._result.textContent = 'Error';
    }
  }

  get value()  { return this._input?.value ?? ''; }
  set value(v) { if (this._input) { this._input.value = v; this._evaluate(); } }
}

// ---- Iframe embed bridge ----
class OmniCalc extends GanitCalc {}

if (!customElements.get('ganit-calc')) {
  customElements.define('ganit-calc', GanitCalc);
}
if (!customElements.get('omni-calc')) {
  customElements.define('omni-calc', OmniCalc);
}

// ---- PostMessage bridge for iframes ----
window.addEventListener('message', (event) => {
  if (event.origin !== IFRAME_ORIGIN && event.origin !== '*') return;
  const { id, method, params } = event.data || {};
  if (!method || !window.Ganit) return;

  let result;
  try {
    const parts = method.split('.');
    let fn = window.Ganit;
    parts.forEach(p => { fn = fn?.[p]; });
    result = typeof fn === 'function' ? fn(...(params || [])) : { error: 'Method not found' };
  } catch (e) {
    result = { error: e.message };
  }

  event.source?.postMessage({ id, result }, event.origin || '*');
});
