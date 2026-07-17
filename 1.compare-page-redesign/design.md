# 对比页 UI 重做 — 技术设计

## 设计版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-07-17 | v1 | 初始设计 |

## 项目架构

- 架构类型: Chrome MV3 扩展 / 单体前端，无框架、无构建、零依赖
- 涉及层: **仅前端页面层**（markup / 样式 / 渲染与控件绑定）。无后端、无数据库、无合约
- 遵循: `.claude/rules/frontend.md`、`.claude/rules/coding-style.md`、`.claude/rules/security.md`、`.claude/rules/testing.md`

## 设计基准

- **档位: ① 像素基准**（用户 2026-07-17 确认）
- **基准物（权威副本）: `1.compare-page-redesign/design-baseline/baseline.html`**，sha1 `8460f33f...5c4eee` —— 这不是图片，是一份**可运行的实现**：内联了真实 `diff.js` + `history.js`，33 个交互元素全部可用，已跑通 25 项断言。因此本 feature 的性质接近**移植**而非**还原**。
- ⚠️ **同源副本**：`design/ui-v2-draft.html` 与基准物当前 sha1 完全相同（同一文件两份）。**权威以 specs 内的冻结副本为准**；`design/` 那份是可继续演进的工作稿与已发布 artifact 的源。二者若分叉，AC-012 以冻结副本为准，重新冻结必须是显式动作并记入 LESSONS.md——否则像素基准会静默漂移。
- 基准物的交互遍历结论：33 个可交互元素（29 静态 + 4 动态）全部映射到 PRD 的 F-xxx，**死区 0**。该遍历结果直接作为 E2E 走查清单，不重跑。
- 基准物**未覆盖**：F-038 工具栏图标开页、F-039 右键菜单、F-040 角标 —— 这三条住在 `background.js`（扩展外壳），本 feature 确实不碰。
- ⚠️ **F-041（storage 实时更新）与 F-042（面板/选项持久化）不是扩展外壳，它们 100% 住在 `app.js` 里**（`persist` :436 / `persistOpts` :439 / `boot` :447 / `onChanged` :471），而 app.js 正在本次改动范围内。基准物用 localStorage 模拟、没覆盖真实 chrome.storage 路径 ≠ 该路径不受影响。见模块 3 与 AC-015。
- 参考 PNG（BackstopJS 基准图）**尚未生成** —— 本机无 Playwright，由 T-001 决策后补。**不提供带浏览器扩展浮标的截图充当基准**（会把噪声烧进基准）。

## 波及面（B2）

| 文件 | 改动 | 说明 |
| ---- | ---- | ---- |
| `compare.html` (83 行) | **重写 markup** | 五段骨架；所有控件 id 保持不变 |
| `app.css` (244 行) | **重写** | 新 token（OKLCH 语义色）+ 新布局 + 双主题。**必须回退这 7 个选择器为现有名**：`.hist-item` `.hist-restore` `.hist-del` `.hist-empty` `.hist-prev` `.hist-time` `.hist-list`（基准物里叫 `.histrow/.histmain/.histdel/.histempty/.histprev/.histtime/.histlist`），且 `.hist-list` 的 `max-height:320px; overflow:auto` 与 `.hist-prev` 的 `text-overflow:ellipsis` 必须跟着搬。**并且必须提供空/相同/错误三态的容器样式**（见模块 3） |
| `app.js` (480 行) | **局部改** | markup 生成 + 控件绑定 + 三态容器类名对齐；状态机与事件逻辑不变。**storage 路径（:436-478）虽标"不变"，但必须逐条核对 9 个键 ↔ 控件 id 的映射** |
| `tests/smoke.mjs` (132 行) | **扩充** | ①**新增** manifest 权限断言（R-012：这条守卫被两处文档声称、实际不存在）②新增 storage stub 往返（AC-015：该路径当前测试覆盖为 0）③新增三态样式与历史菜单高度断言。**现有 36 项断言零改动存活**（已逐条核实：ids/`.row`/`.srow`/`.movetag`/`.foldbtn`/`details>summary` 全部保留） |
| `diff.js` (367 行) | **不动** | 引擎与行契约不变 |
| `history.js` (45 行) | **不动** | 纯函数，无 DOM |
| `background.js` (76 行) | **不动** | 扩展外壳，本 feature 不碰 |
| `manifest.json` (22 行) | **不动** | 权限不变是硬约束（AC-010 逐字节校验） |
| `tests/diff-test.mjs` / `history-test.mjs` | **不动** | 不触 DOM，天然不受影响 |
| `docs/privacy.html` | **不动** | 披露内容不变 |
| `README.md` / `docs/ARCHITECTURE.md` | **文档同步** | T-006 更新界面描述 |

