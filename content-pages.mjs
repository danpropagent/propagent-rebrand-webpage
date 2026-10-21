import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buyerGuide, memoryRecordsSection, qualificationExample, complianceExample } from './buyer-guide.mjs';
import { renderWorkedExample } from './pursuit-example.mjs';
import { renderComplianceExample } from './compliance-example.mjs';
import { customerStory, customerStoryPath, renderCaseMethodology } from './buyer-proof.mjs';
import { renderResponseWalkthrough } from './response-walkthrough.mjs';
import { inputFormats, outputFormats, connectionRows, connectionAnswer, submissionAnswer, modelTrainingPolicy, deploymentOptions, retentionPolicy } from './buyer-capabilities.mjs';

const SITE = 'https://www.propagent.ai';
const CONTENT_DATE = '2026-08-20';
const modifiedDates = {
  resources: '2026-10-06',
  'aec-proposal-software-guide': '2026-10-06',
  'customer-stories/aec-design-build-proposal': '2026-10-06',
  'aec-operational-memory': '2026-09-07',
  'aec-go-no-go-scoring': '2026-09-22',
  'rfp-compliance-matrix': '2026-10-06',
  'ai-proposal-management-aec': '2026-10-06',
  security: '2026-09-23',
  press: '2026-09-08',
};

const pressMedia = Object.freeze({
  coverage: [
    {
      outlet: 'Tech Square ATL',
      title: 'Propagent Wants to End the RFP Scramble',
      date: 'July 7, 2026',
      isoDate: '2026-07-07',
      format: 'Company profile',
      relationshipLabel: 'Coverage of Propagent',
      summary: 'An independent profile of why Propagent was built and how the company approaches AEC proposal pursuits.',
      url: 'https://www.techsquareatl.com/tech-square-news/2026/7/7/propagent-wants-to-end-the-rfp-scramble',
      cta: 'Read the profile',
      relatedHref: '/ai-proposal-management-aec/',
      relatedLabel: 'See how Propagent works',
      relationship: 'coverage',
      schemaType: 'NewsArticle',
    },
    {
      outlet: 'Hypepotamus',
      title: 'Atlanta-based Startup Propagent Wants To Help You Win More RFPs',
      date: 'October 2, 2025',
      isoDate: '2025-10-02',
      format: 'Company profile',
      relationshipLabel: 'Coverage of Propagent',
      summary: 'An independent Atlanta startup profile covering Propagent and the proposal-management problem the company set out to solve.',
      url: 'https://www.hypepotamus.com/atlanta-startup-propagent-for-rfps/',
      cta: 'Read the profile',
      relationship: 'coverage',
      schemaType: 'NewsArticle',
    },
  ],
  authored: [
    {
      outlet: 'Construction Executive',
      title: 'Construction Companies Can\u2019t Chase Every Proposal With a Weak RFP Approval Process',
      date: 'July 10, 2026',
      isoDate: '2026-07-10',
      format: 'Industry article',
      relationshipLabel: 'Propagent contributed article',
      summary: 'Why construction firms need a disciplined, evidence-led approval process before committing people and proposal hours to a pursuit.',
      url: 'https://constructionexec.com/article/construction-companies-cant-chase-every-proposal-with-a-weak-rfp-approval-process/',
      cta: 'Read the article',
      relatedHref: '/aec-go-no-go-scoring/',
      relatedLabel: 'Explore Go/No-Go decisions',
      relationship: 'authored',
      schemaType: 'Article',
    },
    {
      outlet: 'Utility Analytics Institute',
      title: 'AI for Utility EOCs: A Use Case in Emergency Response',
      date: 'March 20, 2025',
      isoDate: '2025-03-20',
      format: 'Industry article',
      summary: 'A practical look at applying AI to fragmented operational data, compliance reporting, and human decision-making in high-stakes emergency operations.',
      url: 'https://utilityanalytics.com/ai-for-utility-eocs/',
      cta: 'Read the article',
      relationship: 'authored',
      schemaType: 'Article',
      coAuthors: ['Sean Quealy'],
    },
  ],
  appearances: [
    {
      outlet: 'GTM AI Podcast',
      title: 'AI Strategy and Adoption: Unlocking AI\u2019s Potential in Business',
      date: 'April 16, 2025',
      isoDate: '2025-04-16',
      format: 'Podcast interview',
      summary: 'A conversation about AI strategy, adoption, trust, measurable outcomes, and why agentic workflows need a clear business purpose.',
      url: 'https://www.listennotes.com/podcasts/gtm-ai-podcast/ai-strategy-and-adoption-wDP6Ql9aCuT/',
      cta: 'Listen to the episode',
      relationship: 'appearance',
      schemaType: 'PodcastEpisode',
    },
    {
      outlet: '11Alive',
      title: '11Alive News: The Take | Shutdown: How AI can help a job search (11/7/25)',
      date: 'November 7, 2025',
      isoDate: '2025-11-07',
      format: 'Television interview',
      summary: 'Practical ways people can use AI while navigating a changing job market, discussed on 11Alive\u2019s The Take.',
      url: 'https://www.youtube.com/watch?v=4kizqxUF_Xo',
      cta: 'Watch the segment',
      relationship: 'appearance',
      schemaType: 'VideoObject',
      thumbnailUrl: 'https://i.ytimg.com/vi/4kizqxUF_Xo/hqdefault.jpg',
      embedUrl: 'https://www.youtube.com/embed/4kizqxUF_Xo',
    },
  ],
  speaking: [
    {
      outlet: 'AEC.AI Summit, presented by SMPS',
      title: 'Practical AI for the Pursuit: Qualify Sharper, Respond from Real Firm Knowledge',
      date: 'Upcoming \u00b7 November 18\u201320, 2026',
      isoDate: '2026-11-18',
      format: 'AEC conference session',
      relationshipLabel: 'Propagent AEC conference session',
      summary: 'An AEC-focused session on qualifying pursuits with evidence, making clearer Go/No-Go decisions, responding from real firm knowledge, and preserving pursuit memory.',
      url: 'https://aecaisummit.org/breakout11/',
      cta: 'View the session',
      relatedHref: '/aec-operational-memory/',
      relatedLabel: 'Explore operational memory',
      relationship: 'speaking',
      schemaType: 'Event',
      location: 'Austin, Texas',
    },
    {
      outlet: 'Amplify A|E|C, presented by SMPS',
      title: 'Smarter, Faster, Sharper: Harnessing AI as Your Strategic Advantage',
      date: 'July 28, 2026',
      isoDate: '2026-07-28',
      format: 'Pinnacle Experience panel',
      relationshipLabel: 'Propagent AEC panel appearance',
      summary: 'An AEC leadership panel on turning AI from isolated tools into practical systems that support firm strategy, adoption, and growth.',
      url: 'https://amplifyaec.org/pinnacle3/',
      cta: 'View the session',
      relatedHref: '/ai-proposal-management-aec/',
      relatedLabel: 'See the pursuit workflow',
      relationship: 'speaking',
      schemaType: 'Event',
      location: 'Las Vegas, Nevada',
    },
    {
      outlet: 'Contractors, Closers & Connections',
      title: 'Propagent at CCC’s The AI Revolution',
      date: 'July 23, 2026',
      isoDate: '2026-07-23',
      format: 'Reverse tradeshow',
      summary: 'A commercial-real-estate gathering centered on practical AI tools, live demonstrations, and direct conversations with operators and experts.',
      url: 'https://luma.com/g5q19u6p',
      cta: 'View the event',
      relationship: 'speaking',
      schemaType: 'Event',
      schemaName: 'CCC “THE AI REVOLUTION” — A Private Event for Elite Commercial Real Estate Professionals',
      schemaPerformer: false,
      location: 'Brookhaven, Georgia',
    },
    {
      outlet: 'The AI Summit London',
      title: 'Panel: Vibe Coding Is Here \u2014 What Changes When Everyone Can Ship Software?',
      date: 'June 10, 2026',
      isoDate: '2026-06-10',
      format: 'Conference panel',
      summary: 'A discussion with technology leaders about speed, quality, security, and ownership in AI-assisted software development.',
      url: 'https://attend.londontechweek.virtual.informatech.com/event/the-ai-summit-london-2026/planning/UGxhbm5pbmdfNDQxOTM1NA%3D%3D',
      cta: 'View the session',
      relationship: 'speaking',
      schemaType: 'Event',
      location: 'London, United Kingdom',
    },
    {
      outlet: 'Optimized AI Conference',
      title: 'How Companies Are Adapting AI Agents in Their Ecosystem',
      date: 'March 31, 2026',
      isoDate: '2026-03-31',
      format: 'Conference panel',
      summary: 'An enterprise panel on how organizations are integrating AI agents across retail, procurement, and government environments.',
      url: 'https://www.youtube.com/watch?v=s27tNnOu94Y',
      cta: 'Watch the panel',
      relationship: 'speaking',
      schemaType: 'Event',
      location: 'Atlanta, Georgia',
    },
    {
      outlet: 'The AI Summit New York',
      title: 'Rise of the AgentOps Stack: Building for Autonomy at Scale',
      date: 'December 11, 2025',
      isoDate: '2025-12-11',
      format: 'Conference panel',
      summary: 'An enterprise-AI panel on the operating systems, oversight, and infrastructure needed to move autonomous systems into production.',
      url: 'https://attend.techevents.informaconnect.com/event/the-ai-summit-new-york-2025/planning/UGxhbm5pbmdfMzI2NjgwOA%3D%3D',
      cta: 'View the session',
      relationship: 'speaking',
      schemaType: 'Event',
      location: 'New York, New York',
    },
    {
      outlet: 'The AI Summit London',
      title: 'The Open vs. Closed Debate: Transparency in AI Ecosystems',
      date: 'June 11, 2025',
      isoDate: '2025-06-11',
      format: 'Conference panel',
      summary: 'A panel examining transparency, intellectual property, collaboration, governance, and trust across open and proprietary AI ecosystems.',
      url: 'https://attend.londontechweek.virtual.informatech.com/event/the-ai-summit-london-2025/planning/UGxhbm5pbmdfMjY2MzU1Mg%3D%3D',
      cta: 'View the session',
      relationship: 'speaking',
      schemaType: 'Event',
      location: 'London, United Kingdom',
    },
  ],
});

