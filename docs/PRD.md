# DiffLens — 产品需求文档（UI 重设计用）

## 概述

DiffLens 是一个 100% 本地运行的 Chrome 扩展文本对比工具：粘贴、拖文件或右键选中网页文字，即时看到两段文本的差异。不上传、不联网、无账号、无广告、无付费墙。

本 PRD 由现有代码反向提炼，用途是**驱动 Stitch 产出一版新 UI**。

v2 说明：基于 v1 的第一轮重设计已于 2026-07-17 落地（见「现行布局基线」），本版把落地结果定为新基线、把上一轮 Stitch 否稿的硬伤沉淀为防回流约束，供**下一轮 Stitch 设计**使用。

## 项目信息

- 项目名: diff-lens
- 架构类型: Chrome MV3 扩展 / 单体前端（原生 JS，无框架、无构建）
- **交付形态: 桌面宽屏 Web**（扩展的全页标签页 `compare.html`）——Stitch 里必须选 **Web**，不是 Mobile
- 现有版本: v0.2.0（`feature/compare-page-redesign` 分支已含未发布的五段布局重设计）

## 需求版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-07-16 | v1 | 从 v0.2.0 代码反向提炼，供 UI 重设计 |
| 2026-07-17 | v2 | 合入第一轮重设计落地结果为新基线；沉淀 Stitch 否稿教训为硬约束 9–11；F-044 立为待决 |
| 2026-07-17 | v2.1 | **F-044 经人工确认纳入本轮**（本轮唯一功能新增），档位注记与 Stitch 提示词同步更新 |

## 设计基准档位

**② 结构基准（含一项经批准的新增）**——布局与信息架构可重做；功能集 = F-001~F-043 不多不少，外加 **F-044 滚动条改动色标**（2026-07-17 人工确认纳入，本轮唯一功能新增，见「本轮新增」一节）。

- **可动**：视觉语言、布局、栅格、控件形态、信息分组与优先级、间距与字号
- **不可动**：下方「功能需求」的每一条（不多不少）、「硬约束」的每一条
- 验收方式：逐条核对功能点清单是否都有落点 + 走查每个状态是否都有画面

## 现行布局基线（2026-07-17 已落地，本轮设计的起点）

第一轮重设计已在 `feature/compare-page-redesign` 分支落地（16 条验收标准全过，亮/暗双主题像素比对 0.000%）。当前界面为**五段工作台布局**（CSS Grid 五行 `auto auto auto 1fr auto`）：

```
顶栏      ≠ 标记 + DiffLens + 隐私承诺 pill        │ History ▾  Export ▾
输入区    Original (A)  │ ⇄ │  Changed (B)
选项条    IGNORE ×3 │ PRECISION ×1 + { } JSON │ DISPLAY ×3 │ [Unified|Split|Inline]
结果区    独占全宽，内部滚动
状态栏    +N added · −N removed · ↕N moved · A/B lines │ Alt↑↓  ↑ i/N ↓
```

上一轮已定案、本轮不必重新论证的结论：

- **弃左导轨方案**：侧导轨吃 216px 横向空间，split 视图下每侧少约 13 个字符——横向空间是对比工具最不该省的
- **选项条独占整行、紧贴结果区上方**：选项影响的是 diff 不是输入，邻接性更对；实测 1440px 单行、880px 两行、620px 三行，均无横向溢出
- **统计与跳转沉底部状态栏**（IDE 惯例）：统计是「读数」不是「操作」，结果区因此上下都无工具栏、内容拿到最大面积
- **语义色已迁移 OKLCH**：三档底色同 L 同 C、仅色相不同（视觉重量相等的可验证定义），亮/暗两套
- **响应式单断点 900px**：输入上下堆叠、中缝转横线、选项条换行；任何宽度下隐私承诺不隐藏不截断

权威基准物：`1.compare-page-redesign/design-baseline/baseline.html`——一份可运行的实现（内联真实 diff 引擎，33 个交互元素全部可用），不是图片。**本轮新设计请以此为起点构图，不要退回 v0.2.0 的旧顶栏布局。**

## 用户故事

- 作为**写作者/编辑**，我想对比两版**散文**（不是代码），以便看清改了哪几个词——而不是被一堆代码向的行号和折叠淹没
- 作为**注重隐私的用户**，我想在不把文本传给任何服务器的前提下做对比，以便安全处理合同、病历、未发布的稿件
- 作为**开发者**，我想对比两段 JSON 并忽略键顺序与格式差异，以便只看真正的结构性变化
- 作为**任意网页读者**，我想右键选中两处文字直接送进对比，以便跳过复制粘贴的来回切换
- 作为**审阅者**，我想在长文里逐个跳到下一处差异，以便不用肉眼扫全文

