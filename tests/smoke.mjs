// DiffLens end-to-end smoke — loads compare.html in headless Chromium and drives
// the real UI. Run with: node tests/smoke.mjs
// (Chromium is provided by the environment via PLAYWRIGHT_BROWSERS_PATH.)
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
// Playwright may be a local dep or globally installed; try both.
function loadPlaywright() {
  const candidates = ["playwright", "/opt/node22/lib/node_modules/playwright"];
  for (const c of candidates) { try { return require(c); } catch { /* try next */ } }
  console.error("Playwright not found — install it or run unit tests with: node tests/diff-test.mjs");
  process.exit(2);
}
const { chromium } = loadPlaywright();

const here = dirname(fileURLToPath(import.meta.url));
const pageUrl = pathToFileURL(join(here, "..", "compare.html")).href;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("✗ " + m); } };

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(pageUrl);
  await page.waitForSelector("#result");

  // Type two differing texts and confirm a diff renders.
  await page.fill("#text-a", "one\ntwo\nthree");
  await page.fill("#text-b", "one\nTWO\nthree");
  await page.waitForFunction(() => document.querySelectorAll("#result .row").length > 0);
  ok((await page.locator("#result .row.change, #result .row.del, #result .row.add").count()) > 0, "renders a changed row");
  ok(/added/.test(await page.textContent("#stats")), "stats show an added count");

  // View switching.
  await page.click('[data-view="split"]');
  ok((await page.locator("#result .srow").count()) > 0, "split view renders side-by-side rows");
  await page.click('[data-view="inline"]');
  ok((await page.locator("#result .row").count()) > 0, "inline view renders rows");
  await page.click('[data-view="unified"]');

  // Difference navigation.
  ok(!(await page.locator("#nav-next").isDisabled()), "next-diff button enabled when diffs exist");

  // Export menu present and openable.
  await page.click("#export summary");
  ok(await page.locator("#copy-diff").isVisible(), "export menu reveals 'Copy unified diff'");
  ok(await page.locator("#dl-patch").isVisible(), "export menu reveals 'Download .patch'");
  await page.keyboard.press("Escape");
  ok(!(await page.locator("#copy-diff").isVisible()), "Escape closes the export menu");

  // Identical inputs report identical.
  await page.fill("#text-b", "one\ntwo\nthree");
  await page.waitForFunction(() => /identical/i.test(document.querySelector("#result").textContent));
  ok(/identical/i.test(await page.textContent("#result")), "identical inputs report identical");

  // Collapse unchanged: a long mostly-identical input should fold, and a band expands.
  const big = Array.from({ length: 40 }, (_, i) => "line" + i).join("\n");
  const bigB = big.split("\n"); bigB[20] = "CHANGED-LINE";
  await page.fill("#text-a", big);
  await page.fill("#text-b", bigB.join("\n"));
  await page.waitForFunction(() => document.querySelectorAll("#result .row.change").length > 0);
  const rowsBefore = await page.locator("#result .row").count();
  await page.check("#opt-fold");
  await page.waitForFunction(() => document.querySelectorAll("#result .foldbtn").length > 0);
  const rowsFolded = await page.locator("#result .row").count();
  ok(rowsFolded < rowsBefore, "collapsing hides rows (fewer rendered)");
  ok((await page.locator("#result .foldbtn").count()) >= 1, "a fold band is shown");
  ok((await page.locator("#result .row.change").count()) > 0, "the change stays visible while collapsed");
  // Expanding a band reveals more rows.
  await page.locator("#result .foldbtn").first().click();
  await page.waitForFunction((n) => document.querySelectorAll("#result .row").length > n, rowsFolded);
  ok((await page.locator("#result .row").count()) > rowsFolded, "expanding a band reveals hidden rows");
  await page.uncheck("#opt-fold");

  // Move detection: a relocated distinctive line is flagged as moved (not add/del).
  await page.fill("#text-a", "function relocateMe() { return 7; }\nkeepA\nkeepB\nkeepC");
  await page.fill("#text-b", "keepA\nkeepB\nkeepC\nfunction relocateMe() { return 7; }");
  await page.waitForFunction(() => document.querySelectorAll("#result .row.moved").length > 0);
  ok((await page.locator("#result .row.moved").count()) >= 2, "both sides of a move are marked .moved");
  ok((await page.locator("#result .movetag").count()) >= 2, "moved lines show a 'moved from/to' badge");
  ok(/moved/.test(await page.textContent("#stats")), "stats report a moved count");

  // Comparison history: save → restore → delete (in-memory without chrome storage).
  await page.fill("#text-a", "alpha\nbeta");
  await page.fill("#text-b", "alpha\nGAMMA");
  await page.click("#history summary");
  ok(await page.locator("#hist-save").isVisible(), "history menu opens");
  await page.click("#hist-save");
  await page.waitForSelector("#hist-list .hist-item");
  ok((await page.locator("#hist-list .hist-item").count()) === 1, "saving adds one history entry");
  ok(/alpha → alpha/.test(await page.textContent("#hist-list")), "history entry shows a preview");
  await page.fill("#text-a", "different");
  await page.fill("#text-b", "different too");
  await page.evaluate(() => { document.getElementById("history").open = true; });
  await page.click("#hist-list .hist-restore");
  await page.waitForFunction(() => document.getElementById("text-a").value === "alpha\nbeta");
  ok((await page.inputValue("#text-a")) === "alpha\nbeta", "restoring loads saved A");
  ok((await page.inputValue("#text-b")) === "alpha\nGAMMA", "restoring loads saved B");
  await page.evaluate(() => { document.getElementById("history").open = true; });
  await page.click("#hist-list .hist-del");
  await page.waitForSelector("#hist-list .hist-empty");
  ok((await page.locator("#hist-list .hist-item").count()) === 0, "deleting removes the entry");
  await page.keyboard.press("Escape");

  // Synchronized scrolling: scrolling one input pane moves the other.
  const many = Array.from({ length: 200 }, (_, i) => "row " + i).join("\n");
  await page.fill("#text-a", many);
  await page.fill("#text-b", many);
  await page.evaluate(() => {
    const a = document.getElementById("text-a");
    a.scrollTop = 300;
    a.dispatchEvent(new Event("scroll"));
  });
  await page.waitForFunction(() => document.getElementById("text-b").scrollTop > 0);
  const synced = await page.evaluate(() => {
    const a = document.getElementById("text-a"), b = document.getElementById("text-b");
    return Math.abs(a.scrollTop - b.scrollTop) < 2;
  });
  ok(synced, "scrolling input A scrolls input B to match");

  ok(errors.length === 0, "no uncaught page errors" + (errors.length ? ": " + errors.join("; ") : ""));
} finally {
  await browser.close();
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
