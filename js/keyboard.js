/* ======================================================
   Ganit Calculator — Global Keyboard Shortcuts Registry
   Calculator ~ by Ganit Technology | Dhurta Organisation
   ====================================================== */

const _shortcuts = new Map();

function getKey(e) {
  const mods = [];
  if (e.ctrlKey  || e.metaKey)  mods.push('ctrl');
  if (e.shiftKey) mods.push('shift');
  if (e.altKey)   mods.push('alt');
  mods.push(e.key.toLowerCase());
  return mods.join('+');
}

export const keyboard = {
  register(keys, handler, description = '') {
    const key = Array.isArray(keys) ? keys : [keys];
    key.forEach(k => _shortcuts.set(k.toLowerCase(), { handler, description }));
    return () => key.forEach(k => _shortcuts.delete(k.toLowerCase()));
  },

  unregister(keys) {
    const key = Array.isArray(keys) ? keys : [keys];
    key.forEach(k => _shortcuts.delete(k.toLowerCase()));
  },

  list() {
    return [..._shortcuts.entries()].map(([k, v]) => ({ key: k, description: v.description }));
  },

  _dispatch(e) {
    const activeTag = document.activeElement?.tagName?.toLowerCase();
    const inInput   = ['input', 'textarea', 'select'].includes(activeTag) ||
                      document.activeElement?.contentEditable === 'true';

    const key = getKey(e);
    const shortcut = _shortcuts.get(key);
    if (shortcut) {
      if (inInput && !key.startsWith('ctrl') && !key.startsWith('meta')) return;
      shortcut.handler(e);
    }
  },

  init() {
    document.addEventListener('keydown', (e) => keyboard._dispatch(e));
    // Default global shortcuts
    keyboard.register(['ctrl+k', 'meta+k'], (e) => {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('ganit:command-palette', { detail: { open: true } }));
    }, 'Open command palette');

    keyboard.register(['ctrl+h', 'meta+h'], (e) => {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('ganit:toggle-history'));
    }, 'Toggle history panel');

    keyboard.register(['ctrl+/', 'meta+/'], (e) => {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('ganit:toggle-sidebar'));
    }, 'Toggle sidebar');

    keyboard.register(['escape'], () => {
      document.dispatchEvent(new CustomEvent('ganit:close-overlays'));
    }, 'Close overlays');
  },
};

keyboard.init();
