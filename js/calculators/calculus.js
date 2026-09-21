import { mathEngine } from '../math-engine.js';
import { history } from '../history.js';

/* ── helpers ──────────────────────────────────────────────────── */
const fmt = (n, dp = 8) => {
  if (n === null || n === undefined || Number.isNaN(n)) return 'undefined';
  if (!isFinite(n)) return n > 0 ? '+∞' : '−∞';
  return mathEngine.formatResult(n, { precision: dp });
};

function evalF(expr, x) {
  // Calculus operates in radians regardless of the global angle mode
  const prev = mathEngine.mode;
  if (prev !== 'RAD') mathEngine.setMode('RAD');
  try {
    return mathEngine.evaluate(expr, { x });
  } finally {
    if (prev !== 'RAD') mathEngine.setMode(prev);
  }
}

function makeFn(expr) {
  return (x) => evalF(expr, x);
}

/* ── numerical differentiation (5-point stencil) ─────────────── */
function d1(f, x, h = 1e-5) {
  return (-f(x + 2*h) + 8*f(x + h) - 8*f(x - h) + f(x - 2*h)) / (12*h);
}
function d2(f, x, h = 1e-4) {
  return (-f(x + 2*h) + 16*f(x + h) - 30*f(x) + 16*f(x - h) - f(x - 2*h)) / (12*h*h);
}
function d3(f, x, h = 1e-3) {
  return (f(x + 2*h) - 2*f(x + h) + 2*f(x - h) - f(x - 2*h)) / (2*h*h*h);
}
function d4(f, x, h = 1e-2) {
  return (f(x + 2*h) - 4*f(x + h) + 6*f(x) - 4*f(x - h) + f(x - 2*h)) / (h*h*h*h);
}

/* ── numerical integration ────────────────────────────────────── */
function trapezoid(f, a, b, n) {
  const h = (b - a) / n;
  let s = (f(a) + f(b)) * 0.5;
  for (let i = 1; i < n; i++) s += f(a + i * h);
  return s * h;
}
function simpsons(f, a, b, n) {
  if (n % 2 !== 0) n++;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
  return s * h / 3;
}
function gauss5(f, a, b) {
  const t = [-0.90617984593866, -0.53846931010568, 0, 0.53846931010568, 0.90617984593866];
  const w = [ 0.23692688505618,  0.47862867049937, 0.56888888888889, 0.47862867049937, 0.23692688505618];
  const mid = (a + b) / 2, half = (b - a) / 2;
  return half * t.reduce((s, ti, i) => s + w[i] * f(mid + half * ti), 0);
}
// Adaptive Gauss-Kronrod (G7K15) for better accuracy estimate
function adaptiveGK(f, a, b) {
  const gk = [-0.9914553,-0.9491079,-0.8648644,-0.7415312,-0.5860872,-0.4058452,-0.2077849,
               0,0.2077849,0.4058452,0.5860872,0.7415312,0.8648644,0.9491079,0.9914553];
  const wk = [0.02293532,0.06309209,0.10479001,0.14065325,0.16900472,0.19035057,0.20443294,
               0.20948214,0.20443294,0.19035057,0.16900472,0.14065325,0.10479001,0.06309209,0.02293532];
  const mid = (a + b) / 2, half = (b - a) / 2;
  return half * gk.reduce((s, ti, i) => s + wk[i] * f(mid + half * ti), 0);
}

/* ── Taylor series ────────────────────────────────────────────── */
function taylorTerms(f, a, n) {
  const derivFns = [
    (x) => f(x),
    (x) => d1(f, x),
    (x) => d2(f, x),
    (x) => d3(f, x),
    (x) => d4(f, x),
  ];
  const terms = [];
  let fact = 1;
  for (let k = 0; k <= n; k++) {
    if (k > 0) fact *= k;
    let dk;
    if (k < derivFns.length) {
      dk = derivFns[k](a);
    } else {
      dk = higherDeriv(f, a, k);
    }
    const coeff = dk / fact;
    terms.push({ k, dk, fact, coeff });
  }
  return terms;
}

