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
