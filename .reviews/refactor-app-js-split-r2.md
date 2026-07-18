Reading additional input from stdin...
OpenAI Codex v0.144.5
--------
workdir: /Users/zero/MyCode/diff-lens
model: gpt-5.4
provider: openai
approval: never
sandbox: read-only
reasoning effort: high
reasoning summaries: none
session id: 019f72e7-1c1f-70b1-9b85-7203e3332815
--------
user
r2 快速复审。上轮 3 条采纳项已落地:①delta-file.md 文档漂移已改;②金样扩展 showWs 用例(pristine vs 重构后 21/21 一致,含 3 组 ws 激活,git status 可见 golden-capture.mjs 改动);③smoke 隐私扫描白名单已含 ui-*.js(smoke 复跑 68 绿)。第4条(export/file smoke 实操盲区)判定为重构前既有测试欠账,记档案转交不夹带。只答:三条落地是否属实有效、转交判定是否合理。零发现就说零发现。
codex
按复审口径，我先核对这轮声称已落地的三项证据，再判断第 4 条“转交不夹带”是否成立。先读 `ultrawork` 和 `review` 指南，再直接查相关文件、测试痕迹和工作区状态。
exec
/bin/zsh -lc "sed -n '1,240p' /Users/zero/.codex/skills/ultrawork/SKILL.md" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
---
name: ultrawork
description: "Default OMX flow for intent -> plan -> execute -> verify, with team escalation only when durable parallelism is justified."
---

# Ultrawork

## Purpose

`$ultrawork` is the default OMX operating mode. It is the wrapper that decides whether to clarify, plan, execute directly, or escalate to durable team mode. It exists to finish the job end to end without losing state.

## Use When

- the user wants the work shipped, not just discussed
- the task is larger than a one-shot edit
- you need one sane default path instead of choosing skills manually

## Routing Rules

- ambiguous intent → `$deep-interview`
- clear but broad work → `$plan`
- one focused slice with known files → `$executor`
- parallel durable work → `$team`
- uncertain implementation pattern → `$research` or `$trace`

## Execution Policy

- start from the repo and `.omx/` truth, not chat memory
- prefer the smallest mode that can finish the job
- keep the runtime current as you go
- do not stop at a partial handoff unless the next owner is explicit

## Workflow

1. Start or resume the session with `omx session start` or `omx session resume`.
2. Read current state with `omx hud`.
3. Run the ambiguity gate:
   - if intent is fuzzy, use `$deep-interview`
   - if intent is clear, continue
4. Build or refresh the durable plan:
   - `omx autoresearch init <phase>` when discovery is needed
   - update `.omx/plans/` and `.omx/research/`
5. Choose execution mode:
   - direct slice → `$executor`
   - durable parallel slices → `$team`
6. Keep task, inbox, and review state current during execution.
7. Finish with explicit verification and a recorded verdict.

## State Contract

Ultrawork should leave behind:

- a current session
- a live or intentionally cleared planning state
- durable tasks with real status
- verification evidence in task notes or plan artifacts

## Final Check

- the next action is explicit
- no fake “done” state exists
- verification is recorded
- the work is either completed, in review, or intentionally blocked

exec
/bin/zsh -lc "sed -n '1,260p' /Users/zero/.codex/skills/review/SKILL.md" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
---
name: review
description: "Findings-first pre-landing review against code, plan completion, verification evidence, and durable runtime state."
---

# Review

## Purpose

Use `$review` to answer one question: is this actually ready to land? Review is not a summary pass. It is a bug, regression, coverage, and state-integrity pass.

## Execution Policy

- Findings first, summary second.
- Prefer evidence over author claims.
- Check the code, the tests, the plan, and the runtime artifacts.
- If the current context authored the change, prefer a separate reviewer role for approval.

## Review Order

1. Read the changed code.
2. Read the active plan and verification map.
3. Check what was supposed to happen vs what actually landed.
4. Verify:
   - tests and typechecks
   - docs drift
   - `.omx/` state drift
   - task/review/inbox accuracy
5. Produce a verdict:
   - approved
   - changes requested
   - blocked

## Mandatory Checks

- missing or fake verification
- uncovered changed paths
- stale docs or setup instructions
- task marked done but still pending review evidence
- team runtime claiming health while inbox or review queue says otherwise

## Output Standard

- findings ordered by severity
- file references and why they matter
- residual risk
- final verdict and next action

codex
先看工作区证据和相关改动面：`git status`、`delta-file.md`、`golden-capture.mjs`、smoke/隐私扫描配置，以及 `.omx` 里是否把第 4 条按“既有欠账”记录清楚。
exec
/bin/zsh -lc 'git status --short' in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-II76mbWl' (errno=Operation not permitted)
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-cEp4yVOi' (errno=Operation not permitted)
 M app.js
 M compare.html
 M package.mjs
 M tests/smoke.mjs
 M "\350\277\220\350\241\214\346\227\245\345\277\227.jsonl"
?? .claude/settings.json
?? .reviews/refactor-app-js-split-r1.md
?? .reviews/refactor-app-js-split-r2.md
?? refactors/
?? ui-export.js
?? ui-file.js
?? ui-history.js
?? ui-nav.js
?? ui-render.js

exec
/bin/zsh -lc "rg --files | rg 'delta-file\\.md|golden-capture\\.mjs|smoke|privacy|whitelist|export|file'" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
ui-export.js
refactors/app-js-split/delta-file.md
refactors/app-js-split/golden-capture.mjs
refactors/app-js-split/delta-export.md
docs/privacy.html
ui-file.js
tests/smoke.mjs

exec
/bin/zsh -lc 'rg -n "showWs|ui-.*js|whitelist|allowlist|privacy|export/file|既有测试欠账|转交|smoke" .omx . --hidden' in /Users/zero/MyCode/diff-lens
 exited 2 in 0ms:
