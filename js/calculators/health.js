import { history } from '../history.js';

function fmt(n, dp = 1) {
  return typeof n === 'number' ? n.toFixed(dp) : n;
}

function bmi({ weight, height, unit = 'metric' }) {
  const h = unit === 'imperial' ? height * 0.0254 : height / 100;
  const w = unit === 'imperial' ? weight * 0.453592 : weight;
  const val = w / (h * h);
  const cat = val < 18.5 ? 'Underweight' : val < 25 ? 'Normal' : val < 30 ? 'Overweight' : 'Obese';
  return { bmi: val, category: cat };
}

function bmr({ weight, height, age, gender, unit = 'metric' }) {
  const h = unit === 'imperial' ? height * 2.54 : height;
  const w = unit === 'imperial' ? weight * 0.453592 : weight;
  const mifflin = gender === 'male'
    ? 10 * w + 6.25 * h - 5 * age + 5
    : 10 * w + 6.25 * h - 5 * age - 161;
  const harris = gender === 'male'
    ? 66.5 + 13.75 * w + 5.003 * h - 6.75 * age
    : 655.1 + 9.563 * w + 1.850 * h - 4.676 * age;
  const katch = 370 + 21.6 * w * (1 - 0.2); // assumes ~80% LBM
  return { mifflin, harris, katch };
}

function tdee({ bmrVal, activity }) {
  const factors = { sedentary: 1.2, lightly_active: 1.375, moderately_active: 1.55, very_active: 1.725, extra_active: 1.9 };
  return bmrVal * (factors[activity] || 1.2);
}

function bodyFat({ neck, waist, hip, height, gender, unit = 'metric' }) {
  const toIn = (v) => unit === 'metric' ? v / 2.54 : v;
  const n = toIn(neck), w = toIn(waist), hi = toIn(hip), h = toIn(height);
  const navy = gender === 'male'
    ? 86.010 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76
    : 163.205 * Math.log10(w + hi - n) - 97.684 * Math.log10(h) - 78.387;
  return { navy: Math.max(navy, 0) };
}

function idealWeight({ height, gender, unit = 'metric' }) {
  const hCm = unit === 'imperial' ? height * 2.54 : height;
  const hIn = hCm / 2.54;
  const devine = gender === 'male' ? 50 + 2.3 * (hIn - 60) : 45.5 + 2.3 * (hIn - 60);
  const bmi22 = 22 * Math.pow(hCm / 100, 2);
  const robinson = gender === 'male' ? 52 + 1.9 * (hIn - 60) : 49 + 1.7 * (hIn - 60);
  const miller = gender === 'male' ? 56.2 + 1.41 * (hIn - 60) : 53.1 + 1.36 * (hIn - 60);
  return { devine, bmi22, robinson, miller };
}

function waterIntake({ weight, activity, climate, unit = 'metric' }) {
  const w = unit === 'imperial' ? weight * 0.453592 : weight;
  let base = w * 0.033; // L
  if (activity === 'moderate') base *= 1.2;
  if (activity === 'heavy')    base *= 1.5;
  if (climate === 'hot')       base *= 1.15;
  return { liters: base, cups: base * 4.227, oz: base * 33.814 };
}

