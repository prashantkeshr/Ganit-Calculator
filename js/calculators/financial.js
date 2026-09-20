import { history } from '../history.js';

function fmt(n, dp = 2) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(n);
}

function loanEMI({ principal, rate, years }) {
  const P = principal, r = rate / 100 / 12, n = years * 12;
  if (r === 0) return { emi: P / n, total: P, interest: 0 };
  const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  const total = emi * n;
  return { emi, total, interest: total - P };
}

function buildAmortization({ principal, rate, years }) {
  const { emi } = loanEMI({ principal, rate, years });
  const r = rate / 100 / 12;
  let balance = principal;
  const schedule = [];
  const n = years * 12;
  for (let i = 1; i <= n; i++) {
    const int = balance * r;
    const princ = emi - int;
    balance -= princ;
    schedule.push({ month: i, payment: emi, interest: int, principal: princ, balance: Math.max(balance, 0) });
  }
  return schedule;
}

function compoundInterest({ principal, rate, years, n = 12, contribution = 0 }) {
  const r = rate / 100 / n;
  let balance = principal;
  for (let i = 0; i < years * n; i++) {
    balance = balance * (1 + r) + contribution;
  }
  return { future: balance, interest: balance - principal - contribution * years * n };
}

function simpleInterest({ principal, rate, years }) {
  const interest = principal * rate / 100 * years;
  return { amount: principal + interest, interest };
}

function roi({ initial, final }) {
  return { roi: ((final - initial) / initial) * 100 };
}

function cagr({ initial, final, years }) {
  return { cagr: (Math.pow(final / initial, 1 / years) - 1) * 100 };
}

function npv({ rate, cashflows }) {
  const r = rate / 100;
  let npvVal = 0;
  cashflows.forEach((cf, t) => { npvVal += cf / Math.pow(1 + r, t); });
  return { npv: npvVal };
}

function irr(cashflows, guess = 0.1) {
  let rate = guess;
  for (let iter = 0; iter < 100; iter++) {
    let f = 0, df = 0;
    cashflows.forEach((cf, t) => {
      f  += cf / Math.pow(1 + rate, t);
      df += -t * cf / Math.pow(1 + rate, t + 1);
    });
    if (Math.abs(f) < 1e-10) break;
    rate -= f / df;
  }
  return { irr: rate * 100 };
}

function retirement({ currentAge, retireAge, savings, monthly, returnRate, withdrawalRate = 4 }) {
  const years = retireAge - currentAge;
  const { future } = compoundInterest({ principal: savings, rate: returnRate, years, n: 12, contribution: monthly });
  const annualWithdrawal = future * withdrawalRate / 100;
  return { corpus: future, annualWithdrawal, monthlyWithdrawal: annualWithdrawal / 12 };
}

function inflation({ amount, rate, years, direction = 'future' }) {
  if (direction === 'future') return { result: amount * Math.pow(1 + rate / 100, years) };
  return { result: amount / Math.pow(1 + rate / 100, years) };
}

// ---- UI ----

function makeForm(fields) {
  return fields.map(f => `
    <div class="form-row">
      <label>${f.label}</label>
      <div class="input-wrapper">
        ${f.prefix ? `<span class="input-prefix">${f.prefix}</span>` : ''}
        <input type="${f.type || 'number'}" id="${f.id}"
          value="${f.default ?? ''}"
          ${f.min !== undefined ? `min="${f.min}"` : ''}
          ${f.max !== undefined ? `max="${f.max}"` : ''}
          placeholder="${f.placeholder || ''}"
          step="${f.step || 'any'}">
        ${f.suffix ? `<span class="input-suffix">${f.suffix}</span>` : ''}
      </div>
    </div>
  `).join('');
}