## 功能需求

### 输入区

1. [F-001] 两个文本输入区，语义为 **Original (A)** 与 **Changed (B)**，可粘贴/直接输入
2. [F-002] 每个输入区有两个动作：**open file…**（本地选文件）、**clear**（清空）
3. [F-003] 支持把文件**拖放**到输入区；拖悬停时输入区需有明确的高亮态
4. [F-004] **Swap A↔B**（⇄）一键互换两侧内容
5. [F-005] 两个输入区**滚动联动**：滚 A 时 B 同步，长文对照时同一区域始终对齐
6. [F-006] 输入区默认提示语：`Paste, drop a file here, or right-click selected text on a page → set as Text A`（B 侧同理）
7. [F-007] 输入区正文为**等宽字体**，关闭拼写检查

### 对比选项（7 个开关 + 1 个动作）

8. [F-008] **Ignore whitespace** — 忽略空白差异
9. [F-009] **Ignore blank lines** — 忽略空行
10. [F-010] **Ignore case** — 忽略大小写
11. [F-011] **Char level** — 行内高亮精确到字符（默认关，即词级）
12. [F-012] **Show whitespace** — 显形空格（·）与制表符（→）
13. [F-013] **Collapse unchanged** — 折叠大段未变行（默认**关**，散文要看全文）
14. [F-014] **Word wrap** — 自动换行（默认**开**，这是散文向的关键取向）
15. [F-015] **{ } Format JSON** — 解析 → 排序键 → 美化两侧，使键顺序/格式差异消失，只留结构差异

> 设计提示：现行基线中这 8 项独占整行选项条，分 **IGNORE / PRECISION / DISPLAY** 三组紧贴结果区上方。分组与承载方式仍可重做，但**每一项都必须一击可达（不得收进需点击展开的浮层——上一轮已论证并否决），且 F-013/F-014 的默认值不能变**。

### 结果区

16. [F-016] **实时对比**——输入即出结果（120ms 防抖），无「开始对比」按钮
17. [F-017] **三种视图**（互斥切换）：
    - **Unified**：单列，改动行拆成 −旧 / +新 两行
    - **Split**：左右双列并排
    - **Inline**：单列合并，原文中就地标出删除线与插入
18. [F-018] **行号栏**：显示 A、B 两侧的真实源行号（即便开了忽略空行也保持真实）
19. [F-019] **符号栏**：`−` / `+` 标记（色觉障碍用户靠它，不能只用颜色）
20. [F-020] **行内高亮**：变更行内部标出具体改动的词/字符（`<ins>` / `<del>`）
21. [F-021] **移动检测**：被挪动位置的行标为 **moved**，带 `↕ moved from/to line N` 徽章 + 强调色左边线，不算作无关的删+增
22. [F-022] **次要差异（minor）**：被忽略选项过滤掉的差异**淡化显示但仍可见**，不静默丢弃（三态模型）
23. [F-023] **折叠带**：开启 F-013 时，长段未变行折成一条可点击的带，文案 `⋯ N unchanged lines · expand ⋯`，点击展开

### 统计与导航

24. [F-024] **统计行**：`+N added · −N removed · ≈N minor · ↕N moved · A: n lines, B: n lines`
    - 仅有次要差异时前缀 `No important differences`
    - minor / moved 计数为 0 时该段不显示
25. [F-025] 统计里的 **added / removed / minor 数字可点击**，点击跳到第一处该类差异
26. [F-026] **差异跳转**：上一处 / 下一处按钮 + 计数器；无差异时按钮禁用、计数显示 `—`；未开始跳转时显示 `N diffs`，跳转中显示 `i / N`
27. [F-027] 键盘快捷键 **Alt+↑ / Alt+↓** 跳转差异；当前目标行有明显的定位描边

> 设计提示：现行基线把 F-024~F-027 沉到**底部状态栏**。新设计可另行安排位置，但可点击跳转（F-025）与计数器形态（F-026）必须保留。

### 导出（下拉菜单，4 项）

