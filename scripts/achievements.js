/* ============================================================
 * 成就系统（v1.42.0 · AI-GEN）
 * ------------------------------------------------------------
 * 功能：
 *   1. 主页「成就」板块展示全部成就，已解锁的卡片点亮，未解锁保持暗色；
 *   2. 达成成就时，网页右下角弹出 Steam 风格的成就提示（可排队）；
 *   3. 解锁进度持久化到 localStorage，刷新后保持点亮。
 *
 * 扩展方法（后续自定义成就）：
 *   A. 在下方 ACHIEVEMENTS 数组中新增一条记录：
 *      { id: "唯一id", title: "成就名", desc: "达成条件说明", icon: "图标(emoji 或 SVG)",
 *        hidden: true/false,        // true 表示解锁前隐藏名称与描述（显示 ???）
 *        check: function () { ... } // 可选：轮询检测器，返回 true 即解锁
 *      }
 *   B. 若要由其他模块的事件触发（而非轮询），在对应代码里调用：
 *      window.Achievements.unlock("唯一id");
 *      （例：feedback 提交成功后、copy 彩蛋触发后、音乐播放后……）
 *   C. 轮询检测器每 2 秒执行一次所有 check()，请保持轻量（只读 DOM/变量，勿产生副作用）。
 * ============================================================ */
