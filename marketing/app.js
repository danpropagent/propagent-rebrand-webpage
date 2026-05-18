// Propagent v12 — terminal hero animation (mirrors v10 Hero.tsx pattern)

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const HERO_SCRIPT = [
  { kind: "system", text: "pursuit.start  ·  firm=meridian-ae  ·  surface=teams" },
  { kind: "tool",   name: "bid.intake",      args: 'rfp="tacoma-sd10-mod-2026.pdf"',  dur: "1.4s" },
  { kind: "result", text: "voice of the customer separated from raw requirements" },
  { kind: "agent",  text: "Issuer is evaluating continuity, local coordination, and risk control. Bid intake is clean." },
  { kind: "tool",   name: "gap.analyze",     args: "against=firm.expertise",          dur: "920ms" },
  { kind: "result", text: "34/38 requirements covered · 4 gaps in seismic narrative" },
  { kind: "agent",  text: "Where the firm is strong, weak, or exposed is now visible. Two gaps need routing." },
  { kind: "tool",   name: "decision.gono",   args: "fit=high, risk=medium",           dur: "210ms" },
  { kind: "result", text: "go / no-go: pursue with caveats · confidence 0.72" },
  { kind: "agent",  text: "Deciding what not to pursue is almost as important. This one passes. Routing experts now." },
  { kind: "tool",   name: "route.confidence",args: "low=[civic, fee]",                dur: "180ms" },
  { kind: "result", text: "2 scoped questions to market lead + principal · not a packet review" },
  { kind: "agent",  text: "Drafting in the firm's voice. Every claim grounded, every contradiction surfaced." },
  { kind: "tool",   name: "response.maturity", args: "grounding=on, review=visible",  dur: "3.1s" },
  { kind: "result", text: "tacoma_sd10_response.docx · 28 pages · 41 cited sources" },
  { kind: "agent",  text: "Ready for human review. The pursuit got sharper. Every edit feeds operational memory." },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeLineEl(line) {
  const row = document.createElement("div");
  row.className = "t-line";

  const prefix = document.createElement("div");
  prefix.className = `t-prefix ${line.kind}`;
  prefix.textContent =
    line.kind === "tool"   ? "tool" :
    line.kind === "result" ? "→"    :
    line.kind === "system" ? "sys"  :
    line.kind === "user"   ? "you"  : "agent";
  row.appendChild(prefix);

  const text = document.createElement("div");
  text.className = "t-text";

  if (line.kind === "tool") {
    const card = document.createElement("span");
    card.className = "t-tool-card";
    card.innerHTML = `<span style="color:#fff">${line.name}</span>` +
                     `<span class="args">(${line.args})</span>` +
                     `<span class="dur">${line.dur}</span>`;
    text.appendChild(card);
  } else if (line.kind === "result") {
    text.innerHTML = `<span class="ok">✓</span> ${line.text}`;
  } else if (line.kind === "system") {
    text.innerHTML = `<span class="dim">${line.text}</span>`;
  } else {
    text.textContent = line.text;
  }

  row.appendChild(text);
  return row;
}

async function runTerminal() {
  const body = document.getElementById("terminal-body");
  const status = document.getElementById("terminal-status");
  if (!body) return;

  if (prefersReducedMotion) {
    HERO_SCRIPT.forEach((line) => body.appendChild(makeLineEl(line)));
    if (status) status.textContent = `${HERO_SCRIPT.length} steps`;
    return;
  }

  for (let i = 0; i < HERO_SCRIPT.length; i++) {
    const line = HERO_SCRIPT[i];
    if (line.kind === "agent") {
      // typing animation for agent lines
      const row = document.createElement("div");
      row.className = "t-line";
      const prefix = document.createElement("div");
      prefix.className = "t-prefix agent";
      prefix.textContent = "agent";
      const text = document.createElement("div");
      text.className = "t-text";
      row.appendChild(prefix);
      row.appendChild(text);
      body.appendChild(row);
      for (let c = 1; c <= line.text.length; c++) {
        text.textContent = line.text.slice(0, c);
        body.scrollTop = body.scrollHeight;
        await sleep(12 + Math.random() * 14);
      }
    } else {
      body.appendChild(makeLineEl(line));
      body.scrollTop = body.scrollHeight;
    }
    await sleep(line.kind === "tool" ? 380 : line.kind === "result" ? 280 : 320);
  }
  if (status) status.textContent = `${HERO_SCRIPT.length} steps · ready`;
}

runTerminal();
