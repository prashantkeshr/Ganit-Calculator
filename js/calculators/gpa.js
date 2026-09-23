import { history } from '../history.js';

/* ── grade scale helpers ─────────────────────────────────────── */
const GRADE_SCALE_4 = [
  { grade: 'A+', points: 4.0, min: 97 },
  { grade: 'A',  points: 4.0, min: 93 },
  { grade: 'A-', points: 3.7, min: 90 },
  { grade: 'B+', points: 3.3, min: 87 },
  { grade: 'B',  points: 3.0, min: 83 },
  { grade: 'B-', points: 2.7, min: 80 },
  { grade: 'C+', points: 2.3, min: 77 },
  { grade: 'C',  points: 2.0, min: 73 },
  { grade: 'C-', points: 1.7, min: 70 },
  { grade: 'D+', points: 1.3, min: 67 },
  { grade: 'D',  points: 1.0, min: 63 },
  { grade: 'D-', points: 0.7, min: 60 },
  { grade: 'F',  points: 0.0, min: 0  },
];

const GRADE_SCALE_10 = [
  { grade: 'O',   points: 10, min: 91 },
  { grade: 'A+',  points: 9,  min: 81 },
  { grade: 'A',   points: 8,  min: 71 },
  { grade: 'B+',  points: 7,  min: 61 },
  { grade: 'B',   points: 6,  min: 51 },
  { grade: 'C',   points: 5,  min: 41 },
  { grade: 'P',   points: 4,  min: 35 },
  { grade: 'F',   points: 0,  min: 0  },
];

function pctToGrade4(pct) {
  return GRADE_SCALE_4.find(g => pct >= g.min) || GRADE_SCALE_4[GRADE_SCALE_4.length - 1];
}
function pctToGrade10(pct) {
  return GRADE_SCALE_10.find(g => pct >= g.min) || GRADE_SCALE_10[GRADE_SCALE_10.length - 1];
}
function letterToPoints4(letter) {
  return (GRADE_SCALE_4.find(g => g.grade === letter) || { points: 0 }).points;
}

function gpaClass(gpa) {
  if (gpa >= 3.7) return 'First Class / Distinction';
  if (gpa >= 3.0) return 'Second Class (Upper)';
  if (gpa >= 2.0) return 'Second Class (Lower)';
  if (gpa >= 1.0) return 'Pass';
  return 'Fail';
}

