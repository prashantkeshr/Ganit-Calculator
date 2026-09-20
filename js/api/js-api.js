/**
 * Ganit Calculator JavaScript SDK
 * window.Ganit = window.OmniCalc = { ... }
 */
import { mathEngine } from '../math-engine.js';
import { BRAND } from '../brand.js';

const API = {
  brand:     BRAND.productNameFull,
  publisher: BRAND.parentOrg,
  version:   BRAND.version,

  calculate(expr, options = {}) {
    const engine = Object.create(mathEngine);
    if (options.mode) engine.setMode(options.mode);
    const result = engine.evaluate(expr);
    return {
      meta: {
        tool: 'calculate',
        brand: BRAND.productNameFull,
        publisher: BRAND.parentOrg,
        version: BRAND.version,
        timestamp: new Date().toISOString(),
      },
      expression: expr,
      result,
      formatted: engine.formatResult(result, options),
    };
  },

  evaluate(expr, context = {}) {
    return mathEngine.evaluate(expr, context);
  },

  nl(query) {
    const q = query.toLowerCase();
    // Simple NL patterns
    const pct = /(\d+\.?\d*)\s*%\s+of\s+(\d+\.?\d*)/.exec(q);
    if (pct) {
      const result = parseFloat(pct[1]) / 100 * parseFloat(pct[2]);
      return { tool: 'percentage.of', result, query };
    }
    const pctOf = /what\s+is\s+(\d+\.?\d*)\s*%\s+of\s+(\d+\.?\d*)/.exec(q);
    if (pctOf) {
      const result = parseFloat(pctOf[1]) / 100 * parseFloat(pctOf[2]);
      return { tool: 'percentage.of', result, query };
    }
    // Try direct evaluation
    try {
      const cleaned = q.replace(/[^0-9+\-*/().^sincostanlogx ]/g, '');
      const result = mathEngine.evaluate(cleaned);
      return { tool: 'calculate', result, query };
    } catch {}
    return { tool: null, result: null, error: 'Could not parse query', query };
  },

  get tools() {
    return import('../registry.js').then(m => m.TOOLS);
  },

  scientific: {
    sin:  (a, mode='DEG') => mathEngine.tryEvaluate(`sin(${a})`, {}).value,
    cos:  (a, mode='DEG') => mathEngine.tryEvaluate(`cos(${a})`, {}).value,
    tan:  (a, mode='DEG') => mathEngine.tryEvaluate(`tan(${a})`, {}).value,
    asin: (a) => mathEngine.tryEvaluate(`asin(${a})`).value,
    acos: (a) => mathEngine.tryEvaluate(`acos(${a})`).value,
    atan: (a) => mathEngine.tryEvaluate(`atan(${a})`).value,
    log:  (a) => Math.log(a),
    log2: (a) => Math.log2(a),
    log10:(a) => Math.log10(a),
    sqrt: (a) => Math.sqrt(a),
    pow:  (a, b) => Math.pow(a, b),
    factorial: (n) => {
      let r = 1; for (let i = 2; i <= n; i++) r *= i; return r;
    },
  },

  financial: {
    loanEMI({ principal, rate, years }) {
      const r = rate / 100 / 12, n = years * 12;
      if (r === 0) return { emi: principal / n };
      const emi = principal * r * Math.pow(1+r, n) / (Math.pow(1+r, n) - 1);
      return { emi, total: emi * n, interest: emi * n - principal };
    },
    compoundInterest({ principal, rate, years, n = 12 }) {
      return { future: principal * Math.pow(1 + rate/100/n, n*years) };
    },
    simpleInterest({ principal, rate, years }) {
      return { amount: principal * (1 + rate/100*years), interest: principal * rate/100*years };
    },
  },

  health: {
    bmi({ weight, height }) {
      const h = height / 100;
      const val = weight / (h * h);
      return { bmi: val, category: val<18.5?'Underweight':val<25?'Normal':val<30?'Overweight':'Obese' };
    },
    bmr({ weight, height, age, gender = 'male' }) {
      return gender === 'male'
        ? { bmr: 10*weight + 6.25*height - 5*age + 5 }
        : { bmr: 10*weight + 6.25*height - 5*age - 161 };
    },
  },

  percentage: {
    of: (pct, num) => pct / 100 * num,
    change: (from, to) => ((to - from) / from) * 100,
    increase: (val, pct) => val * (1 + pct / 100),
    decrease: (val, pct) => val * (1 - pct / 100),
    whatPercent: (part, whole) => (part / whole) * 100,
  },

  format: {
    number: (n, locale = 'en', options = {}) => new Intl.NumberFormat(locale, options).format(n),
    currency: (n, currency = 'USD', locale = 'en') => new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n),
    scientific: (n) => n.toExponential(),
  },

  on(event, fn) {
    document.addEventListener(`ganit:${event}`, (e) => fn(e.detail));
  },
  off(event, fn) {
    document.removeEventListener(`ganit:${event}`, fn);
  },
  openFloating() {
    const el = document.getElementById('ganit-floating');
    if (el) el.style.display = 'flex';
  },
};

window.Ganit = window.OmniCalc = API;
export default API;
