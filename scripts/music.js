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

  // [MANUAL] 方式 B：网易云外链地址（https://music.163.com/outchain/player?type=2&id=歌曲ID&auto=0&height=66）
  // 如果用方式 A（直接粘贴 iframe 到 HTML），请把这里留空字符串。
  // 注意用显式 https 绝对地址（不用 // 协议相对）：本地 http://localhost 下
  // // 会解析成 http 再 302 重定向，个别浏览器对 iframe 内跨域重定向不跟随。
  // 也可不改本文件：在 index.html 的 <body> 末尾提前写
  //   <script>window.MUSIC_SRC = "https://music.163.com/outchain/player?type=2&id=xxx&auto=0&height=66";</script>
  var MUSIC_SRC = (typeof window.MUSIC_SRC !== "undefined" && window.MUSIC_SRC) ? String(window.MUSIC_SRC) : "";

  var badge, pop, container, closeBtn, backdrop;
  var loaded = false; // iframe 是否已创建

  // [AI-GEN] 播放状态检测（近似方案，驱动均衡器动画）：
  // 跨域 iframe 无法读取网易云播放器的真实播放/暂停状态，改用
  // performance.getEntriesByType("resource") 轮询——播放器点「播放」
  // 必然请求网易云音频直链（m*.music.126.net 的 mp3/m4a 等），父页面
  // 可见跨域资源条目；轮询发现新增音频请求即判定「正在播放」，
  // 持续无新请求超过 10s 判定「静止」（暂停判定最多滞后 10s）。
  // 局限：音频整体缓冲完成后播放中不再产生新请求，高网速下播放中后期
  // 可能提前显示静止；边下边播（缓冲未完成）场景下判定最准确。
  var eqTimer = null, seenAudio = -1, lastAudioAt = 0, playing = false;

  function audioEntries() {
    try {
      if (typeof performance === "undefined" || !performance.getEntriesByType) return [];
      return performance.getEntriesByType("resource").filter(function (e) {
        return /\.music\.126\.net/.test(e.name) && /\.(mp3|m4a|flac|aac)(\?|$)/i.test(e.name);
      });
    } catch (err) {
      return [];
    }
  }

  function applyEq() {
    if (pop) pop.classList.toggle("is-playing", playing);
  }

  function tick() {
    var entries = audioEntries();
    if (entries.length > seenAudio) {
      seenAudio = entries.length;
      lastAudioAt = Date.now();
      if (!playing) {
        playing = true;
        applyEq();
      }
    } else if (playing && Date.now() - lastAudioAt > 10000) {
      playing = false;
      applyEq();
    }
  }

  function startEqWatch() {
    if (eqTimer) return;
    // 无定时器环境（如命令行测试）静默跳过轮询，生产浏览器正常提供
    if (typeof setInterval !== "function" || typeof clearInterval !== "function") return;
    seenAudio = audioEntries().length; // 基线：此前已存在的音频请求不计为本次播放
    lastAudioAt = Date.now();
    eqTimer = setInterval(tick, 2000);
  }

  function stopEqWatch() {
    if (eqTimer) {
      clearInterval(eqTimer);
      eqTimer = null;
    }
    if (playing) {
      playing = false;
      applyEq();
    }
  }

  function $(id) { return document.getElementById(id); }

  function init() {
    badge = $("musicBadge");
    pop = $("musicPop");
    container = $("music-player-container");
    closeBtn = $("musicClose");
    backdrop = $("musicBackdrop");

    // 结构缺失时静默退出，不影响页面其他功能
    if (!badge || !pop || !container) return;

    badge.addEventListener("click", toggle);
    if (closeBtn) closeBtn.addEventListener("click", close);
    // [AI-GEN] 点击背景遮罩关闭浮窗（遮罩元素缺失时忽略，兼容老结构）
    if (backdrop) backdrop.addEventListener("click", close);
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
    // [AI-GEN] 背景淡遮罩同步点亮，突出浮窗（与 .music-backdrop.is-open 配套）
    if (backdrop) {
      backdrop.classList.add("is-open");
      backdrop.setAttribute("aria-hidden", "false");
    }
    // [AI-GEN] 打开浮窗时启动播放状态监测（驱动均衡器）
    startEqWatch();
  }

  function close() {
    pop.classList.remove("is-open");
    pop.setAttribute("aria-hidden", "true");
    badge.setAttribute("aria-expanded", "false");
    if (backdrop) {
      backdrop.classList.remove("is-open");
      backdrop.setAttribute("aria-hidden", "true");
    }
    stopEqWatch(); // 浮窗已隐藏，均衡器不可见，停止轮询省资源
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
