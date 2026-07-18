# 缺陷档案: ignoreBlankLines 导出补丁不可应用

- **现象**: 忽略空行选项开启时,导出的 unified diff 行号错位、空行上下文缺失;`git apply --check` 拒绝(退出码1)。GNU patch 因 fuzz 容错偶可蒙混,加剧隐蔽性
- **复现**: `toUnifiedDiff('alpha\n\nbravo\ncharlie', …, {ignoreBlankLines:true})` → 补丁声称 `@@ -1,3` 但 bravo 实际在第 3 行;markdown 场景(空行密集)9 行文件被声称为 5 行连续块
- **红证据(修复前)**: tests/unified-blank-test.mjs 首跑 `3 passed, 2 failed`——两条 bug 断言红,校验器自验证(好补丁绿/坏补丁红)先行通过
- **根因**: toUnifiedDiff 的顺序重编号(++an/++bn)前提是"每个源行在 entries 中恰出现一次";ignoreBlankLines 在 compare() 中把空行整体过滤,前提被破坏——层级:导出函数内,与现象同层
- **2.5 判定**: 不触发(波及面2处同模块/同层/非观测续跑/非升级出口),四客观条件全空
- **修法**: identical 判定保持用户选项(既有语义 diff-test.mjs:55 不破),补丁体改用强制 ignoreBlankLines:false 的 compare——空行差异作为真实 -/+ 行进入补丁,可应用性优先
- **放弃的方案**: ①用 rows 真实行号重编 hunk——空行仍缺失,hunk 不连续,补丁语法非法;②导出整体无视 ignore 选项——破坏 blank-only→identical→"" 的既有语义
- **波及面与回归**: toMarkdown(透传,Codex r1 补测通过)/app.js(纯消费返回串)/全量 141 项测试绿/真实裁判 git apply --check 通过
- **审查**: Codex 主通道 2 轮(r1 approved+1条非阻塞采纳:校验器补 hunk 计数验证;r2 零发现)。凭证: .reviews/fix-unified-blank-lines-r{1,2}.md
- **测试资产**: tests/unified-blank-test.mjs(6 断言,含校验器自验证与既有语义哨兵)
