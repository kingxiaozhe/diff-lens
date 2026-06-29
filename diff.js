// ClearDiff diff engine — dependency-free, 100% local.
// Line-level LCS diff with common prefix/suffix trimming, plus word-level
// intra-line highlighting for changed lines. No network, no libraries.

(function (root) {
  "use strict";

  // Hard cap on the LCS DP matrix (cells = n*m). The matrix is the dominant cost in
  // both time and memory (~4 bytes/cell). Above this we degrade gracefully instead of
  // freezing the tab — the realistic danger is two LARGE, DISSIMILAR inputs (prefix/
  // suffix trimming keeps similar inputs cheap) or char-level diff of a long no-space
  // line (minified JS, base64, data-URIs). ~4M cells ≈ 16MB, comfortably safe.
  const MAX_CELLS = 4000000;

  // Tokenize a line into words and whitespace runs (kept so we can reconstruct).
  function tokenizeWords(s) {
    return s.match(/\s+|\S+/g) || [];
  }

  // Build a comparison key for a line honoring the ignore options. The original
  // text is always preserved for display; only the key used for matching changes.
  function lineKey(line, opts) {
    let k = line;
    if (opts.ignoreCase) k = k.toLowerCase();
    if (opts.ignoreWhitespace) k = k.replace(/\s+/g, " ").trim();
    return k;
  }

  // Longest-common-subsequence over arrays of keys. Returns matched index pairs
  // [{ai, bi}, ...] in increasing order, or null when the input is too large to
  // align safely (caller degrades to a coarse block replace). Uint32Array rows.
  function lcsMatches(aKeys, bKeys) {
    const n = aKeys.length, m = bKeys.length;
    if (n === 0 || m === 0) return [];
    if (n * m > MAX_CELLS) return null; // too big — signal graceful degradation
    // DP table of (n+1) rows × (m+1) cols.
    const dp = [];
    for (let i = 0; i <= n; i++) dp.push(new Uint32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) {
      const ai = aKeys[i], row = dp[i], next = dp[i + 1];
      for (let j = m - 1; j >= 0; j--) {
        row[j] = ai === bKeys[j] ? next[j + 1] + 1 : Math.max(next[j], row[j + 1]);
      }
    }
    const out = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (aKeys[i] === bKeys[j]) { out.push({ ai: i, bi: j }); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
      else j++;
    }
    return out;
  }

  // Produce a flat op list from two token/line arrays given their keys.
  // Each op: {type:'equal'|'del'|'add', a?, b?} carrying ORIGINAL items.
  function diffArrays(aArr, bArr, aKeys, bKeys) {
    // Trim common prefix.
    let start = 0;
    while (start < aArr.length && start < bArr.length && aKeys[start] === bKeys[start]) start++;
    // Trim common suffix.
    let aEnd = aArr.length, bEnd = bArr.length;
    while (aEnd > start && bEnd > start && aKeys[aEnd - 1] === bKeys[bEnd - 1]) { aEnd--; bEnd--; }

    const ops = [];
    for (let k = 0; k < start; k++) ops.push({ type: "equal", a: aArr[k], b: bArr[k] });

    const midAKeys = aKeys.slice(start, aEnd);
    const midBKeys = bKeys.slice(start, bEnd);
    const matches = lcsMatches(midAKeys, midBKeys);
    const aOff = start, bOff = start;

    // Too large to align: degrade to a coarse block replace (all removed, then all
    // added). Correct, just less granular than an LCS alignment.
    if (matches === null) {
      for (let k = 0; k < midAKeys.length; k++) ops.push({ type: "del", a: aArr[aOff + k] });
      for (let k = 0; k < midBKeys.length; k++) ops.push({ type: "add", b: bArr[bOff + k] });
      for (let k = aEnd; k < aArr.length; k++) ops.push({ type: "equal", a: aArr[k], b: bArr[bEnd + (k - aEnd)] });
      return ops;
    }

    let ai = 0, bi = 0, mi = 0;
    while (ai < midAKeys.length || bi < midBKeys.length) {
      const match = matches[mi];
      if (match && ai === match.ai && bi === match.bi) {
        ops.push({ type: "equal", a: aArr[aOff + ai], b: bArr[bOff + bi] });
        ai++; bi++; mi++;
      } else if (match && bi === match.bi && ai < match.ai) {
        ops.push({ type: "del", a: aArr[aOff + ai] }); ai++;
      } else if (match && ai === match.ai && bi < match.bi) {
        ops.push({ type: "add", b: bArr[bOff + bi] }); bi++;
      } else if (!match) {
        if (ai < midAKeys.length) { ops.push({ type: "del", a: aArr[aOff + ai] }); ai++; }
        else if (bi < midBKeys.length) { ops.push({ type: "add", b: bArr[bOff + bi] }); bi++; }
      } else {
        // Before the next match: emit dels then adds.
        if (ai < match.ai) { ops.push({ type: "del", a: aArr[aOff + ai] }); ai++; }
        else if (bi < match.bi) { ops.push({ type: "add", b: bArr[bOff + bi] }); bi++; }
      }
    }

    for (let k = aEnd; k < aArr.length; k++) ops.push({ type: "equal", a: aArr[k], b: bArr[bEnd + (k - aEnd)] });
    return ops;
  }

  // Intra-line diff → array of {type, text}. Word-level by default; char-level
  // when opts.charLevel (finer highlighting, good for code/IDs).
  function diffWords(aLine, bLine, opts) {
    opts = opts || {};
    const tok = opts.charLevel ? (s) => Array.from(s) : tokenizeWords;
    const aTok = tok(aLine);
    const bTok = tok(bLine);
    // Guard: an intra-line LCS over very many tokens (e.g. char-level on a long
    // no-space line) would be quadratic. Fall back to a whole-line change.
    if (aTok.length * bTok.length > MAX_CELLS) {
      return [{ type: "del", text: aLine }, { type: "add", text: bLine }];
    }
    const key = (t) => {
      let k = t;
      if (opts.ignoreCase) k = k.toLowerCase();
      if (opts.ignoreWhitespace && /^\s+$/.test(k)) k = " ";
      return k;
    };
    const ops = diffArrays(aTok, bTok, aTok.map(key), bTok.map(key));
    return ops.map((o) => ({
      type: o.type,
      text: o.type === "add" ? o.b : o.a,
    }));
  }

  // Main entry: returns { rows, stats }.
  // rows: [{type, aNum, bNum, aWords?, bWords?, text?}]
  function compare(textA, textB, options) {
    const opts = Object.assign(
      { ignoreWhitespace: false, ignoreCase: false, ignoreBlankLines: false, charLevel: false },
      options || {}
    );
    // Carry each line's ORIGINAL 1-based number so display line numbers stay true
    // even when blank lines are filtered out of the comparison.
    const split = (txt) => txt.split(/\r\n|\r|\n/).map((t, i) => ({ t, n: i + 1 }));
    let aLines = split(textA);
    let bLines = split(textB);
    const rawA = aLines.length, rawB = bLines.length;
    if (opts.ignoreBlankLines) {
      const nb = (arr) => arr.filter((o) => o.t.trim() !== "");
      aLines = nb(aLines); bLines = nb(bLines);
    }
    const aKeys = aLines.map((o) => lineKey(o.t, opts));
    const bKeys = bLines.map((o) => lineKey(o.t, opts));
    const ops = diffArrays(aLines, bLines, aKeys, bKeys);

    const rows = [];
    let added = 0, removed = 0, minor = 0;

    // Flush a contiguous block of removed + added lines, pairing them POSITIONALLY
    // (del[i] with add[i]) so "modified line N" lines up with "modified line N",
    // not last-del-with-first-add. Leftover dels/adds emit as pure del/add rows.
    // Items are {t,n} line objects so display line numbers stay true to the source.
    function flushBlock(dels, adds) {
      const paired = Math.min(dels.length, adds.length);
      for (let k = 0; k < paired; k++) {
        removed++; added++;
        let words = diffWords(dels[k].t, adds[k].t, opts);
        // Auto-refine: if word-level found NO common word (so the whole line would
        // be highlighted — e.g. a no-space path/URL/identifier), fall back to
        // character-level to highlight only the characters that actually differ.
        if (!opts.charLevel && dels[k].t && adds[k].t && !words.some((w) => w.type === "equal")) {
          const charWords = diffWords(dels[k].t, adds[k].t, Object.assign({}, opts, { charLevel: true }));
          if (charWords.some((w) => w.type === "equal")) words = charWords;
        }
        rows.push({
          type: "change", aNum: dels[k].n, bNum: adds[k].n,
          words: words, // full merged sequence (equal/del/add) — for the inline view
          aWords: words.filter((w) => w.type !== "add"),
          bWords: words.filter((w) => w.type !== "del"),
        });
      }
      for (let k = paired; k < dels.length; k++) { removed++; rows.push({ type: "del", aNum: dels[k].n, text: dels[k].t }); }
      for (let k = paired; k < adds.length; k++) { added++; rows.push({ type: "add", bNum: adds[k].n, text: adds[k].t }); }
    }

    let dels = [], adds = [];
    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      if (op.type === "del") dels.push(op.a);
      else if (op.type === "add") adds.push(op.b);
      else { // lenient-equal: close any open block first
        if (dels.length || adds.length) { flushBlock(dels, adds); dels = []; adds = []; }
        if (op.a.t === op.b.t) {
          rows.push({ type: "equal", aNum: op.a.n, bNum: op.b.n, text: op.a.t });
        } else {
          // Lines matched only because an ignore option (whitespace/case) is on, yet
          // their raw text differs → an UNIMPORTANT difference (BC's 3rd state).
          minor++;
          const words = diffWords(op.a.t, op.b.t, opts);
          rows.push({
            type: "minor", aNum: op.a.n, bNum: op.b.n,
            aText: op.a.t, bText: op.b.t, words: words,
            aWords: words.filter((w) => w.type !== "add"),
            bWords: words.filter((w) => w.type !== "del"),
          });
        }
      }
    }
    if (dels.length || adds.length) flushBlock(dels, adds);
    const identical = added === 0 && removed === 0 && minor === 0;
    const onlyMinor = added === 0 && removed === 0 && minor > 0;
    return { rows, stats: { added, removed, minor, identical, onlyMinor, aLines: rawA, bLines: rawB } };
  }

  // --- export helpers (pure, unit-testable) ------------------------------------
  // Build a standard unified diff (git-style) from two texts. Reuses compare() so
  // the same ignore options apply. `context` controls surrounding context lines.
  // Returns "" when the inputs are identical (under the chosen options).
  function toUnifiedDiff(textA, textB, options, fmtOpts) {
    fmtOpts = fmtOpts || {};
    const context = fmtOpts.context == null ? 3 : Math.max(0, fmtOpts.context | 0);
    const aLabel = fmtOpts.aLabel || "Original";
    const bLabel = fmtOpts.bLabel || "Changed";
    const out = compare(textA, textB, options);
    if (out.stats.identical) return "";

    // Flatten display rows into tagged single lines: ' ' (context), '-' (del), '+' (add).
    const joinW = (ws) => ws.map((w) => w.text).join("");
    const entries = [];
    for (const r of out.rows) {
      if (r.type === "equal") entries.push({ tag: " ", text: r.text });
      else if (r.type === "del") entries.push({ tag: "-", text: r.text });
      else if (r.type === "add") entries.push({ tag: "+", text: r.text });
      else if (r.type === "change") {
        entries.push({ tag: "-", text: joinW(r.aWords) });
        entries.push({ tag: "+", text: joinW(r.bWords) });
      } else if (r.type === "minor") {
        // Matched only under an ignore option but raw text differs — show the raw change.
        entries.push({ tag: "-", text: r.aText });
        entries.push({ tag: "+", text: r.bText });
      }
    }

    // Assign 1-based source line numbers as we walk: ' ' advances both, '-' a-only,
    // '+' b-only.
    let an = 0, bn = 0;
    for (const e of entries) {
      if (e.tag !== "+") e.a = ++an; else e.a = null;
      if (e.tag !== "-") e.b = ++bn; else e.b = null;
    }

    // Group changed lines into hunks, padding each side with `context` lines and
    // merging groups whose contexts touch.
    const changed = [];
    for (let i = 0; i < entries.length; i++) if (entries[i].tag !== " ") changed.push(i);
    if (!changed.length) return "";
    const groups = [];
    let gs = Math.max(0, changed[0] - context);
    let ge = Math.min(entries.length - 1, changed[0] + context);
    for (let k = 1; k < changed.length; k++) {
      const idx = changed[k];
      if (idx - context <= ge + 1) ge = Math.min(entries.length - 1, idx + context);
      else { groups.push([gs, ge]); gs = Math.max(0, idx - context); ge = Math.min(entries.length - 1, idx + context); }
    }
    groups.push([gs, ge]);

    const lines = ["--- a/" + aLabel, "+++ b/" + bLabel];
    for (const [s, e] of groups) {
      let aLen = 0, bLen = 0, aStart = 0, bStart = 0;
      for (let i = s; i <= e; i++) {
        const en = entries[i];
        if (en.tag !== "+") { aLen++; if (!aStart) aStart = en.a; }
        if (en.tag !== "-") { bLen++; if (!bStart) bStart = en.b; }
      }
      // Pure-addition / pure-deletion hunks: start is the preceding line (count before group).
      if (aLen === 0) aStart = entries.slice(0, s).filter((x) => x.tag !== "+").length;
      if (bLen === 0) bStart = entries.slice(0, s).filter((x) => x.tag !== "-").length;
      lines.push("@@ -" + aStart + "," + aLen + " +" + bStart + "," + bLen + " @@");
      for (let i = s; i <= e; i++) lines.push(entries[i].tag + entries[i].text);
    }
    return lines.join("\n") + "\n";
  }

  // Markdown export: a fenced ```diff block so it renders with red/green on GitHub
  // and other Markdown viewers.
  function toMarkdown(textA, textB, options, fmtOpts) {
    const ud = toUnifiedDiff(textA, textB, options, fmtOpts);
    if (!ud) return "";
    return "```diff\n" + ud + "```\n";
  }

  // Collapse long runs of unchanged (equal) rows into a single foldable placeholder,
  // keeping `context` unchanged rows next to each change so the diff stays readable on
  // large, mostly-identical inputs. Pure: returns a NEW array whose items are either an
  // original row or { type:"fold", count, key, hidden:[rows] }. Runs shorter than
  // `minFold` are left expanded (folding them would only add clutter). Only "equal"
  // rows fold; "minor" rows (and all real changes) are always kept visible.
  function foldRows(rows, context, minFold) {
    context = context == null ? 3 : Math.max(0, context | 0);
    minFold = minFold == null ? 10 : Math.max(1, minFold | 0);
    const n = rows.length;
    const keep = new Array(n).fill(false);
    for (let i = 0; i < n; i++) {
      if (rows[i].type !== "equal") {
        keep[i] = true;
        for (let d = 1; d <= context; d++) {
          if (i - d >= 0) keep[i - d] = true;
          if (i + d < n) keep[i + d] = true;
        }
      }
    }
    const out = [];
    let i = 0;
    while (i < n) {
      if (keep[i]) { out.push(rows[i]); i++; continue; }
      let j = i;
      while (j < n && !keep[j]) j++;
      const run = rows.slice(i, j);
      if (run.length >= minFold) {
        const f = run[0];
        out.push({ type: "fold", count: run.length, hidden: run,
          key: "f" + (f.aNum || 0) + "_" + (f.bNum || 0) + "_" + run.length });
      } else {
        for (const r of run) out.push(r);
      }
      i = j;
    }
    return out;
  }

  root.ClearDiff = { compare, diffWords, toUnifiedDiff, toMarkdown, foldRows };
})(typeof window !== "undefined" ? window : globalThis);
