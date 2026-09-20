import { history } from '../history.js';

function fmt(n, dp = 3) { return typeof n === 'number' ? parseFloat(n.toPrecision(6)).toString() : n; }
function makeForm(fields, idPrefix) {
  return fields.map(f => `
    <div class="form-row">
      <label>${f.label}${f.unit ? ` (${f.unit})` : ''}</label>
      <div class="input-wrapper">
        ${f.prefix ? `<span class="input-prefix">${f.prefix}</span>` : ''}
        <input type="number" id="${idPrefix}-${f.id}" value="${f.default ?? ''}" step="any">
        ${f.suffix ? `<span class="input-suffix">${f.suffix}</span>` : ''}
      </div>
    </div>
  `).join('');
}

const TOOLS = {
  concrete: {
    label: 'Concrete Volume',
    fields: [
      { id: 'l',     label: 'Length',  unit: 'm', default: 5 },
      { id: 'w',     label: 'Width',   unit: 'm', default: 4 },
      { id: 'depth', label: 'Depth',   unit: 'm', default: 0.15 },
    ],
    compute(f) {
      const vol = f.l * f.w * f.depth;
      const cement = vol * 320; // kg at standard mix
      const sand   = vol * 680; // kg
      const agg    = vol * 1200; // kg
      const water  = vol * 180; // L
      return {
        'Volume': `${fmt(vol)} m³`,
        'Bags of cement (50 kg)': `${Math.ceil(cement / 50)}`,
        'Sand needed': `${fmt(sand)} kg`,
        'Aggregate needed': `${fmt(agg)} kg`,
        'Water needed': `${fmt(water)} L`,
      };
    }
  },
  tiles: {
    label: 'Tiles / Flooring',
    fields: [
      { id: 'roomL', label: 'Room Length', unit: 'm', default: 5 },
      { id: 'roomW', label: 'Room Width',  unit: 'm', default: 4 },
      { id: 'tileL', label: 'Tile Length', unit: 'cm', default: 60 },
      { id: 'tileW', label: 'Tile Width',  unit: 'cm', default: 60 },
      { id: 'waste', label: 'Waste', unit: '%', default: 10 },
    ],
    compute(f) {
      const roomArea = f.roomL * f.roomW;
      const tileArea = (f.tileL / 100) * (f.tileW / 100);
      const tilesNeeded = Math.ceil(roomArea / tileArea * (1 + f.waste / 100));
      return {
        'Room area': `${fmt(roomArea)} m²`,
        'Tile area': `${fmt(tileArea)} m²`,
        'Tiles needed (with waste)': `${tilesNeeded}`,
        'Boxes (assumption: 4 per box)': `${Math.ceil(tilesNeeded / 4)}`,
      };
    }
  },
  paint: {
    label: 'Paint Coverage',
    fields: [
      { id: 'walls',     label: 'Total wall area', unit: 'm²', default: 50 },
      { id: 'subtract',  label: 'Doors/windows area', unit: 'm²', default: 5 },
      { id: 'coats',     label: 'Number of coats', default: 2, min: 1 },
      { id: 'coverage',  label: 'Coverage per litre', unit: 'm²/L', default: 12 },
    ],
    compute(f) {
      const netArea = f.walls - f.subtract;
      const litres  = (netArea * f.coats) / f.coverage;
      return {
        'Net paintable area': `${fmt(netArea)} m²`,
        'Total area (with coats)': `${fmt(netArea * f.coats)} m²`,
        'Paint needed': `${fmt(litres)} L`,
        '5-litre cans needed': `${Math.ceil(litres / 5)}`,
      };
    }
  },
  stairs: {
    label: 'Staircase Builder',
    fields: [
      { id: 'height',  label: 'Total rise (floor-to-floor)', unit: 'mm', default: 3000 },
      { id: 'run',     label: 'Target tread depth (run)', unit: 'mm', default: 250 },
      { id: 'headroom',label: 'Headroom clearance', unit: 'mm', default: 2100 },
    ],
    compute(f) {
      const riser = Math.round(f.height / Math.round(f.height / 175));
      const steps = Math.round(f.height / riser);
      const totalRun = steps * f.run;
      const angle = Math.atan(riser / f.run) * 180 / Math.PI;
      const stairRule = 2 * riser + f.run;
      const ok = stairRule >= 550 && stairRule <= 700;
      return {
        'Number of risers': steps,
        'Riser height': `${fmt(riser)} mm`,
        'Tread depth': `${fmt(f.run)} mm`,
        'Total horizontal run': `${fmt(totalRun)} mm`,
        'Stair angle': `${fmt(angle)}°`,
        '2R + T (should be 550–700mm)': `${fmt(stairRule)} mm ${ok ? '✓' : '⚠️'}`,
      };
    }
  },
  brick: {
    label: 'Brick / Block',
    fields: [
      { id: 'l',     label: 'Wall Length', unit: 'm', default: 10 },
      { id: 'h',     label: 'Wall Height', unit: 'm', default: 3 },
      { id: 'brickL', label: 'Brick Length', unit: 'mm', default: 230 },
      { id: 'brickH', label: 'Brick Height', unit: 'mm', default: 76 },
      { id: 'joint',  label: 'Joint thickness', unit: 'mm', default: 10 },
      { id: 'waste',  label: 'Waste %', default: 5 },
    ],
    compute(f) {
      const wallArea = f.l * f.h;
      const brickArea = ((f.brickL + f.joint) / 1000) * ((f.brickH + f.joint) / 1000);
      const bricks = Math.ceil(wallArea / brickArea * (1 + f.waste / 100));
      const mortar  = bricks * 0.00035; // m³ per brick
      return {
        'Wall area': `${fmt(wallArea)} m²`,
        'Bricks needed': `${bricks.toLocaleString()}`,
        'Mortar volume': `${fmt(mortar)} m³`,
        'Bags of mortar (25 kg)': `${Math.ceil(mortar * 1600 / 25)}`,
      };
    }
  },
  ohm: {
    label: "Ohm's Law",
    fields: [
      { id: 'V', label: 'Voltage (V)', unit: 'V', default: '' },
      { id: 'I', label: 'Current (I)', unit: 'A', default: '' },
      { id: 'R', label: 'Resistance (R)', unit: 'Ω', default: '' },
      { id: 'P', label: 'Power (P)', unit: 'W', default: '' },
    ],
    compute(f) {
      let { V, I, R, P } = f;
      const known = [!isNaN(V), !isNaN(I), !isNaN(R), !isNaN(P)].filter(Boolean).length;
      if (known < 2) throw new Error('Enter at least 2 known values');
      if (!isNaN(V) && !isNaN(I)) { R = V / I; P = V * I; }
      else if (!isNaN(V) && !isNaN(R)) { I = V / R; P = V * I; }
      else if (!isNaN(I) && !isNaN(R)) { V = I * R; P = V * I; }
      else if (!isNaN(P) && !isNaN(V)) { I = P / V; R = V / I; }
      else if (!isNaN(P) && !isNaN(I)) { V = P / I; R = V / I; }
      else if (!isNaN(P) && !isNaN(R)) { V = Math.sqrt(P * R); I = P / V; }
      return {
        'Voltage V': `${fmt(V)} V`,
        'Current I': `${fmt(I)} A`,
        'Resistance R': `${fmt(R)} Ω`,
        'Power P': `${fmt(P)} W`,
      };
    }
  },
  roof: {
    label: 'Roof Pitch',
    fields: [
      { id: 'run',   label: 'Horizontal run', unit: 'm', default: 5 },
      { id: 'rise',  label: 'Rise', unit: 'm', default: 2 },
    ],
    compute(f) {
      const pitch = f.rise / f.run;
      const angle = Math.atan(pitch) * 180 / Math.PI;
      const rafterLength = Math.sqrt(f.run * f.run + f.rise * f.rise);
      const pitchStr = `${Math.round(f.rise * 12 / f.run)}/12`;
      return {
        'Pitch': pitchStr,
        'Angle': `${fmt(angle)}°`,
        'Rafter length': `${fmt(rafterLength)} m`,
        'Slope factor': fmt(Math.sqrt(1 + pitch * pitch)),
      };
    }
  },
};

