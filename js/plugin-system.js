/* ======================================================
   Ganit Calculator — Plugin System
   Sandboxed Web Worker execution for calculator plugins
   Calculator ~ by Ganit Technology | Dhurta Organisation
   ====================================================== */

import { idb } from './storage.js';

const PLUGIN_STORE = 'plugins';

// ---- Plugin registry ----
const _plugins = new Map();

export const pluginSystem = {
  // Load all persisted plugins
  async loadAll() {
    const stored = await idb.getAll(PLUGIN_STORE);
    stored.forEach(p => _plugins.set(p.id, p));
    return stored;
  },

  // Register a plugin
  async register(plugin) {
    if (!plugin.id || !plugin.name || !plugin.code) throw new Error('Plugin must have id, name, and code');
    const entry = { ...plugin, registeredAt: Date.now() };
    _plugins.set(plugin.id, entry);
    await idb.put(PLUGIN_STORE, entry);
    return entry;
  },

  // Remove a plugin
  async unregister(id) {
    _plugins.delete(id);
    await idb.delete(PLUGIN_STORE, id);
  },

  // List all
  list() { return [..._plugins.values()]; },

  // Run a plugin in a sandboxed Worker
  run(id, input) {
    const plugin = _plugins.get(id);
    if (!plugin) return Promise.reject(new Error(`Plugin not found: ${id}`));
    return sandboxRun(plugin.code, input);
  },

  // Evaluate a plugin inline (for trusted preview)
  preview(code, input) {
    return sandboxRun(code, input);
  },
};

// ---- Sandboxed Worker execution ----
function sandboxRun(code, input) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([
      `
      self.onmessage = function(e) {
        const input = e.data;
        try {
          const result = (function(input) {
            ${code}
          })(input);
          self.postMessage({ ok: true, result });
        } catch(err) {
          self.postMessage({ ok: false, error: err.message });
        }
      };
      `
    ], { type: 'application/javascript' });

    const url    = URL.createObjectURL(blob);
    const worker = new Worker(url);
    const timer  = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(url);
      reject(new Error('Plugin execution timed out (5s)'));
    }, 5000);

    worker.onmessage = (e) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      if (e.data.ok) resolve(e.data.result);
      else reject(new Error(e.data.error));
    };

    worker.onerror = (err) => {
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      reject(new Error(err.message));
    };

    worker.postMessage(input);
  });
}
