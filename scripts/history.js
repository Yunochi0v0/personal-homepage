/* ============================================================
   开发历程弹窗（v1.41 · [AI-GEN]）
   - 点击项目板块「本个人主页」（MISSION_01）条目 → 弹出本网站开发历程
   - 历程按用户划分的三大阶段展示：
       V1.0 更改光标之前（v1.0 ~ v1.7，2026-09-03 ~ 2026-09-10）
       V2.0 光标 → 发布 GitHub（V2.8 ~ V2.21，2026-09-10 ~ 2026-09-17）
       V3.0 发布 GitHub 之后（V3.22 ~ 至今，2026-09-17 ~ 至今）
   - 数据集中在下方 STAGES 中（与 arcade.js 同款「数据分离」模式），
     新增版本只改数据，不碰弹窗逻辑与 HTML。
   - 关闭方式：右上角 × / 点击遮罩 / 按 Esc，三种均可。
   - 无障碍：遮罩 role="dialog" aria-modal，aria-hidden 随开合切换；
     Esc 监听仅在弹窗打开期间挂载、关闭时移除（不污染页面其它键盘逻辑）。
   - 动态乱码：数据中用 {GARBLE:n} 占位一段 n 位乱码口令，渲染时替换为
     乱码 <span>；弹窗打开期间每 0.3s 从第 1 位到最后一位依次刷新一个字符，
     产生「逐位滚动乱码」效果；弹窗关闭时清除定时器。reduced-motion 下不滚动。
   ============================================================ */
