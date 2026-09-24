/* ============================================================
 * 多语言切换（v1.42.5 · AI-GEN）
 * ------------------------------------------------------------
 * 功能：
 *   1. 左上角「EN / 中」按钮切换整站语言（中文 ⇄ 英文）；
 *   2. 语言选择持久化到 localStorage（key: personal-homepage-lang），
 *      刷新与重开保持；
 *   3. 翻译方式：元素级标注 + 字典映射。
 *      - data-i18n="原文"        → 替换 textContent（原文即 key，切回中文天然恢复）
 *      - data-i18n-html="原文"   → 替换 innerHTML（仅英文态生效，用于含 <strong> 的富文本段）
 *      - data-i18n-ph="原文"     → 替换 placeholder
 *      - data-i18n-aria="原文"   → 替换 aria-label
 *      - data-i18n-title="原文"  → 替换 title
 *      （zh → en 在 DICT 中查表；英文态无词条的元素保持原文）
 *   4. 动态内容协作：
 *      - 切换时派发 CustomEvent "i18n:changed"（detail.lang），
 *        achievements.js 重渲染成就栏、main.js 重打 typewriter slogan；
 *      - 其他模块读取 window.I18n.lang / I18n.t() 自行处理动态文案。
 *   5. 彩蛋内容（隐藏关卡 / 待机警报 / 终端动画 / 诗云暗语）为站点
 *      彩蛋玩法，刻意保持中文原文，不参与翻译。
 * ============================================================ */
