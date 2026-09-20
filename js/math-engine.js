/**
 * Ganit Math Engine — shunting-yard parser + evaluator.
 * No eval(). No external dependencies at runtime.
 */

export const CONSTANTS = {
  pi:  Math.PI,
  π:   Math.PI,
  e:   Math.E,
  phi: (1 + Math.sqrt(5)) / 2,
  φ:   (1 + Math.sqrt(5)) / 2,
  tau: 2 * Math.PI,
  τ:   2 * Math.PI,
  inf: Infinity,
  Infinity: Infinity,
};

const FUNCTIONS = {
  // Trig
  sin:   (a, mode) => Math.sin(toRad(a, mode)),
  cos:   (a, mode) => Math.cos(toRad(a, mode)),
  tan:   (a, mode) => Math.tan(toRad(a, mode)),
  asin:  (a, mode) => fromRad(Math.asin(a), mode),
  acos:  (a, mode) => fromRad(Math.acos(a), mode),
  atan:  (a, mode) => fromRad(Math.atan(a), mode),
  atan2: (y, x, mode) => fromRad(Math.atan2(y, x), mode),
  // Hyperbolic
  sinh:  (a) => Math.sinh(a),
  cosh:  (a) => Math.cosh(a),
  tanh:  (a) => Math.tanh(a),
  asinh: (a) => Math.asinh(a),
  acosh: (a) => Math.acosh(a),
  atanh: (a) => Math.atanh(a),
  // Logs/exp
  log:   (a) => Math.log(a),
  ln:    (a) => Math.log(a),
  log2:  (a) => Math.log2(a),
  log10: (a) => Math.log10(a),
  exp:   (a) => Math.exp(a),
  // Power/root
  sqrt:  (a) => Math.sqrt(a),
  cbrt:  (a) => Math.cbrt(a),
  pow:   (a, b) => Math.pow(a, b),
  // Rounding
  abs:   (a) => Math.abs(a),
  sign:  (a) => Math.sign(a),
  floor: (a) => Math.floor(a),
  ceil:  (a) => Math.ceil(a),
  round: (a) => Math.round(a),
  trunc: (a) => Math.trunc(a),
  // Combinatorics
  factorial: (n) => factorial(n),
  nCr: (n, r) => nCr(n, r),
  nPr: (n, r) => nPr(n, r),
  gcd: (a, b) => gcd(Math.abs(a), Math.abs(b)),
  lcm: (a, b) => Math.abs(a * b) / gcd(Math.abs(a), Math.abs(b)),
  // Misc
  min:  (...args) => Math.min(...args),
  max:  (...args) => Math.max(...args),
  sum:  (...args) => args.reduce((a, b) => a + b, 0),
  prod: (...args) => args.reduce((a, b) => a * b, 1),
  mod:  (a, b) => ((a % b) + b) % b,
  rem:  (a, b) => a % b,
  reciprocal: (a) => 1 / a,
  percent: (a) => a / 100,
  // Conversions
  degToRad: (d) => d * Math.PI / 180,
  radToDeg: (r) => r * 180 / Math.PI,
  // Complex support (returns string)
  re: (c) => typeof c === 'object' ? c.re : c,
  im: (c) => typeof c === 'object' ? c.im : 0,
};

const OPERATORS = {
  '+': { prec: 1, assoc: 'left',  fn: (a, b) => a + b },
  '-': { prec: 1, assoc: 'left',  fn: (a, b) => a - b },
  '*': { prec: 2, assoc: 'left',  fn: (a, b) => a * b },
  '×': { prec: 2, assoc: 'left',  fn: (a, b) => a * b },
  '/': { prec: 2, assoc: 'left',  fn: (a, b) => { if (b === 0) throw new Error('Division by zero'); return a / b; } },
  '÷': { prec: 2, assoc: 'left',  fn: (a, b) => { if (b === 0) throw new Error('Division by zero'); return a / b; } },
  '%': { prec: 2, assoc: 'left',  fn: (a, b) => a % b },
  '^': { prec: 3, assoc: 'right', fn: (a, b) => Math.pow(a, b) },
  '**':{ prec: 3, assoc: 'right', fn: (a, b) => Math.pow(a, b) },
};

