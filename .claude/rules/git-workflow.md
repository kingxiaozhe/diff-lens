---
description: DiffLens 的分支与提交约定——祈使句 commit、一次一个能力、线性历史
---

# Git 工作流

远程：`origin` → github.com/kingxiaozhe/diff-lens

## 分支

- 保护分支：`main`——发布分支，必须保持可加载、可提交商店的状态
- 命名：`feature/xxx`、`fix/xxx`（历史尚无分支记录，按此约定新建）
- 合并方式：**squash**，保持 `main` 线性——现有历史每个 commit 恰好是一个完整能力，继续保持

## Commit

风格：**祈使句 + 首字母大写，不用 conventional commits 前缀**（本仓库既有风格，别混入 `feat:`/`fix:`）。历史真实示例：

```
Add moved-line detection
Add local comparison history (save / restore / delete)
Synchronized scrolling between the two input panes
Prep for store submission: v0.2.0 + accurate privacy/storage disclosures
```

- 一次 commit = 一个用户可感知的能力或一次修复，**代码 + 单测 + 文档同一个 commit**（历史上 `Add diff export (unified/Markdown/patch), clickable stats, a11y, tests` 就是这么打包的）
- 消息说清「加了什么能力」，不写 `wip`、`fix`、`update`、`修改若干`
- 主题行 ≤ 72 字符；需要解释权衡/取舍时写正文（为什么这么做，不是做了什么）
- 不关联 issue 编号（本仓库无此实践）

## 提交前置

- `node tests/diff-test.mjs` 与 `node tests/history-test.mjs` 全绿
- 涉及 UI/权限的改动跑 `node tests/smoke.mjs`
- 对照 @rules/security.md 的红线自查（尤其：权限没变、无网络调用）
- 确认无 `*.pem`、无 `*-upload.zip` 入库

## PR / 合入

- PR 描述最低要求：改了什么能力、怎么验证（贴测试命令与结果）、是否触碰 manifest 权限
- 合入前置：单测通过；触碰 `manifest.json`、`docs/privacy.html`、`STORE_LISTING.md` 的 PR 必须人工确认——这三处是对用户的公开承诺

## 版本与发布

- 版本号写在 `manifest.json` 的 `version`（当前 0.2.0），语义化：新能力 → minor，纯修复 → patch
- 发布 commit 单独一条，形如 `Prep for store submission: vX.Y.Z + ...`，同时更新 `manifest.json`、`README.md`、`STORE_LISTING.md`
- 发布物 zip 不入库（`.gitignore` 已排除）