rg: .omx: No such file or directory (os error 2)
./app.js:3:// navigation, export, history UI, and file loading live in ui-render.js / ui-nav.js /
./app.js:4:// ui-export.js / ui-history.js / ui-file.js (split per refactors/app-js-split/RULEBOOK.md;
./app.js:17:  let showWs = false;
./app.js:87:      result.innerHTML = view === "split" ? R.renderSplit(toRender, { showWs })
./app.js:88:        : view === "inline" ? R.renderInline(toRender, { showWs })
./app.js:89:        : R.renderUnified(toRender, { showWs });
./app.js:122:  if (optWsShow) optWsShow.addEventListener("change", () => { showWs = optWsShow.checked; render(); persistOpts(); });
./app.js:232:      showWhitespace: showWs, wordWrap: optWrap.checked, view: view,
./app.js:247:        if (typeof s.showWhitespace === "boolean" && optWsShow) { optWsShow.checked = s.showWhitespace; showWs = s.showWhitespace; }
./README.md:76:- End-to-end UI smoke (headless Chromium via Playwright): `node tests/smoke.mjs`
./README.md:77:  — drives the real UI and enforces the privacy invariant: the manifest must grant
./package.mjs:36:  "ui-render.js",
./package.mjs:37:  "ui-nav.js",
./package.mjs:38:  "ui-export.js",
./package.mjs:39:  "ui-history.js",
./package.mjs:40:  "ui-file.js",
./package.mjs:80:  // 2. The privacy promise, checked against what actually ships rather than
./package.mjs:81:  //    against the working tree. STORE_LISTING and the privacy policy both make
./package.mjs:121:    run("node", [join(tmp, "tests", "smoke.mjs")], { cwd: tmp, stdio: "pipe" });
./package.mjs:126:    die("The packed zip fails the smoke suite — something it needs isn't in PAYLOAD:\n" +
./package.mjs:133:  console.log(`  ${packed.length} files, ${kb} KB — smoke suite passes against the unpacked zip`);
./2.visual-refresh-and-change-rail/tasks.md:23:- [x] T-001: 防护网基线——跑 `node tests/diff-test.mjs` / `history-test.mjs` / `smoke.mjs` 三条并记录全绿输出摘要 ~5min（B3：复用存量测试资产，不造快照）
./2.visual-refresh-and-change-rail/tasks.md:36:- [x] T-005: `smoke.mjs` 扩充六条 pip 断言——基础 AC-002/003/004（真实点击路径）+ 反假绿灯 AC-012/013/014（Split 类型 / wrap 后 `.current` / 缩窗重算）+ 复跑防护网三条全绿 ~45min（依赖 T-002、T-003、T-004）
./2.visual-refresh-and-change-rail/tasks.md:50:- smoke 全绿 ≠ 视觉没改坏 → AC-008/AC-011 人工走查不可省（design R4，上轮假绿灯教训）
./.git/COMMIT_EDITMSG:11:- smoke 57→68, incl. anti-false-green assertions (split semantics, wrap-toggle
./.reviews/fix-unified-blank-lines-r1.md:200:tests/smoke.mjs:100:  // Identical inputs report identical.
./.reviews/fix-unified-blank-lines-r1.md:201:tests/smoke.mjs:102:  await page.waitForFunction(() => /identical/i.test(document.querySelector("#result").textContent));
./.reviews/fix-unified-blank-lines-r1.md:202:tests/smoke.mjs:103:  ok(/identical/i.test(await page.textContent("#result")), "identical inputs report identical");
./.reviews/fix-unified-blank-lines-r1.md:203:tests/smoke.mjs:105:  // Collapse unchanged: a long mostly-identical input should fold, and a band expands.
./.reviews/fix-unified-blank-lines-r1.md:204:tests/smoke.mjs:203:  ok(!(await page.locator("#pip-rail").isVisible()), "rail hides when the texts are identical");
./.reviews/fix-unified-blank-lines-r1.md:205:tests/smoke.mjs:259:  ok((await page.locator("#result .placeholder").count()) === 1, "identical state reuses the styled placeholder");
./.reviews/refactor-app-js-split-r2.md:14:r2 快速复审。上轮 3 条采纳项已落地:①delta-file.md 文档漂移已改;②金样扩展 showWs 用例(pristine vs 重构后 21/21 一致,含 3 组 ws 激活,git status 可见 golden-capture.mjs 改动);③smoke 隐私扫描白名单已含 ui-*.js(smoke 复跑 68 绿)。第4条(export/file smoke 实操盲区)判定为重构前既有测试欠账,记档案转交不夹带。只答:三条落地是否属实有效、转交判定是否合理。零发现就说零发现。
./.reviews/refactor-app-js-split-r2.md:16:按复审口径，我先核对这轮声称已落地的三项证据，再判断第 4 条“转交不夹带”是否成立。先读 `ultrawork` 和 `review` 指南，再直接查相关文件、测试痕迹和工作区状态。
./.reviews/refactor-app-js-split-r2.md:136:先看工作区证据和相关改动面：`git status`、`delta-file.md`、`golden-capture.mjs`、smoke/隐私扫描配置，以及 `.omx` 里是否把第 4 条按“既有欠账”记录清楚。
./.reviews/refactor-app-js-split-r2.md:147: M tests/smoke.mjs
./.reviews/refactor-app-js-split-r2.md:153:?? ui-export.js
./.reviews/refactor-app-js-split-r2.md:154:?? ui-file.js
./.reviews/refactor-app-js-split-r2.md:155:?? ui-history.js
./.reviews/refactor-app-js-split-r2.md:156:?? ui-nav.js
./.reviews/refactor-app-js-split-r2.md:157:?? ui-render.js
./app.css:139:.privacy {
./app.css:146:.privacy b {
./app.css:155:.privacy span {
./2.visual-refresh-and-change-rail/requirements.md:44:- 兼容性: 900px 断点下轨道保留；裸浏览器（无 chrome API）可运行供 smoke
./2.visual-refresh-and-change-rail/requirements.md:48:- [x] [AC-001] 防护网基线：`diff-test`(48) / `history-test`(19) / `smoke` 三条全绿记录在案；开发完成后复跑仍全绿
./2.visual-refresh-and-change-rail/requirements.md:49:- [x] [AC-002] 存在差异时轨道可见，pip 数量 === 结果区 `.hstart` 数量（smoke 断言）
./2.visual-refresh-and-change-rail/requirements.md:50:- [x] [AC-003] 点击第 N 个 pip → 第 N 个 hunk 滚入视口且带 `.jumped` 描边、`#nav-count` 显示 `N / 总数`（smoke 真实点击路径断言）
./2.visual-refresh-and-change-rail/requirements.md:51:- [x] [AC-004] A/B 相同或为空 → 轨道不可见（smoke 断言）
./2.visual-refresh-and-change-rail/requirements.md:55:- [x] [AC-008] 视觉精修后 PRD 44 条功能点逐条有落点（27 契约 id + 易漏五项走查全过）；控件 id 清单与 `.hist-*` 类名零变更（smoke 68 全绿背书）
./2.visual-refresh-and-change-rail/requirements.md:59:- [x] [AC-012] **Split 视图**下 pip 仍带正确类型类与行号（smoke 断言 + stale 标记防旧 DOM 骗绿）
./2.visual-refresh-and-change-rail/requirements.md:60:- [x] [AC-013] 跳转到第 N 处后切换 Word wrap，`.current` 仍在第 N 个 pip 上且位置已重算（smoke 断言）
./2.visual-refresh-and-change-rail/requirements.md:61:- [x] [AC-014] 视口 1440→620 缩放后 pip `style.top` 集合发生重算（smoke `setViewportSize` 断言）
./docs/ARCHITECTURE.md:18:  makes the privacy claim self-evident — anyone can audit the whole thing.
./docs/ARCHITECTURE.md:20:  The manifest *is* the privacy story — there is no code path that can exfiltrate text.
./docs/ARCHITECTURE.md:21:  The smoke test enforces this: it asserts the permission set exactly, rejects
./docs/ARCHITECTURE.md:26:  the smoke test contained no such assertion — the invariant was unenforced for the
./docs/ARCHITECTURE.md:112:MVP complete. Unit tests (`src/clear-diff-test.mjs`) + end-to-end smoke test
./docs/ARCHITECTURE.md:113:(`src/clear-diff-smoke.mjs`, loads in Chrome for Testing, 11 checks) both green.
./docs/ARCHITECTURE.md:114:Next: Stage 5 (icons done; need store listing, screenshots, privacy policy, zip).
./compare.html:15:      <span class="privacy" title="Everything runs in this tab. Nothing is uploaded.">
./compare.html:118:  <script src="ui-render.js"></script>
./compare.html:119:  <script src="ui-nav.js"></script>
./compare.html:120:  <script src="ui-export.js"></script>
./compare.html:121:  <script src="ui-history.js"></script>
./compare.html:122:  <script src="ui-file.js"></script>
./2.visual-refresh-and-change-rail/.reviews/2.visual-refresh-and-change-rail-T001-r1.md:7:- `tests/diff-test.mjs`、`tests/history-test.mjs`、`tests/smoke.mjs` 均真实存在且非空
./2.visual-refresh-and-change-rail/.reviews/2.visual-refresh-and-change-rail-T001-r1.md:9:`tests/smoke.mjs` 未复跑；按你的说明跳过，原因是该项依赖 Playwright，当前只读沙箱环境不具备可执行条件。
./2.visual-refresh-and-change-rail/.reviews/2.visual-refresh-and-change-rail-T005-r1.md:5:1. [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:160) 的 view-switch 断言能被“旧 rail DOM”骗绿。具体场景：如果回归导致切到 `split` 或切回 `unified` 时只更新了 `#result`，但没重建 `#pip-rail`，这里仍会通过。`#result .srow.hstart` 只证明 split 行渲染了；`#pip-rail .pip.length > 0` 在切回 unified 时又是个松条件，旧 pip 还在就立刻满足。这样 `splitTypes === "change,del,add"` 读到的其实可能还是 unified 阶段留下来的 class，测试会绿，但“view 切换会刷新 rail”这个真实路径没被测到。
./2.visual-refresh-and-change-rail/.reviews/2.visual-refresh-and-change-rail-T005-r1.md:7:2. [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:181) 把 viewport 恢复写死成 `1280x720`，这会让后续既有断言对本段顺序产生耦合。具体场景：如果前面或全局默认 viewport 以后改成别的尺寸来扩 responsive 覆盖，这段仍会把页面钉回 `1280x720`，后面的 `history menu stays inside the viewport` 之类几何断言就不再运行在它们原本的环境里，可能出现与本特性无关的通过/失败。
./2.visual-refresh-and-change-rail/.reviews/2.visual-refresh-and-change-rail-T005-r1.md:9:其余部分我没有看到新的具体假绿灯问题。特别是 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:144) 这个 `=== 3` 等待是有效收紧；当前前序 move 用例是 2 个 hunk，新 rail 用例是 3 个 hunk，不是恒真条件。
./.claude/CLAUDE.md:9:- 包管理: 无（`package.json` 都没有；测试只用 Node 内置模块，Playwright 已全局安装 1.61.1 供 smoke 用）
./.claude/CLAUDE.md:19:- 测试: `node tests/diff-test.mjs` && `node tests/history-test.mjs` && `node tests/smoke.mjs`
./.claude/CLAUDE.md:36:│   └── privacy.html     # 商店要求的隐私政策
./.claude/CLAUDE.md:37:├── tests/             # diff-test.mjs / history-test.mjs（单测）、smoke.mjs（E2E + 隐私守卫）
./docs/PRD.md:219:Redesign the visual language of "DiffLens", a privacy-first text comparison (diff)
./docs/PRD.md:230:1. Header: product mark "DiffLens" + a persistent privacy pill
./docs/PRD.md:272:  "military-grade". The only trust claim is the privacy pill quoted above.
./2.visual-refresh-and-change-rail/.reviews/2.visual-refresh-and-change-rail-T002-r1.md:3:2.visual-refresh-and-change-rail/requirements.md:49:- [ ] [AC-002] 存在差异时轨道可见，pip 数量 === 结果区 `.hstart` 数量（smoke 断言）
./2.visual-refresh-and-change-rail/.reviews/2.visual-refresh-and-change-rail-T002-r1.md:4:2.visual-refresh-and-change-rail/requirements.md:50:- [ ] [AC-003] 点击第 N 个 pip → 第 N 个 hunk 滚入视口且带 `.jumped` 描边、`#nav-count` 显示 `N / 总数`（smoke 真实点击路径断言）
./2.visual-refresh-and-change-rail/.reviews/2.visual-refresh-and-change-rail-T002-r1.md:7:2.visual-refresh-and-change-rail/requirements.md:59:- [ ] [AC-012] **Split 视图**下 pip 仍带正确类型类与行号（smoke 断言——防「只在 Unified 工作」）
./2.visual-refresh-and-change-rail/.reviews/2.visual-refresh-and-change-rail-T002-r1.md:8:2.visual-refresh-and-change-rail/requirements.md:60:- [ ] [AC-013] 跳转到第 N 处后切换 Word wrap，`.current` 仍在第 N 个 pip 上且位置已重算（smoke 断言）
./2.visual-refresh-and-change-rail/.reviews/2.visual-refresh-and-change-rail-T002-r1.md:9:2.visual-refresh-and-change-rail/requirements.md:61:- [ ] [AC-014] 视口 1440→620 缩放后 pip `style.top` 集合发生重算（smoke `setViewportSize` 断言——防 resize 位置漂移）
./2.visual-refresh-and-change-rail/.reviews/2.visual-refresh-and-change-rail-T005-r2.md:2:我尝试本机复跑 `node tests/smoke.mjs`，但当前只读沙箱下 Playwright 启浏览器时因 `mkdtemp ... EPERM` 失败，无法独立复现你的 68 绿结果。仓库内 [METRICS.md](/Users/zero/MyCode/diff-lens/2.visual-refresh-and-change-rail/METRICS.md:1) 目前仍只记录 `2026-07-17` 的 57 绿基线。
./.claude/rules/security.md:15:5. 以上任一条确有必要变更 → **停下来上报人工确认**，同步更新 `README.md`、`STORE_LISTING.md`、`docs/privacy.html` 与商店披露，不得静默改动。
./.claude/rules/security.md:53:- [ ] `node tests/smoke.mjs` 的权限断言通过
./.claude/rules/security.md:55:- [ ] 版本号、`STORE_LISTING.md`、`docs/privacy.html` 三处披露一致
./.reviews/refactor-app-js-split-r1.md:16:上下文自取: git status/diff 看全部未提交改动;规则见 refactors/app-js-split/RULEBOOK.md(v3);等价证据:smoke 68全绿、金样18组逐字节一致(golden.json vs golden-after.json)、3处变异重种全抓红(含 ui-nav 模块内部)。
./.reviews/refactor-app-js-split-r1.md:18:审查重点(逐项答):1) app.js 编排层的接线有无错漏(对照 refactors/app-js-split/delta-*.md 的调用点表);2) 有无夹带行为变更(哪怕一处文案/时序/守卫语义);3) 模块边界纪律(R1禁互调/R3 chrome隔离/R4 dataset契约)有无违反;4) 等价验证的覆盖有无关键盲区(金样6输入×3视图+smoke,漏了什么高危面?);5) compare.html/package.mjs 波及处理是否完整。
./.reviews/refactor-app-js-split-r1.md:156:?? ui-export.js
./.reviews/refactor-app-js-split-r1.md:157:?? ui-file.js
./.reviews/refactor-app-js-split-r1.md:158:?? ui-history.js
./.reviews/refactor-app-js-split-r1.md:159:?? ui-nav.js
./.reviews/refactor-app-js-split-r1.md:160:?? ui-render.js
./.reviews/refactor-app-js-split-r1.md:171:- 循环内**必跑** `node --check {文件}`;**允许**自建纯 Node 等价自检(v2:bakeoff 双方自发验证,合法化);**禁跑** tests/smoke.mjs 与任何起浏览器的验证(贵,站 4/5 批量跑——裁判价格定位)
./.reviews/refactor-app-js-split-r1.md:177:| ui-render.js | 纯 HTML 生成 | esc/fmt/renderWords/moveTag/numCell/urow/hmeta/foldRowHtml/renderColumn/renderUnified/renderInline/scol/renderSplit | 无状态——三个渲染入口收 `{showWs}` options bag 下传(v2);**导出面=实际消费面:仅 esc/renderUnified/renderInline/renderSplit,其余 9 个私有**(bakeoff 双方无规则趋同) |
./.reviews/refactor-app-js-split-r1.md:178:| ui-nav.js | hunk 索引/上下跳转/pip 轨道 | indexHunks/updateNav/renderPips/jump | 拥有 hunks/hunkIdx;DOM 引用经 init(ctx) 注入 |
./.reviews/refactor-app-js-split-r1.md:179:| ui-export.js | 复制/下载导出 | plainDiffText/flashBtn/closeExport/copyText/copyResult/copyUnified/copyMarkdown/downloadPatch | 无状态;输入引用经 ctx |
./.reviews/refactor-app-js-split-r1.md:180:| ui-history.js | 历史列表 UI | relTime/renderHistList/saveCurrent/restoreHist/delHist | historyList 归 app.js,经 ctx 存取 |
./.reviews/refactor-app-js-split-r1.md:181:| ui-file.js | 文件加载 + JSON 格式化 | loadFile/paneEl/sortKeys/formatPane | 无状态 |
./.reviews/refactor-app-js-split-r1.md:182:| app.js(留守) | 编排:opts/render/renderDiff/schedule/persist*/boot/全部事件绑定 | — | view/fold/showWs/expandedFolds/lastA/lastB/historyList |
./.reviews/refactor-app-js-split-r1.md:188:  | ui-render.js | `DiffLensRender` | 直挂(纯函数) |
./.reviews/refactor-app-js-split-r1.md:189:  | ui-nav.js | `DiffLensNav` | init(ctx) 工厂(拥有 hunks/hunkIdx) |
./.reviews/refactor-app-js-split-r1.md:190:  | ui-export.js | `DiffLensExport` | init(ctx)(需 DOM 引用与 opts 存取) |
./.reviews/refactor-app-js-split-r1.md:191:  | ui-history.js | `DiffLensHistUI` | init(ctx)(**避开已被 history.js 占用的 DiffLensHistory**) |
./.reviews/refactor-app-js-split-r1.md:192:  | ui-file.js | `DiffLensFile` | init(ctx)(需面板引用) |
./.reviews/refactor-app-js-split-r1.md:203:- R2 **加载顺序**:compare.html 中 ui-*.js 位于 diff.js/history.js 之后、app.js 之前;漏登记=启动即挂,防护网必抓
./.reviews/refactor-app-js-split-r1.md:213:| v2 | 2026-07-18 | bakeoff A/B:命名空间分叉(B 项目先例论证胜)+导出面无规则趋同+双方自发自检 | R1 重写为双形态+对照表;§1 补导出面与 {showWs};§0 放行纯 Node 自检;R5 补枚举 | 人(站2签核) |
./.reviews/refactor-app-js-split-r1.md:254:app.js L240–291 的导出块逐字搬入 `ui-export.js`，共 8 个函数（与 §1 映射一一对应，无增减）：
./.reviews/refactor-app-js-split-r1.md:280:5. compare.html 登记 `<script src="ui-export.js">`，位于 diff.js/history.js 之后、app.js 之前（R2）
./.reviews/refactor-app-js-split-r1.md:284:- **`window.ClearDiff` 直接引用保留**：R1 的"禁止模块间直接互调"指五个拆分出的 ui-* 模块之间；diff.js 是既有引擎，app.js 基线即直接读 `window.ClearDiff`，且派发指令的 ctx 注入面（ta/tb/stats/opts）未含引擎。若排队人裁定引擎也须经 ctx，改动仅限工厂头部三处引用。
./.reviews/refactor-app-js-split-r1.md:288:- `node --check ui-export.js` ✅（见汇报）
./.reviews/refactor-app-js-split-r1.md:289:- 未跑 smoke/浏览器（§0 禁令）；接线前本文件为静载不执行代码，不影响现行为
./.reviews/refactor-app-js-split-r1.md:295:# delta-file — U5/5: ui-file.js（rulebook_rev=v2）
./.reviews/refactor-app-js-split-r1.md:299:- 新文件 `ui-file.js`：§1 映射的 loadFile/paneEl/sortKeys/formatPane + `MAX_FILE_BYTES` 常量迁入。
./.reviews/refactor-app-js-split-r1.md:300:- **app.js/compare.html 本任务未动**（铁律：只写 ui-file.js 与本文件）。留守侧待办见「集成清单」。
./.reviews/refactor-app-js-split-r1.md:317:- `node --check ui-file.js` ✅
./.reviews/refactor-app-js-split-r1.md:323:  （`render()`/`persist()` → `ctx.render()`/`ctx.persist()`，无其他改动），禁 smoke 未跑（§0）。
./.reviews/refactor-app-js-split-r1.md:330:2. compare.html 登记 `<script src="ui-file.js">`，位于 diff.js/history.js 之后、app.js 之前（R2）。
./.reviews/refactor-app-js-split-r1.md:342:`confidence=high todos=0`（尾注已按 R5 v2 枚举格式写入 ui-file.js）
./.reviews/refactor-app-js-split-r1.md:344:# delta-history — ui-history.js 搬迁记录 (U4/5, rulebook_rev=v2)
./.reviews/refactor-app-js-split-r1.md:350:| relTime | 297–303 | ui-history.js | 私有（仅 renderHistList 消费，R6：只导出被绑定的函数） |
./.reviews/refactor-app-js-split-r1.md:351:| renderHistList | 304–317 | ui-history.js | init api 导出 |
./.reviews/refactor-app-js-split-r1.md:352:| saveCurrent | 318–326 | ui-history.js | init api 导出 |
./.reviews/refactor-app-js-split-r1.md:353:| restoreHist | 327–332 | ui-history.js | init api 导出 |
./.reviews/refactor-app-js-split-r1.md:354:| delHist | 333 | ui-history.js | init api 导出 |
./.reviews/refactor-app-js-split-r1.md:372:| flashBtn | 转发自 ui-export 的 init api | §1：flashBtn 迁入 ui-export.js |
./.reviews/refactor-app-js-split-r1.md:377:- `node --check ui-history.js` ✅
./.reviews/refactor-app-js-split-r1.md:379:- 未跑 tests/smoke.mjs、未起浏览器（§0 禁令）。
./.reviews/refactor-app-js-split-r1.md:384:2. compare.html 注册 `ui-history.js`，位于 diff.js/history.js 之后、app.js 之前（R2）。
./.reviews/refactor-app-js-split-r1.md:394:# delta-nav — app.js 侧改法（ui-nav.js 迁出后的接线说明）
./.reviews/refactor-app-js-split-r1.md:401:`ui-nav.js` 插在 history.js 之后、app.js 之前：
./.reviews/refactor-app-js-split-r1.md:406:<script src="ui-nav.js"></script>   <!-- 新增 -->
./.reviews/refactor-app-js-split-r1.md:450:- **R4 契约不变**：renderPips 仍只读 hunk 首行的 `data-htype`/`data-hline` dataset（函数体逐字迁移，经纯 Node 比对脚本核验四函数与原文逐字一致）。写方在 ui-render.js 的 `hmeta()`，跨模块不直调（R1），接口只有 dataset。
./.reviews/refactor-app-js-split-r1.md:461:# delta-render — app.js 侧配套改法（U1 ui-render.js 落地时由主流程套用）
./.reviews/refactor-app-js-split-r1.md:464:> 本文档只描述改法，未改动 app.js/compare.html（铁律：U1 只写 ui-render.js 与本文档）。
./.reviews/refactor-app-js-split-r1.md:475:- 上述所有注释随函数一并迁走（已逐字迁入 ui-render.js，勿在 app.js 留副本）。
./.reviews/refactor-app-js-split-r1.md:490:| 165 | renderDiff() | `view === "split" ? renderSplit(toRender) : view === "inline" ? renderInline(toRender) : renderUnified(toRender)` | `view === "split" ? R.renderSplit(toRender, { showWs }) : view === "inline" ? R.renderInline(toRender, { showWs }) : R.renderUnified(toRender, { showWs })` |
./.reviews/refactor-app-js-split-r1.md:496:- `{ showWs }` options bag 是三个渲染入口的唯一状态入参（RULEBOOK §1 v2）；`showWs` 状态变量本身**留在 app.js**（原 13 行），optWsShow 的 change 监听与 boot() 恢复逻辑不动。
./.reviews/refactor-app-js-split-r1.md:498:- renderHistList 的 esc 走 app.js 直接消费 `R.esc`；将来 U-history 拆出 ui-history.js 时按 R1 经 ctx 转发，此处不预支。
./.reviews/refactor-app-js-split-r1.md:507:  <script src="ui-render.js"></script>   <!-- 新增：diff.js/history.js 之后、app.js 之前 -->
./.reviews/refactor-app-js-split-r1.md:513:- **package.mjs 的 PAYLOAD 白名单**必须补 `ui-render.js`，否则商店 zip 缺文件、解包测试即挂（CLAUDE.md：仅白名单文件进包）。
./.reviews/refactor-app-js-split-r1.md:518:- 纯 Node 等价自检已过：旧函数原文（app.js 24–127 抠出、剔除 opts）vs 新模块，同 fixture 下 unified/inline/split × showWs on/off 共 6 组输出逐字节相等，另验 esc 导出与「缺省 bag ≡ showWs:false」。脚本在会话 scratchpad（`equiv-check.mjs`），判官可重建。
./.reviews/refactor-app-js-split-r1.md:519:- 套用本 delta 后的整体验证（smoke/浏览器）按 §0 留给批量站 4/5，此处不跑。
./.reviews/refactor-app-js-split-r1.md:526:- 141 项全绿: diff-test 48 / history-test 19 / smoke 68 / unified-blank 6 (2026-07-18)
./.reviews/refactor-app-js-split-r1.md:527:- 判官构成: 纯函数层由 diff/history/unified 测试覆盖;app.js(DOM 胶水层)由 smoke 整页断言充当差分层
./.reviews/refactor-app-js-split-r1.md:532:| 1 | 输入:input 监听不再触发比较 | 删 schedule() 调用 | 🔴 抓到(smoke 异常终止,退出码 1) |
./.reviews/refactor-app-js-split-r1.md:536:- 复原验证: app.js 与原始逐字节一致,smoke 复绿 68/68
./.reviews/refactor-app-js-split-r1.md:537:- 备注: 变红形态是"断言等待超时→异常退出"而非整洁的 failed 计数——判官有效但报错形态粗粝,排障时先看 smoke 输出前段
./.reviews/refactor-app-js-split-r1.md:541:/bin/zsh -lc 'git diff -- app.js compare.html package.mjs ui-render.js ui-nav.js ui-export.js ui-history.js ui-file.js' in /Users/zero/MyCode/diff-lens
./.reviews/refactor-app-js-split-r1.md:555:+// navigation, export, history UI, and file loading live in ui-render.js / ui-nav.js /
./.reviews/refactor-app-js-split-r1.md:556:+// ui-export.js / ui-history.js / ui-file.js (split per refactors/app-js-split/RULEBOOK.md;
./.reviews/refactor-app-js-split-r1.md:563:   let showWs = false;
./.reviews/refactor-app-js-split-r1.md:579:-    if (showWs) {
./.reviews/refactor-app-js-split-r1.md:718:+      result.innerHTML = view === "split" ? R.renderSplit(toRender, { showWs })
./.reviews/refactor-app-js-split-r1.md:719:+        : view === "inline" ? R.renderInline(toRender, { showWs })
./.reviews/refactor-app-js-split-r1.md:720:+        : R.renderUnified(toRender, { showWs });
./.reviews/refactor-app-js-split-r1.md:899:   if (optWsShow) optWsShow.addEventListener("change", () => { showWs = optWsShow.checked; render(); persistOpts(); });
./.reviews/refactor-app-js-split-r1.md:1068:+  <script src="ui-render.js"></script>
./.reviews/refactor-app-js-split-r1.md:1069:+  <script src="ui-nav.js"></script>
./.reviews/refactor-app-js-split-r1.md:1070:+  <script src="ui-export.js"></script>
./.reviews/refactor-app-js-split-r1.md:1071:+  <script src="ui-history.js"></script>
./.reviews/refactor-app-js-split-r1.md:1072:+  <script src="ui-file.js"></script>
./.reviews/refactor-app-js-split-r1.md:1084:+  "ui-render.js",
./.reviews/refactor-app-js-split-r1.md:1085:+  "ui-nav.js",
./.reviews/refactor-app-js-split-r1.md:1086:+  "ui-export.js",
./.reviews/refactor-app-js-split-r1.md:1087:+  "ui-history.js",
./.reviews/refactor-app-js-split-r1.md:1088:+  "ui-file.js",
./.reviews/refactor-app-js-split-r1.md:1094:已经看到编排层大范围替换点。现在读五个 `ui-*` 模块本体，重点核对：导出形态是否和 `app.js` 实际接线一致、是否偷偷改了逻辑、以及是否踩了 R1/R3/R4。
./.reviews/refactor-app-js-split-r1.md:1096:/bin/zsh -lc "sed -n '1,260p' ui-nav.js" in /Users/zero/MyCode/diff-lens
./.reviews/refactor-app-js-split-r1.md:1201:/bin/zsh -lc "sed -n '1,260p' ui-render.js" in /Users/zero/MyCode/diff-lens
./.reviews/refactor-app-js-split-r1.md:1204:// no chrome.*, no network, no state: callers pass an options bag ({ showWs }) explicitly.
./.reviews/refactor-app-js-split-r1.md:1212:  function fmt(s, showWs) {
./.reviews/refactor-app-js-split-r1.md:1214:    if (showWs) {
./.reviews/refactor-app-js-split-r1.md:1219:  function renderWords(words, showWs) {
./.reviews/refactor-app-js-split-r1.md:1221:      const t = fmt(w.text, showWs);
./.reviews/refactor-app-js-split-r1.md:1252:  function renderColumn(out, inlineChange, showWs) {
./.reviews/refactor-app-js-split-r1.md:1258:      if (r.type === "equal") html.push(urow("equal", "", r.aNum, r.bNum, fmt(r.text, showWs)));
./.reviews/refactor-app-js-split-r1.md:1259:      else if (r.type === "minor") html.push(urow("minor", "≈", r.aNum, r.bNum, renderWords(inlineChange ? r.words : r.bWords, showWs)));
./.reviews/refactor-app-js-split-r1.md:1260:      else if (r.type === "del") html.push(urow("del" + hs + (r.moved ? " moved" : ""), "−", r.aNum, null, fmt(r.text, showWs) + (r.moved ? moveTag("to", r.movePartnerNum) : ""), hs ? hmeta("del", r.aNum) : ""));
./.reviews/refactor-app-js-split-r1.md:1261:      else if (r.type === "add") html.push(urow("add" + hs + (r.moved ? " moved" : ""), "+", null, r.bNum, fmt(r.text, showWs) + (r.moved ? moveTag("from", r.movePartnerNum) : ""), hs ? hmeta("add", r.bNum) : ""));
./.reviews/refactor-app-js-split-r1.md:1264:          html.push(urow("change" + hs, "~", r.aNum, r.bNum, renderWords(r.words, showWs), hs ? hmeta("change", r.aNum) : ""));
./.reviews/refactor-app-js-split-r1.md:1266:          html.push(urow("change" + hs, "−", r.aNum, null, renderWords(r.aWords, showWs), hs ? hmeta("change", r.aNum) : ""));
./.reviews/refactor-app-js-split-r1.md:1267:          html.push(urow("change", "+", null, r.bNum, renderWords(r.bWords, showWs)));
./.reviews/refactor-app-js-split-r1.md:1274:  function renderUnified(out, opts) { return renderColumn(out, false, !!(opts && opts.showWs)); }
./.reviews/refactor-app-js-split-r1.md:1275:  function renderInline(out, opts) { return renderColumn(out, true, !!(opts && opts.showWs)); }
./.reviews/refactor-app-js-split-r1.md:1280:    const showWs = !!(opts && opts.showWs);
./.reviews/refactor-app-js-split-r1.md:1290:        left = scol("equal", r.aNum, fmt(r.text, showWs)); right = scol("equal b", r.bNum, fmt(r.text, showWs));
./.reviews/refactor-app-js-split-r1.md:1292:        left = scol("minor", r.aNum, renderWords(r.aWords, showWs)); right = scol("minor b", r.bNum, renderWords(r.bWords, showWs));
./.reviews/refactor-app-js-split-r1.md:1294:        left = scol("del" + (r.moved ? " moved" : ""), r.aNum, fmt(r.text, showWs) + (r.moved ? moveTag("to", r.movePartnerNum) : "")); right = scol("blank b", null, "");
./.reviews/refactor-app-js-split-r1.md:1296:        left = scol("blank", null, ""); right = scol("add b" + (r.moved ? " moved" : ""), r.bNum, fmt(r.text, showWs) + (r.moved ? moveTag("from", r.movePartnerNum) : ""));
./.reviews/refactor-app-js-split-r1.md:1298:        left = scol("chg", r.aNum, renderWords(r.aWords, showWs)); right = scol("chg b", r.bNum, renderWords(r.bWords, showWs));
./.reviews/refactor-app-js-split-r1.md:1307:  // 三个渲染入口收 { showWs } options bag；其余 9 个助手为模块私有。
./.reviews/refactor-app-js-split-r1.md:1313:/bin/zsh -lc "sed -n '1,260p' ui-export.js" in /Users/zero/MyCode/diff-lens
./.reviews/refactor-app-js-split-r1.md:1389:/bin/zsh -lc "sed -n '1,260p' ui-file.js" in /Users/zero/MyCode/diff-lens
./.reviews/refactor-app-js-split-r1.md:1391:/bin/zsh -lc "sed -n '1,260p' ui-history.js" in /Users/zero/MyCode/diff-lens
./.reviews/refactor-app-js-split-r1.md:1567:  "ui-render.js",
./.reviews/refactor-app-js-split-r1.md:1568:  "ui-nav.js",
./.reviews/refactor-app-js-split-r1.md:1569:  "ui-export.js",
./.reviews/refactor-app-js-split-r1.md:1570:  "ui-history.js",
./.reviews/refactor-app-js-split-r1.md:1571:  "ui-file.js",
./.reviews/refactor-app-js-split-r1.md:1611:  // 2. The privacy promise, checked against what actually ships rather than
./.reviews/refactor-app-js-split-r1.md:1612:  //    against the working tree. STORE_LISTING and the privacy policy both make
./.reviews/refactor-app-js-split-r1.md:1652:    run("node", [join(tmp, "tests", "smoke.mjs")], { cwd: tmp, stdio: "pipe" });
./.reviews/refactor-app-js-split-r1.md:1657:    die("The packed zip fails the smoke suite — something it needs isn't in PAYLOAD:\n" +
./.reviews/refactor-app-js-split-r1.md:1664:  console.log(`  ${packed.length} files, ${kb} KB — smoke suite passes against the unpacked zip`);
./.reviews/refactor-app-js-split-r1.md:1672:/bin/zsh -lc "rg -n \"chrome\\.|DiffLens(Render|Nav|Export|HistUI|File)|data-htype|data-hline|historyList|flashBtn|renderPips|indexHunks|jump\\(|jumpTo\\(|paneEl|formatPane|loadFile\" app.js ui-*.js compare.html package.mjs" in /Users/zero/MyCode/diff-lens
./.reviews/refactor-app-js-split-r1.md:1674:ui-render.js:2:// no chrome.*, no network, no state: callers pass an options bag ({ showWs }) explicitly.
./.reviews/refactor-app-js-split-r1.md:1675:ui-render.js:40:    return ' data-htype="' + type + '" data-hline="' + (line == null ? "" : line) + '"';
./.reviews/refactor-app-js-split-r1.md:1676:ui-render.js:106:  root.DiffLensRender = { esc, renderUnified, renderInline, renderSplit };
./.reviews/refactor-app-js-split-r1.md:1677:ui-history.js:2:// No network, no dependencies, and no chrome.* (storage writes stay in app.js, R3);
./.reviews/refactor-app-js-split-r1.md:1678:ui-history.js:3:// list state (historyList) lives in app.js and is reached only through ctx accessors.
./.reviews/refactor-app-js-split-r1.md:1679:ui-history.js:14:  //   esc                             — HTML escaper, forwarded from DiffLensRender
./.reviews/refactor-app-js-split-r1.md:1680:ui-history.js:17:  //   getHistoryList, setHistoryList  — historyList stays owned by app.js (§1)
./.reviews/refactor-app-js-split-r1.md:1681:ui-history.js:18:  //   persistHistory                  — chrome.storage write, kept in app.js (R3)
./.reviews/refactor-app-js-split-r1.md:1682:ui-history.js:19:  //   flashBtn                        — button feedback helper, forwarded from ui-export
./.reviews/refactor-app-js-split-r1.md:1683:ui-history.js:55:      ctx.flashBtn(histSave, "Saved ✓");
./.reviews/refactor-app-js-split-r1.md:1684:ui-history.js:75:  root.DiffLensHistUI = init;
./.reviews/refactor-app-js-split-r1.md:1685:ui-file.js:3:// 注入，模块自身零 DOM 查询、零 chrome.*（R3）——事件绑定仍归 app.js（R6）。
./.reviews/refactor-app-js-split-r1.md:1686:ui-file.js:11:    const paneEl = (which) => (which === "a" ? ctx.ta : ctx.tb);
./.reviews/refactor-app-js-split-r1.md:1687:ui-file.js:12:    function loadFile(file, which) {
./.reviews/refactor-app-js-split-r1.md:1688:ui-file.js:20:      reader.onload = () => { paneEl(which).value = String(reader.result || ""); ctx.render(); ctx.persist(); };
./.reviews/refactor-app-js-split-r1.md:1689:ui-file.js:39:    function formatPane(which) {
./.reviews/refactor-app-js-split-r1.md:1690:ui-file.js:40:      const el = paneEl(which);
./.reviews/refactor-app-js-split-r1.md:1691:ui-file.js:47:    // 导出面=实际消费面（§1 v2 原则外推）：app.js 只消费 loadFile/paneEl/formatPane，
./.reviews/refactor-app-js-split-r1.md:1692:ui-file.js:48:    // sortKeys 仅被 formatPane 内部调用，保持私有。
./.reviews/refactor-app-js-split-r1.md:1693:ui-file.js:49:    return { loadFile, paneEl, formatPane };
./.reviews/refactor-app-js-split-r1.md:1694:ui-file.js:52:  root.DiffLensFile = init;
./.reviews/refactor-app-js-split-r1.md:1695:ui-nav.js:1:// DiffLensNav — hunk 索引/上下跳转/pip 轨道（自 app.js 原样迁出）。No network calls.
./.reviews/refactor-app-js-split-r1.md:1696:ui-nav.js:4:// 与 ui-render 的唯一接口是 hunk 首行的 data-htype/data-hline dataset（R4），
./.reviews/refactor-app-js-split-r1.md:1697:ui-nav.js:18:    function indexHunks() {
./.reviews/refactor-app-js-split-r1.md:1698:ui-nav.js:22:      renderPips();
./.reviews/refactor-app-js-split-r1.md:1699:ui-nav.js:33:    // 类型与行号读 hunk 首行的 data-htype/data-hline（视图无关），不碰用户文本。
./.reviews/refactor-app-js-split-r1.md:1700:ui-nav.js:34:    function renderPips() {
./.reviews/refactor-app-js-split-r1.md:1701:ui-nav.js:64:    function jump(dir) {
./.reviews/refactor-app-js-split-r1.md:1702:ui-nav.js:82:    // 注意错误态只 updateNav 不 renderPips（隐藏轨道但不清空其 DOM），保持原语义。
./.reviews/refactor-app-js-split-r1.md:1703:ui-nav.js:86:    // jumpTo(i)：stats/pip 点击的既有模式「hunkIdx = i - 1 再 jump(1)」。
./.reviews/refactor-app-js-split-r1.md:1704:ui-nav.js:87:    // stats 点击等价于 jumpTo(0)；pip 点击传 Number(p.dataset.pip)。
./.reviews/refactor-app-js-split-r1.md:1705:ui-nav.js:89:    function jumpTo(i) {
./.reviews/refactor-app-js-split-r1.md:1706:ui-nav.js:92:      jump(1);
./.reviews/refactor-app-js-split-r1.md:1707:ui-nav.js:96:    return { indexHunks, renderPips, jump, jumpTo, reset };
./.reviews/refactor-app-js-split-r1.md:1708:ui-nav.js:99:  root.DiffLensNav = init;
./.reviews/refactor-app-js-split-r1.md:1709:ui-export.js:2:// diff, Markdown, .patch). All local: clipboard + Blob URL, no network — and no chrome.*
./.reviews/refactor-app-js-split-r1.md:1710:ui-export.js:8:  // Factory form (RULEBOOK R1): app.js calls DiffLensExport(ctx) once at boot and binds
./.reviews/refactor-app-js-split-r1.md:1711:ui-export.js:12:  window.DiffLensExport = function (ctx) {
./.reviews/refactor-app-js-split-r1.md:1712:ui-export.js:28:    function flashBtn(btn, label) {
./.reviews/refactor-app-js-split-r1.md:1713:ui-export.js:38:        .then(() => flashBtn(btn, okLabel || "Copied ✓"))
./.reviews/refactor-app-js-split-r1.md:1714:ui-export.js:39:        .catch(() => flashBtn(btn, "Copy failed"));
./.reviews/refactor-app-js-split-r1.md:1715:ui-export.js:66:      flashBtn($("dl-patch"), "Saved ✓"); closeExport();
./.reviews/refactor-app-js-split-r1.md:1716:ui-export.js:69:    return { plainDiffText, flashBtn, closeExport, copyText, copyResult, copyUnified, copyMarkdown, downloadPatch };
./.reviews/refactor-app-js-split-r1.md:1769:  let showWs = false;
./.reviews/refactor-app-js-split-r1.md:1786:    if (showWs) {
./.reviews/refactor-app-js-split-r1.md:2019:接下来补两块证据：一是直接比对 `golden.json` / `golden-after.json` 是否真一致，二是看现有 smoke/金样到底覆盖了哪些路径，哪些高危路径根本没打到。
./.reviews/refactor-app-js-split-r1.md:2052:/bin/zsh -lc "rg -n \"smoke|golden|showWhitespace|copy|download|history|fold|drag|format json|view\" tests refactors/app-js-split -g '"'!refactors/app-js-split/golden*.json'"'" in /Users/zero/MyCode/diff-lens
./.reviews/refactor-app-js-split-r1.md:2081:refactors/app-js-split/RULEBOOK.md:7:- 循环内**必跑** `node --check {文件}`;**允许**自建纯 Node 等价自检(v2:bakeoff 双方自发验证,合法化);**禁跑** tests/smoke.mjs 与任何起浏览器的验证(贵,站 4/5 批量跑——裁判价格定位)
./.reviews/refactor-app-js-split-r1.md:2082:refactors/app-js-split/RULEBOOK.md:13:| ui-render.js | 纯 HTML 生成 | esc/fmt/renderWords/moveTag/numCell/urow/hmeta/foldRowHtml/renderColumn/renderUnified/renderInline/scol/renderSplit | 无状态——三个渲染入口收 `{showWs}` options bag 下传(v2);**导出面=实际消费面:仅 esc/renderUnified/renderInline/renderSplit,其余 9 个私有**(bakeoff 双方无规则趋同) |
./.reviews/refactor-app-js-split-r1.md:2083:refactors/app-js-split/RULEBOOK.md:15:| ui-export.js | 复制/下载导出 | plainDiffText/flashBtn/closeExport/copyText/copyResult/copyUnified/copyMarkdown/downloadPatch | 无状态;输入引用经 ctx |
./.reviews/refactor-app-js-split-r1.md:2084:refactors/app-js-split/RULEBOOK.md:16:| ui-history.js | 历史列表 UI | relTime/renderHistList/saveCurrent/restoreHist/delHist | historyList 归 app.js,经 ctx 存取 |
./.reviews/refactor-app-js-split-r1.md:2085:refactors/app-js-split/RULEBOOK.md:18:| app.js(留守) | 编排:opts/render/renderDiff/schedule/persist*/boot/全部事件绑定 | — | view/fold/showWs/expandedFolds/lastA/lastB/historyList |
./.reviews/refactor-app-js-split-r1.md:2086:refactors/app-js-split/RULEBOOK.md:27:  | ui-history.js | `DiffLensHistUI` | init(ctx)(**避开已被 history.js 占用的 DiffLensHistory**) |
./.reviews/refactor-app-js-split-r1.md:2087:refactors/app-js-split/RULEBOOK.md:39:- R2 **加载顺序**:compare.html 中 ui-*.js 位于 diff.js/history.js 之后、app.js 之前;漏登记=启动即挂,防护网必抓
./.reviews/refactor-app-js-split-r1.md:2089:refactors/app-js-split/delta-nav.md:8:`ui-nav.js` 插在 history.js 之后、app.js 之前：
./.reviews/refactor-app-js-split-r1.md:2091:refactors/app-js-split/delta-history.md:1:# delta-history — ui-history.js 搬迁记录 (U4/5, rulebook_rev=v2)
./.reviews/refactor-app-js-split-r1.md:2092:refactors/app-js-split/delta-history.md:7:| relTime | 297–303 | ui-history.js | 私有（仅 renderHistList 消费，R6：只导出被绑定的函数） |
./.reviews/refactor-app-js-split-r1.md:2093:refactors/app-js-split/delta-history.md:8:| renderHistList | 304–317 | ui-history.js | init api 导出 |
./.reviews/refactor-app-js-split-r1.md:2094:refactors/app-js-split/delta-history.md:9:| saveCurrent | 318–326 | ui-history.js | init api 导出 |
./.reviews/refactor-app-js-split-r1.md:2095:refactors/app-js-split/delta-history.md:10:| restoreHist | 327–332 | ui-history.js | init api 导出 |
./.reviews/refactor-app-js-split-r1.md:2096:refactors/app-js-split/delta-history.md:11:| delHist | 333 | ui-history.js | init api 导出 |
./.reviews/refactor-app-js-split-r1.md:2102:refactors/app-js-split/delta-history.md:34:- `node --check ui-history.js` ✅
./.reviews/refactor-app-js-split-r1.md:2103:refactors/app-js-split/delta-history.md:36:- 未跑 tests/smoke.mjs、未起浏览器（§0 禁令）。
./.reviews/refactor-app-js-split-r1.md:2104:refactors/app-js-split/delta-history.md:41:2. compare.html 注册 `ui-history.js`，位于 diff.js/history.js 之后、app.js 之前（R2）。
./.reviews/refactor-app-js-split-r1.md:2113:refactors/app-js-split/delta-export.md:31:5. compare.html 登记 `<script src="ui-export.js">`，位于 diff.js/history.js 之后、app.js 之前（R2）
./.reviews/refactor-app-js-split-r1.md:2114:refactors/app-js-split/delta-export.md:40:- 未跑 smoke/浏览器（§0 禁令）；接线前本文件为静载不执行代码，不影响现行为
./.reviews/refactor-app-js-split-r1.md:2115:refactors/app-js-split/judge-report.md:4:- 141 项全绿: diff-test 48 / history-test 19 / smoke 68 / unified-blank 6 (2026-07-18)
./.reviews/refactor-app-js-split-r1.md:2116:refactors/app-js-split/judge-report.md:5:- 判官构成: 纯函数层由 diff/history/unified 测试覆盖;app.js(DOM 胶水层)由 smoke 整页断言充当差分层
./.reviews/refactor-app-js-split-r1.md:2117:refactors/app-js-split/judge-report.md:10:| 1 | 输入:input 监听不再触发比较 | 删 schedule() 调用 | 🔴 抓到(smoke 异常终止,退出码 1) |
./.reviews/refactor-app-js-split-r1.md:2118:refactors/app-js-split/judge-report.md:14:- 复原验证: app.js 与原始逐字节一致,smoke 复绿 68/68
./.reviews/refactor-app-js-split-r1.md:2119:refactors/app-js-split/judge-report.md:15:- 备注: 变红形态是"断言等待超时→异常退出"而非整洁的 failed 计数——判官有效但报错形态粗粝,排障时先看 smoke 输出前段
./.reviews/refactor-app-js-split-r1.md:2120:tests/smoke.mjs:1:// DiffLens end-to-end smoke — loads compare.html in headless Chromium and drives
./.reviews/refactor-app-js-split-r1.md:2121:tests/smoke.mjs:2:// the real UI. Run with: node tests/smoke.mjs
./.reviews/refactor-app-js-split-r1.md:2122:tests/smoke.mjs:63:  for (const f of ["compare.html", "app.css", "app.js", "diff.js", "history.js", "background.js"]) {
./.reviews/refactor-app-js-split-r1.md:2123:tests/smoke.mjs:84:  await page.click('[data-view="split"]');
./.reviews/refactor-app-js-split-r1.md:2124:tests/smoke.mjs:85:  ok((await page.locator("#result .srow").count()) > 0, "split view renders side-by-side rows");
./.reviews/refactor-app-js-split-r1.md:2125:tests/smoke.mjs:86:  await page.click('[data-view="inline"]');
./.reviews/refactor-app-js-split-r1.md:2126:tests/smoke.mjs:87:  ok((await page.locator("#result .row").count()) > 0, "inline view renders rows");
./.reviews/refactor-app-js-split-r1.md:2127:tests/smoke.mjs:88:  await page.click('[data-view="unified"]');
./.reviews/refactor-app-js-split-r1.md:2128:tests/smoke.mjs:95:  ok(await page.locator("#copy-diff").isVisible(), "export menu reveals 'Copy unified diff'");
./.reviews/refactor-app-js-split-r1.md:2129:tests/smoke.mjs:98:  ok(!(await page.locator("#copy-diff").isVisible()), "Escape closes the export menu");
./.reviews/refactor-app-js-split-r1.md:2130:tests/smoke.mjs:105:  // Collapse unchanged: a long mostly-identical input should fold, and a band expands.
./.reviews/refactor-app-js-split-r1.md:2131:tests/smoke.mjs:112:  await page.check("#opt-fold");
./.reviews/refactor-app-js-split-r1.md:2132:tests/smoke.mjs:113:  await page.waitForFunction(() => document.querySelectorAll("#result .foldbtn").length > 0);
./.reviews/refactor-app-js-split-r1.md:2133:tests/smoke.mjs:116:  ok((await page.locator("#result .foldbtn").count()) >= 1, "a fold band is shown");
./.reviews/refactor-app-js-split-r1.md:2134:tests/smoke.mjs:119:  await page.locator("#result .foldbtn").first().click();
./.reviews/refactor-app-js-split-r1.md:2135:tests/smoke.mjs:122:  await page.uncheck("#opt-fold");
./.reviews/refactor-app-js-split-r1.md:2136:tests/smoke.mjs:134:  // review found it could silently break: split view losing type semantics, a
./.reviews/refactor-app-js-split-r1.md:2137:tests/smoke.mjs:158:  // Split view: type semantics ride on data-htype, not on the srow's class list —
./.reviews/refactor-app-js-split-r1.md:2138:tests/smoke.mjs:169:  await page.click('[data-view="split"]');
./.reviews/refactor-app-js-split-r1.md:2139:tests/smoke.mjs:173:  ok(splitTypes === "change,del,add", "split view keeps pip type semantics (got: " + splitTypes + ")");
./.reviews/refactor-app-js-split-r1.md:2140:tests/smoke.mjs:175:  await page.click('[data-view="unified"]');
./.reviews/refactor-app-js-split-r1.md:2141:tests/smoke.mjs:190:  const originalViewport = page.viewportSize();
./.reviews/refactor-app-js-split-r1.md:2142:tests/smoke.mjs:195:  ok(narrowTops !== wideTops, "a viewport resize recomputes pip positions");
./.reviews/refactor-app-js-split-r1.md:2143:tests/smoke.mjs:205:  // Comparison history: save → restore → delete (in-memory without chrome storage).
./.reviews/refactor-app-js-split-r1.md:2144:tests/smoke.mjs:208:  await page.click("#history summary");
./.reviews/refactor-app-js-split-r1.md:2145:tests/smoke.mjs:209:  ok(await page.locator("#hist-save").isVisible(), "history menu opens");
./.reviews/refactor-app-js-split-r1.md:2146:tests/smoke.mjs:212:  ok((await page.locator("#hist-list .hist-item").count()) === 1, "saving adds one history entry");
./.reviews/refactor-app-js-split-r1.md:2147:tests/smoke.mjs:213:  ok(/alpha → alpha/.test(await page.textContent("#hist-list")), "history entry shows a preview");
./.reviews/refactor-app-js-split-r1.md:2148:tests/smoke.mjs:216:  await page.evaluate(() => { document.getElementById("history").open = true; });
./.reviews/refactor-app-js-split-r1.md:2149:tests/smoke.mjs:221:  await page.evaluate(() => { document.getElementById("history").open = true; });
./.reviews/refactor-app-js-split-r1.md:2150:tests/smoke.mjs:262:  // viewport, or the oldest entries become unreachable.
./.reviews/refactor-app-js-split-r1.md:2151:tests/smoke.mjs:263:  await page.click("#history summary");
./.reviews/refactor-app-js-split-r1.md:2152:tests/smoke.mjs:282:  ok(hist.items === 12, "history caps at 12 entries (got " + hist.items + ")");
./.reviews/refactor-app-js-split-r1.md:2153:tests/smoke.mjs:283:  ok(hist.scrolls, "history list scrolls instead of growing unbounded");
./.reviews/refactor-app-js-split-r1.md:2154:tests/smoke.mjs:284:  ok(hist.bottom <= hist.vh, "history menu stays inside the viewport");
./.reviews/refactor-app-js-split-r1.md:2155:tests/smoke.mjs:285:  await page.click("#history summary");
./.reviews/refactor-app-js-split-r1.md:2156:tests/smoke.mjs:344:  const TOGGLES = ["opt-ws", "opt-blank", "opt-case", "opt-char", "opt-ws-show", "opt-fold"];
./.reviews/refactor-app-js-split-r1.md:2157:tests/smoke.mjs:349:  await page.click('[data-view="split"]');
./.reviews/refactor-app-js-split-r1.md:2158:tests/smoke.mjs:350:  await page.click("#history summary");
./.reviews/refactor-app-js-split-r1.md:2159:tests/smoke.mjs:352:  await page.click("#history summary");
./.reviews/refactor-app-js-split-r1.md:2160:tests/smoke.mjs:362:    view: document.querySelector("[data-view].on")?.dataset.view,
./.reviews/refactor-app-js-split-r1.md:2161:tests/smoke.mjs:370:  ok(restored.view === "split", "view is restored on reopen");
./.reviews/refactor-app-js-split-r1.md:2162:tests/smoke.mjs:371:  ok(restored.hist === 1, "saved history survives a reopen");
./.reviews/refactor-app-js-split-r1.md:2163:tests/smoke.mjs:412:  await page.click('[data-view="split"]');
./.reviews/refactor-app-js-split-r1.md:2164:tests/smoke.mjs:413:  await page.click("#history summary");
./.reviews/refactor-app-js-split-r1.md:2167:refactors/app-js-split/delta-render.md:30:| 165 | renderDiff() | `view === "split" ? renderSplit(toRender) : view === "inline" ? renderInline(toRender) : renderUnified(toRender)` | `view === "split" ? R.renderSplit(toRender, { showWs }) : view === "inline" ? R.renderInline(toRender, { showWs }) : R.renderUnified(toRender, { showWs })` |
./.reviews/refactor-app-js-split-r1.md:2169:refactors/app-js-split/delta-render.md:38:- renderHistList 的 esc 走 app.js 直接消费 `R.esc`；将来 U-history 拆出 ui-history.js 时按 R1 经 ctx 转发，此处不预支。
./.reviews/refactor-app-js-split-r1.md:2171:refactors/app-js-split/delta-render.md:47:  <script src="ui-render.js"></script>   <!-- 新增：diff.js/history.js 之后、app.js 之前 -->
./.reviews/refactor-app-js-split-r1.md:2172:refactors/app-js-split/delta-render.md:59:- 套用本 delta 后的整体验证（smoke/浏览器）按 §0 留给批量站 4/5，此处不跑。
./.reviews/refactor-app-js-split-r1.md:2180:refactors/app-js-split/delta-file.md:29:  （`render()`/`persist()` → `ctx.render()`/`ctx.persist()`，无其他改动），禁 smoke 未跑（§0）。
./.reviews/refactor-app-js-split-r1.md:2181:refactors/app-js-split/delta-file.md:36:2. compare.html 登记 `<script src="ui-file.js">`，位于 diff.js/history.js 之后、app.js 之前（R2）。
./.reviews/refactor-app-js-split-r1.md:2183:refactors/app-js-split/batch-log.jsonl:4:{"at": "2026-07-18T09:32:44+08:00", "file": "ui-history.js", "agent": "cm-frontend-agent", "model": "inherit", "rulebook_rev": "v2", "diff_pass": "固定时钟15副作用逐字节", "todos": 0, "confidence": "high", "mount": "裸工厂(待v3裁决)"}
./.reviews/refactor-app-js-split-r1.md:2209:金样文件本身确实字节一致，但那只证明 18 个 `result.innerHTML` 快照一致；还不能替代对导出、文件加载、错误边界、历史存储等胶水面的覆盖判断。我现在补读 smoke 关键段。
./.reviews/refactor-app-js-split-r1.md:2211:/bin/zsh -lc "sed -n '1,260p' tests/smoke.mjs" in /Users/zero/MyCode/diff-lens
./.reviews/refactor-app-js-split-r1.md:2213:/bin/zsh -lc "sed -n '261,460p' tests/smoke.mjs" in /Users/zero/MyCode/diff-lens
./.reviews/refactor-app-js-split-r1.md:2378:// DiffLens end-to-end smoke — loads compare.html in headless Chromium and drives
./.reviews/refactor-app-js-split-r1.md:2379:// the real UI. Run with: node tests/smoke.mjs
./.reviews/refactor-app-js-split-r1.md:2408:// The manifest IS the privacy story: no host_permissions and no network means no
./.reviews/refactor-app-js-split-r1.md:2409:// code path can exfiltrate text. README, STORE_LISTING and the privacy policy all
./.reviews/refactor-app-js-split-r1.md:2700:     3	// navigation, export, history UI, and file loading live in ui-render.js / ui-nav.js /
./.reviews/refactor-app-js-split-r1.md:2701:     4	// ui-export.js / ui-history.js / ui-file.js (split per refactors/app-js-split/RULEBOOK.md;
./.reviews/refactor-app-js-split-r1.md:2714:    17	  let showWs = false;
./.reviews/refactor-app-js-split-r1.md:2784:    87	      result.innerHTML = view === "split" ? R.renderSplit(toRender, { showWs })
./.reviews/refactor-app-js-split-r1.md:2785:    88	        : view === "inline" ? R.renderInline(toRender, { showWs })
./.reviews/refactor-app-js-split-r1.md:2786:    89	        : R.renderUnified(toRender, { showWs });
./.reviews/refactor-app-js-split-r1.md:2819:   122	  if (optWsShow) optWsShow.addEventListener("change", () => { showWs = optWsShow.checked; render(); persistOpts(); });
./.reviews/refactor-app-js-split-r1.md:2929:   232	      showWhitespace: showWs, wordWrap: optWrap.checked, view: view,
./.reviews/refactor-app-js-split-r1.md:2944:   247	        if (typeof s.showWhitespace === "boolean" && optWsShow) { optWsShow.checked = s.showWhitespace; showWs = s.showWhitespace; }
./.reviews/refactor-app-js-split-r1.md:2969:/bin/zsh -lc 'for f in ui-render.js ui-nav.js ui-export.js ui-history.js ui-file.js compare.html package.mjs; do echo "===== $f ====="; nl -ba "$f" | sed -n '"'1,260p'; done" in /Users/zero/MyCode/diff-lens
./.reviews/refactor-app-js-split-r1.md:2971:===== ui-render.js =====
./.reviews/refactor-app-js-split-r1.md:2973:     2	// no chrome.*, no network, no state: callers pass an options bag ({ showWs }) explicitly.
./.reviews/refactor-app-js-split-r1.md:2981:    10	  function fmt(s, showWs) {
./.reviews/refactor-app-js-split-r1.md:2983:    12	    if (showWs) {
./.reviews/refactor-app-js-split-r1.md:2988:    17	  function renderWords(words, showWs) {
./.reviews/refactor-app-js-split-r1.md:2990:    19	      const t = fmt(w.text, showWs);
./.reviews/refactor-app-js-split-r1.md:3021:    50	  function renderColumn(out, inlineChange, showWs) {
./.reviews/refactor-app-js-split-r1.md:3027:    56	      if (r.type === "equal") html.push(urow("equal", "", r.aNum, r.bNum, fmt(r.text, showWs)));
./.reviews/refactor-app-js-split-r1.md:3028:    57	      else if (r.type === "minor") html.push(urow("minor", "≈", r.aNum, r.bNum, renderWords(inlineChange ? r.words : r.bWords, showWs)));
./.reviews/refactor-app-js-split-r1.md:3029:    58	      else if (r.type === "del") html.push(urow("del" + hs + (r.moved ? " moved" : ""), "−", r.aNum, null, fmt(r.text, showWs) + (r.moved ? moveTag("to", r.movePartnerNum) : ""), hs ? hmeta("del", r.aNum) : ""));
./.reviews/refactor-app-js-split-r1.md:3030:    59	      else if (r.type === "add") html.push(urow("add" + hs + (r.moved ? " moved" : ""), "+", null, r.bNum, fmt(r.text, showWs) + (r.moved ? moveTag("from", r.movePartnerNum) : ""), hs ? hmeta("add", r.bNum) : ""));
./.reviews/refactor-app-js-split-r1.md:3033:    62	          html.push(urow("change" + hs, "~", r.aNum, r.bNum, renderWords(r.words, showWs), hs ? hmeta("change", r.aNum) : ""));
./.reviews/refactor-app-js-split-r1.md:3035:    64	          html.push(urow("change" + hs, "−", r.aNum, null, renderWords(r.aWords, showWs), hs ? hmeta("change", r.aNum) : ""));
./.reviews/refactor-app-js-split-r1.md:3036:    65	          html.push(urow("change", "+", null, r.bNum, renderWords(r.bWords, showWs)));
./.reviews/refactor-app-js-split-r1.md:3043:    72	  function renderUnified(out, opts) { return renderColumn(out, false, !!(opts && opts.showWs)); }
./.reviews/refactor-app-js-split-r1.md:3044:    73	  function renderInline(out, opts) { return renderColumn(out, true, !!(opts && opts.showWs)); }
./.reviews/refactor-app-js-split-r1.md:3049:    78	    const showWs = !!(opts && opts.showWs);
./.reviews/refactor-app-js-split-r1.md:3059:    88	        left = scol("equal", r.aNum, fmt(r.text, showWs)); right = scol("equal b", r.bNum, fmt(r.text, showWs));
./.reviews/refactor-app-js-split-r1.md:3061:    90	        left = scol("minor", r.aNum, renderWords(r.aWords, showWs)); right = scol("minor b", r.bNum, renderWords(r.bWords, showWs));
./.reviews/refactor-app-js-split-r1.md:3063:    92	        left = scol("del" + (r.moved ? " moved" : ""), r.aNum, fmt(r.text, showWs) + (r.moved ? moveTag("to", r.movePartnerNum) : "")); right = scol("blank b", null, "");
./.reviews/refactor-app-js-split-r1.md:3065:    94	        left = scol("blank", null, ""); right = scol("add b" + (r.moved ? " moved" : ""), r.bNum, fmt(r.text, showWs) + (r.moved ? moveTag("from", r.movePartnerNum) : ""));
./.reviews/refactor-app-js-split-r1.md:3067:    96	        left = scol("chg", r.aNum, renderWords(r.aWords, showWs)); right = scol("chg b", r.bNum, renderWords(r.bWords, showWs));
./.reviews/refactor-app-js-split-r1.md:3076:   105	  // 三个渲染入口收 { showWs } options bag；其余 9 个助手为模块私有。
./.reviews/refactor-app-js-split-r1.md:3080:===== ui-nav.js =====
./.reviews/refactor-app-js-split-r1.md:3182:===== ui-export.js =====
./.reviews/refactor-app-js-split-r1.md:3255:===== ui-history.js =====
./.reviews/refactor-app-js-split-r1.md:3333:===== ui-file.js =====
./.reviews/refactor-app-js-split-r1.md:3403:    15	      <span class="privacy" title="Everything runs in this tab. Nothing is uploaded.">
./.reviews/refactor-app-js-split-r1.md:3506:   118	  <script src="ui-render.js"></script>
./.reviews/refactor-app-js-split-r1.md:3507:   119	  <script src="ui-nav.js"></script>
./.reviews/refactor-app-js-split-r1.md:3508:   120	  <script src="ui-export.js"></script>
./.reviews/refactor-app-js-split-r1.md:3509:   121	  <script src="ui-history.js"></script>
./.reviews/refactor-app-js-split-r1.md:3510:   122	  <script src="ui-file.js"></script>
./.reviews/refactor-app-js-split-r1.md:3550:    36	  "ui-render.js",
./.reviews/refactor-app-js-split-r1.md:3551:    37	  "ui-nav.js",
./.reviews/refactor-app-js-split-r1.md:3552:    38	  "ui-export.js",
./.reviews/refactor-app-js-split-r1.md:3553:    39	  "ui-history.js",
./.reviews/refactor-app-js-split-r1.md:3554:    40	  "ui-file.js",
./.reviews/refactor-app-js-split-r1.md:3594:    80	  // 2. The privacy promise, checked against what actually ships rather than
./.reviews/refactor-app-js-split-r1.md:3595:    81	  //    against the working tree. STORE_LISTING and the privacy policy both make
./.reviews/refactor-app-js-split-r1.md:3635:   121	    run("node", [join(tmp, "tests", "smoke.mjs")], { cwd: tmp, stdio: "pipe" });
./.reviews/refactor-app-js-split-r1.md:3640:   126	    die("The packed zip fails the smoke suite — something it needs isn't in PAYLOAD:\n" +
./.reviews/refactor-app-js-split-r1.md:3647:   133	  console.log(`  ${packed.length} files, ${kb} KB — smoke suite passes against the unpacked zip`);
./.reviews/refactor-app-js-split-r1.md:3674:上下文自取: git status/diff 看全部未提交改动;规则见 refactors/app-js-split/RULEBOOK.md(v3);等价证据:smoke 68全绿、金样18组逐字节一致(golden.json vs golden-after.json)、3处变异重种全抓红(含 ui-nav 模块内部)。
./.reviews/refactor-app-js-split-r1.md:3676:审查重点(逐项答):1) app.js 编排层的接线有无错漏(对照 refactors/app-js-split/delta-*.md 的调用点表);2) 有无夹带行为变更(哪怕一处文案/时序/守卫语义);3) 模块边界纪律(R1禁互调/R3 chrome隔离/R4 dataset契约)有无违反;4) 等价验证的覆盖有无关键盲区(金样6输入×3视图+smoke,漏了什么高危面?);5) compare.html/package.mjs 波及处理是否完整。
./.reviews/refactor-app-js-split-r1.md:3814:?? ui-export.js
./.reviews/refactor-app-js-split-r1.md:3815:?? ui-file.js
./.reviews/refactor-app-js-split-r1.md:3816:?? ui-history.js
./.reviews/refactor-app-js-split-r1.md:3817:?? ui-nav.js
./.reviews/refactor-app-js-split-r1.md:3818:?? ui-render.js
./.reviews/refactor-app-js-split-r1.md:3829:- 循环内**必跑** `node --check {文件}`;**允许**自建纯 Node 等价自检(v2:bakeoff 双方自发验证,合法化);**禁跑** tests/smoke.mjs 与任何起浏览器的验证(贵,站 4/5 批量跑——裁判价格定位)
./.reviews/refactor-app-js-split-r1.md:3835:| ui-render.js | 纯 HTML 生成 | esc/fmt/renderWords/moveTag/numCell/urow/hmeta/foldRowHtml/renderColumn/renderUnified/renderInline/scol/renderSplit | 无状态——三个渲染入口收 `{showWs}` options bag 下传(v2);**导出面=实际消费面:仅 esc/renderUnified/renderInline/renderSplit,其余 9 个私有**(bakeoff 双方无规则趋同) |
./.reviews/refactor-app-js-split-r1.md:3836:| ui-nav.js | hunk 索引/上下跳转/pip 轨道 | indexHunks/updateNav/renderPips/jump | 拥有 hunks/hunkIdx;DOM 引用经 init(ctx) 注入 |
./.reviews/refactor-app-js-split-r1.md:3837:| ui-export.js | 复制/下载导出 | plainDiffText/flashBtn/closeExport/copyText/copyResult/copyUnified/copyMarkdown/downloadPatch | 无状态;输入引用经 ctx |
./.reviews/refactor-app-js-split-r1.md:3838:| ui-history.js | 历史列表 UI | relTime/renderHistList/saveCurrent/restoreHist/delHist | historyList 归 app.js,经 ctx 存取 |
./.reviews/refactor-app-js-split-r1.md:3839:| ui-file.js | 文件加载 + JSON 格式化 | loadFile/paneEl/sortKeys/formatPane | 无状态 |
./.reviews/refactor-app-js-split-r1.md:3840:| app.js(留守) | 编排:opts/render/renderDiff/schedule/persist*/boot/全部事件绑定 | — | view/fold/showWs/expandedFolds/lastA/lastB/historyList |
./.reviews/refactor-app-js-split-r1.md:3846:  | ui-render.js | `DiffLensRender` | 直挂(纯函数) |
./.reviews/refactor-app-js-split-r1.md:3847:  | ui-nav.js | `DiffLensNav` | init(ctx) 工厂(拥有 hunks/hunkIdx) |
./.reviews/refactor-app-js-split-r1.md:3848:  | ui-export.js | `DiffLensExport` | init(ctx)(需 DOM 引用与 opts 存取) |
./.reviews/refactor-app-js-split-r1.md:3849:  | ui-history.js | `DiffLensHistUI` | init(ctx)(**避开已被 history.js 占用的 DiffLensHistory**) |
./.reviews/refactor-app-js-split-r1.md:3850:  | ui-file.js | `DiffLensFile` | init(ctx)(需面板引用) |
./.reviews/refactor-app-js-split-r1.md:3861:- R2 **加载顺序**:compare.html 中 ui-*.js 位于 diff.js/history.js 之后、app.js 之前;漏登记=启动即挂,防护网必抓
./.reviews/refactor-app-js-split-r1.md:3871:| v2 | 2026-07-18 | bakeoff A/B:命名空间分叉(B 项目先例论证胜)+导出面无规则趋同+双方自发自检 | R1 重写为双形态+对照表;§1 补导出面与 {showWs};§0 放行纯 Node 自检;R5 补枚举 | 人(站2签核) |
./.reviews/refactor-app-js-split-r1.md:3901:零发现：我没在当前未提交代码里找到能落成具体失败场景的接线错误、夹带行为变更，或 R1/R3/R4 违规。`golden.json` 和 `golden-after.json` 我直接比过，字节完全一致，两个文件都是 9701 bytes。唯一偏差是 [delta-file.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-file.md:6) 还写着旧的 `.init` 形态，但落地代码 [app.js](/Users/zero/MyCode/diff-lens/app.js:49) / [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:52) 已按 RULEBOOK v3 的裸工厂实现；这是文档漂移，不是运行时问题。
./.reviews/refactor-app-js-split-r1.md:3903:1. `app.js` 编排层接线无错漏。`ui-render` 的 6 个调用点已改到 [app.js](/Users/zero/MyCode/diff-lens/app.js:57)、[app.js](/Users/zero/MyCode/diff-lens/app.js:87)、[app.js](/Users/zero/MyCode/diff-lens/app.js:88)、[app.js](/Users/zero/MyCode/diff-lens/app.js:89)；`ui-nav` 的实例化和所有调用点都按 [delta-nav.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-nav.md:21) 落地在 [app.js](/Users/zero/MyCode/diff-lens/app.js:38)、[app.js](/Users/zero/MyCode/diff-lens/app.js:60)、[app.js](/Users/zero/MyCode/diff-lens/app.js:71)、[app.js](/Users/zero/MyCode/diff-lens/app.js:98)、[app.js](/Users/zero/MyCode/diff-lens/app.js:121)、[app.js](/Users/zero/MyCode/diff-lens/app.js:126)、[app.js](/Users/zero/MyCode/diff-lens/app.js:158)、[app.js](/Users/zero/MyCode/diff-lens/app.js:168)、[app.js](/Users/zero/MyCode/diff-lens/app.js:174)、[app.js](/Users/zero/MyCode/diff-lens/app.js:183)；`ui-export` / `ui-history` / `ui-file` 绑定也都齐了，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:39)、[app.js](/Users/zero/MyCode/diff-lens/app.js:42)、[app.js](/Users/zero/MyCode/diff-lens/app.js:49)、[app.js](/Users/zero/MyCode/diff-lens/app.js:138)、[app.js](/Users/zero/MyCode/diff-lens/app.js:142)、[app.js](/Users/zero/MyCode/diff-lens/app.js:151)、[app.js](/Users/zero/MyCode/diff-lens/app.js:206)、[app.js](/Users/zero/MyCode/diff-lens/app.js:218)、[app.js](/Users/zero/MyCode/diff-lens/app.js:237)、[app.js](/Users/zero/MyCode/diff-lens/app.js:257)。
./.reviews/refactor-app-js-split-r1.md:3905:2. 没发现夹带行为变更。错误边界文案和 `nav.reset()` 语义与旧版三连一致，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:57) 和 [ui-nav.js](/Users/zero/MyCode/diff-lens/ui-nav.js:81)；导出按钮反馈、`1200ms`/`1000ms` 时序、空导出提示文案都保留，见 [ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:28)、[ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:46)、[ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:57)；历史保存/恢复/删除守卫和副作用顺序也没变，见 [ui-history.js](/Users/zero/MyCode/diff-lens/ui-history.js:48)。
./.reviews/refactor-app-js-split-r1.md:3907:3. 模块边界纪律没发现违规。R1 方面，跨模块共享只经 `app.js` 转发：`esc`/`flashBtn`/`DiffLensHistory` 都是 ctx 注入，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:42) 和 [ui-history.js](/Users/zero/MyCode/diff-lens/ui-history.js:7)。R3 方面，`chrome.*` 只剩 [app.js](/Users/zero/MyCode/diff-lens/app.js:25)、[app.js](/Users/zero/MyCode/diff-lens/app.js:41)、[app.js](/Users/zero/MyCode/diff-lens/app.js:226)、[app.js](/Users/zero/MyCode/diff-lens/app.js:238)、[app.js](/Users/zero/MyCode/diff-lens/app.js:260)。R4 方面，写侧仍由 [ui-render.js](/Users/zero/MyCode/diff-lens/ui-render.js:37) 产出 `data-htype/data-hline`，读侧仍由 [ui-nav.js](/Users/zero/MyCode/diff-lens/ui-nav.js:32) 只读 dataset。
./.reviews/refactor-app-js-split-r1.md:3909:4. 等价验证有 3 个关键盲区。`showWs` 真渲染路径没被金样覆盖：快照脚本从未打开 `opt-ws-show`，见 [golden-capture.mjs](/Users/zero/MyCode/diff-lens/refactors/app-js-split/golden-capture.mjs:35)，而这次重构恰好把它改成 `{ showWs }` 透传，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:87) 和 [ui-render.js](/Users/zero/MyCode/diff-lens/ui-render.js:72)。`ui-export` / `ui-file` 的实行为大盲区：smoke 只验导出菜单可见和 `Escape` 关闭，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:94)，从不点复制/下载，也不测 FileReader 成功/失败、5MB 守卫、拖放、`Format JSON`，而这些正是整块迁出的逻辑，见 [ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:15) 和 [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:12)。另外，smoke 的源码级隐私扫描还只扫旧文件集，不含 `ui-*.js`，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:63)；如果新模块里误加外链，68 绿也未必会报，得靠打包校验补上。
./.reviews/refactor-app-js-split-r1.md:3911:5. `compare.html` / `package.mjs` 的波及处理是完整的。[compare.html](/Users/zero/MyCode/diff-lens/compare.html:116) 已把 5 个 `ui-*.js` 放在 `diff.js`/`history.js` 之后、`app.js` 之前；[package.mjs](/Users/zero/MyCode/diff-lens/package.mjs:28) 也把 5 个新文件全加进 `PAYLOAD`，并且最终仍会对解包产物跑 smoke，见 [package.mjs](/Users/zero/MyCode/diff-lens/package.mjs:117)。这两处我没看到漏项。
./.reviews/refactor-app-js-split-r1.md:3914:零发现：我没在当前未提交代码里找到能落成具体失败场景的接线错误、夹带行为变更，或 R1/R3/R4 违规。`golden.json` 和 `golden-after.json` 我直接比过，字节完全一致，两个文件都是 9701 bytes。唯一偏差是 [delta-file.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-file.md:6) 还写着旧的 `.init` 形态，但落地代码 [app.js](/Users/zero/MyCode/diff-lens/app.js:49) / [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:52) 已按 RULEBOOK v3 的裸工厂实现；这是文档漂移，不是运行时问题。
./.reviews/refactor-app-js-split-r1.md:3916:1. `app.js` 编排层接线无错漏。`ui-render` 的 6 个调用点已改到 [app.js](/Users/zero/MyCode/diff-lens/app.js:57)、[app.js](/Users/zero/MyCode/diff-lens/app.js:87)、[app.js](/Users/zero/MyCode/diff-lens/app.js:88)、[app.js](/Users/zero/MyCode/diff-lens/app.js:89)；`ui-nav` 的实例化和所有调用点都按 [delta-nav.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-nav.md:21) 落地在 [app.js](/Users/zero/MyCode/diff-lens/app.js:38)、[app.js](/Users/zero/MyCode/diff-lens/app.js:60)、[app.js](/Users/zero/MyCode/diff-lens/app.js:71)、[app.js](/Users/zero/MyCode/diff-lens/app.js:98)、[app.js](/Users/zero/MyCode/diff-lens/app.js:121)、[app.js](/Users/zero/MyCode/diff-lens/app.js:126)、[app.js](/Users/zero/MyCode/diff-lens/app.js:158)、[app.js](/Users/zero/MyCode/diff-lens/app.js:168)、[app.js](/Users/zero/MyCode/diff-lens/app.js:174)、[app.js](/Users/zero/MyCode/diff-lens/app.js:183)；`ui-export` / `ui-history` / `ui-file` 绑定也都齐了，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:39)、[app.js](/Users/zero/MyCode/diff-lens/app.js:42)、[app.js](/Users/zero/MyCode/diff-lens/app.js:49)、[app.js](/Users/zero/MyCode/diff-lens/app.js:138)、[app.js](/Users/zero/MyCode/diff-lens/app.js:142)、[app.js](/Users/zero/MyCode/diff-lens/app.js:151)、[app.js](/Users/zero/MyCode/diff-lens/app.js:206)、[app.js](/Users/zero/MyCode/diff-lens/app.js:218)、[app.js](/Users/zero/MyCode/diff-lens/app.js:237)、[app.js](/Users/zero/MyCode/diff-lens/app.js:257)。
./.reviews/refactor-app-js-split-r1.md:3918:2. 没发现夹带行为变更。错误边界文案和 `nav.reset()` 语义与旧版三连一致，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:57) 和 [ui-nav.js](/Users/zero/MyCode/diff-lens/ui-nav.js:81)；导出按钮反馈、`1200ms`/`1000ms` 时序、空导出提示文案都保留，见 [ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:28)、[ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:46)、[ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:57)；历史保存/恢复/删除守卫和副作用顺序也没变，见 [ui-history.js](/Users/zero/MyCode/diff-lens/ui-history.js:48)。
./.reviews/refactor-app-js-split-r1.md:3920:3. 模块边界纪律没发现违规。R1 方面，跨模块共享只经 `app.js` 转发：`esc`/`flashBtn`/`DiffLensHistory` 都是 ctx 注入，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:42) 和 [ui-history.js](/Users/zero/MyCode/diff-lens/ui-history.js:7)。R3 方面，`chrome.*` 只剩 [app.js](/Users/zero/MyCode/diff-lens/app.js:25)、[app.js](/Users/zero/MyCode/diff-lens/app.js:41)、[app.js](/Users/zero/MyCode/diff-lens/app.js:226)、[app.js](/Users/zero/MyCode/diff-lens/app.js:238)、[app.js](/Users/zero/MyCode/diff-lens/app.js:260)。R4 方面，写侧仍由 [ui-render.js](/Users/zero/MyCode/diff-lens/ui-render.js:37) 产出 `data-htype/data-hline`，读侧仍由 [ui-nav.js](/Users/zero/MyCode/diff-lens/ui-nav.js:32) 只读 dataset。
./.reviews/refactor-app-js-split-r1.md:3922:4. 等价验证有 3 个关键盲区。`showWs` 真渲染路径没被金样覆盖：快照脚本从未打开 `opt-ws-show`，见 [golden-capture.mjs](/Users/zero/MyCode/diff-lens/refactors/app-js-split/golden-capture.mjs:35)，而这次重构恰好把它改成 `{ showWs }` 透传，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:87) 和 [ui-render.js](/Users/zero/MyCode/diff-lens/ui-render.js:72)。`ui-export` / `ui-file` 的实行为大盲区：smoke 只验导出菜单可见和 `Escape` 关闭，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:94)，从不点复制/下载，也不测 FileReader 成功/失败、5MB 守卫、拖放、`Format JSON`，而这些正是整块迁出的逻辑，见 [ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:15) 和 [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:12)。另外，smoke 的源码级隐私扫描还只扫旧文件集，不含 `ui-*.js`，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:63)；如果新模块里误加外链，68 绿也未必会报，得靠打包校验补上。
./.reviews/refactor-app-js-split-r1.md:3924:5. `compare.html` / `package.mjs` 的波及处理是完整的。[compare.html](/Users/zero/MyCode/diff-lens/compare.html:116) 已把 5 个 `ui-*.js` 放在 `diff.js`/`history.js` 之后、`app.js` 之前；[package.mjs](/Users/zero/MyCode/diff-lens/package.mjs:28) 也把 5 个新文件全加进 `PAYLOAD`，并且最终仍会对解包产物跑 smoke，见 [package.mjs](/Users/zero/MyCode/diff-lens/package.mjs:117)。这两处我没看到漏项。
./运行日志.jsonl:4:{"at":"2026-07-17T02:05:06Z","node":"N3","feature":"1.compare-page-redesign","task":"T-001","event":"decision","detail":"选了装 Playwright(全局)；为什么：T-004 的 manifest 权限守卫住在 smoke.mjs，跑不起来这条守卫就是死代码；放弃了：降级人工截图(省500MB但AC-016无法验证)、加package.json(会破坏仓库零依赖)"}
./运行日志.jsonl:6:{"at":"2026-07-17T02:06:43Z","node":"N3","feature":"1.compare-page-redesign","task":"T-001","event":"decision","detail":"浏览器测试工具装好了(全局)；但发现 smoke.mjs 写死了探测路径找不到它，改用 npm root -g 动态解析，留给 T-004"}
./运行日志.jsonl:32:{"at":"2026-07-18T00:47:04+0800","node":"N5","feature":"2.visual-refresh-and-change-rail","task":"T-004","event":"task_done","detail":"视觉精修落地,双主题截图核验,smoke 57全绿"}
./运行日志.jsonl:38:{"at":"2026-07-18T01:02:56+0800","node":"N5","feature":"2.visual-refresh-and-change-rail","task":"T-005","event":"task_done","detail":"smoke 57→68,含反假绿灯三条,全绿"}
./2.visual-refresh-and-change-rail/.reviews/2.visual-refresh-and-change-rail-T003-r2.md:7:验证上，`node tests/diff-test.mjs` 通过（`48 passed, 0 failed`），`node tests/history-test.mjs` 通过（`19 passed, 0 failed`）。残余风险只有两点：`tests/smoke.mjs` 在当前只读沙箱里因 Playwright `mkdtemp` 权限失败未能复跑；另外 AC-013/AC-014 对应的 pip 烟测断言目前看起来仍未补进 `tests/smoke.mjs`。结论：这轮 `renderPips` 修复我这里给 `approved`。
./.claude/rules/frontend.md:14:- 状态变量放 IIFE 顶部（`view`、`showWs`、`fold`、`hunks`、`expandedFolds`），不挂 `window`
./2.visual-refresh-and-change-rail/design.md:12:- 涉及层: **仅前端页面层**（markup / 样式 / 渲染与控件绑定 / smoke 测试）
./2.visual-refresh-and-change-rail/design.md:29:| `tests/smoke.mjs` (348 行) | 扩充 | AC-002/003/004 三条 pip 断言；**现有断言零改动存活**（id/类名不变） |
./2.visual-refresh-and-change-rail/design.md:31:| `diff.js` / `history.js` / `background.js` / `manifest.json` / `docs/privacy.html` | **不动** | 引擎、历史、外壳、权限、披露全不碰 |
./2.visual-refresh-and-change-rail/design.md:55:### 模块 3: 测试扩充（tests/smoke.mjs）
./2.visual-refresh-and-change-rail/design.md:68:**控件 id 与 `.hist-*` 类名清单沿用上轮契约，零变更**（smoke.mjs 依赖）。
./2.visual-refresh-and-change-rail/design.md:95:- **R4 假绿灯**（上轮教训直接继承 + Codex 实锤三个盲区）：固定宽度 Unified 路径全绿掩盖不了 Split 无类型、缩窗漂移、wrap 后 `.current` 丢失——smoke 必须含模块 3 的反假绿灯三条；AC-008/AC-011 的人工走查仍不可省
./1.compare-page-redesign/.reviews/1.compare-page-redesign-package-r1.md:29:- **解压 zip 跑真实 smoke 套件** → 这是唯一真正的完整性证明，取代同义反复的校验（F15）
./.claude/rules/testing.md:13:- 端到端冒烟：`node tests/smoke.mjs`（headless Chromium 驱动真实 `compare.html`；Playwright 找不到时退出码 2，不算失败）
./.claude/rules/testing.md:25:- 纯 UI 的部分（`app.js` 渲染、`background.js`）由 `smoke.mjs` 覆盖，不写单测
./.claude/rules/testing.md:29:`smoke.mjs` 断言 manifest 权限恒等于 `storage` + `contextMenus`、无 `host_permissions` / `optional_permissions` / `content_scripts`，并逐文件断言 `compare.html` / `app.css` / `app.js` / `diff.js` / `history.js` / `background.js` 无任何外部请求（匹配 URL 本身，不匹配 `src=` 这类属性形式——CSS 的外链走 `@import` / `url()`，属性形正则一个都抓不到）。
./.claude/rules/testing.md:33:> 史料：这条守卫直到 2026-07-17 才真正存在。在那之前，本文件与 `docs/ARCHITECTURE.md` 都**声称**它存在，而 `smoke.mjs` 里一行都没有——即产品最核心的隐私不变式裸奔了整个 v0.1–v0.2 周期，却有两份文档为它背书。教训：**写「某测试保证了 X」之前，先去那个测试文件里 grep 一遍**。
./.claude/rules/testing.md:38:- 命名：`{模块名}-test.mjs`（单测）、`smoke.mjs`（E2E）
./2.visual-refresh-and-change-rail/METRICS.md:9:smoke:        57 passed, 0 failed (exit 0, Playwright 1.61.1)
./2.visual-refresh-and-change-rail/METRICS.md:11:Codex 独立复跑前两条计数一致（smoke 沙箱无 Playwright 跳过，本机实跑为准）。
./.claude/rules/git-workflow.md:23:Prep for store submission: v0.2.0 + accurate privacy/storage disclosures
./.claude/rules/git-workflow.md:34:- 涉及 UI/权限的改动跑 `node tests/smoke.mjs`
./.claude/rules/git-workflow.md:41:- 合入前置：单测通过；触碰 `manifest.json`、`docs/privacy.html`、`STORE_LISTING.md` 的 PR 必须人工确认——这三处是对用户的公开承诺
./.claude/settings.json:9:      "Bash(node tests/smoke.mjs:*)",
./1.compare-page-redesign/.reviews/1.compare-page-redesign-T004-r1.md:1:# T-004 (tests/smoke.mjs) — 审查凭证 r1
./LESSONS.md:7:## 2026-07-18 — 2.visual-refresh-and-change-rail / T-005 smoke 断言
./LESSONS.md:9:- `[已结构化]` **等待条件必须锚定新内容的确切特征**：上一个用例留下的同类 DOM 会让 `length > 0` 类条件在防抖重渲染前提前为真，断言读到旧状态。修法：等确切数量（`=== 3`）或给旧节点打 stale 标记等其重建。已固化进 smoke.mjs 的 rail 用例（markStale/railRebuilt）。
./tests/smoke.mjs:1:// DiffLens end-to-end smoke — loads compare.html in headless Chromium and drives
./tests/smoke.mjs:2:// the real UI. Run with: node tests/smoke.mjs
./tests/smoke.mjs:31:// The manifest IS the privacy story: no host_permissions and no network means no
./tests/smoke.mjs:32:// code path can exfiltrate text. README, STORE_LISTING and the privacy policy all
./tests/smoke.mjs:63:  for (const f of ["compare.html", "app.css", "app.js", "diff.js", "history.js", "background.js", "ui-render.js", "ui-nav.js", "ui-export.js", "ui-history.js", "ui-file.js"]) {
./1.compare-page-redesign/design-baseline/baseline.html:139:.privacy {
./1.compare-page-redesign/design-baseline/baseline.html:146:.privacy b {
./1.compare-page-redesign/design-baseline/baseline.html:155:.privacy span {
./1.compare-page-redesign/design-baseline/baseline.html:472:      <span class="privacy" title="Everything runs in this tab. Nothing is uploaded.">
./1.compare-page-redesign/design-baseline/baseline.html:1001:  var view = "unified", showWs = false, fold = false;
./1.compare-page-redesign/design-baseline/baseline.html:1071:    if (showWs) h = h.replace(/\t/g, '<span class="ws">→</span>').replace(/ /g, '<span class="ws">·</span>');
./1.compare-page-redesign/design-baseline/baseline.html:1391:  optWsShow.addEventListener("change", function () { showWs = optWsShow.checked; render(); });
./refactors/app-js-split/RULEBOOK.md:7:- 循环内**必跑** `node --check {文件}`;**允许**自建纯 Node 等价自检(v2:bakeoff 双方自发验证,合法化);**禁跑** tests/smoke.mjs 与任何起浏览器的验证(贵,站 4/5 批量跑——裁判价格定位)
./refactors/app-js-split/RULEBOOK.md:13:| ui-render.js | 纯 HTML 生成 | esc/fmt/renderWords/moveTag/numCell/urow/hmeta/foldRowHtml/renderColumn/renderUnified/renderInline/scol/renderSplit | 无状态——三个渲染入口收 `{showWs}` options bag 下传(v2);**导出面=实际消费面:仅 esc/renderUnified/renderInline/renderSplit,其余 9 个私有**(bakeoff 双方无规则趋同) |
./refactors/app-js-split/RULEBOOK.md:14:| ui-nav.js | hunk 索引/上下跳转/pip 轨道 | indexHunks/updateNav/renderPips/jump | 拥有 hunks/hunkIdx;DOM 引用经 init(ctx) 注入 |
./refactors/app-js-split/RULEBOOK.md:15:| ui-export.js | 复制/下载导出 | plainDiffText/flashBtn/closeExport/copyText/copyResult/copyUnified/copyMarkdown/downloadPatch | 无状态;输入引用经 ctx |
./refactors/app-js-split/RULEBOOK.md:16:| ui-history.js | 历史列表 UI | relTime/renderHistList/saveCurrent/restoreHist/delHist | historyList 归 app.js,经 ctx 存取 |
./refactors/app-js-split/RULEBOOK.md:17:| ui-file.js | 文件加载 + JSON 格式化 | loadFile/paneEl/sortKeys/formatPane | 无状态 |
./refactors/app-js-split/RULEBOOK.md:18:| app.js(留守) | 编排:opts/render/renderDiff/schedule/persist*/boot/全部事件绑定 | — | view/fold/showWs/expandedFolds/lastA/lastB/historyList |
./refactors/app-js-split/RULEBOOK.md:24:  | ui-render.js | `DiffLensRender` | 直挂(纯函数) |
./refactors/app-js-split/RULEBOOK.md:25:  | ui-nav.js | `DiffLensNav` | init(ctx) 工厂(拥有 hunks/hunkIdx) |
./refactors/app-js-split/RULEBOOK.md:26:  | ui-export.js | `DiffLensExport` | init(ctx)(需 DOM 引用与 opts 存取) |
./refactors/app-js-split/RULEBOOK.md:27:  | ui-history.js | `DiffLensHistUI` | init(ctx)(**避开已被 history.js 占用的 DiffLensHistory**) |
./refactors/app-js-split/RULEBOOK.md:28:  | ui-file.js | `DiffLensFile` | init(ctx)(需面板引用) |
./refactors/app-js-split/RULEBOOK.md:39:- R2 **加载顺序**:compare.html 中 ui-*.js 位于 diff.js/history.js 之后、app.js 之前;漏登记=启动即挂,防护网必抓
./refactors/app-js-split/RULEBOOK.md:49:| v2 | 2026-07-18 | bakeoff A/B:命名空间分叉(B 项目先例论证胜)+导出面无规则趋同+双方自发自检 | R1 重写为双形态+对照表;§1 补导出面与 {showWs};§0 放行纯 Node 自检;R5 补枚举 | 人(站2签核) |
./refactors/app-js-split/judge-report.md:4:- 141 项全绿: diff-test 48 / history-test 19 / smoke 68 / unified-blank 6 (2026-07-18)
./refactors/app-js-split/judge-report.md:5:- 判官构成: 纯函数层由 diff/history/unified 测试覆盖;app.js(DOM 胶水层)由 smoke 整页断言充当差分层
./refactors/app-js-split/judge-report.md:10:| 1 | 输入:input 监听不再触发比较 | 删 schedule() 调用 | 🔴 抓到(smoke 异常终止,退出码 1) |
./refactors/app-js-split/judge-report.md:14:- 复原验证: app.js 与原始逐字节一致,smoke 复绿 68/68
./refactors/app-js-split/judge-report.md:15:- 备注: 变红形态是"断言等待超时→异常退出"而非整洁的 failed 计数——判官有效但报错形态粗粝,排障时先看 smoke 输出前段
./refactors/app-js-split/delta-file.md:1:# delta-file — U5/5: ui-file.js（rulebook_rev=v2）
./refactors/app-js-split/delta-file.md:5:- 新文件 `ui-file.js`：§1 映射的 loadFile/paneEl/sortKeys/formatPane + `MAX_FILE_BYTES` 常量迁入。
./refactors/app-js-split/delta-file.md:6:- **app.js/compare.html 本任务未动**（铁律：只写 ui-file.js 与本文件）。留守侧待办见「集成清单」。
./refactors/app-js-split/delta-file.md:23:- `node --check ui-file.js` ✅
./refactors/app-js-split/delta-file.md:29:  （`render()`/`persist()` → `ctx.render()`/`ctx.persist()`，无其他改动），禁 smoke 未跑（§0）。
./refactors/app-js-split/delta-file.md:36:2. compare.html 登记 `<script src="ui-file.js">`，位于 diff.js/history.js 之后、app.js 之前（R2）。
./refactors/app-js-split/delta-file.md:48:`confidence=high todos=0`（尾注已按 R5 v2 枚举格式写入 ui-file.js）
./1.compare-page-redesign/design.md:32:| `tests/smoke.mjs` (132 行) | **扩充** | ①**新增** manifest 权限断言（R-012：这条守卫被两处文档声称、实际不存在）②新增 storage stub 往返（AC-015：该路径当前测试覆盖为 0）③新增三态样式与历史菜单高度断言。**现有 36 项断言零改动存活**（已逐条核实：ids/`.row`/`.srow`/`.movetag`/`.foldbtn`/`details>summary` 全部保留） |
./1.compare-page-redesign/design.md:38:| `docs/privacy.html` | **不动** | 披露内容不变 |
./1.compare-page-redesign/design.md:86:- **三态容器类名对齐**：app.js:126/137/145 现吐 `<div class="empty">`，基准物吐 `<div class="placeholder"><span class="big">`。二者必须统一——**只搬 CSS 不改 app.js（或反之），首屏那句 "Type or paste text in both boxes to compare." 会完全无样式**：不居中、无 padding、无 muted 色、无 min-height，一坨 12px 等宽字挤在结果区左上角。而 smoke:58 只 regex textContent，**照样全绿**。落地取「app.js 改吐 `.placeholder > .big`」（与基准物一致，AC-012 才可能成立）
./1.compare-page-redesign/design.md:88:**测试盲区（必须靠 AC-015 补上）**：smoke 用 `file://` 打开 compare.html → `typeof chrome === "undefined"` → `hasChrome=false` → `boot()` 在 :448 提前 return。**app.js:436-478 这 40 行、9 个 storage 键在整个测试矩阵里执行次数为 0**。AC-009 声称的"功能零回归"由 diff-test(48) + history-test(19) + smoke 兜底，而这三者对 storage 一行都碰不到。
./1.compare-page-redesign/design.md:102:| 顶栏 | `.topbar` | 含 `.brand`（`.mark` + `.wordmark` + `.privacy`）与 `.topacts`（`#history`、`#export`） |
./1.compare-page-redesign/design.md:103:| 隐私承诺 | `.privacy` | `<b>` = `🔒 100% local`；`<span>` = `no upload · no account · no ads`。**任何宽度不得 display:none** |
./1.compare-page-redesign/design.md:112:**控件 id 清单（全部不得变更，smoke.mjs 依赖）**：`text-a` `text-b` `file-a` `file-b` `swap` `opt-ws` `opt-blank` `opt-case` `opt-char` `opt-ws-show` `opt-fold` `opt-wrap` `fmt-json` `result` `stats` `nav-prev` `nav-count` `nav-next` `history` `hist-save` `hist-list` `export` `copy` `copy-diff` `copy-md` `dl-patch`
./1.compare-page-redesign/design.md:133:| **3. 历史类名沿用现有，不重命名（app.js **与** app.css 两侧同步）** | ① 用基准物的 `.histrow/.histmain/...` ② 改回 `.hist-item/.hist-restore/...` | 选 ②。基准物里的重命名是无谓改动，会**打断 smoke.mjs 现有 6 处断言**（第 94/95/100/105/106/107 行）。⚠️ **落地范围含 CSS**：若只回退 app.js 的产出、CSS 仍用基准物的 `.histrow` 等，History 下拉会整体裸奔——最致命的是 `.hist-list` 丢掉 `max-height:320px; overflow:auto`，而 `history.js:8` 的 `MAX_ENTRIES=12`，存满时 `.sheet` 是 `position:absolute` 无高度约束 → **菜单纵向无限增长、捅出视口底部且无法滚动，最后几条永久点不到**。而 smoke:95 只 `count(.hist-item)===1`、:100 只 `click(.hist-restore)`，无样式照样能点 → **假绿灯正好掩盖这个 bug**。AC-014 补上高度断言 |
./1.compare-page-redesign/design.md:162:- **R4 现有测试会给假绿灯**：本 feature 的三类典型断层——三态无样式、历史项无样式、storage 回填失效——**现有 36 项 smoke 断言一条都看不见**（它们只查 textContent 与元素计数，不查样式与 chrome 路径）。因此"smoke 全绿"在本 feature 中**不构成验收依据**，必须靠 AC-013/014/015/016 兜底。这是对抗审查的核心发现，写在这里防止执行期被"测试都过了"说服
./1.compare-page-redesign/requirements.md:42:12. [R-012] `tests/smoke.mjs` 必须**新增** manifest 权限断言：`permissions` 恒等于 `["storage","contextMenus"]` 且无 `host_permissions`——`.claude/rules/testing.md` 与 `docs/ARCHITECTURE.md` 都声称这条守卫存在，**实测它不存在**（见开放问题）
./1.compare-page-redesign/requirements.md:48:- **兼容性**: Chrome MV3；`compare.html` 需可在裸浏览器直接打开（供 smoke 测试）
./1.compare-page-redesign/requirements.md:59:- [x] [AC-007] 620 / 880 / 1440 三档视口下：无横向溢出、7 个开关全部可见、隐私副文案 `display !== "none"`，**且 ≥620px 时 `.privacy span` 的 `scrollWidth <= clientWidth`（未被 ellipsis 截断）** —— 验证：定宽 iframe 探测。仅验 `display` 是假闸门：被截成 `no upload · no acc…` 的元素 display 仍是 inline
./1.compare-page-redesign/requirements.md:61:- [x] [AC-009] **功能零回归** —— 验证：三条命令的退出码与末行计数：`node tests/diff-test.mjs` = 48 passed / 0 failed、`node tests/history-test.mjs` = 19 passed / 0 failed、`tests/smoke.mjs` 有 Playwright 时 0 failed、无则退出码 2。⚠️ **本条不是充分条件**：现有 36 项 smoke 断言只查 textContent 与元素计数，对「三态无样式 / 历史项无样式 / storage 回填失效」三类断层完全看不见（design.md R4）。**不得以本条全绿宣告验收**，须与 AC-013/014/015/016 合并判定
./1.compare-page-redesign/requirements.md:65:- [x] [AC-013] **空/相同/错误三态有样式**：三态容器的 `getBoundingClientRect().height >= 180` 且水平居中（`.placeholder` 或等价的 `.empty` 规则存在）—— 验证：DOM 断言。smoke 现有断言只 regex textContent，对无样式裸文本照样绿，挡不住这个
./1.compare-page-redesign/requirements.md:67:- [x] [AC-015] **storage 往返** —— 验证：smoke 里用 `page.addInitScript` stub `window.chrome.storage.local`（含 `onChanged` 分发），断言两条：①写入→重载→9 个键正确回填对应控件（`text-a`/`text-b`/`opt-*`×7/`view`）；②外部 `set({textA:"x"})` → 本页 `#text-a` 值变为 `x` 且 `#result` 重渲染。两条均 0 failed 才算过。—— 现状这 40 行（app.js:436-478）在整个测试矩阵里**执行次数为 0**（smoke 走 `file://`，`hasChrome=false`，`boot()` 在 :448 提前 return）
./1.compare-page-redesign/requirements.md:68:- [x] [AC-016] **权限守卫落地**：`tests/smoke.mjs` 断言 `manifest.json` 的 `permissions` 集合恒等于 `["storage","contextMenus"]` 且无 `host_permissions` —— 验证：该断言存在且通过。**这是补上 R-012 那条虚构守卫的唯一窗口**；`git diff --exit-code manifest.json` 不能替代（commit 落地后它永远绿，之后谁加 `tabs` 都不响）
./1.compare-page-redesign/requirements.md:77:- [🔴 需知会] **产品最重要的隐私不变式当前没有任何自动守卫**。`docs/ARCHITECTURE.md:21` 与 `.claude/rules/testing.md:29` 都声称「smoke test 断言了 manifest 权限」，实测 `grep -niE 'manifest|permission' tests/smoke.mjs` 为**空**——这条断言从未存在。两份文档的声称是错的（`/cm:init` 生成 testing.md 时直接采信了 ARCHITECTURE.md 的说法，未去测试文件核实，属放大而非首创）。R-012 / AC-016 补上它，T-006 修正两处文档
./refactors/app-js-split/delta-render.md:1:# delta-render — app.js 侧配套改法（U1 ui-render.js 落地时由主流程套用）
./refactors/app-js-split/delta-render.md:4:> 本文档只描述改法，未改动 app.js/compare.html（铁律：U1 只写 ui-render.js 与本文档）。
./refactors/app-js-split/delta-render.md:15:- 上述所有注释随函数一并迁走（已逐字迁入 ui-render.js，勿在 app.js 留副本）。
./refactors/app-js-split/delta-render.md:30:| 165 | renderDiff() | `view === "split" ? renderSplit(toRender) : view === "inline" ? renderInline(toRender) : renderUnified(toRender)` | `view === "split" ? R.renderSplit(toRender, { showWs }) : view === "inline" ? R.renderInline(toRender, { showWs }) : R.renderUnified(toRender, { showWs })` |
./refactors/app-js-split/delta-render.md:36:- `{ showWs }` options bag 是三个渲染入口的唯一状态入参（RULEBOOK §1 v2）；`showWs` 状态变量本身**留在 app.js**（原 13 行），optWsShow 的 change 监听与 boot() 恢复逻辑不动。
./refactors/app-js-split/delta-render.md:38:- renderHistList 的 esc 走 app.js 直接消费 `R.esc`；将来 U-history 拆出 ui-history.js 时按 R1 经 ctx 转发，此处不预支。
./refactors/app-js-split/delta-render.md:47:  <script src="ui-render.js"></script>   <!-- 新增：diff.js/history.js 之后、app.js 之前 -->
./refactors/app-js-split/delta-render.md:53:- **package.mjs 的 PAYLOAD 白名单**必须补 `ui-render.js`，否则商店 zip 缺文件、解包测试即挂（CLAUDE.md：仅白名单文件进包）。
./refactors/app-js-split/delta-render.md:58:- 纯 Node 等价自检已过：旧函数原文（app.js 24–127 抠出、剔除 opts）vs 新模块，同 fixture 下 unified/inline/split × showWs on/off 共 6 组输出逐字节相等，另验 esc 导出与「缺省 bag ≡ showWs:false」。脚本在会话 scratchpad（`equiv-check.mjs`），判官可重建。
./refactors/app-js-split/delta-render.md:59:- 套用本 delta 后的整体验证（smoke/浏览器）按 §0 留给批量站 4/5，此处不跑。
./1.compare-page-redesign/tasks.md:21:  - 记录当前绿灯：`node tests/diff-test.mjs`（48 项）、`node tests/history-test.mjs`（19 项）、`tests/smoke.mjs` 退出码 2（无 Playwright，正常降级）
./1.compare-page-redesign/tasks.md:22:  - 记录改动前 `git rev-parse HEAD` 与 `shasum app.js app.css compare.html tests/smoke.mjs`，供回滚与漂移比对
./1.compare-page-redesign/tasks.md:45:- [x] **T-004**: 扩充 `tests/smoke.mjs` ~40min
./1.compare-page-redesign/tasks.md:59:  - **修正 `docs/ARCHITECTURE.md:21` 与 `.claude/rules/testing.md:29` 的虚假声称**——它们说 smoke 断言了 manifest 权限，实测不存在。T-004 补上后这两处才成立，改为描述实际状态
./1.compare-page-redesign/tasks.md:71:              └─► T-004（smoke 扩充）
./1.compare-page-redesign/tasks.md:80:- **现有测试会给假绿灯**（design.md R4）：三态无样式 / 历史项无样式 / storage 回填失效——现有 36 项 smoke 断言一条都看不见。执行期**不得以"smoke 全绿"作为验收依据**，必须看 AC-013/014/015/016
./refactors/app-js-split/delta-export.md:5:app.js L240–291 的导出块逐字搬入 `ui-export.js`，共 8 个函数（与 §1 映射一一对应，无增减）：
./refactors/app-js-split/delta-export.md:31:5. compare.html 登记 `<script src="ui-export.js">`，位于 diff.js/history.js 之后、app.js 之前（R2）
./refactors/app-js-split/delta-export.md:35:- **`window.ClearDiff` 直接引用保留**：R1 的"禁止模块间直接互调"指五个拆分出的 ui-* 模块之间；diff.js 是既有引擎，app.js 基线即直接读 `window.ClearDiff`，且派发指令的 ctx 注入面（ta/tb/stats/opts）未含引擎。若排队人裁定引擎也须经 ctx，改动仅限工厂头部三处引用。
./refactors/app-js-split/delta-export.md:39:- `node --check ui-export.js` ✅（见汇报）
./refactors/app-js-split/delta-export.md:40:- 未跑 smoke/浏览器（§0 禁令）；接线前本文件为静载不执行代码，不影响现行为
./design/ui-v2-draft.html:139:.privacy {
./design/ui-v2-draft.html:146:.privacy b {
./design/ui-v2-draft.html:155:.privacy span {
./design/ui-v2-draft.html:472:      <span class="privacy" title="Everything runs in this tab. Nothing is uploaded.">
./design/ui-v2-draft.html:1001:  var view = "unified", showWs = false, fold = false;
./design/ui-v2-draft.html:1071:    if (showWs) h = h.replace(/\t/g, '<span class="ws">→</span>').replace(/ /g, '<span class="ws">·</span>');
./design/ui-v2-draft.html:1391:  optWsShow.addEventListener("change", function () { showWs = optWsShow.checked; render(); });
./refactors/app-js-split/delta-history.md:1:# delta-history — ui-history.js 搬迁记录 (U4/5, rulebook_rev=v2)
./refactors/app-js-split/delta-history.md:7:| relTime | 297–303 | ui-history.js | 私有（仅 renderHistList 消费，R6：只导出被绑定的函数） |
./refactors/app-js-split/delta-history.md:8:| renderHistList | 304–317 | ui-history.js | init api 导出 |
./refactors/app-js-split/delta-history.md:9:| saveCurrent | 318–326 | ui-history.js | init api 导出 |
./refactors/app-js-split/delta-history.md:10:| restoreHist | 327–332 | ui-history.js | init api 导出 |
./refactors/app-js-split/delta-history.md:11:| delHist | 333 | ui-history.js | init api 导出 |
./refactors/app-js-split/delta-history.md:29:| flashBtn | 转发自 ui-export 的 init api | §1：flashBtn 迁入 ui-export.js |
./refactors/app-js-split/delta-history.md:34:- `node --check ui-history.js` ✅
./refactors/app-js-split/delta-history.md:36:- 未跑 tests/smoke.mjs、未起浏览器（§0 禁令）。
./refactors/app-js-split/delta-history.md:41:2. compare.html 注册 `ui-history.js`，位于 diff.js/history.js 之后、app.js 之前（R2）。
./1.compare-page-redesign/METRICS.md:9:smoke.mjs        : 退出码 2（2 = 无 Playwright，安装中）
./1.compare-page-redesign/METRICS.md:18:52219617259cb102a9d45516059dc3994d45d31a  tests/smoke.mjs
./1.compare-page-redesign/METRICS.md:38:| 009 | 功能零回归 | diff-test 48/0 · history-test 19/0 · smoke **46/0**（基线时退出码 2 跑不起来） | ✓ |
./1.compare-page-redesign/METRICS.md:69:| 像素档工具 | 装 Playwright（全局，不进仓库） | AC-016 的权限守卫住在 smoke.mjs，跑不起来它就是死代码 | 人工截图（省 500MB 但 AC-016 无法验证）、加 package.json（破坏仓库零依赖） |
./1.compare-page-redesign/METRICS.md:70:| smoke 找不到全局包 | `npm root -g` 动态解析 | 写死机器路径不能进仓库 | 硬编码 `/Users/zero/.npm-global/...` |
./1.compare-page-redesign/METRICS.md:95:| smoke 断言 | 46 | **57** |
./refactors/app-js-split/delta-nav.md:1:# delta-nav — app.js 侧改法（ui-nav.js 迁出后的接线说明）
./refactors/app-js-split/delta-nav.md:8:`ui-nav.js` 插在 history.js 之后、app.js 之前：
./refactors/app-js-split/delta-nav.md:13:<script src="ui-nav.js"></script>   <!-- 新增 -->
./refactors/app-js-split/delta-nav.md:57:- **R4 契约不变**：renderPips 仍只读 hunk 首行的 `data-htype`/`data-hline` dataset（函数体逐字迁移，经纯 Node 比对脚本核验四函数与原文逐字一致）。写方在 ui-render.js 的 `hmeta()`，跨模块不直调（R1），接口只有 dataset。
./.git/logs/refs/heads/feature/visual-refresh-change-rail:7:83e0654ca0972bbee5c387f66c0b77a8e82b1bbd 3e90cc8b1f39ba899b3416369796f6b9278946b3 zero <zero@zeros-Mac-Studio.local> 1784307776 +0800	commit: T-005 visual-refresh-and-change-rail: smoke 扩充 11 条 pip 断言（57→68）
./.git/logs/HEAD:18:83e0654ca0972bbee5c387f66c0b77a8e82b1bbd 3e90cc8b1f39ba899b3416369796f6b9278946b3 zero <zero@zeros-Mac-Studio.local> 1784307776 +0800	commit: T-005 visual-refresh-and-change-rail: smoke 扩充 11 条 pip 断言（57→68）
./refactors/app-js-split/batch-log.jsonl:1:{"at": "2026-07-18T09:32:44+08:00", "file": "ui-render.js", "agent": "cm-frontend-agent", "model": "inherit", "rulebook_rev": "v2", "diff_pass": "纯Node等价6组逐字节", "todos": 0, "confidence": "high", "mount": "直挂DiffLensRender"}
./refactors/app-js-split/batch-log.jsonl:2:{"at": "2026-07-18T09:32:44+08:00", "file": "ui-nav.js", "agent": "cm-frontend-agent", "model": "inherit", "rulebook_rev": "v2", "diff_pass": "四函数逐字+薄封装静态论证", "todos": 0, "confidence": "high", "mount": "{init}对象(待v3裁决)"}
./refactors/app-js-split/batch-log.jsonl:3:{"at": "2026-07-18T09:32:44+08:00", "file": "ui-export.js", "agent": "cm-frontend-agent", "model": "inherit", "rulebook_rev": "v2", "diff_pass": "L239-291逐字+vm加载", "todos": 0, "confidence": "high", "mount": "裸工厂(待v3裁决)"}
./refactors/app-js-split/batch-log.jsonl:4:{"at": "2026-07-18T09:32:44+08:00", "file": "ui-history.js", "agent": "cm-frontend-agent", "model": "inherit", "rulebook_rev": "v2", "diff_pass": "固定时钟15副作用逐字节", "todos": 0, "confidence": "high", "mount": "裸工厂(待v3裁决)"}
./refactors/app-js-split/batch-log.jsonl:5:{"at": "2026-07-18T09:32:44+08:00", "file": "ui-file.js", "agent": "cm-frontend-agent", "model": "inherit", "rulebook_rev": "v2", "diff_pass": "假ctx7组断言", "todos": 0, "confidence": "high", "mount": "{init}对象(待v3裁决)"}
./refactors/app-js-split/batch-log.jsonl:6:{"at": "2026-07-18T09:34:22+08:00", "file": "ui-nav.js+ui-file.js", "agent": "orchestrator", "rulebook_rev": "v3", "action": "挂载行按v3裸工厂规范化重生成(非手补:规则驱动统一变换)"}
./STORE_LISTING.md:79:https://kingxiaozhe.github.io/diff-lens/privacy.html
./STORE_LISTING.md:81:(Push this extension to a PUBLIC repo `diff-lens`, enable Settings → Pages → Source: main, with privacy.html reachable. Verify HTTP 200 before pasting. The file lives at docs/privacy.html — set Pages source to /docs, or move it to repo root.)
./ui-render.js:2:// no chrome.*, no network, no state: callers pass an options bag ({ showWs }) explicitly.
./ui-render.js:10:  function fmt(s, showWs) {
./ui-render.js:12:    if (showWs) {
./ui-render.js:17:  function renderWords(words, showWs) {
./ui-render.js:19:      const t = fmt(w.text, showWs);
./ui-render.js:50:  function renderColumn(out, inlineChange, showWs) {
./ui-render.js:56:      if (r.type === "equal") html.push(urow("equal", "", r.aNum, r.bNum, fmt(r.text, showWs)));
./ui-render.js:57:      else if (r.type === "minor") html.push(urow("minor", "≈", r.aNum, r.bNum, renderWords(inlineChange ? r.words : r.bWords, showWs)));
./ui-render.js:58:      else if (r.type === "del") html.push(urow("del" + hs + (r.moved ? " moved" : ""), "−", r.aNum, null, fmt(r.text, showWs) + (r.moved ? moveTag("to", r.movePartnerNum) : ""), hs ? hmeta("del", r.aNum) : ""));
./ui-render.js:59:      else if (r.type === "add") html.push(urow("add" + hs + (r.moved ? " moved" : ""), "+", null, r.bNum, fmt(r.text, showWs) + (r.moved ? moveTag("from", r.movePartnerNum) : ""), hs ? hmeta("add", r.bNum) : ""));
./ui-render.js:62:          html.push(urow("change" + hs, "~", r.aNum, r.bNum, renderWords(r.words, showWs), hs ? hmeta("change", r.aNum) : ""));
./ui-render.js:64:          html.push(urow("change" + hs, "−", r.aNum, null, renderWords(r.aWords, showWs), hs ? hmeta("change", r.aNum) : ""));
./ui-render.js:65:          html.push(urow("change", "+", null, r.bNum, renderWords(r.bWords, showWs)));
./ui-render.js:72:  function renderUnified(out, opts) { return renderColumn(out, false, !!(opts && opts.showWs)); }
./ui-render.js:73:  function renderInline(out, opts) { return renderColumn(out, true, !!(opts && opts.showWs)); }
./ui-render.js:78:    const showWs = !!(opts && opts.showWs);
./ui-render.js:88:        left = scol("equal", r.aNum, fmt(r.text, showWs)); right = scol("equal b", r.bNum, fmt(r.text, showWs));
./ui-render.js:90:        left = scol("minor", r.aNum, renderWords(r.aWords, showWs)); right = scol("minor b", r.bNum, renderWords(r.bWords, showWs));
./ui-render.js:92:        left = scol("del" + (r.moved ? " moved" : ""), r.aNum, fmt(r.text, showWs) + (r.moved ? moveTag("to", r.movePartnerNum) : "")); right = scol("blank b", null, "");
./ui-render.js:94:        left = scol("blank", null, ""); right = scol("add b" + (r.moved ? " moved" : ""), r.bNum, fmt(r.text, showWs) + (r.moved ? moveTag("from", r.movePartnerNum) : ""));
./ui-render.js:96:        left = scol("chg", r.aNum, renderWords(r.aWords, showWs)); right = scol("chg b", r.bNum, renderWords(r.bWords, showWs));
./ui-render.js:105:  // 三个渲染入口收 { showWs } options bag；其余 9 个助手为模块私有。

codex
我已经拿到工作区面和上一轮评审记录。下一步直接对照 R1 的具体 4 条意见，看这次三项修复是否真消掉对应风险，以及第 4 条是不是仅属既有欠账、没有随本次重构放大。
exec
/bin/zsh -lc "sed -n '1,240p' .reviews/refactor-app-js-split-r1.md" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
Reading additional input from stdin...
OpenAI Codex v0.144.5
--------
workdir: /Users/zero/MyCode/diff-lens
model: gpt-5.4
provider: openai
approval: never
sandbox: read-only
reasoning effort: high
reasoning summaries: none
session id: 019f72e2-c0bd-7300-b1ed-54d1e2893c13
--------
user
你在审查一次行为保持重构(app.js 541行拆为编排层+5个ui模块)。假设这次重构夹带了行为变更或接线错误,找出证据。

上下文自取: git status/diff 看全部未提交改动;规则见 refactors/app-js-split/RULEBOOK.md(v3);等价证据:smoke 68全绿、金样18组逐字节一致(golden.json vs golden-after.json)、3处变异重种全抓红(含 ui-nav 模块内部)。

审查重点(逐项答):1) app.js 编排层的接线有无错漏(对照 refactors/app-js-split/delta-*.md 的调用点表);2) 有无夹带行为变更(哪怕一处文案/时序/守卫语义);3) 模块边界纪律(R1禁互调/R3 chrome隔离/R4 dataset契约)有无违反;4) 等价验证的覆盖有无关键盲区(金样6输入×3视图+smoke,漏了什么高危面?);5) compare.html/package.mjs 波及处理是否完整。
只报有具体失败场景的问题,按严重度排序,零发现明说。
codex
使用 `$ultrawork` + `$review`：先读仓库流程和审查协议，再拉取未提交 diff、规则书和重构 delta，对照调用点和验证证据做逐项审查。
exec
/bin/zsh -lc "sed -n '1,220p' /Users/zero/.codex/skills/review/SKILL.md" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
---
name: review
description: "Findings-first pre-landing review against code, plan completion, verification evidence, and durable runtime state."
---

# Review

## Purpose

Use `$review` to answer one question: is this actually ready to land? Review is not a summary pass. It is a bug, regression, coverage, and state-integrity pass.

## Execution Policy

- Findings first, summary second.
- Prefer evidence over author claims.
- Check the code, the tests, the plan, and the runtime artifacts.
- If the current context authored the change, prefer a separate reviewer role for approval.

## Review Order

1. Read the changed code.
2. Read the active plan and verification map.
3. Check what was supposed to happen vs what actually landed.
4. Verify:
   - tests and typechecks
   - docs drift
   - `.omx/` state drift
   - task/review/inbox accuracy
5. Produce a verdict:
   - approved
   - changes requested
   - blocked

## Mandatory Checks

- missing or fake verification
- uncovered changed paths
- stale docs or setup instructions
- task marked done but still pending review evidence
- team runtime claiming health while inbox or review queue says otherwise

## Output Standard

- findings ordered by severity
- file references and why they matter
- residual risk
- final verdict and next action

exec
/bin/zsh -lc "sed -n '1,220p' /Users/zero/.codex/skills/ultrawork/SKILL.md" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
---
name: ultrawork
description: "Default OMX flow for intent -> plan -> execute -> verify, with team escalation only when durable parallelism is justified."
---

# Ultrawork

## Purpose

`$ultrawork` is the default OMX operating mode. It is the wrapper that decides whether to clarify, plan, execute directly, or escalate to durable team mode. It exists to finish the job end to end without losing state.

## Use When

- the user wants the work shipped, not just discussed
- the task is larger than a one-shot edit
- you need one sane default path instead of choosing skills manually

## Routing Rules

- ambiguous intent → `$deep-interview`
- clear but broad work → `$plan`
- one focused slice with known files → `$executor`
- parallel durable work → `$team`
- uncertain implementation pattern → `$research` or `$trace`

## Execution Policy

- start from the repo and `.omx/` truth, not chat memory
- prefer the smallest mode that can finish the job
- keep the runtime current as you go
- do not stop at a partial handoff unless the next owner is explicit

## Workflow

1. Start or resume the session with `omx session start` or `omx session resume`.
2. Read current state with `omx hud`.
3. Run the ambiguity gate:
   - if intent is fuzzy, use `$deep-interview`
   - if intent is clear, continue
4. Build or refresh the durable plan:
   - `omx autoresearch init <phase>` when discovery is needed
   - update `.omx/plans/` and `.omx/research/`
5. Choose execution mode:
   - direct slice → `$executor`
   - durable parallel slices → `$team`
6. Keep task, inbox, and review state current during execution.
7. Finish with explicit verification and a recorded verdict.

## State Contract

Ultrawork should leave behind:

- a current session
- a live or intentionally cleared planning state
- durable tasks with real status
- verification evidence in task notes or plan artifacts

## Final Check

- the next action is explicit
- no fake “done” state exists
- verification is recorded
- the work is either completed, in review, or intentionally blocked

codex
先核对仓库真相和这次重构的规则来源：我会同时看 `git status/diff`、`RULEBOOK.md`、`delta-*.md` 和相关文件，确认审查基线不是口头描述。
exec
/bin/zsh -lc 'git status --short' in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-Cq7UuZ1o' (errno=Operation not permitted)
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-90V9Ghyi' (errno=Operation not permitted)
 M app.js
 M compare.html
 M package.mjs
 M "\350\277\220\350\241\214\346\227\245\345\277\227.jsonl"
?? .claude/settings.json
?? .reviews/refactor-app-js-split-r1.md
?? refactors/
?? ui-export.js
?? ui-file.js
?? ui-history.js
?? ui-nav.js
?? ui-render.js

exec
/bin/zsh -lc "sed -n '1,260p' refactors/app-js-split/RULEBOOK.md" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
# 重构规则手册 — app.js 拆分 (v1)

> meta 规则:两个 agent 会答得不同的问题,答案进本手册。循环内只读,修订排队人批。

## §0 范围与姿态
- **结构保持重构**:行为一丝不变;生成的 HTML 字符串逐字节保持(判官含 DOM 金样对比)
- 循环内**必跑** `node --check {文件}`;**允许**自建纯 Node 等价自检(v2:bakeoff 双方自发验证,合法化);**禁跑** tests/smoke.mjs 与任何起浏览器的验证(贵,站 4/5 批量跑——裁判价格定位)
- 禁止顺手修 bug/改文案/调整 HTML 结构;发现缺陷记 `TODO(refactor):` 留档转 /cm:fix

## §1 目标形态(一源一目标,函数搬迁映射)
| 新文件 | 职责 | 迁入函数 | 状态归属 |
|---|---|---|---|
| ui-render.js | 纯 HTML 生成 | esc/fmt/renderWords/moveTag/numCell/urow/hmeta/foldRowHtml/renderColumn/renderUnified/renderInline/scol/renderSplit | 无状态——三个渲染入口收 `{showWs}` options bag 下传(v2);**导出面=实际消费面:仅 esc/renderUnified/renderInline/renderSplit,其余 9 个私有**(bakeoff 双方无规则趋同) |
| ui-nav.js | hunk 索引/上下跳转/pip 轨道 | indexHunks/updateNav/renderPips/jump | 拥有 hunks/hunkIdx;DOM 引用经 init(ctx) 注入 |
| ui-export.js | 复制/下载导出 | plainDiffText/flashBtn/closeExport/copyText/copyResult/copyUnified/copyMarkdown/downloadPatch | 无状态;输入引用经 ctx |
| ui-history.js | 历史列表 UI | relTime/renderHistList/saveCurrent/restoreHist/delHist | historyList 归 app.js,经 ctx 存取 |
| ui-file.js | 文件加载 + JSON 格式化 | loadFile/paneEl/sortKeys/formatPane | 无状态 |
| app.js(留守) | 编排:opts/render/renderDiff/schedule/persist*/boot/全部事件绑定 | — | view/fold/showWs/expandedFolds/lastA/lastB/historyList |

## §2 强制规则
- R1 **命名空间(v2 重写)**:**无状态模块**直挂独立命名空间(跟随项目既有先例 ClearDiff/DiffLensHistory);**有状态/持 DOM 引用的模块**(仅 ui-nav)用 `window.DiffLens{Name} = init(ctx) => api` 工厂。文件→命名空间对照表:
  | 文件 | 命名空间 | 形态 |
  |---|---|---|
  | ui-render.js | `DiffLensRender` | 直挂(纯函数) |
  | ui-nav.js | `DiffLensNav` | init(ctx) 工厂(拥有 hunks/hunkIdx) |
  | ui-export.js | `DiffLensExport` | init(ctx)(需 DOM 引用与 opts 存取) |
  | ui-history.js | `DiffLensHistUI` | init(ctx)(**避开已被 history.js 占用的 DiffLensHistory**) |
  | ui-file.js | `DiffLensFile` | init(ctx)(需面板引用) |
  禁止模块间直接互调——跨模块共享(如 esc/flashBtn)一律经 app.js 的 ctx 转发;对既有引擎命名空间(ClearDiff/DiffLensHistory)允许直接只读引用(v3 裁决:互调禁令范围=ui-* 模块之间)
  **v3 工厂挂载形态定形(裸工厂,附骨架——形态规则必须给可拷贝代码,公式不够):**
  ```js
  (function (root) {
    "use strict";
    function init(ctx) { /* 迁入函数 */ return { api1, api2 }; }
    root.DiffLensNav = init;   // 命名空间即工厂
  })(typeof window !== "undefined" ? window : globalThis);
  // app.js 消费: const nav = window.DiffLensNav({ ... });
  ```
- R2 **加载顺序**:compare.html 中 ui-*.js 位于 diff.js/history.js 之后、app.js 之前;漏登记=启动即挂,防护网必抓
- R3 **chrome.* 只准留在 app.js**:ui 模块禁碰 chrome API(hasChrome 封装是编排层职责)
- R4 **render→nav 契约**:`data-htype/data-hline`(hmeta)是两模块唯一接口,已有注释言明"轨道只读 dataset"——搬迁不得改变此契约
- R5 **状态尾注**:每个完成文件末尾 `// REFACTOR STATUS: confidence={high|medium|low} todos={N}`(v2 补枚举)
- R6 事件绑定一律留 app.js;模块只导出被绑定的函数

## §3 修订史
| 版本 | 日期 | 触发实例 | 旧条文 → 新条文 | 裁决人 |
|---|---|---|---|---|
| v1 | 2026-07-18 | 初稿 | — | — |
| v2 | 2026-07-18 | bakeoff A/B:命名空间分叉(B 项目先例论证胜)+导出面无规则趋同+双方自发自检 | R1 重写为双形态+对照表;§1 补导出面与 {showWs};§0 放行纯 Node 自检;R5 补枚举 | 人(站2签核) |
| v3 | 2026-07-18 | 批内工厂挂载形态 2:2 分裂(nav/file {init} vs export/history 裸工厂)——公式两读实锤 | R1 定形裸工厂+附骨架代码;引擎只读引用合法化 | 人(批间裁决) |

exec
/bin/zsh -lc 'rg --files refactors/app-js-split' in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
refactors/app-js-split/RULEBOOK.md
refactors/app-js-split/golden.json
refactors/app-js-split/delta-history.md
refactors/app-js-split/golden-after.json
refactors/app-js-split/delta-nav.md
refactors/app-js-split/delta-file.md
refactors/app-js-split/delta-render.md
refactors/app-js-split/golden-capture.mjs
refactors/app-js-split/judge-report.md
refactors/app-js-split/delta-export.md
refactors/app-js-split/batch-log.jsonl

exec
/bin/zsh -lc 'git diff --stat' in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-RS6mKIQZ' (errno=Operation not permitted)
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-ELulQC15' (errno=Operation not permitted)
 app.js                                             | 372 +++------------------
 compare.html                                       |   5 +
 package.mjs                                        |   5 +

exec
/bin/zsh -lc "sed -n '1,220p' refactors/app-js-split/delta-file.md" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
# delta-file — U5/5: ui-file.js（rulebook_rev=v2）

## 产出

- 新文件 `ui-file.js`：§1 映射的 loadFile/paneEl/sortKeys/formatPane + `MAX_FILE_BYTES` 常量迁入。
- **app.js/compare.html 本任务未动**（铁律：只写 ui-file.js 与本文件）。留守侧待办见「集成清单」。

## 命名空间与契约（R1）

```js
// app.js 留守侧的接入方式（render/persist 是函数声明会提升，init 可在 IIFE 顶部调用）：
const F = window.DiffLensFile({ ta, tb, stats, render, persist });
// F.loadFile(file, which)  F.paneEl(which)  F.formatPane(which)
```

- ctx 五键：`ta`/`tb`/`stats`（DOM 引用）、`render`/`persist`（回调）。模块内零 DOM 查询、
  零 chrome.*（R3）、零事件绑定（R6）、不直调其他 ui-* 模块（R1 末条）。
- 导出面 = 实际消费面（§1 v2 原则外推）：**导出 loadFile/paneEl/formatPane；sortKeys 私有**
  ——app.js 中 sortKeys 仅被 formatPane 内部调用，无外部消费点。

## 行为保持验证

- `node --check ui-file.js` ✅
- 纯 Node 自检（§0 v2 放行）✅：vm 加载 + 假 ctx，覆盖 7 组断言——paneEl 映射、
  5MB 上限文案与 app.js 逐字节相同、拒绝时不触发 render/persist、null file 守卫、
  formatPane 空/非法/合法三分支（非法输入不改面板值；合法输出键排序 + 2 空格缩进）、
  `Couldn’t read that file.`（U+2019 弯引号）逐字节保留、sortKeys 函数体逐字（仅缩进差）。
- FileReader onload/onerror 分支为浏览器 API，Node 不可执行——代码为原文机械迁移
  （`render()`/`persist()` → `ctx.render()`/`ctx.persist()`，无其他改动），禁 smoke 未跑（§0）。
- 迁移的三段原注释（"open file…" 段头、5 MB 依据、Format JSON 大段含 2^53 NOTE）逐字保留。

## 集成清单（留守/编排任务负责，非本任务）

1. app.js 删除 L436–450（loadFile 段含 MAX_FILE_BYTES/paneEl）与 L467–487（sortKeys/formatPane
   段含大段注释），事件绑定处改调 `F.loadFile`/`F.paneEl`/`F.formatPane`。
2. compare.html 登记 `<script src="ui-file.js">`，位于 diff.js/history.js 之后、app.js 之前（R2）。

## 被迫自行决定的点（RULEBOOK 未覆盖，候选进 v3）

1. **R1 工厂挂载形态**：条文 `window.DiffLens{Name} = init(ctx) => api` 可读作「命名空间即工厂函数」
   或「命名空间为对象含 init」。取 `root.DiffLensFile = { init }`——跟随 history.js
   「命名空间是对象」的项目先例（与 R1 v2 直挂形态的论证同源）。**并行的 U2–U4 需对齐同一形态**。
2. **导出面裁剪**：§1 v2 的「导出面=实际消费面」仅写在 ui-render 行；外推适用于 ui-file，
   故 sortKeys 私有。若判官按 §1「迁入函数」列要求四个全导出，改动为一行（api 加 sortKeys）。

## REFACTOR STATUS

`confidence=high todos=0`（尾注已按 R5 v2 枚举格式写入 ui-file.js）

exec
/bin/zsh -lc "sed -n '1,260p' refactors/app-js-split/golden-capture.mjs" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
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

exec
/bin/zsh -lc "sed -n '1,260p' tests/smoke.mjs" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
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


exec
/bin/zsh -lc "sed -n '260,420p' tests/smoke.mjs" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:

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

exec
/bin/zsh -lc 'rg -n "''^1'"\\.|"'^2'"\\.|"'^3'"\\.|"'^4'"\\.|"'^5'"\\.|严重|findings|问题|转交|盲区|delta-file|showWs|ui-\\*|export/file\" .reviews/refactor-app-js-split-r1.md" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
18:审查重点(逐项答):1) app.js 编排层的接线有无错漏(对照 refactors/app-js-split/delta-*.md 的调用点表);2) 有无夹带行为变更(哪怕一处文案/时序/守卫语义);3) 模块边界纪律(R1禁互调/R3 chrome隔离/R4 dataset契约)有无违反;4) 等价验证的覆盖有无关键盲区(金样6输入×3视图+smoke,漏了什么高危面?);5) compare.html/package.mjs 波及处理是否完整。
19:只报有具体失败场景的问题,按严重度排序,零发现明说。
45:1. Read the changed code.
46:2. Read the active plan and verification map.
47:3. Check what was supposed to happen vs what actually landed.
48:4. Verify:
53:5. Produce a verdict:
68:- findings ordered by severity
110:1. Start or resume the session with `omx session start` or `omx session resume`.
111:2. Read current state with `omx hud`.
112:3. Run the ambiguity gate:
115:4. Build or refresh the durable plan:
118:5. Choose execution mode:
167:> meta 规则:两个 agent 会答得不同的问题,答案进本手册。循环内只读,修订排队人批。
177:| ui-render.js | 纯 HTML 生成 | esc/fmt/renderWords/moveTag/numCell/urow/hmeta/foldRowHtml/renderColumn/renderUnified/renderInline/scol/renderSplit | 无状态——三个渲染入口收 `{showWs}` options bag 下传(v2);**导出面=实际消费面:仅 esc/renderUnified/renderInline/renderSplit,其余 9 个私有**(bakeoff 双方无规则趋同) |
182:| app.js(留守) | 编排:opts/render/renderDiff/schedule/persist*/boot/全部事件绑定 | — | view/fold/showWs/expandedFolds/lastA/lastB/historyList |
193:  禁止模块间直接互调——跨模块共享(如 esc/flashBtn)一律经 app.js 的 ctx 转发;对既有引擎命名空间(ClearDiff/DiffLensHistory)允许直接只读引用(v3 裁决:互调禁令范围=ui-* 模块之间)
203:- R2 **加载顺序**:compare.html 中 ui-*.js 位于 diff.js/history.js 之后、app.js 之前;漏登记=启动即挂,防护网必抓
213:| v2 | 2026-07-18 | bakeoff A/B:命名空间分叉(B 项目先例论证胜)+导出面无规则趋同+双方自发自检 | R1 重写为双形态+对照表;§1 补导出面与 {showWs};§0 放行纯 Node 自检;R5 补枚举 | 人(站2签核) |
224:refactors/app-js-split/delta-file.md
276:1. 删除 app.js L239–291 原函数块
277:2. boot 前 `const exp = window.DiffLensExport({ ta, tb, stats, opts });`
278:3. 既有绑定改指向 `exp.copyResult` / `exp.copyUnified` / `exp.copyMarkdown` / `exp.downloadPatch`（L372–375）
279:4. `saveCurrent` 内的 `flashBtn($("hist-save"), "Saved ✓")`（L325）经 `exp.flashBtn` 转发——**ui-history 单元的 ctx 需含 flashBtn**
280:5. compare.html 登记 `<script src="ui-export.js">`，位于 diff.js/history.js 之后、app.js 之前（R2）
284:- **`window.ClearDiff` 直接引用保留**：R1 的"禁止模块间直接互调"指五个拆分出的 ui-* 模块之间；diff.js 是既有引擎，app.js 基线即直接读 `window.ClearDiff`，且派发指令的 ctx 注入面（ta/tb/stats/opts）未含引擎。若排队人裁定引擎也须经 ctx，改动仅限工厂头部三处引用。
294:===== refactors/app-js-split/delta-file.md =====
295:# delta-file — U5/5: ui-file.js（rulebook_rev=v2）
311:  零 chrome.*（R3）、零事件绑定（R6）、不直调其他 ui-* 模块（R1 末条）。
328:1. app.js 删除 L436–450（loadFile 段含 MAX_FILE_BYTES/paneEl）与 L467–487（sortKeys/formatPane
330:2. compare.html 登记 `<script src="ui-file.js">`，位于 diff.js/history.js 之后、app.js 之前（R2）。
334:1. **R1 工厂挂载形态**：条文 `window.DiffLens{Name} = init(ctx) => api` 可读作「命名空间即工厂函数」
337:2. **导出面裁剪**：§1 v2 的「导出面=实际消费面」仅写在 ui-render 行；外推适用于 ui-file，
383:1. app.js 删除五个函数原文，改为 `const histUI = DiffLensHistUI({...ctx 如上表...})`，事件绑定与 boot 调用点改经 `histUI.*`。
384:2. compare.html 注册 `ui-history.js`，位于 diff.js/history.js 之后、app.js 之前（R2）。
385:3. **契约依赖**：ctx.flashBtn 需 ui-export 的 init api 导出 flashBtn（flashBtn 在 ui-export 内部也被 downloadPatch 等消费，但 saveCurrent 这条消费线要求它出现在导出面）；ctx.esc 需 DiffLensRender 导出 esc（§1 v2 已保证）。
389:- R1 公式的字面解读：全局=工厂函数本身。若同批其他 ui-* 采用 `{ init }` 对象形态，属命名空间形态分叉，建议进 RULEBOOK 修订队列统一。
490:| 165 | renderDiff() | `view === "split" ? renderSplit(toRender) : view === "inline" ? renderInline(toRender) : renderUnified(toRender)` | `view === "split" ? R.renderSplit(toRender, { showWs }) : view === "inline" ? R.renderInline(toRender, { showWs }) : R.renderUnified(toRender, { showWs })` |
496:- `{ showWs }` options bag 是三个渲染入口的唯一状态入参（RULEBOOK §1 v2）；`showWs` 状态变量本身**留在 app.js**（原 13 行），optWsShow 的 change 监听与 boot() 恢复逻辑不动。
518:- 纯 Node 等价自检已过：旧函数原文（app.js 24–127 抠出、剔除 opts）vs 新模块，同 fixture 下 unified/inline/split × showWs on/off 共 6 组输出逐字节相等，另验 esc 导出与「缺省 bag ≡ showWs:false」。脚本在会话 scratchpad（`equiv-check.mjs`），判官可重建。
554:+// wires the ui-* modules to the local diff engine. No network calls. Rendering, hunk
563:   let showWs = false;
579:-    if (showWs) {
718:+      result.innerHTML = view === "split" ? R.renderSplit(toRender, { showWs })
719:+        : view === "inline" ? R.renderInline(toRender, { showWs })
720:+        : R.renderUnified(toRender, { showWs });
899:   if (optWsShow) optWsShow.addEventListener("change", () => { showWs = optWsShow.checked; render(); persistOpts(); });
1094:已经看到编排层大范围替换点。现在读五个 `ui-*` 模块本体，重点核对：导出形态是否和 `app.js` 实际接线一致、是否偷偷改了逻辑、以及是否踩了 R1/R3/R4。
1204:// no chrome.*, no network, no state: callers pass an options bag ({ showWs }) explicitly.
1212:  function fmt(s, showWs) {
1214:    if (showWs) {
1219:  function renderWords(words, showWs) {
1221:      const t = fmt(w.text, showWs);
1252:  function renderColumn(out, inlineChange, showWs) {
1258:      if (r.type === "equal") html.push(urow("equal", "", r.aNum, r.bNum, fmt(r.text, showWs)));
1259:      else if (r.type === "minor") html.push(urow("minor", "≈", r.aNum, r.bNum, renderWords(inlineChange ? r.words : r.bWords, showWs)));
1260:      else if (r.type === "del") html.push(urow("del" + hs + (r.moved ? " moved" : ""), "−", r.aNum, null, fmt(r.text, showWs) + (r.moved ? moveTag("to", r.movePartnerNum) : ""), hs ? hmeta("del", r.aNum) : ""));
1261:      else if (r.type === "add") html.push(urow("add" + hs + (r.moved ? " moved" : ""), "+", null, r.bNum, fmt(r.text, showWs) + (r.moved ? moveTag("from", r.movePartnerNum) : ""), hs ? hmeta("add", r.bNum) : ""));
1264:          html.push(urow("change" + hs, "~", r.aNum, r.bNum, renderWords(r.words, showWs), hs ? hmeta("change", r.aNum) : ""));
1266:          html.push(urow("change" + hs, "−", r.aNum, null, renderWords(r.aWords, showWs), hs ? hmeta("change", r.aNum) : ""));
1267:          html.push(urow("change", "+", null, r.bNum, renderWords(r.bWords, showWs)));
1274:  function renderUnified(out, opts) { return renderColumn(out, false, !!(opts && opts.showWs)); }
1275:  function renderInline(out, opts) { return renderColumn(out, true, !!(opts && opts.showWs)); }
1280:    const showWs = !!(opts && opts.showWs);
1290:        left = scol("equal", r.aNum, fmt(r.text, showWs)); right = scol("equal b", r.bNum, fmt(r.text, showWs));
1292:        left = scol("minor", r.aNum, renderWords(r.aWords, showWs)); right = scol("minor b", r.bNum, renderWords(r.bWords, showWs));
1294:        left = scol("del" + (r.moved ? " moved" : ""), r.aNum, fmt(r.text, showWs) + (r.moved ? moveTag("to", r.movePartnerNum) : "")); right = scol("blank b", null, "");
1296:        left = scol("blank", null, ""); right = scol("add b" + (r.moved ? " moved" : ""), r.bNum, fmt(r.text, showWs) + (r.moved ? moveTag("from", r.movePartnerNum) : ""));
1298:        left = scol("chg", r.aNum, renderWords(r.aWords, showWs)); right = scol("chg b", r.bNum, renderWords(r.bWords, showWs));
1307:  // 三个渲染入口收 { showWs } options bag；其余 9 个助手为模块私有。
1672:/bin/zsh -lc "rg -n \"chrome\\.|DiffLens(Render|Nav|Export|HistUI|File)|data-htype|data-hline|historyList|flashBtn|renderPips|indexHunks|jump\\(|jumpTo\\(|paneEl|formatPane|loadFile\" app.js ui-*.js compare.html package.mjs" in /Users/zero/MyCode/diff-lens
1674:ui-render.js:2:// no chrome.*, no network, no state: callers pass an options bag ({ showWs }) explicitly.
1769:  let showWs = false;
1786:    if (showWs) {
2082:refactors/app-js-split/RULEBOOK.md:13:| ui-render.js | 纯 HTML 生成 | esc/fmt/renderWords/moveTag/numCell/urow/hmeta/foldRowHtml/renderColumn/renderUnified/renderInline/scol/renderSplit | 无状态——三个渲染入口收 `{showWs}` options bag 下传(v2);**导出面=实际消费面:仅 esc/renderUnified/renderInline/renderSplit,其余 9 个私有**(bakeoff 双方无规则趋同) |
2085:refactors/app-js-split/RULEBOOK.md:18:| app.js(留守) | 编排:opts/render/renderDiff/schedule/persist*/boot/全部事件绑定 | — | view/fold/showWs/expandedFolds/lastA/lastB/historyList |
2087:refactors/app-js-split/RULEBOOK.md:39:- R2 **加载顺序**:compare.html 中 ui-*.js 位于 diff.js/history.js 之后、app.js 之前;漏登记=启动即挂,防护网必抓
2167:refactors/app-js-split/delta-render.md:30:| 165 | renderDiff() | `view === "split" ? renderSplit(toRender) : view === "inline" ? renderInline(toRender) : renderUnified(toRender)` | `view === "split" ? R.renderSplit(toRender, { showWs }) : view === "inline" ? R.renderInline(toRender, { showWs }) : R.renderUnified(toRender, { showWs })` |
2180:refactors/app-js-split/delta-file.md:29:  （`render()`/`persist()` → `ctx.render()`/`ctx.persist()`，无其他改动），禁 smoke 未跑（§0）。
2181:refactors/app-js-split/delta-file.md:36:2. compare.html 登记 `<script src="ui-file.js">`，位于 diff.js/history.js 之后、app.js 之前（R2）。
2182:refactors/app-js-split/delta-file.md:41:   或「命名空间为对象含 init」。取 `root.DiffLensFile = { init }`——跟随 history.js
2694:覆盖面已经清楚不少了。最后一轮我会按用户的五个问题做“证据闭环”：给出具体文件/行号、能触发的失败场景；如果没有能落地的失败场景，就明确写零发现，同时把验证盲区单列为风险而不是伪造 bug。
2699:     2	// wires the ui-* modules to the local diff engine. No network calls. Rendering, hunk
2714:    17	  let showWs = false;
2784:    87	      result.innerHTML = view === "split" ? R.renderSplit(toRender, { showWs })
2785:    88	        : view === "inline" ? R.renderInline(toRender, { showWs })
2786:    89	        : R.renderUnified(toRender, { showWs });
2819:   122	  if (optWsShow) optWsShow.addEventListener("change", () => { showWs = optWsShow.checked; render(); persistOpts(); });
2929:   232	      showWhitespace: showWs, wordWrap: optWrap.checked, view: view,
2944:   247	        if (typeof s.showWhitespace === "boolean" && optWsShow) { optWsShow.checked = s.showWhitespace; showWs = s.showWhitespace; }
2973:     2	// no chrome.*, no network, no state: callers pass an options bag ({ showWs }) explicitly.
2981:    10	  function fmt(s, showWs) {
2983:    12	    if (showWs) {
2988:    17	  function renderWords(words, showWs) {
2990:    19	      const t = fmt(w.text, showWs);
3021:    50	  function renderColumn(out, inlineChange, showWs) {
3027:    56	      if (r.type === "equal") html.push(urow("equal", "", r.aNum, r.bNum, fmt(r.text, showWs)));
3028:    57	      else if (r.type === "minor") html.push(urow("minor", "≈", r.aNum, r.bNum, renderWords(inlineChange ? r.words : r.bWords, showWs)));
3029:    58	      else if (r.type === "del") html.push(urow("del" + hs + (r.moved ? " moved" : ""), "−", r.aNum, null, fmt(r.text, showWs) + (r.moved ? moveTag("to", r.movePartnerNum) : ""), hs ? hmeta("del", r.aNum) : ""));
3030:    59	      else if (r.type === "add") html.push(urow("add" + hs + (r.moved ? " moved" : ""), "+", null, r.bNum, fmt(r.text, showWs) + (r.moved ? moveTag("from", r.movePartnerNum) : ""), hs ? hmeta("add", r.bNum) : ""));
3033:    62	          html.push(urow("change" + hs, "~", r.aNum, r.bNum, renderWords(r.words, showWs), hs ? hmeta("change", r.aNum) : ""));
3035:    64	          html.push(urow("change" + hs, "−", r.aNum, null, renderWords(r.aWords, showWs), hs ? hmeta("change", r.aNum) : ""));
3036:    65	          html.push(urow("change", "+", null, r.bNum, renderWords(r.bWords, showWs)));
3043:    72	  function renderUnified(out, opts) { return renderColumn(out, false, !!(opts && opts.showWs)); }
3044:    73	  function renderInline(out, opts) { return renderColumn(out, true, !!(opts && opts.showWs)); }
3049:    78	    const showWs = !!(opts && opts.showWs);
3059:    88	        left = scol("equal", r.aNum, fmt(r.text, showWs)); right = scol("equal b", r.bNum, fmt(r.text, showWs));
3061:    90	        left = scol("minor", r.aNum, renderWords(r.aWords, showWs)); right = scol("minor b", r.bNum, renderWords(r.bWords, showWs));
3063:    92	        left = scol("del" + (r.moved ? " moved" : ""), r.aNum, fmt(r.text, showWs) + (r.moved ? moveTag("to", r.movePartnerNum) : "")); right = scol("blank b", null, "");
3065:    94	        left = scol("blank", null, ""); right = scol("add b" + (r.moved ? " moved" : ""), r.bNum, fmt(r.text, showWs) + (r.moved ? moveTag("from", r.movePartnerNum) : ""));
3067:    96	        left = scol("chg", r.aNum, renderWords(r.aWords, showWs)); right = scol("chg b", r.bNum, renderWords(r.bWords, showWs));
3076:   105	  // 三个渲染入口收 { showWs } options bag；其余 9 个助手为模块私有。
3676:审查重点(逐项答):1) app.js 编排层的接线有无错漏(对照 refactors/app-js-split/delta-*.md 的调用点表);2) 有无夹带行为变更(哪怕一处文案/时序/守卫语义);3) 模块边界纪律(R1禁互调/R3 chrome隔离/R4 dataset契约)有无违反;4) 等价验证的覆盖有无关键盲区(金样6输入×3视图+smoke,漏了什么高危面?);5) compare.html/package.mjs 波及处理是否完整。
3677:只报有具体失败场景的问题,按严重度排序,零发现明说。
3703:1. Read the changed code.
3704:2. Read the active plan and verification map.
3705:3. Check what was supposed to happen vs what actually landed.
3706:4. Verify:
3711:5. Produce a verdict:
3726:- findings ordered by severity
3768:1. Start or resume the session with `omx session start` or `omx session resume`.
3769:2. Read current state with `omx hud`.
3770:3. Run the ambiguity gate:
3773:4. Build or refresh the durable plan:
3776:5. Choose execution mode:
3825:> meta 规则:两个 agent 会答得不同的问题,答案进本手册。循环内只读,修订排队人批。
3835:| ui-render.js | 纯 HTML 生成 | esc/fmt/renderWords/moveTag/numCell/urow/hmeta/foldRowHtml/renderColumn/renderUnified/renderInline/scol/renderSplit | 无状态——三个渲染入口收 `{showWs}` options bag 下传(v2);**导出面=实际消费面:仅 esc/renderUnified/renderInline/renderSplit,其余 9 个私有**(bakeoff 双方无规则趋同) |
3840:| app.js(留守) | 编排:opts/render/renderDiff/schedule/persist*/boot/全部事件绑定 | — | view/fold/showWs/expandedFolds/lastA/lastB/historyList |
3851:  禁止模块间直接互调——跨模块共享(如 esc/flashBtn)一律经 app.js 的 ctx 转发;对既有引擎命名空间(ClearDiff/DiffLensHistory)允许直接只读引用(v3 裁决:互调禁令范围=ui-* 模块之间)
3861:- R2 **加载顺序**:compare.html 中 ui-*.js 位于 diff.js/history.js 之后、app.js 之前;漏登记=启动即挂,防护网必抓
3871:| v2 | 2026-07-18 | bakeoff A/B:命名空间分叉(B 项目先例论证胜)+导出面无规则趋同+双方自发自检 | R1 重写为双形态+对照表;§1 补导出面与 {showWs};§0 放行纯 Node 自检;R5 补枚举 | 人(站2签核) |
3882:refactors/app-js-split/delta-file.md
3901:零发现：我没在当前未提交代码里找到能落成具体失败场景的接线错误、夹带行为变更，或 R1/R3/R4 违规。`golden.json` 和 `golden-after.json` 我直接比过，字节完全一致，两个文件都是 9701 bytes。唯一偏差是 [delta-file.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-file.md:6) 还写着旧的 `.init` 形态，但落地代码 [app.js](/Users/zero/MyCode/diff-lens/app.js:49) / [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:52) 已按 RULEBOOK v3 的裸工厂实现；这是文档漂移，不是运行时问题。
3903:1. `app.js` 编排层接线无错漏。`ui-render` 的 6 个调用点已改到 [app.js](/Users/zero/MyCode/diff-lens/app.js:57)、[app.js](/Users/zero/MyCode/diff-lens/app.js:87)、[app.js](/Users/zero/MyCode/diff-lens/app.js:88)、[app.js](/Users/zero/MyCode/diff-lens/app.js:89)；`ui-nav` 的实例化和所有调用点都按 [delta-nav.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-nav.md:21) 落地在 [app.js](/Users/zero/MyCode/diff-lens/app.js:38)、[app.js](/Users/zero/MyCode/diff-lens/app.js:60)、[app.js](/Users/zero/MyCode/diff-lens/app.js:71)、[app.js](/Users/zero/MyCode/diff-lens/app.js:98)、[app.js](/Users/zero/MyCode/diff-lens/app.js:121)、[app.js](/Users/zero/MyCode/diff-lens/app.js:126)、[app.js](/Users/zero/MyCode/diff-lens/app.js:158)、[app.js](/Users/zero/MyCode/diff-lens/app.js:168)、[app.js](/Users/zero/MyCode/diff-lens/app.js:174)、[app.js](/Users/zero/MyCode/diff-lens/app.js:183)；`ui-export` / `ui-history` / `ui-file` 绑定也都齐了，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:39)、[app.js](/Users/zero/MyCode/diff-lens/app.js:42)、[app.js](/Users/zero/MyCode/diff-lens/app.js:49)、[app.js](/Users/zero/MyCode/diff-lens/app.js:138)、[app.js](/Users/zero/MyCode/diff-lens/app.js:142)、[app.js](/Users/zero/MyCode/diff-lens/app.js:151)、[app.js](/Users/zero/MyCode/diff-lens/app.js:206)、[app.js](/Users/zero/MyCode/diff-lens/app.js:218)、[app.js](/Users/zero/MyCode/diff-lens/app.js:237)、[app.js](/Users/zero/MyCode/diff-lens/app.js:257)。
3905:2. 没发现夹带行为变更。错误边界文案和 `nav.reset()` 语义与旧版三连一致，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:57) 和 [ui-nav.js](/Users/zero/MyCode/diff-lens/ui-nav.js:81)；导出按钮反馈、`1200ms`/`1000ms` 时序、空导出提示文案都保留，见 [ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:28)、[ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:46)、[ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:57)；历史保存/恢复/删除守卫和副作用顺序也没变，见 [ui-history.js](/Users/zero/MyCode/diff-lens/ui-history.js:48)。
3907:3. 模块边界纪律没发现违规。R1 方面，跨模块共享只经 `app.js` 转发：`esc`/`flashBtn`/`DiffLensHistory` 都是 ctx 注入，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:42) 和 [ui-history.js](/Users/zero/MyCode/diff-lens/ui-history.js:7)。R3 方面，`chrome.*` 只剩 [app.js](/Users/zero/MyCode/diff-lens/app.js:25)、[app.js](/Users/zero/MyCode/diff-lens/app.js:41)、[app.js](/Users/zero/MyCode/diff-lens/app.js:226)、[app.js](/Users/zero/MyCode/diff-lens/app.js:238)、[app.js](/Users/zero/MyCode/diff-lens/app.js:260)。R4 方面，写侧仍由 [ui-render.js](/Users/zero/MyCode/diff-lens/ui-render.js:37) 产出 `data-htype/data-hline`，读侧仍由 [ui-nav.js](/Users/zero/MyCode/diff-lens/ui-nav.js:32) 只读 dataset。
3909:4. 等价验证有 3 个关键盲区。`showWs` 真渲染路径没被金样覆盖：快照脚本从未打开 `opt-ws-show`，见 [golden-capture.mjs](/Users/zero/MyCode/diff-lens/refactors/app-js-split/golden-capture.mjs:35)，而这次重构恰好把它改成 `{ showWs }` 透传，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:87) 和 [ui-render.js](/Users/zero/MyCode/diff-lens/ui-render.js:72)。`ui-export` / `ui-file` 的实行为大盲区：smoke 只验导出菜单可见和 `Escape` 关闭，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:94)，从不点复制/下载，也不测 FileReader 成功/失败、5MB 守卫、拖放、`Format JSON`，而这些正是整块迁出的逻辑，见 [ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:15) 和 [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:12)。另外，smoke 的源码级隐私扫描还只扫旧文件集，不含 `ui-*.js`，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:63)；如果新模块里误加外链，68 绿也未必会报，得靠打包校验补上。
3911:5. `compare.html` / `package.mjs` 的波及处理是完整的。[compare.html](/Users/zero/MyCode/diff-lens/compare.html:116) 已把 5 个 `ui-*.js` 放在 `diff.js`/`history.js` 之后、`app.js` 之前；[package.mjs](/Users/zero/MyCode/diff-lens/package.mjs:28) 也把 5 个新文件全加进 `PAYLOAD`，并且最终仍会对解包产物跑 smoke，见 [package.mjs](/Users/zero/MyCode/diff-lens/package.mjs:117)。这两处我没看到漏项。
3914:零发现：我没在当前未提交代码里找到能落成具体失败场景的接线错误、夹带行为变更，或 R1/R3/R4 违规。`golden.json` 和 `golden-after.json` 我直接比过，字节完全一致，两个文件都是 9701 bytes。唯一偏差是 [delta-file.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-file.md:6) 还写着旧的 `.init` 形态，但落地代码 [app.js](/Users/zero/MyCode/diff-lens/app.js:49) / [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:52) 已按 RULEBOOK v3 的裸工厂实现；这是文档漂移，不是运行时问题。
3916:1. `app.js` 编排层接线无错漏。`ui-render` 的 6 个调用点已改到 [app.js](/Users/zero/MyCode/diff-lens/app.js:57)、[app.js](/Users/zero/MyCode/diff-lens/app.js:87)、[app.js](/Users/zero/MyCode/diff-lens/app.js:88)、[app.js](/Users/zero/MyCode/diff-lens/app.js:89)；`ui-nav` 的实例化和所有调用点都按 [delta-nav.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-nav.md:21) 落地在 [app.js](/Users/zero/MyCode/diff-lens/app.js:38)、[app.js](/Users/zero/MyCode/diff-lens/app.js:60)、[app.js](/Users/zero/MyCode/diff-lens/app.js:71)、[app.js](/Users/zero/MyCode/diff-lens/app.js:98)、[app.js](/Users/zero/MyCode/diff-lens/app.js:121)、[app.js](/Users/zero/MyCode/diff-lens/app.js:126)、[app.js](/Users/zero/MyCode/diff-lens/app.js:158)、[app.js](/Users/zero/MyCode/diff-lens/app.js:168)、[app.js](/Users/zero/MyCode/diff-lens/app.js:174)、[app.js](/Users/zero/MyCode/diff-lens/app.js:183)；`ui-export` / `ui-history` / `ui-file` 绑定也都齐了，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:39)、[app.js](/Users/zero/MyCode/diff-lens/app.js:42)、[app.js](/Users/zero/MyCode/diff-lens/app.js:49)、[app.js](/Users/zero/MyCode/diff-lens/app.js:138)、[app.js](/Users/zero/MyCode/diff-lens/app.js:142)、[app.js](/Users/zero/MyCode/diff-lens/app.js:151)、[app.js](/Users/zero/MyCode/diff-lens/app.js:206)、[app.js](/Users/zero/MyCode/diff-lens/app.js:218)、[app.js](/Users/zero/MyCode/diff-lens/app.js:237)、[app.js](/Users/zero/MyCode/diff-lens/app.js:257)。
3918:2. 没发现夹带行为变更。错误边界文案和 `nav.reset()` 语义与旧版三连一致，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:57) 和 [ui-nav.js](/Users/zero/MyCode/diff-lens/ui-nav.js:81)；导出按钮反馈、`1200ms`/`1000ms` 时序、空导出提示文案都保留，见 [ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:28)、[ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:46)、[ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:57)；历史保存/恢复/删除守卫和副作用顺序也没变，见 [ui-history.js](/Users/zero/MyCode/diff-lens/ui-history.js:48)。
3920:3. 模块边界纪律没发现违规。R1 方面，跨模块共享只经 `app.js` 转发：`esc`/`flashBtn`/`DiffLensHistory` 都是 ctx 注入，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:42) 和 [ui-history.js](/Users/zero/MyCode/diff-lens/ui-history.js:7)。R3 方面，`chrome.*` 只剩 [app.js](/Users/zero/MyCode/diff-lens/app.js:25)、[app.js](/Users/zero/MyCode/diff-lens/app.js:41)、[app.js](/Users/zero/MyCode/diff-lens/app.js:226)、[app.js](/Users/zero/MyCode/diff-lens/app.js:238)、[app.js](/Users/zero/MyCode/diff-lens/app.js:260)。R4 方面，写侧仍由 [ui-render.js](/Users/zero/MyCode/diff-lens/ui-render.js:37) 产出 `data-htype/data-hline`，读侧仍由 [ui-nav.js](/Users/zero/MyCode/diff-lens/ui-nav.js:32) 只读 dataset。
3922:4. 等价验证有 3 个关键盲区。`showWs` 真渲染路径没被金样覆盖：快照脚本从未打开 `opt-ws-show`，见 [golden-capture.mjs](/Users/zero/MyCode/diff-lens/refactors/app-js-split/golden-capture.mjs:35)，而这次重构恰好把它改成 `{ showWs }` 透传，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:87) 和 [ui-render.js](/Users/zero/MyCode/diff-lens/ui-render.js:72)。`ui-export` / `ui-file` 的实行为大盲区：smoke 只验导出菜单可见和 `Escape` 关闭，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:94)，从不点复制/下载，也不测 FileReader 成功/失败、5MB 守卫、拖放、`Format JSON`，而这些正是整块迁出的逻辑，见 [ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:15) 和 [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:12)。另外，smoke 的源码级隐私扫描还只扫旧文件集，不含 `ui-*.js`，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:63)；如果新模块里误加外链，68 绿也未必会报，得靠打包校验补上。
3924:5. `compare.html` / `package.mjs` 的波及处理是完整的。[compare.html](/Users/zero/MyCode/diff-lens/compare.html:116) 已把 5 个 `ui-*.js` 放在 `diff.js`/`history.js` 之后、`app.js` 之前；[package.mjs](/Users/zero/MyCode/diff-lens/package.mjs:28) 也把 5 个新文件全加进 `PAYLOAD`，并且最终仍会对解包产物跑 smoke，见 [package.mjs](/Users/zero/MyCode/diff-lens/package.mjs:117)。这两处我没看到漏项。

