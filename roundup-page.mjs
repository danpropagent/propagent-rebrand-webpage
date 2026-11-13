// Multi-vendor AEC proposal software comparison, checked against each vendor's own published pages on November 13, 2026.
// The page itself does not link to competitor sites. Every competitor statement must still trace to the
// first-party page recorded in `evidence` below (not rendered), so the claims can be re-checked before each update.
// Rules: no numeric scores, ratings or Review markup; roadmap items are labeled; a feature absent from a vendor's
// public pages is phrased as a question to ask, never as a missing feature. Propagent facts come from buyer-capabilities.mjs.
import { pricingAnswer, connectionAnswer, submissionAnswer, modelTrainingPolicy, deploymentOptions, pursuitPlatformAnswer } from './buyer-capabilities.mjs';
import { customerStoryPath } from './buyer-proof.mjs';
import { fictionalPacketPath } from './response-walkthrough.mjs';

export const roundupReviewDate = '2026-11-13';
const REVIEW_LABEL = 'November 13, 2026';

// Security wording for Propagent: design alignment only, never certification or audit language.
export const propagentSecuritySummary = `Designed around SOC 2, GDPR and ISO/IEC 27001 and 42001 standards. ${modelTrainingPolicy} ${deploymentOptions}`;

// Internal evidence register. Not rendered; kept so every statement can be re-verified.
export const evidence = {
  P1: '/ai-proposal-management-aec/#platform', P2: '/#pricing', P3: '/ai-proposal-management-aec/#connections', P4: '/security/',
  P5: '/rfp-compliance-matrix/', P6: '/sme-coordination/', P7: '/aec-go-no-go-scoring/', P8: '/#faq',
  D1: 'https://www.deltek.com/products/erp/vantagepoint/',
  D2: 'https://www.deltek.com/products/erp/vantagepoint/crm-and-pipeline-management/',
  D3: 'https://help.deltek.com/Product/Vantagepoint/7.2/dvp_prop_sf330_section_e.html',
  D4: 'https://www.deltek.com/products/proposals/',
  D5: 'https://www.deltek.com/resources/articles/how-deltek-is-driving-the-future-of-ai/',
  F1: 'https://www.flowcase.com/', F2: 'https://www.flowcase.com/flowcase-ai---proposal-assistant',
  F3: 'https://www.flowcase.com/features/integrations', F4: 'https://www.flowcase.com/pricing',
  K1: 'https://www.kantiv.com/', K2: 'https://www.kantiv.com/product', K3: 'https://www.kantiv.com/product/create-proposals',
  K4: 'https://www.kantiv.com/agents', K5: 'https://www.kantiv.com/pricing-roi', K6: 'https://trust.kantiv.com/',
  K7: 'https://www.kantiv.com/ai-instructions', K8: 'https://www.kantiv.com/product/image-intelligence',
  Q1: 'https://www.qorusdocs.com/', Q2: 'https://www.qorusdocs.com/proposals-for-aec', Q3: 'https://www.qorusdocs.com/integrations', Q4: 'https://www.qorusdocs.com/pricing',
  O1: 'https://openasset.com/', O2: 'https://openasset.com/platform/shred', O3: 'https://partners.openasset.com/integrations', O4: 'https://openasset.com/pricing',
  U1: 'https://unanet.com/crm-aec/crm-overview', U2: 'https://unanet.com/proposal-ai-aec',
  W1: 'https://www.workorb.com/', W2: 'https://www.workorb.com/rfp-go-no-go', W3: 'https://www.workorb.com/proposal-assistant-ai',
  W4: 'https://www.workorb.com/project-resume-management', W5: 'https://www.workorb.com/pricing', W6: 'https://www.workorb.com/trust-security',
  L1: 'https://loopio.com/platform/ai/', L2: 'https://loopio.com/pricing/', L3: 'https://loopio.com/platform/security/',
  R1: 'https://www.responsive.io/', R2: 'https://www.responsive.io/pricing', R3: 'https://www.responsive.io/product/security',
};
const fact = (text, ...refs) => ({ text, refs });

