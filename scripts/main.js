// 个人主页交互脚本 v2
// AI-generated: 交互逻辑由 AI 生成并已人工审阅

/* ---------- 1. 页脚年份 ---------- */
document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- 2. macOS 风格 Dock：图标邻近放大 ---------- */
const dock = document.getElementById("dock");
const dockIcons = dock ? Array.from(dock.querySelectorAll(".dock-icon")) : [];

(function initDockMagnify() {
  if (!dock || !dockIcons.length) return;
  const MAX_SCALE = 1.75; // 最近处放大倍数
  const RANGE = 130; // 影响半径(px)
  const LIFT = 26; // 放大时上浮位移(px)
  let centers = [];

  // 缓存每个图标中心 x（在未放大时读取，避免 transform 反馈抖动）
  function cacheCenters() {
    centers = dockIcons.map((icon) => {
      const r = icon.getBoundingClientRect();
      return r.left + r.width / 2;
    });
  }

  function reset() {
    dockIcons.forEach((icon) => {
      icon.style.transition = "";
      icon.style.transform = "";
    });
  }

  dock.addEventListener("mouseenter", () => {
    cacheCenters();
    // 跟随鼠标时即时响应，避免过渡延迟
    dockIcons.forEach((icon) => (icon.style.transition = "none"));
  });

  dock.addEventListener("mousemove", (e) => {
    if (!centers.length) cacheCenters();
    dockIcons.forEach((icon, i) => {
      const dist = Math.abs(e.clientX - centers[i]);
      const scale =
        dist < RANGE ? 1 + (MAX_SCALE - 1) * Math.cos((dist / RANGE) * Math.PI * 0.5) : 1;
      const lift = (scale - 1) * LIFT;
      icon.style.transform = `translateY(${-lift}px) scale(${scale})`;
    });
  });

  dock.addEventListener("mouseleave", reset);
  window.addEventListener("resize", () => {
    centers = [];
  });
})();

/* ---------- 3. 顶部滚动进度条 + 导航背景 + 返回顶部 ---------- */
const scrollProgress = document.getElementById("scrollProgress");
const backTop = document.getElementById("backTop");

function onScroll() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  scrollProgress.style.width = percent + "%";

  if (dock) dock.classList.toggle("scrolled", scrollTop > 40);
  backTop.classList.toggle("show", scrollTop > 500);
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

backTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ---------- 4. 打字机 slogan ---------- */
function typeWriter() {
  const el = document.getElementById("typewriter");
  if (!el) return;
  const text = el.textContent;
  el.textContent = "";
  let i = 0;
  const isCJK = (ch) => /[\u3400-\u9fff\uf900-\ufaff]/.test(ch);
  const speed = 140;

  function type() {
    if (i < text.length) {
      el.textContent += text.charAt(i);
      i++;
      // 中文按字、英文按词停顿
      setTimeout(type, isCJK(text.charAt(i - 1)) ? speed : 60);
    } else {
      // 打字完成：为 slogan 启用故障抖动（不与打字过程冲突）
      const hs = el.closest(".hero-slogan");
      if (hs && !hs.classList.contains("glitch")) {
        hs.setAttribute("data-text", text);
        hs.classList.add("glitch");
      }
    }
  }
  setTimeout(type, 400);
}
typeWriter();

/* ---------- 5. 导航栏 active 高亮 ---------- */
const sections = document.querySelectorAll("section[id]");
const navAnchors = document.querySelectorAll(".dock-link");
const hero = document.getElementById("hero");

const spy = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navAnchors.forEach((a) => {
          a.classList.toggle("active", a.getAttribute("href") === "#" + id);
        });
      }
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);

sections.forEach((s) => spy.observe(s));

// 滚动到最顶部（Hero 区）时高亮「首页」项
const heroSpy = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navAnchors.forEach((a) => {
          a.classList.toggle("active", a.getAttribute("href") === "#hero");
        });
      }
    });
  },
  { rootMargin: "0px 0px -90% 0px" }
);
heroSpy.observe(hero);