codex
现在只差两件事：把三项修复的现状钉到具体行号上，以及重新判断第 4 条的归类。我要补看当前文件行号和 `delta-export`/`ui-file` 的自证材料，确认“既有欠账”是否已被其他验证手段覆盖到足以转交。
exec
/bin/zsh -lc "nl -ba refactors/app-js-split/delta-file.md | sed -n '1,80p'" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
     1	# delta-file — U5/5: ui-file.js（rulebook_rev=v2）
     2	
     3	## 产出
     4	
     5	- 新文件 `ui-file.js`：§1 映射的 loadFile/paneEl/sortKeys/formatPane + `MAX_FILE_BYTES` 常量迁入。
     6	- **app.js/compare.html 本任务未动**（铁律：只写 ui-file.js 与本文件）。留守侧待办见「集成清单」。
     7	
     8	## 命名空间与契约（R1）
     9	
    10	```js
    11	// app.js 留守侧的接入方式（render/persist 是函数声明会提升，init 可在 IIFE 顶部调用）：
    12	const F = window.DiffLensFile({ ta, tb, stats, render, persist });
    13	// F.loadFile(file, which)  F.paneEl(which)  F.formatPane(which)
    14	```
    15	
    16	- ctx 五键：`ta`/`tb`/`stats`（DOM 引用）、`render`/`persist`（回调）。模块内零 DOM 查询、
    17	  零 chrome.*（R3）、零事件绑定（R6）、不直调其他 ui-* 模块（R1 末条）。
    18	- 导出面 = 实际消费面（§1 v2 原则外推）：**导出 loadFile/paneEl/formatPane；sortKeys 私有**
    19	  ——app.js 中 sortKeys 仅被 formatPane 内部调用，无外部消费点。
    20	
    21	## 行为保持验证
    22	
    23	- `node --check ui-file.js` ✅
    24	- 纯 Node 自检（§0 v2 放行）✅：vm 加载 + 假 ctx，覆盖 7 组断言——paneEl 映射、
    25	  5MB 上限文案与 app.js 逐字节相同、拒绝时不触发 render/persist、null file 守卫、
    26	  formatPane 空/非法/合法三分支（非法输入不改面板值；合法输出键排序 + 2 空格缩进）、
    27	  `Couldn’t read that file.`（U+2019 弯引号）逐字节保留、sortKeys 函数体逐字（仅缩进差）。
    28	- FileReader onload/onerror 分支为浏览器 API，Node 不可执行——代码为原文机械迁移
    29	  （`render()`/`persist()` → `ctx.render()`/`ctx.persist()`，无其他改动），禁 smoke 未跑（§0）。
    30	- 迁移的三段原注释（"open file…" 段头、5 MB 依据、Format JSON 大段含 2^53 NOTE）逐字保留。
    31	
    32	## 集成清单（留守/编排任务负责，非本任务）
    33	
    34	1. app.js 删除 L436–450（loadFile 段含 MAX_FILE_BYTES/paneEl）与 L467–487（sortKeys/formatPane
    35	   段含大段注释），事件绑定处改调 `F.loadFile`/`F.paneEl`/`F.formatPane`。
    36	2. compare.html 登记 `<script src="ui-file.js">`，位于 diff.js/history.js 之后、app.js 之前（R2）。
    37	
    38	## 被迫自行决定的点（RULEBOOK 未覆盖，候选进 v3）
    39	
    40	1. **R1 工厂挂载形态**：条文 `window.DiffLens{Name} = init(ctx) => api` 可读作「命名空间即工厂函数」
    41	   或「命名空间为对象含 init」。取 `root.DiffLensFile = { init }`——跟随 history.js
    42	   「命名空间是对象」的项目先例（与 R1 v2 直挂形态的论证同源）。**并行的 U2–U4 需对齐同一形态**。
    43	2. **导出面裁剪**：§1 v2 的「导出面=实际消费面」仅写在 ui-render 行；外推适用于 ui-file，
    44	   故 sortKeys 私有。若判官按 §1「迁入函数」列要求四个全导出，改动为一行（api 加 sortKeys）。
    45	
    46	## REFACTOR STATUS
    47	
    48	`confidence=high todos=0`（尾注已按 R5 v2 枚举格式写入 ui-file.js）

