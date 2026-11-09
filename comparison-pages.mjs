// Buyer comparisons reviewed against first-party product pages on November 9, 2026.
// Propagent facts come from the production capability and approved evidence modules.
import { connectionAnswer, inputFormats, outputFormats, pricingAnswer, submissionAnswer, modelTrainingPolicy, deploymentOptions, pursuitPlatformAnswer, pursuitPlatformCapabilities } from './buyer-capabilities.mjs';
import { customerStoryPath } from './buyer-proof.mjs';
import { fictionalPacket, fictionalPacketPath } from './response-walkthrough.mjs';

export const comparisonReviewDate = '2026-11-09';
const source = (id, title, url, label, detail) => ({ id, title, url, label, detail, reviewed: comparisonReviewDate });
const propagentSources = [
  source('P1', 'Propagent: knowledge graphs, workspaces, agents and response workflow', '/ai-proposal-management-aec/#platform', 'Platform', 'Platform section; supported submissions and the connected pursuit workflow on the same page.'),
  source('P2', 'Propagent: operational memory', '/aec-operational-memory/', 'Memory', 'How approved evidence, expert answers, decisions and review context carry forward.'),
  source('P3', 'Propagent: source-grounded drafting', '/source-grounded-proposal-drafting/', 'Source checks', 'Claims, supporting evidence, unresolved questions and human approval.'),
  source('P4', 'Propagent: SME coordination', '/sme-coordination/', 'Expert input', 'Missing information becomes a scoped question; approved input returns to the response.'),
  source('P5', 'Propagent: go/no-go decision record', '/aec-go-no-go-scoring/', 'Qualification', 'Decision factors, evidence readiness, uncertainty and the accountable human decision.'),
  source('P6', 'Propagent: compliance matrix and addenda', '/rfp-compliance-matrix/', 'Compliance', 'Source-linked requirements, owners, response status and review after an addendum.'),
  source('P7', 'Propagent: security and assurance status', '/security/', 'Security', 'Deployment options, data handling and the explicit absence of current independent SOC 2 assurance or ISO certification.'),
  source('P8', 'Propagent: published pricing', '/#pricing', 'Pricing', 'Monthly prices, annual-response allowances and the full workflow in every tier.'),
  source('P9', 'Propagent: anonymized customer results and measurement boundaries', customerStoryPath, 'Customer case', 'Initial-draft timing, assessable recommendations, submitted changes and the limits of one engagement.'),
  source('P10', 'Propagent: connection types and implementation scope', '/ai-proposal-management-aec/#connections', 'Connections', 'OpenAsset connector; Deltek/Unanet accelerators; document and email connections. These are not interchangeable connector claims.'),
  source('P11', 'Propagent: supported inputs and deliverables', '/ai-proposal-management-aec/#formats', 'Formats', 'Supported input/output formats. Format support is not a claim that every official form is assembled without review.'),
];
const kantivSources = [
  source('K1', 'Kantiv: AEC pursuit platform', 'https://www.kantiv.com/', 'Platform', 'AEC data model, response execution, pursuit-history decisions and the integrations FAQ.'),
  source('K2', 'Kantiv: Agents and release-status labels', 'https://www.kantiv.com/agents', 'Agents', 'Data Collection Agent, brand review, source visibility, private workspaces and dedicated Go/No-Go roadmap status.'),
  source('K3', 'Kantiv: pricing and ROI', 'https://www.kantiv.com/pricing-roi', 'Pricing / ROI', 'ROI calculator and its assumptions; not a public subscription quote.'),
  source('K4', 'Kantiv: public Trust Center', 'https://trust.kantiv.com/', 'Trust Center', 'Public security controls and listed compliance documents. Listing a document does not establish its covered entity, scope, period or applicability; underlying assurance documents were not reviewed.'),
  source('K5', 'Kantiv: customer case-study directory', 'https://www.kantiv.com/case-study', 'Customer stories', 'Named AEC customer stories. No normalized head-to-head result is inferred from the directory.'),
];
const loopioSources = [
  source('L1', 'Loopio: platform and connected content', 'https://loopio.com/platform/', 'Platform', 'Response scope, library/connected content, named connections and published customer stories.'),
  source('L2', 'Loopio: AI answers, citations and expert routing', 'https://loopio.com/platform/ai/', 'AI workflow', 'Automated Answers, Recommended Experts, Proposal Summary, project setup and governed agentic workflows.'),
  source('L3', 'Loopio: pricing and plan scope', 'https://loopio.com/pricing/', 'Plans', 'Foundations seat count and project allowance; Enhanced confidentiality/multi-step reviews; Enterprise business-unit scope.'),
  source('L4', 'Loopio: data security and annual assurance', 'https://loopio.com/platform/security/', 'Security', 'Vendor-published annual SOC 2 Type II audit statement, encryption and SSO. Underlying audit reports were not reviewed.'),
];
const sourceById = new Map([...propagentSources, ...kantivSources, ...loopioSources].map(item => [item.id, item]));
const cell = (text, ...refs) => ({ text, refs });
const interpretation = (label, text) => ({ label, text, refs: [] });
const sharedRows = {
  platform: cell('Knowledge graphs connect firm evidence and approved context. Pursuit workspaces bring the response work together; agents support analysis, expert questions, drafting and review.', 'P1', 'P2'),
  grounding: cell('Connects substantive claims to firm evidence; exposes unsupported claims and contradictions for review.', 'P3'),
  experts: cell('Turns missing facts into scoped expert questions with requirement, context and deadline; retains approved input.', 'P4'),
  qualification: cell('Makes fit, requirements, evidence readiness, risk and the human pursue/no-pursue decision traceable.', 'P5'),
  submissions: cell('Supports RFP, RFQ, SOQ and SF 330 work. Links requirements, evidence, owners and changed instructions to response review. Confirm the exact final package in a pilot.', 'P1', 'P6', 'P11'),
  connections: cell('OpenAsset connector; Deltek/Unanet accelerators; document and email connections. Scope is agreed per implementation.', 'P10'),
  governance: cell('Documents human review and final approval. Confirm the required roles, confidential-pursuit access and multi-step approval configuration for your deployment.', 'P1', 'P7'),
  proof: cell('One anonymized design-build case: a 30-minute initial draft, 29 of 40 assessable recommendations fully/partly implemented, and confirmed shortlisting. Timing excludes preparation and later reviews.', 'P9'),
  security: cell('Tenant-isolated cloud, on-premises and local-cloud options. No current claim of independent SOC 2 assurance or ISO certification.', 'P7'),
  price: cell('$1,000/month for up to 25 annual responses; $2,000 for 50; $5,000 for 200. Full workflow in each tier; custom Enterprise scope.', 'P8'),
};

