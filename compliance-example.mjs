import { stormwaterResponse } from './pursuit-example.mjs';

// Authored RFQ excerpts extend the approved fictional stormwater pursuit.
// The same data feeds the public example and the editable workbook.
export const complianceWorkbook = 'downloads/aec-compliance-matrix.xlsx';
export const complianceSources = [
  ['RFQ §2.1', 'Submission instructions', 'Submit the statement of qualifications with Team Form A. Acknowledge each issued addendum.'],
  ['RFQ §3.2', 'Mandatory experience', 'Provide three comparable projects completed within the past five years. State completion year, scope, and the firm’s responsibilities for each project.'],
  ['RFQ §3.3', 'Mandatory team information', 'Name the proposed project manager, describe relevant responsibilities on prior projects, and confirm availability for the anticipated assignment.'],
  ['RFQ §3.4', 'Required and scored technical approach', 'Describe the approach to drainage design along existing roads, including utility conflicts and maintaining property access. Evaluation considers how well the approach addresses these constraints.'],
  ['Addendum 1 §1', 'Revised team form', 'Replace Team Form A with Team Form A (Rev 1), which adds a field for the proposed project manager’s availability. The requirements in §3.3 remain unchanged.'],
  ['Addendum 1 §2', 'Acknowledgment', 'Acknowledge Addendum 1 in the submission checklist. All other instructions remain unchanged.'],
];
export const complianceRows = [
  { id: 'M01', type: 'Mandatory', requirement: 'Three comparable projects completed within five years', source: 'RFQ §3.2', owner: 'Proposal manager', location: 'Qualifications · project sheets', evidence: 'Hickory Lane (2023), Westgate (2024), Cedar Run (2022); P1–P3. Cedar Run closeout is now confirmed.', status: 'Reviewed', action: 'Retain the approved project sheets in the final package.', reviewer: 'Pursuit principal' },
  { id: 'M02', type: 'Mandatory', requirement: 'Manager responsibilities and confirmed availability', source: 'RFQ §3.3; Addendum 1 §1', owner: 'Practice leader', location: 'Team narrative · résumé · Team Form A (Rev 1)', evidence: 'E1 confirms Maya Chen’s drainage-design-lead role. C1 confirms availability. The narrative and résumé are reviewed; the new form field is not.', status: 'Reopened', action: 'Carry C1 into the revised form and have the practice leader check consistency before approval.', reviewer: 'Practice leader · re-review pending' },
  { id: 'S01', type: 'Mandatory + scored', requirement: 'Drainage approach addressing existing utilities and property access', source: 'RFQ §3.4', owner: 'Technical lead', location: 'Technical approach', evidence: 'P1–P3 support relevant experience. The proposed early county review follows D1; it is an approach, not a past result.', status: 'In review', action: 'Check that the required approach is included and addresses the scored criterion—not just the short narrative excerpt.', reviewer: 'Technical lead · pending' },
  { id: 'M03', type: 'Mandatory', requirement: 'Use the revised team form', source: 'RFQ §2.1; Addendum 1 §1', owner: 'Proposal manager', location: 'Attachments · Team Form A (Rev 1)', evidence: 'Original Team Form A was prepared before the addendum. Rev 1 replaces it in the final package.', status: 'Open', action: 'Replace the original form, complete the new field, and check the final attachment set.', reviewer: 'Proposal manager · pending' },
  { id: 'M04', type: 'Mandatory', requirement: 'Acknowledge Addendum 1', source: 'RFQ §2.1; Addendum 1 §2', owner: 'Pursuit owner', location: 'Submission checklist', evidence: 'Addendum 1 is logged. Acknowledgment in the assembled submission remains unchecked.', status: 'Open', action: 'Confirm the acknowledgment in the assembled submission before final approval.', reviewer: 'Pursuit owner · pending' },
];
export const complianceRecords = stormwaterResponse.sources.filter(([id]) => ['P1', 'P2', 'P3', 'E1', 'C1', 'D1'].includes(id));

const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
export function renderComplianceExample() {
  return `<div class="worked-example" data-compliance-example>
    <p class="example-disclosure">Fictional county stormwater RFQ and firm records. This filled example illustrates a working method; it is not a live product capture or customer result.</p>
    <details class="example-sources"><summary>Read the short RFQ and addendum excerpts</summary><dl>${complianceSources.map(([id, title, text]) => `<div><dt>${esc(id)} · ${esc(title)}</dt><dd>${esc(text)}</dd></div>`).join('')}</dl></details>
    <div class="guide-table-wrap" tabindex="0" role="region" aria-label="Filled compliance matrix after Addendum 1"><table class="guide-table"><caption>Filled compliance matrix · after Addendum 1</caption><thead><tr><th scope="col">Requirement and source</th><th scope="col">Owner and response location</th><th scope="col">Evidence</th><th scope="col">Review state and next action</th></tr></thead><tbody>${complianceRows.map(row => `<tr><th scope="row">${esc(row.id)} · ${esc(row.type)}<br>${esc(row.requirement)}<br><small>${esc(row.source)}</small></th><td>${esc(row.owner)}<br>${esc(row.location)}</td><td>${esc(row.evidence)}</td><td><strong>${esc(row.status)}</strong><br>${esc(row.action)}</td></tr>`).join('')}</tbody></table></div>
    <div class="example-comparison">
      <article class="example-card"><span class="mono-label">Before Addendum 1</span><h3>The team information is reviewed.</h3><p>M02 has confirmed role and availability records. The original Team Form A is prepared. Final assembly is still pending.</p></article>
      <article class="example-card example-card--response"><span class="mono-label">After Addendum 1</span><h3>The new form reopens the check.</h3><p>M02 returns to review because availability must also appear on Rev 1. M03 changes the required attachment. M04 adds the acknowledgment check. M01 and S01 are unchanged by this addendum.</p></article>
    </div>
    <p><strong>Ready for submission is a separate decision.</strong> Close the mandatory items, review the scored response, reconcile the final attachments, and record the pursuit owner’s approval. A populated matrix is not an approved submission.</p>
    <details class="example-sources"><summary>Read the fictional firm evidence</summary><dl>${complianceRecords.map(([id, title, text]) => `<div><dt>${esc(id)} · ${esc(title)}</dt><dd>${esc(text)}</dd></div>`).join('')}</dl></details>
  </div>`;
}