const TOOLS = {
  bmi: {
    label: 'BMI Calculator',
    // Reverse-capable: weight, height, bmi — leave one blank to solve
    reverseVars: [
      { id: 'weight', label: 'Weight (W)', suffix: ' kg' },
      { id: 'height', label: 'Height (H)', suffix: ' cm' },
      { id: 'bmiVal', label: 'BMI', hint: '18.5–24.9 = Normal' },
    ],
    reverseDefaults: { weight: 70, height: 175, bmiVal: '' },
    reverseSolve(v) {
      const { weight, height, bmiVal } = v;
      if (weight == null) {
        const W = bmiVal * Math.pow(height / 100, 2);
        return { id: 'weight', value: W, unit: ' kg', label: `BMI × (H÷100)²`, extra: bmi({weight:W,height}).category };
      }
      if (height == null) {
        const H = Math.sqrt(weight / bmiVal) * 100;
        return { id: 'height', value: H, unit: ' cm', label: `√(W÷BMI) × 100` };
      }
      const B = weight / Math.pow(height / 100, 2);
      const cat = B < 18.5 ? 'Underweight' : B < 25 ? 'Normal' : B < 30 ? 'Overweight' : 'Obese';
      return { id: 'bmiVal', value: B, label: `W ÷ (H÷100)²`, extra: cat };
    },
    equation: 'BMI = W ÷ (H ÷ 100)²',
    hint: 'Leave any one field blank — it will be computed.',
    fields: [
      { id: 'weight', label: 'Weight', suffix: 'kg', default: 70 },
      { id: 'height', label: 'Height', suffix: 'cm', default: 175 },
    ],
    compute(f) {
      const r = bmi(f);
      return `
        <div class="result-grid">
          <div class="result-card"><div class="result-label">BMI</div><div class="result-value">${fmt(r.bmi)}</div></div>
          <div class="result-card"><div class="result-label">Category</div><div class="result-value">${r.category}</div></div>
        </div>
        <div class="bmi-scale">
          <div class="bmi-bar" style="--bmi:${Math.min(r.bmi, 40)}"></div>
          <div class="bmi-labels">
            <span>Underweight<br>&lt;18.5</span>
            <span>Normal<br>18.5–25</span>
            <span>Overweight<br>25–30</span>
            <span>Obese<br>&gt;30</span>
          </div>
        </div>
      `;
    }
  },
  bmr: {
    label: 'BMR / TDEE',
    fields: [
      { id: 'weight', label: 'Weight (kg)', default: 70 },
      { id: 'height', label: 'Height (cm)', default: 175 },
      { id: 'age',    label: 'Age', default: 30, min: 1, max: 120 },
    ],
    compute(f) {
      const gender = 'male';
      const r = bmr({ ...f, gender });
      const activities = [
        { key: 'sedentary', label: 'Sedentary' },
        { key: 'lightly_active', label: 'Light Exercise' },
        { key: 'moderately_active', label: 'Moderate Exercise' },
        { key: 'very_active', label: 'Heavy Exercise' },
        { key: 'extra_active', label: 'Athlete' },
      ];
      return `
        <div class="result-grid">
          <div class="result-card"><div class="result-label">BMR (Mifflin)</div><div class="result-value">${Math.round(r.mifflin)} kcal</div></div>
          <div class="result-card"><div class="result-label">BMR (Harris-Benedict)</div><div class="result-value">${Math.round(r.harris)} kcal</div></div>
        </div>
        <h3>TDEE by Activity</h3>
        <div class="result-grid">
          ${activities.map(a => `
            <div class="result-card">
              <div class="result-label">${a.label}</div>
              <div class="result-value">${Math.round(tdee({ bmrVal: r.mifflin, activity: a.key }))} kcal</div>
            </div>
          `).join('')}
        </div>
      `;
    }
  },
  bodyfat: {
    label: 'Body Fat %',
    fields: [
      { id: 'neck',   label: 'Neck (cm)', default: 38 },
      { id: 'waist',  label: 'Waist (cm)', default: 80 },
      { id: 'hip',    label: 'Hip (cm, women only)', default: 0 },
      { id: 'height', label: 'Height (cm)', default: 175 },
    ],
    compute(f) {
      const r = bodyFat({ ...f, gender: f.hip > 0 ? 'female' : 'male' });
      const iw = idealWeight({ height: f.height, gender: f.hip > 0 ? 'female' : 'male' });
      return `
        <div class="result-grid">
          <div class="result-card"><div class="result-label">Body Fat (Navy Method)</div><div class="result-value">${fmt(r.navy)}%</div></div>
        </div>
        <h3>Ideal Weight Range</h3>
        <div class="result-grid">
          ${Object.entries(iw).map(([k, v]) => `<div class="result-card"><div class="result-label">${k}</div><div class="result-value">${fmt(v)} kg</div></div>`).join('')}
        </div>
      `;
    }
  },
  water: {
    label: 'Water Intake',
    fields: [
      { id: 'weight', label: 'Weight (kg)', default: 70 },
    ],
    compute(f) {
      const r = waterIntake(f);
      return `
        <div class="result-grid">
          <div class="result-card"><div class="result-label">Liters</div><div class="result-value">${fmt(r.liters)} L</div></div>
          <div class="result-card"><div class="result-label">Cups (8oz)</div><div class="result-value">${fmt(r.cups)}</div></div>
          <div class="result-card"><div class="result-label">Fluid Ounces</div><div class="result-value">${fmt(r.oz)}</div></div>
        </div>
      `;
    }
  },
};

