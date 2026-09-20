import { history } from '../history.js';

function fmt(n, dp = 4) { return typeof n === 'number' ? parseFloat(n.toPrecision(6)).toString() : n; }

function parseData(str) {
  return str.split(/[\s,;\n]+/).map(Number).filter(n => !isNaN(n));
}

function mean(data) { return data.reduce((s, v) => s + v, 0) / data.length; }
function variance(data, pop = false) {
  const m = mean(data), n = pop ? data.length : data.length - 1;
  return data.reduce((s, v) => s + (v - m) ** 2, 0) / n;
}
function stddev(data, pop = false) { return Math.sqrt(variance(data, pop)); }
function median(data) {
  const s = [...data].sort((a, b) => a - b), n = s.length;
  return n % 2 === 0 ? (s[n/2-1] + s[n/2]) / 2 : s[Math.floor(n/2)];
}
function mode(data) {
  const freq = new Map();
  data.forEach(v => freq.set(v, (freq.get(v) || 0) + 1));
  const maxFreq = Math.max(...freq.values());
  return [...freq.entries()].filter(([, f]) => f === maxFreq).map(([v]) => v);
}
function range(data) { return Math.max(...data) - Math.min(...data); }
function iqr(data) {
  const s = [...data].sort((a, b) => a - b);
  const q1 = median(s.slice(0, Math.floor(s.length / 2)));
  const q3 = median(s.slice(Math.ceil(s.length / 2)));
  return { q1, q3, iqr: q3 - q1 };
}
function skewness(data) {
  const m = mean(data), sd = stddev(data), n = data.length;
  return (n / ((n-1)*(n-2))) * data.reduce((s, v) => s + ((v-m)/sd)**3, 0);
}
function kurtosis(data) {
  const m = mean(data), sd = stddev(data), n = data.length;
  const ex = data.reduce((s, v) => s + ((v-m)/sd)**4, 0) * n*(n+1)/((n-1)*(n-2)*(n-3));
  return ex - 3*(n-1)**2/((n-2)*(n-3));
}
function linearRegression(x, y) {
  const n = x.length, mx = mean(x), my = mean(y);
  const sxy = x.reduce((s, xi, i) => s + (xi - mx) * (y[i] - my), 0);
  const sxx = x.reduce((s, xi) => s + (xi - mx) ** 2, 0);
  const b = sxy / sxx, a = my - b * mx;
  const yPred = x.map(xi => a + b * xi);
  const ssTot = y.reduce((s, yi) => s + (yi - my) ** 2, 0);
  const ssRes = y.reduce((s, yi, i) => s + (yi - yPred[i]) ** 2, 0);
  const r2 = 1 - ssRes / ssTot;
  const r = Math.sqrt(r2) * (b >= 0 ? 1 : -1);
  return { a, b, r, r2, equation: `y = ${fmt(b)}x + ${fmt(a)}` };
}

// Distribution functions
function normalPDF(x, mu = 0, sigma = 1) {
  return Math.exp(-0.5*((x-mu)/sigma)**2) / (sigma * Math.sqrt(2*Math.PI));
}
function normalCDF(x, mu = 0, sigma = 1) {
  return 0.5 * (1 + erf((x - mu) / (sigma * Math.sqrt(2))));
}
function erf(x) {
  // Abramowitz approximation
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429*t - 1.453152027)*t) + 1.421413741)*t - 0.284496736)*t + 0.254829592)*t*Math.exp(-x*x);
  return x >= 0 ? y : -y;
}
function binomialPMF(k, n, p) {
  return nCr(n, k) * p**k * (1-p)**(n-k);
}
function nCr(n, r) {
  if (r < 0 || r > n) return 0;
  let result = 1;
  for (let i = 0; i < r; i++) result *= (n - i) / (i + 1);
  return result;
}
function poissonPMF(k, lambda) {
  return Math.exp(-lambda) * lambda**k / factorial(k);
}
function factorial(n) {
  n = Math.floor(n); if (n <= 1) return 1;
  let r = 1; for (let i = 2; i <= n; i++) r *= i; return r;
}