/* ── GPA CALCULATOR ══════════════════════════════════════════════ */
function renderGPA(el) {
  let rows = 4;

  function buildRows(n) {
    let html = '';
    for (let i = 0; i < n; i++) {
      html += `
        <div class="gpa-row" data-idx="${i}">
          <input type="text" class="gpa-subject" placeholder="Subject ${i + 1}" autocomplete="off">
          <select class="gpa-grade">
            ${GRADE_SCALE_4.map(g => `<option value="${g.points}">${g.grade} (${g.points})</option>`).join('')}
          </select>
          <input type="number" class="gpa-credits" placeholder="Credits" value="3" min="1" max="20" step="1">
          <button type="button" class="gpa-remove-btn" title="Remove">✕</button>
        </div>`;
    }
    return html;
  }

  el.innerHTML = `
    <div class="calculus-info">
      <p>Enter each subject's letter grade and credit hours to compute your <strong>cumulative GPA</strong> on a 4.0 scale.</p>
    </div>
    <div id="gpa-rows">${buildRows(rows)}</div>
    <div class="gpa-actions">
      <button type="button" id="gpa-add" class="btn btn-calc-secondary">+ Add Subject</button>
      <button type="button" id="gpa-calc" class="btn btn-calc-primary">Calculate GPA</button>
    </div>
    <div id="gpa-result" class="calc-output"></div>
  `;

  const rowsEl = el.querySelector('#gpa-rows');

  function addRow() {
    rows++;
    const div = document.createElement('div');
    div.className = 'gpa-row';
    div.dataset.idx = rows - 1;
    div.innerHTML = `
      <input type="text" class="gpa-subject" placeholder="Subject ${rows}" autocomplete="off">
      <select class="gpa-grade">
        ${GRADE_SCALE_4.map(g => `<option value="${g.points}">${g.grade} (${g.points})</option>`).join('')}
      </select>
      <input type="number" class="gpa-credits" placeholder="Credits" value="3" min="1" max="20" step="1">
      <button type="button" class="gpa-remove-btn" title="Remove">✕</button>
    `;
    rowsEl.appendChild(div);
  }

  rowsEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('gpa-remove-btn')) {
      const row = e.target.closest('.gpa-row');
      if (rowsEl.children.length > 1) row.remove();
    }
  });

  el.querySelector('#gpa-add').addEventListener('click', addRow);

  el.querySelector('#gpa-calc').addEventListener('click', () => {
    const rows = Array.from(rowsEl.querySelectorAll('.gpa-row'));
    let totalQP = 0, totalCredits = 0;
    const details = [];

    for (const row of rows) {
      const subject = row.querySelector('.gpa-subject').value || `Subject`;
      const points  = parseFloat(row.querySelector('.gpa-grade').value);
      const credits = parseFloat(row.querySelector('.gpa-credits').value);
      if (isNaN(credits) || credits <= 0) continue;
      totalQP += points * credits;
      totalCredits += credits;
      const gradeLetter = GRADE_SCALE_4.find(g => g.points === points)?.grade || '—';
      details.push({ subject, points, credits, gradeLetter, qp: points * credits });
    }

    if (totalCredits === 0) {
      el.querySelector('#gpa-result').innerHTML = '<div class="error">Add at least one subject with credits.</div>';
      return;
    }

    const gpa = totalQP / totalCredits;
    const cls = gpaClass(gpa);

    const tableRows = details.map(d =>
      `<tr><td>${d.subject}</td><td>${d.gradeLetter}</td><td>${d.credits}</td><td>${(d.qp).toFixed(1)}</td></tr>`
    ).join('');

    el.querySelector('#gpa-result').innerHTML = `
      <div class="result-grid">
        <div class="result-card accent"><div class="result-label">Cumulative GPA</div><div class="result-value">${gpa.toFixed(2)} / 4.00</div></div>
        <div class="result-card"><div class="result-label">Classification</div><div class="result-value">${cls}</div></div>
        <div class="result-card"><div class="result-label">Total Credits</div><div class="result-value">${totalCredits}</div></div>
        <div class="result-card"><div class="result-label">Quality Points</div><div class="result-value">${totalQP.toFixed(1)}</div></div>
      </div>
      <table class="calc-table" style="margin-top:12px">
        <thead><tr><th>Subject</th><th>Grade</th><th>Credits</th><th>Quality Points</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    `;
    history.add({ category: 'gpa', tool: 'gpa', gpa, totalCredits });
  });
}