(function () {
  "use strict";

  /* ===== 开发历程数据 ===== */
  var STAGES = [
    {
      stage: "V1.0",
      range: "v1.0 ~ v1.7",
      period: "2026-09-03 ~ 2026-09-10",
      theme: "更改光标之前 · 从零到一的建站期",
      desc: "建立个人主页 MVP，奠定黑黄赛博朋克视觉基调；补齐数字孪生、动漫头像、官方校徽、液态玻璃交互与页脚彩蛋，最后以 macOS 风格悬浮 Dock 替换顶部导航。",
      versions: [
        { v: "v1.0", date: "2026-09-03", text: "个人主页 MVP 初始建立：Hero / 关于 / 技能 / 项目 / 联系 / 页脚" },
        { v: "v1.1", date: "2026-09-07", text: "新增数字孪生区块：纯前端对话式「虚拟的我」" },
        { v: "v1.2", date: "2026-09-07", text: "默认文字头像替换为动漫头像" },
        { v: "v1.3", date: "2026-09-07", text: "官方校徽图片替换文字占位校徽（TJU / PolyU）" },
        { v: "v1.4", date: "2026-09-07", text: "全站可交互按钮加入液态玻璃质感" },
        { v: "v1.5", date: "2026-09-07", text: "{GARBLE:29}" },
        { v: "v1.6", date: "2026-09-07", text: "全站 slogan 更正为「梦想即力量」" },
        { v: "v1.7", date: "2026-09-10", text: "顶部导航替换为 macOS 风格悬浮 Dock" }
      ]
    },
    {
      stage: "V2.0",
      range: "V2.8 ~ V2.21",
      period: "2026-09-10 ~ 2026-09-17",
      theme: "光标 → 发布 GitHub · 视觉与彩蛋打磨期",
      desc: "从自定义霓虹光标起步，逐步叠加像素风、CRT 扫描线、彩蛋浮层与开机动画；项目区改造为 MISSION 全息列表，待机彩蛋加入警报与乱码；最后上线 GitHub 卡片、当前状态仪表盘与「故障解除」退出动画。",
      versions: [
        { v: "V2.8", date: "2026-09-10", text: "自定义霓虹光标 + 轨迹拖尾 + 四芒星交互形态" },
        { v: "V2.9", date: "2026-09-10", text: "像素风格（8-bit）：像素字体 / 台阶切角 / 硬阴影 / 动态正弦波背景" },
        { v: "V2.10", date: "2026-09-10", text: "{GARBLE:17}" },
        { v: "V2.11", date: "2026-09-10", text: "复古 CRT 开启动画：约 4.6 秒终端解密自检" },
        { v: "V2.12", date: "2026-09-10", text: "{GARBLE:13}" },
        { v: "V2.13", date: "2026-09-10", text: "开启动画播放期间隐藏鼠标光标" },
        { v: "V2.14", date: "2026-09-10", text: "Dock 栏整体深色半透明毛玻璃底板" },
        { v: "V2.15", date: "2026-09-10", text: "四芒星光标由黄色改为青色，与按钮点亮色区分" },
        { v: "V2.16", date: "2026-09-10", text: "叠加 CRT 水平扫描线与全页微弱噪点" },
        { v: "V2.17", date: "2026-09-10", text: "项目区改为 MISSION 任务列表 + 悬停全息简报面板" },
        { v: "V2.18", date: "2026-09-10", text: "{GARBLE:25}" },
        { v: "V2.19", date: "2026-09-14", text: "待机乱码铺满全屏（按视口实测字符动态计算行列）" },
        { v: "V2.20", date: "2026-09-17", text: "Hero 当前状态座舱仪表盘 + 联系区 GitHub 卡片上线" },
        { v: "V2.21", date: "2026-09-17", text: "{GARBLE:21}" }
      ]
    },
    {
      stage: "V3.0",
      range: "V3.22 ~ 至今",
      period: "2026-09-17 ~ 至今",
      theme: "发布 GitHub 之后 · 功能与物理引擎迭代期",
      desc: "发布到 GitHub Pages 公开上线后转入功能与玩法迭代：访客反馈 + Supabase 后台、网易云音乐播放器、赛博火柴人彩蛋与音游展示区；随后对火柴人连续做橡皮管拉伸、弹性绳子物理、Q 弹挤压与软绳弧等 10+ 个小版本打磨；再到开发历程弹窗、数字孪生定制与第三个键盘彩蛋。",
      versions: [
        { v: "V3.22", date: "2026-09-17", text: "访客反馈功能 + Supabase 后台（V3 课件 · 发布 GitHub Pages）" },
        { v: "V3.23", date: "2026-09-17", text: "网易云音乐播放器：右下角 🎵 入口 + 赛博随身听浮窗" },
        { v: "V3.24", date: "2026-09-17", text: "{GARBLE:27}" },
        { v: "V3.25", date: "2026-09-18", text: "音游展示区：世界计划 MASTER 全连记录（数据驱动渲染）" },
        { v: "V3.26", date: "2026-09-18", text: "火柴人橡皮管拉伸改造：三层 DOM 解耦，防 transform 冲突" },
        { v: "V3.30", date: "2026-09-18", text: "火柴人中层仅结构占位，不再直接写 transform" },
        { v: "V3.33", date: "2026-09-18", text: "躯干绳子节点重写：贝塞尔 path + Verlet 质点弹簧" },
        { v: "V3.34", date: "2026-09-18", text: "弹性绳子 + 抓取点感知 + 镜像补偿（甩出波浪、波动回弹）" },
        { v: "V3.35", date: "2026-09-18", text: "拖动速度注入：快速甩动目标超前，Q 弹手感" },
        { v: "V3.36", date: "2026-09-18", text: "双臂软连接：切线旋转跟随 + 速度保留弹性滞后" },
        { v: "V3.37", date: "2026-09-18", text: "中层 Q 弹挤压动画：落地 / 松手压扁拉长衰减恢复" },
        { v: "V3.38", date: "2026-09-18", text: "手臂连接平滑去锯齿：宽差分切线 + 角度单帧限幅" },
        { v: "V3.39", date: "2026-09-18", text: "待机软绳弧：静止躯干呈自然弧线而非僵直直线" },
        { v: "V3.40", date: "2026-09-18", text: "走路挺直：拖动中弧线收平不驼背，松手弹回软绳弧" },
        { v: "V3.41", date: "2026-09-20", text: "项目板块新增开发历程弹窗：LOG 按钮 + 三大阶段数据驱动展示（V1.0 建站 / V2.0 光标→GitHub / V3.0 发布后迭代）" },
        { v: "V3.41.1", date: "2026-09-20", text: "{GARBLE:95}" },
        { v: "V3.41.2", date: "2026-09-20", text: "{GARBLE:51}" },
        { v: "V3.42", date: "2026-09-20", text: "成就系统上线：主页新增成就栏，浏览 / 互动解锁成就并点亮，达成时右下角弹出 Steam 风格提示" },
        { v: "V3.42.1", date: "2026-09-20", text: "成就系统 10 项成就落地：待机彩蛋 / 彩蛋关卡 / 诗云传送 / 停留 10 分钟 / 全成就收藏家" },
        { v: "V3.42.2", date: "2026-09-20", text: "页脚新增「了解更多」按钮：点击跳转 B 站视频（BV1UT42167xb），新标签页打开" },
        { v: "V3.42.3", date: "2026-09-20", text: "成就简介保密：未解锁的成就一律以「???」代替简介，不再展示达成条件" },
        { v: "V3.42.4", date: "2026-09-20", text: "新增成就「你被骗了」：点击页脚「了解更多」按钮解锁" },
        { v: "V3.42.5", date: "2026-09-20", text: "多语言切换：左上角 EN / 中 按钮一键切换整站中英文，成就 / 数字孪生 / 打字机 slogan 随语言切换（当前版本）" }
      ]
    }
  ];

  var overlay, panel, closeBtn, stageList;
  var garbleSpans = [];  // 弹窗中所有乱码 <span>（打开期间每个都滚动刷新）
  var garbleTimers = []; // 各乱码 span 的 setInterval 句柄，空数组表示未运行
  /* 不含 HTML 敏感字符（尖括号 / 与号 / 双引号 / 单引号 / 空格），确保 span 文本可安全内联渲染 */
  var GARBLE_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^*-_=+[];:,.?\\/";

  function $(id) { return document.getElementById(id); }

  function randGarbleChar() {
    return GARBLE_CHARS.charAt(Math.floor(Math.random() * GARBLE_CHARS.length));
  }

  function makeGarble(n) {
    var s = "";
    for (var i = 0; i < n; i++) s += randGarbleChar();
    return s;
  }

  /* 替换文本中的 {GARBLE:n} 占位符为乱码 <span>（支持同一条文本内多处占位，
     每个占位都渲染为独立乱码 span），返回处理后的文本 */
  function replaceGarble(text) {
    var out = "";
    var rest = text;
    while (true) {
      var m = /^([\s\S]*?)\{GARBLE:(\d+)\}([\s\S]*)$/.exec(rest);
      if (!m) {
        out += rest;
        break;
      }
      var n = parseInt(m[2], 10);
      if (!(n > 0)) {
        out += m[1] + m[3];
        break;
      }
      out +=
        m[1] +
        '<span class="history-garble" aria-label="乱码口令">' +
        makeGarble(n) +
        "</span>";
      rest = m[3];
    }
    return out;
  }

  /* 弹窗打开期间：每个乱码 <span> 每 0.3s 从第 1 位到最后一位依次刷新一个乱码字符 */
  function startGarble() {
    if (!garbleSpans.length || garbleTimers.length) return;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return; // 减弱动态效果：保持静态乱码，不滚动
    for (var i = 0; i < garbleSpans.length; i++) {
      (function (span) {
        var len = span.textContent.length;
        var pos = 0;
        garbleTimers.push(setInterval(function () {
          var chars = span.textContent.split("");
          chars[pos] = randGarbleChar();
          span.textContent = chars.join("");
          pos = (pos + 1) % len;
        }, 300));
      })(garbleSpans[i]);
    }
  }

  function stopGarble() {
    for (var i = 0; i < garbleTimers.length; i++) clearInterval(garbleTimers[i]);
    garbleTimers = [];
  }

  /* ---------- 弹窗开启动画：档案解密终端序列 ---------- */
  /* AI-generated: 与彩蛋 egg-boot 同语言（终端逐行打印 + 乱码滚动 +
     百分比进度条 + ACCESS GRANTED 闪烁 + 扫描线扫过），主题改为
     「开发历程档案解密」，总时长约 3 秒。动画期间点击或 Esc 可跳过；
     播完或跳过后才显示版本列表，保证弹窗内容始终可用。 */
  var BOOT_LINES = [
    "> CONNECTING ARCHIVE .............. OK",
    "> DECODING DEV LOG ",
    "> RECORDS v1.0 - v1.41 FOUND ..... OK",
    "> LOADING HISTORY "
  ];
  var BOOT_SCRAMBLE_CHARS = "!<>-_\\/[]{}=+*^?#0123456789";
  var BOOT_SCRAMBLE_INDEXES = [1, 3]; // 这两行在解密中阶段尾部字符随机滚动

  var bootRunning = false;
  var finishBoot = null;

  function playHistoryBoot() {
    var boot = document.getElementById("historyBoot");
    var log = document.getElementById("historyBootLog");
    var fill = document.getElementById("historyBootBarFill");
    var status = document.getElementById("historyBootStatus");

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 减弱动态效果，或动画元素缺失：直接显示内容，保证弹窗始终可用
    if (reduceMotion || !boot || !log) {
      if (overlay) overlay.classList.add("history-ready");
      startGarble();
      return;
    }

    // 复位（重复打开时重新播放）
    boot.classList.remove("is-done", "is-sweeping");
    log.textContent = "";
    if (fill) fill.style.width = "0%";
    if (status) {
      status.textContent = "";
      status.classList.remove("is-granted");
    }
    if (overlay) overlay.classList.remove("history-ready");

    var timers = [];
    var printed = [];
    var scrambleTimer = 0;
    var barTimer = 0;
    var settled = false;

    function at(ms, fn) {
      timers.push(setTimeout(fn, ms));
    }

    function render() {
      log.textContent = printed.join("\n");
    }

    function onBootKey(e) {
      if (e.key === "Escape" || e.keyCode === 27) finish();
    }

    function finish() {
      if (settled) return;
      settled = true;
      bootRunning = false;
      finishBoot = null;

      for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
      timers.length = 0;
      if (scrambleTimer) {
        clearInterval(scrambleTimer);
        scrambleTimer = 0;
      }
      if (barTimer) {
        clearInterval(barTimer);
        barTimer = 0;
      }
      window.removeEventListener("keydown", onBootKey);
      boot.removeEventListener("pointerdown", finish);

      boot.classList.add("is-done");
      if (overlay) overlay.classList.add("history-ready");
      startGarble();
    }

    finishBoot = finish;
    bootRunning = true;
    window.addEventListener("keydown", onBootKey);
    boot.addEventListener("pointerdown", finish);

    // ① 逐行打印解密日志（每行 400ms，总时长约 3 秒）
    BOOT_LINES.forEach(function (line, index) {
      at(100 + index * 400, function () {
        printed[index] = line;
        render();
      });
    });

    // ② 两行「解密中」日志：尾部乱码滚动约 0.5s 后定格
    BOOT_SCRAMBLE_INDEXES.forEach(function (index) {
      var startAt = 100 + index * 400;
      at(startAt + 60, function () {
        printed[index] = BOOT_LINES[index];
        scrambleTimer = setInterval(function () {
          var s = BOOT_LINES[index];
          for (var k = 0; k < 12; k++) {
            s += BOOT_SCRAMBLE_CHARS[Math.floor(Math.random() * BOOT_SCRAMBLE_CHARS.length)];
          }
          printed[index] = s;
          render();
        }, 70);
      });
      at(startAt + 560, function () {
        clearInterval(scrambleTimer);
        scrambleTimer = 0;
        printed[index] = BOOT_LINES[index] + "........... OK";
        render();
      });
    });

    // ③ 进度条：JS 逐帧推进并显示百分比（0 → 100%）
    at(1900, function () {
      var pct = 0;
      barTimer = setInterval(function () {
        pct = Math.min(100, pct + 2 + Math.floor(Math.random() * 3));
        if (fill) fill.style.width = pct + "%";
        if (status) status.textContent = "LOADING " + ("00" + pct).slice(-3) + "%";
        if (pct >= 100) {
          clearInterval(barTimer);
          barTimer = 0;
        }
      }, 34);
    });

    // ④ 结果与收尾：先收掉进度条，再闪烁 GRANTED + 扫描线
    at(2650, function () {
      if (barTimer) {
        clearInterval(barTimer);
        barTimer = 0;
      }
      if (fill) fill.style.width = "100%";
      if (!status) return;
      status.textContent = "ACCESS GRANTED";
      status.classList.add("is-granted");
    });
    at(2750, function () { boot.classList.add("is-sweeping"); });
    at(3100, finish);
  }

  function init() {
    overlay = $("historyOverlay");
    panel = $("historyModal");
    closeBtn = $("historyClose");
    stageList = $("historyStages");
    var trigger = $("historyTrigger"); // MISSION_01 行内的「开发历程」按钮

    // 结构缺失时静默退出，不影响页面其他功能
    if (!overlay || !stageList) return;

    renderStages();

    if (trigger) trigger.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", onOverlayClick);
  }

  /* 用 STAGES 数据渲染三阶段列表（数据驱动，避免在 HTML 里硬编码版本） */
  function renderStages() {
    var html = "";
    for (var i = 0; i < STAGES.length; i++) {
      var s = STAGES[i];
      var items = "";
      for (var j = 0; j < s.versions.length; j++) {
        var ver = s.versions[j];
        items +=
          '<li class="history-item">' +
            '<span class="history-ver">' + ver.v + '</span>' +
            '<span class="history-date">' + ver.date + '</span>' +
            '<span class="history-text">' + replaceGarble(ver.text) + '</span>' +
          '</li>';
      }
      html +=
        '<section class="history-stage">' +
          '<header class="history-stage-head">' +
            '<span class="history-stage-badge">' + s.stage + '</span>' +
            '<div class="history-stage-titles">' +
              '<h3 class="history-stage-theme">' + replaceGarble(s.theme) + '</h3>' +
              '<p class="history-stage-meta">' + s.range + ' · ' + s.period + '</p>' +
            '</div>' +
          '</header>' +
          '<p class="history-stage-desc">' + replaceGarble(s.desc) + '</p>' +
          '<ul class="history-list">' + items + '</ul>' +
        '</section>';
    }
    stageList.innerHTML = html;
    garbleSpans = [].slice.call(stageList.querySelectorAll(".history-garble"));
  }

  var onKeydown = null;

  function open() {
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    // 先注册弹窗级 keydown（Esc 处理），再播动画（动画注册自己的 onBootKey）。
    // 顺序保证 Esc 时先走 onKeydown：动画未结束先跳过（finish），结束则关闭弹窗。
    if (onKeydown) window.removeEventListener("keydown", onKeydown);
    onKeydown = function (e) {
      if (e.key === "Escape" || e.keyCode === 27) {
        // 动画未结束：第一次 Esc 先跳过动画，动画结束后再按才关闭
        if (bootRunning && finishBoot) finishBoot();
        else close();
      }
    };
    window.addEventListener("keydown", onKeydown);
    playHistoryBoot(); // 3 秒档案解密动画，播完显示内容
  }

  function close() {
    // 动画尚未结束就被关闭：先把动画收尾，避免定时器继续跑
    if (bootRunning && finishBoot) finishBoot();
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    stopGarble();
    if (onKeydown) {
      window.removeEventListener("keydown", onKeydown);
      onKeydown = null;
    }
  }

  function onOverlayClick(e) {
    if (e.target === overlay) close(); // 只响应遮罩本身，不响应面板内部
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