// Order: Propagent first (the publisher, disclosed), then AEC tools alphabetically, then general RFP tools.
const vendors = [
  {
    id: 'propagent', name: 'Propagent', product: 'Propagent', group: 'aec', ours: true,
    category: 'AEC proposal management platform',
    overall: true,
    bestFor: 'Managing the full AEC pursuit, from go/no-go to final review',
    goodFit: 'You want one system to carry each pursuit through qualification, requirements, evidence gaps, expert input, drafting and review, with pricing published up front and based on response volume.',
    questions: 'Which records will stay in your DAM, CRM or ERP, and how will they connect? What does the final output look like for your submission format?',
    facts: {
      overview: fact(pursuitPlatformAnswer, 'P1'),
      pursuit: fact('Go/no-go decisions record fit, evidence readiness, risk and the accountable human decision. Requirements and addenda stay linked to their source and owner, and missing facts become scoped questions for the right subject-matter expert.', 'P7', 'P5', 'P6'),
      qualifications: fact(submissionAnswer, 'P1'),
      integrations: fact(connectionAnswer, 'P3'),
      pricing: fact(pricingAnswer, 'P2'),
      security: fact(propagentSecuritySummary, 'P4'),
    },
    glance: { pricing: 'Published. From $1,000/month for up to 25 annual responses; full workflow in every tier.', integrations: 'OpenAsset, Deltek, Unanet, SharePoint, OneDrive, Google Drive, Outlook, Gmail' },
  },
  {
    id: 'deltek', name: 'Deltek Vantagepoint', product: 'Deltek Vantagepoint', group: 'aec',
    category: 'ERP and CRM for architecture, engineering and consulting firms',
    bestFor: 'Firms that want proposal data inside their ERP',
    goodFit: 'You already run Vantagepoint and want pipeline, résumé and SF 330 data to stay in your system of record.',
    questions: 'Which proposal capabilities are available in Vantagepoint today, and which are scheduled? Which of Deltek’s proposal products apply to AEC work rather than government contracting?',
    facts: {
      overview: fact('ERP for architecture, engineering and consulting firms, with CRM and pipeline management.', 'D1', 'D2'),
      pursuit: fact('The Dela assistant scores pursuits on a firm’s win patterns and flags go/no-go decisions. Deltek’s AI proposal products, Costpoint Proposals and GovWin Proposals, are aimed at government contractors. Deltek’s November 2025 roadmap targets AI-generated proposal creation in Vantagepoint for Q3 2027.', 'D2', 'D4', 'D5'),
      qualifications: fact('Vantagepoint documentation covers SF330 Section E résumés for key personnel.', 'D3'),
      pricing: fact('Not published.', 'D1'),
    },
    glance: { pricing: 'Not published', integrations: 'System of record for CRM, projects and financials' },
  },
  {
    id: 'flowcase', name: 'Flowcase', product: 'Flowcase', group: 'aec',
    category: 'Résumé and project-experience management',
    bestFor: 'Résumés and project experience at scale',
    goodFit: 'Tailored CVs, project sheets and staffing the right people are your main bottleneck, particularly at engineering and consulting firms.',
    questions: 'Is the AI Proposal Assistant available on your plan? How is narrative drafting handled beyond résumés and project sheets?',
    facts: {
      overview: fact('Positions itself as the source of truth for résumés and projects at consulting and AEC firms.', 'F1'),
      pursuit: fact('Its AI Proposal Assistant parses tender requirements, matches candidates to roles and tracks requirement coverage. Access is currently by registration of interest.', 'F2'),
      qualifications: fact('Covers SF 330 sections and exports to PDF, Word and editable InDesign files.', 'F1'),
      integrations: fact('Native integrations include Deltek Vantagepoint and Qvidian, plus a REST API.', 'F3'),
      pricing: fact('Professional and Premium plans by quote; generative AI is a Premium add-on.', 'F4'),
      security: fact('Reports SOC 2 Type II and ISO 27001.', 'F1'),
    },
    glance: { pricing: 'By quote', integrations: 'Deltek Vantagepoint, Qvidian; REST API' },
  },
  {
    id: 'kantiv', name: 'Kantiv', product: 'Kantiv', group: 'aec',
    category: 'AEC knowledge platform (formerly Joist AI)',
    bestFor: 'Organizing institutional knowledge for marketing teams',
    goodFit: 'Your main goal is to structure projects, people, images and client history so a marketing-led team can find and reuse content.',
    questions: 'What will it cost at your volume? How are questions routed to technical experts? Can you see a live SF 330 and addendum workflow?',
    facts: {
      overview: fact('Describes itself as a pursuit intelligence platform for marketing and business development teams, built on a knowledge graph of firm proposals, projects, people and client history.', 'K1', 'K7'),
      pursuit: fact('Runs a compliance check against RFx requirements before submission and describes its drafts as sourced and traceable. Contributors add their sections in the platform.', 'K3'),
      qualifications: fact('Generates résumés and tailors project descriptions; includes image management.', 'K2', 'K8'),
      integrations: fact('Deltek, SharePoint and Egnyte.', 'K1'),
      pricing: fact('Not published. The pricing page offers an ROI calculator and a demo request.', 'K5'),
      security: fact('Reports SOC 2 and ISO/IEC 27001.', 'K6'),
    },
    glance: { pricing: 'Not published', integrations: 'Deltek, SharePoint, Egnyte' },
  },
  {
    id: 'openasset', name: 'OpenAsset', product: 'OpenAsset', group: 'aec',
    category: 'Digital asset management with AI proposal writing (Shred)',
    bestFor: 'Image-heavy proposals and digital asset management',
    goodFit: 'Project photography and visual assets matter as much as text, and you want proposal writing built on your DAM.',
    questions: 'How will SF330 forms be completed, given that Shred assembles the content but does not fill the forms? How do requirement checks fit your review process?',
    facts: {
      overview: fact('Digital asset management for AEC firms, with résumés and project profiles, and Shred for AI-assisted proposal writing.', 'O1', 'O2'),
      pursuit: fact('Shred includes go/no-go analysis and checks drafts against the RFP so missing forms, sections and submittal items are flagged.', 'O2'),
      qualifications: fact('Shred assembles past performance, résumés and supporting content for SF330 responses; OpenAsset notes that it does not automatically fill out SF330 forms.', 'O2'),
      integrations: fact('Deltek, Unanet and Adobe InDesign.', 'O3'),
      pricing: fact('By quote.', 'O4'),
      security: fact('Reports SOC 2 Type II.', 'O1'),
    },
    glance: { pricing: 'By quote', integrations: 'Deltek, Unanet, Adobe InDesign' },
  },
  {
    id: 'qorusdocs', name: 'QorusDocs', product: 'QorusDocs', group: 'aec',
    category: 'Proposal software built into Microsoft 365',
    bestFor: 'Teams that want to work inside Microsoft 365',
    goodFit: 'Your seller-doers and proposal team work in Word, PowerPoint, Teams and SharePoint and want proposal tools in that environment.',
    questions: 'How does it handle SF 330 forms, addenda and go/no-go records? Which AEC systems, such as Deltek, Unanet or OpenAsset, does it connect to?',
    facts: {
      overview: fact('AI proposal and RFP software for professional services firms, built into Microsoft 365, with a dedicated offering for AEC seller-doers.', 'Q1', 'Q2'),
      pursuit: fact('Agents summarize requirements, surface risks and set up tasks; PursuitIQ matches past projects to the client’s requirements; agents draft first versions.', 'Q2'),
      qualifications: fact('Tailors résumés, project experience and case studies for each proposal.', 'Q2'),
      integrations: fact('SharePoint, OneDrive, Microsoft Teams, Microsoft Dynamics and Salesforce.', 'Q3'),
      pricing: fact('Not published.', 'Q4'),
      security: fact('Reports SOC 2 Type II and GDPR compliance; built on Microsoft Azure OpenAI.', 'Q1'),
    },
    glance: { pricing: 'Not published', integrations: 'Microsoft 365, SharePoint, Dynamics, Salesforce' },
  },
  {
    id: 'unanet', name: 'Unanet', product: 'Unanet', group: 'aec',
    category: 'AEC CRM with AI proposal writing (ProposalAI)',
    bestFor: 'Firms standardized on Unanet CRM',
    goodFit: 'You run, or plan to run, Unanet CRM and want qualification, résumés and proposal drafting connected to it.',
    questions: 'How does ProposalAI handle SF 330 work and source citations? What production work remains in Word or InDesign?',
    facts: {
      overview: fact('Unanet CRM holds project experience, employee qualifications, résumés and pursuit information; ProposalAI is Unanet’s AI proposal writing product for AEC firms.', 'U1', 'U2'),
      pursuit: fact('Structured go/no-go criteria in the CRM. ProposalAI maps each requirement to the response and produces an outline for review.', 'U1', 'U2'),
      qualifications: fact('Unanet notes that many teams complete branded production in Word or InDesign.', 'U2'),
      integrations: fact('Unanet CRM; works from content uploaded from existing SharePoint, Word and InDesign processes.', 'U2'),
      pricing: fact('Not published.', 'U2'),
    },
    glance: { pricing: 'Not published', integrations: 'Unanet CRM; SharePoint content' },
  },
  {
    id: 'workorb', name: 'Workorb AI', product: 'Workorb AI', group: 'aec',
    category: 'AI proposal automation for AEC',
    bestFor: 'Fast first drafts on per-user pricing',
    goodFit: 'You want quick first drafts with citations to past projects and a self-serve start.',
    questions: 'Which plan includes drafting rather than evaluation? How are addenda and SF 330 forms handled?',
    facts: {
      overview: fact('AI proposal automation for AEC firms, positioned around moving from RFP to compliant draft quickly.', 'W1'),
      pursuit: fact('Extracts scope, mandatory requirements, evaluation criteria and deadlines for go/no-go review, and drafts profiles and résumés with citations back to source projects.', 'W2', 'W3'),
      qualifications: fact('Automates project sheets and résumé management.', 'W4'),
      integrations: fact('Deltek Vantagepoint, Unanet CRM, SharePoint and OpenAsset.', 'W1'),
      pricing: fact('Per-user evaluator plans (listed at $149 and $175 per user per month) with self-serve sign-up; Enterprise by quote.', 'W5'),
      security: fact('Reports SOC 2 Type 2 and ISO 27001.', 'W6'),
    },
    glance: { pricing: 'Per user; Enterprise by quote', integrations: 'Deltek Vantagepoint, Unanet CRM, SharePoint, OpenAsset' },
  },
  {
    id: 'loopio', name: 'Loopio', product: 'Loopio', group: 'general',
    category: 'RFP and questionnaire response software',
    bestFor: 'Repeatable questionnaires and DDQs',
    goodFit: 'Much of your volume is repeatable questionnaires, such as DDQs and security questionnaires, answered from an approved library.',
    questions: 'How does it handle an AEC qualifications package: project selection, personnel roles and SF 330 sections?',
    facts: {
      overview: fact('AI answers with citations and confidence scores, and expert recommendations for routing questions.', 'L1'),
      pricing: fact('By quote. The entry tier includes 10 seats; listed plans include unlimited projects.', 'L2'),
      security: fact('Reports an annual SOC 2 Type II audit.', 'L3'),
    },
    glance: { pricing: 'By quote; entry tier includes 10 seats', integrations: 'General-purpose business systems' },
  },
  {
    id: 'responsive', name: 'Responsive (formerly RFPIO)', product: 'Responsive', group: 'general',
    category: 'Enterprise response management software',
    bestFor: 'Enterprise response programs across departments',
    goodFit: 'Response work spans many departments and document types beyond AEC qualifications.',
    questions: 'How does it handle an AEC qualifications package: project selection, personnel roles and SF 330 sections?',
    facts: {
      overview: fact('A response management platform for RFPs and related documents across an organization.', 'R1'),
      pricing: fact('Entry edition from $10,000; other editions by quote.', 'R2'),
      security: fact('Reports SOC 2 compliance and ISO 27001, 27701 and 42001 certification.', 'R3'),
    },
    glance: { pricing: 'From $10,000; other editions by quote', integrations: 'General-purpose business systems' },
  },
];

