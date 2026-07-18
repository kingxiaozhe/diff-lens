// DiffLens render module — pure HTML string builders for the three diff views. No DOM reads,
// no chrome.*, no network, no state: callers pass an options bag ({ showWs }) explicitly.
(function (root) {
  "use strict";

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  // Escape + (optionally) reveal whitespace as faint glyphs — BC-style.
  function fmt(s, showWs) {
    let h = esc(s);
    if (showWs) {
      h = h.replace(/\t/g, '<span class="ws">→</span>').replace(/ /g, '<span class="ws">·</span>');
    }
    return h;
  }
  function renderWords(words, showWs) {
    return words.map((w) => {
      const t = fmt(w.text, showWs);
      if (w.type === "del") return "<del>" + t + "</del>";
      if (w.type === "add") return "<ins>" + t + "</ins>";
      return t;
    }).join("");
  }
  // Inline badge marking a moved line and where its partner lives.
  function moveTag(dir, n) {
    return ' <span class="movetag" title="This line was moved, not added or removed">↕ moved ' + dir + " line " + n + "</span>";
  }

  // 两个 span 之间不留字面空格——.num 用 flex gap 控距，字面空格会额外撑开一格。
  function numCell(a, b) {
    return '<div class="num"><span>' + (a == null ? "" : a) + '</span><span>' + (b == null ? "" : b) + "</span></div>";
  }
  function urow(cls, sign, aNum, bNum, inner, attrs) {
    return '<div class="row ' + cls + '"' + (attrs || "") + '>' + numCell(aNum, bNum) + '<div class="sign">' + sign + '</div><div class="txt">' + inner + "</div></div>";
  }
  // pip 轨道消费的视图无关元数据，盖在每个 hunk 的首行上。轨道只读 dataset，
  // 不读各视图的 DOM 细节（split 的类型类在子节点上，按 classList 读会拿不到）。
  function hmeta(type, line) {
    return ' data-htype="' + type + '" data-hline="' + (line == null ? "" : line) + '"';
  }
  // Single-column rows shared by Unified and Inline — the ONLY difference is how a
  // CHANGE renders: Unified shows two rows (− old / + new); Inline shows one row with
  // the original text and the edits marked in place (strike-through + insert).
  // A collapsed band of unchanged lines — full-width, click to expand.
  function foldRowHtml(r) {
    return '<div class="row fold"><button class="foldbtn" type="button" data-fold="' + esc(r.key) +
      '" title="Show the hidden lines">⋯ ' + r.count + " unchanged lines · expand ⋯</button></div>";
  }
  function renderColumn(out, inlineChange, showWs) {
    const html = []; let prevImp = false;
    for (const r of out.rows) {
      if (r.type === "fold") { html.push(foldRowHtml(r)); prevImp = false; continue; }
      const imp = r.type === "del" || r.type === "add" || r.type === "change";
      const hs = imp && !prevImp ? " hstart" : "";
      if (r.type === "equal") html.push(urow("equal", "", r.aNum, r.bNum, fmt(r.text, showWs)));
      else if (r.type === "minor") html.push(urow("minor", "≈", r.aNum, r.bNum, renderWords(inlineChange ? r.words : r.bWords, showWs)));
      else if (r.type === "del") html.push(urow("del" + hs + (r.moved ? " moved" : ""), "−", r.aNum, null, fmt(r.text, showWs) + (r.moved ? moveTag("to", r.movePartnerNum) : ""), hs ? hmeta("del", r.aNum) : ""));
      else if (r.type === "add") html.push(urow("add" + hs + (r.moved ? " moved" : ""), "+", null, r.bNum, fmt(r.text, showWs) + (r.moved ? moveTag("from", r.movePartnerNum) : ""), hs ? hmeta("add", r.bNum) : ""));
      else if (r.type === "change") {
        if (inlineChange) {
          html.push(urow("change" + hs, "~", r.aNum, r.bNum, renderWords(r.words, showWs), hs ? hmeta("change", r.aNum) : ""));
        } else {
          html.push(urow("change" + hs, "−", r.aNum, null, renderWords(r.aWords, showWs), hs ? hmeta("change", r.aNum) : ""));
          html.push(urow("change", "+", null, r.bNum, renderWords(r.bWords, showWs)));
        }
      }
      prevImp = imp;
    }
    return html.join("");
  }
  function renderUnified(out, opts) { return renderColumn(out, false, !!(opts && opts.showWs)); }
  function renderInline(out, opts) { return renderColumn(out, true, !!(opts && opts.showWs)); }
  function scol(cls, num, inner) {
    return '<div class="scol ' + cls + '"><div class="snum">' + (num == null ? "" : num) + '</div><div class="stxt">' + inner + "</div></div>";
  }
  function renderSplit(out, opts) {
    const showWs = !!(opts && opts.showWs);
    const html = []; let prevImp = false;
    for (const r of out.rows) {
      if (r.type === "fold") { html.push(foldRowHtml(r)); prevImp = false; continue; }
      const imp = r.type === "del" || r.type === "add" || r.type === "change";
      const hs = imp && !prevImp ? " hstart" : "";
      // 右栏必须带 class "b" —— .scol.b 是两栏之间的分隔竖线。
      // （此前一直漏加，导致 app.css 的 .scol.b 规则从未生效、split 视图无分栏线。）
      let left, right;
      if (r.type === "equal") {
        left = scol("equal", r.aNum, fmt(r.text, showWs)); right = scol("equal b", r.bNum, fmt(r.text, showWs));
      } else if (r.type === "minor") {
        left = scol("minor", r.aNum, renderWords(r.aWords, showWs)); right = scol("minor b", r.bNum, renderWords(r.bWords, showWs));
      } else if (r.type === "del") {
        left = scol("del" + (r.moved ? " moved" : ""), r.aNum, fmt(r.text, showWs) + (r.moved ? moveTag("to", r.movePartnerNum) : "")); right = scol("blank b", null, "");
      } else if (r.type === "add") {
        left = scol("blank", null, ""); right = scol("add b" + (r.moved ? " moved" : ""), r.bNum, fmt(r.text, showWs) + (r.moved ? moveTag("from", r.movePartnerNum) : ""));
      } else { // change
        left = scol("chg", r.aNum, renderWords(r.aWords, showWs)); right = scol("chg b", r.bNum, renderWords(r.bWords, showWs));
      }
      html.push('<div class="srow' + hs + '"' + (hs ? hmeta(r.type, r.type === "add" ? r.bNum : r.aNum) : "") + '>' + left + right + "</div>");
      prevImp = imp;
    }
    return html.join("");
  }

  // 导出面 = 实际消费面（RULEBOOK §1）：esc 供 app.js 的错误边界与历史列表复用，
  // 三个渲染入口收 { showWs } options bag；其余 9 个助手为模块私有。
  root.DiffLensRender = { esc, renderUnified, renderInline, renderSplit };
})(typeof window !== "undefined" ? window : globalThis);
// REFACTOR STATUS: confidence=high todos=0
