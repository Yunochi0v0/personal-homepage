/* ============================================================
   反馈墙（v1.43.0）
   - 右下角「反馈墙」徽章 → 弹层：公开展示的反馈列表（listed=true）
   - 点赞 / 取消赞（localStorage 匿名标识 user_key，unique 防重复）
   - 评论（展开卡片评论区，昵称可选、内容 ≤300 字）
   - 主人管理（Supabase Auth 邮箱登录）：登录后可「下架」展示的反馈
     （软下架 listed=false，数据保留在表里，主人仍可在控制台看到）
   - 安全说明：本文件只含 publishable key（设计上公开的前端配置）；
     下架鉴权在数据库层（RLS：authenticated 才能 UPDATE listed），
     密码只经 Supabase Auth 校验，从不写入前端或仓库。
     权限脚本见 supabase/feedback-wall.sql。
   ============================================================ */
(function () {
  "use strict";

  var SUPABASE_URL = "https://tepsjylpqzdpygknlyij.supabase.co";
  var PUBLISHABLE_KEY = "sb_publishable_o8BDMXzQ8-hkXdPzjga4nw_mYaYIofQ"; // 公开前端配置

  var VISITOR_KEY_STORAGE = "personal-homepage-visitor-key";
  var COMMENT_NAME_STORAGE = "personal-homepage-comment-name";
  var LANG_STORAGE = "personal-homepage-lang";

  var MAX_COMMENT = 300;
  var WALL_LIMIT = 50;

  /* 动态文案（JS 生成内容，随语言切换；静态文案走 i18n.js data-i18n） */
  var T = {
    zh: {
      loading: "加载中…",
      like: "点赞",
      liked: "已点赞",
      comment: "评论",
      delist: "下架",
      confirmDelist: "确定要下架这条反馈吗？（下架后仅你可见，可在控制台恢复）",
      anonymous: "匿名访客",
      loginOk: "已登录为主人",
      loginFail: "登录失败，请检查邮箱和密码",
      logoutOk: "已退出登录",
      guestHint: "正在以访客身份浏览",
      commentPlaceholder: "说点什么…（≤300 字）",
      commentSubmit: "发送",
      commentNamePlaceholder: "昵称（可选）",
      posted: "评论已发布",
      noComments: "还没有评论",
      loadFailed: "反馈墙加载失败，请稍后重试",
      likeFailed: "操作失败，请稍后重试",
      commentFailed: "评论发布失败，请稍后重试"
    },
    en: {
      loading: "Loading…",
      like: "Like",
      liked: "Liked",
      comment: "Comment",
      delist: "Remove",
      confirmDelist: "Remove this feedback from the wall? (It stays visible only to you, restorable in the console)",
      anonymous: "Anonymous",
      loginOk: "Signed in as owner",
      loginFail: "Sign-in failed. Check email and password",
      logoutOk: "Signed out",
      guestHint: "Browsing as a guest",
      commentPlaceholder: "Say something… (≤300 chars)",
      commentSubmit: "Post",
      commentNamePlaceholder: "Nickname (optional)",
      posted: "Comment posted",
      noComments: "No comments yet",
      loadFailed: "Failed to load the wall. Please retry later",
      likeFailed: "Operation failed. Please retry later",
      commentFailed: "Failed to post comment. Please retry later"
    }
  };

  var overlay, badge, closeBtn, listEl, emptyEl, errorEl;
  var adminBox, adminToggle, adminPanel, adminForm, adminEmail, adminPass,
      adminError, adminSubmit, adminOnline, adminStatus, adminLogout;

  var client = null;
  var lang = "zh";
  var visitorKey = "";
  var myLikes = null;      // Set<feedbackId> 我点过的赞
  var isOwner = false;     // 当前是否主人登录态
  var onKeydown = null;
  var busy = false;        // 点赞/评论防抖

  var version = "0.0.0";
  if (document.body && document.body.dataset && document.body.dataset.version) {
    version = document.body.dataset.version;
  }

  function $(id) { return document.getElementById(id); }
  function t(key) { return (T[lang] && T[lang][key]) || T.zh[key]; }
  function readLang() {
    try { lang = localStorage.getItem(LANG_STORAGE) || "zh"; } catch (e) { lang = "zh"; }
  }
  function getVisitorKey() {
    try {
      var k = localStorage.getItem(VISITOR_KEY_STORAGE);
      if (!k) {
        k = (window.crypto && crypto.randomUUID)
          ? crypto.randomUUID()
          : "vk-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
        localStorage.setItem(VISITOR_KEY_STORAGE, k);
      }
      return k;
    } catch (e) {
      return "vk-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
    }
  }

  function getClient() {
    if (client) return client;
    if (typeof window.supabase === "undefined" || !window.supabase.createClient) return null;
    client = window.supabase.createClient(SUPABASE_URL, PUBLISHABLE_KEY);
    return client;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function fmtTime(iso) {
    try {
      var d = new Date(iso);
      var opts = { year: "numeric", month: "2-digit", day: "2-digit",
                   hour: "2-digit", minute: "2-digit" };
      return d.toLocaleString(lang === "en" ? "en-US" : "zh-CN", opts);
    } catch (e) {
      return "";
    }
  }

  /* ---------------- 打开 / 关闭 ---------------- */
  function init() {
    overlay = $("wallOverlay");
    badge = $("wallBadge");
    closeBtn = $("wallClose");
    listEl = $("wallList");
    emptyEl = $("wallEmpty");
    errorEl = $("wallError");
    adminBox = $("wallAdmin");
    adminToggle = $("wallAdminToggle");
    adminPanel = $("wallAdminPanel");
    adminForm = $("wallAdminForm");
    adminEmail = $("wallAdminEmail");
    adminPass = $("wallAdminPass");
    adminError = $("wallAdminError");
    adminSubmit = $("wallAdminSubmit");
    adminOnline = $("wallAdminOnline");
    adminStatus = $("wallAdminStatus");
    adminLogout = $("wallAdminLogout");

    if (!overlay || !badge || !listEl) return; // 结构缺失静默退出

    readLang();
    visitorKey = getVisitorKey();

    badge.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", onOverlayClick);
    if (adminToggle) adminToggle.addEventListener("click", toggleAdminPanel);
    if (adminForm) adminForm.addEventListener("submit", onAdminLogin);
    if (adminLogout) adminLogout.addEventListener("click", onAdminLogout);

    // 语言切换时按当前语言重渲染（只重渲染弹层内 JS 文案）
    document.addEventListener("i18n:changed", function () {
      readLang();
      if (overlay.classList.contains("is-open")) renderWall();
    });
  }

  function open() {
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    if (onKeydown) window.removeEventListener("keydown", onKeydown);
    onKeydown = function (e) {
      if (e.key === "Escape" || e.keyCode === 27) close();
    };
    window.addEventListener("keydown", onKeydown);
    renderWall();
  }

  function close() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    if (onKeydown) {
      window.removeEventListener("keydown", onKeydown);
      onKeydown = null;
    }
  }

  function onOverlayClick(e) {
    if (e.target === overlay) close();
  }

  /* ---------------- 主人管理区 ---------------- */
  function toggleAdminPanel() {
    if (!adminPanel) return;
    adminPanel.hidden = !adminPanel.hidden;
    if (!adminPanel.hidden && !isOwner) adminEmail && adminEmail.focus();
  }

  function setAdminError(msg) {
    if (!adminError) return;
    if (msg) { adminError.textContent = msg; adminError.hidden = false; }
    else adminError.hidden = true;
  }

  function onAdminLogin(e) {
    e.preventDefault();
    if (adminSubmit) adminSubmit.disabled = true;
    setAdminError(null);
    var sb = getClient();
    if (!sb) { setAdminError(t("loadFailed")); if (adminSubmit) adminSubmit.disabled = false; return; }
    var email = (adminEmail && adminEmail.value || "").trim();
    var pass = (adminPass && adminPass.value || "");
    sb.auth.signInWithPassword({ email: email, password: pass })
      .then(function (res) {
        if (adminSubmit) adminSubmit.disabled = false;
        if (res && res.error) {
          setAdminError(t("loginFail"));
          return;
        }
        isOwner = true;
        renderAdminState();
        if (adminPanel) adminPanel.hidden = true;
        renderWall();
      })
      .catch(function () {
        if (adminSubmit) adminSubmit.disabled = false;
        setAdminError(t("loginFail"));
      });
  }

  function onAdminLogout() {
    var sb = getClient();
    if (!sb) return;
    sb.auth.signOut().then(function () {
      isOwner = false;
      renderAdminState();
      renderWall();
    });
  }

  function renderAdminState() {
    if (!adminBox) return;
    adminBox.hidden = false;
    if (adminPanel) adminPanel.hidden = !adminToggle || adminPanel.hidden;
    if (isOwner) {
      if (adminForm) adminForm.hidden = true;
      if (adminOnline) adminOnline.hidden = false;
      if (adminStatus) adminStatus.textContent = t("loginOk");
    } else {
      if (adminForm) adminForm.hidden = false;
      if (adminOnline) adminOnline.hidden = true;
    }
  }

  /* ---------------- 列表渲染 ---------------- */
  function renderWall() {
    if (emptyEl) emptyEl.hidden = true;
    if (errorEl) errorEl.hidden = true;
    if (listEl) { listEl.textContent = ""; listEl.appendChild(el("p", "wall-loading", t("loading"))); }

    var sb = getClient();
    if (!sb) {
      showError(t("loadFailed"));
      return;
    }

    // 先恢复主人登录态，再拉数据（决定是否渲染「下架」按钮）
    sb.auth.getSession().then(function (sres) {
      var hadOwner = isOwner;
      isOwner = !!(sres && sres.data && sres.data.session);
      if (isOwner !== hadOwner) renderAdminState();
      loadWallData(sb);
    }).catch(function () { loadWallData(sb); });
  }

  function loadWallData(sb) {
    // 三条查询并行：反馈列表 / 点赞 / 评论计数
    var pFeedback = sb.from("feedback")
      .select("id,name,relation,device,message,created_at")
      .eq("listed", true)
      .order("created_at", { ascending: false })
      .limit(WALL_LIMIT);
    var pLikes = sb.from("feedback_likes").select("feedback_id,user_key");
    var pComments = sb.from("feedback_comments").select("feedback_id");

    Promise.all([pFeedback, pLikes, pComments])
      .then(function (results) {
        var rows = (results[0] && results[0].data) || [];
        var likeRows = (results[1] && results[1].data) || [];
        var commentRows = (results[2] && results[2].data) || [];
        if ((results[0] && results[0].error) || (results[1] && results[1].error) ||
            (results[2] && results[2].error)) {
          showError(t("loadFailed"));
          return;
        }
        paint(rows, likeRows, commentRows);
      })
      .catch(function () { showError(t("loadFailed")); });
  }

  function paint(rows, likeRows, commentRows) {
    if (!listEl) return;
    listEl.textContent = "";

    // 聚合点赞
    var countByFb = {};
    myLikes = new Set();
    likeRows.forEach(function (r) {
      countByFb[r.feedback_id] = (countByFb[r.feedback_id] || 0) + 1;
      if (r.user_key === visitorKey) myLikes.add(r.feedback_id);
    });
    var commentsByFb = {};
    commentRows.forEach(function (r) {
      commentsByFb[r.feedback_id] = (commentsByFb[r.feedback_id] || 0) + 1;
    });

    if (!rows.length) {
      if (emptyEl) emptyEl.hidden = false;
      return;
    }

    rows.forEach(function (r) {
      listEl.appendChild(buildCard(r, countByFb[r.id] || 0, commentsByFb[r.id] || 0));
    });
  }

  function buildCard(row, likeCount, commentCount) {
    var card = el("article", "wall-card");
    var head = el("div", "wall-card-head");
    var name = row.name || t("anonymous");
    head.appendChild(el("span", "wall-card-name", name));
    head.appendChild(el("span", "wall-card-time", fmtTime(row.created_at)));
    card.appendChild(head);

    var meta = el("div", "wall-card-meta");
    meta.appendChild(el("span", "wall-card-tag", row.relation || ""));
    meta.appendChild(el("span", "wall-card-tag", row.device || ""));
    card.appendChild(meta);

    card.appendChild(el("p", "wall-card-message", row.message));

    var foot = el("div", "wall-card-foot");

    // 点赞按钮
    var likeBtn = el("button", "wall-btn wall-like" + (myLikes.has(row.id) ? " is-liked" : ""),
      (myLikes.has(row.id) ? "♥ " : "♡ ") + likeCount);
    likeBtn.type = "button";
    likeBtn.setAttribute("aria-label", t("like"));
    likeBtn.addEventListener("click", function () { toggleLike(row.id, likeBtn); });
    foot.appendChild(likeBtn);

    // 评论按钮（展开评论区）
    var cmtBtn = el("button", "wall-btn wall-cmt", "💬 " + commentCount);
    cmtBtn.type = "button";
    cmtBtn.setAttribute("aria-label", t("comment"));
    var cmtArea = el("div", "wall-comments");
    cmtArea.hidden = true;
    cmtBtn.addEventListener("click", function () {
      cmtArea.hidden = !cmtArea.hidden;
      if (!cmtArea.hidden && !cmtArea.dataset.loaded) {
        cmtArea.dataset.loaded = "1";
        loadComments(row.id, cmtArea);
      }
    });
    foot.appendChild(cmtBtn);

    // 主人「下架」按钮
    if (isOwner) {
      var delistBtn = el("button", "wall-btn wall-delist", t("delist"));
      delistBtn.type = "button";
      delistBtn.addEventListener("click", function () { delist(row.id, card); });
      foot.appendChild(delistBtn);
    }

    card.appendChild(foot);
    card.appendChild(cmtArea);
    return card;
  }

  function showError(msg) {
    if (listEl) listEl.textContent = "";
    if (emptyEl) emptyEl.hidden = true;
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  /* ---------------- 点赞 ---------------- */
  function toggleLike(id, btn) {
    if (busy) return;
    var sb = getClient();
    if (!sb) return;
    var mine = myLikes && myLikes.has(id);
    busy = true;
    btn.disabled = true;

    var op = mine
      ? sb.from("feedback_likes").delete().eq("feedback_id", id).eq("user_key", visitorKey)
      : sb.from("feedback_likes").insert({ feedback_id: id, user_key: visitorKey });

    op.then(function (res) {
      busy = false;
      btn.disabled = false;
      if (res && res.error) return;
      if (mine) { myLikes.delete(id); btn.classList.remove("is-liked"); }
      else { myLikes.add(id); btn.classList.add("is-liked"); }
      var n = parseInt(btn.textContent.replace(/[^\d]/g, ""), 10) || 0;
      btn.textContent = (myLikes.has(id) ? "♥ " : "♡ ") + (mine ? Math.max(0, n - 1) : n + 1);
    }).catch(function () {
      busy = false;
      btn.disabled = false;
    });
  }

  /* ---------------- 评论 ---------------- */
  function loadComments(id, container) {
    var sb = getClient();
    if (!sb) return;
    container.textContent = "";
    container.appendChild(el("p", "wall-loading", t("loading")));
    sb.from("feedback_comments")
      .select("id,name,message,created_at")
      .eq("feedback_id", id)
      .order("created_at", { ascending: true })
      .then(function (res) {
        container.textContent = "";
        if (res && res.error) return;
        var rows = res.data || [];
        if (!rows.length) {
          container.appendChild(el("p", "wall-no-comments", t("noComments")));
        } else {
          rows.forEach(function (c) {
            var item = el("div", "wall-comment");
            var top = el("div", "wall-comment-top");
            top.appendChild(el("span", "wall-comment-name", c.name || t("anonymous")));
            top.appendChild(el("span", "wall-comment-time", fmtTime(c.created_at)));
            item.appendChild(top);
            item.appendChild(el("p", "wall-comment-message", c.message));
            container.appendChild(item);
          });
        }
        container.appendChild(buildCommentForm(id, container));
      })
      .catch(function () {
        container.textContent = "";
        container.appendChild(el("p", "wall-loading", t("commentFailed")));
      });
  }

  function buildCommentForm(id, container) {
    var formEl = el("form", "wall-comment-form");
    var nameInput = el("input", "wall-comment-name-input");
    nameInput.type = "text";
    nameInput.maxLength = 40;
    nameInput.placeholder = t("commentNamePlaceholder");
    try { nameInput.value = localStorage.getItem(COMMENT_NAME_STORAGE) || ""; } catch (e) { /* ignore */ }

    var msgInput = el("textarea", "wall-comment-msg");
    msgInput.maxLength = MAX_COMMENT;
    msgInput.rows = 2;
    msgInput.placeholder = t("commentPlaceholder");

    var submitBtn = el("button", "wall-btn wall-cmt-submit", t("commentSubmit"));
    submitBtn.type = "submit";

    formEl.appendChild(nameInput);
    formEl.appendChild(msgInput);
    formEl.appendChild(submitBtn);

    formEl.addEventListener("submit", function (e) {
      e.preventDefault();
      if (busy) return;
      var message = (msgInput.value || "").trim();
      if (!message) return;
      if (message.length > MAX_COMMENT) return;
      var sb = getClient();
      if (!sb) return;
      busy = true;
      submitBtn.disabled = true;
      var name = (nameInput.value || "").trim().slice(0, 40);
      try {
        if (name) localStorage.setItem(COMMENT_NAME_STORAGE, name);
      } catch (e2) { /* ignore */ }
      sb.from("feedback_comments")
        .insert({ feedback_id: id, name: name || null, message: message })
        .then(function (res) {
          busy = false;
          submitBtn.disabled = false;
          if (res && res.error) return;
          msgInput.value = "";
          loadComments(id, container);
        })
        .catch(function () {
          busy = false;
          submitBtn.disabled = false;
        });
    });
    return formEl;
  }

  /* ---------------- 主人下架 ---------------- */
  function delist(id, card) {
    var sb = getClient();
    if (!sb) return;
    if (!window.confirm(t("confirmDelist"))) return;
    sb.from("feedback")
      .update({ listed: false })
      .eq("id", id)
      .then(function (res) {
        if (res && res.error) return;
        if (card && card.parentNode) card.parentNode.removeChild(card);
      });
  }

  init();
})();
