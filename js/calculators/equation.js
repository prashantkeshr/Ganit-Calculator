import { history } from '../history.js';

function fmt(n, dp = 6) {
  if (typeof n === 'object' && n !== null) return `${fmt(n.re)} ${n.im >= 0 ? '+' : ''}${fmt(n.im)}i`;
  const v = parseFloat(n.toPrecision(dp));
  return isNaN(v) ? 'No real solution' : String(v);
}

// ax + b = 0
function solveLinear({ a, b }) {
  if (a === 0) return b === 0 ? ['∞ (identity)'] : ['No solution'];
  return [{ x: -b / a }];
}

// ax² + bx + c = 0
function solveQuadratic({ a, b, c }) {
  if (a === 0) return solveLinear({ a: b, b: c });
  const disc = b * b - 4 * a * c;
  if (disc > 0) {
    return [{ x: (-b + Math.sqrt(disc)) / (2 * a) }, { x: (-b - Math.sqrt(disc)) / (2 * a) }];
  }
  if (disc === 0) {
    return [{ x: -b / (2 * a) }];
  }
  const re = -b / (2 * a), im = Math.sqrt(-disc) / (2 * a);
  return [{ re, im }, { re, im: -im }];
}

// ax³ + bx² + cx + d = 0 (Cardano's / Numerical fallback)
function solveCubic({ a, b, c, d }) {
  if (a === 0) return solveQuadratic({ a: b, b: c, c: d });
  // Normalize
  const A = b / a, B = c / a, C = d / a;
  const p = B - A * A / 3;
  const q = 2 * A * A * A / 27 - A * B / 3 + C;
  const disc = (q / 2) ** 2 + (p / 3) ** 3;
  const shift = -A / 3;
  if (disc > 0) {
    const u = Math.cbrt(-q / 2 + Math.sqrt(disc));
    const v = Math.cbrt(-q / 2 - Math.sqrt(disc));
    const x1 = u + v + shift;
    const re = -(u + v) / 2 + shift, im = (u - v) * Math.sqrt(3) / 2;
    return [{ x: x1 }, { re, im }, { re, im: -im }];
  }
  if (disc === 0) {
    const u = Math.cbrt(-q / 2);
    return [{ x: 2 * u + shift }, { x: -u + shift }];
  }
  const r = Math.sqrt((-p / 3) ** 3), theta = Math.acos(-q / (2 * r));
  const m = 2 * Math.cbrt(r);
  return [
    { x: m * Math.cos(theta / 3) + shift },
    { x: m * Math.cos((theta + 2 * Math.PI) / 3) + shift },
    { x: m * Math.cos((theta + 4 * Math.PI) / 3) + shift },
  ];
}

// Gaussian elimination for 2×2 or 3×3 systems
function solveSystem(matrix) {
  const n = matrix.length;
  const M = matrix.map(row => [...row]);
  // Forward elimination
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;
    }
    [M[col], M[pivot]] = [M[pivot], M[col]];
    if (Math.abs(M[col][col]) < 1e-12) return null;
    const divisor = M[col][col];
    for (let j = col; j <= n; j++) M[col][j] /= divisor;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = M[row][col];
      for (let j = col; j <= n; j++) M[row][j] -= factor * M[col][j];
    }
  }
  return M.map(row => row[n]);
}