const TOOLS = {
  loan: {
    label: 'Loan EMI',
    fields: [
      { id: 'principal', label: 'Loan Amount', prefix: '$', default: 500000 },
      { id: 'rate',      label: 'Annual Interest Rate', suffix: '%', default: 8.5 },
      { id: 'years',     label: 'Term (years)', default: 20, min: 1, max: 50 },
    ],
    compute(f) {
      const r = loanEMI(f);
      return `
        <div class="result-grid">
          <div class="result-card"><div class="result-label">Monthly EMI</div><div class="result-value">$${fmt(r.emi)}</div></div>
          <div class="result-card"><div class="result-label">Total Payment</div><div class="result-value">$${fmt(r.total)}</div></div>
          <div class="result-card"><div class="result-label">Total Interest</div><div class="result-value">$${fmt(r.interest)}</div></div>
        </div>
        <details class="amort-details">
          <summary>View Amortization Schedule</summary>
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Month</th><th>Payment</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead>
              <tbody>${buildAmortization(f).map(row =>
                `<tr><td>${row.month}</td><td>$${fmt(row.payment)}</td><td>$${fmt(row.principal)}</td><td>$${fmt(row.interest)}</td><td>$${fmt(row.balance)}</td></tr>`
              ).join('')}</tbody>
            </table>
          </div>
        </details>
      `;
    }
  },
  compound: {
    label: 'Compound Interest',
    fields: [
      { id: 'principal',     label: 'Principal', prefix: '$', default: 10000 },
      { id: 'rate',          label: 'Annual Rate', suffix: '%', default: 7 },
      { id: 'years',         label: 'Years', default: 10 },
      { id: 'n',             label: 'Compounds per year', default: 12 },
      { id: 'contribution',  label: 'Monthly contribution', prefix: '$', default: 0 },
    ],
    compute(f) {
      const r = compoundInterest(f);
      return `
        <div class="result-grid">
          <div class="result-card"><div class="result-label">Future Value</div><div class="result-value">$${fmt(r.future)}</div></div>
          <div class="result-card"><div class="result-label">Interest Earned</div><div class="result-value">$${fmt(r.interest)}</div></div>
          <div class="result-card"><div class="result-label">Total Contributed</div><div class="result-value">$${fmt(f.principal + f.contribution * f.years * 12)}</div></div>
        </div>
      `;
    }
  },
  roi: {
    label: 'ROI / CAGR',
    fields: [
      { id: 'initial', label: 'Initial Investment', prefix: '$', default: 10000 },
      { id: 'final',   label: 'Final Value', prefix: '$', default: 15000 },
      { id: 'years',   label: 'Years (for CAGR)', default: 3 },
    ],
    compute(f) {
      const r1 = roi(f), r2 = cagr(f);
      return `
        <div class="result-grid">
          <div class="result-card"><div class="result-label">ROI</div><div class="result-value">${fmt(r1.roi)}%</div></div>
          <div class="result-card"><div class="result-label">CAGR</div><div class="result-value">${fmt(r2.cagr)}%</div></div>
          <div class="result-card"><div class="result-label">Gain</div><div class="result-value">$${fmt(f.final - f.initial)}</div></div>
        </div>
      `;
    }
  },
  retirement: {
    label: 'Retirement Planner',
    fields: [
      { id: 'currentAge',  label: 'Current Age', default: 30, min: 18, max: 80 },
      { id: 'retireAge',   label: 'Retirement Age', default: 60, min: 30, max: 90 },
      { id: 'savings',     label: 'Current Savings', prefix: '$', default: 50000 },
      { id: 'monthly',     label: 'Monthly Contribution', prefix: '$', default: 1000 },
      { id: 'returnRate',  label: 'Expected Return Rate', suffix: '%', default: 8 },
      { id: 'withdrawalRate', label: 'Safe Withdrawal Rate', suffix: '%', default: 4 },
    ],
    compute(f) {
      const r = retirement(f);
      return `
        <div class="result-grid">
          <div class="result-card"><div class="result-label">Retirement Corpus</div><div class="result-value">$${fmt(r.corpus)}</div></div>
          <div class="result-card"><div class="result-label">Annual Withdrawal</div><div class="result-value">$${fmt(r.annualWithdrawal)}</div></div>
          <div class="result-card"><div class="result-label">Monthly Income</div><div class="result-value">$${fmt(r.monthlyWithdrawal)}</div></div>
        </div>
      `;
    }
  },
  inflation: {
    label: 'Inflation Adjuster',
    fields: [
      { id: 'amount', label: 'Amount', prefix: '$', default: 1000 },
      { id: 'rate',   label: 'Inflation Rate', suffix: '%', default: 3 },
      { id: 'years',  label: 'Years', default: 10 },
    ],
    compute(f) {
      const future = inflation({ ...f, direction: 'future' }).result;
      const past   = inflation({ ...f, direction: 'past' }).result;
      return `
        <div class="result-grid">
          <div class="result-card"><div class="result-label">Future Value (what $${f.amount} will be)</div><div class="result-value">$${fmt(future)}</div></div>
          <div class="result-card"><div class="result-label">Present Value (what $${f.amount} was worth)</div><div class="result-value">$${fmt(past)}</div></div>
        </div>
      `;
    }
  },
};

export function renderFinancial(container, sub = 'loan') {
  const tool = TOOLS[sub] || TOOLS.loan;

  container.innerHTML = `
    <div class="calc-form">
      <div class="form-tabs">
        ${Object.entries(TOOLS).map(([k, t]) =>
          `<button class="form-tab ${k === sub ? 'active' : ''}" data-sub="${k}">${t.label}</button>`
        ).join('')}
      </div>
      <div class="form-body">
        <h2>${tool.label}</h2>
        <form id="fin-form">
          ${makeForm(tool.fields)}
          <button type="submit" class="btn btn-calc-primary">Calculate</button>
        </form>
        <div id="fin-result" class="calc-output"></div>
      </div>
    </div>
  `;

  container.querySelectorAll('.form-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      import('../router.js').then(({ router }) => router.go(`/financial/${btn.dataset.sub}`));
    });
  });

  container.querySelector('#fin-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = {};
    tool.fields.forEach(f => {
      fd[f.id] = parseFloat(container.querySelector(`#${f.id}`)?.value) || 0;
    });
    try {
      const html = tool.compute(fd);
      container.querySelector('#fin-result').innerHTML = html;
      history.add({ category: 'financial', tool: sub, inputs: fd });
    } catch(err) {
      container.querySelector('#fin-result').innerHTML = `<div class="error">${err.message}</div>`;
    }
  });
}