function buildReverseUI(container, tool, sub) {
  const values = { ...tool.reverseDefaults };

  function getBlank() { return tool.reverseVars.find(v => values[v.id] === '' || values[v.id] == null); }

  function renderResult() {
    const resEl = container.querySelector('.rev-result');
    if (!resEl) return;
    const blank = getBlank();
    const known = {};
    tool.reverseVars.forEach(v => { known[v.id] = (v.id === blank?.id) ? null : parseFloat(values[v.id]); });
    if (blank && tool.reverseVars.filter(v => v.id !== blank.id).some(v => !isFinite(known[v.id]))) { resEl.innerHTML = ''; return; }
    try {
      const r = tool.reverseSolve(known);
      const sv = tool.reverseVars.find(v => v.id === r.id);
      const fmtV = (n) => isFinite(n) ? parseFloat(n.toPrecision(6)).toString() : '—';
      resEl.innerHTML = `
        <div class="pct-result-card">
          <div class="pct-result-label">Solving for <strong>${sv?.label || r.id}</strong></div>
          <div class="pct-result-value">${fmtV(r.value)}${r.unit || ''}</div>
          ${r.extra ? `<div class="pct-result-extra">${r.extra}</div>` : ''}
          <div class="pct-result-formula">${r.label}</div>
        </div>
      `;
      const inp = container.querySelector(`[data-rvar="${r.id}"]`);
      if (inp && inp !== document.activeElement) inp.placeholder = `${fmtV(r.value)}${r.unit || ''}`;
    } catch { resEl.innerHTML = ''; }
  }

  function renderHighlight() {
    const blank = getBlank();
    container.querySelectorAll('.pct-var-row[data-var]').forEach(row => {
      row.classList.toggle('solving-for', row.dataset.var === blank?.id);
    });
  }

  const formBody = container.querySelector('.rev-form-body');
  formBody.innerHTML = `
    <div class="pct-equation">${tool.equation}</div>
    <p class="pct-hint">${tool.hint}</p>
    <div class="pct-fields">
      ${tool.reverseVars.map(v => `
        <div class="pct-var-row" data-var="${v.id}">
          <label class="pct-var-label">${v.label}${v.hint ? `<span class="rev-var-hint"> — ${v.hint}</span>` : ''}</label>
          <div class="pct-var-input-wrap">
            <input type="number" class="pct-input" data-rvar="${v.id}"
              value="${values[v.id] !== '' ? values[v.id] : ''}"
              placeholder="${values[v.id] === '' ? 'blank = solve for me' : ''}"
              step="any" />
            ${v.suffix ? `<span class="input-suffix">${v.suffix}</span>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
    <div class="rev-result"></div>
  `;

  formBody.querySelectorAll('.pct-input').forEach(inp => {
    inp.addEventListener('input', () => {
      values[inp.dataset.rvar] = inp.value.trim() === '' ? '' : inp.value;
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

export function renderHealth(container, sub = 'bmi') {
  const tool = TOOLS[sub] || TOOLS.bmi;

  const tabsHtml = Object.entries(TOOLS).map(([k, t]) =>
    `<button class="form-tab ${k === sub ? 'active' : ''}" data-sub="${k}">${t.label}</button>`
  ).join('');

  if (tool.reverseVars) {
    container.innerHTML = `
      <div class="calc-form">
        <div class="form-tabs">${tabsHtml}</div>
        <div class="form-body rev-form-body"></div>
      </div>
    `;
    buildReverseUI(container, tool, sub);
  } else {
    container.innerHTML = `
      <div class="calc-form">
        <div class="form-tabs">${tabsHtml}</div>
        <div class="form-body">
          <h2>${tool.label}</h2>
          <form id="health-form">
            ${tool.fields.map(f => `
              <div class="form-row">
                <label>${f.label}</label>
                <input type="number" id="${f.id}" value="${f.default ?? ''}" step="any">
              </div>
            `).join('')}
            <button type="submit" class="btn btn-calc-primary">Calculate</button>
          </form>
          <div id="health-result" class="calc-output"></div>
        </div>
      </div>
    `;
    container.querySelector('#health-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = {};
      tool.fields.forEach(f => { fd[f.id] = parseFloat(container.querySelector(`#${f.id}`)?.value) || 0; });
      try {
        container.querySelector('#health-result').innerHTML = tool.compute(fd);
        history.add({ category: 'health', tool: sub, inputs: fd });
      } catch(err) {
        container.querySelector('#health-result').innerHTML = `<div class="error">${err.message}</div>`;
      }
    });
  }

  container.querySelectorAll('.form-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      import('../router.js').then(({ router }) => router.go(`/health/${btn.dataset.sub}`));
    });
  });
}
