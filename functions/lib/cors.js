// Shared CORS allowlist for HTTP functions: the live site, Firebase
// preview channels, and local dev/emulator hosts. Non-browser callers
// (AI agents, curl) send no Origin header and are unaffected.
const ALLOWED_ORIGIN_RE = new RegExp(
    "^(https://propagent\\.ai" +
    "|https://propagentlanding(--[\\w-]+)?\\.web\\.app" +
    "|https://propagentlanding\\.firebaseapp\\.com" +
    "|http://localhost:\\d+" +
    "|http://127\\.0\\.0\\.1:\\d+)$",
);

/**
 * Apply CORS headers and answer preflight requests.
 * @param {Object} req - HTTP request
 * @param {Object} res - HTTP response
 * @return {boolean} true if the request was a preflight and was handled
 */
const applyCors = (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGIN_RE.test(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
  }
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Max-Age", "3600");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  return false;
};

module.exports = {ALLOWED_ORIGIN_RE, applyCors};
