import { history } from '../history.js';

/* ── unit definitions — all stored as SI base unit multipliers ─── */
const CATEGORIES = {
  length: {
    label: 'Length',
    icon: '📏',
    base: 'm',
    units: {
      mm:  { label: 'Millimetre (mm)',  factor: 0.001 },
      cm:  { label: 'Centimetre (cm)',  factor: 0.01 },
      m:   { label: 'Metre (m)',        factor: 1 },
      km:  { label: 'Kilometre (km)',   factor: 1000 },
      in:  { label: 'Inch (in)',        factor: 0.0254 },
      ft:  { label: 'Foot (ft)',        factor: 0.3048 },
      yd:  { label: 'Yard (yd)',        factor: 0.9144 },
      mi:  { label: 'Mile (mi)',        factor: 1609.344 },
      nmi: { label: 'Nautical mile',    factor: 1852 },
    }
  },
  weight: {
    label: 'Weight / Mass',
    icon: '⚖️',
    base: 'kg',
    units: {
      mg:  { label: 'Milligram (mg)',  factor: 1e-6 },
      g:   { label: 'Gram (g)',        factor: 0.001 },
      kg:  { label: 'Kilogram (kg)',   factor: 1 },
      t:   { label: 'Metric Ton (t)',  factor: 1000 },
      oz:  { label: 'Ounce (oz)',      factor: 0.028349523 },
      lb:  { label: 'Pound (lb)',      factor: 0.45359237 },
      st:  { label: 'Stone (st)',      factor: 6.35029318 },
    }
  },
  temperature: {
    label: 'Temperature',
    icon: '🌡️',
    base: 'C',
    units: {
      C:  { label: 'Celsius (°C)',    factor: null },
      F:  { label: 'Fahrenheit (°F)', factor: null },
      K:  { label: 'Kelvin (K)',      factor: null },
      R:  { label: 'Rankine (°R)',    factor: null },
    }
  },
  speed: {
    label: 'Speed',
    icon: '💨',
    base: 'ms',
    units: {
      ms:   { label: 'm/s',          factor: 1 },
      kmh:  { label: 'km/h',         factor: 1/3.6 },
      mph:  { label: 'mph',          factor: 0.44704 },
      knot: { label: 'Knot',         factor: 0.514444 },
      fps:  { label: 'ft/s',         factor: 0.3048 },
    }
  },
  volume: {
    label: 'Volume',
    icon: '🫙',
    base: 'l',
    units: {
      ml:   { label: 'Millilitre (ml)',  factor: 0.001 },
      l:    { label: 'Litre (L)',        factor: 1 },
      m3:   { label: 'Cubic metre (m³)', factor: 1000 },
      floz: { label: 'Fl. oz (US)',      factor: 0.029573529 },
      cup:  { label: 'Cup (US)',         factor: 0.236588237 },
      pt:   { label: 'Pint (US)',        factor: 0.473176473 },
      qt:   { label: 'Quart (US)',       factor: 0.946352946 },
      gal:  { label: 'Gallon (US)',      factor: 3.785411784 },
    }
  },
  area: {
    label: 'Area',
    icon: '🟦',
    base: 'm2',
    units: {
      mm2:  { label: 'mm²',              factor: 1e-6 },
      cm2:  { label: 'cm²',              factor: 1e-4 },
      m2:   { label: 'm²',               factor: 1 },
      km2:  { label: 'km²',              factor: 1e6 },
      in2:  { label: 'in²',              factor: 0.00064516 },
      ft2:  { label: 'ft²',              factor: 0.09290304 },
      yd2:  { label: 'yd²',              factor: 0.83612736 },
      acre: { label: 'Acre',             factor: 4046.8564 },
      ha:   { label: 'Hectare (ha)',      factor: 10000 },
    }
  },
  time: {
    label: 'Time',
    icon: '⏱️',
    base: 's',
    units: {
      ms:  { label: 'Millisecond (ms)', factor: 0.001 },
      s:   { label: 'Second (s)',       factor: 1 },
      min: { label: 'Minute (min)',     factor: 60 },
      hr:  { label: 'Hour (hr)',        factor: 3600 },
      day: { label: 'Day',             factor: 86400 },
      wk:  { label: 'Week',            factor: 604800 },
      mo:  { label: 'Month (avg)',      factor: 2629800 },
      yr:  { label: 'Year',            factor: 31557600 },
    }
  },
  pressure: {
    label: 'Pressure',
    icon: '🔧',
    base: 'Pa',
    units: {
      Pa:   { label: 'Pascal (Pa)',    factor: 1 },
      kPa:  { label: 'Kilopascal',    factor: 1000 },
      MPa:  { label: 'Megapascal',    factor: 1e6 },
      bar:  { label: 'Bar',           factor: 1e5 },
      psi:  { label: 'PSI',           factor: 6894.757 },
      atm:  { label: 'Atmosphere',    factor: 101325 },
      mmHg: { label: 'mmHg / Torr',   factor: 133.322 },
    }
  },
  energy: {
    label: 'Energy',
    icon: '⚡',
    base: 'J',
    units: {
      J:    { label: 'Joule (J)',      factor: 1 },
      kJ:   { label: 'Kilojoule',     factor: 1000 },
      cal:  { label: 'Calorie (cal)', factor: 4.184 },
      kcal: { label: 'Kilocalorie',   factor: 4184 },
      Wh:   { label: 'Watt-hour',     factor: 3600 },
      kWh:  { label: 'kWh',          factor: 3.6e6 },
      BTU:  { label: 'BTU',           factor: 1055.056 },
      eV:   { label: 'Electronvolt',  factor: 1.60218e-19 },
    }
  },
  data: {
    label: 'Data',
    icon: '💾',
    base: 'B',
    units: {
      b:   { label: 'Bit (b)',          factor: 0.125 },
      B:   { label: 'Byte (B)',         factor: 1 },
      KB:  { label: 'Kilobyte (KB)',    factor: 1000 },
      MB:  { label: 'Megabyte (MB)',    factor: 1e6 },
      GB:  { label: 'Gigabyte (GB)',    factor: 1e9 },
      TB:  { label: 'Terabyte (TB)',    factor: 1e12 },
      KiB: { label: 'Kibibyte (KiB)',   factor: 1024 },
      MiB: { label: 'Mebibyte (MiB)',   factor: 1048576 },
      GiB: { label: 'Gibibyte (GiB)',   factor: 1073741824 },
    }
  },
};

