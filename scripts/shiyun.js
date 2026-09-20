/* ==========================================================================
   11. 诗云传送动画（v1.44 · AI-GEN · 动态真实星空版）
   AI-generated: 彩蛋浮层输入暗语「诗云」并回车后触发，将整站视为
   飞船舷窗上的一层全息显示，按序播放：

   ① 全站染红（红色遮罩 + 保留亮度的色相混合，页面由原色转为红色调）
   ② 乱码字符块与报错弹窗数量呈指数级暴增（每轮新增 2^n 个，直至极限）
   ③ 达到极限后屏幕黑屏
   ④ 黑屏中缓缓浮现飞船舷窗窗框（金属轮廓自纯黑中描出）
   ⑤ 舷窗内渐渐透出星空（canvas 动态星空：银河由数千尘埃微星构成雾状
      乳白光带、随机游走暗尘裂口、柔光晕十字衍射芒亮星、幂律星等分布、
      冷色星野；星野缓慢周日旋转、星星不规则双频闪烁、偶发流星、
      大气辉光与银河微光呼吸脉动）
   ⑥ 镜头拉近：舷窗与星空同步变焦放大，窗框滑出视口
   ⑦ 最终定格为纯星空画面后跳转至 shiyun.html；新页面以同一
      变焦定格画面无缝续接，星空保持动态（舷窗只存在于动画中）

   可用性保障：元素缺失、脚本异常或系统减弱动效时，直接降级为立即跳转，
   保证暗语永远可达；动画期间按 Esc 或点击遮罩可提前跳转。
   星空渲染 renderSky 同时供 shiyun.html 复用，保持两页视觉连续。
   ========================================================================== */
