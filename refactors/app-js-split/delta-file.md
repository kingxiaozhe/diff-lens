# delta-file — U5/5: ui-file.js（rulebook_rev=v2）

## 产出

- 新文件 `ui-file.js`：§1 映射的 loadFile/paneEl/sortKeys/formatPane + `MAX_FILE_BYTES` 常量迁入。
- **app.js/compare.html 本任务未动**（铁律：只写 ui-file.js 与本文件）。留守侧待办见「集成清单」。

## 命名空间与契约（R1）

```js
// app.js 留守侧的接入方式（render/persist 是函数声明会提升，init 可在 IIFE 顶部调用）：
const F = window.DiffLensFile({ ta, tb, stats, render, persist });
// F.loadFile(file, which)  F.paneEl(which)  F.formatPane(which)
```

- ctx 五键：`ta`/`tb`/`stats`（DOM 引用）、`render`/`persist`（回调）。模块内零 DOM 查询、
  零 chrome.*（R3）、零事件绑定（R6）、不直调其他 ui-* 模块（R1 末条）。
- 导出面 = 实际消费面（§1 v2 原则外推）：**导出 loadFile/paneEl/formatPane；sortKeys 私有**
  ——app.js 中 sortKeys 仅被 formatPane 内部调用，无外部消费点。

## 行为保持验证

- `node --check ui-file.js` ✅
- 纯 Node 自检（§0 v2 放行）✅：vm 加载 + 假 ctx，覆盖 7 组断言——paneEl 映射、
  5MB 上限文案与 app.js 逐字节相同、拒绝时不触发 render/persist、null file 守卫、
  formatPane 空/非法/合法三分支（非法输入不改面板值；合法输出键排序 + 2 空格缩进）、
  `Couldn’t read that file.`（U+2019 弯引号）逐字节保留、sortKeys 函数体逐字（仅缩进差）。
- FileReader onload/onerror 分支为浏览器 API，Node 不可执行——代码为原文机械迁移
  （`render()`/`persist()` → `ctx.render()`/`ctx.persist()`，无其他改动），禁 smoke 未跑（§0）。
- 迁移的三段原注释（"open file…" 段头、5 MB 依据、Format JSON 大段含 2^53 NOTE）逐字保留。

## 集成清单（留守/编排任务负责，非本任务）

1. app.js 删除 L436–450（loadFile 段含 MAX_FILE_BYTES/paneEl）与 L467–487（sortKeys/formatPane
   段含大段注释），事件绑定处改调 `F.loadFile`/`F.paneEl`/`F.formatPane`。
2. compare.html 登记 `<script src="ui-file.js">`，位于 diff.js/history.js 之后、app.js 之前（R2）。

## 被迫自行决定的点（RULEBOOK 未覆盖，候选进 v3）

1. **R1 工厂挂载形态**：条文 `window.DiffLens{Name} = init(ctx) => api` 可读作「命名空间即工厂函数」
   或「命名空间为对象含 init」。取 `root.DiffLensFile = init`——跟随 history.js
   「命名空间是对象」的项目先例（与 R1 v2 直挂形态的论证同源）。**并行的 U2–U4 需对齐同一形态**。
2. **导出面裁剪**：§1 v2 的「导出面=实际消费面」仅写在 ui-render 行；外推适用于 ui-file，
   故 sortKeys 私有。若判官按 §1「迁入函数」列要求四个全导出，改动为一行（api 加 sortKeys）。

## REFACTOR STATUS

`confidence=high todos=0`（尾注已按 R5 v2 枚举格式写入 ui-file.js）
