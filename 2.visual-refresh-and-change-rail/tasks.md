# 视觉层精修（第二轮）+ 滚动条改动色标 — 任务清单

## 任务版本

| 日期 | 版本 | 说明 |
| ---- | ---- | ---- |
| 2026-07-17 | v1 | 初始任务 |

## 项目信息

- 项目名: diff-lens
- 架构类型: Chrome MV3 扩展 / 单体前端
- specs 路径: 2.visual-refresh-and-change-rail/

## 前置（非任务，进入 N3 前人工或 N1 处理）

- `feature/compare-page-redesign` squash 合入 main；自 main 切新分支（建议 `feature/visual-refresh-change-rail`）

## 任务列表

### 防护网

- [x] T-001: 防护网基线——跑 `node tests/diff-test.mjs` / `history-test.mjs` / `smoke.mjs` 三条并记录全绿输出摘要 ~5min（B3：复用存量测试资产，不造快照）

### 功能 1: F-044 pip 轨道

- [x] T-002: pip 轨道整体实现——两处 `.hstart` 生成点补 `data-htype`/`data-hline`（视图无关元数据）、`compare.html` 加 `.pip-rail` 容器 + `app.css` 轨道/pip/`.current` 双主题样式 + `app.js` `renderPips()`（末尾按 `hunkIdx` 幂等复原 `.current`）、委托点击跳转、`updateNav()` 显隐；**pip 为真实 `<button type="button">`、带 `title`+`aria-label`、Tab 可聚焦且有可见焦点环（R-004/AC-006 的落点）**（同组件行为不拆散） ~1h
- [x] T-003: 几何刷新三入口落地与走查——`#opt-wrap`/`#opt-ws-show` 监听追加重算、`window.resize` 120ms 防抖重定位；三视图 × 折叠展开 × wrap × 缩窗逐路径过一遍 ~45min（依赖 T-002、**T-004——几何走查必须在视觉精修定稿后进行，否则走查证据会被 T-004 的间距/字号改动作废**）

### 功能 2: 视觉层精修

- [x] T-004: `app.css` token 与控件态精修（`compare.html` 所需微调同批）——对比度/间距节奏/hover-focus 态，双主题同步；13px/12px 密度、语义色映射、控件 id、状态类名零变更；**不触碰 `.pip-rail` 样式段（rail 组件完整归 T-002，防同组件被两任务互相覆盖）** ~1h（依赖 T-002）

### 集成与测试

- [x] T-005: `smoke.mjs` 扩充六条 pip 断言——基础 AC-002/003/004（真实点击路径）+ 反假绿灯 AC-012/013/014（Split 类型 / wrap 后 `.current` / 缩窗重算）+ 复跑防护网三条全绿 ~45min（依赖 T-002、T-003、T-004）
- [x] T-006: 走查与文档同步——按 PRD 核对清单逐条走查（44 落点 / 双主题 / 密度 / 620·880·1440 三档）+ **14 个状态文案清单式核对（AC-010 的落点，逐条对照 PRD 状态表）** + **pip 可访问性走查：Tab 聚焦顺序、焦点环、aria 读屏文本（AC-006 复核）**、更新 `docs/ARCHITECTURE.md` 界面描述段 ~40min（依赖 T-005）

> 无部署任务：纯本地扩展、无部署形态（沿用上轮决策 6，不生成 T-deploy）。

## 依赖关系

- T-001 最先（基线在任何改动之前）
- T-002 → T-004 → T-003 → T-005 → T-006（线性链：视觉精修在几何走查之前定稿，Codex 规格审查修正）

## 风险点

- 视觉精修与 markup 拆开会出现不可用中间态 → T-004 单任务同批承载（design R1）
- `.hstart` 构成、wrap 切换几何失效属未核实假设 → T-002/T-003 各自第一步先核实（design R2/R3）
- smoke 全绿 ≠ 视觉没改坏 → AC-008/AC-011 人工走查不可省（design R4，上轮假绿灯教训）
