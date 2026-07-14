// Propagent marketing — scroll reveal + count-up (progressive enhancement).
//
// Reveal: targets in REVEAL_SELECTORS fade/rise into view as they enter the
// viewport, staggered when they sit side-by-side in a group. Targets already
// above the fold at load are shown instantly (no hide → no flash). Targets
// below the fold get the hidden .reveal class while off-screen, so a no-JS or
// reduced-motion visitor never sees content disappear.
//
// Count-up: any [data-countup] element animates its leading numeric text from
// zero on first view. Ranges ("60–80"), prefixes ("+30–50"), thousands
// separators ("$1,000"), and trailing unit spans (%, x, /mo) are preserved.

(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  // Elements worth animating in — section headlines, supporting ledes, and the
  // card/row groups. Grouped siblings stagger automatically (see below).
  var REVEAL_SELECTORS = [
    ".bp-head",
    ".bp-quote-card",
    ".customer-band-inner",
    "#how-it-works > .container > h2",
    "#how-it-works > .container > .lede",
    ".moment-row",
    ".benchmarks .bench-label",
    ".bench",
    "#wedge .ps-head",
    "#trust > .container > h2",
    "#trust > .container > .lede",
    ".trust-receipt",
    ".trust-card",
    "#memory > .container > h2",
    "#memory > .container > .lede",
    ".memory-card",
    "#for-your-team > .container > h2",
    "#pricing > .container > h2",
    "#pricing > .container > .lede",
    ".price-card",
    ".contact-copy",
    ".contact-schedule"
  ].join(",");

  // -------------------------------------------------------------------------
  // Scroll reveal
  // -------------------------------------------------------------------------
  function initReveal() {
    var els = Array.prototype.slice.call(
      document.querySelectorAll(REVEAL_SELECTORS)
    );
    if (!els.length) return;

    if (reduce || !hasIO) {
      // Nothing to do — elements keep their natural (final) state.
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.style.transitionDelay = staggerDelay(el) + "ms";
          el.classList.add("is-visible");
          io.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );

    var fold = (window.innerHeight || document.documentElement.clientHeight) * 0.9;
    els.forEach(function (el) {
      if (el.getBoundingClientRect().top < fold) {
        // Already on screen at load: add both classes in one synchronous pass
        // so the computed style settles on the visible state with no transition
        // (and therefore no flash).
        el.classList.add("reveal", "is-visible");
      } else {
        el.classList.add("reveal");
        io.observe(el);
      }
    });
  }

  // Delay a reveal by its position among reveal siblings, so a row of cards
  // cascades instead of popping in together. Capped so long lists don't crawl.
  function staggerDelay(el) {
    var parent = el.parentNode;
    if (!parent) return 0;
    var idx = 0;
    var sibs = parent.children;
    for (var i = 0; i < sibs.length; i++) {
      if (sibs[i] === el) break;
      if (sibs[i].classList && sibs[i].classList.contains("reveal")) idx++;
    }
    return Math.min(idx, 6) * 80;
  }

  // -------------------------------------------------------------------------
  // Count-up
  // -------------------------------------------------------------------------
  var NUM = /\d[\d,]*(?:\.\d+)?/g;
  var COUNT_MS = 1100;

  function leadingNumericNode(el) {
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3 && /\d/.test(n.nodeValue)) return n;
    }
    return null;
  }

  // Split "$1,000" / "+30–50" into ordered tokens, marking which are numbers.
  function parseCountup(el) {
    var node = leadingNumericNode(el);
    if (!node) return null;

    var str = node.nodeValue;
    var tokens = [];
    var last = 0;
    var hasNum = false;
    var m;
    NUM.lastIndex = 0;
    while ((m = NUM.exec(str))) {
      if (m.index > last) {
        tokens.push({ num: false, raw: str.slice(last, m.index) });
      }
      var raw = m[0];
      var dot = raw.indexOf(".");
      tokens.push({
        num: true,
        target: parseFloat(raw.replace(/,/g, "")),
        grouped: raw.indexOf(",") >= 0,
        dec: dot >= 0 ? raw.length - dot - 1 : 0
      });
      hasNum = true;
      last = m.index + raw.length;
    }
    if (last < str.length) tokens.push({ num: false, raw: str.slice(last) });
    if (!hasNum) return null;

    return { node: node, tokens: tokens };
  }

  function formatNumber(value, token) {
    if (token.dec > 0) return value.toFixed(token.dec);
    var rounded = Math.round(value);
    return token.grouped ? rounded.toLocaleString("en-US") : String(rounded);
  }

  function renderCountup(data, progress) {
    var out = "";
    for (var i = 0; i < data.tokens.length; i++) {
      var t = data.tokens[i];
      out += t.num ? formatNumber(t.target * progress, t) : t.raw;
    }
    data.node.nodeValue = out;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateCountup(data) {
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / COUNT_MS, 1);
      renderCountup(data, easeOutCubic(p));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function initCountup() {
    var els = Array.prototype.slice.call(
      document.querySelectorAll("[data-countup]")
    );
    if (!els.length) return;

    // Reduced motion / no IntersectionObserver: leave the final values in place.
    if (reduce || !hasIO) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var data = entry.target._countup;
          io.unobserve(entry.target);
          if (data) animateCountup(data);
        });
      },
      { threshold: 0.4 }
    );

    els.forEach(function (el) {
      var data = parseCountup(el);
      if (!data) return;
      el._countup = data;
      renderCountup(data, 0); // prime to zero before it scrolls into view
      io.observe(el);
    });
  }

  initReveal();
  initCountup();
})();