function exampleSection() {
  return {
    id: 'worked-example', eyebrow: 'See the workflow',
    title: 'What the connected platform does with a difficult AEC pursuit.',
    comparisonExample: true,
    paragraphs: ['A qualifications response needs three comparable projects, a substantiated team and the correct submission form. A fluent draft is not enough. Propagent connects the requirement to the evidence, the missing fact and the action needed before approval.'],
    links: [['/aec-proposal-software-guide/#worked-example', 'Read the full source-to-response example'], ['/rfp-compliance-matrix/#worksheet', 'Inspect the matrix and addendum']],
  };
}

function proofSection() {
  return {
    id: 'customer-evidence', eyebrow: 'Actual customer evidence', title: 'From first draft to a corrected submission.',
    cards: [
      ['30-minute initial draft', 'Compared with the team’s five-day drafting process. This measures the first draft only; research, evidence preparation and later reviews were separate.'],
      ['29 of 40 recommendations acted on', '14 fully and 15 partly implemented in later drafts. The denominator includes recommendations whose outcomes could be assessed.'],
      ['A submission corrected before it went out', 'Six reference leads were consolidated into the required two pages. An unsupported schedule promise was removed. The team was shortlisted.'],
    ],
    paragraphs: [
      'In a September 2026 design-build pursuit, Propagent helped the team develop and review its response. The evidence is not just a generated draft: specific findings changed the submitted qualifications package.',
    ],
    afterCards: 'This was one anonymized engagement, not a head-to-head trial or a guaranteed result. It demonstrates Propagent’s drafting and review work, not that every platform capability was measured in this engagement.',
    links: [[customerStoryPath, 'Read the customer case and measurement boundaries']],
  };
}