/* ---------- 6. 滚动进场动画 ---------- */
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay ? parseInt(entry.target.dataset.delay, 10) : 0;
        setTimeout(() => entry.target.classList.add("visible"), delay);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

/* ---------- 7. 技能进度条填充动画 ---------- */
const skillObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        bar.style.width = (bar.dataset.target || 0) + "%";
        observer.unobserve(bar);
      }
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll(".skill-bar span[data-target]").forEach((bar) => {
  skillObserver.observe(bar);
});

/* ---------- 8. 占位链接（GitHub 即将上线）提示 ---------- */
document.querySelectorAll(".is-placeholder").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    alert("这个链接还在准备中，敬请期待！");
  });
});

/* ---------- 9. 数字孪生（虚拟的我 · 基于个人简介问答） ----------
   AI-generated: 对话知识库来自 index.html 中的个人简介，规则由 AI 生成并已人工审阅 */
(function () {
  const twinBody = document.getElementById("twinBody");
  const twinForm = document.getElementById("twinForm");
  const twinInput = document.getElementById("twinInput");
  if (!twinBody || !twinForm || !twinInput) return;

  // 知识库：关键词（去空格满配命中）-> 回答。回答内容严格取自个人简介，不虚构。
  const KNOWLEDGE = [
    {
      keys: ["你是谁", "介绍你", "介绍一下"],
      reply:
        "你好！我是刘聿宸，今年 18 岁，一名大一新生。我的 slogan 是「梦想即力量」——相信怀揣梦想的人，脚下最有力量。想了解哪方面，尽管问我～",
    },
    { keys: ["年龄", "多大", "几岁"], reply: "我今年 18 岁，是一名刚刚踏入大学生活的大一新生。" },
    {
      keys: ["学校", "大学", "学院", "天院", "港理工", "在哪里读书"],
      reply:
        "我目前就读于天津大学香港理工大学深圳未来技术学院，主攻计算机科学与技术专业。两所学校的氛围让我对工程与创新充满期待。",
    },
    {
      keys: ["专业", "学什么", "专业是什么"],
      reply: "我的专业是计算机科学与技术，现在正处于大一的起点，正在一步步打基础。",
    },
    {
      keys: ["slogan", "格言", "座右铭", "梦想", "口号"],
      reply:
        "我的 slogan 是「梦想即力量」。我相信，怀揣梦想的人，脚下最有力量——这也是我学习和创作时的信念。",
    },
    {
      keys: ["爱好", "兴趣", "喜欢", "课余", "平时"],
      reply:
        "课余时间我喜欢听音乐和玩音游，在节奏与旋律里放松和专注；也享受把时间投入到学习与创作中的充实感。",
    },
    {
      keys: ["技能", "会什么", "会哪些", "特长", "能力"],
      reply:
        "我正在学习：前端基础（HTML/CSS/JS）、Python 编程、AI 辅助开发（Vibe Coding）和 Git 版本控制。作为编程与 AI 的初学者，我还在一步步积累。",
    },
    {
      keys: ["ai", "课程", "vibe", "编码", "在做", "目标", "梦想即力量"],
      reply:
        "我正在通过 Vibe Coding 实践，学着把模糊的想法拆解成清晰的需求，再逐步搭建、验证和迭代。这个个人主页就是我的第一个作品，我会用它记录学习、项目与成长。",
    },
    {
      keys: ["项目", "作品", "主页", "做了什么"],
      reply:
        "目前我在做这个个人主页 MVP——用纯 HTML/CSS/JS 搭建，展示我的介绍、技能和联系方式。以后完成的课程项目，我也会记录在这里。",
    },
    {
      keys: ["联系", "邮箱", "怎么找你", "联系方式"],
      reply: "可以通过邮箱联系我：319008328@qq.com。欢迎交流，期待认识你！",
    },
    { keys: ["你好", "嗨", "哈喽", "在吗", "hello", "hi"], reply: "你好！我是数字孪生的刘聿宸，想聊点什么？" },
    { keys: ["谢谢", "感谢", "thx"], reply: "不客气！很高兴认识你，还有想了解的吗？" },
  ];

  const FALLBACK =
    "这个问题我还没想好怎么答（我只能基于我的个人简介回答）。你可以问我：你是谁、你的slogan、你在哪个学校、你有什么爱好、你会什么技能。";

  // 命中知识库：取命中数最多的条目；没有则返回兜底
  function matchReply(text) {
    let best = null;
    let bestScore = 0;
    for (const item of KNOWLEDGE) {
      let score = 0;
      for (const key of item.keys) {
        if (text.includes(key)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    }
    return best ? best.reply : FALLBACK;
  }

  function addMsg(text, who) {
    const div = document.createElement("div");
    div.className = "msg " + who;
    div.textContent = text;
    twinBody.appendChild(div);
    twinBody.scrollTop = twinBody.scrollHeight;
    return div;
  }

  function showTyping() {
    const div = document.createElement("div");
    div.className = "msg bot typing";
    div.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    twinBody.appendChild(div);
    twinBody.scrollTop = twinBody.scrollHeight;
    return div;
  }

  function sendQuestion(raw) {
    const text = raw.trim();
    if (!text) return;
    addMsg(text, "user");
    twinInput.value = "";
    const typing = showTyping();
    const reply = matchReply(text.toLowerCase());
    // 模拟思考延迟，更具"数字孪生"临场感
    setTimeout(() => {
      typing.remove();
      addMsg(reply, "bot");
    }, 500 + Math.random() * 450);
  }

  twinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendQuestion(twinInput.value);
  });

  document.querySelectorAll("#twinSuggests button").forEach((btn) => {
    btn.addEventListener("click", () => sendQuestion(btn.dataset.q));
  });

  // 初始欢迎语
  addMsg(
    "嗨，我是数字孪生的刘聿宸。我可以根据我的个人简介回答你关于我的问题，比如学校、专业、slogan、爱好和技能。想从哪里开始？",
    "bot"
  );
})();

