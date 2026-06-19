# DiffLens — architecture & decisions

Re-centered target after the original (Compare Text) and the dark-mode pivot:
the user wants a **text-compare/diff** tool. Stage 1 found the whole extension
category is review-starved and owned by web apps (diffchecker.com). So the wedge
is **not** "fix a resented incumbent" but "be the thing worth installing over the
web app": private, prose-friendly, free.

## Thesis

> A fast, 100% private text diff in the browser — paste or right-click two pieces
> of text and see a clear, readable difference (prose-friendly, not just code),
> nothing uploaded, no account, no ads, no paywall.

## Architecture (smallest thing that nails the differentiator)

- **Popup-only, vanilla JS, no build step, no framework.** Keeps it tiny and makes
  the privacy claim self-evident.
- **Permissions: `storage` + `contextMenus` only. No `host_permissions`, no network.**
  The manifest *is* the privacy story — there is no code path that can exfiltrate text.
  (Smoke test asserts this as a regression guard.)
- **No popup — the toolbar icon opens a full browser tab** (`compare.html`).
  `background.js` handles `action.onClicked`, tracking the opened tab id so a
  re-click focuses it instead of piling up tabs (done WITHOUT the `tabs` permission —
  querying by URL would require it and scare users on install). A context-menu
  "Open DiffLens" opens it too. This directly fixes the "popup is too small /
  disappears when I click away" complaint.
- **An open tab live-updates** when a selection is captured elsewhere: `app.js`
  listens to `chrome.storage.onChanged` and refreshes the panes (skipping its own writes).
- `compare.html` + `app.js` + `app.css` — the full-page (`body.page`, fluid + tall)
  two-pane view with live diff and word-level highlights. `diff.js` is the standalone,
  unit-testable engine. `render()` is wrapped in an error boundary so a pathological
  input can never leave the UI broken.
- `diff.js` — dependency-free engine (LCS over lines with common prefix/suffix trim;
  positional del↔add pairing within a changed block; word-level LCS for intra-line
  highlight). Attaches to `window` so it's unit-testable in Node.
- `background.js` — context-menu capture: right-click selection → "set as Text A/B"
  → `chrome.storage.local`; badges the icon so the user knows it landed. The popup
  reads those slots on open. (No `openPopup()` — not reliably allowed from a menu gesture.)

## P0 → how it's addressed

| P0 (from review pool + web-app gap) | How DiffLens does it |
|---|---|
| 100% local / private (web-app gap) | No host perms, no network, all in-popup. Manifest-enforced. |
| Prose-friendly, not code-first (grounded) | Word-wrap ON by default; word/char-level highlight inside changed lines; full text shown, no collapsed hunks. |
| Zero-friction capture (grounded) | Toolbar popup + right-click "set as Text A/B" across tabs; panes persist. |
| Clear, correct diff (grounded: "bad quality") | LCS line diff + positional change-pairing + word-level intra-line diff; +added/−removed stats. |
| No paywall / no ads (web-app gap) | Everything free; nothing gated. |

## Known limitations (written down, not chased — per playbook)

- **Large inputs:** the line LCS is O(n·m) memory; common prefix/suffix trimming makes
  typical "two versions of a document" cases cheap (2000 lines ~3ms), but two *totally
  different* huge texts could be heavy. Acceptable for the target use; add a size guard /
  Myers diff if it ever bites.
- **Block pairing is a heuristic:** when LCS finds no matching lines in a changed block,
  dels/adds are paired positionally (line i ↔ line i). Good for "modified line N" cases;
  occasionally a smarter similarity match would align better.
- **Three views (one codebase):** Unified, Split, and Inline. Unified & Inline share a
  single `renderColumn(out, inlineChange)` — they differ only in how a *change* renders
  (Unified: two −/+ rows; Inline: one merged row, original text with edits in place via
  the engine's merged `words` list). Split has its own two-column renderer.
- **Format JSON (structural compare):** parse → recursively sort keys → pretty-print
  both panes, so key-order and whitespace differences disappear and only real structural
  diffs remain. Invalid JSON is left untouched with a hint. Uses native JSON, so integers
  beyond 2^53 may be reformatted with precision loss (both sides equally) — a big-int-
  faithful pass (cf. JSON Keeper's `jsonbig.js`) is a future option.
- **Local file compare:** drag-drop onto a pane or "open file…" reads via `FileReader`
  (no upload, no `<input>`-only — both paths share one `loadFile`), guarded by a 5 MB
  cap so a huge file can't lag the tab. Needs no extra permission — stays 100% local.
- **Built since MVP:** side-by-side (split) view toggle; ignore-blank-lines; word/char-level
  toggle (with auto char-refine for no-space path/URL lines). Real source line numbers
  preserved even when blank lines are ignored.
- **Beyond Compare-grade pass:** next/prev difference navigation (Alt+↑/↓) with hunk
  counter; whitespace visualization (·, →); distinct amber colour for *changed* lines
  vs pure add/del; and a 3-state diff model — ignored whitespace/case differences become
  dimmed **"minor"** rows (shown, not dropped), surfaced via `stats.minor` / `onlyMinor`
  in the engine.
- **Not yet built (P1/P2):** syntax/JSON-aware structural diff (ties to JSON Keeper),
  file import/export, ignore-punctuation, diff history, compare two full tabs.
- **Name "DiffLens" is provisional** — confirm/availability-check before publishing.

## Status

MVP complete. Unit tests (`src/clear-diff-test.mjs`) + end-to-end smoke test
(`src/clear-diff-smoke.mjs`, loads in Chrome for Testing, 11 checks) both green.
Next: Stage 5 (icons done; need store listing, screenshots, privacy policy, zip).
