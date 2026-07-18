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
 ...\220\350\241\214\346\227\245\345\277\227.jsonl" |   8 +
 4 files changed, 68 insertions(+), 322 deletions(-)

codex
规则基线已经拿到，下一步对照 `delta-*` 的调用点表和实际未提交代码；同时会看 `judge-report.md` / 金样文件，判断“作者声称的等价验证”是否真的覆盖到本次风险面。
exec
/bin/zsh -lc "for f in refactors/app-js-split/delta-*.md refactors/app-js-split/judge-report.md; do printf '===== %s =====\\n' \""'$f"; sed -n '"'1,240p' \""'$f"; done' in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
===== refactors/app-js-split/delta-export.md =====
# Δ ui-export (U3/5, rulebook_rev=v2)

## 迁移内容

app.js L240–291 的导出块逐字搬入 `ui-export.js`，共 8 个函数（与 §1 映射一一对应，无增减）：

| 函数 | 说明 | 行为保持要点 |
|---|---|---|
| plainDiffText | 遗留 "Copy result" 纯文本格式 | 行前缀 `  `/`~ `/`- `/`+ ` 与 change 双行格式逐字保留（含 minor 用 `r.bText` 的基线行为） |
| flashBtn | 按钮文案闪烁 | **1200ms** setTimeout 与还原逻辑不动 |
| closeExport | 关闭 export 下拉 | `$("export").open = false` 原样 |
| copyText | 剪贴板写入 + 反馈 | 文案 `"Copied ✓"` / `"Copy failed"` 逐字保留 |
| copyResult | 复制纯文本 diff | 双空守卫原样 |
| copyUnified | 复制 unified diff | 空导出提示文案逐字保留 |
| copyMarkdown | 复制 Markdown | 同上 |
| downloadPatch | Blob 下载 .patch | `difflens.patch` 文件名、`text/x-patch` MIME、**1000ms** revokeObjectURL、`"Saved ✓"` 全部原样 |

## 形态与契约

- **命名空间（R1 对照表）**：`window.DiffLensExport = (ctx) => api` 工厂；模块内零事件绑定（R6）、零 chrome.*（R3）、无状态（§1）
- **ctx 契约**：`{ ta, tb, stats, opts }` — 面板/状态栏 DOM 引用 + 选项读取函数，按派发指令注入面
- 模块内保留局部 `$`（getElementById）用于按钮/dropdown 查找——查的是 document 全局，不构成模块互调

## app.js 侧待接线（本单元未动 app.js —— 铁律只写两个文件）

后续留守单元需要：
1. 删除 app.js L239–291 原函数块
2. boot 前 `const exp = window.DiffLensExport({ ta, tb, stats, opts });`
3. 既有绑定改指向 `exp.copyResult` / `exp.copyUnified` / `exp.copyMarkdown` / `exp.downloadPatch`（L372–375）
4. `saveCurrent` 内的 `flashBtn($("hist-save"), "Saved ✓")`（L325）经 `exp.flashBtn` 转发——**ui-history 单元的 ctx 需含 flashBtn**
5. compare.html 登记 `<script src="ui-export.js">`，位于 diff.js/history.js 之后、app.js 之前（R2）

## 决定点（RULEBOOK 未明写，已按基线先例处理）

- **`window.ClearDiff` 直接引用保留**：R1 的"禁止模块间直接互调"指五个拆分出的 ui-* 模块之间；diff.js 是既有引擎，app.js 基线即直接读 `window.ClearDiff`，且派发指令的 ctx 注入面（ta/tb/stats/opts）未含引擎。若排队人裁定引擎也须经 ctx，改动仅限工厂头部三处引用。

## 验证

- `node --check ui-export.js` ✅（见汇报）
- 未跑 smoke/浏览器（§0 禁令）；接线前本文件为静载不执行代码，不影响现行为

## 状态

confidence=high todos=0
===== refactors/app-js-split/delta-file.md =====
# delta-file — U5/5: ui-file.js（rulebook_rev=v2）

## 产出

- 新文件 `ui-file.js`：§1 映射的 loadFile/paneEl/sortKeys/formatPane + `MAX_FILE_BYTES` 常量迁入。
- **app.js/compare.html 本任务未动**（铁律：只写 ui-file.js 与本文件）。留守侧待办见「集成清单」。

## 命名空间与契约（R1）

```js
// app.js 留守侧的接入方式（render/persist 是函数声明会提升，init 可在 IIFE 顶部调用）：
const F = window.DiffLensFile.init({ ta, tb, stats, render, persist });
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
===== refactors/app-js-split/delta-history.md =====
# delta-history — ui-history.js 搬迁记录 (U4/5, rulebook_rev=v2)

## 搬迁映射（§1 一源一目标）

| 函数 | 来源 (app.js 行) | 去向 | 可见性 |
|---|---|---|---|
| relTime | 297–303 | ui-history.js | 私有（仅 renderHistList 消费，R6：只导出被绑定的函数） |
| renderHistList | 304–317 | ui-history.js | init api 导出 |
| saveCurrent | 318–326 | ui-history.js | init api 导出 |
| restoreHist | 327–332 | ui-history.js | init api 导出 |
| delHist | 333 | ui-history.js | init api 导出 |

未搬迁（按规则留守 app.js）：`persistHistory`（chrome.*，R3）、`H = window.DiffLensHistory` 的取得与转发（R1 禁模块互调）、`hist-save`/`hist-list` 事件绑定（R6）、boot 中的 `historyList` 装载（§1 状态归属）。

## 命名空间与形态（R1 v2）

`window.DiffLensHistUI = init`，即 `DiffLensHistUI(ctx) => api` 工厂——按 R1 公式 `window.DiffLens{Name} = init(ctx) => api` 的字面形态，全局本身就是工厂函数（非 `{ init }` 包装对象）。**未占用 `DiffLensHistory`**（history.js 既有全局）。

## ctx 契约（app.js 集成时需提供）

| 键 | 内容 | 依据 |
|---|---|---|
| ta / tb / stats | app.js 顶部已缓存的元素 | DOM 引用经 init(ctx) 注入 |
| histList / histSave / histMenu | `$("hist-list")` / `$("hist-save")` / `$("history")` | 同上；原代码逐次 `$()` 查询改为 init 时注入——三元素在 compare.html 中静态存在，行为等价（且符合 frontend.md「顶部一次性缓存」） |
| esc | 转发自 `DiffLensRender.esc` | R1：禁直接引用 DiffLensRender |
| hist | 转发自 `DiffLensHistory`（preview/tooLarge/add/remove） | R1：跨模块共享一律经 ctx |
| getHistoryList / setHistoryList | historyList 存取器，状态留 app.js | §1 状态归属 |
| persistHistory | chrome.storage 写入，留 app.js | R3 |
| flashBtn | 转发自 ui-export 的 init api | §1：flashBtn 迁入 ui-export.js |
| render / persist | app.js 编排入口（restoreHist 消费） | §1 app.js 留守职责 |

## 验证

- `node --check ui-history.js` ✅
- 纯 Node 等价自检（§0 v2 放行）：原函数逐字副本 vs 新模块，同一确定性场景（固定 Date.now/Math.random；空态渲染、双保存、tooLarge 拒存、restore 命中/未命中、删除重渲）——**15 个副作用逐字节一致**（含两次列表 innerHTML、三条 stats 文案、restore 的 render/persist/close 序列、flashBtn 调用）。脚本在会话 scratchpad，未落入仓库。
- 未跑 tests/smoke.mjs、未起浏览器（§0 禁令）。

## 集成待办（本任务范围外，留给 app.js 收编任务）

1. app.js 删除五个函数原文，改为 `const histUI = DiffLensHistUI({...ctx 如上表...})`，事件绑定与 boot 调用点改经 `histUI.*`。
2. compare.html 注册 `ui-history.js`，位于 diff.js/history.js 之后、app.js 之前（R2）。
3. **契约依赖**：ctx.flashBtn 需 ui-export 的 init api 导出 flashBtn（flashBtn 在 ui-export 内部也被 downloadPatch 等消费，但 saveCurrent 这条消费线要求它出现在导出面）；ctx.esc 需 DiffLensRender 导出 esc（§1 v2 已保证）。

## 被迫自行决定的点

- R1 公式的字面解读：全局=工厂函数本身。若同批其他 ui-* 采用 `{ init }` 对象形态，属命名空间形态分叉，建议进 RULEBOOK 修订队列统一。
- `$()` 逐次查询 → init 注入元素引用：判定为行为等价（静态 DOM），未列为偏差。

// REFACTOR STATUS: confidence=high todos=0
===== refactors/app-js-split/delta-nav.md =====
# delta-nav — app.js 侧改法（ui-nav.js 迁出后的接线说明）

> 批量道 U2/5 产物，rulebook_rev=v2。本文档只描述改法，**不改动 app.js/compare.html**——落地由后续集成步骤执行。
> 行号以当前 app.js（541 行版）为准。

## 1. compare.html 登记（R2，集成时必做）

`ui-nav.js` 插在 history.js 之后、app.js 之前：

```html
<script src="diff.js"></script>
<script src="history.js"></script>
<script src="ui-nav.js"></script>   <!-- 新增 -->
<script src="app.js"></script>
```

漏登记 = `window.DiffLensNav` 未定义，app.js 顶部实例化即抛错（防护网必抓）。

## 2. app.js 删除

| 位置 | 删除内容 |
|---|---|
| L15 | `let hunks = [], hunkIdx = -1;`（状态归 ui-nav 所有） |
| L177–L237 | `// --- difference navigation ...` 注释起，indexHunks/updateNav/renderPips/jump 四函数整段 |

## 3. app.js 新增（实例化）

在顶部 DOM 引用缓存（L4–L11）与状态声明之后、任何调用点之前加一行：

```js
const nav = window.DiffLensNav.init({ result, pipRail, navPrev, navNext, navCount });
```

ctx 五个字段全部是 app.js 已缓存的元素常量，原有的 `navPrev`/`pipRail` 判空守卫已随函数体迁入模块内部，app.js 侧无需再包判空。

## 4. 调用点逐一改写（事件绑定全部留在 app.js，R6）

| 原位置 | 原代码 | 改为 | 说明 |
|---|---|---|---|
| L138（render 的 catch） | `hunks = []; hunkIdx = -1; updateNav();` | `nav.reset();` | reset 内部即这三条语句；错误态只 updateNav 不 renderPips（轨道隐藏但 DOM 不清空），原语义保持 |
| L149（renderDiff 双空早退） | `indexHunks();` | `nav.indexHunks();` | |
| L174（renderDiff 末尾） | `indexHunks();` | `nav.indexHunks();` | |
| L355（optWrap change 绑定内） | `renderPips();` | `nav.renderPips();` | 绑定本身不动 |
| L360（resize 防抖） | `rt = setTimeout(renderPips, 120);` | `rt = setTimeout(nav.renderPips, 120);` | renderPips 闭包持有 ctx、无 this 依赖，裸引用传递安全 |
| L390–L394（stats click） | `if (!hunks.length) return; hunkIdx = -1; jump(1);` | `nav.jumpTo(0);` | `!hunks.length` 守卫内移进 jumpTo，空态同样零副作用；`e.target.closest(...)` 守卫保留在绑定处 |
| L403 | `navPrev.addEventListener("click", () => jump(-1));` | `... () => nav.jump(-1));` | 外层 `if (navPrev)` 保留 |
| L404 | `navNext.addEventListener("click", () => jump(1));` | `... () => nav.jump(1));` | |
| L406–L411（pipRail click 委托） | `if (!p \|\| !hunks.length) return; hunkIdx = Number(p.dataset.pip) - 1; jump(1);` | `if (!p) return; nav.jumpTo(Number(p.dataset.pip));` | `!p` 守卫留绑定处，`!hunks.length` 守卫内移；`hunkIdx = i - 1 再 jump(1)` 模式原样封装 |
| L419–L420（Alt+↑/↓） | `jump(1)` / `jump(-1)` | `nav.jump(1)` / `nav.jump(-1)` | |

以上改完后，app.js 内不再出现 `hunks`/`hunkIdx`/`updateNav`/`renderPips`/`indexHunks` 标识符（`jump` 只以 `nav.jump` 形式出现）——可用 grep 作为集成后的机械自检。

## 5. 导出面与契约

- `DiffLensNav.init(ctx)` 返回 `{ indexHunks, renderPips, jump, jumpTo, reset }`；**updateNav 私有**（仅模块内部调用，遵循 §1 v2「导出面=实际消费面」先例）。
- `reset()` / `jumpTo(i)` 是状态私有化后被迫新增的两个薄封装，逐语句对应原编排代码（见上表），不含新行为。
- **R4 契约不变**：renderPips 仍只读 hunk 首行的 `data-htype`/`data-hline` dataset（函数体逐字迁移，经纯 Node 比对脚本核验四函数与原文逐字一致）。写方在 ui-render.js 的 `hmeta()`，跨模块不直调（R1），接口只有 dataset。
- ui-nav 不碰 `chrome.*`（R3，迁移前后均无）。

## 6. 行为保持要点（判官关注项）

- 四函数体（含全部注释）与 app.js 原文逐行逐字一致，仅缩进层级 +2。
- 错误边界路径：`nav.reset()` 与原三连语句等价——不额外调 renderPips，pip 轨道只被 `hidden` class 隐藏，innerHTML 不清空（与迁移前一致）。
- `jumpTo(0)`（stats click）与原 `hunkIdx = -1; jump(1)` 等价：jump 内 `hunkIdx < 0` 分支落到 0。
- `jumpTo(i)`（pip click）与原 `hunkIdx = i - 1; jump(1)` 等价：`(i - 1 + 1 + n) % n === i`（i ∈ [0, n)）。
- pip 生成的 HTML 字符串、`style.top` 写入、焦点复原、`.current` 幂等复原逻辑均逐字未动——DOM 金样对比应零差异。
===== refactors/app-js-split/delta-render.md =====
# delta-render — app.js 侧配套改法（U1 ui-render.js 落地时由主流程套用）

> 行号以当前 main 分支 app.js（541 行）为准；同时给出文本锚点，防行号漂移。
> 本文档只描述改法，未改动 app.js/compare.html（铁律：U1 只写 ui-render.js 与本文档）。

## 1. app.js 删除行段（两段，中间的 opts() 保留）

| 段 | 行号（原文件） | 起止锚点 | 内容 |
|---|---|---|---|
| A | 24–46 | `function esc(s) {` 起 → `moveTag` 的收尾 `}`（`function opts()` 之前一行）止 | esc / fmt（含 `// Escape + (optionally)…` 注释）/ renderWords / moveTag（含 `// Inline badge…` 注释） |
| B | 56–127 | `// 两个 span 之间不留字面空格` 注释起 → `renderSplit` 的收尾 `}`（`// Error boundary:` 注释之前）止 | numCell / urow / hmeta（含 pip 轨道契约注释，R4）/ foldRowHtml（含 Unified/Inline 共享注释）/ renderColumn / renderUnified / renderInline / scol / renderSplit |

- **保留**：47–54 `function opts() { … }`（读 DOM checkbox，属编排层）与 55 空行。
- 删除后 A 段位置会留下相邻空行（原 23 行与原 47 行之间），压成一个空行。
- 上述所有注释随函数一并迁走（已逐字迁入 ui-render.js，勿在 app.js 留副本）。

## 2. app.js 新增模块别名（跟随 history.js 既有先例 `const H = window.DiffLensHistory;`）

在原 22 行 `const hasChrome = …;` 之后新增一行：

```js
const R = window.DiffLensRender;
```

## 3. app.js 调用点替换（共 6 处）

| 原行号 | 所在函数 | 原文 | 改为 |
|---|---|---|---|
| 136 | render() 错误边界 | `esc(String(e.message))` | `R.esc(String(e.message))` |
| 165 | renderDiff() | `view === "split" ? renderSplit(toRender) : view === "inline" ? renderInline(toRender) : renderUnified(toRender)` | `view === "split" ? R.renderSplit(toRender, { showWs }) : view === "inline" ? R.renderInline(toRender, { showWs }) : R.renderUnified(toRender, { showWs })` |
| 310 | renderHistList() | `esc(e.id)`（data-restore 属性） | `R.esc(e.id)` |
| 311 | renderHistList() | `esc(e.preview)` | `R.esc(e.preview)` |
| 312 | renderHistList() | `esc(relTime(e.ts))` | `R.esc(relTime(e.ts))` |
| 314 | renderHistList() | `esc(e.id)`（data-del 属性） | `R.esc(e.id)` |

- `{ showWs }` options bag 是三个渲染入口的唯一状态入参（RULEBOOK §1 v2）；`showWs` 状态变量本身**留在 app.js**（原 13 行），optWsShow 的 change 监听与 boot() 恢复逻辑不动。
- 除上述 6 处外，app.js 无其他 esc/fmt/renderWords/… 引用（fmtBtn/`$("fmt-json")` 是 JSON 格式化按钮，同名巧合，不动）。
- renderHistList 的 esc 走 app.js 直接消费 `R.esc`；将来 U-history 拆出 ui-history.js 时按 R1 经 ctx 转发，此处不预支。

## 4. compare.html 加载顺序（R2）

在原 117/118 行之间插入：

```html
  <script src="diff.js"></script>
  <script src="history.js"></script>
  <script src="ui-render.js"></script>   <!-- 新增：diff.js/history.js 之后、app.js 之前 -->
  <script src="app.js"></script>
```

## 5. 波及面备忘（本任务范围外，主流程需另行处理）

- **package.mjs 的 PAYLOAD 白名单**必须补 `ui-render.js`，否则商店 zip 缺文件、解包测试即挂（CLAUDE.md：仅白名单文件进包）。
- CLAUDE.md 目录结构一节与 docs/ARCHITECTURE.md 的文件清单需同步新文件（cm-doc-syncer 职责）。

## 6. 验证锚点

- 纯 Node 等价自检已过：旧函数原文（app.js 24–127 抠出、剔除 opts）vs 新模块，同 fixture 下 unified/inline/split × showWs on/off 共 6 组输出逐字节相等，另验 esc 导出与「缺省 bag ≡ showWs:false」。脚本在会话 scratchpad（`equiv-check.mjs`），判官可重建。
- 套用本 delta 后的整体验证（smoke/浏览器）按 §0 留给批量站 4/5，此处不跑。

<!-- REFACTOR STATUS: confidence=high todos=0 -->
===== refactors/app-js-split/judge-report.md =====
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