function higherDeriv(f, x, n, h = 0.05) {
  let s = 0;
  for (let k = 0; k <= n; k++) {
    const sign = ((n - k) % 2 === 0) ? 1 : -1;
    s += sign * binomial(n, k) * f(x + k * h);
  }
  return s / Math.pow(h, n);
}

function binomial(n, k) {
  if (k === 0 || k === n) return 1;
  let r = 1;
  for (let i = 0; i < k; i++) { r *= (n - i); r /= (i + 1); }
  return r;
}

function evalTaylor(terms, a, x) {
  return terms.reduce((s, { k, coeff }) => s + coeff * Math.pow(x - a, k), 0);
}

/* ── term display helper ──────────────────────────────────────── */
function termStr(coeff, k, a) {
  if (Math.abs(coeff) < 1e-14) return null;
  const c = fmt(coeff, 5);
  if (k === 0) return c;
  const xpart = a === 0
    ? (k === 1 ? 'x' : `x<sup>${k}</sup>`)
    : (k === 1 ? `(x − ${a})` : `(x − ${a})<sup>${k}</sup>`);
  return `${c}·${xpart}`;
}

/* ── UI builder helpers ────────────────────────────────────────── */
function funcRow(id, label, placeholder, value = '') {
  return `
    <div class="form-row">
      <label for="${id}">${label}</label>
      <input type="text" id="${id}" class="calc-input-expr" placeholder="${placeholder}" value="${value}" spellcheck="false" autocomplete="off">
    </div>`;
}
function numRow(id, label, value, step = 'any') {
  return `
    <div class="form-row">
      <label for="${id}">${label}</label>
      <input type="number" id="${id}" value="${value}" step="${step}">
    </div>`;
}

/* ══ DERIVATIVE TAB ══════════════════════════════════════════════ */
function renderDerivative(el) {
  el.innerHTML = `
    <div class="calculus-info">
      <p>Computes <strong>f′(x₀), f″(x₀), f‴(x₀)</strong> numerically using a 5-point stencil and displays a derivative table around the point.</p>
    </div>
    <form id="deriv-form">
      ${funcRow('deriv-expr', 'f(x)', 'sin(x) + x^2', 'sin(x)')}
      ${numRow('deriv-x', 'x₀ (evaluate at)', '0')}
      <button type="submit" class="btn btn-calc-primary">Differentiate</button>
    </form>
    <div id="deriv-result" class="calc-output"></div>
  `;

  el.querySelector('#deriv-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const expr = el.querySelector('#deriv-expr').value.trim();
    const x0 = parseFloat(el.querySelector('#deriv-x').value);
    const out = el.querySelector('#deriv-result');

    if (!expr) { out.innerHTML = '<div class="error">Enter a function f(x).</div>'; return; }
    if (isNaN(x0)) { out.innerHTML = '<div class="error">Enter a numeric x₀ value.</div>'; return; }

    try {
      const f = makeFn(expr);
      // Test parse
      f(x0);

      const fx  = f(x0);
      const f1  = d1(f, x0);
      const f2  = d2(f, x0);
      const f3  = d3(f, x0);
      const f4  = d4(f, x0);

      // Derivative table: x0-2h ... x0+2h
      const step = Math.max(0.1, Math.abs(x0) * 0.2 || 0.5);
      const pts  = [-2,-1,0,1,2].map(k => x0 + k * step);
      const tableRows = pts.map(xi => {
        try { return `<tr><td>${fmt(xi,4)}</td><td>${fmt(f(xi),6)}</td><td>${fmt(d1(f,xi),6)}</td></tr>`; }
        catch { return `<tr><td>${fmt(xi,4)}</td><td>—</td><td>—</td></tr>`; }
      }).join('');

      out.innerHTML = `
        <div class="result-grid">
          <div class="result-card"><div class="result-label">f(x₀)</div><div class="result-value">${fmt(fx)}</div></div>
          <div class="result-card accent"><div class="result-label">f′(x₀)</div><div class="result-value">${fmt(f1)}</div></div>
          <div class="result-card"><div class="result-label">f″(x₀)</div><div class="result-value">${fmt(f2)}</div></div>
          <div class="result-card"><div class="result-label">f‴(x₀)</div><div class="result-value">${fmt(f3)}</div></div>
          <div class="result-card"><div class="result-label">f⁴(x₀)</div><div class="result-value">${fmt(f4)}</div></div>
        </div>
        <div class="calc-section-title">Derivative table near x₀ = ${x0}</div>
        <table class="calc-table">
          <thead><tr><th>x</th><th>f(x)</th><th>f′(x)</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        <div class="calc-note">Method: 5-point central-difference stencil (O(h⁴) accuracy)</div>
      `;
      history.add({ category: 'calculus', tool: 'derivative', expr, x0, f1, f2 });
    } catch (err) {
      out.innerHTML = `<div class="error">${err.message}</div>`;
    }
  });
}

