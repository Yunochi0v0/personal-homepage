/* ============================================================
   赛博火柴人彩蛋（v1.26）[AI-GEN]
   - 右下角待机呼吸（CSS 动画）；按住拖动 → 切换「真实奔跑」；
   - 松手停在原地（不自动归位），恢复呼吸。
   - 三层 DOM 解耦（v1.26 橡皮管拉伸改造，防 transform 属性冲突）：
       外层 .stickman        ← JS 只写 translate3d（拖动定位，GPU 加速）
       中层 .stickman-scale  ← JS 只写 scale(dx_scale, dy_scale)（橡皮管拉伸变形）
       内层 .stickman-inner  ← 只由 CSS @keyframes 驱动（呼吸 / 奔跑四肢摆动）
     JS 不再逐帧计算 SVG 坐标；四肢旋转改用嵌套 <g> 关节链 + CSS
     transform（transform-box: view-box / transform-origin 关节坐标），
     父 <g> 旋转带动子 <g> → 「前臂随上臂绕肩、小腿随大腿绕胯」组合旋转。
   - 拖动中：中层按鼠标偏移量动态写 scale(dx_scale, dy_scale)，
     clamp 0.6~1.5（防压成一条线）；内层加 .running → 触发四肢 CSS 动画。
   - 松手回弹：中层恢复 scale(1,1)，由 CSS transition: transform
     0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) 承担（橡皮筋回弹）；
     内层移除 .running → 恢复待机呼吸。
   - 跑步朝向（v1.24.4）：跟随拖动方向，svgEl scaleX(±1) 镜像。
   - 点击说话（v1.24.6）：轻点（位移 < 5px）弹出随机台词气泡；拖动
     （位移 ≥ 5px）不触发。气泡 4s 自动消失，或点击其他区域关闭。
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
  // 稀有台词池（v1.41.1 · 站主定制）：出现概率较低（约 10%），与普通台词共用「不连续重复」规则
  var RARE_LINES = [
    "感觉lyc有点nb",
    "梦想即力量！",
    "诗云会是个好点子"
  ];
  var CLICK_DIST = 5; // 点击判定阈值（px）：位移小于此值视为点击而非拖拽
  var BUBBLE_MS = 4000; // 气泡自动消失时长
  var SQUASH_MS = 650; // Q 弹挤压动画总时长（动画 0.6s + 余量）：结束后清理 class 以便重触发
  var bubble = null;    // .stick-bubble 元素（惰性获取）
  var bubbleTimer = null; // 气泡自动消失定时器
  var squashTimer = null; // Q 弹挤压 class 清理定时器
  var lastLineText = null; // 上次台词文本（避免连续重复，普通/稀有池通用）

  var dragging = false;
  var lastX = 0, lastY = 0; // 上一次指针位置（本次拖动的增量基准）
  var downX = 0, downY = 0; // 按下时指针坐标（松手时判定「点击」还是「拖拽」）
  var svgEl = null;    // .stickman-svg 元素（方向镜像 scaleX 的目标）
  var scaleEl = null;  // 中层 .stickman-scale（v1.30 起仅结构占位，不再写 transform）
  var bodyEl = null;   // .stick-body 躯干（v1.33 绳子节点重写的贝塞尔 path）
  var headEl = null;   // .stick-head 头圆（跟随绳子脖子端节点）
  var armsEl = null;   // .stick-arms 双臂容器（跟随绳子肩部节点）
  var lowerEl = null;  // .stick-lower 下半身容器（跟随胯端节点）
  var innerEl = null;  // 内层 .stickman-inner（.running class 目标，驱动 CSS 四肢动画）
  var runDir = 1;      // 跑步朝向：1 = 朝右，-1 = 朝左（跟随拖动方向）
  var velX = 0;        // 水平速度滑动平均（抗抖动，决定朝向）

  // 躯干绳子物理（v1.34 弹性绳子 + 抓取点感知 + 镜像补偿）：把躯干当作「有弹性的
  // 绳子」——一串弹簧质点节点（Verlet 积分），脖子端 (22,15.5) 与胯端 (22,36) 都
  // 是自由端，各自被拖动目标弹簧拉动（刚度按抓取点分配）→ 抓头时头端先动、下半身
  // 滞后跟随，抓下半身时下半身先动、头部滞后跟随（用户要求的"领先速度差"）。
  // 中间节点带惯性 + 相邻距离约束 → 拖拽甩出波浪、松手波动回弹（像橡皮筋）。
  // 镜像补偿：SVG 整体 scaleX(runDir) 朝向镜像会翻转水平弯曲 → 绳子弯曲方向乘以
  // runDir 补偿，保证向左拖同样甩出效果。
  // 中段拱形弹簧：中间节点向「放大偏移」的目标逼近 → 拖动时躯干主动鼓出弧线，
  // 曲线感更强（不只两端被拉、中段被动绷直）。
  var NODE_N = 9;        // 绳子节点数（0=脖子，N-1=胯；两端都是弹簧端，节点更多曲线更柔）
  var TORSO_LEN = 20.5;  // 躯干原长（viewBox：36-15.5）
  var SEG_LEN = TORSO_LEN / (NODE_N - 1); // 相邻节点静止间距
  var MID_IDX = Math.floor(NODE_N / 2);   // 中段节点索引（拱形弹簧作用点）
  var MID_REST_Y = 15.5 + MID_IDX * SEG_LEN; // 中段静止 y（自动随节点数）
  var BEND_K = 0.50;     // 横甩灵敏度：每拖 1px → 端部横移 0.5px（拖 60px → 30px 大弧）
  var MAX_BEND = 40;     // 最大横甩（px，防绳子甩成麻花）
  var STRETCH_K = 0.22;  // 拉长灵敏度：每拖 1px → 端部下移 0.22px（拖 60px → 13px）
  var MIN_STRETCH = -6;  // 最小拉长（向上拖收缩，px）
  var MAX_STRETCH = 16;  // 最大拉长（向下拖，px）
  var MID_GAIN = 1.35;   // 中段拱形增益：中段目标偏移 = bend * MID_GAIN（大于两端 → 鼓出弧线）
  var MID_STIFF = 0.16;  // 中段拱形弹簧刚度（小于两端 → 松手仍能波动回中）
  var VEL_K = 0.30;      // 拖动速度注入：每 1px/帧拖动速度 → 目标额外超前 0.3px
                         // （快速甩动目标超前 → 拖动中也有过冲回弹的 Q 弹手感）
  var VERLET_DAMP = 0.95; // Verlet 速度衰减（0.95：阻尼更小 → 拖动中过冲回弹更明显（拖动也有松手回弹感），余波留得久）
  var ROPE_EPS = 0.06;    // 稳定阈值：所有节点位移 < 0.06px 视为回稳
  // 待机自然形态（v1.39）：绳子不会自己绷直——静止时躯干保持柔软下垂弧线
  // （半波正弦，中段右凸 REST_AMP px），看起来像一根软绳挂着的弧度；
  // 拖动时被拉直/弯曲，松手后弹回弧线形态（绳子回到自然形状）。
  var REST_AMP = 3.0;     // 待机弧幅度（px）：中段比两端凸出量（微弯有绳感，太大像驼背）
  function restX(i) { return 22 + REST_AMP * Math.sin(Math.PI * i / (NODE_N - 1)); }

  // 抓取点感知：按下位置决定两端谁"领先"（刚度大 = 跟手快 = 移动快）
  // head: 抓头 → 脖子端快、胯端慢（头先动，下半身拖后）
  // body: 抓中间 → 两端均衡（整根绳子均匀变形）
  // legs: 抓下半身 → 胯端快、脖子端慢（下半身先动，头部拖后）
  var grabZone = "body";  // 本次拖动抓取区（onStart 时按按下位置判定）
  var GRAB = {
    head: { neckStiff: 0.42, hipStiff: 0.14, neckShare: 0.90, hipShare: 0.35 },
    body: { neckStiff: 0.26, hipStiff: 0.26, neckShare: 0.65, hipShare: 0.65 },
    legs: { neckStiff: 0.14, hipStiff: 0.42, neckShare: 0.35, hipShare: 0.90 }
  };

  // 绳子运行时状态
  var rope = [];        // 节点数组 {x, y, px, py}（px,py = 上一帧位置，Verlet 隐式速度）
  var neckTargX = 22, neckTargY = 15.5; // 脖子端目标（静止）
  var hipTargX = 22, hipTargY = 36;     // 胯端目标（静止）
  var midTargX = 22, midTargY = MID_REST_Y; // 中段拱形目标（静止）
  var armsX = 22, armsY = 22, armsRot = 0; // 手臂容器当前值（弹性滞后 + 切线旋转 → 肩部软连接）
  var armsPX = 22, armsPY = 22, armsRotPX = 0; // 手臂上一帧值（速度保留 → 惯性拖尾）
  var ARMS_SOFT = 0.26; // 手臂柔软度：每帧向目标靠拢比例（越小越软/越滞后，甩动时拖尾）
  var ARMS_DAMP = 0.80; // 手臂速度衰减（惯性保留 → 急停后继续滑行回弹；v1.38 降低 → 拖尾更短、Q 弹更克制）
  var ARMS_MAX_ANG = 0.30; // 角度单帧变化限幅（rad ≈ 17°/帧）：绳子波浪噪声被差分放大时
                           // 防止手臂角度瞬间跳变 → 连接处无锯齿毛刺，像绳子一样平滑
  var ropeSettled = false; // 绳子是否已回稳（writeTorso 据此把手臂钉到肩位，避免残余歪斜）
  var springRaf = null; // 弹簧动画帧句柄

  // 初始化绳子节点：脖子 (22,15.5) → 胯 (22,36) 等距直线
  function initRope() {
    rope = [];
    for (var i = 0; i < NODE_N; i++) {
      // 初始即落在待机弧线上（两端 sin(0)=sin(π)=0 → 锚定 x=22；中段凸起 → 静止呈软绳弧）
      var x = restX(i), y = 15.5 + i * SEG_LEN;
      rope.push({ x: x, y: y, px: x, py: y });
    }
  }

  // 启动绳子动画帧（幂等：已在跑则不重复启动）
  function startSpring() {
    if (springRaf !== null) return;
    springRaf = requestAnimationFrame(springTick);
  }

  // 绳子物理单帧：所有节点统一「Verlet 惯性 + 弹簧力」——这是欠阻尼弹簧振荡：
  // 惯性保留（不像旧版抹掉速度）→ 拖动中目标每次移动都激发过冲回弹（拖动中也有
  // 松手回弹那种 Q 弹感），松手目标回中后继续振荡衰减到静止。
  // 刚度差 = 抓取点决定的"领先速度差"（抓头头快、抓下半身下半身快）
  function springTick() {
    var i, n;
    var g = GRAB[grabZone] || GRAB.body;
    // 1) 所有节点：Verlet 积分（惯性 + 速度衰减）后叠加各自弹簧力
    for (i = 0; i < NODE_N; i++) {
      n = rope[i];
      var vx = (n.x - n.px) * VERLET_DAMP;
      var vy = (n.y - n.py) * VERLET_DAMP;
      n.px = n.x; n.py = n.y;
      n.x += vx; n.y += vy;
      if (i === 0) {
        // 脖子端：向抓取点目标逼近（抓头时刚度大 → 头先动）
        n.x += (neckTargX - n.x) * g.neckStiff;
        n.y += (neckTargY - n.y) * g.neckStiff;
      } else if (i === NODE_N - 1) {
        // 胯端：向抓取点目标逼近（抓下半身时刚度大 → 下半身先动）
        n.x += (hipTargX - n.x) * g.hipStiff;
        n.y += (hipTargY - n.y) * g.hipStiff;
      } else if (i === MID_IDX) {
        // 中段拱形弹簧：向「放大偏移」目标逼近 → 拖动时躯干主动鼓出弧线（曲线感）
        // v1.39：目标叠加 REST_AMP（待机弧）→ 松手后绳子弹回自然下垂弧，而非僵直直线
        // v1.40：拖动（走路）中弧线收平（dragging → 只跟随拖动弯曲）→ 走路躯干挺直不驼背；
        //        松手（dragging=false）后中段目标 +REST_AMP → 弹回软绳弧
        n.x += (midTargX + (dragging ? 0 : REST_AMP) - n.x) * MID_STIFF;
        n.y += (midTargY - n.y) * MID_STIFF;
      }
    }
    // 2) 相邻距离约束（绳子不可无限拉伸）：两端对半调整，迭代 2 次收敛
    for (var it = 0; it < 2; it++) {
      for (i = 0; i < NODE_N - 1; i++) {
        var a = rope[i], b = rope[i + 1];
        var dx = b.x - a.x, dy = b.y - a.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        var diff = (dist - SEG_LEN) / dist;
        a.x += dx * diff * 0.5; a.y += dy * diff * 0.5;
        b.x -= dx * diff * 0.5; b.y -= dy * diff * 0.5;
      }
    }
    // 3) 回稳判定：所有节点位移都极小 → 精确归位待机弧线（v1.39），停止动画帧
    ropeSettled = true;
    for (i = 0; i < NODE_N; i++) {
      n = rope[i];
      if (Math.abs(n.x - n.px) > ROPE_EPS || Math.abs(n.y - n.py) > ROPE_EPS) { ropeSettled = false; break; }
    }
    writeTorso();
    if (ropeSettled) {
      springRaf = null;
      return; // 稳定：不继续请求下一帧
    }
    springRaf = requestAnimationFrame(springTick);
  }

  // 把绳子节点渲染为平滑曲线：Catmull-Rom 转三次贝塞尔（过所有节点，波形柔和）；
  // 同时让头/手臂/腿跟随对应绳子节点（抓头时头先动、抓下半身时下半身先动，不脱节）
  function writeTorso() {
    if (!bodyEl) return;
    var d = "M " + rope[0].x.toFixed(1) + " " + rope[0].y.toFixed(1);
    for (var i = 1; i < NODE_N - 2; i++) {
      var p0 = rope[i - 1], p1 = rope[i], p2 = rope[i + 1], p3 = rope[i + 2];
      var c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      var c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += " C " + c1x.toFixed(1) + " " + c1y.toFixed(1) + ", " + c2x.toFixed(1) + " " + c2y.toFixed(1) + ", " + p2.x.toFixed(1) + " " + p2.y.toFixed(1);
    }
    // 收尾段（最后两节点直线/缓入）
    var last = rope[NODE_N - 1], prev = rope[NODE_N - 2];
    d += " C " + prev.x.toFixed(1) + " " + prev.y.toFixed(1) + ", " + prev.x.toFixed(1) + " " + prev.y.toFixed(1) + ", " + last.x.toFixed(1) + " " + last.y.toFixed(1);
    bodyEl.setAttribute("d", d);
    // 头跟随脖子端节点（translate 相对静止位 22,15.5）
    if (headEl) {
      var nk = rope[0];
      headEl.style.transform = "translate(" + (nk.x - 22).toFixed(2) + "px, " + (nk.y - 15.5).toFixed(2) + "px)";
    }
    // 手臂容器跟随肩部节点（y 最接近 22 的绳子节点），v1.36 起软连接：
    //   ① 旋转跟随绳子切线（躯干弯成弧时手臂顺弧倾斜，连接处视觉连续）；
    //   ② 位置+角度「速度保留」弹性滞后（ARMS_SOFT 插值 + ARMS_DAMP 惯性）→
    //      甩动时手臂拖在后面，急停后继续滑行再弹回，像软胶连接。
    // v1.38 平滑（去锯齿）：切线用更宽的 4 节点差分（噪声减半）→ 角度目标更稳；
    //   角度单帧变化限幅 ARMS_MAX_ANG → 绳子波浪振荡不引起手臂角度毛刺跳变，
    //   连接处像绳子一样平滑连续。
    // 父 g 平移/旋转不干扰子 g 关节旋转动画（子 g transform-origin 用 view-box 绝对坐标）。
    if (armsEl) {
      var shI = Math.round((22 - 15.5) / SEG_LEN);
      if (shI < 1) shI = 1; else if (shI > NODE_N - 2) shI = NODE_N - 2;
      var shNode = rope[shI];
      // 切线差分加宽到 ±2 节点（间隔 4 节点）：平均掉相邻节点的高频抖动 → 角度更平滑
      var pPrev = rope[shI - 2 < 0 ? 0 : shI - 2], pNext = rope[shI + 2 > NODE_N - 1 ? NODE_N - 1 : shI + 2];
      // 肩部切线角（宽中心差分）：竖直躯干 → atan2(+,0)=90° → rotate 0（手臂默认姿势）
      var ang = Math.atan2(pNext.y - pPrev.y, pNext.x - pPrev.x);
      var targRot = ang - Math.PI / 2;
      if (ropeSettled) {
        // 绳子静止：无滞后需求 → 精确贴肩（防甩动后残余错位）。
        // 若两端目标已回中（松手归位）→ 钉理论静止位（肩在竖直线 22，无旋转）
        var home = Math.abs(neckTargX - 22) < ROPE_EPS && Math.abs(neckTargY - 15.5) < ROPE_EPS &&
                   Math.abs(hipTargX - 22) < ROPE_EPS && Math.abs(hipTargY - 36) < ROPE_EPS;
        // v1.39：归位钉住待机弧线（肩在 restX(shI)、角度=弧线切线），而非僵直直线
        if (home) { armsX = restX(shI); armsY = 15.5 + shI * SEG_LEN; armsRot = targRot; }
        else { armsX = shNode.x; armsY = shNode.y; armsRot = targRot; }
        armsPX = armsX; armsPY = armsY; armsRotPX = armsRot;
      } else {
        // 软连接：速度保留插值（惯性 + 弹簧力 → 甩动拖尾、急停滑行回弹）
        var avx = (armsX - armsPX) * ARMS_DAMP;
        var avy = (armsY - armsPY) * ARMS_DAMP;
        armsPX = armsX; armsPY = armsY;
        armsX += avx + (shNode.x - armsX) * ARMS_SOFT;
        armsY += avy + (shNode.y - armsY) * ARMS_SOFT;
        var arv = (armsRot - armsRotPX) * ARMS_DAMP;
        armsRotPX = armsRot;
        var dAng = targRot - armsRot;
        dAng = Math.atan2(Math.sin(dAng), Math.cos(dAng)); // 归一化到 ±π（防环绕跳变）
        // 角度单帧限幅：绳子高频波浪时切线角瞬时变化再大，手臂每帧最多转 ARMS_MAX_ANG
        if (dAng > ARMS_MAX_ANG) dAng = ARMS_MAX_ANG;
        else if (dAng < -ARMS_MAX_ANG) dAng = -ARMS_MAX_ANG;
        armsRot += arv + dAng * ARMS_SOFT;
      }
      var armDeg = armsRot * 180 / Math.PI;
      armsEl.style.transform = "translate(" + (armsX - 22).toFixed(2) + "px, " + (armsY - 22).toFixed(2) + "px) rotate(" + armDeg.toFixed(1) + "deg)";
    }
    // 腿跟随胯端节点（translate 相对静止位 22,36 → 含横甩与拉长）
    if (lowerEl) {
      var hpx = rope[NODE_N - 1];
      lowerEl.style.transform = "translate(" + (hpx.x - 22).toFixed(2) + "px, " + (hpx.y - 36).toFixed(2) + "px)";
    }
  }

  // 绳子驱动（SVG 内）：按「总位移 + 拖动速度」设置两端目标——
  // dx 水平 → 横甩，dy 垂直 → 拉长。
  // 速度注入（v1.35）：把本帧拖动速度叠进目标（快速甩动 → 目标超前指针；
  // 指针减速/急停 → 目标回退）→ 绳子始终带过冲回弹——拖动中也有
  // 松手回弹那种 Q 弹橡皮筋手感（匀速拖动平滑跟随，变速时回弹）。
  // 抓取点决定两端"领先量"（neckShare/hipShare）：抓头 → 头端横移更多、胯端少
  // （头先动，下半身滞后）；抓下半身反之。
  // 镜像补偿：SVG 整体 scaleX(runDir) 翻转会让本地"向左弯"渲染成"向右弯"，
  // 把弯曲乘以 runDir 抵消 → 向左拖同样甩出明显效果。
  function applyStretch(p) {
    if (!rope.length) return;
    var g = GRAB[grabZone] || GRAB.body;
    var dx = p.x - downX; // 水平总位移 → 横甩方向（向右拖 → 绳子向右甩）
    var dy = p.y - downY; // 垂直总位移 → 拉长（向下拖 → 拉长）
    var dvx = p.x - lastX; // 本帧拖动速度（onMove 调用时 lastX 尚未更新 = 本帧增量）
    var dvy = p.y - lastY;
    var bend = clamp(dx * BEND_K + dvx * VEL_K, -MAX_BEND, MAX_BEND) * runDir; // 镜像补偿
    var stretch = clamp(dy * STRETCH_K + dvy * VEL_K, MIN_STRETCH, MAX_STRETCH);
    neckTargX = 22 + bend * g.neckShare;
    neckTargY = 15.5 + stretch * g.neckShare;
    hipTargX = 22 + bend * g.hipShare;
    hipTargY = 36 + stretch * g.hipShare;
    // 中段拱形目标：偏移放大 MID_GAIN 倍 → 中段鼓出，躯干呈明显弧线
    midTargX = 22 + bend * MID_GAIN;
    midTargY = MID_REST_Y + stretch * 0.5; // 中段跟随拉长的一半（对称拱形）
    startSpring();
  }

  // 松手回弹：两端目标回静止，绳子靠惯性和距离约束波动回稳
  // （像橡皮筋甩出去又弹回来，中间节点过冲抖动）。动画帧在回稳后自动停止。
  function releaseStretch() {
    if (!rope.length) return;
    neckTargX = 22; neckTargY = 15.5;
    hipTargX = 22;  hipTargY = 36;
    midTargX = 22;  midTargY = MID_REST_Y;
    startSpring();
  }

  // 抓取点感知：把按下位置换算成小人局部 viewBox 坐标（0-44 × 0-64），
  // 脖子线 y=15.5、胯线 y=36 → 上半 1/3 抓头、中段抓身、下半 1/3 抓腿。
  // 注意：按压点只定"哪端领先"，无论抓哪都拖动整个小人。
  function detectGrab(p) {
    var rect = stickman.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return "body";
    var ly = (p.y - rect.top) * 64 / rect.height;
    if (ly < 21) return "head";     // 头部 + 脖子上段
    if (ly > 43) return "legs";     // 胯下段 + 腿
    return "body";                  // 躯干中段
  }

  // 懒获取元素
  function getLayers() {
    if (!svgEl) svgEl = stickman.querySelector(".stickman-svg");
    if (!scaleEl) scaleEl = stickman.querySelector(".stickman-scale");
    if (!bodyEl) bodyEl = stickman.querySelector(".stick-body");
    if (!headEl) headEl = stickman.querySelector(".stick-head");
    if (!armsEl) armsEl = stickman.querySelector(".stick-arms");
    if (!lowerEl) lowerEl = stickman.querySelector(".stick-lower");
    if (!innerEl) innerEl = stickman.querySelector(".stickman-inner");
    if (!rope.length) initRope();
  }

  // 应用跑步朝向：水平镜像整个 SVG（flip-x），奔跑视觉方向随之反转
  // （v1.24.4+ 修正：视觉方向与拖动方向相反，符号取反后左右调换）
  function applyDir() {
    if (svgEl) svgEl.style.transform = "scaleX(" + (-runDir) + ")";
  }

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

  // 夹取到 [min, max]
  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function onStart(e) {
    if (e.type === "mousedown" && e.button !== 0) return; // 仅主键拖动
    getLayers();
    var p = getPoint(e);
    lastX = p.x;
    lastY = p.y; // 记录本次拖动起点，后续按指针增量累加
    downX = p.x;
    downY = p.y; // 记录按下坐标：松手时位移 < CLICK_DIST 判定为「点击」而非拖拽
    grabZone = detectGrab(p); // 抓取点感知：头/身/腿 → 决定绳子哪端领先
    velX = 0;    // 本次拖动重新累计水平速度（决定朝向）
    startSpring(); // 弹簧承接上次残余弹性状态继续运动（若上次回弹未完成）
    dragging = true;
    stickman.classList.add("dragging"); // 外层：待机呼吸 → 真实奔跑（cursor: grabbing）
    if (innerEl) innerEl.classList.add("running"); // 内层：触发四肢 CSS 摆动动画
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
    stickman.style.transform = "translate3d(" + x + "px, " + y + "px, 0)"; // 外层：GPU 加速定位
    applyDir(); // 跑步朝向（整体镜像）
    applyStretch(p); // 中层：橡皮管拉伸变形（独立 transform，不与 translate3d 冲突）
    lastX = p.x;
    lastY = p.y;
    if (e.cancelable) e.preventDefault(); // 触屏防滚动（touch-action: none 兜底）
  }

  function onEnd(e) {
    if (!dragging) return;
    dragging = false;
    stickman.classList.remove("dragging"); // 外层：停止奔跑、恢复呼吸；停在原地（不归位）
    if (innerEl) innerEl.classList.remove("running"); // 内层：移除四肢摆动 → 恢复待机呼吸
    runDir = 1;    // 复位默认朝向（松手静止，无方向）
    applyDir();
    releaseStretch(); // 中层：橡皮管错位回弹归零（skewX/lag 弹簧回中）
    // 点击说话彩蛋：按下→松开全程位移 < CLICK_DIST 判定为「点击」，
    // 随机台词弹气泡；拖拽（位移 ≥ 阈值）不触发；touchcancel 不触发。
    var dx = lastX - downX, dy = lastY - downY;
    var isCancel = e && e.type === "touchcancel";
    if (!isCancel) {
      triggerSquash(); // 中层 Q 弹挤压：松手落地（拖拽）/ 点击都触发，模拟果冻落地
      if (Math.sqrt(dx * dx + dy * dy) < CLICK_DIST) showBubble();
    }
  }

  // ===== 中层 Q 弹挤压（v1.37 · AI-GEN）=====
  // 拖拽松手落地 / 点击说话时，中层触发 squashAndStretch 动画：
  // 压扁 → 拉长 → 衰减回原状（0.6s 过冲缓动，模拟落地果冻感）。
  // 动画挂在 .stickman-scale（JS 从不写它的 transform）→ 与外层 translate3d、
  // 内层呼吸/四肢动画完全解耦。连续触发可打断重播：先移除 class → 强制回流 → 重新添加。
  function triggerSquash() {
    if (!scaleEl) return;
    scaleEl.classList.remove("squashing");
    void scaleEl.offsetWidth; // 强制回流，重启动画（连续点击/松手不卡死）
    scaleEl.classList.add("squashing");
    if (squashTimer !== null) clearTimeout(squashTimer);
    squashTimer = setTimeout(function () {
      scaleEl.classList.remove("squashing");
      squashTimer = null;
    }, SQUASH_MS);
  }

  // ===== 点击说话彩蛋（v1.24.6 · AI-GEN）=====
  function getBubble() {
    if (!bubble) bubble = stickman.querySelector(".stick-bubble");
    return bubble;
  }
  // 弹出气泡：约 10% 概率从稀有台词池抽取，否则从普通台词池抽取；
  // 避免与上次台词连续重复，重置 4s 自动消失计时
  function showBubble() {
    var b = getBubble();
    if (!b) return;
    var rare = Math.random() < 0.1; // 稀有台词低概率触发
    document.dispatchEvent(new CustomEvent("site-egg", { detail: { name: "stickman" } }));
    if (rare) document.dispatchEvent(new CustomEvent("site-egg", { detail: { name: "rare-line" } }));
    var pool = rare ? RARE_LINES : LINES;
    var pick;
    var guard = 0;
    do {
      pick = pool[(Math.random() * pool.length) | 0];
      guard++;
    } while (pool.length > 1 && pick === lastLineText && guard < 8);
    lastLineText = pick;
    var text = b.querySelector(".stick-bubble-text");
    if (text) text.textContent = pick;
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

/* ============================================================
   第三个彩蛋（v1.41.2 · AI-GEN）：键盘直接输入 copy → 复制火柴人
   - 在页面任意处（不在输入框内）依次按下 c-o-p-y，立即复制一个火柴人；
   - 复制体随机出现在视口内，保留待机呼吸动画与对话气泡（点击可说
     自己的台词）；复制体不可拖动（拖动物理只绑定本体）。
   - 上限：含本体最多 10 个；已达上限再输入 copy → 清空全部复制体，
     回到「只有本体一个」的状态，并由本体气泡播报一句。
   - 键盘缓冲规则与 lycnb 彩蛋一致：忽略修饰键 / 输入法组字 / 输入框，
     1.5s 空闲自动清空缓冲，避免误触。
   ============================================================ */
