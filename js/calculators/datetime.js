import { history } from '../history.js';

function fmt(n) { return String(n); }
function pad(n) { return String(n).padStart(2, '0'); }

function dateDiff(d1, d2) {
  const a = new Date(d1), b = new Date(d2);
  const diff = Math.abs(b - a);
  const totalDays = Math.floor(diff / 86400000);
  const totalWeeks = Math.floor(totalDays / 7);
  const totalHours = Math.floor(diff / 3600000);
  const totalMins  = Math.floor(diff / 60000);
  // y/m/d breakdown
  let start = a < b ? new Date(a) : new Date(b);
  let end   = a < b ? new Date(b) : new Date(a);
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  if (days < 0) { months--; const last = new Date(end.getFullYear(), end.getMonth(), 0); days += last.getDate(); }
  if (months < 0) { years--; months += 12; }
  return { years, months, days, totalDays, totalWeeks, totalHours, totalMins };
}

function addDate(dateStr, unit, amount) {
  const d = new Date(dateStr);
  switch (unit) {
    case 'days':   d.setDate(d.getDate() + amount); break;
    case 'weeks':  d.setDate(d.getDate() + amount * 7); break;
    case 'months': d.setMonth(d.getMonth() + amount); break;
    case 'years':  d.setFullYear(d.getFullYear() + amount); break;
  }
  return d;
}

