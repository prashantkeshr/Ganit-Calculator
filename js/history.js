import { idb } from './storage.js';

export class History {
  constructor() {
    this._listeners = [];
  }

  async add(entry) {
    const record = {
      ...entry,
      timestamp: Date.now(),
    };
    const id = await idb.add('history', record);
    record.id = id;
    this._emit('add', record);
    return id;
  }

  async getAll({ limit = 200, category = null } = {}) {
    let items = await idb.getAll('history');
    if (category) items = items.filter(i => i.category === category);
    items.sort((a, b) => b.timestamp - a.timestamp);
    return items.slice(0, limit);
  }

  async delete(id) {
    await idb.delete('history', id);
    this._emit('delete', id);
  }

  async clear(category = null) {
    if (!category) {
      await idb.clear('history');
      this._emit('clear', null);
    } else {
      const items = await this.getAll({ category });
      for (const item of items) await idb.delete('history', item.id);
      this._emit('clear', category);
    }
  }

  on(event, fn) { this._listeners.push({ event, fn }); }
  off(event, fn) { this._listeners = this._listeners.filter(l => !(l.event === event && l.fn === fn)); }

  _emit(event, data) {
    this._listeners.filter(l => l.event === event || l.event === '*').forEach(l => l.fn(data));
  }
}

export const history = new History();
