// Authored fictional evidence, separate from the real customer story.
import { stormwaterResponse } from './pursuit-example.mjs';
import { complianceSources, complianceRows, complianceWorkbook } from './compliance-example.mjs';

const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const question = 'On Hickory Lane, which drainage-design activities did Maya personally lead, and which responsibilities remained with the project principal? Confirm the wording we can use in her pursuit résumé.';
const annotatedParagraphs = [
  { text: stormwaterResponse.comparison[1].paragraphs[0], refs: ['P1', 'P2', 'P3'] },
  { text: stormwaterResponse.comparison[1].paragraphs[1], refs: ['E1', 'D1'] },
];
const sourceLinks = ids => ids.map(id => `<a class="evidence-ref" href="#stormwater-response-${id.toLowerCase()}">${id}</a>`).join(' · ');
export const fictionalPacketPath = 'downloads/fictional-pursuit-packet.txt';
export const fictionalPacket = {
  label: 'Authored fictional example, not a live product capture or customer result.',
  requirement: stormwaterResponse.requirement,
  sources: stormwaterResponse.sources,
  expertQuestion: question,
  response: annotatedParagraphs,
  addendum: complianceSources.filter(([id]) => id.startsWith('Addendum')),
  affectedChecks: complianceRows.filter(({ id }) => ['M02', 'M03', 'M04'].includes(id)),
};
export const packetText = `FICTIONAL PURSUIT EXAMPLE\n${fictionalPacket.label}\n\n${fictionalPacket.requirement}\n\nSOURCE RECORDS\n${fictionalPacket.sources.map(([id, title, text]) => `${id} — ${title}\n${text}`).join('\n\n')}\n\nEXPERT QUESTION\n${question}\n\nRESPONSE EXCERPT\n${annotatedParagraphs.map(({ text, refs }) => `${text} [${refs.join(', ')}]`).join('\n\n')}\n\nADDENDUM\n${fictionalPacket.addendum.map(([id, title, text]) => `${id} — ${title}\n${text}`).join('\n\n')}\n\nREOPENED WORK\n${fictionalPacket.affectedChecks.map(r => `${r.id} — ${r.requirement}\n${r.status}: ${r.action}`).join('\n\n')}\n`;

export function renderResponseWalkthrough() {
  return `<div data-worked-example="stormwater-response">
  <p class="example-disclosure">${esc(fictionalPacket.label)}</p>
  <p>${esc(stormwaterResponse.requirement)}</p>
  <ol class="trace-list">
    <li><h3>1. Select the relevant project evidence</h3><p>Hickory Lane and Westgate match the existing-road constraints. Cedar Run needs its closeout record before it can complete the three-project set. The larger Eastfield project is greenfield work and makes a less direct case for this assignment.</p><p>${sourceLinks(['R1', 'P1', 'P2', 'P3', 'P4'])}</p></li>
    <li><h3>2. Resolve the question the résumé cannot answer</h3><p>Maya is listed on Hickory Lane, but the project sheet does not explain her responsibilities. The focused question to the project principal is</p><blockquote>${esc(question)}</blockquote><p>The principal confirms she led drainage design, utility-conflict review, and access-phasing drawings. Overall project management remained with the principal. A separate practice-leader confirmation establishes availability.</p><p>${sourceLinks(['P1', 'E1', 'C1'])}</p></li>
    <li><h3>3. Draft the case with traceable support</h3>${annotatedParagraphs.map(({ text, refs }) => `<blockquote>${esc(text)}</blockquote><p>${sourceLinks(refs)}</p>`).join('')}<p>The proposed early county review is an approved approach, not a claimed past result. The pursuit owner reviews the assembled response before submission.</p></li>
    <li><h3>4. Reopen the affected work when an addendum arrives</h3><p>Addendum 1 replaces Team Form A with Rev 1 and adds an availability field. The role and capacity answers still hold, but the team must carry availability into the revised form, replace the old attachment, and check the addendum acknowledgment. Those checks remain open until reviewed.</p><p><a class="evidence-ref" href="#addendum-records">Read the fictional addendum</a> · <a class="evidence-ref" href="/rfp-compliance-matrix/#worksheet">Inspect the affected matrix rows</a></p></li>
  </ol>
  <div class="proof-links"><a class="btn btn-primary" href="/${fictionalPacketPath}" download>Download the worked example</a><a class="btn" href="/${complianceWorkbook}" download>Download the compliance worksheet</a></div>
  <details class="proof-details"><summary>Project records and expert confirmations</summary><dl class="source-list">${stormwaterResponse.sources.map(([id, title, text]) => `<div id="stormwater-response-${id.toLowerCase()}"><dt>${esc(id)} · ${esc(title)}</dt><dd>${esc(text)}</dd></div>`).join('')}</dl></details>
  <details class="proof-details" id="addendum-records"><summary>RFQ and addendum excerpts</summary><dl class="source-list">${complianceSources.map(([id, title, text]) => `<div><dt>${esc(id)} · ${esc(title)}</dt><dd>${esc(text)}</dd></div>`).join('')}</dl></details>
  </div>`;
}
