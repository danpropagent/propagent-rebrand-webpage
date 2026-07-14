/* Ask Propagent — floating concierge widget.
 *
 * Progressive enhancement: injects all of its own DOM (no-JS visitors see
 * nothing, no layout shift). Talks to POST /api/ask, which answers only
 * from published site facts. Model output is rendered with textContent —
 * it never touches innerHTML. CTA URLs come from the server's fixed map
 * and are scheme-checked again here.
 */
(function () {
  "use strict";

  var API = "/api/ask";
  var MAX_TURNS = 6;
  var MOBILE_Q = "(max-width: 639px)";

  var track = function (name, props) {
    if (window.plausible) window.plausible(name, props ? {props: props} : undefined);
  };

  var sessionId = null;
  try {
    sessionId = sessionStorage.getItem("ask-session");
    if (!sessionId && window.crypto && crypto.randomUUID) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("ask-session", sessionId);
    }
  } catch (e) { /* private mode: stateless is fine */ }

  // ---- DOM ---------------------------------------------------------------
  var el = function (tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text) n.textContent = text;
    return n;
  };

  var launcher = el("button", "ask-launcher");
  launcher.type = "button";
  launcher.setAttribute("aria-haspopup", "dialog");
  launcher.setAttribute("aria-expanded", "false");
  launcher.appendChild(el("span", "ask-dot"));
  launcher.appendChild(el("span", null, "Ask Propagent"));

  var panel = el("div", "ask-panel");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Ask Propagent");
  panel.hidden = true;

  var head = el("div", "ask-head");
  var headTitle = el("div", "ask-head-title");
  headTitle.appendChild(el("span", "ask-dot"));
  headTitle.appendChild(el("span", null, "Ask Propagent"));
  var closeBtn = el("button", "ask-close");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.textContent = "×";
  head.appendChild(headTitle);
  head.appendChild(closeBtn);

  var log = el("div", "ask-msgs");
  log.setAttribute("role", "log");
  log.setAttribute("aria-live", "polite");

  // Thinking indicator lives OUTSIDE the live region so it never spams
  // screen readers.
  var thinking = el("div", "ask-thinking");
  thinking.setAttribute("aria-hidden", "true");
  thinking.textContent = "thinking…";
  thinking.hidden = true;

  var chips = el("div", "ask-chips");
  ["What does Propagent do?", "How much does it cost?", "How is my data handled?"]
      .forEach(function (q) {
        var chip = el("button", "ask-chip", q);
        chip.type = "button";
        chip.addEventListener("click", function () { send(q); });
        chips.appendChild(chip);
      });

  var form = el("form", "ask-form");
  var input = el("input", "ask-input");
  input.type = "text";
  input.maxLength = 1500;
  input.placeholder = "Ask about Propagent…";
  input.setAttribute("aria-label", "Your question");
  var sendBtn = el("button", "ask-send", "Send");
  sendBtn.type = "submit";
  form.appendChild(input);
  form.appendChild(sendBtn);

  var foot = el("div", "ask-foot",
      "Answers come from published Propagent info · Conversations are logged");

  panel.appendChild(head);
  panel.appendChild(log);
  panel.appendChild(thinking);
  panel.appendChild(chips);
  panel.appendChild(form);
  panel.appendChild(foot);

  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  // ---- Conversation state ------------------------------------------------
  var history = [];
  var pending = false;

  var addMsg = function (role, text) {
    var m = el("div", "ask-msg" + (role === "user" ? " user" : ""), text);
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    return m;
  };

  var addCta = function (cta) {
    if (!cta || typeof cta.url !== "string" || typeof cta.label !== "string") return;
    // Defense in depth: same-site paths and the founder mailto only.
    var ok = cta.url.indexOf("/") === 0 || cta.url === "mailto:daniel@propagent.ai";
    if (!ok) return;
    var a = el("a", "ask-cta", cta.label + " →");
    a.href = cta.url;
    a.addEventListener("click", function () {
      track("Ask CTA Click", {type: cta.type || "unknown"});
      if (cta.url.indexOf("/#") === 0) close();
    });
    log.appendChild(a);
    log.scrollTop = log.scrollHeight;
  };

  var send = function (text) {
    if (pending) return;
    text = (text || "").trim();
    if (!text) return;
    pending = true;
    input.value = "";
    input.disabled = true;
    sendBtn.disabled = true;
    chips.hidden = true;
    addMsg("user", text);
    thinking.hidden = false;
    track("Ask Sent");

    var body = {
      message: text,
      history: history.slice(-MAX_TURNS),
      agent: false,
      page: location.pathname,
    };
    if (sessionId) body.sessionId = sessionId;

    fetch(API, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body),
    }).then(function (res) {
      if (res.status === 429 || res.status === 503) {
        var capacity = "We're at capacity right now — email " +
          "daniel@propagent.ai or book a proposal review below.";
        addMsg("assistant", capacity);
        addCta({type: "demo", label: "Book a 30-min proposal review", url: "/#contact"});
        return null;
      }
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    }).then(function (data) {
      if (!data) return;
      history.push({role: "user", text: text});
      history.push({role: "assistant", text: data.answer});
      addMsg("assistant", data.answer);
      addCta(data.cta);
    }).catch(function () {
      addMsg("assistant",
          "Something went wrong on my end — mind trying that again?");
    }).then(function () {
      pending = false;
      thinking.hidden = true;
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    });
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    send(input.value);
  });

  // ---- Open/close + focus management ------------------------------------
  var isMobile = function () {
    return window.matchMedia && window.matchMedia(MOBILE_Q).matches;
  };

  var open = function () {
    panel.hidden = false;
    launcher.hidden = true;
    launcher.setAttribute("aria-expanded", "true");
    if (isMobile()) panel.setAttribute("aria-modal", "true");
    else panel.removeAttribute("aria-modal");
    input.focus();
    track("Ask Opened");
  };

  var close = function () {
    panel.hidden = true;
    launcher.hidden = false;
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  };

  launcher.addEventListener("click", open);
  closeBtn.addEventListener("click", close);

  document.addEventListener("keydown", function (e) {
    if (panel.hidden) return;
    if (e.key === "Escape") {
      close();
      return;
    }
    // Focus trap on the mobile sheet (it overlays the page there).
    if (e.key === "Tab" && isMobile()) {
      var focusables = panel.querySelectorAll("button, input, a[href]");
      var list = [];
      for (var i = 0; i < focusables.length; i++) {
        if (!focusables[i].disabled && focusables[i].offsetParent !== null) {
          list.push(focusables[i]);
        }
      }
      if (!list.length) return;
      var first = list[0];
      var last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Warm the function's cold start while the user is still deciding.
  var warmed = false;
  launcher.addEventListener("mouseenter", function () {
    if (warmed) return;
    warmed = true;
    fetch(API, {method: "OPTIONS"}).catch(function () { /* best effort */ });
  });
})();