const TOOLS = {
  linear: {
    label: 'Linear: ax + b = 0',
    fields: [
      { id: 'a', label: 'a (coefficient of x)', default: 2 },
      { id: 'b', label: 'b (constant)', default: -6 },
    ],
    compute(f) {
      const solutions = solveLinear(f);
      return solutions.map(s => `x = ${typeof s === 'object' && 'x' in s ? fmt(s.x) : s}`);
    },
    latex: 'ax + b = 0',
  },
  quadratic: {
    label: 'Quadratic: ax² + bx + c = 0',
    fields: [
      { id: 'a', label: 'a (x²)', default: 1 },
      { id: 'b', label: 'b (x)',  default: -5 },
      { id: 'c', label: 'c',      default: 6 },
    ],
    compute(f) {
      const disc = f.b * f.b - 4 * f.a * f.c;
      const sols = solveQuadratic(f);
      const discStr = `Discriminant = ${fmt(disc)}`;
      return [discStr, ...sols.map((s, i) => {
        if ('x' in s) return `x${i+1} = ${fmt(s.x)}`;
        return `x${i+1} = ${fmt(s.re)} ${s.im >= 0 ? '+' : ''}${fmt(Math.abs(s.im))}i`;
      })];
    },
    latex: 'ax^2 + bx + c = 0',
  },
  cubic: {
    label: 'Cubic: ax³ + bx² + cx + d = 0',
    fields: [
      { id: 'a', label: 'a (x³)', default: 1 },
      { id: 'b', label: 'b (x²)', default: -6 },
      { id: 'c', label: 'c (x)',  default: 11 },
      { id: 'd', label: 'd',      default: -6 },
    ],
    compute(f) {
      return solveCubic(f).map((s, i) => {
        if (s === null) return 'Error';
        if ('x' in s) return `x${i+1} = ${fmt(s.x)}`;
        return `x${i+1} = ${fmt(s.re)} ${s.im >= 0 ? '+' : ''}${fmt(Math.abs(s.im))}i`;
      });
    },
    latex: 'ax^3 + bx^2 + cx + d = 0',
  },
  system2: {
    label: '2×2 System',
    fields: [],
    renderCustom(el) {
      el.innerHTML = `
        <h3>System of 2 Equations (ax + by = c)</h3>
        <p>Equation 1: <input id="s2-a1" type="number" value="2" style="width:60px">x + <input id="s2-b1" type="number" value="3" style="width:60px">y = <input id="s2-c1" type="number" value="7" style="width:60px"></p>
        <p>Equation 2: <input id="s2-a2" type="number" value="1" style="width:60px">x + <input id="s2-b2" type="number" value="-1" style="width:60px">y = <input id="s2-c2" type="number" value="-1" style="width:60px"></p>
        <button id="sys2-solve" class="btn btn-calc-primary">Solve</button>
        <div id="sys2-result" class="calc-output"></div>
      `;
      el.querySelector('#sys2-solve').addEventListener('click', () => {
        const g = (id) => parseFloat(el.querySelector(`#${id}`).value) || 0;
        const mat = [[g('s2-a1'), g('s2-b1'), g('s2-c1')], [g('s2-a2'), g('s2-b2'), g('s2-c2')]];
        const sol = solveSystem(mat);
        el.querySelector('#sys2-result').innerHTML = sol
          ? `<div class="result-grid"><div class="result-card"><div class="result-label">x</div><div class="result-value">${fmt(sol[0])}</div></div><div class="result-card"><div class="result-label">y</div><div class="result-value">${fmt(sol[1])}</div></div></div>`
          : '<div class="error">No unique solution</div>';
      });
    }
  },
  system3: {
    label: '3×3 System',
    fields: [],
    renderCustom(el) {
      const vars = [['x','y','z'], ['x','y','z'], ['x','y','z']];
      const defaults = [[2,1,-1,8],[-3,-1,2,-11],[-2,1,2,-3]];
      el.innerHTML = `
        <h3>System of 3 Equations</h3>
        ${defaults.map((row, i) => `
          <p>Eq ${i+1}:
            <input class="sys3-coef" data-row="${i}" data-col="0" type="number" value="${row[0]}" style="width:55px">x +
            <input class="sys3-coef" data-row="${i}" data-col="1" type="number" value="${row[1]}" style="width:55px">y +
            <input class="sys3-coef" data-row="${i}" data-col="2" type="number" value="${row[2]}" style="width:55px">z =
            <input class="sys3-coef" data-row="${i}" data-col="3" type="number" value="${row[3]}" style="width:55px">
          </p>
        `).join('')}
        <button id="sys3-solve" class="btn btn-calc-primary">Solve</button>
        <div id="sys3-result" class="calc-output"></div>
      `;
      el.querySelector('#sys3-solve').addEventListener('click', () => {
        const mat = [[0,0,0,0],[0,0,0,0],[0,0,0,0]];
        el.querySelectorAll('.sys3-coef').forEach(inp => {
          mat[inp.dataset.row][inp.dataset.col] = parseFloat(inp.value) || 0;
        });
        const sol = solveSystem(mat);
        el.querySelector('#sys3-result').innerHTML = sol
          ? `<div class="result-grid">${['x','y','z'].map((v,i) => `<div class="result-card"><div class="result-label">${v}</div><div class="result-value">${fmt(sol[i])}</div></div>`).join('')}</div>`
          : '<div class="error">No unique solution</div>';
      });
    }
  },
};

export function renderEquation(container, sub = 'linear') {
  const tool = TOOLS[sub] || TOOLS.linear;

  container.innerHTML = `
    <div class="calc-form">
      <div class="form-tabs">
        ${Object.entries(TOOLS).map(([k, t]) =>
          `<button class="form-tab ${k === sub ? 'active' : ''}" data-sub="${k}">${t.label}</button>`
        ).join('')}
      </div>
      <div id="eq-body" class="form-body"></div>
    </div>
  `;

  container.querySelectorAll('.form-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      import('../router.js').then(({ router }) => router.go(`/equation/${btn.dataset.sub}`));
    });
  });

  const body = container.querySelector('#eq-body');

  if (tool.renderCustom) {
    tool.renderCustom(body);
  } else {
    body.innerHTML = `
      <h3>${tool.label}</h3>
      <form id="eq-form">
        ${tool.fields.map(f => `
          <div class="form-row">
            <label>${f.label}</label>
            <input type="number" id="eq-${f.id}" value="${f.default ?? ''}" step="any">
          </div>
        `).join('')}
        <button type="submit" class="btn btn-calc-primary">Solve</button>
      </form>
      <div id="eq-result" class="calc-output"></div>
    `;
    body.querySelector('#eq-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = {};
      tool.fields.forEach(f => { fd[f.id] = parseFloat(body.querySelector(`#eq-${f.id}`)?.value) || 0; });
      try {
        const solutions = tool.compute(fd);
        body.querySelector('#eq-result').innerHTML = `
          <div class="result-grid">
            ${solutions.map(s => `<div class="result-card"><div class="result-value">${s}</div></div>`).join('')}
          </div>
        `;
        history.add({ category: 'equation', tool: sub, inputs: fd, solutions });
      } catch(err) {
        body.querySelector('#eq-result').innerHTML = `<div class="error">${err.message}</div>`;
      }
    });
  }
}