const allPressMedia = Object.freeze(
  Object.values(pressMedia).flat().sort((a, b) => b.isoDate.localeCompare(a.isoDate)),
);
const publicPressUrls = Object.freeze([
  pressMedia.authored[0].url,
  pressMedia.speaking[0].url,
  pressMedia.coverage[0].url,
  pressMedia.speaking[1].url,
  pressMedia.coverage[1].url,
]);
const publicPressUrlSet = new Set(publicPressUrls);
const publicPressMedia = Object.freeze(allPressMedia.filter((item) => publicPressUrlSet.has(item.url)));
if (publicPressMedia.length !== publicPressUrls.length) {
  throw new Error('Every public press URL must match a canonical press record.');
}
const featuredPressUrls = Object.freeze([
  pressMedia.authored[0].url,
  pressMedia.speaking[0].url,
  pressMedia.coverage[0].url,
]);
const featuredPressMedia = Object.freeze(featuredPressUrls.map((url) => publicPressMedia.find((item) => item.url === url)));
if (featuredPressMedia.some((item) => !item)) {
  throw new Error('Every featured press URL must match a canonical press record.');
}
const featuredPressUrlSet = new Set(featuredPressUrls);
const pressArchiveMedia = Object.freeze(publicPressMedia.filter((item) => !featuredPressUrlSet.has(item.url)));
const pressVisibleMedia = Object.freeze([...featuredPressMedia, ...pressArchiveMedia]);

