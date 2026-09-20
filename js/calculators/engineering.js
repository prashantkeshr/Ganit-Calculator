import { mathEngine } from '../math-engine.js';
import { history } from '../history.js';
import { store } from '../store.js';

export function renderEngineering(container) {
  let base = 10; // DEC
  let value = 0;
  let expression = '';
  let justEvaled = false;

  function toBin(n) { return (n >>> 0).toString(2); }
  function toOct(n) { return (n >>> 0).toString(8); }
  function toDec(n) { return n.toString(10); }
  function toHex(n) { return (n >>> 0).toString(16).toUpperCase(); }

  container.innerHTML = `
    <div class="calc-engineering">
      <div class="calc-display">
        <div class="calc-base-bar">
          <button class="base-btn ${base===16?'active':''}" data-base="16">HEX</button>
          <button class="base-btn ${base===10?'active':''}" data-base="10">DEC</button>
          <button class="base-btn ${base===8?'active':''}"  data-base="8">OCT</button>
          <button class="base-btn ${base===2?'active':''}"  data-base="2">BIN</button>
        </div>
        <div class="calc-expression" id="eng-expr" aria-live="polite"></div>
        <div class="calc-result" id="eng-result" aria-live="polite">0</div>
        <div class="eng-representations">
          <span class="rep-label">HEX:</span><span id="eng-hex">0</span>
          <span class="rep-label">DEC:</span><span id="eng-dec">0</span>
          <span class="rep-label">OCT:</span><span id="eng-oct">0</span>
          <span class="rep-label">BIN:</span><span id="eng-bin">0</span>
        </div>
      </div>

      <div class="eng-buttons">
        <!-- Hex digits + bitwise -->
        <button class="btn btn-hex" data-insert="A">A</button>
        <button class="btn btn-hex" data-insert="B">B</button>
        <button class="btn btn-hex" data-insert="C">C</button>
        <button class="btn btn-bitwise" data-fn="AND">AND</button>
        <button class="btn btn-bitwise" data-fn="OR">OR</button>
        <button class="btn btn-bitwise" data-fn="XOR">XOR</button>

        <button class="btn btn-hex" data-insert="D">D</button>
        <button class="btn btn-hex" data-insert="E">E</button>
        <button class="btn btn-hex" data-insert="F">F</button>
        <button class="btn btn-bitwise" data-fn="NOT">NOT</button>
        <button class="btn btn-bitwise" data-fn="LSH">LSH</button>
        <button class="btn btn-bitwise" data-fn="RSH">RSH</button>

        <!-- Standard row -->
        <button class="btn btn-clear" data-action="AC">AC</button>
        <button class="btn btn-clear" data-action="CE">CE</button>
        <button class="btn btn-op"    data-insert="÷">÷</button>
        <button class="btn btn-op"    data-insert="×">×</button>
        <button class="btn btn-op"    data-insert="−">−</button>
        <button class="btn btn-op"    data-insert="+">+</button>

        <button class="btn btn-num" data-insert="7">7</button>
        <button class="btn btn-num" data-insert="8">8</button>
        <button class="btn btn-num" data-insert="9">9</button>
        <button class="btn btn-num" data-insert="4">4</button>
        <button class="btn btn-num" data-insert="5">5</button>
        <button class="btn btn-num" data-insert="6">6</button>

        <button class="btn btn-num" data-insert="1">1</button>
        <button class="btn btn-num" data-insert="2">2</button>
        <button class="btn btn-num" data-insert="3">3</button>
        <button class="btn btn-num btn-zero" data-insert="0">0</button>
        <button class="btn btn-fn"  data-fn="mod">MOD</button>
        <button class="btn btn-equals btn-span-2" data-action="=">=</button>
      </div>

      <div class="eng-unit-converter">
        <h3>Unit Converter</h3>
        <select id="eng-unit-cat">
          <option value="length">Length</option>
          <option value="mass">Mass</option>
          <option value="temperature">Temperature</option>
          <option value="area">Area</option>
          <option value="volume">Volume</option>
          <option value="speed">Speed</option>
          <option value="time">Time</option>
          <option value="pressure">Pressure</option>
          <option value="energy">Energy</option>
          <option value="data">Data</option>
        </select>
        <div class="unit-row">
          <input type="number" id="eng-unit-from-val" placeholder="Value" value="1">
          <select id="eng-unit-from"></select>
          <span>=</span>
          <input type="number" id="eng-unit-to-val" readonly>
          <select id="eng-unit-to"></select>
        </div>
      </div>
    </div>
  `;

  const exprEl    = container.querySelector('#eng-expr');
  const resultEl  = container.querySelector('#eng-result');
  const hexEl     = container.querySelector('#eng-hex');
  const decEl     = container.querySelector('#eng-dec');
  const octEl     = container.querySelector('#eng-oct');
  const binEl     = container.querySelector('#eng-bin');

  function updateRepresentations(n) {
    const i = Math.trunc(n);
    hexEl.textContent = toHex(i);
    decEl.textContent = toDec(i);
    octEl.textContent = toOct(i);
    binEl.textContent = toBin(i);
  }

  function display() {
    exprEl.textContent = expression;
    if (value !== null && value !== undefined) {
      resultEl.textContent = mathEngine.formatResult(value, { base, precision: store.get('precision') });
      updateRepresentations(value);
    }
  }

  function evaluate() {
    if (!expression) return;
    const expr = expression
      .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
      .replace(/\bAND\b/g, '&').replace(/\bOR\b/g, '|')
      .replace(/\bXOR\b/g, '^').replace(/\bLSH\b/g, '<<').replace(/\bRSH\b/g, '>>')
      .replace(/\bMOD\b/g, '%');

    let result;
    if (base !== 10) {
      try { result = parseInt(expr, base); }
      catch { result = NaN; }
    } else {
      const r = mathEngine.tryEvaluate(expr);
      result = r.ok ? r.value : NaN;
    }

    if (isNaN(result)) {
      resultEl.textContent = 'Error';
    } else {
      const fmt = mathEngine.formatResult(result, { base, precision: store.get('precision') });
      history.add({ category: 'engineering', expression, result: fmt, raw: result });
      value = result;
      expression = fmt;
      justEvaled = true;
    }
    display();
  }

  // Base buttons
  container.querySelectorAll('.base-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      base = parseInt(btn.dataset.base);
      container.querySelectorAll('.base-btn').forEach(b => b.classList.toggle('active', b.dataset.base == base));
      // Update hex digit availability
      ['A','B','C','D','E','F'].forEach(h => {
        const b = container.querySelector(`[data-insert="${h}"]`);
        if (b) b.disabled = base < 16;
      });
      ['8','9'].forEach(d => {
        const b = container.querySelector(`[data-insert="${d}"]`);
        if (b) b.disabled = base < 10;
      });
      ['2','3','4','5','6','7'].forEach(d => {
        const b = container.querySelector(`[data-insert="${d}"]`);
        if (b) b.disabled = base < 8;
      });
      display();
    });
  });

  // Calc buttons
  container.querySelectorAll('.eng-buttons .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const insert = btn.dataset.insert;
      const fn     = btn.dataset.fn;

      if (action === '=') { evaluate(); return; }
      if (action === 'AC') { expression = ''; value = 0; justEvaled = false; display(); return; }
      if (action === 'CE') { expression = expression.slice(0, -1); display(); return; }

      if (justEvaled && insert && /[0-9A-Fa-f.]/.test(insert)) { expression = ''; justEvaled = false; }

      if (insert) { expression += insert; display(); return; }
      if (fn) {
        if (fn === 'NOT') {
          const n = parseInt(expression || '0', base);
          value = ~n;
          expression = mathEngine.formatResult(value, { base });
          display();
        } else {
          expression += ` ${fn} `;
          display();
        }
      }
    });
  });

  // Unit Converter
  const UNIT_DATA = {
    length: {
      m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254, nm: 1e-9,
    },
    mass: {
      kg: 1, g: 0.001, mg: 1e-6, lb: 0.453592, oz: 0.028349, t: 1000,
    },
    area: {
      'm²': 1, 'km²': 1e6, 'cm²': 1e-4, 'ft²': 0.092903, 'in²': 0.000645, acre: 4046.86, ha: 10000,
    },
    volume: {
      L: 1, mL: 0.001, 'm³': 1000, 'ft³': 28.3168, gal: 3.78541, qt: 0.946353, cup: 0.236588, fl_oz: 0.029574,
    },
    speed: {
      'm/s': 1, 'km/h': 0.277778, mph: 0.44704, knot: 0.514444, fps: 0.3048,
    },
    time: {
      s: 1, ms: 0.001, min: 60, h: 3600, day: 86400, week: 604800, month: 2629800, year: 31557600,
    },
    pressure: {
      Pa: 1, kPa: 1000, MPa: 1e6, bar: 1e5, atm: 101325, psi: 6894.76, mmHg: 133.322,
    },
    energy: {
      J: 1, kJ: 1000, cal: 4.184, kcal: 4184, Wh: 3600, kWh: 3.6e6, eV: 1.602e-19, BTU: 1055.06,
    },
    data: {
      B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776, bit: 0.125,
    },
  };

  function populateUnitSelects(cat) {
    const units = Object.keys(UNIT_DATA[cat] || {});
    const fromSel = container.querySelector('#eng-unit-from');
    const toSel   = container.querySelector('#eng-unit-to');
    fromSel.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join('');
    toSel.innerHTML   = units.map(u => `<option value="${u}">${u}</option>`).join('');
    if (units.length > 1) toSel.selectedIndex = 1;
    convertUnits();
  }

  function convertUnits() {
    const cat     = container.querySelector('#eng-unit-cat').value;
    const fromU   = container.querySelector('#eng-unit-from').value;
    const toU     = container.querySelector('#eng-unit-to').value;
    const fromVal = parseFloat(container.querySelector('#eng-unit-from-val').value) || 0;
    const toValEl = container.querySelector('#eng-unit-to-val');
    const data    = UNIT_DATA[cat];

    if (!data) return;
    if (cat === 'temperature') {
      toValEl.value = convertTemp(fromVal, fromU, toU);
      return;
    }
    const fromFactor = data[fromU];
    const toFactor   = data[toU];
    if (fromFactor == null || toFactor == null) return;
    toValEl.value = parseFloat(((fromVal * fromFactor) / toFactor).toPrecision(10));
  }

  function convertTemp(val, from, to) {
    let celsius;
    if (from === '°C') celsius = val;
    else if (from === '°F') celsius = (val - 32) * 5/9;
    else if (from === 'K') celsius = val - 273.15;
    else return val;
    if (to === '°C') return celsius;
    if (to === '°F') return celsius * 9/5 + 32;
    if (to === 'K') return celsius + 273.15;
    return val;
  }

  container.querySelector('#eng-unit-cat').addEventListener('change', (e) => {
    if (e.target.value === 'temperature') {
      const fromSel = container.querySelector('#eng-unit-from');
      const toSel   = container.querySelector('#eng-unit-to');
      const units   = ['°C', '°F', 'K'];
      fromSel.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join('');
      toSel.innerHTML   = units.map(u => `<option value="${u}">${u}</option>`).join('');
      toSel.selectedIndex = 1;
      convertUnits();
    } else {
      populateUnitSelects(e.target.value);
    }
  });
  container.querySelector('#eng-unit-from-val').addEventListener('input', convertUnits);
  container.querySelector('#eng-unit-from').addEventListener('change', convertUnits);
  container.querySelector('#eng-unit-to').addEventListener('change', convertUnits);

  populateUnitSelects('length');
  display();
}
