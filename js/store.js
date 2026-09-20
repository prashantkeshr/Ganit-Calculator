import { ls } from './storage.js';

class Store {
  constructor(defaults = {}) {
    this._state = { ...defaults };
    this._listeners = {};
  }

  get(key) { return this._state[key]; }

  set(key, value) {
    const prev = this._state[key];
    this._state[key] = value;
    if (prev !== value) this._emit(key, value, prev);
  }

  update(updates) {
    for (const [k, v] of Object.entries(updates)) this.set(k, v);
  }

  on(key, fn) {
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key].push(fn);
    return () => this.off(key, fn);
  }

  off(key, fn) {
    if (!this._listeners[key]) return;
    this._listeners[key] = this._listeners[key].filter(f => f !== fn);
  }

  _emit(key, value, prev) {
    (this._listeners[key] || []).forEach(fn => fn(value, prev));
    (this._listeners['*'] || []).forEach(fn => fn(key, value, prev));
  }
}

export const store = new Store({
  theme:          ls.get('theme', 'dark'),
  locale:         ls.get('locale', 'en'),
  notation:       ls.get('notation', 'auto'),
  precision:      ls.get('precision', 10),
  angleMode:      ls.get('angleMode', 'DEG'),
  historySidebarOpen: false,
  currentTool:    'basic',
  memory:         0,
  memoryStack:    [],
});

// Persist some keys
['theme', 'locale', 'notation', 'precision', 'angleMode'].forEach(key => {
  store.on(key, (val) => ls.set(key, val));
});
