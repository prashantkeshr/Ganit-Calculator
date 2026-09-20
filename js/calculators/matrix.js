import { history } from '../history.js';

function fmt(n) { return parseFloat(n.toPrecision(8)).toString(); }

function createMatrix(rows, cols, fill = 0) {
  return Array.from({ length: rows }, () => Array(cols).fill(fill));
}

function matAdd(A, B) {
  return A.map((row, i) => row.map((v, j) => v + B[i][j]));
}
function matSub(A, B) {
  return A.map((row, i) => row.map((v, j) => v - B[i][j]));
}
function matMul(A, B) {
  const n = A.length, m = B[0].length, k = B.length;
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: m }, (_, j) =>
      A[i].reduce((sum, _, l) => sum + A[i][l] * B[l][j], 0)));
}
function matTranspose(A) {
  return A[0].map((_, j) => A.map(row => row[j]));
}
function matScale(A, s) {
  return A.map(row => row.map(v => v * s));
}

function det(A) {
  const n = A.length;
  if (n === 1) return A[0][0];
  if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
  let result = 0;
  for (let j = 0; j < n; j++) {
    const minor = A.slice(1).map(row => row.filter((_, c) => c !== j));
    result += (j % 2 === 0 ? 1 : -1) * A[0][j] * det(minor);
  }
  return result;
}

function matInverse(A) {
  const n = A.length;
  const M = A.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => i === j ? 1 : 0)]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;
    }
    [M[col], M[pivot]] = [M[pivot], M[col]];
    if (Math.abs(M[col][col]) < 1e-12) throw new Error('Matrix is singular');
    const div = M[col][col];
    for (let j = 0; j < 2 * n; j++) M[col][j] /= div;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const f = M[row][col];
      for (let j = 0; j < 2 * n; j++) M[row][j] -= f * M[col][j];
    }
  }
  return M.map(row => row.slice(n));
}

function matRank(A) {
  const M = A.map(row => [...row]);
  const rows = M.length, cols = M[0].length;
  let rank = 0;
  for (let col = 0; col < cols && rank < rows; col++) {
    let pivot = -1;
    for (let row = rank; row < rows; row++) {
      if (Math.abs(M[row][col]) > 1e-12) { pivot = row; break; }
    }
    if (pivot < 0) continue;
    [M[rank], M[pivot]] = [M[pivot], M[rank]];
    const div = M[rank][col];
    for (let j = 0; j < cols; j++) M[rank][j] /= div;
    for (let row = 0; row < rows; row++) {
      if (row === rank) continue;
      const f = M[row][col];
      for (let j = 0; j < cols; j++) M[row][j] -= f * M[rank][j];
    }
    rank++;
  }
  return rank;
}

function matTrace(A) { return A.reduce((sum, row, i) => sum + row[i], 0); }

function renderMatrixHtml(M, label = '') {
  if (!M || !M.length) return '';
  const rows = M.map(row => `<tr>${row.map(v => `<td>${typeof v === 'number' ? fmt(v) : v}</td>`).join('')}</tr>`).join('');
  return `
    <div class="matrix-result">
      ${label ? `<div class="result-label">${label}</div>` : ''}
      <table class="matrix-table"><tbody>${rows}</tbody></table>
    </div>
  `;
}

function buildMatrixInput(rows, cols, prefix, values = null) {
  let html = `<div class="matrix-input-grid" style="--cols:${cols}">`;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const v = values ? (values[i]?.[j] ?? 0) : 0;
      html += `<input type="number" class="matrix-cell" data-row="${i}" data-col="${j}" data-prefix="${prefix}" value="${v}" step="any">`;
    }
  }
  html += '</div>';
  return html;
}

function readMatrix(container, prefix, rows, cols) {
  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => {
      const el = container.querySelector(`[data-prefix="${prefix}"][data-row="${i}"][data-col="${j}"]`);
      return parseFloat(el?.value) || 0;
    }));
}

