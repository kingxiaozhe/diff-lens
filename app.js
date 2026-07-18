// ClearDiff popup/page — orchestration layer: caches DOM refs, owns UI state, and
// wires the ui-* modules to the local diff engine. No network calls. Rendering, hunk
// navigation, export, history UI, and file loading live in ui-render.js / ui-nav.js /
// ui-export.js / ui-history.js / ui-file.js (split per refactors/app-js-split/RULEBOOK.md;
// modules never talk to each other — every cross-module value passes through here).
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const ta = $("text-a"), tb = $("text-b");
  const optWs = $("opt-ws"), optCase = $("opt-case"), optWrap = $("opt-wrap");
  const optBlank = $("opt-blank"), optChar = $("opt-char"), optWsShow = $("opt-ws-show");
  const optFold = $("opt-fold");
  const result = $("result"), stats = $("stats");
  const navPrev = $("nav-prev"), navNext = $("nav-next"), navCount = $("nav-count");
  const pipRail = $("pip-rail");
  let view = "unified";
  let showWs = false;
  let fold = false;
  // Which collapsed bands the user has manually expanded; keyed by stable fold key.
  // Cleared whenever the compared text changes (keys would no longer match).
  const FOLD_CONTEXT = 3;
  let expandedFolds = new Set();
  let lastA = null, lastB = null;

  const hasChrome = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

  function opts() {
    return {
      ignoreWhitespace: optWs.checked,
      ignoreCase: optCase.checked,
      ignoreBlankLines: optBlank.checked,
      charLevel: optChar.checked,
    };
  }

  // --- module wiring (RULEBOOK R1: cross-module sharing passes only through this layer) ---
  const R = window.DiffLensRender;
  const nav = window.DiffLensNav({ result, pipRail, navPrev, navNext, navCount });
  const exp = window.DiffLensExport({ ta, tb, stats, opts });
  let historyList = [];
  function persistHistory() { if (hasChrome) chrome.storage.local.set({ history: historyList }); }
  const histUI = window.DiffLensHistUI({
    ta, tb, stats,
    histList: $("hist-list"), histSave: $("hist-save"), histMenu: $("history"),
    esc: R.esc, hist: window.DiffLensHistory,
    getHistoryList: () => historyList, setHistoryList: (l) => { historyList = l; },
    persistHistory, flashBtn: exp.flashBtn, render, persist,
  });
  const fileUI = window.DiffLensFile({ ta, tb, stats, render, persist });

  // Error boundary: a pathological input must never leave the UI broken or throw
  // uncaught — show a friendly message and keep the tool usable.
  function render() {
    try {
      renderDiff();
    } catch (e) {
      result.innerHTML = '<div class="placeholder"><span class="big">Couldn’t compare this input' +
        (e && e.message ? " (" + R.esc(String(e.message)) + ")" : "") + '.</span><span>Try smaller or simpler text.</span></div>';
      stats.textContent = "Comparison error";
      nav.reset();
    }
  }
  function renderDiff() {
    const a = ta.value, b = tb.value;
    // New text invalidates any manual expand state (fold keys won't match).
    if (a !== lastA || b !== lastB) { expandedFolds.clear(); lastA = a; lastB = b; }
    if (a === "" && b === "") {
      result.innerHTML = '<div class="placeholder"><span class="big">Type or paste text in both boxes to compare.</span>' +
        '<span>Nothing you paste here is uploaded — the comparison runs in this tab.</span></div>';
      stats.textContent = "Type or paste text in both boxes to compare.";
      nav.indexHunks();
      return;
    }
    const out = window.ClearDiff.compare(a, b, opts());
    if (out.stats.identical) {
      const why = (optWs.checked || optCase.checked || optBlank.checked) ? " (with the chosen ignore options)" : "";
      result.innerHTML = '<div class="placeholder"><span class="big">✓ The two texts are identical' + why + ".</span></div>";
    } else {
      let toRender = out;
      if (fold) {
        let folded = window.ClearDiff.foldRows(out.rows, FOLD_CONTEXT);
        if (expandedFolds.size) {
          folded = folded.flatMap((it) => (it.type === "fold" && expandedFolds.has(it.key) ? it.hidden : [it]));
        }
        toRender = { rows: folded };
      }
      result.innerHTML = view === "split" ? R.renderSplit(toRender, { showWs })
        : view === "inline" ? R.renderInline(toRender, { showWs })
        : R.renderUnified(toRender, { showWs });
    }
    const minorTxt = out.stats.minor ? ' · <span class="minorc">≈' + out.stats.minor + " minor</span>" : "";
    const movedTxt = out.stats.moved ? ' · <span class="movedc">↕' + out.stats.moved + " moved</span>" : "";
    const head = out.stats.onlyMinor ? '<span class="same">No important differences</span> · ' : "";
    stats.innerHTML = head +
      '<span class="add">+' + out.stats.added + " added</span> · " +
      '<span class="del">−' + out.stats.removed + " removed</span>" + minorTxt + movedTxt +
      " · A: " + out.stats.aLines + " lines, B: " + out.stats.bLines + " lines";
    nav.indexHunks();
  }

  let t;
  const schedule = () => { clearTimeout(t); t = setTimeout(render, 120); };

  [ta, tb].forEach((el) => el.addEventListener("input", () => { schedule(); persist(); }));
  // Keep the two input panes scroll-locked so the same region of A and B lines up
  // while reading long text. A guard flag breaks the A→B→A feedback loop.
  let syncingScroll = false;
  function linkScroll(src, dst) {
    src.addEventListener("scroll", () => {
      if (syncingScroll) return;
      syncingScroll = true;
      dst.scrollTop = src.scrollTop;
      dst.scrollLeft = src.scrollLeft;
      requestAnimationFrame(() => { syncingScroll = false; });
    });
  }
  linkScroll(ta, tb);
  linkScroll(tb, ta);
  [optWs, optCase, optBlank, optChar].forEach((el) => el.addEventListener("change", () => { render(); persistOpts(); }));
  // wrap 只切 class 不重 render，但换行改变每行 offsetTop —— pip 位置必须跟着重算。
  optWrap.addEventListener("change", () => { result.classList.toggle("wrap", optWrap.checked); nav.renderPips(); persistOpts(); });
  if (optWsShow) optWsShow.addEventListener("change", () => { showWs = optWsShow.checked; render(); persistOpts(); });
  // 窗口宽度变化在 wrap 下同样改写几何。只重定位（renderPips），不重算 diff——
  // 与输入的 schedule() 防抖分开：resize 不该触发引擎重跑。
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(nav.renderPips, 120); });
  if (optFold) optFold.addEventListener("change", () => { fold = optFold.checked; render(); persistOpts(); });
  // Expand a collapsed band when its placeholder is clicked.
  result.addEventListener("click", (e) => {
    const b = e.target.closest(".foldbtn");
    if (!b) return;
    expandedFolds.add(b.dataset.fold);
    render();
  });
  $("swap").addEventListener("click", () => {
    const tmp = ta.value; ta.value = tb.value; tb.value = tmp; render(); persist();
  });
  $("copy").addEventListener("click", exp.copyResult);
  { const e = $("copy-diff"); if (e) e.addEventListener("click", exp.copyUnified); }
  { const e = $("copy-md"); if (e) e.addEventListener("click", exp.copyMarkdown); }
  { const e = $("dl-patch"); if (e) e.addEventListener("click", exp.downloadPatch); }
  { const e = $("hist-save"); if (e) e.addEventListener("click", histUI.saveCurrent); }
  { const box = $("hist-list"); if (box) box.addEventListener("click", (e) => {
      const r = e.target.closest("[data-restore]");
      const d = e.target.closest("[data-del]");
      if (!r && !d) return;
      // Stop the document outside-click handler from running: re-rendering the list
      // below detaches the clicked node, which would make its contains() check fail
      // and spuriously close the menu. (Delete keeps the menu open to remove several.)
      e.stopPropagation();
      if (r) histUI.restoreHist(r.dataset.restore);
      else histUI.delHist(d.dataset.del);
    }); }
  // Clickable stats: clicking the +added / −removed / ≈minor counts jumps to the
  // first difference so the numbers double as navigation.
  stats.addEventListener("click", (e) => {
    if (!e.target.closest(".add, .del, .minorc")) return;
    nav.jumpTo(0);
  });
  // Close any open dropdown menu on an outside click. (Clicking one summary lands
  // outside the other, so this also keeps them mutually exclusive.)
  document.addEventListener("click", (e) => {
    ["export", "history"].forEach((id) => {
      const d = $(id);
      if (d && d.open && !d.contains(e.target)) d.open = false;
    });
  });
  if (navPrev) navPrev.addEventListener("click", () => nav.jump(-1));
  if (navNext) navNext.addEventListener("click", () => nav.jump(1));
  // pip 点击跳转：委托一个监听，复用 stats 点击的既有模式（内部 hunkIdx = i-1 再 jump(1)）。
  if (pipRail) pipRail.addEventListener("click", (e) => {
    const p = e.target.closest("[data-pip]");
    if (!p) return;
    nav.jumpTo(Number(p.dataset.pip));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      let closed = false;
      ["export", "history"].forEach((id) => { const d = $(id); if (d && d.open) { d.open = false; closed = true; } });
      if (closed) return;
    }
    if (!e.altKey) return;
    if (e.key === "ArrowDown") { e.preventDefault(); nav.jump(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); nav.jump(-1); }
  });
  document.querySelectorAll("[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      view = btn.dataset.view;
      document.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("on", b === btn));
      result.classList.toggle("split", view === "split");
      render(); persistOpts();
    });
  });
  document.querySelectorAll("[data-clear]").forEach((btn) => {
    btn.addEventListener("click", () => {
      (btn.dataset.clear === "a" ? ta : tb).value = ""; render(); persist();
    });
  });

  // --- local file loading (drag-drop or "open file…") — wiring only; logic in ui-file ---
  document.querySelectorAll("[data-file]").forEach((btn) => {
    btn.addEventListener("click", () => { const inp = $("file-" + btn.dataset.file); if (inp) inp.click(); });
  });
  ["a", "b"].forEach((which) => {
    const inp = $("file-" + which);
    if (inp) inp.addEventListener("change", (e) => { fileUI.loadFile(e.target.files[0], which); inp.value = ""; });
    const el = fileUI.paneEl(which);
    el.addEventListener("dragover", (e) => { e.preventDefault(); el.classList.add("dragover"); });
    el.addEventListener("dragleave", () => el.classList.remove("dragover"));
    el.addEventListener("drop", (e) => {
      e.preventDefault(); el.classList.remove("dragover");
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) fileUI.loadFile(f, which);
    });
  });
  const fmtBtn = $("fmt-json");
  if (fmtBtn) fmtBtn.addEventListener("click", () => {
    const a = fileUI.formatPane("a"), b = fileUI.formatPane("b");
    render(); persist();
    if (!a && !b) stats.textContent = "No valid JSON to format on either side.";
    else if (!a || !b) stats.textContent = "Formatted the valid JSON side; the other isn’t valid JSON.";
  });

  // --- persistence: remember panes + options + pick up right-click captures ---
  function persist() {
    if (hasChrome) chrome.storage.local.set({ textA: ta.value, textB: tb.value });
  }
  function persistOpts() {
    if (hasChrome) chrome.storage.local.set({
      ignoreWhitespace: optWs.checked, ignoreCase: optCase.checked,
      ignoreBlankLines: optBlank.checked, charLevel: optChar.checked,
      showWhitespace: showWs, wordWrap: optWrap.checked, view: view,
      foldUnchanged: fold,
    });
  }
  function boot() {
    if (!hasChrome) { render(); histUI.renderHistList(); return; }
    chrome.storage.local.get(
      ["textA", "textB", "ignoreWhitespace", "ignoreCase", "ignoreBlankLines", "charLevel", "showWhitespace", "wordWrap", "view", "foldUnchanged", "history"],
      (s) => {
        if (typeof s.textA === "string") ta.value = s.textA;
        if (typeof s.textB === "string") tb.value = s.textB;
        if (typeof s.ignoreWhitespace === "boolean") optWs.checked = s.ignoreWhitespace;
        if (typeof s.ignoreCase === "boolean") optCase.checked = s.ignoreCase;
        if (typeof s.ignoreBlankLines === "boolean") optBlank.checked = s.ignoreBlankLines;
        if (typeof s.charLevel === "boolean") optChar.checked = s.charLevel;
        if (typeof s.showWhitespace === "boolean" && optWsShow) { optWsShow.checked = s.showWhitespace; showWs = s.showWhitespace; }
        if (typeof s.foldUnchanged === "boolean" && optFold) { optFold.checked = s.foldUnchanged; fold = s.foldUnchanged; }
        if (typeof s.wordWrap === "boolean") optWrap.checked = s.wordWrap;
        if (s.view === "split" || s.view === "unified" || s.view === "inline") view = s.view;
        result.classList.toggle("wrap", optWrap.checked);
        result.classList.toggle("split", view === "split");
        document.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("on", b.dataset.view === view));
        if (Array.isArray(s.history)) historyList = s.history;
        if (chrome.action && chrome.action.setBadgeText) chrome.action.setBadgeText({ text: "" });
        render();
        histUI.renderHistList();
      }
    );
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      let touched = false;
      if (changes.textA && ta.value !== changes.textA.newValue) { ta.value = changes.textA.newValue || ""; touched = true; }
      if (changes.textB && tb.value !== changes.textB.newValue) { tb.value = changes.textB.newValue || ""; touched = true; }
      if (touched) render();
    });
  }
  boot();
})();
