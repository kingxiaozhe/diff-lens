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
