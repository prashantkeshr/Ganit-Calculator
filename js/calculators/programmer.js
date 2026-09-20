import { history } from '../history.js';

function toBin(n) { return (n >>> 0).toString(2).padStart(32, '0'); }
function toHex(n) { return (n >>> 0).toString(16).toUpperCase().padStart(8, '0'); }
function toOct(n) { return (n >>> 0).toString(8); }

async function sha256(msg) {
  const buf = new TextEncoder().encode(msg);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function sha1(msg) {
  const buf = new TextEncoder().encode(msg);
  const hash = await crypto.subtle.digest('SHA-1', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function btoa64(str) {
  try { return btoa(str); } catch { return btoa(unescape(encodeURIComponent(str))); }
}
function atob64(b64) {
  try { return atob(b64); } catch { return 'Invalid Base64'; }
}

function uuid4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

const MORSE = {
  A:'.-', B:'-...', C:'-.-.', D:'-..', E:'.', F:'..-.', G:'--.', H:'....',
  I:'..', J:'.---', K:'-.-', L:'.-..', M:'--', N:'-.', O:'---', P:'.--.',
  Q:'--.-', R:'.-.', S:'...', T:'-', U:'..-', V:'...-', W:'.--', X:'-..-',
  Y:'-.--', Z:'--..',
  '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-',
  '5':'.....','6':'-....','7':'--...','8':'---..','9':'----.',
  '.':'.-.-.-', ',':'--..--', '?':'..--..', '/':'-..-.',
};

function toMorse(str) {
  return str.toUpperCase().split('').map(c => MORSE[c] || (c === ' ' ? '/' : '')).filter(Boolean).join(' ');
}
function fromMorse(morse) {
  const rev = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
  return morse.split(' ').map(w => w === '/' ? ' ' : rev[w] || '?').join('');
}

const TOOLS = [
  {
    id: 'base-converter', label: 'Base Converter',
    render(el) {
      el.innerHTML = `
        <div class="form-body">
          <h3>Number Base Converter</h3>
          <div class="form-row"><label>Decimal</label><input id="prog-dec" type="number" placeholder="255" step="1"></div>
          <div class="form-row"><label>Hexadecimal</label><input id="prog-hex" placeholder="FF"></div>
          <div class="form-row"><label>Binary</label><input id="prog-bin" placeholder="11111111"></div>
          <div class="form-row"><label>Octal</label><input id="prog-oct" placeholder="377"></div>
          <div class="form-row"><label>Custom base (2–36)</label>
            <input id="prog-base" type="number" value="36" min="2" max="36" style="width:70px">
            <input id="prog-custom" placeholder="">
          </div>
          <div id="prog-bit-grid" class="bit-grid"></div>
        </div>
      `;
      const update = (source, value) => {
        let n;
        if (source === 'dec') n = parseInt(value, 10);
        else if (source === 'hex') n = parseInt(value, 16);
        else if (source === 'bin') n = parseInt(value, 2);
        else if (source === 'oct') n = parseInt(value, 8);
        if (isNaN(n)) return;
        n = n >>> 0;
        el.querySelector('#prog-dec').value = n;
        el.querySelector('#prog-hex').value = toHex(n);
        el.querySelector('#prog-bin').value = toBin(n);
        el.querySelector('#prog-oct').value = toOct(n);
        const base = parseInt(el.querySelector('#prog-base').value) || 36;
        el.querySelector('#prog-custom').value = n.toString(base).toUpperCase();
        renderBits(n);
      };
      const renderBits = (n) => {
        const bits = toBin(n);
        el.querySelector('#prog-bit-grid').innerHTML = bits.split('').map((b, i) =>
          `<button class="bit-btn ${b==='1'?'on':'off'}" data-bit="${31-i}">${b}</button>`
        ).join('');
      };
      ['dec','hex','bin','oct'].forEach(id => {
        el.querySelector(`#prog-${id}`).addEventListener('input', (e) => update(id, e.target.value));
      });
      el.querySelector('#prog-custom').addEventListener('input', (e) => {
        const base = parseInt(el.querySelector('#prog-base').value) || 36;
        update('dec', parseInt(e.target.value, base));
      });
      el.addEventListener('click', (e) => {
        if (!e.target.classList.contains('bit-btn')) return;
        const bit = parseInt(e.target.dataset.bit);
        const cur = parseInt(el.querySelector('#prog-dec').value) || 0;
        const toggled = cur ^ (1 << bit);
        update('dec', toggled);
      });
      update('dec', 255);
    }
  },
  {
    id: 'hash', label: 'Hash Generator',
    render(el) {
      el.innerHTML = `
        <div class="form-body">
          <h3>Hash Generator</h3>
          <div class="form-row"><label>Input Text</label><textarea id="hash-input" rows="4" placeholder="Enter text..."></textarea></div>
          <button id="hash-btn" class="btn btn-calc-primary">Generate Hashes</button>
          <div id="hash-results" class="calc-output"></div>
        </div>
      `;
      el.querySelector('#hash-btn').addEventListener('click', async () => {
        const text = el.querySelector('#hash-input').value;
        const [s256, s1] = await Promise.all([sha256(text), sha1(text)]);
        el.querySelector('#hash-results').innerHTML = `
          <div class="result-card"><div class="result-label">SHA-256</div><div class="result-value hash-val">${s256}</div></div>
          <div class="result-card"><div class="result-label">SHA-1</div><div class="result-value hash-val">${s1}</div></div>
        `;
      });
    }
  },
  {
    id: 'base64', label: 'Base64',
    render(el) {
      el.innerHTML = `
        <div class="form-body">
          <h3>Base64 Encoder / Decoder</h3>
          <div class="form-row"><label>Input</label><textarea id="b64-input" rows="4" placeholder="Text or Base64..."></textarea></div>
          <div class="b64-btns">
            <button id="b64-encode" class="btn btn-calc-primary">Encode →</button>
            <button id="b64-decode" class="btn btn-sm">← Decode</button>
          </div>
          <div class="form-row"><label>Output</label><textarea id="b64-output" rows="4" readonly></textarea></div>
        </div>
      `;
      el.querySelector('#b64-encode').addEventListener('click', () => {
        el.querySelector('#b64-output').value = btoa64(el.querySelector('#b64-input').value);
      });
      el.querySelector('#b64-decode').addEventListener('click', () => {
        el.querySelector('#b64-output').value = atob64(el.querySelector('#b64-input').value);
      });
    }
  },
  {
    id: 'ascii', label: 'ASCII / Unicode',
    render(el) {
      el.innerHTML = `
        <div class="form-body">
          <h3>ASCII / Unicode Table</h3>
          <div class="form-row">
            <label>Character</label><input id="ascii-char" maxlength="1" placeholder="A">
            <label style="margin-left:16px">Code Point</label><input id="ascii-code" type="number" placeholder="65" min="0" max="1114111">
          </div>
          <div id="ascii-result" class="calc-output"></div>
          <div class="ascii-table-wrap">
            <table class="data-table"><thead><tr><th>Dec</th><th>Hex</th><th>Char</th><th>Name</th></tr></thead>
            <tbody>${Array.from({length:128},(_,i) => {
              const c = String.fromCharCode(i);
              const name = i < 32 ? ['NUL','SOH','STX','ETX','EOT','ENQ','ACK','BEL','BS','HT','LF','VT','FF','CR','SO','SI','DLE','DC1','DC2','DC3','DC4','NAK','SYN','ETB','CAN','EM','SUB','ESC','FS','GS','RS','US'][i] : (i === 127 ? 'DEL' : c);
              return `<tr><td>${i}</td><td>${i.toString(16).toUpperCase()}</td><td>${i >= 32 && i < 127 ? c : '–'}</td><td>${name}</td></tr>`;
            }).join('')}</tbody></table>
          </div>
        </div>
      `;
      const show = (code) => {
        const ch = String.fromCodePoint(code);
        el.querySelector('#ascii-result').innerHTML = `
          <div class="result-grid">
            <div class="result-card"><div class="result-label">Character</div><div class="result-value" style="font-size:2rem">${ch}</div></div>
            <div class="result-card"><div class="result-label">Decimal</div><div class="result-value">${code}</div></div>
            <div class="result-card"><div class="result-label">Hex</div><div class="result-value">0x${code.toString(16).toUpperCase()}</div></div>
            <div class="result-card"><div class="result-label">Binary</div><div class="result-value">${code.toString(2)}</div></div>
            <div class="result-card"><div class="result-label">HTML Entity</div><div class="result-value">&#${code};</div></div>
            <div class="result-card"><div class="result-label">Unicode</div><div class="result-value">U+${code.toString(16).toUpperCase().padStart(4,'0')}</div></div>
          </div>
        `;
      };
      el.querySelector('#ascii-char').addEventListener('input', (e) => {
        const ch = e.target.value;
        if (ch) { const code = ch.codePointAt(0); el.querySelector('#ascii-code').value = code; show(code); }
      });
      el.querySelector('#ascii-code').addEventListener('input', (e) => {
        const code = parseInt(e.target.value);
        if (!isNaN(code) && code >= 0) { el.querySelector('#ascii-char').value = String.fromCodePoint(code); show(code); }
      });
    }
  },
  {
    id: 'uuid', label: 'UUID Generator',
    render(el) {
      el.innerHTML = `
        <div class="form-body">
          <h3>UUID Generator</h3>
          <button id="gen-uuid" class="btn btn-calc-primary">Generate UUID v4</button>
          <div id="uuid-list" class="calc-output"></div>
        </div>
      `;
      const list = [];
      el.querySelector('#gen-uuid').addEventListener('click', () => {
        list.unshift(uuid4());
        el.querySelector('#uuid-list').innerHTML = list.slice(0, 20).map(u =>
          `<div class="result-card clickable" onclick="navigator.clipboard.writeText('${u}')" title="Click to copy">${u}</div>`
        ).join('');
      });
      el.querySelector('#gen-uuid').click();
    }
  },
  {
    id: 'url-encode', label: 'URL Encode/Decode',
    render(el) {
      el.innerHTML = `
        <div class="form-body">
          <h3>URL Encoder / Decoder</h3>
          <div class="form-row"><label>Input</label><textarea id="url-input" rows="4" placeholder="https://example.com/path?q=hello world"></textarea></div>
          <div class="b64-btns">
            <button id="url-encode-btn" class="btn btn-calc-primary">Encode →</button>
            <button id="url-decode-btn" class="btn btn-sm">← Decode</button>
          </div>
          <div class="form-row"><label>Output</label><textarea id="url-output" rows="4" readonly></textarea></div>
        </div>
      `;
      el.querySelector('#url-encode-btn').addEventListener('click', () => {
        try { el.querySelector('#url-output').value = encodeURIComponent(el.querySelector('#url-input').value); }
        catch { el.querySelector('#url-output').value = 'Error'; }
      });
      el.querySelector('#url-decode-btn').addEventListener('click', () => {
        try { el.querySelector('#url-output').value = decodeURIComponent(el.querySelector('#url-input').value); }
        catch { el.querySelector('#url-output').value = 'Error'; }
      });
    }
  },
  {
    id: 'morse', label: 'Morse Code',
    render(el) {
      el.innerHTML = `
        <div class="form-body">
          <h3>Morse Code Translator</h3>
          <div class="form-row"><label>Text</label><textarea id="morse-text" rows="3" placeholder="Hello World"></textarea></div>
          <div class="b64-btns">
            <button id="to-morse" class="btn btn-calc-primary">→ Morse</button>
            <button id="from-morse" class="btn btn-sm">← From Morse</button>
          </div>
          <div class="form-row"><label>Morse Code</label><textarea id="morse-code" rows="3" placeholder=".... . .-.. .-.. --- / .-- --- .-. .-.. -.."></textarea></div>
        </div>
      `;
      el.querySelector('#to-morse').addEventListener('click', () => {
        el.querySelector('#morse-code').value = toMorse(el.querySelector('#morse-text').value);
      });
      el.querySelector('#from-morse').addEventListener('click', () => {
        el.querySelector('#morse-text').value = fromMorse(el.querySelector('#morse-code').value);
      });
    }
  },
  {
    id: 'color', label: 'Color Converter',
    render(el) {
      el.innerHTML = `
        <div class="form-body">
          <h3>Color Converter</h3>
          <div class="form-row"><label>Color Picker</label><input type="color" id="color-pick" value="#4F46E5"></div>
          <div id="color-result" class="calc-output"></div>
        </div>
      `;
      const update = () => {
        const hex = el.querySelector('#color-pick').value;
        const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
        const hsl = rgbToHsl(r, g, b);
        const cmyk = rgbToCmyk(r, g, b);
        el.querySelector('#color-result').innerHTML = `
          <div class="color-preview" style="background:${hex};width:100%;height:60px;border-radius:8px;margin:8px 0"></div>
          <div class="result-grid">
            <div class="result-card"><div class="result-label">HEX</div><div class="result-value">${hex.toUpperCase()}</div></div>
            <div class="result-card"><div class="result-label">RGB</div><div class="result-value">rgb(${r}, ${g}, ${b})</div></div>
            <div class="result-card"><div class="result-label">HSL</div><div class="result-value">hsl(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)</div></div>
            <div class="result-card"><div class="result-label">CMYK</div><div class="result-value">cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)</div></div>
          </div>
        `;
      };
      el.querySelector('#color-pick').addEventListener('input', update);
      update();
    }
  },
];

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) :
        max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
function rgbToCmyk(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round((1 - r - k) / (1 - k) * 100),
    m: Math.round((1 - g - k) / (1 - k) * 100),
    y: Math.round((1 - b - k) / (1 - k) * 100),
    k: Math.round(k * 100),
  };
}

export function renderProgrammer(container, sub = 'base-converter') {
  const tool = TOOLS.find(t => t.id === sub) || TOOLS[0];

  container.innerHTML = `
    <div class="calc-programmer">
      <div class="prog-tabs">
        ${TOOLS.map(t => `<button class="prog-tab ${t.id === tool.id ? 'active' : ''}" data-id="${t.id}">${t.label}</button>`).join('')}
      </div>
      <div id="prog-content" class="prog-content"></div>
    </div>
  `;

  container.querySelectorAll('.prog-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = TOOLS.find(t => t.id === btn.dataset.id) || TOOLS[0];
      container.querySelectorAll('.prog-tab').forEach(b => b.classList.toggle('active', b.dataset.id === btn.dataset.id));
      t.render(container.querySelector('#prog-content'));
    });
  });

  tool.render(container.querySelector('#prog-content'));
}
