---
description: DiffLens 前端（扩展 UI）约定——原生 DOM、CSS 变量主题、渲染性能与 a11y
globs: "app.js,app.css,compare.html,background.js"
---

# 前端规范

无框架、无构建、无组件库——原生 DOM + 一个 CSS 文件。别引入 React/Vue/Tailwind：破坏零依赖与可审计性（见 @rules/security.md）。

## DOM 与结构

- 取元素统一用文件顶部的 `$ = (id) => document.getElementById(id)`，在 IIFE 顶部一次性缓存，**不在渲染循环里反复查询 DOM**
- 控件 id 用 kebab-case 并带语义前缀：`text-a`/`text-b`（输入）、`opt-ws`/`opt-case`/`opt-fold`（选项）、`nav-prev`/`nav-next`（导航）
- 状态变量放 IIFE 顶部（`view`、`showWs`、`fold`、`hunks`、`expandedFolds`），不挂 `window`
- 事件用委托挂在容器上（折叠按钮走 `data-fold` 属性），**禁止给每行绑监听**——大文本会绑出成千上万个
- HTML 结构由 JS 生成时用字符串拼接 + 一次性 `innerHTML` 赋值；**禁止在循环里逐次 `innerHTML +=`**（每次都重解析整棵树）

```js
// Good — 先攒数组，最后一次落地
const html = [];
for (const r of rows) html.push(urow(...));
result.innerHTML = html.join("");
// Bad — O(n²) 重排，长文本直接卡死
for (const r of rows) result.innerHTML += urow(...);
```

## 渲染

- 所有渲染收敛到 `render()`，它外层有 error boundary——**病态输入可以报错，但绝不能留下半渲染的 UI**
- Unified 与 Inline 共用 `renderColumn(out, inlineChange)`，只在「change 怎么画」上分叉；Split 是独立的双列渲染器。新视图先问：能不能复用 `renderColumn`？
- 引擎（`diff.js`）只产出数据，颜色/DOM/文案一律留在 `app.js`——引擎里出现 HTML 字符串即为设计错误
- 用户文本进 DOM 前必须过 `esc()`/`fmt()`，无例外

## 样式与主题

- 样式全部在 `app.css`，**禁止内联 `style=` 与 JS 里写死颜色**；状态用 class 表达（`.row.change`、`.row.del`、`.row.add`、`.row.fold`、`.minor`、`.ws`）
- 颜色一律引用 `:root` 的 CSS 变量，亮/暗两套值通过 `prefers-color-scheme` 提供——**新增颜色必须同时给暗色值**，只加亮色即为未完成
- 差异语义颜色是产品契约：新增=绿、删除=红、修改=琥珀、次要(minor)=淡化但可见。改这套配色 = 契约变更，需人工确认

## 交互与持久化

- 面板文本、视图、选项通过 `chrome.storage.local` 持久化，下次打开还原
- 监听 `chrome.storage.onChanged` 实现「其他标签页右键捕获 → 本页实时更新」：**先比对 `ta.value !== changes.textA.newValue` 再赋值**，否则自己的写入回声会打断正在输入的光标
- 所有 `chrome.*` 调用前先判存在（`hasChrome`）——`compare.html` 要能在裸浏览器/Playwright 里直接打开跑冒烟测试

## 可访问性

- 交互元素用真实语义标签（`<button type="button">`、`<label for>`），禁止 `<div onclick>`
- 图标化按钮必须带 `title` 或 `aria-label`（如折叠按钮的 "Show the hidden lines"）
- 键盘路径必须可用：Alt+↑/↓ 跳转差异；新增功能一并给键盘入口
- 差异不能只靠颜色区分——保留 `−`/`+` 符号列与 `<del>`/`<ins>` 标签（色觉障碍用户依赖它们）

## 性能约束

- 输入 → 渲染走 120ms 防抖（`schedule()`：`clearTimeout(t); t = setTimeout(render, 120)`），别每个按键都全量重算；新的输入源接同一个 `schedule`，不要直接调 `render`
- 长文本渲染前先检查引擎返回的降级信号（`compare` 内部超 `MAX_CELLS` 会退化），UI 给出提示而不是假装正常
