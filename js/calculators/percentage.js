import { history } from '../history.js';

function fmt(n) {
  if (n == null || !isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs === 0) return '0';
  if (abs < 0.001 || abs >= 1e10) return n.toPrecision(6).replace(/\.?0+$/, '');
  return parseFloat(n.toPrecision(10)).toString();
}

/**
 * Each tool defines:
 *  vars   – ordered list of variables in the equation
 *  defaults – initial values
 *  solve(known) – given an object where exactly one key is null, return { id, value, label }
 *                 OR if none are null, solve for the last var
 */
const TOOLS = [
  {
    id: 'of',
    label: '% of a Number',
    equation: 'X% of N = A',
    hint: 'Leave any one field blank — it will be computed.',
    vars: [
      { id: 'x', label: 'Percentage (X)', suffix: '%', min: null },
      { id: 'n', label: 'Number (N)' },
      { id: 'a', label: 'Result (A)' },
    ],
    defaults: { x: 15, n: 250, a: '' },
    solve(v) {
      const { x, n, a } = v;
      if (x == null) return { id: 'x', value: (a / n) * 100,  label: `A ÷ N × 100 = ${fmt((a/n)*100)}%`, unit: '%' };
      if (n == null) return { id: 'n', value: a / (x / 100),  label: `A ÷ (X/100) = ${fmt(a/(x/100))}` };
      return               { id: 'a', value: (x / 100) * n,   label: `X/100 × N = ${fmt((x/100)*n)}` };
    },
  },
  {
    id: 'change',
    label: 'Percentage Change',
    equation: '(B − A) ÷ A × 100 = C%',
    hint: 'Leave any one field blank — it will be computed.',
    vars: [
      { id: 'a', label: 'Original Value (A)' },
      { id: 'b', label: 'New Value (B)' },
      { id: 'c', label: 'Change (C)', suffix: '%' },
    ],
    defaults: { a: 80, b: 100, c: '' },
    solve(v) {
      const { a, b, c } = v;
      if (a == null) return { id: 'a', value: b / (1 + c / 100),     label: `B ÷ (1 + C/100)`, unit: '' };
      if (b == null) return { id: 'b', value: a * (1 + c / 100),     label: `A × (1 + C/100)`, unit: '' };
      return               { id: 'c', value: ((b - a) / a) * 100,    label: `(B−A) ÷ A × 100`, unit: '%' };
    },
  },
  {
    id: 'discount',
    label: 'Discount',
    equation: 'Price × (1 − D/100) = Final',
    hint: 'Leave any one field blank — it will be computed.',
    vars: [
      { id: 'p', label: 'Original Price', prefix: '$' },
      { id: 'd', label: 'Discount (D)', suffix: '%' },
      { id: 'f', label: 'Final Price', prefix: '$' },
    ],
    defaults: { p: 120, d: 20, f: '' },
    solve(v) {
      const { p, d, f } = v;
      if (p == null) return { id: 'p', value: f / (1 - d / 100), label: `Final ÷ (1−D/100)`, prefix: '$' };
      if (d == null) return { id: 'd', value: (1 - f / p) * 100, label: `(1 − Final/Price) × 100`, unit: '%' };
      const saving = p * d / 100;
      return { id: 'f', value: p - saving, label: `Price − Saving`, prefix: '$', extra: `You save: $${fmt(saving)}` };
    },
  },
  {
    id: 'markup',
    label: 'Markup / Margin',
    equation: 'Cost × (1 + M/100) = Price',
    hint: 'Leave any one field blank — it will be computed.',
    vars: [
      { id: 'c', label: 'Cost', prefix: '$' },
      { id: 'm', label: 'Markup (M)', suffix: '%' },
      { id: 'p', label: 'Selling Price', prefix: '$' },
    ],
    defaults: { c: 60, m: 40, p: '' },
    solve(v) {
      const { c, m, p } = v;
      if (c == null) return { id: 'c', value: p / (1 + m / 100), label: `Price ÷ (1+M/100)`, prefix: '$' };
      if (m == null) return { id: 'm', value: (p / c - 1) * 100,  label: `(Price/Cost − 1) × 100`, unit: '%' };
      const margin = ((p - c) / p) * 100;
      return { id: 'p', value: c * (1 + m / 100), label: `Cost × (1+M/100)`, prefix: '$',
               extra: `Gross margin: ${fmt(((c*(1+m/100)-c)/(c*(1+m/100)))*100)}%` };
    },
  },
  {
    id: 'tax',
    label: 'Tax Calculator',
    equation: 'Price × (1 + T/100) = Total',
    hint: 'Leave any one field blank — it will be computed.',
    vars: [
      { id: 'p', label: 'Pre-tax Price', prefix: '$' },
      { id: 't', label: 'Tax Rate (T)', suffix: '%' },
      { id: 'o', label: 'Total (after tax)', prefix: '$' },
    ],
    defaults: { p: 100, t: 8.5, o: '' },
    solve(v) {
      const { p, t, o } = v;
      if (p == null) return { id: 'p', value: o / (1 + t / 100),   label: `Total ÷ (1+T/100)`, prefix: '$' };
      if (t == null) return { id: 't', value: (o / p - 1) * 100,   label: `(Total/Price − 1) × 100`, unit: '%' };
      const tax = p * t / 100;
      return { id: 'o', value: p + tax, label: `Price + Tax`, prefix: '$', extra: `Tax amount: $${fmt(tax)}` };
    },
  },
  {
    id: 'tip',
    label: 'Tip Calculator',
    equation: 'Bill + Bill × T/100 = Total',
    hint: 'Leave any one field blank — it will be computed.',
    vars: [
      { id: 'b', label: 'Bill Amount', prefix: '$' },
      { id: 't', label: 'Tip %', suffix: '%' },
      { id: 's', label: 'Split (people)', min: 1 },
    ],
    defaults: { b: 85, t: 18, s: 2 },
    solve(v) {
      const { b, t, s } = v;
      const tipAmt  = b * (t ?? 18) / 100;
      const total   = b + tipAmt;
      return { id: 's', value: total / (s || 1), label: `Total ÷ People`,
               extra: `Tip: $${fmt(tipAmt)} | Total: $${fmt(total)}` };
    },
  },
  {
    id: 'increase',
    label: 'Percentage Increase',
    equation: 'A × (1 + P/100) = B',
    hint: 'Leave any one field blank — it will be computed.',
    vars: [
      { id: 'a', label: 'Original Value (A)' },
      { id: 'p', label: 'Increase % (P)', suffix: '%' },
      { id: 'b', label: 'Increased Value (B)' },
    ],
    defaults: { a: 100, p: 15, b: '' },
    solve(v) {
      const { a, p, b } = v;
      if (a == null) return { id: 'a', value: b / (1 + p / 100), label: `B ÷ (1+P/100)` };
      if (p == null) return { id: 'p', value: (b / a - 1) * 100, label: `(B/A − 1) × 100`, unit: '%' };
      return               { id: 'b', value: a * (1 + p / 100),  label: `A × (1+P/100)` };
    },
  },
  {
    id: 'decrease',
    label: 'Percentage Decrease',
    equation: 'A × (1 − P/100) = B',
    hint: 'Leave any one field blank — it will be computed.',
    vars: [
      { id: 'a', label: 'Original Value (A)' },
      { id: 'p', label: 'Decrease % (P)', suffix: '%' },
      { id: 'b', label: 'Decreased Value (B)' },
    ],
    defaults: { a: 100, p: 15, b: '' },
    solve(v) {
      const { a, p, b } = v;
      if (a == null) return { id: 'a', value: b / (1 - p / 100), label: `B ÷ (1−P/100)` };
      if (p == null) return { id: 'p', value: (1 - b / a) * 100, label: `(1 − B/A) × 100`, unit: '%' };
      return               { id: 'b', value: a * (1 - p / 100),  label: `A × (1−P/100)` };
    },
  },
];