/* ══ INTEGRATION TAB ═════════════════════════════════════════════ */
function renderIntegral(el) {
  el.innerHTML = `
    <div class="calculus-info">
      <p>Approximates <strong>∫<sub>a</sub><sup>b</sup> f(x) dx</strong> using three methods: Trapezoidal, Simpson's ⅓ rule, and Gauss-Kronrod adaptive quadrature.</p>
    </div>
    <form id="int-form">
      ${funcRow('int-expr', 'f(x)', 'sin(x)', 'sin(x)')}
      ${numRow('int-a', 'Lower limit a', '0')}
      ${numRow('int-b', 'Upper limit b', String(Math.PI.toFixed(6)))}
      ${numRow('int-n', 'Subintervals n', '1000', '2')}
      <button type="submit" class="btn btn-calc-primary">Integrate</button>
    </form>
    <div id="int-result" class="calc-output"></div>
  `;

  el.querySelector('#int-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const expr = el.querySelector('#int-expr').value.trim();
    const a = parseFloat(el.querySelector('#int-a').value);
    const b = parseFloat(el.querySelector('#int-b').value);
    const n = Math.max(2, Math.floor(parseFloat(el.querySelector('#int-n').value) || 1000));
    const out = el.querySelector('#int-result');

    if (!expr) { out.innerHTML = '<div class="error">Enter a function f(x).</div>'; return; }
    if (isNaN(a) || isNaN(b)) { out.innerHTML = '<div class="error">Enter numeric limits a and b.</div>'; return; }
    if (a === b) { out.innerHTML = '<div class="result-grid"><div class="result-card"><div class="result-label">∫ f(x) dx</div><div class="result-value">0</div></div></div>'; return; }

    try {
      const f = makeFn(expr);
      f((a + b) / 2); // parse test

      const t  = trapezoid(f, a, b, n);
      const s  = simpsons(f, a, b, n);
      const gk = adaptiveGK(f, a, b);
      const g5 = gauss5(f, a, b);
      const err = Math.abs(s - gk);
      const best = gk;

      out.innerHTML = `
        <div class="result-grid">
          <div class="result-card accent"><div class="result-label">Best estimate (G-K)</div><div class="result-value">${fmt(best)}</div></div>
          <div class="result-card"><div class="result-label">Simpson's ⅓ (n=${n})</div><div class="result-value">${fmt(s)}</div></div>
          <div class="result-card"><div class="result-label">Trapezoidal (n=${n})</div><div class="result-value">${fmt(t)}</div></div>
          <div class="result-card"><div class="result-label">Gauss 5-point</div><div class="result-value">${fmt(g5)}</div></div>
          <div class="result-card"><div class="result-label">Est. error (|S − GK|)</div><div class="result-value">${err < 1e-12 ? '< 1e-12' : fmt(err, 4)}</div></div>
        </div>
        <div class="calc-note">
          Integrating <strong>${expr}</strong> from <em>a</em> = ${a} to <em>b</em> = ${fmt(b, 6)}
        </div>
      `;
      history.add({ category: 'calculus', tool: 'integral', expr, a, b, n, result: best });
    } catch (err) {
      out.innerHTML = `<div class="error">${err.message}</div>`;
    }
  });
}

