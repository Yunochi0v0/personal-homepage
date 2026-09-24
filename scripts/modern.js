/* ============================================================
 * 现代版主页脚本（v1.45.1 · AI-GEN）
 * ------------------------------------------------------------
 * 功能：
 *   1. data-lang 双语切换（现代版独立实现，与赛博版 i18n.js 平行）：
 *      - data-lang       → 替换 textContent
 *      - data-lang-ph    → 替换 placeholder
 *      - data-lang-aria  → 替换 aria-label
 *      - data-lang-html  → 替换 innerHTML（英文态富文本）
 *      （zh → en 查 MODERN_DICT；英文态无词条保持原文）
 *   2. 语言持久化：读写 localStorage key「preferredLang」（v1.45.0 新标准），
 *      同时双写旧键 personal-homepage-lang 与赛博版 index.html 共享；
 *      读取时前者优先，回退旧键 → 两页互跳时语言自动同步。
 *   3. 互动板块：音游列表 / 数字孪生问答 / 网易云播放 / 反馈提交 /
 *      反馈墙读取。
 *   4. v1.45.1 新增（宝藏之地风格）：
 *      - 导航栏滚动高亮（IntersectionObserver）
 *      - 搜索条过滤（标题/描述/标签，支持中英文）
 *      - 底部状态条实时时钟 + 本站运行时长
 *      - 日间模式主题切换（localStorage 持久化）
 *      - 返回顶部悬浮按钮
 * ============================================================ */
