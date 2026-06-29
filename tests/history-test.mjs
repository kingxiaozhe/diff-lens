// DiffLens history helpers unit tests — run with: node tests/history-test.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
vm.runInThisContext(readFileSync(join(here, "..", "history.js"), "utf8"));
const { preview, tooLarge, add, remove, MAX_ENTRIES } = globalThis.DiffLensHistory;

let pass = 0, fail = 0;
const eq = (a, e, m) => { if (JSON.stringify(a) === JSON.stringify(e)) pass++; else { fail++; console.error("✗ " + m + "\n    expected: " + JSON.stringify(e) + "\n    actual:   " + JSON.stringify(a)); } };
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("✗ " + m); } };

// preview
eq(preview("hello\nworld", "hello\nthere"), "hello → hello", "preview uses first non-empty line of each side");
eq(preview("\n\n  \nreal", "x"), "real → x", "preview skips blank/whitespace lines");
eq(preview("", ""), "(empty) → (empty)", "preview labels empty input");
ok(preview("x".repeat(80), "y").startsWith("x".repeat(40)), "preview truncates long first lines");
ok(preview("x".repeat(80), "y").includes("…"), "preview adds ellipsis when truncated");

// tooLarge
ok(!tooLarge("small", "small"), "small inputs are not too large");
ok(tooLarge("z".repeat(300 * 1024), "z".repeat(300 * 1024)), "huge inputs are flagged too large");

// add: front insertion + immutability
(() => {
  const a = [];
  const b = add(a, { id: "1", a: "x", b: "y" });
  eq(a.length, 0, "add does not mutate the input list");
  eq(b.length, 1, "add appends one entry");
  eq(b[0].id, "1", "newest entry is at the front");
  const c = add(b, { id: "2", a: "p", b: "q" });
  eq(c.map((e) => e.id), ["2", "1"], "subsequent add goes to the front");
})();

// add: dedupe identical A&B (moves it to front, no duplicate)
(() => {
  let list = [];
  list = add(list, { id: "1", a: "same", b: "same" });
  list = add(list, { id: "2", a: "other", b: "z" });
  list = add(list, { id: "3", a: "same", b: "same" });
  eq(list.length, 2, "re-saving the same A&B does not duplicate");
  eq(list[0].id, "3", "re-saved entry moves to the front");
  ok(!list.some((e) => e.id === "1"), "the old duplicate id is dropped");
})();

// add: cap at MAX_ENTRIES
(() => {
  let list = [];
  for (let i = 0; i < MAX_ENTRIES + 5; i++) list = add(list, { id: "id" + i, a: "a" + i, b: "b" + i });
  eq(list.length, MAX_ENTRIES, "list is capped at MAX_ENTRIES");
  eq(list[0].id, "id" + (MAX_ENTRIES + 4), "newest survives");
  ok(!list.some((e) => e.id === "id0"), "oldest is evicted");
})();

// remove
(() => {
  const list = [{ id: "a" }, { id: "b" }, { id: "c" }];
  eq(remove(list, "b").map((e) => e.id), ["a", "c"], "remove drops the matching id");
  eq(remove(list, "zzz").length, 3, "remove of a missing id is a no-op");
})();

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