/* ---------- 10. 彩蛋：键盘连打 lycnb 解锁浮层 + 输入「梦想即力量」跳转 ---------- */
/* AI-generated: 常态隐藏，键盘依次按下 l-y-c-n-b 后以固定浮层弹出；
   浮层内输入暗号「梦想即力量」点亮并跳转。
   边界处理：焦点在输入框打字 / 输入法组字中 / 带修饰键 / 开启动画播放期间
   都不计入口令；口令缓冲空闲 1.5s 自动清空；Esc、关闭按钮、点击遮罩均可退出。 */
(function () {
  const eggBox = document.getElementById("easterEgg");
  const eggForm = document.getElementById("easterEggForm");
  const eggInput = document.getElementById("easterEggInput");
  const eggHint = document.getElementById("easterEggHint");
  const eggClose = document.getElementById("easterEggClose");
  if (!eggForm || !eggInput) return;

  const MAGIC = "梦想即力量";
  const TARGET_URL = "https://anime.bang-dream.com/yumemita/";
  const UNLOCK_KEYS = "lycnb"; // 隐藏关卡口令
  const BUFFER_TTL = 1500; // 口令缓冲的空闲有效期（毫秒）

  // 更新提示文案（空字符串则隐藏）
  function setHint(text) {
    if (!eggHint) return;
    eggHint.textContent = text;
    eggHint.classList.toggle("show", !!text);
  }

  /* ---------- 浮层显隐 ---------- */
  function isOpen() {
    return !!eggBox && eggBox.classList.contains("revealed");
  }

  /* ---------- 开启动画：终端解密序列 ---------- */
  /* AI-generated: 与站点开启动画刻意区分主题——这里是「青色密钥解密」：
     遮罩直接压黑（不做电子枪亮点展开）→ 逐行输出解密日志（其中两行尾部
     乱码滚动）→ JS 逐帧推进的百分比进度条 → ACCESS GRANTED 闪烁 +
     扫描线扫过面板。总时长约 4.6 秒，播放期间点击或 Esc 可跳过。 */
  const BOOT_LINES = [
    "> INCOMING SIGNAL ............... OK",
    "> DECRYPTING KEY ",
    "> KEY ACCEPTED: l-y-c-n-b",
    "> HIDDEN LEVEL LOCATED ........... OK",
    "> LOADING MODULE "
  ];
  const SCRAMBLE_CHARS = "!<>-_\\/[]{}=+*^?#0123456789";
  const SCRAMBLE_INDEXES = [1, 4]; // 这两行在"解密中"阶段尾部字符随机滚动

  let bootRunning = false;
  let finishBoot = null;

  function playEggBoot() {
    const boot = document.getElementById("eggBoot");
    const log = document.getElementById("eggBootLog");
    const fill = document.getElementById("eggBootBarFill");
    const status = document.getElementById("eggBootStatus");

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 减弱动态效果，或动画元素缺失：直接显示输入区，保证彩蛋始终可用
    if (reduceMotion || !boot || !log) {
      if (eggBox) eggBox.classList.add("egg-ready");
      setHint("✦ 隐藏关卡已解锁");
      requestAnimationFrame(() => eggInput.focus());
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
    if (eggBox) eggBox.classList.remove("egg-ready");

    const timers = [];
    const printed = [];
    let scrambleTimer = 0;
    let barTimer = 0;
    let settled = false;

    function at(ms, fn) {
      timers.push(setTimeout(fn, ms));
    }

    function render() {
      log.textContent = printed.join("\n");
    }

    function onBootKey(e) {
      if (e.key === "Escape") finish();
    }

    function finish() {
      if (settled) return;
      settled = true;
      bootRunning = false;
      finishBoot = null;

      for (let i = 0; i < timers.length; i++) clearTimeout(timers[i]);
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
      if (eggBox) eggBox.classList.add("egg-ready");
      setHint("✦ 隐藏关卡已解锁");
      requestAnimationFrame(() => eggInput.focus());
    }

    finishBoot = finish;
    bootRunning = true;
    window.addEventListener("keydown", onBootKey);
    boot.addEventListener("pointerdown", finish);

    // ① 逐行打印解密日志（每行 400ms）
    BOOT_LINES.forEach((line, index) => {
      at(300 + index * 400, () => {
        printed[index] = line;
        render();
      });
    });

    // ② 两行"解密中"日志：尾部乱码滚动约 0.6s 后定格
    SCRAMBLE_INDEXES.forEach((index) => {
      const startAt = 300 + index * 400;
      at(startAt + 60, () => {
        printed[index] = BOOT_LINES[index];
        scrambleTimer = setInterval(() => {
          let s = BOOT_LINES[index];
          for (let i = 0; i < 12; i++) {
            s += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          }
          printed[index] = s;
          render();
        }, 70);
      });
      at(startAt + 620, () => {
        clearInterval(scrambleTimer);
        scrambleTimer = 0;
        printed[index] = BOOT_LINES[index] + "........... OK";
        render();
      });
    });

    // ③ 进度条：JS 逐帧推进并显示百分比（0 → 100%）
    at(2350, () => {
      let pct = 0;
      barTimer = setInterval(() => {
        pct = Math.min(100, pct + 2 + Math.floor(Math.random() * 3));
        if (fill) fill.style.width = pct + "%";
        if (status) status.textContent = "LOADING " + ("00" + pct).slice(-3) + "%";
        if (pct >= 100) {
          clearInterval(barTimer);
          barTimer = 0;
        }
      }, 34);
    });

    // ④ 结果与收尾：先收掉进度条，避免百分比把它自己写回去
    at(3500, () => {
      if (barTimer) {
        clearInterval(barTimer);
        barTimer = 0;
      }
      if (fill) fill.style.width = "100%";
      if (!status) return;
      status.textContent = "ACCESS GRANTED";
      status.classList.add("is-granted");
    });
    at(3900, () => boot.classList.add("is-sweeping"));
    at(4500, finish);
  }

  function openEgg() {
    if (!eggBox || isOpen()) return;
    eggBox.classList.add("revealed");
    eggBox.setAttribute("aria-hidden", "false");
    setHint("");
    playEggBoot();
  }

  function closeEgg() {
    if (!isOpen()) return;
    // 动画尚未结束就被关闭：先把动画收尾，避免定时器继续跑
    if (bootRunning && finishBoot) finishBoot();
    eggBox.classList.remove("revealed");
    eggBox.setAttribute("aria-hidden", "true");
    setHint("");
    eggInput.blur();
  }

  if (eggClose) eggClose.addEventListener("click", closeEgg);

  // 点击面板之外的遮罩区域也可关闭
  if (eggBox) {
    eggBox.addEventListener("click", (e) => {
      if (e.target === eggBox) closeEgg();
    });
  }

  /* ---------- 键盘连打口令解锁 ---------- */
  function isTypingTarget(node) {
    if (!node) return false;
    const tag = (node.tagName || "").toLowerCase();
    return (
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      node.isContentEditable === true
    );
  }

  let buffer = "";
  let bufferTimer = 0;

  window.addEventListener("keydown", (e) => {
    // Esc：动画播放中先跳过动画，动画结束后再按才是关闭浮层
    if (e.key === "Escape") {
      if (bootRunning) return;
      closeEgg();
      return;
    }

    // 带修饰键、输入法组字中的按键一律忽略
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;

    // 正在输入框里打字：不参与口令，并清空已累计的缓冲
    if (isTypingTarget(e.target)) {
      buffer = "";
      return;
    }

    // 开启动画播放期间不响应，避免口令字母被"按键跳过动画"的逻辑吞掉
    if (document.documentElement.classList.contains("is-booting")) return;

    // 只统计单个可见字符（忽略 Shift、方向键、F1 等）
    if (!e.key || e.key.length !== 1) return;

    buffer = (buffer + e.key.toLowerCase()).slice(-UNLOCK_KEYS.length);
    clearTimeout(bufferTimer);
    bufferTimer = setTimeout(() => {
      buffer = "";
    }, BUFFER_TTL);

    if (buffer === UNLOCK_KEYS) {
      buffer = "";
      openEgg();
    }
  });

  /* ---------- 暗号提交 ---------- */
  // 提交时（回车或点击 ✨）触发：去除首尾空格后精确匹配
  eggForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = eggInput.value.trim();

    if (value === MAGIC) {
      // 命中暗号：发光提示后跳转
      if (eggBox) eggBox.classList.add("triggered");
      setHint("✦ 咒语生效，梦想即力量 · 正在进入…");
      setTimeout(() => {
        window.location.href = TARGET_URL;
      }, 700);
    } else if (value) {
      // 暗号不对：轻微抖动提示
      setHint("咒语不对哦，再想想…");
      if (eggBox) {
        eggBox.classList.add("shake");
        setTimeout(() => eggBox.classList.remove("shake"), 420);
      }
    }
  });
})();

