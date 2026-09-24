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
/* v1.42.5：token 防叠——语言切换触发重打时，取消进行中的旧打字序列；
   slogan 文案由 i18n.js 的 data-i18n 标注更新，这里只负责"打字"效果。 */
let typeToken = 0;
function typeWriter() {
  const el = document.getElementById("typewriter");
  if (!el) return;
  const myToken = ++typeToken; // 取消旧序列
  const text = el.textContent;
  el.textContent = "";
  let i = 0;
  const isCJK = (ch) => /[\u3400-\u9fff\uf900-\ufaff]/.test(ch);
  const speed = 140;

  function type() {
    if (myToken !== typeToken) return; // 已有更新的打字任务接管
    if (i < text.length) {
      el.textContent += text.charAt(i);
      i++;
      // 中文按字、英文按词停顿
      setTimeout(type, isCJK(text.charAt(i - 1)) ? speed : 60);
    } else {
      // 打字完成：为 slogan 启用故障抖动（重打时更新 data-text 保证抖动文案与语言一致）
      const hs = el.closest(".hero-slogan");
      if (hs) {
        hs.setAttribute("data-text", text);
        hs.classList.add("glitch");
      }
    }
  }
  setTimeout(type, 400);
}
typeWriter();
// 语言切换后按新语言重新打字（v1.42.5）
document.addEventListener("i18n:changed", typeWriter);

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

  // 知识库：关键词（去空格满配命中）-> 回答。回答内容严格取自个人简介与网站内容，不虚构。
  const KNOWLEDGE = [
    /* ---------- 身份 ---------- */
    {
      keys: ["你是谁", "介绍你", "介绍一下", "你叫什么", "叫什么名字", "名字", "姓名"],
      reply: "你好！我是刘聿宸，18 岁，一名大一新生，就读于天津大学香港理工大学深圳未来技术学院，主攻计算机科学与技术。我的 slogan 是「梦想即力量」——相信怀揣梦想的人，脚下最有力量。想了解哪方面，尽管问我～",
      replyEn: "Hi! I'm Liu Yuchen, 18, a freshman majoring in Computer Science & Technology at the Shenzhen Future Technology Institute of Tianjin University & The Hong Kong Polytechnic University. My slogan is 'Dreams Are Power' — I believe those who carry dreams walk with the most strength. What would you like to know?",
    },
    { keys: ["年龄", "多大", "几岁"],
      reply: "我今年 18 岁，是一名刚刚踏入大学生活的大一新生。",
      replyEn: "I'm 18, a freshman just starting college life."
    },
    {
      keys: ["学校", "大学", "学院", "天院", "港理工", "在哪里读书"],
      reply: "我目前就读于天津大学香港理工大学深圳未来技术学院，主攻计算机科学与技术专业。两所学校的氛围让我对工程与创新充满期待。",
      replyEn: "I'm currently studying Computer Science & Technology at the Shenzhen Future Technology Institute of Tianjin University & The Hong Kong Polytechnic University. The atmosphere of both universities makes me excited about engineering and innovation.",
    },
    { keys: ["专业", "学什么", "专业是什么"],
      reply: "我的专业是计算机科学与技术，现在正处于大一的起点，正在一步步打基础。",
      replyEn: "My major is Computer Science & Technology. I'm at the very beginning of freshman year, building my foundations step by step."
    },
    {
      keys: ["slogan", "格言", "座右铭", "梦想", "口号"],
      reply: "我的 slogan 是「梦想即力量」。我相信，怀揣梦想的人，脚下最有力量——这也是我学习和创作时的信念。",
      replyEn: "My slogan is 'Dreams Are Power'. I believe those who carry dreams walk with the most strength — it's also my belief when studying and creating.",
    },
    {
      keys: ["哪里人", "家乡", "在哪个城市", "坐标", "位置", "深圳"],
      reply: "我目前坐标深圳，主页的状态面板也写着「当前位置：深圳 · 持续迭代中」。欢迎来我的网站逛逛～",
      replyEn: "I'm currently based in Shenzhen — the status panel on the homepage says 'Location: Shenzhen · Constantly Iterating'. Welcome to browse my site!",
    },
    {
      keys: ["i人", "i 人", "内向", "社交", "性格"],
      reply: "我本质是个远离不必要社交的绝对 i 人。不过还是很欢迎你来我的网站逛逛，或者写信给我～",
      replyEn: "I'm an absolute introvert who stays away from all unnecessary socializing. But you're still very welcome to browse my site or write to me!",
    },

    /* ---------- 爱好 ---------- */
    {
      keys: ["爱好", "兴趣", "喜欢", "课余", "平时", "日常"],
      reply: "平时我喜欢打音游（phigros、世界计划 pjsk）、听歌（主要是 J-ROCK 和 J-POP），也会看看番——虽然自认只是小资历。总之是个宅味十足的 i 人。",
      replyEn: "In my spare time I like playing rhythm games (phigros, Project SEKAI), listening to music (mostly J-ROCK and J-POP), and watching anime — though I'm still a junior fan. All in all, a full-fledged otaku introvert.",
    },
    {
      keys: ["音游", "phigros", "pjsk", "世界计划", "sekai", "全连", "arcade", "游戏", "玩什么"],
      reply: "我平时会打 phigros 和 Project SEKAI（世界计划 缤纷舞台）。主页的「音游」板块记录了世界计划 MASTER 全连战绩，比如ベノム、アイディスマイル、はぐ、アスノヨゾラ哨戒班、NEO、命に嫌われている，还有 8.32 的 EXPERT 与 MASTER 难度。",
      replyEn: "I play phigros and Project SEKAI in my spare time. The 'Arcade' section records my Project SEKAI MASTER full-combos, like ベノム, アイディスマイル, はぐ, アスノヨゾラ哨戒班, NEO, 命に嫌われている, plus 8.32 EXPERT and MASTER difficulty.",
    },
    {
      keys: ["音乐", "听歌", "歌单", "j-rock", "j-pop", "网易云", "播放器", "随身听"],
      reply: "我主要听 J-ROCK 和 J-POP。网站右下角有个 🎵 音符按钮，点开是「赛博随身听」网易云播放器，可以边逛网站边听歌～",
      replyEn: "I mostly listen to J-ROCK and J-POP. There's a 🎵 music note button at the bottom right of the site — open it for the 'Cyber Walkman' NetEase player, so you can listen while browsing!",
    },
    {
      keys: ["番", "动漫", "动画", "看番"],
      reply: "我会看番，不过自认只是小资历～欢迎给我推荐好看的。",
      replyEn: "I do watch anime, though I admit I'm just a junior fan — feel free to recommend me something good!",
    },

    /* ---------- 技能 ---------- */
    {
      keys: ["技能", "会什么", "会哪些", "特长", "能力", "水平"],
      reply: "主页技能栏的进度是：前端基础 HTML/CSS/JS 75%、Python 编程 65%、AI 辅助开发（Vibe Coding）50%、Git 版本控制学习中。作为编程与 AI 的初学者，我还在一步步积累。",
      replyEn: "My skill bar progress: Frontend basics HTML/CSS/JS 75%, Python 65%, AI-assisted development (Vibe Coding) 50%, Git version control still learning. As a beginner in programming & AI, I'm still accumulating bit by bit.",
    },
    {
      keys: ["ai", "课程", "vibe", "编码", "在做", "目标"],
      reply: "我正在通过 Vibe Coding 实践，学着把模糊的想法拆解成清晰的需求，再逐步搭建、验证和迭代。这个个人主页就是我的第一个作品，我会用它记录学习、项目与成长。",
      replyEn: "I'm practicing with Vibe Coding — learning to break vague ideas into clear requirements, then build, verify and iterate step by step. This homepage is my first work, and I'll use it to document my learning, projects and growth.",
    },

    /* ---------- 项目 ---------- */
    {
      keys: ["项目", "作品", "做了什么", "mission"],
      reply: "目前在做这个个人主页（MISSION_01，进行中）——纯 HTML/CSS/JS 手写、无框架、无构建步骤，包含自我介绍、技能进度、项目档案与数字孪生问答，全程 Vibe Coding。课程项目（MISSION_02）计划中，「我的下一个想法」（MISSION_03）还在构思。以后完成的课程项目也会记录在这里。",
      replyEn: "Right now I'm working on this homepage (MISSION_01, in progress) — handwritten in plain HTML/CSS/JS, no framework, no build step, with self-intro, skill progress, project archive and a digital twin Q&A, all via Vibe Coding. Course projects (MISSION_02) are planned, and 'My Next Idea' (MISSION_03) is still brewing. Finished course projects will be recorded here too.",
    },

    /* ---------- 联系与反馈 ---------- */
    {
      keys: ["联系", "邮箱", "怎么找你", "联系方式", "写信", "github"],
      reply: "可以通过邮箱联系我：319008328@qq.com；GitHub 账号是 Yunochi0v0。网页右下角还有「聊天泡」反馈按钮，想说的话可以直接留给我～",
      replyEn: "You can reach me by email: 319008328@qq.com; GitHub: Yunochi0v0. There's also a chat bubble feedback button at the bottom right — leave me a message anytime!",
    },
    {
      keys: ["反馈", "建议", "意见", "聊天泡", "留言"],
      reply: "网站右下角有个「聊天泡」图标，点开可以提交反馈，填写昵称、关系、设备和内容。反馈不会公开，只有我能看到，期待你的想法！",
      replyEn: "There's a chat bubble icon at the bottom right — click it to submit feedback: nickname, relationship, device and message. Feedback stays private — only I can see it. Looking forward to your thoughts!",
    },

    /* ---------- 网站与彩蛋 ---------- */
    {
      keys: ["网站", "本站", "这个主页", "怎么做的"],
      reply: "这个个人主页是我的第一个计算机项目，用纯 HTML/CSS/JS 手写、无框架、无构建步骤，靠 Vibe Coding 一点点迭代出来的。主页项目区的「本个人主页」条目上有 LOG 按钮，点开就是完整开发历程。主页当前迭代到 v1.41，诗云页面则独立迭代到 v1.44。",
      replyEn: "This homepage is my first computer project — handwritten in plain HTML/CSS/JS, no framework, no build step, iterated bit by bit with Vibe Coding. There's a LOG button on the 'This Personal Homepage' card in the projects section — open it for the full dev history. The homepage is currently at v1.41, while the Shiyun page is iterated independently at v1.44.",
    },
    {
      keys: ["开发历程", "log", "历史", "版本", "v1", "怎么来的"],
      reply: "主页项目区「本个人主页」条目上有个 LOG 按钮，点开可以看到开发历程弹窗，按三大阶段展示：V1.0 建站期（v1.0~v1.7）、V2.0 光标到发布 GitHub（v1.8~v1.21）、V3.0 发布后的功能迭代（v1.22 至今）——包括访客反馈、音乐播放器、火柴人物理引擎和音游展示区。",
      replyEn: "There's a LOG button on the 'This Personal Homepage' card — it opens the dev history popup in three stages: V1.0 site building (v1.0~v1.7), V2.0 from Cursor to GitHub Pages release (v1.8~v1.21), and V3.0 post-release feature iteration (v1.22 onward) — including visitor feedback, music player, stickman physics engine and the arcade showcase.",
    },
    {
      keys: ["彩蛋", "暗号", "暗语", "隐藏", "关卡", "lycnb", "lyc"],
      reply: "这个网站的彩蛋可多了：键盘依次按下 l-y-c-n-b 会解锁隐藏关卡浮层，输入「梦想即力量」跳转 BanG Dream；输入暗语「诗云」会触发全站传送动画，跳转到深空诗云页；另外 3 分钟无操作会触发待机警报「何意味，你还在吗？」，退出时还会说「不要问何意味，欢迎回来」。",
      replyEn: "This site is full of easter eggs: type l-y-c-n-b to unlock the hidden level overlay, enter '梦想即力量' to jump to BanG Dream; type the code '诗云' to trigger the full-site warp to the deep-space Shiyun page; plus after 3 minutes of inactivity the idle alert '何意味，你还在吗？' appears, and on exit it says '不要问何意味，欢迎回来'.",
    },
    {
      keys: ["诗云", "小诗", "相册", "照片", "拾光", "流水", "夜话", "留影", "深空"],
      reply: "诗云是一个隐藏的深空页面：在主页彩蛋浮层输入「诗云」回车即可传送过去。里面有我写的小诗——古诗板块（卜算子·夕阳故地复巡、采桑子·冬日自叹、沁园春·烟火）和现代诗板块（倚坐舷窗、梦、一个夜）。页面四周还有四个发光粒子，点开分别是四个相册：拾光、流水、夜话、留影，收录我拍的照片。诗云简介写着：「这是我无聊时写的几首小诗，均已上传微信朋友圈=0」。",
      replyEn: "Shiyun is a hidden deep-space page: type '诗云' in the easter egg overlay and press Enter to warp there. It holds my short poems — classical section (卜算子·夕阳故地复巡, 采桑子·冬日自叹, 沁园春·烟火) and modern section (倚坐舷窗, 梦, 一个夜). Around the page are four glowing particles — click them to open four albums: 拾光, 流水, 夜话, 留影, featuring my photos. The Shiyun intro says: 'These are a few poems I wrote when bored, all posted to WeChat Moments =0'.",
    },
    {
      keys: ["火柴人", "吉祥物", "小人", "stickman"],
      reply: "右下角那个荧光黄的赛博火柴人就是网站的吉祥物：可以按住拖动（躯干是弹性绳子物理，甩起来会 Q 弹），轻点它还会随机说话——比如「感觉lyc有点nb」之类的稀有台词。很好玩的！",
      replyEn: "The fluorescent yellow cyber stickman at the bottom right is the site mascot: press and drag it (the torso is a springy rope physics — swing it and it bounces), and tap it for random lines — including rare ones like '感觉lyc有点nb'. Great fun!",
    },
    {
      keys: ["开机", "启动", "动画", "crt", "扫描线", "像素", "光标"],
      reply: "这个站走的是黑黄赛博朋克风：复古 CRT 开机自检动画（约 4.6 秒终端解密）、像素字体与台阶切角、CRT 扫描线与噪点、自定义霓虹光标（带轨迹拖尾和四芒星形态——青色是光标，黄色是按钮点亮色）。",
      replyEn: "This site has a black-yellow cyberpunk style: retro CRT boot self-check animation (about 4.6s of terminal decryption), pixel fonts and chamfered corners, CRT scanlines and noise, custom neon cursor (with trail and four-pointed star forms — cyan for cursor, yellow for button glow).",
    },

    /* ---------- 数字孪生本身 ---------- */
    {
      keys: ["数字孪生", "孪生", "真人", "真人吗", "机器人", "程序"],
      reply: "我是「数字孪生」——一个程序化的刘聿宸：所有回答都来自刘聿宸的个人简介和这个网站的真实内容，用关键词规则匹配，不虚构。现在是 BETA 版，多多包涵～",
      replyEn: "I'm a 'digital twin' — a programmed Liu Yuchen: all my answers come from Liu Yuchen's profile and this site's real content, matched by keyword rules, nothing made up. Currently in BETA, please bear with me!",
    },

    /* ---------- 寒暄 ---------- */
    { keys: ["你好", "嗨", "哈喽", "在吗", "hello", "hi"],
      reply: "你好！我是数字孪生的刘聿宸，想聊点什么？可以问我爱好、技能、网站的彩蛋，也可以问诗云页面的秘密。",
      replyEn: "Hi! I'm Liu Yuchen, the digital twin. What would you like to chat about? Ask me about hobbies, skills, the site's easter eggs, or the secrets of the Shiyun page."
    },
    { keys: ["谢谢", "感谢", "thx"],
      reply: "不客气！很高兴认识你，还有想了解的吗？",
      replyEn: "You're welcome! Nice to meet you — anything else you'd like to know?"
    },
  ];

  const FALLBACK =
    "这个问题我还没想好怎么答（我只能基于我的个人简介和这个网站的内容回答）。你可以问我：你是谁、你的slogan、你在哪个学校、你有什么爱好、你会什么技能，也可以问网站的彩蛋、诗云相册、火柴人或者开发历程。";
  const FALLBACK_EN =
    "I haven't figured out how to answer that yet (I can only answer based on my profile and this site's content). Try asking: who are you, your slogan, which school, your hobbies, what skills — or about the site's easter eggs, the Shiyun albums, the stickman, or the dev history.";

  // 英文提问别名 → 中文关键词（v1.42.5：英文态先把问句映射为中文再走知识库匹配）
  const EN_ALIASES = [
    ["digital twin", "数字孪生"],
    ["who are you", "你是谁"],
    ["what is your name", "名字"],
    ["your name", "名字"],
    ["what is your age", "年龄"],
    ["how old", "年龄"],
    ["which school", "学校"],
    ["what do you study", "专业"],
    ["your major", "专业"],
    ["hobbies", "爱好"],
    ["hobby", "爱好"],
    ["easter egg", "彩蛋"],
    ["easter", "彩蛋"],
    ["hidden level", "隐藏"],
    ["where are you", "哪里人"],
    ["your slogan", "slogan"],
    ["motto", "slogan"],
    ["university", "学校"],
    ["college", "学校"],
    ["major", "专业"],
    ["skills", "技能"],
    ["skill", "技能"],
    ["projects", "项目"],
    ["project", "项目"],
    ["music", "音乐"],
    ["anime", "番"],
    ["email", "邮箱"],
    ["contact", "联系"],
    ["feedback", "反馈"],
    ["shiyun", "诗云"],
    ["poems", "诗云"],
    ["poem", "诗云"],
    ["stickman", "火柴人"],
    ["mascot", "吉祥物"],
    ["history", "开发历程"],
    ["version", "版本"],
    ["arcade", "音游"],
    ["games", "游戏"],
    ["game", "游戏"],
    ["hello", "你好"],
    ["thank", "谢谢"],
  ];

  // 兜底随机回复池（v1.41.1 · 站主定制）：第一次无法回答时用上面的现有文本，
  // 之后再遇到无法回答的问题，从中随机抽取
  const FALLBACK_RANDOM = [
    "何意味",
    "何益胃",
    "喝一胃",
    "盒椅位",
    "妈咪何意味",
    "oh no妈咪何意味",
    "要不要问问神奇的海螺",
    "要不要问问那个黄色小人",
  ];

  let fallbackCount = 0; // 无法回答的问题计数：第 1 次用现有兜底文本，之后随机

  // 命中知识库：取命中数最多的条目；没有则返回兜底（v1.42.5 双语）
  function matchReply(text) {
    const en = typeof window.I18n === "object" && window.I18n.lang === "en";
    // 英文态：把英文问句映射为中文关键词后再匹配（大小写不敏感）
    if (en) {
      for (const pair of EN_ALIASES) {
        if (text.includes(pair[0])) {
          text = text.replace(new RegExp(pair[0], "ig"), pair[1]);
          break;
        }
      }
    }
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
    if (best) return en && best.replyEn ? best.replyEn : best.reply;
    // 无法回答：第一次按现有文本回复，此后从随机池中抽取
    fallbackCount++;
    if (fallbackCount === 1) return en ? FALLBACK_EN : FALLBACK;
    return FALLBACK_RANDOM[(Math.random() * FALLBACK_RANDOM.length) | 0];
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

  // 初始欢迎语（v1.42.5：按当前语言）
  addMsg(
    typeof window.I18n === "object" && window.I18n.lang === "en"
      ? "Hi, I'm Liu Yuchen, the digital twin. I can answer questions about me based on my profile — like school, major, slogan, hobbies and skills. Where shall we start?"
      : "嗨，我是数字孪生的刘聿宸。我可以根据我的个人简介回答你关于我的问题，比如学校、专业、slogan、爱好和技能。想从哪里开始？",
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
  const SHIYUN = "诗云"; // 站内暗语：输入后进入全新页面 shiyun.html
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
      document.dispatchEvent(new CustomEvent("site-egg", { detail: { name: "lycnb" } }));
    }
  });

  /* ---------- 暗号提交 ---------- */
  // 提交时（回车或点击 ✨）触发：去除首尾空格后精确匹配
  eggForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = eggInput.value.trim();

    if (value === SHIYUN) {
      // 新暗语「诗云」：整站化为飞船舷窗全息显示，驶向全新星空页面
      // 过场动画从按下回车键即开始：立即隐藏光标（原生 + 霓虹），
      // 500ms 后才进入 start() 动画主流程，期间由该 class 兜底
      if (eggBox) eggBox.classList.add("triggered");
      setHint("✦ 暗语生效 · 正在驶向诗云…");
      if (window.Achievements) window.Achievements.unlock("shiyun_poet"); // 成就：这诗人吗？
      document.documentElement.classList.add("is-shiyun-warp");
      setTimeout(() => {
        if (window.ShiyunWarp && window.ShiyunWarp.start) {
          window.ShiyunWarp.start(); // 红色警报 → 乱码指数爆炸 → 黑屏 → 舷窗星空 → 跳转
        } else {
          window.location.href = "shiyun.html"; // 降级：动画脚本未加载时直接跳转
        }
      }, 500);
    } else if (value === MAGIC) {
      // 命中暗号：发光提示后跳转
      if (eggBox) eggBox.classList.add("triggered");
      setHint("✦ 咒语生效，梦想即力量 · 正在进入…");
      if (window.Achievements) window.Achievements.unlock("dream_power"); // 成就：梦想无限大！！！！！
      document.dispatchEvent(new CustomEvent("site-egg", { detail: { name: "dream-power" } }));
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
    "DEEPWORKS BIOS v1.42.9",
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

/* ---------- 14. 待机彩蛋（3 分钟无任何操作时自动触发） ---------- */
/* AI-generated: 站点是零依赖的原生 JS（没有 React，也没有构建步骤），
   所以这里用原生写法实现与 React useEffect 完全等价的语义：

     useEffect(() => {
       const timer = setTimeout(trigger, 180000);
       return () => clearTimeout(timer);   // 依赖变化 / 组件卸载时清理
     }, [交互计数]);

   对应关系：
     · armIdleTimer()   ≈ 上面那个 setTimeout（建立定时器）
     · onActivity()     ≈ 依赖变化时的「先 cleanup 再重建」（每次交互重置）
     · 订阅 ACTIVITY_EVENTS ≈ useEffect 的依赖订阅
     · closeIdleEgg() 里重新计时 ≈ cleanup 后再挂载

   效果与需求一致：任何交互都重新计时，满 3 分钟无操作即触发彩蛋。
   相比 React 版还少了一层 state → render → effect 的往返，事件回调里
   直接重置更即时，也不依赖任何框架运行时。 */
(function initIdleEgg() {
  const egg = document.getElementById("idleEgg");
  if (!egg) return;

  const IDLE_MS = 180000; // 3 分钟
  const EXIT = document.getElementById("idleEggExit");
  const scramble = document.getElementById("idleScramble");

  // 视为「用户还在」的交互事件（覆盖鼠标、键盘、滚轮、触摸与聚焦）
  const ACTIVITY_EVENTS = [
    "mousemove",
    "mousedown",
    "pointerdown",
    "wheel",
    "keydown",
    "scroll",
    "touchstart",
    "focus",
  ];

  /* ---------- 满屏乱码噪声层 ---------- */
  const GLYPHS = "!<>-_\\/[]{}=+*^?#0123456789ABCDEF|";
  /* 行列数不再是写死的固定值，而是按视口尺寸算出来的，保证任何屏幕都铺满。
     SCRAMBLE_OVERSCAN：内容高度 = 视口高度 × 该系数。CSS 的滚动动画会
     上移 20% 的元素高度，多出的这一截用来保证滚动过程中底部不露白。 */
  const SCRAMBLE_OVERSCAN = 1.35;
  let scrambleCols = 46;
  let scrambleRows = 40;
  let charW = 12; // 单个字符的横向步进（含字距）
  let charH = 19; // 单行高度
  let scrambleTimer = 0;

  /* 实测单字符宽高：用与 .idle-scramble 相同的字体设置插一个探针量一次，
     不依赖对像素字体尺寸的硬编码猜测（不同设备字体回退宽度会变）。 */
  function measureCell() {
    if (!scramble || typeof document.createElement !== "function") return;
    let probe = null;
    try {
      probe = document.createElement("span");
      probe.textContent = "0000000000"; // 10 个字符，宽度除以 10 即单字符步进
      probe.style.position = "absolute";
      probe.style.top = "0";
      probe.style.left = "0";
      probe.style.visibility = "hidden";
      probe.style.whiteSpace = "pre";
      scramble.appendChild(probe);
      if (typeof probe.getBoundingClientRect !== "function") return;
      const rect = probe.getBoundingClientRect();
      if (rect.width > 0) charW = rect.width / 10;
      if (rect.height > 0) charH = rect.height;
    } catch (err) {
      // 测量失败（或运行在无布局能力的测试环境）时保留已有值
    } finally {
      if (probe && probe.parentNode === scramble) scramble.removeChild(probe);
    }
  }

  /* 按当前视口算出铺满需要多少行、多少列 */
  function layoutScramble() {
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;
    if (!(charW > 2)) charW = 12;
    if (!(charH > 2)) charH = 19;
    scrambleCols = Math.ceil(vw / charW) + 1;
    scrambleRows = Math.ceil((vh * SCRAMBLE_OVERSCAN) / charH) + 1;
  }

  function randomLine() {
    let s = "";
    for (let i = 0; i < scrambleCols; i++) {
      s += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }
    return s;
  }

  // 一次写满整屏，之后每 50ms 整体重写；配合 CSS 的 translateY 动画
  // 形成「字符快速向上滚动」的观感
  function renderScramble() {
    if (!scramble) return;
    const rows = [];
    for (let i = 0; i < scrambleRows; i++) rows.push(randomLine());
    scramble.textContent = rows.join("\n");
  }

  function startScramble() {
    if (!scramble || scrambleTimer) return;
    measureCell();
    layoutScramble();
    renderScramble();
    scrambleTimer = setInterval(renderScramble, 50);
  }

  function stopScramble() {
    if (scrambleTimer) {
      clearInterval(scrambleTimer);
      scrambleTimer = 0;
    }
  }

  // 浮层打开期间窗口尺寸变化：重新测量并铺满
  window.addEventListener(
    "resize",
    function () {
      if (!idleOpen || !scramble) return;
      measureCell();
      layoutScramble();
      renderScramble();
    },
    { passive: true }
  );

  /* ---------- 开启动画：红色待机警报自检 ---------- */
  /* 与隐藏关卡（lycnb）的终端序列同构：逐行打印 → 其中两行尾部乱码滚动
     → JS 逐帧推进的百分比进度条 → 结尾闪烁 + 高亮状态。 */
  const ALERT_LINES = [
    "> IDLE MONITOR ................ 180s",
    "> OPERATOR STATUS ",
    "> NO INPUT DETECTED ........... OK",
    "> WAKING CHANNEL ",
    "> STANDBY ALERT ............... ARMED",
  ];
  const SCRAMBLE_CHARS = "!<>-_\\/[]{}=+*^?#0123456789";
  const SCRAMBLE_INDEXES = [1, 3]; // 这两行在"扫描中"阶段尾部字符随机滚动

  let bootRunning = false;
  let finishBoot = null;

  function playAlertBoot() {
    const boot = document.getElementById("idleBoot");
    const log = document.getElementById("idleBootLog");
    const fill = document.getElementById("idleBootBarFill");
    const status = document.getElementById("idleBootStatus");

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 减弱动态效果，或动画元素缺失：直接显示提醒，保证彩蛋始终可用
    if (reduceMotion || !boot || !log) {
      egg.classList.add("is-ready");
      return;
    }

    // 复位（重复触发时重新播放）
    boot.classList.remove("is-done");
    log.textContent = "";
    if (fill) fill.style.width = "0%";
    if (status) {
      status.textContent = "";
      status.classList.remove("is-awake");
    }
    egg.classList.remove("is-ready");

    const timers = [];
    const printed = [];
    let scrambleTick = 0;
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
      if (scrambleTick) {
        clearInterval(scrambleTick);
        scrambleTick = 0;
      }
      if (barTimer) {
        clearInterval(barTimer);
        barTimer = 0;
      }
      window.removeEventListener("keydown", onBootKey);
      boot.removeEventListener("pointerdown", finish);

      boot.classList.add("is-done");
      egg.classList.add("is-ready");
      if (EXIT) requestAnimationFrame(() => EXIT.focus());
    }

    finishBoot = finish;
    bootRunning = true;
    window.addEventListener("keydown", onBootKey);
    boot.addEventListener("pointerdown", finish);

    // ① 逐行打印自检日志（每行 360ms，节奏比隐藏关卡略急促）
    ALERT_LINES.forEach(function (line, index) {
      at(260 + index * 360, function () {
        printed[index] = line;
        render();
      });
    });

    // ② 两行"扫描中"日志：尾部乱码滚动约 0.55s 后定格
    SCRAMBLE_INDEXES.forEach(function (index) {
      const startAt = 260 + index * 360;
      at(startAt + 60, function () {
        printed[index] = ALERT_LINES[index];
        scrambleTick = setInterval(function () {
          let s = ALERT_LINES[index];
          for (let i = 0; i < 12; i++) {
            s += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          }
          printed[index] = s;
          render();
        }, 70);
      });
      at(startAt + 560, function () {
        clearInterval(scrambleTick);
        scrambleTick = 0;
        printed[index] = ALERT_LINES[index] + "........... OK";
        render();
      });
    });

    // ③ 进度条：JS 逐帧推进并显示百分比
    at(2100, function () {
      let pct = 0;
      barTimer = setInterval(function () {
        pct = Math.min(100, pct + 3 + Math.floor(Math.random() * 4));
        if (fill) fill.style.width = pct + "%";
        if (status) status.textContent = "SCANNING " + ("00" + pct).slice(-3) + "%";
        if (pct >= 100) {
          clearInterval(barTimer);
          barTimer = 0;
        }
      }, 34);
    });

    // ④ 收尾：先停掉进度条，避免百分比把结果覆盖回去
    at(3150, function () {
      if (barTimer) {
        clearInterval(barTimer);
        barTimer = 0;
      }
      if (fill) fill.style.width = "100%";
      if (!status) return;
      status.textContent = "ARE YOU STILL THERE?";
      status.classList.add("is-awake");
    });
    at(3600, finish);
  }

  /* ---------- 退出动画：故障解除（3 秒） ---------- */
  /* 与开启动画同构的终端序列，但方向相反：把警报态逐行解除回正常态。
     3 秒时间轴由 CSS 的 .is-clearing 驱动，这里只负责逐行写日志、
     推进进度条，并在到点后真正收起浮层。 */
  const CLEAR_LINES = [
    "> FAULT DIAGNOSIS ......... CLEARED",
    "> ALERT CHANNEL ........... CLOSED",
    "> SYSTEM STATE ............ NOMINAL",
    "> IDLE MONITOR ............ RESET",
  ];
  const CLEAR_MS = 3000;

  let clearing = false;

  function playClearAnimation(onDone) {
    const layer = document.getElementById("idleClearing");
    const log = document.getElementById("idleClearLog");
    const fill = document.getElementById("idleClearBarFill");
    const status = document.getElementById("idleClearStatus");

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 减弱动态效果 / 元素缺失：不播动画，直接结束（浮层照常可关闭）
    if (reduceMotion || !layer || !log) {
      onDone();
      return;
    }

    clearing = true;

    // 复位：重复触发时从头播放
    log.textContent = "";
    if (fill) fill.style.width = "0%";
    if (status) {
      status.textContent = "";
      status.classList.remove("is-restored");
    }

    // 挂上 .is-clearing，CSS 时间轴开始走
    egg.classList.add("is-clearing");

    const timers = [];
    const printed = [];
    let barTimer = 0;

    function at(ms, fn) {
      timers.push(setTimeout(fn, ms));
    }

    // ① 逐行打印解除日志（每行 260ms，节奏与开启动画呼应）
    CLEAR_LINES.forEach(function (line, index) {
      at(150 + index * 260, function () {
        printed[index] = line;
        log.textContent = printed.join("\n");
      });
    });

    // ② 进度条：0 → 100%，走满即标记系统恢复正常
    at(520, function () {
      let pct = 0;
      barTimer = setInterval(function () {
        pct = Math.min(100, pct + 7 + Math.floor(Math.random() * 8));
        if (fill) fill.style.width = pct + "%";
        if (status) status.textContent = "CLEARING " + ("00" + pct).slice(-3) + "%";
        if (pct >= 100) {
          clearInterval(barTimer);
          barTimer = 0;
          if (status) {
            status.textContent = "RESTORED";
            status.classList.add("is-restored");
          }
        }
      }, 30);
    });

    // ③ 3 秒到点：清掉所有在途定时器，再收起浮层
    at(CLEAR_MS, function () {
      for (let i = 0; i < timers.length; i++) clearTimeout(timers[i]);
      timers.length = 0;
      if (barTimer) {
        clearInterval(barTimer);
        barTimer = 0;
      }
      clearing = false;
      onDone();
    });
  }

  /* ---------- 浮层显隐 ---------- */
  let idleOpen = false;

  function openIdleEgg() {
    if (idleOpen) return;
    idleOpen = true;
    egg.classList.add("revealed");
    egg.setAttribute("aria-hidden", "false");
    startScramble();
    playAlertBoot();
  }

  function closeIdleEgg() {
    if (!idleOpen || clearing) return;
    // 动画未播完就被关闭：先收尾，避免定时器继续跑
    if (bootRunning && finishBoot) finishBoot();
    // 先播「故障解除」退出动画，3 秒结束后再真正收起浮层
    playClearAnimation(hideIdleEgg);
  }

  function hideIdleEgg() {
    if (!idleOpen) return;
    idleOpen = false;
    egg.classList.remove("revealed", "is-ready", "is-clearing");
    egg.setAttribute("aria-hidden", "true");
    stopScramble();
    if (EXIT) EXIT.blur();
    // 关闭后重新挂表：用户如果继续不操作，3 分钟后会再次提醒
    armIdleTimer();
  }

  if (EXIT) EXIT.addEventListener("click", closeIdleEgg);

  // 点击浮层空白区域也可关闭
  egg.addEventListener("click", function (e) {
    if (e.target === egg) closeIdleEgg();
  });

  /* ---------- 待机计时（useEffect 等价语义的核心） ---------- */
  let idleTimer = 0;

  function armIdleTimer() {
    if (idleOpen) return;
    clearTimeout(idleTimer); // 等价于 effect 的 cleanup
    idleTimer = setTimeout(triggerIdle, IDLE_MS);
  }

  function disarmIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = 0;
  }

  function triggerIdle() {
    disarmIdleTimer();
    // 站点开启动画播放中，或隐藏关卡浮层正开着：这次不打扰，重新挂表
    if (document.documentElement.classList.contains("is-booting")) {
      armIdleTimer();
      return;
    }
    const eggBox = document.getElementById("easterEgg");
    if (eggBox && eggBox.classList.contains("revealed")) {
      armIdleTimer();
      return;
    }
    if (idleOpen) return;
    openIdleEgg();
    document.dispatchEvent(new CustomEvent("site-egg", { detail: { name: "idle" } }));
  }

  function onActivity() {
    // 浮层已打开时不再重置，避免用户点「退出」的同一串动作把计时推迟
    if (idleOpen) return;
    armIdleTimer();
  }

  ACTIVITY_EVENTS.forEach(function (name) {
    window.addEventListener(name, onActivity, { passive: true });
  });

  // Esc：动画播放中先跳过动画，动画结束后再按才关闭浮层（与隐藏关卡一致）
  window.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!idleOpen) return;
    if (bootRunning) return; // 交给动画自身的 onBootKey 处理
    closeIdleEgg();
  });

  // 首次挂表
  armIdleTimer();
})();