(function () {
  "use strict";

  var STORAGE_KEY = "personal-homepage-lang";

  /* ---------- 1. 翻译字典（中文原文 → 英文） ---------- */
  var DICT = {
    /* 导航 */
    "首页": "Home",
    "关于我": "About",
    "技能": "Skills",
    "项目": "Projects",
    "音游": "Arcade",
    "联系": "Contact",
    "数字孪生": "Twin",

    /* Hero */
    "你好，我是 ": "Hi, I'm ",
    " · 18 岁": " · 18 y/o",
    "梦想即力量": "Dreams Are Power",
    "大一新生 · 编程与人工智能初学者 · 正在用 AI 辅助开发记录我的成长":
      "Freshman · Beginner in programming & AI · Documenting my growth with AI-assisted development",
    "联系我": "Contact Me",
    "了解我": "About Me",
    "当前位置": "Location",
    "深圳": "Shenzhen",
    "状态": "Status",
    "持续迭代中": "Constantly Iterating",

    /* About */
    "一点关于我的介绍": "A little about me",
    "我是刘聿宸，18 岁，目前就读于天津大学香港理工大学深圳未来技术学院，学习计算机科学与技术专业。":
      "I'm Liu Yuchen, 18, currently studying Computer Science & Technology at the Shenzhen Future Technology Institute of Tianjin University & The Hong Kong Polytechnic University.",
    "关于本站：这里是我利用 vibe coding 制作的第一个计算机项目，包含了我的一些基本信息、项目和小巧思，今后也会持续迭代。如果你对本站有什么意见和看法，欢迎点击网站右下角的「聊天泡」图标给我发送你的反馈。当然啦，你也可以打开右下角的「音符」图标，听听音乐，亦或者是玩玩本网站的吉祥物（我认为挺好玩的）。总之希望你能在我的网站里玩得开心。=）":
      "About this site: this is my first computer project built with vibe coding — it holds my basic info, projects and little ideas, and I'll keep iterating on it. If you have any feedback, hit the chat bubble at the bottom right corner. You can also open the music note icon to listen to music, or play with the site's mascot (I think it's pretty fun). Anyway, hope you enjoy your stay. =)",
    "关于我：实际上没什么可介绍的，本质是远离所有不必要社交的绝对 i 人。平时会打打音游（phigros、pjsk），听听歌（主要是 J-ROCK 和 J-POP），看看番（我是小资历……）。不过，我还是欢迎你来通过我的邮箱来联系我的👍":
      "About me: honestly there's not much to say — an absolute introvert who stays away from all unnecessary socializing. I play rhythm games (phigros, pjsk), listen to music (mostly J-ROCK and J-POP) and watch anime (still a junior fan…). But you're always welcome to reach me via email 👍",

    /* Skills */
    "我掌握与正在学习的内容": "What I know & what I'm learning",
    "前端基础 HTML / CSS / JS": "Frontend Basics · HTML / CSS / JS",
    "Python 编程": "Python Programming",
    "AI 辅助开发（Vibe Coding）": "AI-assisted Development (Vibe Coding)",
    "Git 版本控制": "Git Version Control",
    "学习中": "Learning",

    /* Projects */
    "正在完成与计划中的作品 · 悬停查看任务简报": "Completed & planned works · Hover for briefs",
    "本个人主页": "This Personal Homepage",
    "进行中": "In Progress",
    "查看本个人主页的开发历程": "View dev history of this homepage",
    "用于记录学习与成长的个人主页 MVP。纯 HTML / CSS / JavaScript 手写，无框架、无构建步骤；包含自我介绍、技能进度、项目档案与数字孪生问答。":
      "MVP personal homepage for documenting learning & growth. Handwritten in plain HTML / CSS / JavaScript — no framework, no build step; includes self-intro, skill progress, project archive and a digital twin Q&A.",
    "技术栈": "Stack",
    "方式": "Method",
    "成长史": "History",
    "点击 LOG 查看开发历程": "Click LOG for dev history",
    "课程项目": "Course Projects",
    "待填充": "TBD",
    "课程里的真实项目，会在这里记录目标、过程与收获。目前尚未开工，欢迎回来查看更新。":
      "Real projects from my courses — I'll record goals, process and takeaways here. Nothing started yet, come back for updates.",
    "待定": "TBD",
    "计划中": "Planned",
    "我的下一个想法": "My Next Idea",
    "正在酝酿中的小点子，等它成型后我会写下完整的设计与实现。如果你有想看我做的东西，也欢迎写信告诉我。":
      "Small ideas still brewing — once one takes shape I'll write up the full design & implementation. If there's something you'd like to see me build, feel free to write to me.",
    "构思中": "Drafting",

    /* Arcade */
    "世界计划 缤纷舞台 · MASTER 全连记录": "Project SEKAI · MASTER full-combo records",

    /* Contact */
    "欢迎交流，期待认识你": "Let's connect — nice to meet you",
    "邮箱": "Email",

    /* Achievements */
    "探索本站，解锁成就 · 已解锁": "Explore to unlock achievements · Unlocked",
    "解锁于 ": "Unlocked at ",
    "尚未解锁": "Not yet unlocked",
    "未解锁": "Locked",
    "成就解锁 · ACHIEVEMENT UNLOCKED": "ACHIEVEMENT UNLOCKED",

    /* Digital Twin */
    "虚拟的我 · 基于个人简介与你对话，认识一个「程序化的刘聿宸」":
      "A virtual me · Chat based on my profile, meet a 'programmed Liu Yuchen'",
    "在线 · 数字孪生": "Online · Digital Twin",
    "你是谁？": "Who are you?",
    "你的 slogan 是什么？": "What's your slogan?",
    "你在哪个学校？": "Which school?",
    "你有什么爱好？": "What are your hobbies?",
    "向我提问，比如：你会什么技能？": "Ask me anything, e.g. 'What skills?'",
    "发送": "Send",
    "向下滚动": "Scroll down",
    "返回顶部": "Back to top",
    "打开音乐播放器": "Open music player",

    /* Footer */
    "刘聿宸 · 梦想即力量": "Liu Yuchen · Dreams Are Power",
    "了解更多": "Learn More",

    /* 音乐播放器 */
    "🎧 赛博随身听": "🎧 Cyber Walkman",
    "关闭播放器": "Close player",

    /* 反馈弹窗 */
    "留个反馈": "Leave Feedback",
    "关闭": "Close",
    "反馈不会公开，只有我能看到。": "Your feedback stays private — only I can see it.",
    "昵称（可选）": "Nickname (optional)",
    "怎么称呼你？": "What should I call you?",
    "关系": "Relationship",
    "请选择": "Select",
    "同学": "Classmate",
    "老师": "Teacher",
    "家人": "Family",
    "朋友": "Friend",
    "同事": "Colleague",
    "其他": "Other",
    "不便透露": "Prefer not to say",
    "设备": "Device",
    "电脑": "Computer",
    "手机": "Phone",
    "平板": "Tablet",
    "反馈内容 *": "Message *",
    "想对我说点什么？": "What would you like to tell me?",
    "提交反馈": "Submit",
    "已收到，谢谢你的反馈！": "Got it — thanks for your feedback!",
    "知道了": "OK",

    /* 反馈墙（v1.43.0） */
    "公开展示到反馈墙（可被点赞和评论）": "Share on the feedback wall (likeable & commentable)",
    "反馈墙": "Feedback Wall",
    "反馈墙 · 大家的声音": "Feedback Wall · Voices of Visitors",
    "主人管理": "Owner Mode",
    "主人邮箱": "Owner Email",
    "密码": "Password",
    "登录": "Sign in",
    "退出登录": "Sign out",
    "还没有公开的反馈，来留一条吧？": "No public feedback yet — leave one?",

    /* 开发历程弹窗 */
    "// DEV HISTORY · 本个人主页开发历程": "// DEV HISTORY · Personal Homepage"
  };

  /* ---------- 2. 状态 ---------- */
  var lang = "zh";
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "zh") lang = saved;
  } catch (e) { /* 忽略 */ }

  /* ---------- 3. 应用语言 ---------- */
  function apply() {
    var en = lang === "en";
    document.documentElement.setAttribute("lang", en ? "en" : "zh-CN");

    var all = document.querySelectorAll(
      "[data-i18n],[data-i18n-ph],[data-i18n-aria],[data-i18n-title],[data-i18n-html]"
    );
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var text = el.getAttribute("data-i18n");
      var html = el.getAttribute("data-i18n-html");
      var ph = el.getAttribute("data-i18n-ph");
      var aria = el.getAttribute("data-i18n-aria");
      var title = el.getAttribute("data-i18n-title");

      if (text) {
        var tr = DICT[text];
        if (tr) el.textContent = en ? tr : text; // 切回中文时恢复原文
      }
      // 富文本段仅在英文态替换（切回中文保留原始 HTML）
      if (html && en) {
        var trh = DICT[html];
        if (trh) el.innerHTML = trh;
      }
      if (ph) {
        var trp = DICT[ph];
        if (trp) el.setAttribute("placeholder", en ? trp : ph);
      }
      if (aria) {
        var tra = DICT[aria];
        if (tra) el.setAttribute("aria-label", en ? tra : aria);
      }
      if (title) {
        var trt = DICT[title];
        if (trt) el.setAttribute("title", en ? trt : title);
      }
    }

    // 切换按钮自身文案
    var sw = document.getElementById("langSwitch");
    if (sw) sw.textContent = en ? "中" : "EN";

    // 页面标题与 meta 描述（v1.42.5：随语言切换）
    document.title = en ? "Liu Yuchen · Personal Homepage" : "刘聿宸 · 个人主页";
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", en
        ? "Liu Yuchen's personal homepage - Dreams Are Power"
        : "刘聿宸的个人主页 - 梦想即力量");
    }

    // 通知各模块（成就重渲染 / typewriter 重打等）
    document.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang: lang } }));
  }

  /* ---------- 4. API ---------- */
  window.I18n = {
    get lang() { return lang; }, // 实时读取，setLang 后各处判断立即可用
    t: function (zhText) {
      return lang === "en" && DICT[zhText] ? DICT[zhText] : zhText;
    },
    apply: apply,
    setLang: function (l) {
      if (l !== "zh" && l !== "en") return;
      lang = l;
      try { localStorage.setItem(STORAGE_KEY, l); } catch (e) { /* 忽略 */ }
      apply();
    },
    toggle: function () { this.setLang(lang === "zh" ? "en" : "zh"); }
  };

  /* ---------- 5. 初始化 ---------- */
  function init() {
    var sw = document.getElementById("langSwitch");
    if (sw) {
      sw.addEventListener("click", function () { window.I18n.toggle(); });
    }
    apply();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
