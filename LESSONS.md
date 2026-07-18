# LESSONS — diff-lens specs

## 待触发备忘

- [挂起] 若将来把 pip 悬停 title 扩展为含行文本预览 → 必须过 `esc()`（当前仅类型词+行号，无用户文本）（来源 2.visual-refresh-and-change-rail/T-002）

## 2026-07-18 — 2.visual-refresh-and-change-rail / T-005 smoke 断言

- `[已结构化]` **等待条件必须锚定新内容的确切特征**：上一个用例留下的同类 DOM 会让 `length > 0` 类条件在防抖重渲染前提前为真，断言读到旧状态。修法：等确切数量（`=== 3`）或给旧节点打 stale 标记等其重建。已固化进 smoke.mjs 的 rail 用例（markStale/railRebuilt）。

## 2026-07-18 — 2.visual-refresh-and-change-rail / T-006 提交污染事故

- `[仅记忆]` **共享工作树上禁用盲目 `git add -A`**：并行 /cm:fix 会话产出的 diff.js 修复被 T-006 的 `add -A` 误并入，提交信息与内容失配（审计链断点）。feature 级 QA 的「波及面外文件」边界检查把它抓了出来，已重写拆分为独立提交 bf4c64a。今后 N5 提交前先 `git status` 对照本任务波及面，只 add 清单内文件；波及面检查应保留为 feature 级 QA 固定动作。

## 2026-07-18 — 2.visual-refresh-and-change-rail / T-006 文档同步

- `[仅记忆]` **文档描述实现时不要写枚举式例外清单**：ARCHITECTURE 的圆角措辞两轮审查都被抓漏项，最终改为「主控件/表面走 token，装饰性圆角按设计保留字面量」的不枚举表述才对齐。枚举清单在代码演进后必然漂移。
- `[仅记忆]` Codex 2 轮上限触发一次：分歧仅涉文档措辞（例外清单完整性），第 2 轮后改用不枚举表述放行——双方理由：审方要求例外全列，我方判断枚举必漂移。

## 2026-07-18 — fix / ignoreBlankLines 导出补丁不可应用
- [已结构化] 导出物(补丁)必须以"可应用"为准:忽略类选项只影响差异判定,不得改变补丁体的行完整性——防线: tests/unified-blank-test.mjs 的 patchAppliesTo 校验器(含 hunk 计数验证)
- [仅记忆] 复现"补丁类"缺陷要选严格裁判:GNU patch 的 fuzz 容错会把坏补丁蒙混过关,git apply --check 才是无 fuzz 的硬证据

## 2026-07-18 — refactor / app.js 拆分
- [已结构化] 行为保持重构的判官三件套可复用:金样采集(golden-capture.mjs)+浏览器探针(equiv-probe.mjs)+变异重种——防线在 refactors/app-js-split/
- [仅记忆] 机械规范化变换(挂载行统一)是上下文盲的,必须跟完整判官链再走一遍——实证:root 绑定缺失,站5拦截
- [仅记忆] 规则涉及"形态"必须附可拷贝骨架代码,公式必有两读(实证:批内 2:2 分裂)

## 待触发备忘
- [挂起] smoke 补 export/file 实操永久断言(复制三通道/下载/拖放/FileReader/5MB/Format JSON)→ 下次动这两模块或专项测试任务时认领(来源 refactor/app-js-split r2)