/* ---------- 11. 自定义霓虹光标 + 轨迹拖尾 ----------
   AI-generated: 仅在桌面精确指针且允许动效时启用；
   原生的隐藏（html.has-cursor）推迟到用户第一次移动鼠标才生效，
   脚本未运行或出错时完全不产生影响，保证光标始终可用 */
(function () {
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!finePointer || reduceMotion || !document.body) return;

  const root = document.documentElement;
  const dot = document.createElement("div");
  const ring = document.createElement("div");
  dot.className = "cursor-dot";
  ring.className = "cursor-ring";
  dot.setAttribute("aria-hidden", "true");
  ring.setAttribute("aria-hidden", "true");
  dot.style.opacity = "0";
  ring.style.opacity = "0";
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  // 悬停这些元素时光环放大
  const HOVER_SELECTOR =
    "a, button, input, textarea, select, .btn, .about-card, .mission, .contact-card, .skill-item, .dock-icon";

  const TRAIL_STEP = 14; // 每移动约 14px 落一个粒子
  const MAX_TRAIL = 26; // 同屏粒子上限，避免性能压力
  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx;
  let ry = my;
  let lastX = mx;
  let lastY = my;
  let trailCount = 0;
  let started = false;

  function spawnTrail(x, y) {
    if (trailCount >= MAX_TRAIL) return;
    const p = document.createElement("span");
    p.className = "cursor-trail" + (Math.random() > 0.5 ? " alt" : "");
    p.style.left = x + "px";
    p.style.top = y + "px";
    p.style.setProperty("--dx", (Math.random() * 28 - 14).toFixed(1) + "px");
    p.style.setProperty("--dy", (Math.random() * 22 + 8).toFixed(1) + "px");
    document.body.appendChild(p);
    trailCount += 1;
    p.addEventListener("animationend", () => {
      p.remove();
      trailCount -= 1;
    });
  }

  function onMove(e) {
    mx = e.clientX;
    my = e.clientY;
    if (!started) {
      // 首次移动：对齐位置、显示自定义光标，并在此刻才隐藏原生光标
      started = true;
      rx = mx;
      ry = my;
      lastX = mx;
      lastY = my;
      root.classList.add("has-cursor");
      dot.style.opacity = "1";
      ring.style.opacity = "1";
    }
    const dx = mx - lastX;
    const dy = my - lastY;
    if (dx * dx + dy * dy >= TRAIL_STEP * TRAIL_STEP) {
      spawnTrail(mx, my);
      lastX = mx;
      lastY = my;
    }
  }

  function tick() {
    // 光环缓动跟随，形成拖曳感
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    dot.style.transform = "translate(" + mx + "px, " + my + "px)";
    ring.style.transform = "translate(" + rx.toFixed(2) + "px, " + ry.toFixed(2) + "px)";
    requestAnimationFrame(tick);
  }

  window.addEventListener("mousemove", onMove, { passive: true });

  document.addEventListener("mouseover", (e) => {
    if (e.target && e.target.closest && e.target.closest(HOVER_SELECTOR)) {
      ring.classList.add("is-hover");
      dot.classList.add("is-hover"); // 中心点切换为四芒星
    }
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target && e.target.closest && e.target.closest(HOVER_SELECTOR)) {
      const to = e.relatedTarget;
      if (!to || !to.closest || !to.closest(HOVER_SELECTOR)) {
        ring.classList.remove("is-hover");
        dot.classList.remove("is-hover");
      }
    }
  });

  window.addEventListener("mousedown", () => ring.classList.add("is-down"));
  window.addEventListener("mouseup", () => ring.classList.remove("is-down"));

  // 移出窗口时隐藏，移回时恢复（未开始前保持隐藏）
  document.addEventListener("mouseleave", () => {
    dot.style.opacity = "0";
    ring.style.opacity = "0";
  });
  document.addEventListener("mouseenter", () => {
    if (started) {
      dot.style.opacity = "1";
      ring.style.opacity = "1";
    }
  });

  requestAnimationFrame(tick);
})();