function platformSection() {
  return {
    id: 'platform', eyebrow: 'The Propagent platform',
    title: 'Knowledge graphs, workspaces and agents—with a job to do.',
    paragraphs: [pursuitPlatformAnswer, 'For your team, the value is the connection: a requirement needs proof; missing proof needs an expert; the approved answer needs to reach the response and remain useful on the next pursuit.'],
    cards: pursuitPlatformCapabilities,
    links: [['/ai-proposal-management-aec/#platform', 'Read the platform capabilities'], ['/aec-operational-memory/', 'See how approved knowledge carries forward'], ['/sme-coordination/', 'See focused expert coordination']],
  };
}

function scopeSection(competitor, pricingRef) {
  return {
    id: 'implementation', eyebrow: 'Published scope', title: 'A full-workflow plan, priced by response volume—not seats.',
    paragraphs: [pricingAnswer, connectionAnswer, `${modelTrainingPolicy} ${deploymentOptions}`, 'These are concrete reasons to consider Propagent when your pursuit involves marketing, technical experts and firm leadership. Compare total scope and your actual response volume; we do not claim a lower total cost without a like-for-like quote.', 'Propagent is not currently ISO-certified and does not claim independent SOC 2 assurance. If independent assurance is mandatory, resolve that requirement before selecting a vendor.'],
    table: { caption: 'Confirmed Propagent document formats', headers: ['Workflow', 'Formats'], rows: [['Input', inputFormats], ['Output', outputFormats]] },
    links: [['/ai-proposal-management-aec/#connections', 'Check Propagent connection scope'], ['/security/', 'Review Propagent security'], ['/#pricing', 'Review Propagent pricing'], [pricingRef, `Request current ${competitor} plan and implementation pricing`]],
  };
}

function pilotSection(competitor) {
  return {
    id: 'pilot', eyebrow: 'See Propagent on your work', title: 'Bring the pursuit your team actually has to deliver.',
    steps: [
      ['01', 'Start with the same sources', 'Bring the solicitation, approved project records, a team résumé and a prior response. Record the setup, source selection and review effort.'],
      ['02', 'Leave one fact unresolved', 'Ask for the proposed manager’s actual role and availability. Inspect the expert request, confirmation and resulting narrative.'],
      ['03', 'Introduce an addendum', 'Replace the required form. Check the matrix, affected sections, attachment and acknowledgment before approving the response.'],
      ['04', 'Reopen the next pursuit', 'Find the approved answer and correction. Check what is reused, what is revalidated and which work still needs a person.'],
    ],
    paragraphs: [`A Propagent demonstration should make this case tangible: connected evidence, a focused expert request, a response changed by the answer and a reviewable submission. If ${competitor} is on your shortlist, use the same packet and score the same outputs.`],
    downloads: [[`/${fictionalPacketPath}`, 'Download the fictional comparison packet', 'The same public fictional records for both demonstrations. No signup.']],
  };
}

function commitmentSection(competitor) {
  return {
    id: 'before-you-commit', eyebrow: 'Before you commit', title: 'Make the move on evidence, not a feature checklist.',
    paragraphs: [`Already using ${competitor}? An overlapping feature list is not enough reason to migrate. Start with a representative pursuit and record the setup, expert effort, review work and final deliverable before deciding what to replace.`],
    bullets: [
      'Migration: inventory approved content, evidence, owners, permissions and review history. Agree the mapping, import method and export/rollback plan; do not assume automatic migration.',
      'Commercial scope: define what counts as a response, how abandoned pursuits and overages are handled, and what setup, support and renewal cost. Published allowances are not the complete contract.',
      'Governance: have both vendors demonstrate confidential access, required review steps and the controls your IT team needs. Confirm assurance, retention and deletion requirements for the selected deployment.',
      'Pilot result: count expert time, corrections, manual assembly and review effort as well as draft turnaround. Do not turn a first-draft timer into an end-to-end saving or win-rate claim.',
    ],
    links: [['#pilot', 'Use the shared pursuit test'], ['/ai-proposal-management-aec/#getting-started', 'Plan Propagent setup'], ['/security/', 'Resolve procurement requirements']],
  };
}

