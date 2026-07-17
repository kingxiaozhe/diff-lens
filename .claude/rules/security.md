---
description: DiffLens 的安全红线——权限最小化、零网络、XSS 防护；隐私是产品本身
---

# 安全规范

本项目的安全模型很特殊：**「不联网」不是一条运维要求，而是产品卖点和商店描述里的承诺**。清单文件本身就是隐私故事——用户能自己审计。破坏它 = 破坏产品。

## 红线（违反即阻断，无例外）

1. **禁止任何网络调用**：`fetch`、`XMLHttpRequest`、`WebSocket`、`navigator.sendBeacon`、`import()` 远程 URL、`<img src="http...">`、外链 CSS/字体/CDN 一律禁止。
2. **禁止扩大 manifest 权限**：`permissions` 只允许 `storage` + `contextMenus`；**永不添加 `host_permissions`、`tabs`、`scripting`、`activeTab`**。`background.js` 里刻意用「记住 tab id」而非按 URL 查询，就是为了不要 `tabs` 权限——别为了省事加回来。
3. **禁止任何遥测/分析/崩溃上报/广告 SDK**。
4. **禁止引入第三方运行时依赖**（供应链风险 + 用户无法自审）。
5. 以上任一条确有必要变更 → **停下来上报人工确认**，同步更新 `README.md`、`STORE_LISTING.md`、`docs/privacy.html` 与商店披露，不得静默改动。

## 密钥与配置

本扩展无后端、无 API key、无账号——**不存在需要保管的密钥**。若将来出现，一律禁止硬编码。
`.gitignore` 已排除 `*.pem`（扩展签名私钥）、`*-upload.zip`、`.DS_Store`——打包发布前确认私钥没进 git。

## XSS（本项目最现实的攻击面）

用户文本来自任意网页选区，`app.js` 用字符串拼 HTML 后 `innerHTML` 渲染 → **所有插入的用户数据必须先转义**：

```js
// Good — 先 esc()/fmt()，再拼
return '<del>' + fmt(w.text) + '</del>';
return '<button data-fold="' + esc(r.key) + '">';
// Bad — 用户文本直达 innerHTML，任意页面的选区即可注入
result.innerHTML = '<div class="txt">' + w.text + '</div>';
```

- 新增渲染路径时，问一句：这段字符串里有没有用户/文件内容？有就必须过 `esc()` 或 `fmt()`（`fmt` 内部已 `esc`）。
- 属性值同样要转义（`data-fold` 是现成例子），不只是文本节点。
- 禁止 `eval`、`new Function`、`setTimeout("字符串")`、内联 `<script>` / `onclick` 属性（MV3 CSP 也会拒）。

## 本地数据与存储

- `chrome.storage.local` 配额约 10MB：写入前必须做体积守卫（`history.js` 的 `tooLarge`，上限 500KB/条、12 条）——不做守卫会写爆存储。
- 本地文件通过 `FileReader` 读取，5MB 上限，**永不上传**；不用 `<input>` 以外的通道外发。
- 存储里只放用户自己粘贴/选中的文本，不放任何派生的标识符（无 uuid、无设备指纹）。
- 存储内容是用户明文文本：新增字段前想清楚是否真的需要落盘，能不存就不存。

## 拒绝服务式输入（自伤防护）

病态输入不该冻结用户的标签页：LCS 有 `MAX_CELLS` 上限并降级、文件有 5MB 上限、历史有体积上限。新增的 O(n·m) 级算法必须自带上限与降级路径。

## 发布前检查清单

- [ ] `grep -rnE "fetch\(|XMLHttpRequest|sendBeacon|https?://" *.js` 只剩注释/文档链接
- [ ] `manifest.json` 的 `permissions` 未变、无 `host_permissions`
- [ ] `node tests/smoke.mjs` 的权限断言通过
- [ ] `git status` 干净，无 `*.pem` 入库
- [ ] 版本号、`STORE_LISTING.md`、`docs/privacy.html` 三处披露一致