function buildToolUI(container, tool) {
  const values = { ...tool.defaults };

  function getBlank() {
    return tool.vars.find(v => values[v.id] === '' || values[v.id] == null);
  }

  function compute() {
    const blank = getBlank();
    const known = {};
    tool.vars.forEach(v => {
      known[v.id] = (v.id === blank?.id) ? null : parseFloat(values[v.id]);
    });
    if (blank) {
      // Check all knowns are valid numbers
      const allValid = tool.vars.filter(v => v.id !== blank.id).every(v => isFinite(known[v.id]));
      if (!allValid) return null;
    }
    try {
      return tool.solve(known);
    } catch { return null; }
  }

  function renderResult() {
    const resEl = container.querySelector('.pct-result');
    if (!resEl) return;
    const r = compute();
    if (!r) { resEl.innerHTML = ''; return; }

    const prefix = r.prefix || '';
    const unit   = r.unit !== undefined ? r.unit : (tool.vars.find(v => v.id === r.id)?.suffix || '');
    const solvedVar = tool.vars.find(v => v.id === r.id);

    resEl.innerHTML = `
      <div class="pct-result-card">
        <div class="pct-result-label">Solving for <strong>${solvedVar?.label || r.id}</strong></div>
        <div class="pct-result-value">${prefix}${fmt(r.value)}${unit}</div>
        ${r.extra ? `<div class="pct-result-extra">${r.extra}</div>` : ''}
        <div class="pct-result-formula">${r.label}</div>
      </div>
    `;

    // Auto-fill the solved field's display
    const inp = container.querySelector(`[data-var="${r.id}"]`);
    if (inp && inp !== document.activeElement) {
      inp.placeholder = `${prefix}${fmt(r.value)}${unit}`;
    }
  }

  function renderSolveHighlight() {
    const blank = getBlank();
    container.querySelectorAll('.pct-var-row').forEach(row => {
      const isBlank = row.dataset.var === blank?.id;
      row.classList.toggle('solving-for', isBlank);
    });
  }

  // Build HTML
  const fieldsHtml = tool.vars.map(v => `
    <div class="pct-var-row" data-var="${v.id}">
      <label class="pct-var-label">${v.label}</label>
      <div class="pct-var-input-wrap has-steppers">
        ${v.prefix ? `<span class="input-prefix">${v.prefix}</span>` : ''}
        <button type="button" class="pct-step-btn pct-step-dn" tabindex="-1" aria-label="Decrease">−</button>
        <input
          type="text"
          inputmode="decimal"
          class="pct-input"
          data-var="${v.id}"
          value="${values[v.id] !== '' ? values[v.id] : ''}"
          placeholder="${values[v.id] === '' ? 'blank → auto-computed' : ''}"
        />
        <button type="button" class="pct-step-btn pct-step-up" tabindex="-1" aria-label="Increase">+</button>
        ${v.suffix ? `<span class="input-suffix">${v.suffix}</span>` : ''}
      </div>
    </div>
  `).join('');

  const formEl = container.querySelector('.pct-tool-form');
  formEl.innerHTML = `
    <div class="pct-equation">${tool.equation}</div>
    <p class="pct-hint">${tool.hint}</p>
    <div class="pct-fields">${fieldsHtml}</div>
    <div class="pct-result"></div>
  `;

  // Wire inputs
  formEl.querySelectorAll('.pct-input').forEach(inp => {
    inp.addEventListener('input', () => {
      const id = inp.dataset.var;
      values[id] = inp.value.trim() === '' ? '' : inp.value;
      renderSolveHighlight();
      renderResult();
    });
    // Scroll wheel to increment
    inp.addEventListener('wheel', (e) => {
      if (document.activeElement !== inp) return;
      e.preventDefault();
      const step = parseFloat(inp.step) || 1;
      const cur  = parseFloat(inp.value) || 0;
      inp.value  = cur + (e.deltaY < 0 ? step : -step);
      inp.dispatchEvent(new Event('input'));
    }, { passive: false });
  });

  renderSolveHighlight();
  renderResult();
}

export function renderPercentage(container) {
  let activeTool = TOOLS[0];

  container.innerHTML = `
    <div class="calc-percentage">
      <div class="pct-tool-tabs">
        ${TOOLS.map(t => `
          <button class="pct-tab-btn ${t === activeTool ? 'active' : ''}" data-id="${t.id}">
            ${t.label}
          </button>
        `).join('')}
      </div>
      <div class="pct-tool-form form-body"></div>
    </div>
  `;

  container.querySelectorAll('.pct-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTool = TOOLS.find(t => t.id === btn.dataset.id) || TOOLS[0];
      container.querySelectorAll('.pct-tab-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.id === activeTool.id));
      buildToolUI(container, activeTool);
    });
  });

  buildToolUI(container, activeTool);
}
