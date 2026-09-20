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
  },
  square: {
    label: 'Square', group: '2D',
    fields: [{ id: 'a', label: 'Side (a)', default: 5 }],
    compute({ a }) { return { area: a * a, perimeter: 4 * a, formula: 'A = a², P = 4a' }; },
  },
  circle: {
    label: 'Circle', group: '2D',
    fields: [{ id: 'r', label: 'Radius (r)', default: 7 }],
    compute({ r }) { return { area: PI * r * r, perimeter: 2 * PI * r, formula: 'A = πr², C = 2πr' }; },
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
  },
  cuboid: {
    label: 'Cuboid (Box)', group: '3D',
    fields: [
      { id: 'l', label: 'Length', default: 10 },
      { id: 'w', label: 'Width', default: 5 },
      { id: 'h', label: 'Height', default: 3 },
    ],
    compute({ l, w, h }) { return { volume: l * w * h, surface: 2 * (l * w + w * h + l * h), formula: 'V = lwh, SA = 2(lw + wh + lh)' }; },
  },
  cylinder: {
    label: 'Cylinder', group: '3D',
    fields: [
      { id: 'r', label: 'Radius', default: 5 },
      { id: 'h', label: 'Height', default: 10 },
    ],
    compute({ r, h }) { return { volume: PI * r * r * h, surface: 2 * PI * r * (r + h), formula: 'V = πr²h, SA = 2πr(r+h)' }; },
  },
  sphere: {
    label: 'Sphere', group: '3D',
    fields: [{ id: 'r', label: 'Radius', default: 5 }],
    compute({ r }) { return { volume: (4 / 3) * PI * r * r * r, surface: 4 * PI * r * r, formula: 'V = 4/3πr³, SA = 4πr²' }; },
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

export function renderArea(container, sub = 'shapes') {
  let activeShape = 'rectangle';

  function renderShape(id) {
    activeShape = id;
    const shape = SHAPES[id];
    if (!shape) return;

    container.querySelector('#area-tool-form').innerHTML = `
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
