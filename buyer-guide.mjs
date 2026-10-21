// Buyer-facing editorial content. Keep product mechanics and customer data private.
import { stormwaterQualification } from './pursuit-example.mjs';
import { customerStoryPath } from './buyer-proof.mjs';
import { inputFormats, outputFormats, connectionAnswer, submissionAnswer, pricingAnswer } from './buyer-capabilities.mjs';
export const buyerGuide = {
  slug: 'aec-proposal-software-guide',
  template: 'guide',
  title: 'How to Choose AEC Proposal Software | Propagent',
  navLabel: 'AEC proposal software buyer’s guide',
  eyebrow: 'AEC software buyer’s guide',
  h1: 'Choose proposal software for the work your team actually does.',
  description: 'Choose AEC proposal software for RFP, RFQ, SOQ, and SF 330 work. Compare workflows, pricing, integrations, and a real customer result.',
  answer: 'The right AEC proposal software depends on where your pursuit process breaks down. A writing tool helps produce text. A content library helps reuse answers. Credentials and asset systems organize people, projects, and images. A proposal pursuit system connects requirements, firm proof, expert input, content, and approval. Evaluate the work that remains with your team after the software produces its first output.',
  sections: [
    {
      id: 'categories', eyebrow: 'Compare the categories', title: 'Start with the bottleneck.',
      paragraphs: ['AEC firms often need more than one system. A proposal response, a project résumé, a fee estimate, and a sales pipeline are different outputs. Start by deciding which work you need the software to carry.'],
      table: {
        caption: 'AEC proposal software categories and their role in a pursuit',
        headers: ['Category', 'Useful when you need', 'Check before you buy'],
        rows: [
          ['AI writing assistant', 'Help outlining, rewriting, or producing an initial draft.', 'Who verifies the claims, reconciles sections, and manages the remaining response work?'],
          ['Response library and RFP software', 'Reuse approved answers and coordinate repeatable questionnaire responses.', 'Can it connect a new project’s requirements to experience and expert judgment beyond a stored answer?'],
          ['Credentials and digital asset management', 'Find and assemble CVs, project sheets, qualifications, and imagery.', 'Does it manage the pursuit around those assets, or supply material to another process?'],
          ['AEC CRM and project ERP', 'Maintain client relationships, pipeline, project records, and commercial information.', 'Where do detailed requirements, response evidence, reviews, and submission decisions live?'],
          ['Proposal pursuit system', 'Connect qualification, requirements, evidence, experts, content, and approval.', 'Does the system keep the connected work moving, with a clear place for human decisions?'],
        ],
      },
    },
    {
      id: 'submission-types', eyebrow: 'RFP, RFQ, SOQ, and SF 330', title: 'One pursuit system. All four response types.',
      paragraphs: [submissionAnswer],
      table: {
        caption: 'Choose the response around the buyer’s requested submission',
        headers: ['Submission', 'What the response needs to make clear'],
        rows: [
          ['RFP · Request for proposal', 'The proposed approach, delivery team, relevant experience, and answers to the stated requirements and evaluation criteria.'],
          ['RFQ · Request for qualifications', 'Why the firm and proposed team are qualified, supported by relevant projects, roles, and credentials.'],
          ['SOQ · Statement of qualifications', 'A coherent account of the firm’s experience and team, tailored to the opportunity and submission instructions.'],
          ['SF 330 · Architect-engineer qualifications', 'Firm, team, résumé, and project qualifications organized for the required SF 330 submission.'],
        ],
      },
      links: [['/ai-proposal-management-aec/#formats', 'See supported document and layout formats']],
    },
    {
      id: 'customer-results', eyebrow: 'Customer results', title: 'From first draft to the shortlist.',
      paragraphs: ['In a municipal design-build pursuit, a team received an initial draft in 30 minutes compared with its five-day drafting process. The team fully or partly implemented 29 of 40 Propagent recommendations in later drafts. The team was shortlisted.'],
      table: {
        caption: 'Customer results that matter when choosing proposal software',
        headers: ['Buying decision', 'Result from this engagement'],
        rows: [
          ['How quickly can the team reach a first draft?', '30 minutes compared with the team’s five-day drafting process. Research, evidence preparation, and later reviews were separate.'],
          ['Does the review lead to useful revisions?', '29 of 40 assessable recommendations implemented in later drafts — 14 fully and 15 partly.'],
          ['Did the qualifications response advance?', 'The team was shortlisted. The case covers the qualifications submission and shortlisting.'],
        ],
      },
      links: [[customerStoryPath, 'Read the full customer story']],
    },
    {
      id: 'evaluation', eyebrow: 'What to evaluate', title: 'Ask for the work product, not a feature checkmark.',
      paragraphs: ['Use the same opportunity and source materials in each evaluation. The useful comparison is what the team receives, what remains unresolved, and how much coordination the proposal owner still supplies.'],
      table: {
        caption: 'Nine tests for an AEC proposal software demonstration',
        headers: ['Test', 'Ask to see', 'What a useful result looks like'],
        rows: [
          ['Qualification', 'An opportunity with a real capacity or experience gap.', 'The gap, supporting evidence, open decision, and accountable leader are visible.'],
          ['RFP, RFQ, SOQ, and SF 330 fit', 'Your actual submission structure, forms, page limits, and evaluation criteria.', 'The response plan follows that procurement instead of forcing it into a generic questionnaire.'],
          ['Compliance and addenda', 'One changed instruction after the response has started.', 'The team can trace the change to its source and identify affected response work.'],
          ['Projects and people', 'A requirement for comparable experience or a named team role.', 'The candidate evidence explains relevance, source, and anything that needs confirmation.'],
          ['Expert coordination', 'A question the existing documents cannot answer.', 'The expert receives a focused request with context; the response owner can see what is still open.'],
          ['Drafting and review', 'A draft with a weak claim and a conflicting staffing statement.', 'Review reveals the support and contradiction; the team can revise and approve the response.'],
          ['Operational memory', 'An approved correction reused in another pursuit.', 'The team can distinguish approved context from an old, unreviewed passage.'],
          ['Systems and access', 'The actual source-to-response path using your working environment.', 'You know which steps are native connections, file transfers, manual work, or custom setup.'],
          ['Security and control', 'The data flow, access model, retention terms, and export process.', 'Your IT and procurement team can verify the terms that govern your firm’s information.'],
        ],
      },
    },
    {
      id: 'firm-fit', eyebrow: 'Fit to your firm', title: 'Use a pursuit that exposes your real constraints.',
      cards: [
        ['Architecture and design practices', 'Use an RFQ or SOQ that depends on comparable projects, principal experience, team composition, and a tightly edited qualifications narrative.'],
        ['Engineering and infrastructure firms', 'Test technical approach, discipline-specific expertise, project roles, capacity, and the evidence behind past-performance claims.'],
        ['Construction and design-build teams', 'Use a formal pursuit with delivery approach, phasing, safety, staffing, partner input, and submission requirements. Test estimating separately when it is part of the purchase.'],
        ['Small teams and multi-office firms', 'Small teams need less setup and fewer handoffs. Multi-office firms also need clear ownership, access boundaries, and a way to distinguish current expertise from old records.'],
      ],
    },
    {
      id: 'demo-test', eyebrow: 'A practical evaluation', title: 'Run the pursuit past the first draft.',
      paragraphs: ['Use a shareable RFQ, approved project sheets, a team résumé, and a prior response. Compare the work produced and the work left with your team.'],
      steps: [
        ['01', 'Use the same source packet', 'Ask each vendor to select relevant evidence, identify what is missing, and develop the same response section. Check why each project and person was selected.'],
        ['02', 'Introduce a change', 'Make the proposed project manager unavailable. Follow the effect through qualification, the team résumé, response content, and approval.'],
        ['03', 'Inspect the handoff', 'Ask who resolves the open questions, what the reviewer can verify, and which approved knowledge carries into the next pursuit. Record the coordination and revision work still left with your team.'],
      ],
    },
    {
      id: 'propagent-fit', eyebrow: 'Where Propagent fits', title: 'The next generation of proposal pursuit management.',
      paragraphs: ['Previous-generation tools help find material or produce a draft while the team still selects the proof, chases answers, and reconciles revisions. Propagent is built to carry that connected work from qualification through response review.', 'In the fictional stormwater worked example below, the difference is the connection between project selection, role confirmation, capacity, and the case presented to the county. Propagent’s five differentiators—Measurable Quality, Meaningful Search, Polished Content, Dynamic Workflow, and Continuous Improvement—describe that operating shift. Your team retains strategy, expertise, and final approval.'],
    },
    {
      id: 'scope-and-cost', eyebrow: 'Your systems and budget', title: 'Keep your records. Connect the pursuit.',
      paragraphs: [connectionAnswer, pricingAnswer, 'Propagent publishes this guide from its proposal-pursuit perspective. Use the same buying criteria to evaluate Propagent and other options.'],
      table: {
        caption: 'Propagent document inputs and response outputs', headers: ['Workflow', 'Formats'],
        rows: [['Input', inputFormats], ['Output', outputFormats]],
      },
      links: [['/#pricing', 'See published pricing and response allowances'], ['/ai-proposal-management-aec/#connections', 'Explore connections and integration accelerators'], ['/security/', 'Review data protection and deployment options']],
    },
    {
      id: 'worked-example', eyebrow: 'A pursuit in practice', title: 'Follow the evidence into the response.',
      responseWalkthrough: true,
      links: [['/aec-go-no-go-scoring/#worksheet', 'See the Go/No-Go decision behind this response']],
    },
  ],
  faqs: [
    ['What is the best proposal software for an AEC firm?', 'The best fit depends on the work the firm needs to improve. Evaluate credentials, requirements, evidence, expert coordination, review, and approval using one of your own pursuits. A system that produces a good first draft can still leave substantial work with the team.'],
    ['How is AEC proposal software different from estimating software?', 'Proposal software supports the qualifications, approach, evidence, and response process for winning work. Estimating software supports quantities, costs, and pricing. A formal construction pursuit may use both; verify each part of the workflow separately.'],
    ['Does Propagent support RFP, RFQ, SOQ, and SF 330 responses?', submissionAnswer],
    ['Can Propagent work alongside a firm’s existing systems?', connectionAnswer],
    ['How much does Propagent’s AEC proposal software cost?', pricingAnswer],
    ['Can Propagent export to Adobe InDesign?', `Yes. Propagent supports IDML for Adobe InDesign. Its full output formats are ${outputFormats}.`],
  ],
  cta: ['See the difference on your next pursuit', 'Bring an RFP, RFQ, SOQ, or SF 330 pursuit to a Propagent demonstration.', '/60min-meeting', 'Book a Propagent demo'],
  related: ['ai-proposal-management-aec', 'aec-operational-memory', 'rfp-compliance-matrix', 'security'],
};

