import { history } from '../history.js';

const PI = Math.PI;
function fmt(n, dp = 4) { return parseFloat(n.toPrecision(8)).toString(); }

const SHAPES = {
  // Area & Perimeter
  rectangle: {
    label: 'Rectangle', group: '2D',
    fields: [
      { id: 'l', label: 'Length (L)', default: 10 },
      { id: 'w', label: 'Width (W)', default: 5 },
    ],
    compute({ l, w }) {
      return { area: l * w, perimeter: 2 * (l + w), formula: 'A = L × W, P = 2(L + W)' };
    },
    equation: 'A = L × W',
    hint: 'Leave any one field blank — it will be computed.',
    revVars: [
      { id: 'l', label: 'Length (L)' },
      { id: 'w', label: 'Width (W)' },
      { id: 'area', label: 'Area (A)' },
    ],
    revDefaults: { l: 10, w: 5, area: '' },
    revSolve(v) {
      const { l, w, area } = v;
      if (l    == null) return { id: 'l',    value: area / w,         label: 'A ÷ W' };
      if (w    == null) return { id: 'w',    value: area / l,         label: 'A ÷ L' };
      return               { id: 'area', value: l * w,               label: 'L × W' };
    },
  },
  square: {
    label: 'Square', group: '2D',
    fields: [{ id: 'a', label: 'Side (a)', default: 5 }],
    compute({ a }) { return { area: a * a, perimeter: 4 * a, formula: 'A = a², P = 4a' }; },
    equation: 'A = a²',
    hint: 'Leave any one field blank — it will be computed.',
    revVars: [
      { id: 'a',    label: 'Side (a)' },
      { id: 'area', label: 'Area (A)' },
    ],
    revDefaults: { a: 5, area: '' },
    revSolve(v) {
      const { a, area } = v;
      if (a    == null) return { id: 'a',    value: Math.sqrt(area), label: '√A' };
      return               { id: 'area', value: a * a,              label: 'a²' };
    },
  },
  circle: {
    label: 'Circle', group: '2D',
    fields: [{ id: 'r', label: 'Radius (r)', default: 7 }],
    compute({ r }) { return { area: PI * r * r, perimeter: 2 * PI * r, formula: 'A = πr², C = 2πr' }; },
    equation: 'A = πr²',
    hint: 'Leave any one field blank — it will be computed.',
    revVars: [
      { id: 'r',    label: 'Radius (r)' },
      { id: 'area', label: 'Area (A)' },
    ],
    revDefaults: { r: 7, area: '' },
    revSolve(v) {
      const { r, area } = v;
      if (r    == null) return { id: 'r',    value: Math.sqrt(area / PI), label: '√(A ÷ π)' };
      return               { id: 'area', value: PI * r * r,              label: 'π × r²' };
    },
  },
  triangle: {
    label: 'Triangle (sides a, b, c)', group: '2D',
    fields: [
      { id: 'a', label: 'Side a', default: 3 },
      { id: 'b', label: 'Side b', default: 4 },
      { id: 'c', label: 'Side c', default: 5 },
    ],
    compute({ a, b, c }) {
      const s = (a + b + c) / 2;
      const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
      return { area, perimeter: a + b + c, formula: 'Heron\'s formula: A = √(s(s-a)(s-b)(s-c))' };
    },
  },
  'right-triangle': {
    label: 'Right Triangle (a, b)', group: '2D',
    fields: [
      { id: 'a', label: 'Leg a', default: 3 },
      { id: 'b', label: 'Leg b', default: 4 },
    ],
    compute({ a, b }) {
      const c = Math.sqrt(a * a + b * b);
      return { area: 0.5 * a * b, perimeter: a + b + c, formula: 'A = ½ab, hypotenuse c = √(a²+b²)', extra: `c = ${fmt(c)}` };
    },
  },
  trapezoid: {
    label: 'Trapezoid', group: '2D',
    fields: [
      { id: 'a', label: 'Parallel side a', default: 10 },
      { id: 'b', label: 'Parallel side b', default: 6 },
      { id: 'h', label: 'Height h', default: 5 },
    ],
    compute({ a, b, h }) { return { area: 0.5 * (a + b) * h, formula: 'A = ½(a+b)h' }; },
  },
  ellipse: {
    label: 'Ellipse', group: '2D',
    fields: [
      { id: 'a', label: 'Semi-major axis a', default: 8 },
      { id: 'b', label: 'Semi-minor axis b', default: 5 },
    ],
    compute({ a, b }) { return { area: PI * a * b, perimeter: 2 * PI * Math.sqrt((a * a + b * b) / 2), formula: 'A = πab' }; },
  },
  sector: {
    label: 'Circle Sector', group: '2D',
    fields: [
      { id: 'r',     label: 'Radius', default: 7 },
      { id: 'angle', label: 'Angle (degrees)', default: 90 },
    ],
    compute({ r, angle }) {
      const a = angle * PI / 180;
      return { area: 0.5 * r * r * a, arclength: r * a, formula: 'A = ½r²θ, arc = rθ' };
    },
  },
  // Volume shapes
  cube: {
    label: 'Cube', group: '3D',
    fields: [{ id: 'a', label: 'Side (a)', default: 5 }],
    compute({ a }) { return { volume: a * a * a, surface: 6 * a * a, formula: 'V = a³, SA = 6a²' }; },
    equation: 'V = a³',
    hint: 'Leave any one field blank — it will be computed.',
    revVars: [
      { id: 'a', label: 'Side (a)' },
      { id: 'vol', label: 'Volume (V)' },
    ],
    revDefaults: { a: 5, vol: '' },
    revSolve(v) {
      const { a, vol } = v;
      if (a   == null) return { id: 'a',   value: Math.cbrt(vol),  label: 'V^(1/3)' };
      return              { id: 'vol', value: a * a * a,            label: 'a³' };
    },
  },
  cuboid: {
    label: 'Cuboid (Box)', group: '3D',
    fields: [
      { id: 'l', label: 'Length', default: 10 },
      { id: 'w', label: 'Width', default: 5 },
      { id: 'h', label: 'Height', default: 3 },
    ],
    compute({ l, w, h }) { return { volume: l * w * h, surface: 2 * (l * w + w * h + l * h), formula: 'V = lwh, SA = 2(lw + wh + lh)' }; },
    equation: 'V = L × W × H',
    hint: 'Leave any one field blank — it will be computed.',
    revVars: [
      { id: 'l',   label: 'Length (L)' },
      { id: 'w',   label: 'Width (W)' },
      { id: 'h',   label: 'Height (H)' },
      { id: 'vol', label: 'Volume (V)' },
    ],
    revDefaults: { l: 10, w: 5, h: 3, vol: '' },
    revSolve(v) {
      const { l, w, h, vol } = v;
      if (l   == null) return { id: 'l',   value: vol / (w * h),  label: 'V ÷ (W × H)' };
      if (w   == null) return { id: 'w',   value: vol / (l * h),  label: 'V ÷ (L × H)' };
      if (h   == null) return { id: 'h',   value: vol / (l * w),  label: 'V ÷ (L × W)' };
      return              { id: 'vol', value: l * w * h,           label: 'L × W × H' };
    },
  },
  cylinder: {
    label: 'Cylinder', group: '3D',
    fields: [
      { id: 'r', label: 'Radius', default: 5 },
      { id: 'h', label: 'Height', default: 10 },
    ],
    compute({ r, h }) { return { volume: PI * r * r * h, surface: 2 * PI * r * (r + h), formula: 'V = πr²h, SA = 2πr(r+h)' }; },
    equation: 'V = π × r² × h',
    hint: 'Leave any one field blank — it will be computed.',
    revVars: [
      { id: 'r',   label: 'Radius (r)' },
      { id: 'h',   label: 'Height (h)' },
      { id: 'vol', label: 'Volume (V)' },
    ],
    revDefaults: { r: 5, h: 10, vol: '' },
    revSolve(v) {
      const { r, h, vol } = v;
      if (r   == null) return { id: 'r',   value: Math.sqrt(vol / (PI * h)),  label: '√(V ÷ πh)' };
      if (h   == null) return { id: 'h',   value: vol / (PI * r * r),         label: 'V ÷ (πr²)' };
      return              { id: 'vol', value: PI * r * r * h,                 label: 'π × r² × h' };
    },
  },
  sphere: {
    label: 'Sphere', group: '3D',
    fields: [{ id: 'r', label: 'Radius', default: 5 }],
    compute({ r }) { return { volume: (4 / 3) * PI * r * r * r, surface: 4 * PI * r * r, formula: 'V = 4/3πr³, SA = 4πr²' }; },
    equation: 'V = (4/3) × π × r³',
    hint: 'Leave any one field blank — it will be computed.',
    revVars: [
      { id: 'r',   label: 'Radius (r)' },
      { id: 'vol', label: 'Volume (V)' },
    ],
    revDefaults: { r: 5, vol: '' },
    revSolve(v) {
      const { r, vol } = v;
      if (r   == null) return { id: 'r',   value: Math.cbrt(vol * 3 / (4 * PI)), label: '(3V ÷ 4π)^(1/3)' };
      return              { id: 'vol', value: (4 / 3) * PI * r * r * r,          label: '(4/3) × π × r³' };
    },
  },
  cone: {
    label: 'Cone', group: '3D',
    fields: [
      { id: 'r', label: 'Radius', default: 5 },
      { id: 'h', label: 'Height', default: 12 },
    ],
    compute({ r, h }) {
      const slant = Math.sqrt(r * r + h * h);
      return { volume: (1 / 3) * PI * r * r * h, surface: PI * r * (r + slant), formula: 'V = ⅓πr²h, SA = πr(r + l)' };
    },
    equation: 'V = (1/3) × π × r² × h',
    hint: 'Leave any one field blank — it will be computed.',
    revVars: [
      { id: 'r',   label: 'Radius (r)' },
      { id: 'h',   label: 'Height (h)' },
      { id: 'vol', label: 'Volume (V)' },
    ],
    revDefaults: { r: 5, h: 12, vol: '' },
    revSolve(v) {
      const { r, h, vol } = v;
      if (r   == null) return { id: 'r',   value: Math.sqrt(vol * 3 / (PI * h)),  label: '√(3V ÷ πh)' };
      if (h   == null) return { id: 'h',   value: vol * 3 / (PI * r * r),         label: '3V ÷ (πr²)' };
      return              { id: 'vol', value: (1 / 3) * PI * r * r * h,           label: '(1/3) × π × r² × h' };
    },
  },
  pyramid: {
    label: 'Square Pyramid', group: '3D',
    fields: [
      { id: 'b', label: 'Base side', default: 6 },
      { id: 'h', label: 'Height', default: 10 },
    ],
    compute({ b, h }) {
      const slant = Math.sqrt((b / 2) ** 2 + h * h);
      return { volume: (1 / 3) * b * b * h, surface: b * b + 2 * b * slant, formula: 'V = ⅓b²h, SA = b² + 2bl' };
    },
  },
};

