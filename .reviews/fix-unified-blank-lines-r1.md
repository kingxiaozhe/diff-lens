Reading additional input from stdin...
OpenAI Codex v0.144.5
--------
workdir: /Users/zero/MyCode/diff-lens
model: gpt-5.4
provider: openai
approval: never
sandbox: read-only
reasoning effort: high
reasoning summaries: none
session id: 019f710d-aea3-73d2-91e7-3a24da2fcae9
--------
user
你在审查一个缺陷修复。假设这段修复有害或不完整,找出证据。

缺陷: ignoreBlankLines 开启时 toUnifiedDiff 导出的补丁行号错位且缺空行上下文,git apply 拒绝(退出码1,已实证)。
根因结论: 导出路径继承了会过滤行的比较选项,破坏了顺序重编号'每个源行恰出现一次'的前提。
修复 diff 见 git diff diff.js(工作区未提交);新增防护网测试 tests/unified-blank-test.mjs。
修复前红证据: 新测试首跑 2 条失败(✗ ignoreBlankLines patch applies to the ORIGINAL file (single blank)
✗ ignoreBlankLines patch applies (markdown-like, blank-dense)
3 passed, 2 failed)。

审查重点(逐项回答):
1) 根因是否真被修掉,还是只治了症状?
2) 防护网测试本身可信吗——红的原因是否=该缺陷?断言测根因还是测症状?patchAppliesTo 校验器是否安慰剂(注意它自带了好/坏补丁自验证)?
3) 修复有无引入新行为问题——特别是: blank-only差异+ignoreBlankLines 的 identical 语义是否被保住?minor 行(ignoreCase/ignoreWhitespace)路径是否被波及?
4) 波及面有无遗漏(toMarkdown 经由 toUnifiedDiff;app.js 只消费返回串)?
只报有具体失败场景的问题,零发现明说。
codex
按缺陷修复审查来做。我先读 `review` 技能说明和当前工作区 diff，再核对新增测试与现有实现是否真的对准了根因。
exec
/bin/zsh -lc "sed -n '1,240p' /Users/zero/.codex/skills/review/SKILL.md" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
---
name: review
description: "Findings-first pre-landing review against code, plan completion, verification evidence, and durable runtime state."
---

# Review

## Purpose

Use `$review` to answer one question: is this actually ready to land? Review is not a summary pass. It is a bug, regression, coverage, and state-integrity pass.

## Execution Policy

- Findings first, summary second.
- Prefer evidence over author claims.
- Check the code, the tests, the plan, and the runtime artifacts.
- If the current context authored the change, prefer a separate reviewer role for approval.

## Review Order

1. Read the changed code.
2. Read the active plan and verification map.
3. Check what was supposed to happen vs what actually landed.
4. Verify:
   - tests and typechecks
   - docs drift
   - `.omx/` state drift
   - task/review/inbox accuracy
5. Produce a verdict:
   - approved
   - changes requested
   - blocked

## Mandatory Checks

- missing or fake verification
- uncovered changed paths
- stale docs or setup instructions
- task marked done but still pending review evidence
- team runtime claiming health while inbox or review queue says otherwise

## Output Standard

- findings ordered by severity
- file references and why they matter
- residual risk
- final verdict and next action

codex
我已经拿到审查流程，接下来直接看未提交修复、相关实现和新增测试，再决定是否需要跑针对性验证。
exec
/bin/zsh -lc 'git diff -- diff.js tests/unified-blank-test.mjs' in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-gx9dkQd4' (errno=Operation not permitted)
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-yCVyQT08' (errno=Operation not permitted)
diff --git a/diff.js b/diff.js
index 0c8d5c0..ac69c03 100644
--- a/diff.js
+++ b/diff.js
@@ -258,11 +258,21 @@
     const bLabel = fmtOpts.bLabel || "Changed";
     const out = compare(textA, textB, options);
     if (out.stats.identical) return "";
+    // A unified diff must APPLY to the raw files. ignoreBlankLines filters lines out
+    // of the compare stream entirely, which breaks the sequential renumbering below
+    // (it assumes every source line appears exactly once) — hunk headers drift and
+    // blank context lines vanish, so `git apply` rejects the patch. Keep the
+    // "identical?" judgment on the user's options (UI semantics unchanged), but build
+    // the patch body from an unfiltered compare: blank-line differences ride along as
+    // real -/+ lines, which is the price of a patch that actually applies.
+    const body = options && options.ignoreBlankLines
+      ? compare(textA, textB, Object.assign({}, options, { ignoreBlankLines: false }))
+      : out;
 
     // Flatten display rows into tagged single lines: ' ' (context), '-' (del), '+' (add).
     const joinW = (ws) => ws.map((w) => w.text).join("");
     const entries = [];