function sourcesSection(sources) {
  return {
    id: 'sources', eyebrow: 'Sources and review', title: 'Read the product information behind the comparison.',
    paragraphs: ['Published by Propagent. Both product columns summarize first-party publications reviewed November 9, 2026; neither column is an independent product test. The final column is our interpretation of the buying implications. Claim citations open the underlying source directly; the notes below identify the material reviewed.', 'Propagent’s platform statements, actual customer case and fictional walkthrough are identified separately. We have not run a head-to-head product trial or reviewed underlying competitor assurance reports. Missing public detail does not establish a missing feature. Product availability and plan scope can change.'],
    comparisonSources: sources,
  };
}

const kantivTable = {
  competitor: 'Kantiv',
  rows: [
    ['Do both have a connected AI platform?', sharedRows.platform, cell('AEC knowledge graph, pursuit workspaces and agents spanning data, brand and insights work.', 'K1', 'K2'), interpretation('Shared capability', 'Graphs, workspaces and agents are not exclusive to either product. Choose Propagent for its connected pursuit workflow; validate the work produced rather than awarding a feature-name win.')],
    ['How is missing expert knowledge resolved?', sharedRows.experts, cell('Structured voice capture proposes project-field updates for marketing approval.', 'K2'), interpretation('Different emphasis', 'Propagent describes pursuit-specific evidence gaps and focused questions; Kantiv describes structured knowledge capture. Trace an approved answer into the response in both demos.')],
    ['Can the team inspect and challenge a claim?', sharedRows.grounding, cell('Shows sources and human review; brand agents check writing and visual standards.', 'K2'), interpretation('Shared control, different emphasis', 'Use an unsupported technical promise as the test. Source visibility or brand review alone does not establish which product catches more submission risks.')],
    ['What supports the pursue/no-pursue decision?', sharedRows.qualification, cell('Publishes pursuit-history decision support; its dedicated Go/No-Go Agent is labeled coming soon.', 'K1', 'K2'), interpretation('Roadmap distinction', 'Evaluate today’s decision record separately from the named agent’s release status. Coming soon does not mean Kantiv has no decision support.')],
    ['What happens to addenda and SF 330 work?', sharedRows.submissions, cell('Describes requirements/addenda, personnel matching and SF-330 completion.', 'K1'), interpretation('Shared published scope', 'Both describe AEC response work. Require the revised form, affected checks and final output; neither public description proves less manual assembly for your package.')],
    ['Will existing records connect as required?', sharedRows.connections, cell('Names Deltek, SharePoint and Egnyte integrations.', 'K1'), interpretation('Implementation check', 'Propagent distinguishes a built connector from an accelerator. Get both vendors’ objects, permissions, sync direction, services and ownership in writing; connector names are not implementation parity.')],
    ['Who can see and approve confidential work?', sharedRows.governance, cell('Documents private pursuit workspaces and human review controls.', 'K2'), interpretation('Configuration check', 'Do not equate human approval with your required access model or approval sequence. Have both vendors demonstrate confidential access and the required review steps.')],
    ['What customer evidence supports the decision?', sharedRows.proof, cell('Publishes named AEC customer case studies.', 'K5'), interpretation('Not a head-to-head result', 'Propagent’s case makes drafting and review changes inspectable. It does not establish a higher win rate, better quality or faster end-to-end delivery than Kantiv.')],
    ['What is the price and what does it include?', sharedRows.price, cell('Publishes an ROI calculator; the reviewed page is not a subscription quote.', 'K3'), interpretation('Documented commercial terms', 'Propagent gives you a published price, annual allowance and full-workflow scope. An ROI estimate is not a competing quote; compare setup, services, usage and renewal terms before claiming savings.')],
    ['Does the deployment meet procurement gates?', sharedRows.security, cell('Trust Center lists SOC 2/ISO documents and controls. Their underlying scope and applicability were not reviewed.', 'K4'), interpretation('Procurement gate', 'Propagent offers deployment choices, not independent-assurance equivalence. If assurance is mandatory, obtain covered entity, scope and reporting period for either vendor before selection.')],
  ],
};