const pages = [
  buyerGuide,
  customerStory,
  {
    slug: 'resources',
    title: 'AEC Proposal & Response Management Resources',
    navLabel: 'Resources',
    eyebrow: 'Propagent resource library',
    h1: 'Make your next pursuit stronger.',
    description: 'Practical guides to AI proposal management, operational memory, go/no-go decisions, RFP compliance, SME coordination, source-grounded drafting, and security for AEC firms.',
    answer: 'Choose proposal software, make an evidence-led Go/No-Go decision, build a compliance matrix, or put your firm’s knowledge to work. These guides and free worksheets help AEC teams connect requirements, proof, expert input, and review.',
    highlights: [
      ['One connected process', 'Requirements, evidence, experts, content, review, and approval stay connected.'],
      ['Built for AEC', 'Architecture, engineering, construction, and infrastructure proposal workflows.'],
      ['People stay accountable', 'The system carries the process; people apply expertise, judgment, and approval.'],
    ],
    sections: [
      {
        eyebrow: 'Results and examples',
        title: 'See the work behind a stronger pursuit.',
        cards: [
          ['From first draft to the shortlist', 'A 30-minute first draft, 29 of 40 recommendations fully or partly implemented, and a place on the shortlist.', customerStoryPath, 'Read the customer story'],
          ['Follow the evidence into the response', 'Explore a fictional county RFQ through project selection, a focused expert question, a supported response, and an addendum. Download the worked example.', '/aec-proposal-software-guide/#worked-example', 'Explore the worked example'],
        ],
      },
      {
        eyebrow: 'Start here',
        title: 'Why disconnected proposal tools fall short.',
        paragraphs: [
          'Most proposal technology helps at one step. A user searches, prompts, drafts, exports, and then manually coordinates everything around the output. That leaves the proposal team acting as both strategist and workflow engine.',
          'Propagent analyzes what the buyer asks for, connects each requirement to what the firm can prove, turns gaps into focused work, carries content through review, and preserves approved context for the next pursuit. Your team retains strategy, expertise, exception handling, and final approval.',
        ],
        bullets: [
          'Measurable Quality: evaluate the response against the pursuit, evidence, and buyer priorities.',
          'Meaningful Search: connect requirements to proof, decisions, and the people who hold missing knowledge.',
          'Polished Content: carry source-grounded material beyond a rough first draft.',
          'Dynamic Workflow: keep the response plan moving while the owner controls strategy and approval.',
          'Continuous Improvement: preserve approved institutional knowledge across pursuits.',
        ],
      },
      {
        eyebrow: 'Explore by proposal challenge',
        title: 'Use the guide that matches the work in front of you.',
        cards: [
          ['Choose AEC proposal software', 'Compare software categories and use nine practical tests in your next demonstration.', '/aec-proposal-software-guide/'],
          ['AI proposal management for AEC', 'How Propagent carries the response from RFP intake through final approval.', '/ai-proposal-management-aec/'],
          ['AEC operational memory', 'How approved proof, decisions, expert input, and review history become useful on the next pursuit.', '/aec-operational-memory/'],
          ['Go/no-go scoring', 'How to make pursuit decisions visible, evidence-based, and accountable.', '/aec-go-no-go-scoring/'],
          ['RFP compliance matrices', 'How a living compliance record connects requirements, sources, owners, and response status.', '/rfp-compliance-matrix/'],
          ['SME coordination', 'How focused expert questions replace broad packet reviews and repetitive chasing.', '/sme-coordination/'],
          ['Source-grounded drafting', 'How proposal claims stay connected to firm-approved evidence and human review.', '/source-grounded-proposal-drafting/'],
          ['Security and procurement', 'What your team can review about data handling, access, retention, and procurement.', '/security/'],
          ['About Propagent', 'The company, category, founders, and point of view behind the system.', '/about/'],
        ],
      },
    ],
    proof: {
      title: 'See how the proposal process connects.',
      body: 'Follow requirements, evidence, expert input, response quality, decisions, and human approval across one pursuit.',
      items: ['Clear answers to common evaluation questions', 'Visible outputs and named human checkpoints', 'Consistent definitions across connected workflows'],
      artifact: [['What stays connected', 'Requirements, evidence, experts, content, review, and approval'], ['What Propagent coordinates', 'The response process and its next actions'], ['What your team controls', 'Expertise, strategy, judgment, and approval']],
    },
    checkpoint: 'Every workflow described in this library keeps people responsible for strategy, expertise, commercial decisions, exceptions, and final approval.',
    faqs: [
      ['What is Propagent?', 'Propagent is the pursuit system for the built world and the next generation of proposal pursuit management for AEC firms.'],
      ['Who are these resources for?', 'They are for AEC proposal managers, business-development and capture leaders, executives, subject-matter experts, and procurement teams evaluating a proposal system.'],
      ['Does Propagent replace the proposal team?', 'No. Propagent carries requirements analysis, coordination, content maturity, and quality checks while people contribute expertise, set strategy, resolve exceptions, and approve the response.'],
      ['Can I evaluate Propagent with a real RFP?', 'Yes. Use the free RFP Grader for an initial read or book a Propagent demo and bring a live opportunity.'],
    ],
    cta: ['See Propagent on a real pursuit', 'Bring an RFP. We will show how the requirements, gaps, evidence, expert input, and review connect.', '/60min-meeting', 'Book a Propagent demo'],
    related: ['about', 'ai-proposal-management-aec', 'security'],
  },
  {
    slug: 'about',
    title: 'About Propagent | Proposal Response Management for AEC',
    navLabel: 'About Propagent',
    eyebrow: 'About Propagent',
    h1: 'The pursuit system for the built world.',
    description: 'Learn what Propagent is, who it serves, who founded it, and why AEC proposal pursuit management needs a system-led operating model.',
    answer: 'Propagent is the pursuit system for the built world and the next generation of proposal pursuit management for AEC firms. Founded in 2024 by Daniel Beecham and Steve Ernst, Propagent delivers a system-led workflow that analyzes requirements, connects firm evidence, coordinates expert input, matures content, and keeps people responsible for judgment and approval.',
    highlights: [
      ['Founded', '2024'],
      ['Based in', 'The Atlanta metropolitan area'],
      ['Category', 'Proposal pursuit system for the built world'],
    ],
    sections: [
      {
        eyebrow: 'Why Propagent exists',
        title: 'Propagent carries the process; the project team carries the expertise.',
        paragraphs: [
          'AEC proposal teams may have content libraries, search tools, drafting assistants, spreadsheets, portals, email, and project databases. Yet people still interpret the RFP, assemble the response plan, find credible proof, chase experts, reconcile sections, apply review comments, and polish the final submission.',
          'Propagent changes that operating model. The system carries the connected response process while the firm’s people stay responsible for expertise, relationships, strategy, risk, and approval.',
        ],
      },
      {
        eyebrow: 'The Propagent point of view',
        title: 'A compliant answer is not automatically a persuasive case to win.',
        paragraphs: [
          'The RFP defines what the buyer will evaluate. The firm’s experience, people, evidence, and positioning determine whether the response is credible. Strong response management has to connect those two sides and keep them connected as the work changes.',
          'That is why Propagent focuses on five connected outcomes: Measurable Quality, Meaningful Search, Polished Content, Dynamic Workflow, and Continuous Improvement.',
        ],
        bullets: [
          'Requirements are connected to firm capabilities and proof.',
          'Missing facts become focused questions, not broad requests for help.',
          'Content remains connected to sources and related response sections.',
          'The response owner controls strategy, exceptions, and final approval.',
        ],
      },
      {
        eyebrow: 'Founders',
        title: 'Built from the realities of complex pursuits.',
        cards: [
          ['Daniel Beecham', 'Co-founder and CEO. Daniel’s work sits at the intersection of the built world, technology, business development, and the way complex opportunities become coordinated responses.', 'https://www.linkedin.com/in/daniel-beecham', 'View Daniel’s profile', 'daniel-beecham'],
          ['Steve Ernst', 'Co-founder. Steve brings complementary experience to Propagent’s mission of making proposal pursuit management more connected, accountable, and effective.', 'https://www.linkedin.com/in/sternst/', 'View Steve’s profile', 'steve-ernst'],
        ],
      },
      {
        eyebrow: 'Press & media',
        title: 'Propagent’s perspective, in print and on stage.',
        cards: [
          ['Tech Square ATL', 'A profile of Propagent’s system-led approach to ending the RFP scramble for AEC teams.', 'https://www.techsquareatl.com/tech-square-news/2026/7/7/propagent-wants-to-end-the-rfp-scramble', 'Read the profile'],
          ['Hypepotamus', 'An Atlanta startup profile covering Propagent and its focus on RFP work.', 'https://www.hypepotamus.com/atlanta-startup-propagent-for-rfps/', 'Read the profile'],
          ['Construction Executive', 'A Propagent perspective on why construction firms need a stronger RFP approval process.', 'https://constructionexec.com/article/construction-companies-cant-chase-every-proposal-with-a-weak-rfp-approval-process/', 'Read the article'],
          ['Press & Media', 'Explore Propagent coverage and perspectives on AEC pursuit decisions, proposals, and formal procurement.', '/press/', 'View Press & Media'],
        ],
      },
    ],
    faqs: [
      ['What does Propagent do?', 'Propagent analyzes RFP requirements against firm capabilities, identifies gaps, coordinates focused expert input, matures source-grounded content, and supports quality review through human approval.'],
      ['Who is Propagent for?', 'Propagent is for architecture, engineering, construction, and infrastructure firms, including proposal managers, BD and capture leaders, executives, and subject-matter experts.'],
      ['How is Propagent different from a proposal writing tool?', 'Writing is one step. Propagent manages the connected response process: requirements, evidence, planning, expert coordination, content maturity, review, and reusable institutional knowledge.'],
      ['Where can I learn more?', 'Explore the resource library, use the free RFP Grader, or book a Propagent demo with a real opportunity.'],
    ],
    cta: ['Bring us the work, not a hypothetical', 'Use a real opportunity to see how Propagent connects the RFP, the firm’s proof, focused expert input, and final review.', '/60min-meeting', 'Book a Propagent demo'],
    related: ['press', 'ai-proposal-management-aec', 'resources'],
  },
  {
    slug: 'press',
    title: 'Press & Media | Propagent',
    navLabel: 'Press & Media',
    eyebrow: 'Company newsroom',
    h1: 'Press & Media',
    description: 'Propagent coverage, contributed articles, and speaking appearances focused on AEC pursuits, proposals, and formal procurement.',
    intro: 'Coverage and perspectives on how AEC firms qualify pursuits, manage proposals, and respond to formal procurement.',
    featuredMedia: featuredPressMedia,
    archiveMedia: pressArchiveMedia,
    contact: {
      eyebrow: 'Media and speaking inquiries',
      title: 'Contact Propagent',
      body: 'Share the outlet or event, audience, topic, timing, and requested format.',
      href: 'mailto:press@propagent.ai?subject=Propagent%20media%20or%20speaking%20inquiry',
      label: 'Contact Propagent',
    },
    about: 'Propagent is the proposal pursuit system for AEC firms. It connects RFP requirements, firm evidence, focused expert input, response development, quality review, and human approval in one managed process.',
    productLink: {
      prefix: 'Product information',
      href: '/ai-proposal-management-aec/',
      label: 'Product overview',
    },
  },
  {
    slug: 'ai-proposal-management-aec',
    title: 'AI Proposal Management Software for AEC Firms | Propagent',
    navLabel: 'AI proposal management',
    eyebrow: 'System-led response management',
    h1: 'Propagent manages the entire AEC response—not just the writing.',
    description: 'Propagent supports AEC RFP, RFQ, SOQ, and SF 330 responses with requirements analysis, project evidence, expert coordination, drafting, and review.',
    answer: 'Propagent manages RFP, RFQ, SOQ, and SF 330 responses for AEC firms. It analyzes requirements against firm capabilities, turns gaps into a response plan and focused expert questions, develops source-grounded content, and rechecks the work through approval.',
    highlights: [
      ['Measurable Quality', 'Evaluate the response against this pursuit, its evidence, and buyer priorities.'],
      ['Dynamic Workflow', 'Keep requirements, owners, expert input, revisions, and review moving together.'],
      ['Continuous Improvement', 'Preserve approved context the next pursuit can use.'],
    ],
    sections: [
      {
        id: 'fit', eyebrow: 'Is Propagent right for your firm?',
        title: 'Built for pursuits that take more than a good writer.',
        paragraphs: [submissionAnswer, 'Propagent fits architecture, engineering, and construction teams whose responses depend on project experience, team credentials, technical approach, and expert input. Connect that work from the pursuit decision through response review.'],
        bullets: [
          'Your proposal team coordinates several contributors, offices, or disciplines.',
          'Relevant proof lives across project records, résumés, past responses, and people’s experience.',
          'Requirements and revisions affect more than one section of the submission.',
          'You want the next pursuit to retain the decisions and approved knowledge from this one.',
        ],
        links: [['/aec-proposal-software-guide/', 'Compare the buying criteria in the AEC software guide']],
      },
      {
        eyebrow: 'Connected workflow',
        title: 'From requirements analysis to final approval.',
        steps: [
          ['01', 'Bid Intake', 'Understand the issuer’s intent, requirements, evaluation criteria, risks, and submission instructions.'],
          ['02', 'Gap Analysis', 'Match the opportunity with firm experience, project and team evidence, capacity, and missing information.'],
          ['03', 'Go / No-Go', 'Weigh fit, competitiveness, risk, and readiness before committing the team to the response.'],
          ['04', 'Answer Coordination', 'Turn requirements into a response plan and route focused questions to the right experts with Confidence Routing.'],
          ['05', 'Response Development', 'Build the case in the firm’s voice, incorporate approved answers, check related sections and sources, and carry revisions through review and approval.'],
        ],
        afterSteps: ['Response memory', 'Approved evidence, expert answers, decisions, and review history carry forward into the next pursuit.'],
      },
      {
        eyebrow: 'What teams receive',
        title: 'See what is complete, what is missing, and what needs a decision.',
        table: {
          caption: 'The work your team reviews', headers: ['Output', 'What it helps you decide'],
          rows: [
            ['Requirements and compliance record', 'What the solicitation requires, where each item is addressed, who owns it, and what remains open.'],
            ['Capability and gap analysis', 'Which project and team evidence supports the pursuit—and which claims need more proof.'],
            ['Response plan and focused expert questions', 'What happens next and which person can resolve the missing information.'],
            ['Source-grounded content and review state', 'What is ready for review, what changed, and which commitments still need approval.'],
            ['Approved pursuit knowledge', 'Which evidence, expert answers, and decisions the next team can reuse.'],
          ],
        },
        links: [
          ['/aec-proposal-software-guide/#worked-example', 'Follow project evidence, expert input, and an addendum through a worked example'],
          [customerStoryPath, 'Read how a design-build team reached the shortlist'],
          ['/rfp-compliance-matrix/#worksheet', 'Inspect the filled compliance matrix'],
          ['/aec-go-no-go-scoring/#worksheet', 'See how the Go/No-Go decision is recorded'],
        ],
      },
      {
        id: 'customer-results', eyebrow: 'From a real customer pursuit', title: 'Useful drafts. Recommendations put into practice.',
        paragraphs: ['A municipal design-build team received an initial draft in 30 minutes compared with its five-day drafting process. Research, evidence preparation, and later reviews were separate.', 'The team implemented 29 of 40 assessable recommendations in later drafts — 14 fully and 15 partly — and was shortlisted. The case shows both drafting speed and the revisions that followed.'],
        links: [[customerStoryPath, 'See the results and the response changes']],
      },
      {
        id: 'getting-started', eyebrow: 'Getting started', title: 'Start with a pursuit and the evidence behind it.',
        table: {
          caption: 'Prepare for your first pursuit', headers: ['Your firm brings', 'What we work through together'],
          rows: [
            ['An RFP, RFQ, SOQ, or SF 330 pursuit, its attachments, and any addenda', 'The submission requirements, evaluation criteria, response scope, and review checkpoints.'],
            ['Approved project sheets, team résumés, and relevant prior responses', 'Which sources are current and useful; which facts need an expert’s confirmation.'],
            ['A pursuit owner and access to the relevant technical experts', 'Responsibilities for source review, expert questions, strategic decisions, and final approval.'],
            ['Your existing document workflow and IT requirements', 'The connections, deployment option, access needs, and output workflow for your firm.'],
          ],
        },
        paragraphs: ['Your firm selects the source material, validates its accuracy, and owns pursuit decisions. Propagent helps scope the setup and response workflow with your team. Hands-on support grows with your response volume; the implementation scope is agreed with your firm.'],
        links: [['/#pricing', 'See volume-based pricing'], ['/security/', 'Review security and procurement']],
      },
      {
        id: 'formats', eyebrow: 'Documents in. Deliverables out.', title: 'Work with the formats your proposal team uses.',
        table: {
          caption: 'Supported product input and output', headers: ['Workflow', 'Formats'],
          rows: [['Input', inputFormats], ['Output', outputFormats]],
        },
        paragraphs: ['Bring solicitation files and firm evidence into the pursuit, then prepare the response for review, document production, or layout. Your team retains final editorial and submission approval.'],
      },
      {
        id: 'connections', eyebrow: 'Your existing systems', title: 'Connect the records and conversations behind the response.',
        paragraphs: ['Your CRM, project records, and document-production tools serve different jobs. Propagent connects requirements, evidence, expert input, and review around the pursuit. Your implementation defines which records and workflows are connected.'],
        table: { caption: 'Propagent connections and accelerators', headers: ['System', 'Connection type'], rows: connectionRows },
        links: [['/security/#data-protection', 'Explore data protection and deployment options']],
      },
    ],
    checkpoint: 'People set the win strategy, contribute firm and relationship expertise, resolve sensitive or ambiguous work, make commercial decisions, and approve the response.',
    faqs: [
      ['What is AI proposal management software for AEC?', 'It is software that uses AI to help architecture, engineering, and construction firms analyze solicitations, connect requirements to firm knowledge, coordinate contributors, build response content, and review the work. Propagent extends that idea into a connected, system-led response process.'],
      ['Does Propagent support RFP, RFQ, SOQ, and SF 330 responses?', submissionAnswer],
      ['Does Propagent only write proposal text?', 'No. Propagent connects requirements analysis, capability matching, gap detection, response planning, focused expert input, source-grounded content, quality checks, and reusable operational memory.'],
      ['Does Propagent replace proposal managers or SMEs?', 'No. The system carries process work while proposal managers control strategy and approval and SMEs contribute the expertise and judgment the response requires.'],
      ['Can Propagent work with a real RFP?', 'Yes. Bring a live opportunity to a Propagent demo or use the free RFP Grader for an initial analysis.'],
      ['What do we need to get started?', 'Bring an RFP, RFQ, SOQ, or SF 330 pursuit with its instructions and addenda, approved project sheets and résumés, relevant prior responses, and a named pursuit owner.'],
      ['Is Propagent priced by seats or response volume?', 'Pricing is based on annual response volume, not seat counts. Every tier includes the full proposal workflow. Larger-volume clients receive more hands-on time from Propagent; the support scope is agreed with your firm.'],
      ['Which input and output formats does Propagent support?', `Propagent accepts ${inputFormats}. It supports ${outputFormats}.`],
      ['Does Propagent connect to our existing systems?', connectionAnswer],
      ['Can Propagent run on-premises or in a local cloud?', deploymentOptions],
    ],
    cta: ['See the full pursuit workflow', 'Bring an RFP, RFQ, SOQ, or SF 330 pursuit and see how Propagent connects requirements, evidence, expert input, drafting, and review.', '/60min-meeting', 'Book a Propagent demo'],
    related: ['aec-operational-memory', 'rfp-compliance-matrix', 'source-grounded-proposal-drafting'],
  },
  {
    slug: 'aec-operational-memory',
    title: 'AEC Operational Memory for Proposals and Pursuits | Propagent',
    navLabel: 'Operational memory',
    eyebrow: 'Institutional knowledge that stays useful',
    h1: 'Stop searching old proposals. Start with connected operational memory.',
    description: 'Connect AEC project sheets, CVs, résumés, past performance, expert answers, and approved review history to the requirements of the next proposal pursuit.',
    answer: 'AEC operational memory is the approved knowledge created while a pursuit moves: requirements, proof, decisions, expert input, edits, and review history. Propagent connects that context to each new RFP so teams receive relevant evidence, insight, or a focused question—not a pile of old proposals—while each firm’s private knowledge remains isolated.',
    highlights: [
      ['More than documents', 'Preserve the decisions, evidence, and expert context behind the final response.'],
      ['Connected to the requirement', 'Retrieve knowledge because it fits this pursuit, not because keywords happen to match.'],
      ['Private to your firm', 'Each firm’s private knowledge remains its own.'],
    ],
    sections: [
      memoryRecordsSection,
      {
        eyebrow: 'The knowledge problem',
        title: 'The final document leaves most of the useful work behind.',
        paragraphs: [
          'Past proposals can show what the firm submitted, but not always why the team chose that positioning, which evidence reviewers trusted, what an expert corrected, or which statement became stale. Those decisions often remain in email, comments, meetings, spreadsheets, and people’s heads.',
          'Operational memory preserves the approved work behind the response and reconnects it to future requirements. The goal is not to return more old content. It is to provide useful evidence, an informed direction, or a focused question that moves the active pursuit forward.',
        ],
      },
      {
        eyebrow: 'What becomes reusable',
        title: 'Capture the context that generic search cannot see.',
        cards: [
          ['Requirements and interpretations', 'What the buyer asked, how the team interpreted it, and which source governed the decision.', '/rfp-compliance-matrix/'],
          ['Firm proof and expert input', 'Projects, people, credentials, facts, and approved answers connected to the work they support.', '/sme-coordination/'],
          ['Decisions and review history', 'Positioning choices, edits, open questions, approvals, and lessons that shaped the response.', '/source-grounded-proposal-drafting/'],
        ],
      },
      {
        eyebrow: 'Meaningful search',
        title: 'Propagent turns search into insight—not a stack of old answers.',
        bullets: [
          'Connect the active requirement to relevant experience and proof.',
          'Show why the evidence is useful and where it came from.',
          'Surface missing context instead of filling the gap with generic language.',
          'Turn the missing context into a focused question for the right person.',
          'Preserve the approved answer and decision for future pursuits.',
        ],
      },
    ],
    proof: {
      title: 'See the firm’s knowledge in the context of this pursuit.',
      body: 'Relevant proof, prior decisions, expert context, and approval history stay connected to the active requirement so the next action is clear.',
      items: ['Source and approval history visible', 'Knowledge connected to the active RFP', 'Firm-private context preserved for future work'],
      artifact: [['Active requirement', 'Comparable terminal-delivery experience'], ['Connected context', 'Approved project record and prior response'], ['Next action', 'Confirm current staff availability']],
    },
    checkpoint: 'People confirm relevance, correct stale information, add relationship context, and approve knowledge before it becomes part of the response or reusable firm memory.',
    faqs: [
      ['What is operational memory for AEC proposals?', 'Operational memory is the approved context created through proposal work: requirements, evidence, decisions, expert input, drafts, edits, review history, and outcomes. It is more useful than a final-document library because it preserves why the work changed.'],
      ['How is operational memory different from enterprise search?', 'Enterprise search retrieves files or passages. Operational memory connects relevant evidence and prior decisions to the active requirement and can identify when a focused expert question is still needed.'],
      ['Does Propagent learn from one firm’s data to help another firm?', 'No. Each firm’s operational memory remains private to that firm. Propagent does not pool one customer’s proposal knowledge with another customer.'],
      ['Does old content get reused without review?', 'No. People confirm relevance, resolve stale or sensitive information, and approve what belongs in the current response.'],
    ],
    cta: ['Put your firm’s knowledge to work', 'See how a live RFP connects to the proof, decisions, and people already inside your firm.', '/60min-meeting', 'Review a real pursuit'],
    related: ['ai-proposal-management-aec', 'sme-coordination', 'source-grounded-proposal-drafting'],
  },
  {
    slug: 'aec-go-no-go-scoring',
    title: 'AEC Go/No-Go Scoring and Pursuit Qualification | Propagent',
    navLabel: 'Go/no-go scoring',
    eyebrow: 'Pursuit qualification',
    h1: 'Make the go/no-go decision visible before the proposal hours begin.',
    description: 'See how Propagent frames AEC go/no-go decisions around strategic fit, requirements, evidence readiness, risk, capacity, pursuit cost, and accountable human judgment.',
    answer: 'Propagent makes the pursuit decision traceable instead of hiding it behind a single number. It compares each opportunity with strategic fit, requirements, evidence readiness, risk, capacity, and pursuit cost; shows the supporting evidence and gaps; and keeps the final pursue/no-pursue decision with firm leadership.',
    highlights: [
      ['Pursuit-specific', 'Evaluate this opportunity against the firm’s priorities and proof.'],
      ['Evidence visible', 'Show why the opportunity looks strong, weak, or uncertain.'],
      ['Leadership decides', 'The system frames the decision; people own it.'],
    ],
    sections: [
      qualificationExample,
      {
        eyebrow: 'Why go/no-go breaks down',
        title: 'Separate eligibility from the reasons you want to win.',
        paragraphs: [
          'Mandatory submission and qualification requirements set the floor. Strategic fit, client relationships, and growth priorities help leadership decide whether an eligible pursuit deserves the team’s time. Keep those judgments separate so a strong relationship does not hide a missing qualification.',
          'An unknown is a focused check with an owner and a deadline. A confirmed inability to meet a mandatory requirement is a different decision. In the stormwater pursuit, hold means resolve the evidence and capacity questions before committing the full team.',
        ],
      },
      {
        eyebrow: 'Decision record',
        title: 'Keep the basis of the decision with the decision.',
        paragraphs: ['Record the requirement, the evidence you have, the unresolved question, its owner, and the decision deadline. Add the principal’s final call and its conditions. Use the blank worksheet above for your own pursuit; it does not calculate a Propagent score or a win probability.'],
      },
      {
        eyebrow: 'Win probability',
        title: 'A pursuit decision is not a win prediction.',
        paragraphs: [
          'Approving a pursuit means leadership accepts the case for committing resources. It does not establish the probability of winning. Preserve the original reasoning so the firm can review the decision alongside the eventual outcome.',
        ],
      },
      {
        eyebrow: 'Further reading',
        title: 'Why construction firms need a stronger RFP approval process.',
        paragraphs: [
          'In Construction Executive, Propagent Co-founder and CEO Daniel Beecham explains how informal pursuit choices consume senior time and why durable decision records make future Go/No-Go decisions stronger.',
        ],
        media: [pressMedia.authored[0]],
      },
    ],
    checkpoint: 'Firm leadership makes the final pursue/no-pursue decision and can add relationship, capacity, commercial, and strategic context that no document alone contains.',
    faqs: [
      ['What is go/no-go scoring for AEC pursuits?', 'It is a structured way to evaluate whether an opportunity fits the firm, whether the evidence and team are ready, what risks and costs exist, and whether committing proposal resources is warranted.'],
      ['Does go/no-go scoring predict whether the firm will win?', 'It organizes evidence and confidence factors, but it is not a guarantee. Propagent keeps the basis, uncertainty, and human decision visible.'],
      ['Which factors matter in an AEC go/no-go process?', 'Common factors include strategic and client fit, project relevance, firm proof, team availability, requirements, contract risk, competitive context when verified, response cost, and the quality of the available evidence.'],
      ['Who makes the final decision?', 'The designated firm leader or pursuit owner. Propagent frames and records the decision without removing executive judgment.'],
    ],
    cta: ['Put a real opportunity through the decision', 'Bring an RFP and see how requirements, evidence, risk, readiness, and judgment come together.', '/60min-meeting', 'See it in a demo'],
    related: ['rfp-compliance-matrix', 'aec-operational-memory', 'ai-proposal-management-aec'],
  },
  {
    slug: 'rfp-compliance-matrix',
    title: 'RFP Compliance Matrix: AEC Example & Excel Template | Propagent',
    navLabel: 'RFP compliance matrix',
    eyebrow: 'Requirements control',
    h1: 'Turn the RFP into a living compliance matrix.',
    description: 'See a filled AEC RFQ compliance matrix, source excerpts, and an addendum before-and-after. Download the free editable Excel template. No signup.',
    answer: 'An RFP compliance matrix converts solicitation requirements, evaluation criteria, forms, deadlines, and addenda into a living response control record. Propagent links each item to its source, owner, status, evidence, and affected section so missed requirements surface early and the matrix stays current as the response changes. People resolve ambiguity and approve exceptions.',
    highlights: [
      ['Traceable', 'Every requirement stays connected to its source.'],
      ['Living', 'Status changes with the response rather than waiting for a pre-submit check.'],
      ['Accountable', 'Owners, open questions, evidence, and approvals remain visible.'],
    ],
    sections: [
      complianceExample,
      {
        id: 'requirements-parser', eyebrow: 'RFP requirements parsing', title: 'Turn instructions into work your team can manage.',
        paragraphs: ['Propagent parses the solicitation into source-linked requirements, evaluation criteria, forms, deadlines, and addenda. Each requirement stays connected to its owner, evidence, response location, and review status.', 'A page limit, a required project count, and a scored technical narrative demand different actions. Keep the instruction and its source beside the response work so the team can resolve gaps and revise the right sections.'],
        table: {
          caption: 'From a parsed instruction to a controlled response', headers: ['Instruction', 'Response action'],
          rows: [
            ['A page or form limit', 'Map it to the affected section and check the assembled response against the limit.'],
            ['A comparable-project or personnel requirement', 'Connect the requirement to qualifying project records, team credentials, and any missing expert input.'],
            ['A changed requirement in an addendum', 'Record the new source and reopen the affected response work for review.'],
          ],
        },
      },
      {
        eyebrow: 'From a real pursuit',
        title: 'Six reference leads. A two-page limit.',
        paragraphs: ['In a municipal design-build pursuit, the proposed reference package would occupy three pages against a two-page limit. Propagent’s review identified the conflict, and the team consolidated all six leads into two pages. The correction remained in the submitted response. The team was shortlisted.'],
        links: [[customerStoryPath, 'Read the customer story']],
      },
      {
        eyebrow: 'Mandatory versus scored',
        title: 'Passing the instructions is not the same as making the strongest case.',
        paragraphs: [
          'Mandatory rows track instructions your team must satisfy, such as required forms, project counts, and acknowledgments. Scored rows track how evaluators judge the quality and relevance of your response. A section can contain both: a required narrative may also be scored for its substance.',
          'Classify each item from the solicitation’s actual wording. Do not invent weights or assume every omission has the same consequence. If the instructions conflict or the consequence is unclear, record the question and resolve it through the buyer’s permitted clarification process.',
        ],
      },
      {
        eyebrow: 'Beyond compliance',
        title: 'Use the matrix to strengthen the case to win.',
        paragraphs: [
          'Compliance is the floor. The same requirement map can help the team connect evaluation criteria to firm proof, identify weak evidence, coordinate missing input, and keep the response focused on what the buyer will score.',
          'That turns the matrix from a pre-submit checklist into a living record of requirements, evidence, owners, and response status.',
        ],
      },
    ],
    checkpoint: 'People resolve ambiguous requirements, approve exceptions, validate commitments, and confirm that the final response satisfies both the submission instructions and the pursuit strategy.',
    faqs: [
      ['What is an RFP compliance matrix?', 'It is a structured record of solicitation requirements, evaluation criteria, forms, deadlines, owners, evidence, response locations, and completion status.'],
      ['Is there a free editable compliance matrix template?', 'Yes. Download the Excel workbook on this page for a blank matrix, a filled fictional AEC example, and the source RFQ and addendum excerpts. You can also use the browser worksheet and print it or save it as a PDF. Neither requires signup.'],
      ['Can AI parse an RFP and build a compliance matrix?', 'Propagent identifies and organizes requirements while keeping every item connected to its source and giving people a clear way to resolve ambiguity and approve exceptions.'],
      ['How does Propagent handle addenda?', 'Propagent keeps new or changed requirements connected to the original source, shows which response work is affected, and triggers review where commitments or instructions changed.'],
      ['Is a compliance matrix enough to create a winning response?', 'No. It prevents avoidable misses, but the team still has to connect buyer priorities to credible firm proof and develop a persuasive case to win.'],
    ],
    cta: ['Start with the RFP in front of you', 'Use the free RFP Grader for an initial read, or bring the document to a Propagent demo.', '/rfp-grader/', 'Grade an RFP'],
    related: ['source-grounded-proposal-drafting', 'sme-coordination', 'aec-go-no-go-scoring'],
  },
  {
    slug: 'sme-coordination',
    title: 'SME Coordination for AEC Proposal Responses | Propagent',
    navLabel: 'SME coordination',
    eyebrow: 'Focused knowledge capture',
    h1: 'Ask the right expert a focused question—not for another packet review.',
    description: 'See how Propagent turns proposal gaps into focused SME questions with the relevant requirement, context, ownership, deadline, and human approval.',
    answer: 'Propagent reduces the SME bottleneck by turning missing facts or low-confidence work into a focused question for the right expert, with the relevant requirement, existing context, and deadline attached. Approved input returns to the affected response work while the proposal owner controls exceptions, positioning, and final approval.',
    highlights: [
      ['Focused', 'Ask for the missing fact or judgment, not a review of the entire response.'],
      ['Context included', 'Attach the requirement, current evidence, and why the answer matters.'],
      ['Approval visible', 'The proposal owner controls how expert input changes the response.'],
    ],
    sections: [
      {
        eyebrow: 'The SME bottleneck',
        title: 'Expert time is scarce. Broad requests make it scarcer.',
        paragraphs: [
          'Subject-matter experts are often pulled into proposals late, with a large packet and an unclear ask. They repeat facts the firm already has, search for context, or review material that does not require their judgment. Proposal managers then chase responses and manually work the answers back into multiple sections.',
          'Propagent narrows that interaction. When the available evidence is not enough, it turns the gap into a focused question and supplies the context the expert needs to answer it.',
        ],
      },
      {
        eyebrow: 'The focused question',
        title: 'Give the expert the requirement, current context, and decision.',
        steps: [
          ['01', 'Identify the gap', 'Show which requirement, claim, or decision lacks sufficient evidence or confidence.'],
          ['02', 'Find the right expertise', 'Connect the question to the person or role most able to resolve it.'],
          ['03', 'Scope the request', 'Provide the relevant context, what is already known, what is missing, and when it is needed.'],
          ['04', 'Use the approved answer', 'Return the expert input to the affected response work with its source and approval state visible.'],
          ['05', 'Preserve the knowledge', 'Keep the approved answer available when a future pursuit asks a related question.'],
        ],
      },
      {
        eyebrow: 'Dynamic workflow',
        title: 'Keep the response moving without removing owner control.',
        bullets: [
          'Proposal owners see which questions are open and why they matter.',
          'Experts receive focused work rather than full-packet review requests.',
          'Approved input stays connected to the requirement and affected sections.',
          'Changes that create new gaps return to the response plan.',
          'Sensitive, ambiguous, and strategic work remains with people.',
        ],
      },
    ],
    proof: {
      title: 'A focused expert request, connected to the response.',
      body: 'The expert sees the exact question, requirement, existing context, deadline, and affected section instead of receiving a packet and a vague request for help.',
      items: ['Focused question with useful context', 'Named responsibility and status', 'Approved answer connected to response work'],
      artifact: [['Question', 'Confirm the commissioning lead and role'], ['Context', 'RFP §6.1 · team requirement'], ['Deadline · status', 'Tomorrow · expert input requested']],
    },
    checkpoint: 'Experts supply firm knowledge and professional judgment. Proposal owners decide how that input affects positioning and approve the response.',
    faqs: [
      ['How can AEC firms reduce the SME bottleneck in proposals?', 'Ask experts only for the missing fact or judgment, include the requirement and existing context, make ownership and timing clear, and connect the approved answer back to the response work.'],
      ['What is a focused SME question?', 'It is a bounded request tied to a specific requirement, gap, claim, or decision, with enough context for the expert to respond without reviewing the entire proposal.'],
      ['Does the system decide which expert answer is final?', 'No. Experts provide knowledge and proposal owners control positioning, exception handling, and final approval.'],
      ['Does Propagent preserve approved SME knowledge?', 'Yes. Approved expert input stays connected to its source so your team can reuse it on later pursuits within the same firm.'],
    ],
    cta: ['Bring the response that keeps stalling', 'See how missing knowledge becomes focused expert work without turning SMEs into proposal coordinators.', '/60min-meeting', 'Review the workflow'],
    related: ['aec-operational-memory', 'source-grounded-proposal-drafting', 'rfp-compliance-matrix'],
  },
  {
    slug: 'source-grounded-proposal-drafting',
    title: 'Source-Grounded Proposal Drafting for AEC | Propagent',
    navLabel: 'Source-grounded drafting',
    eyebrow: 'Evidence before prose',
    h1: 'Draft from what the buyer asks and what the firm can prove.',
    description: 'Learn how Propagent connects proposal content to RFP requirements, firm-approved evidence, open questions, related sections, human review, and final approval.',
    answer: 'Source-grounded proposal drafting begins with what the RFP asks and what the firm can substantiate. Propagent connects claims to firm-approved evidence, flags unsupported statements and open questions, keeps related sections aligned as edits occur, and carries content toward the firm’s voice and the buyer’s priorities. Reviewers see the sources and approve the final work.',
    highlights: [
      ['Requirement-led', 'Start with the buyer’s question and evaluation criteria.'],
      ['Evidence visible', 'Keep claims connected to approved firm sources.'],
      ['Carried through review', 'Treat the first draft as a checkpoint, not the finish line.'],
    ],
    sections: [
      {
        eyebrow: 'Why grounding matters',
        title: 'Fluent language is not the same as a defensible proposal claim.',
        paragraphs: [
          'Proposal content has to be specific to the buyer and credible for the firm. Generic language can sound polished while relying on stale boilerplate, weak proof, or claims that contradict another section of the response.',
          'Source-grounded drafting keeps the requirement, the firm’s approved evidence, the developing content, and the reviewer’s decision connected. Where support is weak or missing, Propagent surfaces the gap rather than hiding it behind confident prose.',
        ],
      },
      {
        eyebrow: 'Content maturity',
        title: 'Carry the content beyond a rough first draft.',
        steps: [
          ['01', 'Start with the requirement', 'Use the buyer’s request, evaluation criteria, and submission context as the frame.'],
          ['02', 'Connect approved proof', 'Bring forward relevant projects, people, facts, credentials, and prior approved material.'],
          ['03', 'Expose the gaps', 'Flag unsupported statements, stale information, contradictions, and questions that need expert judgment.'],
          ['04', 'Mature the response', 'Improve buyer alignment, firm voice, clarity, consistency, and related-section coherence.'],
          ['05', 'Review and approve', 'Show sources and open decisions so a person can resolve and approve the final work.'],
        ],
      },
      {
        eyebrow: 'Visible trust',
        title: 'Give reviewers the source behind every substantive claim.',
        bullets: [
          'Show which requirement the content addresses.',
          'Keep supporting evidence and its origin available to reviewers.',
          'Mark missing or contested support as an open question.',
          'Recheck related sections when approved content changes.',
          'Leave strategic, commercial, legal, and final decisions with people.',
        ],
        links: [['/aec-proposal-software-guide/#worked-example', 'See a stormwater response take shape from its sources']],
      },
    ],
    proof: {
      title: 'The source trail stays with the content.',
      body: 'Reviewers can inspect the requirement, supporting evidence, open questions, related-section checks, revisions, and approval state behind substantive response claims.',
      items: ['Requirement and source visible', 'Unsupported claims and open questions surfaced', 'Revision and human approval trace'],
      artifact: [['Response claim', 'The proposed team has delivered occupied renovations'], ['Support', 'Approved project record · page 3'], ['Review', 'Evidence present · owner approval open']],
    },
    checkpoint: 'Reviewers validate the evidence, resolve ambiguity, make positioning and commercial decisions, and approve the final response.',
    faqs: [
      ['What is source-grounded proposal drafting?', 'It is a drafting process that connects response content to the RFP requirement and firm-approved evidence, makes gaps visible, and preserves human review and approval.'],
      ['Does source-grounded mean every sentence needs a footnote?', 'No. It means substantive firm claims and response decisions have a defensible basis reviewers can inspect when trust matters.'],
      ['What happens when the firm does not have enough evidence?', 'Propagent surfaces the gap as a missing source, open question, or positioning decision instead of covering it with generic language.'],
      ['Does Propagent submit proposals without human approval?', 'No. People remain responsible for strategy, sensitive decisions, review, and final approval.'],
    ],
    cta: ['See what your current response can prove', 'Grade an RFP or draft response, then see how requirements, evidence, gaps, and review connect.', '/rfp-grader/', 'Use the free RFP Grader'],
    related: ['rfp-compliance-matrix', 'aec-operational-memory', 'sme-coordination'],
  },
  {
    slug: 'security',
    title: 'Propagent Security & Procurement Review for AEC Firms',
    navLabel: 'Security',
    eyebrow: 'Propagent security and procurement',
    h1: 'Security, privacy, and responsible AI by design.',
    description: 'Customer data is not used to train models. Explore tenant-isolated cloud hosting, on-premises and local-cloud options, retention principles, and assurance status.',
    answer: `${modelTrainingPolicy} ${deploymentOptions} The system is built with GDPR requirements, SOC 2 Trust Services Criteria, ISO/IEC 27001, and ISO/IEC 42001 in mind. People remain responsible for judgment and final approval.`,
    highlights: [
      ['No model training', modelTrainingPolicy],
      ['Tenant-isolated cloud', 'Customer data is isolated by tenant.'],
      ['Deployment options', 'Cloud, on-premises, and local-cloud options for your firm.'],
    ],
    sections: [
      {
        id: 'data-protection', eyebrow: 'Your firm’s data', title: 'Clear answers for your IT and proposal teams.',
        table: {
          caption: 'Customer data and deployment', headers: ['Question', 'Propagent’s approach'],
          rows: [
            ['Is our data used to train models?', modelTrainingPolicy],
            ['Where can we run Propagent?', deploymentOptions],
            ['How are retention and deletion handled?', retentionPolicy],
          ],
        },
        paragraphs: ['Review the retention periods, deletion process, and backup handling for your deployment with our team. We also work through your data-location, access, and service-provider requirements during procurement.'],
      },
      {
        eyebrow: 'Standards-informed design',
        title: 'A foundation for your firm’s review.',
        paragraphs: [
          'Propagent’s system design accounts for information-security risk management, privacy, and AI governance. These reference points inform how we approach the product.',
          'Propagent is not currently ISO-certified and does not claim independent SOC 2 assurance. These references describe our design approach, not third-party certification.',
        ],
        table: {
          caption: 'The reference points informing our design', headers: ['Reference', 'Focus'],
          rows: [
            ['GDPR', 'Personal-data protection, including privacy by design and data minimization.'],
            ['SOC 2 Trust Services Criteria', 'Evaluating controls relevant to the services a customer relies on.'],
            ['ISO/IEC 27001', 'Managing information-security risks and organizational responsibilities.'],
            ['ISO/IEC 42001', 'Managing AI-related risks, responsibilities, and ongoing oversight.'],
          ],
        },
      },
      {
        eyebrow: 'Inside the pursuit workflow', title: 'Evidence stays visible. Decisions stay with your team.',
        bullets: [
          'Source-grounded responses connect claims to the firm evidence behind them.',
          'Missing facts and conflicting information remain visible for expert review.',
          'People resolve sensitive questions, validate commitments, and approve the response.',
          'Approved pursuit knowledge preserves the context behind the finished document.',
        ],
        links: [['/aec-proposal-software-guide/#worked-example', 'See the evidence and human checkpoints in an illustrative pursuit']],
      },
      {
        eyebrow: 'Controlled diligence',
        title: 'Get the detail your review requires.',
        paragraphs: [
          'Propagent provides current, customer-relevant facts about controls and the data lifecycle. When available, appropriate, and required, Propagent shares sensitive architecture, testing, or customer-specific material through a controlled diligence process.',
          'The review distinguishes current capabilities from planned work and identifies open items directly, so your team can make an informed procurement decision.',
        ],
      },
    ],
    checkpoint: 'Customer administrators control what firm data enters the system and who is authorized to use it. People remain responsible for reviewing sensitive outputs and approving external submissions.',
    faqs: [
      ['Does Propagent use customer data to train models?', `No. ${modelTrainingPolicy}`],
      ['What hosting and deployment options are available?', deploymentOptions],
      ['What is Propagent’s approach to retention and deletion?', `${retentionPolicy} Review the retention periods, deletion process, and backup handling for your deployment with our team.`],
      ['Is Propagent ISO-certified or independently SOC 2-assured?', 'Propagent is not currently ISO-certified and does not claim independent SOC 2 assurance. Its system design accounts for GDPR requirements, SOC 2 Trust Services Criteria, ISO/IEC 27001, and ISO/IEC 42001. These references describe the design approach, not third-party certification.'],
      ['What security information does Propagent provide for review?', 'Propagent provides current information relevant to data flow, hosting, access controls, encryption posture, retention, deletion, backups, subprocessors, incident contact, and procurement. It also identifies which contractual documents and certifications are currently available.'],
      ['Why does proposal data require special care?', 'It can contain confidential client, employee, project, pricing, contract, partner, and active-pursuit information that affects both commercial and professional obligations.'],
      ['How does Propagent handle sensitive security detail?', 'Your team receives clear control and data-lifecycle information. Propagent shares sensitive topology, detection methods, testing artifacts, and customer-specific details only when those materials are available and appropriate for the diligence process.'],
      ['How can I complete a Propagent security review?', 'Email Propagent with your firm-specific questionnaire, diligence priorities, and contractual requirements to receive current review materials and coordinate follow-up questions.'],
    ],
    cta: ['Start a security review', 'Send us your questionnaire or diligence requirements. We will provide the current Propagent materials and work through open questions with your team.', 'mailto:daniel@propagent.ai?subject=Propagent%20security%20and%20procurement%20review', 'Start the security review'],
    related: ['about', 'ai-proposal-management-aec', 'resources'],
  },
];