(function () {
  "use strict";

  /* ---------- 1. 成就定义 ----------
   * 每项: id / title / desc / icon / hidden?(解锁前显示 ???) / check?(轮询检测)
   * 事件触发的成就(check 返回 false):由其他模块调用 window.Achievements.unlock("id")。
   * 已知事件源(见 main.js):彩蛋页输入「梦想即力量」→ dream_power;输入「诗云」→ shiyun_poet;
   * 「了解更多」按钮 click → more_clicked(见 init())。 */
  var ACHIEVEMENTS = [
    {
      id: "first_visit",
      title: "初来乍到",
      titleEn: "First Visit",
      desc: "首次访问本网站",
      descEn: "First visit to this site",
      icon: "👋",
      hidden: false,
      check: function () { return true; } // 首次访问自动解锁（演示 Toast 效果）
    },
    {
      id: "open_log",
      title: "档案解密",
      titleEn: "Archive Decrypted",
      desc: "打开开发历程 LOG 弹窗",
      descEn: "Open the dev history LOG popup",
      icon: "📜",
      hidden: false,
      check: function () {
        var ov = document.getElementById("historyOverlay");
        return !!ov && ov.classList.contains("is-open");
      }
    },
    {
      id: "many_clones",
      title: "好多小人",
      titleEn: "So Many Clones",
      desc: "输入 copy 召唤 10 个火柴人（上限）",
      descEn: "Type 'copy' to summon 10 stickmen (the cap)",
      icon: "🤖",
      hidden: false,
      check: function () {
        return document.querySelectorAll(".stickman-clone").length >= 9; // 本体 1 + 复制 9 = 10
      }
    },
    {
      id: "idle_alert",
      title: "还有人类吗",
      titleEn: "Any Humans Left?",
      desc: "触发待机彩蛋（3 分钟无操作警报）",
      descEn: "Trigger the idle easter egg (3-min inactivity alert)",
      icon: "🚨",
      hidden: false,
      check: function () {
        var egg = document.getElementById("idleEgg");
        return !!egg && egg.classList.contains("revealed");
      }
    },
    {
      id: "lyc_nb",
      title: "lyc确实nb",
      titleEn: "lyc is indeed nb",
      desc: "键盘输入 lycnb 打开隐藏关卡",
      descEn: "Type 'lycnb' to open the hidden level",
      icon: "⭐",
      hidden: false,
      check: function () {
        var egg = document.getElementById("easterEgg");
        return !!egg && egg.classList.contains("revealed");
      }
    },
    {
      id: "dream_power",
      title: "梦想无限大！！！！！",
      titleEn: "Dream Power Unlocked!!!!!",
      desc: "在彩蛋页面输入「梦想即力量」",
      descEn: "Type the secret phrase in the hidden level (梦想即力量)",
      icon: "✨",
      hidden: false,
      check: function () {
        // 兜底：submit 时 main.js 会即时 unlock；此处捕获 triggered 状态的残留
        var egg = document.getElementById("easterEgg");
        return !!egg && egg.classList.contains("triggered");
      }
    },
    {
      id: "shiyun_poet",
      title: "这诗人吗？",
      titleEn: "A Poet?",
      desc: "输入暗语「诗云」进入诗云页面",
      descEn: "Type the secret code (诗云) to enter the Shiyun page",
      icon: "🌌",
      hidden: false,
      check: function () { return false; } // 由 main.js「诗云」分支事件解锁
    },
    {
      id: "feedback_sent",
      title: "我爱反馈",
      titleEn: "I Love Feedback",
      desc: "成功提交一条访客反馈",
      descEn: "Successfully submit a visitor feedback",
      icon: "📡",
      hidden: false,
      check: function () {
        var box = document.getElementById("fbSuccess");
        return !!box && !box.hidden;
      }
    },
    {
      id: "kksk",
      title: "kksk",
      titleEn: "kksk",
      desc: "在本网站停留 10 分钟",
      descEn: "Stay on this site for 10 minutes",
      icon: "⏱️",
      hidden: false,
      check: function () {
        return typeof startTs === "number" && startTs > 0 && Date.now() - startTs >= 600000;
      }
    },
    {
      id: "more_clicked",
      title: "你被骗了",
      titleEn: "You've Been Tricked",
      desc: "点击页脚「了解更多」按钮",
      descEn: "Click the 'Learn More' button in the footer",
      icon: "🪤",
      hidden: false,
      check: function () { return false; } // 由「了解更多」按钮 click 事件解锁（见 init()）
    },
    {
      id: "all_achiever",
      title: "成就收藏家",
      titleEn: "Achievement Collector",
      desc: "完成全部其他成就",
      descEn: "Complete all other achievements",
      icon: "🏆",
      hidden: true,
      check: function () {
        var n = 0;
        for (var i = 0; i < ACHIEVEMENTS.length; i++) {
          if (ACHIEVEMENTS[i].id !== "all_achiever" && unlocked[ACHIEVEMENTS[i].id]) n++;
        }
        return n === ACHIEVEMENTS.length - 1;
      }
    }
  ];

  /* ---------- 2. 常量与状态 ---------- */
  var STORAGE_KEY = "personal-homepage-achievements-v1";
  var START_KEY = STORAGE_KEY + "-start"; // 首次访问时间戳（kksk：停留 10 分钟）
  var CHECK_INTERVAL = 2000;  // 轮询检测间隔（毫秒）
  var TOAST_DURATION = 4200;  // 单条提示停留时长（毫秒）
  var unlocked = {};          // id -> 解锁时间戳
  var byId = {};              // id -> 成就定义（查询缓存）
  var toastQueue = [];        // 待播放的提示队列
  var toastBusy = false;
  var startTs = 0;            // 首次访问时间（kksk 检测用）

  /* ---------- 3. 持久化 ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var obj = JSON.parse(raw);
        for (var k in obj) if (obj.hasOwnProperty(k)) unlocked[k] = obj[k];
      }
    } catch (e) { /* 隐私模式等场景下静默降级为会话内有效 */ }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked)); }
    catch (e) { /* 同上，忽略 */ }
  }

  /* 首次访问时间：本地持久化，关闭再打开不重置（kksk 累计 10 分钟） */
  function loadStartTs() {
    try { startTs = parseInt(localStorage.getItem(START_KEY) || "0", 10) || 0; }
    catch (e) { startTs = 0; }
    if (!startTs) {
      startTs = Date.now();
      try { localStorage.setItem(START_KEY, String(startTs)); } catch (e) { /* 忽略 */ }
    }
  }

  /* ---------- 4. 成就栏渲染 ---------- */
  /* 按当前语言取成就标题/描述（v1.42.5 · AI-GEN）
   * 英文态优先 titleEn/descEn；无英文词条或中文态回退原文。 */
  function isEn() { return typeof window.I18n === "object" && window.I18n.lang === "en"; }
  function aTitle(a) { return isEn() && a.titleEn ? a.titleEn : a.title; }
  function aDesc(a) { return isEn() && a.descEn ? a.descEn : a.desc; }
  function tr(zh) { return isEn() && typeof window.I18n === "object" ? window.I18n.t(zh) : zh; }

  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  function formatTime(ts) {
    var d = new Date(ts);
    return (
      d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) +
      " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes())
    );
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function render() {
    var grid = document.getElementById("achievementGrid");
    if (!grid) return;
    var html = "";
    var count = 0;
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
      var a = ACHIEVEMENTS[i];
      var isUnlocked = !!unlocked[a.id];
      if (isUnlocked) count++;
      var visible = isUnlocked || !a.hidden;
      html +=
        '<div class="ach-card ' + (isUnlocked ? "is-unlocked" : "is-locked") + '"' +
          (isUnlocked ? ' title="' + tr("解锁于 ") + formatTime(unlocked[a.id]) + '"' : ' title="' + tr("尚未解锁") + '"') + ">" +
          '<div class="ach-card-icon">' + (isUnlocked ? a.icon : "🔒") + "</div>" +
          '<div class="ach-card-title">' + esc(visible ? aTitle(a) : "???") + "</div>" +
          // 简介保密：未解锁一律显示 ???，不展示任何达成条件（v1.42.3）
          '<div class="ach-card-desc">' + esc(isUnlocked ? aDesc(a) : "???") + "</div>" +
          (isUnlocked
            ? '<div class="ach-card-time">' + tr("解锁于 ") + formatTime(unlocked[a.id]) + "</div>"
            : '<div class="ach-card-locked-tag">' + tr("未解锁") + "</div>") +
        "</div>";
    }
    grid.innerHTML = html;
    var counter = document.getElementById("achievementCounter");
    if (counter) {
      counter.textContent = count + " / " + ACHIEVEMENTS.length;
    }
  }

  /* ---------- 5. 解锁与 Toast（Steam 风格，右下角排队播放） ---------- */
  function unlock(id, silent) {
    var a = byId[id];
    if (!a || unlocked[id]) return false;
    unlocked[id] = Date.now();
    save();
    render();
    if (!silent) showToast(a);
    // 即时检查「成就收藏家」：除它之外全部解锁即自动获得（tick 轮询亦兜底）
    if (id !== "all_achiever" && checkAllDone()) unlock("all_achiever");
    return true;
  }

  /* 除 all_achiever 外是否全部解锁 */
  function checkAllDone() {
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
      var a = ACHIEVEMENTS[i];
      if (a.id !== "all_achiever" && !unlocked[a.id]) return false;
    }
    return true;
  }

  function isUnlocked(id) { return !!unlocked[id]; }

  function showToast(a) {
    var host = document.getElementById("achievementToasts");
    if (!host) return;
    toastQueue.push(a);
    if (toastBusy) return; // 队列里正在播放，排后面
    toastBusy = true;
    nextToast(host);
  }

  function nextToast(host) {
    if (!toastQueue.length) { toastBusy = false; return; }
    var a = toastQueue.shift();
    var el = document.createElement("div");
    el.className = "ach-toast";
    el.setAttribute("role", "status");
    el.innerHTML =
      '<div class="ach-toast-icon">' + (a.icon || "🏆") + "</div>" +
      '<div class="ach-toast-body">' +
        '<p class="ach-toast-head">' + (isEn() ? "ACHIEVEMENT UNLOCKED" : "成就解锁 · ACHIEVEMENT UNLOCKED") + "</p>" +
        '<p class="ach-toast-title">' + esc(aTitle(a)) + "</p>" +
        '<p class="ach-toast-desc">' + esc(aDesc(a)) + "</p>" +
      "</div>";
    host.appendChild(el);
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var leave = function () {
      el.classList.add("is-leaving");
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        nextToast(host); // 播完下一条
      }, reduceMotion ? 0 : 280);
    };

    if (reduceMotion) {
      // 减弱动态效果：直接淡入显示，停留后直接移除
      el.classList.add("is-static");
      setTimeout(leave, TOAST_DURATION);
      return;
    }
    el.classList.add("is-in"); // 触发滑入动画
    setTimeout(leave, TOAST_DURATION);
  }

  /* ---------- 6. 检测器（每 2 秒轮询一次所有 check()，解锁则为点亮） ---------- */
  function tick() {
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
      var a = ACHIEVEMENTS[i];
      if (unlocked[a.id] || typeof a.check !== "function") continue;
      try {
        if (a.check()) unlock(a.id);
      } catch (e) { /* 单个检测器异常不阻塞其他成就 */ }
    }
  }

  /* ---------- 7. 对外 API ---------- */
  window.Achievements = {
    unlock: unlock,           // 事件触发入口：Achievements.unlock("id")
    isUnlocked: isUnlocked,
    getById: function (id) { return byId[id] || null; },
    getAll: function () { return ACHIEVEMENTS.slice(); },
    refresh: render   // v1.42.5：语言切换后重渲染成就栏
  };

  /* ---------- 8. 初始化 ---------- */
  function init() {
    for (var i = 0; i < ACHIEVEMENTS.length; i++) byId[ACHIEVEMENTS[i].id] = ACHIEVEMENTS[i];
    load();
    loadStartTs();
    render();
    window.setInterval(tick, CHECK_INTERVAL);
    // 页面加载完成后立即跑一次检测（解锁 first_visit 等已满足的条件）
    window.setTimeout(tick, 600);

    /* 「你被骗了」：点击页脚「了解更多」按钮解锁（v1.42.4）
     * 按钮为 <a target="_blank"> 外链，主页面不跳转，click 事件内即时解锁即可。 */
    var moreBtn = document.querySelector(".footer .btn-more");
    if (moreBtn) {
      moreBtn.addEventListener("click", function () {
        try { unlock("more_clicked"); } catch (e) { /* 忽略 */ }
      });
    }

    // v1.42.5：语言切换后重渲染成就栏（标题/描述按语言显示）
    document.addEventListener("i18n:changed", render);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