exec
/bin/zsh -lc 'git diff -- app.js compare.html package.mjs ui-render.js ui-nav.js ui-export.js ui-history.js ui-file.js' in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-U33ZvnOC' (errno=Operation not permitted)
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-G5lynx79' (errno=Operation not permitted)
diff --git a/app.js b/app.js
index 93437fd..2b32e4f 100644
--- a/app.js
+++ b/app.js
@@ -1,4 +1,8 @@
-// ClearDiff popup/page — wires UI to the local diff engine. No network calls.
+// ClearDiff popup/page — orchestration layer: caches DOM refs, owns UI state, and
+// wires the ui-* modules to the local diff engine. No network calls. Rendering, hunk
+// navigation, export, history UI, and file loading live in ui-render.js / ui-nav.js /
+// ui-export.js / ui-history.js / ui-file.js (split per refactors/app-js-split/RULEBOOK.md;
+// modules never talk to each other — every cross-module value passes through here).
 (function () {
   "use strict";
   const $ = (id) => document.getElementById(id);
@@ -12,7 +16,6 @@
   let view = "unified";
   let showWs = false;
   let fold = false;
-  let hunks = [], hunkIdx = -1;
   // Which collapsed bands the user has manually expanded; keyed by stable fold key.
   // Cleared whenever the compared text changes (keys would no longer match).
   const FOLD_CONTEXT = 3;
@@ -21,29 +24,6 @@
 
   const hasChrome = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;
 
-  function esc(s) {
-    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
-  }
-  // Escape + (optionally) reveal whitespace as faint glyphs — BC-style.
-  function fmt(s) {
-    let h = esc(s);
-    if (showWs) {
-      h = h.replace(/\t/g, '<span class="ws">→</span>').replace(/ /g, '<span class="ws">·</span>');
-    }
-    return h;
-  }
-  function renderWords(words) {
-    return words.map((w) => {
-      const t = fmt(w.text);
-      if (w.type === "del") return "<del>" + t + "</del>";
-      if (w.type === "add") return "<ins>" + t + "</ins>";
-      return t;
-    }).join("");
-  }
-  // Inline badge marking a moved line and where its partner lives.
-  function moveTag(dir, n) {
-    return ' <span class="movetag" title="This line was moved, not added or removed">↕ moved ' + dir + " line " + n + "</span>";
-  }
   function opts() {
     return {
       ignoreWhitespace: optWs.checked,
@@ -53,78 +33,20 @@
     };
   }
 
-  // 两个 span 之间不留字面空格——.num 用 flex gap 控距，字面空格会额外撑开一格。
-  function numCell(a, b) {
-    return '<div class="num"><span>' + (a == null ? "" : a) + '</span><span>' + (b == null ? "" : b) + "</span></div>";
-  }
-  function urow(cls, sign, aNum, bNum, inner, attrs) {
-    return '<div class="row ' + cls + '"' + (attrs || "") + '>' + numCell(aNum, bNum) + '<div class="sign">' + sign + '</div><div class="txt">' + inner + "</div></div>";
-  }
-  // pip 轨道消费的视图无关元数据，盖在每个 hunk 的首行上。轨道只读 dataset，
-  // 不读各视图的 DOM 细节（split 的类型类在子节点上，按 classList 读会拿不到）。
-  function hmeta(type, line) {
-    return ' data-htype="' + type + '" data-hline="' + (line == null ? "" : line) + '"';
-  }
-  // Single-column rows shared by Unified and Inline — the ONLY difference is how a
-  // CHANGE renders: Unified shows two rows (− old / + new); Inline shows one row with
-  // the original text and the edits marked in place (strike-through + insert).
-  // A collapsed band of unchanged lines — full-width, click to expand.
-  function foldRowHtml(r) {
-    return '<div class="row fold"><button class="foldbtn" type="button" data-fold="' + esc(r.key) +
-      '" title="Show the hidden lines">⋯ ' + r.count + " unchanged lines · expand ⋯</button></div>";
-  }
-  function renderColumn(out, inlineChange) {
-    const html = []; let prevImp = false;
-    for (const r of out.rows) {
-      if (r.type === "fold") { html.push(foldRowHtml(r)); prevImp = false; continue; }
-      const imp = r.type === "del" || r.type === "add" || r.type === "change";
-      const hs = imp && !prevImp ? " hstart" : "";
-      if (r.type === "equal") html.push(urow("equal", "", r.aNum, r.bNum, fmt(r.text)));
-      else if (r.type === "minor") html.push(urow("minor", "≈", r.aNum, r.bNum, renderWords(inlineChange ? r.words : r.bWords)));
-      else if (r.type === "del") html.push(urow("del" + hs + (r.moved ? " moved" : ""), "−", r.aNum, null, fmt(r.text) + (r.moved ? moveTag("to", r.movePartnerNum) : ""), hs ? hmeta("del", r.aNum) : ""));
-      else if (r.type === "add") html.push(urow("add" + hs + (r.moved ? " moved" : ""), "+", null, r.bNum, fmt(r.text) + (r.moved ? moveTag("from", r.movePartnerNum) : ""), hs ? hmeta("add", r.bNum) : ""));
-      else if (r.type === "change") {
-        if (inlineChange) {
-          html.push(urow("change" + hs, "~", r.aNum, r.bNum, renderWords(r.words), hs ? hmeta("change", r.aNum) : ""));
-        } else {
-          html.push(urow("change" + hs, "−", r.aNum, null, renderWords(r.aWords), hs ? hmeta("change", r.aNum) : ""));
-          html.push(urow("change", "+", null, r.bNum, renderWords(r.bWords)));
-        }
-      }
-      prevImp = imp;
-    }
-    return html.join("");
-  }
-  function renderUnified(out) { return renderColumn(out, false); }
-  function renderInline(out) { return renderColumn(out, true); }
-  function scol(cls, num, inner) {
-    return '<div class="scol ' + cls + '"><div class="snum">' + (num == null ? "" : num) + '</div><div class="stxt">' + inner + "</div></div>";
-  }
-  function renderSplit(out) {
-    const html = []; let prevImp = false;
-    for (const r of out.rows) {
-      if (r.type === "fold") { html.push(foldRowHtml(r)); prevImp = false; continue; }
-      const imp = r.type === "del" || r.type === "add" || r.type === "change";
-      const hs = imp && !prevImp ? " hstart" : "";
-      // 右栏必须带 class "b" —— .scol.b 是两栏之间的分隔竖线。
-      // （此前一直漏加，导致 app.css 的 .scol.b 规则从未生效、split 视图无分栏线。）
-      let left, right;
-      if (r.type === "equal") {
-        left = scol("equal", r.aNum, fmt(r.text)); right = scol("equal b", r.bNum, fmt(r.text));
-      } else if (r.type === "minor") {
-        left = scol("minor", r.aNum, renderWords(r.aWords)); right = scol("minor b", r.bNum, renderWords(r.bWords));
-      } else if (r.type === "del") {
-        left = scol("del" + (r.moved ? " moved" : ""), r.aNum, fmt(r.text) + (r.moved ? moveTag("to", r.movePartnerNum) : "")); right = scol("blank b", null, "");
-      } else if (r.type === "add") {
-        left = scol("blank", null, ""); right = scol("add b" + (r.moved ? " moved" : ""), r.bNum, fmt(r.text) + (r.moved ? moveTag("from", r.movePartnerNum) : ""));
-      } else { // change
-        left = scol("chg", r.aNum, renderWords(r.aWords)); right = scol("chg b", r.bNum, renderWords(r.bWords));
-      }
-      html.push('<div class="srow' + hs + '"' + (hs ? hmeta(r.type, r.type === "add" ? r.bNum : r.aNum) : "") + '>' + left + right + "</div>");
-      prevImp = imp;
-    }
-    return html.join("");
-  }
+  // --- module wiring (RULEBOOK R1: cross-module sharing passes only through this layer) ---
+  const R = window.DiffLensRender;
+  const nav = window.DiffLensNav({ result, pipRail, navPrev, navNext, navCount });
+  const exp = window.DiffLensExport({ ta, tb, stats, opts });
+  let historyList = [];
+  function persistHistory() { if (hasChrome) chrome.storage.local.set({ history: historyList }); }
+  const histUI = window.DiffLensHistUI({
+    ta, tb, stats,
+    histList: $("hist-list"), histSave: $("hist-save"), histMenu: $("history"),
+    esc: R.esc, hist: window.DiffLensHistory,
+    getHistoryList: () => historyList, setHistoryList: (l) => { historyList = l; },
+    persistHistory, flashBtn: exp.flashBtn, render, persist,
+  });
+  const fileUI = window.DiffLensFile({ ta, tb, stats, render, persist });
 
   // Error boundary: a pathological input must never leave the UI broken or throw
   // uncaught — show a friendly message and keep the tool usable.
@@ -133,9 +55,9 @@
       renderDiff();
     } catch (e) {
       result.innerHTML = '<div class="placeholder"><span class="big">Couldn’t compare this input' +
-        (e && e.message ? " (" + esc(String(e.message)) + ")" : "") + '.</span><span>Try smaller or simpler text.</span></div>';
+        (e && e.message ? " (" + R.esc(String(e.message)) + ")" : "") + '.</span><span>Try smaller or simpler text.</span></div>';
       stats.textContent = "Comparison error";
-      hunks = []; hunkIdx = -1; updateNav();
+      nav.reset();
     }
   }
   function renderDiff() {
@@ -146,7 +68,7 @@
       result.innerHTML = '<div class="placeholder"><span class="big">Type or paste text in both boxes to compare.</span>' +
         '<span>Nothing you paste here is uploaded — the comparison runs in this tab.</span></div>';
       stats.textContent = "Type or paste text in both boxes to compare.";
-      indexHunks();
+      nav.indexHunks();
       return;
     }
     const out = window.ClearDiff.compare(a, b, opts());
@@ -162,7 +84,9 @@
         }
         toRender = { rows: folded };
       }
-      result.innerHTML = view === "split" ? renderSplit(toRender) : view === "inline" ? renderInline(toRender) : renderUnified(toRender);
+      result.innerHTML = view === "split" ? R.renderSplit(toRender, { showWs })
+        : view === "inline" ? R.renderInline(toRender, { showWs })
+        : R.renderUnified(toRender, { showWs });
     }
     const minorTxt = out.stats.minor ? ' · <span class="minorc">≈' + out.stats.minor + " minor</span>" : "";
     const movedTxt = out.stats.moved ? ' · <span class="movedc">↕' + out.stats.moved + " moved</span>" : "";
@@ -171,167 +95,9 @@
       '<span class="add">+' + out.stats.added + " added</span> · " +
       '<span class="del">−' + out.stats.removed + " removed</span>" + minorTxt + movedTxt +
       " · A: " + out.stats.aLines + " lines, B: " + out.stats.bLines + " lines";
-    indexHunks();
+    nav.indexHunks();
   }
 
-  // --- difference navigation (BC-style next/prev) ---
-  function indexHunks() {
-    hunks = [].slice.call(result.querySelectorAll(".hstart"));
-    hunkIdx = -1;
-    updateNav();
-    renderPips();
-  }
-  function updateNav() {
-    if (!navPrev) return;
-    const n = hunks.length;
-    navPrev.disabled = n === 0; navNext.disabled = n === 0;
-    navCount.textContent = n === 0 ? "—" : (hunkIdx < 0 ? (n + (n === 1 ? " diff" : " diffs")) : (hunkIdx + 1) + " / " + n);
-    // 显隐挂在这里：hunks 状态的唯一汇聚点，错误态（render 边界置空 hunks）也会路过。
-    if (pipRail) pipRail.classList.toggle("hidden", n === 0);
-  }
-  // F-044 改动色标：轨道上每个 pip 对应一个 hunk，位置按文档相对高度铺排。
-  // 类型与行号读 hunk 首行的 data-htype/data-hline（视图无关），不碰用户文本。
-  function renderPips() {
-    if (!pipRail) return;
-    if (!hunks.length) { pipRail.innerHTML = ""; return; }
-    // 先把几何一次读完，再开始写 DOM——读写交错会让每次迭代都强制同步布局，
-    // 大 diff 下 wrap/resize 一次就是一串 reflow。
-    const total = result.scrollHeight || 1;
-    const tops = hunks.map((h) => ((h.offsetTop / total) * 100).toFixed(2) + "%");
-    // innerHTML 重建会销毁真实键盘焦点：记下焦点停在哪个 pip，重建后还给同一序号。
-    const ae = document.activeElement;
-    const focusIdx = ae && pipRail.contains(ae) && ae.dataset && ae.dataset.pip != null ? Number(ae.dataset.pip) : -1;
-    const NAME = { add: "added", del: "removed", change: "changed" };
-    const html = [];
-    for (let i = 0; i < hunks.length; i++) {
-      const type = hunks[i].dataset.htype || "change";
-      const line = hunks[i].dataset.hline || "";
-      const label = (NAME[type] || "changed") + (line ? " · line " + line : "");
-      html.push('<button type="button" class="pip ' + (NAME[type] ? type : "change") +
-        '" data-pip="' + i + '" title="' + label + '" aria-label="Jump to ' + label + '"></button>');
-    }
-    pipRail.innerHTML = html.join("");
-    const kids = pipRail.children;
-    for (let i = 0; i < kids.length; i++) {
-      // 几何是数据不是样式：仅 top 由 JS 写入，颜色与形态全部留在 app.css
-      //（specs 技术决策 1 对「禁内联 style」的显式豁免，范围仅此一个属性）。
-      kids[i].style.top = tops[i];
-    }
-    // 幂等复原当前态：任何原因重建轨道（wrap 切换、resize）后不丢 .current。
-    if (hunkIdx >= 0 && kids[hunkIdx]) kids[hunkIdx].classList.add("current");
-    if (focusIdx >= 0 && kids[focusIdx]) kids[focusIdx].focus({ preventScroll: true });
-  }
-  function jump(dir) {
-    if (!hunks.length) return;
-    if (hunkIdx < 0) hunkIdx = dir > 0 ? 0 : hunks.length - 1;
-    else hunkIdx = (hunkIdx + dir + hunks.length) % hunks.length;
-    hunks.forEach((h) => h.classList.remove("jumped"));
-    const el = hunks[hunkIdx];
-    el.classList.add("jumped");
-    el.scrollIntoView({ block: "center" });
-    if (pipRail) {
-      const ps = pipRail.children;
-      for (let i = 0; i < ps.length; i++) ps[i].classList.toggle("current", i === hunkIdx);
-    }
-    updateNav();
-  }
-
-  // Plain-text diff (the legacy "Copy result" format).
-  function plainDiffText() {
-    const out = window.ClearDiff.compare(ta.value, tb.value, opts());
-    return out.rows.map((r) => {
-      if (r.type === "equal") return "  " + r.text;
-      if (r.type === "minor") return "~ " + r.bText;
-      if (r.type === "del") return "- " + r.text;
-      if (r.type === "add") return "+ " + r.text;
-      if (r.type === "change") return "- " + r.aWords.map((w) => w.text).join("") + "\n+ " + r.bWords.map((w) => w.text).join("");
-      return "";
-    }).join("\n");
-  }
-
-  function flashBtn(btn, label) {
-    if (!btn) return;
-    const old = btn.textContent;
-    btn.textContent = label; setTimeout(() => (btn.textContent = old), 1200);
-  }
-  function closeExport() { const d = $("export"); if (d) d.open = false; }
-
-  function copyText(text, btn, okLabel) {
-    if (!text) return;
-    navigator.clipboard.writeText(text)
-      .then(() => flashBtn(btn, okLabel || "Copied ✓"))
-      .catch(() => flashBtn(btn, "Copy failed"));
-  }
-  function copyResult() {
-    if (ta.value === "" && tb.value === "") return;
-    copyText(plainDiffText(), $("copy"));
-    closeExport();
-  }
-  function copyUnified() {
-    const ud = window.ClearDiff.toUnifiedDiff(ta.value, tb.value, opts());
-    if (!ud) { stats.textContent = "Nothing to export — the two texts are identical."; closeExport(); return; }
-    copyText(ud, $("copy-diff")); closeExport();
-  }
-  function copyMarkdown() {
-    const md = window.ClearDiff.toMarkdown(ta.value, tb.value, opts());
-    if (!md) { stats.textContent = "Nothing to export — the two texts are identical."; closeExport(); return; }
-    copyText(md, $("copy-md")); closeExport();
-  }
-  // Download the unified diff as a .patch file — a local Blob, no network.
-  function downloadPatch() {
-    const ud = window.ClearDiff.toUnifiedDiff(ta.value, tb.value, opts());
-    if (!ud) { stats.textContent = "Nothing to export — the two texts are identical."; closeExport(); return; }
-    const blob = new Blob([ud], { type: "text/x-patch" });
-    const url = URL.createObjectURL(blob);
-    const a = document.createElement("a");
-    a.href = url; a.download = "difflens.patch";
-    document.body.appendChild(a); a.click(); a.remove();
-    setTimeout(() => URL.revokeObjectURL(url), 1000);
-    flashBtn($("dl-patch"), "Saved ✓"); closeExport();
-  }
-
-  // --- comparison history (saved snapshots, local only) ------------------------
-  const H = window.DiffLensHistory;
-  let historyList = [];
-  function persistHistory() { if (hasChrome) chrome.storage.local.set({ history: historyList }); }
-  function relTime(ts) {
-    const s = Math.max(0, (Date.now() - ts) / 1000);
-    if (s < 60) return "just now";
-    const m = Math.floor(s / 60); if (m < 60) return m + "m ago";
-    const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
-    return Math.floor(h / 24) + "d ago";
-  }
-  function renderHistList() {
-    const box = $("hist-list");
-    if (!box) return;
-    if (!historyList.length) { box.innerHTML = '<div class="hist-empty">No saved comparisons yet.</div>'; return; }
-    box.innerHTML = historyList.map((e) =>
-      '<div class="hist-item">' +
-        '<button class="hist-restore" type="button" data-restore="' + esc(e.id) + '" title="Restore this comparison">' +
-          '<span class="hist-prev">' + esc(e.preview) + "</span>" +
-          '<span class="hist-time">' + esc(relTime(e.ts)) + "</span>" +
-        "</button>" +
-        '<button class="hist-del" type="button" data-del="' + esc(e.id) + '" title="Delete" aria-label="Delete saved comparison">✕</button>' +
-      "</div>"
-    ).join("");
-  }
-  function saveCurrent() {
-    const a = ta.value, b = tb.value;
-    if (a === "" && b === "") { stats.textContent = "Nothing to save yet — paste or type some text first."; return; }
-    if (H.tooLarge(a, b)) { stats.textContent = "This comparison is too large to save to history."; return; }
-    const entry = { id: String(Date.now()) + "-" + Math.floor(Math.random() * 1e6), ts: Date.now(), a: a, b: b, preview: H.preview(a, b) };
-    historyList = H.add(historyList, entry);
-    persistHistory(); renderHistList();
-    flashBtn($("hist-save"), "Saved ✓");
-  }
-  function restoreHist(id) {
-    const e = historyList.find((x) => x.id === id);
-    if (!e) return;
-    ta.value = e.a; tb.value = e.b; render(); persist();
-    const d = $("history"); if (d) d.open = false;
-  }
-  function delHist(id) { historyList = H.remove(historyList, id); persistHistory(); renderHistList(); }
-
   let t;
   const schedule = () => { clearTimeout(t); t = setTimeout(render, 120); };
 
@@ -352,12 +118,12 @@
   linkScroll(tb, ta);
   [optWs, optCase, optBlank, optChar].forEach((el) => el.addEventListener("change", () => { render(); persistOpts(); }));
   // wrap 只切 class 不重 render，但换行改变每行 offsetTop —— pip 位置必须跟着重算。
-  optWrap.addEventListener("change", () => { result.classList.toggle("wrap", optWrap.checked); renderPips(); persistOpts(); });
+  optWrap.addEventListener("change", () => { result.classList.toggle("wrap", optWrap.checked); nav.renderPips(); persistOpts(); });
   if (optWsShow) optWsShow.addEventListener("change", () => { showWs = optWsShow.checked; render(); persistOpts(); });
   // 窗口宽度变化在 wrap 下同样改写几何。只重定位（renderPips），不重算 diff——
   // 与输入的 schedule() 防抖分开：resize 不该触发引擎重跑。
   let rt;
-  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(renderPips, 120); });
+  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(nav.renderPips, 120); });
   if (optFold) optFold.addEventListener("change", () => { fold = optFold.checked; render(); persistOpts(); });
   // Expand a collapsed band when its placeholder is clicked.
   result.addEventListener("click", (e) => {
@@ -369,11 +135,11 @@
   $("swap").addEventListener("click", () => {
     const tmp = ta.value; ta.value = tb.value; tb.value = tmp; render(); persist();
   });
-  $("copy").addEventListener("click", copyResult);
-  { const e = $("copy-diff"); if (e) e.addEventListener("click", copyUnified); }
-  { const e = $("copy-md"); if (e) e.addEventListener("click", copyMarkdown); }
-  { const e = $("dl-patch"); if (e) e.addEventListener("click", downloadPatch); }
-  { const e = $("hist-save"); if (e) e.addEventListener("click", saveCurrent); }
+  $("copy").addEventListener("click", exp.copyResult);
+  { const e = $("copy-diff"); if (e) e.addEventListener("click", exp.copyUnified); }
+  { const e = $("copy-md"); if (e) e.addEventListener("click", exp.copyMarkdown); }
+  { const e = $("dl-patch"); if (e) e.addEventListener("click", exp.downloadPatch); }
+  { const e = $("hist-save"); if (e) e.addEventListener("click", histUI.saveCurrent); }
   { const box = $("hist-list"); if (box) box.addEventListener("click", (e) => {
       const r = e.target.closest("[data-restore]");
       const d = e.target.closest("[data-del]");
@@ -382,15 +148,14 @@
       // below detaches the clicked node, which would make its contains() check fail
       // and spuriously close the menu. (Delete keeps the menu open to remove several.)
       e.stopPropagation();
-      if (r) restoreHist(r.dataset.restore);
-      else delHist(d.dataset.del);
+      if (r) histUI.restoreHist(r.dataset.restore);
+      else histUI.delHist(d.dataset.del);
     }); }
   // Clickable stats: clicking the +added / −removed / ≈minor counts jumps to the
   // first difference so the numbers double as navigation.
   stats.addEventListener("click", (e) => {
     if (!e.target.closest(".add, .del, .minorc")) return;
-    if (!hunks.length) return;
-    hunkIdx = -1; jump(1);
+    nav.jumpTo(0);
   });
   // Close any open dropdown menu on an outside click. (Clicking one summary lands
   // outside the other, so this also keeps them mutually exclusive.)
@@ -400,14 +165,13 @@
       if (d && d.open && !d.contains(e.target)) d.open = false;
     });
   });
-  if (navPrev) navPrev.addEventListener("click", () => jump(-1));
-  if (navNext) navNext.addEventListener("click", () => jump(1));
-  // pip 点击跳转：委托一个监听，复用 stats 点击的既有模式（hunkIdx = i-1 再 jump(1)）。
+  if (navPrev) navPrev.addEventListener("click", () => nav.jump(-1));
+  if (navNext) navNext.addEventListener("click", () => nav.jump(1));
+  // pip 点击跳转：委托一个监听，复用 stats 点击的既有模式（内部 hunkIdx = i-1 再 jump(1)）。
   if (pipRail) pipRail.addEventListener("click", (e) => {
     const p = e.target.closest("[data-pip]");
-    if (!p || !hunks.length) return;
-    hunkIdx = Number(p.dataset.pip) - 1;
-    jump(1);
+    if (!p) return;
+    nav.jumpTo(Number(p.dataset.pip));
   });
   document.addEventListener("keydown", (e) => {
     if (e.key === "Escape") {
@@ -416,8 +180,8 @@
       if (closed) return;
     }
     if (!e.altKey) return;
-    if (e.key === "ArrowDown") { e.preventDefault(); jump(1); }
-    else if (e.key === "ArrowUp") { e.preventDefault(); jump(-1); }
+    if (e.key === "ArrowDown") { e.preventDefault(); nav.jump(1); }
+    else if (e.key === "ArrowUp") { e.preventDefault(); nav.jump(-1); }
   });
   document.querySelectorAll("[data-view]").forEach((btn) => {
     btn.addEventListener("click", () => {
@@ -433,61 +197,25 @@
     });
   });
 
-  // --- local file loading (drag-drop or "open file…") — 100% local via FileReader ---
-  const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB: beyond this, load + render would lag
-  const paneEl = (which) => (which === "a" ? ta : tb);
-  function loadFile(file, which) {
-    if (!file) return;
-    if (file.size > MAX_FILE_BYTES) {
-      stats.textContent = "That file is too large (" + (file.size / 1048576).toFixed(1) +
-        " MB). DiffLens handles up to " + (MAX_FILE_BYTES / 1048576) + " MB locally.";
-      return;
-    }
-    const reader = new FileReader();
-    reader.onload = () => { paneEl(which).value = String(reader.result || ""); render(); persist(); };
-    reader.onerror = () => { stats.textContent = "Couldn’t read that file."; };
-    reader.readAsText(file);
-  }
+  // --- local file loading (drag-drop or "open file…") — wiring only; logic in ui-file ---
   document.querySelectorAll("[data-file]").forEach((btn) => {
     btn.addEventListener("click", () => { const inp = $("file-" + btn.dataset.file); if (inp) inp.click(); });
   });
   ["a", "b"].forEach((which) => {
     const inp = $("file-" + which);
-    if (inp) inp.addEventListener("change", (e) => { loadFile(e.target.files[0], which); inp.value = ""; });
-    const el = paneEl(which);
+    if (inp) inp.addEventListener("change", (e) => { fileUI.loadFile(e.target.files[0], which); inp.value = ""; });
+    const el = fileUI.paneEl(which);
     el.addEventListener("dragover", (e) => { e.preventDefault(); el.classList.add("dragover"); });
     el.addEventListener("dragleave", () => el.classList.remove("dragover"));
     el.addEventListener("drop", (e) => {
       e.preventDefault(); el.classList.remove("dragover");
       const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
-      if (f) loadFile(f, which);
+      if (f) fileUI.loadFile(f, which);
     });
   });