export const pageSlugs = Object.freeze(pages.map((page) => `/${page.slug}/`));

// Dates represent substantive content edits, never the clock time of a rebuild.
export const pageDates = Object.freeze(Object.fromEntries([
  ['/', '2026-10-06'], ['/rfp-grader/', CONTENT_DATE],
  ...pages.map(page => [`/${page.slug}/`, modifiedDates[page.slug] || CONTENT_DATE]),
]));

export const llmsResourceLinks = [
  '## Propagent resources',
  '',
  ...pages.map((page) => `- [${page.navLabel}](${SITE}/${page.slug}/): ${page.description}`),
].join('\n');

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const renderHighlights = (items = []) => items.length ? `
  <div class="content-highlights" aria-label="Key points">
    ${items.map(([title, body]) => `<article class="content-highlight"><span class="mono-label">${escapeHtml(title)}</span><p>${escapeHtml(body)}</p></article>`).join('\n')}
  </div>` : '';

const renderCards = (items = []) => items.length ? `
  <div class="content-card-grid">
    ${items.map(([title, body, href, label, id]) => {
      const idAttribute = id ? ` id="${escapeHtml(id)}"` : '';
      return href
        ? `<a class="content-card"${idAttribute} href="${escapeHtml(href)}"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p><span>${escapeHtml(label || 'Read the guide')} <span aria-hidden="true">→</span></span></a>`
        : `<article class="content-card content-card--static"${idAttribute}><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></article>`;
    }).join('\n')}
  </div>` : '';

