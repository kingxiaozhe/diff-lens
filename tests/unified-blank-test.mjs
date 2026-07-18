// Regression tests for fixes/2026-07-18-unified-blank-lines.md —
// unified diff export must produce APPLYABLE patches when ignoreBlankLines is on.
// Root cause under test: export path inherited line-filtering compare options,
// breaking the "every source line appears once" premise of sequential numbering.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "diff.js"), "utf8");
vm.runInThisContext(src);
const { toUnifiedDiff, compare } = globalThis.ClearDiff;

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) pass++; else { fail++; console.error("✗ " + msg); } }

// Pure patch validity checker: every context(' ') and del('-') line the hunk
// claims must equal the REAL line at the claimed 1-based position in source A.
// This is exactly what `git apply` enforces (no fuzz).
function patchAppliesTo(patch, textA) {
  if (patch === "") return true;
  const aLines = textA.split(/\r\n|\r|\n/);
  const lines = patch.split("\n");
  let aPos = null, aLeft = null, bLeft = null;
  for (const ln of lines) {
    const h = ln.match(/^@@ -(\d+),(\d+) \+(\d+),(\d+) @@/);
    if (h) {
      if (aLeft !== null && (aLeft !== 0 || bLeft !== 0)) return false; // 上一 hunk 计数不符
      aPos = parseInt(h[1], 10); aLeft = parseInt(h[2], 10); bLeft = parseInt(h[4], 10);
      continue;
    }
    if (aPos === null) continue;
    if (ln.startsWith(" ") || ln.startsWith("-")) {
      if (aLeft <= 0) return false;                      // hunk 声称的 A 行数超支(r1 采纳:计数也要验)
      if (aLines[aPos - 1] !== ln.slice(1)) return false;
      aPos++; aLeft--;
    }
    if (ln.startsWith(" ") || ln.startsWith("+")) {
      if (bLeft <= 0) return false;
      bLeft--;
    }
  }
  return aLeft === null || (aLeft === 0 && bLeft === 0); // 末 hunk 计数收平
}

// Sanity: the checker itself must pass a known-good patch and fail a corrupted one
// (judge self-validation: green on original, red on deliberately broken).
(() => {
  const goodA = "a\nb\nc";
  const good = toUnifiedDiff(goodA, "a\nB\nc", null, { context: 1 });
  ok(patchAppliesTo(good, goodA), "checker: green on a known-good patch");
  const broken = good.replace("@@ -1,3", "@@ -2,3");
  ok(!patchAppliesTo(broken, goodA), "checker: red on a deliberately mis-numbered patch");
  const badCount = good.replace(/@@ -1,(\d+)/, "@@ -1,99");
  ok(!patchAppliesTo(badCount, goodA), "checker: red on a corrupted hunk COUNT (r1 采纳项)");
})();

// THE BUG (red before fix): blank-line-bearing files + ignoreBlankLines.
(() => {
  const a = "alpha\n\nbravo\ncharlie";
  const b = "alpha\n\ndelta\ncharlie";
  const p = toUnifiedDiff(a, b, { ignoreBlankLines: true }, { context: 1 });
  ok(patchAppliesTo(p, a), "ignoreBlankLines patch applies to the ORIGINAL file (single blank)");
})();

(() => {
  const a = ["# title", "", "para one", "", "para two", "", "para three", "", "tail"].join("\n");
  const b = a.replace("para two", "para 2!!");
  const p = toUnifiedDiff(a, b, { ignoreBlankLines: true }, { context: 2 });
  ok(patchAppliesTo(p, a), "ignoreBlankLines patch applies (markdown-like, blank-dense)");
})();

// Guard the EXISTING semantic (diff-test.mjs:55): blank-only difference under
// ignoreBlankLines stays "identical" → export stays "" — the fix must not break this.
(() => {
  const p = toUnifiedDiff("a\n\n\nb", "a\nb", { ignoreBlankLines: true }, { context: 1 });
  ok(p === "", "blank-only diff with ignoreBlankLines still exports empty patch");
})();

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
