---
description: DiffLens 的测试约定——零依赖手写断言 + Playwright 冒烟，隐私回归必须守住
---

# 测试规范

## 框架与命令

无测试框架（与零依赖原则一致）：断言用手写的 `ok()`/`eq()` 助手，失败打印 `✗ 消息` 并 `process.exit(1)`。

- 引擎单测：`node tests/diff-test.mjs`（`compare` / `toUnifiedDiff` / `toMarkdown` / `foldRows`）
- 历史助手单测：`node tests/history-test.mjs`（`preview` / `tooLarge` / `add` / `remove`）
- 端到端冒烟：`node tests/smoke.mjs`（headless Chromium 驱动真实 `compare.html`；Playwright 找不到时退出码 2，不算失败）
- 覆盖率：无工具统计，改用下面的「必测清单」代替数字门槛

## 提交前必须全绿

三条命令全部执行，单测两条必须 0 failed。冒烟退出码 2（无 Playwright）可接受，退出码 1 不可接受。

## 必测清单（代替覆盖率百分比）

- `diff.js`、`history.js` 的**每个导出函数**都要有单测——这两个文件是纯逻辑，没有不可测的借口
- 每个新增引擎能力至少覆盖：正常用例、空输入、超限降级路径（如 `MAX_CELLS` 触发时返回 `null`）
- 每条 ignore 选项（whitespace / case / blankLines / charLevel）单独一条断言
- 纯 UI 的部分（`app.js` 渲染、`background.js`）由 `smoke.mjs` 覆盖，不写单测

## 隐私回归守卫（不可删除）

`smoke.mjs` 断言 manifest 权限恒等于 `storage` + `contextMenus`、无 `host_permissions` / `optional_permissions` / `content_scripts`，并逐文件断言 `compare.html` / `app.css` / `app.js` / `diff.js` / `history.js` / `background.js` 无任何外部请求（匹配 URL 本身，不匹配 `src=` 这类属性形式——CSS 的外链走 `@import` / `url()`，属性形正则一个都抓不到）。

**这些断言是产品承诺的执行器，任何理由都不得放宽或跳过**；若某功能需要新权限，先走 @rules/security.md 的上报流程。

> 史料：这条守卫直到 2026-07-17 才真正存在。在那之前，本文件与 `docs/ARCHITECTURE.md` 都**声称**它存在，而 `smoke.mjs` 里一行都没有——即产品最核心的隐私不变式裸奔了整个 v0.1–v0.2 周期，却有两份文档为它背书。教训：**写「某测试保证了 X」之前，先去那个测试文件里 grep 一遍**。

## 文件与命名约定

- 位置：一律 `tests/`，扁平放置，不建子目录
- 命名：`{模块名}-test.mjs`（单测）、`smoke.mjs`（E2E）
- 用 `.mjs` + `vm.runInThisContext(readFileSync(...))` 加载被测源文件——源文件是挂全局的普通 script，不能直接 `import`：

```js
// Good — 与现有两个单测一致
vm.runInThisContext(readFileSync(join(here, "..", "history.js"), "utf8"));
const { add, remove } = globalThis.DiffLensHistory;
```

## 断言写法

消息写**行为**，不写函数名——排查时消息就是文档：

```js
// Good
eq(list[0].id, "3", "re-saved entry moves to the front");
ok(!list.some((e) => e.id === "id0"), "oldest is evicted");
// Bad
ok(add(list, e).length === 12, "add works");
```

## E2E 约定

- 用真实用户路径驱动：`page.fill("#text-a", ...)` → `waitForFunction` 等渲染 → 断言 DOM
- 监听 `pageerror` 收集异常，结尾断言**零控制台异常**
- 选择器用稳定的 id / `data-view` 属性，禁止依赖 class 层级或文案