/* ── GRADE CALCULATOR ════════════════════════════════════════════ */
function renderGrade(el) {
  el.innerHTML = `
    <div class="calculus-info">
      <p>Enter each component (assignments, midterm, final, etc.) with its weight and score to compute your <strong>weighted final grade</strong>.</p>
    </div>
    <div id="grade-rows">
      <div class="grade-row">
        <input type="text" class="grade-component" placeholder="Assignments" value="Assignments" autocomplete="off">
        <input type="number" class="grade-weight" placeholder="Weight %" value="30" min="0" max="100" step="1">
        <input type="number" class="grade-score"  placeholder="Score %" value="" min="0" max="100" step="0.1">
        <input type="number" class="grade-max"    placeholder="Max" value="100" min="1" step="1">
        <button type="button" class="gpa-remove-btn" title="Remove">✕</button>
      </div>
      <div class="grade-row">
        <input type="text" class="grade-component" placeholder="Midterm" value="Midterm" autocomplete="off">
        <input type="number" class="grade-weight" placeholder="Weight %" value="30" min="0" max="100" step="1">
        <input type="number" class="grade-score"  placeholder="Score %" value="" min="0" max="100" step="0.1">
        <input type="number" class="grade-max"    placeholder="Max" value="100" min="1" step="1">
        <button type="button" class="gpa-remove-btn" title="Remove">✕</button>
      </div>
      <div class="grade-row">
        <input type="text" class="grade-component" placeholder="Final Exam" value="Final Exam" autocomplete="off">
        <input type="number" class="grade-weight" placeholder="Weight %" value="40" min="0" max="100" step="1">
        <input type="number" class="grade-score"  placeholder="Score %" value="" min="0" max="100" step="0.1">
        <input type="number" class="grade-max"    placeholder="Max" value="100" min="1" step="1">
        <button type="button" class="gpa-remove-btn" title="Remove">✕</button>
      </div>
    </div>
    <div class="grade-header-labels">
      <span>Component</span><span>Weight %</span><span>Score</span><span>Out of</span><span></span>
    </div>
    <div class="gpa-actions">
      <button type="button" id="grade-add" class="btn btn-calc-secondary">+ Add Component</button>
      <button type="button" id="grade-calc" class="btn btn-calc-primary">Calculate Grade</button>
    </div>
    <div id="grade-result" class="calc-output"></div>
  `;

  const rowsEl = el.querySelector('#grade-rows');
  let count = 3;

  rowsEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('gpa-remove-btn')) {
      const row = e.target.closest('.grade-row');
      if (rowsEl.children.length > 1) row.remove();
    }
  });

  el.querySelector('#grade-add').addEventListener('click', () => {
    count++;
    const div = document.createElement('div');
    div.className = 'grade-row';
    div.innerHTML = `
      <input type="text" class="grade-component" placeholder="Component ${count}" autocomplete="off">
      <input type="number" class="grade-weight" placeholder="Weight %" value="0" min="0" max="100" step="1">
      <input type="number" class="grade-score"  placeholder="Score" min="0" step="0.1">
      <input type="number" class="grade-max"    placeholder="Max" value="100" min="1" step="1">
      <button type="button" class="gpa-remove-btn" title="Remove">✕</button>
    `;
    rowsEl.appendChild(div);
  });

  el.querySelector('#grade-calc').addEventListener('click', () => {
    const rows = Array.from(rowsEl.querySelectorAll('.grade-row'));
    let weightedSum = 0, totalWeight = 0;
    const details = [];

    for (const row of rows) {
      const component = row.querySelector('.grade-component').value || 'Component';
      const weight    = parseFloat(row.querySelector('.grade-weight').value);
      const score     = parseFloat(row.querySelector('.grade-score').value);
      const max       = parseFloat(row.querySelector('.grade-max').value) || 100;
      if (isNaN(weight) || weight <= 0) continue;
      if (isNaN(score)) { details.push({ component, weight, score: null, pct: null, contribution: null }); continue; }
      const pct = (score / max) * 100;
      const contribution = (pct * weight) / 100;
      weightedSum += contribution;
      totalWeight += weight;
      details.push({ component, weight, score, max, pct, contribution });
    }

    if (totalWeight === 0) {
      el.querySelector('#grade-result').innerHTML = '<div class="error">Add at least one component with a non-zero weight.</div>';
      return;
    }

    const finalPct = totalWeight < 100
      ? (weightedSum / totalWeight) * 100
      : weightedSum;
    const grade4   = pctToGrade4(finalPct);
    const grade10  = pctToGrade10(finalPct);

    const tableRows = details.map(d => {
      if (d.score === null) return `<tr><td>${d.component}</td><td>${d.weight}%</td><td colspan="3" class="uc-value">— (pending)</td></tr>`;
      return `<tr><td>${d.component}</td><td>${d.weight}%</td><td>${d.score}/${d.max}</td><td>${d.pct.toFixed(1)}%</td><td>${d.contribution.toFixed(2)}%</td></tr>`;
    }).join('');

    const weightNote = totalWeight !== 100
      ? `<div class="calc-note">Weights sum to ${totalWeight}% — result is scaled proportionally.</div>` : '';

    el.querySelector('#grade-result').innerHTML = `
      <div class="result-grid">
        <div class="result-card accent"><div class="result-label">Final Grade</div><div class="result-value">${finalPct.toFixed(2)}%</div></div>
        <div class="result-card"><div class="result-label">Letter Grade (4.0)</div><div class="result-value">${grade4.grade} (${grade4.points})</div></div>
        <div class="result-card"><div class="result-label">Letter Grade (10pt)</div><div class="result-value">${grade10.grade} (${grade10.points}/10)</div></div>
        <div class="result-card"><div class="result-label">Classification</div><div class="result-value">${gpaClass(grade4.points)}</div></div>
      </div>
      <table class="calc-table" style="margin-top:12px">
        <thead><tr><th>Component</th><th>Weight</th><th>Score</th><th>Percentage</th><th>Contribution</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      ${weightNote}
    `;
    history.add({ category: 'gpa', tool: 'grade', finalPct, grade: grade4.grade });
  });
}

