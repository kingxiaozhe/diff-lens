// Build the Chrome Web Store upload zip — run with: node package.mjs
//
// The repo carries ~3 MB the extension never runs: design drafts, specs, store
// screenshots, tests, docs. Zipping the folder ships all of it.
//
// PAYLOAD below is the whole answer to "what ships". It is written out, not
// derived. An earlier version tried to derive it by regexing compare.html and
// walking manifest fields; that read as clever and was not. It only matched
// double-quoted attributes, so `src='app.js'` silently shipped a zip with no
// main script. It knew four manifest fields, so a `default_locale` would have
// shipped an extension Chrome refuses to install. It never normalised paths, so
// `src="../secrets.js"` packed a file from outside the repo, contents and all,
// and the verify step approved it. Enumerating a moving target (MV3's fields,
// HTML's grammar) is a losing game; a list of eleven strings is not.
//
// A written list has one failure mode — forget to add a runtime file and ship a
// broken extension. That is what the checks below are for, and the last one is
// the only one that really counts: unpack the zip and run the real test suite
// against it. Not a parse of what it should contain. The thing itself, running.
import { readFileSync, existsSync, rmSync, mkdtempSync, cpSync, renameSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, isAbsolute, normalize } from "node:path";
import { tmpdir } from "node:os";

process.chdir(dirname(fileURLToPath(import.meta.url)));

const PAYLOAD = [
  "manifest.json",
  "background.js",
  "compare.html",
  "app.css",
  "app.js",
  "diff.js",
  "history.js",
  "icons/icon-16.png",
  "icons/icon-32.png",
  "icons/icon-48.png",
  "icons/icon-128.png",
];

const die = (...msg) => { console.error(...msg); console.error("\nRefusing to ship this zip."); process.exit(1); };
const run = (cmd, args, opts) => execFileSync(cmd, args, { encoding: "utf8", ...opts });

for (const cmd of ["zip", "unzip"]) {
  try { run("which", [cmd], { stdio: "pipe" }); }
  catch { die(`${cmd} is not on PATH.`); }
}

// Paths must stay inside the repo. Belt and braces: PAYLOAD is hand-written, but
// a stray "../" in it must never become a zip entry that unpacks outside the root.
for (const f of PAYLOAD) {
  if (isAbsolute(f) || normalize(f).startsWith("..")) die(`PAYLOAD entry escapes the repo: ${f}`);
  if (!existsSync(f)) die(`PAYLOAD entry missing from disk: ${f}`);
}

const version = JSON.parse(readFileSync("manifest.json", "utf8")).version;
const out = `difflens-${version}-upload.zip`;
// Build under a temp name: a failed run must never leave something that looks
// shippable lying next to the real artifact.
const staging = `.${out}.staging`;
rmSync(staging, { force: true, recursive: true });
run("zip", ["-q", "-X", staging, ...PAYLOAD]);

const tmp = mkdtempSync(join(tmpdir(), "difflens-pkg-"));
try {
  run("unzip", ["-q", staging, "-d", tmp]);

  // 1. Exactly the payload — no more, no less.
  const packed = run("unzip", ["-Z1", staging]).split("\n").filter((l) => l && !l.endsWith("/")).sort();
  if (packed.join("\n") !== [...PAYLOAD].sort().join("\n")) {
    die("Zip contents don't match PAYLOAD.\n  packed: " + packed.join(", "));
  }

  // 2. The privacy promise, checked against what actually ships rather than
  //    against the working tree. STORE_LISTING and the privacy policy both make
  //    this claim to users; the upload is the last place to be sure of it.
  const m = JSON.parse(readFileSync(join(tmp, "manifest.json"), "utf8"));
  const perms = [...(m.permissions || [])].sort();
  if (perms.join() !== "contextMenus,storage") die(`Packed manifest grants ${JSON.stringify(perms)}, expected storage + contextMenus.`);
  for (const field of ["host_permissions", "optional_permissions", "optional_host_permissions", "content_scripts", "externally_connectable"]) {
    if (field in m) die(`Packed manifest declares ${field} — this extension reaches nothing but its own tab.`);
  }

  // Any file the manifest points at must be in PAYLOAD. Rather than enumerate
  // MV3's fields — a list that grows every release and that an earlier version of
  // this script lost track of — walk the whole manifest for path-shaped strings.
  // A `default_locale` with no `_locales` tree is the sharp case: Chrome refuses
  // to install it, and nothing else here would notice.
  const shipped = new Set(PAYLOAD);
  const pathish = [];
  (function walk(v) {
    if (typeof v === "string") { if (/^[\w./-]+\.(js|css|html|json|png|jpg|svg|woff2?)$/.test(v)) pathish.push(v); }
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  })(m);
  if (m.default_locale) pathish.push(`_locales/${m.default_locale}/messages.json`);
  const dangling = [...new Set(pathish)].filter((p) => !shipped.has(p.replace(/^\.?\//, "")));
  if (dangling.length) {
    die("The packed manifest points at files that aren't in PAYLOAD:\n  " + dangling.join("\n  ") +
      "\nChrome would reject or half-load this. Add them to PAYLOAD.");
  }

  const NET = /https?:\/\/|@import|url\(\s*["']?\/\//;
  for (const f of PAYLOAD.filter((f) => /\.(html|css|js|json)$/.test(f))) {
    const src = readFileSync(join(tmp, f), "utf8").split("\n")
      .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
      .join("\n");
    if (NET.test(src)) die(`Packed ${f} reaches the network.`);
  }

  // 3. The one that matters: run the real suite against the unpacked zip. A file
  //    left out of PAYLOAD fails here, which is why PAYLOAD can be hand-written.
  cpSync("tests", join(tmp, "tests"), { recursive: true });
  try {
    run("node", [join(tmp, "tests", "smoke.mjs")], { cwd: tmp, stdio: "pipe" });
  } catch (e) {
    if (e.status === 2) die("Playwright isn't installed, so the packed zip can't be verified.\n" +
      "Install it (npm i -g playwright && npx playwright install chromium) — a release\n" +
      "shouldn't go out on an unverified artifact.");
    die("The packed zip fails the smoke suite — something it needs isn't in PAYLOAD:\n" +
      (e.stdout || "") + (e.stderr || ""));
  }

  renameSync(staging, out);
  const kb = Math.round(run("wc", ["-c", out]).trim().split(/\s+/)[0] / 1024);
  console.log(out);
  console.log(`  ${packed.length} files, ${kb} KB — smoke suite passes against the unpacked zip`);
  for (const f of packed) console.log("    " + f);
} finally {
  rmSync(tmp, { recursive: true, force: true });
  rmSync(staging, { force: true });
}