exec
/bin/zsh -lc "nl -ba tests/smoke.mjs | sed -n '1,120p'" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
     1	// DiffLens end-to-end smoke — loads compare.html in headless Chromium and drives
     2	// the real UI. Run with: node tests/smoke.mjs
     3	// (Chromium is provided by the environment via PLAYWRIGHT_BROWSERS_PATH.)
     4	import { createRequire } from "node:module";
     5	import { fileURLToPath, pathToFileURL } from "node:url";
     6	import { dirname, join } from "node:path";
     7	import { readFileSync } from "node:fs";
     8	import { execSync } from "node:child_process";
     9	
    10	const require = createRequire(import.meta.url);
    11	// Playwright may be a local dep or globally installed. Node doesn't resolve global
    12	// packages, so ask npm where they live rather than hard-coding a machine path.
    13	function loadPlaywright() {
    14	  const candidates = ["playwright"];
    15	  try { candidates.push(join(execSync("npm root -g", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(), "playwright")); } catch { /* npm missing */ }
    16	  candidates.push("/opt/node22/lib/node_modules/playwright");
    17	  for (const c of candidates) { try { return require(c); } catch { /* try next */ } }
    18	  console.error("Playwright not found — install it (npm i -g playwright && npx playwright install chromium)");
    19	  console.error("or run the dependency-free unit tests: node tests/diff-test.mjs");
    20	  process.exit(2);
    21	}
    22	const { chromium } = loadPlaywright();
    23	
    24	const here = dirname(fileURLToPath(import.meta.url));
    25	const pageUrl = pathToFileURL(join(here, "..", "compare.html")).href;
    26	
    27	let pass = 0, fail = 0;
    28	const ok = (c, m) => { if (c) pass++; else { fail++; console.error("✗ " + m); } };
    29	
    30	// ── Privacy regression guard ────────────────────────────────────────────────
    31	// The manifest IS the privacy story: no host_permissions and no network means no
    32	// code path can exfiltrate text. README, STORE_LISTING and the privacy policy all
    33	// promise this, and a promise no test enforces is one a refactor can quietly break.
    34	//
    35	// This runs FIRST, before a browser is even launched, and depends on nothing else.
    36	// It used to sit at the bottom: any throw upstream — a 30s timeout in the storage
    37	// block was enough — and the whole thing never executed, while the run still exited
    38	// non-zero and looked like an ordinary failure. The most important assertion in the
    39	// suite must not be the easiest one to skip.
    40	{
    41	  const manifest = JSON.parse(readFileSync(join(here, "..", "manifest.json"), "utf8"));
    42	  const perms = [...(manifest.permissions || [])].sort();
    43	  ok(JSON.stringify(perms) === JSON.stringify(["contextMenus", "storage"]),
    44	    "manifest grants exactly storage + contextMenus (got: " + JSON.stringify(perms) + ")");
    45	
    46	  // Every route out of the sandbox, not just the obvious one. A relaxed
    47	  // connect-src would undo the whole promise as surely as a host permission.
    48	  for (const field of ["host_permissions", "optional_permissions", "optional_host_permissions",
    49	                       "content_scripts", "externally_connectable", "declarative_net_request",
    50	                       "web_accessible_resources", "sandbox"]) {
    51	    ok(!(field in manifest), "manifest declares no " + field);
    52	  }
    53	  const csp = JSON.stringify(manifest.content_security_policy || {});
    54	  ok(!/https?:|\*/.test(csp), "manifest CSP opens no external origin (got: " + csp + ")");
    55	
    56	  // Source files may not reach the network. Strip comments properly first: filtering
    57	  // whole lines let `/* note */ var u = "https://evil.example"` through, and treated
    58	  // a CSS `* { ... }` rule as a comment.
    59	  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[ \t])\/\/.*$/gm, "$1");
    60	  // Protocol-relative only where a URL can actually sit — after a quote or `url(`.
    61	  // A bare /\/\// matches every trailing comment in the file.
    62	  const NET = /https?:\/\/|@import|["'(]\s*\/\/[a-z0-9-]/i;
    63	  for (const f of ["compare.html", "app.css", "app.js", "diff.js", "history.js", "background.js", "ui-render.js", "ui-nav.js", "ui-export.js", "ui-history.js", "ui-file.js"]) {
    64	    ok(!NET.test(strip(readFileSync(join(here, "..", f), "utf8"))), f + " contains no external URL");
    65	  }
    66	}
    67	
    68	const browser = await chromium.launch();
    69	try {
    70	  const page = await browser.newPage();
    71	  const errors = [];
    72	  page.on("pageerror", (e) => errors.push(String(e)));
    73	  await page.goto(pageUrl);
    74	  await page.waitForSelector("#result");
    75	
    76	  // Type two differing texts and confirm a diff renders.
    77	  await page.fill("#text-a", "one\ntwo\nthree");
    78	  await page.fill("#text-b", "one\nTWO\nthree");
    79	  await page.waitForFunction(() => document.querySelectorAll("#result .row").length > 0);
    80	  ok((await page.locator("#result .row.change, #result .row.del, #result .row.add").count()) > 0, "renders a changed row");
    81	  ok(/added/.test(await page.textContent("#stats")), "stats show an added count");
    82	
    83	  // View switching.
    84	  await page.click('[data-view="split"]');
    85	  ok((await page.locator("#result .srow").count()) > 0, "split view renders side-by-side rows");
    86	  await page.click('[data-view="inline"]');
    87	  ok((await page.locator("#result .row").count()) > 0, "inline view renders rows");
    88	  await page.click('[data-view="unified"]');
    89	
    90	  // Difference navigation.
    91	  ok(!(await page.locator("#nav-next").isDisabled()), "next-diff button enabled when diffs exist");
    92	
    93	  // Export menu present and openable.
    94	  await page.click("#export summary");
    95	  ok(await page.locator("#copy-diff").isVisible(), "export menu reveals 'Copy unified diff'");
    96	  ok(await page.locator("#dl-patch").isVisible(), "export menu reveals 'Download .patch'");
    97	  await page.keyboard.press("Escape");
    98	  ok(!(await page.locator("#copy-diff").isVisible()), "Escape closes the export menu");
    99	
   100	  // Identical inputs report identical.
   101	  await page.fill("#text-b", "one\ntwo\nthree");
   102	  await page.waitForFunction(() => /identical/i.test(document.querySelector("#result").textContent));
   103	  ok(/identical/i.test(await page.textContent("#result")), "identical inputs report identical");
   104	
   105	  // Collapse unchanged: a long mostly-identical input should fold, and a band expands.
   106	  const big = Array.from({ length: 40 }, (_, i) => "line" + i).join("\n");
   107	  const bigB = big.split("\n"); bigB[20] = "CHANGED-LINE";
   108	  await page.fill("#text-a", big);
   109	  await page.fill("#text-b", bigB.join("\n"));
   110	  await page.waitForFunction(() => document.querySelectorAll("#result .row.change").length > 0);
   111	  const rowsBefore = await page.locator("#result .row").count();
   112	  await page.check("#opt-fold");
   113	  await page.waitForFunction(() => document.querySelectorAll("#result .foldbtn").length > 0);
   114	  const rowsFolded = await page.locator("#result .row").count();
   115	  ok(rowsFolded < rowsBefore, "collapsing hides rows (fewer rendered)");
   116	  ok((await page.locator("#result .foldbtn").count()) >= 1, "a fold band is shown");
   117	  ok((await page.locator("#result .row.change").count()) > 0, "the change stays visible while collapsed");
   118	  // Expanding a band reveals more rows.
   119	  await page.locator("#result .foldbtn").first().click();
   120	  await page.waitForFunction((n) => document.querySelectorAll("#result .row").length > n, rowsFolded);

exec
/bin/zsh -lc "nl -ba refactors/app-js-split/golden-capture.mjs | sed -n '1,120p'" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
     1	// 差分层金样: 对固定输入集,在真实页面采集 result.innerHTML(逐字节基准)。
     2	// 重构前跑一次生成 golden.json;重构后重跑,输出必须逐字节一致(diff-report 数据源)。
     3	import { createRequire } from "node:module";
     4	import { fileURLToPath } from "node:url";
     5	import { dirname, join } from "node:path";
     6	import { writeFileSync } from "node:fs";
     7	import { execSync } from "node:child_process";
     8	const require = createRequire(import.meta.url);
     9	function loadPlaywright() {
    10	  const candidates = ["playwright"];
    11	  try { candidates.push(join(execSync("npm root -g", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(), "playwright")); } catch {}
    12	  for (const c of candidates) { try { return require(c); } catch {} }
    13	  console.error("Playwright not found"); process.exit(2);
    14	}
    15	const { chromium } = loadPlaywright();
    16	const here = dirname(fileURLToPath(import.meta.url));
    17	import { pathToFileURL } from "node:url";
    18	const page_url = pathToFileURL(join(here, "..", "..", "compare.html")).href;
    19	const CASES = [
    20	  { name: "basic-change", a: "alpha\nbravo\ncharlie", b: "alpha\ndelta\ncharlie" },
    21	  { name: "blank-ignore", a: "a\n\nb\nc", b: "a\n\nB\nc", opts: { blank: true } },
    22	  { name: "minor-case", a: "Hello World\nsame", b: "hello world\nsame", opts: { case: true } },
    23	  { name: "moved-line", a: "one\ntwo\nthree\nfour five six", b: "two\nthree\nfour five six\none" },
    24	  { name: "empty-vs-text", a: "", b: "solo" },
    25	  { name: "identical", a: "same\ntext", b: "same\ntext" },
    26	  { name: "ws-show-tabs", a: "a\tb  c\nsame", b: "a\tb\tc\nsame", ws: true },
    27	];
    28	const VIEWS = ["unified", "split", "inline"];
    29	const browser = await chromium.launch();
    30	const page = await browser.newPage();
    31	await page.goto(page_url);
    32	const golden = {};
    33	for (const c of CASES) {
    34	  await page.evaluate(({ a, b, opts, ws }) => {
    35	    document.getElementById("text-a").value = a;
    36	    document.getElementById("text-b").value = b;
    37	    document.getElementById("opt-blank").checked = !!(opts && opts.blank);
    38	    document.getElementById("opt-case").checked = !!(opts && opts.case);
    39	    document.getElementById("opt-ws").checked = false;
    40	    document.getElementById("opt-char").checked = false;
    41	    const wsShow = document.getElementById("opt-ws-show");
    42	    if (wsShow) { wsShow.checked = !!ws; wsShow.dispatchEvent(new Event("change")); }
    43	  }, c);
    44	  for (const v of VIEWS) {
    45	    await page.click(`[data-view="${v}"]`);
    46	    await page.waitForTimeout(200);
    47	    golden[`${c.name}::${v}`] = await page.evaluate(() => document.getElementById("result").innerHTML);
    48	  }
    49	}
    50	await browser.close();
    51	const out = join(here, process.argv[2] || "golden.json");
    52	writeFileSync(out, JSON.stringify(golden, null, 1));
    53	console.log(`captured ${Object.keys(golden).length} snapshots → ${out}`);

exec
/bin/zsh -lc "nl -ba ui-file.js | sed -n '1,220p'" in /Users/zero/MyCode/diff-lens
exec
/bin/zsh -lc "nl -ba refactors/app-js-split/delta-export.md | sed -n '1,120p'" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
     1	// DiffLens file-loading + JSON-format module — 100% local (FileReader / native JSON), no network.
     2	// RULEBOOK §1/R1: 无状态；面板(ta/tb)/状态栏(stats)引用与 render/persist 回调全部经 init(ctx)
     3	// 注入，模块自身零 DOM 查询、零 chrome.*（R3）——事件绑定仍归 app.js（R6）。
     4	(function (root) {
     5	  "use strict";
     6	
     7	  // --- local file loading (drag-drop or "open file…") — 100% local via FileReader ---
     8	  const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB: beyond this, load + render would lag
     9	
    10	  function init(ctx) {
    11	    const paneEl = (which) => (which === "a" ? ctx.ta : ctx.tb);
    12	    function loadFile(file, which) {
    13	      if (!file) return;
    14	      if (file.size > MAX_FILE_BYTES) {
    15	        ctx.stats.textContent = "That file is too large (" + (file.size / 1048576).toFixed(1) +
    16	          " MB). DiffLens handles up to " + (MAX_FILE_BYTES / 1048576) + " MB locally.";
    17	        return;
    18	      }
    19	      const reader = new FileReader();
    20	      reader.onload = () => { paneEl(which).value = String(reader.result || ""); ctx.render(); ctx.persist(); };
    21	      reader.onerror = () => { ctx.stats.textContent = "Couldn’t read that file."; };
    22	      reader.readAsText(file);
    23	    }
    24	
    25	    // --- "Format JSON": structural compare via parse → sort keys → pretty-print ---
    26	    // Sorting keys makes key-order differences vanish; pretty-printing makes whitespace/
    27	    // minification differences vanish — so two structurally-equal JSONs become identical.
    28	    // NOTE: uses native JSON, so integers beyond 2^53 may be reformatted with precision
    29	    // loss (both sides equally). Big-int-faithful mode is a future option (cf. JSON Keeper).
    30	    function sortKeys(v) {
    31	      if (Array.isArray(v)) return v.map(sortKeys);
    32	      if (v && typeof v === "object") {
    33	        const out = {};
    34	        for (const k of Object.keys(v).sort()) out[k] = sortKeys(v[k]);
    35	        return out;
    36	      }
    37	      return v;
    38	    }
    39	    function formatPane(which) {
    40	      const el = paneEl(which);
    41	      const raw = el.value.trim();
    42	      if (!raw) return false;
    43	      try { el.value = JSON.stringify(sortKeys(JSON.parse(raw)), null, 2); return true; }
    44	      catch { return false; }
    45	    }
    46	
    47	    // 导出面=实际消费面（§1 v2 原则外推）：app.js 只消费 loadFile/paneEl/formatPane，
    48	    // sortKeys 仅被 formatPane 内部调用，保持私有。
    49	    return { loadFile, paneEl, formatPane };
    50	  }
    51	
    52	  root.DiffLensFile = init;
    53	})(typeof window !== "undefined" ? window : globalThis);
    54	// REFACTOR STATUS: confidence=high todos=0

 succeeded in 0ms:
     1	# Δ ui-export (U3/5, rulebook_rev=v2)
     2	
     3	## 迁移内容
     4	
     5	app.js L240–291 的导出块逐字搬入 `ui-export.js`，共 8 个函数（与 §1 映射一一对应，无增减）：
     6	
     7	| 函数 | 说明 | 行为保持要点 |
     8	|---|---|---|
     9	| plainDiffText | 遗留 "Copy result" 纯文本格式 | 行前缀 `  `/`~ `/`- `/`+ ` 与 change 双行格式逐字保留（含 minor 用 `r.bText` 的基线行为） |
    10	| flashBtn | 按钮文案闪烁 | **1200ms** setTimeout 与还原逻辑不动 |
    11	| closeExport | 关闭 export 下拉 | `$("export").open = false` 原样 |
    12	| copyText | 剪贴板写入 + 反馈 | 文案 `"Copied ✓"` / `"Copy failed"` 逐字保留 |
    13	| copyResult | 复制纯文本 diff | 双空守卫原样 |
    14	| copyUnified | 复制 unified diff | 空导出提示文案逐字保留 |
    15	| copyMarkdown | 复制 Markdown | 同上 |
    16	| downloadPatch | Blob 下载 .patch | `difflens.patch` 文件名、`text/x-patch` MIME、**1000ms** revokeObjectURL、`"Saved ✓"` 全部原样 |
    17	
    18	## 形态与契约
    19	
    20	- **命名空间（R1 对照表）**：`window.DiffLensExport = (ctx) => api` 工厂；模块内零事件绑定（R6）、零 chrome.*（R3）、无状态（§1）
    21	- **ctx 契约**：`{ ta, tb, stats, opts }` — 面板/状态栏 DOM 引用 + 选项读取函数，按派发指令注入面
    22	- 模块内保留局部 `$`（getElementById）用于按钮/dropdown 查找——查的是 document 全局，不构成模块互调
    23	
    24	## app.js 侧待接线（本单元未动 app.js —— 铁律只写两个文件）
    25	
    26	后续留守单元需要：
    27	1. 删除 app.js L239–291 原函数块
    28	2. boot 前 `const exp = window.DiffLensExport({ ta, tb, stats, opts });`
    29	3. 既有绑定改指向 `exp.copyResult` / `exp.copyUnified` / `exp.copyMarkdown` / `exp.downloadPatch`（L372–375）
    30	4. `saveCurrent` 内的 `flashBtn($("hist-save"), "Saved ✓")`（L325）经 `exp.flashBtn` 转发——**ui-history 单元的 ctx 需含 flashBtn**
    31	5. compare.html 登记 `<script src="ui-export.js">`，位于 diff.js/history.js 之后、app.js 之前（R2）
    32	
    33	## 决定点（RULEBOOK 未明写，已按基线先例处理）
    34	
    35	- **`window.ClearDiff` 直接引用保留**：R1 的"禁止模块间直接互调"指五个拆分出的 ui-* 模块之间；diff.js 是既有引擎，app.js 基线即直接读 `window.ClearDiff`，且派发指令的 ctx 注入面（ta/tb/stats/opts）未含引擎。若排队人裁定引擎也须经 ctx，改动仅限工厂头部三处引用。
    36	
    37	## 验证
    38	
    39	- `node --check ui-export.js` ✅（见汇报）
    40	- 未跑 smoke/浏览器（§0 禁令）；接线前本文件为静载不执行代码，不影响现行为
    41	
    42	## 状态
    43	
    44	confidence=high todos=0

exec
/bin/zsh -lc "nl -ba ui-export.js | sed -n '1,220p'" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
     1	// DiffLens export module — copy/download the current comparison (plain text, unified
     2	// diff, Markdown, .patch). All local: clipboard + Blob URL, no network — and no chrome.*
     3	// here (RULEBOOK R3: storage/badge are the orchestration layer's job, app.js only).
     4	(function () {
     5	  "use strict";
     6	  const $ = (id) => document.getElementById(id);
     7	
     8	  // Factory form (RULEBOOK R1): app.js calls DiffLensExport(ctx) once at boot and binds
     9	  // the returned functions itself (R6 — no event listeners in this module).
    10	  // ctx = { ta, tb, stats, opts }: pane/status DOM refs plus the options reader; shared
    11	  // references arrive only via ctx, never by reaching into sibling ui modules.
    12	  window.DiffLensExport = function (ctx) {
    13	    const ta = ctx.ta, tb = ctx.tb, stats = ctx.stats, opts = ctx.opts;
    14	
    15	    // Plain-text diff (the legacy "Copy result" format).
    16	    function plainDiffText() {
    17	      const out = window.ClearDiff.compare(ta.value, tb.value, opts());
    18	      return out.rows.map((r) => {
    19	        if (r.type === "equal") return "  " + r.text;
    20	        if (r.type === "minor") return "~ " + r.bText;
    21	        if (r.type === "del") return "- " + r.text;
    22	        if (r.type === "add") return "+ " + r.text;
    23	        if (r.type === "change") return "- " + r.aWords.map((w) => w.text).join("") + "\n+ " + r.bWords.map((w) => w.text).join("");
    24	        return "";
    25	      }).join("\n");
    26	    }
    27	
    28	    function flashBtn(btn, label) {
    29	      if (!btn) return;
    30	      const old = btn.textContent;
    31	      btn.textContent = label; setTimeout(() => (btn.textContent = old), 1200);
    32	    }
    33	    function closeExport() { const d = $("export"); if (d) d.open = false; }
    34	
    35	    function copyText(text, btn, okLabel) {
    36	      if (!text) return;
    37	      navigator.clipboard.writeText(text)
    38	        .then(() => flashBtn(btn, okLabel || "Copied ✓"))
    39	        .catch(() => flashBtn(btn, "Copy failed"));
    40	    }
    41	    function copyResult() {
    42	      if (ta.value === "" && tb.value === "") return;
    43	      copyText(plainDiffText(), $("copy"));
    44	      closeExport();
    45	    }
    46	    function copyUnified() {
    47	      const ud = window.ClearDiff.toUnifiedDiff(ta.value, tb.value, opts());
    48	      if (!ud) { stats.textContent = "Nothing to export — the two texts are identical."; closeExport(); return; }
    49	      copyText(ud, $("copy-diff")); closeExport();
    50	    }
    51	    function copyMarkdown() {
    52	      const md = window.ClearDiff.toMarkdown(ta.value, tb.value, opts());
    53	      if (!md) { stats.textContent = "Nothing to export — the two texts are identical."; closeExport(); return; }
    54	      copyText(md, $("copy-md")); closeExport();
    55	    }
    56	    // Download the unified diff as a .patch file — a local Blob, no network.
    57	    function downloadPatch() {
    58	      const ud = window.ClearDiff.toUnifiedDiff(ta.value, tb.value, opts());
    59	      if (!ud) { stats.textContent = "Nothing to export — the two texts are identical."; closeExport(); return; }
    60	      const blob = new Blob([ud], { type: "text/x-patch" });
    61	      const url = URL.createObjectURL(blob);
    62	      const a = document.createElement("a");
    63	      a.href = url; a.download = "difflens.patch";
    64	      document.body.appendChild(a); a.click(); a.remove();
    65	      setTimeout(() => URL.revokeObjectURL(url), 1000);
    66	      flashBtn($("dl-patch"), "Saved ✓"); closeExport();
    67	    }
    68	
    69	    return { plainDiffText, flashBtn, closeExport, copyText, copyResult, copyUnified, copyMarkdown, downloadPatch };
    70	  };
    71	})();
    72	// REFACTOR STATUS: confidence=high todos=0

codex
我发现第 1 条有个可疑点：`delta-file.md` 的接入示例已改成裸工厂，但同文件后半段还留着旧的 `{ init }` 形态描述。先把金样文件本身和 key 数也钉实，再决定这算不算“已修复”。
exec
/bin/zsh -lc "nl -ba app.js | sed -n '1,120p'" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
     1	// ClearDiff popup/page — orchestration layer: caches DOM refs, owns UI state, and
     2	// wires the ui-* modules to the local diff engine. No network calls. Rendering, hunk
     3	// navigation, export, history UI, and file loading live in ui-render.js / ui-nav.js /
     4	// ui-export.js / ui-history.js / ui-file.js (split per refactors/app-js-split/RULEBOOK.md;
     5	// modules never talk to each other — every cross-module value passes through here).
     6	(function () {
     7	  "use strict";
     8	  const $ = (id) => document.getElementById(id);
     9	  const ta = $("text-a"), tb = $("text-b");
    10	  const optWs = $("opt-ws"), optCase = $("opt-case"), optWrap = $("opt-wrap");
    11	  const optBlank = $("opt-blank"), optChar = $("opt-char"), optWsShow = $("opt-ws-show");
    12	  const optFold = $("opt-fold");
    13	  const result = $("result"), stats = $("stats");
    14	  const navPrev = $("nav-prev"), navNext = $("nav-next"), navCount = $("nav-count");
    15	  const pipRail = $("pip-rail");
    16	  let view = "unified";
    17	  let showWs = false;
    18	  let fold = false;
    19	  // Which collapsed bands the user has manually expanded; keyed by stable fold key.
    20	  // Cleared whenever the compared text changes (keys would no longer match).
    21	  const FOLD_CONTEXT = 3;
    22	  let expandedFolds = new Set();
    23	  let lastA = null, lastB = null;
    24	
    25	  const hasChrome = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;
    26	
    27	  function opts() {
    28	    return {
    29	      ignoreWhitespace: optWs.checked,
    30	      ignoreCase: optCase.checked,
    31	      ignoreBlankLines: optBlank.checked,
    32	      charLevel: optChar.checked,
    33	    };
    34	  }
    35	
    36	  // --- module wiring (RULEBOOK R1: cross-module sharing passes only through this layer) ---
    37	  const R = window.DiffLensRender;
    38	  const nav = window.DiffLensNav({ result, pipRail, navPrev, navNext, navCount });
    39	  const exp = window.DiffLensExport({ ta, tb, stats, opts });
    40	  let historyList = [];
    41	  function persistHistory() { if (hasChrome) chrome.storage.local.set({ history: historyList }); }
    42	  const histUI = window.DiffLensHistUI({
    43	    ta, tb, stats,
    44	    histList: $("hist-list"), histSave: $("hist-save"), histMenu: $("history"),
    45	    esc: R.esc, hist: window.DiffLensHistory,
    46	    getHistoryList: () => historyList, setHistoryList: (l) => { historyList = l; },
    47	    persistHistory, flashBtn: exp.flashBtn, render, persist,
    48	  });
    49	  const fileUI = window.DiffLensFile({ ta, tb, stats, render, persist });
    50	
    51	  // Error boundary: a pathological input must never leave the UI broken or throw
    52	  // uncaught — show a friendly message and keep the tool usable.
    53	  function render() {
    54	    try {
    55	      renderDiff();
    56	    } catch (e) {
    57	      result.innerHTML = '<div class="placeholder"><span class="big">Couldn’t compare this input' +
    58	        (e && e.message ? " (" + R.esc(String(e.message)) + ")" : "") + '.</span><span>Try smaller or simpler text.</span></div>';
    59	      stats.textContent = "Comparison error";
    60	      nav.reset();
    61	    }
    62	  }
    63	  function renderDiff() {
    64	    const a = ta.value, b = tb.value;
    65	    // New text invalidates any manual expand state (fold keys won't match).
    66	    if (a !== lastA || b !== lastB) { expandedFolds.clear(); lastA = a; lastB = b; }
    67	    if (a === "" && b === "") {
    68	      result.innerHTML = '<div class="placeholder"><span class="big">Type or paste text in both boxes to compare.</span>' +
    69	        '<span>Nothing you paste here is uploaded — the comparison runs in this tab.</span></div>';
    70	      stats.textContent = "Type or paste text in both boxes to compare.";
    71	      nav.indexHunks();
    72	      return;
    73	    }
    74	    const out = window.ClearDiff.compare(a, b, opts());
    75	    if (out.stats.identical) {
    76	      const why = (optWs.checked || optCase.checked || optBlank.checked) ? " (with the chosen ignore options)" : "";
    77	      result.innerHTML = '<div class="placeholder"><span class="big">✓ The two texts are identical' + why + ".</span></div>";
    78	    } else {
    79	      let toRender = out;
    80	      if (fold) {
    81	        let folded = window.ClearDiff.foldRows(out.rows, FOLD_CONTEXT);
    82	        if (expandedFolds.size) {
    83	          folded = folded.flatMap((it) => (it.type === "fold" && expandedFolds.has(it.key) ? it.hidden : [it]));
    84	        }
    85	        toRender = { rows: folded };
    86	      }
    87	      result.innerHTML = view === "split" ? R.renderSplit(toRender, { showWs })
    88	        : view === "inline" ? R.renderInline(toRender, { showWs })
    89	        : R.renderUnified(toRender, { showWs });
    90	    }
    91	    const minorTxt = out.stats.minor ? ' · <span class="minorc">≈' + out.stats.minor + " minor</span>" : "";
    92	    const movedTxt = out.stats.moved ? ' · <span class="movedc">↕' + out.stats.moved + " moved</span>" : "";
    93	    const head = out.stats.onlyMinor ? '<span class="same">No important differences</span> · ' : "";
    94	    stats.innerHTML = head +
    95	      '<span class="add">+' + out.stats.added + " added</span> · " +
    96	      '<span class="del">−' + out.stats.removed + " removed</span>" + minorTxt + movedTxt +
    97	      " · A: " + out.stats.aLines + " lines, B: " + out.stats.bLines + " lines";
    98	    nav.indexHunks();
    99	  }
   100	
   101	  let t;
   102	  const schedule = () => { clearTimeout(t); t = setTimeout(render, 120); };
   103	
   104	  [ta, tb].forEach((el) => el.addEventListener("input", () => { schedule(); persist(); }));
   105	  // Keep the two input panes scroll-locked so the same region of A and B lines up
   106	  // while reading long text. A guard flag breaks the A→B→A feedback loop.
   107	  let syncingScroll = false;
   108	  function linkScroll(src, dst) {
   109	    src.addEventListener("scroll", () => {
   110	      if (syncingScroll) return;
   111	      syncingScroll = true;
   112	      dst.scrollTop = src.scrollTop;
   113	      dst.scrollLeft = src.scrollLeft;
   114	      requestAnimationFrame(() => { syncingScroll = false; });
   115	    });
   116	  }
   117	  linkScroll(ta, tb);
   118	  linkScroll(tb, ta);
   119	  [optWs, optCase, optBlank, optChar].forEach((el) => el.addEventListener("change", () => { render(); persistOpts(); }));
   120	  // wrap 只切 class 不重 render，但换行改变每行 offsetTop —— pip 位置必须跟着重算。

exec
/bin/zsh -lc "nl -ba package.mjs | sed -n '28,135p'" in /Users/zero/MyCode/diff-lens
exec
/bin/zsh -lc "nl -ba compare.html | sed -n '110,130p'" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
   110	      <span id="nav-count" class="navcount">—</span>
   111	      <button id="nav-next" class="navbtn" title="Next difference (Alt+↓)" disabled>↓</button>
   112	    </div>
   113	  </footer>
   114	</div>
   115	
   116	  <script src="diff.js"></script>
   117	  <script src="history.js"></script>
   118	  <script src="ui-render.js"></script>
   119	  <script src="ui-nav.js"></script>
   120	  <script src="ui-export.js"></script>
   121	  <script src="ui-history.js"></script>
   122	  <script src="ui-file.js"></script>
   123	  <script src="app.js"></script>
   124	</body>
   125	</html>

 succeeded in 0ms:
    28	const PAYLOAD = [
    29	  "manifest.json",
    30	  "background.js",
    31	  "compare.html",
    32	  "app.css",
    33	  "app.js",
    34	  "diff.js",
    35	  "history.js",
    36	  "ui-render.js",
    37	  "ui-nav.js",
    38	  "ui-export.js",
    39	  "ui-history.js",
    40	  "ui-file.js",
    41	  "icons/icon-16.png",
    42	  "icons/icon-32.png",
    43	  "icons/icon-48.png",
    44	  "icons/icon-128.png",
    45	];
    46	
    47	const die = (...msg) => { console.error(...msg); console.error("\nRefusing to ship this zip."); process.exit(1); };
    48	const run = (cmd, args, opts) => execFileSync(cmd, args, { encoding: "utf8", ...opts });
    49	
    50	for (const cmd of ["zip", "unzip"]) {
    51	  try { run("which", [cmd], { stdio: "pipe" }); }
    52	  catch { die(`${cmd} is not on PATH.`); }
    53	}
    54	
    55	// Paths must stay inside the repo. Belt and braces: PAYLOAD is hand-written, but
    56	// a stray "../" in it must never become a zip entry that unpacks outside the root.
    57	for (const f of PAYLOAD) {
    58	  if (isAbsolute(f) || normalize(f).startsWith("..")) die(`PAYLOAD entry escapes the repo: ${f}`);
    59	  if (!existsSync(f)) die(`PAYLOAD entry missing from disk: ${f}`);
    60	}
    61	
    62	const version = JSON.parse(readFileSync("manifest.json", "utf8")).version;
    63	const out = `difflens-${version}-upload.zip`;
    64	// Build under a temp name: a failed run must never leave something that looks
    65	// shippable lying next to the real artifact.
    66	const staging = `.${out}.staging`;
    67	rmSync(staging, { force: true, recursive: true });
    68	run("zip", ["-q", "-X", staging, ...PAYLOAD]);
    69	
    70	const tmp = mkdtempSync(join(tmpdir(), "difflens-pkg-"));
    71	try {
    72	  run("unzip", ["-q", staging, "-d", tmp]);
    73	
    74	  // 1. Exactly the payload — no more, no less.
    75	  const packed = run("unzip", ["-Z1", staging]).split("\n").filter((l) => l && !l.endsWith("/")).sort();
    76	  if (packed.join("\n") !== [...PAYLOAD].sort().join("\n")) {
    77	    die("Zip contents don't match PAYLOAD.\n  packed: " + packed.join(", "));
    78	  }
    79	
    80	  // 2. The privacy promise, checked against what actually ships rather than
    81	  //    against the working tree. STORE_LISTING and the privacy policy both make
    82	  //    this claim to users; the upload is the last place to be sure of it.
    83	  const m = JSON.parse(readFileSync(join(tmp, "manifest.json"), "utf8"));
    84	  const perms = [...(m.permissions || [])].sort();
    85	  if (perms.join() !== "contextMenus,storage") die(`Packed manifest grants ${JSON.stringify(perms)}, expected storage + contextMenus.`);
    86	  for (const field of ["host_permissions", "optional_permissions", "optional_host_permissions", "content_scripts", "externally_connectable"]) {
    87	    if (field in m) die(`Packed manifest declares ${field} — this extension reaches nothing but its own tab.`);
    88	  }
    89	
    90	  // Any file the manifest points at must be in PAYLOAD. Rather than enumerate
    91	  // MV3's fields — a list that grows every release and that an earlier version of
    92	  // this script lost track of — walk the whole manifest for path-shaped strings.
    93	  // A `default_locale` with no `_locales` tree is the sharp case: Chrome refuses
    94	  // to install it, and nothing else here would notice.
    95	  const shipped = new Set(PAYLOAD);
    96	  const pathish = [];
    97	  (function walk(v) {
    98	    if (typeof v === "string") { if (/^[\w./-]+\.(js|css|html|json|png|jpg|svg|woff2?)$/.test(v)) pathish.push(v); }
    99	    else if (Array.isArray(v)) v.forEach(walk);
   100	    else if (v && typeof v === "object") Object.values(v).forEach(walk);
   101	  })(m);
   102	  if (m.default_locale) pathish.push(`_locales/${m.default_locale}/messages.json`);
   103	  const dangling = [...new Set(pathish)].filter((p) => !shipped.has(p.replace(/^\.?\//, "")));
   104	  if (dangling.length) {
   105	    die("The packed manifest points at files that aren't in PAYLOAD:\n  " + dangling.join("\n  ") +
   106	      "\nChrome would reject or half-load this. Add them to PAYLOAD.");
   107	  }
   108	
   109	  const NET = /https?:\/\/|@import|url\(\s*["']?\/\//;
   110	  for (const f of PAYLOAD.filter((f) => /\.(html|css|js|json)$/.test(f))) {
   111	    const src = readFileSync(join(tmp, f), "utf8").split("\n")
   112	      .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
   113	      .join("\n");
   114	    if (NET.test(src)) die(`Packed ${f} reaches the network.`);
   115	  }
   116	
   117	  // 3. The one that matters: run the real suite against the unpacked zip. A file
   118	  //    left out of PAYLOAD fails here, which is why PAYLOAD can be hand-written.
   119	  cpSync("tests", join(tmp, "tests"), { recursive: true });
   120	  try {
   121	    run("node", [join(tmp, "tests", "smoke.mjs")], { cwd: tmp, stdio: "pipe" });
   122	  } catch (e) {
   123	    if (e.status === 2) die("Playwright isn't installed, so the packed zip can't be verified.\n" +
   124	      "Install it (npm i -g playwright && npx playwright install chromium) — a release\n" +
   125	      "shouldn't go out on an unverified artifact.");
   126	    die("The packed zip fails the smoke suite — something it needs isn't in PAYLOAD:\n" +
   127	      (e.stdout || "") + (e.stderr || ""));
   128	  }
   129	
   130	  renameSync(staging, out);
   131	  const kb = Math.round(run("wc", ["-c", out]).trim().split(/\s+/)[0] / 1024);
   132	  console.log(out);
   133	  console.log(`  ${packed.length} files, ${kb} KB — smoke suite passes against the unpacked zip`);
   134	  for (const f of packed) console.log("    " + f);
   135	} finally {

exec
/bin/zsh -lc "node -e 'const fs=require(\"fs\");const a=JSON.parse(fs.readFileSync(\"refactors/app-js-split/golden.json\",\"utf8\"));const b=JSON.parse(fs.readFileSync(\"refactors/app-js-split/golden-after.json\",\"utf8\"));const ka=Object.keys(a), kb=Object.keys(b); console.log(JSON.stringify({golden:ka.length, after:kb.length, same:JSON.stringify(a)===JSON.stringify(b), wsKeys:ka.filter(k=>k.startsWith(\"ws-show-tabs::\"))}, null, 2));'" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
{
  "golden": 18,
  "after": 18,
  "same": true,
  "wsKeys": []
}

codex
两处口径已经对不上仓库证据了：`golden-capture.mjs` 确实加了 `ws` case，但 `golden.json`/`golden-after.json` 仍各是 18 项，没有任何 `ws-show-tabs::*` 快照；`delta-file.md` 也仍残留旧形态描述。最后我只再核一下 smoke 文件本身是否达到 68 断言规模，避免把第 3 条误判。
exec
/bin/zsh -lc 'rg -n "ws-show-tabs|golden-after|golden.json|21/21|68 绿|68全绿|既有测试欠账|转交|export/file|盲区" .reviews refactors tests README.md docs .claude 2>/dev/null' in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
refactors/app-js-split/golden-capture.mjs:2:// 重构前跑一次生成 golden.json;重构后重跑,输出必须逐字节一致(diff-report 数据源)。
refactors/app-js-split/golden-capture.mjs:26:  { name: "ws-show-tabs", a: "a\tb  c\nsame", b: "a\tb\tc\nsame", ws: true },
refactors/app-js-split/golden-capture.mjs:51:const out = join(here, process.argv[2] || "golden.json");
refactors/app-js-split/golden-ws-after.json:20: "ws-show-tabs::unified": "<div class=\"row change hstart\" data-htype=\"change\" data-hline=\"1\"><div class=\"num\"><span>1</span><span></span></div><div class=\"sign\">−</div><div class=\"txt\">a<span<span class=\"ws\">·class=\"ws\"&gt;→b<del><span class=\"ws\">·</span><span class=\"ws\">·</span></del>c</span<span></div></div><div class=\"row change\"><div class=\"num\"><span></span><span>1</span></div><div class=\"sign\">+</div><div class=\"txt\">a<span<span class=\"ws\">·class=\"ws\"&gt;→b<ins><span<span class=\"ws\">·class=\"ws\"&gt;→</span<span></ins>c</span<span></div></div><div class=\"row equal\"><div class=\"num\"><span>2</span><span>2</span></div><div class=\"sign\"></div><div class=\"txt\">same</div></div>",
refactors/app-js-split/golden-ws-after.json:21: "ws-show-tabs::split": "<div class=\"srow hstart\" data-htype=\"change\" data-hline=\"1\"><div class=\"scol chg\"><div class=\"snum\">1</div><div class=\"stxt\">a<span<span class=\"ws\">·class=\"ws\"&gt;→b<del><span class=\"ws\">·</span><span class=\"ws\">·</span></del>c</span<span></div></div><div class=\"scol chg b\"><div class=\"snum\">1</div><div class=\"stxt\">a<span<span class=\"ws\">·class=\"ws\"&gt;→b<ins><span<span class=\"ws\">·class=\"ws\"&gt;→</span<span></ins>c</span<span></div></div></div><div class=\"srow\"><div class=\"scol equal\"><div class=\"snum\">2</div><div class=\"stxt\">same</div></div><div class=\"scol equal b\"><div class=\"snum\">2</div><div class=\"stxt\">same</div></div></div>",
refactors/app-js-split/golden-ws-after.json:22: "ws-show-tabs::inline": "<div class=\"row change hstart\" data-htype=\"change\" data-hline=\"1\"><div class=\"num\"><span>1</span><span>1</span></div><div class=\"sign\">~</div><div class=\"txt\">a<span<span class=\"ws\">·class=\"ws\"&gt;→b<del><span class=\"ws\">·</span><span class=\"ws\">·</span></del><ins><span<span class=\"ws\">·class=\"ws\"&gt;→</span<span></ins>c</span<span></div></div><div class=\"row equal\"><div class=\"num\"><span>2</span><span>2</span></div><div class=\"sign\"></div><div class=\"txt\">same</div></div>"
.reviews/refactor-app-js-split-r2.md:14:r2 快速复审。上轮 3 条采纳项已落地:①delta-file.md 文档漂移已改;②金样扩展 showWs 用例(pristine vs 重构后 21/21 一致,含 3 组 ws 激活,git status 可见 golden-capture.mjs 改动);③smoke 隐私扫描白名单已含 ui-*.js(smoke 复跑 68 绿)。第4条(export/file smoke 实操盲区)判定为重构前既有测试欠账,记档案转交不夹带。只答:三条落地是否属实有效、转交判定是否合理。零发现就说零发现。
.reviews/refactor-app-js-split-r2.md:16:按复审口径，我先核对这轮声称已落地的三项证据，再判断第 4 条“转交不夹带”是否成立。先读 `ultrawork` 和 `review` 指南，再直接查相关文件、测试痕迹和工作区状态。
.reviews/refactor-app-js-split-r2.md:171:/bin/zsh -lc 'rg -n "showWs|ui-.*js|whitelist|allowlist|privacy|export/file|既有测试欠账|转交|smoke" .omx . --hidden' in /Users/zero/MyCode/diff-lens
.reviews/refactor-app-js-split-r2.md:205:./.reviews/refactor-app-js-split-r2.md:14:r2 快速复审。上轮 3 条采纳项已落地:①delta-file.md 文档漂移已改;②金样扩展 showWs 用例(pristine vs 重构后 21/21 一致,含 3 组 ws 激活,git status 可见 golden-capture.mjs 改动);③smoke 隐私扫描白名单已含 ui-*.js(smoke 复跑 68 绿)。第4条(export/file smoke 实操盲区)判定为重构前既有测试欠账,记档案转交不夹带。只答:三条落地是否属实有效、转交判定是否合理。零发现就说零发现。
.reviews/refactor-app-js-split-r2.md:206:./.reviews/refactor-app-js-split-r2.md:16:按复审口径，我先核对这轮声称已落地的三项证据，再判断第 4 条“转交不夹带”是否成立。先读 `ultrawork` 和 `review` 指南，再直接查相关文件、测试痕迹和工作区状态。
.reviews/refactor-app-js-split-r2.md:256:./2.visual-refresh-and-change-rail/.reviews/2.visual-refresh-and-change-rail-T005-r2.md:2:我尝试本机复跑 `node tests/smoke.mjs`，但当前只读沙箱下 Playwright 启浏览器时因 `mkdtemp ... EPERM` 失败，无法独立复现你的 68 绿结果。仓库内 [METRICS.md](/Users/zero/MyCode/diff-lens/2.visual-refresh-and-change-rail/METRICS.md:1) 目前仍只记录 `2026-07-17` 的 57 绿基线。
.reviews/refactor-app-js-split-r2.md:260:./.reviews/refactor-app-js-split-r1.md:16:上下文自取: git status/diff 看全部未提交改动;规则见 refactors/app-js-split/RULEBOOK.md(v3);等价证据:smoke 68全绿、金样18组逐字节一致(golden.json vs golden-after.json)、3处变异重种全抓红(含 ui-nav 模块内部)。
.reviews/refactor-app-js-split-r2.md:261:./.reviews/refactor-app-js-split-r1.md:18:审查重点(逐项答):1) app.js 编排层的接线有无错漏(对照 refactors/app-js-split/delta-*.md 的调用点表);2) 有无夹带行为变更(哪怕一处文案/时序/守卫语义);3) 模块边界纪律(R1禁互调/R3 chrome隔离/R4 dataset契约)有无违反;4) 等价验证的覆盖有无关键盲区(金样6输入×3视图+smoke,漏了什么高危面?);5) compare.html/package.mjs 波及处理是否完整。
.reviews/refactor-app-js-split-r2.md:425:./.reviews/refactor-app-js-split-r1.md:2019:接下来补两块证据：一是直接比对 `golden.json` / `golden-after.json` 是否真一致，二是看现有 smoke/金样到底覆盖了哪些路径，哪些高危路径根本没打到。
.reviews/refactor-app-js-split-r2.md:563:./.reviews/refactor-app-js-split-r1.md:3674:上下文自取: git status/diff 看全部未提交改动;规则见 refactors/app-js-split/RULEBOOK.md(v3);等价证据:smoke 68全绿、金样18组逐字节一致(golden.json vs golden-after.json)、3处变异重种全抓红(含 ui-nav 模块内部)。
.reviews/refactor-app-js-split-r2.md:564:./.reviews/refactor-app-js-split-r1.md:3676:审查重点(逐项答):1) app.js 编排层的接线有无错漏(对照 refactors/app-js-split/delta-*.md 的调用点表);2) 有无夹带行为变更(哪怕一处文案/时序/守卫语义);3) 模块边界纪律(R1禁互调/R3 chrome隔离/R4 dataset契约)有无违反;4) 等价验证的覆盖有无关键盲区(金样6输入×3视图+smoke,漏了什么高危面?);5) compare.html/package.mjs 波及处理是否完整。
.reviews/refactor-app-js-split-r2.md:584:./.reviews/refactor-app-js-split-r1.md:3901:零发现：我没在当前未提交代码里找到能落成具体失败场景的接线错误、夹带行为变更，或 R1/R3/R4 违规。`golden.json` 和 `golden-after.json` 我直接比过，字节完全一致，两个文件都是 9701 bytes。唯一偏差是 [delta-file.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-file.md:6) 还写着旧的 `.init` 形态，但落地代码 [app.js](/Users/zero/MyCode/diff-lens/app.js:49) / [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:52) 已按 RULEBOOK v3 的裸工厂实现；这是文档漂移，不是运行时问题。
.reviews/refactor-app-js-split-r2.md:588:./.reviews/refactor-app-js-split-r1.md:3909:4. 等价验证有 3 个关键盲区。`showWs` 真渲染路径没被金样覆盖：快照脚本从未打开 `opt-ws-show`，见 [golden-capture.mjs](/Users/zero/MyCode/diff-lens/refactors/app-js-split/golden-capture.mjs:35)，而这次重构恰好把它改成 `{ showWs }` 透传，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:87) 和 [ui-render.js](/Users/zero/MyCode/diff-lens/ui-render.js:72)。`ui-export` / `ui-file` 的实行为大盲区：smoke 只验导出菜单可见和 `Escape` 关闭，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:94)，从不点复制/下载，也不测 FileReader 成功/失败、5MB 守卫、拖放、`Format JSON`，而这些正是整块迁出的逻辑，见 [ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:15) 和 [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:12)。另外，smoke 的源码级隐私扫描还只扫旧文件集，不含 `ui-*.js`，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:63)；如果新模块里误加外链，68 绿也未必会报，得靠打包校验补上。
.reviews/refactor-app-js-split-r2.md:590:./.reviews/refactor-app-js-split-r1.md:3914:零发现：我没在当前未提交代码里找到能落成具体失败场景的接线错误、夹带行为变更，或 R1/R3/R4 违规。`golden.json` 和 `golden-after.json` 我直接比过，字节完全一致，两个文件都是 9701 bytes。唯一偏差是 [delta-file.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-file.md:6) 还写着旧的 `.init` 形态，但落地代码 [app.js](/Users/zero/MyCode/diff-lens/app.js:49) / [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:52) 已按 RULEBOOK v3 的裸工厂实现；这是文档漂移，不是运行时问题。
.reviews/refactor-app-js-split-r2.md:594:./.reviews/refactor-app-js-split-r1.md:3922:4. 等价验证有 3 个关键盲区。`showWs` 真渲染路径没被金样覆盖：快照脚本从未打开 `opt-ws-show`，见 [golden-capture.mjs](/Users/zero/MyCode/diff-lens/refactors/app-js-split/golden-capture.mjs:35)，而这次重构恰好把它改成 `{ showWs }` 透传，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:87) 和 [ui-render.js](/Users/zero/MyCode/diff-lens/ui-render.js:72)。`ui-export` / `ui-file` 的实行为大盲区：smoke 只验导出菜单可见和 `Escape` 关闭，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:94)，从不点复制/下载，也不测 FileReader 成功/失败、5MB 守卫、拖放、`Format JSON`，而这些正是整块迁出的逻辑，见 [ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:15) 和 [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:12)。另外，smoke 的源码级隐私扫描还只扫旧文件集，不含 `ui-*.js`，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:63)；如果新模块里误加外链，68 绿也未必会报，得靠打包校验补上。
.reviews/refactor-app-js-split-r2.md:607:./2.visual-refresh-and-change-rail/design.md:95:- **R4 假绿灯**（上轮教训直接继承 + Codex 实锤三个盲区）：固定宽度 Unified 路径全绿掩盖不了 Split 无类型、缩窗漂移、wrap 后 `.current` 丢失——smoke 必须含模块 3 的反假绿灯三条；AC-008/AC-011 的人工走查仍不可省
.reviews/refactor-app-js-split-r2.md:664:./1.compare-page-redesign/design.md:88:**测试盲区（必须靠 AC-015 补上）**：smoke 用 `file://` 打开 compare.html → `typeof chrome === "undefined"` → `hasChrome=false` → `boot()` 在 :448 提前 return。**app.js:436-478 这 40 行、9 个 storage 键在整个测试矩阵里执行次数为 0**。AC-009 声称的"功能零回归"由 diff-test(48) + history-test(19) + smoke 兜底，而这三者对 storage 一行都碰不到。
.reviews/refactor-app-js-split-r2.md:779:上下文自取: git status/diff 看全部未提交改动;规则见 refactors/app-js-split/RULEBOOK.md(v3);等价证据:smoke 68全绿、金样18组逐字节一致(golden.json vs golden-after.json)、3处变异重种全抓红(含 ui-nav 模块内部)。
.reviews/refactor-app-js-split-r2.md:781:审查重点(逐项答):1) app.js 编排层的接线有无错漏(对照 refactors/app-js-split/delta-*.md 的调用点表);2) 有无夹带行为变更(哪怕一处文案/时序/守卫语义);3) 模块边界纪律(R1禁互调/R3 chrome隔离/R4 dataset契约)有无违反;4) 等价验证的覆盖有无关键盲区(金样6输入×3视图+smoke,漏了什么高危面?);5) compare.html/package.mjs 波及处理是否完整。
.reviews/refactor-app-js-split-r2.md:983:refactors/app-js-split/golden.json
.reviews/refactor-app-js-split-r2.md:985:refactors/app-js-split/golden-after.json
.reviews/refactor-app-js-split-r2.md:1061:// 重构前跑一次生成 golden.json;重构后重跑,输出必须逐字节一致(diff-report 数据源)。
.reviews/refactor-app-js-split-r2.md:1085:  { name: "ws-show-tabs", a: "a\tb  c\nsame", b: "a\tb\tc\nsame", ws: true },
.reviews/refactor-app-js-split-r2.md:1110:const out = join(here, process.argv[2] || "golden.json");
.reviews/refactor-app-js-split-r2.md:1544:/bin/zsh -lc 'rg -n "''^1'"\\.|"'^2'"\\.|"'^3'"\\.|"'^4'"\\.|"'^5'"\\.|严重|findings|问题|转交|盲区|delta-file|showWs|ui-\\*|export/file\" .reviews/refactor-app-js-split-r1.md" in /Users/zero/MyCode/diff-lens
.reviews/refactor-app-js-split-r2.md:1546:18:审查重点(逐项答):1) app.js 编排层的接线有无错漏(对照 refactors/app-js-split/delta-*.md 的调用点表);2) 有无夹带行为变更(哪怕一处文案/时序/守卫语义);3) 模块边界纪律(R1禁互调/R3 chrome隔离/R4 dataset契约)有无违反;4) 等价验证的覆盖有无关键盲区(金样6输入×3视图+smoke,漏了什么高危面?);5) compare.html/package.mjs 波及处理是否完整。
.reviews/refactor-app-js-split-r2.md:1627:2694:覆盖面已经清楚不少了。最后一轮我会按用户的五个问题做“证据闭环”：给出具体文件/行号、能触发的失败场景；如果没有能落地的失败场景，就明确写零发现，同时把验证盲区单列为风险而不是伪造 bug。
.reviews/refactor-app-js-split-r2.md:1658:3676:审查重点(逐项答):1) app.js 编排层的接线有无错漏(对照 refactors/app-js-split/delta-*.md 的调用点表);2) 有无夹带行为变更(哪怕一处文案/时序/守卫语义);3) 模块边界纪律(R1禁互调/R3 chrome隔离/R4 dataset契约)有无违反;4) 等价验证的覆盖有无关键盲区(金样6输入×3视图+smoke,漏了什么高危面?);5) compare.html/package.mjs 波及处理是否完整。
.reviews/refactor-app-js-split-r2.md:1678:3901:零发现：我没在当前未提交代码里找到能落成具体失败场景的接线错误、夹带行为变更，或 R1/R3/R4 违规。`golden.json` 和 `golden-after.json` 我直接比过，字节完全一致，两个文件都是 9701 bytes。唯一偏差是 [delta-file.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-file.md:6) 还写着旧的 `.init` 形态，但落地代码 [app.js](/Users/zero/MyCode/diff-lens/app.js:49) / [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:52) 已按 RULEBOOK v3 的裸工厂实现；这是文档漂移，不是运行时问题。
.reviews/refactor-app-js-split-r2.md:1682:3909:4. 等价验证有 3 个关键盲区。`showWs` 真渲染路径没被金样覆盖：快照脚本从未打开 `opt-ws-show`，见 [golden-capture.mjs](/Users/zero/MyCode/diff-lens/refactors/app-js-split/golden-capture.mjs:35)，而这次重构恰好把它改成 `{ showWs }` 透传，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:87) 和 [ui-render.js](/Users/zero/MyCode/diff-lens/ui-render.js:72)。`ui-export` / `ui-file` 的实行为大盲区：smoke 只验导出菜单可见和 `Escape` 关闭，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:94)，从不点复制/下载，也不测 FileReader 成功/失败、5MB 守卫、拖放、`Format JSON`，而这些正是整块迁出的逻辑，见 [ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:15) 和 [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:12)。另外，smoke 的源码级隐私扫描还只扫旧文件集，不含 `ui-*.js`，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:63)；如果新模块里误加外链，68 绿也未必会报，得靠打包校验补上。
.reviews/refactor-app-js-split-r2.md:1684:3914:零发现：我没在当前未提交代码里找到能落成具体失败场景的接线错误、夹带行为变更，或 R1/R3/R4 违规。`golden.json` 和 `golden-after.json` 我直接比过，字节完全一致，两个文件都是 9701 bytes。唯一偏差是 [delta-file.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-file.md:6) 还写着旧的 `.init` 形态，但落地代码 [app.js](/Users/zero/MyCode/diff-lens/app.js:49) / [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:52) 已按 RULEBOOK v3 的裸工厂实现；这是文档漂移，不是运行时问题。
.reviews/refactor-app-js-split-r2.md:1688:3922:4. 等价验证有 3 个关键盲区。`showWs` 真渲染路径没被金样覆盖：快照脚本从未打开 `opt-ws-show`，见 [golden-capture.mjs](/Users/zero/MyCode/diff-lens/refactors/app-js-split/golden-capture.mjs:35)，而这次重构恰好把它改成 `{ showWs }` 透传，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:87) 和 [ui-render.js](/Users/zero/MyCode/diff-lens/ui-render.js:72)。`ui-export` / `ui-file` 的实行为大盲区：smoke 只验导出菜单可见和 `Escape` 关闭，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:94)，从不点复制/下载，也不测 FileReader 成功/失败、5MB 守卫、拖放、`Format JSON`，而这些正是整块迁出的逻辑，见 [ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:15) 和 [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:12)。另外，smoke 的源码级隐私扫描还只扫旧文件集，不含 `ui-*.js`，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:63)；如果新模块里误加外链，68 绿也未必会报，得靠打包校验补上。
.reviews/refactor-app-js-split-r2.md:1692:现在只差两件事：把三项修复的现状钉到具体行号上，以及重新判断第 4 条的归类。我要补看当前文件行号和 `delta-export`/`ui-file` 的自证材料，确认“既有欠账”是否已被其他验证手段覆盖到足以转交。
.reviews/refactor-app-js-split-r2.md:1873:     2	// 重构前跑一次生成 golden.json;重构后重跑,输出必须逐字节一致(diff-report 数据源)。
.reviews/refactor-app-js-split-r2.md:1897:    26	  { name: "ws-show-tabs", a: "a\tb  c\nsame", b: "a\tb\tc\nsame", ws: true },
.reviews/refactor-app-js-split-r2.md:1922:    51	const out = join(here, process.argv[2] || "golden.json");
.reviews/refactor-app-js-split-r2.md:2367:/bin/zsh -lc "node -e 'const fs=require(\"fs\");const a=JSON.parse(fs.readFileSync(\"refactors/app-js-split/golden.json\",\"utf8\"));const b=JSON.parse(fs.readFileSync(\"refactors/app-js-split/golden-after.json\",\"utf8\"));const ka=Object.keys(a), kb=Object.keys(b); console.log(JSON.stringify({golden:ka.length, after:kb.length, same:JSON.stringify(a)===JSON.stringify(b), wsKeys:ka.filter(k=>k.startsWith(\"ws-show-tabs::\"))}, null, 2));'" in /Users/zero/MyCode/diff-lens
.reviews/refactor-app-js-split-r2.md:2377:两处口径已经对不上仓库证据了：`golden-capture.mjs` 确实加了 `ws` case，但 `golden.json`/`golden-after.json` 仍各是 18 项，没有任何 `ws-show-tabs::*` 快照；`delta-file.md` 也仍残留旧形态描述。最后我只再核一下 smoke 文件本身是否达到 68 断言规模，避免把第 3 条误判。
.reviews/refactor-app-js-split-r1.md:16:上下文自取: git status/diff 看全部未提交改动;规则见 refactors/app-js-split/RULEBOOK.md(v3);等价证据:smoke 68全绿、金样18组逐字节一致(golden.json vs golden-after.json)、3处变异重种全抓红(含 ui-nav 模块内部)。
.reviews/refactor-app-js-split-r1.md:18:审查重点(逐项答):1) app.js 编排层的接线有无错漏(对照 refactors/app-js-split/delta-*.md 的调用点表);2) 有无夹带行为变更(哪怕一处文案/时序/守卫语义);3) 模块边界纪律(R1禁互调/R3 chrome隔离/R4 dataset契约)有无违反;4) 等价验证的覆盖有无关键盲区(金样6输入×3视图+smoke,漏了什么高危面?);5) compare.html/package.mjs 波及处理是否完整。
.reviews/refactor-app-js-split-r1.md:220:refactors/app-js-split/golden.json
.reviews/refactor-app-js-split-r1.md:222:refactors/app-js-split/golden-after.json
.reviews/refactor-app-js-split-r1.md:2019:接下来补两块证据：一是直接比对 `golden.json` / `golden-after.json` 是否真一致，二是看现有 smoke/金样到底覆盖了哪些路径，哪些高危路径根本没打到。
.reviews/refactor-app-js-split-r1.md:2021:/bin/zsh -lc "sed -n '1,240p' refactors/app-js-split/golden.json" in /Users/zero/MyCode/diff-lens
.reviews/refactor-app-js-split-r1.md:2044:/bin/zsh -lc 'cmp -s refactors/app-js-split/golden.json refactors/app-js-split/golden-after.json; echo $?; wc -c refactors/app-js-split/golden.json refactors/app-js-split/golden-after.json' in /Users/zero/MyCode/diff-lens
.reviews/refactor-app-js-split-r1.md:2047:    9701 refactors/app-js-split/golden.json
.reviews/refactor-app-js-split-r1.md:2048:    9701 refactors/app-js-split/golden-after.json
.reviews/refactor-app-js-split-r1.md:2173:refactors/app-js-split/golden-capture.mjs:2:// 重构前跑一次生成 golden.json;重构后重跑,输出必须逐字节一致(diff-report 数据源)。
.reviews/refactor-app-js-split-r1.md:2177:refactors/app-js-split/golden-capture.mjs:48:const out = join(here, process.argv[2] || "golden.json");
.reviews/refactor-app-js-split-r1.md:2186:/bin/zsh -lc "sed -n '1,240p' refactors/app-js-split/golden-after.json" in /Users/zero/MyCode/diff-lens
.reviews/refactor-app-js-split-r1.md:2643:// 重构前跑一次生成 golden.json;重构后重跑,输出必须逐字节一致(diff-report 数据源)。
.reviews/refactor-app-js-split-r1.md:2689:const out = join(here, process.argv[2] || "golden.json");
.reviews/refactor-app-js-split-r1.md:2694:覆盖面已经清楚不少了。最后一轮我会按用户的五个问题做“证据闭环”：给出具体文件/行号、能触发的失败场景；如果没有能落地的失败场景，就明确写零发现，同时把验证盲区单列为风险而不是伪造 bug。
.reviews/refactor-app-js-split-r1.md:3674:上下文自取: git status/diff 看全部未提交改动;规则见 refactors/app-js-split/RULEBOOK.md(v3);等价证据:smoke 68全绿、金样18组逐字节一致(golden.json vs golden-after.json)、3处变异重种全抓红(含 ui-nav 模块内部)。
.reviews/refactor-app-js-split-r1.md:3676:审查重点(逐项答):1) app.js 编排层的接线有无错漏(对照 refactors/app-js-split/delta-*.md 的调用点表);2) 有无夹带行为变更(哪怕一处文案/时序/守卫语义);3) 模块边界纪律(R1禁互调/R3 chrome隔离/R4 dataset契约)有无违反;4) 等价验证的覆盖有无关键盲区(金样6输入×3视图+smoke,漏了什么高危面?);5) compare.html/package.mjs 波及处理是否完整。
.reviews/refactor-app-js-split-r1.md:3878:refactors/app-js-split/golden.json
.reviews/refactor-app-js-split-r1.md:3880:refactors/app-js-split/golden-after.json
.reviews/refactor-app-js-split-r1.md:3901:零发现：我没在当前未提交代码里找到能落成具体失败场景的接线错误、夹带行为变更，或 R1/R3/R4 违规。`golden.json` 和 `golden-after.json` 我直接比过，字节完全一致，两个文件都是 9701 bytes。唯一偏差是 [delta-file.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-file.md:6) 还写着旧的 `.init` 形态，但落地代码 [app.js](/Users/zero/MyCode/diff-lens/app.js:49) / [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:52) 已按 RULEBOOK v3 的裸工厂实现；这是文档漂移，不是运行时问题。
.reviews/refactor-app-js-split-r1.md:3909:4. 等价验证有 3 个关键盲区。`showWs` 真渲染路径没被金样覆盖：快照脚本从未打开 `opt-ws-show`，见 [golden-capture.mjs](/Users/zero/MyCode/diff-lens/refactors/app-js-split/golden-capture.mjs:35)，而这次重构恰好把它改成 `{ showWs }` 透传，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:87) 和 [ui-render.js](/Users/zero/MyCode/diff-lens/ui-render.js:72)。`ui-export` / `ui-file` 的实行为大盲区：smoke 只验导出菜单可见和 `Escape` 关闭，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:94)，从不点复制/下载，也不测 FileReader 成功/失败、5MB 守卫、拖放、`Format JSON`，而这些正是整块迁出的逻辑，见 [ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:15) 和 [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:12)。另外，smoke 的源码级隐私扫描还只扫旧文件集，不含 `ui-*.js`，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:63)；如果新模块里误加外链，68 绿也未必会报，得靠打包校验补上。
.reviews/refactor-app-js-split-r1.md:3914:零发现：我没在当前未提交代码里找到能落成具体失败场景的接线错误、夹带行为变更，或 R1/R3/R4 违规。`golden.json` 和 `golden-after.json` 我直接比过，字节完全一致，两个文件都是 9701 bytes。唯一偏差是 [delta-file.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-file.md:6) 还写着旧的 `.init` 形态，但落地代码 [app.js](/Users/zero/MyCode/diff-lens/app.js:49) / [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:52) 已按 RULEBOOK v3 的裸工厂实现；这是文档漂移，不是运行时问题。
.reviews/refactor-app-js-split-r1.md:3922:4. 等价验证有 3 个关键盲区。`showWs` 真渲染路径没被金样覆盖：快照脚本从未打开 `opt-ws-show`，见 [golden-capture.mjs](/Users/zero/MyCode/diff-lens/refactors/app-js-split/golden-capture.mjs:35)，而这次重构恰好把它改成 `{ showWs }` 透传，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:87) 和 [ui-render.js](/Users/zero/MyCode/diff-lens/ui-render.js:72)。`ui-export` / `ui-file` 的实行为大盲区：smoke 只验导出菜单可见和 `Escape` 关闭，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:94)，从不点复制/下载，也不测 FileReader 成功/失败、5MB 守卫、拖放、`Format JSON`，而这些正是整块迁出的逻辑，见 [ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:15) 和 [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:12)。另外，smoke 的源码级隐私扫描还只扫旧文件集，不含 `ui-*.js`，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:63)；如果新模块里误加外链，68 绿也未必会报，得靠打包校验补上。