/* ── temperature special-case ──────────────────────────────────── */
function toC(val, from) {
  if (from === 'C') return val;
  if (from === 'F') return (val - 32) * 5 / 9;
  if (from === 'K') return val - 273.15;
  if (from === 'R') return (val - 491.67) * 5 / 9;
}
function fromC(val, to) {
  if (to === 'C') return val;
  if (to === 'F') return val * 9 / 5 + 32;
  if (to === 'K') return val + 273.15;
  if (to === 'R') return (val + 273.15) * 9 / 5;
}

function convert(val, from, to, catId) {
  if (catId === 'temperature') return fromC(toC(val, from), to);
  const cat = CATEGORIES[catId];
  return val * cat.units[from].factor / cat.units[to].factor;
}

/* ── format result neatly ──────────────────────────────────────── */
function fmt(n) {
  if (!isFinite(n)) return '∞';
  if (Math.abs(n) === 0) return '0';
  if (Math.abs(n) >= 1e9 || (Math.abs(n) < 1e-4 && n !== 0)) {
    return n.toExponential(6);
  }
  // strip trailing zeros
  return parseFloat(n.toPrecision(10)).toString();
}

/* ── build all-unit table ─────────────────────────────────────── */
function buildTable(val, fromUnit, catId) {
  const cat = CATEGORIES[catId];
  return Object.entries(cat.units).map(([key, u]) => {
    const result = convert(val, fromUnit, key, catId);
    return `<tr${key === fromUnit ? ' class="uc-from-row"' : ''}>
      <td>${u.label}</td>
      <td class="uc-value">${fmt(result)}</td>
    </tr>`;
  }).join('');
}

