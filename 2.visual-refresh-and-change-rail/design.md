# 视觉层精修（第二轮）+ 滚动条改动色标 — 技术设计

## 设计版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-07-17 | v1 | 初始设计 |

## 项目架构

- 架构类型: Chrome MV3 扩展 / 单体前端，无框架、无构建、零依赖
- 涉及层: **仅前端页面层**（markup / 样式 / 渲染与控件绑定 / smoke 测试）
- 遵循: `.claude/rules/frontend.md`、`coding-style.md`、`security.md`、`testing.md`

## 设计基准

- **档位: ② 结构基准**（用户 2026-07-17 确认，明确不等 Stitch 新稿）
- 结构起点: `1.compare-page-redesign/design-baseline/baseline.html`（五段工作台冻结副本）——本轮**不重画结构，只演进视觉层**
- Stitch 新稿（生成中/未到）到货后**仅作参考**，不构成验收对照；若将来要采纳须先过 PRD「否稿核对清单」并走变更流程
- 本轮**不新增 design-baseline 目录** → 不生成 UI 像素还原任务；验收走 AC 清单 + 状态走查

## 波及面（B2）

| 文件 | 改动 | 说明 |
| ---- | ---- | ---- |
| `compare.html` (119 行) | 局部 | `.stage` 内加 pip 轨道容器 `.pip-rail`；其余 markup 不动，**控件 id 零变更** |
| `app.css` (459 行) | 精修 + 新增 | token 精修（对比度/间距/控件 hover-focus 态）+ `.pip-rail` 全套双主题样式 |
| `app.js` (484 行) | 局部新增 | 两处 `.hstart` 生成点（:75/:102）补 `data-htype`/`data-hline` 属性；`renderPips()` 消费 dataset；委托点击 → 跳转；显隐挂 `updateNav()`；resize 防抖重定位 |
| `tests/smoke.mjs` (348 行) | 扩充 | AC-002/003/004 三条 pip 断言；**现有断言零改动存活**（id/类名不变） |
| `docs/ARCHITECTURE.md` | 文档同步 | T-006 更新界面描述段（含 pip 轨道） |
| `diff.js` / `history.js` / `background.js` / `manifest.json` / `docs/privacy.html` | **不动** | 引擎、历史、外壳、权限、披露全不碰 |

**调用链**：`render()` → `indexHunks()`(app.js:172) → `renderPips()`（新增，紧随其后）；pip 点击 → `jump()`(app.js:183)。
**受影响老功能**：差异跳转（共享 `hunkIdx` 状态）、三视图渲染（pip 依当前视图的 `.hstart` 重建）、折叠展开（展开触发 render 重跑 → pip 天然刷新）。

## 功能模块设计

### 模块 1: pip 轨道（F-044，compare.html + app.js + app.css）

- **markup**：`.stage` 内、`#result` 之后放 `<nav class="pip-rail" aria-label="Change positions">`，内部由 JS 生成 N 个 `<button type="button" class="pip {add|del|change}" data-pip="i">`
- **类型/行号来源（视图无关，Codex 审查修正）**：**不读 hunk 根节点 classList**——split 视图的根节点是 `srow hstart`，类型类在子节点 `.scol` 上（app.js:97-117），按 classList 读会拿不到语义。改为：在两处 `.hstart` 生成点（app.js:75/102，unified/inline 与 split 共两处）给该元素**同批盖 `data-htype="add|del|change"` 与 `data-hline="N"` 属性**（生成 HTML 字符串时写入，数据来自引擎行对象），`renderPips()` 只消费 `el.dataset`，三视图统一。**R-006 已在规格期核实达成**：`.hstart` 仅打在 important 行（`imp && !prevImp`），minor 天然不进集合
- **定位算法**：`renderPips()` 在 `indexHunks()` 之后执行——对每个 hunk 元素取 `el.offsetTop / result.scrollHeight`；先拼 HTML 一次 `innerHTML` 落地，再循环赋 `style.top`（百分比）
- **跳转**：委托监听挂 `.pip-rail`，读 `data-pip` → `hunkIdx = i - 1; jump(1)`——复用 stats 点击的既有模式（app.js:343），**零改 `jump()` 语义**
- **当前目标同步（幂等重建，Codex 审查修正）**：`jump()` 切换 pip 的 `.current`；**且 `renderPips()` 末尾依据现存 `hunkIdx` 复原 `.current`**——任何原因重建轨道（wrap 切换、resize）后当前态自动恢复，结果区与轨道永不失配
- **几何刷新入口（Codex 审查修正）**：三个——① `render()` 尾部（内容/视图/折叠变化）② `#opt-wrap` / `#opt-ws-show` 监听处追加一次重算 ③ `window.resize` 走 120ms 防抖只调 `renderPips()`（重定位不重 diff，与输入防抖 `schedule()` 分离——resize 不需要重算 diff）
- **显隐**：`updateNav()`（hunks 状态唯一汇聚点）同时切换 `.pip-rail` 的 `.hidden`——hunks 为空即隐藏（R-005）
- **title/aria**：`title` 与 `aria-label` 同文（`added · line 12` 形态），内容仅类型词 + 数字行号（来自 `data-hline`），无用户文本

