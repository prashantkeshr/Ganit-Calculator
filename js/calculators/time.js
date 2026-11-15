import { history } from '../history.js';

function parseHMS(str) {
  if (!str || typeof str !== 'string') return null;
  const s = str.trim();
  if (!s) return null;
  const parts = s.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 1) return parts[0] * 3600;
  if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60;
  return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
}

function toHMS(seconds) {
  const neg = seconds < 0;
  const abs = Math.abs(Math.round(seconds));
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const sc = abs % 60;
  const pad = n => String(n).padStart(2, '0');
  return `${neg ? '-' : ''}${pad(h)}:${pad(m)}:${pad(sc)}`;
}

function fmtN(n, sig = 6) {
  return parseFloat(n.toPrecision(sig)).toString();
}

const TOOLS = {
  duration: {
    label: 'Time Duration',
    desc: 'Calculate duration between two times, or find start/end time.',
    equation: 'End − Start = Duration',
    hint: 'Leave any one field blank — it will be computed.',
    revVars: [
      { id: 'start', label: 'Start Time', placeholder: '09:00:00', isTime: true },
      { id: 'end',   label: 'End Time',   placeholder: '17:30:00', isTime: true },
      { id: 'dur',   label: 'Duration',   placeholder: 'blank → auto-computed', isTime: true },
    ],
    revDefaults: { start: '09:00:00', end: '17:30:00', dur: '' },
    revSolve(v) {
      const sS = v.start && v.start !== '' ? parseHMS(v.start) : null;
      const eS = v.end   && v.end   !== '' ? parseHMS(v.end)   : null;
      const dS = v.dur   && v.dur   !== '' ? parseHMS(v.dur)   : null;
      if (v.start === '' || v.start == null) {
        if (eS == null || dS == null) throw new Error('Need End and Duration');
        return { id: 'start', value: toHMS(eS - dS), label: 'End − Duration', isTime: true };
      }
      if (v.end === '' || v.end == null) {
        if (sS == null || dS == null) throw new Error('Need Start and Duration');
        return { id: 'end', value: toHMS(sS + dS), label: 'Start + Duration', isTime: true };
      }
      if (sS == null || eS == null) throw new Error('Invalid time format');
      const r = eS - sS;
      const mins = r / 60, hrs = r / 3600;
      return {
        id: 'dur', value: toHMS(r), label: 'End − Start', isTime: true,
        extra: `${fmtN(Math.abs(mins), 5)} min · ${fmtN(Math.abs(hrs), 4)} hr${r < 0 ? ' (crosses midnight)' : ''}`,
      };
    },
  },

  add: {
    label: 'Add / Subtract Time',
    desc: 'Start ± Offset = End. Leave any one field blank to solve for it.',
    equation: 'Start + Offset = End',
    hint: 'Enter times as HH:MM:SS. Leave one blank to solve.',
    revVars: [
      { id: 'start',  label: 'Start',  placeholder: '09:00:00', isTime: true },
      { id: 'offset', label: 'Offset', placeholder: '02:30:00', isTime: true },
      { id: 'end',    label: 'End',    placeholder: 'blank → auto-computed', isTime: true },
    ],
    revDefaults: { start: '09:00:00', offset: '02:30:00', end: '' },
    revSolve(v) {
      const sS = v.start  && v.start  !== '' ? parseHMS(v.start)  : null;
      const oS = v.offset && v.offset !== '' ? parseHMS(v.offset) : null;
      const eS = v.end    && v.end    !== '' ? parseHMS(v.end)    : null;
      if (v.start === '' || v.start == null) {
        if (eS == null || oS == null) throw new Error('Need End and Offset');
        return { id: 'start', value: toHMS(eS - oS), label: 'End − Offset', isTime: true };
      }
      if (v.offset === '' || v.offset == null) {
        if (eS == null || sS == null) throw new Error('Need Start and End');
        return { id: 'offset', value: toHMS(eS - sS), label: 'End − Start', isTime: true };
      }
      if (sS == null || oS == null) throw new Error('Invalid time format');
      return { id: 'end', value: toHMS(sS + oS), label: 'Start + Offset', isTime: true };
    },
  },

  convert: {
    label: 'Time Unit Converter',
    desc: 'Fill any one field — all others update instantly.',
    revVars: [
      { id: 'weeks',   label: 'Weeks',   suffix: 'wk'  },
      { id: 'days',    label: 'Days',    suffix: 'd'   },
      { id: 'hours',   label: 'Hours',   suffix: 'h'   },
      { id: 'minutes', label: 'Minutes', suffix: 'min' },
      { id: 'seconds', label: 'Seconds', suffix: 's'   },
    ],
    revDefaults: { weeks: '', days: '', hours: 1, minutes: '', seconds: '' },
    revSolveAll(v) {
      const mult = { weeks: 604800, days: 86400, hours: 3600, minutes: 60, seconds: 1 };
      const srcId = Object.keys(mult).find(id => v[id] != null && v[id] !== '' && isFinite(parseFloat(v[id])));
      if (!srcId) return {};
      const base = parseFloat(v[srcId]) * mult[srcId];
      const results = {};
      for (const [id, m] of Object.entries(mult)) {
        if (id !== srcId) {
          results[id.charAt(0).toUpperCase() + id.slice(1)] = { id, value: fmtN(base / m, 7) };
        }
      }
      return results;
    },
  },

  speed: {
    label: 'Speed / Pace',
    desc: 'Speed = Distance ÷ Time. Leave any one field blank to solve.',
    equation: 'Speed = Distance ÷ Time',
    hint: 'Leave any one field blank — it will be computed.',
    revVars: [
      { id: 'dist',  label: 'Distance', suffix: 'km' },
      { id: 'time',  label: 'Time',      suffix: 'hr' },
      { id: 'speed', label: 'Speed',     suffix: 'km/h' },
    ],
    revDefaults: { dist: 100, time: 2, speed: '' },
    revSolve(v) {
      const { dist, time, speed } = v;
      if (dist  == null) return { id: 'dist',  value: speed * time, label: 'Speed × Time' };
      if (time  == null) return { id: 'time',  value: dist / speed, label: 'Distance ÷ Speed' };
      const spd = dist / time;
      return {
        id: 'speed', value: spd, label: 'Distance ÷ Time',
        extra: `Pace: ${fmtN(60 / spd, 4)} min/km · ${fmtN(spd * 1000 / 3600, 4)} m/s`,
      };
    },
  },
};