/* ── main render ──────────────────────────────────────────────── */
export function renderUnitConverter(container, sub = 'length') {
  const catId = CATEGORIES[sub] ? sub : 'length';
  const cat = CATEGORIES[catId];
  const units = cat.units;
  const unitKeys = Object.keys(units);
  const defaultFrom = unitKeys[0];
  const defaultTo = unitKeys[2] || unitKeys[1];

  container.innerHTML = `
    <div class="calc-form">
      <div class="form-tabs uc-cat-tabs">
        ${Object.entries(CATEGORIES).map(([k, c]) =>
          `<button class="form-tab${k === catId ? ' active' : ''}" data-sub="${k}">${c.icon} ${c.label}</button>`
        ).join('')}
      </div>
      <div class="form-body">
        <form id="uc-form">
          <div class="uc-converter-row">
            <div class="uc-side">
              <label>From</label>
              <select id="uc-from" class="calc-select">
                ${unitKeys.map(k => `<option value="${k}">${units[k].label}</option>`).join('')}
              </select>
              <input type="number" id="uc-val" class="calc-input" value="1" step="any" placeholder="Value">
            </div>
            <button type="button" id="uc-swap" class="uc-swap-btn" title="Swap units">⇄</button>
            <div class="uc-side">
              <label>To</label>
              <select id="uc-to" class="calc-select">
                ${unitKeys.map((k, i) => `<option value="${k}"${i === 2 ? ' selected' : ''}>${units[k].label}</option>`).join('')}
              </select>
              <div id="uc-single-result" class="uc-result-display">—</div>
            </div>
          </div>
          <button type="submit" class="btn btn-calc-primary">Convert All</button>
        </form>

        <div id="uc-table-wrap" class="calc-output" style="display:none">
          <div class="calc-section-title">All conversions from <span id="uc-from-label"></span></div>
          <table class="calc-table uc-table">
            <thead><tr><th>Unit</th><th>Value</th></tr></thead>
            <tbody id="uc-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // live single result
  const valEl  = container.querySelector('#uc-val');
  const fromEl = container.querySelector('#uc-from');
  const toEl   = container.querySelector('#uc-to');
  const res    = container.querySelector('#uc-single-result');

  function updateSingle() {
    const v = parseFloat(valEl.value);
    if (isNaN(v)) { res.textContent = '—'; return; }
    const r = convert(v, fromEl.value, toEl.value, catId);
    res.textContent = fmt(r) + ' ' + toEl.options[toEl.selectedIndex].text.split(' ')[0];
  }

  valEl.addEventListener('input', updateSingle);
  fromEl.addEventListener('change', updateSingle);
  toEl.addEventListener('change', updateSingle);
  updateSingle();

  // swap
  container.querySelector('#uc-swap').addEventListener('click', () => {
    const tmp = fromEl.value;
    fromEl.value = toEl.value;
    toEl.value = tmp;
    updateSingle();
  });

  // convert all
  container.querySelector('#uc-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = parseFloat(valEl.value);
    if (isNaN(v)) return;
    const from = fromEl.value;
    const tbody = container.querySelector('#uc-tbody');
    const wrap  = container.querySelector('#uc-table-wrap');
    container.querySelector('#uc-from-label').textContent = `${fmt(v)} ${units[from].label}`;
    tbody.innerHTML = buildTable(v, from, catId);
    wrap.style.display = '';
    history.add({ category: 'unit-converter', tool: catId, from, value: v });
  });

  // category tabs
  container.querySelectorAll('.form-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      import('../router.js').then(({ router }) => router.go(`/unit-converter/${btn.dataset.sub}`));
    });
  });
}
