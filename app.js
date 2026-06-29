// ClearDiff popup/page — wires UI to the local diff engine. No network calls.
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const ta = $("text-a"), tb = $("text-b");
  const optWs = $("opt-ws"), optCase = $("opt-case"), optWrap = $("opt-wrap");
  const optBlank = $("opt-blank"), optChar = $("opt-char"), optWsShow = $("opt-ws-show");
  const optFold = $("opt-fold");
  const result = $("result"), stats = $("stats");
  const navPrev = $("nav-prev"), navNext = $("nav-next"), navCount = $("nav-count");
  let view = "unified";
  let showWs = false;
  let fold = false;
  let hunks = [], hunkIdx = -1;
  // Which collapsed bands the user has manually expanded; keyed by stable fold key.
  // Cleared whenever the compared text changes (keys would no longer match).
  const FOLD_CONTEXT = 3;
  let expandedFolds = new Set();
  let lastA = null, lastB = null;

  const hasChrome = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  // Escape + (optionally) reveal whitespace as faint glyphs — BC-style.
  function fmt(s) {
    let h = esc(s);
    if (showWs) {
      h = h.replace(/\t/g, '<span class="ws">→</span>').replace(/ /g, '<span class="ws">·</span>');
    }
    return h;
  }
  function renderWords(words) {
    return words.map((w) => {
      const t = fmt(w.text);
      if (w.type === "del") return "<del>" + t + "</del>";
      if (w.type === "add") return "<ins>" + t + "</ins>";
      return t;
    }).join("");
  }
  // Inline badge marking a moved line and where its partner lives.
  function moveTag(dir, n) {
    return ' <span class="movetag" title="This line was moved, not added or removed">↕ moved ' + dir + " line " + n + "</span>";
  }
  function opts() {
    return {
      ignoreWhitespace: optWs.checked,
      ignoreCase: optCase.checked,
      ignoreBlankLines: optBlank.checked,
      charLevel: optChar.checked,
    };
  }

  function numCell(a, b) {
    return '<div class="num"><span>' + (a == null ? "" : a) + '</span> <span>' + (b == null ? "" : b) + "</span></div>";
  }
  function urow(cls, sign, aNum, bNum, inner) {
    return '<div class="row ' + cls + '">' + numCell(aNum, bNum) + '<div class="sign">' + sign + '</div><div class="txt">' + inner + "</div></div>";
  }
  // Single-column rows shared by Unified and Inline — the ONLY difference is how a
  // CHANGE renders: Unified shows two rows (− old / + new); Inline shows one row with
  // the original text and the edits marked in place (strike-through + insert).
  // A collapsed band of unchanged lines — full-width, click to expand.
  function foldRowHtml(r) {
    return '<div class="row fold"><button class="foldbtn" type="button" data-fold="' + esc(r.key) +
      '" title="Show the hidden lines">⋯ ' + r.count + " unchanged lines · expand ⋯</button></div>";
  }
  function renderColumn(out, inlineChange) {
    const html = []; let prevImp = false;
    for (const r of out.rows) {
      if (r.type === "fold") { html.push(foldRowHtml(r)); prevImp = false; continue; }
      const imp = r.type === "del" || r.type === "add" || r.type === "change";
      const hs = imp && !prevImp ? " hstart" : "";
      if (r.type === "equal") html.push(urow("equal", "", r.aNum, r.bNum, fmt(r.text)));
      else if (r.type === "minor") html.push(urow("minor", "≈", r.aNum, r.bNum, renderWords(inlineChange ? r.words : r.bWords)));
      else if (r.type === "del") html.push(urow("del" + hs + (r.moved ? " moved" : ""), "−", r.aNum, null, fmt(r.text) + (r.moved ? moveTag("to", r.movePartnerNum) : "")));
      else if (r.type === "add") html.push(urow("add" + hs + (r.moved ? " moved" : ""), "+", null, r.bNum, fmt(r.text) + (r.moved ? moveTag("from", r.movePartnerNum) : "")));
      else if (r.type === "change") {
        if (inlineChange) {
          html.push(urow("change" + hs, "~", r.aNum, r.bNum, renderWords(r.words)));
        } else {
          html.push(urow("change" + hs, "−", r.aNum, null, renderWords(r.aWords)));
          html.push(urow("change", "+", null, r.bNum, renderWords(r.bWords)));
        }
      }
      prevImp = imp;
    }
    return html.join("");
  }
  function renderUnified(out) { return renderColumn(out, false); }
  function renderInline(out) { return renderColumn(out, true); }
  function scol(cls, num, inner) {
    return '<div class="scol ' + cls + '"><div class="snum">' + (num == null ? "" : num) + '</div><div class="stxt">' + inner + "</div></div>";
  }
  function renderSplit(out) {
    const html = []; let prevImp = false;
    for (const r of out.rows) {
      if (r.type === "fold") { html.push(foldRowHtml(r)); prevImp = false; continue; }
      const imp = r.type === "del" || r.type === "add" || r.type === "change";
      const hs = imp && !prevImp ? " hstart" : "";
      let left, right;
      if (r.type === "equal") {
        left = scol("equal", r.aNum, fmt(r.text)); right = scol("equal", r.bNum, fmt(r.text));
      } else if (r.type === "minor") {
        left = scol("minor", r.aNum, renderWords(r.aWords)); right = scol("minor", r.bNum, renderWords(r.bWords));
      } else if (r.type === "del") {
        left = scol("del" + (r.moved ? " moved" : ""), r.aNum, fmt(r.text) + (r.moved ? moveTag("to", r.movePartnerNum) : "")); right = scol("blank", null, "");
      } else if (r.type === "add") {
        left = scol("blank", null, ""); right = scol("add" + (r.moved ? " moved" : ""), r.bNum, fmt(r.text) + (r.moved ? moveTag("from", r.movePartnerNum) : ""));
      } else { // change
        left = scol("chg", r.aNum, renderWords(r.aWords)); right = scol("chg", r.bNum, renderWords(r.bWords));
      }
      html.push('<div class="srow' + hs + '">' + left + right + "</div>");
      prevImp = imp;
    }
    return html.join("");
  }

  // Error boundary: a pathological input must never leave the UI broken or throw
  // uncaught — show a friendly message and keep the tool usable.
  function render() {
    try {
      renderDiff();
    } catch (e) {
      result.innerHTML = '<div class="empty">Couldn’t compare this input' +
        (e && e.message ? " (" + esc(String(e.message)) + ")" : "") + ". Try smaller or simpler text.</div>";
      stats.textContent = "Comparison error";
      hunks = []; hunkIdx = -1; updateNav();
    }
  }
  function renderDiff() {
    const a = ta.value, b = tb.value;
    // New text invalidates any manual expand state (fold keys won't match).
    if (a !== lastA || b !== lastB) { expandedFolds.clear(); lastA = a; lastB = b; }
    if (a === "" && b === "") {
      result.innerHTML = '<div class="empty">Type or paste text in both boxes to compare.</div>';
      stats.textContent = "Type or paste text in both boxes to compare.";
      indexHunks();
      return;
    }
    const out = window.ClearDiff.compare(a, b, opts());
    if (out.stats.identical) {
      const why = (optWs.checked || optCase.checked || optBlank.checked) ? " (with the chosen ignore options)" : "";
      result.innerHTML = '<div class="empty">✓ The two texts are identical' + why + ".</div>";
    } else {
      let toRender = out;
      if (fold) {
        let folded = window.ClearDiff.foldRows(out.rows, FOLD_CONTEXT);
        if (expandedFolds.size) {
          folded = folded.flatMap((it) => (it.type === "fold" && expandedFolds.has(it.key) ? it.hidden : [it]));
        }
        toRender = { rows: folded };
      }
      result.innerHTML = view === "split" ? renderSplit(toRender) : view === "inline" ? renderInline(toRender) : renderUnified(toRender);
    }
    const minorTxt = out.stats.minor ? ' · <span class="minorc">≈' + out.stats.minor + " minor</span>" : "";
    const movedTxt = out.stats.moved ? ' · <span class="movedc">↕' + out.stats.moved + " moved</span>" : "";
    const head = out.stats.onlyMinor ? '<span class="same">No important differences</span> · ' : "";
    stats.innerHTML = head +
      '<span class="add">+' + out.stats.added + " added</span> · " +
      '<span class="del">−' + out.stats.removed + " removed</span>" + minorTxt + movedTxt +
      " · A: " + out.stats.aLines + " lines, B: " + out.stats.bLines + " lines";
    indexHunks();
  }

  // --- difference navigation (BC-style next/prev) ---
  function indexHunks() {
    hunks = [].slice.call(result.querySelectorAll(".hstart"));
    hunkIdx = -1;
    updateNav();
  }
  function updateNav() {
    if (!navPrev) return;
    const n = hunks.length;
    navPrev.disabled = n === 0; navNext.disabled = n === 0;
    navCount.textContent = n === 0 ? "—" : (hunkIdx < 0 ? (n + (n === 1 ? " diff" : " diffs")) : (hunkIdx + 1) + " / " + n);
  }
  function jump(dir) {
    if (!hunks.length) return;
    if (hunkIdx < 0) hunkIdx = dir > 0 ? 0 : hunks.length - 1;
    else hunkIdx = (hunkIdx + dir + hunks.length) % hunks.length;
    hunks.forEach((h) => h.classList.remove("jumped"));
    const el = hunks[hunkIdx];
    el.classList.add("jumped");
    el.scrollIntoView({ block: "center" });
    updateNav();
  }

  // Plain-text diff (the legacy "Copy result" format).
  function plainDiffText() {
    const out = window.ClearDiff.compare(ta.value, tb.value, opts());
    return out.rows.map((r) => {
      if (r.type === "equal") return "  " + r.text;
      if (r.type === "minor") return "~ " + r.bText;
      if (r.type === "del") return "- " + r.text;
      if (r.type === "add") return "+ " + r.text;
      if (r.type === "change") return "- " + r.aWords.map((w) => w.text).join("") + "\n+ " + r.bWords.map((w) => w.text).join("");
      return "";
    }).join("\n");
  }

  function flashBtn(btn, label) {
    if (!btn) return;
    const old = btn.textContent;
    btn.textContent = label; setTimeout(() => (btn.textContent = old), 1200);
  }
  function closeExport() { const d = $("export"); if (d) d.open = false; }

  function copyText(text, btn, okLabel) {
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => flashBtn(btn, okLabel || "Copied ✓"))
      .catch(() => flashBtn(btn, "Copy failed"));
  }
  function copyResult() {
    if (ta.value === "" && tb.value === "") return;
    copyText(plainDiffText(), $("copy"));
    closeExport();
  }
  function copyUnified() {
    const ud = window.ClearDiff.toUnifiedDiff(ta.value, tb.value, opts());
    if (!ud) { stats.textContent = "Nothing to export — the two texts are identical."; closeExport(); return; }
    copyText(ud, $("copy-diff")); closeExport();
  }
  function copyMarkdown() {
    const md = window.ClearDiff.toMarkdown(ta.value, tb.value, opts());
    if (!md) { stats.textContent = "Nothing to export — the two texts are identical."; closeExport(); return; }
    copyText(md, $("copy-md")); closeExport();
  }
  // Download the unified diff as a .patch file — a local Blob, no network.
  function downloadPatch() {
    const ud = window.ClearDiff.toUnifiedDiff(ta.value, tb.value, opts());
    if (!ud) { stats.textContent = "Nothing to export — the two texts are identical."; closeExport(); return; }
    const blob = new Blob([ud], { type: "text/x-patch" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "difflens.patch";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    flashBtn($("dl-patch"), "Saved ✓"); closeExport();
  }

  // --- comparison history (saved snapshots, local only) ------------------------
  const H = window.DiffLensHistory;
  let historyList = [];
  function persistHistory() { if (hasChrome) chrome.storage.local.set({ history: historyList }); }
  function relTime(ts) {
    const s = Math.max(0, (Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    const m = Math.floor(s / 60); if (m < 60) return m + "m ago";
    const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
    return Math.floor(h / 24) + "d ago";
  }
  function renderHistList() {
    const box = $("hist-list");
    if (!box) return;
    if (!historyList.length) { box.innerHTML = '<div class="hist-empty">No saved comparisons yet.</div>'; return; }
    box.innerHTML = historyList.map((e) =>
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
    historyList = H.add(historyList, entry);
    persistHistory(); renderHistList();
    flashBtn($("hist-save"), "Saved ✓");
  }
  function restoreHist(id) {
    const e = historyList.find((x) => x.id === id);
    if (!e) return;
    ta.value = e.a; tb.value = e.b; render(); persist();
    const d = $("history"); if (d) d.open = false;
  }
  function delHist(id) { historyList = H.remove(historyList, id); persistHistory(); renderHistList(); }

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
  optWrap.addEventListener("change", () => { result.classList.toggle("wrap", optWrap.checked); persistOpts(); });
  if (optWsShow) optWsShow.addEventListener("change", () => { showWs = optWsShow.checked; render(); persistOpts(); });
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
  $("copy").addEventListener("click", copyResult);
  { const e = $("copy-diff"); if (e) e.addEventListener("click", copyUnified); }
  { const e = $("copy-md"); if (e) e.addEventListener("click", copyMarkdown); }
  { const e = $("dl-patch"); if (e) e.addEventListener("click", downloadPatch); }
  { const e = $("hist-save"); if (e) e.addEventListener("click", saveCurrent); }
  { const box = $("hist-list"); if (box) box.addEventListener("click", (e) => {
      const r = e.target.closest("[data-restore]");
      const d = e.target.closest("[data-del]");
      if (!r && !d) return;
      // Stop the document outside-click handler from running: re-rendering the list
      // below detaches the clicked node, which would make its contains() check fail
      // and spuriously close the menu. (Delete keeps the menu open to remove several.)
      e.stopPropagation();
      if (r) restoreHist(r.dataset.restore);
      else delHist(d.dataset.del);
    }); }
  // Clickable stats: clicking the +added / −removed / ≈minor counts jumps to the
  // first difference so the numbers double as navigation.
  stats.addEventListener("click", (e) => {
    if (!e.target.closest(".add, .del, .minorc")) return;
    if (!hunks.length) return;
    hunkIdx = -1; jump(1);
  });
  // Close any open dropdown menu on an outside click. (Clicking one summary lands
  // outside the other, so this also keeps them mutually exclusive.)
  document.addEventListener("click", (e) => {
    ["export", "history"].forEach((id) => {
      const d = $(id);
      if (d && d.open && !d.contains(e.target)) d.open = false;
    });
  });
  if (navPrev) navPrev.addEventListener("click", () => jump(-1));
  if (navNext) navNext.addEventListener("click", () => jump(1));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      let closed = false;
      ["export", "history"].forEach((id) => { const d = $(id); if (d && d.open) { d.open = false; closed = true; } });
      if (closed) return;
    }
    if (!e.altKey) return;
    if (e.key === "ArrowDown") { e.preventDefault(); jump(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); jump(-1); }
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

  // --- local file loading (drag-drop or "open file…") — 100% local via FileReader ---
  const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB: beyond this, load + render would lag
  const paneEl = (which) => (which === "a" ? ta : tb);
  function loadFile(file, which) {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      stats.textContent = "That file is too large (" + (file.size / 1048576).toFixed(1) +
        " MB). ClearDiff handles up to " + (MAX_FILE_BYTES / 1048576) + " MB locally.";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { paneEl(which).value = String(reader.result || ""); render(); persist(); };
    reader.onerror = () => { stats.textContent = "Couldn’t read that file."; };
    reader.readAsText(file);
  }
  document.querySelectorAll("[data-file]").forEach((btn) => {
    btn.addEventListener("click", () => { const inp = $("file-" + btn.dataset.file); if (inp) inp.click(); });
  });
  ["a", "b"].forEach((which) => {
    const inp = $("file-" + which);
    if (inp) inp.addEventListener("change", (e) => { loadFile(e.target.files[0], which); inp.value = ""; });
    const el = paneEl(which);
    el.addEventListener("dragover", (e) => { e.preventDefault(); el.classList.add("dragover"); });
    el.addEventListener("dragleave", () => el.classList.remove("dragover"));
    el.addEventListener("drop", (e) => {
      e.preventDefault(); el.classList.remove("dragover");
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) loadFile(f, which);
    });
  });

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
  const fmtBtn = $("fmt-json");
  if (fmtBtn) fmtBtn.addEventListener("click", () => {
    const a = formatPane("a"), b = formatPane("b");
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
    if (!hasChrome) { render(); renderHistList(); return; }
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
        renderHistList();
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
