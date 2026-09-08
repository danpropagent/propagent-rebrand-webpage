import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const worksheetFiles = ['aec-go-no-go-worksheet.html', 'aec-compliance-matrix-worksheet.html'].map(name => `downloads/${name}`);
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const field = (label, rows = 3) => `<label>${escape(label)}<textarea rows="${rows}" aria-label="${escape(label)}"></textarea></label>`;
export function renderWorksheets(dist) {
  const sheets = [
    {
      title: 'AEC Go/No-Go worksheet', slug: 'aec-go-no-go-worksheet', parent: '/aec-go-no-go-scoring/',
      intro: 'Record the evidence, uncertainty, and leadership decision before committing proposal resources. This worksheet does not calculate a win probability.',
      sections: [
        ['Opportunity', 'Client / project / solicitation reference', 'Submission deadline / decision date', 'Pursuit owner / approving leader'],
        ['Decision evidence', 'Strategic fit — why this opportunity matters', 'Capability and proof — relevant projects, people, and missing evidence', 'Requirements and risk — constraints, terms, partner input, and questions for specialist review', 'Capacity and effort — availability, response effort, and competing commitments'],
        ['Leadership decision', 'Decision — pursue, hold pending answers, or decline', 'Rationale and conditions', 'Open questions — owner and due date for each', 'Approved by / date / revisit trigger'],
      ],
    },
    {
      title: 'AEC compliance matrix worksheet', slug: 'aec-compliance-matrix-worksheet', parent: '/rfp-compliance-matrix/',
      intro: 'Track each requirement from the solicitation into the reviewed response. Repeat the requirement record for each instruction, criterion, form, or addendum change. A completed draft is not the same as an approved requirement.',
      sections: [
        ['Solicitation', 'Client / project / solicitation reference', 'Current version / addenda reviewed', 'Deadline / pursuit owner / final approver'],
        ['Requirement record', 'Requirement ID / exact instruction or criterion', 'Source — document, section, page, and addendum', 'Type — mandatory instruction, scored criterion, form, or other', 'Owner / due date / response section or page', 'Evidence — approved source or expert input', 'Status — open, drafting, in review, approved, or exception', 'Addendum impact / related response locations', 'Open question or exception / accountable reviewer'],
        ['Final check', 'Reviewer / review date / approval or required changes', 'Submission checklist — forms, acknowledgments, page limits, attachments, and delivery instructions'],
      ],
    },
  ];
  mkdirSync(join(dist, 'downloads'), { recursive: true });
  for (const sheet of sheets) {
    writeFileSync(join(dist, 'downloads', `${sheet.slug}.html`), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,follow"><title>${sheet.title} | Propagent</title>
<style>*{box-sizing:border-box}body{font:16px/1.5 system-ui,sans-serif;color:#17202a;background:#f3f4f6;margin:0}main{max-width:940px;margin:auto;background:white;padding:32px}h1{font-size:30px;line-height:1.15}h2{font-size:19px;border-bottom:1px solid #cdd3dd;padding-bottom:8px}a{color:#51349b}.controls{display:flex;gap:20px;align-items:center;flex-wrap:wrap}button{background:#51349b;color:white;border:0;border-radius:5px;padding:12px;font:inherit;cursor:pointer}.fields{display:grid;grid-template-columns:1fr 1fr;gap:16px}label{display:block;font-size:14px;font-weight:600}textarea{font:15px/1.4 system-ui,sans-serif;display:block;border:1px solid #8993a5;border-radius:4px;padding:8px;width:100%;margin-top:5px;resize:vertical}small{display:block;margin-top:20px;color:#455164}@media(max-width:600px){main{padding:20px}.fields{grid-template-columns:1fr}}@media print{body{background:white}main{max-width:none;padding:0}.controls,.privacy{display:none}label{break-inside:avoid}textarea{overflow:visible;resize:none;border-color:#abb3c0}h1{font-size:24px}.fields{gap:10px}label{font-size:12px}small{font-size:11px}}
</style></head><body><main><div class="controls"><a href="${sheet.parent}">← Read the guide</a><button type="button" id="print">Print or save as PDF</button>${sheet.slug.includes('compliance') ? '<button type="button" id="add-record">Add a requirement</button>' : ''}</div><h1>${sheet.title}</h1><p>${sheet.intro}</p><p class="privacy">Entries stay in this page and are not sent to Propagent. Print or save as PDF before closing or refreshing; this worksheet does not save your entries.</p>${sheet.sections.map(([title, ...fields]) => `<section${title === 'Requirement record' ? ' class="requirement-record"' : ''}><h2>${title}</h2><div class="fields">${fields.map(label => field(label)).join('')}</div></section>`).join('')}<small>Propagent · The pursuit system for the built world · propagent.ai<br>Free working template. Adapt it to the solicitation and your firm’s review process. Updated September 7, 2026.</small></main><script>const fit=e=>{e.style.height='auto';e.style.height=e.scrollHeight+'px'};document.addEventListener('input',e=>{if(e.target.matches('textarea'))fit(e.target)});document.getElementById('print').addEventListener('click',()=>{document.querySelectorAll('textarea').forEach(fit);window.print()});document.getElementById('add-record')?.addEventListener('click',()=>{const records=document.querySelectorAll('.requirement-record');const next=records[0].cloneNode(true);next.querySelector('h2').textContent='Requirement record '+(records.length+1);next.querySelectorAll('textarea').forEach(e=>{e.value='';e.style.height=''});records[records.length-1].after(next);next.querySelector('textarea').focus()});</script></body></html>`, 'utf8');
  }
}
