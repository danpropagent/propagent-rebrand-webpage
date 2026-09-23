// Authored illustration, not a product capture. All records and people are fictional.
const disclosure = 'Illustrative pursuit using fictional projects, people, and records; not a live product capture or customer result.';
const requirement = 'A county is selecting an engineering team for stormwater improvements along existing roads. Its fictional RFQ requires three comparable projects completed within five years, the proposed manager’s responsibilities and availability, and an approach to drainage design around existing utilities and access constraints.';

const sources = [
  ['R1', 'County RFQ · sections 3.2–3.4', requirement],
  ['P1', 'Hickory Lane drainage improvements · 2023 project sheet', 'Completed drainage design along an existing neighborhood road. The firm designed replacement storm drains and inlets, coordinated utility conflicts, and developed construction phasing to maintain driveway access. Maya Chen is listed on the team, but her responsibilities are not recorded.'],
  ['P2', 'Westgate culvert replacement · 2024 project sheet', 'Completed culvert replacement design beneath an existing county road. The firm coordinated utility crossings, temporary traffic arrangements, and drainage tie-ins. The approved project sheet and client reference are available.'],
  ['P3', 'Cedar Run drainage retrofit · 2022 closeout record', 'Completed drainage retrofit design within an existing road corridor, including utility coordination and property-access constraints. At initial qualification, this record is still with the project lead; the proposal library contains only a short project listing.'],
  ['P4', 'Eastfield development · 2024 project sheet', 'A larger greenfield subdivision drainage project. It demonstrates drainage design experience, but not work around an operating road’s existing utilities and access constraints.'],
  ['E1', 'Hickory Lane project principal · confirmed role', 'Maya was drainage design lead. She coordinated the utility-conflict review and developed the access-phasing drawings. The principal retained overall project management. Maya’s pursuit résumé is updated to describe that role accurately.'],
  ['C1', 'Practice leader · capacity confirmation', 'The practice leader confirms Maya’s availability for the anticipated assignment after reviewing her existing commitments. Any change to the assignment schedule requires a fresh capacity check.'],
  ['D1', 'Pursuit principal · approved direction', 'After P3, E1, and C1 are confirmed, approve the pursuit using Hickory Lane, Westgate, and Cedar Run. Lead with existing-road constraints, not contract size. Propose an early review of drainage tie-ins, utility conflicts, and access requirements with the county. The final statement of qualifications still requires review and approval.'],
];

export const stormwaterResponse = {
  id: 'stormwater-response', disclosure, requirement,
  comparison: [
    { label: 'A familiar starting point', title: 'Lead with the biggest project.', paragraphs: ['Our team brings extensive stormwater experience, including the Eastfield development. Proposed project manager Maya Chen has a proven track record delivering complex infrastructure projects.'], note: 'The text names a large project but leaves the county to work out its relevance. It says little about Maya’s contribution or the constraints this assignment brings.' },
    { label: 'A stronger response excerpt', title: 'Lead with the experience this county needs.', paragraphs: ['Hickory Lane, Westgate, and Cedar Run each involved drainage improvements within existing road corridors. Across these projects, our team addressed utility conflicts, drainage tie-ins, and property-access constraints relevant to your assignment.', 'At Hickory Lane, proposed project manager Maya Chen served as drainage design lead, coordinating the utility-conflict review and developing access-phasing drawings. For your assignment, we propose an early review of drainage tie-ins, utility conflicts, and access requirements with county staff before advancing the design.'], note: 'Prepared after project, role, and capacity confirmation. Final submission approval remains with the pursuit owner.' },
  ],
  checkpoints: [
    ['Select the relevant proof', 'Three existing-road projects make the case more directly than the larger greenfield development. Cedar Run’s closeout record supplies the missing third example.'],
    ['Ask for the missing expertise', 'The project principal confirms what Maya led at Hickory Lane. The practice leader checks her availability. Neither answer is inferred from a résumé.'],
    ['Keep the response consistent', 'Update the pursuit résumé with the confirmed role, check it against the narrative, and retain the supporting records for final review.'],
  ],
  sources,
};

export const stormwaterQualification = {
  id: 'stormwater-qualification', disclosure, requirement,
  decision: { label: 'Initial decision', title: 'Hold until the evidence and team are confirmed.', body: 'Hickory Lane and Westgate are ready to use. Cedar Run looks relevant, but its closeout record has not reached the proposal team. Maya’s role on Hickory Lane and her availability need confirmation. The principal authorizes these checks before committing the full proposal team.' },
  checkpoints: [
    ['Hold · resolve the evidence and team questions', 'The technical lead retrieves Cedar Run’s record. The Hickory Lane principal confirms Maya’s responsibilities, and the practice leader checks her capacity. Answers are due at the next morning’s pursuit review.'],
    ['Go · after the confirmations', 'Cedar Run qualifies, Maya’s design-lead role is confirmed, and the practice leader verifies her availability. The principal approves the pursuit and proposed team. Final response approval remains a separate step.'],
    ['No-go · if the requirements cannot be met', 'If no third qualifying project or suitable available manager can be confirmed before the team’s pursuit cutoff, the principal declines. A strong client relationship does not replace a mandatory requirement.'],
  ],
  sources: sources.filter(([id]) => ['R1', 'P1', 'P2', 'P3', 'E1', 'C1', 'D1'].includes(id)),
};

const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
export function renderWorkedExample(example) {
  if (!example) return '';
  return `<div class="worked-example" data-worked-example="${escape(example.id)}">
    <p class="example-disclosure">${escape(example.disclosure)}</p>
    <div class="example-brief"><h3>The opportunity</h3><p>${escape(example.requirement)}</p></div>
    ${example.comparison ? `<div class="example-comparison">${example.comparison.map((card, i) => `<article class="example-card${i ? ' example-card--response' : ''}"><span class="mono-label">${escape(card.label)}</span><h3>${escape(card.title)}</h3>${card.paragraphs.map(p => `<p${i ? ' data-example-response' : ''}>${escape(p)}</p>`).join('')}<p class="example-note">${escape(card.note)}</p></article>`).join('')}</div>` : ''}
    ${example.decision ? `<article class="example-decision"><span class="mono-label">${escape(example.decision.label)}</span><h3>${escape(example.decision.title)}</h3><p>${escape(example.decision.body)}</p></article>` : ''}
    <ol class="example-checkpoints">${example.checkpoints.map(([title, body]) => `<li><h3>${escape(title)}</h3><p>${escape(body)}</p></li>`).join('')}</ol>
    <details class="example-sources" id="${escape(example.id)}-sources"><summary>Read the fictional source records</summary><dl>${example.sources.map(([id, title, body]) => `<div id="${escape(example.id)}-${escape(id.toLowerCase())}"><dt>${escape(id)} · ${escape(title)}</dt><dd>${escape(body)}</dd></div>`).join('')}</dl></details>
  </div>`;
}
