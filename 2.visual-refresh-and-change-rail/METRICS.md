# METRICS — 2.visual-refresh-and-change-rail

## T-001 防护网基线（2026-07-17T16:31Z）

### 改动前绿灯
```
diff-test:    48 passed, 0 failed
history-test: 19 passed, 0 failed
smoke:        57 passed, 0 failed (exit 0, Playwright 1.61.1)
```
Codex 独立复跑前两条计数一致（smoke 沙箱无 Playwright 跳过，本机实跑为准）。

| 任务 | Feature | 开始 | 结束 | 审查轮次 | Codex拦截 | QA | 人工介入(次:原因) |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| T-001 | 2.visual-refresh-and-change-rail | 00:28 | 00:33 | 1 | 0 | — | 0 |
| T-002 | 2.visual-refresh-and-change-rail | 00:34 | 00:44 | 1 | 0 | — | 0 |
| T-004 | 2.visual-refresh-and-change-rail | 00:45 | 00:55 | 2 | 2 | — | 0 |
| T-003 | 2.visual-refresh-and-change-rail | 00:56 | 01:05 | 2 | 2 | — | 0 |
| T-005 | 2.visual-refresh-and-change-rail | 01:06 | 01:18 | 2 | 2 | — | 0 |
| T-006 | 2.visual-refresh-and-change-rail | 01:19 | 01:32 | 2 | 3 | 通过(68+48+19 断言;14AC 全过) | 0 |

> feature 级 QA 备注：边界检查抓出并行会话 diff.js 修复被 T-006 提交误并入，已拆分为独立提交 bf4c64a（详见 LESSONS 2026-07-18 提交污染条目）。