const loopioTable = {
  competitor: 'Loopio',
  rows: [
    ['How does firm knowledge enter the workflow?', sharedRows.platform, cell('Managed library and connected content, collaborative workspaces and governed agentic workflows.', 'L1', 'L2'), interpretation('Different emphasis', 'Propagent organizes its platform around AEC pursuit evidence and decisions. Loopio also connects content and automates work; the reviewed pages do not establish that it lacks a graph or relationship model.')],
    ['How is missing expert knowledge resolved?', sharedRows.experts, cell('Recommends experts from past contributions and routes answers, review and sign-off.', 'L2'), interpretation('Shared capability', 'Expert routing is not exclusive to Propagent. Compare the requirement context, expert effort and how the approved answer reaches affected response work.')],
    ['Can the team inspect and challenge a claim?', sharedRows.grounding, cell('Automated Answers provide citations and confidence scores from approved content.', 'L2'), interpretation('Shared control', 'Propagent connects claims, evidence and unresolved questions. A citation or confidence score is not proof that either product will validate every technical commitment.')],
    ['What supports the pursue/no-pursue decision?', sharedRows.qualification, cell('Proposal Summary supports prioritization and go/no-go decisions.', 'L2'), interpretation('Shared capability', 'Propagent records evidence readiness and the human decision. Test both with a missing qualification; no comparative decision-quality result has been established.')],
    ['Will the actual AEC submission be ready?', sharedRows.submissions, cell('Documents portal/document setup and AI mapping; native SF 330 assembly is not established by this source.', 'L2'), interpretation('AEC output to validate', 'Propagent explicitly supports all four submission types. Demonstrate the actual form, addendum and final output in both products; missing public detail is not evidence of an absent feature.')],
    ['Will existing records connect as required?', sharedRows.connections, cell('Names SharePoint, Google Drive, Salesforce and team collaboration workflows.', 'L1'), interpretation('Implementation check', 'Propagent publishes AEC connection types. Confirm record mapping, permissions, sync direction, layout handoff and services instead of comparing integration counts.')],
    ['Who can see and approve confidential work?', sharedRows.governance, cell('Enhanced lists confidential projects/multi-step reviews; Enterprise adds separate business units.', 'L3'), interpretation('Plan and configuration check', 'Loopio publishes specific plan gates. Confirm Propagent’s required access/review configuration and both quotes; human approval alone does not establish matching governance controls.')],
    ['What customer evidence supports the decision?', sharedRows.proof, cell('Publishes named customer stories with reported efficiency and turnaround outcomes.', 'L1'), interpretation('Not a head-to-head result', 'Propagent’s case supports its own drafting/review work. Different tasks, teams and denominators prevent a valid ranking against Loopio’s published outcomes.')],
    ['What is the price and what does it include?', sharedRows.price, cell('Custom quote. Foundations includes 10 seats; listed plans allow unlimited projects.', 'L3'), interpretation('Different commercial models', 'Propagent prices response volume rather than seats. Loopio’s project allowance may matter at high volume. Compare users, annual usage, plan features, onboarding and renewal—not list price alone.')],
    ['Does the deployment meet procurement gates?', sharedRows.security, cell('States an annual third-party SOC 2 Type II audit; publishes encryption and SSO details.', 'L4'), interpretation('Procurement gate', 'Loopio publishes an assurance claim that Propagent does not currently make. Deployment flexibility does not replace an audit requirement; request the current report and its scope.')],
  ],
};

const common = {
  template: 'comparison', datePublished: '2026-11-06',
  dateModified: comparisonReviewDate,
  cta: ['Put Propagent to work on your next pursuit.', 'Bring an RFP, RFQ, SOQ or SF 330 package. See your firm’s knowledge, expert input and response work connected—from the first requirement to final review.', '/60min-meeting', 'See Propagent on your pursuit'],
};

