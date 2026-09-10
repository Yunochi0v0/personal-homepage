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

/* ---------- 10. 彩蛋：输入「梦想即力量」跳转 ---------- */
(function () {
  const eggBox = document.getElementById("easterEgg");
  const eggForm = document.getElementById("easterEggForm");
  const eggInput = document.getElementById("easterEggInput");
  const eggHint = document.getElementById("easterEggHint");
  if (!eggForm || !eggInput) return;

  const MAGIC = "梦想即力量";
  const TARGET_URL = "https://anime.bang-dream.com/yumemita/";

  // 更新提示文案（空字符串则隐藏）
  function setHint(text) {
    if (!eggHint) return;
    eggHint.textContent = text;
    eggHint.classList.toggle("show", !!text);
  }

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
    "a, button, input, textarea, select, .btn, .about-card, .project-card, .contact-card, .skill-item, .dock-icon";

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