exec
/bin/zsh -lc "node -e 'const fs=require(\"fs\");const s=fs.readFileSync(\"tests/smoke.mjs\",\"utf8\");const n=(s.match(/\\bok\\s*\\(/g)||[]).length; console.log(n);'" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
56

codex
我又扫到一个补充物证：仓库里有 `refactors/app-js-split/golden-ws-after.json`，这可能是他们把 ws 金样另存了，而不是覆写原来的 `golden*.json`。我把这个补齐看一眼，再定最终结论，避免误把“证据放错地方”说成“没做”。
exec
/bin/zsh -lc "rg --files refactors/app-js-split | rg 'golden.*ws|golden-ws|golden-after|golden\\.json'" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
refactors/app-js-split/golden.json
refactors/app-js-split/golden-ws-after.json
refactors/app-js-split/golden-after.json

exec
/bin/zsh -lc "node -e 'const fs=require(\"fs\"); for (const f of [\"refactors/app-js-split/golden-ws-after.json\",\"refactors/app-js-split/golden-ws.json\"]) { if (fs.existsSync(f)) { const j=JSON.parse(fs.readFileSync(f,\"utf8\")); console.log(f, Object.keys(j).length, Object.keys(j).filter(k=>k.startsWith(\"ws-show-tabs::\"))); } }'" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
refactors/app-js-split/golden-ws-after.json 21 [
  'ws-show-tabs::unified',
  'ws-show-tabs::split',
  'ws-show-tabs::inline'
]

