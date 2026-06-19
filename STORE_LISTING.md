# Chrome Web Store listing — DiffLens

Copy each block into the matching Developer Dashboard field. (Name is provisional —
confirm "DiffLens" is what you want before submitting.)

## Title
```
DiffLens — Private Text Compare
```

## Summary (≤132 chars)
```
Fast, 100% private text & file diff. Compare two texts right in your browser — no upload, no account, no ads.
```

## Detailed description (≤16,000)
```
DiffLens compares two pieces of text — or two files — and shows you exactly what changed, right in your browser. Nothing is ever uploaded.

WHY IT'S DIFFERENT
• 100% private — no host permissions, no network requests, no account. The text you compare never leaves your machine (unlike paste-into-a-website diff tools).
• Built for prose, not just code — word-wrap on by default and changes highlighted down to the word (or character).
• Three views — Unified, Side-by-side (Split), and Inline (the original text with edits marked in place).
• Free. No ads, no paywalled features.

FEATURES
• Word- and character-level highlighting, with smart auto-refine for paths/URLs/IDs.
• Jump between differences (↑/↓ or Alt+↑/↓) with a difference counter.
• Ignore whitespace, blank lines, or case — ignored differences are dimmed (still visible), not silently dropped.
• Show whitespace: reveal spaces, tabs and trailing whitespace.
• Compare local files — drag a file in or "open file…"; read locally, never uploaded.
• Right-click "set as Text A/B" to capture selected text from any page (even across two tabs).
• Format JSON — sort keys & pretty-print both sides for a structural compare that ignores key order and formatting noise.

PRIVACY
No accounts, no tracking, no data leaves your device. Settings and text are stored locally only.

NOTES
• Comparison runs locally; very large, completely-different inputs are compared at a coarser granularity to stay fast.
• "Format JSON" uses standard JSON, so integers beyond 2^53 may be reformatted with precision loss (both sides equally).
• Chrome (and Chromium-based browsers).
```

## Single purpose
```
Compare two pieces of text (or files) locally and highlight the differences.
```

## Permission justifications
- **storage**:
```
Used to save the user's two texts and view/compare preferences locally so they are restored automatically. Stored on-device only, never transmitted.
```
- **contextMenus**:
```
Adds right-click "set as Text A / set as Text B" entries so the user can capture selected text from a page into the comparison. Only the text the user explicitly selects is read, and only when they click the menu item; nothing is transmitted.
```
- **host permissions**: none requested.

## Remote code
**No, I am not using remote code.** (All code is bundled; no external `<script>`, no `eval`.)

## Data usage (dashboard checkboxes)
- Data collected: **none** — leave every box unchecked (local-only, never-transmitted data is not "collected").
- Check all three compliance declarations:
  - not sold/transferred to third parties beyond approved uses
  - not used for purposes unrelated to the single purpose
  - not used for creditworthiness/lending

## Category
```
Tools
```

## Privacy policy URL
```
https://kingxiaozhe.github.io/diff-lens/privacy.html
```
(Push this extension to a PUBLIC repo `diff-lens`, enable Settings → Pages → Source: main, with privacy.html reachable. Verify HTTP 200 before pasting. The file lives at docs/privacy.html — set Pages source to /docs, or move it to repo root.)

## Optional
- Homepage URL: `https://github.com/kingxiaozhe/diff-lens`
- Support URL: `https://github.com/kingxiaozhe/diff-lens/issues`

## Build the upload zip
```
node ~/.claude/skills/chrome-ext-reborn/scripts/build-zip.mjs extensions/clear-diff
```
(Only you can register the $5 developer account and click "Submit for review.")