const renderMediaEntries = (items = [], variant = 'default') => {
  if (!items.length) return '';
  const className = `content-media-list content-media-list--${escapeHtml(variant)}`;
  return `
  <div class="${className}">
    ${items.map((item) => {
      const content = `
        <div class="content-media-meta"><span>${escapeHtml(item.format)}</span><time${item.isoDate ? ` datetime="${escapeHtml(item.isoDate)}"` : ''}>${escapeHtml(item.date)}</time></div>
        <span class="content-media-outlet">${escapeHtml(item.outlet)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary)}</p>`;
      if (variant === 'featured') {
        return `<article class="content-media-item content-media-item--featured">
          ${content}
          <div class="content-media-actions">
            <a class="content-media-link" href="${escapeHtml(item.url)}">${escapeHtml(item.cta || 'View the source')} <span aria-hidden="true">↗</span></a>
            ${item.relatedHref ? `<a class="content-media-link content-media-link--internal" href="${escapeHtml(item.relatedHref)}">${escapeHtml(item.relatedLabel || 'Explore Propagent')} <span aria-hidden="true">→</span></a>` : ''}
          </div>
        </article>`;
      }
      return `<a class="content-media-item${variant === 'compact' ? ' content-media-item--compact' : ''}" href="${escapeHtml(item.url)}">
        ${content}
        <span class="content-media-link">${escapeHtml(item.cta || 'View the source')} <span aria-hidden="true">↗</span></span>
      </a>`;
    }).join('\n')}
  </div>`;
};

