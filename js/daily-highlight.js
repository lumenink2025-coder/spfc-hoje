/* Shared by the Home and the daily sender. No network calls or credentials. */
(() => {
  'use strict';
  const priority = { fundacao: 0, mundial: 1, titulo: 2, recorde: 3, vitoria: 4, aniversario: 5, estreia: 6, despedida: 7 };
  function localDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function validDateKey(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  }
  function selectHighlights(events, dateKey, limit = 3) {
    if (!validDateKey(dateKey)) throw new Error('Data inválida');
    const [, month, day] = dateKey.split('-').map(Number);
    return events.filter(e => e && typeof e.n === 'string' && e.n.trim() && e.id != null &&
      ((Number(e.mes) === month && Number(e.dia) === day) || e.destaqueData === dateKey))
      .sort((a, b) => Number(b.destaqueData === dateKey) - Number(a.destaqueData === dateKey) ||
        (priority[a.t] ?? 9) - (priority[b.t] ?? 9) || (Number(b.y) || 0) - (Number(a.y) || 0) ||
        (String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0))
      .slice(0, limit);
  }
  function memoryId(hash) {
    if (!String(hash).startsWith('#memoria=')) return null;
    try { return decodeURIComponent(hash.slice(9)) || null; } catch { return null; }
  }
  globalThis.SPFCDaily = Object.freeze({ localDateKey, validDateKey, selectHighlights, memoryId });
})();