export const comparisonPages = [
  {
    ...common, slug: 'propagent-vs-kantiv',
    title: 'Propagent vs Kantiv for AEC Proposal Teams | Propagent',
    navLabel: 'Propagent vs Kantiv', eyebrow: 'AEC proposal software comparison',
    h1: 'Propagent vs Kantiv for AEC proposal teams',
    description: 'Why choose Propagent over Kantiv? Connect AEC knowledge graphs, workspaces and agents with pursuit execution, documented customer work and published pricing.',
    answer: 'Choose Propagent when you want firm knowledge to drive the work of an AEC pursuit—from qualification and evidence gaps to expert input, drafting and final review. Propagent combines knowledge graphs, pursuit workspaces and AI agents in that workflow. Project evidence, technical expertise and response decisions stay connected, backed by documented customer work and published volume-based pricing.',
    competitor: { name: 'Kantiv', url: 'https://www.kantiv.com/' },
    sources: [...propagentSources, ...kantivSources],
    sections: [
      { id: 'fit', eyebrow: 'Why choose Propagent', title: 'Connected knowledge should change the pursuit—not just populate a draft.', cards: [
        ['Carry the pursuit from decision to review', 'Propagent connects qualification, requirement analysis, evidence matching, focused expert input and response development. Your team works from the proof and decisions behind the response, not only the resulting text.'],
        ['See evidence of useful customer work', 'The published design-build case shows an initial draft, recommendations adopted in later drafts and corrections retained in the submission. It gives your team concrete work to inspect before buying.'],
        ['Know the starting price and included workflow', 'Published plans start at $1,000/month for 25 annual responses. Every tier includes the full workflow; pricing scales with response volume rather than seat counts.'],
      ], paragraphs: ['Kantiv also offers an AEC knowledge graph, pursuit workspace and agents. The reasons to choose Propagent are how its platform connects your pursuit work, the customer evidence you can inspect and the full-workflow commercial scope.'], links: [['#customer-evidence', 'See the customer evidence'], ['#platform', 'See Propagent’s platform'], ['#source-K1', 'Kantiv platform source'], ['#source-K2', 'Kantiv Agents source']] },
      proofSection(), platformSection(), exampleSection(),
      { id: 'comparison', eyebrow: 'Sourced comparison', title: 'Propagent and Kantiv: shared capabilities and buying differences.', paragraphs: ['Propagent’s case is connected AEC execution, inspectable customer work and published full-workflow plans. The table separates that case from shared features, implementation questions and roadmap status. Both columns use vendor publications; the buying interpretation is not a measured performance ranking.'], comparisonTable: kantivTable },
      scopeSection('Kantiv', 'https://www.kantiv.com/pricing-roi'), commitmentSection('Kantiv'), pilotSection('Kantiv'), sourcesSection([...propagentSources, ...kantivSources]),
    ],
    faqs: [
      ['Why choose Propagent instead of Kantiv?', 'Choose Propagent when you want a connected AEC pursuit workflow, documented customer drafting and review evidence, and published pricing with the full workflow in every tier. Knowledge graphs, workspaces and agents are part of Propagent too; we do not present those shared capabilities as a Kantiv-only advantage.'],
      ['Does Propagent have knowledge graphs, workspaces and agents?', pursuitPlatformAnswer],
      ['Does Kantiv also offer grounded AI and human review?', 'Yes. Kantiv’s public Agents page describes connected firm knowledge, visible sources and human review. This comparison does not claim that those capabilities are unique to Propagent.'],
      ['Does Propagent support RFP, RFQ, SOQ and SF 330 work?', submissionAnswer],
      ['How much does Propagent cost?', pricingAnswer],
    ],
    related: ['propagent-vs-loopio', 'aec-proposal-software-guide', 'aec-operational-memory', 'security'],
  },
  {
    ...common, slug: 'propagent-vs-loopio',
    title: 'Propagent vs Loopio for Engineering RFP Responses | Propagent',
    navLabel: 'Propagent vs Loopio', eyebrow: 'Engineering RFP software comparison',
    h1: 'Propagent vs Loopio for engineering RFP responses',
    description: 'Why choose Propagent over Loopio for AEC? Knowledge graphs, workspaces and agents connect project evidence, experts, qualifications and response review.',
    answer: 'Choose Propagent for AEC responses where comparable projects, personnel responsibilities, availability and submission rules determine what your firm can credibly claim. Its knowledge graphs, pursuit workspaces and AI agents connect that evidence to qualification, expert input, drafting and review across RFP, RFQ, SOQ and SF 330 work. Documented customer results and published full-workflow plans make the case concrete.',
    competitor: { name: 'Loopio', url: 'https://loopio.com/' },
    sources: [...propagentSources, ...loopioSources],
    sections: [
      { id: 'fit', eyebrow: 'Why choose Propagent', title: 'An AEC response is a case built from project and team evidence.', cards: [
        ['Start with what qualifies your firm', 'Propagent supports RFP, RFQ, SOQ and SF 330 responses equally. Requirements, relevant projects, actual personnel roles and evidence gaps sit inside the pursuit workflow—not outside the drafting task.'],
        ['Turn missing knowledge into an action', 'The knowledge graph provides connected firm context; the workspace keeps open work visible; agents support analysis, expert questions, drafting and review. An unconfirmed role becomes a focused question, not an unsupported claim.'],
        ['Price the response work, not each participant', 'Propagent publishes annual-response allowances and monthly prices. Every tier includes the full workflow, and pricing is based on volume rather than seat counts.'],
      ], paragraphs: ['Loopio’s documented strengths include approved and connected content, collaborative workspaces, agentic workflows, citations and expert routing. Choose Propagent for a connected AEC pursuit workflow built around the project qualifications, technical evidence and submission requirements your response depends on.'], links: [['#customer-evidence', 'See the customer evidence'], ['#platform', 'See Propagent’s platform'], ['#source-L1', 'Loopio platform source'], ['#source-L2', 'Loopio AI source']] },
      proofSection(), platformSection(), exampleSection(),
      { id: 'comparison', eyebrow: 'Sourced comparison', title: 'Propagent and Loopio: AEC fit, scope and procurement trade-offs.', paragraphs: ['Choose Propagent when qualifying projects, substantiated personnel roles and AEC submission requirements drive the response. That is a fit argument—not a claim that Loopio lacks connected AI or collaboration. The table identifies the published scope, commercial model and procurement checks that can change the buying decision.'], comparisonTable: loopioTable },
      scopeSection('Loopio', 'https://loopio.com/pricing/'), commitmentSection('Loopio'), pilotSection('Loopio'), sourcesSection([...propagentSources, ...loopioSources]),
    ],
    faqs: [
      ['Why choose Propagent instead of Loopio for AEC?', 'Choose Propagent when your response depends on qualifying project experience, substantiated personnel roles, expert input and AEC submission requirements. Its knowledge graphs, workspaces and agents connect that work across qualification, drafting and review, with documented customer evidence and published volume-based plans.'],
      ['Does Propagent have knowledge graphs, workspaces and agents?', pursuitPlatformAnswer],
      ['Does Loopio support citations and expert routing?', 'Yes. Loopio’s current AI page describes citations and confidence scores in Automated Answers, plus Recommended Experts and routing for answering, review and sign-off.'],
      ['Can we compare both products on an SF 330 submission?', 'Yes. Propagent supports SF 330 response work. Give both vendors your actual sections, source records, page limits and required output, then inspect the completed package and any remaining manual work.'],
      ['How do pricing models differ?', 'Propagent publishes annual-response allowances with monthly prices and the full workflow in every tier. Loopio offers custom quotes; its pricing page describes a 10-seat Foundations starting tier and unlimited projects in the listed plans. Compare the complete implementation and renewal scope.'],
    ],
    related: ['propagent-vs-kantiv', 'rfp-compliance-matrix', 'sme-coordination', 'source-grounded-proposal-drafting'],
  },
];