28. [F-028] **Copy result (text)** — 复制纯文本差异
29. [F-029] **Copy unified diff** — 复制标准 unified diff（可直接 `git apply`）
30. [F-030] **Copy as Markdown** — 复制 ```` ```diff ```` 围栏块（GitHub 上渲染红绿）
31. [F-031] **Download .patch** — 下载 `difflens.patch`（本地 Blob，不经网络）
32. [F-032] 动作成功后按钮**就地闪现反馈** `Copied ✓` / `Saved ✓` / `Copy failed`，1.2 秒后复原（无 toast 系统）

### 历史（下拉菜单，本地）

33. [F-033] **＋ Save current comparison** — 保存当前 A/B 快照
34. [F-034] 历史列表项含：**预览行**（`A 首行 → B 首行`，超 40 字截断加省略号）+ **相对时间**（`just now` / `5m ago` / `3h ago` / `2d ago`）
35. [F-035] 点击列表项**恢复**该对比；每项右侧有**删除**（✕）
36. [F-036] 上限 **12 条**，超出淘汰最旧；重复的 A&B 不新增、只提到最前
37. [F-037] 空态文案：`No saved comparisons yet.`

### 扩展级入口（无独立界面，但影响首屏认知）

38. [F-038] 点击工具栏图标 → **打开全页标签页**（不是弹窗）；再次点击聚焦已开的那个标签页
39. [F-039] 网页内**右键选中文字** → `DiffLens: set as Text A (original)` / `set as Text B (changed)` / `Open DiffLens (full page)`
40. [F-040] 右键捕获后工具栏图标**角标**闪 `A` / `B` 提示已接收
41. [F-041] 已打开的对比页在别处捕获时**实时更新**内容
42. [F-042] 两个输入区内容、视图选择、所有选项**跨次打开保持**
43. [F-043] 顶部常驻**隐私声明**：`🔒 100% local · no upload, no account, no ads`——这是产品最核心的差异点，不能弱化

### 本轮新增（v2.1 批准，2026-07-17）

44. [F-044] **滚动条改动色标（minimap pips）**：结果区滚动条一侧以语义色 pip 标出**所有改动的相对位置**（绿=增、红=删、琥珀=改、强调色=当前跳转目标），点击 pip 跳到对应差异。服务长文档导航。
    - 类型区分不得只靠颜色（悬停 tooltip 或形态差异需给出至少一种）
    - 空态/无差异时 pip 轨道不显示或显示为空轨，不得留视觉噪声
    - 来源：上一轮 Stitch 稿唯一被采纳的新功能想法；实现侧引擎不变，仅消费现有 hunks 数据

## 状态与文案（每个状态都要有画面）

| 状态 | 触发条件 | 文案（原文，勿改动语义） |
| ---- | ---- | ---- |
| 空态 | A、B 均为空 | `Type or paste text in both boxes to compare.` |
| 完全相同 | 无任何差异 | `✓ The two texts are identical.` |
| 相同（因忽略选项） | 开了忽略项后无差异 | `✓ The two texts are identical (with the chosen ignore options).` |
| 仅次要差异 | 只剩被忽略的差异 | 统计行前缀 `No important differences` |
| 对比失败 | 引擎抛错/输入病态 | `Couldn’t compare this input (原因). Try smaller or simpler text.` + 统计行 `Comparison error` |
| 文件过大 | > 5 MB | `That file is too large (X.X MB). DiffLens handles up to 5 MB locally.` |
| 文件读取失败 | FileReader 出错 | `Couldn’t read that file.` |
| 导出时两侧相同 | 无差异可导出 | `Nothing to export — the two texts are identical.` |
| 保存时为空 | A、B 均空 | `Nothing to save yet — paste or type some text first.` |
| 快照过大 | > 500 KB | `This comparison is too large to save to history.` |
| JSON 两侧都无效 | Format JSON 失败 | `No valid JSON to format on either side.` |
| JSON 单侧有效 | 只格式化了一侧 | `Formatted the valid JSON side; the other isn’t valid JSON.` |
| 历史空 | 无保存记录 | `No saved comparisons yet.` |

> 注意：这些提示当前**全部复用统计行**显示，没有独立的消息/toast 区域。新设计可以引入更合适的承载方式，但**不得增加需要用户手动关闭的模态**。

## 硬约束（Stitch 不得违反）

1. **高信息密度**：这是专业对比工具，正文 13px、结果区 12px 等宽。**不要做成宽松留白的营销落地页**——用户要在一屏里读尽可能多的文本
2. **结果区正文必须等宽字体**，且保持 `white-space: pre-wrap` 语义（空格与缩进如实呈现）
3. **色彩语义是产品契约，不可改**：
   - 绿 = 新增（`+`）
   - 红 = 删除（`−`）
   - 琥珀/黄 = 修改
   - 灰/淡 = 次要差异（仍可见，非隐藏）
   - 强调色 = 移动标记 / 当前跳转目标 / 可点击项
4. **亮 / 暗双主题**：跟随系统 `prefers-color-scheme`，两套色值都要给。**只给亮色 = 未完成**
5. **差异不能只靠颜色区分**：`−`/`+` 符号栏与删除线/下划线等形态区分必须保留
6. **无网络、无账号、无付费墙**：不得出现登录、注册、云同步、升级 Pro、分享链接、广告位
7. **单页应用**：只有一个界面，没有路由与多页面导航（菜单/浮层可以）
8. **键盘可达 + 可见焦点环**：所有交互元素为真实语义控件
9. **文案诚实**：UI 不得声称产品不具备的能力。本产品**不做任何加密**——它只是不联网。「encryption」「secure vault」「military-grade」这类字样一律禁止（上一轮 Stitch 稿因虚假的 "LOCAL ENCRYPTION ACTIVE" 徽章被否，此为首要教训）
10. **零外部资源**：不得引用 webfont、CDN 脚本、外链图标（Google Fonts / Tailwind CDN 等在 MV3 CSP 下会被直接拦死）。字体用系统字体栈，图标用内联 SVG
11. **语义色独立于组件框架的角色色**：不得把 diff 语义映射到 Material 之类的 primary/error/tertiary 角色上（上一轮 Stitch 稿因此画出「新增 = 蓝」且与强调色撞车）

## 非功能需求

- **性能**：输入到出结果 120ms 防抖；2000 行文档级对比 ~3ms；超大输入优雅降级而非卡死标签页
- **安全/隐私**：仅 `storage` + `contextMenus` 两个权限，**无 host_permissions、无任何网络调用**——清单即隐私承诺
- **存储**：`chrome.storage.local`（约 10MB 配额）；单条快照上限 500KB、共 12 条
- **兼容性**：Chrome MV3；界面需在裸浏览器直接打开也能跑（供 E2E 测试）
- **可访问性**：语义标签、`aria-label`、`aria-live` 结果区、可见 focus ring、色彩不作唯一信息载体

## 依赖

- 无运行时依赖（零第三方库，这是产品可审计性的一部分）
- 浏览器原生：`chrome.storage`、`chrome.contextMenus`、`FileReader`、`navigator.clipboard`、`Blob`

## 开放问题

1. [搁置 · 与 UI 无关，不阻塞本轮] **内部品牌残留** —— `window.ClearDiff`（diff.js 导出）、`cleardiff-*`（background.js 菜单 id）、diff.js/app.js 顶部注释仍是旧名。用户不可见；改名会触及声明不动的 `diff.js`/`background.js`，且菜单 id 改名会让升级后的旧右键菜单变孤儿——需单独评估

### v1 遗留问题处置记录（2026-07-17，均已并入上文基线）

- 顶栏 8 选项承载方式 → ✅ 独占整行选项条，IGNORE/PRECISION/DISPLAY 三组（未收浮层——那会多一次点击）
- `body.popup` 死代码 → ✅ 已彻底移除，新布局由 `.app` 承载 `height:100vh`
- 窄窗口/分屏 → ✅ 900px 单断点，620px 实测无横向溢出
- 用户可见品牌残留 → ✅ 已修（文件过大提示现为 `DiffLens handles up to 5 MB locally.`）
- F-044 滚动条改动色标 → ✅ 2026-07-17 人工确认**纳入本轮**（v2.1），正式条目见「本轮新增」

---

## 附录：Stitch 提示词（可直接粘贴）

> 用法：Stitch 选 **Web** 模式，粘贴下面这段作为首轮提示；出图后再用「状态清单」逐个补画。
> v2 变化：提示词改为以已落地的五段工作台布局为起点，并把上一轮否稿的三条教训写成显式禁令。
> v2.1：F-044 已批准纳入，提示词第 4 段含 change-marker rail 描述。

```text
Redesign the visual language of "DiffLens", a privacy-first text comparison (diff)
tool that runs entirely in the browser as a Chrome extension full-page tab.