const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const factLabels = [
  ['overview', 'Overview'],
  ['pursuit', 'Qualification and requirements'],
  ['qualifications', 'Résumés, projects and SF 330'],
  ['integrations', 'Integrations'],
  ['pricing', 'Pricing'],
  ['security', 'Security'],
];

export function renderRoundupTable() {
  return `<div class="guide-table-wrap comparison-table-wrap" tabindex="0" role="region" aria-label="AEC proposal software at a glance"><table class="guide-table comparison-table roundup-table"><caption>Based on each vendor’s published information as of ${REVIEW_LABEL}.</caption><thead><tr><th scope="col">Product</th><th scope="col">Best for</th><th scope="col">Pricing</th><th scope="col">Integrations</th></tr></thead><tbody>${vendors.map(v => `<tr><th scope="row"><a href="#tool-${escape(v.id)}">${escape(v.name)}</a></th><td>${v.overall ? '<strong>Best overall.</strong> ' : ''}${escape(v.bestFor)}</td><td>${escape(v.glance.pricing)}</td><td>${escape(v.glance.integrations)}</td></tr>`).join('')}</tbody></table></div>`;
}

export function renderRoundupVendors() {
  const block = v => `<article class="roundup-vendor" id="tool-${escape(v.id)}">
      <header><h3>${escape(v.name)}</h3><span class="mono-label">${escape(v.category)}</span></header>
      <p class="roundup-best-for"><strong>${v.overall ? 'Best overall' : 'Best for'}:</strong> ${escape(v.bestFor)}</p>
      <dl>${factLabels.filter(([key]) => v.facts[key]).map(([key, label]) => `<div><dt>${escape(label)}</dt><dd>${escape(v.facts[key].text)}</dd></div>`).join('')}</dl>
      <p><strong>A good fit when:</strong> ${escape(v.goodFit)}</p>
      <p><strong>Questions to ask:</strong> ${escape(v.questions)}</p>
    </article>`;
  return `<div class="roundup-vendors">${vendors.filter(v => v.group === 'aec').map(block).join('')}</div>
    <h3 class="roundup-subhead" id="general-rfp-tools">General-purpose RFP response software</h3>
    <p>These tools serve response teams across industries rather than AEC qualifications specifically. AEC firms often evaluate them alongside AEC-specific platforms; see also <a href="/propagent-vs-loopio/">Propagent vs Loopio</a>.</p>
    <div class="roundup-vendors">${vendors.filter(v => v.group === 'general').map(block).join('')}</div>`;
}

