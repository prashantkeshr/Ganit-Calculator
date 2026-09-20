import { history } from '../history.js';

function fmt(n, dp = 4) {
  const s = parseFloat(n.toPrecision(10)).toString();
  return s;
}

const TOOLS = [
  {
    id: 'of',
    label: '% of a number',
    desc: 'What is X% of Y?',
    fields: [
      { id: 'pct', label: 'Percentage', suffix: '%', default: 15 },
      { id: 'num', label: 'Number', default: 250 },
    ],
    compute: (f) => ({ label: `${f.pct}% of ${f.num}`, result: (f.pct / 100) * f.num }),
  },
  {
    id: 'what-pct',
    label: 'What % is X of Y?',
    desc: 'X is what percent of Y?',
    fields: [
      { id: 'part',  label: 'Part (X)', default: 37.5 },
      { id: 'whole', label: 'Whole (Y)', default: 250 },
    ],
    compute: (f) => ({ label: `${f.part} is what % of ${f.whole}`, result: (f.part / f.whole) * 100, suffix: '%' }),
  },
  {
    id: 'increase',
    label: 'Percentage Increase',
    desc: 'Increase X by Y%',
    fields: [
      { id: 'original', label: 'Original Value', default: 100 },
      { id: 'pct',      label: 'Increase %', suffix: '%', default: 15 },
    ],
    compute: (f) => ({ label: `${f.original} increased by ${f.pct}%`, result: f.original * (1 + f.pct / 100) }),
  },
  {
    id: 'decrease',
    label: 'Percentage Decrease',
    desc: 'Decrease X by Y%',
    fields: [
      { id: 'original', label: 'Original Value', default: 100 },
      { id: 'pct',      label: 'Decrease %', suffix: '%', default: 15 },
    ],
    compute: (f) => ({ label: `${f.original} decreased by ${f.pct}%`, result: f.original * (1 - f.pct / 100) }),
  },
  {
    id: 'change',
    label: 'Percentage Change',
    desc: 'What is the % change from X to Y?',
    fields: [
      { id: 'from', label: 'From', default: 80 },
      { id: 'to',   label: 'To', default: 100 },
    ],
    compute: (f) => ({ label: `Change from ${f.from} to ${f.to}`, result: ((f.to - f.from) / f.from) * 100, suffix: '%' }),
  },
  {
    id: 'discount',
    label: 'Discount',
    desc: 'Price after X% discount',
    fields: [
      { id: 'price',    label: 'Original Price', prefix: '$', default: 120 },
      { id: 'discount', label: 'Discount', suffix: '%', default: 20 },
    ],
    compute: (f) => {
      const saving = f.price * f.discount / 100;
      return { label: `$${f.price} after ${f.discount}% off`, result: f.price - saving, extra: `Saving: $${fmt(saving)}` };
    },
  },
  {
    id: 'tip',
    label: 'Tip Calculator',
    desc: 'Calculate tip and split',
    fields: [
      { id: 'bill',   label: 'Bill Amount', prefix: '$', default: 85 },
      { id: 'tip',    label: 'Tip %', suffix: '%', default: 18 },
      { id: 'people', label: 'Split between', default: 2, min: 1 },
    ],
    compute: (f) => {
      const tipAmt = f.bill * f.tip / 100;
      const total = f.bill + tipAmt;
      return { label: `$${f.bill} bill, ${f.tip}% tip`, result: total / f.people, extra: `Tip: $${fmt(tipAmt)} | Total: $${fmt(total)}` };
    },
  },
  {
    id: 'tax',
    label: 'Tax Calculator',
    desc: 'Price with/without tax',
    fields: [
      { id: 'price', label: 'Price', prefix: '$', default: 100 },
      { id: 'tax',   label: 'Tax Rate', suffix: '%', default: 8.5 },
    ],
    compute: (f) => {
      const taxAmt = f.price * f.tax / 100;
      return { label: `$${f.price} + ${f.tax}% tax`, result: f.price + taxAmt, extra: `Tax: $${fmt(taxAmt)}` };
    },
  },
  {
    id: 'markup',
    label: 'Markup / Margin',
    desc: 'Cost → selling price with markup',
    fields: [
      { id: 'cost',   label: 'Cost', prefix: '$', default: 60 },
      { id: 'markup', label: 'Markup %', suffix: '%', default: 40 },
    ],
    compute: (f) => {
      const price  = f.cost * (1 + f.markup / 100);
      const margin = ((price - f.cost) / price) * 100;
      return { label: `$${f.cost} cost + ${f.markup}% markup`, result: price, extra: `Gross Margin: ${fmt(margin)}%` };
    },
  },
];

export function renderPercentage(container) {
  let activeTool = TOOLS[0];

  function renderTool(tool) {
    activeTool = tool;
    const formHtml = tool.fields.map(f => `
      <div class="form-row">
        <label>${f.label}</label>
        <div class="input-wrapper">
          ${f.prefix ? `<span class="input-prefix">${f.prefix}</span>` : ''}
          <input type="number" id="pct-${f.id}" value="${f.default ?? ''}" step="any">
          ${f.suffix ? `<span class="input-suffix">${f.suffix}</span>` : ''}
        </div>
      </div>
    `).join('');

    container.querySelector('#pct-tool-form').innerHTML = `
      <h3>${tool.label}</h3>
      <p class="tool-desc">${tool.desc}</p>
      <form id="pct-form">
        ${formHtml}
        <button type="submit" class="btn btn-calc-primary">Calculate</button>
      </form>
      <div id="pct-result" class="calc-output"></div>
    `;

    container.querySelector('#pct-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = {};
      tool.fields.forEach(f => { fd[f.id] = parseFloat(container.querySelector(`#pct-${f.id}`)?.value) || 0; });
      try {
        const r = tool.compute(fd);
        const suf = r.suffix || '';
        const resEl = container.querySelector('#pct-result');
        resEl.innerHTML = `
          <div class="result-hero">
            <div class="result-desc">${r.label} =</div>
            <div class="result-big">${fmt(r.result)}${suf}</div>
            ${r.extra ? `<div class="result-extra">${r.extra}</div>` : ''}
          </div>
        `;
        history.add({ category: 'percentage', tool: tool.id, inputs: fd, result: r.result });
      } catch(err) {
        container.querySelector('#pct-result').innerHTML = `<div class="error">${err.message}</div>`;
      }
    });
  }

  container.innerHTML = `
    <div class="calc-percentage">
      <div class="pct-tool-list">
        ${TOOLS.map(t => `<button class="pct-tool-btn ${t === activeTool ? 'active' : ''}" data-id="${t.id}">${t.label}</button>`).join('')}
      </div>
      <div id="pct-tool-form" class="form-body"></div>
    </div>
  `;

  container.querySelectorAll('.pct-tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.pct-tool-btn').forEach(b => b.classList.toggle('active', b.dataset.id === btn.dataset.id));
      renderTool(TOOLS.find(t => t.id === btn.dataset.id) || TOOLS[0]);
    });
  });

  renderTool(activeTool);
}