### 模块 2: 视觉层精修（app.css，compare.html 微调同批）

- 范围：token 层（字号阶、间距节奏、圆角、边框对比度）与控件形态（checkbox/按钮/下拉的 hover、focus、active 态）
- 不动项：五段布局结构、语义色**映射**（数值可微调但保持等 L 等 C 原则）、13px/12px 密度、状态类名、控件 id
- 双主题：每个新增/修改的颜色变量亮暗两套同批给值（frontend.md：只给亮色 = 未完成）

### 模块 3: 测试扩充（tests/smoke.mjs）

- 基础三条走真实交互路径：`fill → waitForFunction → click(.pip) → assert .jumped + #nav-count`
- **反假绿灯三条（Codex 审查修正）**：① Split 视图下 pip 带正确类型类（防"只在 Unified 工作"）② 跳转后切 `#opt-wrap`，断言 `.current` 仍在同一 pip 上（防重建丢当前态）③ `setViewportSize` 1440→620，断言 pip `style.top` 集合发生变化（防 resize 位置漂移）
- 结尾复跑既有隐私守卫与零 pageerror 断言（顺带覆盖新代码路径无异常）

## 接口契约（组件契约）

| 组件 | 选择器 | 契约 |
| ---- | ---- | ---- |
| pip 轨道 | `.pip-rail` | `.stage` 内 absolute 定深右缘；含 N×`button.pip`；hunks 为空时挂 `.hidden` |
| pip | `button.pip.{add\|del\|change}` | `data-pip`=hunk 索引；`title`+`aria-label` 含类型与行号；`.current` = 当前跳转目标 |

**控件 id 与 `.hist-*` 类名清单沿用上轮契约，零变更**（smoke.mjs 依赖）。

## 数据模型

无变化。不新增 `chrome.storage` 键。

## 安全考虑

- pip HTML 全部由引擎数据（类型 / 行号 / 索引）拼接，**无用户文本插值**；若未来在 title 中加行文本预览，必须过 `esc()`
- 零网络：新样式不得引入 webfont / CDN / 外链图标（隐私守卫断言逐文件把关）
- `manifest.json` 逐字节不变（AC-009）

## 技术决策

| 决策 | 选项 | 理由 |
| ---- | ---- | ---- |
| 1. pip 定位由 JS 写 `style.top` | ① 纯 CSS（不可行——位置是数据）② JS 赋几何值 | 选 ②。这是对 frontend.md「禁内联 style」的**显式豁免且仅限几何**：位置=数据、颜色与形态 100% 留在 app.css。豁免范围写死，防止执行期扩大化 |
| 2. 跳转复用 `hunkIdx = i-1; jump(1)` 模式 | ① 重构出 `jump(index)` ② 复用既有模式 | 选 ②。app.js:343（可点击 stats）已有同款先例，零改存量语义、零回归面 |
| 3. minor 不打 pip | ① 全类型打 ② 过滤 minor | 选 ②（R-006）。minor 的产品定位是「淡化但可见」，在导航层制造目标反而放大它 |
| 4. 显隐挂 `updateNav()` | ① 独立状态 ② 复用 hunks 汇聚点 | 选 ②。避免第二份 hunks 状态，永不失配 |
| 5. 不等 Stitch、不冻新像素基准 | — | 用户确认 ② 结构基准；上一轮 Stitch 稿 6 处硬伤的先例说明「等稿」有二次被否风险 |

## 风险点

- **R1 中间态**：compare.html 与 app.css 的视觉精修必须同任务同批改（T-004 单任务承载），拆开会出现结构/样式失配的不可用中间态
- **R2（已消解）**：`.hstart` 是否含 minor 已核实——不含（app.js:75/102），R-006 零成本达成
- **R3 几何失效时机（Codex 审查后扩容）**：失效源共三类——不重 render 的开关（`#opt-wrap`/`#opt-ws-show`）、**窗口 resize（wrap 下换行几何全变，原方案遗漏）**、render 重建。三个刷新入口见模块 1；T-003 逐路径核实
- **R4 假绿灯**（上轮教训直接继承 + Codex 实锤三个盲区）：固定宽度 Unified 路径全绿掩盖不了 Split 无类型、缩窗漂移、wrap 后 `.current` 丢失——smoke 必须含模块 3 的反假绿灯三条；AC-008/AC-011 的人工走查仍不可省
