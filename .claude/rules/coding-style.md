---
description: DiffLens 的编码风格——零依赖原生 JS、IIFE 模块、注释写「为什么」
---

# 编码风格

## 量化标准

| 项 | 上限 |
| ---- | ---- |
| 函数长度 | 40 行（渲染函数放宽到 60） |
| 文件长度 | 600 行（`app.js` 已接近，新功能优先抽独立模块） |
| 嵌套深度 | 3 层 |
| 函数参数 | 4 个 |

## 命名

- 文件命名：kebab-case 或单个小写词——`app.js`、`diff.js`、`history.js`、`diff-test.mjs`
- 变量/函数：camelCase，短而具体——`lineKey`、`tokenizeWords`、`renderColumn`、`foldRowHtml`
- 常量：文件顶部 SCREAMING_SNAKE_CASE，并**紧跟一条注释说明数值怎么来的**——`MAX_CELLS = 4000000`（≈16MB）、`MAX_ENTRIES = 12`、`FOLD_CONTEXT = 3`
- 导出到全局的模块对象：PascalCase 带 `DiffLens` 前缀——`DiffLensHistory`

## 模块组织（本项目的硬约定）

无打包器、无 `import`/`export`（`.mjs` 测试文件除外）。每个源文件是一个 IIFE，挂到 `window`/`globalThis`：

```js
// Good — history.js 的实际写法，Node 里 vm.runInThisContext 即可单测
(function (root) {
  "use strict";
  const MAX_ENTRIES = 12;
  function add(list, entry) { /* ... */ }
  root.DiffLensHistory = { add, MAX_ENTRIES };
})(typeof window !== "undefined" ? window : globalThis);
```

```js
// Bad — 引入构建步骤/依赖，破坏「零依赖、可审计」这条产品卖点
import { produce } from "immer";
export function add(list, entry) { /* ... */ }
```

- **纯逻辑与 DOM 分离**：能被 Node 单测的逻辑（diff 引擎、历史列表形状）不得碰 `document` 或 `chrome`；DOM/存储归 `app.js`。新加纯逻辑就新开一个 IIFE 模块，别塞进 `app.js`。
- `compare.html` 里用 `<script>` 按依赖顺序引入（`diff.js`、`history.js` 先于 `app.js`），**禁止内联脚本**（CSP 会拒）。

## 格式

- 缩进 2 空格；字符串用双引号（HTML 片段内嵌属性时用单引号，见 `app.js` 的 `moveTag`）；语句结尾带分号
- 每行 ≤ 100 字符
- 单行 if 只在 early-return / 守卫时使用：`if (!text) return;`
- 字符串拼 HTML 用 `+` 拼接（与现有代码一致），**所有插值必须先过 `esc()`/`fmt()`**——见 @rules/security.md

## 不可变与纯函数

列表操作返回新数组，不改入参——`add()`/`remove()` 用 `filter`/`slice`，单测里断言了「不修改入参」：

```js
// Good
function remove(list, id) {
  return (Array.isArray(list) ? list : []).filter((e) => e.id !== id);
}
// Bad
function remove(list, id) { list.splice(list.findIndex((e) => e.id === id), 1); return list; }
```

## 注释

- 注释解释**为什么**和**代价**，不复述代码。本项目的基准示例：
  - `diff.js` 的 `MAX_CELLS` 说明了矩阵是主要开销、超限为何降级而非冻结标签页
  - `background.js` 说明了为何不用 `tabs` 权限查 URL（安装时吓跑用户）
- 每个文件首行一句话说明职责 + 「无网络/无依赖」的约束（现有 4 个源文件都有，新文件照做）
- 禁止 `// TODO` 堆积：要么做，要么写进 `docs/ARCHITECTURE.md` 的「已知限制」

## 健壮性

- 用户输入可能是病态的（超长无空格行、巨大 JSON）：新增引擎路径必须有规模上限并**优雅降级**，参照 `MAX_CELLS` 返回 `null` 让调用方退化成粗粒度块替换
- `render()` 外层有 error boundary——不要在里面吞异常，让它冒到边界，UI 才不会半死不活
