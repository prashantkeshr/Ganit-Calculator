import { history } from '../history.js';

function fmt(n) { return parseFloat(n.toPrecision(6)).toString(); }
function makeForm(fields, idPrefix) {
  return fields.map(f => `
    <div class="form-row">
      <label>${f.label}${f.unit ? ` (${f.unit})` : ''}</label>
      <input type="number" id="${idPrefix}-${f.id}" value="${f.default ?? ''}" step="any">
    </div>
  `).join('');
}

const TOOLS = {
  kinematics: {
    label: 'Kinematics',
    desc: 'Equations of uniform acceleration: s, u, v, a, t',
    fields: [
      { id: 'u', label: 'Initial velocity (u)', unit: 'm/s', default: 0 },
      { id: 'v', label: 'Final velocity (v)',   unit: 'm/s', default: '' },
      { id: 'a', label: 'Acceleration (a)',     unit: 'm/s²', default: 9.81 },
      { id: 't', label: 'Time (t)',             unit: 's', default: 5 },
      { id: 's', label: 'Displacement (s)',     unit: 'm', default: '' },
    ],
    compute(f) {
      const { u, v, a, t, s } = f;
      const results = {};
      if (!isNaN(u) && !isNaN(a) && !isNaN(t)) {
        results['v = u + at'] = fmt(u + a * t);
        results['s = ut + ½at²'] = fmt(u * t + 0.5 * a * t * t);
      }
      if (!isNaN(u) && !isNaN(v) && !isNaN(a)) {
        results['v² = u² + 2as → s'] = fmt((v * v - u * u) / (2 * a));
        results['t = (v-u)/a'] = fmt((v - u) / a);
      }
      if (!isNaN(u) && !isNaN(v) && !isNaN(t)) {
        results['s = (u+v)/2 × t'] = fmt(0.5 * (u + v) * t);
        results['a = (v-u)/t'] = fmt((v - u) / t);
      }
      return results;
    }
  },
  force: {
    label: 'Force / Work / Energy',
    fields: [
      { id: 'm',   label: 'Mass (m)', unit: 'kg', default: 10 },
      { id: 'a',   label: 'Acceleration (a)', unit: 'm/s²', default: 9.81 },
      { id: 'd',   label: 'Distance (d)', unit: 'm', default: 5 },
      { id: 'v',   label: 'Velocity (v)', unit: 'm/s', default: 10 },
      { id: 'h',   label: 'Height (h)', unit: 'm', default: 10 },
      { id: 'ang', label: 'Angle θ', unit: '°', default: 0 },
    ],
    compute(f) {
      const { m, a, d, v, h, ang } = f;
      const g = 9.81, theta = ang * Math.PI / 180;
      return {
        'Force F = ma': `${fmt(m * a)} N`,
        'Weight W = mg': `${fmt(m * g)} N`,
        'Work W = Fd·cosθ': `${fmt(m * a * d * Math.cos(theta))} J`,
        'KE = ½mv²': `${fmt(0.5 * m * v * v)} J`,
        'PE = mgh': `${fmt(m * g * h)} J`,
        'Power P = F×v': `${fmt(m * a * v)} W`,
        'Momentum p = mv': `${fmt(m * v)} kg·m/s`,
      };
    }
  },
  gas: {
    label: 'Ideal Gas Law',
    desc: 'PV = nRT — solve for any variable',
    fields: [
      { id: 'P', label: 'Pressure (P)', unit: 'Pa', default: 101325 },
      { id: 'V', label: 'Volume (V)', unit: 'm³', default: 0.001 },
      { id: 'n', label: 'Moles (n)', unit: 'mol', default: '' },
      { id: 'T', label: 'Temperature (T)', unit: 'K', default: 293.15 },
    ],
    compute(f) {
      const R = 8.314, { P, V, n, T } = f;
      const results = {};
      results['R (gas constant)'] = '8.314 J/(mol·K)';
      if (!isNaN(P) && !isNaN(V) && !isNaN(T) && T !== 0)
        results['n = PV / RT (moles)'] = fmt(P * V / (R * T)) + ' mol';
      if (!isNaN(n) && !isNaN(V) && !isNaN(T) && V !== 0)
        results['P = nRT / V'] = fmt(n * R * T / V) + ' Pa';
      if (!isNaN(n) && !isNaN(P) && !isNaN(T) && P !== 0)
        results['V = nRT / P'] = fmt(n * R * T / P) + ' m³';
      if (!isNaN(n) && !isNaN(P) && !isNaN(V) && n !== 0)
        results['T = PV / nR'] = fmt(P * V / (n * R)) + ' K';
      return results;
    }
  },
  ph: {
    label: 'pH / pOH',
    fields: [
      { id: 'H', label: '[H⁺] concentration', unit: 'mol/L', default: '' },
      { id: 'OH', label: '[OH⁻] concentration', unit: 'mol/L', default: '' },
      { id: 'pH', label: 'pH value', default: 7 },
    ],
    compute(f) {
      const results = {};
      let pH;
      if (!isNaN(f.H) && f.H > 0) pH = -Math.log10(f.H);
      else if (!isNaN(f.OH) && f.OH > 0) { const pOH = -Math.log10(f.OH); pH = 14 - pOH; }
      else pH = f.pH;
      const pOH = 14 - pH;
      const H_conc = Math.pow(10, -pH);
      const OH_conc = Math.pow(10, -pOH);
      results['pH'] = fmt(pH);
      results['pOH'] = fmt(pOH);
      results['[H⁺]'] = `${fmt(H_conc)} mol/L`;
      results['[OH⁻]'] = `${fmt(OH_conc)} mol/L`;
      results['Solution'] = pH < 7 ? 'Acidic' : pH > 7 ? 'Basic (Alkaline)' : 'Neutral';
      return results;
    }
  },
  molar: {
    label: 'Molar Mass',
    desc: 'Enter a chemical formula (e.g. H2O, NaCl, C6H12O6)',
    fields: [],
    renderCustom(el) {
      const ATOMIC_MASS = {
        H:1.008, He:4.003, Li:6.941, Be:9.012, B:10.811, C:12.011, N:14.007, O:15.999, F:18.998,
        Ne:20.18, Na:22.99, Mg:24.305, Al:26.982, Si:28.086, P:30.974, S:32.065, Cl:35.453, Ar:39.948,
        K:39.098, Ca:40.078, Fe:55.845, Cu:63.546, Zn:65.38, Br:79.904, Ag:107.868, I:126.904, Au:196.967,
        Pb:207.2, Hg:200.59,
      };
      function parseMolarMass(formula) {
        let total = 0, i = 0;
        function parse() {
          let mass = 0;
          while (i < formula.length) {
            if (formula[i] === '(') { i++; const inner = parse(); let num = ''; while (/[0-9]/.test(formula[i])) num += formula[i++]; mass += inner * (parseInt(num)||1); }
            else if (formula[i] === ')') { i++; return mass; }
            else if (/[A-Z]/.test(formula[i])) {
              let el = formula[i++];
              while (i < formula.length && /[a-z]/.test(formula[i])) el += formula[i++];
              let num = ''; while (i < formula.length && /[0-9]/.test(formula[i])) num += formula[i++];
              const am = ATOMIC_MASS[el];
              if (!am) throw new Error(`Unknown element: ${el}`);
              mass += am * (parseInt(num)||1);
            } else break;
          }
          return mass;
        }
        total = parse();
        return total;
      }
      el.innerHTML = `
        <h3>Molar Mass Calculator</h3>
        <div class="form-row"><label>Chemical Formula</label><input id="molar-formula" value="H2O" placeholder="e.g. H2O, C6H12O6, NaCl"></div>
        <div class="form-row"><label>Mass of sample (g) — optional</label><input id="molar-mass" type="number" value="" step="any" placeholder="optional"></div>
        <button id="molar-calc" class="btn btn-calc-primary">Calculate</button>
        <div id="molar-result" class="calc-output"></div>
      `;
      el.querySelector('#molar-calc').addEventListener('click', () => {
        try {
          const formula = el.querySelector('#molar-formula').value.trim();
          const molarMass = parseMolarMass(formula);
          const sampleMass = parseFloat(el.querySelector('#molar-mass').value);
          let html = `<div class="result-grid">
            <div class="result-card"><div class="result-label">Formula</div><div class="result-value">${formula}</div></div>
            <div class="result-card"><div class="result-label">Molar Mass</div><div class="result-value">${fmt(molarMass)} g/mol</div></div>
          `;
          if (!isNaN(sampleMass)) {
            const moles = sampleMass / molarMass;
            const molecules = moles * 6.022e23;
            html += `
              <div class="result-card"><div class="result-label">Moles</div><div class="result-value">${fmt(moles)} mol</div></div>
              <div class="result-card"><div class="result-label">Molecules</div><div class="result-value">${molecules.toExponential(4)}</div></div>
            `;
          }
          html += '</div>';
          el.querySelector('#molar-result').innerHTML = html;
        } catch(err) {
          el.querySelector('#molar-result').innerHTML = `<div class="error">${err.message}</div>`;
        }
      });
    }
  },
  decay: {
    label: 'Radioactive Decay',
    fields: [
      { id: 'N0',      label: 'Initial quantity (N₀)', default: 1000 },
      { id: 'halfLife', label: 'Half-life', unit: 'years', default: 5730 },
      { id: 't',       label: 'Time elapsed', unit: 'years', default: 11460 },
    ],
    compute(f) {
      const { N0, halfLife, t } = f;
      const lambda = Math.LN2 / halfLife;
      const Nt = N0 * Math.exp(-lambda * t);
      const actDecayed = N0 - Nt;
      return {
        'Remaining quantity N(t)': fmt(Nt),
        'Decayed amount': fmt(actDecayed),
        'Fraction remaining': fmt(Nt / N0 * 100) + '%',
        'Decay constant λ': fmt(lambda) + ' /year',
        'Mean lifetime τ': fmt(1 / lambda) + ' years',
      };
    }
  },
  projectile: {
    label: 'Projectile Motion',
    fields: [
      { id: 'v0',    label: 'Initial velocity (v₀)', unit: 'm/s', default: 30 },
      { id: 'angle', label: 'Launch angle (θ)', unit: '°', default: 45 },
      { id: 'h0',    label: 'Initial height (h₀)', unit: 'm', default: 0 },
    ],
    compute(f) {
      const { v0, angle, h0 } = f;
      const g = 9.81, θ = angle * Math.PI / 180;
      const vx = v0 * Math.cos(θ), vy0 = v0 * Math.sin(θ);
      const tFlight = (vy0 + Math.sqrt(vy0 * vy0 + 2 * g * h0)) / g;
      const range = vx * tFlight;
      const hMax = h0 + vy0 * vy0 / (2 * g);
      const tPeak = vy0 / g;
      return {
        'Range (horizontal distance)': fmt(range) + ' m',
        'Maximum height': fmt(hMax) + ' m',
        'Time of flight': fmt(tFlight) + ' s',
        'Time to peak': fmt(tPeak) + ' s',
        'Horizontal velocity vₓ': fmt(vx) + ' m/s',
        'Initial vertical velocity vᵧ': fmt(vy0) + ' m/s',
      };
    }
  },
};

