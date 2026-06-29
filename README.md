# DiffLens — Private Text Compare

A fast, **100% private** text diff that lives in your browser. Paste or right-click
two pieces of text and instantly see a clear, readable difference — **nothing
uploaded, no account, no ads, no paywall.**

Unlike diffchecker.com and friends, DiffLens never sends your text anywhere: it
requests **no host permissions and makes no network calls** (only `storage` +
`contextMenus`). Built for comparing **prose**, not just code — word-wrap is on by
default and changes are highlighted down to the word.

## Features

- **Click the toolbar icon → opens a full browser tab** (no cramped popup that
  vanishes when you click away). Re-clicking focuses the tab it already opened.
- Two-pane compare with a live diff — **unified**, **side-by-side (split)**, or
  **inline** view (one merged column: the original text with edits marked in place).
- **Word- or character-level highlighting** inside changed lines (toggle).
- **Move detection** — a distinctive line deleted in one place and re-added in another
  is flagged as **moved** (with a "moved from/to line N" badge) instead of an unrelated
  delete + add, and counted separately in the stats.
- **Format JSON** — one click parses, **sorts keys & pretty-prints** both sides, so
  JSON that differs only in key order or formatting compares as identical and real
  differences stand out (a structural compare).
- **Compare local files** — drag a file onto a pane, or "open file…". Read with
  FileReader, so they never leave your machine (no upload, no permissions needed).
- **Right-click → "set as Text A/B"** to capture selections from any page (even
  across two tabs), then compare.
- **Jump between differences** (↑/↓ or Alt+↑/↓) with a hunk counter.
- **Show whitespace** — reveal spaces (·), tabs (→) and trailing whitespace.
- **Unimportant differences** — when you ignore whitespace/case, those diffs are
  dimmed (still visible), not silently dropped (Beyond Compare's 3-state model).
- **Export the diff** — copy as plain text, copy/download a standard **unified diff
  (`.patch`, `git apply`-ready), or copy as **Markdown** (a fenced ```` ```diff ````
  block that renders red/green on GitHub).
- **Synchronized scrolling** — the two input panes scroll-lock so the same region
  of A and B always lines up while you read long text.
- **Comparison history** — save a snapshot of the current A/B with one click and
  restore (or delete) it later from the **History** menu. Stored locally only.
- Ignore whitespace / ignore blank lines / ignore case; word-wrap; swap A↔B; copy result.
- **Collapse unchanged** (optional) — on large, mostly-identical inputs, fold long
  runs of unchanged lines into a band you can click to expand (off by default, so
  prose still shows in full).
- Real source line numbers, preserved even when blank lines are ignored.
- Panes, view, and options persist between opens.
- Light & dark, follows your system theme.

## Load it locally (for testing)

1. `chrome://extensions` → enable **Developer mode**.
2. **Load unpacked** → select this `clear-diff/` folder.
3. Click the toolbar icon to open the compare tab. To pull text off a page,
   right-click a selection → "set as Text A/B" (an open tab updates live).

## Develop / test

- Engine + export unit tests (no deps): `node tests/diff-test.mjs`
- History helper unit tests (no deps): `node tests/history-test.mjs`
- End-to-end UI smoke (headless Chromium via Playwright): `node tests/smoke.mjs`

See `docs/ARCHITECTURE.md` for design decisions and known limitations.

> Name is provisional. 100% local — your text never leaves your browser.