function toRad(a, mode = 'DEG') {
  if (mode === 'RAD') return a;
  if (mode === 'GRAD') return a * Math.PI / 200;
  return a * Math.PI / 180;
}
function fromRad(a, mode = 'DEG') {
  if (mode === 'RAD') return a;
  if (mode === 'GRAD') return a * 200 / Math.PI;
  return a * 180 / Math.PI;
}
function factorial(n) {
  n = Math.floor(n);
  if (n < 0) throw new Error('Factorial of negative number');
  if (n > 170) return Infinity;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
function nCr(n, r) {
  if (r < 0 || r > n) return 0;
  return factorial(n) / (factorial(r) * factorial(n - r));
}
function nPr(n, r) {
  return factorial(n) / factorial(n - r);
}
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function tokenize(expr) {
  const tokens = [];
  let i = 0;
  const s = expr.trim()
    .replace(/×/g, '*').replace(/÷/g, '/')
    .replace(/−/g, '-').replace(/−/g, '-')
    .replace(/π/g, 'pi').replace(/τ/g, 'tau').replace(/φ/g, 'phi');

  while (i < s.length) {
    const ch = s[i];

    if (/\s/.test(ch)) { i++; continue; }

    // Number (including scientific notation)
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(s[i + 1] || ''))) {
      let num = '';
      while (i < s.length && (/[0-9.]/.test(s[i]) || (s[i] === 'e' || s[i] === 'E'))) {
        if ((s[i] === 'e' || s[i] === 'E') && /[+-]/.test(s[i + 1] || '')) {
          num += s[i++] + s[i++];
        } else {
          num += s[i++];
        }
      }
      tokens.push({ type: 'number', value: parseFloat(num) });
      continue;
    }

    // Function name or constant
    if (/[a-zA-Z_]/.test(ch)) {
      let name = '';
      while (i < s.length && /[a-zA-Z_0-9]/.test(s[i])) name += s[i++];
      if (CONSTANTS.hasOwnProperty(name)) {
        tokens.push({ type: 'number', value: CONSTANTS[name] });
      } else if (FUNCTIONS.hasOwnProperty(name)) {
        tokens.push({ type: 'function', value: name });
      } else {
        tokens.push({ type: 'variable', value: name });
      }
      continue;
    }

    // Two-char operators
    if (s.slice(i, i + 2) === '**') {
      tokens.push({ type: 'operator', value: '**' });
      i += 2;
      continue;
    }

    // Unary minus: after (, operator, or at start
    if (ch === '-') {
      const prev = tokens[tokens.length - 1];
      const isUnary = !prev || prev.type === 'operator' || (prev.type === 'paren' && prev.value === '(') || prev.type === 'comma';
      if (isUnary) {
        tokens.push({ type: 'unary', value: 'neg' });
        i++;
        continue;
      }
    }

    if (ch === '!') {
      tokens.push({ type: 'postfix', value: 'factorial' });
      i++;
      continue;
    }

    if (ch === ',' ) { tokens.push({ type: 'comma', value: ',' }); i++; continue; }
    if (ch === '(' ) { tokens.push({ type: 'paren', value: '(' }); i++; continue; }
    if (ch === ')' ) { tokens.push({ type: 'paren', value: ')' }); i++; continue; }

    if (OPERATORS[ch]) {
      tokens.push({ type: 'operator', value: ch });
      i++;
      continue;
    }

    throw new Error(`Unknown token: "${ch}" at position ${i}`);
  }
  return tokens;
}

function shuntingYard(tokens) {
  const output = [];
  const opStack = [];

  for (const tok of tokens) {
    if (tok.type === 'number') {
      output.push(tok);
    } else if (tok.type === 'variable') {
      output.push(tok);
    } else if (tok.type === 'function' || tok.type === 'unary') {
      opStack.push(tok);
    } else if (tok.type === 'postfix') {
      output.push(tok);
    } else if (tok.type === 'comma') {
      while (opStack.length && !(opStack[opStack.length - 1].type === 'paren' && opStack[opStack.length - 1].value === '(')) {
        output.push(opStack.pop());
      }
    } else if (tok.type === 'operator') {
      const op = OPERATORS[tok.value];
      while (opStack.length) {
        const top = opStack[opStack.length - 1];
        if (top.type === 'unary') {
          output.push(opStack.pop());
          continue;
        }
        if (top.type !== 'operator') break;
        const topOp = OPERATORS[top.value];
        if (!topOp) break;
        if (topOp.prec > op.prec || (topOp.prec === op.prec && op.assoc === 'left')) {
          output.push(opStack.pop());
        } else break;
      }
      opStack.push(tok);
    } else if (tok.type === 'paren') {
      if (tok.value === '(') {
        opStack.push(tok);
      } else {
        while (opStack.length && !(opStack[opStack.length - 1].type === 'paren' && opStack[opStack.length - 1].value === '(')) {
          output.push(opStack.pop());
        }
        if (!opStack.length) throw new Error('Mismatched parentheses');
        opStack.pop(); // discard '('
        if (opStack.length && (opStack[opStack.length - 1].type === 'function' || opStack[opStack.length - 1].type === 'unary')) {
          output.push(opStack.pop());
        }
      }
    }
  }

  while (opStack.length) {
    const top = opStack.pop();
    if (top.type === 'paren') throw new Error('Mismatched parentheses');
    output.push(top);
  }

  return output;
}

