// DiffLens export module — copy/download the current comparison (plain text, unified
// diff, Markdown, .patch). All local: clipboard + Blob URL, no network — and no chrome.*
// here (RULEBOOK R3: storage/badge are the orchestration layer's job, app.js only).
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // Factory form (RULEBOOK R1): app.js calls DiffLensExport(ctx) once at boot and binds
  // the returned functions itself (R6 — no event listeners in this module).
  // ctx = { ta, tb, stats, opts }: pane/status DOM refs plus the options reader; shared
  // references arrive only via ctx, never by reaching into sibling ui modules.
  window.DiffLensExport = function (ctx) {
    const ta = ctx.ta, tb = ctx.tb, stats = ctx.stats, opts = ctx.opts;

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

    return { plainDiffText, flashBtn, closeExport, copyText, copyResult, copyUnified, copyMarkdown, downloadPatch };
  };
})();
// REFACTOR STATUS: confidence=high todos=0