(function () {
  "use strict";

  var GLYPHS =
    "0101010101アイウエオカキクケコサシスセソabcdefghijkmnopqrstuvwxyz$#@!%&*+/=<>";
  var ERROR_TITLES = [
    "SYSTEM FAULT", "CRITICAL ERROR", "DATA CORRUPTED", "MEMORY LEAK",
    "SIGNAL LOST", "CORE DUMP", "OVERFLOW", "WARP BREACH",
    "KERNEL PANIC", "OUT OF SYNC", "HOLOGRAM DRIFT", "READ ERROR"
  ];
  var TARGET_URL = "shiyun.html";

  /* ---------- 星空渲染（index.html 遮罩与 shiyun.html 共用） ---------- */
  /* AI-generated（动态真实星空版）：以真实天文摄影为硬核参照——
     ① 动态：星野缓慢周日运动（天球自转）、星星不规则双频闪烁、
        偶发流星划过、大气辉光呼吸、银河微光脉动；
     ② 真实：银河乳白光带由数千颗暗弱尘埃微星构成（雾状质感），
         星星均为柔和圆形粒子光点（径向渐变光斑，中心亮、边缘渐隐，非方块），
         暗尘裂口为随机游走的不规则轮廓遮断（真实暗隙），
        亮星带柔光晕与细长十字衍射芒（照片级星芒），
        星等呈幂律分布（绝大多数暗星、少数亮星），冷色星野（冷白 / 蓝白 / 蓝紫，
        全页无黄色），深空背景带极弱大气辉光与摄影暗角。
     支持镜头变焦 setZoom（以视口中心为轴缩放，星体不糊）；
     shiyun.html 以定格变焦续接尾帧，星空持续动态。 */
  function renderSky(canvas, opts) {
    if (!canvas || !canvas.getContext) return null;
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, dpr = 1;
    var zoom = (opts && opts.zoom) ? opts.zoom : 1;

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth || window.innerWidth;
      H = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    /* 银河带参数：乳白光带斜穿画面（-26 度），银道面位于高 42% 处 */
    var BAND_CY = 0.42;
    var BAND_ANG = -0.46;
    var BAND_W = 0.2;

    /* 冷色星池（无黄）：白 / 蓝白 / 蓝 / 蓝紫 / 微青 */
    var CPAL = ["#ffffff", "#e8efff", "#dbe6ff", "#c9d8ff", "#aac8ff", "#9fb8ff", "#c0c8ff", "#b8d8ff"];

    /* 柔和粒子 sprite：中心亮、边缘透明渐隐的圆形光点（真实星点光斑，非方块）
       按颜色惰性生成并缓存，绘制时以 drawImage 缩放采样，抗锯齿平滑 */
    var SPR_CACHE = {};
    function particleSprite(hexColor) {
      if (SPR_CACHE[hexColor]) return SPR_CACHE[hexColor];
      var s = document.createElement("canvas");
      var SZ = 32;
      s.width = SZ; s.height = SZ;
      var c = s.getContext("2d");
      var r = parseInt(hexColor.slice(1, 3), 16);
      var g = parseInt(hexColor.slice(3, 5), 16);
      var b = parseInt(hexColor.slice(5, 7), 16);
      var grd = c.createRadialGradient(SZ / 2, SZ / 2, 0, SZ / 2, SZ / 2, SZ / 2);
      grd.addColorStop(0, "rgba(" + r + "," + g + "," + b + ",1)");
      grd.addColorStop(0.35, "rgba(" + r + "," + g + "," + b + ",0.6)");
      grd.addColorStop(0.7, "rgba(" + r + "," + g + "," + b + ",0.16)");
      grd.addColorStop(1, "rgba(" + r + "," + g + "," + b + ",0)");
      c.fillStyle = grd;
      c.fillRect(0, 0, SZ, SZ);
      SPR_CACHE[hexColor] = s;
      return s;
    }

    /* 普通星：幂律半径分布（绝大多数极小、少量较大，真实星野分布） */
    var stars = [];
    var i;
    for (i = 0; i < 1200; i++) {
      var sx = Math.random();
      var sy = Math.random();
      var v = (sy - BAND_CY) / BAND_W;
      var w = Math.exp(-v * v * 2.6);
      var inBand = Math.random() < 0.14 + 0.86 * w;
      var r = Math.pow(Math.random(), 2.1) * 2.1 + 0.3;
      if (inBand && Math.random() < 0.1) r += Math.random() * 0.7;
      stars.push({
        x: sx, y: sy, r: r,
        p: Math.random() * Math.PI * 2,
        s: 0.4 + Math.random() * 1.9,
        c: CPAL[(Math.random() * CPAL.length) | 0]
      });
    }

    /* 银河尘埃微星：数千颗极暗微星组成乳白光带（真实银河雾状质感） */
    var micro = [];
    for (i = 0; i < 3000; i++) {
      var mvy = (Math.random() - 0.5) * 2.2;        /* 带坐标 y 偏移（高斯聚集） */
      var mw = Math.exp(-mvy * mvy * 2.2);
      if (Math.random() > mw * 0.95 + 0.05) continue; /* 按聚集概率淘汰 → 约千余颗 */
      micro.push({
        x: Math.random() * W,                         /* 沿带方向（屏幕像素） */
        y: mvy * BAND_W * H,                          /* 相对银道面的垂直偏移（px） */
        r: 0.3 + Math.random() * 0.45,
        a: 0.15 + Math.random() * 0.4,
        c: Math.random() < 0.75 ? "#f2f6ff" : Math.random() < 0.5 ? "#dce6ff" : "#c8d6ff"
      });
    }

    /* 亮星（沿银道面 10 颗）：柔光晕 + 十字衍射芒（照片级星芒） */
    var brights = [];
    for (i = 0; i < 10; i++) {
      brights.push({
        x: 0.2 + Math.random() * 0.6,
        y: BAND_CY + (Math.random() - 0.5) * BAND_W * 1.15,
        r: 1.8 + Math.random() * 1.1,
        p: Math.random() * Math.PI * 2,
        s: 0.4 + Math.random() * 0.8,
        c: i % 3 === 0 ? "rgb(255, 255, 255)" : i % 3 === 1 ? "rgb(214, 228, 255)" : "rgb(168, 200, 255)"
      });
    }

    /* 暗尘埃裂口：沿带方向随机游走的不规则轮廓遮断（真实摄影暗隙） */
    var rifts = [];
    function buildRift(dyBase, hwBase, a) {
      var seg = Math.ceil((W * 2) / 55);           /* 每 55px 一个控制点 */
      var pts = [];
      var dy = dyBase * H, hw = hwBase * H;
      for (i = 0; i <= seg; i++) {
        dy += (Math.random() - 0.5) * 0.05 * H;
        hw *= 0.82 + Math.random() * 0.5;
        pts.push({ y: dy, hw: hw });
      }
      return { pts: pts, a: a, seg: seg };
    }
    rifts.push(buildRift(-0.15, 0.05, 0.5));
    rifts.push(buildRift(0.07, 0.03, 0.58));
    rifts.push(buildRift(0.24, 0.045, 0.4));

    /* 银河带弥散光：极淡雾状乳白底（质感主体由数千尘埃微星承担） */
    function drawBand() {
      ctx.save();
      ctx.translate(W * 0.5, H * BAND_CY);
      ctx.rotate(BAND_ANG);
      var bw = BAND_W * H;
      var g1 = ctx.createLinearGradient(0, -bw, 0, bw);
      g1.addColorStop(0, "rgba(190, 196, 226, 0)");
      g1.addColorStop(0.5, "rgba(205, 211, 240, 0.09)");
      g1.addColorStop(1, "rgba(190, 196, 226, 0)");
      ctx.fillStyle = g1;
      ctx.fillRect(-W, -bw, W * 2, bw * 2);
      var g2 = ctx.createLinearGradient(0, -bw * 2.1, 0, bw * 2.1);
      g2.addColorStop(0, "rgba(170, 180, 220, 0)");
      g2.addColorStop(0.5, "rgba(170, 180, 220, 0.035)");
      g2.addColorStop(1, "rgba(170, 180, 220, 0)");
      ctx.fillStyle = g2;
      ctx.fillRect(-W, -bw * 2.1, W * 2, bw * 4.2);
      /* 核心亮区：人马座方向的乳白明亮光斑（随呼吸微动） */
      var coreX = -W * 0.06, coreY = -bw * 0.08;
      var cg = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, bw * 1.7);
      cg.addColorStop(0, "rgba(225, 230, 250, 0.15)");
      cg.addColorStop(0.4, "rgba(210, 216, 242, 0.06)");
      cg.addColorStop(1, "rgba(205, 212, 240, 0)");
      ctx.fillStyle = cg;
      ctx.fillRect(coreX - bw * 1.7, coreY - bw * 1.7, bw * 3.4, bw * 3.4);
      ctx.restore();
    }

    /* 亮星：柔光晕 + 细长十字衍射芒 + 明亮星核（照片级星芒） */
    function drawSpike(sxx, syy, r, color, rot) {
      /* 柔光晕：径向渐变外扩（长曝光亮星的自然晕） */
      var g0 = ctx.createRadialGradient(sxx, syy, 0, sxx, syy, r * 6);
      g0.addColorStop(0, "rgba(255, 255, 255, 0.55)");
      g0.addColorStop(0.25, "rgba(200, 214, 255, 0.18)");
      g0.addColorStop(1, "rgba(180, 200, 255, 0)");
      ctx.fillStyle = g0;
      ctx.fillRect(sxx - r * 6, syy - r * 6, r * 12, r * 12);
      /* 十字衍射芒：细长渐隐芒线 */
      ctx.save();
      ctx.translate(sxx, syy);
      ctx.rotate(rot);
      var len = r * 9;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(0.5, r * 0.22);
      ctx.lineCap = "round";
      for (var d = 0; d < 4; d++) {
        var a = d * Math.PI / 2;
        var dx = Math.cos(a) * len, dy = Math.sin(a) * len;
        var g = ctx.createLinearGradient(0, 0, dx, dy);
        g.addColorStop(0, color);
        g.addColorStop(0.45, "rgba(255, 255, 255, 0.16)");
        g.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.strokeStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(dx, dy);
        ctx.stroke();
      }
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0.6, r * 0.7), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    var raf = 0;
    var rot = 0;                       /* 星野周日旋转角（rad） */
    var ROT_SPEED = 0.0026;            /* rad/s ≈ 0.15°/s（真实周日运动的 ~36 倍，缓慢可感） */
    var meteorTimer = 0;               /* 流星计时 */
    var meteors = [];

    function frame(now) {
      var t = now / 1000;
      rot += ROT_SPEED / 60;           /* 以约 60fps 为步进累积（rAF 校准在 dt 上更稳，见下） */

      ctx.clearRect(0, 0, W, H);

      // 深空渐变底：近黑冷灰，中心略亮、边缘纯黑（真实深空非纯黑）
      var bg = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.9);
      bg.addColorStop(0, "#0a0d17");
      bg.addColorStop(0.55, "#060810");
      bg.addColorStop(1, "#010103");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      /* 星野组：变焦 + 周日旋转（以视口中心为轴） */
      ctx.save();
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(zoom, zoom);
      ctx.rotate(rot);
      ctx.translate(-W * 0.5, -H * 0.5);

      // 银河弥散光（雾状乳白底）
      drawBand();

      // 银河尘埃微星：数千颗暗弱微星组成乳白光带（真实雾状质感，整体轻微脉动）
      var pulse = 0.85 + 0.15 * Math.sin(t * 0.4);
      ctx.save();
      ctx.translate(W * 0.5, H * BAND_CY);
      ctx.rotate(BAND_ANG);
      for (var i = 0; i < micro.length; i++) {
        var m = micro[i];
        ctx.globalAlpha = m.a * pulse;
        var ms = m.r * 6;
        ctx.drawImage(particleSprite(m.c), m.x - ms / 2, m.y - ms / 2, ms, ms);
      }
      ctx.restore();
      ctx.globalAlpha = 1;

      // 群星：银道面密集、带外稀疏；不规则双频闪烁
      for (i = 0; i < stars.length; i++) {
        var st = stars[i];
        var n1 = 0.5 + 0.5 * Math.sin(t * st.s + st.p);
        var n2 = 0.5 + 0.5 * Math.sin(t * st.s * 1.7 + st.p * 2.3);
        var tw = 0.5 * n1 + 0.5 * n2;
        ctx.globalAlpha = 0.3 + 0.7 * tw;
        var sd = st.r * 6;
        ctx.drawImage(particleSprite(st.c), st.x * W - sd / 2, st.y * H - sd / 2, sd, sd);
      }
      ctx.globalAlpha = 1;

      // 暗尘埃裂口：随机游走轮廓遮断（画在星光之上，形成真实暗隙）
      ctx.save();
      ctx.translate(W * 0.5, H * BAND_CY);
      ctx.rotate(BAND_ANG);
      for (var r = 0; r < rifts.length; r++) {
        var rf = rifts[r];
        var x0 = -W, xstep = (W * 2) / rf.seg;
        /* 外层羽化（更宽、更淡，柔和边缘） */
        ctx.beginPath();
        ctx.moveTo(x0, rf.pts[0].y - rf.pts[0].hw * 1.8);
        for (i = 0; i <= rf.seg; i++) {
          ctx.lineTo(x0 + i * xstep, rf.pts[i].y - rf.pts[i].hw * 1.8);
        }
        for (i = rf.seg; i >= 0; i--) {
          ctx.lineTo(x0 + i * xstep, rf.pts[i].y + rf.pts[i].hw * 1.8);
        }
        ctx.closePath();
        ctx.fillStyle = "rgba(3, 5, 11, " + (rf.a * 0.3) + ")";
        ctx.fill();
        /* 内层核心遮断 */
        ctx.beginPath();
        ctx.moveTo(x0, rf.pts[0].y - rf.pts[0].hw);
        for (i = 0; i <= rf.seg; i++) {
          ctx.lineTo(x0 + i * xstep, rf.pts[i].y - rf.pts[i].hw);
        }
        for (i = rf.seg; i >= 0; i--) {
          ctx.lineTo(x0 + i * xstep, rf.pts[i].y + rf.pts[i].hw);
        }
        ctx.closePath();
        ctx.fillStyle = "rgba(1, 2, 6, " + rf.a + ")";
        ctx.fill();
      }
      ctx.restore();

      // 亮星 + 柔光晕 + 十字衍射芒（照片级星芒）
      for (i = 0; i < brights.length; i++) {
        var b = brights[i];
        var tw2 = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(t * b.s + b.p));
        ctx.globalAlpha = tw2;
        drawSpike(b.x * W, b.y * H, b.r, b.c, 0.02);
      }
      ctx.globalAlpha = 1;

      ctx.restore();

      // 大气辉光：底部极弱冷光（真实夜空地平线方向微亮，随呼吸脉动）
      var breath = 0.04 + 0.03 * (0.5 + 0.5 * Math.sin(t * 0.5));
      var ag = ctx.createLinearGradient(0, H * 0.55, 0, H);
      ag.addColorStop(0, "rgba(70, 80, 115, 0)");
      ag.addColorStop(1, "rgba(70, 80, 115, " + breath.toFixed(3) + ")");
      ctx.fillStyle = ag;
      ctx.fillRect(0, H * 0.55, W, H * 0.45);

      // 流星：偶发划过（随机方向 + 渐隐尾迹）
      meteorTimer -= 1 / 60;
      if (meteorTimer <= 0 && meteors.length < 2) {
        meteors.push({
          x: W * (0.1 + Math.random() * 0.8),
          y: H * (0.05 + Math.random() * 0.4),
          vx: (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 1.6),
          vy: 0.8 + Math.random() * 0.8,
          life: 0, max: 26 + Math.random() * 20
        });
        meteorTimer = 6 + Math.random() * 8;
      }
      for (i = meteors.length - 1; i >= 0; i--) {
        var mt = meteors[i];
        mt.x += mt.vx;
        mt.y += mt.vy;
        mt.life++;
        if (mt.life > mt.max) { meteors.splice(i, 1); continue; }
        var fade = 1 - mt.life / mt.max;
        var tl = Math.min(38, mt.life * 2.2);        /* 尾迹长度 */
        var ang = Math.atan2(mt.vy, mt.vx);
        var tx = mt.x - Math.cos(ang) * tl;
        var ty = mt.y - Math.sin(ang) * tl;
        var mg = ctx.createLinearGradient(tx, ty, mt.x, mt.y);
        mg.addColorStop(0, "rgba(200, 215, 255, 0)");
        mg.addColorStop(1, "rgba(255, 255, 255, " + (0.75 * fade).toFixed(3) + ")");
        ctx.strokeStyle = mg;
        ctx.lineWidth = 1.3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(mt.x, mt.y);
        ctx.stroke();
        /* 流星头：明亮小核 */
        ctx.fillStyle = "rgba(255, 255, 255, " + (0.9 * fade).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(mt.x, mt.y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 摄影暗角：中心亮、四缘压暗（真实星空摄影氛围）
      var vg = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.32, W * 0.5, H * 0.5, Math.max(W, H) * 0.85);
      vg.addColorStop(0, "rgba(0, 0, 4, 0)");
      vg.addColorStop(1, "rgba(0, 0, 4, 0.7)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return {
      stop: function () {
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
      },
      setZoom: function (z) {
        zoom = z;
      }
    };
  }

  /* ---------- 工具 ---------- */
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }
  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }
  function randGlyphLine() {
    var len = 4 + ((Math.random() * 8) | 0);
    var s = "";
    for (var i = 0; i < len; i++) s += pick(GLYPHS);
    return s;
  }

  /* ---------- 完整传送动画 ---------- */
  /* AI-generated: 时序参考（实测真机验证过）：
     0~800ms 红色覆盖渐显（含色相混合）→ 乱码/报错 7 轮指数增长
     （每轮 260ms）→ 停顿 400ms → 黑屏 300ms + 驻留约 530ms →
     舷窗窗框缓缓浮现 1.4s → 星空错峰渐显 1.8s → 黑屏余影淡出 →
     镜头拉近 3.2s（舷窗与星空同步变焦，窗框滑出视口）→
     定格纯星空后跳转。总时长约 7.5s。 */
  function start() {
    var warp = document.getElementById("shiyunWarp");
    var red = document.getElementById("warpRed");
    var glitch = document.getElementById("warpGlitch");
    var errors = document.getElementById("warpErrors");
    var black = document.getElementById("warpBlack");
    var space = document.getElementById("warpSpace");
    var sky = document.getElementById("warpSky");
    var porthole = document.querySelector(".porthole");

    // 降级：结构缺失或系统减弱动效 → 直接跳转，保证暗语可达
    if (!warp || !red || !glitch || !errors || !black || !space) {
      window.location.href = TARGET_URL;
      return;
    }
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      window.location.href = TARGET_URL;
      return;
    }

    var skipped = false;
    var stopSky = null;
    var skyHandle = null;
    var zoomTimer = null;

    // 过场动画全程隐藏鼠标指针（原生 + 自定义霓虹光标），跳转前移除
    var warpCursorClass = "is-shiyun-warp";
    document.documentElement.classList.add(warpCursorClass);
    function clearWarpCursor() {
      document.documentElement.classList.remove(warpCursorClass);
    }

    function onSkipKey(e) {
      if (e.key === "Escape" || e.key === "Enter") jump();
    }
    function onSkipPointer() {
      jump();
    }

    // 任何时刻 Esc / 点击遮罩 → 提前跳转（只跳一次）
    function jump() {
      if (skipped) return;
      skipped = true;
      clearWarpCursor();
      window.removeEventListener("keydown", onSkipKey);
      if (warp) warp.removeEventListener("pointerdown", onSkipPointer);
      if (stopSky) stopSky();
      window.location.href = TARGET_URL;
    }

    window.addEventListener("keydown", onSkipKey);
    warp.addEventListener("pointerdown", onSkipPointer);

    // 复位
    red.style.opacity = "0";
    glitch.textContent = "";
    errors.textContent = "";
    black.style.opacity = "0";
    space.style.opacity = "0";
    if (sky && sky.getContext) {
      skyHandle = renderSky(sky);
      stopSky = skyHandle.stop;
    }
    warp.classList.add("is-running");
    warp.setAttribute("aria-hidden", "false");

    var timers = [];
    function at(ms, fn) {
      timers.push(setTimeout(fn, ms));
    }
    function cleanup() {
      for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
      timers.length = 0;
      if (zoomTimer) cancelAnimationFrame(zoomTimer);
      window.removeEventListener("keydown", onSkipKey);
      if (warp) warp.removeEventListener("pointerdown", onSkipPointer);
      if (stopSky) stopSky();
    }

    // ① 全站染红：红色层渐显（色相混合保留亮度，页面整体转红）
    at(20, function () {
      requestAnimationFrame(function () {
        red.style.transition = "opacity 0.8s ease";
        red.style.opacity = "1";
      });
    });

    // ② 乱码与报错弹窗指数级暴增：第 r 轮各新增 2^r 个，共 7 轮
    //    （每轮间隔拉长至 420ms，让报错冲击波更持久、更有压迫感）
    var MAX_ROUNDS = 7;
    for (var r = 0; r < MAX_ROUNDS; r++) {
      at(900 + r * 420, function (round) {
        return function () {
          var count = Math.pow(2, round);
          var i;
          for (i = 0; i < count; i++) {
            var g = document.createElement("span");
            g.className = "warp-glyph";
            g.textContent = randGlyphLine();
            g.style.left = rand(1, 92) + "%";
            g.style.top = rand(2, 90) + "%";
            g.style.fontSize = rand(11, 19) + "px";
            g.style.animationDelay = rand(0, 0.6) + "s";
            if (Math.random() < 0.18) g.classList.add("warp-glyph-w");
            glitch.appendChild(g);
          }
          for (i = 0; i < count; i++) {
            var a = document.createElement("div");
            a.className = "warp-alert";
            a.style.left = rand(1, 76) + "%";
            a.style.top = rand(2, 80) + "%";
            a.style.animationDelay = rand(0, 0.5) + "s";
            var head = document.createElement("div");
            head.className = "warp-alert-head";
            head.textContent = "ERROR 0x" + ((Math.random() * 0xffff) | 0).toString(16).toUpperCase();
            var x = document.createElement("b");
            x.textContent = "×";
            head.appendChild(x);
            var body = document.createElement("div");
            body.className = "warp-alert-body";
            body.textContent = pick(ERROR_TITLES) + " :: " + randGlyphLine();
            a.appendChild(head);
            a.appendChild(body);
            errors.appendChild(a);
          }
        };
      }(r));
    }

    // ③ 达到极限 → 黑屏（乱码与报错清空，画面短暂全黑）
    //    （黑屏前停顿延长至 900ms：报错爆发后的静默期更长）
    var blackStart = 900 + MAX_ROUNDS * 420 + 900;
    at(blackStart, function () {
      glitch.textContent = "";
      errors.textContent = "";
      red.style.transition = "opacity 0.3s ease";
      red.style.opacity = "0";
      black.style.transition = "opacity 0.3s ease";
      black.style.opacity = "1";
    });

    // ④ 黑屏中缓缓浮现舷窗窗框：从纯黑里描出金属轮廓（先于星空出现）
    //    （黑屏驻留延长至 1.4s，舷窗浮现时窗内仍是一片黑）
    at(blackStart + 1400, function () {
      if (porthole) {
        porthole.style.opacity = "1";
        porthole.classList.add("is-in");
      }
    });

    // ⑤ 舷窗浮现后保持数秒全黑，再让星空渐渐透出：
    //    窗洞先如深空般漆黑，几秒（3.4s）后星空才错峰渐显 1.8s 浮出
    at(blackStart + 4800, function () {
      space.style.transition = "opacity 1.8s ease";
      space.style.opacity = "1";
    });

    // ⑥ 星空完全透出后，黑屏余影淡出（层级上已被盖住，此为保险）
    at(blackStart + 6400, function () {
      black.style.transition = "opacity 0.6s ease";
      black.style.opacity = "0";
    });

    // ⑦ 镜头拉近：穿过舷窗——舷窗与星空同步变焦放大（easeInOutQuad 3.2s），
    //    窗框渐滑出视口，最终定格为纯星空画面
    function driveZoom() {
      if (!porthole) return;
      porthole.style.animation = "none";
      var t0 = performance.now(), dur = 3200, from = 1, to = 2.4;
      (function step(now) {
        var p = Math.min(1, (now - t0) / dur);
        var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        var z = from + (to - from) * e;
        porthole.style.transform = "scale(" + z + ")";
        if (skyHandle) skyHandle.setZoom(z);
        if (p < 1) zoomTimer = requestAnimationFrame(step);
      })(performance.now());
    }
    at(blackStart + 6600, driveZoom);

    // ⑧ 定格纯星空后跳转：新页面以同一变焦画面无缝续接（舷窗只存于动画）
    at(blackStart + 9800, function () {
      cleanup();
      clearWarpCursor();
      window.location.href = TARGET_URL;
    });
  }

  /* ---------- 暴露接口 ---------- */
  window.ShiyunWarp = {
    start: start,
    renderSky: renderSky,
    TARGET_URL: TARGET_URL
  };
})();