**耦合点（唯一）**：`app.js` 的渲染层消费 `diff.js` 的行契约（`{type: equal|minor|del|add|change|fold}` 及其字段）。**本 feature 不改该契约**，只改由它生成的 HTML 结构 —— 因此 `diff-test.mjs` 的 48 项不可能被波及。

## 功能模块设计

### 模块 1: 页面骨架（compare.html + app.css）

五段 CSS Grid，`grid-template-rows: auto auto auto minmax(0,1fr) auto`：

```
.topbar    40px   ≠ 标记 + DiffLens + 隐私承诺 pill │ History ▾  Export ▾
.io        auto   Original(A) │ ⇄ │ Changed(B)
.optbar    auto   IGNORE ☐☐☐ │ PRECISION ☐ {}JSON │ DISPLAY ☐☐☑ │ [Unified|Split|Inline]
.stage     1fr    #result（独占全宽，内部滚动）
.statusbar 30px   +N added · −N removed · ↕N moved · A/B lines │ Alt↑↓ ↑ i/N ↓
```

**关键约束**：`.app` 的每个 grid item 必须显式 `min-height: 0` / `min-width: 0`。grid item 默认 `min-height: auto`，不归零会让内容顶破 `100vh`、整页横向/纵向溢出（基准物实测踩过：溢出 131px，导致外层容器被拉长）。

### 模块 2: 语义色系统（app.css）

三档底色**同 L 同 C，仅色相不同**，这是"视觉重量相等"的可验证定义：

| 档 | 亮色 | 暗色 | 色相 |
| ---- | ---- | ---- | ---- |
| 新增 | `oklch(0.92 0.045 150)` | `oklch(0.30 0.060 150)` | 150 |
| 删除 | `oklch(0.92 0.045 22)` | `oklch(0.30 0.060 22)` | 22 |
| 修改 | `oklch(0.92 0.045 85)` | `oklch(0.30 0.060 85)` | 85 |
| 词级新增/删除 | `oklch(0.83 0.096 H)` | `oklch(0.44 0.100 H)` | 同上 |

**L/C 不是拍脑袋，是色域实测的结果**（AC-006 会复验）：红色相(22) 在 sRGB 的彩度天花板远低于绿(150)——L=0.945 时红只到 C=0.030，绿到 0.0966。**给超了会被浏览器静默色域映射连 L 一起压低，对齐白做**（基准物开发时实测踩过：指定 L=0.945 实际渲染出 0.9316，感知亮度极差回到 GitHub 配色的水平 0.0156）。`L=0.92` 是三色相共用 `C=0.045` 的落点。

实测结果：现行 GitHub 配色 L 极差 **0.0156** → 新配色 **0.0020**（亮）/ **0.0011**（暗）。

**契约不变**：绿=新增、红=删除、琥珀=修改、淡灰=次要、强调色=移动/跳转目标/可点击。仅数值重挑，语义映射一个字不改。

### 模块 3: 渲染层适配（app.js）

