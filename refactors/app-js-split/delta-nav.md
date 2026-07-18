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
