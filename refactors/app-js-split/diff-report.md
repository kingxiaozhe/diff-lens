# 差分明细 — app-js-split(行为等价证据汇总)

| 证据层 | 规模 | 结果 |
|---|---|---|
| 金样(基础 18 组:6 输入×3 视图) | pristine vs 重构后 | 18/18 逐字节一致 |
| 金样扩展(+showWs 激活 3 组,r1 采纳) | HEAD 树 vs 工作区 | 21/21 逐字节一致(ws 高亮 span 已验真实出现) |
| 浏览器级探针(r2 采纳:复制/FileReader/5MB 拒载/Format JSON) | 双树各实驱一次 | 6/6 项逐字节一致 |
| smoke 整页 | 重构后 | 73/73(68 + 隐私扫描新增 5 文件) |
| 存量单测 | diff 48 / history 19 / unified 6 | 全绿 |
| 变异重种(输入/渲染/pip——第三处种进 ui-nav 模块内部) | 3 处 | 3/3 抓红,复原后全绿 |

- 探针备注:复制仅捕获 1 通道(首击后菜单自关,双树行为一致);copy-diff/md 与 dl-patch 共享 toUnifiedDiff 引擎,该层由 unified-blank 单测覆盖
- 站 5 拦截记录:装配后首跑 smoke 红——ui-nav 挂载行规范化时上下文盲(root 无绑定),修 IIFE 包装后绿。**规范化变换自身也要过判官**