function businessDays(d1, d2) {
  let start = new Date(d1), end = new Date(d2);
  if (start > end) [start, end] = [end, start];
  let count = 0, cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

const TABS = [
  { id: 'diff',     label: 'Date Difference' },
  { id: 'add',      label: 'Add/Subtract' },
  { id: 'timezone', label: 'Timezone' },
  { id: 'countdown', label: 'Countdown' },
  { id: 'unix',     label: 'Unix Timestamp' },
  { id: 'week',     label: 'Week Number' },
];

export function renderDatetime(container, sub = 'diff') {
  container.innerHTML = `
    <div class="calc-form">
      <div class="form-tabs">
        ${TABS.map(t => `<button class="form-tab ${t.id === sub ? 'active' : ''}" data-sub="${t.id}">${t.label}</button>`).join('')}
      </div>
      <div id="dt-body" class="form-body"></div>
    </div>
  `;

  container.querySelectorAll('.form-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      import('../router.js').then(({ router }) => router.go(`/datetime/${btn.dataset.sub}`));
    });
  });

  const body = container.querySelector('#dt-body');
  const today = new Date().toISOString().split('T')[0];

  if (sub === 'diff') {
    body.innerHTML = `
      <h3>Date Difference</h3>
      <div class="form-row"><label>Start Date</label><input type="date" id="dt-start" value="${today}"></div>
      <div class="form-row"><label>End Date</label><input type="date" id="dt-end" value="${new Date(Date.now()+30*86400000).toISOString().split('T')[0]}"></div>
      <button id="dt-calc" class="btn btn-calc-primary">Calculate</button>
      <div id="dt-result" class="calc-output"></div>
    `;
    body.querySelector('#dt-calc').addEventListener('click', () => {
      const s = body.querySelector('#dt-start').value, e = body.querySelector('#dt-end').value;
      if (!s || !e) return;
      const r = dateDiff(s, e);
      const bd = businessDays(s, e);
      body.querySelector('#dt-result').innerHTML = `
        <div class="result-grid">
          <div class="result-card"><div class="result-label">Total Years, Months, Days</div><div class="result-value">${r.years}y ${r.months}m ${r.days}d</div></div>
          <div class="result-card"><div class="result-label">Total Days</div><div class="result-value">${r.totalDays.toLocaleString()}</div></div>
          <div class="result-card"><div class="result-label">Total Weeks</div><div class="result-value">${r.totalWeeks.toLocaleString()}</div></div>
          <div class="result-card"><div class="result-label">Business Days</div><div class="result-value">${bd.toLocaleString()}</div></div>
          <div class="result-card"><div class="result-label">Total Hours</div><div class="result-value">${r.totalHours.toLocaleString()}</div></div>
          <div class="result-card"><div class="result-label">Total Minutes</div><div class="result-value">${r.totalMins.toLocaleString()}</div></div>
        </div>
      `;
    });
  } else if (sub === 'add') {
    body.innerHTML = `
      <h3>Add / Subtract Date</h3>
      <div class="form-row"><label>Start Date</label><input type="date" id="dt-base" value="${today}"></div>
      <div class="form-row">
        <label>Operation</label>
        <select id="dt-op"><option value="add">Add</option><option value="sub">Subtract</option></select>
      </div>
      <div class="form-row">
        <label>Amount</label>
        <input type="number" id="dt-amount" value="30" min="0">
        <select id="dt-unit"><option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option><option value="years">Years</option></select>
      </div>
      <button id="dt-calc" class="btn btn-calc-primary">Calculate</button>
      <div id="dt-result" class="calc-output"></div>
    `;
    body.querySelector('#dt-calc').addEventListener('click', () => {
      const base = body.querySelector('#dt-base').value;
      const op   = body.querySelector('#dt-op').value;
      const amt  = parseInt(body.querySelector('#dt-amount').value) || 0;
      const unit = body.querySelector('#dt-unit').value;
      const result = addDate(base, unit, op === 'sub' ? -amt : amt);
      body.querySelector('#dt-result').innerHTML = `
        <div class="result-hero">
          <div class="result-big">${result.toDateString()}</div>
          <div class="result-desc">${result.toISOString().split('T')[0]}</div>
          <div class="result-extra">Day: ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][result.getDay()]}</div>
        </div>
      `;
    });
  } else if (sub === 'timezone') {
    const tzs = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [
      'UTC','America/New_York','America/Chicago','America/Denver','America/Los_Angeles',
      'Europe/London','Europe/Paris','Europe/Berlin','Europe/Moscow',
      'Asia/Dubai','Asia/Kolkata','Asia/Singapore','Asia/Tokyo','Australia/Sydney',
    ];
    body.innerHTML = `
      <h3>Timezone Converter</h3>
      <div class="form-row"><label>Date & Time</label><input type="datetime-local" id="tz-dt" value="${new Date().toISOString().slice(0,16)}"></div>
      <div class="form-row"><label>From Timezone</label>
        <select id="tz-from">${tzs.map(z => `<option value="${z}" ${z==='UTC'?'selected':''}>${z}</option>`).join('')}</select>
      </div>
      <button id="tz-convert" class="btn btn-calc-primary">Convert</button>
      <div id="tz-result" class="calc-output"></div>
    `;
    body.querySelector('#tz-convert').addEventListener('click', () => {
      const dtVal = body.querySelector('#tz-dt').value;
      const fromTz = body.querySelector('#tz-from').value;
      const dt = new Date(dtVal);
      const mainZones = ['UTC','America/New_York','America/Los_Angeles','Europe/London','Europe/Paris',
        'Europe/Moscow','Asia/Dubai','Asia/Kolkata','Asia/Singapore','Asia/Tokyo','Australia/Sydney'];
      body.querySelector('#tz-result').innerHTML = `
        <div class="result-grid">
          ${mainZones.map(tz => {
            try {
              const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, dateStyle: 'medium', timeStyle: 'short' }).format(dt);
              return `<div class="result-card"><div class="result-label">${tz}</div><div class="result-value">${fmt}</div></div>`;
            } catch { return ''; }
          }).join('')}
        </div>
      `;
    });
  } else if (sub === 'countdown') {
    body.innerHTML = `
      <h3>Countdown Timer</h3>
      <div class="form-row"><label>Target Date & Time</label><input type="datetime-local" id="cd-target"></div>
      <button id="cd-start" class="btn btn-calc-primary">Start Countdown</button>
      <div id="cd-display" class="countdown-display"></div>
    `;
    let timer = null;
    body.querySelector('#cd-start').addEventListener('click', () => {
      const target = new Date(body.querySelector('#cd-target').value);
      if (isNaN(target)) return;
      if (timer) clearInterval(timer);
      const display = body.querySelector('#cd-display');
      function update() {
        const diff = target - Date.now();
        if (diff <= 0) { clearInterval(timer); display.innerHTML = '<div class="result-big">🎉 Time is up!</div>'; return; }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        display.innerHTML = `<div class="countdown-units"><span class="cd-unit">${d}<br>days</span><span class="cd-unit">${pad(h)}<br>hours</span><span class="cd-unit">${pad(m)}<br>min</span><span class="cd-unit">${pad(s)}<br>sec</span></div>`;
      }
      update();
      timer = setInterval(update, 1000);
    });
    container._cleanup = () => { if (timer) clearInterval(timer); };
  } else if (sub === 'unix') {
    body.innerHTML = `
      <h3>Unix Timestamp Converter</h3>
      <div class="form-row"><label>Unix Timestamp (seconds)</label><input type="number" id="unix-ts" value="${Math.floor(Date.now()/1000)}" step="1"></div>
      <button id="unix-to-date" class="btn btn-calc-primary">→ Date</button>
      <div class="form-row"><label>Date & Time</label><input type="datetime-local" id="unix-dt" value="${new Date().toISOString().slice(0,16)}"></div>
      <button id="date-to-unix" class="btn btn-sm">→ Unix</button>
      <div id="unix-result" class="calc-output"></div>
    `;
    body.querySelector('#unix-to-date').addEventListener('click', () => {
      const ts = parseInt(body.querySelector('#unix-ts').value) * 1000;
      const d = new Date(ts);
      body.querySelector('#unix-result').innerHTML = `
        <div class="result-grid">
          <div class="result-card"><div class="result-label">UTC</div><div class="result-value">${d.toUTCString()}</div></div>
          <div class="result-card"><div class="result-label">ISO 8601</div><div class="result-value">${d.toISOString()}</div></div>
          <div class="result-card"><div class="result-label">Local</div><div class="result-value">${d.toLocaleString()}</div></div>
        </div>
      `;
    });
    body.querySelector('#date-to-unix').addEventListener('click', () => {
      const d = new Date(body.querySelector('#unix-dt').value);
      body.querySelector('#unix-ts').value = Math.floor(d.getTime() / 1000);
    });
  } else if (sub === 'week') {
    body.innerHTML = `
      <h3>Week Number & Calendar Info</h3>
      <div class="form-row"><label>Date</label><input type="date" id="week-date" value="${today}"></div>
      <button id="week-calc" class="btn btn-calc-primary">Calculate</button>
      <div id="week-result" class="calc-output"></div>
    `;
    body.querySelector('#week-calc').addEventListener('click', () => {
      const d = new Date(body.querySelector('#week-date').value);
      const startOfYear = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
      const quarter = Math.ceil((d.getMonth() + 1) / 3);
      const dayOfYear = Math.floor((d - startOfYear) / 86400000) + 1;
      const isLeap = (y) => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
      body.querySelector('#week-result').innerHTML = `
        <div class="result-grid">
          <div class="result-card"><div class="result-label">Week Number</div><div class="result-value">${weekNum}</div></div>
          <div class="result-card"><div class="result-label">Quarter</div><div class="result-value">Q${quarter}</div></div>
          <div class="result-card"><div class="result-label">Day of Year</div><div class="result-value">${dayOfYear}</div></div>
          <div class="result-card"><div class="result-label">Days remaining in year</div><div class="result-value">${(isLeap(d.getFullYear())?366:365) - dayOfYear}</div></div>
          <div class="result-card"><div class="result-label">Leap year</div><div class="result-value">${isLeap(d.getFullYear()) ? 'Yes' : 'No'}</div></div>
        </div>
      `;
    });
  }
}
