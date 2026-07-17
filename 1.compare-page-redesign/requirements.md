# 对比页 UI 重做 — 需求规格

## 概述

把 DiffLens 对比页（`compare.html`）的页面骨架从「顶栏塞满选项 + 双输入 + 结果区」重做为「顶栏 / 输入 / 选项条 / 全宽结果区 / 底部状态栏」五段式工作台，并把语义色重挑为等感知亮度。**功能集不增不减**，PRD 的 F-001..F-043 行为全部保持。

## 项目信息

- 项目名: diff-lens
- 架构类型: Chrome MV3 扩展 / 单体前端（原生 JS，无框架、无构建、零依赖）
- 交付形态: 桌面宽屏 Web（扩展的全页标签页）
- 需求源: `docs/PRD.md`（43 条功能点 / 13 个状态 / 8 条硬约束）
- 设计基准: `design-baseline/baseline.html`（像素档，见 design.md）

## 需求版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-07-17 | v1 | 初始需求，源自 docs/PRD.md + 定案设计稿 |

## 用户故事

- 作为**长文对照的写作者**，我想在一屏里看到尽可能多的正文，以便少滚动——尤其在 split 视图下，横向每少 100px 就少约 6 个字符
- 作为**频繁切换忽略选项的用户**，我想让 7 个开关始终可见且不换行挤压，以便不必在窄窗口里找控件（现状：它们和品牌抢顶栏空间，窄窗即换行）
- 作为**色觉障碍或低对比环境的用户**，我想让三种改动类型的底色视觉重量相等，以便没有哪一类差异因为颜色更重而抢走注意力

## 功能需求

> 本 feature 不新增用户功能。以下是**结构性需求**；用户可感知功能以 `docs/PRD.md` 的 F-001..F-043 为准，且全部**必须保持不变**（见 AC-009）。

1. [R-001] 页面骨架为五段纵向网格：顶栏（40px）/ 输入区 / 选项条 / 结果区（占满剩余）/ 底部状态栏（30px）
2. [R-002] 7 个开关 + Format JSON 收入独立整行的选项条，按 **Ignore(3) / Precision(2) / Display(3)** 三组分隔；视图切换（Unified/Split/Inline）置于该条右端
3. [R-003] 统计行与差异跳转移入底部状态栏；结果区上下均无工具栏
4. [R-004] History / Export 下拉移入顶栏右侧，保留文字标签（不做纯图标）
5. [R-005] 结果区独占页面全宽（移除左侧导轨方案）
6. [R-006] 语义底色改为 OKLCH 等 L 等 C：亮色 `L=0.92 C=0.045`、暗色 `L=0.30 C=0.060`，仅色相区分（新增 150 / 删除 22 / 修改 85）
7. [R-007] 隐私承诺（`🔒 100% local · no upload · no account · no ads`）常驻顶栏：**任何宽度下不得隐藏**；**≥620px 时不得截断**（<620px 允许 ellipsis —— 顶栏 flex 挤压时只有 `.brand` 能让，这是可接受的降级，但必须可验证而非听天由命）
8. [R-008] 输入区在 ≤480px 时上下堆叠（**不是 900px**：堆叠让两个输入框各收一次垂直税，实测 880px 堆叠只剩 13/31 行、不堆叠 27/31；只在并排会窄到约 220px 时才值得堆）；任何宽度下不得出现页面横向滚动（实测 320px 起干净）
9. [R-009] 历史列表的类名沿用现有 `.hist-item` / `.hist-restore` / `.hist-del` / `.hist-empty` / `.hist-prev` / `.hist-time` / `.hist-list`，不得重命名——**app.js 的产出与 app.css 的选择器必须同步沿用**（基准物里这 7 个已被重命名，移植时要改回去；只改一侧会让历史菜单裸奔）
10. [R-010] 空态/相同态/错误态的容器样式必须存在——基准物用 `.placeholder`，现行 app.js 吐 `.empty`，二者必须对齐（只搬一侧会让首屏那句提示完全无样式）
11. [R-011] storage 路径（`persist` / `persistOpts` / `boot` / `chrome.storage.onChanged`，9 个键）行为不变：面板文本、视图、7 个选项跨次打开保持；右键捕获后已打开的页实时更新
12. [R-012] `tests/smoke.mjs` 必须**新增** manifest 权限断言：`permissions` 恒等于 `["storage","contextMenus"]` 且无 `host_permissions`——`.claude/rules/testing.md` 与 `docs/ARCHITECTURE.md` 都声称这条守卫存在，**实测它不存在**（见开放问题）