export const memoryRecordsSection = {
  eyebrow: 'Projects, people, and qualifications', title: 'Make the record useful to the next proposal team.',
  paragraphs: ['A project sheet can establish comparable experience. A CV or résumé can establish a person’s role. An approved answer can explain how the team delivered. Together with review history and source context, those records help a proposal team build a defensible account of the firm’s capability.'],
  table: {
    caption: 'What to check before reusing AEC proposal knowledge',
    headers: ['Record', 'Useful evidence', 'Confirm before reuse'],
    rows: [
      ['Project sheet or past-performance example', 'Scope, project type, firm role, delivery conditions, and approved results.', 'Similarity to the new requirement and permission to disclose client details.'],
      ['CV, résumé, or team biography', 'The person’s role, relevant experience, and qualifications.', 'Current employment, credentials, availability, and permission to name the person.'],
      ['Approved expert answer', 'A specific fact, method, or constraint with its source and approver.', 'Whether the answer applies to this project and whether conditions have changed.'],
      ['Review correction or pursuit decision', 'The reasoning behind approved language, an exception, or a positioning choice.', 'Whether the original context still applies; a prior approval is not blanket permission.'],
    ],
  },
};

export const qualificationExample = {
  id: 'worksheet', layout: 'wide', eyebrow: 'A pursuit decision in practice', title: 'A good fit still needs the right evidence and an available team.',
  workedExample: stormwaterQualification,
  links: [['/aec-proposal-software-guide/#worked-example', 'Follow this pursuit into the response']],
  downloads: [['/downloads/aec-go-no-go-worksheet.html', 'Open the blank Go/No-Go worksheet']],
};

export const complianceExample = {
  id: 'worksheet', layout: 'wide', eyebrow: 'Worked example and free template', title: 'From the RFQ to the matrix—and through an addendum.',
  paragraphs: ['Follow the same county stormwater pursuit from its source instructions into a filled compliance matrix. The example separates mandatory instructions from scored criteria and shows why a reviewed row can reopen.'],
  complianceExample: true,
  downloadsFirst: true,
  downloads: [
    ['/downloads/aec-compliance-matrix.xlsx', 'Download the editable Excel matrix', 'Includes a blank template, filled example, and fictional source packet. No signup.'],
    ['/downloads/aec-compliance-matrix-worksheet.html', 'Use the browser worksheet'],
  ],
};