const renderSectionMedia = (section) => {
  const media = renderMediaEntries(section.media, section.mediaVariant);
  if (!media || !section.collapsible) return media;
  const count = section.media.length;
  return `
    <details class="content-media-archive">
      <summary>${escapeHtml(section.archiveLabel || `View ${count} additional ${count === 1 ? 'appearance' : 'appearances'}`)}</summary>
      ${media}
    </details>`;
};

const renderSteps = (items = []) => items.length ? `
  <ol class="content-steps">
    ${items.map(([number, title, body]) => `<li><span class="content-step-number">${escapeHtml(number)}</span><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></div></li>`).join('\n')}
  </ol>` : '';

const renderBullets = (items = []) => items.length ? `
  <ul class="content-list">
    ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n')}
  </ul>` : '';

const renderTable = (table) => table ? `<div class="guide-table-wrap${table.headers.length === 2 ? ' guide-table-wrap--pair' : ''}" tabindex="0" role="region" aria-label="${escapeHtml(table.caption)}"><table class="guide-table"><caption>${escapeHtml(table.caption)}</caption><thead><tr>${table.headers.map(h => `<th scope="col">${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${table.rows.map(row => `<tr>${row.map((cell, i) => i === 0 ? `<th scope="row">${escapeHtml(cell)}</th>` : `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
const renderDownloads = (items = []) => items.map(([href, label, note]) => `<p class="guide-download"><a class="btn" href="${escapeHtml(href)}"${href.endsWith('.xlsx') ? ' download' : ''}>${escapeHtml(label)} <span aria-hidden="true">→</span></a><small>${escapeHtml(note || 'Fill in your browser and print or save as PDF. No signup.')}</small></p>`).join('');

const renderSections = (sections = []) => sections.map((section, index) => `
  <section${section.id ? ` id="${escapeHtml(section.id)}"` : ''} class="content-section${index % 2 ? ' content-section--raised' : ''}${section.layout === 'wide' ? ' content-section--wide' : ''}">
    <div class="container content-section-inner">
      <div class="content-section-heading">
        <span class="mono-label">${escapeHtml(section.eyebrow)}</span>
        <h2>${escapeHtml(section.title)}</h2>
      </div>
      <div class="content-section-body">
        ${(section.paragraphs || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n')}
        ${section.downloadsFirst ? renderDownloads(section.downloads) : ''}
        ${renderWorkedExample(section.workedExample)}
        ${section.responseWalkthrough ? renderResponseWalkthrough() : ''}
        ${section.methodology ? renderCaseMethodology() : ''}
        ${section.complianceExample ? renderComplianceExample() : ''}
        ${renderTable(section.table)}
        ${section.downloadsFirst ? '' : renderDownloads(section.downloads)}
        ${renderBullets(section.bullets)}
        ${renderSteps(section.steps)}
        ${section.afterSteps ? `<p><strong>${escapeHtml(section.afterSteps[0])}.</strong> ${escapeHtml(section.afterSteps[1])}</p>` : ''}
        ${renderCards(section.cards)}
        ${renderSectionMedia(section)}
        ${(section.links || []).length ? `<ul class="content-inline-links">${section.links.map(([href, label]) => `<li><a href="${escapeHtml(href)}">${escapeHtml(label)} <span aria-hidden="true">→</span></a></li>`).join('')}</ul>` : ''}
      </div>
    </div>
  </section>`).join('\n');

const renderFaqs = (faqs = []) => faqs.map(([question, answer], index) => `
  <details class="content-faq"${index === 0 ? ' open' : ''}>
    <summary>${escapeHtml(question)}</summary>
    <p>${escapeHtml(answer)}</p>
  </details>`).join('\n');

const renderPressFeatured = (items = []) => {
  const [lead, ...secondary] = items;
  if (!lead) return '';

  return `
  <div class="press-featured-layout">
    <article class="press-featured-lead" data-press-url="${escapeHtml(lead.url)}">
      <a href="${escapeHtml(lead.url)}">
        <div class="press-item-meta"><span>${escapeHtml(lead.relationshipLabel || lead.format)}</span><time${lead.isoDate ? ` datetime="${escapeHtml(lead.isoDate)}"` : ''}>${escapeHtml(lead.date)}</time></div>
        <span class="press-item-outlet">${escapeHtml(lead.outlet)}</span>
        <h3>${escapeHtml(lead.title)}</h3>
        <p>${escapeHtml(lead.summary)}</p>
        <span class="press-featured-link">${escapeHtml(lead.cta || 'View the source')} <span aria-hidden="true">&#8599;</span></span>
      </a>
    </article>
    <div class="press-featured-stack">
      ${secondary.map((item) => `<article class="press-featured-secondary" data-press-url="${escapeHtml(item.url)}">
        <a href="${escapeHtml(item.url)}">
          <div class="press-featured-secondary-top"><span class="press-item-outlet">${escapeHtml(item.outlet)}</span><span aria-hidden="true">&#8599;</span></div>
          <h3>${escapeHtml(item.title)}</h3>
           <div class="press-item-meta"><span>${escapeHtml(item.relationshipLabel || item.format)}</span><time${item.isoDate ? ` datetime="${escapeHtml(item.isoDate)}"` : ''}>${escapeHtml(item.date)}</time></div>
        </a>
      </article>`).join('\n')}
    </div>
  </div>`;
};

const renderPressArchive = (items = []) => {
  return `<div class="press-archive-list">
        ${items.map((item) => `<a class="press-archive-item" href="${escapeHtml(item.url)}" data-press-url="${escapeHtml(item.url)}">
          <div class="press-archive-meta"><span>${escapeHtml(item.relationshipLabel || item.format)}</span><time${item.isoDate ? ` datetime="${escapeHtml(item.isoDate)}"` : ''}>${escapeHtml(item.date)}</time></div>
          <div class="press-archive-title"><span class="press-item-outlet">${escapeHtml(item.outlet)}</span><h3>${escapeHtml(item.title)}</h3></div>
          <span class="press-archive-arrow" aria-hidden="true">&#8599;</span>
        </a>`).join('\n')}
      </div>`;
};

const renderPressMain = (page) => {
  return `<main id="main" class="press-main">
    <header class="press-header">
      <div class="container">
        <nav class="content-breadcrumb" aria-label="Breadcrumb"><a href="/">Propagent</a><span aria-hidden="true">/</span><span>${escapeHtml(page.navLabel)}</span></nav>
        <div class="press-header-copy">
          <span class="mono-label">${escapeHtml(page.eyebrow)}</span>
          <h1>${escapeHtml(page.h1)}</h1>
          <p class="press-intro" data-direct-answer>${escapeHtml(page.intro)}</p>
        </div>
      </div>
    </header>
    <section class="press-featured">
      <div class="container">
        <div class="press-section-heading"><span class="mono-label">Featured</span><h2>Featured AEC coverage and perspectives</h2></div>
        ${renderPressFeatured(page.featuredMedia)}
      </div>
    </section>
    <section class="press-archive">
      <div class="container">
        <div class="press-section-heading"><span class="mono-label">More</span><h2>More AEC coverage and appearances</h2></div>
        ${renderPressArchive(page.archiveMedia)}
      </div>
    </section>
    <section class="press-close">
      <div class="container press-close-inner">
        <div class="press-close-copy"><span class="mono-label">About Propagent</span><h2>The pursuit system for the built world</h2><p>${escapeHtml(page.about)}</p></div>
        <div class="press-close-actions">
          <a href="/about/">About Propagent <span aria-hidden="true">&#8594;</span></a>
          <a href="${escapeHtml(page.productLink.href)}">${escapeHtml(page.productLink.label)} <span aria-hidden="true">&#8594;</span></a>
          <a href="${escapeHtml(page.contact.href)}">Media &amp; speaking inquiries <span aria-hidden="true">&#8594;</span></a>
        </div>
      </div>
    </section>
  </main>`;
};

const relatedPage = (slug) => pages.find((page) => page.slug === slug);

const organizationSchema = {
  '@type': 'Organization',
  '@id': `${SITE}/#org`,
  name: 'Propagent',
  url: `${SITE}/`,
  logo: `${SITE}/logo.svg`,
  description: 'The pursuit system for the built world and the next generation of proposal pursuit management for AEC firms.',
  foundingDate: '2024',
  founder: [
    { '@type': 'Person', '@id': `${SITE}/about/#daniel-beecham`, name: 'Daniel Beecham' },
    { '@type': 'Person', '@id': `${SITE}/about/#steve-ernst`, name: 'Steve Ernst' },
  ],
  sameAs: ['https://www.linkedin.com/company/propagent'],
  subjectOf: pressMedia.coverage.map((item) => ({
    '@type': item.schemaType,
    name: item.title,
    headline: item.title,
    datePublished: item.isoDate,
    url: item.url,
    publisher: { '@type': 'Organization', name: item.outlet },
  })),
};

const danielSchema = {
  '@type': 'Person',
  '@id': `${SITE}/about/#daniel-beecham`,
  name: 'Daniel Beecham',
  url: `${SITE}/about/#daniel-beecham`,
  jobTitle: 'Co-founder and CEO',
  worksFor: { '@id': `${SITE}/#org` },
  sameAs: [
    'https://www.linkedin.com/in/daniel-beecham',
    'https://sessionize.com/daniel-beecham/',
  ],
  knowsAbout: [
    'AEC proposal pursuits',
    'Formal procurement',
    'Proposal and response management',
    'Applied artificial intelligence',
    'Agentic systems',
  ],
};

const steveSchema = {
  '@type': 'Person',
  '@id': `${SITE}/about/#steve-ernst`,
  name: 'Steve Ernst',
  url: `${SITE}/about/#steve-ernst`,
  jobTitle: 'Co-founder',
  worksFor: { '@id': `${SITE}/#org` },
  sameAs: ['https://www.linkedin.com/in/sternst/'],
};

function schemaForMedia(item) {
  // This archive links to conference coverage; it is not an event detail page.
  if (item.schemaType === 'Event') {
    return { '@type': 'WebPage', name: item.title, url: item.url };
  }
  const schema = {
    '@type': item.schemaType || 'CreativeWork',
    name: item.schemaName || item.title,
    url: item.url,
  };

  if (item.relationship === 'coverage') {
    schema.headline = item.title;
    schema.datePublished = item.isoDate;
    schema.about = { '@id': `${SITE}/#org` };
    schema.publisher = { '@type': 'Organization', name: item.outlet };
  }

  if (item.relationship === 'authored') {
    schema.headline = item.title;
    schema.datePublished = item.isoDate;
    schema.author = [
      { '@id': `${SITE}/about/#daniel-beecham` },
      ...(item.coAuthors || []).map((name) => ({ '@type': 'Person', name })),
    ];
    schema.publisher = { '@type': 'Organization', name: item.outlet };
  }

  if (item.schemaType === 'PodcastEpisode') {
    schema.datePublished = item.isoDate;
    schema.contributor = { '@id': `${SITE}/about/#daniel-beecham` };
  }

  if (item.schemaType === 'VideoObject') {
    schema.uploadDate = item.isoDate;
    schema.contributor = { '@id': `${SITE}/about/#daniel-beecham` };
    schema.publisher = { '@type': 'Organization', name: item.outlet };
    schema.thumbnailUrl = item.thumbnailUrl;
    schema.embedUrl = item.embedUrl;
  }

  return schema;
}

function schemaFor(page) {
  const canonical = `${SITE}/${page.slug}/`;
  const pageType = page.slug === 'about'
    ? 'AboutPage'
    : page.slug === 'press'
      ? 'CollectionPage'
      : 'WebPage';
  const graph = [
    organizationSchema,
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: `${SITE}/`,
      name: 'Propagent',
      publisher: { '@id': `${SITE}/#org` },
    },
    {
      '@type': pageType,
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: page.title,
      description: page.description,
      datePublished: page.datePublished || (page.template === 'guide' ? '2026-09-08' : CONTENT_DATE),
      dateModified: pageDates[`/${page.slug}/`],
      isPartOf: { '@id': `${SITE}/#website` },
      about: { '@id': `${SITE}/#org` },
      breadcrumb: { '@id': `${canonical}#breadcrumb` },
       ...(page.slug === 'press' ? {} : {
         speakable: {
           '@type': 'SpeakableSpecification',
           cssSelector: page.template === 'case' ? ['.content-answer'] : ['.content-answer', '.content-faq'],
         },
       }),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Propagent', item: `${SITE}/` },
        ...(['guide', 'case'].includes(page.template) ? [{ '@type': 'ListItem', position: 2, name: 'Resources', item: `${SITE}/resources/` }] : []),
        { '@type': 'ListItem', position: ['guide', 'case'].includes(page.template) ? 3 : 2, name: page.navLabel, item: canonical },
      ],
    },
  ];

  if (page.template === 'case') {
    graph.push({
      '@type': 'Article', '@id': `${canonical}#story`,
      headline: page.h1, description: page.description,
      datePublished: page.datePublished, dateModified: pageDates[`/${page.slug}/`],
      author: { '@id': `${SITE}/#org` }, publisher: { '@id': `${SITE}/#org` },
      mainEntityOfPage: { '@id': `${canonical}#webpage` },
      image: `${SITE}/og-image-geo-20260814.png`,
      articleSection: 'Customer stories',
    });
    graph.find(item => item['@id'] === `${canonical}#webpage`).mainEntity = { '@id': `${canonical}#story` };
  }

  if (page.faqs?.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      mainEntity: page.faqs.map(([question, answer]) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    });
  }

  if (page.slug === 'about' || page.slug === 'press') {
    graph.push(danielSchema, steveSchema);
  }

  if (page.slug === 'press') {
    graph.push({
      '@type': 'ItemList',
      '@id': `${canonical}#media`,
      name: 'Propagent press, media, and speaking',
      numberOfItems: pressVisibleMedia.length,
      itemListElement: pressVisibleMedia.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: schemaForMedia(item),
      })),
    });
    graph.find((item) => item['@id'] === `${canonical}#webpage`).mainEntity = { '@id': `${canonical}#media` };
  }

  if (page.slug === 'ai-proposal-management-aec') {
    graph.push({
      '@type': 'SoftwareApplication',
      '@id': `${SITE}/#software`,
      name: 'Propagent',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: page.description,
      provider: { '@id': `${SITE}/#org` },
      url: canonical,
    });
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c');
}