-    for (const r of out.rows) {
+    for (const r of body.rows) {
       if (r.type === "equal") entries.push({ tag: " ", text: r.text });
       else if (r.type === "del") entries.push({ tag: "-", text: r.text });
       else if (r.type === "add") entries.push({ tag: "+", text: r.text });

exec
/bin/zsh -lc 'rg -n "toUnifiedDiff|ignoreBlankLines|patchAppliesTo|toMarkdown|ignoreCase|ignoreWhitespace|identical" diff.js tests app.js' in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
diff.js:24:    if (opts.ignoreCase) k = k.toLowerCase();
diff.js:25:    if (opts.ignoreWhitespace) k = k.replace(/\s+/g, " ").trim();
diff.js:120:      if (opts.ignoreCase) k = k.toLowerCase();
diff.js:121:      if (opts.ignoreWhitespace && /^\s+$/.test(k)) k = " ";
diff.js:135:      { ignoreWhitespace: false, ignoreCase: false, ignoreBlankLines: false, charLevel: false },
diff.js:144:    if (opts.ignoreBlankLines) {
diff.js:207:    const identical = added === 0 && removed === 0 && minor === 0;
diff.js:209:    return { rows, stats: { added, removed, minor, moved, identical, onlyMinor, aLines: rawA, bLines: rawB } };
diff.js:253:  // Returns "" when the inputs are identical (under the chosen options).
diff.js:254:  function toUnifiedDiff(textA, textB, options, fmtOpts) {
diff.js:260:    if (out.stats.identical) return "";
diff.js:261:    // A unified diff must APPLY to the raw files. ignoreBlankLines filters lines out
diff.js:265:    // "identical?" judgment on the user's options (UI semantics unchanged), but build
diff.js:268:    const body = options && options.ignoreBlankLines
diff.js:269:      ? compare(textA, textB, Object.assign({}, options, { ignoreBlankLines: false }))
diff.js:331:  function toMarkdown(textA, textB, options, fmtOpts) {
diff.js:332:    const ud = toUnifiedDiff(textA, textB, options, fmtOpts);
diff.js:339:  // large, mostly-identical inputs. Pure: returns a NEW array whose items are either an
diff.js:376:  root.ClearDiff = { compare, diffWords, toUnifiedDiff, toMarkdown, foldRows };
tests/unified-blank-test.mjs:2:// unified diff export must produce APPLYABLE patches when ignoreBlankLines is on.
tests/unified-blank-test.mjs:13:const { toUnifiedDiff, compare } = globalThis.ClearDiff;
tests/unified-blank-test.mjs:21:function patchAppliesTo(patch, textA) {
tests/unified-blank-test.mjs:42:  const good = toUnifiedDiff(goodA, "a\nB\nc", null, { context: 1 });
tests/unified-blank-test.mjs:43:  ok(patchAppliesTo(good, goodA), "checker: green on a known-good patch");
tests/unified-blank-test.mjs:45:  ok(!patchAppliesTo(broken, goodA), "checker: red on a deliberately mis-numbered patch");
tests/unified-blank-test.mjs:48:// THE BUG (red before fix): blank-line-bearing files + ignoreBlankLines.
tests/unified-blank-test.mjs:52:  const p = toUnifiedDiff(a, b, { ignoreBlankLines: true }, { context: 1 });
tests/unified-blank-test.mjs:53:  ok(patchAppliesTo(p, a), "ignoreBlankLines patch applies to the ORIGINAL file (single blank)");
tests/unified-blank-test.mjs:59:  const p = toUnifiedDiff(a, b, { ignoreBlankLines: true }, { context: 2 });
tests/unified-blank-test.mjs:60:  ok(patchAppliesTo(p, a), "ignoreBlankLines patch applies (markdown-like, blank-dense)");
tests/unified-blank-test.mjs:64:// ignoreBlankLines stays "identical" → export stays "" — the fix must not break this.
tests/unified-blank-test.mjs:66:  const p = toUnifiedDiff("a\n\n\nb", "a\nb", { ignoreBlankLines: true }, { context: 1 });
tests/unified-blank-test.mjs:67:  ok(p === "", "blank-only diff with ignoreBlankLines still exports empty patch");
app.js:49:      ignoreWhitespace: optWs.checked,
app.js:50:      ignoreCase: optCase.checked,
app.js:51:      ignoreBlankLines: optBlank.checked,
app.js:153:    if (out.stats.identical) {
app.js:155:      result.innerHTML = '<div class="placeholder"><span class="big">✓ The two texts are identical' + why + ".</span></div>";
app.js:271:    const ud = window.ClearDiff.toUnifiedDiff(ta.value, tb.value, opts());
app.js:272:    if (!ud) { stats.textContent = "Nothing to export — the two texts are identical."; closeExport(); return; }
app.js:276:    const md = window.ClearDiff.toMarkdown(ta.value, tb.value, opts());
app.js:277:    if (!md) { stats.textContent = "Nothing to export — the two texts are identical."; closeExport(); return; }
app.js:282:    const ud = window.ClearDiff.toUnifiedDiff(ta.value, tb.value, opts());
app.js:283:    if (!ud) { stats.textContent = "Nothing to export — the two texts are identical."; closeExport(); return; }
app.js:469:  // minification differences vanish — so two structurally-equal JSONs become identical.
app.js:502:      ignoreWhitespace: optWs.checked, ignoreCase: optCase.checked,
app.js:503:      ignoreBlankLines: optBlank.checked, charLevel: optChar.checked,
app.js:511:      ["textA", "textB", "ignoreWhitespace", "ignoreCase", "ignoreBlankLines", "charLevel", "showWhitespace", "wordWrap", "view", "foldUnchanged", "history"],
app.js:515:        if (typeof s.ignoreWhitespace === "boolean") optWs.checked = s.ignoreWhitespace;
app.js:516:        if (typeof s.ignoreCase === "boolean") optCase.checked = s.ignoreCase;
app.js:517:        if (typeof s.ignoreBlankLines === "boolean") optBlank.checked = s.ignoreBlankLines;
tests/history-test.mjs:37:// add: dedupe identical A&B (moves it to front, no duplicate)
tests/diff-test.mjs:11:const { compare, toUnifiedDiff, toMarkdown, foldRows } = globalThis.ClearDiff;
tests/diff-test.mjs:24:  ok(out.stats.identical, "identical inputs report identical");
tests/diff-test.mjs:25:  eq(out.stats.added, 0, "identical: 0 added");
tests/diff-test.mjs:26:  eq(out.stats.removed, 0, "identical: 0 removed");
tests/diff-test.mjs:33:  ok(!out.stats.identical, "changed inputs not identical");
tests/diff-test.mjs:44:  const out = compare("Hello", "hello", { ignoreCase: true });
tests/diff-test.mjs:45:  ok(out.stats.onlyMinor, "case-only diff with ignoreCase → onlyMinor");
tests/diff-test.mjs:50:  const out = compare("a  b", "a b", { ignoreWhitespace: true });
tests/diff-test.mjs:51:  ok(out.stats.onlyMinor, "whitespace-only diff with ignoreWhitespace → onlyMinor");
tests/diff-test.mjs:55:  const out = compare("a\n\n\nb", "a\nb", { ignoreBlankLines: true });
tests/diff-test.mjs:56:  ok(out.stats.identical, "blank-line-only diff with ignoreBlankLines → identical");
tests/diff-test.mjs:59:// --- compare(): line numbers preserved with ignoreBlankLines ---
tests/diff-test.mjs:61:  const out = compare("a\n\nb", "a\n\nc", { ignoreBlankLines: true });
tests/diff-test.mjs:63:  ok(change && change.aNum === 3 && change.bNum === 3, "source line numbers survive ignoreBlankLines (line 3)");
tests/diff-test.mjs:101:// --- toUnifiedDiff() ---
tests/diff-test.mjs:103:  eq(toUnifiedDiff("a\nb", "a\nb"), "", "identical → empty unified diff");
tests/diff-test.mjs:107:  const ud = toUnifiedDiff("a\nb\nc", "a\nB\nc", null, { context: 1 });
tests/diff-test.mjs:119:  const ud = toUnifiedDiff("a\nb", "a\nb\nc", null, { context: 3 });
tests/diff-test.mjs:128:  const ud = toUnifiedDiff(a, bArr.join("\n"), null, { context: 2 });
tests/diff-test.mjs:135:  const ud = toUnifiedDiff("x\na\nb\nc\ny", "x\na\nB\nc\ny", null, { context: 1 });
tests/diff-test.mjs:147:// --- toMarkdown() ---
tests/diff-test.mjs:149:  const md = toMarkdown("a\nb", "a\nB");
tests/diff-test.mjs:153:  eq(toMarkdown("a", "a"), "", "identical → empty markdown");
tests/diff-test.mjs:159:  const ud = toUnifiedDiff(A, B, null, { context: 3 });
tests/diff-test.mjs:168:  // 30 identical lines + one change in the middle.
tests/diff-test.mjs:196:  ok(out.stats.identical, "identical long inputs are identical");
tests/smoke.mjs:100:  // Identical inputs report identical.
tests/smoke.mjs:102:  await page.waitForFunction(() => /identical/i.test(document.querySelector("#result").textContent));
tests/smoke.mjs:103:  ok(/identical/i.test(await page.textContent("#result")), "identical inputs report identical");
tests/smoke.mjs:105:  // Collapse unchanged: a long mostly-identical input should fold, and a band expands.
tests/smoke.mjs:203:  ok(!(await page.locator("#pip-rail").isVisible()), "rail hides when the texts are identical");
tests/smoke.mjs:259:  ok((await page.locator("#result .placeholder").count()) === 1, "identical state reuses the styled placeholder");

exec
/bin/zsh -lc 'git status --short' in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-g5cqfsOQ' (errno=Operation not permitted)
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-ypahBcUB' (errno=Operation not permitted)
 M diff.js
 M docs/ARCHITECTURE.md
 M docs/PRD.md
 M "\350\277\220\350\241\214\346\227\245\345\277\227.jsonl"
?? .reviews/
?? 2.visual-refresh-and-change-rail/.reviews/2.visual-refresh-and-change-rail-T006-r1.md
?? 2.visual-refresh-and-change-rail/.reviews/2.visual-refresh-and-change-rail-T006-r2.md
?? tests/unified-blank-test.mjs

codex
我已经看到修复只改了 `toUnifiedDiff` 的导出路径，并新增了一个带自验证的 `patchAppliesTo` 测试文件。现在补读实现上下文，重点看它是否只在导出时绕过 `ignoreBlankLines`，以及有没有误伤其他忽略选项。
exec
/bin/zsh -lc "nl -ba diff.js | sed -n '1,240p'" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
     1	// ClearDiff diff engine — dependency-free, 100% local.
     2	// Line-level LCS diff with common prefix/suffix trimming, plus word-level
     3	// intra-line highlighting for changed lines. No network, no libraries.
     4	
     5	(function (root) {
     6	  "use strict";
     7	
     8	  // Hard cap on the LCS DP matrix (cells = n*m). The matrix is the dominant cost in
     9	  // both time and memory (~4 bytes/cell). Above this we degrade gracefully instead of
    10	  // freezing the tab — the realistic danger is two LARGE, DISSIMILAR inputs (prefix/
    11	  // suffix trimming keeps similar inputs cheap) or char-level diff of a long no-space
    12	  // line (minified JS, base64, data-URIs). ~4M cells ≈ 16MB, comfortably safe.
    13	  const MAX_CELLS = 4000000;
    14	
    15	  // Tokenize a line into words and whitespace runs (kept so we can reconstruct).
    16	  function tokenizeWords(s) {
    17	    return s.match(/\s+|\S+/g) || [];
    18	  }
    19	
    20	  // Build a comparison key for a line honoring the ignore options. The original
    21	  // text is always preserved for display; only the key used for matching changes.
    22	  function lineKey(line, opts) {
    23	    let k = line;
    24	    if (opts.ignoreCase) k = k.toLowerCase();
    25	    if (opts.ignoreWhitespace) k = k.replace(/\s+/g, " ").trim();
    26	    return k;
    27	  }
    28	
    29	  // Longest-common-subsequence over arrays of keys. Returns matched index pairs
    30	  // [{ai, bi}, ...] in increasing order, or null when the input is too large to
    31	  // align safely (caller degrades to a coarse block replace). Uint32Array rows.
    32	  function lcsMatches(aKeys, bKeys) {
    33	    const n = aKeys.length, m = bKeys.length;
    34	    if (n === 0 || m === 0) return [];
    35	    if (n * m > MAX_CELLS) return null; // too big — signal graceful degradation
    36	    // DP table of (n+1) rows × (m+1) cols.
    37	    const dp = [];
    38	    for (let i = 0; i <= n; i++) dp.push(new Uint32Array(m + 1));
    39	    for (let i = n - 1; i >= 0; i--) {
    40	      const ai = aKeys[i], row = dp[i], next = dp[i + 1];
    41	      for (let j = m - 1; j >= 0; j--) {
    42	        row[j] = ai === bKeys[j] ? next[j + 1] + 1 : Math.max(next[j], row[j + 1]);
    43	      }
    44	    }
    45	    const out = [];
    46	    let i = 0, j = 0;
    47	    while (i < n && j < m) {
    48	      if (aKeys[i] === bKeys[j]) { out.push({ ai: i, bi: j }); i++; j++; }
    49	      else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    50	      else j++;
    51	    }
    52	    return out;
    53	  }
    54	
    55	  // Produce a flat op list from two token/line arrays given their keys.
    56	  // Each op: {type:'equal'|'del'|'add', a?, b?} carrying ORIGINAL items.
    57	  function diffArrays(aArr, bArr, aKeys, bKeys) {
    58	    // Trim common prefix.
    59	    let start = 0;
    60	    while (start < aArr.length && start < bArr.length && aKeys[start] === bKeys[start]) start++;
    61	    // Trim common suffix.
    62	    let aEnd = aArr.length, bEnd = bArr.length;
    63	    while (aEnd > start && bEnd > start && aKeys[aEnd - 1] === bKeys[bEnd - 1]) { aEnd--; bEnd--; }
    64	
    65	    const ops = [];
    66	    for (let k = 0; k < start; k++) ops.push({ type: "equal", a: aArr[k], b: bArr[k] });
    67	
    68	    const midAKeys = aKeys.slice(start, aEnd);
    69	    const midBKeys = bKeys.slice(start, bEnd);
    70	    const matches = lcsMatches(midAKeys, midBKeys);
    71	    const aOff = start, bOff = start;
    72	
    73	    // Too large to align: degrade to a coarse block replace (all removed, then all
    74	    // added). Correct, just less granular than an LCS alignment.
    75	    if (matches === null) {
    76	      for (let k = 0; k < midAKeys.length; k++) ops.push({ type: "del", a: aArr[aOff + k] });
    77	      for (let k = 0; k < midBKeys.length; k++) ops.push({ type: "add", b: bArr[bOff + k] });
    78	      for (let k = aEnd; k < aArr.length; k++) ops.push({ type: "equal", a: aArr[k], b: bArr[bEnd + (k - aEnd)] });
    79	      return ops;
    80	    }
    81	
    82	    let ai = 0, bi = 0, mi = 0;
    83	    while (ai < midAKeys.length || bi < midBKeys.length) {
    84	      const match = matches[mi];
    85	      if (match && ai === match.ai && bi === match.bi) {
    86	        ops.push({ type: "equal", a: aArr[aOff + ai], b: bArr[bOff + bi] });
    87	        ai++; bi++; mi++;
    88	      } else if (match && bi === match.bi && ai < match.ai) {
    89	        ops.push({ type: "del", a: aArr[aOff + ai] }); ai++;
    90	      } else if (match && ai === match.ai && bi < match.bi) {
    91	        ops.push({ type: "add", b: bArr[bOff + bi] }); bi++;
    92	      } else if (!match) {
    93	        if (ai < midAKeys.length) { ops.push({ type: "del", a: aArr[aOff + ai] }); ai++; }
    94	        else if (bi < midBKeys.length) { ops.push({ type: "add", b: bArr[bOff + bi] }); bi++; }
    95	      } else {
    96	        // Before the next match: emit dels then adds.
    97	        if (ai < match.ai) { ops.push({ type: "del", a: aArr[aOff + ai] }); ai++; }
    98	        else if (bi < match.bi) { ops.push({ type: "add", b: bArr[bOff + bi] }); bi++; }
    99	      }
   100	    }
   101	
   102	    for (let k = aEnd; k < aArr.length; k++) ops.push({ type: "equal", a: aArr[k], b: bArr[bEnd + (k - aEnd)] });
   103	    return ops;
   104	  }
   105	
   106	  // Intra-line diff → array of {type, text}. Word-level by default; char-level
   107	  // when opts.charLevel (finer highlighting, good for code/IDs).
   108	  function diffWords(aLine, bLine, opts) {
   109	    opts = opts || {};
   110	    const tok = opts.charLevel ? (s) => Array.from(s) : tokenizeWords;
   111	    const aTok = tok(aLine);
   112	    const bTok = tok(bLine);
   113	    // Guard: an intra-line LCS over very many tokens (e.g. char-level on a long
   114	    // no-space line) would be quadratic. Fall back to a whole-line change.
   115	    if (aTok.length * bTok.length > MAX_CELLS) {
   116	      return [{ type: "del", text: aLine }, { type: "add", text: bLine }];
   117	    }
   118	    const key = (t) => {
   119	      let k = t;
   120	      if (opts.ignoreCase) k = k.toLowerCase();
   121	      if (opts.ignoreWhitespace && /^\s+$/.test(k)) k = " ";
   122	      return k;
   123	    };
   124	    const ops = diffArrays(aTok, bTok, aTok.map(key), bTok.map(key));
   125	    return ops.map((o) => ({
   126	      type: o.type,
   127	      text: o.type === "add" ? o.b : o.a,
   128	    }));
   129	  }
   130	
   131	  // Main entry: returns { rows, stats }.
   132	  // rows: [{type, aNum, bNum, aWords?, bWords?, text?}]
   133	  function compare(textA, textB, options) {
   134	    const opts = Object.assign(
   135	      { ignoreWhitespace: false, ignoreCase: false, ignoreBlankLines: false, charLevel: false },
   136	      options || {}
   137	    );
   138	    // Carry each line's ORIGINAL 1-based number so display line numbers stay true
   139	    // even when blank lines are filtered out of the comparison.
   140	    const split = (txt) => txt.split(/\r\n|\r|\n/).map((t, i) => ({ t, n: i + 1 }));
   141	    let aLines = split(textA);
   142	    let bLines = split(textB);
   143	    const rawA = aLines.length, rawB = bLines.length;
   144	    if (opts.ignoreBlankLines) {
   145	      const nb = (arr) => arr.filter((o) => o.t.trim() !== "");
   146	      aLines = nb(aLines); bLines = nb(bLines);
   147	    }
   148	    const aKeys = aLines.map((o) => lineKey(o.t, opts));
   149	    const bKeys = bLines.map((o) => lineKey(o.t, opts));
   150	    const ops = diffArrays(aLines, bLines, aKeys, bKeys);
   151	
   152	    const rows = [];
   153	    let added = 0, removed = 0, minor = 0;
   154	
   155	    // Flush a contiguous block of removed + added lines, pairing them POSITIONALLY
   156	    // (del[i] with add[i]) so "modified line N" lines up with "modified line N",
   157	    // not last-del-with-first-add. Leftover dels/adds emit as pure del/add rows.
   158	    // Items are {t,n} line objects so display line numbers stay true to the source.
   159	    function flushBlock(dels, adds) {
   160	      const paired = Math.min(dels.length, adds.length);
   161	      for (let k = 0; k < paired; k++) {
   162	        removed++; added++;
   163	        let words = diffWords(dels[k].t, adds[k].t, opts);
   164	        // Auto-refine: if word-level found NO common word (so the whole line would
   165	        // be highlighted — e.g. a no-space path/URL/identifier), fall back to
   166	        // character-level to highlight only the characters that actually differ.
   167	        if (!opts.charLevel && dels[k].t && adds[k].t && !words.some((w) => w.type === "equal")) {
   168	          const charWords = diffWords(dels[k].t, adds[k].t, Object.assign({}, opts, { charLevel: true }));
   169	          if (charWords.some((w) => w.type === "equal")) words = charWords;
   170	        }
   171	        rows.push({
   172	          type: "change", aNum: dels[k].n, bNum: adds[k].n,
   173	          words: words, // full merged sequence (equal/del/add) — for the inline view
   174	          aWords: words.filter((w) => w.type !== "add"),
   175	          bWords: words.filter((w) => w.type !== "del"),
   176	        });
   177	      }
   178	      for (let k = paired; k < dels.length; k++) { removed++; rows.push({ type: "del", aNum: dels[k].n, text: dels[k].t }); }
   179	      for (let k = paired; k < adds.length; k++) { added++; rows.push({ type: "add", bNum: adds[k].n, text: adds[k].t }); }
   180	    }
   181	
   182	    let dels = [], adds = [];
   183	    for (let i = 0; i < ops.length; i++) {
   184	      const op = ops[i];
   185	      if (op.type === "del") dels.push(op.a);
   186	      else if (op.type === "add") adds.push(op.b);
   187	      else { // lenient-equal: close any open block first
   188	        if (dels.length || adds.length) { flushBlock(dels, adds); dels = []; adds = []; }
   189	        if (op.a.t === op.b.t) {
   190	          rows.push({ type: "equal", aNum: op.a.n, bNum: op.b.n, text: op.a.t });
   191	        } else {
   192	          // Lines matched only because an ignore option (whitespace/case) is on, yet
   193	          // their raw text differs → an UNIMPORTANT difference (BC's 3rd state).
   194	          minor++;
   195	          const words = diffWords(op.a.t, op.b.t, opts);
   196	          rows.push({
   197	            type: "minor", aNum: op.a.n, bNum: op.b.n,
   198	            aText: op.a.t, bText: op.b.t, words: words,
   199	            aWords: words.filter((w) => w.type !== "add"),
   200	            bWords: words.filter((w) => w.type !== "del"),
   201	          });
   202	        }
   203	      }
   204	    }
   205	    if (dels.length || adds.length) flushBlock(dels, adds);
   206	    const moved = detectMoves(rows);
   207	    const identical = added === 0 && removed === 0 && minor === 0;
   208	    const onlyMinor = added === 0 && removed === 0 && minor > 0;
   209	    return { rows, stats: { added, removed, minor, moved, identical, onlyMinor, aLines: rawA, bLines: rawB } };
   210	  }
   211	
   212	  // A line is "movable" (worth move-detecting) only if it's non-trivial: long enough
   213	  // and containing an alphanumeric char. This keeps lines like "}", ");", "" or "---"
   214	  // from being matched all over the place and producing noise.
   215	  function isMovable(text) {
   216	    const s = text.trim();
   217	    return s.length >= 3 && /[A-Za-z0-9]/.test(s);
   218	  }
   219	
   220	  // Detect moved lines: a pure-deletion line whose EXACT text reappears as a pure
   221	  // addition elsewhere is annotated on both sides (r.moved + r.movePartnerNum = the
   222	  // partner's source line number) so the UI can show "moved from/to line N" instead
   223	  // of an unrelated delete + add. Conservative: exact text match, non-trivial lines,
   224	  // each add claimed once. Returns the number of moved pairs.
   225	  function detectMoves(rows) {
   226	    const addsByText = new Map();
   227	    for (const r of rows) {
   228	      if (r.type === "add" && isMovable(r.text)) {
   229	        const list = addsByText.get(r.text);
   230	        if (list) list.push(r); else addsByText.set(r.text, [r]);
   231	      }
   232	    }
   233	    if (addsByText.size === 0) return 0;
   234	    let moved = 0;
   235	    const used = new Set();
   236	    for (const r of rows) {
   237	      if (r.type !== "del" || !isMovable(r.text)) continue;
   238	      const list = addsByText.get(r.text);
   239	      if (!list) continue;
   240	      const partner = list.find((x) => !used.has(x));

exec
/bin/zsh -lc "nl -ba diff.js | sed -n '240,380p'" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
   240	      const partner = list.find((x) => !used.has(x));
   241	      if (!partner) continue;
   242	      used.add(partner);
   243	      r.moved = true; r.movePartnerNum = partner.bNum;
   244	      partner.moved = true; partner.movePartnerNum = r.aNum;
   245	      moved++;
   246	    }
   247	    return moved;
   248	  }
   249	
   250	  // --- export helpers (pure, unit-testable) ------------------------------------
   251	  // Build a standard unified diff (git-style) from two texts. Reuses compare() so
   252	  // the same ignore options apply. `context` controls surrounding context lines.
   253	  // Returns "" when the inputs are identical (under the chosen options).
   254	  function toUnifiedDiff(textA, textB, options, fmtOpts) {
   255	    fmtOpts = fmtOpts || {};
   256	    const context = fmtOpts.context == null ? 3 : Math.max(0, fmtOpts.context | 0);
   257	    const aLabel = fmtOpts.aLabel || "Original";
   258	    const bLabel = fmtOpts.bLabel || "Changed";
   259	    const out = compare(textA, textB, options);
   260	    if (out.stats.identical) return "";
   261	    // A unified diff must APPLY to the raw files. ignoreBlankLines filters lines out
   262	    // of the compare stream entirely, which breaks the sequential renumbering below
   263	    // (it assumes every source line appears exactly once) — hunk headers drift and
   264	    // blank context lines vanish, so `git apply` rejects the patch. Keep the
   265	    // "identical?" judgment on the user's options (UI semantics unchanged), but build
   266	    // the patch body from an unfiltered compare: blank-line differences ride along as
   267	    // real -/+ lines, which is the price of a patch that actually applies.
   268	    const body = options && options.ignoreBlankLines
   269	      ? compare(textA, textB, Object.assign({}, options, { ignoreBlankLines: false }))
   270	      : out;
   271	
   272	    // Flatten display rows into tagged single lines: ' ' (context), '-' (del), '+' (add).
   273	    const joinW = (ws) => ws.map((w) => w.text).join("");
   274	    const entries = [];
   275	    for (const r of body.rows) {
   276	      if (r.type === "equal") entries.push({ tag: " ", text: r.text });
   277	      else if (r.type === "del") entries.push({ tag: "-", text: r.text });
   278	      else if (r.type === "add") entries.push({ tag: "+", text: r.text });
   279	      else if (r.type === "change") {
   280	        entries.push({ tag: "-", text: joinW(r.aWords) });
   281	        entries.push({ tag: "+", text: joinW(r.bWords) });
   282	      } else if (r.type === "minor") {
   283	        // Matched only under an ignore option but raw text differs — show the raw change.
   284	        entries.push({ tag: "-", text: r.aText });
   285	        entries.push({ tag: "+", text: r.bText });
   286	      }
   287	    }
   288	
   289	    // Assign 1-based source line numbers as we walk: ' ' advances both, '-' a-only,
   290	    // '+' b-only.
   291	    let an = 0, bn = 0;
   292	    for (const e of entries) {
   293	      if (e.tag !== "+") e.a = ++an; else e.a = null;
   294	      if (e.tag !== "-") e.b = ++bn; else e.b = null;
   295	    }
   296	
   297	    // Group changed lines into hunks, padding each side with `context` lines and
   298	    // merging groups whose contexts touch.
   299	    const changed = [];
   300	    for (let i = 0; i < entries.length; i++) if (entries[i].tag !== " ") changed.push(i);
   301	    if (!changed.length) return "";
   302	    const groups = [];
   303	    let gs = Math.max(0, changed[0] - context);
   304	    let ge = Math.min(entries.length - 1, changed[0] + context);
   305	    for (let k = 1; k < changed.length; k++) {
   306	      const idx = changed[k];
   307	      if (idx - context <= ge + 1) ge = Math.min(entries.length - 1, idx + context);
   308	      else { groups.push([gs, ge]); gs = Math.max(0, idx - context); ge = Math.min(entries.length - 1, idx + context); }
   309	    }
   310	    groups.push([gs, ge]);
   311	
   312	    const lines = ["--- a/" + aLabel, "+++ b/" + bLabel];
   313	    for (const [s, e] of groups) {
   314	      let aLen = 0, bLen = 0, aStart = 0, bStart = 0;
   315	      for (let i = s; i <= e; i++) {
   316	        const en = entries[i];
   317	        if (en.tag !== "+") { aLen++; if (!aStart) aStart = en.a; }
   318	        if (en.tag !== "-") { bLen++; if (!bStart) bStart = en.b; }
   319	      }
   320	      // Pure-addition / pure-deletion hunks: start is the preceding line (count before group).
   321	      if (aLen === 0) aStart = entries.slice(0, s).filter((x) => x.tag !== "+").length;
   322	      if (bLen === 0) bStart = entries.slice(0, s).filter((x) => x.tag !== "-").length;
   323	      lines.push("@@ -" + aStart + "," + aLen + " +" + bStart + "," + bLen + " @@");
   324	      for (let i = s; i <= e; i++) lines.push(entries[i].tag + entries[i].text);
   325	    }
   326	    return lines.join("\n") + "\n";
   327	  }
   328	
   329	  // Markdown export: a fenced ```diff block so it renders with red/green on GitHub
   330	  // and other Markdown viewers.
   331	  function toMarkdown(textA, textB, options, fmtOpts) {
   332	    const ud = toUnifiedDiff(textA, textB, options, fmtOpts);
   333	    if (!ud) return "";
   334	    return "```diff\n" + ud + "```\n";
   335	  }
   336	
   337	  // Collapse long runs of unchanged (equal) rows into a single foldable placeholder,
   338	  // keeping `context` unchanged rows next to each change so the diff stays readable on
   339	  // large, mostly-identical inputs. Pure: returns a NEW array whose items are either an
   340	  // original row or { type:"fold", count, key, hidden:[rows] }. Runs shorter than
   341	  // `minFold` are left expanded (folding them would only add clutter). Only "equal"
   342	  // rows fold; "minor" rows (and all real changes) are always kept visible.
   343	  function foldRows(rows, context, minFold) {
   344	    context = context == null ? 3 : Math.max(0, context | 0);
   345	    minFold = minFold == null ? 10 : Math.max(1, minFold | 0);
   346	    const n = rows.length;
   347	    const keep = new Array(n).fill(false);
   348	    for (let i = 0; i < n; i++) {
   349	      if (rows[i].type !== "equal") {
   350	        keep[i] = true;
   351	        for (let d = 1; d <= context; d++) {
   352	          if (i - d >= 0) keep[i - d] = true;
   353	          if (i + d < n) keep[i + d] = true;
   354	        }
   355	      }
   356	    }
   357	    const out = [];
   358	    let i = 0;
   359	    while (i < n) {
   360	      if (keep[i]) { out.push(rows[i]); i++; continue; }
   361	      let j = i;
   362	      while (j < n && !keep[j]) j++;
   363	      const run = rows.slice(i, j);
   364	      if (run.length >= minFold) {
   365	        const f = run[0];
   366	        out.push({ type: "fold", count: run.length, hidden: run,
   367	          key: "f" + (f.aNum || 0) + "_" + (f.bNum || 0) + "_" + run.length });
   368	      } else {
   369	        for (const r of run) out.push(r);
   370	      }
   371	      i = j;
   372	    }
   373	    return out;
   374	  }
   375	
   376	  root.ClearDiff = { compare, diffWords, toUnifiedDiff, toMarkdown, foldRows };
   377	})(typeof window !== "undefined" ? window : globalThis);

exec
/bin/zsh -lc "nl -ba tests/unified-blank-test.mjs | sed -n '1,220p'" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
     1	// Regression tests for fixes/2026-07-18-unified-blank-lines.md —
     2	// unified diff export must produce APPLYABLE patches when ignoreBlankLines is on.
     3	// Root cause under test: export path inherited line-filtering compare options,
     4	// breaking the "every source line appears once" premise of sequential numbering.
     5	import { readFileSync } from "node:fs";
     6	import { fileURLToPath } from "node:url";
     7	import { dirname, join } from "node:path";
     8	import vm from "node:vm";
     9	
    10	const here = dirname(fileURLToPath(import.meta.url));
    11	const src = readFileSync(join(here, "..", "diff.js"), "utf8");
    12	vm.runInThisContext(src);
    13	const { toUnifiedDiff, compare } = globalThis.ClearDiff;
    14	
    15	let pass = 0, fail = 0;
    16	function ok(cond, msg) { if (cond) pass++; else { fail++; console.error("✗ " + msg); } }
    17	
    18	// Pure patch validity checker: every context(' ') and del('-') line the hunk
    19	// claims must equal the REAL line at the claimed 1-based position in source A.
    20	// This is exactly what `git apply` enforces (no fuzz).
    21	function patchAppliesTo(patch, textA) {
    22	  if (patch === "") return true;
    23	  const aLines = textA.split(/\r\n|\r|\n/);
    24	  const lines = patch.split("\n");
    25	  let aPos = null;
    26	  for (const ln of lines) {
    27	    const h = ln.match(/^@@ -(\d+),(\d+) \+(\d+),(\d+) @@/);
    28	    if (h) { aPos = parseInt(h[1], 10); continue; }
    29	    if (aPos === null) continue;
    30	    if (ln.startsWith(" ") || ln.startsWith("-")) {
    31	      if (aLines[aPos - 1] !== ln.slice(1)) return false;
    32	      aPos++;
    33	    }
    34	  }
    35	  return true;
    36	}
    37	
    38	// Sanity: the checker itself must pass a known-good patch and fail a corrupted one
    39	// (judge self-validation: green on original, red on deliberately broken).
    40	(() => {
    41	  const goodA = "a\nb\nc";
    42	  const good = toUnifiedDiff(goodA, "a\nB\nc", null, { context: 1 });
    43	  ok(patchAppliesTo(good, goodA), "checker: green on a known-good patch");
    44	  const broken = good.replace("@@ -1,3", "@@ -2,3");
    45	  ok(!patchAppliesTo(broken, goodA), "checker: red on a deliberately mis-numbered patch");
    46	})();
    47	
    48	// THE BUG (red before fix): blank-line-bearing files + ignoreBlankLines.
    49	(() => {
    50	  const a = "alpha\n\nbravo\ncharlie";
    51	  const b = "alpha\n\ndelta\ncharlie";
    52	  const p = toUnifiedDiff(a, b, { ignoreBlankLines: true }, { context: 1 });
    53	  ok(patchAppliesTo(p, a), "ignoreBlankLines patch applies to the ORIGINAL file (single blank)");
    54	})();
    55	
    56	(() => {
    57	  const a = ["# title", "", "para one", "", "para two", "", "para three", "", "tail"].join("\n");
    58	  const b = a.replace("para two", "para 2!!");
    59	  const p = toUnifiedDiff(a, b, { ignoreBlankLines: true }, { context: 2 });
    60	  ok(patchAppliesTo(p, a), "ignoreBlankLines patch applies (markdown-like, blank-dense)");
    61	})();
    62	
    63	// Guard the EXISTING semantic (diff-test.mjs:55): blank-only difference under
    64	// ignoreBlankLines stays "identical" → export stays "" — the fix must not break this.
    65	(() => {
    66	  const p = toUnifiedDiff("a\n\n\nb", "a\nb", { ignoreBlankLines: true }, { context: 1 });
    67	  ok(p === "", "blank-only diff with ignoreBlankLines still exports empty patch");
    68	})();
    69	
    70	console.log(`\n${pass} passed, ${fail} failed`);
    71	if (fail > 0) process.exit(1);

exec
/bin/zsh -lc "nl -ba tests/diff-test.mjs | sed -n '1,220p'" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
     1	// DiffLens engine unit tests — dependency-free, run with: node tests/diff-test.mjs
     2	// diff.js is a plain script that attaches ClearDiff to globalThis; load it by eval.
     3	import { readFileSync } from "node:fs";
     4	import { fileURLToPath } from "node:url";
     5	import { dirname, join } from "node:path";
     6	import vm from "node:vm";
     7	
     8	const here = dirname(fileURLToPath(import.meta.url));
     9	const src = readFileSync(join(here, "..", "diff.js"), "utf8");
    10	vm.runInThisContext(src);
    11	const { compare, toUnifiedDiff, toMarkdown, foldRows } = globalThis.ClearDiff;
    12	
    13	let pass = 0, fail = 0;
    14	function eq(actual, expected, msg) {
    15	  const a = JSON.stringify(actual), e = JSON.stringify(expected);
    16	  if (a === e) { pass++; }
    17	  else { fail++; console.error("✗ " + msg + "\n    expected: " + e + "\n    actual:   " + a); }
    18	}
    19	function ok(cond, msg) { if (cond) pass++; else { fail++; console.error("✗ " + msg); } }
    20	
    21	// --- compare(): stats ---
    22	(() => {
    23	  const out = compare("a\nb\nc", "a\nb\nc");
    24	  ok(out.stats.identical, "identical inputs report identical");
    25	  eq(out.stats.added, 0, "identical: 0 added");
    26	  eq(out.stats.removed, 0, "identical: 0 removed");
    27	})();
    28	
    29	(() => {
    30	  const out = compare("a\nb\nc", "a\nB\nc");
    31	  eq(out.stats.added, 1, "one changed line counts as 1 added");
    32	  eq(out.stats.removed, 1, "one changed line counts as 1 removed");
    33	  ok(!out.stats.identical, "changed inputs not identical");
    34	})();
    35	
    36	(() => {
    37	  const out = compare("a\nb", "a\nb\nc\nd");
    38	  eq(out.stats.added, 2, "two appended lines → 2 added");
    39	  eq(out.stats.removed, 0, "two appended lines → 0 removed");
    40	})();
    41	
    42	// --- compare(): ignore options ---
    43	(() => {
    44	  const out = compare("Hello", "hello", { ignoreCase: true });
    45	  ok(out.stats.onlyMinor, "case-only diff with ignoreCase → onlyMinor");
    46	  eq(out.stats.minor, 1, "case-only diff → 1 minor");
    47	})();
    48	
    49	(() => {
    50	  const out = compare("a  b", "a b", { ignoreWhitespace: true });
    51	  ok(out.stats.onlyMinor, "whitespace-only diff with ignoreWhitespace → onlyMinor");
    52	})();
    53	
    54	(() => {
    55	  const out = compare("a\n\n\nb", "a\nb", { ignoreBlankLines: true });
    56	  ok(out.stats.identical, "blank-line-only diff with ignoreBlankLines → identical");
    57	})();
    58	
    59	// --- compare(): line numbers preserved with ignoreBlankLines ---
    60	(() => {
    61	  const out = compare("a\n\nb", "a\n\nc", { ignoreBlankLines: true });
    62	  const change = out.rows.find((r) => r.type === "change");
    63	  ok(change && change.aNum === 3 && change.bNum === 3, "source line numbers survive ignoreBlankLines (line 3)");
    64	})();
    65	
    66	// --- move detection ---
    67	(() => {
    68	  // A distinctive line moved from the top to the bottom.
    69	  const a = "function moveMe() { return 42; }\nkeep1\nkeep2\nkeep3";
    70	  const b = "keep1\nkeep2\nkeep3\nfunction moveMe() { return 42; }";
    71	  const out = compare(a, b);
    72	  eq(out.stats.moved, 1, "a relocated distinctive line is detected as 1 move");
    73	  const del = out.rows.find((r) => r.type === "del" && r.moved);
    74	  const add = out.rows.find((r) => r.type === "add" && r.moved);
    75	  ok(del && add, "both sides of the move are annotated");
    76	  ok(del.movePartnerNum === add.bNum && add.movePartnerNum === del.aNum, "move partners point at each other's line numbers");
    77	})();
    78	
    79	(() => {
    80	  // A trivial line (just "}") relocating between unchanged context is NOT a move.
    81	  const a = "alpha\n}\nbeta";
    82	  const b = "alpha\nbeta\n}";
    83	  const out = compare(a, b);
    84	  eq(out.stats.moved, 0, "a relocated trivial line (}) is not counted as a move");
    85	})();
    86	
    87	(() => {
    88	  // No moves when nothing relocates.
    89	  const out = compare("alpha\nbeta", "alpha\ngamma");
    90	  eq(out.stats.moved, 0, "ordinary edits report 0 moves");
    91	})();
    92	
    93	(() => {
    94	  // Two distinct lines swap places → two moves.
    95	  const a = "first distinct line\nmiddle\nsecond distinct line";
    96	  const b = "second distinct line\nmiddle\nfirst distinct line";
    97	  const out = compare(a, b);
    98	  eq(out.stats.moved, 2, "swapping two distinctive lines yields 2 moves");
    99	})();
   100	
   101	// --- toUnifiedDiff() ---
   102	(() => {
   103	  eq(toUnifiedDiff("a\nb", "a\nb"), "", "identical → empty unified diff");
   104	})();
   105	
   106	(() => {
   107	  const ud = toUnifiedDiff("a\nb\nc", "a\nB\nc", null, { context: 1 });
   108	  const lines = ud.split("\n");
   109	  eq(lines[0], "--- a/Original", "unified header line 1");
   110	  eq(lines[1], "+++ b/Changed", "unified header line 2");
   111	  ok(lines.some((l) => l === "@@ -1,3 +1,3 @@"), "hunk header with context spans the changed line");
   112	  ok(lines.includes("-b"), "removed line present");
   113	  ok(lines.includes("+B"), "added line present");
   114	  ok(lines.includes(" a") && lines.includes(" c"), "context lines present");
   115	})();
   116	
   117	(() => {
   118	  // pure addition at end
   119	  const ud = toUnifiedDiff("a\nb", "a\nb\nc", null, { context: 3 });
   120	  ok(ud.includes("+c"), "appended line shows as +c");
   121	  ok(/@@ -\d+,\d+ \+\d+,\d+ @@/.test(ud), "valid hunk header for pure addition");
   122	})();
   123	
   124	(() => {
   125	  // two separate change regions → two hunks
   126	  const a = Array.from({ length: 20 }, (_, i) => "line" + i).join("\n");
   127	  const bArr = a.split("\n"); bArr[1] = "CHANGED1"; bArr[18] = "CHANGED2";
   128	  const ud = toUnifiedDiff(a, bArr.join("\n"), null, { context: 2 });
   129	  const hunks = ud.split("\n").filter((l) => l.startsWith("@@"));
   130	  eq(hunks.length, 2, "distant changes produce two separate hunks");
   131	})();
   132	
   133	(() => {
   134	  // hunk line counts are internally consistent
   135	  const ud = toUnifiedDiff("x\na\nb\nc\ny", "x\na\nB\nc\ny", null, { context: 1 });
   136	  const lines = ud.split("\n");
   137	  const hdr = lines.find((l) => l.startsWith("@@"));
   138	  const m = hdr.match(/@@ -\d+,(\d+) \+\d+,(\d+) @@/);
   139	  const aLen = +m[1], bLen = +m[2];
   140	  const body = lines.slice(lines.indexOf(hdr) + 1).filter((l) => l && !l.startsWith("@@"));
   141	  const aCount = body.filter((l) => l.startsWith(" ") || l.startsWith("-")).length;
   142	  const bCount = body.filter((l) => l.startsWith(" ") || l.startsWith("+")).length;
   143	  eq(aCount, aLen, "hunk -count matches actual a-side lines");
   144	  eq(bCount, bLen, "hunk +count matches actual b-side lines");
   145	})();
   146	
   147	// --- toMarkdown() ---
   148	(() => {
   149	  const md = toMarkdown("a\nb", "a\nB");
   150	  ok(md.startsWith("```diff\n"), "markdown opens a diff fence");
   151	  ok(md.trimEnd().endsWith("```"), "markdown closes the fence");
   152	  ok(md.includes("-b") && md.includes("+B"), "markdown carries the change");
   153	  eq(toMarkdown("a", "a"), "", "identical → empty markdown");
   154	})();
   155	
   156	// --- round-trip: applying the unified diff's +sides reconstructs B (sanity) ---
   157	(() => {
   158	  const A = "one\ntwo\nthree\nfour", B = "one\nTWO\nthree\nfour\nfive";
   159	  const ud = toUnifiedDiff(A, B, null, { context: 3 });
   160	  // crude reconstruct: walk hunks, emit context + added lines for the changed region,
   161	  // here we just assert every B line appears on a ' ' or '+' line.
   162	  const emitted = ud.split("\n").filter((l) => l.startsWith(" ") || l.startsWith("+")).map((l) => l.slice(1));
   163	  for (const line of B.split("\n")) ok(emitted.includes(line), "B line reproduced in diff: " + JSON.stringify(line));
   164	})();
   165	
   166	// --- foldRows() ---
   167	(() => {
   168	  // 30 identical lines + one change in the middle.
   169	  const lines = Array.from({ length: 30 }, (_, i) => "L" + i);
   170	  const a = lines.join("\n");
   171	  const b2 = lines.slice(); b2[15] = "CHANGED";
   172	  const out = compare(a, b2.join("\n"));
   173	  const folded = foldRows(out.rows, 3, 10);
   174	  const folds = folded.filter((r) => r.type === "fold");
   175	  eq(folds.length, 2, "one change in a long file → two fold blocks (before & after)");
   176	  // The changed row and 3 context rows on each side stay visible.
   177	  ok(folded.some((r) => r.type === "change"), "the change itself is never folded");
   178	  // Folds + visible rows must reconstruct exactly the original rows.
   179	  const rebuilt = folded.flatMap((r) => (r.type === "fold" ? r.hidden : [r]));
   180	  eq(rebuilt.length, out.rows.length, "expanding all folds restores every row");
   181	  ok(folds.every((f) => f.count === f.hidden.length), "fold count matches hidden rows");
   182	  ok(folds.every((f) => typeof f.key === "string" && f.key.length > 1), "each fold has a stable key");
   183	})();
   184	
   185	(() => {
   186	  // Short unchanged runs are not worth folding.
   187	  const out = compare("a\nb\nc\nx", "a\nb\nc\ny");
   188	  const folded = foldRows(out.rows, 3, 10);
   189	  eq(folded.filter((r) => r.type === "fold").length, 0, "short runs are left expanded");
   190	})();
   191	
   192	(() => {
   193	  // No changes at all → nothing to anchor on → whole body folds if long enough.
   194	  const same = Array.from({ length: 30 }, (_, i) => "S" + i).join("\n");
   195	  const out = compare(same, same);
   196	  ok(out.stats.identical, "identical long inputs are identical");
   197	})();
   198	
   199	(() => {
   200	  // Stable keys: same input folds to the same keys twice (so expand state survives re-render).
   201	  const lines = Array.from({ length: 40 }, (_, i) => "K" + i);
   202	  const b2 = lines.slice(); b2[20] = "Z";
   203	  const out = compare(lines.join("\n"), b2.join("\n"));
   204	  const k1 = foldRows(out.rows, 3, 10).filter((r) => r.type === "fold").map((r) => r.key);
   205	  const k2 = foldRows(out.rows, 3, 10).filter((r) => r.type === "fold").map((r) => r.key);
   206	  eq(k1, k2, "fold keys are deterministic across calls");
   207	})();
   208	
   209	console.log("\n" + pass + " passed, " + fail + " failed");
   210	process.exit(fail ? 1 : 0);

codex
代码路径已经基本读完。接下来跑新增测试、核心单测，再补几组我关心的组合场景：纯增删、`ignoreCase`/`ignoreWhitespace` 联动、以及 `toMarkdown` 透传。
exec
/bin/zsh -lc 'node tests/diff-test.mjs' in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:

48 passed, 0 failed

exec
/bin/zsh -lc 'node tests/unified-blank-test.mjs' in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:

5 passed, 0 failed

codex
新增测试和现有单测都过了。我再补自定义场景，但这里不能用临时 here-doc，我改成纯 `node -e` 方式直接跑，避免把环境限制误当成代码结论。
exec
/bin/zsh -lc "node -e 'const fs=require(\"fs\"),vm=require(\"vm\");vm.runInThisContext(fs.readFileSync(\"diff.js\",\"utf8\"));const {toUnifiedDiff,toMarkdown,compare}=globalThis.ClearDiff;function applies(patch,a){if(patch===\"\")return true;const A=a.split(/\\r\\n|\\r|\\n/),lines=patch.split(\"\\n\");let pos=null;for(const ln of lines){const h=ln.match(/"'^@@ -('"\\d+),(\\d+) \\+(\\d+),(\\d+) @@/);if(h){pos=+h[1];continue;}if(pos===null)continue;if(ln.startsWith(\" \")||ln.startsWith(\"-\")){if(A[pos-1]"'!==ln.slice(1))return false;pos++;}}return true;}function countsOk(patch){const lines=patch.split("'"\\n\");for(let i=0;i<lines.length;i++){const m=lines[i].match(/"'^@@ -('"\\d+),(\\d+) \\+(\\d+),(\\d+) @@/);if("'!m)continue;const aLen=+m[2],bLen=+m[4];let a=0,b=0;for(i=i+1;i<lines.length&&!lines[i].startsWith("@@");i++){const ln=lines[i];if(!ln)continue;if(ln[0]===" "||ln[0]==="-")a++;if(ln[0]===" "||ln[0]==="+")b++;}i--;if(a!==aLen||b!==bLen)return false;}return true;}const cases=[["replace around blank","a'"\\n\\nb\\nc\",\"a\\n\\nB\\nc\",{ignoreBlankLines:true},{context:1},false],[\"insert around blank\",\"a\\n\\nb\\nc\",\"a\\n\\nX\\nb\\nc\",{ignoreBlankLines:true},{context:1},false],[\"delete around blank\",\"a\\n\\nX\\nb\\nc\",\"a\\n\\nb\\nc\",{ignoreBlankLines:true},{context:1},false],[\"case+blank\",\"a\\n\\nHello\\nc\",\"a\\n\\nhello\\nc\",{ignoreBlankLines:true,ignoreCase:true},{context:1},false],[\"ws+blank\",\"a\\n\\nx  y\\nc\",\"a\\n\\nx y\\nc\",{ignoreBlankLines:true,ignoreWhitespace:true},{context:1},false],[\"blank-only identical\",\"a\\n\\n\\nb\",\"a\\nb\",{ignoreBlankLines:true},{context:1},false],[\"toMarkdown replace\",\"a\\n\\nb\\nc\",\"a\\n\\nB\\nc\",{ignoreBlankLines:true},{context:1},true]];for(const [name,a,b,opts,fmt,md] of cases){const out=md?toMarkdown(a,b,opts,fmt):toUnifiedDiff(a,b,opts,fmt);const ud=md?out.slice(8,-4):out;console.log(name, JSON.stringify({empty:out===\"\", applies:applies(ud,a), counts:countsOk(ud), identical:compare(a,b,opts).stats.identical}));}'" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
replace around blank {"empty":false,"applies":true,"counts":true,"identical":false}
insert around blank {"empty":false,"applies":true,"counts":true,"identical":false}
delete around blank {"empty":false,"applies":true,"counts":true,"identical":false}
case+blank {"empty":false,"applies":true,"counts":true,"identical":false}
ws+blank {"empty":false,"applies":true,"counts":true,"identical":false}
blank-only identical {"empty":true,"applies":true,"counts":true,"identical":true}
toMarkdown replace {"empty":false,"applies":true,"counts":true,"identical":false}

exec
/bin/zsh -lc 'rg --files .omx' in /Users/zero/MyCode/diff-lens
 exited 2 in 0ms:
rg: .omx: IO error for operation on .omx: No such file or directory (os error 2)

exec
/bin/zsh -lc 'rg -n "2026-07-18-unified-blank-lines|unified-blank|ignoreBlankLines" .omx docs tests' in /Users/zero/MyCode/diff-lens
 exited 2 in 0ms:
rg: .omx: No such file or directory (os error 2)
tests/diff-test.mjs:55:  const out = compare("a\n\n\nb", "a\nb", { ignoreBlankLines: true });
tests/diff-test.mjs:56:  ok(out.stats.identical, "blank-line-only diff with ignoreBlankLines → identical");
tests/diff-test.mjs:59:// --- compare(): line numbers preserved with ignoreBlankLines ---
tests/diff-test.mjs:61:  const out = compare("a\n\nb", "a\n\nc", { ignoreBlankLines: true });
tests/diff-test.mjs:63:  ok(change && change.aNum === 3 && change.bNum === 3, "source line numbers survive ignoreBlankLines (line 3)");
tests/unified-blank-test.mjs:1:// Regression tests for fixes/2026-07-18-unified-blank-lines.md —
tests/unified-blank-test.mjs:2:// unified diff export must produce APPLYABLE patches when ignoreBlankLines is on.
tests/unified-blank-test.mjs:48:// THE BUG (red before fix): blank-line-bearing files + ignoreBlankLines.
tests/unified-blank-test.mjs:52:  const p = toUnifiedDiff(a, b, { ignoreBlankLines: true }, { context: 1 });
tests/unified-blank-test.mjs:53:  ok(patchAppliesTo(p, a), "ignoreBlankLines patch applies to the ORIGINAL file (single blank)");
tests/unified-blank-test.mjs:59:  const p = toUnifiedDiff(a, b, { ignoreBlankLines: true }, { context: 2 });
tests/unified-blank-test.mjs:60:  ok(patchAppliesTo(p, a), "ignoreBlankLines patch applies (markdown-like, blank-dense)");
tests/unified-blank-test.mjs:64:// ignoreBlankLines stays "identical" → export stays "" — the fix must not break this.
tests/unified-blank-test.mjs:66:  const p = toUnifiedDiff("a\n\n\nb", "a\nb", { ignoreBlankLines: true }, { context: 1 });
tests/unified-blank-test.mjs:67:  ok(p === "", "blank-only diff with ignoreBlankLines still exports empty patch");

codex
我现在只剩测试可信度这一点要钉实：`patchAppliesTo` 会不会放过一个 `git apply` 会拒绝的坏补丁。如果会，它就不是安慰剂，但覆盖面确实有限。
exec
/bin/zsh -lc "node -e 'const fs=require(\"fs\"),vm=require(\"vm\");vm.runInThisContext(fs.readFileSync(\"diff.js\",\"utf8\"));const {toUnifiedDiff}=globalThis.ClearDiff;function patchAppliesTo(patch, textA){if(patch===\"\")return true;const aLines=textA.split(/\\r\\n|\\r|\\n/),lines=patch.split(\"\\n\");let aPos=null;for(const ln of lines){const h=ln.match(/"'^@@ -('"\\d+),(\\d+) \\+(\\d+),(\\d+) @@/);if(h){aPos=parseInt(h[1],10);continue;}if(aPos===null)continue;if(ln.startsWith(\" \")||ln.startsWith(\"-\")){if(aLines[aPos-1]"'!==ln.slice(1))return false;aPos++;}}return true;}const a="a'"\\nb\\nc\";const good=toUnifiedDiff(a,\"a\\nB\\nc\",null,{context:1});const badCount=good.replace(\"@@ -1,3 +1,3 @@\",\"@@ -1,99 +1,3 @@\");console.log(JSON.stringify({good:patchAppliesTo(good,a),badCount:patchAppliesTo(badCount,a),patch:badCount}));'" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
{"good":true,"badCount":true,"patch":"--- a/Original\n+++ b/Changed\n@@ -1,99 +1,3 @@\n a\n-b\n+B\n c\n"}

codex
**发现**
阻塞性问题：零发现。

非阻塞测试盲点有 1 个，在 [tests/unified-blank-test.mjs](/Users/zero/MyCode/diff-lens/tests/unified-blank-test.mjs:21)。`patchAppliesTo()` 只校验 A 侧上下文和删除行是否落在补丁声称的位置；它不校验 hunk 计数本身。具体场景：把一个已知好补丁的头从 `@@ -1,3 +1,3 @@` 改成 `@@ -1,99 +1,3 @@`，这个 helper 仍会返回 `true`。所以它不是安慰剂，但它也不等价于 `git apply`。

**逐项回答**
1. 根因是被正面修掉了，不是只治症状。证据在 [diff.js](/Users/zero/MyCode/diff-lens/diff.js:259)：`out = compare(..., options)` 仍只负责“按用户语义判断 identical”；真正导出补丁体时，如果 `ignoreBlankLines` 开启，会额外走一次 `compare(..., { ignoreBlankLines: false })` 作为 `body`。这样顺序重编号依赖的前提“每个原始源行都在流里恰好出现一次”恢复了，空行上下文也重新进入 hunk 体。

2. 防护网测试总体可信，但它测的是“补丁可对原文件落位”这个外部行为，不是直接断言根因。  
   - 不是安慰剂：它先做了自校验，已知好补丁为绿、故意错位补丁为红，见 [tests/unified-blank-test.mjs](/Users/zero/MyCode/diff-lens/tests/unified-blank-test.mjs:38)。  
   - 但它不是完整 `git apply` 替身：上面那种篡改 hunk 计数的坏补丁，它会放过。  
   - 就这次缺陷而言，这个测试仍然对症，因为历史红因子正是“空行被滤掉后 A 侧定位漂移”。另外现有 [tests/diff-test.mjs](/Users/zero/MyCode/diff-lens/tests/diff-test.mjs:133) 已经覆盖了统一 diff 的 hunk 计数一致性；我额外跑了 blank-line 场景的计数检查，也都通过。

3. 没看到新行为回归。  
   - `blank-only + ignoreBlankLines` 的 identical 语义保住了，因为 `return ""` 仍由原始 `out.stats.identical` 决定，见 [diff.js](/Users/zero/MyCode/diff-lens/diff.js:259) 和 [tests/unified-blank-test.mjs](/Users/zero/MyCode/diff-lens/tests/unified-blank-test.mjs:66)。  
   - `ignoreCase` / `ignoreWhitespace` 路径没有被一起改语义；这次只对 `ignoreBlankLines` 特判，见 [diff.js](/Users/zero/MyCode/diff-lens/diff.js:268)。我补跑了 `ignoreBlankLines+ignoreCase`、`ignoreBlankLines+ignoreWhitespace`、以及 blank 周围纯插入/纯删除场景，统一 diff 都可落位，计数也一致。

4. 波及面没有明显遗漏。  
   - `toMarkdown()` 只是透传 `toUnifiedDiff()`，见 [diff.js](/Users/zero/MyCode/diff-lens/diff.js:331)。我补测了 markdown 导出，底层 unified body 同样成立。  
   - `app.js` 只消费返回字符串，没有自己再解释 hunk，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:271) 到 [app.js](/Users/zero/MyCode/diff-lens/app.js:283)。  
   - `rg` 结果里没有别的调用点。

**验证**
`node tests/unified-blank-test.mjs` 通过，`5 passed, 0 failed`。  
`node tests/diff-test.mjs` 通过，`48 passed, 0 failed`。

**结论**
这版修复我会给 `approved`。唯一要保留的备注是：新增测试 helper 证明了“定位没漂”，但它本身不是完整的 `git apply` 模拟器。
tokens used
55,286
**发现**
阻塞性问题：零发现。

非阻塞测试盲点有 1 个，在 [tests/unified-blank-test.mjs](/Users/zero/MyCode/diff-lens/tests/unified-blank-test.mjs:21)。`patchAppliesTo()` 只校验 A 侧上下文和删除行是否落在补丁声称的位置；它不校验 hunk 计数本身。具体场景：把一个已知好补丁的头从 `@@ -1,3 +1,3 @@` 改成 `@@ -1,99 +1,3 @@`，这个 helper 仍会返回 `true`。所以它不是安慰剂，但它也不等价于 `git apply`。

**逐项回答**
1. 根因是被正面修掉了，不是只治症状。证据在 [diff.js](/Users/zero/MyCode/diff-lens/diff.js:259)：`out = compare(..., options)` 仍只负责“按用户语义判断 identical”；真正导出补丁体时，如果 `ignoreBlankLines` 开启，会额外走一次 `compare(..., { ignoreBlankLines: false })` 作为 `body`。这样顺序重编号依赖的前提“每个原始源行都在流里恰好出现一次”恢复了，空行上下文也重新进入 hunk 体。

2. 防护网测试总体可信，但它测的是“补丁可对原文件落位”这个外部行为，不是直接断言根因。  
   - 不是安慰剂：它先做了自校验，已知好补丁为绿、故意错位补丁为红，见 [tests/unified-blank-test.mjs](/Users/zero/MyCode/diff-lens/tests/unified-blank-test.mjs:38)。  
   - 但它不是完整 `git apply` 替身：上面那种篡改 hunk 计数的坏补丁，它会放过。  
   - 就这次缺陷而言，这个测试仍然对症，因为历史红因子正是“空行被滤掉后 A 侧定位漂移”。另外现有 [tests/diff-test.mjs](/Users/zero/MyCode/diff-lens/tests/diff-test.mjs:133) 已经覆盖了统一 diff 的 hunk 计数一致性；我额外跑了 blank-line 场景的计数检查，也都通过。

3. 没看到新行为回归。  
   - `blank-only + ignoreBlankLines` 的 identical 语义保住了，因为 `return ""` 仍由原始 `out.stats.identical` 决定，见 [diff.js](/Users/zero/MyCode/diff-lens/diff.js:259) 和 [tests/unified-blank-test.mjs](/Users/zero/MyCode/diff-lens/tests/unified-blank-test.mjs:66)。  
   - `ignoreCase` / `ignoreWhitespace` 路径没有被一起改语义；这次只对 `ignoreBlankLines` 特判，见 [diff.js](/Users/zero/MyCode/diff-lens/diff.js:268)。我补跑了 `ignoreBlankLines+ignoreCase`、`ignoreBlankLines+ignoreWhitespace`、以及 blank 周围纯插入/纯删除场景，统一 diff 都可落位，计数也一致。

4. 波及面没有明显遗漏。  
   - `toMarkdown()` 只是透传 `toUnifiedDiff()`，见 [diff.js](/Users/zero/MyCode/diff-lens/diff.js:331)。我补测了 markdown 导出，底层 unified body 同样成立。  
   - `app.js` 只消费返回字符串，没有自己再解释 hunk，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:271) 到 [app.js](/Users/zero/MyCode/diff-lens/app.js:283)。  
   - `rg` 结果里没有别的调用点。

**验证**
`node tests/unified-blank-test.mjs` 通过，`5 passed, 0 failed`。  
`node tests/diff-test.mjs` 通过，`48 passed, 0 failed`。

**结论**
这版修复我会给 `approved`。唯一要保留的备注是：新增测试 helper 证明了“定位没漂”，但它本身不是完整的 `git apply` 模拟器。
