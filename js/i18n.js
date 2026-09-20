import { ls } from './storage.js';

export const LOCALES = [
  { code: 'en',    label: 'English',    rtl: false },
  { code: 'es',    label: 'Español',    rtl: false },
  { code: 'fr',    label: 'Français',   rtl: false },
  { code: 'de',    label: 'Deutsch',    rtl: false },
  { code: 'it',    label: 'Italiano',   rtl: false },
  { code: 'pt',    label: 'Português',  rtl: false },
  { code: 'ru',    label: 'Русский',    rtl: false },
  { code: 'zh-CN', label: '中文(简体)',  rtl: false },
  { code: 'zh-TW', label: '中文(繁體)',  rtl: false },
  { code: 'ja',    label: '日本語',      rtl: false },
  { code: 'ko',    label: '한국어',      rtl: false },
  { code: 'ar',    label: 'العربية',    rtl: true  },
  { code: 'he',    label: 'עברית',      rtl: true  },
  { code: 'hi',    label: 'हिंदी',       rtl: false },
  { code: 'bn',    label: 'বাংলা',       rtl: false },
  { code: 'ur',    label: 'اردو',       rtl: true  },
  { code: 'tr',    label: 'Türkçe',     rtl: false },
  { code: 'pl',    label: 'Polski',     rtl: false },
  { code: 'nl',    label: 'Nederlands', rtl: false },
  { code: 'vi',    label: 'Tiếng Việt', rtl: false },
  { code: 'th',    label: 'ภาษาไทย',   rtl: false },
  { code: 'id',    label: 'Bahasa Indonesia', rtl: false },
  { code: 'ms',    label: 'Bahasa Melayu',    rtl: false },
  { code: 'fa',    label: 'فارسی',      rtl: true  },
];

class I18n {
  constructor() {
    this._locale = ls.get('locale', null) || this._detectLocale();
    this._strings = {};
    this._loaded = new Set();
  }

  _detectLocale() {
    const nav = navigator.language || navigator.userLanguage || 'en';
    const code = nav.replace('-', '-');
    const match = LOCALES.find(l => l.code === code) || LOCALES.find(l => l.code === nav.split('-')[0]);
    return match?.code || 'en';
  }

  get locale() { return this._locale; }
  get isRTL() { return LOCALES.find(l => l.code === this._locale)?.rtl || false; }

  async setLocale(code) {
    this._locale = code;
    ls.set('locale', code);
    await this.load(code);
    document.documentElement.lang = code;
    document.documentElement.dir = this.isRTL ? 'rtl' : 'ltr';
    document.dispatchEvent(new CustomEvent('ganit:locale-changed', { detail: { locale: code } }));
  }

  async load(code = this._locale) {
    if (this._loaded.has(code)) return;
    try {
      const resp = await fetch(`/locales/${code}.json`);
      if (!resp.ok) throw new Error('not found');
      const data = await resp.json();
      this._strings[code] = data;
      this._loaded.add(code);
    } catch {
      if (code !== 'en' && !this._loaded.has('en')) {
        try {
          const resp = await fetch('/locales/en.json');
          const data = await resp.json();
          this._strings['en'] = data;
          this._loaded.add('en');
        } catch {}
      }
    }
  }

  t(key, vars = {}) {
    const strings = this._strings[this._locale] || this._strings['en'] || {};
    let str = key.split('.').reduce((obj, k) => obj?.[k], strings) || key;
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return str;
  }

  formatNumber(value, options = {}) {
    try {
      return new Intl.NumberFormat(this._locale, options).format(value);
    } catch {
      return String(value);
    }
  }

  formatDate(date, options = {}) {
    try {
      return new Intl.DateTimeFormat(this._locale, options).format(date);
    } catch {
      return String(date);
    }
  }
}

export const i18n = new I18n();
export const t = (...args) => i18n.t(...args);