**不变**：`compare()` 调用、opts()、三视图分派、`indexHunks`/`updateNav`/`jump`、防抖 `schedule()`、滚动联动、导出四项、历史增删、Format JSON、文件读取、error boundary 的**兜底逻辑**（但它吐的容器类名要对齐，见下）、**以及 storage 路径 `persist`(:436) / `persistOpts`(:439) / `boot`(:447) / `onChanged`(:471)**。

> storage 路径列在这里**不等于可以不管**：`boot()` 会回填 `optWs.checked`、`optWrap.checked`、`[data-view]` 的 `.on`、`result.classList` 的 `wrap`/`split`。T-003 重写 markup 时任一控件 id 漂移或 `data-view` 换载体，回填会**静默失效**——用户重开标签页丢面板文本与选项，且没有任何测试会报警（见下方"测试盲区"）。

**改动**：
- `urow()` / `numCell()` / `scol()` / `foldRowHtml()` 产出的 HTML 结构与新 class 对齐
- 控件绑定跟随 markup 迁移（选项条 / 顶栏 / 状态栏），**id 全部不变 → 事件绑定代码基本零改**
- `renderHistList()` 的类名**保持现有** `.hist-item` / `.hist-restore` / `.hist-del` / `.hist-empty` / `.hist-prev` / `.hist-time`（见决策 3）
- **三态容器类名对齐**：app.js:126/137/145 现吐 `<div class="empty">`，基准物吐 `<div class="placeholder"><span class="big">`。二者必须统一——**只搬 CSS 不改 app.js（或反之），首屏那句 "Type or paste text in both boxes to compare." 会完全无样式**：不居中、无 padding、无 muted 色、无 min-height，一坨 12px 等宽字挤在结果区左上角。而 smoke:58 只 regex textContent，**照样全绿**。落地取「app.js 改吐 `.placeholder > .big`」（与基准物一致，AC-012 才可能成立）

**测试盲区（必须靠 AC-015 补上）**：smoke 用 `file://` 打开 compare.html → `typeof chrome === "undefined"` → `hasChrome=false` → `boot()` 在 :448 提前 return。**app.js:436-478 这 40 行、9 个 storage 键在整个测试矩阵里执行次数为 0**。AC-009 声称的"功能零回归"由 diff-test(48) + history-test(19) + smoke 兜底，而这三者对 storage 一行都碰不到。

### 模块 4: 响应式（app.css）

单断点 `max-width: 900px`：输入上下堆叠、中缝转横线、选项条 `flex-wrap` 换行、视图段取消 `margin-left:auto`、组间竖线取消。

**不隐藏隐私副文案** —— 实测 620px 时顶栏仍余 305px，隐藏一分空间不省却弱化了产品最核心的承诺（R-007 / PRD F-043）。

## 接口契约

无 API / RPC / 合约。以下是**组件契约**（像素档验收按此逐项核对）：

| 组件 | 选择器 | 契约 |
| ---- | ---- | ---- |
| 顶栏 | `.topbar` | 含 `.brand`（`.mark` + `.wordmark` + `.privacy`）与 `.topacts`（`#history`、`#export`） |
| 隐私承诺 | `.privacy` | `<b>` = `🔒 100% local`；`<span>` = `no upload · no account · no ads`。**任何宽度不得 display:none** |
| 输入面板 | `.io > .pane` ×2 | 各含 `.pane-head`（`h2` + `open file…` + `clear`）、`textarea#text-a|b`、`input[type=file]#file-a|b` |
| 中缝 | `.seam` | 含 `#swap`；≤900px 转为横向 |
| 选项条 | `.optbar` | 3×`.group`（`.glabel` + `.chk`s）+ `#fmt-json` + `.seg`（3×`[data-view]`） |
| 结果区 | `#result.result` | class `wrap` 由 `#opt-wrap` 切换；内部滚动 |
| 状态栏 | `.statusbar` | `#stats` + `.nav`（`#nav-prev` / `#nav-count` / `#nav-next`） |
| 行 | `.row.{equal\|add\|del\|change\|minor\|fold\|moved\|jumped}` | 结构 `.num` + `.sign` + `.txt`；split 用 `.srow > .scol` |
| 历史项 | `.hist-item > .hist-restore + .hist-del` | 类名沿用现有，不得重命名 |

