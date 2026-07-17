# DiffLens — Private Text Compare

Chrome MV3 扩展：100% 本地的文本 diff 工具，粘贴或右键选中两段文本即可对比，不上传、不联网、无账号。

## 技术栈

- 语言: JavaScript (ES2020+，无 TypeScript)
- 框架: 无——原生 DOM + Chrome Extension MV3，**无构建步骤、无依赖、无 node_modules**
- 包管理: 无（`package.json` 都没有；测试只用 Node 内置模块，Playwright 已全局安装 1.61.1 供 smoke 用）
- 版本控制: remote (origin → github.com/kingxiaozhe/diff-lens)
- 交付形态: Web（Chrome 浏览器扩展，Chrome Web Store 分发）
- 业务地图: 跳过(小项目,源码仅 13 个文件，2026-07-17 复核)

## 常用命令

- 安装依赖: 无需安装（零依赖）
- 开发运行: `chrome://extensions` → 开发者模式 → 「加载已解压的扩展程序」→ 选本目录；改完代码点扩展卡片的刷新键
- 构建: `node package.mjs` 打包商店上传 zip——白名单 PAYLOAD 定内容，打包后解压跑真实测试验证（zip 已在 .gitignore）
- 测试: `node tests/diff-test.mjs` && `node tests/history-test.mjs` && `node tests/smoke.mjs`
- Lint: 无 linter 配置——风格靠 @rules/coding-style.md 人工/AI 把关

## 目录结构

```
.
├── manifest.json      # MV3 清单——权限只有 storage + contextMenus（隐私承诺的载体）
├── background.js      # service worker：右键菜单捕获选区、打开/聚焦全页 tab、角标
├── compare.html       # 全页对比界面：顶栏/输入/选项条/结果/状态栏 五段
├── app.js             # UI 层：绑定控件、渲染 unified/split/inline 三视图、折叠、历史
├── app.css            # 全部样式，含亮/暗主题；语义色用 OKLCH 等 L 等 C
├── diff.js            # diff 引擎：行级 LCS + 词/字符级行内高亮 + 移动检测（可 Node 单测）
├── history.js         # 对比历史的纯函数助手（无 DOM、无 chrome，可 Node 单测）
├── package.mjs        # 打包脚本：按写死的 PAYLOAD 清单出 zip，解包后跑全部测试才算过
├── docs/
│   ├── ARCHITECTURE.md  # 设计决策与已知限制（改架构前必读）
│   └── privacy.html     # 商店要求的隐私政策
├── tests/             # diff-test.mjs / history-test.mjs（单测）、smoke.mjs（E2E + 隐私守卫）
├── icons/             # 16/32/48/128 图标
├── design/            # 设计参考图 + ui-v2-draft.html（可跑的设计稿）
├── store-assets/      # 商店截图
└── 1.compare-page-redesign/   # UI 重做的规格：requirements/design/tasks + METRICS
    ├── design-baseline/       # 冻结的像素基准（AC-012 比对用）
    └── .reviews/              # 代码审查凭证——无凭证 = 审查未发生
```

> 只有前 7 个文件 + `icons/` 会进商店包（`node package.mjs` 按 PAYLOAD 出包），其余约 3MB 都不发布。

## 规则

@rules/coding-style.md
@rules/testing.md
@rules/security.md
@rules/git-workflow.md
@rules/frontend.md
