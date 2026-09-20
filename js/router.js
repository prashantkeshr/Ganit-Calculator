class Router {
  constructor() {
    this._routes = new Map();
    this._current = null;
    this._listeners = [];
    window.addEventListener('hashchange', () => this._dispatch());
    window.addEventListener('popstate', () => this._dispatch());
  }

  on(pattern, handler) {
    this._routes.set(pattern, handler);
    return this;
  }

  go(path) {
    window.location.hash = path.startsWith('#') ? path : '#' + path;
  }

  get current() { return this._current; }

  onChange(fn) { this._listeners.push(fn); }

  _dispatch() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, query] = hash.split('?');
    const params = Object.fromEntries(new URLSearchParams(query || ''));

    for (const [pattern, handler] of this._routes) {
      const match = this._match(pattern, path);
      if (match) {
        this._current = { path, params: { ...match, ...params }, pattern };
        handler(this._current);
        this._listeners.forEach(fn => fn(this._current));
        return;
      }
    }
    // 404 — redirect to home
    this.go('/');
  }

  _match(pattern, path) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    if (patternParts.length !== pathParts.length && !pattern.endsWith('*')) return null;
    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] === '*') return params;
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i] || '');
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }

  start() { this._dispatch(); }
}

export const router = new Router();
