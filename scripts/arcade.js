/* 音游展示区渲染（v1.25 · AI-GEN）
 * 数据分离：从 arcade.json 读取曲目数据，动态渲染成斜切角卡片网格。
 * 新增/调整曲目只需改 arcade.json，无需改动 HTML/CSS。
 * 依赖：主页 <div class="arcade-grid" id="arcadeGrid"> 与 style.css 第 12 节样式。
 * 降级：JSON 加载失败或脚本未启用时，网格保持为空并给出提示，不影响页面其他部分。 */
(function () {
  "use strict";

  var grid = document.getElementById("arcadeGrid");
  if (!grid) {
    return; // 结构缺失时静默退出（与 stickman.js 一致的降级策略）
  }

  /* [AI-GEN] 渲染网格。JSON 结构（极简）：
   * [{ "title": "曲名", "image": "assets/arcade/xxx.jpg" }, ...] */
  function render(items) {
    var frag = document.createDocumentFragment();
    items.forEach(function (item, i) {
      if (!item || !item.title || !item.image) return;

      var card = document.createElement("a");
      card.className = "arcade-card reveal";
      card.href = item.image; // 点击查看原图（大图结算截图）
      card.target = "_blank";
      card.rel = "noopener";
      card.setAttribute("aria-label", "音游曲目：" + item.title);
      if (i % 2 === 1) card.classList.add("arcade-card-tilted"); // 轻微交错，增强节奏感

      var img = document.createElement("img");
      img.src = item.image;
      img.alt = item.title;
      img.loading = "lazy";
      img.decoding = "async";

      var title = document.createElement("span");
      title.className = "arcade-title";
      title.textContent = item.title;

      var scan = document.createElement("span");
      scan.className = "arcade-scanline";
      scan.setAttribute("aria-hidden", "true");

      card.appendChild(img);
      card.appendChild(title);
      card.appendChild(scan);
      frag.appendChild(card);
    });
    grid.appendChild(frag);
    initDragScroll();

    /* 动态插入的卡片需要手动接入滚动进场动画（main.js 的 IntersectionObserver
     * 只在页面加载时观察一次静态 .reveal 元素）。 */
    var revealEls = grid.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add("visible"); });
    }
  }

  /* [AI-GEN] 桌面鼠标拖拽滑动：pointer 事件驱动，拖动超过阈值视为滑动并抑制点击
   （卡片为 <a>，正常点击仍可打开原图；触屏设备由浏览器原生 touch 滚动处理）。 */
  function initDragScroll() {
    var startX = 0, startY = 0, startLeft = 0, dragging = false, suppressed = false;

    grid.addEventListener("pointerdown", function (e) {
      // 仅响应鼠标左键，避免干扰触屏原生滚动
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = grid.scrollLeft;
      dragging = true;
      suppressed = false;
      grid.setPointerCapture(e.pointerId);
    });

    grid.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      // 位移超过 6px 判定为拖拽，进入 grab 态并禁止点击穿透
      if (!suppressed && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
        suppressed = true;
        grid.classList.add("arcade-dragging");
      }
      if (suppressed) {
        grid.scrollLeft = startLeft - dx;
        e.preventDefault();
      }
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      grid.classList.remove("arcade-dragging");
      if (suppressed) {
        e.preventDefault();
        suppressed = false;
      }
    }
    grid.addEventListener("pointerup", endDrag);
    grid.addEventListener("pointercancel", endDrag);
    // 拖拽过的点击直接拦截，避免误触打开大图
    grid.addEventListener("click", function (e) {
      if (suppressed) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  }

  /* [AI-GEN] 加载失败兜底：网格内给出提示（黄黑主题小字）。 */
  function showError(err) {
    var p = document.createElement("p");
    p.className = "arcade-error";
    p.textContent = "[ARCADE] 音游档案加载失败：无法读取 arcade.json（" + (err && err.message ? err.message : "未知错误") + "）";
    grid.appendChild(p);
  }

  /* [AI-GEN] 内联数据兜底：直接双击打开（file:// 协议）时浏览器会拦截 fetch，
   * 此时读取 <script type="application/json" id="arcadeData"> 中内嵌的数据副本，
   * 保证本地直开也能正常渲染卡片；线上环境仍优先读取 arcade.json（数据分离不变）。 */
  function loadInline() {
    var el = document.getElementById("arcadeData");
    if (!el) return null;
    try {
      var items = JSON.parse(el.textContent);
      return Array.isArray(items) ? items : null;
    } catch (e) {
      return null;
    }
  }

  fetch("arcade.json", { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (items) {
      if (!Array.isArray(items)) throw new Error("arcade.json 顶层应为数组");
      render(items);
    })
    .catch(function (err) {
      var inline = loadInline();
      if (inline) {
        render(inline);
        return;
      }
      showError(err);
    });
})();
