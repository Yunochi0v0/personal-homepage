/* ============================================================
   访客反馈（v1.22）
   - 右下角浮动徽章 → 弹层表单 → Supabase feedback 表（RLS 只允许 INSERT）
   - 表单字段：昵称(可选) / 关系(必选) / 设备(必选) / 内容(必填 ≤1000 字)
   - 提交自动附带网站版本（读 <body data-version>）
   - 防重复提交；失败保留内容可重试；成功后隐藏表单显示 ✓ 面板
   - 安全说明：本文件只含 publishable key（设计上公开的前端配置）；
     secret key / 数据库密码永不进入前端与仓库（详见 supabase/feedback.sql）。
   ============================================================ */
(function () {
  "use strict";

  var SUPABASE_URL = "https://tepsjylpqzdpygknlyij.supabase.co";
  var PUBLISHABLE_KEY = "sb_publishable_o8BDMXzQ8-hkXdPzjga4nw_mYaYIofQ"; // 公开前端配置

  var MAX_MESSAGE = 1000;

  var overlay, modal, badge, closeBtn, form, successBox, submitBtn, errorBox, counterEl;
  var nameEl, relationEl, deviceEl, messageEl, doneBtn;

  var client = null;   // 惰性创建
  var sending = false; // 防重复提交标志
  var onKeydown = null; // Esc 监听：仅弹层打开期间挂载，关闭时移除

  var version = "0.0.0";
  if (document.body && document.body.dataset && document.body.dataset.version) {
    version = document.body.dataset.version;
  }

  function $(id) { return document.getElementById(id); }

  function init() {
    overlay = $("feedbackOverlay");
    modal = $("feedbackModal");
    badge = $("feedbackBadge");
    closeBtn = $("feedbackClose");
    form = $("feedbackForm");
    successBox = $("fbSuccess");
    submitBtn = $("fbSubmit");
    errorBox = $("fbError");
    counterEl = $("fbCounter");
    nameEl = $("fbName");
    relationEl = $("fbRelation");
    deviceEl = $("fbDevice");
    messageEl = $("fbMessage");
    doneBtn = $("fbDone");

    // 结构缺失时静默退出，不影响页面其他功能
    if (!overlay || !badge || !form || !messageEl) return;

    badge.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (doneBtn) doneBtn.addEventListener("click", close);
    overlay.addEventListener("click", onOverlayClick);
    form.addEventListener("submit", onSubmit);
    messageEl.addEventListener("input", updateCounter);
    if (nameEl) nameEl.addEventListener("input", clearErrorOnInput);

    // 加载时即刷新计数器，与 HTML 静态文案保持一致
    updateCounter();
  }

  function getClient() {
    if (client) return client;
    // CDN 加载失败 / 离线时的守卫：不崩溃，提交时给出可理解的提示
    if (typeof window.supabase === "undefined" || !window.supabase.createClient) return null;
    client = window.supabase.createClient(SUPABASE_URL, PUBLISHABLE_KEY);
    return client;
  }

  function open() {
    resetForm();
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    if (onKeydown) window.removeEventListener("keydown", onKeydown);
    onKeydown = function (e) {
      if (e.key === "Escape" || e.keyCode === 27) close();
    };
    window.addEventListener("keydown", onKeydown);
  }

  function close() {
    if (sending) return; // 发送中不允许关闭，避免状态错乱
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    if (onKeydown) {
      window.removeEventListener("keydown", onKeydown);
      onKeydown = null;
    }
  }

  function onOverlayClick(e) {
    if (e.target === overlay && !sending) close();
  }

  function updateCounter() {
    if (!counterEl) return;
    counterEl.textContent = (messageEl.value || "").length + " / " + MAX_MESSAGE;
  }

  function clearErrorOnInput() {
    if (errorBox) errorBox.hidden = true;
  }

  function showError(msg) {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.hidden = false;
  }

  function resetForm() {
    if (form) form.hidden = false;
    if (successBox) successBox.hidden = true;
    if (nameEl) nameEl.value = "";
    if (messageEl) messageEl.value = "";
    if (relationEl) relationEl.selectedIndex = 0;
    if (deviceEl) deviceEl.selectedIndex = 0;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "提交反馈";
    }
    sending = false;
    if (errorBox) errorBox.hidden = true;
    updateCounter();
  }

  function onSubmit(e) {
    e.preventDefault();
    if (sending) return;

    var name = (nameEl && nameEl.value ? nameEl.value : "").trim().slice(0, 40);
    var relation = (relationEl && relationEl.value ? relationEl.value : "").trim();
    var device = (deviceEl && deviceEl.value ? deviceEl.value : "").trim();
    var message = (messageEl && messageEl.value ? messageEl.value : "").trim();

    if (!relation) { showError("请选择你与主页主人的关系"); return; }
    if (!device) { showError("请选择使用的设备"); return; }
    if (!message) { showError("请填写反馈内容"); return; }
    if (message.length > MAX_MESSAGE) { showError("反馈内容不能超过 1000 字"); return; }

    var sb = getClient();
    if (!sb) { showError("后台服务暂时不可用，请稍后重试"); return; }

    sending = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "提交中…";
    }
    if (errorBox) errorBox.hidden = true;

    sb.from("feedback")
      .insert({
        name: name || null,
        relation: relation,
        device: device,
        message: message,
        version: version
      })
      .then(function (res) {
        sending = false;
        if (res && res.error) {
          fail(res.error.message || "提交失败，请稍后重试（内容已保留）");
          return;
        }
        succeed();
      })
      .catch(function (err) {
        sending = false;
        fail(err && err.message ? err.message : "网络异常，提交未完成（内容已保留）");
      });
  }

  function fail(msg) {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "提交反馈";
    }
    showError(msg || "提交失败，请稍后重试（内容已保留）");
  }

  function succeed() {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "提交反馈";
    }
    if (form) form.hidden = true;
    if (successBox) successBox.hidden = false;
  }

  init();
})();
