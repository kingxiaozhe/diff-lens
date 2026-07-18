// DiffLens file-loading + JSON-format module — 100% local (FileReader / native JSON), no network.
// RULEBOOK §1/R1: 无状态；面板(ta/tb)/状态栏(stats)引用与 render/persist 回调全部经 init(ctx)
// 注入，模块自身零 DOM 查询、零 chrome.*（R3）——事件绑定仍归 app.js（R6）。
(function (root) {
  "use strict";

  // --- local file loading (drag-drop or "open file…") — 100% local via FileReader ---
  const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB: beyond this, load + render would lag

  function init(ctx) {
    const paneEl = (which) => (which === "a" ? ctx.ta : ctx.tb);
    function loadFile(file, which) {
      if (!file) return;
      if (file.size > MAX_FILE_BYTES) {
        ctx.stats.textContent = "That file is too large (" + (file.size / 1048576).toFixed(1) +
          " MB). DiffLens handles up to " + (MAX_FILE_BYTES / 1048576) + " MB locally.";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => { paneEl(which).value = String(reader.result || ""); ctx.render(); ctx.persist(); };
      reader.onerror = () => { ctx.stats.textContent = "Couldn’t read that file."; };
      reader.readAsText(file);
    }

    // --- "Format JSON": structural compare via parse → sort keys → pretty-print ---
    // Sorting keys makes key-order differences vanish; pretty-printing makes whitespace/
    // minification differences vanish — so two structurally-equal JSONs become identical.
    // NOTE: uses native JSON, so integers beyond 2^53 may be reformatted with precision
    // loss (both sides equally). Big-int-faithful mode is a future option (cf. JSON Keeper).
    function sortKeys(v) {
      if (Array.isArray(v)) return v.map(sortKeys);
      if (v && typeof v === "object") {
        const out = {};
        for (const k of Object.keys(v).sort()) out[k] = sortKeys(v[k]);
        return out;
      }
      return v;
    }
    function formatPane(which) {
      const el = paneEl(which);
      const raw = el.value.trim();
      if (!raw) return false;
      try { el.value = JSON.stringify(sortKeys(JSON.parse(raw)), null, 2); return true; }
      catch { return false; }
    }

    // 导出面=实际消费面（§1 v2 原则外推）：app.js 只消费 loadFile/paneEl/formatPane，
    // sortKeys 仅被 formatPane 内部调用，保持私有。
    return { loadFile, paneEl, formatPane };
  }

  root.DiffLensFile = init;
})(typeof window !== "undefined" ? window : globalThis);
// REFACTOR STATUS: confidence=high todos=0