const TABS = [
  { id: 'descriptive', label: 'Descriptive Stats' },
  { id: 'regression',  label: 'Regression' },
  { id: 'distribution', label: 'Distributions' },
  { id: 'freq',        label: 'Frequency Table' },
];

export function renderStatistics(container, sub = 'descriptive') {
  container.innerHTML = `
    <div class="calc-form">
      <div class="form-tabs">
        ${TABS.map(t => `<button class="form-tab ${t.id === sub ? 'active' : ''}" data-sub="${t.id}">${t.label}</button>`).join('')}
      </div>
      <div id="stats-body" class="form-body"></div>
    </div>
  `;

  container.querySelectorAll('.form-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      import('../router.js').then(({ router }) => router.go(`/statistics/${btn.dataset.sub}`));
    });
  });

  const body = container.querySelector('#stats-body');

  if (sub === 'descriptive') {
    body.innerHTML = `
      <h3>Descriptive Statistics</h3>
      <div class="form-row">
        <label>Data (space, comma, or newline separated)</label>
        <textarea id="stats-data" rows="5" placeholder="1 2 3 4 5 6 7 8 9 10">2 4 4 4 5 5 7 9</textarea>
      </div>
      <button id="stats-calc" class="btn btn-calc-primary">Calculate</button>
      <div id="stats-result" class="calc-output"></div>
    `;
    body.querySelector('#stats-calc').addEventListener('click', () => {
      const data = parseData(body.querySelector('#stats-data').value);
      if (data.length < 2) { body.querySelector('#stats-result').innerHTML = '<div class="error">Enter at least 2 numbers</div>'; return; }
      const s = [...data].sort((a, b) => a - b);
      const m = mean(data), med = median(data), md = mode(data);
      const sd = stddev(data), sdp = stddev(data, true);
      const vr = variance(data), vrp = variance(data, true);
      const { q1, q3, iqr: IQR } = iqr(data);
      const sk = skewness(data), ku = kurtosis(data);
      const cv = (sd / m) * 100;
      body.querySelector('#stats-result').innerHTML = `
        <div class="result-grid">
          <div class="result-card"><div class="result-label">Count</div><div class="result-value">${data.length}</div></div>
          <div class="result-card"><div class="result-label">Sum</div><div class="result-value">${fmt(data.reduce((s,v)=>s+v,0))}</div></div>
          <div class="result-card"><div class="result-label">Mean</div><div class="result-value">${fmt(m)}</div></div>
          <div class="result-card"><div class="result-label">Median</div><div class="result-value">${fmt(med)}</div></div>
          <div class="result-card"><div class="result-label">Mode</div><div class="result-value">${md.join(', ')}</div></div>
          <div class="result-card"><div class="result-label">Std Dev (sample)</div><div class="result-value">${fmt(sd)}</div></div>
          <div class="result-card"><div class="result-label">Std Dev (population)</div><div class="result-value">${fmt(sdp)}</div></div>
          <div class="result-card"><div class="result-label">Variance (sample)</div><div class="result-value">${fmt(vr)}</div></div>
          <div class="result-card"><div class="result-label">Min</div><div class="result-value">${fmt(Math.min(...data))}</div></div>
          <div class="result-card"><div class="result-label">Max</div><div class="result-value">${fmt(Math.max(...data))}</div></div>
          <div class="result-card"><div class="result-label">Range</div><div class="result-value">${fmt(range(data))}</div></div>
          <div class="result-card"><div class="result-label">Q1</div><div class="result-value">${fmt(q1)}</div></div>
          <div class="result-card"><div class="result-label">Q3</div><div class="result-value">${fmt(q3)}</div></div>
          <div class="result-card"><div class="result-label">IQR</div><div class="result-value">${fmt(IQR)}</div></div>
          <div class="result-card"><div class="result-label">Skewness</div><div class="result-value">${fmt(sk)}</div></div>
          <div class="result-card"><div class="result-label">Kurtosis</div><div class="result-value">${fmt(ku)}</div></div>
          <div class="result-card"><div class="result-label">CV%</div><div class="result-value">${fmt(cv)}%</div></div>
        </div>
      `;
      history.add({ category: 'statistics', tool: 'descriptive', n: data.length });
    });
  } else if (sub === 'regression') {
    body.innerHTML = `
      <h3>Linear Regression</h3>
      <p>Enter paired data (one pair per line: x y)</p>
      <div class="form-row">
        <label>X values</label>
        <textarea id="reg-x" rows="5" placeholder="1\n2\n3\n4\n5">1\n2\n3\n4\n5</textarea>
      </div>
      <div class="form-row">
        <label>Y values</label>
        <textarea id="reg-y" rows="5" placeholder="2\n4\n5\n4\n5">2\n4\n5\n4\n5</textarea>
      </div>
      <button id="reg-calc" class="btn btn-calc-primary">Calculate Regression</button>
      <div id="reg-result" class="calc-output"></div>
    `;
    body.querySelector('#reg-calc').addEventListener('click', () => {
      const x = parseData(body.querySelector('#reg-x').value);
      const y = parseData(body.querySelector('#reg-y').value);
      if (x.length !== y.length || x.length < 2) { body.querySelector('#reg-result').innerHTML = '<div class="error">X and Y must have same count (≥ 2)</div>'; return; }
      const r = linearRegression(x, y);
      body.querySelector('#reg-result').innerHTML = `
        <div class="result-grid">
          <div class="result-card"><div class="result-label">Equation</div><div class="result-value">${r.equation}</div></div>
          <div class="result-card"><div class="result-label">Slope (b)</div><div class="result-value">${fmt(r.b)}</div></div>
          <div class="result-card"><div class="result-label">Intercept (a)</div><div class="result-value">${fmt(r.a)}</div></div>
          <div class="result-card"><div class="result-label">r (correlation)</div><div class="result-value">${fmt(r.r)}</div></div>
          <div class="result-card"><div class="result-label">R² (determination)</div><div class="result-value">${fmt(r.r2)}</div></div>
        </div>
      `;
    });
  } else if (sub === 'distribution') {
    body.innerHTML = `
      <h3>Probability Distributions</h3>
      <div class="form-row">
        <label>Distribution</label>
        <select id="dist-type">
          <option value="normal">Normal</option>
          <option value="binomial">Binomial</option>
          <option value="poisson">Poisson</option>
        </select>
      </div>
      <div id="dist-params"></div>
      <button id="dist-calc" class="btn btn-calc-primary">Calculate</button>
      <div id="dist-result" class="calc-output"></div>
    `;
    function renderDistParams(type) {
      const params = body.querySelector('#dist-params');
      if (type === 'normal') {
        params.innerHTML = `
          <div class="form-row"><label>X value</label><input type="number" id="dist-x" value="0" step="any"></div>
          <div class="form-row"><label>Mean (μ)</label><input type="number" id="dist-mu" value="0" step="any"></div>
          <div class="form-row"><label>Std Dev (σ)</label><input type="number" id="dist-sigma" value="1" min="0.001" step="any"></div>
        `;
      } else if (type === 'binomial') {
        params.innerHTML = `
          <div class="form-row"><label>k (successes)</label><input type="number" id="dist-k" value="3" min="0" step="1"></div>
          <div class="form-row"><label>n (trials)</label><input type="number" id="dist-n" value="10" min="1" step="1"></div>
          <div class="form-row"><label>p (probability)</label><input type="number" id="dist-p" value="0.5" min="0" max="1" step="any"></div>
        `;
      } else if (type === 'poisson') {
        params.innerHTML = `
          <div class="form-row"><label>k (events)</label><input type="number" id="dist-k" value="3" min="0" step="1"></div>
          <div class="form-row"><label>λ (rate)</label><input type="number" id="dist-lambda" value="2" min="0.001" step="any"></div>
        `;
      }
    }
    body.querySelector('#dist-type').addEventListener('change', (e) => renderDistParams(e.target.value));
    renderDistParams('normal');
    body.querySelector('#dist-calc').addEventListener('click', () => {
      const type = body.querySelector('#dist-type').value;
      let html = '';
      if (type === 'normal') {
        const x = parseFloat(body.querySelector('#dist-x').value)||0;
        const mu = parseFloat(body.querySelector('#dist-mu').value)||0;
        const sigma = parseFloat(body.querySelector('#dist-sigma').value)||1;
        const pdf = normalPDF(x, mu, sigma), cdf = normalCDF(x, mu, sigma);
        html = `<div class="result-grid">
          <div class="result-card"><div class="result-label">P(X = ${x})</div><div class="result-value">${fmt(pdf)}</div></div>
          <div class="result-card"><div class="result-label">P(X ≤ ${x})</div><div class="result-value">${fmt(cdf)}</div></div>
          <div class="result-card"><div class="result-label">P(X > ${x})</div><div class="result-value">${fmt(1-cdf)}</div></div>
          <div class="result-card"><div class="result-label">Z-score</div><div class="result-value">${fmt((x-mu)/sigma)}</div></div>
        </div>`;
      } else if (type === 'binomial') {
        const k = parseInt(body.querySelector('#dist-k').value)||0;
        const n = parseInt(body.querySelector('#dist-n').value)||10;
        const p = parseFloat(body.querySelector('#dist-p').value)||0.5;
        const pmf = binomialPMF(k, n, p);
        const cdf = Array.from({length:k+1},(_,i)=>binomialPMF(i,n,p)).reduce((s,v)=>s+v,0);
        html = `<div class="result-grid">
          <div class="result-card"><div class="result-label">P(X = ${k})</div><div class="result-value">${fmt(pmf)}</div></div>
          <div class="result-card"><div class="result-label">P(X ≤ ${k})</div><div class="result-value">${fmt(cdf)}</div></div>
          <div class="result-card"><div class="result-label">Mean (np)</div><div class="result-value">${fmt(n*p)}</div></div>
          <div class="result-card"><div class="result-label">Std Dev</div><div class="result-value">${fmt(Math.sqrt(n*p*(1-p)))}</div></div>
        </div>`;
      } else if (type === 'poisson') {
        const k = parseInt(body.querySelector('#dist-k').value)||0;
        const lambda = parseFloat(body.querySelector('#dist-lambda').value)||1;
        const pmf = poissonPMF(k, lambda);
        const cdf = Array.from({length:k+1},(_,i)=>poissonPMF(i,lambda)).reduce((s,v)=>s+v,0);
        html = `<div class="result-grid">
          <div class="result-card"><div class="result-label">P(X = ${k})</div><div class="result-value">${fmt(pmf)}</div></div>
          <div class="result-card"><div class="result-label">P(X ≤ ${k})</div><div class="result-value">${fmt(cdf)}</div></div>
        </div>`;
      }
      body.querySelector('#dist-result').innerHTML = html;
    });
  } else if (sub === 'freq') {
    body.innerHTML = `
      <h3>Frequency Table</h3>
      <div class="form-row"><label>Data</label><textarea id="freq-data" rows="5" placeholder="1 2 2 3 3 3 4 4 4 4 5">1 2 2 3 3 3 4 4 4 4 5</textarea></div>
      <button id="freq-calc" class="btn btn-calc-primary">Generate Table</button>
      <div id="freq-result" class="calc-output"></div>
    `;
    body.querySelector('#freq-calc').addEventListener('click', () => {
      const data = parseData(body.querySelector('#freq-data').value);
      const freq = new Map();
      data.forEach(v => freq.set(v, (freq.get(v)||0)+1));
      const sorted = [...freq.entries()].sort((a,b)=>a[0]-b[0]);
      const n = data.length;
      let cumFreq = 0;
      const rows = sorted.map(([val, f]) => {
        cumFreq += f;
        return `<tr><td>${val}</td><td>${f}</td><td>${fmt(f/n*100)}%</td><td>${cumFreq}</td><td>${fmt(cumFreq/n*100)}%</td></tr>`;
      }).join('');
      body.querySelector('#freq-result').innerHTML = `
        <table class="data-table">
          <thead><tr><th>Value</th><th>Frequency</th><th>Rel. Freq.</th><th>Cumul. Freq.</th><th>Cumul. %</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><td>Total</td><td>${n}</td><td>100%</td><td>${n}</td><td>100%</td></tr></tfoot>
        </table>
      `;
    });
  }
}
