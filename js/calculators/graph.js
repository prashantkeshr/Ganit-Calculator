import { mathEngine } from '../math-engine.js';

export function renderGraph(container) {
  container.innerHTML = `
    <div class="calc-graph">
      <div class="graph-sidebar">
        <h3>Functions</h3>
        <div id="graph-fns"></div>
        <button id="graph-add-fn" class="btn btn-sm">+ Add Function</button>
        <div class="graph-controls">
          <div class="form-row"><label>X min</label><input type="number" id="g-xmin" value="-10" step="1"></div>
          <div class="form-row"><label>X max</label><input type="number" id="g-xmax" value="10" step="1"></div>
          <div class="form-row"><label>Y min</label><input type="number" id="g-ymin" value="-10" step="1"></div>
          <div class="form-row"><label>Y max</label><input type="number" id="g-ymax" value="10" step="1"></div>
          <button id="graph-plot" class="btn btn-calc-primary">Plot</button>
          <button id="graph-reset" class="btn btn-sm">Reset View</button>
        </div>
        <div id="graph-info" class="graph-info"></div>
      </div>
      <div class="graph-canvas-wrap">
        <canvas id="graph-canvas" width="600" height="500"></canvas>
        <div id="graph-tooltip" class="graph-tooltip" style="display:none"></div>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#graph-canvas');
  const ctx = canvas.getContext('2d');
  const tooltip = container.querySelector('#graph-tooltip');
  const fnList = container.querySelector('#graph-fns');

  const COLORS = ['#4F46E5','#0D9488','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#10B981'];
  let functions = [{ expr: 'sin(x)', color: COLORS[0], enabled: true }];
  let xMin = -10, xMax = 10, yMin = -10, yMax = 10;

  function getState() {
    xMin = parseFloat(container.querySelector('#g-xmin').value) || -10;
    xMax = parseFloat(container.querySelector('#g-xmax').value) || 10;
    yMin = parseFloat(container.querySelector('#g-ymin').value) || -10;
    yMax = parseFloat(container.querySelector('#g-ymax').value) || 10;
  }

  function toCanvas(x, y) {
    return {
      cx: (x - xMin) / (xMax - xMin) * canvas.width,
      cy: canvas.height - (y - yMin) / (yMax - yMin) * canvas.height,
    };
  }

  function fromCanvas(cx, cy) {
    return {
      x: xMin + (cx / canvas.width) * (xMax - xMin),
      y: yMin + (1 - cy / canvas.height) * (yMax - yMin),
    };
  }

  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-surface') || '#1e1e2e';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gridColor = 'rgba(128,128,128,0.2)', axisColor = 'rgba(128,128,128,0.5)';
    const labelColor = getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted') || '#888';

    // Grid lines
    const stepX = niceStep(xMax - xMin, 10), stepY = niceStep(yMax - yMin, 10);
    ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
    for (let x = Math.ceil(xMin / stepX) * stepX; x <= xMax; x += stepX) {
      const { cx } = toCanvas(x, 0);
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height); ctx.stroke();
    }
    for (let y = Math.ceil(yMin / stepY) * stepY; y <= yMax; y += stepY) {
      const { cy } = toCanvas(0, y);
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = axisColor; ctx.lineWidth = 2;
    const { cx: ax } = toCanvas(0, 0);
    ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, canvas.height); ctx.stroke();
    const { cy: ay } = toCanvas(0, 0);
    ctx.beginPath(); ctx.moveTo(0, ay); ctx.lineTo(canvas.width, ay); ctx.stroke();

    // Labels
    ctx.fillStyle = labelColor; ctx.font = '11px monospace'; ctx.textAlign = 'center';
    for (let x = Math.ceil(xMin / stepX) * stepX; x <= xMax; x += stepX) {
      if (Math.abs(x) < stepX * 0.01) continue;
      const { cx, cy } = toCanvas(x, 0);
      ctx.fillText(fmt(x), cx, Math.min(cy + 15, canvas.height - 5));
    }
    ctx.textAlign = 'right';
    for (let y = Math.ceil(yMin / stepY) * stepY; y <= yMax; y += stepY) {
      if (Math.abs(y) < stepY * 0.01) continue;
      const { cx, cy } = toCanvas(0, y);
      ctx.fillText(fmt(y), Math.max(ax - 4, 30), cy + 4);
    }
  }

  function plotFn(expr, color) {
    const steps = canvas.width * 2;
    const dx = (xMax - xMin) / steps;
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash([]);
    ctx.beginPath();
    let first = true, prevY = null;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      let y;
      try { y = mathEngine.evaluate(expr, { x }); }
      catch { first = true; prevY = null; continue; }
      if (!isFinite(y) || Math.abs(y - (prevY ?? y)) > (yMax - yMin) * 2) { first = true; prevY = null; continue; }
      const { cx, cy } = toCanvas(x, y);
      if (first) { ctx.moveTo(cx, cy); first = false; }
      else ctx.lineTo(cx, cy);
      prevY = y;
    }
    ctx.stroke();
  }

  function niceStep(range, target) {
    const raw = range / target;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / pow;
    if (norm < 1.5) return pow;
    if (norm < 3.5) return 2 * pow;
    if (norm < 7.5) return 5 * pow;
    return 10 * pow;
  }

  function fmt(n) { return Math.abs(n) >= 1000 || (Math.abs(n) < 0.01 && n !== 0) ? n.toExponential(1) : parseFloat(n.toPrecision(3)).toString(); }

  function plot() {
    getState();
    drawGrid();
    functions.forEach((fn, i) => {
      if (!fn.enabled) return;
      try { plotFn(fn.expr, fn.color); }
      catch {}
    });
  }

  function renderFnList() {
    fnList.innerHTML = functions.map((fn, i) => `
      <div class="graph-fn-row">
        <input type="color" class="fn-color" data-i="${i}" value="${fn.color}" style="width:28px;height:28px;border:none;cursor:pointer">
        <input type="text" class="fn-expr" data-i="${i}" value="${fn.expr}" placeholder="e.g. sin(x)" style="flex:1">
        <input type="checkbox" class="fn-enabled" data-i="${i}" ${fn.enabled ? 'checked' : ''} title="Show/hide">
        <button class="fn-del btn btn-sm btn-danger" data-i="${i}">×</button>
      </div>
    `).join('');

    fnList.querySelectorAll('.fn-color').forEach(el => {
      el.addEventListener('change', (e) => { functions[e.target.dataset.i].color = e.target.value; plot(); });
    });
    fnList.querySelectorAll('.fn-expr').forEach(el => {
      el.addEventListener('change', (e) => { functions[e.target.dataset.i].expr = e.target.value; plot(); });
      el.addEventListener('input', (e) => { functions[e.target.dataset.i].expr = e.target.value; });
    });
    fnList.querySelectorAll('.fn-enabled').forEach(el => {
      el.addEventListener('change', (e) => { functions[e.target.dataset.i].enabled = e.target.checked; plot(); });
    });
    fnList.querySelectorAll('.fn-del').forEach(el => {
      el.addEventListener('click', (e) => {
        functions.splice(parseInt(e.target.dataset.i), 1);
        renderFnList(); plot();
      });
    });
  }

  container.querySelector('#graph-add-fn').addEventListener('click', () => {
    functions.push({ expr: 'cos(x)', color: COLORS[functions.length % COLORS.length], enabled: true });
    renderFnList(); plot();
  });

  container.querySelector('#graph-plot').addEventListener('click', plot);

  container.querySelector('#graph-reset').addEventListener('click', () => {
    container.querySelector('#g-xmin').value = -10;
    container.querySelector('#g-xmax').value = 10;
    container.querySelector('#g-ymin').value = -10;
    container.querySelector('#g-ymax').value = 10;
    plot();
  });

  // Hover tooltip
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const cy = (e.clientY - rect.top) * (canvas.height / rect.height);
    const { x } = fromCanvas(cx, cy);
    const values = functions.filter(fn => fn.enabled).map(fn => {
      try { const y = mathEngine.evaluate(fn.expr, { x }); return `${fn.expr}: ${fmt(y)}`; }
      catch { return null; }
    }).filter(Boolean);
    if (values.length) {
      tooltip.style.display = 'block';
      tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
      tooltip.style.top  = (e.clientY - rect.top - 8) + 'px';
      tooltip.innerHTML = `<strong>x = ${fmt(x)}</strong><br>${values.join('<br>')}`;
    }
  });
  canvas.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

  // Pan & zoom
  let dragging = false, dragStart = null, dragRange = null;
  canvas.addEventListener('mousedown', (e) => {
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    dragRange = { xMin, xMax, yMin, yMax };
  });
  canvas.addEventListener('mousemove', (e) => {
    if (!dragging || !dragStart) return;
    const rect = canvas.getBoundingClientRect();
    const dx = (e.clientX - dragStart.x) / rect.width * (dragRange.xMax - dragRange.xMin);
    const dy = (e.clientY - dragStart.y) / rect.height * (dragRange.yMax - dragRange.yMin);
    xMin = dragRange.xMin - dx; xMax = dragRange.xMax - dx;
    yMin = dragRange.yMin + dy; yMax = dragRange.yMax + dy;
    container.querySelector('#g-xmin').value = xMin.toFixed(2);
    container.querySelector('#g-xmax').value = xMax.toFixed(2);
    container.querySelector('#g-ymin').value = yMin.toFixed(2);
    container.querySelector('#g-ymax').value = yMax.toFixed(2);
    plot();
  });
  window.addEventListener('mouseup', () => { dragging = false; });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width;
    const cy = (e.clientY - rect.top) / rect.height;
    const px = xMin + cx * (xMax - xMin);
    const py = yMax - cy * (yMax - yMin);
    xMin = px + (xMin - px) * factor; xMax = px + (xMax - px) * factor;
    yMin = py + (yMin - py) * factor; yMax = py + (yMax - py) * factor;
    container.querySelector('#g-xmin').value = xMin.toFixed(2);
    container.querySelector('#g-xmax').value = xMax.toFixed(2);
    container.querySelector('#g-ymin').value = yMin.toFixed(2);
    container.querySelector('#g-ymax').value = yMax.toFixed(2);
    plot();
  }, { passive: false });

  // Resize
  const ro = new ResizeObserver(() => {
    const wrap = container.querySelector('.graph-canvas-wrap');
    if (!wrap) return;
    canvas.width = wrap.clientWidth || 600;
    canvas.height = Math.max(400, wrap.clientHeight - 20);
    plot();
  });
  ro.observe(container.querySelector('.graph-canvas-wrap'));
  container._cleanup = () => ro.disconnect();

  renderFnList();
  plot();
}