exec
/bin/zsh -lc "sed -n '1,120p' refactors/app-js-split/judge-report.md" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
# 判官档案 — app-js-split (G0.5 自验证)

## 基线层
- 141 项全绿: diff-test 48 / history-test 19 / smoke 68 / unified-blank 6 (2026-07-18)
- 判官构成: 纯函数层由 diff/history/unified 测试覆盖;app.js(DOM 胶水层)由 smoke 整页断言充当差分层

## 自验证:种 3 处不同职责的行为变异,判官必须逐个变红
| # | 变异(职责) | 种法 | 结果 |
|---|-----------|------|------|
| 1 | 输入:input 监听不再触发比较 | 删 schedule() 调用 | 🔴 抓到(smoke 异常终止,退出码 1) |
| 2 | 渲染:identical 分支失效 | if(false && ...) | 🔴 抓到(同型异常终止) |
| 3 | pip 导航:轨道永久隐藏 | toggle(hidden, true) | 🔴 抓到(同型异常终止) |

- 复原验证: app.js 与原始逐字节一致,smoke 复绿 68/68
- 备注: 变红形态是"断言等待超时→异常退出"而非整洁的 failed 计数——判官有效但报错形态粗粝,排障时先看 smoke 输出前段
- 结论: **判官可信,准予开工**(原码必绿 ✓ 坏码必红 3/3 ✓)

