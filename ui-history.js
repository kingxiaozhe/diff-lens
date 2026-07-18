// DiffLens history UI — saved-comparisons list rendering + save/restore/delete actions.
// No network, no dependencies, and no chrome.* (storage writes stay in app.js, R3);
// list state (historyList) lives in app.js and is reached only through ctx accessors.
(function (root) {
  "use strict";

  // ctx contract (everything is injected by app.js — modules never reference each
  // other directly, R1):
  //   ta, tb                          — the two input <textarea>s
  //   stats                           — status-bar element for user-facing messages
  //   histList                        — #hist-list container the list renders into
  //   histSave                        — #hist-save button (flash target after saving)
  //   histMenu                        — #history <details> dropdown (closed on restore)
  //   esc                             — HTML escaper, forwarded from DiffLensRender
  //   hist                            — pure list helpers, forwarded from
  //                                     DiffLensHistory (preview/tooLarge/add/remove)
  //   getHistoryList, setHistoryList  — historyList stays owned by app.js (§1)
  //   persistHistory                  — chrome.storage write, kept in app.js (R3)
  //   flashBtn                        — button feedback helper, forwarded from ui-export
  //   render, persist                 — orchestration entry points (restore re-renders)
  function init(ctx) {
    const ta = ctx.ta, tb = ctx.tb, stats = ctx.stats;
    const histList = ctx.histList, histSave = ctx.histSave, histMenu = ctx.histMenu;
    const esc = ctx.esc, H = ctx.hist;

    function relTime(ts) {
      const s = Math.max(0, (Date.now() - ts) / 1000);
      if (s < 60) return "just now";
      const m = Math.floor(s / 60); if (m < 60) return m + "m ago";
      const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
      return Math.floor(h / 24) + "d ago";
    }
    function renderHistList() {
      const box = histList;
      if (!box) return;
      const list = ctx.getHistoryList();
      if (!list.length) { box.innerHTML = '<div class="hist-empty">No saved comparisons yet.</div>'; return; }
      box.innerHTML = list.map((e) =>
        '<div class="hist-item">' +
          '<button class="hist-restore" type="button" data-restore="' + esc(e.id) + '" title="Restore this comparison">' +
            '<span class="hist-prev">' + esc(e.preview) + "</span>" +
            '<span class="hist-time">' + esc(relTime(e.ts)) + "</span>" +
          "</button>" +
          '<button class="hist-del" type="button" data-del="' + esc(e.id) + '" title="Delete" aria-label="Delete saved comparison">✕</button>' +
        "</div>"
      ).join("");
    }
    function saveCurrent() {
      const a = ta.value, b = tb.value;
      if (a === "" && b === "") { stats.textContent = "Nothing to save yet — paste or type some text first."; return; }
      if (H.tooLarge(a, b)) { stats.textContent = "This comparison is too large to save to history."; return; }
      const entry = { id: String(Date.now()) + "-" + Math.floor(Math.random() * 1e6), ts: Date.now(), a: a, b: b, preview: H.preview(a, b) };
      ctx.setHistoryList(H.add(ctx.getHistoryList(), entry));
      ctx.persistHistory(); renderHistList();
      ctx.flashBtn(histSave, "Saved ✓");
    }
    function restoreHist(id) {
      const e = ctx.getHistoryList().find((x) => x.id === id);
      if (!e) return;
      ta.value = e.a; tb.value = e.b; ctx.render(); ctx.persist();
      if (histMenu) histMenu.open = false;
    }
    function delHist(id) {
      ctx.setHistoryList(H.remove(ctx.getHistoryList(), id));
      ctx.persistHistory(); renderHistList();
    }

    // Export face = actual consumption face: app.js binds these four (R6). relTime
    // is only consumed by renderHistList, so it stays private.
    return { renderHistList: renderHistList, saveCurrent: saveCurrent, restoreHist: restoreHist, delHist: delHist };
  }

  // R1 (v2): factory form for stateful/DOM-holding UI modules. Deliberately NOT
  // DiffLensHistory — that global is already taken by the pure helpers in history.js.
  root.DiffLensHistUI = init;
})(typeof window !== "undefined" ? window : globalThis);
// REFACTOR STATUS: confidence=high todos=0