export const roundupPage = {
  slug: 'best-aec-proposal-software',
  template: 'roundup',
  datePublished: roundupReviewDate,
  dateModified: roundupReviewDate,
  title: 'Best AEC Proposal & Pursuit Management Software in 2026 | Propagent',
  navLabel: 'Best AEC proposal management software',
  eyebrow: 'AEC proposal software comparison',
  h1: 'Best AEC proposal and pursuit management software in 2026',
  description: 'The best proposal and pursuit management software for architecture, engineering and construction firms, comparing Propagent, Kantiv, Workorb, OpenAsset, Flowcase, QorusDocs and more.',
  answer: 'Propagent is the best AEC proposal and pursuit management software for architecture, engineering and construction firms that want one system to run the whole pursuit: the go/no-go decision, requirements, expert input, drafting and review, with pricing published up front. For narrower needs, Kantiv focuses on organizing institutional knowledge for marketing teams, OpenAsset on digital assets, Flowcase on résumés and project experience, Workorb on fast first drafts and QorusDocs on proposals inside Microsoft 365. Deltek Vantagepoint and Unanet suit firms that want proposal work inside their ERP or CRM, and Loopio and Responsive suit teams whose volume is mostly repeatable questionnaires.',
  vendors,
  sections: [
    {
      id: 'at-a-glance', eyebrow: 'Overview', title: 'AEC proposal software at a glance',
      paragraphs: ['The table summarizes what each product is best suited to, how it is priced and the systems it connects to. Detailed summaries for each product follow.'],
      roundupTable: true,
    },
    {
      id: 'verdict', eyebrow: 'Our pick', title: 'Best overall for AEC firms: Propagent',
      paragraphs: [
        'Most tools in this comparison improve one part of a proposal: finding content, managing images, tailoring résumés or producing a first draft. Propagent is built to run the whole pursuit, so the decision to bid, the requirements, the evidence, the expert input and the final review stay connected in one system.',
      ],
      cards: [
        ['One system for the whole pursuit', 'Go/no-go decisions, requirements and addenda, evidence gaps, expert questions, drafting and review are managed together rather than across separate tools.'],
        ['Built for every role on the response', 'Executives decide what to pursue, marketing and proposal teams run the response, business development shapes the strategy and subject-matter experts answer only the questions that need them.'],
        ['Pricing you can see before a demo', 'Plans start at $1,000/month for up to 25 annual responses, with the full workflow in every tier and pricing based on response volume rather than seats.'],
      ],
      links: [['#tool-propagent', 'See the Propagent summary'], ['/60min-meeting', 'Book a Propagent demo']],
    },
    {
      id: 'categories', eyebrow: 'Categories', title: 'Proposal automation, proposal management and pursuit intelligence',
      paragraphs: [
        'Vendors in this market use overlapping terms. Proposal automation generally refers to producing drafts and documents faster. Proposal management covers the full response: requirements, contributors, expert input, review and approval. Pursuit intelligence generally refers to structuring firm knowledge so it can be applied to new pursuits.',
        'The products compared here fall into six groups: AEC proposal platforms (Propagent, Kantiv and Workorb), proposal software built into Microsoft 365 (QorusDocs), digital asset management with AI writing (OpenAsset), résumé and project-experience management (Flowcase), ERP and CRM systems with proposal features (Deltek Vantagepoint and Unanet), and general-purpose RFP response software (Loopio and Responsive). Many firms use more than one.',
      ],
      links: [['/aec-proposal-software-guide/#categories', 'Read the AEC proposal software buyer’s guide']],
    },
    {
      id: 'tools', eyebrow: 'Products', title: 'Product summaries',
      paragraphs: ['Propagent is listed first as the publisher of this page. The remaining products are listed alphabetically.'],
      roundupVendors: true,
    },
    {
      id: 'propagent-and-kantiv', eyebrow: 'Head to head', title: 'Propagent and Kantiv compared',
      paragraphs: [
        'Propagent and Kantiv are the two AEC proposal platforms most often evaluated together. Both build on a firm’s knowledge with AI. The difference is in what each platform is designed to do with it.',
        'Kantiv is built to organize institutional knowledge so marketing and business development teams can find and reuse content. Propagent is built to manage the pursuit itself: it works out what the response requires, identifies what the firm cannot yet prove, asks the right expert, and carries the answer through drafting and review.',
      ],
      table: {
        caption: 'Propagent and Kantiv, based on each company’s published information as of November 13, 2026',
        headers: ['', 'Propagent', 'Kantiv'],
        rows: [
          ['Approach', 'Manages each pursuit from go/no-go to final review', 'Organizes firm knowledge for reuse across pursuits'],
          ['Designed for', 'The whole response team: executives deciding which work to pursue, marketing and proposal teams running the response, business development leads shaping the strategy, and the subject-matter experts who supply the technical detail', 'Marketing and business development teams'],
          ['Go/no-go', 'Decision record covering fit, evidence readiness, risk and the accountable human decision', 'Insight from pursuit history to inform go/no-go calls'],
          ['Expert input', 'Evidence gaps become scoped questions routed to the right expert; approved answers flow back into the response', 'Contributors add their sections in the platform'],
          ['RFP, RFQ, SOQ and SF 330', 'All four supported equally', 'Ask for a live SF 330 and addendum demonstration'],
          ['Pricing', 'Published: from $1,000/month for up to 25 annual responses, full workflow in every tier', 'Not published; ROI calculator and demo request'],
        ],
      },
      afterCards: 'Kantiv’s published strengths include named enterprise customers, image management and reported SOC 2 and ISO 27001 assurance. If those are your deciding factors, weigh them accordingly.',
      links: [['/propagent-vs-kantiv/', 'Read the full Propagent vs Kantiv comparison']],
    },
    {
      id: 'choose', eyebrow: 'Selection guide', title: 'How to choose the right tool',
      bullets: [
        'If pursuits stall between the go/no-go decision and final review, evaluate AEC proposal platforms such as Propagent, Kantiv and Workorb on the same live pursuit.',
        'If finding and reusing project images is the main problem, start with digital asset management such as OpenAsset.',
        'If tailoring résumés and staffing bids takes most of the time, start with résumé and project-experience management such as Flowcase.',
        'If you want proposal work to stay in your system of record, review what your ERP or CRM offers today and what is on its roadmap.',
        'If most of your volume is repeatable questionnaires rather than qualifications packages, a general RFP tool such as Loopio or Responsive may be sufficient.',
        'If independent audit reports are a procurement requirement, request each vendor’s current documentation early in the process.',
      ],
    },
    {
      id: 'evaluate', eyebrow: 'Evaluation', title: 'How to run a fair evaluation',
      steps: [
        ['01', 'Use the same inputs', 'Give each vendor the same solicitation, project records, team résumés and a prior response.'],
        ['02', 'Leave one fact unresolved', 'Hold back a proposed manager’s role on a past project and see how each tool identifies the gap and who it asks.'],
        ['03', 'Issue an addendum', 'Replace a required form partway through and check what each tool flags and what still needs manual work.'],
        ['04', 'Compare the final package', 'Assess the submitted output, the remaining manual assembly and the review effort, not only drafting speed.'],
      ],
      downloads: [[`/${fictionalPacketPath}`, 'Download a sample pursuit packet', 'Fictional records you can give every vendor. No signup required.']],
      links: [[customerStoryPath, 'Read a Propagent customer story']],
    },
    {
      id: 'methodology', eyebrow: 'Methodology', title: 'How this comparison was prepared',
      paragraphs: [
        'This page is published by Propagent, one of the products compared. Information about other products reflects each vendor’s own published materials as of November 13, 2026, covering product capabilities, AEC qualifications support, integrations, pricing and security. We did not test competitor products or assign numeric scores. Our overall pick reflects our view of what AEC firms need from proposal software: one system that carries the whole pursuit. Where a vendor’s published materials do not address a capability, we list it as a question to ask rather than a limitation.',
        'Products, plans and pricing change. Vendors can request a correction by emailing daniel@propagent.ai.',
      ],
    },
  ],
  faqs: [
    ['What is the best AEC proposal management software?', 'Propagent is our pick for architecture, engineering and construction firms that want one system to manage the whole pursuit, from the go/no-go decision through requirements, expert input, drafting and review. For narrower needs, Kantiv focuses on organizing institutional knowledge, OpenAsset on digital assets, Flowcase on résumés and project experience, Workorb on fast first drafts, QorusDocs on proposals inside Microsoft 365, Deltek Vantagepoint and Unanet on proposals inside an ERP or CRM, and Loopio and Responsive on general RFP and questionnaire responses.'],
    ['What is the best pursuit management software for construction firms?', 'For construction, engineering and architecture firms that want to manage the whole pursuit in one place, Propagent covers the go/no-go decision, requirements and addenda, expert input, drafting and review for RFP, RFQ, SOQ and SF 330 responses.'],
    ['How does Propagent compare with Kantiv?', 'Kantiv is designed to organize institutional knowledge for marketing and business development teams. Propagent is designed to manage the pursuit itself, from the go/no-go decision through requirements, expert input, drafting and review, and publishes its pricing.'],
    ['What is the difference between proposal automation and proposal management software?', 'Proposal automation generally refers to producing drafts and documents faster. Proposal management covers the full response: requirements, contributors, expert input, review and approval.'],
    ['Do AEC firms need AEC-specific proposal software?', 'General RFP tools work well for repeatable questionnaires answered from an approved library. AEC qualifications responses depend on selecting the right projects, substantiating personnel roles and completing forms such as the SF 330, so test any shortlisted tool on a real qualifications package.'],
    ['Which AEC proposal tools publish their pricing?', 'Of the products compared here, Propagent publishes monthly prices by annual response volume, Workorb publishes per-user plans and Responsive publishes a starting price. Kantiv, OpenAsset, Flowcase, QorusDocs, Unanet, Deltek and Loopio provide pricing on request.'],
  ],
  cta: ['See Propagent on a live pursuit.', 'Bring an RFP, RFQ, SOQ or SF 330 package and see requirements, evidence, expert input, drafting and review connected in one workflow.', '/60min-meeting', 'Book a Propagent demo'],
  related: ['aec-proposal-software-guide', 'propagent-vs-kantiv', 'propagent-vs-loopio', 'ai-proposal-management-aec'],
};
