import { ls } from '../storage.js';
import { history } from '../history.js';

const DEFAULT_RATES = {
  baseCurrency: 'USD',
  updatedAt: '2025-01-15',
  source: 'Ganit Calculator default — user editable',
  rates: {
    USD:1, EUR:0.9235, GBP:0.7887, INR:83.12, JPY:148.15, CNY:7.24, KRW:1325, CAD:1.364,
    AUD:1.533, CHF:0.897, SGD:1.341, HKD:7.817, SEK:10.42, NOK:10.56, DKK:6.886,
    NZD:1.637, ZAR:18.63, MXN:17.15, BRL:4.97, ARS:805, TRY:30.73, RUB:91.2,
    PLN:4.03, CZK:23.1, HUF:353, RON:4.65, BGN:1.806, HRK:6.96, RSD:108.7,
    UAH:38.2, KZT:450, AED:3.673, SAR:3.751, QAR:3.64, KWD:0.3075, BHD:0.377,
    OMR:0.385, JOD:0.709, LBP:89500, ILS:3.69, EGP:30.9, TND:3.11, MAD:10.0,
    NGN:1500, KES:160, GHS:15.2, UGX:3800, TZS:2500, ETB:56, ZMW:26.5,
    IDR:15600, MYR:4.65, THB:35.1, PHP:55.8, VND:24500, BDT:110, PKR:280,
    LKR:322, NPR:133, MMK:2100, KHR:4100, LAK:20000,
    CLP:908, COP:3950, PEN:3.71, VES:36.5, BOB:6.91, PYG:7550, UYU:39.6,
    BTC:0.0000235, ETH:0.000547, BNB:0.003, XRP:1.85, ADA:2.1, SOL:0.012,
  },
};

function getRates() {
  return ls.get('currency-rates', DEFAULT_RATES);
}

function saveRates(data) {
  ls.set('currency-rates', data);
}