Audience: writers, editors, and developers comparing two versions of a document —
prose first, not just code. Tone: precise, calm, professional. This is a dense
working tool, not a marketing page — maximize readable text per screen.

The current shipped layout is a five-row workbench, top to bottom (keep this row
structure and every element present; your job is the visual layer — type scale,
spacing rhythm, control styling, color refinement, state treatments — not
inventing or removing features):
1. Header: product mark "DiffLens" + a persistent privacy pill
   "100% local - no upload, no account, no ads", and two dropdown triggers on
   the right: "History" (Save current comparison + saved snapshots, each with a
   preview line, a relative time like "5m ago", and a delete button) and
   "Export" (Copy result, Copy unified diff, Copy as Markdown, Download .patch).
2. Two text input panels side by side, "Original (A)" and "Changed (B)", each
   with "open file..." and "clear" actions, and a swap button in the center
   seam. Monospaced text; paste, typing, and file drag-and-drop are supported
   (show a distinct drag-over highlight state).
3. An options bar in three labeled groups — IGNORE (Ignore whitespace, Ignore
   blank lines, Ignore case), PRECISION (Char level, "{ } Format JSON" action),
   DISPLAY (Show whitespace, Collapse unchanged, Word wrap on-by-default) —
   plus a segmented view switcher: Unified | Split | Inline.
