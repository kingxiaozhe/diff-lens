# 对比页 UI 重做 — 任务清单

## 任务版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-07-17 | v1 | 初始任务（已含方案对抗审查的 7 条采纳项） |

## 项目信息

- 项目名: diff-lens
- 架构类型: Chrome MV3 扩展 / 单体前端（原生 JS，零依赖，无构建）
- specs 路径: `1.compare-page-redesign/`
- 设计基准: `1.compare-page-redesign/design-baseline/baseline.html`（像素档）

## 任务列表

### 防护网基线（B3：修改存量模块的 feature，第一个任务必须是它）

- [x] **T-001**: 建立防护网基线并解决像素档工具缺口 ~20min
  - 记录当前绿灯：`node tests/diff-test.mjs`（48 项）、`node tests/history-test.mjs`（19 项）、`tests/smoke.mjs` 退出码 2（无 Playwright，正常降级）
  - 记录改动前 `git rev-parse HEAD` 与 `shasum app.js app.css compare.html tests/smoke.mjs`，供回滚与漂移比对
  - **🔴 上报人工决策**：AC-012 像素比对需 Playwright（约 500MB）。装 or 降级为 Chrome MCP 人工截图比对？未定则 AC-012 无法执行，像素档形同虚设
  - 产出：`METRICS.md` 基线段

### 移植（核心）

- [x] **T-002**: 移植页面骨架与样式（`compare.html` + `app.css`）~1h
  - 两文件**合并为一个任务**：markup 与样式是一体的，拆开必然产生「结构已换、样式未换」的完全不可用中间态
  - 五段骨架（R-001）；每个 grid item 显式 `min-height:0` / `min-width:0`（不写会顶破 100vh）
  - OKLCH 语义色双主题（R-006）；`data-theme` 覆盖必须双向压过 media query
  - **回退 7 个历史选择器为现有名**（R-009），含 `.hist-list` 的 `max-height:320px; overflow:auto` 与 `.hist-prev` 的 `text-overflow:ellipsis`
  - **提供三态容器样式**（R-010）
  - 单断点 900px（R-008）；**不隐藏隐私副文案**（R-007）
  - 全部控件 id 保持不变（design.md 的 id 清单）
  - 验证：AC-001..AC-005、AC-007、AC-008、AC-011

- [x] **T-003**: 适配 `app.js` 渲染层与控件绑定 ~45min
  - `urow()` / `numCell()` / `scol()` / `foldRowHtml()` 产出对齐新结构
  - **三态改吐 `.placeholder > .big`**（app.js:126/137/145），与基准物一致（R-010）
  - `renderHistList()` 类名回退为现有名（R-009）
  - **逐条核对 storage 9 个键 ↔ 控件 id 映射**：`boot()`(:447) 回填 `optWs.checked`/`optWrap.checked`/`[data-view]` 的 `.on`/`result.classList` 的 `wrap`；任一 id 漂移会静默丢用户数据（R-011）
  - 验证：AC-006、AC-013、三视图/折叠/移动/导出/历史全通

- [x] **T-004**: 扩充 `tests/smoke.mjs` ~40min
  - **新增 manifest 权限断言**（R-012 / AC-016）——这条守卫被两处文档声称、实际从不存在，本任务是补上它的唯一窗口
  - 新增 storage stub 往返（AC-015）：`page.addInitScript` stub `chrome.storage.local` 含 `onChanged` 分发，跑通「写入→重载→回填」与「外部 set textA → 本页 render」
  - 新增三态样式断言（AC-013）与历史菜单 12 条不失控断言（AC-014）
  - **现有 36 项断言必须零改动通过**——若需改动，说明 T-002/T-003 破坏了契约，回头修实现而不是改测试

### 验收与收尾

- [x] **T-005**: 像素比对与全量回归 ~30min
  - AC-012 按 T-001 的决策执行（BackstopJS 或人工截图比对）
  - 跑全部 AC-001..AC-016，逐条记录实测值（不是"看起来对"）
  - 三条测试命令全绿；`git diff manifest.json` 为空

- [x] **T-006**: 文档同步 ~20min（调用 `cm-doc-syncer`）
  - **修正 `docs/ARCHITECTURE.md:21` 与 `.claude/rules/testing.md:29` 的虚假声称**——它们说 smoke 断言了 manifest 权限，实测不存在。T-004 补上后这两处才成立，改为描述实际状态
  - 更新 README 的界面描述（左导轨 → 五段骨架）
  - `docs/PRD.md` 加一行：F-044（滚动条改动色标）已推迟，走变更流程

> **不生成部署任务**：项目无 Dockerfile / 无 CI / 无部署脚本，纯本地扩展，无 staging 形态。

## 依赖关系

```
T-001（防护网基线 + 像素档决策）
  └─► T-002（骨架 + 样式）
        └─► T-003（app.js 适配）
              └─► T-004（smoke 扩充）
                    └─► T-005（像素比对 + 全量回归）
                          └─► T-006（文档同步）
```

全链串行——同一批文件互相依赖，无并行空间。无环。

## 风险点

- **现有测试会给假绿灯**（design.md R4）：三态无样式 / 历史项无样式 / storage 回填失效——现有 36 项 smoke 断言一条都看不见。执行期**不得以"smoke 全绿"作为验收依据**，必须看 AC-013/014/015/016
- **像素档可能无法执行**（design.md R2）：T-001 未解决 Playwright 前，AC-012 是空头支票
- **T-002 中间态不可用**：合并 markup+CSS 正是为此；若执行时仍想拆，先想清楚中间态怎么验证
- **storage 路径零测试覆盖**：app.js:436-478 在当前测试矩阵里执行 0 次，AC-015 是它的第一次覆盖。改动此处需格外小心
- **基准物有两份同源副本**：`design/ui-v2-draft.html` 与 specs 内的冻结副本 sha1 相同。权威是后者；若前者演进，需显式重新冻结，否则像素基准静默漂移
