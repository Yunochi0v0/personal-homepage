/* ============================================================
   赛博火柴人彩蛋（v1.24）[AI-GEN]
   - 右下角待机呼吸（CSS 动画）；按住拖动 → 切换「真实奔跑」；
   - 松手停在原地（不自动归位），恢复呼吸。
   - 拖动位移：按指针增量累加（多次拖动从当前位置无缝继续，不跳回）。
   - 奔跑动画（v1.24.2 重构）：由 JS + requestAnimationFrame 直接驱动
     SVG 原生属性渲染，绕关节中心旋转是 SVG 内建能力，不依赖 CSS
     transform-box / transform-origin / CSS 动画对 SVG <line> 元素的
     渲染支持，在各类 Chromium/WebKit 版本下均 100% 生效。
   - 奔跑姿态（v1.24.3 增强）：四肢改为两段式（上臂+前臂、大腿+小腿），
     每段独立旋转——肩/髋「摆动」+ 肘/膝「屈曲」双通道叠加：
       · 摆臂迈腿：臂 ±45°、腿 ±40°，左右肢相位差 π 交替；
       · 肘部屈曲：后摆折叠（上臂-前臂夹角 82° 深弯），前摆舒展（112°）；
       · 膝部屈曲：前摆屈膝收腿（大腿-小腿夹角 90°），后蹬伸直（24°）。
    两段式需「关节链」组合旋转（前臂先绕肘、再随上臂绕肩），单一
    transform rotate 无法表达 → 改为每帧计算各段世界坐标，直接写
    <line> 的 x1/y1/x2/y2 与关节圆 cx/cy（数学与
    .deepworks/tmp/render-stickman.py 的帧渲染验证一致）。
    LIMBS 使用 JSON 友好格式，供 render-stickman.py 渲染静态关键帧
    核对姿态几何（修改参数后渲染验证再定稿）。
   - 跑步朝向（v1.24.4）：跟随拖动方向，scaleX(±1) 镜像（v1.24.5 修正符号）。
   - 点击说话（v1.24.6）：轻点（位移 < 5px）弹出随机台词气泡；拖动
     （位移 ≥ 5px）不触发。气泡 4s 自动消失，或点击其他区域关闭；
     再次点击刷新新台词。台词数组为 [AI-GEN] 起草，可自行增删改。
   - 同时支持鼠标（mousedown/mousemove/mouseup）与触屏
     （touchstart/touchmove/touchend/touchcancel）。
   ============================================================ */