(function () {
  "use strict";

  var master = document.getElementById("stickman");
  if (!master) return; // 结构缺失静默退出

  var COPY_KEYS = "copy"; // 口令
  var TTL = 1500;         // 口令缓冲空闲有效期（与 lycnb 一致）
  var MAX_CLONES = 9;     // 复制体上限（本体 1 + 9 = 10）
  var BUBBLE_MS = 4000;   // 复制体气泡自动消失时长（与本体一致）

  // 复制体台词池
  var CLONE_LINES = [
    "我是你的复制体，请多指教。",
    "copy 成功！我分身了。",
    "我们看起来一模一样，对吧？",
    "别按了别按了，队都快排到屏幕外面了。",
    "复制体的梦想也是梦想——梦想即力量！"
  ];
  // 超限回收播报池（显示在本体气泡上）
  var RESET_LINES = [
    "已达上限！复制体已回收，回到最初的你。",
    "人太多了，解散！回归单机模式。",
    "上限 10 个达成，复制体合并完毕。"
  ];

  var clones = [];     // 复制体元素数组
  var buffer = "";     // 口令缓冲
  var bufferTimer = 0; // 缓冲空闲清空定时器

  function isTypingTarget(node) {
    if (!node) return false;
    var tag = (node.tagName || "").toLowerCase();
    return (
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      node.isContentEditable === true
    );
  }

  // 复制体自己的气泡（独立 DOM，不碰本体的气泡计时器）
  function showCloneBubble(clone) {
    var b = clone.querySelector(".stick-bubble");
    if (!b) return;
    var text = b.querySelector(".stick-bubble-text");
    if (text) text.textContent = CLONE_LINES[(Math.random() * CLONE_LINES.length) | 0];
    b.classList.add("show");
    if (clone._bubbleTimer) clearTimeout(clone._bubbleTimer);
    clone._bubbleTimer = setTimeout(function () {
      b.classList.remove("show");
    }, BUBBLE_MS);
  }

  // 本体气泡播报一句（直接 DOM 操作，与本体的 showBubble 并行且幂等）
  function masterBubble(text) {
    var b = master.querySelector(".stick-bubble");
    if (!b) return;
    var el = b.querySelector(".stick-bubble-text");
    if (el) el.textContent = text;
    b.classList.add("show");
    if (master._copyResetTimer) clearTimeout(master._copyResetTimer);
    master._copyResetTimer = setTimeout(function () {
      b.classList.remove("show");
    }, BUBBLE_MS);
  }

  // 复制/回收主逻辑
  function spawnClone() {
    // 已达上限：清空全部复制体，回到「只有本体一个」
    if (clones.length >= MAX_CLONES) {
      clones.forEach(function (c) { c.remove(); });
      clones = [];
      masterBubble(RESET_LINES[(Math.random() * RESET_LINES.length) | 0]);
      return;
    }
    var clone = master.cloneNode(true); // 深克隆（含 SVG 与气泡），不复制事件监听
    clone.removeAttribute("id");        // 避免重复 id
    clone.classList.add("stickman-clone"); // 出现动画（CSS 追加）
    clone.style.transform = "";         // 清掉本体可能的拖动位移
    clone.style.right = "auto";         // 改用 left/top 随机定位
    clone.style.bottom = "auto";
    var w = window.innerWidth || document.documentElement.clientWidth;
    var h = window.innerHeight || document.documentElement.clientHeight;
    clone.style.left = Math.round(16 + Math.random() * Math.max(8, w - 100)) + "px";
    clone.style.top = Math.round(16 + Math.random() * Math.max(8, h - 130)) + "px";
    document.body.appendChild(clone);
    // 复制体点击说话（cloneNode 不复制监听器，需单独绑定）
    clone.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      showCloneBubble(clone);
    });
    clone.addEventListener("touchstart", function () {
      showCloneBubble(clone);
    }, { passive: true });
    clones.push(clone);
  }

  document.addEventListener("keydown", function (e) {
    // 带修饰键、输入法组字中的按键一律忽略
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    // 正在输入框里打字：不参与口令，并清空已累计的缓冲
    if (isTypingTarget(e.target)) {
      buffer = "";
      return;
    }
    // 只统计单个可见字符（忽略 Shift、方向键、F1 等）
    if (!e.key || e.key.length !== 1) return;
    buffer = (buffer + e.key.toLowerCase()).slice(-COPY_KEYS.length);
    clearTimeout(bufferTimer);
    bufferTimer = setTimeout(function () {
      buffer = "";
    }, TTL);
    if (buffer === COPY_KEYS) {
      buffer = "";
      spawnClone();
      document.dispatchEvent(new CustomEvent("site-egg", { detail: { name: "copy" } }));
    }
  });
})();
