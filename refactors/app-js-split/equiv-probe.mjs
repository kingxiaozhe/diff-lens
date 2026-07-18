// 一次性等价探针(r2 采纳):对 pristine 与重构树,浏览器级实驱本次改动面——
// 复制三通道(剪贴板打桩逐字节)、FileReader 加载、5MB 拒载文案、Format JSON。
// 用法: node equiv-probe.mjs {树根} {输出json}
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { writeFileSync, mkdtempSync } from "node:fs";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import * as fs from "node:fs";
const require = createRequire(import.meta.url);
function loadPlaywright() {
  const c = ["playwright"]; try { c.push(join(execSync("npm root -g",{stdio:["ignore","pipe","ignore"]}).toString().trim(),"playwright")); } catch {}
  for (const x of c) { try { return require(x); } catch {} } process.exit(2);
}
const { chromium } = loadPlaywright();
const root = process.argv[2]; const outPath = process.argv[3];
const browser = await chromium.launch();
const page = await browser.newPage();
await page.addInitScript(() => {
  window.__copied = [];
  Object.defineProperty(navigator, "clipboard", { value: { writeText: (t) => { window.__copied.push(t); return Promise.resolve(); } } });
});
await page.goto(pathToFileURL(join(root, "compare.html")).href);
const out = {};
// 1) 复制三通道
await page.evaluate(() => {
  document.getElementById("text-a").value = "alpha\n\nbravo\ncharlie";
  document.getElementById("text-b").value = "alpha\n\ndelta\ncharlie";
  document.getElementById("opt-blank").checked = true;
});
await page.click("#export"); // 打开菜单(details summary)
for (const id of ["copy", "copy-diff", "copy-md"]) {
  const el = await page.$("#" + id);
  if (el) { await el.click({ force: true }); await page.waitForTimeout(80); }
}
out.copied = await page.evaluate(() => window.__copied);
// 2) FileReader 正常加载 + 5MB 拒载
const tmp = mkdtempSync(join(tmpdir(), "probe-"));
const okFile = join(tmp, "ok.txt"); fs.writeFileSync(okFile, "file-content-line1\nline2");
const bigFile = join(tmp, "big.txt"); fs.writeFileSync(bigFile, "x".repeat(5 * 1024 * 1024 + 1));
await page.setInputFiles("#file-a", okFile); await page.waitForTimeout(200);
out.fileLoaded = await page.evaluate(() => document.getElementById("text-a").value);
await page.setInputFiles("#file-a", bigFile); await page.waitForTimeout(200);
out.bigMsg = await page.evaluate(() => document.getElementById("stats").textContent);
// 3) Format JSON(一侧合法一侧非法)
await page.evaluate(() => {
  document.getElementById("text-a").value = '{"b":1,"a":{"d":2,"c":3}}';
  document.getElementById("text-b").value = "not json";
});
await page.click("#fmt-json"); await page.waitForTimeout(120);
out.fmtA = await page.evaluate(() => document.getElementById("text-a").value);
out.fmtB = await page.evaluate(() => document.getElementById("text-b").value);
out.fmtMsg = await page.evaluate(() => document.getElementById("stats").textContent);
await browser.close();
writeFileSync(outPath, JSON.stringify(out, null, 1));
console.log("probe →", outPath, "| copied:", out.copied.length, "| fileLoaded bytes:", out.fileLoaded.length);
