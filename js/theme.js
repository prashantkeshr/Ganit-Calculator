import { ls } from './storage.js';

export const THEMES = [
  { id: 'dark',       label: 'Dark',        icon: '🌙' },
  { id: 'light',      label: 'Light',       icon: '☀️' },
  { id: 'auto',       label: 'Auto',        icon: '⚙️' },
  { id: 'ganit',      label: 'Ganit',       icon: '🟣' },
  { id: 'neon',       label: 'Neon',        icon: '💜' },
  { id: 'retro',      label: 'Retro',       icon: '🟠' },
  { id: 'solarized',  label: 'Solarized',   icon: '🟡' },
  { id: 'dracula',    label: 'Dracula',     icon: '🧛' },
  { id: 'nord',       label: 'Nord',        icon: '❄️' },
  { id: 'catppuccin', label: 'Catppuccin',  icon: '🐱' },
  { id: 'gruvbox',    label: 'Gruvbox',     icon: '🟤' },
  { id: 'tokyo',      label: 'Tokyo Night', icon: '🌃' },
  { id: 'rose-pine',  label: 'Rosé Pine',   icon: '🌸' },
  { id: 'monokai',    label: 'Monokai',     icon: '🎨' },
  { id: 'one-dark',   label: 'One Dark',    icon: '🔵' },
];

class ThemeManager {
  constructor() {
    this._current = ls.get('theme', 'dark');
    this._mq = window.matchMedia?.('(prefers-color-scheme: dark)');
  }

  get current() { return this._current; }

  apply(themeId = this._current) {
    let resolved = themeId;
    if (themeId === 'auto') {
      resolved = this._mq?.matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolved);
    this._current = themeId;
    ls.set('theme', themeId);

    if (themeId === 'auto' && this._mq) {
      this._mq.onchange = () => this.apply('auto');
    } else if (this._mq) {
      this._mq.onchange = null;
    }
  }

  cycle() {
    const idx = THEMES.findIndex(t => t.id === this._current);
    const next = THEMES[(idx + 1) % THEMES.length];
    this.apply(next.id);
    return next;
  }

  list() { return THEMES; }
}

export const themeManager = new ThemeManager();