## 非功能需求

- **性能**: 输入→渲染保持 120ms 防抖；结果区在 40 行内容下必须内部滚动而非撑破视口
- **安全/隐私**: 仍然零网络调用、零第三方依赖；`manifest.json` 权限不变（仅 `storage` + `contextMenus`）；UI 文案不得出现产品不具备的能力（如"加密"）
- **兼容性**: Chrome MV3；`compare.html` 需可在裸浏览器直接打开（供 smoke 测试）
- **可访问性**: 语义标签、可见 focus ring、色彩不作唯一信息载体（`−`/`+` 符号列保留）；正文与语义底色对比度 ≥4.5:1（亮暗双主题）

## 验收标准

- [x] [AC-001] 页面五段骨架就位：`.topbar` / `.io` / `.optbar` / `.stage` / `.statusbar` 各存在且仅一个 —— 验证：DOM 查询计数
- [x] [AC-002] 选项条含 7 个 `.chk` + `#fmt-json`，分 3 个 `.group` —— 验证：`document.querySelectorAll(".optbar .chk").length === 7`
- [x] [AC-003] `#stats` 与 `#nav-next` 的最近祖先含 `.statusbar` —— 验证：`closest(".statusbar") !== null`
- [x] [AC-004] `#history` 与 `#export` 的最近祖先含 `.topbar` —— 验证：`closest(".topbar") !== null`
- [x] [AC-005] 1440px 视口下结果区宽度 ≥1400px —— 验证：`getBoundingClientRect().width`
- [x] [AC-006] 三档语义底色实测 OKLab L 极差 ≤0.005（亮暗各测）—— 验证：canvas 采样 + OKLab 变换（脚本见 design.md）
- [x] [AC-007] 620 / 880 / 1440 三档视口下：无横向溢出、7 个开关全部可见、隐私副文案 `display !== "none"`，**且 ≥620px 时 `.privacy span` 的 `scrollWidth <= clientWidth`（未被 ellipsis 截断）** —— 验证：定宽 iframe 探测。仅验 `display` 是假闸门：被截成 `no upload · no acc…` 的元素 display 仍是 inline
- [x] [AC-008] 正文对每种语义底色的对比度 ≥4.5，亮暗双主题 —— 验证：canvas 采样算 WCAG 比值
- [x] [AC-009] **功能零回归** —— 验证：三条命令的退出码与末行计数：`node tests/diff-test.mjs` = 48 passed / 0 failed、`node tests/history-test.mjs` = 19 passed / 0 failed、`tests/smoke.mjs` 有 Playwright 时 0 failed、无则退出码 2。⚠️ **本条不是充分条件**：现有 36 项 smoke 断言只查 textContent 与元素计数，对「三态无样式 / 历史项无样式 / storage 回填失效」三类断层完全看不见（design.md R4）。**不得以本条全绿宣告验收**，须与 AC-013/014/015/016 合并判定
- [x] [AC-010] **交付物三件套**无 "encrypt" 字样 —— 验证：`! grep -riE 'encrypt' compare.html app.css app.js`（**不能写「全文」**：本 specs 自己就在讨论这个词，全文 grep 恒命中 → AC 永远 fail → 退化成人肉裁定）
- [x] [AC-011] 零外部网络引用 —— 验证：`! grep -rniE 'https?:|@import|url\(\s*["'"'"']?//' compare.html app.css app.js`（`url(data:` 白名单），**用退出码判定**。旧写法 `grep -cE '(src|href)="https?://'` 是假闸门：CSS 外链的写法是 `@import url(...)` / `@font-face{src:url(...)}`，`src="` 这种属性形式在 CSS 里根本不存在，Google Fonts 回流能 100% 通过
- [x] [AC-012] 像素比对：与 `1.compare-page-redesign/design-baseline/baseline.html`（**全路径**）在 1440×900 亮/暗两档下偏差 ≤1% —— 验证：BackstopJS 报告的 misMatchPercentage 数值；Playwright 不可用时降级为 Chrome MCP 人工截图逐区比对，把结论与差异点写入 LESSONS.md。**执行方式由 T-001 上报决定后才可执行本条**
- [x] [AC-013] **空/相同/错误三态有样式**：三态容器的 `getBoundingClientRect().height >= 180` 且水平居中（`.placeholder` 或等价的 `.empty` 规则存在）—— 验证：DOM 断言。smoke 现有断言只 regex textContent，对无样式裸文本照样绿，挡不住这个
- [x] [AC-014] **历史菜单不失控**：塞满 12 条（`H.MAX_ENTRIES`）时 `#hist-list` 的 `scrollHeight > clientHeight` 且 `max-height` 生效、菜单底不超出视口 —— 验证：DOM 断言
- [x] [AC-015] **storage 往返** —— 验证：smoke 里用 `page.addInitScript` stub `window.chrome.storage.local`（含 `onChanged` 分发），断言两条：①写入→重载→9 个键正确回填对应控件（`text-a`/`text-b`/`opt-*`×7/`view`）；②外部 `set({textA:"x"})` → 本页 `#text-a` 值变为 `x` 且 `#result` 重渲染。两条均 0 failed 才算过。—— 现状这 40 行（app.js:436-478）在整个测试矩阵里**执行次数为 0**（smoke 走 `file://`，`hasChrome=false`，`boot()` 在 :448 提前 return）
- [x] [AC-016] **权限守卫落地**：`tests/smoke.mjs` 断言 `manifest.json` 的 `permissions` 集合恒等于 `["storage","contextMenus"]` 且无 `host_permissions` —— 验证：该断言存在且通过。**这是补上 R-012 那条虚构守卫的唯一窗口**；`git diff --exit-code manifest.json` 不能替代（commit 落地后它永远绿，之后谁加 `tabs` 都不响）

