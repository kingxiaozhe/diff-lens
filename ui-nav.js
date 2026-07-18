// DiffLensNav — hunk 索引/上下跳转/pip 轨道（自 app.js 原样迁出）。No network calls.
// 有状态模块：拥有 hunks/hunkIdx；DOM 引用经 init(ctx) 注入（RULEBOOK R1）。
// 事件绑定一律留在 app.js（R6）——本模块只暴露被绑定/被编排调用的函数。
// 与 ui-render 的唯一接口是 hunk 首行的 data-htype/data-hline dataset（R4），
// 轨道只读 dataset，不读各视图的 DOM 细节。
(function (root) {
  "use strict";

  // ctx: { result, pipRail, navPrev, navNext, navCount } —— 均为 app.js 顶部缓存的元素引用。
  // navPrev/pipRail 可能为 null（页面变体没有该控件），各函数保留原有的存在性守卫。
  function init(ctx) {
    const result = ctx.result;
    const pipRail = ctx.pipRail;
    const navPrev = ctx.navPrev, navNext = ctx.navNext, navCount = ctx.navCount;
    let hunks = [], hunkIdx = -1;

    // --- difference navigation (BC-style next/prev) ---
    function indexHunks() {
      hunks = [].slice.call(result.querySelectorAll(".hstart"));
      hunkIdx = -1;
      updateNav();
      renderPips();
    }
    function updateNav() {
      if (!navPrev) return;
      const n = hunks.length;
      navPrev.disabled = n === 0; navNext.disabled = n === 0;
      navCount.textContent = n === 0 ? "—" : (hunkIdx < 0 ? (n + (n === 1 ? " diff" : " diffs")) : (hunkIdx + 1) + " / " + n);
      // 显隐挂在这里：hunks 状态的唯一汇聚点，错误态（render 边界置空 hunks）也会路过。
      if (pipRail) pipRail.classList.toggle("hidden", n === 0);
    }
    // F-044 改动色标：轨道上每个 pip 对应一个 hunk，位置按文档相对高度铺排。
    // 类型与行号读 hunk 首行的 data-htype/data-hline（视图无关），不碰用户文本。
    function renderPips() {
      if (!pipRail) return;
      if (!hunks.length) { pipRail.innerHTML = ""; return; }
      // 先把几何一次读完，再开始写 DOM——读写交错会让每次迭代都强制同步布局，
      // 大 diff 下 wrap/resize 一次就是一串 reflow。
      const total = result.scrollHeight || 1;
      const tops = hunks.map((h) => ((h.offsetTop / total) * 100).toFixed(2) + "%");
      // innerHTML 重建会销毁真实键盘焦点：记下焦点停在哪个 pip，重建后还给同一序号。
      const ae = document.activeElement;
      const focusIdx = ae && pipRail.contains(ae) && ae.dataset && ae.dataset.pip != null ? Number(ae.dataset.pip) : -1;
      const NAME = { add: "added", del: "removed", change: "changed" };
      const html = [];
      for (let i = 0; i < hunks.length; i++) {
        const type = hunks[i].dataset.htype || "change";
        const line = hunks[i].dataset.hline || "";
        const label = (NAME[type] || "changed") + (line ? " · line " + line : "");
        html.push('<button type="button" class="pip ' + (NAME[type] ? type : "change") +
          '" data-pip="' + i + '" title="' + label + '" aria-label="Jump to ' + label + '"></button>');
      }
      pipRail.innerHTML = html.join("");
      const kids = pipRail.children;
      for (let i = 0; i < kids.length; i++) {
        // 几何是数据不是样式：仅 top 由 JS 写入，颜色与形态全部留在 app.css
        //（specs 技术决策 1 对「禁内联 style」的显式豁免，范围仅此一个属性）。
        kids[i].style.top = tops[i];
      }
      // 幂等复原当前态：任何原因重建轨道（wrap 切换、resize）后不丢 .current。
      if (hunkIdx >= 0 && kids[hunkIdx]) kids[hunkIdx].classList.add("current");
      if (focusIdx >= 0 && kids[focusIdx]) kids[focusIdx].focus({ preventScroll: true });
    }
    function jump(dir) {
      if (!hunks.length) return;
      if (hunkIdx < 0) hunkIdx = dir > 0 ? 0 : hunks.length - 1;
      else hunkIdx = (hunkIdx + dir + hunks.length) % hunks.length;
      hunks.forEach((h) => h.classList.remove("jumped"));
      const el = hunks[hunkIdx];
      el.classList.add("jumped");
      el.scrollIntoView({ block: "center" });
      if (pipRail) {
        const ps = pipRail.children;
        for (let i = 0; i < ps.length; i++) ps[i].classList.toggle("current", i === hunkIdx);
      }
      updateNav();
    }

    // 状态归本模块后，app.js 里两处直接改 hunks/hunkIdx 的编排代码需要入口——
    // 以下两个薄封装逐语句对应原调用点，不引入新行为：
    // reset()：render() 错误边界的「hunks=[]; hunkIdx=-1; updateNav();」三连。
    // 注意错误态只 updateNav 不 renderPips（隐藏轨道但不清空其 DOM），保持原语义。
    function reset() {
      hunks = []; hunkIdx = -1; updateNav();
    }
    // jumpTo(i)：stats/pip 点击的既有模式「hunkIdx = i - 1 再 jump(1)」。
    // stats 点击等价于 jumpTo(0)；pip 点击传 Number(p.dataset.pip)。
    // !hunks.length 守卫从原绑定处内移，空态下同样不发生任何状态变更。
    function jumpTo(i) {
      if (!hunks.length) return;
      hunkIdx = i - 1;
      jump(1);
    }

    // 导出面=实际消费面（RULEBOOK §1 v2 先例）：updateNav 仅被模块内部调用，保持私有。
    return { indexHunks, renderPips, jump, jumpTo, reset };
  }

  root.DiffLensNav = init;
})(typeof window !== "undefined" ? window : globalThis);
// REFACTOR STATUS: confidence=high todos=0