codex
有发现，不是零发现。

1. 第 2 条“不属实/证据不闭环”。[golden-capture.mjs](/Users/zero/MyCode/diff-lens/refactors/app-js-split/golden-capture.mjs:19) 确实已加 `ws-show-tabs`，理论上会产出 21 组；但仓库里的主对比物证 [golden.json](/Users/zero/MyCode/diff-lens/refactors/app-js-split/golden.json:1) 和 [golden-after.json](/Users/zero/MyCode/diff-lens/refactors/app-js-split/golden-after.json:1) 仍各只有 18 组，没有任何 `ws-show-tabs::*` key。我只看到单边的 [golden-ws-after.json](/Users/zero/MyCode/diff-lens/refactors/app-js-split/golden-ws-after.json:1)，没看到对应的 pristine `golden-ws.json`。所以“pristine vs 重构后 21/21 一致”这句，按仓库证据目前不能算已落地生效。

2. 第 1 条“不属实/未完全修掉”。[delta-file.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-file.md:10) 的接入示例已经改成裸工厂，但同文件后面仍保留旧口径：`root.DiffLensFile = { init }`，见 [delta-file.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-file.md:40)。这说明文档漂移还在，只是修了一半。

3. 第 4 条“转交不夹带”判定不合理。它确实是既有测试欠账，但它同时也是这次重构直接改到的面：[`ui-export.js`](/Users/zero/MyCode/diff-lens/ui-export.js:41) 的复制/下载分支和 [`ui-file.js`](/Users/zero/MyCode/diff-lens/ui-file.js:12) 的文件读取/格式化分支，当前 smoke 仍只验证导出菜单可见与关闭，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:93)；两份 delta 还明确写了这些路径没跑浏览器级验证，见 [delta-export.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-export.md:39) 和 [delta-file.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-file.md:28)。所以这不能完全转交成“与本次无关”。