/* ══ TAYLOR SERIES TAB ═══════════════════════════════════════════ */
function renderTaylor(el) {
  el.innerHTML = `
    <div class="calculus-info">
      <p>Expands <strong>f(x)</strong> as a Taylor series around <em>x = a</em> up to the <em>n</em>-th term and evaluates it at a given point.</p>
    </div>
    <form id="taylor-form">
      ${funcRow('tay-expr', 'f(x)', 'sin(x)', 'sin(x)')}
      ${numRow('tay-a', 'Center a', '0')}
      ${numRow('tay-n', 'Number of terms', '6', '1')}
      ${numRow('tay-x', 'Evaluate series at x', '1')}
      <button type="submit" class="btn btn-calc-primary">Expand</button>
    </form>
    <div id="taylor-result" class="calc-output"></div>
  `;

  el.querySelector('#taylor-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const expr = el.querySelector('#tay-expr').value.trim();
    const a = parseFloat(el.querySelector('#tay-a').value);
    const n = Math.min(12, Math.max(1, Math.floor(parseFloat(el.querySelector('#tay-n').value) || 6)));
    const x = parseFloat(el.querySelector('#tay-x').value);
    const out = el.querySelector('#taylor-result');

    if (!expr) { out.innerHTML = '<div class="error">Enter a function f(x).</div>'; return; }
    if (isNaN(a)) { out.innerHTML = '<div class="error">Enter a numeric center a.</div>'; return; }

    try {
      const f = makeFn(expr);
      f(a); // parse test

      const terms  = taylorTerms(f, a, n);
      const approx = evalTaylor(terms, a, x);
      let exact;
      try { exact = f(x); } catch { exact = null; }
      const err = exact !== null ? Math.abs(exact - approx) : null;

      const termHtml = terms.map(({ k, coeff }) => {
        const ts = termStr(coeff, k, a);
        if (!ts) return `<div class="taylor-term zero"><span class="term-order">k=${k}</span><span class="term-expr">≈ 0</span></div>`;
        return `<div class="taylor-term"><span class="term-order">k=${k}</span><span class="term-expr">${ts}</span></div>`;
      }).join('');

      const seriesStr = terms
        .map(({ k, coeff }) => termStr(coeff, k, a))
        .filter(Boolean).join(' + ')
        .replace(/\+ −/g, '− ') || '0';

      out.innerHTML = `
        <div class="taylor-expansion">
          <div class="calc-section-title">Taylor expansion of ${expr} around a = ${a}</div>
          <div class="taylor-terms">${termHtml}</div>
          <div class="taylor-sum">f(x) ≈ ${seriesStr}</div>
        </div>
        <div class="result-grid" style="margin-top:16px">
          <div class="result-card accent"><div class="result-label">Series at x = ${x}</div><div class="result-value">${fmt(approx)}</div></div>
          ${exact !== null ? `<div class="result-card"><div class="result-label">Exact f(${x})</div><div class="result-value">${fmt(exact)}</div></div>` : ''}
          ${err !== null ? `<div class="result-card"><div class="result-label">Error |f(x) − P(x)|</div><div class="result-value">${err < 1e-12 ? '< 1e-12' : fmt(err, 4)}</div></div>` : ''}
        </div>
        <div class="calc-note">Derivatives computed via 5-point stencil. Accuracy decreases for |x − a| > 1 with fewer terms.</div>
      `;
      history.add({ category: 'calculus', tool: 'taylor', expr, a, n, x, approx });
    } catch (err) {
      out.innerHTML = `<div class="error">${err.message}</div>`;
    }
  });
}

/* ══ EXPORT ══════════════════════════════════════════════════════ */
const TABS = [
  { key: 'derivative', label: 'Derivative',            render: renderDerivative },
  { key: 'integral',   label: 'Numerical Integration', render: renderIntegral },
  { key: 'taylor',     label: 'Taylor Series',         render: renderTaylor },
];

export function renderCalculus(container, sub = 'derivative') {
  const active = TABS.find(t => t.key === sub) || TABS[0];

  container.innerHTML = `
    <div class="calc-form">
      <div class="form-tabs">
        ${TABS.map(t => `<button class="form-tab${t.key === active.key ? ' active' : ''}" data-sub="${t.key}">${t.label}</button>`).join('')}
      </div>
      <div id="calc-body" class="form-body"></div>
    </div>
  `;

  container.querySelectorAll('.form-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      import('../router.js').then(({ router }) => router.go(`/calculus/${btn.dataset.sub}`));
    });
  });

  active.render(container.querySelector('#calc-body'));
}
