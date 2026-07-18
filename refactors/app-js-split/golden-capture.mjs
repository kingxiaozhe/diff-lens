// 差分层金样: 对固定输入集,在真实页面采集 result.innerHTML(逐字节基准)。
// 重构前跑一次生成 golden.json;重构后重跑,输出必须逐字节一致(diff-report 数据源)。
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
const require = createRequire(import.meta.url);
function loadPlaywright() {
  const candidates = ["playwright"];
  try { candidates.push(join(execSync("npm root -g", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(), "playwright")); } catch {}
  for (const c of candidates) { try { return require(c); } catch {} }
  console.error("Playwright not found"); process.exit(2);
}
const { chromium } = loadPlaywright();
const here = dirname(fileURLToPath(import.meta.url));
import { pathToFileURL } from "node:url";
const page_url = pathToFileURL(join(here, "..", "..", "compare.html")).href;
const CASES = [
  { name: "basic-change", a: "alpha\nbravo\ncharlie", b: "alpha\ndelta\ncharlie" },
  { name: "blank-ignore", a: "a\n\nb\nc", b: "a\n\nB\nc", opts: { blank: true } },
  { name: "minor-case", a: "Hello World\nsame", b: "hello world\nsame", opts: { case: true } },
  { name: "moved-line", a: "one\ntwo\nthree\nfour five six", b: "two\nthree\nfour five six\none" },
  { name: "empty-vs-text", a: "", b: "solo" },
  { name: "identical", a: "same\ntext", b: "same\ntext" },
  { name: "ws-show-tabs", a: "a\tb  c\nsame", b: "a\tb\tc\nsame", ws: true },
];
const VIEWS = ["unified", "split", "inline"];
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(page_url);
const golden = {};
for (const c of CASES) {
  await page.evaluate(({ a, b, opts, ws }) => {
    document.getElementById("text-a").value = a;
    document.getElementById("text-b").value = b;
    document.getElementById("opt-blank").checked = !!(opts && opts.blank);
    document.getElementById("opt-case").checked = !!(opts && opts.case);
    document.getElementById("opt-ws").checked = false;
    document.getElementById("opt-char").checked = false;
    const wsShow = document.getElementById("opt-ws-show");
    if (wsShow) { wsShow.checked = !!ws; wsShow.dispatchEvent(new Event("change")); }
  }, c);
  for (const v of VIEWS) {
    await page.click(`[data-view="${v}"]`);
    await page.waitForTimeout(200);
    golden[`${c.name}::${v}`] = await page.evaluate(() => document.getElementById("result").innerHTML);
  }
}
await browser.close();
const out = join(here, process.argv[2] || "golden.json");
writeFileSync(out, JSON.stringify(golden, null, 1));
console.log(`captured ${Object.keys(golden).length} snapshots → ${out}`);