function buildAreaReverseUI(formEl, shape) {
  const values = { ...shape.revDefaults };
  function getBlank() { return shape.revVars.find(v => values[v.id] === '' || values[v.id] == null); }
  function fmtV(n) { return isFinite(n) ? parseFloat(n.toPrecision(8)).toString() : '—'; }

  function renderResult() {
    const resEl = formEl.querySelector('.rev-result');
    if (!resEl) return;
    const blank = getBlank();
    const known = {};
    shape.revVars.forEach(v => { known[v.id] = (v.id === blank?.id) ? null : parseFloat(values[v.id]); });
    if (blank && shape.revVars.filter(v => v.id !== blank.id).some(v => !isFinite(known[v.id]))) { resEl.innerHTML = ''; return; }
    try {
      const r = shape.revSolve(known);
      const sv = shape.revVars.find(v => v.id === r.id);
      resEl.innerHTML = `
        <div class="pct-result-card">
          <div class="pct-result-label">Solving for <strong>${sv?.label || r.id}</strong></div>
          <div class="pct-result-value">${fmtV(r.value)}</div>
          <div class="pct-result-formula">${r.label}</div>
        </div>
      `;
      const inp = formEl.querySelector(`[data-avar="${r.id}"]`);
      if (inp && inp !== document.activeElement) inp.placeholder = fmtV(r.value);
    } catch { resEl.innerHTML = ''; }
  }

  function renderHighlight() {
    const blank = getBlank();
    formEl.querySelectorAll('.pct-var-row[data-var]').forEach(row =>
      row.classList.toggle('solving-for', row.dataset.var === blank?.id)
    );
  }

  formEl.innerHTML = `
    <div class="pct-equation">${shape.equation}</div>
    <p class="pct-hint">${shape.hint}</p>
    <div class="pct-fields">
      ${shape.revVars.map(v => `
        <div class="pct-var-row" data-var="${v.id}">
          <label class="pct-var-label">${v.label}</label>
          <div class="pct-var-input-wrap has-steppers">
            <button type="button" class="pct-step-btn pct-step-dn" tabindex="-1" aria-label="Decrease">−</button>
            <input type="text" inputmode="decimal" class="pct-input" data-avar="${v.id}"
              value="${values[v.id] !== '' ? values[v.id] : ''}"
              placeholder="${values[v.id] === '' ? 'blank → auto-computed' : ''}" />
            <button type="button" class="pct-step-btn pct-step-up" tabindex="-1" aria-label="Increase">+</button>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="rev-result"></div>
  `;

  formEl.querySelectorAll('.pct-input').forEach(inp => {
    inp.addEventListener('input', () => {
      values[inp.dataset.avar] = inp.value.trim() === '' ? '' : inp.value;
      renderHighlight(); renderResult();
    });
    inp.addEventListener('wheel', (e) => {
      if (document.activeElement !== inp) return;
      e.preventDefault();
      const cur = parseFloat(inp.value) || 0;
      inp.value = cur + (e.deltaY < 0 ? 1 : -1);
      inp.dispatchEvent(new Event('input'));
    }, { passive: false });
  });

  renderHighlight(); renderResult();
}

export function renderArea(container, sub = 'shapes') {
  let activeShape = 'rectangle';

  function renderShape(id) {
    activeShape = id;
    const shape = SHAPES[id];
    if (!shape) return;

    const formEl = container.querySelector('#area-tool-form');

    if (shape.revVars) {
      formEl.innerHTML = `<h3>${shape.label}</h3><div class="area-rev-form"></div>`;
      buildAreaReverseUI(formEl.querySelector('.area-rev-form'), shape);
      return;
    }

    formEl.innerHTML = `
      <h3>${shape.label}</h3>
      <form id="area-form">
        ${shape.fields.map(f => `
          <div class="form-row">
            <label>${f.label}</label>
            <input type="number" id="area-${f.id}" value="${f.default ?? ''}" step="any">
          </div>
        `).join('')}
        <button type="submit" class="btn btn-calc-primary">Calculate</button>
      </form>
      <div id="area-result" class="calc-output"></div>
    `;

    container.querySelector('#area-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = {};
      shape.fields.forEach(f => { fd[f.id] = parseFloat(container.querySelector(`#area-${f.id}`)?.value) || 0; });
      try {
        const r = shape.compute(fd);
        const rows = Object.entries(r).filter(([k]) => k !== 'formula')
          .map(([k, v]) => `<div class="result-card"><div class="result-label">${k}</div><div class="result-value">${typeof v === 'number' ? fmt(v) : v}</div></div>`)
          .join('');
        container.querySelector('#area-result').innerHTML = `
          <div class="result-grid">${rows}</div>
          <div class="formula-box">${r.formula}</div>
        `;
        history.add({ category: 'area', shape: id, inputs: fd });
      } catch(err) {
        container.querySelector('#area-result').innerHTML = `<div class="error">${err.message}</div>`;
      }
    });
  }

  const groups = [...new Set(Object.values(SHAPES).map(s => s.group))];

  container.innerHTML = `
    <div class="calc-area">
      <div class="area-shape-list">
        ${groups.map(g => `
          <div class="shape-group-label">${g}</div>
          ${Object.entries(SHAPES)
            .filter(([, s]) => s.group === g)
            .map(([id, s]) => `<button class="shape-btn ${id === activeShape ? 'active' : ''}" data-id="${id}">${s.label}</button>`)
            .join('')}
        `).join('')}
      </div>
      <div id="area-tool-form" class="form-body"></div>
    </div>
  `;

  container.querySelectorAll('.shape-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.shape-btn').forEach(b => b.classList.toggle('active', b.dataset.id === btn.dataset.id));
      renderShape(btn.dataset.id);
    });
  });

  renderShape(activeShape);
}
