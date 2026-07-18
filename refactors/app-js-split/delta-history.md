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