4. A full-width result area (no side rail — horizontal space is sacred in a
   diff tool), showing the diff live as the user types, with:
   - a gutter showing both A and B source line numbers
   - a +/- sign column
   - full-width rows tinted by change type
   - word-level highlights inside changed lines
   - a "moved" badge for lines that were relocated
   - NEW in this round: a slim change-marker rail along the result area's
     scrollbar edge — tiny colored pips showing the relative position of every
     change in the document (green = added, red = removed, amber = modified,
     accent = current jump target). Clicking a pip jumps to that difference.
     Show it subtly; it must not compete with the text for attention, and it
     disappears when there are no differences.
5. A bottom status bar: a stats line "+12 added - 3 removed - 2 minor -
   1 moved - A: 40 lines, B: 49 lines" (added/removed counts clickable to jump
   to the first such difference), previous/next difference buttons with a
   counter ("3 / 12"), and an Alt+up/down keyboard hint.

Hard constraints:
- High information density. Body text ~13px, monospaced result text ~12px.
- Diff color semantics are fixed: green = added, red = removed, amber = modified,
  dimmed gray = minor/ignored differences (visible, not hidden), accent color =
  moved markers and the current jump target. Never map these onto a UI kit's
  primary/error/tertiary roles — "added" must read green, never blue.
- Differences must not rely on color alone — keep the +/- signs and strikethrough
  or underline treatments.
- Provide BOTH light and dark themes (system-driven).
- Be honest: the product does NOT encrypt anything — it simply never touches the
  network. Never show badges or copy like "encryption", "secure vault", or
  "military-grade". The only trust claim is the privacy pill quoted above.
- Fully self-contained: no external webfonts, CDN scripts, or hosted icons (the
  extension's CSP blocks all of them). System font stack + inline SVG only.
- No login, no signup, no cloud sync, no upgrade/Pro, no ads, no share links.
- Single screen — no routing or multi-page navigation. Menus and popovers are fine.
- Visible keyboard focus rings on all controls.

Also design these states:
1. Empty state: "Type or paste text in both boxes to compare."
2. Identical state: "The two texts are identical."
3. A collapsed band of unchanged lines: "... 24 unchanged lines - expand ..."
4. The History dropdown, both populated and empty ("No saved comparisons yet.")
5. The Export dropdown open
6. Split view and Inline view of the same comparison
```

### Stitch 出图后的核对清单

- [ ] 44 条功能点是否都有落点（尤其易被漏掉的：滚动联动、次要差异淡化、移动徽章、行号双列、符号栏、**新增的 F-044 pip 轨道**）
- [ ] 暗色主题是否同时给了
- [ ] 是否混入了不该有的东西（登录、Pro、分享、云同步、广告位）
- [ ] 信息密度是否被"设计感"稀释（留白过大 = 一屏读不了几行 = 与产品定位相悖）
- [ ] 色彩语义是否被改（绿增/红删/琥珀改/淡次要）；**新增是否被画成蓝色**（上一轮否稿实锤：MD3 角色色映射的后果）
- [ ] 是否仍是单页、无路由
- [ ] **是否出现虚假能力声明**（encryption / secure vault 等字样——上一轮否稿的首要原因）
- [ ] **是否引用了外部字体 / CDN / 外链图标**（MV3 CSP 会拦死，且违反零网络红线）
- [ ] 五段行结构是否被保留（顶栏 / 输入 / 选项条 / 全宽结果区 / 底部状态栏）；若被改动，改动是否有明确更优的理由