(function () {
  "use strict";

  /* ---------- 1. 语言偏好（与 index.html 共享） ---------- */
  var PREFERRED_KEY = "preferredLang";         // v1.45.0 新键（两页共享）
  var LEGACY_KEY = "personal-homepage-lang";   // 旧键（兼容读取/写入）

  var lang = "zh";
  try {
    var saved = localStorage.getItem(PREFERRED_KEY) || localStorage.getItem(LEGACY_KEY);
    if (saved === "en" || saved === "zh") lang = saved;
  } catch (e) { /* 忽略 */ }

  /* ---------- 2. 翻译字典（中文原文 → 英文） ----------
   * 与 scripts/i18n.js 词条对齐；新增 modern 专属词条（返回赛博版等）。 */
  var DICT = {
    /* 导航 */
    "返回赛博版": "Back to Cyberpunk UI",
    "切换现代模式": "Switch to Modern UI",
    "刘聿宸": "Liu Yuchen",
    "宝藏之地": "Treasure Land",
    "首页": "Home",
    "关于": "About",
    "项目": "Projects",
    "音游": "Arcade",
    "音乐": "Music",
    "反馈墙": "Wall",
    "联系": "Contact",

    /* 搜索 */
    "搜寻标题、描述或标签…": "Search title, description or tags…",

    /* 个人资料卡 */
    "大一新生 · 编程与人工智能初学者 · 用 AI 辅助开发记录我的成长":
      "Freshman · Beginner in programming & AI · Documenting my growth with AI-assisted development",
    "音游全连": "FC Records",
    "当前位于 深圳 · 持续迭代中": "Currently in Shenzhen · Constantly iterating",

    /* 音乐播放器卡 */
    "🎧 现代随身听": "🎧 Modern Walkman",
    "J-ROCK & J-POP · 点击播放（网易云外链）": "J-ROCK & J-POP · Click to play (NetEase Cloud embed)",
    "播放 / 切换": "Play / Switch",

    /* 歌词横幅 */
    "♪ 梦想即力量 · Dreams Are Power": "♪ Dreams Are Power · 梦想即力量",

    /* 内容网格 */
    "最新动态": "LATEST INSIGHT",
    "v1.45.1 宝藏之地风格上线": "v1.45.1 Treasure-Land UI is Live",
    "紫色毛玻璃 + 顶部导航 + 播放器卡 + 歌词横幅 + 日间模式，双页面中英同步":
      "Purple glassmorphism + top nav + player card + lyric banner + day mode, bilingual across both pages",
    "开发历程": "RECORDS",
    "归档：版本记录": "Archive: Version Log",
    "宝藏之地风格重构": "Treasure-Land UI redesign",
    "现代版主页上线": "Modern homepage launched",
    "迭代记录时间重排": "Changelog reordered by time",
    "项目板块写入迭代历史": "Project section got its iteration history",
    "日间模式": "Day Mode",
    "点击切换明暗主题": "Click to switch light/dark theme",
    "切换日间模式 / 夜间模式": "Toggle day / night mode",

    /* Hero */
    "// MODERN EDITION · 现代版主页": "// MODERN EDITION",
    "你好，我是 ": "Hi, I'm ",
    " · 18 岁": " · 18 y/o",
    "梦想即力量": "Dreams Are Power",
    "大一新生 · 编程与人工智能初学者 · 正在用 AI 辅助开发记录我的成长":
      "Freshman · Beginner in programming & AI · Documenting my growth with AI-assisted development",
    "联系我": "Contact Me",
    "了解我": "About Me",

    /* About */
    "个人简介": "About",
    "一点关于我的介绍": "A little about me",
    "我是刘聿宸，18 岁，目前就读于天津大学香港理工大学深圳未来技术学院，学习计算机科学与技术专业。":
      "I'm Liu Yuchen, 18, studying Computer Science & Technology at the Shenzhen Future Technology Institute of Tianjin University & The Hong Kong Polytechnic University.",
    "关于本站：这是利用 vibe coding 制作的第一个计算机项目，包含基本信息、项目与小巧思，今后也会持续迭代。":
      "About this site: my first computer project built with vibe coding — it holds my basic info, projects and little ideas, and I'll keep iterating on it.",
    "关于我：本质是远离所有不必要社交的绝对 i 人，平时打打音游（phigros、pjsk），听听歌（J-ROCK 和 J-POP），看看番。欢迎通过邮箱联系我。":
      "About me: an absolute introvert who stays away from unnecessary socializing. I play rhythm games (phigros, pjsk), listen to music (J-ROCK & J-POP) and watch anime. Feel free to reach me via email.",

    /* Skills */
    "技能": "Skills",
    "我掌握与正在学习的内容": "What I know & what I'm learning",
    "前端基础 HTML / CSS / JS": "Frontend Basics · HTML / CSS / JS",
    "Python 编程": "Python Programming",
    "AI 辅助开发（Vibe Coding）": "AI-assisted Development (Vibe Coding)",
    "Git 版本控制": "Git Version Control",
    "学习中": "Learning",

    /* Projects */
    "项目": "Projects",
    "正在完成与计划中的作品": "Completed & planned works",
    "本个人主页": "This Personal Homepage",
    "记录学习与成长的个人主页 MVP。纯 HTML / CSS / JavaScript 手写，持续加入反馈墙、音游展示区、开发历程 LOG 与移动端适配。":
      "MVP personal homepage for documenting learning & growth. Handwritten in plain HTML / CSS / JavaScript, with a feedback wall, a rhythm-game showcase, a dev-history LOG and mobile adaptation.",
    "进行中": "In Progress",
    "课程项目": "Course Projects",
    "课程里的真实项目，会在这里记录目标、过程与收获。目前尚未开工。":
      "Real projects from my courses — I'll record goals, process and takeaways here. Nothing started yet.",
    "待填充": "TBD",
    "我的下一个想法": "My Next Idea",
    "正在酝酿中的小点子，等它成型后我会写下完整的设计与实现。":
      "Small ideas still brewing — once one takes shape I'll write up the full design & implementation.",

    /* Arcade */
    "音游": "Arcade",
    "世界计划 缤纷舞台 · MASTER 全连记录": "Project SEKAI · MASTER full-combo records",

    /* Contact */
    "欢迎交流，期待认识你": "Let's connect — nice to meet you",
    "邮箱": "Email",

    /* Twin */
    "数字孪生": "Digital Twin",
    "虚拟的我 · 基于个人简介与你对话": "A virtual me · Chat based on my profile",
    "在线 · 数字孪生": "Online · Digital Twin",
    "你是谁？": "Who are you?",
    "你的 slogan 是什么？": "What's your slogan?",
    "你在哪个学校？": "Which school?",
    "你有什么爱好？": "What are your hobbies?",
    "向我提问，比如：你会什么技能？": "Ask me anything, e.g. 'What skills?'",
    "发送": "Send",

    /* Music */
    "音乐播放器": "Music Player",
    "点击播放一首歌（网易云外链）": "Click to play a track (NetEase Cloud embed)",
    "🎧 现代随身听": "🎧 Modern Walkman",
    "播放 / 切换": "Play / Switch",

    /* Feedback */
    "留个反馈": "Leave Feedback",
    "反馈不会公开，只有我能看到。": "Your feedback stays private — only I can see it.",
    "昵称（可选）": "Nickname (optional)",
    "怎么称呼你？": "What should I call you?",
    "关系": "Relationship",
    "请选择": "Select",
    "同学": "Classmate",
    "老师": "Teacher",
    "家人": "Family",
    "朋友": "Friend",
    "其他": "Other",
    "设备": "Device",
    "电脑": "Computer",
    "手机": "Phone",
    "平板": "Tablet",
    "反馈内容 *": "Message *",
    "想对我说点什么？": "What would you like to tell me?",
    "提交反馈": "Submit",
    "公开展示到反馈墙（可被点赞和评论）": "Share on the feedback wall (likeable & commentable)",
    "已收到，谢谢你的反馈！": "Got it — thanks for your feedback!",

    /* Wall */
    "反馈墙 · 大家的声音": "Feedback Wall · Voices of Visitors",
    "公开发布的访客反馈（只读版）": "Public visitor feedback (read-only)",
    "还没有公开的反馈，来留一条吧？": "No public feedback yet — leave one?",

    /* Footer */
    "系统已稳定运行 ": "System stable for ",
    "梦想即力量": "Dreams Are Power",
    "回到顶部": "Back to top",
    "切换背景": "Switch Background",
    "沉浸模式": "Immersive Mode",
    "查看开发日志": "View Dev Log",
    "开发历程 · 宝藏之地": "Dev History · Treasure Land",
    "本个人主页的开发版本记录 · 与主页面同步": "Version records of this site, synced with the main page",
    "关闭": "Close"
  };

  /* ---------- 3. data-lang 应用 ---------- */
  function isEn() { return lang === "en"; }

  function apply() {
    document.documentElement.setAttribute("lang", isEn() ? "en" : "zh-CN");

    var all = document.querySelectorAll(
      "[data-lang],[data-lang-ph],[data-lang-aria],[data-lang-html]"
    );
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var text = el.getAttribute("data-lang");
      var html = el.getAttribute("data-lang-html");
      var ph = el.getAttribute("data-lang-ph");
      var aria = el.getAttribute("data-lang-aria");

      if (text) {
        var tr = DICT[text];
        if (tr) el.textContent = isEn() ? tr : text;
      }
      if (html && isEn()) {
        var trh = DICT[html];
        if (trh) el.innerHTML = trh;
      }
      if (ph) {
        var trp = DICT[ph];
        if (trp) el.setAttribute("placeholder", isEn() ? trp : ph);
      }
      if (aria) {
        var tra = DICT[aria];
        if (tra) el.setAttribute("aria-label", isEn() ? tra : aria);
      }
    }

    var sw = document.getElementById("mLangSwitch");
    if (sw) sw.textContent = isEn() ? "中" : "EN";

    document.title = isEn() ? "Treasure Land · Liu Yuchen" : "宝藏之地 · 刘聿宸";
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", isEn()
        ? "Liu Yuchen's personal homepage - Modern Edition (Treasure-Land style)"
        : "刘聿宸的个人主页 - 现代版（宝藏之地风格）");
    }

    // 通知动态渲染模块（按语言刷新）
    document.dispatchEvent(new CustomEvent("modern:i18n", { detail: { lang: lang } }));
  }

  function saveLang(l) {
    try {
      localStorage.setItem(PREFERRED_KEY, l); // 新键：两页共享
      localStorage.setItem(LEGACY_KEY, l);    // 旧键兼容
    } catch (e) { /* 忽略 */ }
  }

  function setLang(l) {
    if (l !== "zh" && l !== "en") return;
    lang = l;
    saveLang(l);
    apply();
  }

  window.ModernI18n = {
    get lang() { return lang; },
    t: function (zh) { return isEn() && DICT[zh] ? DICT[zh] : zh; },
    apply: apply,
    setLang: setLang,
    toggle: function () { setLang(lang === "zh" ? "en" : "zh"); }
  };

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- 4. 返回赛博版 ---------- */
  function bindTopbar() {
    var back = $("mBackToCyber");
    if (back) back.addEventListener("click", function () {
      window.location.href = "index.html";
    });
    var sw = $("mLangSwitch");
    if (sw) sw.addEventListener("click", function () { window.ModernI18n.toggle(); });
  }

  /* ---------- 5. 音游列表（arcade.json 优先，兜底内联数据） ---------- */
  var ARCADES = [
    { title: "ベノム (Venom)", en: "Venom", lv: "MASTER" },
    { title: "アイディスマイル (Id Smile)", en: "Id Smile", lv: "MASTER" },
    { title: "はぐ (Hagu)", en: "Hagu", lv: "MASTER" },
    { title: "アスノヨゾラ哨戒班", en: "Asu no Yozora Shoukaihan", lv: "MASTER" },
    { title: "NEO", en: "NEO", lv: "MASTER" },
    { title: "命に嫌われている", en: "Inochi ni Kirawareteiru", lv: "MASTER" },
    { title: "8.32 (EXPERT Lv.24)", en: "8.32 (EXPERT Lv.24)", lv: "EXPERT" },
    { title: "8.32 (MASTER Lv.28)", en: "8.32 (MASTER Lv.28)", lv: "MASTER" }
  ];

  function renderArcade() {
    var list = $("mArcadeList");
    if (!list) return;
    var html = "";
    for (var i = 0; i < ARCADES.length; i++) {
      var a = ARCADES[i];
      html +=
        '<li class="m-arcade-item"><em>' + esc(a.lv) + "</em>" +
        esc(isEn() ? a.en : a.title) + "</li>";
    }
    list.innerHTML = html;
  }

  /* ---------- 6. 数字孪生（本地关键词问答） ---------- */
  var TWIN_KB = [
    { keys: ["谁", "who"], zh: "我是刘聿宸，18 岁，目前就读于天津大学香港理工大学深圳未来技术学院，学习计算机科学与技术专业。", en: "I'm Liu Yuchen, 18, studying Computer Science & Technology at the Shenzhen Future Technology Institute of Tianjin University & HK PolyU." },
    { keys: ["slogan", "口号", "梦想"], zh: "我的 slogan 是「梦想即力量」— Dreams Are Power。", en: "My slogan is 「梦想即力量」— Dreams Are Power." },
    { keys: ["学校", "大学", "school"], zh: "我在天津大学香港理工大学深圳未来技术学院（Shenzhen Future Technology Institute）。", en: "I study at the Shenzhen Future Technology Institute of Tianjin University & The Hong Kong Polytechnic University." },
    { keys: ["爱好", "兴趣", "hobby", "音游", "歌", "番"], zh: "平时打打音游（phigros、pjsk），听 J-ROCK 和 J-POP，也看看番。", en: "I play rhythm games (phigros, pjsk), listen to J-ROCK & J-POP, and watch anime." },
    { keys: ["技能", "skill", "会什么"], zh: "我目前掌握：前端基础 HTML / CSS / JS、Python 编程、AI 辅助开发（Vibe Coding）、Git 版本控制。", en: "I know: frontend basics (HTML / CSS / JS), Python, AI-assisted development (Vibe Coding), and Git." },
    { keys: ["你好", "hi", "hello", "嗨"], zh: "你好呀！欢迎来到我的现代版主页。", en: "Hi there! Welcome to my Modern Edition homepage." }
  ];

  function twinReply(q) {
    var text = String(q || "").toLowerCase();
    for (var i = 0; i < TWIN_KB.length; i++) {
      var row = TWIN_KB[i];
      for (var k = 0; k < row.keys.length; k++) {
        if (text.indexOf(row.keys[k].toLowerCase()) !== -1) {
          return isEn() ? row.en : row.zh;
        }
      }
    }
    return isEn()
      ? "I'm still a simple AI twin — ask me about my school, hobbies, slogan or skills!"
      : "我还是个简单的数字孪生——可以问我关于学校、爱好、slogan 或技能的问题哦！";
  }

  function twinPush(text, me) {
    var body = $("mTwinBody");
    if (!body) return;
    var div = document.createElement("div");
    div.className = "m-msg" + (me ? " me" : "");
    var span = document.createElement("span");
    span.textContent = text;
    div.appendChild(span);
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  function bindTwin() {
    var body = $("mTwinBody");
    if (!body) return;
    twinPush(isEn() ? "Hi! I'm the digital twin of Liu Yuchen. Ask me anything!" : "你好！我是刘聿宸的数字孪生，有什么想问我的吗？", false);

    var suggests = $("mTwinSuggests");
    if (suggests) {
      suggests.addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-q]");
        if (!btn) return;
        var q = btn.getAttribute("data-q");
        twinPush(btn.textContent, true);
        twinPush(twinReply(q), false);
      });
    }
    var form = $("mTwinForm");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = $("mTwinInput");
        var q = input.value.trim();
        if (!q) return;
        twinPush(q, true);
        twinPush(twinReply(q), false);
        input.value = "";
      });
    }
  }

  /* ---------- 7. 音乐播放器（网易云外链懒加载） ---------- */
  var musicInjected = false;
  function bindMusic() {
    var btn = $("mMusicBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var wrap = $("mMusicPlayer");
      if (!wrap) return;
      if (!musicInjected) {
        var frame = document.createElement("iframe");
        frame.src = "https://music.163.com/outchain/player?type=2&id=1935705479&auto=0&height=66";
        frame.title = "网易云音乐单曲播放器";
        frame.setAttribute("allow", "autoplay; encrypted-media; clipboard-write");
        frame.style.height = "66px";
        wrap.appendChild(frame);
        musicInjected = true;
      } else {
        var old = wrap.querySelector("iframe");
        if (old) {
          var src = old.src;
          old.remove();
          var frame2 = document.createElement("iframe");
          frame2.src = src;
          frame2.title = "网易云音乐单曲播放器";
          frame2.setAttribute("allow", "autoplay; encrypted-media; clipboard-write");
          frame2.style.height = "66px";
          wrap.appendChild(frame2);
        }
      }
    });
  }

  /* ---------- 8. 反馈提交（Supabase，与赛博版同表同配置） ---------- */
  var SUPABASE_URL = "https://tepsjylpqzdpygknlyij.supabase.co";
  var PUBLISHABLE_KEY = "sb_publishable_o8BDMXzQ8-hkXdPzjga4nw_mYaYIofQ"; // 公开前端配置
  var version = "0.0.0";
  if (document.body && document.body.dataset && document.body.dataset.version) {
    version = document.body.dataset.version;
  }

  var sbClient = null;
  function getSb() {
    if (sbClient) return sbClient;
    if (typeof window.supabase === "undefined" || !window.supabase.createClient) return null;
    sbClient = window.supabase.createClient(SUPABASE_URL, PUBLISHABLE_KEY);
    return sbClient;
  }

  function bindFeedback() {
    var form = $("mFeedbackForm");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nameEl = $("mFbName"), relEl = $("mFbRelation"), devEl = $("mFbDevice"),
          msgEl = $("mFbMessage"), listEl = $("mFbList"),
          errEl = $("mFbError"), submitBtn = $("mFbSubmit"),
          successEl = $("mFbSuccess");
      var message = msgEl.value.trim();
      if (!message) {
        if (errEl) { errEl.hidden = false; errEl.textContent = isEn() ? "Please fill in the message." : "请填写反馈内容"; }
        return;
      }
      if (errEl) errEl.hidden = true;
      var sb = getSb();
      if (!sb) {
        if (errEl) { errEl.hidden = false; errEl.textContent = isEn() ? "Backend unavailable, try again later." : "后台服务暂时不可用，请稍后重试"; }
        return;
      }
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "..."; }
      sb.from("feedback")
        .insert({
          name: nameEl.value.trim() || null,
          relation: relEl.value,
          device: devEl.value,
          message: message,
          version: version,
          listed: !!(listEl && listEl.checked)
        })
        .then(function (res) {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = isEn() ? "Submit" : "提交反馈"; }
          if (res && res.error) {
            if (errEl) { errEl.hidden = false; errEl.textContent = (res.error.message || "").slice(0, 80); }
            return;
          }
          form.hidden = true;
          if (successEl) successEl.hidden = false;
        })
        .catch(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = isEn() ? "Submit" : "提交反馈"; }
          if (errEl) { errEl.hidden = false; errEl.textContent = isEn() ? "Network error, submission failed." : "网络异常，提交未完成（内容已保留）"; }
        });
    });
  }

  /* ---------- 9. 反馈墙（只读：listed=true 的公开反馈） ---------- */
  function fmtTime(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function loadWall() {
    var list = $("mWallList");
    if (!list) return;
    var empty = list.querySelector(".m-wall-empty");
    if (empty) empty.style.display = "block";
    var sb = getSb();
    if (!sb) return;
    sb.from("feedback")
      .select("id,name,message,created_at")
      .eq("listed", true)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(function (res) {
        if (res && res.error) return;
        var rows = (res && res.data) || [];
        if (empty) empty.style.display = rows.length ? "none" : "block";
        var html = "";
        for (var i = 0; i < rows.length; i++) {
          var r = rows[i];
          html +=
            '<div class="m-wall-card">' +
              '<div class="m-wall-card-meta"><span>' + esc(r.name || (isEn() ? "Anonymous" : "匿名")) + "</span>" +
              "<span>" + esc(fmtTime(r.created_at)) + "</span></div>" +
              "<p style=\"margin:0\">" + esc(r.message) + "</p>" +
            "</div>";
        }
        list.innerHTML = html || list.innerHTML;
      });
  }

  /* ---------- 11. v1.45.1 新增：导航高亮 / 搜索 / 时钟 / 运行时长 / 主题 / 返回顶部 ---------- */

  /* 11.1 导航滚动高亮 */
  function bindNavHighlight() {
    var links = document.querySelectorAll("#mNavLinks a");
    if (!links.length) return;
    var sections = [];
    links.forEach(function (a) {
      var id = (a.getAttribute("href") || "").replace("#", "");
      var sec = id ? document.getElementById(id) : null;
      if (sec) sections.push({ link: a, sec: sec });
    });
    var onScroll = function () {
      var pos = window.scrollY + 130;
      var currentId = "";
      var bestTop = -1;
      for (var i = 0; i < sections.length; i++) {
        var top = sections[i].sec.offsetTop;
        if (top <= pos && top >= bestTop) {
          bestTop = top;
          currentId = sections[i].sec.id;
        }
      }
      // 未命中任何板块（如页首 hero 尚未滚过阈值）→ 默认高亮第一项
      if (!currentId && sections.length) currentId = sections[0].sec.id;
      // 页面底部时高亮最后一个
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 40 && sections.length) {
        currentId = sections[sections.length - 1].sec.id;
      }
      links.forEach(function (a) {
        a.classList.toggle("is-active", (a.getAttribute("href") || "") === "#" + currentId);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* 11.2 搜索过滤（标题 / 描述 / 标签，支持中英文） */
  function bindSearch() {
    var input = $("mSearch");
    if (!input) return;
    input.addEventListener("input", function () {
      var q = (input.value || "").trim().toLowerCase();
      // 可搜索卡片：项目 / 音游 / 反馈墙 / 板块标题
      var targets = document.querySelectorAll(
        ".m-project, .m-arcade-item, .m-wall-card, .m-block, .m-twin-card, .m-records, .m-theme-card"
      );
      for (var i = 0; i < targets.length; i++) {
        var el = targets[i];
        if (!q) { el.classList.remove("is-search-hidden"); continue; }
        var hay = (el.textContent || "").toLowerCase();
        el.classList.toggle("is-search-hidden", hay.indexOf(q) === -1);
      }
    });
  }

  /* 11.3 底部状态条：实时时钟 */
  function bindClock() {
    var clock = $("mClock");
    if (!clock) return;
    var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
    var tick = function () {
      var d = new Date();
      clock.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    };
    tick();
    setInterval(tick, 1000);
  }

  /* 11.4 运行时长：基于首次访问时间（localStorage） */
  function bindUptime() {
    var el = $("mUptime");
    if (!el) return;
    var KEY = "modern-site-since";
    var since = 0;
    try {
      since = parseInt(localStorage.getItem(KEY), 10) || 0;
      if (!since) {
        since = Date.now();
        localStorage.setItem(KEY, String(since));
      }
    } catch (e) { since = Date.now(); }
    var fmt = function (ms) {
      var days = Math.floor(ms / 86400000);
      var hours = Math.floor((ms % 86400000) / 3600000);
      var mins = Math.floor((ms % 3600000) / 60000);
      return isEn()
        ? days + "d " + hours + "h " + mins + "m"
        : days + " 天 " + hours + " 小时 " + mins + " 分钟";
    };
    var update = function () {
      el.textContent = fmt(Date.now() - since);
    };
    update();
    setInterval(update, 60000);
  }

  /* 11.5 日间模式主题切换（localStorage 持久化） */
  function bindTheme() {
    var KEY = "modern-theme";
    var card = $("mThemeCard");
    var btn = $("mThemeToggle");
    var icon = $("mThemeIcon");
    var applyTheme = function (light) {
      document.body.classList.toggle("is-light", light);
      try { localStorage.setItem(KEY, light ? "light" : "dark"); } catch (e) { /* 忽略 */ }
      if (icon) icon.textContent = light ? "🌙" : "🌸";
    };
    // 初始化：读取已保存主题
    var saved = "dark";
    try { saved = localStorage.getItem(KEY) || "dark"; } catch (e) { /* 忽略 */ }
    applyTheme(saved === "light");

    var toggle = function () {
      applyTheme(!document.body.classList.contains("is-light"));
    };
    if (card) {
      card.addEventListener("click", toggle);
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    }
    if (btn) btn.addEventListener("click", toggle);
  }

  /* 11.6 返回顶部 */
  function bindBackTop() {
    var btn = $("mBackTop");
    if (!btn) return;
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- 11.8 樱花光标（v1.50.0） ----------
   * 默认态 = 单片樱花花瓣（与背景图同款 V 形缺口）；悬浮可交互元素时
   * 整体旋转一圈，变为「圆心 + 圆环 + 三片花瓣环绕」（圆心圆环形态呼应
   * 主页面霓虹光标）；移动轨迹 = 花瓣散落粒子。
   * 仅桌面精确指针且允许动效时启用；原生光标在首次移动后隐藏（html.has-mcursor）。 */
  var CURSOR_HOVER_SELECTOR = [
    "a", "button", "input", "textarea", "select", "summary", "label",
    "[role='button']", "[data-click]",
    ".m-btn", ".m-chip", ".m-project", ".m-project-log", ".m-float-btn",
    ".m-twin-suggests button", ".m-music-player", ".m-arcade-list",
    ".m-feedback-form", ".m-wall-card", ".m-tag", ".m-nav-links a", ".m-statusbar"
  ].join(",");
  var CURSOR_PETAL_PATH =
    "M0 13 C-9.5 8.5 -10.5 -1.5 -2.8 -8 L0 -5.2 L2.8 -8 C10.5 -1.5 9.5 8.5 0 13 Z";
  var CURSOR_TRAIL_STEP = 14;   // 每移动约 14px 落一片花瓣
  var CURSOR_MAX_TRAIL = 18;    // 同屏花瓣粒子上限

  function bindCursor() {
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    var host = $("mCursor");
    if (!host) return;
    var root = document.documentElement;

    var gradId = "mCursorPetalGrad" + Math.random().toString(36).slice(2, 8);
    var petalDefs = function () {
      return (
        '<defs><linearGradient id="' + gradId + '" x1="0" y1="-8" x2="0" y2="13" gradientUnits="userSpaceOnUse">' +
        '<stop offset="0" stop-color="#ffe3f4"/><stop offset="1" stop-color="#f472b6"/>' +
        "</linearGradient></defs>"
      );
    };
    var petalPath = function () {
      return '<path d="' + CURSOR_PETAL_PATH + '" fill="url(#' + gradId + ')"/>';
    };
    var idleSvg = function () {
      return (
        '<svg class="m-cursor-ring-svg" width="40" height="40" viewBox="-20 -20 40 40" aria-hidden="true">' +
        petalDefs() + '<g transform="translate(0,-2)">' + petalPath() + "</g></svg>"
      );
    };
    var interactiveSvg = function () {
      var petals = "";
      for (var i = 0; i < 3; i++) {
        petals +=
          '<g transform="rotate(' + (i * 120) + ')">' +
          '<g transform="translate(0,-20) scale(0.62)">' +
          '<path d="' + CURSOR_PETAL_PATH + '" fill="url(#' + gradId + ')"/>' +
          "</g></g>";
      }
      return (
        '<svg class="m-cursor-ring-svg" width="56" height="56" viewBox="-28 -28 56 56" aria-hidden="true">' +
        petalDefs() +
        '<circle r="20" stroke="#c084fc" stroke-width="2"/>' +
        '<circle r="3.5" fill="#fff" opacity="0.95"/>' +
        petals +
        "</svg>"
      );
    };

    host.innerHTML =
      '<div class="m-cursor-dot" aria-hidden="true"></div>' +
      '<div class="m-cursor-ring" aria-hidden="true">' + idleSvg() + "</div>";
    var dot = host.querySelector(".m-cursor-dot");
    var ring = host.querySelector(".m-cursor-ring");

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var tx = mx, ty = my;      // 目标（指针位置）
    var cx = mx, cy = my;      // 当前（环平滑跟随）
    var lastX = mx, lastY = my;
    var trailCount = 0;
    var started = false;
    var spinning = false;

    var hook = (window.__modernCursor = {
      started: false,
      interactive: false,
      spins: 0,
      mode: function () { return host.classList.contains("interactive") ? "interactive" : "idle"; },
      petals: function () { return document.querySelectorAll(".m-cursor-petal").length; }
    });

    function spawnPetal(x, y) {
      if (trailCount >= CURSOR_MAX_TRAIL) return;
      var p = document.createElement("span");
      p.className = "m-cursor-petal";
      p.setAttribute("aria-hidden", "true");
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.setProperty("--dx", (Math.random() * 30 - 15).toFixed(1) + "px");
      p.style.setProperty("--dy", (Math.random() * 18 + 10).toFixed(1) + "px");
      p.style.setProperty("--rot", (Math.random() * 240 + 60).toFixed(0) + "deg");
      p.innerHTML = (
        '<svg width="13" height="13" viewBox="-20 -20 40 40" aria-hidden="true">' +
        '<g transform="scale(0.42)"><path d="' + CURSOR_PETAL_PATH + '" fill="' +
        (Math.random() > 0.5 ? "#f9a8d4" : "#c084fc") + '"/></g></svg>'
      );
      document.body.appendChild(p);
      trailCount += 1;
      p.addEventListener("animationend", function () { p.remove(); trailCount -= 1; });
    }

    function setInteractive(on) {
      var had = host.classList.contains("interactive");
      if (on) {
        if (!had) { hook.spins += 1; spinning = true; }
        host.classList.add("interactive");
        ring.innerHTML = interactiveSvg();
      } else {
        if (had) ring.innerHTML = idleSvg();
        host.classList.remove("interactive");
      }
      hook.interactive = on;
      // 旋转一圈动画结束后复位标记（供 CDP 观察）
      window.setTimeout(function () { spinning = false; }, 650);
    }

    function onMove(e) {
      tx = e.clientX; ty = e.clientY;
      if (!started) {
        started = true;
        hook.started = true;
        cx = tx; cy = ty;
        lastX = tx; lastY = ty;
        root.classList.add("has-mcursor");
        host.classList.add("is-on");
      }
      var dx = tx - lastX, dy = ty - lastY;
      if (dx * dx + dy * dy >= CURSOR_TRAIL_STEP * CURSOR_TRAIL_STEP) {
        spawnPetal(tx, ty);
        lastX = tx; lastY = ty;
      }
      dot.style.left = tx + "px";
      dot.style.top = ty + "px";
    }

    function isHoverTarget(elm) {
      return !!(elm && typeof elm.closest === "function" && elm.closest(CURSOR_HOVER_SELECTOR));
    }
    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", function (e) {
      if (!started) return;
      if (isHoverTarget(e.target)) setInteractive(true);
    });
    document.addEventListener("mouseout", function (e) {
      if (!started) return;
      if (isHoverTarget(e.target) && !isHoverTarget(e.relatedTarget)) setInteractive(false);
    });

    function tick() {
      cx += (tx - cx) * 0.24;
      cy += (ty - cy) * 0.24;
      ring.style.left = cx + "px";
      ring.style.top = cy + "px";
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- 13. v1.46.0 新增：背景轮换（手动/每 2 分钟自动）+ 樱花飘落粒子 ---------- */

  /* 13.1 背景轮换：assets/bg/ 下 4 张樱花背景图，交叉淡入淡出 */
  var BG_IMAGES = [
    "assets/bg/bg-1.jpg",
    "assets/bg/bg-2.jpg",
    "assets/bg/bg-3.jpg",
    "assets/bg/bg-4.jpg"
  ];
  var BG_INTERVAL = 120000;   // 2 分钟自动轮换

  function bindBgCarousel() {
    var slides = document.querySelectorAll(".m-bg-slide");
    var btn = $("mBgBtn");
    if (!slides.length) return;

    // 预加载全部背景图，避免切换时闪烁
    BG_IMAGES.forEach(function (src) {
      var im = new Image();
      im.src = src;
    });

    var idx = 0;
    var next = function () {
      slides[idx].classList.remove("is-active");
      idx = (idx + 1) % slides.length;
      slides[idx].classList.add("is-active");
    };

    // 每 2 分钟自动轮换
    var timer = setInterval(next, BG_INTERVAL);

    // 手动切换（右下角 🌸 按钮）：立即换下一张并重新计时
    if (btn) {
      btn.addEventListener("click", function () {
        next();
        clearInterval(timer);
        timer = setInterval(next, BG_INTERVAL);
      });
    }

    // 测试钩子（CDP 验证用）
    window.__modernBg = {
      count: slides.length,
      interval: BG_INTERVAL,
      index: function () { return idx; }
    };
  }

  /* 13.2 樱花飘落粒子（Canvas 全屏层，pointer-events:none） */
  function bindPetals() {
    var cv = $("mPetals");
    if (!cv || !cv.getContext) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var ctx = cv.getContext("2d");
    var W = 0, H = 0;
    var DPR = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      W = cv.clientWidth;
      H = cv.clientHeight;
      cv.width = W * DPR;
      cv.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    // 花瓣数量：随屏宽自适应，14 ~ 32 朵
    var COUNT = Math.max(14, Math.min(32, Math.round(W / 55)));
    var COLORS = ["255,182,193", "255,192,203", "255,160,190", "252,205,220", "250,170,200"];
    var petals = [];

    function makePetal() {
      return {
        x: Math.random() * W,
        y: -40 - Math.random() * H * 0.5,
        size: 7 + Math.random() * 13,          // 花瓣尺寸
        vy: 0.35 + Math.random() * 0.9,        // 下落速度
        sway: 0.4 + Math.random() * 1.1,       // 左右摇摆幅度
        phase: Math.random() * Math.PI * 2,    // 摇摆相位
        rot: Math.random() * Math.PI * 2,      // 旋转角
        vr: (Math.random() - 0.5) * 0.035,     // 旋转速度
        color: COLORS[(Math.random() * COLORS.length) | 0],
        alpha: 0.5 + Math.random() * 0.4
      };
    }

    var i, p;
    for (i = 0; i < COUNT; i++) petals.push(makePetal());

    // 单片樱花花瓣（同背景图中的飘落花瓣）：底部圆润，先端中央 V 形凹陷
    function drawPetal(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = "rgba(" + p.color + ",0.9)";
      var r = p.size;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.92);                                    // 花瓣基部
      ctx.bezierCurveTo(-r * 0.78, r * 0.35, -r * 0.55, -r * 0.45, -r * 0.26, -r * 0.6);  // 左瓣缘
      ctx.quadraticCurveTo(-r * 0.1, -r * 0.74, 0, -r * 0.58);    // 缺口左凸起
      ctx.quadraticCurveTo(r * 0.1, -r * 0.74, r * 0.26, -r * 0.6); // 缺口右凸起
      ctx.bezierCurveTo(r * 0.55, -r * 0.45, r * 0.78, r * 0.35, 0, r * 0.92);  // 右瓣缘
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    var running = true;
    document.addEventListener("visibilitychange", function () {
      var was = running;
      running = !document.hidden;
      if (!was && running) requestAnimationFrame(frame);   // 回到前台时恢复动画
    });

    function frame() {
      ctx.clearRect(0, 0, W, H);
      for (i = 0; i < petals.length; i++) {
        p = petals[i];
        p.phase += 0.012;
        p.rot += p.vr;
        p.x += Math.sin(p.phase) * p.sway * 0.6;
        p.y += p.vy;
        if (p.y > H + 40) {
          petals[i] = makePetal();
          petals[i].y = -40;
        }
        if (p.x > W + 40) p.x = -40;
        if (p.x < -40) p.x = W + 40;
        drawPetal(p);
      }
      if (running) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // 测试钩子（CDP 验证用）
    window.__modernPetals = { count: COUNT, running: function () { return running; } };
  }


  /* ---------- 11.7 开发历程弹窗（v1.49.0） ----------
   * 与主页面 index.html 的 history.js 同源数据（DEV_LOG_STAGES 由脚本从
   * history.js 提取，保持双页版本记录一致；新增版本两处同步维护）。
   * 紫色毛玻璃风格；{GARBLE:n} 占位渲染静态乱码口令；彩蛋行读同一
   * localStorage（personal-homepage-eggs）——已在主页面触发的彩蛋，对应行
   * 在此同样解密为真实版本日志。关闭：✕ / 遮罩点击 / Esc，打开时锁滚动。 */
  var DEV_LOG_STAGES = [
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
          { v: "v1.5", date: "2026-09-07", text: "{GARBLE:29}", egg: "dream-power", secret: "页面底部彩蛋：输入暗号「梦想即力量」点亮页面并跳转 BanG Dream" },
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
          { v: "V2.10", date: "2026-09-10", text: "{GARBLE:17}", egg: "lycnb", secret: "彩蛋升级为 lycnb 解锁的隐藏关卡浮层" },
          { v: "V2.11", date: "2026-09-10", text: "复古 CRT 开启动画：约 4.6 秒终端解密自检" },
          { v: "V2.12", date: "2026-09-10", text: "{GARBLE:13}", egg: "lycnb", secret: "修复彩蛋浮层与开启动画遮挡自定义光标" },
          { v: "V2.13", date: "2026-09-10", text: "开启动画播放期间隐藏鼠标光标" },
          { v: "V2.14", date: "2026-09-10", text: "Dock 栏整体深色半透明毛玻璃底板" },
          { v: "V2.15", date: "2026-09-10", text: "四芒星光标由黄色改为青色，与按钮点亮色区分" },
          { v: "V2.16", date: "2026-09-10", text: "叠加 CRT 水平扫描线与全页微弱噪点" },
          { v: "V2.17", date: "2026-09-10", text: "项目区改为 MISSION 任务列表 + 悬停全息简报面板" },
          { v: "V2.18", date: "2026-09-10", text: "{GARBLE:25}", egg: "idle", secret: "新增待机彩蛋：3 分钟无操作触发红色警报与乱码提醒" },
          { v: "V2.19", date: "2026-09-14", text: "待机乱码铺满全屏（按视口实测字符动态计算行列）" },
          { v: "V2.20", date: "2026-09-17", text: "Hero 当前状态座舱仪表盘 + 联系区 GitHub 卡片上线" },
          { v: "V2.21", date: "2026-09-17", text: "{GARBLE:21}", egg: "idle", secret: "待机彩蛋新增「故障解除」退出动画（3 秒）" }
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
          { v: "V3.24", date: "2026-09-17", text: "{GARBLE:27}", egg: "stickman", secret: "新增赛博火柴人彩蛋：两段式奔跑 / 方向跟随 / 点击说话" },
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
          { v: "V3.41.1", date: "2026-09-20", text: "{GARBLE:95}", egg: "rare-line", secret: "数字孪生与火柴人定制优化：知识库 12→25 条全站取材、火柴人稀有台词约 10% 概率、随机回复池兜底" },
          { v: "V3.41.2", date: "2026-09-20", text: "{GARBLE:51}", egg: "copy", secret: "第三个键盘彩蛋：输入 copy 复制火柴人，上限 10 个，超限一键回收" },
          { v: "V3.42", date: "2026-09-20", text: "成就系统上线：主页新增成就栏，浏览 / 互动解锁成就并点亮，达成时右下角弹出 Steam 风格提示" },
          { v: "V3.42.1", date: "2026-09-20", text: "成就系统 10 项成就落地：待机彩蛋 / 彩蛋关卡 / 诗云传送 / 停留 10 分钟 / 全成就收藏家" },
          { v: "V3.42.2", date: "2026-09-20", text: "页脚新增「了解更多」按钮：点击跳转 B 站视频（BV1UT42167xb），新标签页打开" },
          { v: "V3.42.3", date: "2026-09-20", text: "成就简介保密：未解锁的成就一律以「???」代替简介，不再展示达成条件" },
          { v: "V3.42.4", date: "2026-09-20", text: "新增成就「你被骗了」：点击页脚「了解更多」按钮解锁" },
          { v: "V3.42.5", date: "2026-09-20", text: "多语言切换：左上角 EN / 中 按钮一键切换整站中英文，成就 / 数字孪生 / 打字机 slogan 随语言切换" },
          { v: "V3.42.6", date: "2026-09-20", text: "英文态像素字体：切换英文后全站文本使用 Press Start 2P 8-bit 像素字体" },
          { v: "V3.42.7", date: "2026-09-20", text: "修复：开发历程弹窗打不开（history.js 上一版本多出一对闭合括号导致语法错误）" },
          { v: "V3.42.8", date: "2026-09-20", text: "彩蛋行解密：触发全站对应彩蛋（页脚暗号 / lycnb / 待机 / 火柴人 / copy）后，开发历程弹窗中对应乱码口令自动解密为真实版本日志" },
          { v: "V3.42.9", date: "2026-09-24", text: "LOG 弹窗锁页：开发历程弹窗打开期间（含开启动画）锁定页面滚动，背景不可下滑，面板内滚动不受影响，关闭即恢复" },
          { v: "V3.42.10", date: "2026-09-24", text: "LOG 弹窗锁页加固：开启动画期间弹窗面板与背景一并锁定不可滚动（含触屏），动画结束显示内容后恢复面板内部滚动" },
          { v: "V3.43.0", date: "2026-09-24", text: "反馈墙上线：反馈提交时可选公开展示，展示的反馈可被点赞 / 评论；主人经 Supabase 邮箱登录后可下架（软下架，数据保留）" },
          { v: "V3.44.0", date: "2026-09-24", text: "移动端功能菜单：音乐 / 反馈 / 反馈墙 三枚板块按钮收进一枚主按钮，点击展开（再点收起，返回顶部保持独立）" },
          { v: "V3.44.1", date: "2026-09-24", text: "修复：手机端项目板块 LOG 按钮被全息投影面板遮挡——触屏触摸任务行触发 :hover 时，残留的 translateY(-50%) 使内联常显面板上移盖住按钮；媒体查询分支强制 hover 状态下面板不位移" },
          { v: "V3.44.2", date: "2026-09-24", text: "项目板块写入迭代历史：MISSION_01 全息简报由初始占位更新为当前功能集合（反馈墙 / 音游展示区 / 开发历程 LOG / 移动端适配）与成长里程碑" },
          { v: "V3.44.3", date: "2026-09-24", text: "迭代记录按时间先后重排：开发历程弹窗 V3.0 阶段版本列表恢复时间顺序（09-20 条目不再被 09-24 新条目插乱），项目板块成长史并列项同步按时间排序" },
          { v: "v1.46.0", date: "2026-09-25", text: "现代版新增樱花背景图轮换（手动 🌸 切换 + 每 2 分钟自动，4 张 assets/bg 背景）+ Canvas 樱花飘落粒子特效，加载过程优雅过渡" },
          { v: "v1.47.0", date: "2026-09-25", text: "现代版新增 4 秒衔接加载动画：赛博黄网格 / 青扫描线（衔接主页面风格）→ 紫色宝藏之地 + 樱花花瓣飘入 + 内容上浮入场" },
          { v: "v1.48.0", date: "2026-09-25", text: "现代版新增沉浸模式：🖼️ 按钮点击后只保留背景与樱花粒子特效，导航 / 内容 / 状态条淡出隐藏，0.65s 双向过渡 + 背景推近 scale(1.1)" },
          { v: "v1.49.0", date: "2026-09-25", text: "现代版新增开发历程 LOG：MISSION_01 卡片 📜 LOG 按钮打开紫色毛玻璃弹窗，数据与本页面 history.js 同源（3 阶段 55 条版本记录），乱码口令与彩蛋解密共享同一 localStorage 记录" },
          { v: "v1.50.0", date: "2026-09-25", text: "现代版新增樱花光标：默认=单片樱花花瓣（V 形缺口同背景图），移动时花瓣散落轨迹；悬浮可交互元素时整体旋转一圈，变为圆心+圆环+三片花瓣环绕（呼应本页面霓虹光标），原生光标首次移动后隐藏" },
        ]
      }
    ];
  var DEV_EGG_STORE_KEY = "personal-homepage-eggs"; // 与主页面 history.js 共享
  function devLogEggs() {
    try {
      var list = JSON.parse(localStorage.getItem(DEV_EGG_STORE_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }
  var DEV_GARBLE_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^*-_=+[];:,.?\/";
  function devLogGarble(n) {
    var s = "";
    for (var i = 0; i < n; i++) {
      s += DEV_GARBLE_CHARS.charAt(Math.floor(Math.random() * DEV_GARBLE_CHARS.length));
    }
    return s;
  }
  function devLogReplaceGarble(text) {
    var out = "";
    var rest = text;
    while (true) {
      var mm = /^([\s\S]*?)\{GARBLE:(\d+)\}([\s\S]*)$/.exec(rest);
      if (!mm) { out += rest; break; }
      var n = parseInt(mm[2], 10);
      if (!(n > 0)) { out += mm[1] + mm[3]; break; }
      out += mm[1] +
        '<span class="m-devlog-garble" aria-label="乱码口令">' + devLogGarble(n) + "</span>";
      rest = mm[3];
    }
    return out;
  }
  function devLogVersionText(ver) {
    var eggs = devLogEggs();
    if (ver.egg && ver.secret && eggs.indexOf(ver.egg) !== -1) {
      return '<span class="m-devlog-declassified">' + ver.secret + "</span>";
    }
    return devLogReplaceGarble(ver.text);
  }

  function bindDevLog() {
    var overlay = $("mDevLogOverlay");
    var stageList = $("mDevLogStages");
    var trigger = $("mDevLogTrigger");
    var closeBtn = $("mDevLogClose");
    if (!overlay || !stageList) return;

    var onKeydown = null;

    function renderStages() {
      var html = "";
      for (var i = 0; i < DEV_LOG_STAGES.length; i++) {
        var s = DEV_LOG_STAGES[i];
        var items = "";
        for (var j = 0; j < s.versions.length; j++) {
          var ver = s.versions[j];
          items +=
            '<li class="m-devlog-item">' +
              '<span class="m-devlog-ver">' + ver.v + "</span>" +
              '<span class="m-devlog-date">' + ver.date + "</span>" +
              '<span class="m-devlog-text">' + devLogVersionText(ver) + "</span>" +
            "</li>";
        }
        html +=
          '<section class="m-devlog-stage">' +
            '<header class="m-devlog-stage-head">' +
              '<span class="m-devlog-stage-badge">' + s.stage + "</span>" +
              '<h4 class="m-devlog-stage-theme">' + devLogReplaceGarble(s.theme) + "</h4>" +
              '<span class="m-devlog-stage-meta">' + s.range + " · " + s.period + "</span>" +
            "</header>" +
            '<p class="m-devlog-stage-desc">' + devLogReplaceGarble(s.desc) + "</p>" +
            '<ul class="m-devlog-list">' + items + "</ul>" +
          "</section>";
      }
      stageList.innerHTML = html;
    }

    function open() {
      renderStages();   // 每次打开按最新彩蛋登记重渲染
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      document.documentElement.classList.add("is-devlog-open");
      document.body.classList.add("is-devlog-open");
      if (onKeydown) window.removeEventListener("keydown", onKeydown);
      onKeydown = function (e) {
        if (e.key === "Escape" || e.keyCode === 27) close();
      };
      window.addEventListener("keydown", onKeydown);
      if (window.__modernDevLog) window.__modernDevLog.active = true;
    }

    function close() {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("is-devlog-open");
      document.body.classList.remove("is-devlog-open");
      if (onKeydown) {
        window.removeEventListener("keydown", onKeydown);
        onKeydown = null;
      }
      if (window.__modernDevLog) window.__modernDevLog.active = false;
    }

    if (trigger) trigger.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();   // 只响应遮罩本身
    });

    // 测试钩子（CDP 验证用）
    window.__modernDevLog = {
      active: false,
      isOpen: function () { return overlay.classList.contains("is-open"); },
      open: open,
      close: close,
      stages: function () { return DEV_LOG_STAGES.length; },
      versions: function () {
        var n = 0;
        for (var i = 0; i < DEV_LOG_STAGES.length; i++) n += DEV_LOG_STAGES[i].versions.length;
        return n;
      }
    };
  }

  /* ---------- 11.6 沉浸模式（v1.48.0） ----------
   * 点击悬浮栏 🖼️ 后只保留背景轮换与樱花粒子，其余 UI 淡出隐藏；
   * 再次点击恢复。切换由 body.m-immersive 驱动 CSS 过渡（0.65s 淡出+模糊+缩放） */
  function bindFocus() {
    var btn = $("mFocusBtn");
    if (!btn) return;

    function setActive(on) {
      document.body.classList.toggle("m-immersive", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      if (window.__modernImmersive) window.__modernImmersive.active = on;
    }

    btn.addEventListener("click", function () {
      setActive(!document.body.classList.contains("m-immersive"));
    });

    // 测试钩子（CDP 验证用）
    window.__modernImmersive = {
      active: false,
      isActive: function () { return document.body.classList.contains("m-immersive"); },
      toggle: function () { setActive(!document.body.classList.contains("m-immersive")); }
    };
  }

  /* ---------- 11.5 4 秒衔接加载动画（v1.47.0） ----------
   * 阶段一赛博（黄网格/青扫描/霓虹 // 文案）→ 阶段二宝藏之地（紫色标题/花瓣/光晕）
   * 纯 CSS 动画 4s 后自动淡出；此处负责生成飘入花瓣、4.2s 后移除 DOM */
  function bindLoader() {
    var loader = $("mLoader");
    if (!loader) return;
    window.__modernLoader = { done: false };

    // 阶段二入场花瓣（8 片随机飘落，与主花瓣层视觉一致）
    var box = loader.querySelector(".m-loader-petals");
    if (box) {
      var i, s;
      for (i = 0; i < 8; i++) {
        s = document.createElement("span");
        s.className = "m-loader-petal";
        s.style.left = (6 + Math.random() * 84) + "%";
        s.style.setProperty("--d", (2.4 + Math.random() * 1.4).toFixed(2) + "s");
        s.style.setProperty("--delay", (1 + Math.random() * 0.7).toFixed(2) + "s");
        s.style.setProperty("--sx", ((Math.random() - 0.5) * 180).toFixed(0) + "px");
        var sz = 11 + Math.random() * 9;
        s.style.width = sz.toFixed(1) + "px";
        s.style.height = sz.toFixed(1) + "px";
        box.appendChild(s);
      }
    }

    // 动画结束后移除加载层（CSS 淡出到 4.0s，留 0.2s 余量）
    setTimeout(function () {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
      window.__modernLoader = { done: true };
    }, 4200);
  }

  /* ---------- 12. 初始化 ---------- */
  function init() {
    bindTopbar();
    renderArcade();
    bindTwin();
    bindMusic();
    bindFeedback();
    loadWall();
    bindNavHighlight();
    bindSearch();
    bindClock();
    bindUptime();
    bindTheme();
    bindBackTop();
    bindBgCarousel();
    bindPetals();
    bindLoader();
    bindFocus();
    bindDevLog();
    bindCursor();

    // 个人资料卡统计数字（真实数据：项目 3 / 音游 8）
    var stProj = $("mStatProjects");
    if (stProj) stProj.textContent = "3";
    var stArc = $("mStatArcade");
    if (stArc) stArc.textContent = String(ARCADES.length);

    var year = $("mYear");
    if (year) year.textContent = String(new Date().getFullYear());

    document.addEventListener("modern:i18n", function () {
      renderArcade();
    });

    apply();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