/* ── CGPA CONVERTER ══════════════════════════════════════════════ */
function renderCGPA(el) {
  el.innerHTML = `
    <div class="calculus-info">
      <p>Convert between <strong>4.0, 5.0, 7.0, 10.0</strong> GPA scales, or convert a percentage to GPA.</p>
    </div>
    <form id="cgpa-form">
      <div class="form-row">
        <label>Input value</label>
        <input type="number" id="cgpa-val" value="3.5" step="0.01" min="0" max="100">
      </div>
      <div class="form-row">
        <label>Input scale</label>
        <select id="cgpa-from">
          <option value="pct">Percentage (%)</option>
          <option value="4" selected>GPA 4.0 scale</option>
          <option value="5">GPA 5.0 scale</option>
          <option value="7">GPA 7.0 scale</option>
          <option value="10">GPA 10.0 scale</option>
        </select>
      </div>
      <button type="submit" class="btn btn-calc-primary">Convert</button>
    </form>
    <div id="cgpa-result" class="calc-output"></div>
  `;

  el.querySelector('#cgpa-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const val  = parseFloat(el.querySelector('#cgpa-val').value);
    const from = el.querySelector('#cgpa-from').value;
    if (isNaN(val)) return;

    let pct;
    if (from === 'pct') pct = val;
    else pct = (val / parseFloat(from)) * 100;

    // clamp
    pct = Math.max(0, Math.min(100, pct));
    const g4 = pct / 100 * 4;
    const g5 = pct / 100 * 5;
    const g7 = pct / 100 * 7;
    const g10 = pct / 100 * 10;
    const grade4 = pctToGrade4(pct);
    const grade10 = pctToGrade10(pct);

    el.querySelector('#cgpa-result').innerHTML = `
      <div class="result-grid">
        <div class="result-card"><div class="result-label">Percentage</div><div class="result-value">${pct.toFixed(2)}%</div></div>
        <div class="result-card accent"><div class="result-label">GPA (4.0 scale)</div><div class="result-value">${g4.toFixed(2)}</div></div>
        <div class="result-card"><div class="result-label">GPA (10.0 scale)</div><div class="result-value">${g10.toFixed(2)}</div></div>
        <div class="result-card"><div class="result-label">GPA (5.0 scale)</div><div class="result-value">${g5.toFixed(2)}</div></div>
        <div class="result-card"><div class="result-label">Letter Grade</div><div class="result-value">${grade4.grade}</div></div>
        <div class="result-card"><div class="result-label">10pt Letter Grade</div><div class="result-value">${grade10.grade}</div></div>
      </div>
      <div class="calc-note">GPA conversions use linear interpolation. Letter grades follow the standard US grading scale.</div>
    `;
    history.add({ category: 'gpa', tool: 'cgpa', pct, g4 });
  });
}

/* ── TABS & EXPORT ════════════════════════════════════════════════ */
const TABS = [
  { key: 'gpa',   label: 'GPA Calculator',   render: renderGPA },
  { key: 'grade', label: 'Grade Calculator',  render: renderGrade },
  { key: 'cgpa',  label: 'GPA Converter',     render: renderCGPA },
];

export function renderGpaCalculator(container, sub = 'gpa') {
  const active = TABS.find(t => t.key === sub) || TABS[0];

  container.innerHTML = `
    <div class="calc-form">
      <div class="form-tabs">
        ${TABS.map(t =>
          `<button class="form-tab${t.key === active.key ? ' active' : ''}" data-sub="${t.key}">${t.label}</button>`
        ).join('')}
      </div>
      <div id="calc-body" class="form-body"></div>
    </div>
  `;

  container.querySelectorAll('.form-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      import('../router.js').then(({ router }) => router.go(`/gpa/${btn.dataset.sub}`));
    });
  });

  active.render(container.querySelector('#calc-body'));
}