/* ============ 12. 背景动态正弦波（黄色 · Canvas） ============ */
/* AI-generated: 用 Canvas 绘制 3 条缓慢流动的黄色正弦波作为页面背景。
   细节：① 跟随 devicePixelRatio 适配，避免高分屏发虚；
   ② 频率按视口宽度换算，保证屏幕上始终能看到固定数量的周期；
   ③ 尊重系统「减弱动态效果」设置，此时只画静止波形；
   ④ 页面切到后台时暂停绘制，节省性能。 */
(function initWaveBackground() {
  const canvas = document.getElementById("waveBg");
  if (!canvas || typeof canvas.getContext !== "function") return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reduced =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // y / amp 为视口高度比例；cycles 为屏幕内可见的周期数（数值越大波长越短、波峰越陡）；
  // speed 为相位速度（弧度/秒），已随更短的波长同步上调，使波峰横向移动速度保持约 60px/秒
  const WAVES = [
    { y: 0.3, amp: 0.055, cycles: 8, speed: 2.1, width: 2, alpha: 0.32 },
    { y: 0.52, amp: 0.07, cycles: 7, speed: -1.85, width: 2.6, alpha: 0.22 },
    { y: 0.76, amp: 0.05, cycles: 9, speed: 2.35, width: 1.8, alpha: 0.26 }
  ];

  let w = 0;
  let h = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth || window.innerWidth;
    h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(time) {
    ctx.clearRect(0, 0, w, h);
    const t = time / 1000;

    for (let i = 0; i < WAVES.length; i++) {
      const wave = WAVES[i];
      if (w <= 0 || h <= 0) continue;

      const baseY = h * wave.y;
      const amp = h * wave.amp;
      const k = (Math.PI * 2 * wave.cycles) / w; // 弧度/像素，按屏宽换算
      const phase = t * wave.speed;

      ctx.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const y = baseY + Math.sin(x * k + phase) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.strokeStyle = "rgba(255, 232, 26, " + wave.alpha + ")";
      ctx.lineWidth = wave.width;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(255, 232, 26, " + (wave.alpha * 0.8).toFixed(3) + ")";
      ctx.shadowBlur = 8;
      ctx.stroke();
    }

    ctx.shadowBlur = 0; // 复位，避免影响后续绘制
  }

  let raf = null;
  let elapsed = 0;

  function loop(now) {
    elapsed = now;
    draw(elapsed);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (raf !== null || reduced) return;
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (raf === null) return;
    cancelAnimationFrame(raf);
    raf = null;
  }

  resize();
  draw(0);

  window.addEventListener("resize", () => {
    resize();
    draw(elapsed);
  });

  if (!reduced) {
    start();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });
  }
})();

