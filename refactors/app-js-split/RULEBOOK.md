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