function renderNav() {
  return `
  <header class="topbar">
    <div class="container topbar-inner">
      <a class="brand" href="/" aria-label="Propagent home">
        <span class="brand-mark"><img src="/logo.svg" alt="" width="26" height="26"></span>
        <span class="brand-name">Propagent</span>
      </a>
      <nav class="topbar-nav content-nav" aria-label="Primary navigation">
        <a href="/ai-proposal-management-aec/">How it works</a>
        <a href="/resources/">Resources</a>
        <a href="/security/">Security</a>
        <a href="/about/">About</a>
        <a href="/rfp-grader/">RFP Grader</a>
      </nav>
      <details class="mobile-nav">
        <summary aria-label="Open navigation">Menu</summary>
        <nav class="mobile-nav-panel" aria-label="Mobile navigation">
          <a href="/ai-proposal-management-aec/">How it works</a>
          <a href="/resources/">Resources</a>
          <a href="/security/">Security guide</a>
          <a href="/about/">About</a>
          <a href="/rfp-grader/">RFP Grader</a>
          <a href="/60min-meeting">Book a Propagent demo</a>
        </nav>
      </details>
      <a href="/60min-meeting" class="btn btn-primary btn-sm content-nav-cta">Book a Propagent demo</a>
    </div>
  </header>`;
}