const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const renderCell = value => {
  if (typeof value === 'string') return escape(value);
  const references = value.refs.map(id => {
    const reference = sourceById.get(id);
    if (!reference) throw new Error(`Unknown comparison source: ${id}`);
    return `<a href="${escape(reference.url)}" aria-label="${escape(`Source ${id}: ${reference.title}`)}">${escape(id)} · ${escape(reference.label)}</a>`;
  }).join(' ');
  return `${value.label ? `<strong class="comparison-status">${escape(value.label)}</strong>` : ''}${escape(value.text)}${references ? `<span class="comparison-refs">${references}</span>` : ''}`;
};

export function renderComparisonTable(table) {
  return `<div class="guide-table-wrap comparison-table-wrap" tabindex="0" role="region" aria-label="Propagent and ${escape(table.competitor)} capability comparison"><table class="guide-table comparison-table"><caption>Propagent vs ${escape(table.competitor)} · First-party product publications checked November 9, 2026 · Final column: editorial buying interpretation, not test results.</caption><thead><tr><th scope="col">Buyer decision</th><th scope="col">Propagent</th><th scope="col">${escape(table.competitor)}</th><th scope="col">Buying implication &amp; evidence limit</th></tr></thead><tbody>${table.rows.map(([label, ...cells]) => `<tr><th scope="row">${escape(label)}</th>${cells.map(value => `<td>${renderCell(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="comparison-table-note">Both product columns cite vendor-published information. A shared capability is not an exclusive advantage; a validation question is not an absent-feature claim. <a href="#sources">Review the source notes</a> or <a href="#pilot">test the same pursuit</a>.</p>`;
}

export function renderComparisonSources(sources) {
  return `<ol class="comparison-sources">${sources.map(s => `<li id="source-${escape(s.id)}"><span class="comparison-source-id">${escape(s.id)}</span><div><a href="${escape(s.url)}">${escape(s.title)}</a><p>${escape(s.detail)}</p><small>Checked <time datetime="${escape(s.reviewed)}">November 9, 2026</time> · First-party publication</small></div></li>`).join('')}</ol>`;
}

export function renderComparisonExample() {
  return `<div class="comparison-example" data-comparison-example="stormwater">
    <p class="example-disclosure">${escape(fictionalPacket.label)}</p>
    <p>${escape(fictionalPacket.requirement)}</p>
    <ol class="comparison-trace">
      <li><h3>Knowledge graph: connect the requirement to the right proof</h3><p>Hickory Lane and Westgate fit the existing-road constraints. Cedar Run needs its closeout record to complete the three-project set. A larger greenfield project does not demonstrate the same delivery conditions. Connected evidence helps the team distinguish relevance from a superficially impressive project.</p><a href="/aec-proposal-software-guide/#stormwater-response-p3">Inspect the project records</a></li>
      <li><h3>Agents: turn the missing fact into a focused expert question</h3><blockquote>${escape(fictionalPacket.expertQuestion)}</blockquote><p>The principal confirms Maya’s design-lead role; a practice leader separately confirms availability. The proposed project-manager title is not treated as proof of her role on a past project. The answer supports a specific claim instead of becoming another unconnected email.</p><a href="/aec-proposal-software-guide/#stormwater-response-e1">Inspect the expert confirmation</a></li>
      <li><h3>Workspace: carry the answer and the addendum into review</h3><p>The confirmed role belongs in the response work. An addendum also replaces Team Form A with Rev 1 and adds an availability field. The workspace connects the revised attachment, acknowledgment and affected matrix checks, which remain open until reviewed.</p><a href="/aec-proposal-software-guide/#addendum-records">Inspect the RFQ and addendum</a></li>
      <li><h3>Operational memory: keep approved context useful</h3><p>Retain the confirmed role, its source and the review decision for the next pursuit. Reuse the supported fact; revalidate pursuit-specific availability rather than treating a previous confirmation as a permanent commitment.</p><a href="/aec-operational-memory/">See how approved knowledge carries forward</a></li>
    </ol>
    <p>This is the case for Propagent’s connected approach: the evidence, expert question, response change and approval stay related. The fictional packet illustrates the documented workflow; it does not show a live application session or measure a competitor’s performance.</p>
  </div>`;
}
