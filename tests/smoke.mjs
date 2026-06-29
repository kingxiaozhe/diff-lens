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

  ok(errors.length === 0, "no uncaught page errors" + (errors.length ? ": " + errors.join("; ") : ""));
} finally {
  await browser.close();
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
