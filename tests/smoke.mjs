// DiffLens end-to-end smoke — loads compare.html in headless Chromium and drives
// the real UI. Run with: node tests/smoke.mjs
// (Chromium is provided by the environment via PLAYWRIGHT_BROWSERS_PATH.)
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const require = createRequire(import.meta.url);
// Playwright may be a local dep or globally installed. Node doesn't resolve global
// packages, so ask npm where they live rather than hard-coding a machine path.
function loadPlaywright() {
  const candidates = ["playwright"];
  try { candidates.push(join(execSync("npm root -g", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(), "playwright")); } catch { /* npm missing */ }
  candidates.push("/opt/node22/lib/node_modules/playwright");
  for (const c of candidates) { try { return require(c); } catch { /* try next */ } }
  console.error("Playwright not found — install it (npm i -g playwright && npx playwright install chromium)");
  console.error("or run the dependency-free unit tests: node tests/diff-test.mjs");
  process.exit(2);
}
const { chromium } = loadPlaywright();

const here = dirname(fileURLToPath(import.meta.url));
const pageUrl = pathToFileURL(join(here, "..", "compare.html")).href;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error("✗ " + m); } };

// ── Privacy regression guard ────────────────────────────────────────────────
// The manifest IS the privacy story: no host_permissions and no network means no
// code path can exfiltrate text. README, STORE_LISTING and the privacy policy all
// promise this, and a promise no test enforces is one a refactor can quietly break.
//
// This runs FIRST, before a browser is even launched, and depends on nothing else.
// It used to sit at the bottom: any throw upstream — a 30s timeout in the storage
// block was enough — and the whole thing never executed, while the run still exited
// non-zero and looked like an ordinary failure. The most important assertion in the
// suite must not be the easiest one to skip.
{
  const manifest = JSON.parse(readFileSync(join(here, "..", "manifest.json"), "utf8"));
  const perms = [...(manifest.permissions || [])].sort();
  ok(JSON.stringify(perms) === JSON.stringify(["contextMenus", "storage"]),
    "manifest grants exactly storage + contextMenus (got: " + JSON.stringify(perms) + ")");

  // Every route out of the sandbox, not just the obvious one. A relaxed
  // connect-src would undo the whole promise as surely as a host permission.
  for (const field of ["host_permissions", "optional_permissions", "optional_host_permissions",
                       "content_scripts", "externally_connectable", "declarative_net_request",
                       "web_accessible_resources", "sandbox"]) {
    ok(!(field in manifest), "manifest declares no " + field);
  }
  const csp = JSON.stringify(manifest.content_security_policy || {});
  ok(!/https?:|\*/.test(csp), "manifest CSP opens no external origin (got: " + csp + ")");

  // Source files may not reach the network. Strip comments properly first: filtering
  // whole lines let `/* note */ var u = "https://evil.example"` through, and treated
  // a CSS `* { ... }` rule as a comment.
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[ \t])\/\/.*$/gm, "$1");
  // Protocol-relative only where a URL can actually sit — after a quote or `url(`.
  // A bare /\/\// matches every trailing comment in the file.
  const NET = /https?:\/\/|@import|["'(]\s*\/\/[a-z0-9-]/i;
  for (const f of ["compare.html", "app.css", "app.js", "diff.js", "history.js", "background.js", "ui-render.js", "ui-nav.js", "ui-export.js", "ui-history.js", "ui-file.js"]) {
    ok(!NET.test(strip(readFileSync(join(here, "..", f), "utf8"))), f + " contains no external URL");
  }
}

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

  // ── F-044 change-marker rail ──────────────────────────────────────────────
  // Three basics (pips render, click jumps, empty hides) plus the three ways
  // review found it could silently break: split view losing type semantics, a
  // wrap toggle dropping the current marker, and a resize leaving stale
  // positions. All three passed manual checks once — these keep them passing.
  const railA = Array.from({ length: 60 }, (_, i) =>
    (i % 9 === 0 ? "a much longer line that wraps once word wrap is on and the window is narrow enough ".repeat(3) + i : "pipline " + i)).join("\n");
  const railB = railA.replace("pipline 5", "PIPLINE 5").replace("pipline 20\n", "").replace("pipline 40", "pipline 40\npipline 40b");
  await page.fill("#text-a", railA);
  await page.fill("#text-b", railB);
  // The move test above already left pips behind — `length > 0` is true before the
  // debounced re-render lands. Wait for this comparison's exact pip count instead.
  await page.waitForFunction(() => document.querySelectorAll("#pip-rail .pip").length === 3);
  ok(await page.locator("#pip-rail").isVisible(), "rail shows when differences exist");
  ok(await page.evaluate(() =>
    document.querySelectorAll("#pip-rail .pip").length === document.querySelectorAll("#result .hstart").length),
    "one pip per hunk (.pip count equals .hstart count)");
  ok(await page.evaluate(() => {
    const p = document.querySelector("#pip-rail .pip");
    p.focus();
    return document.activeElement === p && p.tagName === "BUTTON" && !!p.getAttribute("aria-label");
  }), "pips are keyboard-focusable buttons with an aria-label");
  await page.click('#pip-rail .pip[data-pip="1"]');
  ok((await page.textContent("#nav-count")).trim() === "2 / 3", "clicking the 2nd pip shows '2 / 3'");
  ok((await page.locator("#result .jumped").count()) === 1, "clicking a pip outlines the target hunk");
  ok(await page.$eval("#pip-rail .pip.current", (p) => p.dataset.pip) === "1", "the clicked pip is marked current");
  // Split view: type semantics ride on data-htype, not on the srow's class list —
  // the one place a class-reading implementation quietly renders colourless pips.
  // Tag the current pips as stale first: same-looking classes on leftover DOM
  // would otherwise pass this without the switch ever rebuilding the rail.
  const markStale = () => page.evaluate(() =>
    document.querySelectorAll("#pip-rail .pip").forEach((p) => { p.dataset.stale = "1"; }));
  const railRebuilt = () => page.waitForFunction(() => {
    const ps = [...document.querySelectorAll("#pip-rail .pip")];
    return ps.length === 3 && !ps.some((p) => p.dataset.stale);
  });
  await markStale();
  await page.click('[data-view="split"]');
  await railRebuilt();
  const splitTypes = await page.$$eval("#pip-rail .pip",
    (ps) => ps.map((p) => ["add", "del", "change"].find((t) => p.classList.contains(t)) || "none").join(","));
  ok(splitTypes === "change,del,add", "split view keeps pip type semantics (got: " + splitTypes + ")");
  await markStale();
  await page.click('[data-view="unified"]');
  await railRebuilt();
  // Wrap only toggles a class — no re-render — so the rail must recompute on its
  // own, and the current marker must survive the rebuild.
  await page.click('#pip-rail .pip[data-pip="1"]');
  const wrappedTops = await page.$$eval("#pip-rail .pip", (ps) => ps.map((p) => p.style.top).join(","));
  await page.uncheck("#opt-wrap");
  await page.waitForTimeout(60);
  const unwrappedTops = await page.$$eval("#pip-rail .pip", (ps) => ps.map((p) => p.style.top).join(","));
  ok(unwrappedTops !== wrappedTops, "a wrap toggle recomputes pip positions");
  ok(await page.$eval("#pip-rail .pip.current", (p) => p.dataset.pip) === "1", "the current pip survives a wrap toggle");
  await page.check("#opt-wrap");
  await page.waitForTimeout(60);
  // A narrower window re-wraps every long line; stale percentages would point at
  // the wrong rows. 300ms comfortably clears the 120ms resize debounce.
  const originalViewport = page.viewportSize();
  const wideTops = await page.$$eval("#pip-rail .pip", (ps) => ps.map((p) => p.style.top).join(","));
  await page.setViewportSize({ width: 620, height: 720 });
  await page.waitForTimeout(300);
  const narrowTops = await page.$$eval("#pip-rail .pip", (ps) => ps.map((p) => p.style.top).join(","));
  ok(narrowTops !== wideTops, "a viewport resize recomputes pip positions");
  // Restore whatever this run started with — pinning a literal here would quietly
  // re-anchor every later geometry assertion to this block's choice of size.
  await page.setViewportSize(originalViewport);
  await page.waitForTimeout(300);
  await page.fill("#text-a", "same");
  await page.fill("#text-b", "same");
  await page.waitForFunction(() => document.getElementById("pip-rail").classList.contains("hidden"));
  ok(!(await page.locator("#pip-rail").isVisible()), "rail hides when the texts are identical");

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

  // The three placeholder states must be styled, not bare text. A regex on
  // textContent passes either way, so assert the box actually renders.
  await page.fill("#text-a", "");
  await page.fill("#text-b", "");
  await page.waitForSelector("#result .placeholder");
  const emptyBox = await page.evaluate(() => {
    const el = document.querySelector("#result .placeholder");
    const cs = getComputedStyle(el);
    return { h: el.getBoundingClientRect().height, place: cs.placeItems, big: !!el.querySelector(".big") };
  });
  ok(emptyBox.h >= 180, "empty state is a styled box, not bare text (height " + Math.round(emptyBox.h) + "px)");
  ok(emptyBox.big, "empty state has a .big headline");
  ok(emptyBox.place.includes("center"), "empty state is centred, not parked top-left (place-items: " + emptyBox.place + ")");
  await page.fill("#text-a", "same");
  await page.fill("#text-b", "same");
  await page.waitForSelector("#result .placeholder");
  ok((await page.locator("#result .placeholder").count()) === 1, "identical state reuses the styled placeholder");

  // History caps at 12 entries; the menu must scroll rather than grow past the
  // viewport, or the oldest entries become unreachable.
  await page.click("#history summary");
  for (let i = 0; i < 14; i++) {
    // Set values without clicking: a click in the panes would trip the
    // outside-click handler and close the menu we're measuring.
    await page.evaluate((n) => {
      document.getElementById("text-a").value = "entry " + n;
      document.getElementById("text-b").value = "changed " + n;
    }, i);
    await page.click("#hist-save");
  }
  const hist = await page.evaluate(() => {
    const box = document.getElementById("hist-list");
    return {
      items: box.querySelectorAll(".hist-item").length,
      scrolls: box.scrollHeight > box.clientHeight,
      bottom: box.getBoundingClientRect().bottom,
      vh: window.innerHeight,
    };
  });
  ok(hist.items === 12, "history caps at 12 entries (got " + hist.items + ")");
  ok(hist.scrolls, "history list scrolls instead of growing unbounded");
  ok(hist.bottom <= hist.vh, "history menu stays inside the viewport");
  await page.click("#history summary");

  ok(errors.length === 0, "no uncaught page errors" + (errors.length ? ": " + errors.join("; ") : ""));
} finally {
  await browser.close();
}