export function renderMatrix(container) {
  let rowsA = 3, colsA = 3, rowsB = 3, colsB = 3;
  let activeOp = 'mul';

  const OPERATIONS = [
    { id: 'add',       label: 'A + B',       two: true  },
    { id: 'sub',       label: 'A − B',       two: true  },
    { id: 'mul',       label: 'A × B',       two: true  },
    { id: 'scale',     label: 'Scale (kA)',  two: false  },
    { id: 'transpose', label: 'Aᵀ',          two: false },
    { id: 'det',       label: 'det(A)',       two: false },
    { id: 'inverse',   label: 'A⁻¹',         two: false },
    { id: 'rank',      label: 'rank(A)',      two: false },
    { id: 'trace',     label: 'tr(A)',        two: false },
    { id: 'dot',       label: 'Dot Product',  two: true  },
    { id: 'cross',     label: 'Cross Product',two: true  },
  ];

  function renderOp() {
    const op = OPERATIONS.find(o => o.id === activeOp) || OPERATIONS[0];
    const matAHtml = buildMatrixInput(rowsA, colsA, 'A');
    const matBHtml = op.two ? buildMatrixInput(rowsB, colsB, 'B') : '';

    container.innerHTML = `
      <div class="calc-matrix">
        <div class="matrix-op-tabs">
          ${OPERATIONS.map(o => `<button class="matrix-op-tab ${o.id === activeOp ? 'active' : ''}" data-op="${o.id}">${o.label}</button>`).join('')}
        </div>
        <div class="matrix-inputs">
          <div class="matrix-panel">
            <div class="matrix-panel-header">
              Matrix A
              <div class="matrix-size-ctrl">
                <label>Rows: <input type="number" id="rowsA" value="${rowsA}" min="1" max="10" style="width:50px"></label>
                <label>Cols: <input type="number" id="colsA" value="${colsA}" min="1" max="10" style="width:50px"></label>
              </div>
            </div>
            ${matAHtml}
          </div>
          ${op.two ? `
            <div class="matrix-panel">
              <div class="matrix-panel-header">
                Matrix B
                <div class="matrix-size-ctrl">
                  <label>Rows: <input type="number" id="rowsB" value="${rowsB}" min="1" max="10" style="width:50px"></label>
                  <label>Cols: <input type="number" id="colsB" value="${colsB}" min="1" max="10" style="width:50px"></label>
                </div>
              </div>
              ${matBHtml}
            </div>
          ` : ''}
          ${activeOp === 'scale' ? `<div class="matrix-panel"><label>Scalar k: <input type="number" id="scalar-k" value="2" step="any"></label></div>` : ''}
        </div>
        <button id="matrix-compute" class="btn btn-calc-primary">Compute ${op.label}</button>
        <div id="matrix-result" class="calc-output"></div>
      </div>
    `;

    container.querySelectorAll('.matrix-op-tab').forEach(btn => {
      btn.addEventListener('click', () => { activeOp = btn.dataset.op; renderOp(); });
    });

    const resizeListener = () => {
      rowsA = parseInt(container.querySelector('#rowsA')?.value) || 3;
      colsA = parseInt(container.querySelector('#colsA')?.value) || 3;
      if (op.two) {
        rowsB = parseInt(container.querySelector('#rowsB')?.value) || 3;
        colsB = parseInt(container.querySelector('#colsB')?.value) || 3;
      }
      renderOp();
    };
    container.querySelector('#rowsA')?.addEventListener('change', resizeListener);
    container.querySelector('#colsA')?.addEventListener('change', resizeListener);
    container.querySelector('#rowsB')?.addEventListener('change', resizeListener);
    container.querySelector('#colsB')?.addEventListener('change', resizeListener);

    container.querySelector('#matrix-compute').addEventListener('click', () => {
      const A = readMatrix(container, 'A', rowsA, colsA);
      const B = op.two ? readMatrix(container, 'B', rowsB, colsB) : null;
      const resEl = container.querySelector('#matrix-result');
      try {
        let resultHtml = '';
        switch (activeOp) {
          case 'add': resultHtml = renderMatrixHtml(matAdd(A, B), 'A + B'); break;
          case 'sub': resultHtml = renderMatrixHtml(matSub(A, B), 'A − B'); break;
          case 'mul': resultHtml = renderMatrixHtml(matMul(A, B), 'A × B'); break;
          case 'scale': {
            const k = parseFloat(container.querySelector('#scalar-k')?.value) || 1;
            resultHtml = renderMatrixHtml(matScale(A, k), `${k}A`); break;
          }
          case 'transpose': resultHtml = renderMatrixHtml(matTranspose(A), 'Aᵀ'); break;
          case 'det': {
            if (rowsA !== colsA) throw new Error('Matrix must be square for determinant');
            resultHtml = `<div class="result-card"><div class="result-label">det(A)</div><div class="result-value">${fmt(det(A))}</div></div>`;
            break;
          }
          case 'inverse': {
            if (rowsA !== colsA) throw new Error('Matrix must be square for inverse');
            resultHtml = renderMatrixHtml(matInverse(A), 'A⁻¹'); break;
          }
          case 'rank': resultHtml = `<div class="result-card"><div class="result-label">rank(A)</div><div class="result-value">${matRank(A)}</div></div>`; break;
          case 'trace': {
            if (rowsA !== colsA) throw new Error('Matrix must be square for trace');
            resultHtml = `<div class="result-card"><div class="result-label">tr(A)</div><div class="result-value">${fmt(matTrace(A))}</div></div>`;
            break;
          }
          case 'dot': {
            if (rowsA !== 1 || rowsB !== 1 || colsA !== colsB) throw new Error('Dot product needs 1×n vectors of same length');
            const dot = A[0].reduce((s, v, i) => s + v * B[0][i], 0);
            resultHtml = `<div class="result-card"><div class="result-label">A · B</div><div class="result-value">${fmt(dot)}</div></div>`;
            break;
          }
          case 'cross': {
            if (colsA !== 3 || colsB !== 3) throw new Error('Cross product needs 3D vectors');
            const a = A[0], b = B[0];
            const c = [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
            resultHtml = renderMatrixHtml([c], 'A × B'); break;
          }
        }
        resEl.innerHTML = resultHtml;
        history.add({ category: 'matrix', op: activeOp });
      } catch(err) {
        resEl.innerHTML = `<div class="error">${err.message}</div>`;
      }
    });
  }

  renderOp();
}