export function renderConstruction(container, sub = 'concrete') {
  const tool = TOOLS[sub] || TOOLS.concrete;

  container.innerHTML = `
    <div class="calc-form">
      <div class="form-tabs">
        ${Object.entries(TOOLS).map(([k, t]) =>
          `<button class="form-tab ${k === sub ? 'active' : ''}" data-sub="${k}">${t.label}</button>`
        ).join('')}
      </div>
      <div class="form-body">
        <h2>${tool.label}</h2>
        <form id="const-form">
          ${makeForm(tool.fields, 'const')}
          <button type="submit" class="btn btn-calc-primary">Calculate</button>
        </form>
        <div id="const-result" class="calc-output"></div>
      </div>
    </div>
  `;

  container.querySelectorAll('.form-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      import('../router.js').then(({ router }) => router.go(`/construction/${btn.dataset.sub}`));
    });
  });

  container.querySelector('#const-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = {};
    tool.fields.forEach(f => { fd[f.id] = parseFloat(container.querySelector(`#const-${f.id}`)?.value); });
    try {
      const results = tool.compute(fd);
      container.querySelector('#const-result').innerHTML = `
        <div class="result-grid">
          ${Object.entries(results).map(([k, v]) =>
            `<div class="result-card"><div class="result-label">${k}</div><div class="result-value">${v}</div></div>`
          ).join('')}
        </div>
      `;
      history.add({ category: 'construction', tool: sub });
    } catch(err) {
      container.querySelector('#const-result').innerHTML = `<div class="error">${err.message}</div>`;
    }
  });
}