-
-  // --- "Format JSON": structural compare via parse → sort keys → pretty-print ---
-  // Sorting keys makes key-order differences vanish; pretty-printing makes whitespace/
-  // minification differences vanish — so two structurally-equal JSONs become identical.
-  // NOTE: uses native JSON, so integers beyond 2^53 may be reformatted with precision
-  // loss (both sides equally). Big-int-faithful mode is a future option (cf. JSON Keeper).
-  function sortKeys(v) {
-    if (Array.isArray(v)) return v.map(sortKeys);
-    if (v && typeof v === "object") {
-      const out = {};
-      for (const k of Object.keys(v).sort()) out[k] = sortKeys(v[k]);
-      return out;
-    }
-    return v;
-  }
-  function formatPane(which) {
-    const el = paneEl(which);
-    const raw = el.value.trim();
-    if (!raw) return false;
-    try { el.value = JSON.stringify(sortKeys(JSON.parse(raw)), null, 2); return true; }
-    catch { return false; }
-  }
   const fmtBtn = $("fmt-json");
   if (fmtBtn) fmtBtn.addEventListener("click", () => {
-    const a = formatPane("a"), b = formatPane("b");
+    const a = fileUI.formatPane("a"), b = fileUI.formatPane("b");
     render(); persist();
     if (!a && !b) stats.textContent = "No valid JSON to format on either side.";
     else if (!a || !b) stats.textContent = "Formatted the valid JSON side; the other isn’t valid JSON.";
@@ -506,7 +234,7 @@
     });
   }
   function boot() {
-    if (!hasChrome) { render(); renderHistList(); return; }
+    if (!hasChrome) { render(); histUI.renderHistList(); return; }
     chrome.storage.local.get(
       ["textA", "textB", "ignoreWhitespace", "ignoreCase", "ignoreBlankLines", "charLevel", "showWhitespace", "wordWrap", "view", "foldUnchanged", "history"],
       (s) => {
@@ -526,7 +254,7 @@
         if (Array.isArray(s.history)) historyList = s.history;
         if (chrome.action && chrome.action.setBadgeText) chrome.action.setBadgeText({ text: "" });
         render();
-        renderHistList();
+        histUI.renderHistList();
       }
     );
     chrome.storage.onChanged.addListener((changes, area) => {
diff --git a/compare.html b/compare.html
index aaf3287..edf5a14 100644
--- a/compare.html
+++ b/compare.html
@@ -115,6 +115,11 @@
 
   <script src="diff.js"></script>
   <script src="history.js"></script>
+  <script src="ui-render.js"></script>
+  <script src="ui-nav.js"></script>
+  <script src="ui-export.js"></script>
+  <script src="ui-history.js"></script>
+  <script src="ui-file.js"></script>
   <script src="app.js"></script>
 </body>
 </html>
diff --git a/package.mjs b/package.mjs
index 3ab6535..f0f3bc2 100644
--- a/package.mjs
+++ b/package.mjs
@@ -33,6 +33,11 @@ const PAYLOAD = [
   "app.js",
   "diff.js",
   "history.js",
+  "ui-render.js",
+  "ui-nav.js",
+  "ui-export.js",
+  "ui-history.js",
+  "ui-file.js",
   "icons/icon-16.png",
   "icons/icon-32.png",
   "icons/icon-48.png",

codex
已经看到编排层大范围替换点。现在读五个 `ui-*` 模块本体，重点核对：导出形态是否和 `app.js` 实际接线一致、是否偷偷改了逻辑、以及是否踩了 R1/R3/R4。
exec
/bin/zsh -lc "sed -n '1,260p' ui-nav.js" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
// DiffLensNav — hunk 索引/上下跳转/pip 轨道（自 app.js 原样迁出）。No network calls.
// 有状态模块：拥有 hunks/hunkIdx；DOM 引用经 init(ctx) 注入（RULEBOOK R1）。
// 事件绑定一律留在 app.js（R6）——本模块只暴露被绑定/被编排调用的函数。
// 与 ui-render 的唯一接口是 hunk 首行的 data-htype/data-hline dataset（R4），
// 轨道只读 dataset，不读各视图的 DOM 细节。
(function (root) {
  "use strict";

  // ctx: { result, pipRail, navPrev, navNext, navCount } —— 均为 app.js 顶部缓存的元素引用。
  // navPrev/pipRail 可能为 null（页面变体没有该控件），各函数保留原有的存在性守卫。
  function init(ctx) {
    const result = ctx.result;
    const pipRail = ctx.pipRail;
    const navPrev = ctx.navPrev, navNext = ctx.navNext, navCount = ctx.navCount;
    let hunks = [], hunkIdx = -1;

    // --- difference navigation (BC-style next/prev) ---
    function indexHunks() {
      hunks = [].slice.call(result.querySelectorAll(".hstart"));
      hunkIdx = -1;
      updateNav();
      renderPips();
    }
    function updateNav() {
      if (!navPrev) return;
      const n = hunks.length;
      navPrev.disabled = n === 0; navNext.disabled = n === 0;
      navCount.textContent = n === 0 ? "—" : (hunkIdx < 0 ? (n + (n === 1 ? " diff" : " diffs")) : (hunkIdx + 1) + " / " + n);
      // 显隐挂在这里：hunks 状态的唯一汇聚点，错误态（render 边界置空 hunks）也会路过。
      if (pipRail) pipRail.classList.toggle("hidden", n === 0);
    }
    // F-044 改动色标：轨道上每个 pip 对应一个 hunk，位置按文档相对高度铺排。
    // 类型与行号读 hunk 首行的 data-htype/data-hline（视图无关），不碰用户文本。
    function renderPips() {
      if (!pipRail) return;
      if (!hunks.length) { pipRail.innerHTML = ""; return; }
      // 先把几何一次读完，再开始写 DOM——读写交错会让每次迭代都强制同步布局，
      // 大 diff 下 wrap/resize 一次就是一串 reflow。
      const total = result.scrollHeight || 1;
      const tops = hunks.map((h) => ((h.offsetTop / total) * 100).toFixed(2) + "%");
      // innerHTML 重建会销毁真实键盘焦点：记下焦点停在哪个 pip，重建后还给同一序号。
      const ae = document.activeElement;
      const focusIdx = ae && pipRail.contains(ae) && ae.dataset && ae.dataset.pip != null ? Number(ae.dataset.pip) : -1;
      const NAME = { add: "added", del: "removed", change: "changed" };
      const html = [];
      for (let i = 0; i < hunks.length; i++) {
        const type = hunks[i].dataset.htype || "change";
        const line = hunks[i].dataset.hline || "";
        const label = (NAME[type] || "changed") + (line ? " · line " + line : "");
        html.push('<button type="button" class="pip ' + (NAME[type] ? type : "change") +
          '" data-pip="' + i + '" title="' + label + '" aria-label="Jump to ' + label + '"></button>');
      }
      pipRail.innerHTML = html.join("");
      const kids = pipRail.children;
      for (let i = 0; i < kids.length; i++) {
        // 几何是数据不是样式：仅 top 由 JS 写入，颜色与形态全部留在 app.css
        //（specs 技术决策 1 对「禁内联 style」的显式豁免，范围仅此一个属性）。
        kids[i].style.top = tops[i];
      }
      // 幂等复原当前态：任何原因重建轨道（wrap 切换、resize）后不丢 .current。
      if (hunkIdx >= 0 && kids[hunkIdx]) kids[hunkIdx].classList.add("current");
      if (focusIdx >= 0 && kids[focusIdx]) kids[focusIdx].focus({ preventScroll: true });
    }
    function jump(dir) {
      if (!hunks.length) return;
      if (hunkIdx < 0) hunkIdx = dir > 0 ? 0 : hunks.length - 1;
      else hunkIdx = (hunkIdx + dir + hunks.length) % hunks.length;
      hunks.forEach((h) => h.classList.remove("jumped"));
      const el = hunks[hunkIdx];
      el.classList.add("jumped");
      el.scrollIntoView({ block: "center" });
      if (pipRail) {
        const ps = pipRail.children;
        for (let i = 0; i < ps.length; i++) ps[i].classList.toggle("current", i === hunkIdx);
      }
      updateNav();
    }

    // 状态归本模块后，app.js 里两处直接改 hunks/hunkIdx 的编排代码需要入口——
    // 以下两个薄封装逐语句对应原调用点，不引入新行为：
    // reset()：render() 错误边界的「hunks=[]; hunkIdx=-1; updateNav();」三连。
    // 注意错误态只 updateNav 不 renderPips（隐藏轨道但不清空其 DOM），保持原语义。
    function reset() {
      hunks = []; hunkIdx = -1; updateNav();
    }
    // jumpTo(i)：stats/pip 点击的既有模式「hunkIdx = i - 1 再 jump(1)」。
    // stats 点击等价于 jumpTo(0)；pip 点击传 Number(p.dataset.pip)。
    // !hunks.length 守卫从原绑定处内移，空态下同样不发生任何状态变更。
    function jumpTo(i) {
      if (!hunks.length) return;
      hunkIdx = i - 1;
      jump(1);
    }

    // 导出面=实际消费面（RULEBOOK §1 v2 先例）：updateNav 仅被模块内部调用，保持私有。
    return { indexHunks, renderPips, jump, jumpTo, reset };
  }

  root.DiffLensNav = init;
})(typeof window !== "undefined" ? window : globalThis);
// REFACTOR STATUS: confidence=high todos=0

exec
/bin/zsh -lc "sed -n '1,260p' ui-render.js" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
// DiffLens render module — pure HTML string builders for the three diff views. No DOM reads,
// no chrome.*, no network, no state: callers pass an options bag ({ showWs }) explicitly.
(function (root) {
  "use strict";

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  // Escape + (optionally) reveal whitespace as faint glyphs — BC-style.
  function fmt(s, showWs) {
    let h = esc(s);
    if (showWs) {
      h = h.replace(/\t/g, '<span class="ws">→</span>').replace(/ /g, '<span class="ws">·</span>');
    }
    return h;
  }
  function renderWords(words, showWs) {
    return words.map((w) => {
      const t = fmt(w.text, showWs);
      if (w.type === "del") return "<del>" + t + "</del>";
      if (w.type === "add") return "<ins>" + t + "</ins>";
      return t;
    }).join("");
  }
  // Inline badge marking a moved line and where its partner lives.
  function moveTag(dir, n) {
    return ' <span class="movetag" title="This line was moved, not added or removed">↕ moved ' + dir + " line " + n + "</span>";
  }

  // 两个 span 之间不留字面空格——.num 用 flex gap 控距，字面空格会额外撑开一格。
  function numCell(a, b) {
    return '<div class="num"><span>' + (a == null ? "" : a) + '</span><span>' + (b == null ? "" : b) + "</span></div>";
  }
  function urow(cls, sign, aNum, bNum, inner, attrs) {
    return '<div class="row ' + cls + '"' + (attrs || "") + '>' + numCell(aNum, bNum) + '<div class="sign">' + sign + '</div><div class="txt">' + inner + "</div></div>";
  }
  // pip 轨道消费的视图无关元数据，盖在每个 hunk 的首行上。轨道只读 dataset，
  // 不读各视图的 DOM 细节（split 的类型类在子节点上，按 classList 读会拿不到）。
  function hmeta(type, line) {
    return ' data-htype="' + type + '" data-hline="' + (line == null ? "" : line) + '"';
  }
  // Single-column rows shared by Unified and Inline — the ONLY difference is how a
  // CHANGE renders: Unified shows two rows (− old / + new); Inline shows one row with
  // the original text and the edits marked in place (strike-through + insert).
  // A collapsed band of unchanged lines — full-width, click to expand.
  function foldRowHtml(r) {
    return '<div class="row fold"><button class="foldbtn" type="button" data-fold="' + esc(r.key) +
      '" title="Show the hidden lines">⋯ ' + r.count + " unchanged lines · expand ⋯</button></div>";
  }
  function renderColumn(out, inlineChange, showWs) {
    const html = []; let prevImp = false;
    for (const r of out.rows) {
      if (r.type === "fold") { html.push(foldRowHtml(r)); prevImp = false; continue; }
      const imp = r.type === "del" || r.type === "add" || r.type === "change";
      const hs = imp && !prevImp ? " hstart" : "";
      if (r.type === "equal") html.push(urow("equal", "", r.aNum, r.bNum, fmt(r.text, showWs)));
      else if (r.type === "minor") html.push(urow("minor", "≈", r.aNum, r.bNum, renderWords(inlineChange ? r.words : r.bWords, showWs)));
      else if (r.type === "del") html.push(urow("del" + hs + (r.moved ? " moved" : ""), "−", r.aNum, null, fmt(r.text, showWs) + (r.moved ? moveTag("to", r.movePartnerNum) : ""), hs ? hmeta("del", r.aNum) : ""));
      else if (r.type === "add") html.push(urow("add" + hs + (r.moved ? " moved" : ""), "+", null, r.bNum, fmt(r.text, showWs) + (r.moved ? moveTag("from", r.movePartnerNum) : ""), hs ? hmeta("add", r.bNum) : ""));
      else if (r.type === "change") {
        if (inlineChange) {
          html.push(urow("change" + hs, "~", r.aNum, r.bNum, renderWords(r.words, showWs), hs ? hmeta("change", r.aNum) : ""));
        } else {
          html.push(urow("change" + hs, "−", r.aNum, null, renderWords(r.aWords, showWs), hs ? hmeta("change", r.aNum) : ""));
          html.push(urow("change", "+", null, r.bNum, renderWords(r.bWords, showWs)));
        }
      }
      prevImp = imp;
    }
    return html.join("");
  }
  function renderUnified(out, opts) { return renderColumn(out, false, !!(opts && opts.showWs)); }
  function renderInline(out, opts) { return renderColumn(out, true, !!(opts && opts.showWs)); }
  function scol(cls, num, inner) {
    return '<div class="scol ' + cls + '"><div class="snum">' + (num == null ? "" : num) + '</div><div class="stxt">' + inner + "</div></div>";
  }
  function renderSplit(out, opts) {
    const showWs = !!(opts && opts.showWs);
    const html = []; let prevImp = false;
    for (const r of out.rows) {
      if (r.type === "fold") { html.push(foldRowHtml(r)); prevImp = false; continue; }
      const imp = r.type === "del" || r.type === "add" || r.type === "change";
      const hs = imp && !prevImp ? " hstart" : "";
      // 右栏必须带 class "b" —— .scol.b 是两栏之间的分隔竖线。
      // （此前一直漏加，导致 app.css 的 .scol.b 规则从未生效、split 视图无分栏线。）
      let left, right;
      if (r.type === "equal") {
        left = scol("equal", r.aNum, fmt(r.text, showWs)); right = scol("equal b", r.bNum, fmt(r.text, showWs));
      } else if (r.type === "minor") {
        left = scol("minor", r.aNum, renderWords(r.aWords, showWs)); right = scol("minor b", r.bNum, renderWords(r.bWords, showWs));
      } else if (r.type === "del") {
        left = scol("del" + (r.moved ? " moved" : ""), r.aNum, fmt(r.text, showWs) + (r.moved ? moveTag("to", r.movePartnerNum) : "")); right = scol("blank b", null, "");
      } else if (r.type === "add") {
        left = scol("blank", null, ""); right = scol("add b" + (r.moved ? " moved" : ""), r.bNum, fmt(r.text, showWs) + (r.moved ? moveTag("from", r.movePartnerNum) : ""));
      } else { // change
        left = scol("chg", r.aNum, renderWords(r.aWords, showWs)); right = scol("chg b", r.bNum, renderWords(r.bWords, showWs));
      }
      html.push('<div class="srow' + hs + '"' + (hs ? hmeta(r.type, r.type === "add" ? r.bNum : r.aNum) : "") + '>' + left + right + "</div>");
      prevImp = imp;
    }
    return html.join("");
  }

  // 导出面 = 实际消费面（RULEBOOK §1）：esc 供 app.js 的错误边界与历史列表复用，
  // 三个渲染入口收 { showWs } options bag；其余 9 个助手为模块私有。
  root.DiffLensRender = { esc, renderUnified, renderInline, renderSplit };
})(typeof window !== "undefined" ? window : globalThis);
// REFACTOR STATUS: confidence=high todos=0

exec
/bin/zsh -lc "sed -n '1,260p' ui-export.js" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
// DiffLens export module — copy/download the current comparison (plain text, unified
// diff, Markdown, .patch). All local: clipboard + Blob URL, no network — and no chrome.*
// here (RULEBOOK R3: storage/badge are the orchestration layer's job, app.js only).
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // Factory form (RULEBOOK R1): app.js calls DiffLensExport(ctx) once at boot and binds
  // the returned functions itself (R6 — no event listeners in this module).
  // ctx = { ta, tb, stats, opts }: pane/status DOM refs plus the options reader; shared
  // references arrive only via ctx, never by reaching into sibling ui modules.
  window.DiffLensExport = function (ctx) {
    const ta = ctx.ta, tb = ctx.tb, stats = ctx.stats, opts = ctx.opts;

    // Plain-text diff (the legacy "Copy result" format).
    function plainDiffText() {
      const out = window.ClearDiff.compare(ta.value, tb.value, opts());
      return out.rows.map((r) => {
        if (r.type === "equal") return "  " + r.text;
        if (r.type === "minor") return "~ " + r.bText;
        if (r.type === "del") return "- " + r.text;
        if (r.type === "add") return "+ " + r.text;
        if (r.type === "change") return "- " + r.aWords.map((w) => w.text).join("") + "\n+ " + r.bWords.map((w) => w.text).join("");
        return "";
      }).join("\n");
    }

    function flashBtn(btn, label) {
      if (!btn) return;
      const old = btn.textContent;
      btn.textContent = label; setTimeout(() => (btn.textContent = old), 1200);
    }
    function closeExport() { const d = $("export"); if (d) d.open = false; }

    function copyText(text, btn, okLabel) {
      if (!text) return;
      navigator.clipboard.writeText(text)
        .then(() => flashBtn(btn, okLabel || "Copied ✓"))
        .catch(() => flashBtn(btn, "Copy failed"));
    }
    function copyResult() {
      if (ta.value === "" && tb.value === "") return;
      copyText(plainDiffText(), $("copy"));
      closeExport();
    }
    function copyUnified() {
      const ud = window.ClearDiff.toUnifiedDiff(ta.value, tb.value, opts());
      if (!ud) { stats.textContent = "Nothing to export — the two texts are identical."; closeExport(); return; }
      copyText(ud, $("copy-diff")); closeExport();
    }
    function copyMarkdown() {
      const md = window.ClearDiff.toMarkdown(ta.value, tb.value, opts());
      if (!md) { stats.textContent = "Nothing to export — the two texts are identical."; closeExport(); return; }
      copyText(md, $("copy-md")); closeExport();
    }
    // Download the unified diff as a .patch file — a local Blob, no network.
    function downloadPatch() {
      const ud = window.ClearDiff.toUnifiedDiff(ta.value, tb.value, opts());
      if (!ud) { stats.textContent = "Nothing to export — the two texts are identical."; closeExport(); return; }
      const blob = new Blob([ud], { type: "text/x-patch" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "difflens.patch";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      flashBtn($("dl-patch"), "Saved ✓"); closeExport();
    }

    return { plainDiffText, flashBtn, closeExport, copyText, copyResult, copyUnified, copyMarkdown, downloadPatch };
  };
})();
// REFACTOR STATUS: confidence=high todos=0

exec
/bin/zsh -lc "sed -n '1,260p' ui-file.js" in /Users/zero/MyCode/diff-lens
exec
/bin/zsh -lc "sed -n '1,260p' ui-history.js" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
// DiffLens file-loading + JSON-format module — 100% local (FileReader / native JSON), no network.
// RULEBOOK §1/R1: 无状态；面板(ta/tb)/状态栏(stats)引用与 render/persist 回调全部经 init(ctx)
// 注入，模块自身零 DOM 查询、零 chrome.*（R3）——事件绑定仍归 app.js（R6）。
(function (root) {
  "use strict";

  // --- local file loading (drag-drop or "open file…") — 100% local via FileReader ---
  const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB: beyond this, load + render would lag

  function init(ctx) {
    const paneEl = (which) => (which === "a" ? ctx.ta : ctx.tb);
    function loadFile(file, which) {
      if (!file) return;
      if (file.size > MAX_FILE_BYTES) {
        ctx.stats.textContent = "That file is too large (" + (file.size / 1048576).toFixed(1) +
          " MB). DiffLens handles up to " + (MAX_FILE_BYTES / 1048576) + " MB locally.";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => { paneEl(which).value = String(reader.result || ""); ctx.render(); ctx.persist(); };
      reader.onerror = () => { ctx.stats.textContent = "Couldn’t read that file."; };
      reader.readAsText(file);
    }

    // --- "Format JSON": structural compare via parse → sort keys → pretty-print ---
    // Sorting keys makes key-order differences vanish; pretty-printing makes whitespace/
    // minification differences vanish — so two structurally-equal JSONs become identical.
    // NOTE: uses native JSON, so integers beyond 2^53 may be reformatted with precision
    // loss (both sides equally). Big-int-faithful mode is a future option (cf. JSON Keeper).
    function sortKeys(v) {
      if (Array.isArray(v)) return v.map(sortKeys);
      if (v && typeof v === "object") {
        const out = {};
        for (const k of Object.keys(v).sort()) out[k] = sortKeys(v[k]);
        return out;
      }
      return v;
    }
    function formatPane(which) {
      const el = paneEl(which);
      const raw = el.value.trim();
      if (!raw) return false;
      try { el.value = JSON.stringify(sortKeys(JSON.parse(raw)), null, 2); return true; }
      catch { return false; }
    }

    // 导出面=实际消费面（§1 v2 原则外推）：app.js 只消费 loadFile/paneEl/formatPane，
    // sortKeys 仅被 formatPane 内部调用，保持私有。
    return { loadFile, paneEl, formatPane };
  }

  root.DiffLensFile = init;
})(typeof window !== "undefined" ? window : globalThis);
// REFACTOR STATUS: confidence=high todos=0

 succeeded in 0ms:
// DiffLens history UI — saved-comparisons list rendering + save/restore/delete actions.
// No network, no dependencies, and no chrome.* (storage writes stay in app.js, R3);
// list state (historyList) lives in app.js and is reached only through ctx accessors.
(function (root) {
  "use strict";

  // ctx contract (everything is injected by app.js — modules never reference each
  // other directly, R1):
  //   ta, tb                          — the two input <textarea>s
  //   stats                           — status-bar element for user-facing messages
  //   histList                        — #hist-list container the list renders into
  //   histSave                        — #hist-save button (flash target after saving)
  //   histMenu                        — #history <details> dropdown (closed on restore)
  //   esc                             — HTML escaper, forwarded from DiffLensRender
  //   hist                            — pure list helpers, forwarded from
  //                                     DiffLensHistory (preview/tooLarge/add/remove)
  //   getHistoryList, setHistoryList  — historyList stays owned by app.js (§1)
  //   persistHistory                  — chrome.storage write, kept in app.js (R3)
  //   flashBtn                        — button feedback helper, forwarded from ui-export
  //   render, persist                 — orchestration entry points (restore re-renders)
  function init(ctx) {
    const ta = ctx.ta, tb = ctx.tb, stats = ctx.stats;
    const histList = ctx.histList, histSave = ctx.histSave, histMenu = ctx.histMenu;
    const esc = ctx.esc, H = ctx.hist;

    function relTime(ts) {
      const s = Math.max(0, (Date.now() - ts) / 1000);
      if (s < 60) return "just now";
      const m = Math.floor(s / 60); if (m < 60) return m + "m ago";
      const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
      return Math.floor(h / 24) + "d ago";
    }
    function renderHistList() {
      const box = histList;
      if (!box) return;
      const list = ctx.getHistoryList();
      if (!list.length) { box.innerHTML = '<div class="hist-empty">No saved comparisons yet.</div>'; return; }
      box.innerHTML = list.map((e) =>
        '<div class="hist-item">' +
          '<button class="hist-restore" type="button" data-restore="' + esc(e.id) + '" title="Restore this comparison">' +
            '<span class="hist-prev">' + esc(e.preview) + "</span>" +
            '<span class="hist-time">' + esc(relTime(e.ts)) + "</span>" +
          "</button>" +
          '<button class="hist-del" type="button" data-del="' + esc(e.id) + '" title="Delete" aria-label="Delete saved comparison">✕</button>' +
        "</div>"
      ).join("");
    }
    function saveCurrent() {
      const a = ta.value, b = tb.value;
      if (a === "" && b === "") { stats.textContent = "Nothing to save yet — paste or type some text first."; return; }
      if (H.tooLarge(a, b)) { stats.textContent = "This comparison is too large to save to history."; return; }
      const entry = { id: String(Date.now()) + "-" + Math.floor(Math.random() * 1e6), ts: Date.now(), a: a, b: b, preview: H.preview(a, b) };
      ctx.setHistoryList(H.add(ctx.getHistoryList(), entry));
      ctx.persistHistory(); renderHistList();
      ctx.flashBtn(histSave, "Saved ✓");
    }
    function restoreHist(id) {
      const e = ctx.getHistoryList().find((x) => x.id === id);
      if (!e) return;
      ta.value = e.a; tb.value = e.b; ctx.render(); ctx.persist();
      if (histMenu) histMenu.open = false;
    }
    function delHist(id) {
      ctx.setHistoryList(H.remove(ctx.getHistoryList(), id));
      ctx.persistHistory(); renderHistList();
    }

    // Export face = actual consumption face: app.js binds these four (R6). relTime
    // is only consumed by renderHistList, so it stays private.
    return { renderHistList: renderHistList, saveCurrent: saveCurrent, restoreHist: restoreHist, delHist: delHist };
  }

  // R1 (v2): factory form for stateful/DOM-holding UI modules. Deliberately NOT
  // DiffLensHistory — that global is already taken by the pure helpers in history.js.
  root.DiffLensHistUI = init;
})(typeof window !== "undefined" ? window : globalThis);
// REFACTOR STATUS: confidence=high todos=0

codex
模块本体基本符合拆分意图，但还需要从“失败场景”角度反证：我会查接线遗漏、搜索 `chrome`/跨模块直连/`data-h*` 契约，并核对 `package.mjs` 是否还有其他清单或打包逻辑遗漏。
exec
/bin/zsh -lc "sed -n '1,220p' package.mjs" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
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
  "ui-render.js",
  "ui-nav.js",
  "ui-export.js",
  "ui-history.js",
  "ui-file.js",
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

exec
/bin/zsh -lc "rg -n \"chrome\\.|DiffLens(Render|Nav|Export|HistUI|File)|data-htype|data-hline|historyList|flashBtn|renderPips|indexHunks|jump\\(|jumpTo\\(|paneEl|formatPane|loadFile\" app.js ui-*.js compare.html package.mjs" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
ui-render.js:2:// no chrome.*, no network, no state: callers pass an options bag ({ showWs }) explicitly.
ui-render.js:40:    return ' data-htype="' + type + '" data-hline="' + (line == null ? "" : line) + '"';
ui-render.js:106:  root.DiffLensRender = { esc, renderUnified, renderInline, renderSplit };
ui-history.js:2:// No network, no dependencies, and no chrome.* (storage writes stay in app.js, R3);
ui-history.js:3:// list state (historyList) lives in app.js and is reached only through ctx accessors.
ui-history.js:14:  //   esc                             — HTML escaper, forwarded from DiffLensRender
ui-history.js:17:  //   getHistoryList, setHistoryList  — historyList stays owned by app.js (§1)
ui-history.js:18:  //   persistHistory                  — chrome.storage write, kept in app.js (R3)
ui-history.js:19:  //   flashBtn                        — button feedback helper, forwarded from ui-export
ui-history.js:55:      ctx.flashBtn(histSave, "Saved ✓");
ui-history.js:75:  root.DiffLensHistUI = init;
ui-file.js:3:// 注入，模块自身零 DOM 查询、零 chrome.*（R3）——事件绑定仍归 app.js（R6）。
ui-file.js:11:    const paneEl = (which) => (which === "a" ? ctx.ta : ctx.tb);
ui-file.js:12:    function loadFile(file, which) {
ui-file.js:20:      reader.onload = () => { paneEl(which).value = String(reader.result || ""); ctx.render(); ctx.persist(); };
ui-file.js:39:    function formatPane(which) {
ui-file.js:40:      const el = paneEl(which);
ui-file.js:47:    // 导出面=实际消费面（§1 v2 原则外推）：app.js 只消费 loadFile/paneEl/formatPane，
ui-file.js:48:    // sortKeys 仅被 formatPane 内部调用，保持私有。
ui-file.js:49:    return { loadFile, paneEl, formatPane };
ui-file.js:52:  root.DiffLensFile = init;
ui-nav.js:1:// DiffLensNav — hunk 索引/上下跳转/pip 轨道（自 app.js 原样迁出）。No network calls.
ui-nav.js:4:// 与 ui-render 的唯一接口是 hunk 首行的 data-htype/data-hline dataset（R4），
ui-nav.js:18:    function indexHunks() {
ui-nav.js:22:      renderPips();
ui-nav.js:33:    // 类型与行号读 hunk 首行的 data-htype/data-hline（视图无关），不碰用户文本。
ui-nav.js:34:    function renderPips() {
ui-nav.js:64:    function jump(dir) {
ui-nav.js:82:    // 注意错误态只 updateNav 不 renderPips（隐藏轨道但不清空其 DOM），保持原语义。
ui-nav.js:86:    // jumpTo(i)：stats/pip 点击的既有模式「hunkIdx = i - 1 再 jump(1)」。
ui-nav.js:87:    // stats 点击等价于 jumpTo(0)；pip 点击传 Number(p.dataset.pip)。
ui-nav.js:89:    function jumpTo(i) {
ui-nav.js:92:      jump(1);
ui-nav.js:96:    return { indexHunks, renderPips, jump, jumpTo, reset };
ui-nav.js:99:  root.DiffLensNav = init;
ui-export.js:2:// diff, Markdown, .patch). All local: clipboard + Blob URL, no network — and no chrome.*
ui-export.js:8:  // Factory form (RULEBOOK R1): app.js calls DiffLensExport(ctx) once at boot and binds
ui-export.js:12:  window.DiffLensExport = function (ctx) {
ui-export.js:28:    function flashBtn(btn, label) {
ui-export.js:38:        .then(() => flashBtn(btn, okLabel || "Copied ✓"))
ui-export.js:39:        .catch(() => flashBtn(btn, "Copy failed"));
ui-export.js:66:      flashBtn($("dl-patch"), "Saved ✓"); closeExport();
ui-export.js:69:    return { plainDiffText, flashBtn, closeExport, copyText, copyResult, copyUnified, copyMarkdown, downloadPatch };
app.js:25:  const hasChrome = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;
app.js:37:  const R = window.DiffLensRender;
app.js:38:  const nav = window.DiffLensNav({ result, pipRail, navPrev, navNext, navCount });
app.js:39:  const exp = window.DiffLensExport({ ta, tb, stats, opts });
app.js:40:  let historyList = [];
app.js:41:  function persistHistory() { if (hasChrome) chrome.storage.local.set({ history: historyList }); }
app.js:42:  const histUI = window.DiffLensHistUI({
app.js:46:    getHistoryList: () => historyList, setHistoryList: (l) => { historyList = l; },
app.js:47:    persistHistory, flashBtn: exp.flashBtn, render, persist,
app.js:49:  const fileUI = window.DiffLensFile({ ta, tb, stats, render, persist });
app.js:71:      nav.indexHunks();
app.js:98:    nav.indexHunks();
app.js:121:  optWrap.addEventListener("change", () => { result.classList.toggle("wrap", optWrap.checked); nav.renderPips(); persistOpts(); });
app.js:123:  // 窗口宽度变化在 wrap 下同样改写几何。只重定位（renderPips），不重算 diff——
app.js:126:  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(nav.renderPips, 120); });
app.js:158:    nav.jumpTo(0);
app.js:168:  if (navPrev) navPrev.addEventListener("click", () => nav.jump(-1));
app.js:169:  if (navNext) navNext.addEventListener("click", () => nav.jump(1));
app.js:170:  // pip 点击跳转：委托一个监听，复用 stats 点击的既有模式（内部 hunkIdx = i-1 再 jump(1)）。
app.js:174:    nav.jumpTo(Number(p.dataset.pip));
app.js:183:    if (e.key === "ArrowDown") { e.preventDefault(); nav.jump(1); }
app.js:184:    else if (e.key === "ArrowUp") { e.preventDefault(); nav.jump(-1); }
app.js:206:    if (inp) inp.addEventListener("change", (e) => { fileUI.loadFile(e.target.files[0], which); inp.value = ""; });
app.js:207:    const el = fileUI.paneEl(which);
app.js:213:      if (f) fileUI.loadFile(f, which);
app.js:218:    const a = fileUI.formatPane("a"), b = fileUI.formatPane("b");
app.js:226:    if (hasChrome) chrome.storage.local.set({ textA: ta.value, textB: tb.value });
app.js:229:    if (hasChrome) chrome.storage.local.set({
app.js:238:    chrome.storage.local.get(
app.js:254:        if (Array.isArray(s.history)) historyList = s.history;
app.js:255:        if (chrome.action && chrome.action.setBadgeText) chrome.action.setBadgeText({ text: "" });
app.js:260:    chrome.storage.onChanged.addListener((changes, area) => {

exec
/bin/zsh -lc "git show HEAD:app.js | sed -n '1,260p'" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-7Puk5hDm' (errno=Operation not permitted)
git: warning: confstr() failed with code 5: couldn't get path of DARWIN_USER_TEMP_DIR; using /tmp instead
git: error: couldn't create cache file '/tmp/xcrun_db-NdIYZFoa' (errno=Operation not permitted)
// ClearDiff popup/page — wires UI to the local diff engine. No network calls.
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const ta = $("text-a"), tb = $("text-b");
  const optWs = $("opt-ws"), optCase = $("opt-case"), optWrap = $("opt-wrap");
  const optBlank = $("opt-blank"), optChar = $("opt-char"), optWsShow = $("opt-ws-show");
  const optFold = $("opt-fold");
  const result = $("result"), stats = $("stats");
  const navPrev = $("nav-prev"), navNext = $("nav-next"), navCount = $("nav-count");
  const pipRail = $("pip-rail");
  let view = "unified";
  let showWs = false;
  let fold = false;
  let hunks = [], hunkIdx = -1;
  // Which collapsed bands the user has manually expanded; keyed by stable fold key.
  // Cleared whenever the compared text changes (keys would no longer match).
  const FOLD_CONTEXT = 3;
  let expandedFolds = new Set();
  let lastA = null, lastB = null;

  const hasChrome = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  // Escape + (optionally) reveal whitespace as faint glyphs — BC-style.
  function fmt(s) {
    let h = esc(s);
    if (showWs) {
      h = h.replace(/\t/g, '<span class="ws">→</span>').replace(/ /g, '<span class="ws">·</span>');
    }
    return h;
  }
  function renderWords(words) {
    return words.map((w) => {
      const t = fmt(w.text);
      if (w.type === "del") return "<del>" + t + "</del>";
      if (w.type === "add") return "<ins>" + t + "</ins>";
      return t;
    }).join("");
  }
  // Inline badge marking a moved line and where its partner lives.
  function moveTag(dir, n) {
    return ' <span class="movetag" title="This line was moved, not added or removed">↕ moved ' + dir + " line " + n + "</span>";
  }
  function opts() {
    return {
      ignoreWhitespace: optWs.checked,
      ignoreCase: optCase.checked,
      ignoreBlankLines: optBlank.checked,
      charLevel: optChar.checked,
    };
  }

  // 两个 span 之间不留字面空格——.num 用 flex gap 控距，字面空格会额外撑开一格。
  function numCell(a, b) {
    return '<div class="num"><span>' + (a == null ? "" : a) + '</span><span>' + (b == null ? "" : b) + "</span></div>";
  }
  function urow(cls, sign, aNum, bNum, inner, attrs) {
    return '<div class="row ' + cls + '"' + (attrs || "") + '>' + numCell(aNum, bNum) + '<div class="sign">' + sign + '</div><div class="txt">' + inner + "</div></div>";
  }
  // pip 轨道消费的视图无关元数据，盖在每个 hunk 的首行上。轨道只读 dataset，
  // 不读各视图的 DOM 细节（split 的类型类在子节点上，按 classList 读会拿不到）。
  function hmeta(type, line) {
    return ' data-htype="' + type + '" data-hline="' + (line == null ? "" : line) + '"';
  }
  // Single-column rows shared by Unified and Inline — the ONLY difference is how a
  // CHANGE renders: Unified shows two rows (− old / + new); Inline shows one row with
  // the original text and the edits marked in place (strike-through + insert).
  // A collapsed band of unchanged lines — full-width, click to expand.
  function foldRowHtml(r) {
    return '<div class="row fold"><button class="foldbtn" type="button" data-fold="' + esc(r.key) +
      '" title="Show the hidden lines">⋯ ' + r.count + " unchanged lines · expand ⋯</button></div>";
  }
  function renderColumn(out, inlineChange) {
    const html = []; let prevImp = false;
    for (const r of out.rows) {
      if (r.type === "fold") { html.push(foldRowHtml(r)); prevImp = false; continue; }
      const imp = r.type === "del" || r.type === "add" || r.type === "change";
      const hs = imp && !prevImp ? " hstart" : "";
      if (r.type === "equal") html.push(urow("equal", "", r.aNum, r.bNum, fmt(r.text)));
      else if (r.type === "minor") html.push(urow("minor", "≈", r.aNum, r.bNum, renderWords(inlineChange ? r.words : r.bWords)));
      else if (r.type === "del") html.push(urow("del" + hs + (r.moved ? " moved" : ""), "−", r.aNum, null, fmt(r.text) + (r.moved ? moveTag("to", r.movePartnerNum) : ""), hs ? hmeta("del", r.aNum) : ""));
      else if (r.type === "add") html.push(urow("add" + hs + (r.moved ? " moved" : ""), "+", null, r.bNum, fmt(r.text) + (r.moved ? moveTag("from", r.movePartnerNum) : ""), hs ? hmeta("add", r.bNum) : ""));
      else if (r.type === "change") {
        if (inlineChange) {
          html.push(urow("change" + hs, "~", r.aNum, r.bNum, renderWords(r.words), hs ? hmeta("change", r.aNum) : ""));
        } else {
          html.push(urow("change" + hs, "−", r.aNum, null, renderWords(r.aWords), hs ? hmeta("change", r.aNum) : ""));
          html.push(urow("change", "+", null, r.bNum, renderWords(r.bWords)));
        }
      }
      prevImp = imp;
    }
    return html.join("");
  }
  function renderUnified(out) { return renderColumn(out, false); }
  function renderInline(out) { return renderColumn(out, true); }
  function scol(cls, num, inner) {
    return '<div class="scol ' + cls + '"><div class="snum">' + (num == null ? "" : num) + '</div><div class="stxt">' + inner + "</div></div>";
  }
  function renderSplit(out) {
    const html = []; let prevImp = false;
    for (const r of out.rows) {
      if (r.type === "fold") { html.push(foldRowHtml(r)); prevImp = false; continue; }
      const imp = r.type === "del" || r.type === "add" || r.type === "change";
      const hs = imp && !prevImp ? " hstart" : "";
      // 右栏必须带 class "b" —— .scol.b 是两栏之间的分隔竖线。
      // （此前一直漏加，导致 app.css 的 .scol.b 规则从未生效、split 视图无分栏线。）
      let left, right;
      if (r.type === "equal") {
        left = scol("equal", r.aNum, fmt(r.text)); right = scol("equal b", r.bNum, fmt(r.text));
      } else if (r.type === "minor") {
        left = scol("minor", r.aNum, renderWords(r.aWords)); right = scol("minor b", r.bNum, renderWords(r.bWords));
      } else if (r.type === "del") {
        left = scol("del" + (r.moved ? " moved" : ""), r.aNum, fmt(r.text) + (r.moved ? moveTag("to", r.movePartnerNum) : "")); right = scol("blank b", null, "");
      } else if (r.type === "add") {
        left = scol("blank", null, ""); right = scol("add b" + (r.moved ? " moved" : ""), r.bNum, fmt(r.text) + (r.moved ? moveTag("from", r.movePartnerNum) : ""));
      } else { // change
        left = scol("chg", r.aNum, renderWords(r.aWords)); right = scol("chg b", r.bNum, renderWords(r.bWords));
      }
      html.push('<div class="srow' + hs + '"' + (hs ? hmeta(r.type, r.type === "add" ? r.bNum : r.aNum) : "") + '>' + left + right + "</div>");
      prevImp = imp;
    }
    return html.join("");
  }

  // Error boundary: a pathological input must never leave the UI broken or throw
  // uncaught — show a friendly message and keep the tool usable.
  function render() {
    try {
      renderDiff();
    } catch (e) {
      result.innerHTML = '<div class="placeholder"><span class="big">Couldn’t compare this input' +
        (e && e.message ? " (" + esc(String(e.message)) + ")" : "") + '.</span><span>Try smaller or simpler text.</span></div>';
      stats.textContent = "Comparison error";
      hunks = []; hunkIdx = -1; updateNav();
    }
  }
  function renderDiff() {
    const a = ta.value, b = tb.value;
    // New text invalidates any manual expand state (fold keys won't match).
    if (a !== lastA || b !== lastB) { expandedFolds.clear(); lastA = a; lastB = b; }
    if (a === "" && b === "") {
      result.innerHTML = '<div class="placeholder"><span class="big">Type or paste text in both boxes to compare.</span>' +
        '<span>Nothing you paste here is uploaded — the comparison runs in this tab.</span></div>';
      stats.textContent = "Type or paste text in both boxes to compare.";
      indexHunks();
      return;
    }
    const out = window.ClearDiff.compare(a, b, opts());
    if (out.stats.identical) {
      const why = (optWs.checked || optCase.checked || optBlank.checked) ? " (with the chosen ignore options)" : "";
      result.innerHTML = '<div class="placeholder"><span class="big">✓ The two texts are identical' + why + ".</span></div>";
    } else {
      let toRender = out;
      if (fold) {
        let folded = window.ClearDiff.foldRows(out.rows, FOLD_CONTEXT);
        if (expandedFolds.size) {
          folded = folded.flatMap((it) => (it.type === "fold" && expandedFolds.has(it.key) ? it.hidden : [it]));
        }
        toRender = { rows: folded };
      }
      result.innerHTML = view === "split" ? renderSplit(toRender) : view === "inline" ? renderInline(toRender) : renderUnified(toRender);
    }
    const minorTxt = out.stats.minor ? ' · <span class="minorc">≈' + out.stats.minor + " minor</span>" : "";
    const movedTxt = out.stats.moved ? ' · <span class="movedc">↕' + out.stats.moved + " moved</span>" : "";
    const head = out.stats.onlyMinor ? '<span class="same">No important differences</span> · ' : "";
    stats.innerHTML = head +
      '<span class="add">+' + out.stats.added + " added</span> · " +
      '<span class="del">−' + out.stats.removed + " removed</span>" + minorTxt + movedTxt +
      " · A: " + out.stats.aLines + " lines, B: " + out.stats.bLines + " lines";
    indexHunks();
  }

  // --- difference navigation (BC-style next/prev) ---
  function indexHunks() {
    hunks = [].slice.call(result.querySelectorAll(".hstart"));
    hunkIdx = -1;
    updateNav();
    renderPips();
  }
  function updateNav() {
    if (!navPrev) return;
    const n = hunks.length;
    navPrev.disabled = n === 0; navNext.disabled = n === 0;
    navCount.textContent = n === 0 ? "—" : (hunkIdx < 0 ? (n + (n === 1 ? " diff" : " diffs")) : (hunkIdx + 1) + " / " + n);
    // 显隐挂在这里：hunks 状态的唯一汇聚点，错误态（render 边界置空 hunks）也会路过。
    if (pipRail) pipRail.classList.toggle("hidden", n === 0);
  }
  // F-044 改动色标：轨道上每个 pip 对应一个 hunk，位置按文档相对高度铺排。
  // 类型与行号读 hunk 首行的 data-htype/data-hline（视图无关），不碰用户文本。
  function renderPips() {
    if (!pipRail) return;
    if (!hunks.length) { pipRail.innerHTML = ""; return; }
    // 先把几何一次读完，再开始写 DOM——读写交错会让每次迭代都强制同步布局，
    // 大 diff 下 wrap/resize 一次就是一串 reflow。
    const total = result.scrollHeight || 1;
    const tops = hunks.map((h) => ((h.offsetTop / total) * 100).toFixed(2) + "%");
    // innerHTML 重建会销毁真实键盘焦点：记下焦点停在哪个 pip，重建后还给同一序号。
    const ae = document.activeElement;
    const focusIdx = ae && pipRail.contains(ae) && ae.dataset && ae.dataset.pip != null ? Number(ae.dataset.pip) : -1;
    const NAME = { add: "added", del: "removed", change: "changed" };
    const html = [];
    for (let i = 0; i < hunks.length; i++) {
      const type = hunks[i].dataset.htype || "change";
      const line = hunks[i].dataset.hline || "";
      const label = (NAME[type] || "changed") + (line ? " · line " + line : "");
      html.push('<button type="button" class="pip ' + (NAME[type] ? type : "change") +
        '" data-pip="' + i + '" title="' + label + '" aria-label="Jump to ' + label + '"></button>');
    }
    pipRail.innerHTML = html.join("");
    const kids = pipRail.children;
    for (let i = 0; i < kids.length; i++) {
      // 几何是数据不是样式：仅 top 由 JS 写入，颜色与形态全部留在 app.css
      //（specs 技术决策 1 对「禁内联 style」的显式豁免，范围仅此一个属性）。
      kids[i].style.top = tops[i];
    }
    // 幂等复原当前态：任何原因重建轨道（wrap 切换、resize）后不丢 .current。
    if (hunkIdx >= 0 && kids[hunkIdx]) kids[hunkIdx].classList.add("current");
    if (focusIdx >= 0 && kids[focusIdx]) kids[focusIdx].focus({ preventScroll: true });
  }
  function jump(dir) {
    if (!hunks.length) return;
    if (hunkIdx < 0) hunkIdx = dir > 0 ? 0 : hunks.length - 1;
    else hunkIdx = (hunkIdx + dir + hunks.length) % hunks.length;
    hunks.forEach((h) => h.classList.remove("jumped"));
    const el = hunks[hunkIdx];
    el.classList.add("jumped");
    el.scrollIntoView({ block: "center" });
    if (pipRail) {
      const ps = pipRail.children;
      for (let i = 0; i < ps.length; i++) ps[i].classList.toggle("current", i === hunkIdx);
    }
    updateNav();
  }

  // Plain-text diff (the legacy "Copy result" format).
  function plainDiffText() {
    const out = window.ClearDiff.compare(ta.value, tb.value, opts());
    return out.rows.map((r) => {
      if (r.type === "equal") return "  " + r.text;
      if (r.type === "minor") return "~ " + r.bText;
      if (r.type === "del") return "- " + r.text;
      if (r.type === "add") return "+ " + r.text;
      if (r.type === "change") return "- " + r.aWords.map((w) => w.text).join("") + "\n+ " + r.bWords.map((w) => w.text).join("");
      return "";
    }).join("\n");
  }

  function flashBtn(btn, label) {
    if (!btn) return;
    const old = btn.textContent;
    btn.textContent = label; setTimeout(() => (btn.textContent = old), 1200);
  }
  function closeExport() { const d = $("export"); if (d) d.open = false; }

  function copyText(text, btn, okLabel) {
    if (!text) return;

codex
接下来补两块证据：一是直接比对 `golden.json` / `golden-after.json` 是否真一致，二是看现有 smoke/金样到底覆盖了哪些路径，哪些高危路径根本没打到。
exec
/bin/zsh -lc "sed -n '1,240p' refactors/app-js-split/golden.json" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
{
 "basic-change::unified": "<div class=\"row equal\"><div class=\"num\"><span>1</span><span>1</span></div><div class=\"sign\"></div><div class=\"txt\">alpha</div></div><div class=\"row change hstart\" data-htype=\"change\" data-hline=\"2\"><div class=\"num\"><span>2</span><span></span></div><div class=\"sign\">−</div><div class=\"txt\"><del>b</del><del>r</del>a<del>v</del><del>o</del></div></div><div class=\"row change\"><div class=\"num\"><span></span><span>2</span></div><div class=\"sign\">+</div><div class=\"txt\"><ins>d</ins><ins>e</ins><ins>l</ins><ins>t</ins>a</div></div><div class=\"row equal\"><div class=\"num\"><span>3</span><span>3</span></div><div class=\"sign\"></div><div class=\"txt\">charlie</div></div>",
 "basic-change::split": "<div class=\"srow\"><div class=\"scol equal\"><div class=\"snum\">1</div><div class=\"stxt\">alpha</div></div><div class=\"scol equal b\"><div class=\"snum\">1</div><div class=\"stxt\">alpha</div></div></div><div class=\"srow hstart\" data-htype=\"change\" data-hline=\"2\"><div class=\"scol chg\"><div class=\"snum\">2</div><div class=\"stxt\"><del>b</del><del>r</del>a<del>v</del><del>o</del></div></div><div class=\"scol chg b\"><div class=\"snum\">2</div><div class=\"stxt\"><ins>d</ins><ins>e</ins><ins>l</ins><ins>t</ins>a</div></div></div><div class=\"srow\"><div class=\"scol equal\"><div class=\"snum\">3</div><div class=\"stxt\">charlie</div></div><div class=\"scol equal b\"><div class=\"snum\">3</div><div class=\"stxt\">charlie</div></div></div>",
 "basic-change::inline": "<div class=\"row equal\"><div class=\"num\"><span>1</span><span>1</span></div><div class=\"sign\"></div><div class=\"txt\">alpha</div></div><div class=\"row change hstart\" data-htype=\"change\" data-hline=\"2\"><div class=\"num\"><span>2</span><span>2</span></div><div class=\"sign\">~</div><div class=\"txt\"><del>b</del><del>r</del><ins>d</ins><ins>e</ins><ins>l</ins><ins>t</ins>a<del>v</del><del>o</del></div></div><div class=\"row equal\"><div class=\"num\"><span>3</span><span>3</span></div><div class=\"sign\"></div><div class=\"txt\">charlie</div></div>",
 "blank-ignore::unified": "<div class=\"row equal\"><div class=\"num\"><span>1</span><span>1</span></div><div class=\"sign\"></div><div class=\"txt\">a</div></div><div class=\"row change hstart\" data-htype=\"change\" data-hline=\"3\"><div class=\"num\"><span>3</span><span></span></div><div class=\"sign\">−</div><div class=\"txt\"><del>b</del></div></div><div class=\"row change\"><div class=\"num\"><span></span><span>3</span></div><div class=\"sign\">+</div><div class=\"txt\"><ins>B</ins></div></div><div class=\"row equal\"><div class=\"num\"><span>4</span><span>4</span></div><div class=\"sign\"></div><div class=\"txt\">c</div></div>",
 "blank-ignore::split": "<div class=\"srow\"><div class=\"scol equal\"><div class=\"snum\">1</div><div class=\"stxt\">a</div></div><div class=\"scol equal b\"><div class=\"snum\">1</div><div class=\"stxt\">a</div></div></div><div class=\"srow hstart\" data-htype=\"change\" data-hline=\"3\"><div class=\"scol chg\"><div class=\"snum\">3</div><div class=\"stxt\"><del>b</del></div></div><div class=\"scol chg b\"><div class=\"snum\">3</div><div class=\"stxt\"><ins>B</ins></div></div></div><div class=\"srow\"><div class=\"scol equal\"><div class=\"snum\">4</div><div class=\"stxt\">c</div></div><div class=\"scol equal b\"><div class=\"snum\">4</div><div class=\"stxt\">c</div></div></div>",
 "blank-ignore::inline": "<div class=\"row equal\"><div class=\"num\"><span>1</span><span>1</span></div><div class=\"sign\"></div><div class=\"txt\">a</div></div><div class=\"row change hstart\" data-htype=\"change\" data-hline=\"3\"><div class=\"num\"><span>3</span><span>3</span></div><div class=\"sign\">~</div><div class=\"txt\"><del>b</del><ins>B</ins></div></div><div class=\"row equal\"><div class=\"num\"><span>4</span><span>4</span></div><div class=\"sign\"></div><div class=\"txt\">c</div></div>",
 "minor-case::unified": "<div class=\"row minor\"><div class=\"num\"><span>1</span><span>1</span></div><div class=\"sign\">≈</div><div class=\"txt\">Hello World</div></div><div class=\"row equal\"><div class=\"num\"><span>2</span><span>2</span></div><div class=\"sign\"></div><div class=\"txt\">same</div></div>",
 "minor-case::split": "<div class=\"srow\"><div class=\"scol minor\"><div class=\"snum\">1</div><div class=\"stxt\">Hello World</div></div><div class=\"scol minor b\"><div class=\"snum\">1</div><div class=\"stxt\">Hello World</div></div></div><div class=\"srow\"><div class=\"scol equal\"><div class=\"snum\">2</div><div class=\"stxt\">same</div></div><div class=\"scol equal b\"><div class=\"snum\">2</div><div class=\"stxt\">same</div></div></div>",
 "minor-case::inline": "<div class=\"row minor\"><div class=\"num\"><span>1</span><span>1</span></div><div class=\"sign\">≈</div><div class=\"txt\">Hello World</div></div><div class=\"row equal\"><div class=\"num\"><span>2</span><span>2</span></div><div class=\"sign\"></div><div class=\"txt\">same</div></div>",
 "moved-line::unified": "<div class=\"row del hstart moved\" data-htype=\"del\" data-hline=\"1\"><div class=\"num\"><span>1</span><span></span></div><div class=\"sign\">−</div><div class=\"txt\">one <span class=\"movetag\" title=\"This line was moved, not added or removed\">↕ moved to line 4</span></div></div><div class=\"row equal\"><div class=\"num\"><span>2</span><span>1</span></div><div class=\"sign\"></div><div class=\"txt\">two</div></div><div class=\"row equal\"><div class=\"num\"><span>3</span><span>2</span></div><div class=\"sign\"></div><div class=\"txt\">three</div></div><div class=\"row equal\"><div class=\"num\"><span>4</span><span>3</span></div><div class=\"sign\"></div><div class=\"txt\">four five six</div></div><div class=\"row add hstart moved\" data-htype=\"add\" data-hline=\"4\"><div class=\"num\"><span></span><span>4</span></div><div class=\"sign\">+</div><div class=\"txt\">one <span class=\"movetag\" title=\"This line was moved, not added or removed\">↕ moved from line 1</span></div></div>",
 "moved-line::split": "<div class=\"srow hstart\" data-htype=\"del\" data-hline=\"1\"><div class=\"scol del moved\"><div class=\"snum\">1</div><div class=\"stxt\">one <span class=\"movetag\" title=\"This line was moved, not added or removed\">↕ moved to line 4</span></div></div><div class=\"scol blank b\"><div class=\"snum\"></div><div class=\"stxt\"></div></div></div><div class=\"srow\"><div class=\"scol equal\"><div class=\"snum\">2</div><div class=\"stxt\">two</div></div><div class=\"scol equal b\"><div class=\"snum\">1</div><div class=\"stxt\">two</div></div></div><div class=\"srow\"><div class=\"scol equal\"><div class=\"snum\">3</div><div class=\"stxt\">three</div></div><div class=\"scol equal b\"><div class=\"snum\">2</div><div class=\"stxt\">three</div></div></div><div class=\"srow\"><div class=\"scol equal\"><div class=\"snum\">4</div><div class=\"stxt\">four five six</div></div><div class=\"scol equal b\"><div class=\"snum\">3</div><div class=\"stxt\">four five six</div></div></div><div class=\"srow hstart\" data-htype=\"add\" data-hline=\"4\"><div class=\"scol blank\"><div class=\"snum\"></div><div class=\"stxt\"></div></div><div class=\"scol add b moved\"><div class=\"snum\">4</div><div class=\"stxt\">one <span class=\"movetag\" title=\"This line was moved, not added or removed\">↕ moved from line 1</span></div></div></div>",
 "moved-line::inline": "<div class=\"row del hstart moved\" data-htype=\"del\" data-hline=\"1\"><div class=\"num\"><span>1</span><span></span></div><div class=\"sign\">−</div><div class=\"txt\">one <span class=\"movetag\" title=\"This line was moved, not added or removed\">↕ moved to line 4</span></div></div><div class=\"row equal\"><div class=\"num\"><span>2</span><span>1</span></div><div class=\"sign\"></div><div class=\"txt\">two</div></div><div class=\"row equal\"><div class=\"num\"><span>3</span><span>2</span></div><div class=\"sign\"></div><div class=\"txt\">three</div></div><div class=\"row equal\"><div class=\"num\"><span>4</span><span>3</span></div><div class=\"sign\"></div><div class=\"txt\">four five six</div></div><div class=\"row add hstart moved\" data-htype=\"add\" data-hline=\"4\"><div class=\"num\"><span></span><span>4</span></div><div class=\"sign\">+</div><div class=\"txt\">one <span class=\"movetag\" title=\"This line was moved, not added or removed\">↕ moved from line 1</span></div></div>",
 "empty-vs-text::unified": "<div class=\"row change hstart\" data-htype=\"change\" data-hline=\"1\"><div class=\"num\"><span>1</span><span></span></div><div class=\"sign\">−</div><div class=\"txt\"></div></div><div class=\"row change\"><div class=\"num\"><span></span><span>1</span></div><div class=\"sign\">+</div><div class=\"txt\"><ins>solo</ins></div></div>",
 "empty-vs-text::split": "<div class=\"srow hstart\" data-htype=\"change\" data-hline=\"1\"><div class=\"scol chg\"><div class=\"snum\">1</div><div class=\"stxt\"></div></div><div class=\"scol chg b\"><div class=\"snum\">1</div><div class=\"stxt\"><ins>solo</ins></div></div></div>",
 "empty-vs-text::inline": "<div class=\"row change hstart\" data-htype=\"change\" data-hline=\"1\"><div class=\"num\"><span>1</span><span>1</span></div><div class=\"sign\">~</div><div class=\"txt\"><ins>solo</ins></div></div>",
 "identical::unified": "<div class=\"placeholder\"><span class=\"big\">✓ The two texts are identical.</span></div>",
 "identical::split": "<div class=\"placeholder\"><span class=\"big\">✓ The two texts are identical.</span></div>",
 "identical::inline": "<div class=\"placeholder\"><span class=\"big\">✓ The two texts are identical.</span></div>"
}
exec
/bin/zsh -lc 'cmp -s refactors/app-js-split/golden.json refactors/app-js-split/golden-after.json; echo $?; wc -c refactors/app-js-split/golden.json refactors/app-js-split/golden-after.json' in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
0
    9701 refactors/app-js-split/golden.json
    9701 refactors/app-js-split/golden-after.json
   19402 total

exec
/bin/zsh -lc "rg -n \"smoke|golden|showWhitespace|copy|download|history|fold|drag|format json|view\" tests refactors/app-js-split -g '"'!refactors/app-js-split/golden*.json'"'" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
tests/diff-test.mjs:11:const { compare, toUnifiedDiff, toMarkdown, foldRows } = globalThis.ClearDiff;
tests/diff-test.mjs:166:// --- foldRows() ---
tests/diff-test.mjs:173:  const folded = foldRows(out.rows, 3, 10);
tests/diff-test.mjs:174:  const folds = folded.filter((r) => r.type === "fold");
tests/diff-test.mjs:175:  eq(folds.length, 2, "one change in a long file → two fold blocks (before & after)");
tests/diff-test.mjs:177:  ok(folded.some((r) => r.type === "change"), "the change itself is never folded");
tests/diff-test.mjs:179:  const rebuilt = folded.flatMap((r) => (r.type === "fold" ? r.hidden : [r]));
tests/diff-test.mjs:180:  eq(rebuilt.length, out.rows.length, "expanding all folds restores every row");
tests/diff-test.mjs:181:  ok(folds.every((f) => f.count === f.hidden.length), "fold count matches hidden rows");
tests/diff-test.mjs:182:  ok(folds.every((f) => typeof f.key === "string" && f.key.length > 1), "each fold has a stable key");
tests/diff-test.mjs:186:  // Short unchanged runs are not worth folding.
tests/diff-test.mjs:188:  const folded = foldRows(out.rows, 3, 10);
tests/diff-test.mjs:189:  eq(folded.filter((r) => r.type === "fold").length, 0, "short runs are left expanded");
tests/diff-test.mjs:193:  // No changes at all → nothing to anchor on → whole body folds if long enough.
tests/diff-test.mjs:200:  // Stable keys: same input folds to the same keys twice (so expand state survives re-render).
tests/diff-test.mjs:204:  const k1 = foldRows(out.rows, 3, 10).filter((r) => r.type === "fold").map((r) => r.key);
tests/diff-test.mjs:205:  const k2 = foldRows(out.rows, 3, 10).filter((r) => r.type === "fold").map((r) => r.key);
tests/diff-test.mjs:206:  eq(k1, k2, "fold keys are deterministic across calls");
tests/history-test.mjs:1:// DiffLens history helpers unit tests — run with: node tests/history-test.mjs
tests/history-test.mjs:8:vm.runInThisContext(readFileSync(join(here, "..", "history.js"), "utf8"));
tests/history-test.mjs:9:const { preview, tooLarge, add, remove, MAX_ENTRIES } = globalThis.DiffLensHistory;
tests/history-test.mjs:15:// preview
tests/history-test.mjs:16:eq(preview("hello\nworld", "hello\nthere"), "hello → hello", "preview uses first non-empty line of each side");
tests/history-test.mjs:17:eq(preview("\n\n  \nreal", "x"), "real → x", "preview skips blank/whitespace lines");
tests/history-test.mjs:18:eq(preview("", ""), "(empty) → (empty)", "preview labels empty input");
tests/history-test.mjs:19:ok(preview("x".repeat(80), "y").startsWith("x".repeat(40)), "preview truncates long first lines");
tests/history-test.mjs:20:ok(preview("x".repeat(80), "y").includes("…"), "preview adds ellipsis when truncated");
refactors/app-js-split/RULEBOOK.md:7:- 循环内**必跑** `node --check {文件}`;**允许**自建纯 Node 等价自检(v2:bakeoff 双方自发验证,合法化);**禁跑** tests/smoke.mjs 与任何起浏览器的验证(贵,站 4/5 批量跑——裁判价格定位)
refactors/app-js-split/RULEBOOK.md:13:| ui-render.js | 纯 HTML 生成 | esc/fmt/renderWords/moveTag/numCell/urow/hmeta/foldRowHtml/renderColumn/renderUnified/renderInline/scol/renderSplit | 无状态——三个渲染入口收 `{showWs}` options bag 下传(v2);**导出面=实际消费面:仅 esc/renderUnified/renderInline/renderSplit,其余 9 个私有**(bakeoff 双方无规则趋同) |
refactors/app-js-split/RULEBOOK.md:15:| ui-export.js | 复制/下载导出 | plainDiffText/flashBtn/closeExport/copyText/copyResult/copyUnified/copyMarkdown/downloadPatch | 无状态;输入引用经 ctx |
refactors/app-js-split/RULEBOOK.md:16:| ui-history.js | 历史列表 UI | relTime/renderHistList/saveCurrent/restoreHist/delHist | historyList 归 app.js,经 ctx 存取 |
refactors/app-js-split/RULEBOOK.md:18:| app.js(留守) | 编排:opts/render/renderDiff/schedule/persist*/boot/全部事件绑定 | — | view/fold/showWs/expandedFolds/lastA/lastB/historyList |
refactors/app-js-split/RULEBOOK.md:27:  | ui-history.js | `DiffLensHistUI` | init(ctx)(**避开已被 history.js 占用的 DiffLensHistory**) |
refactors/app-js-split/RULEBOOK.md:39:- R2 **加载顺序**:compare.html 中 ui-*.js 位于 diff.js/history.js 之后、app.js 之前;漏登记=启动即挂,防护网必抓
refactors/app-js-split/RULEBOOK.md:50:| v3 | 2026-07-18 | 批内工厂挂载形态 2:2 分裂(nav/file {init} vs export/history 裸工厂)——公式两读实锤 | R1 定形裸工厂+附骨架代码;引擎只读引用合法化 | 人(批间裁决) |
refactors/app-js-split/delta-nav.md:8:`ui-nav.js` 插在 history.js 之后、app.js 之前：
refactors/app-js-split/delta-nav.md:12:<script src="history.js"></script>
refactors/app-js-split/delta-history.md:1:# delta-history — ui-history.js 搬迁记录 (U4/5, rulebook_rev=v2)
refactors/app-js-split/delta-history.md:7:| relTime | 297–303 | ui-history.js | 私有（仅 renderHistList 消费，R6：只导出被绑定的函数） |
refactors/app-js-split/delta-history.md:8:| renderHistList | 304–317 | ui-history.js | init api 导出 |
refactors/app-js-split/delta-history.md:9:| saveCurrent | 318–326 | ui-history.js | init api 导出 |
refactors/app-js-split/delta-history.md:10:| restoreHist | 327–332 | ui-history.js | init api 导出 |
refactors/app-js-split/delta-history.md:11:| delHist | 333 | ui-history.js | init api 导出 |
refactors/app-js-split/delta-history.md:13:未搬迁（按规则留守 app.js）：`persistHistory`（chrome.*，R3）、`H = window.DiffLensHistory` 的取得与转发（R1 禁模块互调）、`hist-save`/`hist-list` 事件绑定（R6）、boot 中的 `historyList` 装载（§1 状态归属）。
refactors/app-js-split/delta-history.md:17:`window.DiffLensHistUI = init`，即 `DiffLensHistUI(ctx) => api` 工厂——按 R1 公式 `window.DiffLens{Name} = init(ctx) => api` 的字面形态，全局本身就是工厂函数（非 `{ init }` 包装对象）。**未占用 `DiffLensHistory`**（history.js 既有全局）。
refactors/app-js-split/delta-history.md:24:| histList / histSave / histMenu | `$("hist-list")` / `$("hist-save")` / `$("history")` | 同上；原代码逐次 `$()` 查询改为 init 时注入——三元素在 compare.html 中静态存在，行为等价（且符合 frontend.md「顶部一次性缓存」） |
refactors/app-js-split/delta-history.md:26:| hist | 转发自 `DiffLensHistory`（preview/tooLarge/add/remove） | R1：跨模块共享一律经 ctx |
refactors/app-js-split/delta-history.md:27:| getHistoryList / setHistoryList | historyList 存取器，状态留 app.js | §1 状态归属 |
refactors/app-js-split/delta-history.md:34:- `node --check ui-history.js` ✅
refactors/app-js-split/delta-history.md:36:- 未跑 tests/smoke.mjs、未起浏览器（§0 禁令）。
refactors/app-js-split/delta-history.md:41:2. compare.html 注册 `ui-history.js`，位于 diff.js/history.js 之后、app.js 之前（R2）。
refactors/app-js-split/delta-history.md:42:3. **契约依赖**：ctx.flashBtn 需 ui-export 的 init api 导出 flashBtn（flashBtn 在 ui-export 内部也被 downloadPatch 等消费，但 saveCurrent 这条消费线要求它出现在导出面）；ctx.esc 需 DiffLensRender 导出 esc（§1 v2 已保证）。
refactors/app-js-split/delta-export.md:12:| copyText | 剪贴板写入 + 反馈 | 文案 `"Copied ✓"` / `"Copy failed"` 逐字保留 |
refactors/app-js-split/delta-export.md:13:| copyResult | 复制纯文本 diff | 双空守卫原样 |
refactors/app-js-split/delta-export.md:14:| copyUnified | 复制 unified diff | 空导出提示文案逐字保留 |
refactors/app-js-split/delta-export.md:15:| copyMarkdown | 复制 Markdown | 同上 |
refactors/app-js-split/delta-export.md:16:| downloadPatch | Blob 下载 .patch | `difflens.patch` 文件名、`text/x-patch` MIME、**1000ms** revokeObjectURL、`"Saved ✓"` 全部原样 |
refactors/app-js-split/delta-export.md:29:3. 既有绑定改指向 `exp.copyResult` / `exp.copyUnified` / `exp.copyMarkdown` / `exp.downloadPatch`（L372–375）
refactors/app-js-split/delta-export.md:30:4. `saveCurrent` 内的 `flashBtn($("hist-save"), "Saved ✓")`（L325）经 `exp.flashBtn` 转发——**ui-history 单元的 ctx 需含 flashBtn**
refactors/app-js-split/delta-export.md:31:5. compare.html 登记 `<script src="ui-export.js">`，位于 diff.js/history.js 之后、app.js 之前（R2）
refactors/app-js-split/delta-export.md:40:- 未跑 smoke/浏览器（§0 禁令）；接线前本文件为静载不执行代码，不影响现行为
refactors/app-js-split/judge-report.md:4:- 141 项全绿: diff-test 48 / history-test 19 / smoke 68 / unified-blank 6 (2026-07-18)
refactors/app-js-split/judge-report.md:5:- 判官构成: 纯函数层由 diff/history/unified 测试覆盖;app.js(DOM 胶水层)由 smoke 整页断言充当差分层
refactors/app-js-split/judge-report.md:10:| 1 | 输入:input 监听不再触发比较 | 删 schedule() 调用 | 🔴 抓到(smoke 异常终止,退出码 1) |
refactors/app-js-split/judge-report.md:14:- 复原验证: app.js 与原始逐字节一致,smoke 复绿 68/68
refactors/app-js-split/judge-report.md:15:- 备注: 变红形态是"断言等待超时→异常退出"而非整洁的 failed 计数——判官有效但报错形态粗粝,排障时先看 smoke 输出前段
tests/smoke.mjs:1:// DiffLens end-to-end smoke — loads compare.html in headless Chromium and drives
tests/smoke.mjs:2:// the real UI. Run with: node tests/smoke.mjs
tests/smoke.mjs:63:  for (const f of ["compare.html", "app.css", "app.js", "diff.js", "history.js", "background.js"]) {
tests/smoke.mjs:84:  await page.click('[data-view="split"]');
tests/smoke.mjs:85:  ok((await page.locator("#result .srow").count()) > 0, "split view renders side-by-side rows");
tests/smoke.mjs:86:  await page.click('[data-view="inline"]');
tests/smoke.mjs:87:  ok((await page.locator("#result .row").count()) > 0, "inline view renders rows");
tests/smoke.mjs:88:  await page.click('[data-view="unified"]');
tests/smoke.mjs:95:  ok(await page.locator("#copy-diff").isVisible(), "export menu reveals 'Copy unified diff'");
tests/smoke.mjs:98:  ok(!(await page.locator("#copy-diff").isVisible()), "Escape closes the export menu");
tests/smoke.mjs:105:  // Collapse unchanged: a long mostly-identical input should fold, and a band expands.
tests/smoke.mjs:112:  await page.check("#opt-fold");
tests/smoke.mjs:113:  await page.waitForFunction(() => document.querySelectorAll("#result .foldbtn").length > 0);
tests/smoke.mjs:116:  ok((await page.locator("#result .foldbtn").count()) >= 1, "a fold band is shown");
tests/smoke.mjs:119:  await page.locator("#result .foldbtn").first().click();
tests/smoke.mjs:122:  await page.uncheck("#opt-fold");
tests/smoke.mjs:134:  // review found it could silently break: split view losing type semantics, a
tests/smoke.mjs:158:  // Split view: type semantics ride on data-htype, not on the srow's class list —
tests/smoke.mjs:169:  await page.click('[data-view="split"]');
tests/smoke.mjs:173:  ok(splitTypes === "change,del,add", "split view keeps pip type semantics (got: " + splitTypes + ")");
tests/smoke.mjs:175:  await page.click('[data-view="unified"]');
tests/smoke.mjs:190:  const originalViewport = page.viewportSize();
tests/smoke.mjs:195:  ok(narrowTops !== wideTops, "a viewport resize recomputes pip positions");
tests/smoke.mjs:205:  // Comparison history: save → restore → delete (in-memory without chrome storage).
tests/smoke.mjs:208:  await page.click("#history summary");
tests/smoke.mjs:209:  ok(await page.locator("#hist-save").isVisible(), "history menu opens");
tests/smoke.mjs:212:  ok((await page.locator("#hist-list .hist-item").count()) === 1, "saving adds one history entry");
tests/smoke.mjs:213:  ok(/alpha → alpha/.test(await page.textContent("#hist-list")), "history entry shows a preview");
tests/smoke.mjs:216:  await page.evaluate(() => { document.getElementById("history").open = true; });
tests/smoke.mjs:221:  await page.evaluate(() => { document.getElementById("history").open = true; });
tests/smoke.mjs:262:  // viewport, or the oldest entries become unreachable.
tests/smoke.mjs:263:  await page.click("#history summary");
tests/smoke.mjs:282:  ok(hist.items === 12, "history caps at 12 entries (got " + hist.items + ")");
tests/smoke.mjs:283:  ok(hist.scrolls, "history list scrolls instead of growing unbounded");
tests/smoke.mjs:284:  ok(hist.bottom <= hist.vh, "history menu stays inside the viewport");
tests/smoke.mjs:285:  await page.click("#history summary");
tests/smoke.mjs:344:  const TOGGLES = ["opt-ws", "opt-blank", "opt-case", "opt-char", "opt-ws-show", "opt-fold"];
tests/smoke.mjs:349:  await page.click('[data-view="split"]');
tests/smoke.mjs:350:  await page.click("#history summary");
tests/smoke.mjs:352:  await page.click("#history summary");
tests/smoke.mjs:362:    view: document.querySelector("[data-view].on")?.dataset.view,
tests/smoke.mjs:370:  ok(restored.view === "split", "view is restored on reopen");
tests/smoke.mjs:371:  ok(restored.hist === 1, "saved history survives a reopen");
tests/smoke.mjs:412:  await page.click('[data-view="split"]');
tests/smoke.mjs:413:  await page.click("#history summary");
refactors/app-js-split/delta-render.md:11:| B | 56–127 | `// 两个 span 之间不留字面空格` 注释起 → `renderSplit` 的收尾 `}`（`// Error boundary:` 注释之前）止 | numCell / urow / hmeta（含 pip 轨道契约注释，R4）/ foldRowHtml（含 Unified/Inline 共享注释）/ renderColumn / renderUnified / renderInline / scol / renderSplit |
refactors/app-js-split/delta-render.md:17:## 2. app.js 新增模块别名（跟随 history.js 既有先例 `const H = window.DiffLensHistory;`）
refactors/app-js-split/delta-render.md:30:| 165 | renderDiff() | `view === "split" ? renderSplit(toRender) : view === "inline" ? renderInline(toRender) : renderUnified(toRender)` | `view === "split" ? R.renderSplit(toRender, { showWs }) : view === "inline" ? R.renderInline(toRender, { showWs }) : R.renderUnified(toRender, { showWs })` |
refactors/app-js-split/delta-render.md:32:| 311 | renderHistList() | `esc(e.preview)` | `R.esc(e.preview)` |
refactors/app-js-split/delta-render.md:38:- renderHistList 的 esc 走 app.js 直接消费 `R.esc`；将来 U-history 拆出 ui-history.js 时按 R1 经 ctx 转发，此处不预支。
refactors/app-js-split/delta-render.md:46:  <script src="history.js"></script>
refactors/app-js-split/delta-render.md:47:  <script src="ui-render.js"></script>   <!-- 新增：diff.js/history.js 之后、app.js 之前 -->
refactors/app-js-split/delta-render.md:59:- 套用本 delta 后的整体验证（smoke/浏览器）按 §0 留给批量站 4/5，此处不跑。
refactors/app-js-split/golden-capture.mjs:2:// 重构前跑一次生成 golden.json;重构后重跑,输出必须逐字节一致(diff-report 数据源)。
refactors/app-js-split/golden-capture.mjs:31:const golden = {};
refactors/app-js-split/golden-capture.mjs:42:    await page.click(`[data-view="${v}"]`);
refactors/app-js-split/golden-capture.mjs:44:    golden[`${c.name}::${v}`] = await page.evaluate(() => document.getElementById("result").innerHTML);
refactors/app-js-split/golden-capture.mjs:48:const out = join(here, process.argv[2] || "golden.json");
refactors/app-js-split/golden-capture.mjs:49:writeFileSync(out, JSON.stringify(golden, null, 1));
refactors/app-js-split/golden-capture.mjs:50:console.log(`captured ${Object.keys(golden).length} snapshots → ${out}`);
refactors/app-js-split/delta-file.md:29:  （`render()`/`persist()` → `ctx.render()`/`ctx.persist()`，无其他改动），禁 smoke 未跑（§0）。
refactors/app-js-split/delta-file.md:36:2. compare.html 登记 `<script src="ui-file.js">`，位于 diff.js/history.js 之后、app.js 之前（R2）。
refactors/app-js-split/delta-file.md:41:   或「命名空间为对象含 init」。取 `root.DiffLensFile = { init }`——跟随 history.js
refactors/app-js-split/batch-log.jsonl:4:{"at": "2026-07-18T09:32:44+08:00", "file": "ui-history.js", "agent": "cm-frontend-agent", "model": "inherit", "rulebook_rev": "v2", "diff_pass": "固定时钟15副作用逐字节", "todos": 0, "confidence": "high", "mount": "裸工厂(待v3裁决)"}

exec
/bin/zsh -lc "sed -n '1,240p' refactors/app-js-split/golden-after.json" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
{
 "basic-change::unified": "<div class=\"row equal\"><div class=\"num\"><span>1</span><span>1</span></div><div class=\"sign\"></div><div class=\"txt\">alpha</div></div><div class=\"row change hstart\" data-htype=\"change\" data-hline=\"2\"><div class=\"num\"><span>2</span><span></span></div><div class=\"sign\">−</div><div class=\"txt\"><del>b</del><del>r</del>a<del>v</del><del>o</del></div></div><div class=\"row change\"><div class=\"num\"><span></span><span>2</span></div><div class=\"sign\">+</div><div class=\"txt\"><ins>d</ins><ins>e</ins><ins>l</ins><ins>t</ins>a</div></div><div class=\"row equal\"><div class=\"num\"><span>3</span><span>3</span></div><div class=\"sign\"></div><div class=\"txt\">charlie</div></div>",
 "basic-change::split": "<div class=\"srow\"><div class=\"scol equal\"><div class=\"snum\">1</div><div class=\"stxt\">alpha</div></div><div class=\"scol equal b\"><div class=\"snum\">1</div><div class=\"stxt\">alpha</div></div></div><div class=\"srow hstart\" data-htype=\"change\" data-hline=\"2\"><div class=\"scol chg\"><div class=\"snum\">2</div><div class=\"stxt\"><del>b</del><del>r</del>a<del>v</del><del>o</del></div></div><div class=\"scol chg b\"><div class=\"snum\">2</div><div class=\"stxt\"><ins>d</ins><ins>e</ins><ins>l</ins><ins>t</ins>a</div></div></div><div class=\"srow\"><div class=\"scol equal\"><div class=\"snum\">3</div><div class=\"stxt\">charlie</div></div><div class=\"scol equal b\"><div class=\"snum\">3</div><div class=\"stxt\">charlie</div></div></div>",
 "basic-change::inline": "<div class=\"row equal\"><div class=\"num\"><span>1</span><span>1</span></div><div class=\"sign\"></div><div class=\"txt\">alpha</div></div><div class=\"row change hstart\" data-htype=\"change\" data-hline=\"2\"><div class=\"num\"><span>2</span><span>2</span></div><div class=\"sign\">~</div><div class=\"txt\"><del>b</del><del>r</del><ins>d</ins><ins>e</ins><ins>l</ins><ins>t</ins>a<del>v</del><del>o</del></div></div><div class=\"row equal\"><div class=\"num\"><span>3</span><span>3</span></div><div class=\"sign\"></div><div class=\"txt\">charlie</div></div>",
 "blank-ignore::unified": "<div class=\"row equal\"><div class=\"num\"><span>1</span><span>1</span></div><div class=\"sign\"></div><div class=\"txt\">a</div></div><div class=\"row change hstart\" data-htype=\"change\" data-hline=\"3\"><div class=\"num\"><span>3</span><span></span></div><div class=\"sign\">−</div><div class=\"txt\"><del>b</del></div></div><div class=\"row change\"><div class=\"num\"><span></span><span>3</span></div><div class=\"sign\">+</div><div class=\"txt\"><ins>B</ins></div></div><div class=\"row equal\"><div class=\"num\"><span>4</span><span>4</span></div><div class=\"sign\"></div><div class=\"txt\">c</div></div>",
 "blank-ignore::split": "<div class=\"srow\"><div class=\"scol equal\"><div class=\"snum\">1</div><div class=\"stxt\">a</div></div><div class=\"scol equal b\"><div class=\"snum\">1</div><div class=\"stxt\">a</div></div></div><div class=\"srow hstart\" data-htype=\"change\" data-hline=\"3\"><div class=\"scol chg\"><div class=\"snum\">3</div><div class=\"stxt\"><del>b</del></div></div><div class=\"scol chg b\"><div class=\"snum\">3</div><div class=\"stxt\"><ins>B</ins></div></div></div><div class=\"srow\"><div class=\"scol equal\"><div class=\"snum\">4</div><div class=\"stxt\">c</div></div><div class=\"scol equal b\"><div class=\"snum\">4</div><div class=\"stxt\">c</div></div></div>",
 "blank-ignore::inline": "<div class=\"row equal\"><div class=\"num\"><span>1</span><span>1</span></div><div class=\"sign\"></div><div class=\"txt\">a</div></div><div class=\"row change hstart\" data-htype=\"change\" data-hline=\"3\"><div class=\"num\"><span>3</span><span>3</span></div><div class=\"sign\">~</div><div class=\"txt\"><del>b</del><ins>B</ins></div></div><div class=\"row equal\"><div class=\"num\"><span>4</span><span>4</span></div><div class=\"sign\"></div><div class=\"txt\">c</div></div>",
 "minor-case::unified": "<div class=\"row minor\"><div class=\"num\"><span>1</span><span>1</span></div><div class=\"sign\">≈</div><div class=\"txt\">Hello World</div></div><div class=\"row equal\"><div class=\"num\"><span>2</span><span>2</span></div><div class=\"sign\"></div><div class=\"txt\">same</div></div>",
 "minor-case::split": "<div class=\"srow\"><div class=\"scol minor\"><div class=\"snum\">1</div><div class=\"stxt\">Hello World</div></div><div class=\"scol minor b\"><div class=\"snum\">1</div><div class=\"stxt\">Hello World</div></div></div><div class=\"srow\"><div class=\"scol equal\"><div class=\"snum\">2</div><div class=\"stxt\">same</div></div><div class=\"scol equal b\"><div class=\"snum\">2</div><div class=\"stxt\">same</div></div></div>",
 "minor-case::inline": "<div class=\"row minor\"><div class=\"num\"><span>1</span><span>1</span></div><div class=\"sign\">≈</div><div class=\"txt\">Hello World</div></div><div class=\"row equal\"><div class=\"num\"><span>2</span><span>2</span></div><div class=\"sign\"></div><div class=\"txt\">same</div></div>",
 "moved-line::unified": "<div class=\"row del hstart moved\" data-htype=\"del\" data-hline=\"1\"><div class=\"num\"><span>1</span><span></span></div><div class=\"sign\">−</div><div class=\"txt\">one <span class=\"movetag\" title=\"This line was moved, not added or removed\">↕ moved to line 4</span></div></div><div class=\"row equal\"><div class=\"num\"><span>2</span><span>1</span></div><div class=\"sign\"></div><div class=\"txt\">two</div></div><div class=\"row equal\"><div class=\"num\"><span>3</span><span>2</span></div><div class=\"sign\"></div><div class=\"txt\">three</div></div><div class=\"row equal\"><div class=\"num\"><span>4</span><span>3</span></div><div class=\"sign\"></div><div class=\"txt\">four five six</div></div><div class=\"row add hstart moved\" data-htype=\"add\" data-hline=\"4\"><div class=\"num\"><span></span><span>4</span></div><div class=\"sign\">+</div><div class=\"txt\">one <span class=\"movetag\" title=\"This line was moved, not added or removed\">↕ moved from line 1</span></div></div>",
 "moved-line::split": "<div class=\"srow hstart\" data-htype=\"del\" data-hline=\"1\"><div class=\"scol del moved\"><div class=\"snum\">1</div><div class=\"stxt\">one <span class=\"movetag\" title=\"This line was moved, not added or removed\">↕ moved to line 4</span></div></div><div class=\"scol blank b\"><div class=\"snum\"></div><div class=\"stxt\"></div></div></div><div class=\"srow\"><div class=\"scol equal\"><div class=\"snum\">2</div><div class=\"stxt\">two</div></div><div class=\"scol equal b\"><div class=\"snum\">1</div><div class=\"stxt\">two</div></div></div><div class=\"srow\"><div class=\"scol equal\"><div class=\"snum\">3</div><div class=\"stxt\">three</div></div><div class=\"scol equal b\"><div class=\"snum\">2</div><div class=\"stxt\">three</div></div></div><div class=\"srow\"><div class=\"scol equal\"><div class=\"snum\">4</div><div class=\"stxt\">four five six</div></div><div class=\"scol equal b\"><div class=\"snum\">3</div><div class=\"stxt\">four five six</div></div></div><div class=\"srow hstart\" data-htype=\"add\" data-hline=\"4\"><div class=\"scol blank\"><div class=\"snum\"></div><div class=\"stxt\"></div></div><div class=\"scol add b moved\"><div class=\"snum\">4</div><div class=\"stxt\">one <span class=\"movetag\" title=\"This line was moved, not added or removed\">↕ moved from line 1</span></div></div></div>",
 "moved-line::inline": "<div class=\"row del hstart moved\" data-htype=\"del\" data-hline=\"1\"><div class=\"num\"><span>1</span><span></span></div><div class=\"sign\">−</div><div class=\"txt\">one <span class=\"movetag\" title=\"This line was moved, not added or removed\">↕ moved to line 4</span></div></div><div class=\"row equal\"><div class=\"num\"><span>2</span><span>1</span></div><div class=\"sign\"></div><div class=\"txt\">two</div></div><div class=\"row equal\"><div class=\"num\"><span>3</span><span>2</span></div><div class=\"sign\"></div><div class=\"txt\">three</div></div><div class=\"row equal\"><div class=\"num\"><span>4</span><span>3</span></div><div class=\"sign\"></div><div class=\"txt\">four five six</div></div><div class=\"row add hstart moved\" data-htype=\"add\" data-hline=\"4\"><div class=\"num\"><span></span><span>4</span></div><div class=\"sign\">+</div><div class=\"txt\">one <span class=\"movetag\" title=\"This line was moved, not added or removed\">↕ moved from line 1</span></div></div>",
 "empty-vs-text::unified": "<div class=\"row change hstart\" data-htype=\"change\" data-hline=\"1\"><div class=\"num\"><span>1</span><span></span></div><div class=\"sign\">−</div><div class=\"txt\"></div></div><div class=\"row change\"><div class=\"num\"><span></span><span>1</span></div><div class=\"sign\">+</div><div class=\"txt\"><ins>solo</ins></div></div>",
 "empty-vs-text::split": "<div class=\"srow hstart\" data-htype=\"change\" data-hline=\"1\"><div class=\"scol chg\"><div class=\"snum\">1</div><div class=\"stxt\"></div></div><div class=\"scol chg b\"><div class=\"snum\">1</div><div class=\"stxt\"><ins>solo</ins></div></div></div>",
 "empty-vs-text::inline": "<div class=\"row change hstart\" data-htype=\"change\" data-hline=\"1\"><div class=\"num\"><span>1</span><span>1</span></div><div class=\"sign\">~</div><div class=\"txt\"><ins>solo</ins></div></div>",
 "identical::unified": "<div class=\"placeholder\"><span class=\"big\">✓ The two texts are identical.</span></div>",
 "identical::split": "<div class=\"placeholder\"><span class=\"big\">✓ The two texts are identical.</span></div>",
 "identical::inline": "<div class=\"placeholder\"><span class=\"big\">✓ The two texts are identical.</span></div>"
}
codex
金样文件本身确实字节一致，但那只证明 18 个 `result.innerHTML` 快照一致；还不能替代对导出、文件加载、错误边界、历史存储等胶水面的覆盖判断。我现在补读 smoke 关键段。
exec
/bin/zsh -lc "sed -n '1,260p' tests/smoke.mjs" in /Users/zero/MyCode/diff-lens
exec
/bin/zsh -lc "sed -n '261,460p' tests/smoke.mjs" in /Users/zero/MyCode/diff-lens
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
process.exit(fail ? 1 : 0);

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
  for (const f of ["compare.html", "app.css", "app.js", "diff.js", "history.js", "background.js"]) {
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
/bin/zsh -lc "sed -n '1,220p' refactors/app-js-split/golden-capture.mjs" in /Users/zero/MyCode/diff-lens
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
];
const VIEWS = ["unified", "split", "inline"];
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(page_url);
const golden = {};
for (const c of CASES) {
  await page.evaluate(({ a, b, opts }) => {
    document.getElementById("text-a").value = a;
    document.getElementById("text-b").value = b;
    document.getElementById("opt-blank").checked = !!(opts && opts.blank);
    document.getElementById("opt-case").checked = !!(opts && opts.case);
    document.getElementById("opt-ws").checked = false;
    document.getElementById("opt-char").checked = false;
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

codex
覆盖面已经清楚不少了。最后一轮我会按用户的五个问题做“证据闭环”：给出具体文件/行号、能触发的失败场景；如果没有能落地的失败场景，就明确写零发现，同时把验证盲区单列为风险而不是伪造 bug。
exec
/bin/zsh -lc "nl -ba app.js | sed -n '1,320p'" in /Users/zero/MyCode/diff-lens
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
   121	  optWrap.addEventListener("change", () => { result.classList.toggle("wrap", optWrap.checked); nav.renderPips(); persistOpts(); });
   122	  if (optWsShow) optWsShow.addEventListener("change", () => { showWs = optWsShow.checked; render(); persistOpts(); });
   123	  // 窗口宽度变化在 wrap 下同样改写几何。只重定位（renderPips），不重算 diff——
   124	  // 与输入的 schedule() 防抖分开：resize 不该触发引擎重跑。
   125	  let rt;
   126	  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(nav.renderPips, 120); });
   127	  if (optFold) optFold.addEventListener("change", () => { fold = optFold.checked; render(); persistOpts(); });
   128	  // Expand a collapsed band when its placeholder is clicked.
   129	  result.addEventListener("click", (e) => {
   130	    const b = e.target.closest(".foldbtn");
   131	    if (!b) return;
   132	    expandedFolds.add(b.dataset.fold);
   133	    render();
   134	  });
   135	  $("swap").addEventListener("click", () => {
   136	    const tmp = ta.value; ta.value = tb.value; tb.value = tmp; render(); persist();
   137	  });
   138	  $("copy").addEventListener("click", exp.copyResult);
   139	  { const e = $("copy-diff"); if (e) e.addEventListener("click", exp.copyUnified); }
   140	  { const e = $("copy-md"); if (e) e.addEventListener("click", exp.copyMarkdown); }
   141	  { const e = $("dl-patch"); if (e) e.addEventListener("click", exp.downloadPatch); }
   142	  { const e = $("hist-save"); if (e) e.addEventListener("click", histUI.saveCurrent); }
   143	  { const box = $("hist-list"); if (box) box.addEventListener("click", (e) => {
   144	      const r = e.target.closest("[data-restore]");
   145	      const d = e.target.closest("[data-del]");
   146	      if (!r && !d) return;
   147	      // Stop the document outside-click handler from running: re-rendering the list
   148	      // below detaches the clicked node, which would make its contains() check fail
   149	      // and spuriously close the menu. (Delete keeps the menu open to remove several.)
   150	      e.stopPropagation();
   151	      if (r) histUI.restoreHist(r.dataset.restore);
   152	      else histUI.delHist(d.dataset.del);
   153	    }); }
   154	  // Clickable stats: clicking the +added / −removed / ≈minor counts jumps to the
   155	  // first difference so the numbers double as navigation.
   156	  stats.addEventListener("click", (e) => {
   157	    if (!e.target.closest(".add, .del, .minorc")) return;
   158	    nav.jumpTo(0);
   159	  });
   160	  // Close any open dropdown menu on an outside click. (Clicking one summary lands
   161	  // outside the other, so this also keeps them mutually exclusive.)
   162	  document.addEventListener("click", (e) => {
   163	    ["export", "history"].forEach((id) => {
   164	      const d = $(id);
   165	      if (d && d.open && !d.contains(e.target)) d.open = false;
   166	    });
   167	  });
   168	  if (navPrev) navPrev.addEventListener("click", () => nav.jump(-1));
   169	  if (navNext) navNext.addEventListener("click", () => nav.jump(1));
   170	  // pip 点击跳转：委托一个监听，复用 stats 点击的既有模式（内部 hunkIdx = i-1 再 jump(1)）。
   171	  if (pipRail) pipRail.addEventListener("click", (e) => {
   172	    const p = e.target.closest("[data-pip]");
   173	    if (!p) return;
   174	    nav.jumpTo(Number(p.dataset.pip));
   175	  });
   176	  document.addEventListener("keydown", (e) => {
   177	    if (e.key === "Escape") {
   178	      let closed = false;
   179	      ["export", "history"].forEach((id) => { const d = $(id); if (d && d.open) { d.open = false; closed = true; } });
   180	      if (closed) return;
   181	    }
   182	    if (!e.altKey) return;
   183	    if (e.key === "ArrowDown") { e.preventDefault(); nav.jump(1); }
   184	    else if (e.key === "ArrowUp") { e.preventDefault(); nav.jump(-1); }
   185	  });
   186	  document.querySelectorAll("[data-view]").forEach((btn) => {
   187	    btn.addEventListener("click", () => {
   188	      view = btn.dataset.view;
   189	      document.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("on", b === btn));
   190	      result.classList.toggle("split", view === "split");
   191	      render(); persistOpts();
   192	    });
   193	  });
   194	  document.querySelectorAll("[data-clear]").forEach((btn) => {
   195	    btn.addEventListener("click", () => {
   196	      (btn.dataset.clear === "a" ? ta : tb).value = ""; render(); persist();
   197	    });
   198	  });
   199	
   200	  // --- local file loading (drag-drop or "open file…") — wiring only; logic in ui-file ---
   201	  document.querySelectorAll("[data-file]").forEach((btn) => {
   202	    btn.addEventListener("click", () => { const inp = $("file-" + btn.dataset.file); if (inp) inp.click(); });
   203	  });
   204	  ["a", "b"].forEach((which) => {
   205	    const inp = $("file-" + which);
   206	    if (inp) inp.addEventListener("change", (e) => { fileUI.loadFile(e.target.files[0], which); inp.value = ""; });
   207	    const el = fileUI.paneEl(which);
   208	    el.addEventListener("dragover", (e) => { e.preventDefault(); el.classList.add("dragover"); });
   209	    el.addEventListener("dragleave", () => el.classList.remove("dragover"));
   210	    el.addEventListener("drop", (e) => {
   211	      e.preventDefault(); el.classList.remove("dragover");
   212	      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
   213	      if (f) fileUI.loadFile(f, which);
   214	    });
   215	  });
   216	  const fmtBtn = $("fmt-json");
   217	  if (fmtBtn) fmtBtn.addEventListener("click", () => {
   218	    const a = fileUI.formatPane("a"), b = fileUI.formatPane("b");
   219	    render(); persist();
   220	    if (!a && !b) stats.textContent = "No valid JSON to format on either side.";
   221	    else if (!a || !b) stats.textContent = "Formatted the valid JSON side; the other isn’t valid JSON.";
   222	  });
   223	
   224	  // --- persistence: remember panes + options + pick up right-click captures ---
   225	  function persist() {
   226	    if (hasChrome) chrome.storage.local.set({ textA: ta.value, textB: tb.value });
   227	  }
   228	  function persistOpts() {
   229	    if (hasChrome) chrome.storage.local.set({
   230	      ignoreWhitespace: optWs.checked, ignoreCase: optCase.checked,
   231	      ignoreBlankLines: optBlank.checked, charLevel: optChar.checked,
   232	      showWhitespace: showWs, wordWrap: optWrap.checked, view: view,
   233	      foldUnchanged: fold,
   234	    });
   235	  }
   236	  function boot() {
   237	    if (!hasChrome) { render(); histUI.renderHistList(); return; }
   238	    chrome.storage.local.get(
   239	      ["textA", "textB", "ignoreWhitespace", "ignoreCase", "ignoreBlankLines", "charLevel", "showWhitespace", "wordWrap", "view", "foldUnchanged", "history"],
   240	      (s) => {
   241	        if (typeof s.textA === "string") ta.value = s.textA;
   242	        if (typeof s.textB === "string") tb.value = s.textB;
   243	        if (typeof s.ignoreWhitespace === "boolean") optWs.checked = s.ignoreWhitespace;
   244	        if (typeof s.ignoreCase === "boolean") optCase.checked = s.ignoreCase;
   245	        if (typeof s.ignoreBlankLines === "boolean") optBlank.checked = s.ignoreBlankLines;
   246	        if (typeof s.charLevel === "boolean") optChar.checked = s.charLevel;
   247	        if (typeof s.showWhitespace === "boolean" && optWsShow) { optWsShow.checked = s.showWhitespace; showWs = s.showWhitespace; }
   248	        if (typeof s.foldUnchanged === "boolean" && optFold) { optFold.checked = s.foldUnchanged; fold = s.foldUnchanged; }
   249	        if (typeof s.wordWrap === "boolean") optWrap.checked = s.wordWrap;
   250	        if (s.view === "split" || s.view === "unified" || s.view === "inline") view = s.view;
   251	        result.classList.toggle("wrap", optWrap.checked);
   252	        result.classList.toggle("split", view === "split");
   253	        document.querySelectorAll("[data-view]").forEach((b) => b.classList.toggle("on", b.dataset.view === view));
   254	        if (Array.isArray(s.history)) historyList = s.history;
   255	        if (chrome.action && chrome.action.setBadgeText) chrome.action.setBadgeText({ text: "" });
   256	        render();
   257	        histUI.renderHistList();
   258	      }
   259	    );
   260	    chrome.storage.onChanged.addListener((changes, area) => {
   261	      if (area !== "local") return;
   262	      let touched = false;
   263	      if (changes.textA && ta.value !== changes.textA.newValue) { ta.value = changes.textA.newValue || ""; touched = true; }
   264	      if (changes.textB && tb.value !== changes.textB.newValue) { tb.value = changes.textB.newValue || ""; touched = true; }
   265	      if (touched) render();
   266	    });
   267	  }
   268	  boot();
   269	})();

exec
/bin/zsh -lc 'for f in ui-render.js ui-nav.js ui-export.js ui-history.js ui-file.js compare.html package.mjs; do echo "===== $f ====="; nl -ba "$f" | sed -n '"'1,260p'; done" in /Users/zero/MyCode/diff-lens
 succeeded in 0ms:
===== ui-render.js =====
     1	// DiffLens render module — pure HTML string builders for the three diff views. No DOM reads,
     2	// no chrome.*, no network, no state: callers pass an options bag ({ showWs }) explicitly.
     3	(function (root) {
     4	  "use strict";
     5	
     6	  function esc(s) {
     7	    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
     8	  }
     9	  // Escape + (optionally) reveal whitespace as faint glyphs — BC-style.
    10	  function fmt(s, showWs) {
    11	    let h = esc(s);
    12	    if (showWs) {
    13	      h = h.replace(/\t/g, '<span class="ws">→</span>').replace(/ /g, '<span class="ws">·</span>');
    14	    }
    15	    return h;
    16	  }
    17	  function renderWords(words, showWs) {
    18	    return words.map((w) => {
    19	      const t = fmt(w.text, showWs);
    20	      if (w.type === "del") return "<del>" + t + "</del>";
    21	      if (w.type === "add") return "<ins>" + t + "</ins>";
    22	      return t;
    23	    }).join("");
    24	  }
    25	  // Inline badge marking a moved line and where its partner lives.
    26	  function moveTag(dir, n) {
    27	    return ' <span class="movetag" title="This line was moved, not added or removed">↕ moved ' + dir + " line " + n + "</span>";
    28	  }
    29	
    30	  // 两个 span 之间不留字面空格——.num 用 flex gap 控距，字面空格会额外撑开一格。
    31	  function numCell(a, b) {
    32	    return '<div class="num"><span>' + (a == null ? "" : a) + '</span><span>' + (b == null ? "" : b) + "</span></div>";
    33	  }
    34	  function urow(cls, sign, aNum, bNum, inner, attrs) {
    35	    return '<div class="row ' + cls + '"' + (attrs || "") + '>' + numCell(aNum, bNum) + '<div class="sign">' + sign + '</div><div class="txt">' + inner + "</div></div>";
    36	  }
    37	  // pip 轨道消费的视图无关元数据，盖在每个 hunk 的首行上。轨道只读 dataset，
    38	  // 不读各视图的 DOM 细节（split 的类型类在子节点上，按 classList 读会拿不到）。
    39	  function hmeta(type, line) {
    40	    return ' data-htype="' + type + '" data-hline="' + (line == null ? "" : line) + '"';
    41	  }
    42	  // Single-column rows shared by Unified and Inline — the ONLY difference is how a
    43	  // CHANGE renders: Unified shows two rows (− old / + new); Inline shows one row with
    44	  // the original text and the edits marked in place (strike-through + insert).
    45	  // A collapsed band of unchanged lines — full-width, click to expand.
    46	  function foldRowHtml(r) {
    47	    return '<div class="row fold"><button class="foldbtn" type="button" data-fold="' + esc(r.key) +
    48	      '" title="Show the hidden lines">⋯ ' + r.count + " unchanged lines · expand ⋯</button></div>";
    49	  }
    50	  function renderColumn(out, inlineChange, showWs) {
    51	    const html = []; let prevImp = false;
    52	    for (const r of out.rows) {
    53	      if (r.type === "fold") { html.push(foldRowHtml(r)); prevImp = false; continue; }
    54	      const imp = r.type === "del" || r.type === "add" || r.type === "change";
    55	      const hs = imp && !prevImp ? " hstart" : "";
    56	      if (r.type === "equal") html.push(urow("equal", "", r.aNum, r.bNum, fmt(r.text, showWs)));
    57	      else if (r.type === "minor") html.push(urow("minor", "≈", r.aNum, r.bNum, renderWords(inlineChange ? r.words : r.bWords, showWs)));
    58	      else if (r.type === "del") html.push(urow("del" + hs + (r.moved ? " moved" : ""), "−", r.aNum, null, fmt(r.text, showWs) + (r.moved ? moveTag("to", r.movePartnerNum) : ""), hs ? hmeta("del", r.aNum) : ""));
    59	      else if (r.type === "add") html.push(urow("add" + hs + (r.moved ? " moved" : ""), "+", null, r.bNum, fmt(r.text, showWs) + (r.moved ? moveTag("from", r.movePartnerNum) : ""), hs ? hmeta("add", r.bNum) : ""));
    60	      else if (r.type === "change") {
    61	        if (inlineChange) {
    62	          html.push(urow("change" + hs, "~", r.aNum, r.bNum, renderWords(r.words, showWs), hs ? hmeta("change", r.aNum) : ""));
    63	        } else {
    64	          html.push(urow("change" + hs, "−", r.aNum, null, renderWords(r.aWords, showWs), hs ? hmeta("change", r.aNum) : ""));
    65	          html.push(urow("change", "+", null, r.bNum, renderWords(r.bWords, showWs)));
    66	        }
    67	      }
    68	      prevImp = imp;
    69	    }
    70	    return html.join("");
    71	  }
    72	  function renderUnified(out, opts) { return renderColumn(out, false, !!(opts && opts.showWs)); }
    73	  function renderInline(out, opts) { return renderColumn(out, true, !!(opts && opts.showWs)); }
    74	  function scol(cls, num, inner) {
    75	    return '<div class="scol ' + cls + '"><div class="snum">' + (num == null ? "" : num) + '</div><div class="stxt">' + inner + "</div></div>";
    76	  }
    77	  function renderSplit(out, opts) {
    78	    const showWs = !!(opts && opts.showWs);
    79	    const html = []; let prevImp = false;
    80	    for (const r of out.rows) {
    81	      if (r.type === "fold") { html.push(foldRowHtml(r)); prevImp = false; continue; }
    82	      const imp = r.type === "del" || r.type === "add" || r.type === "change";
    83	      const hs = imp && !prevImp ? " hstart" : "";
    84	      // 右栏必须带 class "b" —— .scol.b 是两栏之间的分隔竖线。
    85	      // （此前一直漏加，导致 app.css 的 .scol.b 规则从未生效、split 视图无分栏线。）
    86	      let left, right;
    87	      if (r.type === "equal") {
    88	        left = scol("equal", r.aNum, fmt(r.text, showWs)); right = scol("equal b", r.bNum, fmt(r.text, showWs));
    89	      } else if (r.type === "minor") {
    90	        left = scol("minor", r.aNum, renderWords(r.aWords, showWs)); right = scol("minor b", r.bNum, renderWords(r.bWords, showWs));
    91	      } else if (r.type === "del") {
    92	        left = scol("del" + (r.moved ? " moved" : ""), r.aNum, fmt(r.text, showWs) + (r.moved ? moveTag("to", r.movePartnerNum) : "")); right = scol("blank b", null, "");
    93	      } else if (r.type === "add") {
    94	        left = scol("blank", null, ""); right = scol("add b" + (r.moved ? " moved" : ""), r.bNum, fmt(r.text, showWs) + (r.moved ? moveTag("from", r.movePartnerNum) : ""));
    95	      } else { // change
    96	        left = scol("chg", r.aNum, renderWords(r.aWords, showWs)); right = scol("chg b", r.bNum, renderWords(r.bWords, showWs));
    97	      }
    98	      html.push('<div class="srow' + hs + '"' + (hs ? hmeta(r.type, r.type === "add" ? r.bNum : r.aNum) : "") + '>' + left + right + "</div>");
    99	      prevImp = imp;
   100	    }
   101	    return html.join("");
   102	  }
   103	
   104	  // 导出面 = 实际消费面（RULEBOOK §1）：esc 供 app.js 的错误边界与历史列表复用，
   105	  // 三个渲染入口收 { showWs } options bag；其余 9 个助手为模块私有。
   106	  root.DiffLensRender = { esc, renderUnified, renderInline, renderSplit };
   107	})(typeof window !== "undefined" ? window : globalThis);
   108	// REFACTOR STATUS: confidence=high todos=0
===== ui-nav.js =====
     1	// DiffLensNav — hunk 索引/上下跳转/pip 轨道（自 app.js 原样迁出）。No network calls.
     2	// 有状态模块：拥有 hunks/hunkIdx；DOM 引用经 init(ctx) 注入（RULEBOOK R1）。
     3	// 事件绑定一律留在 app.js（R6）——本模块只暴露被绑定/被编排调用的函数。
     4	// 与 ui-render 的唯一接口是 hunk 首行的 data-htype/data-hline dataset（R4），
     5	// 轨道只读 dataset，不读各视图的 DOM 细节。
     6	(function (root) {
     7	  "use strict";
     8	
     9	  // ctx: { result, pipRail, navPrev, navNext, navCount } —— 均为 app.js 顶部缓存的元素引用。
    10	  // navPrev/pipRail 可能为 null（页面变体没有该控件），各函数保留原有的存在性守卫。
    11	  function init(ctx) {
    12	    const result = ctx.result;
    13	    const pipRail = ctx.pipRail;
    14	    const navPrev = ctx.navPrev, navNext = ctx.navNext, navCount = ctx.navCount;
    15	    let hunks = [], hunkIdx = -1;
    16	
    17	    // --- difference navigation (BC-style next/prev) ---
    18	    function indexHunks() {
    19	      hunks = [].slice.call(result.querySelectorAll(".hstart"));
    20	      hunkIdx = -1;
    21	      updateNav();
    22	      renderPips();
    23	    }
    24	    function updateNav() {
    25	      if (!navPrev) return;
    26	      const n = hunks.length;
    27	      navPrev.disabled = n === 0; navNext.disabled = n === 0;
    28	      navCount.textContent = n === 0 ? "—" : (hunkIdx < 0 ? (n + (n === 1 ? " diff" : " diffs")) : (hunkIdx + 1) + " / " + n);
    29	      // 显隐挂在这里：hunks 状态的唯一汇聚点，错误态（render 边界置空 hunks）也会路过。
    30	      if (pipRail) pipRail.classList.toggle("hidden", n === 0);
    31	    }
    32	    // F-044 改动色标：轨道上每个 pip 对应一个 hunk，位置按文档相对高度铺排。
    33	    // 类型与行号读 hunk 首行的 data-htype/data-hline（视图无关），不碰用户文本。
    34	    function renderPips() {
    35	      if (!pipRail) return;
    36	      if (!hunks.length) { pipRail.innerHTML = ""; return; }
    37	      // 先把几何一次读完，再开始写 DOM——读写交错会让每次迭代都强制同步布局，
    38	      // 大 diff 下 wrap/resize 一次就是一串 reflow。
    39	      const total = result.scrollHeight || 1;
    40	      const tops = hunks.map((h) => ((h.offsetTop / total) * 100).toFixed(2) + "%");
    41	      // innerHTML 重建会销毁真实键盘焦点：记下焦点停在哪个 pip，重建后还给同一序号。
    42	      const ae = document.activeElement;
    43	      const focusIdx = ae && pipRail.contains(ae) && ae.dataset && ae.dataset.pip != null ? Number(ae.dataset.pip) : -1;
    44	      const NAME = { add: "added", del: "removed", change: "changed" };
    45	      const html = [];
    46	      for (let i = 0; i < hunks.length; i++) {
    47	        const type = hunks[i].dataset.htype || "change";
    48	        const line = hunks[i].dataset.hline || "";
    49	        const label = (NAME[type] || "changed") + (line ? " · line " + line : "");
    50	        html.push('<button type="button" class="pip ' + (NAME[type] ? type : "change") +
    51	          '" data-pip="' + i + '" title="' + label + '" aria-label="Jump to ' + label + '"></button>');
    52	      }
    53	      pipRail.innerHTML = html.join("");
    54	      const kids = pipRail.children;
    55	      for (let i = 0; i < kids.length; i++) {
    56	        // 几何是数据不是样式：仅 top 由 JS 写入，颜色与形态全部留在 app.css
    57	        //（specs 技术决策 1 对「禁内联 style」的显式豁免，范围仅此一个属性）。
    58	        kids[i].style.top = tops[i];
    59	      }
    60	      // 幂等复原当前态：任何原因重建轨道（wrap 切换、resize）后不丢 .current。
    61	      if (hunkIdx >= 0 && kids[hunkIdx]) kids[hunkIdx].classList.add("current");
    62	      if (focusIdx >= 0 && kids[focusIdx]) kids[focusIdx].focus({ preventScroll: true });
    63	    }
    64	    function jump(dir) {
    65	      if (!hunks.length) return;
    66	      if (hunkIdx < 0) hunkIdx = dir > 0 ? 0 : hunks.length - 1;
    67	      else hunkIdx = (hunkIdx + dir + hunks.length) % hunks.length;
    68	      hunks.forEach((h) => h.classList.remove("jumped"));
    69	      const el = hunks[hunkIdx];
    70	      el.classList.add("jumped");
    71	      el.scrollIntoView({ block: "center" });
    72	      if (pipRail) {
    73	        const ps = pipRail.children;
    74	        for (let i = 0; i < ps.length; i++) ps[i].classList.toggle("current", i === hunkIdx);
    75	      }
    76	      updateNav();
    77	    }
    78	
    79	    // 状态归本模块后，app.js 里两处直接改 hunks/hunkIdx 的编排代码需要入口——
    80	    // 以下两个薄封装逐语句对应原调用点，不引入新行为：
    81	    // reset()：render() 错误边界的「hunks=[]; hunkIdx=-1; updateNav();」三连。
    82	    // 注意错误态只 updateNav 不 renderPips（隐藏轨道但不清空其 DOM），保持原语义。
    83	    function reset() {
    84	      hunks = []; hunkIdx = -1; updateNav();
    85	    }
    86	    // jumpTo(i)：stats/pip 点击的既有模式「hunkIdx = i - 1 再 jump(1)」。
    87	    // stats 点击等价于 jumpTo(0)；pip 点击传 Number(p.dataset.pip)。
    88	    // !hunks.length 守卫从原绑定处内移，空态下同样不发生任何状态变更。
    89	    function jumpTo(i) {
    90	      if (!hunks.length) return;
    91	      hunkIdx = i - 1;
    92	      jump(1);
    93	    }
    94	
    95	    // 导出面=实际消费面（RULEBOOK §1 v2 先例）：updateNav 仅被模块内部调用，保持私有。
    96	    return { indexHunks, renderPips, jump, jumpTo, reset };
    97	  }
    98	
    99	  root.DiffLensNav = init;
   100	})(typeof window !== "undefined" ? window : globalThis);
   101	// REFACTOR STATUS: confidence=high todos=0
===== ui-export.js =====
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
===== ui-history.js =====
     1	// DiffLens history UI — saved-comparisons list rendering + save/restore/delete actions.
     2	// No network, no dependencies, and no chrome.* (storage writes stay in app.js, R3);
     3	// list state (historyList) lives in app.js and is reached only through ctx accessors.
     4	(function (root) {
     5	  "use strict";
     6	
     7	  // ctx contract (everything is injected by app.js — modules never reference each
     8	  // other directly, R1):
     9	  //   ta, tb                          — the two input <textarea>s
    10	  //   stats                           — status-bar element for user-facing messages
    11	  //   histList                        — #hist-list container the list renders into
    12	  //   histSave                        — #hist-save button (flash target after saving)
    13	  //   histMenu                        — #history <details> dropdown (closed on restore)
    14	  //   esc                             — HTML escaper, forwarded from DiffLensRender
    15	  //   hist                            — pure list helpers, forwarded from
    16	  //                                     DiffLensHistory (preview/tooLarge/add/remove)
    17	  //   getHistoryList, setHistoryList  — historyList stays owned by app.js (§1)
    18	  //   persistHistory                  — chrome.storage write, kept in app.js (R3)
    19	  //   flashBtn                        — button feedback helper, forwarded from ui-export
    20	  //   render, persist                 — orchestration entry points (restore re-renders)
    21	  function init(ctx) {
    22	    const ta = ctx.ta, tb = ctx.tb, stats = ctx.stats;
    23	    const histList = ctx.histList, histSave = ctx.histSave, histMenu = ctx.histMenu;
    24	    const esc = ctx.esc, H = ctx.hist;
    25	
    26	    function relTime(ts) {
    27	      const s = Math.max(0, (Date.now() - ts) / 1000);
    28	      if (s < 60) return "just now";
    29	      const m = Math.floor(s / 60); if (m < 60) return m + "m ago";
    30	      const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
    31	      return Math.floor(h / 24) + "d ago";
    32	    }
    33	    function renderHistList() {
    34	      const box = histList;
    35	      if (!box) return;
    36	      const list = ctx.getHistoryList();
    37	      if (!list.length) { box.innerHTML = '<div class="hist-empty">No saved comparisons yet.</div>'; return; }
    38	      box.innerHTML = list.map((e) =>
    39	        '<div class="hist-item">' +
    40	          '<button class="hist-restore" type="button" data-restore="' + esc(e.id) + '" title="Restore this comparison">' +
    41	            '<span class="hist-prev">' + esc(e.preview) + "</span>" +
    42	            '<span class="hist-time">' + esc(relTime(e.ts)) + "</span>" +
    43	          "</button>" +
    44	          '<button class="hist-del" type="button" data-del="' + esc(e.id) + '" title="Delete" aria-label="Delete saved comparison">✕</button>' +
    45	        "</div>"
    46	      ).join("");
    47	    }
    48	    function saveCurrent() {
    49	      const a = ta.value, b = tb.value;
    50	      if (a === "" && b === "") { stats.textContent = "Nothing to save yet — paste or type some text first."; return; }
    51	      if (H.tooLarge(a, b)) { stats.textContent = "This comparison is too large to save to history."; return; }
    52	      const entry = { id: String(Date.now()) + "-" + Math.floor(Math.random() * 1e6), ts: Date.now(), a: a, b: b, preview: H.preview(a, b) };
    53	      ctx.setHistoryList(H.add(ctx.getHistoryList(), entry));
    54	      ctx.persistHistory(); renderHistList();
    55	      ctx.flashBtn(histSave, "Saved ✓");
    56	    }
    57	    function restoreHist(id) {
    58	      const e = ctx.getHistoryList().find((x) => x.id === id);
    59	      if (!e) return;
    60	      ta.value = e.a; tb.value = e.b; ctx.render(); ctx.persist();
    61	      if (histMenu) histMenu.open = false;
    62	    }
    63	    function delHist(id) {
    64	      ctx.setHistoryList(H.remove(ctx.getHistoryList(), id));
    65	      ctx.persistHistory(); renderHistList();
    66	    }
    67	
    68	    // Export face = actual consumption face: app.js binds these four (R6). relTime
    69	    // is only consumed by renderHistList, so it stays private.
    70	    return { renderHistList: renderHistList, saveCurrent: saveCurrent, restoreHist: restoreHist, delHist: delHist };
    71	  }
    72	
    73	  // R1 (v2): factory form for stateful/DOM-holding UI modules. Deliberately NOT
    74	  // DiffLensHistory — that global is already taken by the pure helpers in history.js.
    75	  root.DiffLensHistUI = init;
    76	})(typeof window !== "undefined" ? window : globalThis);
    77	// REFACTOR STATUS: confidence=high todos=0
===== ui-file.js =====
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
===== compare.html =====
     1	<!DOCTYPE html>
     2	<html lang="en">
     3	<head>
     4	  <meta charset="utf-8" />
     5	  <meta name="viewport" content="width=device-width, initial-scale=1" />
     6	  <link rel="stylesheet" href="app.css" />
     7	  <title>DiffLens — Compare Text</title>
     8	</head>
     9	<body>
    10	<div class="app">
    11	  <header class="topbar">
    12	    <div class="brand">
    13	      <span class="mark" aria-hidden="true">≠</span>
    14	      <span class="wordmark">DiffLens</span>
    15	      <span class="privacy" title="Everything runs in this tab. Nothing is uploaded.">
    16	        <b>🔒 100% local</b>
    17	        <span>no upload · no account · no ads</span>
    18	      </span>
    19	    </div>
    20	    <div class="topacts">
    21	      <details class="menu" id="history">
    22	        <summary aria-haspopup="menu" title="Saved comparisons (local only)">History ▾</summary>
    23	        <div class="sheet histsheet" role="menu">
    24	          <button class="item" id="hist-save" role="menuitem">＋ Save current comparison</button>
    25	          <div class="hist-list" id="hist-list"></div>
    26	        </div>
    27	      </details>
    28	      <details class="menu" id="export">
    29	        <summary aria-haspopup="menu" title="Export the diff">Export ▾</summary>
    30	        <div class="sheet" role="menu">
    31	          <button class="item" id="copy" role="menuitem">Copy result (text)</button>
    32	          <button class="item" id="copy-diff" role="menuitem">Copy unified diff</button>
    33	          <button class="item" id="copy-md" role="menuitem">Copy as Markdown</button>
    34	          <button class="item" id="dl-patch" role="menuitem">Download .patch</button>
    35	        </div>
    36	      </details>
    37	    </div>
    38	  </header>
    39	
    40	  <section class="io">
    41	      <div class="pane">
    42	        <div class="pane-head">
    43	          <h2>Original (A)</h2>
    44	          <span class="pane-acts">
    45	            <button class="link" data-file="a">open file…</button>
    46	            <button class="link" data-clear="a">clear</button>
    47	          </span>
    48	        </div>
    49	        <textarea id="text-a" spellcheck="false" aria-label="Original text (A)"
    50	          placeholder="Paste, drop a file here, or right-click selected text on a page → set as Text A"></textarea>
    51	        <input type="file" id="file-a" hidden />
    52	      </div>
    53	
    54	      <div class="seam">
    55	        <button class="swap" id="swap" title="Swap A and B" aria-label="Swap A and B">⇄</button>
    56	      </div>
    57	
    58	      <div class="pane">
    59	        <div class="pane-head">
    60	          <h2>Changed (B)</h2>
    61	          <span class="pane-acts">
    62	            <button class="link" data-file="b">open file…</button>
    63	            <button class="link" data-clear="b">clear</button>
    64	          </span>
    65	        </div>
    66	        <textarea id="text-b" spellcheck="false" aria-label="Changed text (B)"
    67	          placeholder="Paste, drop a file here, or right-click → set as Text B"></textarea>
    68	        <input type="file" id="file-b" hidden />
    69	      </div>
    70	    </section>
    71	
    72	  <section class="optbar">
    73	    <!-- The group heading is what makes "Whitespace" mean *ignore* whitespace, so
    74	         it has to reach the accessibility tree too — otherwise this toggle and
    75	         "Show whitespace" below read as near-identical names doing opposite things. -->
    76	    <div class="group" role="group" aria-labelledby="g-ignore">
    77	      <span class="glabel" id="g-ignore">Ignore</span>
    78	      <label class="chk"><input type="checkbox" id="opt-ws" aria-label="Ignore whitespace" /> Whitespace</label>
    79	      <label class="chk"><input type="checkbox" id="opt-blank" aria-label="Ignore blank lines" /> Blank lines</label>
    80	      <label class="chk"><input type="checkbox" id="opt-case" aria-label="Ignore case" /> Case</label>
    81	    </div>
    82	    <div class="group" role="group" aria-labelledby="g-precision">
    83	      <span class="glabel" id="g-precision">Precision</span>
    84	      <label class="chk"><input type="checkbox" id="opt-char" /> Character level</label>
    85	      <button class="action" id="fmt-json" title="Parse, sort keys &amp; pretty-print both sides — a structural JSON compare that ignores key order &amp; formatting">{ }&nbsp;&nbsp;Format JSON</button>
    86	    </div>
    87	    <div class="group" role="group" aria-labelledby="g-display">
    88	      <span class="glabel" id="g-display">Display</span>
    89	      <label class="chk"><input type="checkbox" id="opt-ws-show" /> Show whitespace</label>
    90	      <label class="chk" title="Collapse long runs of unchanged lines (large files); click a band to expand"><input type="checkbox" id="opt-fold" /> Collapse unchanged</label>
    91	      <label class="chk"><input type="checkbox" id="opt-wrap" checked /> Word wrap</label>
    92	    </div>
    93	    <div class="seg" role="group" aria-label="View">
    94	      <button class="segbtn on" data-view="unified">Unified</button>
    95	      <button class="segbtn" data-view="split">Split</button>
    96	      <button class="segbtn" data-view="inline" title="Original text with changes marked inline">Inline</button>
    97	    </div>
    98	  </section>
    99	
   100	  <section class="stage">
   101	    <div id="result" class="result wrap" role="region" aria-label="Comparison result" aria-live="polite"></div>
   102	    <nav id="pip-rail" class="pip-rail hidden" aria-label="Change positions"></nav>
   103	  </section>
   104	
   105	  <footer class="statusbar">
   106	    <span id="stats" class="stats" title="Click the added / removed counts to jump to the first difference">Type or paste text in both boxes to compare.</span>
   107	    <div class="nav" role="group" aria-label="Jump between differences">
   108	      <span class="hint"><kbd>Alt</kbd><kbd>↑</kbd><kbd>↓</kbd></span>
   109	      <button id="nav-prev" class="navbtn" title="Previous difference (Alt+↑)" disabled>↑</button>
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
===== package.mjs =====
     1	// Build the Chrome Web Store upload zip — run with: node package.mjs
     2	//
     3	// The repo carries ~3 MB the extension never runs: design drafts, specs, store
     4	// screenshots, tests, docs. Zipping the folder ships all of it.
     5	//
     6	// PAYLOAD below is the whole answer to "what ships". It is written out, not
     7	// derived. An earlier version tried to derive it by regexing compare.html and
     8	// walking manifest fields; that read as clever and was not. It only matched
     9	// double-quoted attributes, so `src='app.js'` silently shipped a zip with no
    10	// main script. It knew four manifest fields, so a `default_locale` would have
    11	// shipped an extension Chrome refuses to install. It never normalised paths, so
    12	// `src="../secrets.js"` packed a file from outside the repo, contents and all,
    13	// and the verify step approved it. Enumerating a moving target (MV3's fields,
    14	// HTML's grammar) is a losing game; a list of eleven strings is not.
    15	//
    16	// A written list has one failure mode — forget to add a runtime file and ship a
    17	// broken extension. That is what the checks below are for, and the last one is
    18	// the only one that really counts: unpack the zip and run the real test suite
    19	// against it. Not a parse of what it should contain. The thing itself, running.
    20	import { readFileSync, existsSync, rmSync, mkdtempSync, cpSync, renameSync } from "node:fs";
    21	import { execFileSync } from "node:child_process";
    22	import { fileURLToPath } from "node:url";
    23	import { dirname, join, isAbsolute, normalize } from "node:path";
    24	import { tmpdir } from "node:os";
    25	
    26	process.chdir(dirname(fileURLToPath(import.meta.url)));
    27	
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
   136	  rmSync(tmp, { recursive: true, force: true });
   137	  rmSync(staging, { force: true });
   138	}

codex
代码侧还没发现能落成失败场景的行为回归。我补看仓库里现成的 review 记录，只把能被当前代码再次验证的点纳入结论，不照抄。
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

codex
零发现：我没在当前未提交代码里找到能落成具体失败场景的接线错误、夹带行为变更，或 R1/R3/R4 违规。`golden.json` 和 `golden-after.json` 我直接比过，字节完全一致，两个文件都是 9701 bytes。唯一偏差是 [delta-file.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-file.md:6) 还写着旧的 `.init` 形态，但落地代码 [app.js](/Users/zero/MyCode/diff-lens/app.js:49) / [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:52) 已按 RULEBOOK v3 的裸工厂实现；这是文档漂移，不是运行时问题。

1. `app.js` 编排层接线无错漏。`ui-render` 的 6 个调用点已改到 [app.js](/Users/zero/MyCode/diff-lens/app.js:57)、[app.js](/Users/zero/MyCode/diff-lens/app.js:87)、[app.js](/Users/zero/MyCode/diff-lens/app.js:88)、[app.js](/Users/zero/MyCode/diff-lens/app.js:89)；`ui-nav` 的实例化和所有调用点都按 [delta-nav.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-nav.md:21) 落地在 [app.js](/Users/zero/MyCode/diff-lens/app.js:38)、[app.js](/Users/zero/MyCode/diff-lens/app.js:60)、[app.js](/Users/zero/MyCode/diff-lens/app.js:71)、[app.js](/Users/zero/MyCode/diff-lens/app.js:98)、[app.js](/Users/zero/MyCode/diff-lens/app.js:121)、[app.js](/Users/zero/MyCode/diff-lens/app.js:126)、[app.js](/Users/zero/MyCode/diff-lens/app.js:158)、[app.js](/Users/zero/MyCode/diff-lens/app.js:168)、[app.js](/Users/zero/MyCode/diff-lens/app.js:174)、[app.js](/Users/zero/MyCode/diff-lens/app.js:183)；`ui-export` / `ui-history` / `ui-file` 绑定也都齐了，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:39)、[app.js](/Users/zero/MyCode/diff-lens/app.js:42)、[app.js](/Users/zero/MyCode/diff-lens/app.js:49)、[app.js](/Users/zero/MyCode/diff-lens/app.js:138)、[app.js](/Users/zero/MyCode/diff-lens/app.js:142)、[app.js](/Users/zero/MyCode/diff-lens/app.js:151)、[app.js](/Users/zero/MyCode/diff-lens/app.js:206)、[app.js](/Users/zero/MyCode/diff-lens/app.js:218)、[app.js](/Users/zero/MyCode/diff-lens/app.js:237)、[app.js](/Users/zero/MyCode/diff-lens/app.js:257)。

2. 没发现夹带行为变更。错误边界文案和 `nav.reset()` 语义与旧版三连一致，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:57) 和 [ui-nav.js](/Users/zero/MyCode/diff-lens/ui-nav.js:81)；导出按钮反馈、`1200ms`/`1000ms` 时序、空导出提示文案都保留，见 [ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:28)、[ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:46)、[ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:57)；历史保存/恢复/删除守卫和副作用顺序也没变，见 [ui-history.js](/Users/zero/MyCode/diff-lens/ui-history.js:48)。

3. 模块边界纪律没发现违规。R1 方面，跨模块共享只经 `app.js` 转发：`esc`/`flashBtn`/`DiffLensHistory` 都是 ctx 注入，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:42) 和 [ui-history.js](/Users/zero/MyCode/diff-lens/ui-history.js:7)。R3 方面，`chrome.*` 只剩 [app.js](/Users/zero/MyCode/diff-lens/app.js:25)、[app.js](/Users/zero/MyCode/diff-lens/app.js:41)、[app.js](/Users/zero/MyCode/diff-lens/app.js:226)、[app.js](/Users/zero/MyCode/diff-lens/app.js:238)、[app.js](/Users/zero/MyCode/diff-lens/app.js:260)。R4 方面，写侧仍由 [ui-render.js](/Users/zero/MyCode/diff-lens/ui-render.js:37) 产出 `data-htype/data-hline`，读侧仍由 [ui-nav.js](/Users/zero/MyCode/diff-lens/ui-nav.js:32) 只读 dataset。

4. 等价验证有 3 个关键盲区。`showWs` 真渲染路径没被金样覆盖：快照脚本从未打开 `opt-ws-show`，见 [golden-capture.mjs](/Users/zero/MyCode/diff-lens/refactors/app-js-split/golden-capture.mjs:35)，而这次重构恰好把它改成 `{ showWs }` 透传，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:87) 和 [ui-render.js](/Users/zero/MyCode/diff-lens/ui-render.js:72)。`ui-export` / `ui-file` 的实行为大盲区：smoke 只验导出菜单可见和 `Escape` 关闭，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:94)，从不点复制/下载，也不测 FileReader 成功/失败、5MB 守卫、拖放、`Format JSON`，而这些正是整块迁出的逻辑，见 [ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:15) 和 [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:12)。另外，smoke 的源码级隐私扫描还只扫旧文件集，不含 `ui-*.js`，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:63)；如果新模块里误加外链，68 绿也未必会报，得靠打包校验补上。

5. `compare.html` / `package.mjs` 的波及处理是完整的。[compare.html](/Users/zero/MyCode/diff-lens/compare.html:116) 已把 5 个 `ui-*.js` 放在 `diff.js`/`history.js` 之后、`app.js` 之前；[package.mjs](/Users/zero/MyCode/diff-lens/package.mjs:28) 也把 5 个新文件全加进 `PAYLOAD`，并且最终仍会对解包产物跑 smoke，见 [package.mjs](/Users/zero/MyCode/diff-lens/package.mjs:117)。这两处我没看到漏项。
tokens used
107,716
零发现：我没在当前未提交代码里找到能落成具体失败场景的接线错误、夹带行为变更，或 R1/R3/R4 违规。`golden.json` 和 `golden-after.json` 我直接比过，字节完全一致，两个文件都是 9701 bytes。唯一偏差是 [delta-file.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-file.md:6) 还写着旧的 `.init` 形态，但落地代码 [app.js](/Users/zero/MyCode/diff-lens/app.js:49) / [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:52) 已按 RULEBOOK v3 的裸工厂实现；这是文档漂移，不是运行时问题。

1. `app.js` 编排层接线无错漏。`ui-render` 的 6 个调用点已改到 [app.js](/Users/zero/MyCode/diff-lens/app.js:57)、[app.js](/Users/zero/MyCode/diff-lens/app.js:87)、[app.js](/Users/zero/MyCode/diff-lens/app.js:88)、[app.js](/Users/zero/MyCode/diff-lens/app.js:89)；`ui-nav` 的实例化和所有调用点都按 [delta-nav.md](/Users/zero/MyCode/diff-lens/refactors/app-js-split/delta-nav.md:21) 落地在 [app.js](/Users/zero/MyCode/diff-lens/app.js:38)、[app.js](/Users/zero/MyCode/diff-lens/app.js:60)、[app.js](/Users/zero/MyCode/diff-lens/app.js:71)、[app.js](/Users/zero/MyCode/diff-lens/app.js:98)、[app.js](/Users/zero/MyCode/diff-lens/app.js:121)、[app.js](/Users/zero/MyCode/diff-lens/app.js:126)、[app.js](/Users/zero/MyCode/diff-lens/app.js:158)、[app.js](/Users/zero/MyCode/diff-lens/app.js:168)、[app.js](/Users/zero/MyCode/diff-lens/app.js:174)、[app.js](/Users/zero/MyCode/diff-lens/app.js:183)；`ui-export` / `ui-history` / `ui-file` 绑定也都齐了，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:39)、[app.js](/Users/zero/MyCode/diff-lens/app.js:42)、[app.js](/Users/zero/MyCode/diff-lens/app.js:49)、[app.js](/Users/zero/MyCode/diff-lens/app.js:138)、[app.js](/Users/zero/MyCode/diff-lens/app.js:142)、[app.js](/Users/zero/MyCode/diff-lens/app.js:151)、[app.js](/Users/zero/MyCode/diff-lens/app.js:206)、[app.js](/Users/zero/MyCode/diff-lens/app.js:218)、[app.js](/Users/zero/MyCode/diff-lens/app.js:237)、[app.js](/Users/zero/MyCode/diff-lens/app.js:257)。

2. 没发现夹带行为变更。错误边界文案和 `nav.reset()` 语义与旧版三连一致，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:57) 和 [ui-nav.js](/Users/zero/MyCode/diff-lens/ui-nav.js:81)；导出按钮反馈、`1200ms`/`1000ms` 时序、空导出提示文案都保留，见 [ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:28)、[ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:46)、[ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:57)；历史保存/恢复/删除守卫和副作用顺序也没变，见 [ui-history.js](/Users/zero/MyCode/diff-lens/ui-history.js:48)。

3. 模块边界纪律没发现违规。R1 方面，跨模块共享只经 `app.js` 转发：`esc`/`flashBtn`/`DiffLensHistory` 都是 ctx 注入，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:42) 和 [ui-history.js](/Users/zero/MyCode/diff-lens/ui-history.js:7)。R3 方面，`chrome.*` 只剩 [app.js](/Users/zero/MyCode/diff-lens/app.js:25)、[app.js](/Users/zero/MyCode/diff-lens/app.js:41)、[app.js](/Users/zero/MyCode/diff-lens/app.js:226)、[app.js](/Users/zero/MyCode/diff-lens/app.js:238)、[app.js](/Users/zero/MyCode/diff-lens/app.js:260)。R4 方面，写侧仍由 [ui-render.js](/Users/zero/MyCode/diff-lens/ui-render.js:37) 产出 `data-htype/data-hline`，读侧仍由 [ui-nav.js](/Users/zero/MyCode/diff-lens/ui-nav.js:32) 只读 dataset。

4. 等价验证有 3 个关键盲区。`showWs` 真渲染路径没被金样覆盖：快照脚本从未打开 `opt-ws-show`，见 [golden-capture.mjs](/Users/zero/MyCode/diff-lens/refactors/app-js-split/golden-capture.mjs:35)，而这次重构恰好把它改成 `{ showWs }` 透传，见 [app.js](/Users/zero/MyCode/diff-lens/app.js:87) 和 [ui-render.js](/Users/zero/MyCode/diff-lens/ui-render.js:72)。`ui-export` / `ui-file` 的实行为大盲区：smoke 只验导出菜单可见和 `Escape` 关闭，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:94)，从不点复制/下载，也不测 FileReader 成功/失败、5MB 守卫、拖放、`Format JSON`，而这些正是整块迁出的逻辑，见 [ui-export.js](/Users/zero/MyCode/diff-lens/ui-export.js:15) 和 [ui-file.js](/Users/zero/MyCode/diff-lens/ui-file.js:12)。另外，smoke 的源码级隐私扫描还只扫旧文件集，不含 `ui-*.js`，见 [tests/smoke.mjs](/Users/zero/MyCode/diff-lens/tests/smoke.mjs:63)；如果新模块里误加外链，68 绿也未必会报，得靠打包校验补上。

5. `compare.html` / `package.mjs` 的波及处理是完整的。[compare.html](/Users/zero/MyCode/diff-lens/compare.html:116) 已把 5 个 `ui-*.js` 放在 `diff.js`/`history.js` 之后、`app.js` 之前；[package.mjs](/Users/zero/MyCode/diff-lens/package.mjs:28) 也把 5 个新文件全加进 `PAYLOAD`，并且最终仍会对解包产物跑 smoke，见 [package.mjs](/Users/zero/MyCode/diff-lens/package.mjs:117)。这两处我没看到漏项。