export function renderPhysics(container, sub = 'kinematics') {
  const tool = TOOLS[sub] || TOOLS.kinematics;

  container.innerHTML = `
    <div class="calc-form">
      <div class="form-tabs">
        ${Object.entries(TOOLS).map(([k, t]) =>
          `<button class="form-tab ${k === sub ? 'active' : ''}" data-sub="${k}">${t.label}</button>`
        ).join('')}
      </div>
      <div id="phys-body" class="form-body"></div>
    </div>
  `;

  container.querySelectorAll('.form-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      import('../router.js').then(({ router }) => router.go(`/physics/${btn.dataset.sub}`));
    });
  });

  const body = container.querySelector('#phys-body');

  if (tool.renderCustom) {
    tool.renderCustom(body);
    return;
  }

  body.innerHTML = `
    <h3>${tool.label}</h3>
    ${tool.desc ? `<p class="tool-desc">${tool.desc}</p>` : ''}
    <form id="phys-form">
      ${makeForm(tool.fields, 'phys')}
      <button type="submit" class="btn btn-calc-primary">Calculate</button>
    </form>
    <div id="phys-result" class="calc-output"></div>
  `;

  body.querySelector('#phys-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = {};
    tool.fields.forEach(f => { fd[f.id] = parseFloat(body.querySelector(`#phys-${f.id}`)?.value); });
    try {
      const results = tool.compute(fd);
      body.querySelector('#phys-result').innerHTML = `
        <div class="result-grid">
          ${Object.entries(results).map(([k, v]) =>
            `<div class="result-card"><div class="result-label">${k}</div><div class="result-value">${v}</div></div>`
          ).join('')}
        </div>
      `;
      history.add({ category: 'physics', tool: sub });
    } catch(err) {
      body.querySelector('#phys-result').innerHTML = `<div class="error">${err.message}</div>`;
    }
  });
}
