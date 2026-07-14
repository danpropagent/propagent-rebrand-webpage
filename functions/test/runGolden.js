// Golden-set eval for the /api/ask concierge. Calls the live model — run
// manually before any deploy that touches the prompt, corpus, or model:
//
//   ASK_URL=http://127.0.0.1:5001/propagentlanding/us-central1/ask \
//     node test/runGolden.js
//
// Exits non-zero when any case fails. Not CI.
const fs = require("fs");
const path = require("path");

const ASK_URL = process.env.ASK_URL || "http://127.0.0.1:5000/api/ask";
const golden = JSON.parse(
    fs.readFileSync(path.join(__dirname, "golden.json"), "utf8"));

// Golden regexes use "(?i)..." for readability; translate to JS flags.
const toRegExp = (pattern) => {
  if (pattern.startsWith("(?i)")) return new RegExp(pattern.slice(4), "i");
  return new RegExp(pattern);
};

/**
 * Run one golden case against the endpoint.
 * @param {Object} c - Golden case {id, message, history, expect}
 * @return {Promise<{id: string, pass: boolean, notes: Array<string>}>} Result
 */
const runCase = async (c) => {
  const notes = [];
  let body;
  try {
    const res = await fetch(ASK_URL, {
      method: "POST",
      headers: {"content-type": "application/json"},
      body: JSON.stringify({
        message: c.message,
        history: c.history || [],
        agent: true,
        page: "/golden-test",
      }),
    });
    if (res.status !== 200) {
      return {id: c.id, pass: false, notes: [`HTTP ${res.status}`]};
    }
    body = await res.json();
  } catch (e) {
    return {id: c.id, pass: false, notes: [`request failed: ${e.message}`]};
  }

  const answer = body.answer || "";
  const exp = c.expect || {};
  for (const p of exp.mustMatch || []) {
    if (!toRegExp(p).test(answer)) notes.push(`missing /${p}/`);
  }
  for (const p of exp.mustNotMatch || []) {
    if (toRegExp(p).test(answer)) notes.push(`forbidden /${p}/ matched`);
  }
  if (exp.escalate !== undefined && body.escalate !== exp.escalate) {
    notes.push(`escalate=${body.escalate}, want ${exp.escalate}`);
  }
  if (exp.ctaType !== undefined &&
      (!body.cta || body.cta.type !== exp.ctaType)) {
    notes.push(`cta=${body.cta && body.cta.type}, want ${exp.ctaType}`);
  }
  if (notes.length) notes.push(`answer: ${answer.slice(0, 160)}`);
  return {id: c.id, pass: notes.length === 0, notes};
};

(async () => {
  console.log(`Golden set vs ${ASK_URL} (${golden.cases.length} cases)\n`);
  let failed = 0;
  for (const c of golden.cases) {
    const r = await runCase(c);
    console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.id}`);
    if (!r.pass) {
      failed += 1;
      for (const n of r.notes) console.log(`      ${n}`);
    }
  }
  console.log(`\n${golden.cases.length - failed}/${golden.cases.length} passed`);
  process.exit(failed ? 1 : 0);
})();