function buildTimeUI(container, tool) {
  const values = { ...tool.revDefaults };
  const isSolveAll = !!tool.revSolveAll;

  function getBlank() {
    return tool.revVars.find(v => values[v.id] === '' || values[v.id] == null);
  }

  function recompute() {
    const resEl = container.querySelector('.rev-result');
    if (!resEl) return;

    if (isSolveAll) {
      const v = {};
      tool.revVars.forEach(rv => { v[rv.id] = values[rv.id] === '' ? null : values[rv.id]; });
      const results = tool.revSolveAll(v);
      if (!Object.keys(results).length) { resEl.innerHTML = ''; return; }
      resEl.innerHTML = `<div class="result-grid">${Object.entries(results).map(([label, r]) => {
        const sv = tool.revVars.find(rv => rv.id === r.id);
        return `<div class="result-card"><div class="result-label">${label}</div><div class="result-value">${r.value}${sv?.suffix ? ' ' + sv.suffix : ''}</div></div>`;
      }).join('')}</div>`;
      return;
    }

    const blank = getBlank();
    const processed = {};
    tool.revVars.forEach(rv => {
      if (blank?.id === rv.id) {
        processed[rv.id] = null;
      } else if (rv.isTime) {
        processed[rv.id] = values[rv.id] || null;
      } else {
        const f = parseFloat(values[rv.id]);
        processed[rv.id] = isNaN(f) ? null : f;
      }
    });

    // Require all non-blank fields valid
    const invalid = tool.revVars.filter(rv => rv.id !== blank?.id && processed[rv.id] == null);
    if (invalid.length) { resEl.innerHTML = ''; return; }

    try {
      const r = tool.revSolve(processed);
      const sv = tool.revVars.find(rv => rv.id === r.id);
      const displayVal = r.isTime ? r.value : (isFinite(r.value) ? fmtN(r.value, 6) : '—');
      const unit = !r.isTime && sv?.suffix ? ' ' + sv.suffix : '';
      resEl.innerHTML = `
        <div class="pct-result-card">
          <div class="pct-result-label">Solving for <strong>${sv?.label || r.id}</strong></div>
          <div class="pct-result-value">${displayVal}${unit}</div>
          ${r.extra ? `<div class="pct-result-extra">${r.extra}</div>` : ''}
          <div class="pct-result-formula">${r.label}</div>
        </div>
      `;
      // Update placeholder of solved field
      const inp = container.querySelector(`[data-var="${r.id}"]`);
      if (inp && inp !== document.activeElement) inp.placeholder = `${displayVal}${unit}`;
    } catch { resEl.innerHTML = ''; }
  }

  function renderHighlight() {
    if (isSolveAll) return;
    const blank = getBlank();
    container.querySelectorAll('.pct-var-row[data-var]').forEach(row =>
      row.classList.toggle('solving-for', row.dataset.var === blank?.id)
    );
  }

  container.innerHTML = `
    ${tool.equation ? `<div class="pct-equation">${tool.equation}</div>` : ''}
    <p class="pct-hint">${tool.hint || tool.desc}</p>
    <div class="pct-fields">
      ${tool.revVars.map(v => {
        const val = values[v.id] !== '' ? values[v.id] : '';
        const ph = val === '' ? (v.placeholder || (isSolveAll ? 'fill in' : 'blank → auto-computed')) : '';
        if (v.isTime) {
          return `
            <div class="pct-var-row" data-var="${v.id}">
              <label class="pct-var-label">${v.label}</label>
              <div class="pct-var-input-wrap time-input-wrap">
                <input type="text" class="pct-input" data-var="${v.id}"
                  value="${val}" placeholder="${ph || 'HH:MM:SS'}" />
              </div>
            </div>`;
        }
        return `
          <div class="pct-var-row" data-var="${v.id}">
            <label class="pct-var-label">${v.label}</label>
            <div class="pct-var-input-wrap has-steppers">
              <button type="button" class="pct-step-btn pct-step-dn" tabindex="-1" aria-label="Decrease">−</button>
              <input type="text" inputmode="decimal" class="pct-input" data-var="${v.id}"
                value="${val}" placeholder="${ph}" />
              <button type="button" class="pct-step-btn pct-step-up" tabindex="-1" aria-label="Increase">+</button>
              ${v.suffix ? `<span class="input-suffix">${v.suffix}</span>` : ''}
            </div>
          </div>`;
      }).join('')}
    </div>
    <div class="rev-result"></div>
  `;

  container.querySelectorAll('.pct-input').forEach(inp => {
    inp.addEventListener('input', () => {
      values[inp.dataset.var] = inp.value.trim() === '' ? '' : inp.value;
      renderHighlight();
      recompute();
    });
    if (!inp.closest('.time-input-wrap')) {
      inp.addEventListener('wheel', (e) => {
        if (document.activeElement !== inp) return;
        e.preventDefault();
        const cur = parseFloat(inp.value) || 0;
        inp.value = parseFloat((cur + (e.deltaY < 0 ? 1 : -1)).toPrecision(10));
        inp.dispatchEvent(new Event('input'));
      }, { passive: false });
    }
  });

  renderHighlight();
  recompute();
}

export function renderTime(container, sub = 'duration') {
  const tool = TOOLS[sub] || TOOLS.duration;

  const tabsHtml = Object.entries(TOOLS).map(([k, t]) =>
    `<button class="form-tab ${k === sub ? 'active' : ''}" data-sub="${k}">${t.label}</button>`
  ).join('');

  container.innerHTML = `
    <div class="calc-form">
      <div class="form-tabs">${tabsHtml}</div>
      <div class="form-body time-form-body"></div>
    </div>
  `;

  buildTimeUI(container.querySelector('.time-form-body'), tool);

  container.querySelectorAll('.form-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      import('../router.js').then(({ router }) => router.go(`/time/${btn.dataset.sub}`));
    });
  });
}