**控件 id 清单（全部不得变更，smoke.mjs 依赖）**：`text-a` `text-b` `file-a` `file-b` `swap` `opt-ws` `opt-blank` `opt-case` `opt-char` `opt-ws-show` `opt-fold` `opt-wrap` `fmt-json` `result` `stats` `nav-prev` `nav-count` `nav-next` `history` `hist-save` `hist-list` `export` `copy` `copy-diff` `copy-md` `dl-patch`

## 数据模型

无变化。`chrome.storage.local` 的键（`textA` / `textB` / `history` / 选项）保持不变——改了会让老用户升级后丢失面板内容与历史。

## 安全考虑

对照 `.claude/rules/security.md` 的红线：

- **零网络**：新样式不得引入 webfont / CDN / 外链图标（AC-011 校验）。基准物已验证零外链——这也是**否掉 Stitch 稿的首要原因**：它带 3 个外部请求（Google Fonts ×2 + Tailwind CDN），在 MV3 里会被 CSP 直接拦死
- **权限不变**：`manifest.json` 逐字节不变（AC-010）
- **XSS**：新 markup 仍用字符串拼 HTML → 所有用户文本必须过 `esc()`/`fmt()`。新增的属性插值（如 `data-fold`）同样必须转义
- **文案诚实**：UI 不得声称产品不具备的能力。**Stitch 稿的 "LOCAL ENCRYPTION ACTIVE" 是虚假安全声明**（本产品不做任何加密，只是不联网），已否决并写入 AC-010 的 grep 校验防止回流

## 技术决策

| 决策 | 选项 | 理由 |
| ---- | ---- | ---- |
| **1. 骨架取全宽五段，弃左导轨** | ① 左导轨工作台（先前候选）② Stitch 的全宽五段 | 选 ②。左导轨吃 216px，在 split 视图下等于**每侧少约 13 个字符**——横向空间是对比工具最不该省的。实测结果区 1352px → 1896px。左导轨的卖点（选项永不挤压）在方案 ② 里由「选项条独占整行」同样实现，且不花那 216px |
| **2. 选项条置于结果区正上方** | ① 顶栏（现状）② 独立整行 | 选 ②。选项影响的是 diff 不是输入，邻接性更对；且独占整行后 8 个控件比现状跟品牌抢顶栏宽裕得多——PRD 开放问题 #1 就此关闭。实测 1440px 单行 41px、880px 换 2 行、620px 换 3 行，三档均无横向溢出 |
| **3. 历史类名沿用现有，不重命名（app.js **与** app.css 两侧同步）** | ① 用基准物的 `.histrow/.histmain/...` ② 改回 `.hist-item/.hist-restore/...` | 选 ②。基准物里的重命名是无谓改动，会**打断 smoke.mjs 现有 6 处断言**（第 94/95/100/105/106/107 行）。⚠️ **落地范围含 CSS**：若只回退 app.js 的产出、CSS 仍用基准物的 `.histrow` 等，History 下拉会整体裸奔——最致命的是 `.hist-list` 丢掉 `max-height:320px; overflow:auto`，而 `history.js:8` 的 `MAX_ENTRIES=12`，存满时 `.sheet` 是 `position:absolute` 无高度约束 → **菜单纵向无限增长、捅出视口底部且无法滚动，最后几条永久点不到**。而 smoke:95 只 `count(.hist-item)===1`、:100 只 `click(.hist-restore)`，无样式照样能点 → **假绿灯正好掩盖这个 bug**。AC-014 补上高度断言 |
| **4. 统计/跳转沉底部状态栏** | ① 结果区上方工具栏（现状）② 底部状态栏 | 选 ②（IDE 惯例，来自 Stitch 稿）。结果区上下都无工具栏 → 内容拿到最大面积；统计是"读数"不是"操作"，本就该在状态栏 |
| **5. 放弃 Stitch 稿整体** | ① 以 Stitch 为底修硬伤 ② 以基准物为底移植其骨架想法 | 选 ②。Stitch 稿要能上线需：改掉虚假加密声明、去 3 个网络依赖、重做配色语义（它把 diff 语义套在 MD3 的 primary/error/tertiary 上，导致**新增=蓝**且与强调色撞车）、补 3 个缺失开关、补浅色主题、接上 19 个死区——改完后剩下的只有布局构图，而那恰是可低成本移植的部分 |
| **6. 不生成部署任务** | — | 项目无 Dockerfile / 无 CI / 无部署脚本，纯本地扩展。按 tasks 规则不生成 T-deploy，避免执行期反复触发"无 staging 环境"上报 |
| **7. 像素基准暂不落 PNG** | ① 用 Chrome MCP 截图当基准 ② 等 Playwright 到位由 BackstopJS 生成 | 倾向 ②，T-001 上报决策。Chrome MCP 截图带浏览器扩展浮标，烧进基准就是永久噪声 |

