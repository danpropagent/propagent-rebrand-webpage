/* Propagent analytics (Plausible).
 *
 * Segments AI-referred visits and tags conversions with the channel.
 * Known limits: AI apps often strip referrers — 35-70% of AI sessions land
 * as Direct, so "AI Visit" is a lower bound, not a total. The concierge's
 * demo CTA points at /#contact (the Calendly embed), so concierge-driven
 * bookings DO fire "Booking Complete"; "Ask CTA Click" (fired in ask.js)
 * is the earlier-funnel signal.
 */
(function () {
  "use strict";

  // Queue stub: safe if the Plausible script is blocked or still loading.
  window.plausible = window.plausible || function () {
    (window.plausible.q = window.plausible.q || []).push(arguments);
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
    window.plausible("AI Visit", { props: { source: source } });
  }

  // ---- Conversions, tagged with channel --------------------------------

  // Calendly inline widget: booking completed.
  window.addEventListener("message", function (e) {
    if (e.origin !== "https://calendly.com") return;
    if (e.data && e.data.event === "calendly.event_scheduled") {
      window.plausible("Booking Complete", { props: { channel: channel() } });
    }
  });

  // RFP Grader lead magnet clicks.
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest("a[href^='/rfp-grader']");
    if (a) {
      window.plausible("Grader Click", { props: { channel: channel() } });
    }
  });
})();
