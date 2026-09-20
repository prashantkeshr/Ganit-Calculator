import { mathEngine } from '../math-engine.js';
import { history } from '../history.js';
import { store } from '../store.js';

export function renderScientific(container) {
  let mode = store.get('angleMode') || 'DEG';
  let expression = '';
  let lastResult = null;
  let justEvaled = false;
  let shift = false;
  let hyp = false;

  container.innerHTML = `
    <div class="calc-scientific">
      <div class="calc-display">
        <div class="calc-mode-bar">
          <button class="mode-btn ${mode==='DEG'?'active':''}" data-mode="DEG">DEG</button>
          <button class="mode-btn ${mode==='RAD'?'active':''}" data-mode="RAD">RAD</button>
          <button class="mode-btn ${mode==='GRAD'?'active':''}" data-mode="GRAD">GRAD</button>
          <span class="mode-shift" id="sci-shift-ind"></span>
          <span class="mode-hyp"   id="sci-hyp-ind"></span>
        </div>
        <div class="calc-expression" id="sci-expr" aria-live="polite"></div>
        <div class="calc-result" id="sci-result" aria-live="polite">0</div>
      </div>

      <div class="calc-sci-buttons">
        <!-- Row 0 -->
        <button class="btn btn-fn" data-insert="(" >(</button>
        <button class="btn btn-fn" data-insert=")" >)</button>
        <button class="btn btn-fn" data-insert="%" >%</button>
        <button class="btn btn-fn" id="sci-shift" >SHIFT</button>
        <button class="btn btn-fn" id="sci-hyp"   >HYP</button>

        <!-- Row 1 -->
        <button class="btn btn-fn" data-fn="sin"  data-shift="asin"  data-hyp="sinh"  data-shypf="asinh">sin</button>
        <button class="btn btn-fn" data-fn="cos"  data-shift="acos"  data-hyp="cosh"  data-shypf="acosh">cos</button>
        <button class="btn btn-fn" data-fn="tan"  data-shift="atan"  data-hyp="tanh"  data-shypf="atanh">tan</button>
        <button class="btn btn-fn" data-fn="log"  data-shift="log2"  >log</button>
        <button class="btn btn-fn" data-fn="ln"   data-shift="exp"   >ln</button>

        <!-- Row 2 -->
        <button class="btn btn-fn" data-fn="sqrt"        data-shift="cbrt"  >√</button>
        <button class="btn btn-fn" data-insert="^2"      data-shift="^3"    >x²</button>
        <button class="btn btn-fn" data-insert="^"                          >xʸ</button>
        <button class="btn btn-fn" data-fn="factorial"   data-insert2="!"   >n!</button>
        <button class="btn btn-fn" data-fn="nCr"                            >ⁿCᵣ</button>

        <!-- Row 3 -->
        <button class="btn btn-fn" data-const="pi">π</button>
        <button class="btn btn-fn" data-const="e">e</button>
        <button class="btn btn-fn" data-const="phi">φ</button>
        <button class="btn btn-fn" data-fn="abs">|x|</button>
        <button class="btn btn-fn" data-fn="floor">⌊x⌋</button>

        <!-- Row 4 — standard buttons -->
        <button class="btn btn-clear" data-action="AC">AC</button>
        <button class="btn btn-clear" data-action="CE">CE</button>
        <button class="btn btn-op"    data-insert="÷">÷</button>
        <button class="btn btn-op"    data-insert="×">×</button>
        <button class="btn btn-op"    data-insert="−">−</button>

        <!-- Row 5 -->
        <button class="btn btn-num" data-insert="7">7</button>
        <button class="btn btn-num" data-insert="8">8</button>
        <button class="btn btn-num" data-insert="9">9</button>
        <button class="btn btn-fn"  data-fn="nPr">ⁿPᵣ</button>
        <button class="btn btn-op"  data-insert="+">+</button>

        <!-- Row 6 -->
        <button class="btn btn-num" data-insert="4">4</button>
        <button class="btn btn-num" data-insert="5">5</button>
        <button class="btn btn-num" data-insert="6">6</button>
        <button class="btn btn-fn"  data-fn="log10">log₁₀</button>
        <button class="btn btn-fn"  data-insert="EE">×10^</button>

        <!-- Row 7 -->
        <button class="btn btn-num" data-insert="1">1</button>
        <button class="btn btn-num" data-insert="2">2</button>
        <button class="btn btn-num" data-insert="3">3</button>
        <button class="btn btn-fn"  data-fn="reciprocal">1/x</button>
        <button class="btn btn-equals" data-action="=">=</button>

        <!-- Row 8 -->
        <button class="btn btn-num btn-zero"  data-insert="0">0</button>
        <button class="btn btn-num"           data-insert=".">.</button>
        <button class="btn btn-fn"            data-action="±">±</button>
        <button class="btn btn-fn"            data-insert="E">E</button>
      </div>
    </div>
  `;

  const exprEl    = container.querySelector('#sci-expr');
  const resultEl  = container.querySelector('#sci-result');
  const shiftInd  = container.querySelector('#sci-shift-ind');
  const hypInd    = container.querySelector('#sci-hyp-ind');

  function updateMode() {
    container.querySelectorAll('.mode-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.mode === mode));
    mathEngine.setMode(mode);
    store.set('angleMode', mode);
  }

  function refreshFnLabels() {
    shiftInd.textContent = shift ? 'SHIFT' : '';
    hypInd.textContent   = hyp   ? 'HYP'   : '';
    container.querySelectorAll('[data-fn]').forEach(btn => {
      const base = btn.dataset.fn;
      const shiftFn = btn.dataset.shift;
      const hypFn   = btn.dataset.hyp;
      const shypFn  = btn.dataset.shypf;
      if      (shift && hyp && shypFn) btn.textContent = shypFn;
      else if (shift && shiftFn)       btn.textContent = shiftFn;
      else if (hyp && hypFn)           btn.textContent = hypFn;
      else                             btn.textContent = base;
    });
  }

  function display() {
    exprEl.textContent = expression;
    resultEl.textContent = lastResult !== null ? lastResult : expression || '0';
  }

  function evaluate() {
    if (!expression) return;
    const expr = expression.replace(/×10\^/g, '*10^').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
    const res = mathEngine.tryEvaluate(expr);
    if (res.ok) {
      const fmt = mathEngine.formatResult(res.value, { precision: store.get('precision') });
      history.add({ category: 'scientific', expression, result: fmt, raw: res.value });
      lastResult = fmt;
      expression = fmt;
      justEvaled = true;
    } else {
      resultEl.textContent = 'Error';
      expression = '';
    }
    display();
  }

  function insertFn(name) {
    // Resolve shift/hyp
    let fn = name;
    const btn = container.querySelector(`[data-fn="${name}"]`);
    if (btn) {
      if (shift && hyp && btn.dataset.shypf) fn = btn.dataset.shypf;
      else if (shift && btn.dataset.shift)   fn = btn.dataset.shift;
      else if (hyp && btn.dataset.hyp)       fn = btn.dataset.hyp;
    }
    if (justEvaled) { expression = ''; justEvaled = false; }
    if (fn === 'factorial') {
      expression += '!';
    } else if (fn === 'nCr' || fn === 'nPr') {
      expression += `)${fn}(`;
    } else {
      expression += `${fn}(`;
    }
    display();
    if (shift || hyp) { shift = false; hyp = false; refreshFnLabels(); }
  }

  // Button click handler
  container.querySelectorAll('.calc-sci-buttons .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.id === 'sci-shift') { shift = !shift; refreshFnLabels(); return; }
      if (btn.id === 'sci-hyp')   { hyp   = !hyp;   refreshFnLabels(); return; }

      if (btn.dataset.mode) { mode = btn.dataset.mode; updateMode(); return; }

      const action = btn.dataset.action;
      const insert = btn.dataset.insert;
      const fn     = btn.dataset.fn;
      const cst    = btn.dataset.const;

      if (action === '=') { evaluate(); return; }
      if (action === 'AC') { expression = ''; lastResult = null; justEvaled = false; display(); return; }
      if (action === 'CE') { expression = expression.slice(0, -1); display(); return; }
      if (action === '±') {
        if (expression.startsWith('-')) expression = expression.slice(1);
        else if (expression) expression = '-' + expression;
        display(); return;
      }

      if (justEvaled && (insert || fn || cst)) { expression = ''; justEvaled = false; }

      if (insert) { expression += insert === 'EE' ? '*10^(' : insert; display(); return; }
      if (cst)    { expression += cst; display(); return; }
      if (fn)     { insertFn(fn); return; }
    });
  });

  container.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => { mode = btn.dataset.mode; updateMode(); });
  });

  // Keyboard
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const map = {
      'Enter': '=', 'Escape': 'AC', 'Backspace': 'CE',
    };
    if (map[e.key]) { e.preventDefault(); handleKeyAction(map[e.key]); return; }
    if (/[0-9.+\-*\/()^%]/.test(e.key)) {
      e.preventDefault();
      const k = e.key.replace('*', '×').replace('/', '÷');
      if (justEvaled && /[0-9.(]/.test(k)) { expression = ''; justEvaled = false; }
      expression += k;
      display();
    }
  }

  function handleKeyAction(a) {
    if (a === '=') evaluate();
    if (a === 'AC') { expression = ''; lastResult = null; justEvaled = false; display(); }
    if (a === 'CE') { expression = expression.slice(0, -1); display(); }
  }

  document.addEventListener('keydown', onKey);
  container._cleanup = () => document.removeEventListener('keydown', onKey);

  updateMode();
  display();
}