function renderFooter() {
  return `
  <footer class="content-footer">
    <div class="container content-footer-grid">
      <div>
        <a class="brand" href="/" aria-label="Propagent home">
          <span class="brand-mark"><img src="/logo.svg" alt="" width="26" height="26"></span>
          <span class="brand-name">Propagent</span>
        </a>
        <p>The pursuit system for the built world.</p>
      </div>
      <div><span class="mono-label">Explore</span><a href="/resources/">Resources</a><a href="/ai-proposal-management-aec/">AI proposal management</a><a href="/rfp-grader/">RFP Grader</a></div>
      <div><span class="mono-label">Company</span><a href="/about/">About</a><a href="/press/">Press & Media</a><a href="/security/">Security</a><a href="mailto:daniel@propagent.ai">Contact</a></div>
      <div><span class="mono-label">Evaluate</span><a href="/60min-meeting">Book a Propagent demo</a><a href="/rfp-grader/">Grade an RFP</a></div>
    </div>
    <div class="container content-footer-bottom"><span>© ${new Date().getUTCFullYear()} Propagent</span><span>The system carries the process. People apply judgment and approve the response.</span></div>
  </footer>`;
}

function renderPage(page) {
  const canonical = `${SITE}/${page.slug}/`;
  const [ctaTitle, ctaBody, ctaHref, ctaLabel] = page.cta || [];
  const [heroPrimaryLabel, heroPrimaryHref] = page.heroPrimary || [ctaLabel, ctaHref];
  const [secondaryLabel, secondaryHref] = page.answerSecondary || ['Explore the resource library', '/resources/'];
  const related = (page.related || []).map(relatedPage).filter(Boolean);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="/logo.svg" type="image/svg+xml">
  <meta property="og:type" content="${page.template === 'case' ? 'article' : 'website'}">
  <meta property="og:site_name" content="Propagent">
  <meta property="og:title" content="${escapeHtml(page.title)}">
  <meta property="og:description" content="${escapeHtml(page.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE}/og-image-geo-20260814.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(page.title)}">
  <meta name="twitter:description" content="${escapeHtml(page.description)}">
  <meta name="twitter:image" content="${SITE}/og-image-geo-20260814.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=JetBrains+Mono:wght@400;500;600&amp;family=Fraunces:opsz,wght@9..144,500;9..144,600&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css?v=20260814-geo">
  <link rel="stylesheet" href="/content-pages.css?v=20261001-proof">
  <script type="application/ld+json">${schemaFor(page)}</script>
</head>
<body class="content-page content-page--${escapeHtml(page.slug.replaceAll('/', '-'))}">
  <a class="content-skip" href="#main">Skip to content</a>
  ${renderNav()}
  ${page.slug === 'press' ? renderPressMain(page) : page.template === 'case' ? renderCaseMain(page) : page.template === 'guide' ? renderGuideMain(page) : `<main id="main">
    <header class="content-hero">
      <div class="container">
        <nav class="content-breadcrumb" aria-label="Breadcrumb"><a href="/">Propagent</a><span aria-hidden="true">/</span><span>${escapeHtml(page.navLabel)}</span></nav>
        <div class="content-hero-grid">
          <div>
            <span class="mono-label">${escapeHtml(page.eyebrow)}</span>
            <h1>${escapeHtml(page.h1)}</h1>
          </div>
          <div class="content-answer-wrap" data-direct-answer>
            <span class="mono-label">At a glance</span>
            <p class="content-answer">${escapeHtml(page.answer)}</p>
            <div class="content-answer-actions"><a class="btn btn-primary" href="${escapeHtml(heroPrimaryHref)}">${escapeHtml(heroPrimaryLabel)}</a><a class="btn" href="${escapeHtml(secondaryHref)}">${escapeHtml(secondaryLabel)}</a></div>
          </div>
        </div>
        ${renderHighlights(page.highlights)}
      </div>
    </header>
    ${renderSections(page.sections)}
    ${page.proof ? `<section class="content-proof">
      <div class="container content-proof-grid">
        <div><span class="mono-label">${escapeHtml(page.proof.eyebrow || 'What your team sees')}</span><h2>${escapeHtml(page.proof.title)}</h2><p>${escapeHtml(page.proof.body)}</p></div>
        <div>
          <dl class="content-artifact" aria-label="Representative inspection view">${page.proof.artifact.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('\n')}</dl>
          <ul>${page.proof.items.map((item) => `<li><span aria-hidden="true">✓</span>${escapeHtml(item)}</li>`).join('\n')}</ul>
        </div>
      </div>
    </section>` : ''}
    ${page.checkpoint ? `<section class="content-checkpoint">
      <div class="container"><span class="mono-label">${escapeHtml(page.checkpointLabel || 'Where your team stays in control')}</span><p>${escapeHtml(page.checkpoint)}</p></div>
    </section>` : ''}
    ${page.faqs?.length ? `<section class="content-section content-section--raised" id="faq">
      <div class="container content-section-inner">
        <div class="content-section-heading"><span class="mono-label">Frequently asked questions</span><h2>Straight answers for your evaluation.</h2></div>
        <div class="content-section-body">${renderFaqs(page.faqs)}</div>
      </div>
    </section>` : ''}
    ${page.contact ? `<section class="content-contact">
      <div class="container content-contact-inner">
        <div><span class="mono-label">${escapeHtml(page.contact.eyebrow)}</span><h2>${escapeHtml(page.contact.title)}</h2><p>${escapeHtml(page.contact.body)}</p></div>
        <a class="btn" href="${escapeHtml(page.contact.href)}">${escapeHtml(page.contact.label)} <span aria-hidden="true">→</span></a>
      </div>
    </section>` : ''}
    <section class="content-related">
      <div class="container"><span class="mono-label">Continue exploring</span><div class="content-related-links">${related.map((item) => `<a href="/${item.slug}/"><strong>${escapeHtml(item.navLabel)}</strong><span>${escapeHtml(item.description)}</span></a>`).join('\n')}</div></div>
    </section>
    <section class="content-cta">
      <div class="container content-cta-inner"><div><span class="mono-label">${escapeHtml(page.ctaEyebrow || 'See it on real work')}</span><h2>${escapeHtml(ctaTitle)}</h2><p>${escapeHtml(ctaBody)}</p></div><a class="btn btn-primary btn-lg" href="${escapeHtml(ctaHref)}">${escapeHtml(ctaLabel)} <span aria-hidden="true">→</span></a></div>
    </section>
  </main>`}
  ${renderFooter()}
</body>
</html>`;
}

export function renderContentPages(dist) {
  mkdirSync(dist, { recursive: true });
  for (const page of pages) {
    const target = join(dist, page.slug);
    mkdirSync(target, { recursive: true });
    writeFileSync(join(target, 'index.html'), renderPage(page), 'utf8');
  }
  return pageSlugs;
}

function renderCaseMain(page) {
  return `<main id="main" class="buyer-guide customer-story">
    <header class="guide-header container">
      <nav class="content-breadcrumb" aria-label="Breadcrumb"><a href="/">Propagent</a><span aria-hidden="true">/</span><a href="/resources/">Resources</a><span aria-hidden="true">/</span><span>${escapeHtml(page.navLabel)}</span></nav>
      <span class="mono-label">${escapeHtml(page.eyebrow)}</span><h1>${escapeHtml(page.h1)}</h1>
      <p class="guide-byline">By Propagent · <time datetime="${page.datePublished}">October 4, 2026</time></p>
      <p class="content-answer" data-direct-answer>${escapeHtml(page.answer)}</p>
      <dl class="proof-stats">${page.stats.map(([value, label, note]) => `<div class="proof-stat"><dt>${escapeHtml(label)}</dt><dd><strong>${escapeHtml(value)}</strong><p>${escapeHtml(note)}</p></dd></div>`).join('')}</dl>
    </header>
    ${renderSections(page.sections)}
  </main>`;
}

function renderGuideMain(page) {
  return `<main id="main" class="buyer-guide">
    <header class="guide-header container">
      <nav class="content-breadcrumb" aria-label="Breadcrumb"><a href="/">Propagent</a><span>/</span><a href="/resources/">Resources</a><span>/</span><span>Buyer’s guide</span></nav>
      <span class="mono-label">${escapeHtml(page.eyebrow)}</span><h1>${escapeHtml(page.h1)}</h1>
      <p class="guide-byline">By Propagent · Updated <time datetime="${pageDates[`/${page.slug}/`]}">${new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(pageDates[`/${page.slug}/`]))}</time></p>
      <p class="content-answer" data-direct-answer>${escapeHtml(page.answer)}</p>
      <nav class="guide-jumps" aria-label="In this guide">${page.sections.map(section => `<a href="#${section.id}">${escapeHtml(section.eyebrow)}</a>`).join('')}</nav>
    </header>
    ${renderSections(page.sections)}
    <section class="content-section"><div class="container"><h2>Common buying questions</h2><div class="guide-faq">${renderFaqs(page.faqs)}</div></div></section>
    <section class="content-related"><div class="container"><h2>Keep evaluating</h2>${renderCards(page.related.map(slug => {const p = relatedPage(slug); return [p.navLabel, p.description, `/${slug}/`];}))}</div></section>
    <section class="content-cta"><div class="container content-cta-inner"><div><h2>${escapeHtml(page.cta[0])}</h2><p>${escapeHtml(page.cta[1])}</p></div><a class="btn btn-primary" href="${page.cta[2]}">${escapeHtml(page.cta[3])}</a></div></section>
  </main>`;
}

export function renderSitemap(dist) {
  mkdirSync(dist, { recursive: true });
  const urls = [
    ['/', '1.0'],
    ['/rfp-grader/', '0.9'],
    ...pageSlugs.map((slug) => [slug, slug === '/resources/' ? '0.9' : '0.8']),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([path]) => `  <url>\n    <loc>${SITE}${path}</loc>\n    <lastmod>${pageDates[path]}</lastmod>\n  </url>`).join('\n')}
</urlset>\n`;
  writeFileSync(join(dist, 'sitemap.xml'), xml, 'utf8');
  return urls.map(([path]) => path);
}