(function () {
  "use strict";

  var stickman = document.getElementById("stickman");
  if (!stickman) return; // 结构缺失静默退出，不影响页面其他功能

  // 点击说话台词池（v1.24.6 · AI-GEN，可增删改）
  var LINES = [
    "欢迎来到我的赛博空间。我是刘聿宸的数字小助手，为你提供导览服务。",
    "今天也要努力写代码，把想法变成现实哦。",
    "对我的项目感兴趣？试着点击下方的火箭图标看看吧。",
    "遇到 Bug 不要慌，深呼吸，然后让 AI 帮你 Debug。",
    "别晃了别晃了，脑浆要摇匀了！",
    "我只是个火柴人，不要随便把我丢来丢去啊喂！",
    "你再点我，我就把你写进死循环！",
    "404: 节操未找到。但没关系，代码能跑就行。"
  ];
  var CLICK_DIST = 5; // 点击判定阈值（px）：位移小于此值视为点击而非拖拽
  var BUBBLE_MS = 4000; // 气泡自动消失时长
  var bubble = null;    // .stick-bubble 元素（惰性获取）
  var bubbleTimer = null; // 气泡自动消失定时器
  var lastLineIdx = -1; // 上次台词索引（避免连续重复）

  var dragging = false;
  var lastX = 0, lastY = 0; // 上一次指针位置（本次拖动的增量基准）
  var downX = 0, downY = 0; // 按下时指针坐标（松手时判定「点击」还是「拖拽」）
  var rafId = null;
  var svgEl = null;   // .stickman-svg 元素（方向镜像 scaleX 的目标）
  var runDir = 1;     // 跑步朝向：1 = 朝右，-1 = 朝左（跟随拖动方向）
  var velX = 0;       // 水平速度滑动平均（抗抖动，决定朝向）

  // rAF 获取（浏览器 / jsc 测试环境 / 均无时优雅降级为不摆动但可拖动）
  var raf = (typeof window !== "undefined" && window.requestAnimationFrame) ||
    (typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : null);
  var caf = (typeof window !== "undefined" && window.cancelAnimationFrame) ||
    (typeof cancelAnimationFrame !== "undefined" ? cancelAnimationFrame : null);

  // 肢体段配置（两段式：上臂/前臂、大腿/小腿，各左右一肢，共 8 段）
  //   sel  —— 段选择器；cx/cy —— 关节中心（该段绕此点旋转）
  //   base/amp/off —— 每帧角度 a = base + amp·sin(2πt/PERIOD + off)
  //   摆动段（肩/髋，base 0）：左 off=0、右 off=π → 左右交替摆臂迈腿；
  //   屈曲段（肘/膝）跟随全局时间 s=sin(φt)（off 均为 0）：
  //     · 前臂：base 115 ± 15 → 后摆折叠（与上臂夹角 82°，深弯）/
  //             前摆舒展（夹角 112°），左右反相 → 交替摆臂
  //     · 小腿：base ±45 − 33s → 前摆屈膝（夹角 90°，收腿）/
  //             后蹬近伸直（夹角 24°），左右反相 → 交替迈步
  //   角度经帧渲染（render-stickman.py）数值验证：屈膝/伸直/折肘/舒展
  //   各关键帧夹角均落在真实跑步姿态区间。
  var LIMBS = [
    // —— 手臂摆动（肩）——
    { "sel": ".stick-arm-l",     "cx": 22, "cy": 22, "base": 0,   "amp": 45, "off": 0 },
    { "sel": ".stick-arm-r",     "cx": 22, "cy": 22, "base": 0,   "amp": 45, "off": 3.141592653589793 },
    // —— 前臂屈曲（肘）——
    { "sel": ".stick-forearm-l", "cx": 14, "cy": 31, "base": 115, "amp": 15, "off": 0 },
    { "sel": ".stick-forearm-r", "cx": 30, "cy": 31, "base": 115, "amp": -15, "off": 0 },
    // —— 腿摆动（髋）——
    { "sel": ".stick-leg-l",     "cx": 22, "cy": 36, "base": 0,   "amp": 40, "off": 0 },
    { "sel": ".stick-leg-r",     "cx": 22, "cy": 36, "base": 0,   "amp": 40, "off": 3.141592653589793 },
    // —— 小腿屈曲（膝）——
    { "sel": ".stick-shin-l",    "cx": 15, "cy": 47, "base": -45, "amp": -33, "off": 0 },
    { "sel": ".stick-shin-r",    "cx": 29, "cy": 47, "base": 45,  "amp": -33, "off": 0 }
  ];
  var PERIOD = 0.30; // 秒（单程半周期），与身体弹跳 CSS 同节奏（v1.24.3+ 放慢：0.22 → 0.30，奔跑更从容）

  // 关节链父子关系：前臂/小腿先绕自身关节（肘/膝），再随父段绕肩/髋
  var PARENT = {
    ".stick-forearm-l": ".stick-arm-l",
    ".stick-forearm-r": ".stick-arm-r",
    ".stick-shin-l": ".stick-leg-l",
    ".stick-shin-r": ".stick-leg-r"
  };
  // 关节圆（HTML 中的 .stick-joint）跟随对应段起点（肘/膝点）
  var JOINT_OF = {
    ".stick-forearm-l": ".stick-joint-el-l",
    ".stick-forearm-r": ".stick-joint-el-r",
    ".stick-shin-l": ".stick-joint-kn-l",
    ".stick-shin-r": ".stick-joint-kn-r"
  };

  var SEGS = {};   // 段 sel -> 原始端点 {x1,y1,x2,y2}（从 HTML 读取，单一数据源）
  var JOINTS = {}; // 关节圆 sel -> 初始 {cx,cy}

  // 初始化：读取 HTML 中段的原始坐标（之后每帧从原始值计算，不累积误差）
  function initSegs() {
    for (var i = 0; i < LIMBS.length; i++) {
      var L = LIMBS[i];
      var el = stickman.querySelector(L.sel);
      if (!el) continue;
      SEGS[L.sel] = {
        x1: parseFloat(el.getAttribute("x1")),
        y1: parseFloat(el.getAttribute("y1")),
        x2: parseFloat(el.getAttribute("x2")),
        y2: parseFloat(el.getAttribute("y2"))
      };
    }
    for (var sel in JOINT_OF) {
      var j = stickman.querySelector(JOINT_OF[sel]);
      if (j) JOINTS[sel] = { cx: parseFloat(j.getAttribute("cx")), cy: parseFloat(j.getAttribute("cy")) };
    }
    if (!svgEl) svgEl = stickman.querySelector(".stickman-svg"); // 方向镜像目标
  }

  // 应用跑步朝向：水平镜像整个 SVG（flip-x），奔跑视觉方向随之反转
  // （v1.24.4+ 修正：视觉方向与拖动方向相反，符号取反后左右调换）
  function applyDir() {
    if (svgEl) svgEl.style.transform = "scaleX(" + (-runDir) + ")";
  }

  // SVG rotate(a cx cy)（y 向下坐标系，正角 = 顺时针）——与 render 脚本同数学
  function rotXY(x, y, cx, cy, deg) {
    var r = deg * Math.PI / 180;
    var dx = x - cx, dy = y - cy;
    return { x: cx + dx * Math.cos(r) - dy * Math.sin(r),
             y: cy + dx * Math.sin(r) + dy * Math.cos(r) };
  }

  function rnd(v) { return Math.round(v * 10) / 10; }

  // 读取当前已应用的 translate3d 位移（多次拖动累加基准）
  function getTranslate() {
    var t = stickman.style.transform || "";
    var m = t.match(/translate3d\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px/);
    if (m) return { x: parseFloat(m[1]) || 0, y: parseFloat(m[2]) || 0 };
    return { x: 0, y: 0 };
  }

  // 鼠标与触屏统一取点：触屏用首个触点
  function getPoint(e) {
    if (e.touches && e.touches.length) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  // 奔跑动画：关节链世界坐标渲染（摆动 + 屈曲双通道正弦）
  function tick(now) {
    var t = (now || Date.now()) / 1000;
    var angles = {};
    for (var i = 0; i < LIMBS.length; i++) {
      var L = LIMBS[i];
      var ph = 2 * Math.PI * t / PERIOD + L.off;
      angles[L.sel] = L.base + L.amp * Math.sin(ph);
    }
    var poses = {};
    for (var i = 0; i < LIMBS.length; i++) {
      var L = LIMBS[i];
      var g = SEGS[L.sel] || { x1: 0, y1: 0, x2: 0, y2: 0 };
      var a = angles[L.sel];
      // 1) 段绕自身关节（肘/膝/肩/髋）旋转
      var p1 = rotXY(g.x1, g.y1, L.cx, L.cy, a);
      var p2 = rotXY(g.x2, g.y2, L.cx, L.cy, a);
      // 2) 屈曲段再随父段绕肩/髋旋转（关节链）
      var parentSel = PARENT[L.sel];
      if (parentSel) {
        var P = null;
        for (var j = 0; j < LIMBS.length; j++) if (LIMBS[j].sel === parentSel) { P = LIMBS[j]; break; }
        var pa = angles[parentSel];
        p1 = rotXY(p1.x, p1.y, P.cx, P.cy, pa);
        p2 = rotXY(p2.x, p2.y, P.cx, P.cy, pa);
      }
      poses[L.sel] = [p1, p2];
    }
    // 写回 SVG 原生坐标属性
    for (var i = 0; i < LIMBS.length; i++) {
      var L = LIMBS[i];
      var el = stickman.querySelector(L.sel);
      if (!el || !poses[L.sel]) continue;
      el.setAttribute("x1", rnd(poses[L.sel][0].x));
      el.setAttribute("y1", rnd(poses[L.sel][0].y));
      el.setAttribute("x2", rnd(poses[L.sel][1].x));
      el.setAttribute("y2", rnd(poses[L.sel][1].y));
    }
    // 关节圆跟随肘/膝点
    for (var sel in JOINT_OF) {
      var j = stickman.querySelector(JOINT_OF[sel]);
      if (!j || !poses[sel]) continue;
      j.setAttribute("cx", rnd(poses[sel][0].x));
      j.setAttribute("cy", rnd(poses[sel][0].y));
    }
    rafId = raf(tick); // 排下一帧（rafId 保持最新，便于取消）
  }

  function startRun() {
    initSegs(); // 懒初始化：首次拖动时读取原始坐标
    if (rafId === null && raf) rafId = raf(tick);
  }

  function stopRun() {
    if (rafId !== null) {
      if (caf) caf(rafId);
      rafId = null;
    }
    // 恢复静态姿势：坐标还原为 HTML 原始值
    for (var i = 0; i < LIMBS.length; i++) {
      var L = LIMBS[i];
      var el = stickman.querySelector(L.sel);
      if (!el) continue;
      el.removeAttribute("transform"); // 兼容旧版残留
      var g = SEGS[L.sel];
      if (!g) continue;
      el.setAttribute("x1", g.x1);
      el.setAttribute("y1", g.y1);
      el.setAttribute("x2", g.x2);
      el.setAttribute("y2", g.y2);
    }
    for (var sel in JOINT_OF) {
      var j = stickman.querySelector(JOINT_OF[sel]);
      if (!j || !JOINTS[sel]) continue;
      j.setAttribute("cx", JOINTS[sel].cx);
      j.setAttribute("cy", JOINTS[sel].cy);
    }
  }

  function onStart(e) {
    if (e.type === "mousedown" && e.button !== 0) return; // 仅主键拖动
    var p = getPoint(e);
    lastX = p.x;
    lastY = p.y; // 记录本次拖动起点，后续按指针增量累加
    downX = p.x;
    downY = p.y; // 记录按下坐标：松手时位移 < CLICK_DIST 判定为「点击」而非拖拽
    velX = 0;    // 本次拖动重新累计水平速度（决定朝向）
    dragging = true;
    stickman.classList.add("dragging"); // 待机呼吸 → 真实奔跑（cursor: grabbing）
    startRun(); // 启动奔跑（SVG 原生坐标属性渲染，100% 生效）
    if (e.cancelable) e.preventDefault();
  }

  function onMove(e) {
    if (!dragging) return;
    var p = getPoint(e);
    var cur = getTranslate(); // 已有位移（上次拖动留下的），从它继续累加
    var x = cur.x + (p.x - lastX);
    var y = cur.y + (p.y - lastY);
    // 朝向跟随拖动方向：水平速度滑动平均（抗单帧抖动），越过阈值才翻转
    velX = velX * 0.5 + (p.x - lastX) * 0.5;
    if (velX > 1.5) runDir = 1;
    else if (velX < -1.5) runDir = -1;
    stickman.style.transform = "translate3d(" + x + "px, " + y + "px, 0)"; // GPU 加速
    applyDir(); // 跑步朝向（整体镜像）
    lastX = p.x;
    lastY = p.y;
    if (e.cancelable) e.preventDefault(); // 触屏防滚动（touch-action: none 兜底）
  }

  function onEnd(e) {
    if (!dragging) return;
    dragging = false;
    stickman.classList.remove("dragging"); // 停止奔跑、恢复呼吸；停在原地（不归位）
    runDir = 1;    // 复位默认朝向（松手静止，无方向）
    applyDir();
    stopRun();
    // 点击说话彩蛋：按下→松开全程位移 < CLICK_DIST 判定为「点击」，
    // 随机台词弹气泡；拖拽（位移 ≥ 阈值）不触发；touchcancel 不触发。
    var dx = lastX - downX, dy = lastY - downY;
    var isCancel = e && e.type === "touchcancel";
    if (!isCancel && Math.sqrt(dx * dx + dy * dy) < CLICK_DIST) showBubble();
  }

  // ===== 点击说话彩蛋（v1.24.6 · AI-GEN）=====
  function getBubble() {
    if (!bubble) bubble = stickman.querySelector(".stick-bubble");
    return bubble;
  }
  // 弹出气泡：随机台词（避免与上次连续重复），重置 4s 自动消失计时
  function showBubble() {
    var b = getBubble();
    if (!b) return;
    var idx;
    do { idx = Math.floor(Math.random() * LINES.length); }
    while (LINES.length > 1 && idx === lastLineIdx);
    lastLineIdx = idx;
    var text = b.querySelector(".stick-bubble-text");
    if (text) text.textContent = LINES[idx];
    b.classList.add("show");
    if (bubbleTimer !== null) clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(hideBubble, BUBBLE_MS); // 4s 后自动淡出
  }
  // 关闭气泡（自动消失 / 点击其他区域）
  function hideBubble() {
    if (bubbleTimer !== null) { clearTimeout(bubbleTimer); bubbleTimer = null; }
    var b = getBubble();
    if (b) b.classList.remove("show");
  }
  // 点击/触摸其他区域（不在火柴人内）→ 关闭气泡
  function onDocDown(e) {
    if (bubbleTimer === null && !bubble) return; // 无气泡显示时零开销
    var t = e.target;
    if (t && t.closest && t.closest(".stickman")) return; // 点在火柴人/气泡上：交给点击说话逻辑
    hideBubble();
  }

  // 鼠标
  stickman.addEventListener("mousedown", onStart);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onEnd);
  // 触屏（passive: false 才能 preventDefault 防滚动）
  stickman.addEventListener("touchstart", onStart, { passive: false });
  window.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("touchend", onEnd);
  window.addEventListener("touchcancel", onEnd);
  // 点击其他区域关闭气泡（捕获阶段：先于火柴人自身事件判断目标归属）
  document.addEventListener("mousedown", onDocDown, true);
  document.addEventListener("touchstart", onDocDown, true);
})();