function evalRPN(rpn, context = {}, mode = 'DEG') {
  const stack = [];

  for (const tok of rpn) {
    if (tok.type === 'number') {
      stack.push(tok.value);
    } else if (tok.type === 'variable') {
      const val = context[tok.value] ?? CONSTANTS[tok.value];
      if (val === undefined) throw new Error(`Unknown variable: ${tok.value}`);
      stack.push(val);
    } else if (tok.type === 'postfix') {
      const a = stack.pop();
      if (tok.value === 'factorial') stack.push(factorial(a));
    } else if (tok.type === 'unary') {
      const a = stack.pop();
      stack.push(-a);
    } else if (tok.type === 'function') {
      const fn = FUNCTIONS[tok.value];
      if (!fn) throw new Error(`Unknown function: ${tok.value}`);
      // Determine arity by counting arguments (simplified: pop up to fn.length)
      const arity = fn.length <= 1 ? 1 : fn.length - (isTrigFn(tok.value) ? 1 : 0);
      const args = [];
      for (let i = 0; i < Math.max(1, fn.length - (isTrigFn(tok.value) ? 1 : 0)); i++) {
        args.unshift(stack.pop());
      }
      if (isTrigFn(tok.value)) {
        stack.push(fn(...args, mode));
      } else {
        stack.push(fn(...args));
      }
    } else if (tok.type === 'operator') {
      const b = stack.pop(), a = stack.pop();
      stack.push(OPERATORS[tok.value].fn(a, b));
    }
  }

  if (stack.length !== 1) throw new Error('Invalid expression');
  return stack[0];
}

function isTrigFn(name) {
  return ['sin', 'cos', 'tan', 'asin', 'acos', 'atan'].includes(name);
}

export class MathEngine {
  constructor() {
    this.mode = 'DEG'; // DEG | RAD | GRAD
    this.variables = {};
  }

  setMode(mode) { this.mode = mode; }
  setVariable(name, value) { this.variables[name] = value; }

  evaluate(expr, extraContext = {}) {
    if (!expr || !expr.trim()) return null;
    const context = { ...this.variables, ...extraContext };
    try {
      const tokens = tokenize(String(expr));
      const rpn = shuntingYard(tokens);
      const result = evalRPN(rpn, context, this.mode);
      if (!isFinite(result) && result !== Infinity && result !== -Infinity) {
        throw new Error('Result is NaN');
      }
      return result;
    } catch (e) {
      throw new Error(e.message || 'Invalid expression');
    }
  }

  tryEvaluate(expr, extraContext = {}) {
    try { return { ok: true, value: this.evaluate(expr, extraContext) }; }
    catch (e) { return { ok: false, error: e.message }; }
  }

  formatResult(value, options = {}) {
    const { precision = 10, notation = 'auto', base = 10 } = options;
    if (value === null || value === undefined) return '';
    if (!isFinite(value)) return value > 0 ? '∞' : value < 0 ? '-∞' : 'Error';
    if (base !== 10) return Math.trunc(value).toString(base).toUpperCase();
    if (notation === 'scientific') return value.toExponential(precision);
    if (notation === 'engineering') {
      const exp = Math.floor(Math.log10(Math.abs(value)));
      const eng = Math.floor(exp / 3) * 3;
      return `${(value / Math.pow(10, eng)).toPrecision(precision)}e${eng >= 0 ? '+' : ''}${eng}`;
    }
    // Auto: trim trailing zeros, switch to sci for very large/small
    if (Math.abs(value) !== 0 && (Math.abs(value) >= 1e15 || Math.abs(value) < 1e-10)) {
      return value.toExponential(precision - 1).replace(/\.?0+e/, 'e');
    }
    const str = parseFloat(value.toPrecision(precision)).toString();
    return str;
  }
}

export const mathEngine = new MathEngine();
export default mathEngine;
