// Approved anonymized customer story. Customer source files stay outside the build.
export const customerStoryPath = '/customer-stories/aec-design-build-proposal/';
export const customerStory = {
  slug: 'customer-stories/aec-design-build-proposal',
  template: 'case',
  datePublished: '2026-10-04',
  title: 'AEC Design-Build Customer Story: From Draft to Shortlist | Propagent',
  navLabel: 'AEC design-build customer story',
  eyebrow: 'Municipal design-build pursuit · Customer story',
  h1: 'From first draft to the shortlist.',
  description: 'How a design-build team used Propagent to draft in 30 minutes, fully or partly implement 29 of 40 recommendations, and reach the shortlist.',
  answer: 'A design-build team needed to assemble qualifications, coordinate partner input, and make a credible case for public-sector work. Propagent supported the pursuit with drafting, evidence-backed review, and specific recommendations the team could act on. The team was shortlisted.',
  stats: [
    ['5 days → 30 min', 'First-draft turnaround', 'An initial draft in 30 minutes, compared with the team’s five-day drafting process.'],
    ['29 of 40', 'Recommendations implemented', '14 fully and 15 partly implemented in later drafts.'],
    ['Under 45 min', 'Fastest documented review', 'A revision returned with a scored assessment, action list, and supporting evidence in 43 minutes, 42 seconds.'],
  ],
  sections: [
    {
      id: 'changes', eyebrow: 'What changed', title: 'Feedback the team could put to work.',
      cards: [
        ['Six reference leads. Two pages.', 'The proposed reference package would occupy three pages against a two-page limit. The review identified the conflict, and the team consolidated all six leads into two pages. The correction survived into the submitted response.'],
        ['A schedule promise brought back within the evidence.', 'The draft promised completion alongside or ahead of an adjacent development without supporting schedule evidence. The review flagged the commitment, and the team removed it. The unsupported promise stayed out of the submitted response.'],
        ['More references did not mean more qualifying references.', 'The review distinguished additional leads from eligible completed work, identifying an unbuilt project and a completion date outside the required window. The team could see the remaining qualification gap.'],
      ],
    },
    {
      id: 'collaboration', eyebrow: 'Rapid review and revision', title: 'Three complete feedback loops within 23 hours.',
      paragraphs: [
        'Across five assessment passes, the team received specific findings, supplied missing information, and revised its response. Of 40 recommendations whose outcomes could be assessed, 14 were fully implemented and 15 partly implemented in later client drafts.',
        'The supplied draft scored 59/100 on the internal review rubric. Integrating fuller team information raised the score to 66; further collaboration brought the last reviewed version to 72.',
      ],
      methodology: true,
      links: [['/aec-proposal-software-guide/#worked-example', 'Explore a source-to-response example'], ['/ai-proposal-management-aec/', 'See how Propagent works']],
    },
  ],
};

export function renderCaseMethodology() {
  return `<details class="proof-details"><summary>About this engagement and its results</summary>
  <p>One September 2026 engagement. First-draft timing covers the initial draft; research, evidence preparation, and later reviews were separate. Review turnaround runs from receipt of a client revision to delivery of the review package.</p>
  <p>Scores are internal assessments using the procurement’s category weights, not official evaluator scores. New information and team edits contributed. The 72-point version was the last reviewed version, not the final submitted file. Two restored personnel profiles were lost in later editing; 12 of the 14 fully implemented recommendations remained in the submitted response.</p>
  <p>The 40 recommendations include those whose outcomes could be assessed across later drafts. This case covers the qualifications submission and confirmed shortlisting. The customer and project are anonymized.</p></details>`;
}