/* ============ 13. 开启动画（复古 CRT 开机自检） ============ */
/* AI-generated: 逐行打印 BIOS 自检文字，随后进度条跳格走满、显示品牌名，
   最后整屏收束成一条水平亮线后消失。
   边界处理：① 尊重系统「减弱动态效果」，或 URL 带 ?noboot 时直接跳过；
   ② 点击 / 按键 / 触摸可随时跳过；③ 跳过时清理所有未触发的定时器。 */
(function initBootSequence() {
  const boot = document.getElementById("bootScreen");
  if (!boot) return;

  const root = document.documentElement;
  const log = document.getElementById("bootLog");

  function releaseScroll() {
    root.classList.remove("is-booting");
  }

  function finish() {
    releaseScroll();
    boot.classList.add("is-closing");
    setTimeout(function () {
      boot.classList.add("is-done");
    }, 700);
  }

  const reduced =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const search = (window.location && window.location.search) || "";

  // 减弱动态效果 / 显式跳过：不播放动画，直接让页面可用
  if (reduced || search.indexOf("noboot") !== -1) {
    boot.classList.add("is-done");
    releaseScroll();
    return;
  }

  const LINES = [
    "DEEPWORKS BIOS v1.17.0",
    "MEMTEST 640K ............... <OK>",
    "NEON SHADER LOAD ........... <OK>",
    "SINE WAVE ENGINE ........... <OK>",
    "AUDIO INTERFACE ............ <OK>",
    "MOUNT /LIUYUCHEN ........... <OK>"
  ];

  const timers = [];
  let skipped = false;

  function at(ms, fn) {
    timers.push(setTimeout(fn, ms));
  }

  function clearTimers() {
    for (let i = 0; i < timers.length; i++) clearTimeout(timers[i]);
    timers.length = 0;
  }

  function skip() {
    if (skipped) return;
    skipped = true;
    clearTimers();
    finish();
  }

  window.addEventListener("pointerdown", skip, { once: true });
  window.addEventListener("keydown", skip, { once: true });

  if (log) {
    LINES.forEach(function (line, index) {
      at(580 + index * 170, function () {
        log.innerHTML +=
          line.replace("<OK>", '<span class="boot-ok">[ OK ]</span>') + "\n";
      });
    });
  }

  at(4050, finish);
})();