// ── chrome.storage round-trip ───────────────────────────────────────────────
// compare.html is opened over file://, where `chrome` is undefined and boot()
// returns early — so persist/persistOpts/boot/onChanged never ran under test.
// Stub the API to cover them: they own "panes and options survive a reopen" and
// "a right-click capture updates an already-open tab".
{
  const page = await (await chromium.launch()).newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  // The store lives in Node, not the page: a reload wipes page globals, and
  // surviving the reload is exactly what we're testing.
  const store = {};
  await page.exposeFunction("__put", (obj) => { Object.assign(store, obj); });
  await page.exposeFunction("__all", () => store);
  await page.addInitScript(() => {
    const listeners = [];
    window.chrome = {
      storage: {
        local: {
          set: (obj, cb) => {
            window.__put(obj).then(() => {
              const ch = {};
              for (const k in obj) ch[k] = { newValue: obj[k] };
              listeners.forEach((l) => l(ch, "local"));
              cb && cb();
            });
          },
          get: (keys, cb) => {
            window.__all().then((s) => {
              const out = {};
              for (const k of keys) if (k in s) out[k] = s[k];
              cb(out);
            });
          },
        },
        onChanged: { addListener: (l) => listeners.push(l) },
      },
    };
    window.__fire = (obj) => window.chrome.storage.local.set(obj);
    // Fire an onChanged for an arbitrary area, so the areaName guard is testable.
    window.__fireArea = (area, obj) => {
      const ch = {};
      for (const k in obj) ch[k] = { newValue: obj[k] };
      listeners.forEach((l) => l(ch, area));
    };
  });
  await page.goto(pageUrl);
  await page.waitForSelector("#result");

  // Write through the real UI, then reload and confirm boot() restores it all.
  // Every toggle, not a sample: boot() restores each one by hand, so each one is
  // its own chance to have been wired to the wrong id and silently lose a setting.
  const TOGGLES = ["opt-ws", "opt-blank", "opt-case", "opt-char", "opt-ws-show", "opt-fold"];
  await page.fill("#text-a", "alpha");
  await page.fill("#text-b", "beta");
  for (const t of TOGGLES) await page.check("#" + t);
  await page.uncheck("#opt-wrap");
  await page.click('[data-view="split"]');
  await page.click("#history summary");
  await page.click("#hist-save");
  await page.click("#history summary");
  await page.waitForTimeout(200);
  const saved = { ...store };
  await page.reload();
  await page.waitForSelector("#result");
  const restored = await page.evaluate((toggles) => ({
    a: document.getElementById("text-a").value,
    b: document.getElementById("text-b").value,
    on: toggles.filter((t) => document.getElementById(t).checked),
    wrap: document.getElementById("opt-wrap").checked,
    view: document.querySelector("[data-view].on")?.dataset.view,
    hist: document.querySelectorAll("#hist-list .hist-item").length,
  }), TOGGLES);
  ok(saved.textA === "alpha" && saved.textB === "beta", "panes are written to storage");
  ok(restored.a === "alpha" && restored.b === "beta", "panes are restored on reopen");
  ok(restored.on.length === TOGGLES.length,
    "every toggle is restored on reopen (missing: " + TOGGLES.filter((t) => !restored.on.includes(t)).join(", ") + ")");
  ok(restored.wrap === false, "an unchecked toggle stays unchecked on reopen");
  ok(restored.view === "split", "view is restored on reopen");
  ok(restored.hist === 1, "saved history survives a reopen");

  // A right-click capture elsewhere writes storage; an open tab must follow.
  const followed = await page.evaluate(async () => {
    window.__fire({ textA: "captured from a page" });
    for (let i = 0; i < 50 && document.getElementById("text-a").value !== "captured from a page"; i++)
      await new Promise((r) => setTimeout(r, 20));
    return document.getElementById("text-a").value;
  });
  ok(followed === "captured from a page", "an external storage write updates the open tab (got: " + JSON.stringify(followed) + ")");

  // Writes to other storage areas are not ours to act on — sync and managed would
  // otherwise stomp whatever the user has in the panes.
  const ignored = await page.evaluate(async () => {
    window.__fireArea("sync", { textA: "from another area" });
    await new Promise((r) => setTimeout(r, 150));
    return document.getElementById("text-a").value;
  });
  ok(ignored === "captured from a page", "a write to a non-local storage area is ignored (got: " + JSON.stringify(ignored) + ")");

  ok(errs.length === 0, "no page errors under the chrome stub" + (errs.length ? ": " + errs.join("; ") : ""));
  await page.context().browser().close();
}

// ── Nothing leaves the tab, observed rather than inferred ───────────────────
// The grep above is a first pass and no more: `"htt"+"ps://"+host` defeats it, and
// so does any URL assembled at runtime. Watch what the page actually asks for.
{
  const net = await chromium.launch();
  const page = await net.newPage();
  const external = [];
  await page.route("**", (route) => {
    const url = route.request().url();
    if (!/^(file|data|blob|about):/.test(url)) external.push(url);
    route.continue();
  });
  await page.goto(pageUrl);
  await page.waitForSelector("#result");
  await page.fill("#text-a", "alpha\nbeta");
  await page.fill("#text-b", "alpha\nGAMMA");
  await page.waitForFunction(() => document.querySelectorAll("#result .row").length > 0);
  await page.click('[data-view="split"]');
  await page.click("#history summary");
  await page.click("#hist-save");
  await page.waitForTimeout(200);
  ok(external.length === 0, "the page requests nothing off-device (saw: " + external.join(", ") + ")");
  await net.close();
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