## 依赖

- 无新增运行时依赖（零依赖是产品硬约束）
- **验收依赖**：AC-012 的像素比对需 Playwright + BackstopJS；本机未安装（见开放问题）

## 开放问题

- [🔴 需知会] **产品最重要的隐私不变式当前没有任何自动守卫**。`docs/ARCHITECTURE.md:21` 与 `.claude/rules/testing.md:29` 都声称「smoke test 断言了 manifest 权限」，实测 `grep -niE 'manifest|permission' tests/smoke.mjs` 为**空**——这条断言从未存在。两份文档的声称是错的（`/cm:init` 生成 testing.md 时直接采信了 ARCHITECTURE.md 的说法，未去测试文件核实，属放大而非首创）。R-012 / AC-016 补上它，T-006 修正两处文档
- [已答] 设计定案 → 采用 `1.compare-page-redesign/design-baseline/baseline.html`（用户 2026-07-17 确认）
- [已答] 基准档位 → ① 像素基准（用户 2026-07-17 确认）
- [待答] **AC-012 的执行方式**：本机无 Playwright。装（约 500MB，需用户同意）还是降级为 Chrome 人工截图比对？—— T-001 会再次上报
- [推迟] 滚动条改动色标（minimap pips，来自 Stitch 稿的好想法）属**新功能 F-044**，不在本 feature 范围，需走变更流程单独决策