export function renderCurrency(container) {
  let rateData = getRates();

  function convert(amount, from, to) {
    const rates = rateData.rates;
    const base = rates[rateData.baseCurrency] ?? 1;
    const fromRate = rates[from] ?? 1;
    const toRate   = rates[to]   ?? 1;
    const inBase = amount / fromRate;
    return inBase * toRate;
  }

  function renderMain() {
    const currencies = Object.keys(rateData.rates);
    const ageMs = Date.now() - new Date(rateData.updatedAt).getTime();
    const ageDays = Math.floor(ageMs / 86400000);
    const stale = ageDays > 30;

    container.innerHTML = `
      <div class="calc-currency">
        <div class="currency-header">
          <h2>Currency Converter</h2>
          <div class="currency-meta">
            <span class="rate-date ${stale ? 'stale' : ''}">
              Rates as of: ${rateData.updatedAt}
              ${stale ? ' ⚠️ Rates older than 30 days' : ''}
            </span>
            <span class="rate-source">${rateData.source}</span>
          </div>
          <div class="currency-actions">
            <button id="edit-rates-btn" class="btn btn-sm">Edit Rates</button>
            <button id="reset-rates-btn" class="btn btn-sm btn-danger">Reset to Defaults</button>
          </div>
        </div>

        <div class="currency-converter">
          <div class="conv-row">
            <input type="number" id="conv-amount" value="100" step="any" class="conv-input">
            <select id="conv-from" class="conv-select">
              ${currencies.map(c => `<option value="${c}" ${c === 'USD' ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="conv-swap">
            <button id="conv-swap" class="btn btn-icon" title="Swap currencies">⇄</button>
          </div>
          <div class="conv-row">
            <input type="number" id="conv-to-val" readonly class="conv-input conv-result">
            <select id="conv-to" class="conv-select">
              ${currencies.map(c => `<option value="${c}" ${c === 'INR' ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
        </div>

        <div id="conv-rate-display" class="rate-display"></div>

        <div class="multi-convert">
          <h3>Quick Conversions — ${currencies.slice(0, 12).join(', ')}</h3>
          <div id="multi-conv-grid" class="multi-conv-grid"></div>
        </div>
      </div>
    `;

    function updateConversion() {
      const amount = parseFloat(container.querySelector('#conv-amount').value) || 0;
      const from   = container.querySelector('#conv-from').value;
      const to     = container.querySelector('#conv-to').value;
      const result = convert(amount, from, to);
      container.querySelector('#conv-to-val').value = parseFloat(result.toFixed(4));
      container.querySelector('#conv-rate-display').textContent =
        `1 ${from} = ${parseFloat(convert(1, from, to).toFixed(6))} ${to}`;
      updateMultiGrid(amount, from);
    }

    function updateMultiGrid(amount, from) {
      const currencies = ['USD','EUR','GBP','INR','JPY','CNY','AUD','CAD','CHF','SGD','BTC','ETH'];
      const grid = container.querySelector('#multi-conv-grid');
      if (!grid) return;
      grid.innerHTML = currencies.map(to => {
        const val = convert(amount, from, to);
        return `<div class="multi-conv-item">
          <span class="multi-conv-curr">${to}</span>
          <span class="multi-conv-val">${parseFloat(val.toPrecision(6))}</span>
        </div>`;
      }).join('');
    }

    container.querySelector('#conv-amount').addEventListener('input', updateConversion);
    container.querySelector('#conv-from').addEventListener('change', updateConversion);
    container.querySelector('#conv-to').addEventListener('change', updateConversion);
    container.querySelector('#conv-swap').addEventListener('click', () => {
      const fromSel = container.querySelector('#conv-from');
      const toSel   = container.querySelector('#conv-to');
      const tmp = fromSel.value; fromSel.value = toSel.value; toSel.value = tmp;
      updateConversion();
    });

    container.querySelector('#edit-rates-btn').addEventListener('click', renderEditor);
    container.querySelector('#reset-rates-btn').addEventListener('click', () => {
      if (confirm('Reset all rates to defaults?')) {
        saveRates(DEFAULT_RATES);
        rateData = DEFAULT_RATES;
        renderMain();
      }
    });

    updateConversion();
  }

  function renderEditor() {
    const rates = rateData.rates;
    container.innerHTML = `
      <div class="calc-currency">
        <div class="currency-header">
          <h2>Edit Exchange Rates</h2>
          <p>Paste your own rates. All rates relative to 1 USD.</p>
        </div>
        <div class="rate-editor">
          <div class="rate-editor-controls">
            <input type="date" id="rate-date" value="${rateData.updatedAt}">
            <button id="import-json" class="btn btn-sm">Import JSON</button>
            <button id="export-json" class="btn btn-sm">Export JSON</button>
          </div>
          <div class="rate-table-wrap">
            <table class="data-table rate-table" id="rate-table">
              <thead><tr><th>Currency</th><th>Rate (per 1 USD)</th><th></th></tr></thead>
              <tbody>
                ${Object.entries(rates).map(([cur, rate]) => `
                  <tr>
                    <td><input class="rate-cur" value="${cur}" style="width:80px"></td>
                    <td><input class="rate-val" type="number" value="${rate}" step="any" style="width:140px"></td>
                    <td><button class="btn btn-sm btn-danger del-rate">×</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="editor-actions">
            <button id="add-rate-btn" class="btn btn-sm">+ Add Currency</button>
            <button id="save-rates-btn" class="btn btn-calc-primary">Save Rates</button>
            <button id="cancel-rates-btn" class="btn btn-sm">Cancel</button>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#add-rate-btn').addEventListener('click', () => {
      const tbody = container.querySelector('#rate-table tbody');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input class="rate-cur" value="NEW" style="width:80px"></td>
        <td><input class="rate-val" type="number" value="1" step="any" style="width:140px"></td>
        <td><button class="btn btn-sm btn-danger del-rate">×</button></td>
      `;
      tbody.appendChild(tr);
    });

    container.addEventListener('click', (e) => {
      if (e.target.classList.contains('del-rate')) e.target.closest('tr').remove();
    });

    container.querySelector('#save-rates-btn').addEventListener('click', () => {
      const newRates = {};
      container.querySelectorAll('#rate-table tbody tr').forEach(row => {
        const cur = row.querySelector('.rate-cur')?.value.trim().toUpperCase();
        const val = parseFloat(row.querySelector('.rate-val')?.value);
        if (cur && !isNaN(val)) newRates[cur] = val;
      });
      rateData = { ...rateData, rates: newRates, updatedAt: container.querySelector('#rate-date').value, source: 'User-defined rates' };
      saveRates(rateData);
      renderMain();
    });

    container.querySelector('#cancel-rates-btn').addEventListener('click', renderMain);

    container.querySelector('#export-json').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(rateData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'ganit-rates.json'; a.click();
    });

    container.querySelector('#import-json').addEventListener('click', () => {
      const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
      input.addEventListener('change', async () => {
        try {
          const text = await input.files[0].text();
          const data = JSON.parse(text);
          if (data.rates) { rateData = data; saveRates(data); renderMain(); }
          else alert('Invalid format: expected { rates: {...} }');
        } catch(e) { alert('Failed to parse JSON: ' + e.message); }
      });
      input.click();
    });
  }

  renderMain();
}