## AC-006 / AC-008 的验证脚本（供 T-005 直接用）

```js
// canvas 采真实像素绕开 getComputedStyle 对 oklch() 原样返回的坑
// （踩过：用正则解析 oklch 字符串会把 0.92/0.045/150 当成 RGB，算出全 1.00 的假数据）
const cv = document.createElement("canvas"); cv.width = cv.height = 1;
const ctx = cv.getContext("2d", { willReadFrequently: true });
const rgb = css => { ctx.fillStyle = css; ctx.fillRect(0,0,1,1); const d = ctx.getImageData(0,0,1,1).data; return [d[0],d[1],d[2]]; };
const lin = c => { c/=255; return c <= 0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
const oklabL = css => { const [R,G,B] = rgb(css).map(lin);
  const l = Math.cbrt(0.4122214708*R+0.5363325363*G+0.0514459929*B);
  const m = Math.cbrt(0.2119034982*R+0.6806995451*G+0.1073969566*B);
  const s = Math.cbrt(0.0883024619*R+0.2817188376*G+0.6299787005*B);
  return 0.2104542553*l+0.7936177850*m-0.0040720468*s; };
const wcag = css => { const [R,G,B] = rgb(css).map(lin); return 0.2126*R+0.7152*G+0.0722*B; };
const ratio = (a,b) => { const l1=wcag(a), l2=wcag(b), hi=Math.max(l1,l2), lo=Math.min(l1,l2); return (hi+0.05)/(lo+0.05); };
```

## 风险点

- **R1 中间态不可用**：markup 与样式必须同批改（T-002 合并二者正是为此）；若拆开，中间会出现结构已换、样式未换的完全不可用状态
- **R2 像素档无工具**：AC-012 依赖 Playwright，本机没有。T-001 必须先解决，否则像素档形同虚设
- **R3 `.num` 双列行号**：新旧都靠 `.num > span` 两个子元素承载 A/B 行号，flex 宽度写死 62px。若字号变化需同步复核，否则 4 位行号会被裁
- **R4 现有测试会给假绿灯**：本 feature 的三类典型断层——三态无样式、历史项无样式、storage 回填失效——**现有 36 项 smoke 断言一条都看不见**（它们只查 textContent 与元素计数，不查样式与 chrome 路径）。因此"smoke 全绿"在本 feature 中**不构成验收依据**，必须靠 AC-013/014/015/016 兜底。这是对抗审查的核心发现，写在这里防止执行期被"测试都过了"说服
- **R5 隐私守卫是新写的，不是回归**：R-012/AC-016 要加的 manifest 权限断言**此前从不存在**，尽管 `docs/ARCHITECTURE.md:21` 和 `.claude/rules/testing.md:29` 都声称它存在。T-006 必须同时修正这两处虚假声称，否则文档继续骗下一个人
