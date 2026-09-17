/* ============================================================
   音乐播放器（v1.23）[AI-GEN]
   - 右下角 🎵 悬浮徽章 → 点击在按钮上方弹出「赛博随身听」浮窗；
     再次点击徽章（或点浮窗 ×）关闭。
   - 默认不自动播放；首次打开浮窗时才动态创建网易云外链 iframe
     （懒加载，优化首屏性能）。
   - iframe 接入方式（二选一，见下方 [MANUAL]）：
     方式 A：把网易云官方 <iframe> 代码直接粘贴到 index.html 的
             #music-player-container 内（推荐，src 随官方代码自带）。
     方式 B：把外链地址填到下方 MUSIC_SRC 常量，由本脚本动态生成 iframe。
   ============================================================ */
(function () {
  "use strict";

  // [MANUAL] 方式 B：网易云外链地址（//music.163.com/outchain/player?type=2&id=歌曲ID&auto=0&height=66）
  // 如果用方式 A（直接粘贴 iframe 到 HTML），请把这里留空字符串。
  // 也可不改本文件：在 index.html 的 <body> 末尾提前写
  //   <script>window.MUSIC_SRC = "//music.163.com/outchain/player?type=2&id=xxx&auto=0&height=66";</script>
  var MUSIC_SRC = (typeof window.MUSIC_SRC !== "undefined" && window.MUSIC_SRC) ? String(window.MUSIC_SRC) : "";

  var badge, pop, container, closeBtn;
  var loaded = false; // iframe 是否已创建

  function $(id) { return document.getElementById(id); }

  function init() {
    badge = $("musicBadge");
    pop = $("musicPop");
    container = $("music-player-container");
    closeBtn = $("musicClose");

    // 结构缺失时静默退出，不影响页面其他功能
    if (!badge || !pop || !container) return;

    badge.addEventListener("click", toggle);
    if (closeBtn) closeBtn.addEventListener("click", close);
  }

  function toggle() {
    if (pop.classList.contains("is-open")) {
      close();
    } else {
      open();
    }
  }

  function open() {
    loadPlayerOnce(); // 首次打开才创建 iframe
    pop.classList.add("is-open");
    pop.setAttribute("aria-hidden", "false");
    badge.setAttribute("aria-expanded", "true");
  }

  function close() {
    pop.classList.remove("is-open");
    pop.setAttribute("aria-hidden", "true");
    badge.setAttribute("aria-expanded", "false");
  }

  // [AI-GEN] 懒加载：只在首次打开时创建 iframe；之后开关浮窗不再重复创建
  function loadPlayerOnce() {
    if (loaded) return;
    loaded = true;

    // 方式 A：HTML 里已粘贴官方 iframe，直接使用，无需再创建
    if (container.querySelector("iframe")) return;

    // 方式 B：按 MUSIC_SRC 动态生成
    if (!MUSIC_SRC) return;

    var frame = document.createElement("iframe");
    frame.src = MUSIC_SRC;
    frame.setAttribute("frameborder", "0");
    frame.setAttribute("allow", "autoplay; encrypted-media; clipboard-write");
    frame.setAttribute("allowfullscreen", "true");
    frame.style.width = "100%";
    frame.style.height = "86px"; // 与 index.html 中直接粘贴的 iframe 高度一致（内容 66px + 留白）
    container.appendChild(frame);
  }

  init();
})();
