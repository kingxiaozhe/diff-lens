// DiffLens comparison history — pure, dependency-free helpers (no DOM, no chrome).
// The UI (app.js) owns storage + id/timestamp creation; this module owns the list
// shape so it can be unit-tested in Node. Attaches to window/globalThis like diff.js.

(function (root) {
  "use strict";

  const MAX_ENTRIES = 12;
  // Skip saving very large inputs — chrome.storage.local has a ~10MB quota and a
  // dozen multi-MB snapshots would blow it. (utf-16: ~2 bytes/char.)
  const MAX_ENTRY_BYTES = 500 * 1024;

  function firstLine(s) {
    const lines = (s || "").split(/\r\n|\r|\n/);
    const t = lines.find((x) => x.trim() !== "");
    if (!t) return "(empty)";
    return t.length > 40 ? t.slice(0, 40) + "…" : t;
  }

  // A short human label for a snapshot: "first line of A → first line of B".
  function preview(a, b) {
    return firstLine(a) + " → " + firstLine(b);
  }

  // Rough utf-16 byte size of the pair; used to decide whether it's safe to store.
  function tooLarge(a, b) {
    return (((a ? a.length : 0) + (b ? b.length : 0)) * 2) > MAX_ENTRY_BYTES;
  }

  // Insert a snapshot at the front, dropping any exact duplicate (same A & B) and
  // capping the list length. Returns a NEW array (never mutates the input).
  function add(list, entry) {
    const next = (Array.isArray(list) ? list : []).filter(
      (e) => !(e.a === entry.a && e.b === entry.b)
    );
    next.unshift(entry);
    return next.length > MAX_ENTRIES ? next.slice(0, MAX_ENTRIES) : next;
  }

  function remove(list, id) {
    return (Array.isArray(list) ? list : []).filter((e) => e.id !== id);
  }

  root.DiffLensHistory = { preview, tooLarge, add, remove, MAX_ENTRIES, MAX_ENTRY_BYTES };
})(typeof window !== "undefined" ? window : globalThis);
