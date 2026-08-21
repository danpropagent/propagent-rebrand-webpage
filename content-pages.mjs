import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://www.propagent.ai';
const CONTENT_DATE = '2026-08-20';

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
  {
    slug: 'resources',
    title: 'AEC Proposal & Response Management Resources',
    navLabel: 'Resources',
    eyebrow: 'Propagent resource library',
    h1: 'The next generation of proposal and response management, explained.',
    description: 'Practical guides to AI proposal management, operational memory, go/no-go decisions, RFP compliance, SME coordination, source-grounded drafting, and security for AEC firms.',
    answer: 'Propagent’s resource library shows how your AEC team can move from isolated search and drafting tools to system-led proposal and response management. Each guide explains the problem, how the work changes, what your team can see, where people remain accountable, and the value for each pursuit.',
    highlights: [
      ['One connected process', 'Requirements, evidence, experts, content, review, and approval stay connected.'],
      ['Built for AEC', 'Architecture, engineering, construction, and infrastructure proposal workflows.'],
      ['People stay accountable', 'The system carries the process; people apply expertise, judgment, and approval.'],
    ],
    sections: [
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
      ['What is Propagent?', 'Propagent is the proposal pursuit system for the built world and the next generation of proposal and response management for AEC firms.'],
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
    h1: 'The proposal pursuit system for the built world.',
    description: 'Learn what Propagent is, who it serves, who founded it, and why AEC proposal and response management needs a system-led operating model.',
    answer: 'Propagent is the proposal pursuit system for the built world and the next generation of proposal and response management for AEC firms. Founded in 2024 by Daniel Beecham and Steve Ernst, Propagent delivers a system-led workflow that analyzes requirements, connects firm evidence, coordinates expert input, matures content, and keeps people responsible for judgment and approval.',
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
          ['Steve Ernst', 'Co-founder. Steve brings complementary experience to Propagent’s mission of making proposal and response management more connected, accountable, and effective.', 'https://www.linkedin.com/in/sternst/', 'View Steve’s profile', 'steve-ernst'],
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
    description: 'See how Propagent connects RFP analysis, firm evidence, response planning, SME input, source-grounded content, quality review, and human approval for AEC firms.',
    answer: 'Propagent manages the response, not merely the text. It analyzes the RFP against firm capabilities, turns gaps into a response plan and focused expert questions, matures source-grounded content, and rechecks the work through human approval. The system carries the process; people provide expertise, strategy, and judgment.',
    highlights: [
      ['Measurable Quality', 'Evaluate the response against this pursuit, its evidence, and buyer priorities.'],
      ['Dynamic Workflow', 'Keep requirements, owners, expert input, revisions, and review moving together.'],
      ['Continuous Improvement', 'Preserve approved context the next pursuit can use.'],
    ],
    sections: [
      {
        eyebrow: 'Why disconnected tools fall short',
        title: 'Search and drafting assistance do not equal response management.',
        paragraphs: [
          'A search result does not decide whether the evidence is relevant. A first draft does not resolve missing facts, coordinate contributors, reconcile changes, or prove that the response addresses the buyer’s evaluation criteria. When those steps remain disconnected, the proposal team still carries the process.',
          'Propagent uses a system-led workflow. It connects what the buyer requires to what the firm can prove, maintains the response plan, turns gaps into focused work, and makes evidence and open decisions visible through final review.',
        ],
      },
      {
        eyebrow: 'Connected workflow',
        title: 'From requirements analysis to final approval.',
        steps: [
          ['01', 'Analyze the RFP', 'Identify requirements, evaluation criteria, buyer intent, risks, ambiguities, and submission instructions.'],
          ['02', 'Connect firm capability', 'Match the opportunity with relevant experience, proof, prior work, and available expertise.'],
          ['03', 'Plan the response', 'Turn requirements and gaps into sections, owners, next actions, dependencies, and review points.'],
          ['04', 'Capture focused knowledge', 'Ask the right expert a bounded question when evidence or judgment is missing.'],
          ['05', 'Mature the content', 'Develop source-grounded material in the firm’s voice and keep related sections aligned.'],
          ['06', 'Review and approve', 'Surface weak evidence, open decisions, and exceptions so people can resolve and approve them.'],
        ],
      },
      {
        eyebrow: 'What teams receive',
        title: 'See what is complete, what is missing, and what needs a decision.',
        bullets: [
          'A requirements and compliance view connected to source material.',
          'A pursuit-specific capability and gap analysis.',
          'Focused SME questions with the context needed to answer.',
          'Source-grounded content with open questions and evidence visible.',
          'A review state that shows what changed and where judgment is required.',
        ],
      },
    ],
    proof: {
      title: 'See the connected work, not another AI promise.',
      body: 'See how a requirement connects to your firm’s evidence, ownership, content state, and approval as the response moves forward.',
      items: ['RFP-specific requirements and evidence', 'Focused questions and visible ownership', 'Content carried through review and approval'],
      artifact: [['Requirement', 'Demonstrate relevant delivery experience'], ['Connected proof', 'Approved project record'], ['Status', 'Ready for proposal-owner review']],
    },
    checkpoint: 'People set the win strategy, contribute firm and relationship expertise, resolve sensitive or ambiguous work, make commercial decisions, and approve the response.',
    faqs: [
      ['What is AI proposal management software for AEC?', 'It is software that uses AI to help architecture, engineering, and construction firms analyze solicitations, connect requirements to firm knowledge, coordinate contributors, build response content, and review the work. Propagent extends that idea into a connected, system-led response process.'],
      ['Does Propagent only write proposal text?', 'No. Propagent connects requirements analysis, capability matching, gap detection, response planning, focused expert input, source-grounded content, quality checks, and reusable operational memory.'],
      ['Does Propagent replace proposal managers or SMEs?', 'No. The system carries process work while proposal managers control strategy and approval and SMEs contribute the expertise and judgment the response requires.'],
      ['Can Propagent work with a real RFP?', 'Yes. Bring a live opportunity to a Propagent demo or use the free RFP Grader for an initial analysis.'],
    ],
    cta: ['See the full pursuit workflow', 'Bring a real RFP and see how Propagent connects requirements, evidence, expert input, drafting, and review.', '/60min-meeting', 'Book a Propagent demo'],
    related: ['aec-operational-memory', 'rfp-compliance-matrix', 'source-grounded-proposal-drafting'],
  },
  {
    slug: 'aec-operational-memory',
    title: 'AEC Operational Memory for Proposals and Pursuits | Propagent',
    navLabel: 'Operational memory',
    eyebrow: 'Institutional knowledge that stays useful',
    h1: 'Stop searching old proposals. Start with connected operational memory.',
    description: 'Learn how Propagent connects requirements, firm proof, expert input, decisions, edits, and review history so approved AEC knowledge can strengthen future pursuits.',
    answer: 'AEC operational memory is the approved knowledge created while a pursuit moves: requirements, proof, decisions, expert input, edits, and review history. Propagent connects that context to each new RFP so teams receive relevant evidence, insight, or a focused question—not a pile of old proposals—while each firm’s private knowledge remains isolated.',
    highlights: [
      ['More than documents', 'Preserve the decisions, evidence, and expert context behind the final response.'],
      ['Connected to the requirement', 'Retrieve knowledge because it fits this pursuit, not because keywords happen to match.'],
      ['Private to your firm', 'Each firm’s private knowledge remains its own.'],
    ],
    sections: [
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
      {
        eyebrow: 'Why go/no-go breaks down',
        title: 'A score without its evidence is not a decision system.',
        paragraphs: [
          'AEC firms cannot chase every opportunity. The cost is not only proposal hours; it is leadership attention, expert time, partner coordination, and the opportunity cost of the work the firm did not pursue.',
          'A useful qualification process makes the basis of the decision visible. It shows where the firm fits, which requirements are difficult, whether the evidence is ready, what risks remain, and where executive judgment overrides a default recommendation.',
        ],
      },
      {
        eyebrow: 'Decision record',
        title: 'See the factors, evidence, gaps, and owner.',
        steps: [
          ['01', 'Strategic fit', 'How the opportunity aligns with the firm’s market, client, geography, project type, and priorities.'],
          ['02', 'Capability and proof', 'Whether the firm has relevant experience, people, credentials, and defensible evidence.'],
          ['03', 'Requirements and risk', 'Which terms, constraints, ambiguities, deadlines, or compliance demands affect the pursuit.'],
          ['04', 'Readiness and cost', 'What the response will require from the proposal team, experts, leadership, and partners.'],
          ['05', 'Judgment and approval', 'Which open questions require a person and who owns the final go/no-go decision.'],
        ],
      },
      {
        eyebrow: 'Win probability',
        title: 'Use probability as decision context, not a promise.',
        paragraphs: [
          'No responsible proposal system can guarantee a win. Propagent organizes the factors, evidence, and uncertainty behind the team’s confidence. As your firm records actual outcomes, leaders can compare them with the original decision and refine future qualification.',
          'You get more than a mysterious percentage: a traceable decision record your leaders can inspect, challenge, and approve.',
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
    proof: {
      title: 'A pursuit decision the team can challenge and approve.',
      body: 'The decision record makes strengths, risks, missing evidence, uncertainty, ownership, and the final executive call visible together.',
      items: ['Evidence-backed strengths and gaps', 'Visible uncertainty and open decisions', 'Named executive approval'],
      artifact: [['Fit signal', 'Relevant experience is well supported'], ['Open risk', 'Key-person availability unconfirmed'], ['Decision', 'Awaiting principal approval']],
    },
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
    title: 'AI RFP Parsing and Compliance Matrix for AEC | Propagent',
    navLabel: 'RFP compliance matrix',
    eyebrow: 'Requirements control',
    h1: 'Turn the RFP into a living compliance matrix.',
    description: 'Learn how Propagent connects RFP requirements, evaluation criteria, deadlines, forms, addenda, sources, owners, evidence, and response status for AEC teams.',
    answer: 'An RFP compliance matrix converts solicitation requirements, evaluation criteria, forms, deadlines, and addenda into a living response control record. Propagent links each item to its source, owner, status, evidence, and affected section so missed requirements surface early and the matrix stays current as the response changes. People resolve ambiguity and approve exceptions.',
    highlights: [
      ['Traceable', 'Every requirement stays connected to its source.'],
      ['Living', 'Status changes with the response rather than waiting for a pre-submit check.'],
      ['Accountable', 'Owners, open questions, evidence, and approvals remain visible.'],
    ],
    sections: [
      {
        eyebrow: 'The compliance problem',
        title: 'A checklist built once can become wrong while the proposal changes.',
        paragraphs: [
          'Requirements can be scattered across instructions, scope sections, evaluation criteria, forms, exhibits, attachments, and later addenda. The response then evolves across multiple people and sections. A static spreadsheet can show what the team knew at one moment without showing what changed downstream.',
          'A living compliance matrix keeps the requirement, source, owner, evidence, response location, status, and related change connected. The goal is to surface omissions and ambiguity early enough for the team to act.',
        ],
      },
      {
        eyebrow: 'What your team sees',
        title: 'From source requirement to approved response.',
        steps: [
          ['01', 'Requirement', 'The instruction, criterion, form, deadline, or commitment the response must address.'],
          ['02', 'Source', 'The RFP page, section, attachment, or addendum supporting the interpretation.'],
          ['03', 'Owner and evidence', 'Who owns the work and which firm proof or expert input can satisfy it.'],
          ['04', 'Response status', 'Where the requirement is addressed, what remains incomplete, and what changed.'],
          ['05', 'Human resolution', 'Which ambiguities, exceptions, or risks require review and approval.'],
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
    proof: {
      title: 'A requirement record the team can control.',
      body: 'Each matrix row keeps the requirement, source location, owner, evidence, response status, and amendment impact connected for review.',
      items: ['Requirement-to-source trace', 'Owner, evidence, and response status', 'Addendum impact and approved resolution'],
      artifact: [['Requirement', 'Provide a milestone schedule'], ['Source', 'RFP §4.2 · page 18'], ['Owner · status', 'Project manager · evidence needed']],
    },
    checkpoint: 'People resolve ambiguous requirements, approve exceptions, validate commitments, and confirm that the final response satisfies both the submission instructions and the pursuit strategy.',
    faqs: [
      ['What is an RFP compliance matrix?', 'It is a structured record of solicitation requirements, evaluation criteria, forms, deadlines, owners, evidence, response locations, and completion status.'],
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
    h1: 'Review how Propagent handles proposal data.',
    description: 'Learn what Propagent provides for evaluating data flow, access, retention, deletion, subprocessors, deployment, and procurement requirements.',
    answer: 'Proposal data can include confidential client, project, staff, pricing, and pursuit information. For your review, Propagent provides current information about how data moves through the product, who and which services can access it, how retention and deletion are handled, and which procurement materials are available. Sensitive supporting detail is shared through controlled diligence when appropriate.',
    highlights: [
      ['Data flow', 'Review how your data moves from intake through processing, review, storage, export, and deletion.'],
      ['Access and services', 'Understand which people and services can act on customer data.'],
      ['Procurement support', 'Get current answers for your security, legal, and procurement review.'],
    ],
    sections: [
      {
        eyebrow: 'Start with your requirements',
        title: 'Review the questions that matter to your firm.',
        paragraphs: [
          'Your proposals may include client information, staffing, project experience, pricing, contract terms, partner details, and material that affects active pursuits. A Propagent review starts with how those data types enter, move through, and leave the product.',
          'Send your firm’s questionnaire or diligence priorities. Propagent will provide current answers and identify any item that requires deeper review.',
        ],
      },
      {
        eyebrow: 'What we cover',
        title: 'The information available for your evaluation.',
        cards: [
          ['Data handling', 'How your data enters Propagent, why it is processed, where it is stored, how long it remains, and how deletion works.'],
          ['Access and services', 'How access is managed, which service providers participate, and which responsibilities remain with your firm.'],
          ['Procurement review', 'Which privacy and contractual documents are currently available, how the review works, and who owns follow-up.'],
        ],
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
    proof: {
      title: 'Current answers for your security review.',
      body: 'Your review addresses current data-flow, access, retention, deletion, service-provider, incident, and procurement questions with a named contact for follow-up.',
      items: ['Plain-language view of the customer-data lifecycle', 'Current answers and available supporting materials', 'Direct security and procurement follow-up'],
      artifact: [['Review topic', 'Upload and report data flow'], ['What you receive', 'Current processing and storage information'], ['Follow-up', 'Propagent security contact']],
    },
    checkpoint: 'Customer administrators control what firm data enters the system and who is authorized to use it. People remain responsible for reviewing sensitive outputs and approving external submissions.',
    faqs: [
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

const renderSections = (sections = []) => sections.map((section, index) => `
  <section class="content-section${index % 2 ? ' content-section--raised' : ''}${section.layout === 'wide' ? ' content-section--wide' : ''}">
    <div class="container content-section-inner">
      <div class="content-section-heading">
        <span class="mono-label">${escapeHtml(section.eyebrow)}</span>
        <h2>${escapeHtml(section.title)}</h2>
      </div>
      <div class="content-section-body">
        ${(section.paragraphs || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n')}
        ${renderBullets(section.bullets)}
        ${renderSteps(section.steps)}
        ${renderCards(section.cards)}
        ${renderSectionMedia(section)}
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
        <div class="press-close-copy"><span class="mono-label">About Propagent</span><h2>The proposal pursuit system for the built world</h2><p>${escapeHtml(page.about)}</p></div>
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
  description: 'The proposal pursuit system for the built world and the next generation of proposal and response management for AEC firms.',
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

  if (item.schemaType === 'Event') {
    if (item.isoDate) schema.startDate = item.isoDate;
    if (item.endDate) schema.endDate = item.endDate;
    if (item.schemaPerformer !== false) schema.performer = { '@id': `${SITE}/about/#daniel-beecham` };
    schema.organizer = { '@type': 'Organization', name: item.outlet };
    if (item.location) schema.location = { '@type': 'Place', name: item.location };
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
      datePublished: CONTENT_DATE,
      dateModified: CONTENT_DATE,
      isPartOf: { '@id': `${SITE}/#website` },
      about: { '@id': `${SITE}/#org` },
      breadcrumb: { '@id': `${canonical}#breadcrumb` },
       ...(page.slug === 'press' ? {} : {
         speakable: {
           '@type': 'SpeakableSpecification',
           cssSelector: ['.content-answer', '.content-faq'],
         },
       }),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Propagent', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: page.navLabel, item: canonical },
      ],
    },
  ];

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
        <p>The proposal pursuit system for the built world.</p>
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
  <meta property="og:type" content="website">
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
  <link rel="stylesheet" href="/content-pages.css?v=20260814-geo">
  <script type="application/ld+json">${schemaFor(page)}</script>
</head>
<body class="content-page content-page--${escapeHtml(page.slug)}">
  <a class="content-skip" href="#main">Skip to content</a>
  ${renderNav()}
  ${page.slug === 'press' ? renderPressMain(page) : `<main id="main">
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

export function renderSitemap(dist) {
  mkdirSync(dist, { recursive: true });
  const urls = [
    ['/', '1.0'],
    ['/rfp-grader/', '0.9'],
    ...pageSlugs.map((slug) => [slug, slug === '/resources/' ? '0.9' : '0.8']),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([path, priority]) => `  <url>\n    <loc>${SITE}${path}</loc>\n    <lastmod>${CONTENT_DATE}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`).join('\n')}
</urlset>\n`;
  writeFileSync(join(dist, 'sitemap.xml'), xml, 'utf8');
  return urls.map(([path]) => path);
}
