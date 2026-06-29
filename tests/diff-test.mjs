// DiffLens engine unit tests — dependency-free, run with: node tests/diff-test.mjs
// diff.js is a plain script that attaches ClearDiff to globalThis; load it by eval.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "diff.js"), "utf8");
vm.runInThisContext(src);
const { compare, toUnifiedDiff, toMarkdown } = globalThis.ClearDiff;

let pass = 0, fail = 0;
function eq(actual, expected, msg) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; }
  else { fail++; console.error("✗ " + msg + "\n    expected: " + e + "\n    actual:   " + a); }
}
function ok(cond, msg) { if (cond) pass++; else { fail++; console.error("✗ " + msg); } }

// --- compare(): stats ---
(() => {
  const out = compare("a\nb\nc", "a\nb\nc");
  ok(out.stats.identical, "identical inputs report identical");
  eq(out.stats.added, 0, "identical: 0 added");
  eq(out.stats.removed, 0, "identical: 0 removed");
})();

(() => {
  const out = compare("a\nb\nc", "a\nB\nc");
  eq(out.stats.added, 1, "one changed line counts as 1 added");
  eq(out.stats.removed, 1, "one changed line counts as 1 removed");
  ok(!out.stats.identical, "changed inputs not identical");
})();

(() => {
  const out = compare("a\nb", "a\nb\nc\nd");
  eq(out.stats.added, 2, "two appended lines → 2 added");
  eq(out.stats.removed, 0, "two appended lines → 0 removed");
})();

// --- compare(): ignore options ---
(() => {
  const out = compare("Hello", "hello", { ignoreCase: true });
  ok(out.stats.onlyMinor, "case-only diff with ignoreCase → onlyMinor");
  eq(out.stats.minor, 1, "case-only diff → 1 minor");
})();

(() => {
  const out = compare("a  b", "a b", { ignoreWhitespace: true });
  ok(out.stats.onlyMinor, "whitespace-only diff with ignoreWhitespace → onlyMinor");
})();

(() => {
  const out = compare("a\n\n\nb", "a\nb", { ignoreBlankLines: true });
  ok(out.stats.identical, "blank-line-only diff with ignoreBlankLines → identical");
})();

// --- compare(): line numbers preserved with ignoreBlankLines ---
(() => {
  const out = compare("a\n\nb", "a\n\nc", { ignoreBlankLines: true });
  const change = out.rows.find((r) => r.type === "change");
  ok(change && change.aNum === 3 && change.bNum === 3, "source line numbers survive ignoreBlankLines (line 3)");
})();

// --- toUnifiedDiff() ---
(() => {
  eq(toUnifiedDiff("a\nb", "a\nb"), "", "identical → empty unified diff");
})();

(() => {
  const ud = toUnifiedDiff("a\nb\nc", "a\nB\nc", null, { context: 1 });
  const lines = ud.split("\n");
  eq(lines[0], "--- a/Original", "unified header line 1");
  eq(lines[1], "+++ b/Changed", "unified header line 2");
  ok(lines.some((l) => l === "@@ -1,3 +1,3 @@"), "hunk header with context spans the changed line");
  ok(lines.includes("-b"), "removed line present");
  ok(lines.includes("+B"), "added line present");
  ok(lines.includes(" a") && lines.includes(" c"), "context lines present");
})();

(() => {
  // pure addition at end
  const ud = toUnifiedDiff("a\nb", "a\nb\nc", null, { context: 3 });
  ok(ud.includes("+c"), "appended line shows as +c");
  ok(/@@ -\d+,\d+ \+\d+,\d+ @@/.test(ud), "valid hunk header for pure addition");
})();

(() => {
  // two separate change regions → two hunks
  const a = Array.from({ length: 20 }, (_, i) => "line" + i).join("\n");
  const bArr = a.split("\n"); bArr[1] = "CHANGED1"; bArr[18] = "CHANGED2";
  const ud = toUnifiedDiff(a, bArr.join("\n"), null, { context: 2 });
  const hunks = ud.split("\n").filter((l) => l.startsWith("@@"));
  eq(hunks.length, 2, "distant changes produce two separate hunks");
})();

(() => {
  // hunk line counts are internally consistent
  const ud = toUnifiedDiff("x\na\nb\nc\ny", "x\na\nB\nc\ny", null, { context: 1 });
  const lines = ud.split("\n");
  const hdr = lines.find((l) => l.startsWith("@@"));
  const m = hdr.match(/@@ -\d+,(\d+) \+\d+,(\d+) @@/);
  const aLen = +m[1], bLen = +m[2];
  const body = lines.slice(lines.indexOf(hdr) + 1).filter((l) => l && !l.startsWith("@@"));
  const aCount = body.filter((l) => l.startsWith(" ") || l.startsWith("-")).length;
  const bCount = body.filter((l) => l.startsWith(" ") || l.startsWith("+")).length;
  eq(aCount, aLen, "hunk -count matches actual a-side lines");
  eq(bCount, bLen, "hunk +count matches actual b-side lines");
})();

// --- toMarkdown() ---
(() => {
  const md = toMarkdown("a\nb", "a\nB");
  ok(md.startsWith("```diff\n"), "markdown opens a diff fence");
  ok(md.trimEnd().endsWith("```"), "markdown closes the fence");
  ok(md.includes("-b") && md.includes("+B"), "markdown carries the change");
  eq(toMarkdown("a", "a"), "", "identical → empty markdown");
})();

// --- round-trip: applying the unified diff's +sides reconstructs B (sanity) ---
(() => {
  const A = "one\ntwo\nthree\nfour", B = "one\nTWO\nthree\nfour\nfive";
  const ud = toUnifiedDiff(A, B, null, { context: 3 });
  // crude reconstruct: walk hunks, emit context + added lines for the changed region,
  // here we just assert every B line appears on a ' ' or '+' line.
  const emitted = ud.split("\n").filter((l) => l.startsWith(" ") || l.startsWith("+")).map((l) => l.slice(1));
  for (const line of B.split("\n")) ok(emitted.includes(line), "B line reproduced in diff: " + JSON.stringify(line));
})();

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
