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
    "回到顶部": "Back to top"
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
