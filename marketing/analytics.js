/* Propagent analytics (Umami Cloud — MIT-licensed, free Hobby tier).
 *
 * Segments AI-referred visits and tags conversions with the channel.
 * Umami's script must load before this file (both defer, document order).
 * A window.plausible shim keeps ask.js's tracking calls working unchanged.
 *
 * Known limits: AI apps often strip referrers — 35-70% of AI sessions land
 * as Direct, so "AI Visit" is a lower bound, not a total. Booking runs on a
 * Google Calendar appointment schedule (/30min-meeting), whose embed emits
 * no completion event — "Booking Click" is click-level intent only; actual
 * bookings live in Google Calendar. "Ask CTA Click" (fired in ask.js) is
 * the concierge-funnel signal.
 */
(function () {
  "use strict";

  var track = function (name, props) {
    if (window.umami && window.umami.track) {
      window.umami.track(name, props);
    }
  };

  // Shim so existing plausible-style call sites (ask.js) work unchanged.
  window.plausible = function (name, opts) {
    track(name, opts && opts.props);
  };

  // ---- AI channel detection --------------------------------------------
  // Referrer hosts are suffix-matched; utm_source is substring-matched
  // (ChatGPT sends utm_source=chatgpt.com).
  var AI_REFERRERS = [
    ["chatgpt.com", "chatgpt"],
    ["chat.openai.com", "chatgpt"],
    ["perplexity.ai", "perplexity"],
    ["claude.ai", "claude"],
    ["copilot.microsoft.com", "copilot"],
    ["gemini.google.com", "gemini"],
    ["chat.deepseek.com", "deepseek"],
    ["deepseek.com", "deepseek"],
    ["grok.com", "grok"],
    ["meta.ai", "meta"],
    ["chat.mistral.ai", "mistral"],
    ["you.com", "you"],
    ["duck.ai", "duckai"],
  ];
  var AI_UTM = [
    "chatgpt", "openai", "perplexity", "claude", "copilot",
    "gemini", "deepseek", "grok",
  ];

  function detectAiSource() {
    try {
      var utm = new URLSearchParams(location.search).get("utm_source");
      if (utm) {
        utm = utm.toLowerCase();
        for (var i = 0; i < AI_UTM.length; i++) {
          if (utm.indexOf(AI_UTM[i]) !== -1) return AI_UTM[i];
        }
      }
      if (document.referrer) {
        var host = new URL(document.referrer).hostname.toLowerCase();
        for (var j = 0; j < AI_REFERRERS.length; j++) {
          var ref = AI_REFERRERS[j][0];
          if (host === ref || host.slice(-(ref.length + 1)) === "." + ref) {
            return AI_REFERRERS[j][1];
          }
        }
      }
    } catch (e) { /* URL parsing never breaks the page */ }
    return null;
  }

  function channel() {
    try {
      return sessionStorage.getItem("pa-channel") || "human";
    } catch (e) {
      return "human";
    }
  }

  var source = detectAiSource();
  if (source) {
    try { sessionStorage.setItem("pa-channel", source); } catch (e) { /* ok */ }
    // Umami may not have initialized yet on a cold cache; retry on load.
    if (window.umami) {
      track("AI Visit", {source: source});
    } else {
      window.addEventListener("load", function () {
        track("AI Visit", {source: source});
      });
    }
  }

  // ---- Conversions, tagged with channel --------------------------------

  // Booking CTA clicks (completion isn't observable from the Google
  // Calendar embed; real bookings show up in Google Calendar).
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest &&
      e.target.closest("a[href*='30min-meeting'], a[href$='#contact']");
    if (a) {
      track("Booking Click", {channel: channel()});
    }
  });

  // RFP Grader lead magnet clicks.
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest("a[href^='/rfp-grader']");
    if (a) {
      track("Grader Click", {channel: channel()});
    }
  });
})();
