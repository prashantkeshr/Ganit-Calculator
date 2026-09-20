import { mathEngine } from '../math-engine.js';
import { history } from '../history.js';
import { store } from '../store.js';

export function renderBasic(container) {
  container.innerHTML = `
    <div class="calc-basic">
      <div class="calc-display">
        <div class="calc-expression" id="basic-expr" aria-live="polite"></div>
        <div class="calc-result" id="basic-result" aria-live="polite">0</div>
      </div>
      <div class="calc-memory-bar">
        <button class="mem-btn" data-action="mc"  title="Memory Clear">MC</button>
        <button class="mem-btn" data-action="mr"  title="Memory Recall">MR</button>
        <button class="mem-btn" data-action="m+"  title="Memory Add">M+</button>
        <button class="mem-btn" data-action="m-"  title="Memory Subtract">M−</button>
        <button class="mem-btn" data-action="ms"  title="Memory Store">MS</button>
        <span class="mem-indicator" id="basic-mem"></span>
      </div>
      <div class="calc-buttons">
        <button class="btn btn-clear"    data-action="AC">AC</button>
        <button class="btn btn-clear"    data-action="CE">CE</button>
        <button class="btn btn-op"       data-action="%">%</button>
        <button class="btn btn-op-main"  data-action="÷">÷</button>

        <button class="btn btn-num" data-action="7">7</button>
        <button class="btn btn-num" data-action="8">8</button>
        <button class="btn btn-num" data-action="9">9</button>
        <button class="btn btn-op-main"  data-action="×">×</button>

        <button class="btn btn-num" data-action="4">4</button>
        <button class="btn btn-num" data-action="5">5</button>
        <button class="btn btn-num" data-action="6">6</button>
        <button class="btn btn-op-main"  data-action="−">−</button>

        <button class="btn btn-num" data-action="1">1</button>
        <button class="btn btn-num" data-action="2">2</button>
        <button class="btn btn-num" data-action="3">3</button>
        <button class="btn btn-op-main btn-span-2" data-action="+">+</button>

        <button class="btn btn-num btn-zero"  data-action="0">0</button>
        <button class="btn btn-num"           data-action=".">.</button>
        <button class="btn btn-equals"        data-action="=">=</button>
      </div>
    </div>
  `;

  const exprEl   = container.querySelector('#basic-expr');
  const resultEl = container.querySelector('#basic-result');
  const memEl    = container.querySelector('#basic-mem');

  let expression  = '';
  let lastResult  = null;
  let justEvaled  = false;
  let memory      = store.get('memory') || 0;

  function updateMemDisplay() {
    memEl.textContent = memory !== 0 ? `M: ${memory}` : '';
  }
  updateMemDisplay();

  function display() {
    exprEl.textContent   = expression;
    resultEl.textContent = lastResult !== null ? lastResult : expression || '0';
  }

  function evaluate() {
    if (!expression) return;
    const expr = expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
    const res = mathEngine.tryEvaluate(expr);
    if (res.ok) {
      const formatted = mathEngine.formatResult(res.value, { precision: store.get('precision') });
      history.add({ category: 'basic', expression, result: formatted, raw: res.value });
      lastResult = formatted;
      expression = formatted;
      justEvaled = true;
    } else {
      resultEl.textContent = 'Error';
      expression = '';
    }
    display();
  }

  function handleAction(action) {
    if (justEvaled && /[0-9.]/.test(action)) {
      expression = ''; justEvaled = false;
    } else if (justEvaled && /[+\-×÷%]/.test(action)) {
      justEvaled = false;
    }

    switch (action) {
      case 'AC':
        expression = ''; lastResult = null; justEvaled = false;
        break;
      case 'CE':
        expression = expression.slice(0, -1);
        break;
      case '=':
        evaluate();
        return;
      case '±':
        if (expression.startsWith('-')) expression = expression.slice(1);
        else if (expression) expression = '-' + expression;
        break;
      default:
        expression += action;
    }
    display();
  }

  // Memory operations
  container.querySelectorAll('.mem-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cur = lastResult !== null ? parseFloat(lastResult) : parseFloat(expression) || 0;
      switch (btn.dataset.action) {
        case 'mc': memory = 0; break;
        case 'mr':
          if (justEvaled) expression = ''; justEvaled = false;
          expression += String(memory);
          display(); break;
        case 'm+': memory += cur; break;
        case 'm-': memory -= cur; break;
        case 'ms': memory = cur; break;
      }
      store.set('memory', memory);
      updateMemDisplay();
    });
  });

  // Calculator buttons
  container.querySelectorAll('.calc-buttons .btn').forEach(btn => {
    btn.addEventListener('click', () => handleAction(btn.dataset.action));
  });

  // Keyboard
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const map = {
      'Enter': '=', 'Escape': 'AC', 'Backspace': 'CE',
      '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
      '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
      '.': '.', '+': '+', '-': '−', '*': '×', '/': '÷',
      '%': '%', '=': '=',
    };
    if (map[e.key]) { e.preventDefault(); handleAction(map[e.key]); }
  }
  document.addEventListener('keydown', onKey);
  container._cleanup = () => document.removeEventListener('keydown', onKey);

  display();
}