4. 第 3 条“属实有效”仅就代码修复本身成立。[tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:63) 的源码隐私扫描现在确实已把 `ui-render.js`、`ui-nav.js`、`ui-export.js`、`ui-history.js`、`ui-file.js` 全纳入。至于“smoke 复跑 68 绿”，我在当前只读沙箱里不能独立复跑确认。
tokens used
87,115
有发现，不是零发现。

1. 第 2 条“不属实/证据不闭环”。[golden-capture.mjs](/Users/zero/MyCode/diff-lens/refactors/app-js-split/golden-capture.mjs:19) 确实已加 `ws-show-tabs`，理论上会产出 21 组；但仓库里的主对比物证 [golden.json](/Users/zero/MyCode/diff-lens/refactors/app-js-split/golden.json:1) 和 [golden-after.json](/Users/zero/MyCode/diff-lens/refactors/app-js-split/golden-after.json:1) 仍各只有 18 组，没有任何 `ws-show-tabs::*` key。我只看到单边的 [golden-ws-after.json](/Users/zero/MyCode/diff-lens/refactors/app-js-split/golden-ws-after.json:1)，没看到对应的 pristine `golden-ws.json`。所以“pristine vs 重构后 21/21 一致”这句，按仓库证据目前不能算已落地生效。

2. 第 1 条“不属实/未完全修掉”。[delta-file.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-file.md:10) 的接入示例已经改成裸工厂，但同文件后面仍保留旧口径：`root.DiffLensFile = { init }`，见 [delta-file.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-file.md:40)。这说明文档漂移还在，只是修了一半。

3. 第 4 条“转交不夹带”判定不合理。它确实是既有测试欠账，但它同时也是这次重构直接改到的面：[`ui-export.js`](/Users/zero/MyCode/diff-lens/ui-export.js:41) 的复制/下载分支和 [`ui-file.js`](/Users/zero/MyCode/diff-lens/ui-file.js:12) 的文件读取/格式化分支，当前 smoke 仍只验证导出菜单可见与关闭，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:93)；两份 delta 还明确写了这些路径没跑浏览器级验证，见 [delta-export.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-export.md:39) 和 [delta-file.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-file.md:28)。所以这不能完全转交成“与本次无关”。

4. 第 3 条“属实有效”仅就代码修复本身成立。[tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:63) 的源码隐私扫描现在确实已把 `ui-render.js`、`ui-nav.js`、`ui-export.js`、`ui-history.js`、`ui-file.js` 全纳入。至于“smoke 复跑 68 绿”，我在当前只读沙箱里不能独立复跑确认。
