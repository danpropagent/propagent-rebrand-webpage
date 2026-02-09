const {GoogleGenAI} = require("@google/genai");
const {Storage} = require("@google-cloud/storage");
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

// Initialize Cloud Storage
const storage = new Storage();
const bucketName = "propagentlanding.appspot.com";
const CONVERTER_URL = "https://docx-converter-472249298599.us-central1.run.app/convert";

// Initialize Google Gen AI with Vertex AI mode for gs:// URI support
const genAI = new GoogleGenAI({
  vertexai: true,
  project: "propagentlanding",
  location: "global",
});

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ============================================================
// MULTI-PASS GRADING ARCHITECTURE
// 12 Variable-Specific Prompts + Special Analyses
// ============================================================

// Helper function for delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Convert numeric score to letter grade (used for weighted aggregation)
const scoreToGrade = (score) => {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 63) return "D";
  if (score >= 60) return "D-";
  return "F";
};

// Convert letter grade to numeric score (for internal weighted aggregation)
const gradeToScore = (grade) => {
  const map = {
    "A+": 98, "A": 95, "A-": 92,
    "B+": 88, "B": 85, "B-": 82,
    "C+": 78, "C": 75, "C-": 72,
    "D+": 68, "D": 65, "D-": 62,
    "F": 50,
  };
  return map[grade] || 0;
};

// Get color for a letter grade
// Variable weights for aggregation
const VARIABLE_WEIGHTS = {
  scopePrecision: 0.20,
  evaluationTransparency: 0.15,
  technicalRequirements: 0.15,
  fairCompetition: 0.10,
  purposeContext: 0.05,
  scheduleRealism: 0.05,
  internalConsistency: 0.05,
  commercialTerms: 0.05,
  innovationFlexibility: 0.05,
  complianceRequirements: 0.05,
  submissionInstructions: 0.05,
  communicationProcess: 0.05,
};

// 12 Variable-Specific Prompts
const VARIABLE_PROMPTS = {
  scopePrecision: {
    weight: 0.20,
    name: "Scope of Work & Deliverables Precision",
    prompt: `You are an expert Construction Procurement Consultant analyzing an RFP specifically for SCOPE OF WORK AND DELIVERABLES PRECISION.

DEFINITION & IMPORTANCE: This evaluates how clearly and precisely the RFP defines the scope of work – the tasks and activities the contractor is expected to perform – and the deliverables or outputs expected. A top-quality RFP provides a detailed Scope of Work (SOW) section that breaks down tasks, deliverables, and possibly acceptance criteria or performance standards for each deliverable. Precision here is crucial: vague requirements yield vague proposals, and ambiguity in scope often leads to misunderstandings, change orders, or disputes during execution. In fact, 42% of construction delays stem from ambiguous scope definitions in the RFP, underscoring that unclear scopes can derail schedules and budgets. A well-defined scope aligns all bidders on what work is included (and excluded), enabling fair and accurate pricing.

Focus ONLY on evaluating:
- Clarity and completeness of the Statement of Work (SOW)
- Task breakdown structure (major tasks, sub-tasks)
- Deliverable specifications and acceptance criteria
- Quantities, standards, and locations specified
- Scope boundaries (what's included and excluded)
- Level of detail for bidder estimation

GRADING SCALE:
A (Excellent): The RFP outlines the scope of work in unambiguous, thorough detail. It clearly enumerates each major task and sub-task the contractor must perform, along with specific deliverables for each (e.g. reports, drawings, constructed assets, training sessions, etc.), and criteria for acceptance or quality where applicable. The language is specific (quantities, standards, locations, etc. are given) so bidders know exactly what to provide. Scope boundaries are defined (what is within project scope and what is not). Example Excerpt: “Scope of Work: The contractor shall demolish the existing 2-story annex building (~5,000 sq ft) and construct a new 10,000 sq ft library wing. Key deliverables include: (1) Demolition plan – submit 2 weeks prior to demo for approval; (2) Monthly progress reports; (3) As-built drawings and a commissioning report upon completion. Precision: All new construction must conform to the attached 30% design drawings and specifications Section 01–20. The RFP provides a task breakdown (design, permitting, construction, commissioning) with milestones for each. Acceptance Criteria: e.g., “City’s approval of the commissioning report and a post-construction inspection with zero safety violations” will signify completion of the commissioning task.” (This reflects an ‘A’ scope: it’s detailed, itemized, and leaves little guesswork. Each deliverable is described with timing and criteria, so vendors know what to price and plan for.)

B (Good): The scope of work is well-defined overall, though maybe not with the exhaustive detail of an A. Major tasks and deliverables are listed, but a few minor specifics or acceptance details might be absent. There is little ambiguity about core requirements, but contractors might have to seek clarification on some secondary details. Example Excerpt: “Contractor will resurface approximately 5 miles of roadway on Main St. Deliverables: a traffic management plan before work commences, weekly work progress emails, and a final project report. All work shall meet state DOT paving standards. (Note: Striping and signage replacement are included; curb ramp upgrades are excluded from this scope.)” (This ‘B’ excerpt is quite clear on the main work and deliverables. It could be improved with more granular details – e.g., specifying asphalt thickness or exact standards by number – but it’s sufficient for bidders to understand the job and deliverables.)

C (Average): The RFP’s scope description is moderately clear but incomplete. It covers the general idea of the work, but important details (quantities, specific tasks, or boundaries) are missing. Deliverables might be mentioned in passing or not at all, or described in vague terms. Bidders can still formulate a proposal, but they may have to make assumptions or ask many questions. Example Excerpt: “Scope: Renovate the interior of Building A as needed and provide improvements. Deliverables include project documentation and final results. The contractor will be responsible for most interior trades (painting, flooring, etc.).” (This ‘C’ scope is quite vague – “as needed” and “improvements” are not defined, and deliverables like “project documentation” are not specific. Bidders would be unsure of the full extent – e.g., how many rooms to paint? what constitutes an improvement? – requiring assumptions or RFIs.)

D (Poor): The scope of work is highly vague, inconsistent, or missing key elements. It might list a project title or one-liner task without detail, omit major components, or use overly broad language (e.g., “Contractor to do all necessary work” with no further explanation). Deliverables are not clearly identified – the RFP might not say what the outputs should be, or confuses deliverables with tasks. Bidders will likely be confused about what to include, increasing the risk of scope creep or disputes later. Example Excerpt: “Scope: Contractor shall upgrade the facility to modern standards. All work must be high quality. Deliverables: N/A.” – or – “The selected firm will provide services for the project as required.” (These ‘D’ examples show almost no actionable detail. Contractors reading this have little idea what “upgrade… to modern standards” specifically entails – which systems, what level of upgrade? Such an RFP would prompt a barrage of questions or very cautious bids padded for the unknowns.)

F (Failing): The RFP provides practically no usable scope information. It might entirely lack a scope section, or the content is so fragmented/gibberish that it’s impossible to tell what work is expected. In some failing cases, the RFP’s scope description might even contradict itself (telling different stories in different sections about what the project includes). An ‘F’ scope is a recipe for bidder confusion, wildly divergent proposals, or no bids at all. Example Excerpt: “Scope of Work: TBD by the contractor. The contractor shall do everything necessary to complete the project. (No further detail provided.)” – or – “Scope: Build the thing as per requirements (which will be given later).” (These examples are extreme, but illustrate an ‘F’. The RFP basically abdicates defining the scope. Bidders are being asked to propose “everything necessary” without guidance – an untenable situation that would likely result in no compliant proposals or significant risk premiums.)

IMPORTANT: Your grade MUST reflect your actual analysis. Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F. Do NOT default to B-range or any particular grade. A truly excellent RFP deserves an A; a poor one deserves a D or F. Use the full range.

OUTPUT FORMAT (JSON only):
{
  "variable": "scopePrecision",
  "grade": "YOUR LETTER GRADE",
  "reasoning": "2-3 sentences explaining the grade with specific references to the document",
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "examples": [
    {"type": "positive", "quote": "exact quote from document", "section": "section reference"},
    {"type": "negative", "quote": "problematic language", "section": "section reference"}
  ],
  "improvement": {
    "title": "Concise improvement title",
    "description": "Specific actionable recommendation"
  }
}`,
  },

  evaluationTransparency: {
    weight: 0.15,
    name: "Evaluation Criteria Transparency",
    prompt: `You are an expert Construction Procurement Consultant analyzing an RFP specifically for EVALUATION CRITERIA TRANSPARENCY.

DEFINITION & IMPORTANCE: This variable gauges how openly and clearly the RFP communicates the evaluation criteria and process that will be used to select the winning proposal. In other words, do bidders know how their proposals will be judged and what factors matter most? Transparent evaluation criteria typically include a list of the factors (e.g., technical approach, experience, price, schedule, etc.) and sometimes their relative weights or points. A high-quality RFP makes the selection basis explicit (“best value”, “lowest price”, or specific weighted criteria) so vendors can tailor their proposals accordingly and trust the process is fair. Transparency builds trust and leads to better proposals – vendors are more willing to invest effort when they understand the rules of the game. If criteria are hidden or vague, bidders may worry about arbitrary decisions or bias. In public procurement especially, undisclosed criteria can lead to protests. Therefore, clarity and completeness of evaluation criteria are vital for a credible, effective RFP.

Focus ONLY on evaluating:
- Are evaluation criteria listed with weights/percentages?
- Is each criterion well-described with clear definitions?
- Is the evaluation method stated (point scoring, committee review)?
- Is award basis clear (best value vs lowest price)?
- Are scoring formulas or examples provided?
- Can bidders understand exactly how they will be judged?

GRADING SCALE:
A (Excellent): The RFP clearly outlines all evaluation criteria and their importance (ideally with weights or an order of priority). It might present a table or list like: “Proposals will be evaluated on: (1) Technical Approach – 30%, (2) Team Qualifications – 20%, (3) Past Project Experience – 20%, (4) Project Schedule – 10%, (5) Price – 20%. The highest scoring proposal based on these factors will be selected.” Each criterion is well-described, so bidders know what the evaluators will be looking for under each (e.g., what constitutes a strong technical approach, what the client values in experience). The RFP also states the evaluation method (e.g., points scoring, committee review) and the award basis (best value vs lowest price, etc.). This leaves no guesswork – vendors can align their proposals with what matters most and trust that the process is structured and fair. Example Excerpt: “Evaluation Criteria: A Selection Committee will evaluate proposals as follows: Project Understanding & Technical Approach (25%): We will assess the creativity, feasibility, and detail of your approach to the scope. Firm Experience & Key Personnel (20%): We will consider relevant project experience and staff qualifications (resumes provided). Schedule and Work Plan (15%): We will evaluate how realistic and well-thought-out your project schedule and phasing are. Cost Proposal (30%): The total proposed price will be scored based on a formula (lowest price gets full points). Quality of Proposal & Compliance (10%): Clarity and completeness of the proposal and adherence to RFP instructions. Basis of Award: The contract will be awarded to the proposal offering the best value overall, considering both technical merit and price.” (This ‘A’ excerpt clearly delineates all factors with percentages and explanations. Bidders reading this know exactly what to emphasize. It’s transparent – note even the price scoring method is mentioned – and it aligns evaluation with the RFP’s requests, which is ideal.)

B (Good): The RFP does list the evaluation criteria, but might not assign explicit weights or might group them broadly. Still, bidders can discern what the important factors are. For instance, it might say “We will evaluate based on technical quality, experience, and cost, among other factors,” without numeric weights – not as precise as an A, but at least the criteria are stated. Or perhaps weights are given but the description of each criterion is minimal. Overall, though, the playing field is mostly clear. Example Excerpt: “Evaluation Factors: The County will evaluate proposals on (a) Technical Solution, (b) Team Qualifications/Past Performance, (c) Schedule, and (d) Cost. These factors will be considered in determining the proposal offering the best value. Cost is important but will not be the sole determinant.” (This ‘B’ example names the factors, indicating a best-value approach. It doesn’t show exact weights or ranking, but bidders can tell these four areas all matter. It’s reasonably transparent, just not as detailed. Most vendors would be comfortable that they know the key areas to focus on, though they might prefer more insight into relative importance.)

C (Average): The RFP mentions some evaluation considerations but is vague or incomplete. It might have a boilerplate line like “Award will be made to the proposal deemed most advantageous to the Owner, price and other factors considered,” without enumerating what “other factors” are. Or it might list criteria but leave out one that later turns out to be used, or use imprecise terms (e.g. “quality” without definition). Bidders have a general sense that, say, both price and technical factors are in play, but not a clear picture of the weighting or all criteria. Example Excerpt: “Basis of Award: The City will select the contractor that it feels offers the best combination of capability, approach, and price. We will look at overall compliance with the RFP, the proposer’s experience, and the proposed cost. The City reserves the right to make an award in its best interest.” (This ‘C’ statement is somewhat informative – it implies experience, approach, and price matter – but it’s not a well-structured criterion list. “Best combination” and “best interest” are broad terms. Bidders can infer they should present a strong approach and competitive price, but they don’t know if, for example, approach is more important than price or vice versa. It’s average transparency at best.)

D (Poor): The RFP provides little to no clarity on how proposals will be evaluated. It might be completely silent on criteria, or so general that it’s unhelpful. In some cases, the RFP might hint at one thing but the actual evaluation might consider others not disclosed (e.g., an RFP that doesn’t mention that interviews will be held or that a certain certification is a must, catching bidders off guard). Lack of transparency here can make vendors suspicious of a predetermined outcome or simply confused on how to craft their response. Example Excerpt: “Proposals will be evaluated in accordance with internal policies. The contract will be awarded to the firm which, in the City’s opinion, best meets the requirements. No specific criteria are being published.” Or: “Evaluation will be based on the overall value of the proposal to the Owner.” (These ‘D’ examples are problematic – they basically refuse to tell bidders how their work will be judged. Serious vendors might balk at this, as it suggests the decision could be arbitrary. It also prevents bidders from understanding what to highlight. This opaqueness often results in uneven proposals and erodes trust. It is far below best practice, where even a simple weighted list is expected.)

F (Failing): The RFP not only hides criteria, but possibly also shows signs of unfair or ad-hoc evaluation intentions. For example, an RFP that says “The Owner will decide at its sole discretion based on secret factors” would be an egregious case. Or if the RFP’s statements about evaluation are outright misleading or self-contradictory (e.g., in one place it says lowest price wins, elsewhere it implies a trade-off, leaving total confusion). An ‘F’ might also be earned if the RFP introduces evaluation criteria after proposals (not in the RFP) or changes them without informing bidders – but that would be seen after issuance. From the document alone, an ‘F’ is when bidders have no idea how they’ll be judged, or have a wrong idea due to bad information in the RFP. Example Excerpt: “Award: The decision will be made by the Director based on any factors they deem relevant. Bidders will not be informed of the evaluation criteria or scoring methodology. The Owner reserves the right to award based on favoritism or any reason.” (While no RFP would state it so baldly, an implicit equivalent is when nothing is shared and the process is entirely opaque. Another failing example: an RFP that pretends to have criteria but they are so obviously unreasonable or not actually related to the requirements. For instance, listing a criterion like “Proximity of firm’s headquarters to Owner’s office – 40%” for a project where location is irrelevant, potentially skewing competition unfairly. Such misaligned or undisclosed criteria violate the principle of true discriminators and fair competition, thus an RFP doing this would get an ‘F’ for transparency and fairness in evaluation.)

IMPORTANT: Your grade MUST reflect your actual analysis. Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F. Do NOT default to B-range or any particular grade. A truly excellent RFP deserves an A; a poor one deserves a D or F. Use the full range.

OUTPUT FORMAT (JSON only):
{
  "variable": "evaluationTransparency",
  "grade": "YOUR LETTER GRADE",
  "reasoning": "2-3 sentences explaining the grade with specific references",
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1"],
  "examples": [
    {"type": "positive", "quote": "exact quote", "section": "section reference"}
  ],
  "improvement": {
    "title": "Concise improvement title",
    "description": "Specific actionable recommendation"
  }
}`,
  },

  technicalRequirements: {
    weight: 0.15,
    name: "Technical Requirements & Drawings",
    prompt: `You are an expert Construction Procurement Consultant analyzing an RFP specifically for TECHNICAL REQUIREMENTS AND DRAWINGS.

DEFINITION & IMPORTANCE: This category assesses whether the RFP provides all necessary technical information and requirements for bidders to understand the project and prepare accurate proposals. This includes design documents (drawings, specifications), technical criteria/standards, site data (surveys, geotechnical reports), and any other information needed to estimate and plan the work. In construction, incomplete or inaccurate technical information can lead to costly surprises and disputes. A high-quality RFP ensures bidders are not “bidding blind” – it shares what the owner knows about the project’s technical details and requirements. If an RFP withholds or muddles key information (intentionally or not), bidders either inflate their prices to cover the uncertainty or the project risks change orders and claims later. In fact, misleading or contradictory requirements (for example, faulty surveys or specs that conflict) can even expose the owner to legal liability for “misleading at tender stage”. Thus, sufficiency of technical info is critical for fairness and project success.

Focus ONLY on evaluating:
- Are technical specifications detailed and complete?
- Are referenced drawings, plans, or attachments actually included?
- Are material standards and quality requirements specified (e.g. ASTM, ACI, IBC)?
- Are construction methods or constraints defined?
- Is site data provided (surveys, geotechnical reports, utility maps)?
- Are technical codes and standards referenced appropriately?
- Is there sufficient information to prepare accurate estimates?

GRADING SCALE:
A (Excellent): The RFP provides comprehensive and clear technical documentation. All relevant drawings (plans, elevations, etc.), specifications, and data are included or referenced. Technical requirements are explicitly stated (e.g., performance standards, materials to use, code requirements). There are no significant gaps: if site conditions matter, the RFP includes surveys or reports (e.g., soil report, existing utility maps); if design input is needed, preliminary drawings or reference designs are attached. Moreover, the RFP highlights key standards (e.g., “Construction must comply with the 2021 International Building Code and OSHA 29 CFR 1926”). Bidders have a complete picture of the technical context and requirements, minimizing assumptions. Example Excerpt: “Technical Attachments: Provided in Appendix B are 30% design drawings (civil, structural, and architectural) for the new facility, a geotechnical investigation report with four soil borings, and an existing site utilities map. Specifications: The project shall adhere to ASTM and ACI standards as listed in Section 5 of this RFP – for instance, concrete work must meet ACI 318-19 and reinforcing steel per ASTM A615 Grade 60. Where specific products are referenced, “or equal” alternatives are permitted. Contractors must review the attached hazardous materials survey (Appendix C) to account for required abatement. Clarification: Any deviations from these requirements must be approved via addendum.” (This ‘A’ excerpt illustrates an RFP that hands bidders a wealth of technical info – drawings, soil data, standards – ensuring they can bid accurately with minimal guesswork.)

B (Good): The RFP provides most key technical information, though a few minor details or documents might be missing or not as clear. For example, drawings and specs are provided but perhaps one ancillary report (say, an older utility plan) is not included, or certain technical requirements are implied rather than explicitly stated. Nonetheless, the missing pieces are not deal-breakers – a reasonably experienced bidder can fill in the gaps with minimal uncertainty. Example Excerpt: “The RFP includes schematic design drawings and a list of required building systems (HVAC, electrical, structural). All workmanship shall follow relevant codes (IBC, NEC, etc.). Bidders are expected to verify on-site conditions; a pre-bid site visit will be held. (Note: A full topographic survey will be provided to the awarded contractor.)” (This ‘B’ example gives most information – drawings at schematic level, code requirements – but notes that a topo survey isn’t provided now, which introduces some uncertainty. It’s still generally good; prudent bidders might raise questions or include assumptions for the missing survey, but the majority of technical expectations are communicated.)

C (Average): The RFP includes some technical information, but leaves notable gaps or ambiguities. Bidders have part of the picture but not all – perhaps only a conceptual sketch or outline specs are given where detailed ones are needed, or critical site data is not provided. The RFP might rely on generic statements (“work to be per standard practice”) instead of project-specific requirements. Bidders will likely need to request information or make conservative assumptions, adding risk. Example Excerpt: “A basic floor plan sketch of the proposed layout is attached. Materials should be commercial grade and meet applicable standards. Specific design calculations or soil information are not available at this stage; contractors should account for typical soil conditions in this region. Any necessary drawings will be the contractor’s responsibility to produce.” (In this ‘C’ scenario, the RFP gives only a rough idea (a sketch) and minimal technical guidance. There is no geotech data or detailed spec – bidders would be forced to guess soil conditions and other design parameters, which could result in widely varying interpretations of scope and cost.)

D (Poor): The RFP’s technical information is seriously lacking or confusing. Key drawings or specs are missing, or the provided information contains contradictions and errors. For instance, the written specification might call for one thing and an attached diagram shows another (e.g., a note says “use steel grade A” but the drawing labels “steel grade B”) – these kinds of conflicts cause bidder confusion. Little to no site data is shared even if the project depends on it. Bidders would have to make major assumptions or even invest in their own preliminary investigations just to bid, which many will avoid. Example Excerpt: “No formal plans are available; bidders may visit the site and measure as needed. The RFP text mentions a 50 kW generator, but an older diagram (Fig. 1) labels it as 30 kW – bidders should ‘do their best’ to account for power needs. Material specs will be defined during construction. If information appears inconsistent, the contractor is responsible for reconciling it.” (This ‘D’ excerpt illustrates a poorly prepared RFP: no official drawings, self-contradictory references (50 kW vs 30 kW), and punting specs to later. Such an RFP would raise red flags; responsible bidders might either not bid or pad their bid significantly to cover the unknowns.)

F (Failing): The RFP provides virtually no usable technical information, or is so inconsistent that it’s unusable. For example, there are zero drawings or figures for a complex construction project, no specifications beyond “build to code,” and critical details (dimensions, capacities, site conditions) are omitted entirely. In worst cases, the RFP might explicitly state that the owner will not provide information (e.g., “no site data will be given, contractor assumes all conditions”), dumping all risk on bidders. This is a recipe for project failure or no bids. Example Excerpt: “Technical Requirements: Contractor to determine all requirements. No drawings are provided. Bidders should rely on their expertise to identify needed specifications. The facility must be built per all applicable laws – details to be finalized after award. (The Owner provides no warranties on existing site conditions; unknown conditions are at contractor’s risk.)” (This extreme ‘F’ case basically says “you figure it out” to the contractor. It withholds all data and places full responsibility on bidders for technical scoping. Such an RFP is highly unprofessional – it practically guarantees either no competent firm will bid or those that do will include huge contingency costs. It would likely lead to disputes or project collapse due to the unknowns involved.)

IMPORTANT: Your grade MUST reflect your actual analysis. Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F. Do NOT default to B-range or any particular grade. A truly excellent RFP deserves an A; a poor one deserves a D or F. Use the full range.

OUTPUT FORMAT (JSON only):
{
  "variable": "technicalRequirements",
  "grade": "YOUR LETTER GRADE",
  "reasoning": "2-3 sentences explaining the grade with specific references",
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1"],
  "examples": [
    {"type": "positive", "quote": "exact quote", "section": "section reference"}
  ],
  "improvement": {
    "title": "Concise improvement title",
    "description": "Specific actionable recommendation"
  }
}`,
  },

  fairCompetition: {
    weight: 0.10,
    name: "Fair Competition & True Discriminators",
    prompt: `You are an expert Construction Procurement Consultant analyzing an RFP specifically for FAIR COMPETITION AND TRUE DISCRIMINATORS.

DEFINITION & IMPORTANCE: This variable evaluates whether the RFP is structured to promote fair, open competition and uses meaningful discriminators to select a winner. “Fair competition” means the RFP’s requirements and criteria are not unjustifiably biased or restrictive – any qualified vendor should have a reasonable chance to compete. True discriminators are the factors that genuinely differentiate one proposal from another in terms of value; an RFP should focus on those, rather than arbitrary or overly specific demands that don’t add value. An RFP that scores well here avoids favoritism (not written with a pre-selected vendor in mind), avoids needless barriers (like requiring a vendor have 50 years of experience when 5 would do), and emphasizes evaluation factors that correlate with project success (technical quality, cost, etc.) rather than trivialities. Ensuring fair competition also means giving all vendors equal information and not tailoring specs to one product without allowables (“brand X or equal” is okay; “must use brand X” with no reason is not, unless only one solution truly exists). If the RFP is too restrictive without cause, competition suffers – vendors might not bother or the process might be seen as a sham. Conversely, if it’s too loose, that can be fair but might not help in selecting the best (so there’s a balance).

Focus ONLY on evaluating:
- Do requirements enable multiple qualified bidders to compete?
- Are there hidden preferences or sole-source indicators?
- Are discriminating factors based on merit (qualifications, approach, cost)?
- Are requirements reasonable or artificially restrictive?
- Is there evidence of "wired" specs favoring a specific contractor?
- Are mandatory qualifications proportionate to project needs?
- Are proprietary products mandated without "or equal" allowances?

GRADING SCALE:
A (Excellent): The RFP is impartial and focuses on meaningful differentiators. The requirements are specific to the project’s needs but not tailored to any one vendor or product (unless justified and allowed with equivalents). For instance, instead of naming a proprietary system, it specifies performance criteria (“must handle X throughput”) so multiple solutions can qualify. Any vendor meeting the qualifications has a fair shot – there are no hidden preferences. The evaluation factors are all relevant and value-driven, helping distinguish the best proposal. Unnecessary criteria that wouldn’t actually affect success are omitted (no “fluff” or irrelevant hurdles). The RFP also explicitly encourages competition – e.g., states that alternative approaches or innovation are welcome (when appropriate), and it refrains from overly punitive terms that would scare vendors off without benefit. In sum, it’s written as if the issuer genuinely wants the best solution from the broad market. Example Excerpt: “The City invites all qualified firms – large or small – to propose. No proprietary technology is mandated; proposals may utilize any solution that meets the performance requirements stated. The RFP’s criteria (technical approach, past performance, and cost) are designed to select the proposal providing the best value, without bias toward any particular vendor or method. For example, while a certain software is used as a reference model, bidders may propose an equivalent or better system. The requirements focus on outcomes, not specific branded inputs, to ensure we get a range of competitive solutions. Additionally, the RFP limits requirements to those that add value: all evaluation factors are true discriminators that will help tell proposals apart – there are no arbitrary minimums that don’t impact project success.” (This ‘A’ excerpt demonstrates a fair and open stance. It explicitly says no proprietary lock-in, encourages various solutions meeting performance needs, and claims all criteria are there for a reason. It implies the RFP was crafted to maximize competition while still homing in on what matters. It facilitates fair competition by design.)

B (Good): The RFP is generally fair and uses mostly relevant discriminators, but may have a few minor issues. Perhaps it has some stricter requirements that slightly narrow the pool, yet they are at least somewhat justifiable (for example, requiring a vendor to have done 3 similar projects – that cuts out newbies, but is a reasonable qualifier for a big job). Or it might specify a preferred solution but allows equals (“Brand X or equivalent”), which is fine, though a completely neutral spec is ideal. The evaluation criteria mostly focus on important factors, but maybe one criterion is of debatable value (e.g., a small preference for local offices which, while giving local firms a boost, is not entirely project-performance related – still, it’s a common practice and usually disclosed). Importantly, a ‘B’ RFP has no blatant favoritism or hidden agendas; any vendor reading it would feel they have a fair chance if they meet the requirements. Example Excerpt: “Requirements include that the contractor possess a valid state license and have completed at least two projects of similar size in the past five years. (This ensures experienced providers without unduly excluding qualified newer entrants who have some track record.) The RFP does mention a specific software platform the city currently uses for asset management and states a preference for integration, but it also notes that proposals offering alternatives will be considered if they meet integration requirements. Evaluation factors are largely substantive – e.g., methodology, experience, cost – with a 5% preference for local businesses as per city policy. All vendors receive the same information and there are no secret criteria.” (This ‘B’ scenario is mostly fair. The experience requirement is not extreme, the software preference is flexible with justification, and a local preference is disclosed and relatively small. These might slightly shape the competition, but they don’t amount to an unfair advantage for one known vendor. True discriminators like methodology and cost carry the majority weight. Vendors would likely accept these terms as generally fair, even if not perfectly level in every dimension.)

C (Average): The RFP is somewhat restrictive or includes criteria that aren’t true differentiators, but not to an egregious extent. Maybe there are high minimum qualifications that limit competition more than necessary (e.g., requiring 10 years of operation when perhaps 5 would suffice), or very detailed specifications that lean towards a particular solution without outright excluding others. The RFP might also include a few odd requirements that don’t clearly add value (for instance, a very specific format or a minor certificate not really relevant). However, these issues, while they might reduce the number of capable bidders or put some at a slight disadvantage, aren’t so severe as to indicate intentional bias – perhaps more a result of boilerplate or not thinking through necessity. The evaluation might have one or two factors that won’t actually distinguish much (like giving a few points for proposal formatting neatness – which all serious bidders would likely do anyway), diluting focus on true discriminators. Example Excerpt: “The RFP specifies that the contractor must have an office in-state and at least 20 full-time employees. It also asks for proof of ISO9001 certification (even though this project is straightforward construction where that standard might not directly impact results). While these criteria might eliminate some smaller firms, the city included them aiming for reliability. The technical specs detail a preferred brand of pipe fitting; equivalents are allowed but the approval process for an equivalent isn’t clearly described, possibly discouraging alternates. Evaluation includes standard categories, but also a “Proposal Completeness” criterion worth 10% – essentially checking if the proposal followed instructions, which serious bidders all would, so it may not truly set proposals apart. There’s no overt single-vendor bias, but some requirements could be seen as overly restrictive or not crucial.” (This ‘C’ example shows moderate issues: in-state office and 20 staff might cut out newer or out-of-state players who could do the job, and ISO certification might not be relevant – these could reduce competition a bit. The preferred pipe brand and unclear equivalency clause might nudge bidders to that brand to be safe, hinting at a possible bias or just laziness in spec writing. None of this absolutely rigs the bid (multiple firms likely meet these requirements), but it’s not as open as it could be. The evaluation criterion for completeness is not a real discriminator since presumably all finalists will be complete – it’s somewhat a wasted factor. Overall, it’s an average situation: not blatantly unfair, but not optimally competitive either.)

D (Poor): The RFP shows clear signs of unfairness or irrelevant criteria that likely skew or limit competition significantly. Perhaps the requirements are written so narrowly that only a very small handful of vendors (or one known incumbent) can meet them – e.g., specifying dozens of must-have features or certifications that coincide with what one vendor offers. Or it mandates a proprietary technology with no allowance for “or equal,” effectively locking the solution to one source. There might also be overly harsh terms (like extremely high insurance levels or liability clauses) that smaller or new vendors can’t accept, without justification to the project risk, thereby favoring big players. The evaluation criteria might include arbitrary factors that don’t relate to performance (like giving heavy weight to a factor that most competitors are identical in, or something like “office must be within 5 miles of our office” giving a huge hometown advantage). These practices undermine true competition and suggest the RFP issuer either has a predetermined favorite or is not concerned with getting the best value through competition. Example Excerpt: “The technical specification in the RFP calls for use of the AcmeCo Brand XYZ control system, no substitutions, and requires the contractor to have 15 years of experience using this proprietary system. Additionally, one evaluation criterion gives 15% weight to ‘prior direct work with our agency,’ which heavily favors the incumbent contractor. Together, these conditions practically ensure only one or two vendors qualify. The solicitation also demands a net worth of $100 million and worldwide project experience – which is unrelated to this local project’s scope but excludes many capable mid-sized firms. These requirements are far more restrictive than necessary and limit competition.” (This ‘D’ example is quite pointed: a brand lock-in with no substitution, a lengthy specific experience requirement (15 years) that aligns with a known vendor, and even an evaluation bias for having worked with the agency before – all are hallmarks of an unfair RFP. It reads as if it’s designed for one vendor’s qualifications. Most vendors would see this and suspect it’s a “wired” solicitation. Even if not intentionally corrupt, it’s poor practice because it doesn’t focus on real value differences – e.g., insisting on one brand rather than performance, or 15 years vs evaluating actual capability. The result is likely fewer bids and possibly higher prices due to reduced competition.)

F (Failing): The RFP is effectively non-competitive or sham – it either explicitly or implicitly excludes all but a preselected vendor, or uses nonsensical/irrelevant criteria that have nothing to do with the project just to tilt the playing field. An example is an RFP that requires a combination of credentials or product features so unique that only one company in the world could satisfy it (and those requirements aren’t truly justified by project needs). Or an RFP that might even name a vendor or product without alternatives in a non-standard way, or include secret criteria (not disclosed) that are used to eliminate others. Another failing scenario: criteria that are supposed to matter but don’t actually differentiate any bidder, combined with a lack of real factors, making the selection arbitrary – but typically, failing fairness is about bias and excessive restriction. Example Excerpt: “This RFP requires the contractor to have completed exactly four projects in the past year, each using the MegaBuild 3000 system, and at least one project for Department X (the issuing department) – conditions that only the incumbent contractor meets. It also states that the decision has already been preliminarily made based on market research, and proposals are a formality. The evaluation criteria list includes odd items like the astrological sign of the company’s CEO (obviously not really relevant) – indicating a lack of genuine intent to evaluate fairly. Essentially, no other firm can realistically compete under these terms.” (This exaggerated ‘F’ scenario highlights an RFP that is ostensibly a farce – it either intentionally or negligently ensures only one outcome. The requirement of “exactly four projects” with a specific system and having worked for the department is absurdly narrow and tailor-made. The mention that a decision is already made would never be put so bluntly, but sometimes insiders or wording might tip off that they already have someone in mind. When criteria become irrelevant or comical (like the astrological sign example for effect), it signals the evaluation is not serious. In short, an ‘F’ RFP violates the principle of fair, competitive procurement. Regulators or ethical oversight would score it extremely poorly, and vendors would likely either protest or not bother, knowing it’s a done deal.)

IMPORTANT: Your grade MUST reflect your actual analysis. Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F. Do NOT default to B-range or any particular grade. A truly excellent RFP deserves an A; a poor one deserves a D or F. Use the full range.

OUTPUT FORMAT (JSON only):
{
  "variable": "fairCompetition",
  "grade": "YOUR LETTER GRADE",
  "reasoning": "2-3 sentences explaining the grade with specific references",
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1"],
  "examples": [
    {"type": "positive", "quote": "exact quote", "section": "section reference"}
  ],
  "improvement": {
    "title": "Concise improvement title",
    "description": "Specific actionable recommendation"
  }
}`,
  },

  purposeContext: {
    weight: 0.05,
    name: "Purpose, Outcomes & Project Context",
    prompt: `You are an expert Construction Procurement Consultant analyzing an RFP specifically for PURPOSE, OUTCOMES AND PROJECT CONTEXT.

DEFINITION & IMPORTANCE: This measures how clearly the RFP explains why the project is being undertaken, what success looks like, and any background context (historical, technical, or organizational) that frames the project. A high-quality RFP provides a concise project purpose statement, specific objectives/outcomes, and relevant context such as current challenges or drivers for the project. This context is crucial because it aligns bidders with the project’s goals and helps them tailor their proposals effectively. In fact, a well-crafted context section can “make or break” an RFP – it gives vendors a clear rationale and motivation, leading to more relevant and targeted proposals. Conversely, a poor RFP in this area leaves bidders guessing the project’s true goals or background, risking misaligned proposals.

Focus ONLY on evaluating:
- Is there a clear purpose statement explaining WHY the project exists?
- Are desired outcomes specific and measurable?
- Is project context provided (background, history, stakeholders)?
- Is the problem/need driving the project explained?
- Is regulatory or compliance context included if applicable?
- Do bidders understand the strategic importance?

GRADING SCALE:
A (Excellent): The RFP articulates a crystal-clear purpose and desired outcomes, and provides rich project context. It explains the problem or need driving the project, the intended results (with measurable targets if applicable), and background info such as history, stakeholders, or strategic importance. The narrative is cohesive and motivating, giving vendors a full picture of “why” the project exists. Example Excerpt: “Background: The City’s 2030 Vision identifies aging water infrastructure as a critical challenge. This RFP’s purpose is to modernize Pump Station #5 to increase capacity by 25% and meet new EPA standards. Desired Outcome: A fully operational, energy-efficient pump station that eliminates current overflow incidents (baseline: 4 per year). By sharing our recent system assessment (Appendix A) and regulatory context, we ensure proposers understand the urgency and performance goals of this project.” (This excerpt clearly states why the project is needed, the specific outcome targets, and context of assessments/regulations, reflecting an ‘A’ quality RFP.)

B (Good): The RFP states the project’s purpose and goals, but with slightly less detail or clarity. The context is provided but may omit some nuances. Overall understanding is still good – bidders can tell what is needed and why – but perhaps the outcomes aren’t quantified or the background could be richer. Example Excerpt: “The purpose of this project is to upgrade the campus security system to address recent incidents and comply with updated safety policies. The expected outcome is a more reliable, modern system across all facilities. (Context: our current system is 15 years old and prone to failures.)” (This is generally clear, though it might not include specific metrics or a deep dive into incident stats; it’s a solid ‘B’ – informative but not as comprehensive as it could be.)

C (Average): The RFP provides some statement of purpose and outcomes, but it’s vague or incomplete. The context is minimal – maybe just a sentence or two of background with little detail. Bidders can infer the basics of what’s needed, but they might not fully grasp the project’s significance or specific success criteria. Example Excerpt: “The City is seeking proposals for construction of a new community center. The goal is to improve services for residents. (Background: The current facility is outdated.)” (This ‘C’ example gives a general idea – build a community center to improve services – but lacks detail on what “improve services” means, how outdated the current facility is, or any specific objectives. It’s serviceable but not specific.)

D (Poor): The RFP’s purpose and outcomes are unclear or conflicting. It may merely repeat a title (“Construction of X project”) without explaining why it’s needed or what the owner expects to achieve. Little to no project context is given, or the information provided raises questions (e.g. mentions a problem but provides no data, or lists objectives that don’t align). Bidders will be confused about the driving vision. Example Excerpt: “The Department requests proposals for Project Alpha. (No further explanation of project rationale.) Expected outcome: completion of Project Alpha per specifications.” (This ‘D’ excerpt is essentially just naming the project; it doesn’t state any real purpose or context – bidders don’t know why the project matters or what success entails beyond generic completion.)

F (Failing): The RFP fails to communicate the project’s purpose or outcomes. It may jump straight into technical specs or tasks with zero contextualization, or provide a few disjointed statements that confuse more than clarify. An ‘F’ RFP leaves bidders in the dark about the “big picture,” often resulting in misaligned proposals or lack of bidder interest. Example Excerpt: “The Company is issuing this RFP for unspecified services. Outcome: TBD. Context: N/A.” – or – “We seek a solution; details will be discussed with the winner.” (In these extreme examples, the RFP gives virtually no insight into why the project exists or what it aims to achieve. Such an RFP is unacceptable, as vendors cannot divine the project’s intent, leading to wildly varied or misguided proposals.)

IMPORTANT: Your grade MUST reflect your actual analysis. Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F. Do NOT default to B-range or any particular grade. A truly excellent RFP deserves an A; a poor one deserves a D or F. Use the full range.

OUTPUT FORMAT (JSON only):
{
  "variable": "purposeContext",
  "grade": "YOUR LETTER GRADE",
  "reasoning": "2-3 sentences explaining the grade with specific references",
  "strengths": ["specific strength 1"],
  "weaknesses": ["specific weakness 1"],
  "examples": [
    {"type": "positive", "quote": "exact quote", "section": "section reference"}
  ],
  "improvement": {
    "title": "Concise improvement title",
    "description": "Specific actionable recommendation"
  }
}`,
  },

  scheduleRealism: {
    weight: 0.05,
    name: "Schedule Realism & Milestones",
    prompt: `You are an expert Construction Procurement Consultant analyzing an RFP specifically for SCHEDULE REALISM AND MILESTONES.

DEFINITION & IMPORTANCE: This factor looks at how the RFP handles the project schedule – including the overall timeline for completion and any interim milestones – and whether those schedule expectations are realistic and clearly defined. A good RFP will outline key dates (start, finish, and major milestones) that are achievable given the project scope, or will request bidders to propose a schedule within practical constraints. Unrealistic schedules can doom a project from the start or scare off qualified bidders. For example, an overly compressed timeline might increase costs or dissuade vendors from responding. Similarly, unclear or inconsistent schedule information can cause confusion. A well-crafted RFP provides a logical timeline and explains any fixed deadlines (e.g. “completion required before winter season, due to funding or operational needs”), so bidders can plan accordingly. If there are interim milestones (phases, deliverable due dates, etc.), these should be stated. The schedule should also allow reasonable time for bidding and questions – an RFP that demands proposals almost immediately or sets absurd project completion dates is considered low quality and often signals underlying issues.

Focus ONLY on evaluating:
- Is the project timeline realistic for the scope?
- Are key milestones defined with specific dates?
- Is there allowance for weather, permitting, or other delays?
- Are phasing requirements clear?
- Is the proposal preparation time adequate?
- Are liquidated damages proportionate and reasonable?

GRADING SCALE:
A (Excellent): The RFP sets forth a clear, feasible schedule for the project (and the procurement process) that aligns with the project’s complexity. It lists key milestones and dates in a logical sequence and provides rationale for any aggressive dates. For example, it might include a project timeline Gantt or table: design phase duration, permitting period, construction start and substantial completion dates, etc., all of which appear reasonable. If the project has a firm deadline (like a grant expiration or event date), the RFP explicitly mentions it and possibly invites bidders to propose alternatives or confirm feasibility. The RFP also clearly states the proposal timeline (when bids are due, when award is expected, etc.) with enough time for bidders to prepare quality proposals. Example Excerpt: “Project Schedule: The anticipated contract award is March 1, 2026. Construction is expected to start by April 2026 after permits are obtained, with a substantial completion milestone of March 31, 2027 (12 months on-site construction). Major milestones: 30% design review by July 2026; 60% design by Oct 2026; Begin foundation work by Nov 2026; Commissioning and testing in Feb 2027. These dates are based on a required operational date of May 2027 to align with the new school year. Note: Bidders should confirm in their proposals that this timeline is achievable; slight adjustments can be negotiated if justified. The RFP includes a detailed schedule table and identifies dependencies (e.g., “Owner-furnished equipment delivery by Dec 2026”).” (This ‘A’ example shows a detailed, sensible timeline. It spans a year+ for a significant project, which is plausible. The deadlines are justified by an operational need and the RFP is transparent about them, even allowing discussion of slight adjustments – a very mature approach.)

B (Good): The RFP provides a schedule or completion deadline that is generally reasonable, though perhaps on the tighter side or lacking some detail in milestones. It lists the final completion date and maybe a couple of interim dates, and these seem achievable, albeit with efficient work. There might be minor concerns (e.g., not much float time for unexpected delays), but overall the timeline isn’t wildly unrealistic. The bidding timeframe is also adequate (not last-minute). Example Excerpt: “Project completion is required within 8 months of contract award. The desired milestones are: foundation complete by Month 3, structural framing by Month 5, and final inspections in Month 8. We plan to award by September 1, with work commencing immediately. (The timeline is driven by the funding cycle which ends next fiscal year.) Bidders should include a schedule confirming they can meet these milestones.” (This ‘B’ schedule is relatively tight – 8 months – but not impossible for, say, a moderate-sized building. It does provide interim milestones. It could be improved by adding detail or buffer, but it’s still mostly credible, especially since a reason is given and bidders are asked to confirm feasibility.)

C (Average): The RFP mentions a schedule or end date, but it’s either somewhat ambiguous or questionable in realism. It might just specify a completion date without considering whether the scope can realistically be done in that time, or it may omit intermediate milestones which would help understand the pace. Alternatively, the schedule could be realistic but not clearly communicated (scattered references to dates in different sections, for example). The bidding timeline might also be just barely adequate, indicating moderate quality. Example Excerpt: “The project should be completed as soon as possible, ideally by Q4 of this year. A detailed timeline is not provided; bidders should propose a schedule. (Owner anticipates construction might take ~6 months.)” (In this ‘C’ case, the RFP suggests a desired completion by end of year but doesn’t firmly commit or detail milestones. “As soon as possible” is open-ended and the owner guess of 6 months might or might not be accurate. Bidders are left to figure out the schedule themselves. It’s not outright crazy, but it’s not well-defined either, putting it in the average range.)

D (Poor): The RFP’s schedule expectations are unrealistic or very unclear. Perhaps the RFP demands a project timeline that is overly aggressive given the scope (e.g., expecting a normally 12-month project to be done in 4 months). It might also cram the bidding and award process into an unreasonably short window. Another scenario: the RFP gives contradictory schedule info (one section says completion in 6 months, another elsewhere says 12 months). Such issues can dissuade qualified bidders, who recognize the schedule is not feasible. Example Excerpt: “Schedule: Time is of the essence. The facility must be fully constructed and operational 90 days from contract award, no exceptions. (Note: A different page of the RFP mentions a 6-month schedule; if conflicting, assume the shortest timeframe.) Also, the RFP was issued on June 1 with proposals due June 7 – we expect to break ground by June 15.” (This ‘D’ scenario is clearly problematic: a 90-day build for something presumably big, plus a one-week bid period, indicate a rushed/unrealistic plan. The internal inconsistency (90 days vs 6 months) adds to the confusion. Most experienced bidders would view this as high-risk or impossible without massive resources or corners cut.)

F (Failing): The RFP either provides no schedule guidance at all for a time-sensitive project, or sets a completely impossible timeline that betrays a lack of understanding. It might ignore obvious constraints (e.g., expecting outdoor construction in deep winter in a cold region without plan) or provide a timeline that no rational contractor could meet (leading to either project failure or no bids). Another failing case is when an RFP timeline is so chaotic – for example, requiring proposal submission, evaluation, award, and full project completion all in an absurdly short span – that it suggests the RFP issuer is not serious or competent. Example Excerpt: “Schedule: ASAP. We require all work done and delivered within one month of award, regardless of project size. The specific dates will be determined later. Bidders should be prepared to work 24/7 if needed. No timeline extensions will be granted.” Or, an example from a process standpoint: “RFP issued Nov 1. Questions due Nov 7 (only 6 days for questions). Answers by Nov 8. Proposals due Nov 9 (only 1 day after Q&A). Interviews on Nov 12, award by Nov 14, and project kickoff Nov 15. Final deliverable must be live by Dec 15.” (These are drawn from a real example of a highly unrealistic schedule. This kind of timeline is highly unlikely to succeed: bidders have virtually no time to prepare after Q&A, the owner cannot realistically evaluate and approve in the scant days allotted, and the project timeline is extremely compressed. An RFP of this nature would earn an ‘F’ – it demonstrates poor planning and sets the project up for failure or no participation from credible vendors.)

IMPORTANT: Your grade MUST reflect your actual analysis. Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F. Do NOT default to B-range or any particular grade. A truly excellent RFP deserves an A; a poor one deserves a D or F. Use the full range.

OUTPUT FORMAT (JSON only):
{
  "variable": "scheduleRealism",
  "grade": "YOUR LETTER GRADE",
  "reasoning": "2-3 sentences explaining the grade with specific references",
  "strengths": ["specific strength 1"],
  "weaknesses": ["specific weakness 1"],
  "examples": [
    {"type": "positive", "quote": "exact quote", "section": "section reference"}
  ],
  "improvement": {
    "title": "Concise improvement title",
    "description": "Specific actionable recommendation"
  }
}`,
  },

  internalConsistency: {
    weight: 0.05,
    name: "Internal Consistency",
    prompt: `You are an expert Construction Procurement Consultant analyzing an RFP specifically for INTERNAL CONSISTENCY.

DEFINITION & IMPORTANCE: This variable checks whether the RFP’s various sections align with each other without contradictions – specifically, that the project requirements, the proposal instructions, and the evaluation criteria are all consistent and in sync. A high-quality RFP will have a tight linkage: what it asks the contractor to do (scope/requirements) should be mirrored by what it asks the bidder to include in the proposal, and those should tie directly to how the proposal will be evaluated. For example, if an RFP requires a safety plan in the scope, it should ask bidders to describe their safety approach in the proposal, and then safety should be one of the evaluation factors. Consistency prevents confusion and ensures fairness. Inconsistent RFPs – where, say, the evaluation criteria include something never requested in the proposal, or instructions ask for info that isn’t mentioned as a requirement – can lead to bidder errors or exploitation. Inconsistencies create ambiguity and can result in less advantageous offers or even legal challenges. Thus, an internally consistent RFP demonstrates that the document was carefully coordinated, typically yielding better proposals that address exactly what the client needs.

Focus ONLY on evaluating:
- Do different sections align (requirements, instructions, evaluation)?
- Are there contradictions between scope and specifications?
- Do referenced sections and documents exist?
- Are terms used consistently throughout?
- Do dates and deadlines align across sections?
- Is formatting and numbering consistent?

GRADING SCALE:
A (Excellent): The RFP is fully internally consistent. Every major requirement in the scope is reflected in the proposal instructions and evaluation scheme. There are no conflicting statements or numbers across sections. For instance, if the scope says “include commissioning services,” the proposal instructions explicitly ask for a commissioning approach, and the evaluation criteria include assessment of the commissioning plan. The schedule for proposal submission and evaluation described in one section matches any dates mentioned elsewhere. The RFP might even provide a compliance matrix or cross-reference chart to map requirements to proposal sections and evaluation factors, underscoring the tight alignment. Example Excerpt: “Section III (Scope of Work) details a requirement for a Quality Control Plan to be implemented during construction. In Section IV (Proposal Instructions), we ask bidders to “describe your proposed Quality Control Plan”. In Section V (Evaluation Criteria), the Quality Control Plan is explicitly one of the sub-factors under Technical Approach. (Likewise, every item the proposal must include corresponds to something we will evaluate, and nothing is evaluated that we didn’t ask for.)” Another indicator in an excerpt: “The RFP includes a Requirements-to-Proposal Crosswalk Table (Appendix E) that lists each RFP requirement and indicates where in the proposal it should be addressed and under which evaluation factor. Offerors are encouraged to use this as a checklist to ensure full compliance.” (This kind of meticulous consistency exemplifies an ‘A’ – the RFP was clearly drafted with coordination, making it easy for bidders to follow and cover all points. There are no discrepancies like differing numbers, terms, or instructions anywhere in the document.)

B (Good): The RFP is mostly consistent, with only minor lapses or omissions in alignment. Perhaps 95% of the requirements line up with instructions and criteria, but one small element might be missing – for example, the RFP requires a certain plan (like a sustainability plan) in the work, but it forgets to explicitly ask for it in the proposal outline, though an attentive bidder could infer to include it. Or maybe the evaluation criteria combine some factors in a way not exactly mirrored by how the instructions were written (e.g., the instructions separate “Staffing Plan” and “Experience” sections, but evaluation combines them into one factor – not a deal-breaker, but a slight inconsistency). There are no blatant contradictions, just subtle misalignments or lack of one-to-one correspondence. Example Excerpt: “The RFP asks in Section 2 for a list of key sub-consultants. While the evaluation criteria don’t explicitly name ‘sub-consultants’ as a scored item, they are effectively considered under the ‘Team Experience’ factor. All other requested proposal items (approach, schedule, etc.) have matching evaluation factors.” (This illustrates a minor inconsistency: sub-consultants info is requested but not separately scored – likely folded into a broader category. A bidder might wonder if it’s truly considered, but it’s a small issue. Overall, the RFP would still come across as well-aligned; only a very detail-oriented bidder might notice a slight gap.)

C (Average): The RFP has some noticeable inconsistencies or gaps, though not catastrophic ones. Perhaps certain requirements aren’t mentioned in the evaluation or instructions, or vice versa. For example, the RFP might require compliance with a specific standard or a certain service (like “maintenance for 2 years after installation”) in the scope, but then never ask the bidder to address that in their proposal, nor indicate it will be evaluated – leaving a grey area. Or maybe the instructions ask for a detailed staffing plan, but the evaluation criteria don’t clearly state that staffing will be evaluated (it might be lumped into “overall approach” without saying so). Additionally, there could be minor conflicting info – like the RFP document says proposals must be 30 pages in one section and 40 pages in another (confusing, but not directly about content). These issues can cause bidders to guess what’s important or possibly overlook something that is required but not emphasized consistently. Example Excerpt: “Section III lists a ‘Community Outreach Plan’ as a project requirement, but when preparing the proposal, bidders find no mention of an Outreach Plan in the proposal instructions. The evaluation criteria also don’t explicitly refer to outreach or communication. (It’s unclear if or how the outreach aspect will be considered in selection.) Additionally, the RFP’s Section I says the proposal should include a timeline, but Section IV (Instructions) doesn’t list ‘Timeline’ as a required section – this inconsistency could confuse bidders whether to include a separate schedule narrative.” (This ‘C’ level scenario shows a couple of alignment issues. Bidders might notice the outreach requirement and decide to include it proactively, but some might miss it since it isn’t asked for in the proposal instructions – leading to uneven responses. It’s not an utter mess, but it’s sloppy enough to reduce clarity.)

D (Poor): The RFP displays significant internal inconsistencies or misalignments. Multiple instances arise where one part of the RFP contradicts another or important elements don’t sync. For example, the scope might require ABC, but the proposal instructions ask for XYZ instead, or evaluation criteria include factors that were never requested in proposals (surprising bidders). Numbers or terms might conflict (e.g., different sections of the RFP give different contract durations or different required completion dates). It may appear as if different people wrote different sections and they were never reconciled. This can lead to confusion, vendor questions, or even legal disputes if a bidder feels misled. Example Excerpt: “In the Scope of Work, the RFP states the contractor must have capability to perform environmental testing; however, the Evaluation Criteria make no mention of environmental capability and instead include a scoring category for ‘marketing plan’ – which is not asked for anywhere in the RFP. The Instructions to Bidders request a “detailed safety plan” in the proposal, but the Scope never mentioned safety planning as part of the project deliverables. Furthermore, Section I says the contract term is 2 years, while an attachment says 1 year – an internal contradiction.” (This ‘D’ example highlights multiple inconsistencies: an irrelevant evaluation factor (marketing plan) not grounded in any requirement, a proposal instruction (safety plan) that isn’t reflected in the scope or evaluation explicitly, and conflicting basic info (contract term). These issues likely result in bidder confusion, necessary clarifications via Q&A, and a sense that the RFP is poorly cobbled together. It undermines confidence that the evaluation will be fair or focused on the right things.)

F (Failing): The RFP is riddled with contradictions and misalignments to the point of incoherence. Requirements, instructions, and evaluation seem to be on different planets. For instance, the RFP might include a copy-pasted instruction section from a completely different project, leading to irrelevant proposal requests and mismatched evaluation plans. You might see outright conflicts like the RFP telling bidders to ignore what’s said in another section (e.g., “Disregard Section 5 if it conflicts with Section 3” – indicating a failure to reconcile). An ‘F’ RFP might, for example, evaluate based on criteria that have no relation to the stated project objectives, or require proposal elements that have nothing to do with what will actually be delivered. This level of inconsistency can lead to mass bidder confusion, protests, or no viable responses. Example Excerpt: “(Scope Section) The project is a bridge construction; (Evaluation Section) Proposals will be scored on the quality of graphic design and layout of marketing materials. – (Instructions Section) Please include a proposed curriculum for student training programs (note: there is no mention of training in scope or evaluation). Also, Section 2 says ‘Offerors must propose using software X’, while Section 6 says ‘Any software is fine’. The document repeatedly contradicts itself.” (This exaggerated but illustrative ‘F’ scenario shows a completely disjointed RFP – evaluation criteria about marketing for a bridge project, asking for a training curriculum that’s irrelevant, and direct self-contradictions. It’s almost nonsensical. Bidders would likely either be utterly confused or assume the RFP is a cut-and-paste error document. This kind of internal inconsistency could lead to 1 in 3 bids being disqualified due to “hidden or conflicting requirements” and, if contested, could result in legal challenges. In summary, an RFP at this level fails to provide a coherent basis on which to prepare or evaluate proposals.)

IMPORTANT: Your grade MUST reflect your actual analysis. Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F. Do NOT default to B-range or any particular grade. A truly excellent RFP deserves an A; a poor one deserves a D or F. Use the full range.

OUTPUT FORMAT (JSON only):
{
  "variable": "internalConsistency",
  "grade": "YOUR LETTER GRADE",
  "reasoning": "2-3 sentences explaining the grade with specific references",
  "strengths": ["specific strength 1"],
  "weaknesses": ["specific weakness 1"],
  "examples": [
    {"type": "negative", "quote": "contradictory language", "section": "section reference"}
  ],
  "improvement": {
    "title": "Concise improvement title",
    "description": "Specific actionable recommendation"
  }
}`,
  },

  commercialTerms: {
    weight: 0.05,
    name: "Commercial Terms & Risk Allocation",
    prompt: `You are an expert Construction Procurement Consultant analyzing an RFP specifically for COMMERCIAL TERMS AND RISK ALLOCATION.

DEFINITION & IMPORTANCE: This variable covers the RFP’s handling of commercial terms (contract terms and conditions such as payment terms, warranties, bonds, insurance, indemnities, etc.), how risk is allocated between the owner and contractor, and any rules about post-selection negotiation or contract award. A quality RFP will either include a draft contract or clearly outline key commercial terms so bidders know what they’re signing up for. It will allocate risks in a balanced or at least clearly defined way (e.g., who is responsible for unforeseen site conditions, or delays due to third parties). If risks are heavily one-sided (all dumped on the contractor) without compensation, it can drive up prices or drive away bidders. Conversely, if risks are appropriately allocated to the party best able to manage them, the project is more likely to succeed and attract good competition. Negotiation rules refer to whether the RFP indicates the contract is fixed with no negotiation, or if there will be a BAFO (Best and Final Offer) round, etc. Clarity on this prevents misunderstandings (for instance, bidders should know if they can propose exceptions to terms or if doing so will get them disqualified). Essentially, this category checks if the RFP’s commercial framework is fair, clear, and not excessively punitive or uncertain.

Focus ONLY on evaluating:
- Is the contract type clear (lump sum, GMP, cost-plus)?
- Are payment terms reasonable and clearly defined?
- Is risk allocation between owner and contractor fair?
- Are insurance and bonding requirements appropriate?
- Are change order procedures defined?
- Are warranty requirements reasonable?

GRADING SCALE:
A (Excellent): The RFP provides a clear, fair draft contract or term sheet for the project, indicating major commercial provisions up front. Important terms like payment schedule (e.g., monthly progress payments, retainage %), warranty period, liquidated damages (if any), bonding requirements, insurance coverage limits, indemnification clauses, etc., are either included or referenced. The risk allocation is relatively balanced and industry-standard – the owner retains certain risks that are better controlled by them (e.g., regulatory changes, differing site conditions might be handled via change order) and the contractor is assigned the risks they can control (e.g., workmanship, meeting the specs). If it’s a public sector RFP with non-negotiable terms, the RFP plainly states that and provides the terms so bidders can accept or not; if negotiations are allowed, the RFP outlines that process (e.g., “After selection, the owner is willing to negotiate reasonable changes to terms except those mandated by law”). The key is that bidders know the rules of engagement and the deal they’re bidding on. There are no hidden “gotcha” clauses later – transparency is high. Also, the terms aren’t so draconian that only desperate or uninformed contractors would accept; rather, they resemble standard contracts (like ConsensusDocs, AIA, or other fair contract models) or clearly explain any deviations. Example Excerpt: “A Draft Contract is attached (Attachment 1) which will form the basis of the agreement. It includes: Payment Terms – monthly progress payments, 10% retainage released at completion; Warranty – Contractor to warrant work for 1 year after final acceptance; Liquidated Damages – $500/day for late completion beyond a 30-day grace period, due to contractor delays only; Insurance – minimum $2M general liability, etc.; Bonding – 100% Performance and Payment Bonds required. Risk Allocation: The contract uses a differing site conditions clause – if unknown site issues arise, the parties will equitably adjust price/time (i.e., contractor not solely at risk for hidden conditions beyond what a diligent investigation would show). Negotiation: The City’s general terms are non-negotiable, but the City may discuss the project-specific scope and schedule with the selected proposer before finalizing the contract. Bidders should review all terms now and raise any exceptions with their proposal. The intent is a fair agreement – for instance, the contract includes a mutual indemnification (each party holds the other harmless for its own negligence) rather than a one-sided indemnity.” (This comprehensive ‘A’ example shows clarity and balance. It enumerates key points, shows how risk like unknown site conditions are handled fairly (with equitable adjustment, not just contractor’s problem), and includes reasonable LDs and warranty. It also makes negotiation rules clear – essentially, “these are the terms, minor tweaks might be discussed but don’t expect overhaul.” Bidders seeing this can price accordingly, not needing a huge risk contingency. The fairness – e.g., mutual indemnity – will encourage serious firms to bid because the contract isn’t out to victimize them.)

B (Good): The RFP does include commercial terms, but they might be somewhat more owner-favorable or less detailed than an “A” case, yet still within a normal range. For example, it might include a standard contract template that slightly tilts risk to the contractor, but nothing outrageous – experienced bidders will recognize the terms and know how to manage them (perhaps by a bit of added contingency or insurance). Key terms are disclosed, but maybe a few specifics are missing (perhaps the exact insurance limits or indemnity clause text isn’t provided in the RFP, but it’s referenced that standard clauses will apply). Risk allocation might be a bit conservative – e.g., a clause that says “contractor is assumed to have examined site conditions thoroughly and no extra will be paid for the unknown” – which shifts risk to contractor, but this is at least stated. Bidders can factor it in. Negotiation might not be mentioned, implying either it’s not expected or will follow standard practice; this lack of clarity is a small ding, but bidders usually assume limited negotiation if not stated. Overall, the terms are somewhat one-sided but not egregiously so, or they’re fair but not thoroughly explained (leaving bidders to assume standard practice). Example Excerpt: “The RFP includes summary commercial terms: Payment will be lump-sum with 5% retainage; a one-year warranty on all work is required; a Performance Bond is required. The contract will likely be the Agency’s standard construction contract (available upon request) which contains typical provisions such as indemnification (Contractor indemnifies Agency for all claims arising from the work) and a no-damages-for-delay clause (time extension is sole remedy for owner-caused delays). While these terms place more performance risk on the contractor, they are standard for our projects. Bidders should be prepared to accept the contract as-is; extensive negotiations are not anticipated.” (This ‘B’ example shows a bit more risk pushed to contractor – e.g., no-damages-for-delay means if the owner delays, contractor only gets time, not cost, which is somewhat owner-friendly. Also the indemnity is one-directional. These are common but not ideal for contractors. However, they’re transparent here. Bidders will recognize them and either decide it’s still worth bidding (maybe adding a contingency for delay risk) or not. The terms aren’t hidden – they said it’s the standard contract and even offered it on request, which is reasonably transparent. It’s not balanced enough for an A, but it’s acceptable and common, thus a ‘Good’ rating.)

C (Average): The RFP addresses commercial terms and risk allocation to a degree, but there may be important details missing or somewhat onerous terms without full context. Possibly the RFP just says “standard contract terms will apply” but doesn’t provide them up front – leaving bidders to either assume or find those separately. Or it includes a few major terms but omits others (maybe it mentions a bond and warranty, but doesn’t mention how changes or delays are handled). Risk allocation might default to the contractor by silence (e.g., it doesn’t talk about differing conditions, implying the contractor might bear that risk by default). The RFP might also state that “the contract is attached” but it’s full of legalese that strongly favors the owner, which bidders have to comb through – it’s disclosed, but not highlighted or summarized, so some bidders might miss tricky clauses. Negotiation rules are likely not specified – one might not know if exceptions to terms can be proposed or not, which is a grey area. Overall, an average case: terms not fully transparent or balanced, but also not shockingly bad; bidders might have to ask questions or assume worst-case on unknowns. Example Excerpt: “Key contract conditions include a requirement for 10% bid bond and 100% performance bond, and the contractor must carry $5M in liability insurance. The RFP does not explicitly state other terms, but bidders are expected to review the Draft Agreement (which was mentioned as available on the website, though not directly attached here). The draft contract contains standard government contract clauses. Notably, it has a broad indemnification clause and does not mention differing site conditions (implying the contractor assumes that risk). There is also a clause allowing the owner to terminate for convenience. These terms are common in our jurisdiction, but the RFP document itself did not highlight them. Bidders can seek clarifications if needed. Changes to contract language are generally not entertained after selection, although the RFP does not spell out a formal negotiation policy.” (In this ‘C’ scenario, the terms are out there but not clearly communicated in the RFP text – bidders have to go look at the draft contract elsewhere to find important risk allocations like no differing site conditions clause. Some bidders might overlook that until late. The terms themselves (broad indemnity, termination for convenience) are standard in government work but all favor the owner. Still, nothing is extremely unusual – just not balanced or clearly summarized. This requires bidders to be savvy and cautious, making it average. Communication of negotiation is vague – likely meaning assume no negotiation but it wasn’t plainly stated. This lack of clarity brings it down to average.)

D (Poor): The RFP’s commercial terms are heavily one-sided, unclear, or likely to deter competition due to risk. Perhaps the draft contract (if provided) is very punitive: e.g., unlimited liability for the contractor, “no damages for any delay of any kind” even if owner fault, requirement for extremely high insurance or bonding beyond normal (driving up cost or excluding smaller firms), etc. And the RFP either doesn’t acknowledge how onerous these are or leaves them buried. Risk allocation might be so skewed that sophisticated bidders either no-bid or significantly increase their price to compensate. For instance, the contractor might be made responsible for all design flaws (even if the design was by the owner) or for any unforeseen event (force majeure included). Negotiation might be explicitly disallowed (“take it or leave it”) combined with these harsh terms, leaving no room to discuss them. The RFP might also present some terms inconsistently – maybe an RFP body text says one thing but the attached contract says another (leading to risk of later conflict). A poor rating also if the RFP simply omits mention of terms entirely (so you don’t know what you’re signing up for until after selection – a major risk for bidders). Example Excerpt: “The attached contract makes the contractor assume all risks: for example, there is a clause that any errors in the provided specifications are the contractor’s responsibility to fix without extra cost (even though the design is owner-furnished). There is a strict “no claim for delay” provision, even for owner-caused delays or unforeseen events – meaning the contractor carries schedule and cost risk for everything, including acts of God. Liquidated damages are set at a high amount with no reciprocal early completion bonus. The payment terms include a very slow pay schedule (final 20% only upon project acceptance, many months after work). The RFP states these terms are non-negotiable. Many of these provisions are more onerous than industry norm, effectively shifting most project risk entirely to the contractor. The RFP document did not summarize these; only by reading the fine print of the draft contract does a bidder discover them. This likely results in higher bid prices or fewer bidders, as only those willing to shoulder significant risk will proceed.” (This ‘D’ case describes a contract where virtually every risk (design errors, delays, etc.) is dumped on the contractor and commercial terms (like payment timing) are unfavorable. Such one-sided contracts often lead to inflated bids or scare off experienced firms, leaving either risky low bidders or no bidders. Since the RFP doesn’t openly address them, it’s even worse because bidders might get blindsided. This is poor practice – while some strong owners try these terms, it’s widely advised that severely unbalanced risk allocation reduces project success chances. The lack of transparency and flexibility pushes it to a D.)

F (Failing): The RFP either completely fails to inform about commercial terms (so bidders are essentially bidding into a black box contract), or the terms that are indicated are so extreme that no rational contractor would willingly agree except at exorbitant cost or under duress. For instance, an RFP that does not provide any contract or terms but requires a firm fixed price – contractors have to assume the worst or gamble on unseen terms (a recipe for disaster or disputes). Or an RFP might include something outrageous like requiring the contractor to take on unlimited consequential damages, or to indemnify the owner for the owner’s own negligence, or to finance the project entirely and only be paid years after completion. If negotiation rules are also absent or forbid changes, it’s essentially “sign your life away blindly,” which is a fail. Another failing scenario: contradictory or legally unenforceable terms that show the issuer’s incompetence (e.g., clauses that conflict or violate law, making the commitment unclear). Example Excerpt: “No draft contract or general conditions are provided with this RFP. Bidders must submit a price and will later be required to sign whatever contract the agency presents, with no modifications allowed. The RFP does, however, specify that the contractor will be responsible for all conceivable risks and losses – including those arising from owner’s actions or third-party issues – and that any cost overruns of any amount will not be paid, even if due to changed conditions or scope growth. Furthermore, the RFP demands that the contractor waive all rights to claim and that any dispute will be unilaterally decided by the owner’s project manager. Essentially, the contractor has no recourse once contracted. Payment terms or schedule are not defined at all in the RFP. These conditions create an impossible-to-assess risk. This approach is tantamount to asking contractors to sign a blank check of liability.” (This ‘F’ scenario is extreme but captures the essence: bidders are given no contract to evaluate, told they can’t negotiate, and the bits that are mentioned sound incredibly unfair (no claims, all risks, unilateral decisions). No sensible contractor would be comfortable – they’d either walk away or put in a sky-high bid. The RFP fails to achieve a fair allocation or even a clear contract promise. This is a textbook case of how not to do it, as one-sided provisions often lead to fewer bidders and higher costs or disputes later. In summary, failing in this category means the RFP’s approach to commercial terms and risk is so poor that it undermines the entire procurement’s credibility or viability.)

IMPORTANT: Your grade MUST reflect your actual analysis. Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F. Do NOT default to B-range or any particular grade. A truly excellent RFP deserves an A; a poor one deserves a D or F. Use the full range.

OUTPUT FORMAT (JSON only):
{
  "variable": "commercialTerms",
  "grade": "YOUR LETTER GRADE",
  "reasoning": "2-3 sentences explaining the grade with specific references",
  "strengths": ["specific strength 1"],
  "weaknesses": ["specific weakness 1"],
  "examples": [
    {"type": "positive", "quote": "exact quote", "section": "section reference"}
  ],
  "improvement": {
    "title": "Concise improvement title",
    "description": "Specific actionable recommendation"
  }
}`,
  },

  innovationFlexibility: {
    weight: 0.05,
    name: "Innovation Flexibility & Trade-offs",
    prompt: `You are an expert Construction Procurement Consultant analyzing an RFP specifically for INNOVATION FLEXIBILITY AND TRADE-OFFS.

DEFINITION & IMPORTANCE: This variable assesses whether the RFP allows or encourages innovative solutions and provides guidance on how bidders can make trade-offs in their proposals. In construction and design, there are often multiple ways to meet the project’s goals – some RFPs are very prescriptive (telling exactly how to do it), while others are performance or outcome-based (leaving room for contractor creativity). An excellent RFP strikes a balance: it specifies what is absolutely required, but avoids over-constraining the “how” in areas where innovation could add value. It may explicitly state that alternative approaches or value-engineering ideas are welcome, as long as core outcomes are met. Trade-off guidance refers to telling bidders where they have flexibility to propose different options and what the owner values; for example, if cost-saving alternatives are acceptable, or if a higher-cost option with greater longevity would be viewed favorably. A good RFP might say, “You can propose alternate materials if they achieve the same performance,” or “We prefer an approach that maximizes quality even if initial cost is higher, within budget.” This helps bidders optimize their proposals rather than just blindly comply. Without such guidance, bidders might play it safe and not propose better ideas, or conversely, propose something off-spec that gets rejected. So, clarity on innovation and trade-offs can lead to better solutions and clarity on evaluation of different approaches.

Focus ONLY on evaluating:
- Does the RFP allow alternative approaches or value engineering?
- Can bidders propose innovative solutions?
- Are there opportunities for trade-offs (time vs cost, quality tiers)?
- Is the spec prescriptive or performance-based?
- Are equals/substitutions permitted with approval process?
- Is there room for contractor expertise to add value?

GRADING SCALE:
A (Excellent): The RFP explicitly encourages innovation and outlines where trade-offs are possible. It defines the performance outcomes or objectives clearly and then states that bidders are welcome to propose creative or alternative methods to achieve those outcomes, rather than dictating a single solution. It might use language like “Bidders may propose alternative technical solutions or methodologies if they can demonstrate equal or superior results. Innovative approaches that improve efficiency or reduce cost are encouraged.” It also gives guidance on trade-offs: for example, if budget is fixed, it might ask bidders to suggest scope adjustments or add-ons as options; or it might clarify priorities (e.g., “While cost is important, the City is willing to consider a higher initial cost for significantly reduced long-term maintenance”). Essentially, it helps bidders understand how to optimize their design/plan for best value. Additionally, an RFP at this level often avoids overly prescriptive specs that box in the solution – it might specify required outcomes (capacity, durability) but not micromanage the means, thereby preserving flexibility for vendor expertise. Example Excerpt: “Innovation and Alternatives: This RFP focuses on performance outcomes (e.g., the bridge must support X load and have a service life of 75 years). We have provided reference drawings, but bidders are encouraged to propose alternative designs or construction techniques that meet or exceed the performance criteria. For instance, if you have a value-engineering idea that reduces cost or time without compromising quality, please include it as part of your proposal. The City will consider such alternatives favorably during evaluation, provided they fulfill the intent. Trade-off Guidance: The evaluation will consider trade-offs between cost, schedule, and quality. For example, a proposal that offers a faster completion by using innovative precast elements may be rated higher in technical approach. Conversely, if a significantly lower-cost solution is proposed with a modest impact on aesthetics (but still meeting all requirements), the City may accept that trade-off. We ask bidders to identify any trade-offs they are making (e.g., higher upfront cost for lower lifecycle cost) and justify them. We have intentionally avoided mandating specific means and methods where not necessary, to allow offerors to utilize their expertise and creativity. Note: Any alternate solution should be clearly marked as an alternative and include supporting data to show it meets the required outcomes.” (This ‘A’ excerpt is very welcoming to innovation: it explicitly says alternatives are encouraged and gives context on how those will be viewed (favorably if they meet criteria). It also signals that the RFP cares about performance over method in many areas and that creative trade-offs (like speed vs cost vs quality) will be considered – essentially a best-value approach with openness to ideas. Bidders would feel empowered to propose their best ideas rather than just strictly follow a spec. This can lead to better project outcomes and potentially cost or time savings, as long as evaluation indeed rewards it.)

B (Good): The RFP allows some flexibility or hints at openness to innovation, but maybe not as overtly as an A. It might have some prescriptive elements but also include an “or equal” clause for materials or a general statement like “equivalent alternatives will be considered.” Or the RFP might focus on outputs mostly, implicitly giving room for different means, but not explicitly inviting creativity – bidders can infer they have flexibility because the RFP isn’t micromanaging, though it doesn’t celebrate innovation either. Trade-off guidance might be minimal; perhaps the RFP states the selection is best value, implying trade-offs are possible, but doesn’t detail priorities. Still, nothing in the RFP forbids proposing a better idea, and a savvy bidder might include options or alternates. The evaluation criteria might even have a nod to “innovation” as a factor (e.g., 5% weight for unique value-added ideas). All requirements are necessary ones, with few “over-specifications.” Overall, a ‘B’ RFP isn’t hostile to innovation – it’s moderately flexible but not highly communicative about it. Example Excerpt: “The design provided is conceptual. Bidders may refine the design as needed to meet the performance requirements. Materials or products specified by brand name should be considered as indicating the desired standard; substitutions of equal or better quality are permitted with approval. The City is interested in cost-effective solutions – if you identify a change that could save cost or time, you may outline it as an option. However, the base proposal should be compliant with the stated requirements. The evaluation will primarily consider compliance and value, so innovative ideas that offer added value could positively impact your technical score.” (This ‘B’ excerpt shows some flexibility: “equal or better” substitutions are allowed (common and important for fairness) and mentions cost-effective solutions and that you can outline them as an option. It’s a bit cautious (wants base proposal compliant, with alternates as optional) – which is fine. It doesn’t have as strong an encouraging tone as an A, but it does leave the door open. Bidders know they can propose alternates, though they might do so carefully. The mention that innovation could improve technical score is there but not very detailed. So, it’s generally good – not stifling innovation, but not a full-throated encouragement either.)

C (Average): The RFP is mostly prescriptive or standard, giving limited mention of flexibility. It likely sets out a solution in detail and expects bidders to adhere to it. It might not forbid alternatives, but it doesn’t suggest them either. If a bidder had a different approach, they might be unsure if it would be welcome or cause their proposal to be deemed non-compliant. Perhaps the RFP has an “or equal” clause in some sections, but other sections are very specific. Or it might allow alternates only in very trivial areas. Trade-off guidance is probably not there – bidders are left guessing what the owner would value more if trade-offs are possible (e.g., is a shorter timeline worth a higher price? The RFP may not say). So, average here means the RFP sticks to requirements without discussing flexibility; bidders will likely just meet the spec rather than propose something novel, unless they take a risk. Example Excerpt: “The scope and specifications outline the required solution in detail. All proposals should follow these specifications closely. If a bidder believes an alternative approach could be beneficial, they may present it, but must also provide a proposal that meets the RFP as written. The City has set performance requirements, and all proposals must demonstrate compliance. (No additional guidance on balancing cost vs quality is given; we expect bidders to deliver the best of both.)” (This ‘C’ excerpt is lukewarm. It basically says “follow the specs.” It grudgingly allows that a bidder “may” present an alternative but only alongside a fully compliant offer – this is a common approach in some procurements (alternates allowed only if a base compliant bid is given). It doesn’t actively encourage it, nor does it indicate how such an alternate would be viewed (which might discourage bothering with it). There’s no clear trade-off info – they want the best of everything, which is nice but not realistic guidance. Bidders reading this will likely stick to exactly what’s asked for because the effort to propose an alternate might not be worth it if it’s not clearly desired. That’s average: it’s not explicitly anti-innovation, but it’s not facilitating it either.)

D (Poor): The RFP is highly rigid and leaves no room for innovation, possibly even disallowing any deviations. It might specify not just what to achieve but exactly how to do every step, possibly using outdated or overly specific methods, thereby preventing bidders from using newer techniques or efficiencies. It could say “no substitutions” for certain products without good reason (essentially locking into a specific vendor’s product and stifling competitive alternatives). There is no indication that the owner would consider alternate proposals – in fact, the language may warn that any deviation will render the proposal non-compliant. This rigidity can hurt the owner if an alternate could bring better value, but it often happens when specs are written in a very closed manner. Trade-offs are not addressed at all; the procurement likely treats all requirements as pass/fail with no flexibility – e.g., they might be doing a lowest price technically acceptable approach where anything not exactly conforming is rejected. As a result, bidders will not propose anything creative and may even over-comply (doing exactly as told even if it’s not optimal). Example Excerpt: “Bidders must strictly adhere to the specifications and scope as written. No alternative proposals or exceptions will be accepted. The Agency requires the use of the specified construction techniques and materials – for example, concrete mix design X and formwork method Y as described – and will not consider variations. All proposals will be evaluated for compliance only. The focus is on meeting the RFP requirements at the lowest cost, not entertaining different approaches. Do not deviate from the plan.” (This ‘D’ example clearly prohibits innovation: “no alternative proposals or exceptions.” It even prescribes specific methods and says will not consider variations, which slams the door on any contractor insight or improvement. The evaluation is compliance-only, implying any creativity is actually a risk to compliance. This is poor because it likely misses out on potential improvements contractors could offer, and it treats the RFP specs like gospel even if they might have inefficiencies. Vendors see this and will do exactly what is asked, nothing more – possibly even if they know a better way, they’ll follow the spec to avoid being disqualified. The project might be fine, but it won’t get the benefit of industry expertise beyond the spec. It also indicates a likely trade-off stance: lowest cost for exactly that defined solution, period. That’s not modern best practice except for commoditized work – even then, some flexibility could help.)

F (Failing): The RFP is not only rigid but maybe impossibly prescriptive or contradictory in a way that prevents sensible trade-offs. It could require things that conflict, leaving no solution space, or demand an approach that is known to be suboptimal without allowing change. Or it could punish any deviation so severely that even asking a clarification about an alternate might get a bid thrown out. Another fail scenario: the RFP’s priorities are completely unclear or misguided, so bidders cannot even discern how to craft a good solution – for example, it might emphasize every aspect as most important, with no flexibility to prioritize, making trade-offs impossible (the infamous “fast, cheap, and high quality – must have all three” with fixed constraints). Or the RFP might inadvertently discourage innovation by penalizing any differences (like an evaluation scheme that gives zero points for any feature not exactly as specified, even if better). Example Excerpt: “The RFP details a step-by-step construction process that all bidders must follow exactly, with no room for adjustment, even if site conditions differ. For instance, it mandates Method A for soil stabilization, which may not even be feasible in all soil types, but alternative methods are explicitly disallowed. It also requires materials that are no longer manufactured, yet substitutions are forbidden – leaving bidders in a quandary. The document makes every minor requirement critical, providing no indication of which aspects could be adjusted for a better overall outcome. Combined, these conditions make it impossible to propose a coherent solution without either breaking a rule or failing a requirement. Any attempt at proposing a different approach is grounds for rejection, and yet following the dictated approach might be unworkable. Bidders are essentially handcuffed to a potentially flawed plan with no discretion.” (This ‘F’ scenario describes an RFP that is so prescriptive and inflexible that it may not even be executable (“materials no longer manufactured”) and doesn’t allow logical changes. It’s failing because it doesn’t just stifle innovation – it sabotages practicality. Bidders either have to violate the spec (and get rejected) or bid something they know won’t work just to stay compliant, hoping to sort it out after award (which is dangerous and could lead to change orders or failure). This is an extreme case, but a real example might be, say, an RFP that didn’t update its specs in years and now requires outdated tech with a clause “no alternates,” leading to an untenable situation. Another failing aspect in the excerpt: it doesn’t highlight priorities, meaning bidders can’t even focus on what’s important, as everything is set in stone. In essence, the RFP has zero flexibility and even negative flexibility (contradictions), so it fails at guiding trade-offs or allowing any innovation. No responsible vendor would want to bid under those terms without significant contingencies or clarifications.)

IMPORTANT: Your grade MUST reflect your actual analysis. Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F. Do NOT default to B-range or any particular grade. A truly excellent RFP deserves an A; a poor one deserves a D or F. Use the full range.

OUTPUT FORMAT (JSON only):
{
  "variable": "innovationFlexibility",
  "grade": "YOUR LETTER GRADE",
  "reasoning": "2-3 sentences explaining the grade with specific references",
  "strengths": ["specific strength 1"],
  "weaknesses": ["specific weakness 1"],
  "examples": [
    {"type": "positive", "quote": "exact quote", "section": "section reference"}
  ],
  "improvement": {
    "title": "Concise improvement title",
    "description": "Specific actionable recommendation"
  }
}`,
  },

  complianceRequirements: {
    weight: 0.05,
    name: "Compliance Requirements",
    prompt: `You are an expert Construction Procurement Consultant analyzing an RFP specifically for COMPLIANCE REQUIREMENTS.

DEFINITION & IMPORTANCE: This variable looks at how well the RFP identifies and specifies compliance requirements that are particular to construction projects. These include things like safety regulations (e.g., OSHA standards), licensing (contractor must have certain contractor’s license or certifications), bonding (bid bond, performance bond requirements), insurance (types and limits of insurance required), labor compliance (prevailing wage laws, Davis-Bacon Act if federal, union requirements, etc.), environmental or permitting compliance (stormwater pollution prevention plan, environmental mitigations), site constraints (work hours, noise ordinances), and any other construction-specific rules (e.g., compliance with building codes, accessibility standards, equal opportunity employment provisions on jobsite, etc.). A high-quality RFP will clearly list these so bidders are aware of all obligations and can price and plan accordingly. If these are missing or unclear, the winning contractor might later face unexpected requirements (like needing a certain safety program or paying workers a certain wage) that were not bid, leading to disputes or change orders. Also, these compliance items can be critical filters – e.g., if a contractor doesn’t have the required license or bonding capacity, they shouldn’t bid. So, explicit inclusion matters for both fairness and legal adherence. Construction is heavily regulated; a good RFP addresses those regulations upfront.

Focus ONLY on evaluating:
- Are regulatory requirements clearly identified?
- Are permit responsibilities assigned (owner vs contractor)?
- Are environmental requirements specified?
- Are safety program requirements defined?
- Are licensing and certification requirements clear?
- Are prevailing wage or other labor requirements addressed?

GRADING SCALE:
A (Excellent): The RFP provides a comprehensive and clear list of all construction-related compliance requirements. It spells out mandatory contractor qualifications (e.g., “bidder must hold a State General Contractor license Class A”), required bonds (bid bond with bid, performance and payment bonds of 100% each upon award), and insurance minimums. It details any safety requirements: for example, “Contractor must comply with OSHA 1926; a site-specific safety plan must be submitted and approved before start.” If applicable, it notes prevailing wage or labor laws (“This project is subject to federal prevailing wages – see wage determination attached – and certified payrolls will be required weekly”). It mentions any specific permits or codes (“Work must comply with 2018 International Building Code and local amendments; contractor will be responsible for securing a building permit and inspections”). It might require proof of certain compliance capacities (like an Experience Modification Rate (EMR) for safety if they care, or that the contractor must follow a quality management program). All these requirements are typically placed in a section so bidders can easily find them, and possibly there are forms or certifications provided to fill (e.g., a Non-Collusion Affidavit, or a certification of compliance with employment law). In short, nothing in terms of legal or regulatory compliance is left out or ambiguous; bidders know exactly the playing field and requirements to adhere to. Example Excerpt: “Contractor Licensing & Qualifications: Bidders must possess a valid [State] Contractor’s License, Class B at the time of bid and throughout the project. Key supervisory personnel shall have OSHA 30-hour training. Safety Compliance: The Contractor must comply with all OSHA standards (29 CFR 1926). A site-specific Health and Safety Plan (HASP) is required within 10 days of award for approval. All workers must have at minimum OSHA 10-hour certification. Bonding & Insurance: A bid bond of 5% is required with the proposal. The awarded contractor must provide a Performance Bond and Payment Bond, each for 100% of contract value. Insurance requirements: $2M general liability per occurrence (City to be an additional insured), $1M auto, and statutory workers’ comp. Labor Regulations: This project is subject to the Davis-Bacon Act – prevailing wage rates are attached (Attachment D). Weekly certified payroll reports must be submitted. The contractor must also comply with the City’s local hiring ordinance (see Attachment E). Environmental and Code Compliance: Contractor is responsible for obtaining a building permit and any trade permits; all work must conform to the 2018 IBC and local code amendments. An Erosion & Sediment Control Plan must be followed per state environmental regulations. Other Requirements: The contractor will need to furnish evidence of an Experience Modification Rate (EMR) of 1.2 or less for safety, or provide a safety action plan. All required compliance forms (non-collusion affidavit, EEO certification, etc.) are included in Appendix B and must be completed with the proposal.” (This ‘A’ excerpt is lengthy, but that’s appropriate given the many compliance aspects. It clearly lists licensing, safety, bonding, insurance, labor law, permits/codes, and even specific forms. Bidders reading this know exactly what legal hoops and standards they must meet. It’s comprehensive – no surprises later like “Oh, we needed a particular bond or to pay certain wages we didn’t account for.” This level of detail suggests the issuer is experienced and diligent, which attracts serious contractors and keeps the playing field level. It covers items typically found in public works projects in a clear way.)

B (Good): The RFP covers most major compliance requirements, but perhaps it misses one or two minor ones or isn’t as detailed in explanation. For example, it might list the need for license and bonds and refer to prevailing wages, but not attach the wage schedule (assuming bidders will find it themselves, which is okay but not as convenient). Or it states OSHA compliance generally but doesn’t specifically call for a safety plan submittal (perhaps it’s implied but not explicit). It might mention insurance but not the exact amounts (maybe referencing a standard insurance requirement in an appendix that bidders are assumed to know). Nonetheless, all key topics are at least mentioned: e.g., it says “must comply with all applicable laws and codes, including building codes, safety regulations, labor laws” – which covers it broadly if not specifically. A diligent bidder can infer what to do, but a newcomer might have to clarify some details. Still, nothing critical is totally omitted – it’s just not as spoon-fed or perfectly organized as an A. Example Excerpt: “Bidders shall have a valid construction contractor license and be bondable. A bid guaranty (bid bond) of 5% is required. The successful bidder must furnish performance and payment bonds. Contractors must carry adequate insurance (per City requirements) and comply with all safety and labor regulations. This project falls under prevailing wage laws; current wage rates will apply (state prevailing wage for building construction). Contractor is responsible for obtaining necessary permits and following applicable building codes. The City’s standard contract in Appendix C further enumerates these compliance requirements.” (This ‘B’ example covers the bases but not in extreme detail. It assumes a bit that bidders know “per City requirements” for insurance (likely listed in standard contract). It references prevailing wage but doesn’t provide them explicitly in the text (assuming bidders know or will find state rates). It does say comply with safety and labor regulations generally – it doesn’t specify OSHA or details like requiring a safety plan, but one would assume it. It points to the standard contract for more, which is fine, but an A might have pulled more of those highlights into the RFP body. Overall, a competent bidder sees nothing alarming missing, but they might have to dig in the appendix or know standard practice to get details. It’s still good as it addresses the main topics with a reasonable breadth.)

C (Average): The RFP mentions some compliance requirements but misses several or is too generic. It might only briefly mention that the contractor must obey laws and obtain permits, without calling out specifics like prevailing wage or specific bonds. Possibly it’s written for a private project where some of these (like prevailing wage) don’t apply, but it still should mention safety and insurance, etc. If it’s silent on needed bonds or insurance, that’s a gap but maybe those are industry standard enough that bidders expect them (still, not listing them can cause uneven assumptions). It might not state a license requirement – maybe taken for granted or in a separate advertisement but not in the RFP text. It could assume the contractor knows to follow OSHA and building codes, and thus not explicitly say it – which most will, but not stating can be risky if a bidder tries to cut corners. Essentially, average means some important compliance items are not explicitly addressed, though likely required by default. Bidders might need to ask or assume the strictest case to be safe. Example Excerpt: “Contractor shall comply with all applicable laws and regulations. It is expected that the contractor maintains proper licensing and insurance. The contractor will be responsible for jobsite safety and adherence to applicable OSHA standards. All necessary permits for construction must be obtained by the contractor or through coordination with the owner. The contractor must adhere to all state and local labor laws.” (This ‘C’ excerpt is very generic. It says the right things in principle – obey laws, have licensing, follow OSHA, get permits – but it doesn’t mention bonds at all (maybe they forgot or are assuming a low value job where bonds might not be needed; if bonds are needed, that’s a miss). It doesn’t specify insurance coverage amounts – just says maintain insurance (bidders might wonder how much). It doesn’t mention prevailing wage or specific labor compliance if relevant (just all labor laws, which is broad). It’s not that the contractor can ignore something – “all applicable laws” technically covers everything including wages and safety – but the RFP isn’t helping the bidder by highlighting key compliance tasks or costs. A bidder may need to verify if prevailing wage applies or if a bond is needed by looking at external rules or asking. So it’s average – covering itself legally but not being explicit or thorough. Some contractors might overlook a requirement not stated and get in trouble later, which is why explicitness is better.)

D (Poor): The RFP fails to mention several critical compliance requirements, potentially leading to serious oversights. For example, it might not mention the need for a performance bond or insurance at all, leaving bidders not including those costs or not even having the capability lined up. Or it could omit the fact that it’s a public project requiring prevailing wages – a bidder might assume standard wages and bid lower, only to find out later they must pay higher wages (which could cause financial issues or legal issues). It might also fail to address safety expectations – not that the contractor won’t be legally obligated anyway, but not stating it could mean the owner hasn’t set any additional safety requirements (like submittal of plans or training) and isn’t emphasizing safety culture. If licensing isn’t mentioned, perhaps an unlicensed or improperly licensed firm might bid (in some jurisdictions bids by unlicensed contractors are void, but if not clearly stated, it could slip through). A poor RFP might assume contractors know all these by default, but that assumption can be dangerous especially if out-of-state bidders or newcomers are involved. Example Excerpt: “The project will be executed under the terms of the contract. (No specific mention of bonds, insurance, licensing, safety, or labor standards is provided in the RFP document.)” Or, another form: “General conditions will apply.” with no details. (This ‘D’ scenario illustrates an RFP that basically punts on all these details, maybe thinking the standard contract covers it – but if bidders don’t see the standard contract until after bidding, they might not realize the requirements. For instance, if a small contractor bids not realizing a $5M insurance policy is required, they might not even be able to get that. Or if no mention of prevailing wage, a bidder might budget $20/hr for labor when actually they needed $40/hr rates – a huge miss. The RFP’s silence is risky. Also, not highlighting safety or permit responsibilities could lead to confusion on roles. Perhaps the RFP is extremely short or a private owner who didn’t know to include these. In any event, it’s poor because key compliance issues aren’t proactively addressed. Bidders might need to guess or will ask a lot of clarification questions. It can lead to uneven bids or post-award conflicts when the winner says “I didn’t include X because it wasn’t in the RFP.”)

F (Failing): The RFP not only omits compliance requirements but possibly conveys incorrect or illegal instructions, or exhibits ignorance of standard legal requirements. For example, an RFP that tells bidders they don’t need to follow a certain law when in fact they do (like “we don’t require workers’ comp insurance” – which might be illegal to waive). Or one that sets contradictory compliance obligations (like imposing two different sets of wage rates without clarity). Or perhaps it’s a public project but the RFP fails to include statutorily mandated provisions (EEO, etc.), which could invalidate the procurement. If an RFP is missing all such provisions, it could be considered non-compliant with procurement rules itself. Another failing case: if an RFP required something not permissible (like asking bidders to pay a kickback or something unethical – hopefully rare). Essentially, failing is when compliance is so mishandled that it may lead to legal challenges or project stoppage. Example Excerpt: “(No mention of prevailing wage on a project clearly subject to it, no mention of bonds or safety, etc., anywhere in the documents.) After award, the owner adds these requirements.” Or an explicit wrong thing: “Contractor is not required to carry workers’ compensation insurance for this project” (when law says they must). (Failing case is often an omission – similar to poor – but to an extreme degree, such as a federally-funded project with none of the required federal clauses in the RFP. This could result in protests or losing funding. Another scenario: the RFP might be so negligent that, say, it awards to an unlicensed contractor due to not screening that, leading to legal voiding of the contract. While it might not appear in the RFP text, failing to state such prerequisites could cause that outcome. For the bidder, a failing RFP sets them up for potential legal issues – if they follow the RFP and the RFP was non-compliant with the law, it’s a mess. Thus, failing grade is warranted when the RFP’s handling of compliance is fundamentally flawed or missing to the point of jeopardizing the project or fairness.)

IMPORTANT: Your grade MUST reflect your actual analysis. Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F. Do NOT default to B-range or any particular grade. A truly excellent RFP deserves an A; a poor one deserves a D or F. Use the full range.

OUTPUT FORMAT (JSON only):
{
  "variable": "complianceRequirements",
  "grade": "YOUR LETTER GRADE",
  "reasoning": "2-3 sentences explaining the grade with specific references",
  "strengths": ["specific strength 1"],
  "weaknesses": ["specific weakness 1"],
  "examples": [
    {"type": "positive", "quote": "exact quote", "section": "section reference"}
  ],
  "improvement": {
    "title": "Concise improvement title",
    "description": "Specific actionable recommendation"
  }
}`,
  },

  submissionInstructions: {
    weight: 0.05,
    name: "Submission Instructions & Format",
    prompt: `You are an expert Construction Procurement Consultant analyzing an RFP specifically for SUBMISSION INSTRUCTIONS AND FORMAT.

DEFINITION & IMPORTANCE: This variable examines how clearly the RFP explains the proposal submission process – including format requirements, content organization, and instructions on how/where to submit. High-quality RFPs give bidders a clear roadmap for preparing their proposals, which ensures consistency and fairness in evaluation. This includes specifying the proposal due date and time, the submission method (e.g. online portal, physical delivery address), the required proposal sections or format (for example, “divide your proposal into Technical, Management, and Price volumes, with a max page limit for each”), and any templates or forms to use. Clarity here matters because confusion or overly convoluted instructions can lead to disqualified proposals or discourage participation. Good RFP instructions find a balance: they are precise and complete, but not so onerous or nitpicky that they signal bureaucracy over substance. Poor instructions (unclear or contradictory) might result in bidders missing something critical (and getting disqualified) or simply struggling to comply.

Focus ONLY on evaluating:
- Are submission requirements explicit (copies, format, delivery method)?
- Is the deadline clearly stated with timezone?
- Are required forms and attachments listed?
- Is the proposal structure/outline specified?
- Are page limits or section requirements clear?
- Is the submission address/portal clear?

GRADING SCALE:
A (Excellent): The RFP provides very clear, concise, and well-organized submission instructions. It specifies exactly what the proposal should contain and how it should be structured. For example, it might include an outline: “Section 1: Executive Summary; Section 2: Technical Approach; Section 3: Project Team; Section 4: Past Experience; Section 5: Price Proposal (separate).” It states the format (e.g., PDF or hard copy requirements), page limits or formatting rules if any (font size, page count), and how to label sections. It also gives the submission procedure: e.g., “Upload to procurement portal X by 5:00 PM on July 1, 2026” or “Submit one electronic PDF and two hard copies to the address…”. There is no ambiguity about deadlines, addresses, or required documents (forms, cover letters, etc., are all enumerated). Essentially, a bidder reading it knows exactly how to prepare and deliver their proposal. Example Excerpt: “Proposal Format: Offerors shall organize their proposals into the following sections: 1) Cover Letter (1 page); 2) Technical Proposal (max 30 pages) covering methodology, schedule, and staffing; 3) Experience and Qualifications (max 20 pages, including resumes and project examples); 4) Price Proposal (use the Price Form in Appendix D, submitted separately). Submission: Proposals are due August 15, 2026 at 2:00 PM EST. Submit via the City’s eProcurement portal (link provided). File Format: PDF, with filenames including the bidder name. No email or fax submissions will be accepted. Additional Requirements: Include a signed copy of the Attachment A (Non-Collusion Affidavit) and Attachment B (Bid Bond Certification) with your proposal.” (This ‘A’ instructions excerpt is thorough and specific. A bidder following this knows precisely how to format their response and won’t be tripped up by missing forms or wrong format. It’s also concise and not overburdened with trivial requirements – just the essentials clearly stated.)

B (Good): The RFP’s submission instructions are generally clear, but may have minor issues. Perhaps everything important is there (what to include and how to submit), but one or two details could be clearer – for instance, it might not specify a preferred format for certain sections, or it may require an outdated practice like multiple hard copies unnecessarily. Overall, though, a diligent bidder can figure out what’s needed without having to ask questions. The instructions might be somewhat lengthy or bureaucratic but are still understandable. Example Excerpt: “Proposal Submission: Email your proposal to procurement@agency.org by 5:00 PM September 10. The proposal should be in PDF format. Include sections for your approach, team, past performance, and a separate pricing section. Hard copy is not required, but if provided, submit 1 original and 2 copies. All proposals must reference RFP #123 in the subject line. Page limit: 50 pages not including appendices.” (This ‘B’ example is mostly clear: it tells where and when to submit, and generally what to include. It’s a bit mixed between email and optional hard copies, which could be simplified, but it’s not confusing to the point of causing errors. It might not provide a strict section outline, but the expectation of sections is hinted. It’s good, if not perfect.)

C (Average): The RFP’s instructions exist but lack clarity or completeness in places. Bidders might be left unsure about some formatting details or whether certain documents are required. Perhaps the RFP says “submit a complete proposal” without outlining the sections, or it gives contradictory instructions (e.g., one part says submit via email, another part says via portal). Maybe the due date or time zone isn’t clearly stated (leading to potential confusion). In general, the basics can be deduced, but there’s room for misinterpretation. Example Excerpt: “Proposals are due Friday, 5 PM. Submit your proposal in a sealed package to our office. The proposal should contain all necessary information for evaluation. You may also email a copy. Include any relevant experience and pricing info.” (This ‘C’ instruction is problematic: it says “Friday, 5 PM” but not the date or time zone, and mentions both sealed package and email without clarity – do both need to be done? It doesn’t outline the content structure, just says “all necessary information,” which is pretty open-ended. Bidders could interpret differently what to include. There is a risk of inconsistency in responses or disqualification for not including something the issuer expected but didn’t explicitly ask for.)

D (Poor): The submission instructions are confusing, contradictory, or incomplete to a serious degree. Bidders likely will be uncertain how to comply. For example, the RFP might fail to specify where or how to submit (no email or address given), or might include conflicting directions (e.g., “Submit 3 copies” in one section and “Submit 5 copies” in another). It could also impose overly complicated format rules that are hard to follow and seemingly unnecessary, which can deter bidders. Example Excerpt: “Proposal Instructions: Submit your proposal soon. Be sure to include everything. Format isn’t specified, but compliance with all requirements is mandatory. One section of the RFP states you need to mail hard copies, another section says electronic submission through a portal – use your best judgment. Failure to follow the exact (though unspecified) format may result in disqualification.” (This ‘D’ example illustrates a muddled instruction set. Bidders would be scratching their heads: When is it due? Where exactly to send it? What does “everything” include? The mention of disqualification without clear format guidance is especially problematic. It shows the RFP issuer demands compliance without providing the roadmap – a major quality issue.) Alternatively, a real-world style example of burdensome instructions that lean D: “Strict conformance to the specified proposal format is essential. Proposals shall be submitted in three-ring binders with each section tabbed as per the outline. Provide one original with wet signatures, three copies, and a digital version on CD. Use 12-pt Times New Roman font, single-spaced, with 1” margins. Any deviation may result in rejection.” This, drawn from actual RFPs, is extremely prescriptive. While clear, such micromanagement can signal bureaucracy over substance and discourage bidders (especially requiring physical copies in the digital age), thus we’d rate it poor in quality of approach.

F (Failing): The RFP provides no clear submission instructions, or instructions that are so erroneous that bidders are likely to miss the mark. For instance, an ‘F’ case is an RFP that does not state a due date/time or method at all – leaving bidders guessing how to deliver their proposal. Another failing scenario is if the instructions are wrong (e.g., list an incorrect email or a past date). Or perhaps the RFP mixes up instructions from another procurement (copy-paste error) that don’t apply, causing maximum confusion. Example Excerpt: “Proposals should be sent to us by the deadline. Good luck.” Or an even worse real example: an RFP that only says, “Please submit a proposal.” with no further info. Another failing scenario: “Submit your proposal online.” (with no link or portal specified, no deadline given). (In these cases, the issuer has essentially not given the bidders a clear way to comply. It’s as if the RFP forgot to include the instructions section. Such an omission or mistake is a critical failure – proposals might not even reach the right place or time, or could be deemed late or non-compliant through no fault of the bidders. A competent procurement process cannot function with instructions at this level.)

IMPORTANT: Your grade MUST reflect your actual analysis. Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F. Do NOT default to B-range or any particular grade. A truly excellent RFP deserves an A; a poor one deserves a D or F. Use the full range.

OUTPUT FORMAT (JSON only):
{
  "variable": "submissionInstructions",
  "grade": "YOUR LETTER GRADE",
  "reasoning": "2-3 sentences explaining the grade with specific references",
  "strengths": ["specific strength 1"],
  "weaknesses": ["specific weakness 1"],
  "examples": [
    {"type": "positive", "quote": "exact quote", "section": "section reference"}
  ],
  "improvement": {
    "title": "Concise improvement title",
    "description": "Specific actionable recommendation"
  }
}`,
  },

  communicationProcess: {
    weight: 0.05,
    name: "Communication Process (Q&A)",
    prompt: `You are an expert Construction Procurement Consultant analyzing an RFP specifically for COMMUNICATION PROCESS AND Q&A.

DEFINITION & IMPORTANCE: This variable looks at how the RFP outlines the process for communications during the solicitation – specifically how vendors can ask questions (Q&A), how the issuer will disseminate clarifications or changes (addenda), and any rules around these interactions. A good RFP sets a clear, formal channel for questions and answers so that all bidders have equal access to information (ensuring fairness and transparency). It will provide a schedule or deadline for questions and commit to issuing written answers to all participants by a certain date. It will also describe how any changes to the RFP will be communicated (via official addenda) and that such addenda are binding. Moreover, it may designate a single point-of-contact and instruct bidders not to contact other personnel (to prevent unfair advantages or confusion). If the RFP doesn’t clarify this, bidders might be unsure how to get info, or worse, attempt unofficial contacts that could compromise fairness. A well-managed Q&A process can significantly improve proposal quality by clearing up ambiguities, and an addendum process ensures that all changes or clarifications are documented and shared. Therefore, clarity and accessibility of the communication process is crucial for keeping the competition fair and the proposals on-point.

Focus ONLY on evaluating:
- Is there a defined Q&A process with deadlines?
- Is a pre-bid meeting/site visit scheduled?
- Is a single point of contact identified?
- Will Q&A responses be shared with all bidders?
- Is the communication timeline clear?
- Are there prohibited communications (cone of silence)?

GRADING SCALE:
A (Excellent): The RFP provides a very clear and structured communication plan. It explicitly states the deadline for submitting questions (e.g., “Questions must be submitted via email to the Procurement Officer by July 10, 2025, 5:00 PM.”) and the format (perhaps a specific subject line or form). It names the single point-of-contact (with email/phone) for all inquiries and instructs that no other communication is allowed (preventing off-record Q&A). It commits to a date by which written responses to all questions will be issued to all registered bidders, often in the form of an addendum or Q&A document, ensuring everyone gets the same information. The RFP also encourages questions (like stating that bidders should seek clarification on any uncertainties). Additionally, it outlines the addenda procedure: for example, “Any changes to the RFP will be issued via formal addendum on the project website. Bidders must acknowledge all addenda in their proposal.” It may even detail a pre-proposal conference or site visit if applicable and how clarifications from that will be handled (usually via written summary afterward). This level of clarity shows the issuer is organized and committed to transparency. Example Excerpt: “Communications Protocol: All questions or requests for clarification regarding this RFP shall be submitted in writing via email to Jane Doe, Procurement Officer (jdoe@city.org) no later than March 1, 2026 at 4:00 PM. Questions will be answered via a written Q&A Addendum. The City will compile all questions received and issue a single Addendum (Addendum #1) by March 8, 2026, to all known RFP holders via the City’s e-bidding portal. Only answers provided in writing via such addendum are official and binding. Bidders are not to contact any other City staff or stakeholders regarding this RFP, to ensure fairness. In addition, if any changes to the RFP requirements or timeline are needed, the City will issue subsequent addenda. Bidders should check the portal for any updates and must acknowledge each addendum in their proposal cover letter. Pre-Proposal Meeting: A non-mandatory site visit will occur Feb 20, 2026; any clarifications arising will be posted in the Q&A addendum as well. We encourage bidders to ask questions – if any requirement is unclear, please use the Q&A process so we can clarify for all parties.” (This ‘A’ excerpt comprehensively lays out how communication happens. It has deadlines, contact person, method (email), commitment to written answers for everyone, rules against unauthorized contact, and the mechanism of addenda. A bidder reading this knows exactly how to get info and trust they won’t miss anything. It’s an exemplary approach that fosters fairness and minimizes confusion.)

B (Good): The RFP does define a Q&A and addenda process, but perhaps with slightly less detail or a minor gap. For instance, it might list a contact and deadline for questions, but not explicitly say how answers will be provided – though one can assume an addendum will be issued, it might not say “we will issue an addendum by X date”. Or vice versa, it might promise an addendum but didn’t clearly set a cutoff for questions (leading to potential late questions). It might also omit the instruction about not contacting others, which is a small lapse in ensuring all communication is through one channel. Nonetheless, the essentials are there: bidders know who to ask and roughly when, and that answers will be shared. Addenda are mentioned as the vehicle for changes. Any omissions are likely ones an experienced bidder could infer or wouldn’t significantly harm the process. Example Excerpt: “Direct all inquiries to Procurement@agency.gov. Questions should be submitted ASAP, preferably by April 5, 2025. The Agency will issue clarifications to all participants – check the project website for updates (addenda). It is the bidder’s responsibility to obtain all addenda. Do not rely on oral statements; only written responses are official. Changes to the RFP, if any, will be posted as addenda.” (This ‘B’ example conveys the general idea: email questions by a date, answers via website postings. It’s mostly good, though it uses language like “preferably by April 5” rather than a hard deadline – slightly loose, but still gives a target. It also places onus on bidders to check the site rather than explicitly emailing them, which is okay but a bit less hand-holding. Importantly, it mentions written vs oral and addenda usage. It could improve by confirming the exact addendum issue date or instructing no contact with others, but overall it’s a clear process. Most bidders would find this acceptable and understand how to proceed.)

C (Average): The RFP includes some information about Q&A or addenda, but it’s incomplete or a bit unclear. Possibly it says “questions may be submitted” but does not give a deadline, leaving bidders unsure of the cut-off (they might assume or have to ask when the last day is). Or it provides a contact person but maybe no explicit instruction that that’s the only contact (leaving ambiguity whether you could call someone else). It might not explicitly promise to share answers with all – maybe it implies it but doesn’t state the method (some bidders might worry if they don’t hear an answer directly). The addendum process might be vaguely referenced like “if any changes, we will issue addenda” but without guidance on how those will be communicated (email, website?). Essentially, an average scenario covers the basics in passing but lacks detail. Bidders might have to assume standard practices or ask a meta-question about the Q&A process itself. Example Excerpt: “Any questions regarding this RFP should be directed to the Project Manager. Answers to questions that impact the proposal may be shared with other bidders. The City reserves the right to issue addenda to modify this RFP if needed.” (This ‘C’ blurb is short and not very specific. It doesn’t give a deadline or format for questions, just says contact the Project Manager – which at least is a single point, but by name/email would be better. It says answers “may be shared” which is weak – it should be will be shared, and how? It mentions addenda if needed but no instruction on how they’ll be delivered or acknowledged. Bidders reading this might be unsure: “Until when can I ask? Will I get answers individually or only via some posting? Who exactly is the Project Manager contact info?” They might have to dig for the contact details elsewhere in the RFP. This is average – workable if you assume typical procedures, but not explicitly laid out.)

D (Poor): The RFP’s guidance on communications is minimal, confusing, or flawed. Perhaps it fails to mention any Q&A process at all – bidders don’t know if they are allowed to ask questions or how. Or it mentions something but in a confusing way, e.g., multiple contacts or channels (leading to risk some bidders get info others don’t). It might allow questions but very late or not plan to answer them properly. A poor case could also be if the RFP encourages contacting various people or does not warn against it – possibly resulting in unequal information distribution or even violation of procurement rules. Addenda might not be mentioned, or the RFP might rely on bidders to figure out changes on their own. In any event, a ‘D’ means likely some bidders will be left in the dark or get different answers (lack of a controlled process). Example Excerpt: “Questions can be phoned in to our office or emailed. We’ll try to answer what we can. If any big changes come up, we might update the RFP document on the website without notice. It’s up to bidders to stay informed. Also, technical questions can be directed to the engineering consultant, while contractual questions go to purchasing.” (This ‘D’ scenario is quite disorganized: multiple channels (phone, email, different contacts for tech vs contract) – which increases the chance of inconsistent answers or some bidders getting info others don’t. There’s no deadline given – implying you could call up until the due date? That’s problematic. “Might update without notice” is really bad – bidders could miss changes. It basically puts burden on bidders to keep checking if something changed, with no formal addendum distribution. Also splitting questions by topic to different people can cause confusion or overlaps. This would be a poorly managed communication plan, likely resulting in unfairness or frustration.)

F (Failing): The RFP provides no formal communication mechanism, or actively discourages needed clarification, resulting in a chaotic or opaque situation. For example, an RFP that is silent on Q&A means bidders have no official way to resolve doubts – they either guess or possibly try back-channel contacts, which can lead to misinformation or unfair advantages. Or an RFP could explicitly forbid asking questions (“No questions will be answered”), which is a terrible practice because it means any ambiguity stays that way, and bidders might interpret requirements differently (leading to apples-to-oranges proposals or lots of errors). Another failing case is if changes are made last-minute without proper notification, or answers are given only to some and not all, undermining fairness. Essentially, failing means the communication process breaks the fundamental procurement principle of equal information. Example Excerpt: “The City will not entertain any questions or requests for clarification about this RFP. Bidders must rely solely on the information contained herein. Any updates, if made, will not necessarily be communicated to all bidders. It is expected that bidders understand the requirements without further explanation.” (This extreme ‘F’ example explicitly shuts down communication. If the RFP document is less than perfectly clear (almost always the case), this stance means misunderstandings can’t be clarified. It’s likely to result in either no bids or highly cautious bids with many assumptions. Also saying updates “will not necessarily be communicated to all” is essentially admitting an unfair practice – maybe they’d tell whoever asks but not proactively others, which is a big no-no. Such an RFP might be non-compliant with procurement regulations or at least highly risky for the owner. In summary, an RFP that either forbids Q&A or doesn’t have a mechanism for it is failing this criterion – it signals a non-transparent or incompetent process. Bidders could either all interpret things differently or waste effort on flawed proposals, and the owner might end up with a failed competition or legal challenges.)

IMPORTANT: Your grade MUST reflect your actual analysis. Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F. Do NOT default to B-range or any particular grade. A truly excellent RFP deserves an A; a poor one deserves a D or F. Use the full range.

OUTPUT FORMAT (JSON only):
{
  "variable": "communicationProcess",
  "grade": "YOUR LETTER GRADE",
  "reasoning": "2-3 sentences explaining the grade with specific references",
  "strengths": ["specific strength 1"],
  "weaknesses": ["specific weakness 1"],
  "examples": [
    {"type": "positive", "quote": "exact quote", "section": "section reference"}
  ],
  "improvement": {
    "title": "Concise improvement title",
    "description": "Specific actionable recommendation"
  }
}`,
  },
};

// Killer Clause Detection Prompt
const KILLER_CLAUSE_PROMPT = `You are a Construction Contracts Attorney reviewing an RFP for KILLER CLAUSES - contract terms so unfair or unusual that qualified contractors would decline to bid or significantly increase their prices.

Identify clauses that are:
1. UNLIMITED LIABILITY - No caps on contractor liability
2. INDEMNIFICATION TRAPS - Broad indemnity including owner negligence
3. PAYMENT RISKS - Pay-when-paid, excessive retainage (>10%), net 60+ terms
4. CHANGE ORDER RESTRICTIONS - Owner can change scope without fair compensation
5. TERMINATION FOR CONVENIENCE - No compensation for work-in-progress or demobilization
6. IMPOSSIBLE PERFORMANCE - Unrealistic deadlines or impossible standards
7. INSURANCE REQUIREMENTS - Excessive coverage beyond industry norms
8. BONDING REQUIREMENTS - Requirements exceeding 100% of contract value
9. INTELLECTUAL PROPERTY GRABS - All work product owned by owner forever
10. DISPUTE RESOLUTION - Mandatory arbitration in distant/unfavorable venues

IMPORTANT: Your grade MUST reflect your actual analysis. Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F. Do NOT default to B-range or any particular grade. A truly excellent RFP deserves an A; a poor one deserves a D or F. Use the full range.

OUTPUT FORMAT (JSON only):
{
  "found": true,
  "count": 2,
  "severity": "high",
  "clauses": [
    {
      "type": "UNLIMITED_LIABILITY",
      "title": "Unlimited Liability Exposure",
      "quote": "Contractor shall be liable for all damages without limitation...",
      "section": "Section 12.3",
      "severity": "high",
      "explanation": "This clause exposes the contractor to unlimited financial risk regardless of contract value.",
      "industryNorm": "Liability typically capped at contract value or 2x contract value",
      "recommendation": "Negotiate liability cap equal to contract value or insurance limits"
    }
  ],
  "overallRisk": "This RFP contains 2 high-severity killer clauses that will significantly increase bid prices or deter qualified bidders."
}

If no killer clauses are found:
{
  "found": false,
  "count": 0,
  "severity": "none",
  "clauses": [],
  "overallRisk": "No significant killer clauses identified. Commercial terms appear reasonable."
}`;

// Ambiguity Analysis Prompt
const AMBIGUITY_PROMPT = `You are a Construction Contract Attorney and RFP Specialist performing a DEEP CONTEXTUAL ambiguity analysis. Your job is NOT to flag keywords - it is to find language that will cause real disputes, change orders, or bid price discrepancies between contractors.

CRITICAL RULES:
1. DO NOT flag a term as ambiguous if it is defined, quantified, or clarified ELSEWHERE in the same document. Read the ENTIRE RFP before flagging. For example, if "reasonable" appears in Section 3 but Section 7 defines what "reasonable" means for that context, it is NOT ambiguous.
2. DO NOT flag standard legal boilerplate or industry-standard phrases that have established legal meanings (e.g., "including but not limited to" is standard legal language and only ambiguous if it creates a specific scope dispute in context).
3. DO NOT list the same issue twice. Each entry must be a unique, distinct ambiguity.
4. EVERY issue must explain the SPECIFIC risk to THIS project - not a generic risk. How would two different contractors interpret this differently? What is the dollar impact or schedule impact?

WHAT TO LOOK FOR (in order of severity):
1. CONTRADICTIONS - Section A says X, Section B says Y. Quote BOTH conflicting passages.
2. MISSING CRITICAL SPECS - Measurable requirements that are absent (no tolerance, no standard referenced, no quantity, no acceptance criteria). What specific number or standard is missing?
3. UNDEFINED SCOPE BOUNDARIES - Where does the contractor's responsibility start and end? Are there gaps between trades or phases?
4. UNMEASURABLE ACCEPTANCE CRITERIA - How does the owner decide if work passes? If there is no objective test, flag it with the specific consequence.
5. VAGUE TERMS IN HIGH-COST CONTEXTS - "adequate," "sufficient," "as needed" etc. ONLY when they govern significant cost items AND are not defined elsewhere in the document. Explain the cost variance this creates.
6. TIMELINE CONFLICTS - Dates that do not align, durations that are impossible, or milestones with no dates.
7. RISK ALLOCATION GAPS - Who bears the risk for unforeseen conditions, weather, permits, etc.? If silent, flag it.

For the "risk" field: Describe the SPECIFIC consequence for this project. Example of BAD: "May cause disputes." Example of GOOD: "Contractor A may bid $50K assuming 2 coats of paint while Contractor B bids $120K assuming 4 coats with primer, creating a $70K spread that makes bids non-comparable."

IMPORTANT: List EVERY unique ambiguity. If totalIssues is 12, the topIssues array must have exactly 12 items. Never duplicate.

OUTPUT FORMAT (JSON only):
{
  "index": 42,
  "category": "moderate",
  "totalIssues": 12,
  "issuesByType": {
    "contradictions": 2,
    "missingSpecs": 4,
    "scopeGaps": 2,
    "unmeasurableCriteria": 1,
    "vagueHighCost": 2,
    "timelineConflicts": 1
  },
  "topIssues": [
    {
      "type": "contradiction",
      "term": "Concrete strength requirement",
      "quote": "Section 3.2 requires 4000 PSI concrete; Section 5.1 references ACI 318 Table 19.3.2 which calls for 5000 PSI for this exposure class",
      "section": "Section 3.2 vs Section 5.1",
      "problem": "Two different concrete strength requirements for the same structural elements. Contractor must choose which to follow.",
      "risk": "A contractor bidding 4000 PSI saves ~$8/yard vs 5000 PSI. Over 500 yards, this is a $4,000 bid discrepancy, plus potential rejection of placed concrete if inspector enforces the higher spec.",
      "recommendation": "Reconcile to a single PSI requirement and reference the governing code edition explicitly."
    },
    {
      "type": "missingSpec",
      "term": "Paint system",
      "quote": "All exposed surfaces shall receive a complete paint system per owner approval",
      "section": "Section 9.4",
      "problem": "No specification of primer, number of coats, mil thickness, or product standard. 'Owner approval' is undefined - no submittal process referenced.",
      "risk": "Bids will vary by $30K-80K depending on assumed paint system. Post-award change order is likely when owner specifies a premium system.",
      "recommendation": "Specify: manufacturer, product line, number of coats, DFT in mils, and surface prep standard (SSPC-SP6, etc.)."
    }
  ],
  "summary": "This RFP has moderate ambiguity with 12 unique issues. The most impactful are 2 contradictions between structural specs and 4 missing specifications in high-cost divisions that will create significant bid spread."
}

Ambiguity Index Scale:
0-20: LOW - Minor ambiguities, low risk of disputes
21-40: MODERATE - Some clarification needed, manageable risk
41-60: HIGH - Significant ambiguity, expect RFIs and potential disputes
61-80: VERY HIGH - Major issues, high risk of change orders and claims
81-100: CRITICAL - Document needs substantial revision before bidding`;

// Perspective Synthesis Prompt
const PERSPECTIVE_PROMPT = `You are a Senior Procurement Strategist with 25+ years of experience advising both RFP issuers (owners) and bidders (contractors). Based on the comprehensive RFP analysis provided, generate actionable strategic advice for BOTH perspectives.

ANALYSIS DATA PROVIDED:
{aggregatedGrades}
{killerClauseData}
{ambiguityData}

PWin Rate Table (based on RFP Quality Grade):
- A Grade: 20-35% PWin (High-quality RFP, clear requirements attract strong competition)
- B Grade: 15-20% PWin (Good RFP, reasonable odds for qualified bidders)
- C Grade: 8-12% PWin (Moderate quality, higher uncertainty)
- D Grade: 2-5% PWin (Poor quality, high risk, many qualified bidders will pass)
- F Grade: <1% PWin (Very poor, only desperate bidders participate)

Cost of Waste Table (based on RFP Quality Grade):
- A Grade: 1% waste (Minimal rework, clear requirements)
- B Grade: 7% waste (Some clarifications needed post-award)
- C Grade: 18% waste (Significant scope changes likely)
- D Grade: 37% waste (Major rework expected, disputes likely)
- F Grade: 65%+ waste (Catastrophic waste, project likely to fail)

CRITICAL RULES:
- Your assessment MUST reflect the ACTUAL quality of this specific RFP. Do NOT default to any particular grade. Each RFP is different.
- Do NOT mention any numeric scores or percentages (like "85/100" or "85%") in text fields — only use letter grades (A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F)
- Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F

OUTPUT FORMAT (JSON only):
{
  "executiveSummary": "3-4 sentence overall assessment of this RFP's quality and market impact. Use letter grades only, no numeric scores.",
  "issuerPerspective": {
    "gradeJustification": "Why did this RFP receive this grade? What drove the score?",
    "businessImpact": "How will this RFP quality affect bid quality, pricing, and project outcomes?",
    "costOfWaste": {
      "percentage": 7,
      "description": "Expected waste explanation tied to specific RFP deficiencies"
    },
    "improvements": [
      {
        "variable": "scopePrecision",
        "title": "Improvement title",
        "description": "Specific actionable recommendation",
        "businessOutcome": "How this improvement will benefit the project"
      }
    ],
    "topPriorities": ["Most critical fix #1", "Most critical fix #2", "Most critical fix #3"]
  },
  "bidderPerspective": {
    "pWinRate": {
      "min": 15,
      "max": 20,
      "description": "Explanation of PWin assessment based on RFP quality and competition"
    },
    "opportunityRisk": "Assessment of key risks in pursuing this opportunity",
    "bidRecommendation": {
      "action": "bid",
      "reasoning": "Why bid/no-bid/conditional recommendation",
      "conditions": ["Condition 1 if conditional", "Condition 2 if conditional"]
    },
    "clarificationQuestions": ["Question to ask in Q&A #1", "Question #2", "Question #3"],
    "pricingStrategy": "How to price given the ambiguities and risks identified",
    "differentiationOpportunities": ["Where bidders can stand out #1", "Opportunity #2"]
  }
}`;

// Multi-pass system replaces old single-pass prompts for both modes.

// Response Grading: 7 Variable-Specific Prompts (Enhanced from DOCX Rubric)
// Response Variable Weights for aggregation
const RESPONSE_VARIABLE_WEIGHTS = {
  complianceCompleteness: 0.20,
  customerFocus: 0.15,
  technicalApproach: 0.25,
  experienceCredibility: 0.15,
  valueDifferentiators: 0.10,
  clarityOrganization: 0.10,
  presentationQuality: 0.05,
};

// 7 Response Variable-Specific Prompts (Enhanced from DOCX Rubric)
const RESPONSE_VARIABLE_PROMPTS = {
  complianceCompleteness: {
    weight: 0.20,
    name: "Compliance & Completeness",
    prompt: `You are a Senior Proposal Evaluator (APMP-certified) assessing a vendor's RFP response for COMPLIANCE & COMPLETENESS.

You have been provided with:
1. RFP DOCUMENTS (Source of Truth) — appearing first in the content
2. VENDOR RESPONSE DOCUMENTS — appearing after the "--- VENDOR RESPONSE DOCUMENTS BELOW ---" separator

DEFINITION: This measures how well the proposal complies with all RFP instructions and requirements. A compliant proposal addresses every item requested by the client (format, content, submission rules, etc.) with no omissions. In construction RFPs, this includes providing all required sections (e.g. safety plan, project schedule, budget breakdown) and following specified formatting (page limits, forms, etc.).

EVALUATION CRITERIA:
- Are all required sections, forms, and attachments included and properly completed?
- Does the response follow the RFP's format requirements (page limits, fonts, layout, numbering)?
- Are all mandatory forms signed and properly filled?
- Is there a compliance matrix cross-referencing every RFP clause?
- Are addenda acknowledgements included?
- Does the proposal address every enumerated requirement?

GRADING SCALE:

A (Excellent): Fully compliant and complete. The proposal follows every instruction to the letter and includes all required information/documentation. A compliance checklist was clearly used — nothing is missing or out of place. All required sections (safety plan, QC plan, schedule, pricing, resumes, bonding letter, insurance certs, past projects) are included in the exact order and naming convention requested, with all forms signed and properly tabbed. Submission rules (page limits, font size, cover sheets, portal uploads) are followed precisely.

B (Good): Generally compliant with only minor, trivial lapses. The proposal meets almost all requirements with just small exceptions unlikely to impact eligibility. Examples: slightly different file naming convention, a reformatted table for readability, one resume missing a license number in the header (but listed in body). Content and structure still match the RFP. Issues are non-fatal and easily fixable.

C (Average): Mostly compliant but with notable gaps. A majority of requirements are addressed, but some are only partially fulfilled or somewhat missed. Examples: QC plan is a one-page summary instead of the detailed process required; two required signatures missing on mandatory acknowledgements; project references lack required owner contact info or contract values. The proposal would raise compliance flags but remains in contention.

D (Poor): Significantly non-compliant. Multiple important RFP requirements are ignored or inadequately addressed. Examples: generic corporate safety policy submitted instead of mandatory site-specific safety plan; strict page limit exceeded by 25+ pages; proof of bonding capacity omitted and expired insurance certificate provided. The proposal risks disqualification and signals inability to follow instructions.

F (Fail): Non-compliant to the degree of rejection. Fundamental disregard for RFP instructions. Examples: generic proposal not following the required template, omitting core sections (no pricing, no schedule, no key personnel, no safety plan); mandatory bid form replaced with vendor's own format altering required line items; submission deadline missed or uploaded to wrong portal.

IMPORTANT: Your grade MUST reflect your actual analysis of THIS specific proposal against THIS specific RFP. Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F. Do NOT default to B-range or any particular grade. A truly excellent response deserves an A; a poor one deserves a D or F. Use the full range.

OUTPUT FORMAT (JSON only):
{
  "variable": "complianceCompleteness",
  "grade": "YOUR LETTER GRADE",
  "reasoning": "2-3 sentences explaining the grade with specific references to what was found",
  "strengths": ["specific strength with evidence"],
  "weaknesses": ["specific weakness with evidence"],
  "examples": [
    {"type": "positive", "quote": "exact quote or reference from response", "section": "section reference"},
    {"type": "negative", "quote": "problematic element or missing item", "section": "RFP section requiring it"}
  ],
  "improvement": {
    "title": "Concise improvement title",
    "description": "Specific actionable recommendation"
  },
  "gapItems": [
    {"requirement": "RFP Section X.Y - Specific Requirement", "status": "Met|Partial|Missing", "details": "explanation of gap"}
  ]
}`,
  },

  customerFocus: {
    weight: 0.15,
    name: "Customer Focus & Responsiveness",
    prompt: `You are a Senior Proposal Evaluator (APMP-certified) assessing a vendor's RFP response for CUSTOMER FOCUS & RESPONSIVENESS.

You have been provided with:
1. RFP DOCUMENTS (Source of Truth) — appearing first in the content
2. VENDOR RESPONSE DOCUMENTS — appearing after the "--- VENDOR RESPONSE DOCUMENTS BELOW ---" separator

DEFINITION: This evaluates how well the proposal is tailored to the client's specific needs, goals, and pain points. A responsive, customer-focused proposal goes beyond generic content — it demonstrates a deep understanding of the client's situation and shows how the bidder's solution will solve the client's problems. The proposal should read as if written for this particular client: mirroring priorities, referencing specific project context, schedule concerns, site challenges, and stakeholder constraints. Generic proposals rarely win, so tailoring is key.

EVALUATION CRITERIA:
- Does the proposal reference the client's specific project, goals, and constraints?
- Is the language tailored to the client (echoing their terminology and priorities)?
- Are client pain points identified and directly addressed with solutions?
- Does the proposal demonstrate understanding of both explicit and implicit needs?
- Are solution descriptions linked to what the client cares about?
- Does it go beyond restating requirements to show genuine insight?

GRADING SCALE:

A (Excellent): Highly customer-focused and fully responsive. Written from the client's perspective, echoing the client's language and priorities. All solution descriptions are linked to what the client cares about. Examples: for a hospital project, the proposal references infection control risk assessments (ICRA), patient flow, "minimal disruption" constraints, and provides phased logistics with off-hour noisy work schedules; for a schedule-driven owner, it includes milestone-by-milestone pull plan identifying long-lead items specific to the design and proposes early release packages. The client feels: "This bidder really gets us."

B (Good): Mostly tailored with some generic elements. Solid understanding of the client's main needs with effort to address them, though a few sections still feel generic. Examples: addresses the client's sustainability targets with project-relevant strategies but company overview reads like boilerplate; references tight schedule with accelerated approach but doesn't map it to the client's specific milestone dates or named constraints.

C (Average): Somewhat generic but acceptable. Meets RFP requirements in a "one-size-fits-many" way. Shows some awareness of client needs, but much language isn't tuned to this client. Examples: restates RFP requirements and presents standard approach without explaining why it's best for this client's stated goals; mentions "we will coordinate permitting" without addressing the specific jurisdictional realities the client highlighted; describes general site logistics without engaging project-specific constraints.

D (Poor): Largely unresponsive or off-target. Minimally addresses client-specific needs or misses them entirely. Reads like repurposed generic content. Examples: RFP emphasizes a hard completion date and LD risk, but proposal only says "we will meet the schedule" without how; copy-paste signals appear (references to wrong city, owner name, or building type).

F (Fail): Completely generic or irrelevant. No meaningful customization beyond superficial edits. No reference to the project's goals, constraints, or success criteria. May recommend methods that don't fit the project type or contradict client priorities. Essentially a capabilities brochure with a swapped cover page.

IMPORTANT: Your grade MUST reflect your actual analysis. Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F. Do NOT default to B-range or any particular grade. A truly excellent proposal deserves an A; a poor one deserves a D or F. Use the full range.

OUTPUT FORMAT (JSON only):
{
  "variable": "customerFocus",
  "grade": "YOUR LETTER GRADE",
  "reasoning": "2-3 sentences explaining the grade with specific references",
  "strengths": ["specific strength with evidence"],
  "weaknesses": ["specific weakness with evidence"],
  "examples": [
    {"type": "positive", "quote": "exact quote showing tailoring", "section": "section reference"},
    {"type": "negative", "quote": "generic or off-target content", "section": "section reference"}
  ],
  "improvement": {
    "title": "Concise improvement title",
    "description": "Specific actionable recommendation"
  },
  "gapItems": [
    {"requirement": "Client need or RFP emphasis area", "status": "Addressed|Partial|Missed", "details": "explanation"}
  ]
}`,
  },

  technicalApproach: {
    weight: 0.25,
    name: "Technical Solution & Approach",
    prompt: `You are a Senior Proposal Evaluator (APMP-certified) assessing a vendor's RFP response for TECHNICAL SOLUTION & PROJECT APPROACH.

You have been provided with:
1. RFP DOCUMENTS (Source of Truth) — appearing first in the content
2. VENDOR RESPONSE DOCUMENTS — appearing after the "--- VENDOR RESPONSE DOCUMENTS BELOW ---" separator

DEFINITION: This evaluates the quality and completeness of the proposed solution or methodology for executing the project. A strong proposal presents a clear, feasible, and well-structured plan for delivering the work, covering the "how" in detail. It should not only explain what the bidder will do, but convince the client the approach will achieve their goals and is the best way to do so. For construction, this includes the construction plan, project management approach, schedule, safety and quality plans, site logistics, and risk mitigation — how the bidder intends to build the project step by step.

EVALUATION CRITERIA:
- Is the execution plan comprehensive, step-by-step, and tailored to the project?
- Does it include detailed phasing tied to owner constraints?
- Are means/methods project-specific (not generic)?
- Is there an integrated approach covering logistics, risk, safety, QA/QC, and coordination?
- Is the schedule realistic with milestones, critical path, and buffer?
- Are site-specific challenges explicitly addressed?
- Are risks identified with specific mitigation strategies?
- Are coordination workflows defined (RFI/submittal cycles, BIM, commissioning)?

GRADING SCALE:

A (Excellent): Thorough, well-designed, and tailored solution approach. Comprehensive step-by-step execution plan addressing the project's unique requirements. All major aspects integrated into a cohesive strategy. Examples: detailed phasing plan tied to owner constraints (occupied facility, school calendar) with specific work windows, temporary partitions, access routing, shutdown plans, and milestone schedule; project-specific means/methods (foundation system, pour sequencing, curing plan, weather contingencies based on site conditions); integrated logistics (laydown, deliveries, crane picks, traffic control), risk register with mitigations, and QA/QC plan with hold points and inspection checklists. Coordination workflows clearly defined and matched to project complexity.

B (Good): Solid and complete approach meeting RFP requirements with minor shortcomings. Shows competence and feasibility, but less optimized or detailed than A-level. Examples: credible schedule and phasing narrative, but light on managing key constraints (limited access, shutdowns, community impacts); safety and QA/QC sections meet expectations but read partially templated with only a few project-specific add-ons; describes coordination steps but doesn't show optimization (early release packages, prefab strategy, long-lead plan).

C (Average): Acceptable but basic approach; some details lacking. General approach covering fundamentals but lacking depth and specificity. May feel templated with limited tailoring. Examples: high-level sequence (mobilize to build to closeout) with broad milestone list but no trade-level logic or critical path thinking; mentions phasing but doesn't explain alignment with client's operational needs; risk management is a short generic paragraph without project-specific mitigations.

D (Poor): Incomplete or unconvincing approach. Missing key elements or so generic it fails to prove viability. Examples: no clear schedule or only a single end date with no milestones or sequencing; glosses over critical work areas (MEP tie-ins, utility relocations, commissioning, shutdown coordination); suggests methods that don't fit site conditions or proposes phasing conflicting with client requirements.

F (Fail): Unsuitable or essentially absent approach. No real execution plan or an inappropriate one. Examples: "approach" section is a few generic sentences ("on time and on budget") with no specifics; mostly repeats scope without describing how to execute; includes unrealistic/nonsensical plan (timeline ignores permitting/long-leads, sequencing violates construction logic, methods conflict with code/RFP constraints).

IMPORTANT: Your grade MUST reflect your actual analysis. Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F. Do NOT default to B-range or any particular grade. A truly excellent proposal deserves an A; a poor one deserves a D or F. Use the full range.

OUTPUT FORMAT (JSON only):
{
  "variable": "technicalApproach",
  "grade": "YOUR LETTER GRADE",
  "reasoning": "2-3 sentences explaining the grade with specific references",
  "strengths": ["specific strength with evidence"],
  "weaknesses": ["specific weakness with evidence"],
  "examples": [
    {"type": "positive", "quote": "strong technical element", "section": "section reference"},
    {"type": "negative", "quote": "weak or missing element", "section": "section reference"}
  ],
  "improvement": {
    "title": "Concise improvement title",
    "description": "Specific actionable recommendation"
  },
  "gapItems": [
    {"requirement": "Technical requirement from RFP", "status": "Met|Partial|Missing", "details": "explanation"}
  ]
}`,
  },

  experienceCredibility: {
    weight: 0.15,
    name: "Experience & Credibility",
    prompt: `You are a Senior Proposal Evaluator (APMP-certified) assessing a vendor's RFP response for EXPERIENCE & CREDIBILITY (Team & Past Performance).

You have been provided with:
1. RFP DOCUMENTS (Source of Truth) — appearing first in the content
2. VENDOR RESPONSE DOCUMENTS — appearing after the "--- VENDOR RESPONSE DOCUMENTS BELOW ---" separator

DEFINITION: This measures how well the proposal establishes the bidder's credentials, experience, and ability to deliver. It includes team qualifications, relevant past project experience, and proof points (certifications, awards, testimonials, case studies, performance metrics) that build credibility. In construction, this means proving the firm and key personnel have successfully delivered similar projects (scope, size, complexity) and aligning those proof points so the evaluator feels: "they've done this before — and can do it for us."

EVALUATION CRITERIA:
- Are past projects highly relevant (same asset type, size, delivery method, constraints)?
- Do project case studies include measurable outcomes (schedule, cost, safety, quality)?
- Are key personnel named with tailored resumes showing comparable project experience?
- Is there a clear org chart with time-on-site commitments?
- Are proof points specific (certifications, metrics, testimonials, references)?
- Do resumes map "Project X challenge" to "This project's challenge"?
- Are required licenses, bonding capacity, and insurance demonstrated?

GRADING SCALE:

A (Excellent): Extremely credible with superior relevant experience and team strength. Creates high confidence through tightly matched past performance and project-relevant resumes. Examples: 3-6 highly similar projects (same asset type, size, delivery method) completed recently with outcomes (schedule performance, change order rate, safety record, quality results) and client references; key roles (PM, Super, Safety, QA/QC, MEP lead) named with resumes tailored to show comparable project responsibilities and results; strong proof points (relevant certifications, measurable metrics like on-time %, EMR, rework rate, and credible testimonials from similar project owners).

B (Good): Strong experience with moderate relevance. Capable and credible, with good experience and solid team. Examples: several relevant projects, but match is not complete (similar size but different facility type, or similar complexity but smaller scale); most key personnel are strong, but one or two roles are less ideal or resumes only partially tailored; proof points exist (awards, safety stats, references) but summarized at high level without deeper metrics.

C (Average): Adequate experience with gaps. Not inexperienced, but relevance is mixed and evidence limited. Examples: past projects loosely related (commercial fit-outs when this is infrastructure); only 1-2 truly similar examples; team resumes are generic with few project-relevant highlights; some key roles unnamed or "TBD"; proof points thin (certifications listed but not tied to project needs, references missing or vague).

D (Poor): Questionable experience; low credibility. Raises serious doubts. Examples: project experience is clearly mismatched (smaller jobs, different asset type, outdated); key personnel appear underqualified for the role or scale; few credible proof points (no references, no outcomes, assertions like "decades of experience" without specifics).

F (Fail): Lack of relevant experience; unreliable or unqualified. No comparable projects, missing required credentials, or credibility red flags. Examples: no comparable projects presented and no strategy to address the gap; required licenses/bonding/insurance not demonstrated; inconsistent claims, inflated experience, mismatched project descriptions.

IMPORTANT: Your grade MUST reflect your actual analysis. Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F. Do NOT default to B-range or any particular grade. A truly excellent proposal deserves an A; a poor one deserves a D or F. Use the full range.

OUTPUT FORMAT (JSON only):
{
  "variable": "experienceCredibility",
  "grade": "YOUR LETTER GRADE",
  "reasoning": "2-3 sentences explaining the grade with specific references",
  "strengths": ["specific strength with evidence"],
  "weaknesses": ["specific weakness with evidence"],
  "examples": [
    {"type": "positive", "quote": "strong credential or experience", "section": "section reference"},
    {"type": "negative", "quote": "gap or weakness", "section": "section reference"}
  ],
  "improvement": {
    "title": "Concise improvement title",
    "description": "Specific actionable recommendation"
  },
  "gapItems": [
    {"requirement": "Experience/qualification requirement from RFP", "status": "Met|Partial|Missing", "details": "explanation"}
  ]
}`,
  },

  valueDifferentiators: {
    weight: 0.10,
    name: "Value Proposition & Differentiators",
    prompt: `You are a Senior Proposal Evaluator (APMP-certified) assessing a vendor's RFP response for VALUE PROPOSITION & DIFFERENTIATORS.

You have been provided with:
1. RFP DOCUMENTS (Source of Truth) — appearing first in the content
2. VENDOR RESPONSE DOCUMENTS — appearing after the "--- VENDOR RESPONSE DOCUMENTS BELOW ---" separator

DEFINITION: This assesses how well the proposal articulates the value and benefits the solution brings to the client, and how it differentiates the bidder from competitors. Rather than describing what the bidder will do, it explains why the client should choose them: what unique advantages or superior outcomes will the client get? This includes quantifiable benefits (cost, time, quality, risk reduction) and unique capabilities or innovations. In construction, differentiators might include specialized experience, superior safety performance, proprietary methods, prefabrication capability, self-perform capacity, value-added services, or stronger warranties.

EVALUATION CRITERIA:
- Is there a compelling, client-centric answer to "Why should we choose you?"
- Are benefits concrete and quantified (cost savings, time reduction, quality metrics)?
- Does it use feature-benefit-proof structure?
- Are differentiators truly unique (not generic claims any competitor could make)?
- Are win themes consistently reinforced throughout the proposal?
- Is the value proposition tied to the client's specific goals and priorities?

GRADING SCALE:

A (Excellent): Compelling value with clear differentiators. Strong, client-centric case for best value. Benefits are concrete, often quantified, evidenced, and tied to client goals. Differentiators are clear, credible, and consistently reinforced. Examples: quantifies schedule advantage ("reduce duration by 8-10 weeks via prefabricated MEP racks + early release packages") tied to client's objective; positions risk reduction as value (safety metrics + dedicated site safety leadership linked to client's "zero-incident" priority); specialized relevant experience ("only team with 5 comparable projects in last 36 months") with client references and outcomes.

B (Good): Clear value proposition with some differentiators. Communicates benefits and provides reasons to stand out, but could be more persuasive, quantified, or consistently tied to client goals. Examples: claims faster delivery with planning practices and prior similar work but only quantifies one aspect; offers value-added item (enhanced commissioning, extended warranty) with limited evidence of uniqueness; highlights in-house VDC team as differentiator but lacks concrete examples of impact.

C (Average): Some value stated but mostly generic; weak differentiation. Basic value language (quality, safety, on-time) that's vague and unsupported. Examples: says "best value" and "high quality" with no metrics or project-specific explanation; lists strengths like "25 years of experience" without connecting to this project's risks; mentions "innovative methods" in general terms with no examples or linkage to client goals.

D (Poor): Unclear value; little to no differentiation. Feature/task-focused ("we will do X") without translating to client benefits. Examples: describes process steps and corporate background without "so what" for the client; broad unsubstantiated assertions ("highest quality") without evidence; lists non-differentiating capabilities (standard PM tools, standard reporting).

F (Fail): No articulated value; may create negative impression. Reads like a generic brochure, proposes mismatched methods, or omits standard value commitments. Examples: lots of company history but no client-facing benefits; methods that don't match the project type; omits warranty, QA/QC, schedule commitments that competitors would include.

IMPORTANT: Your grade MUST reflect your actual analysis. Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F. Do NOT default to B-range or any particular grade. A truly excellent proposal deserves an A; a poor one deserves a D or F. Use the full range.

OUTPUT FORMAT (JSON only):
{
  "variable": "valueDifferentiators",
  "grade": "YOUR LETTER GRADE",
  "reasoning": "2-3 sentences explaining the grade with specific references",
  "strengths": ["specific strength with evidence"],
  "weaknesses": ["specific weakness with evidence"],
  "examples": [
    {"type": "positive", "quote": "strong value statement or differentiator", "section": "section reference"},
    {"type": "negative", "quote": "generic or missing value element", "section": "section reference"}
  ],
  "improvement": {
    "title": "Concise improvement title",
    "description": "Specific actionable recommendation"
  },
  "gapItems": [
    {"requirement": "Client priority or evaluation criterion", "status": "Strong|Partial|Weak", "details": "explanation"}
  ]
}`,
  },

  clarityOrganization: {
    weight: 0.10,
    name: "Clarity & Organization",
    prompt: `You are a Senior Proposal Evaluator (APMP-certified) assessing a vendor's RFP response for CLARITY & ORGANIZATION.

You have been provided with:
1. RFP DOCUMENTS (Source of Truth) — appearing first in the content
2. VENDOR RESPONSE DOCUMENTS — appearing after the "--- VENDOR RESPONSE DOCUMENTS BELOW ---" separator

DEFINITION: This evaluates how clearly written, well-structured, and easy-to-navigate the proposal is. A high-quality response presents information in a logical order (often mirroring the RFP's structure) with clear headings, concise text, and no confusing language. Writing should be clear, concise, and free of jargon or errors, making it easy for evaluators to grasp key points. In construction proposals, this means well-labeled sections, a table of contents, tabs/bookmarks, and writing that works for both technical and non-technical reviewers.

EVALUATION CRITERIA:
- Does the proposal follow a logical structure mirroring the RFP?
- Are there clear headings, consistent numbering, and navigation aids (TOC, bookmarks)?
- Is writing crisp, concise, and error-free?
- Is jargon minimal or explained?
- Are visuals (org charts, schedules, site plans) used effectively?
- Can evaluators find any answer quickly without hunting?
- Are key points easy to extract without re-reading?

GRADING SCALE:

A (Excellent): Exceptionally clear, well-organized, and reader-friendly. Logical structure mirroring RFP. Navigation effortless. Examples: uses RFP's exact section titles and numbering with clickable TOC, PDF bookmarks, and requirement crosswalk pointing to page numbers; schedule section begins with one-page summary table then Gantt then narrative; safety/logistics content broken into clear subsections with bullets and tables. Writing crisp, error-free, visuals well-placed and labeled.

B (Good): Generally clear and well-structured with minor issues. Easy to read and navigate overall with small lapses. Examples: follows RFP order with clear headings and TOC but one subsection nested under wrong parent heading; key dates in a long paragraph instead of table; a few minor issues (two typos, mislabeled figure, slightly repetitive paragraph) not affecting comprehension.

C (Average): Acceptably clear but with noticeable readability/flow issues. Understandable but evaluators work harder to extract information. Examples: all required sections included but order drifts (schedule in technical section, staffing split across multiple places); safety plan in dense paragraphs with few subheadings; technical acronyms undefined and noticeable typos.

D (Poor): Hard to follow and poorly organized. Clarity and structure problems hinder understanding. Examples: generic headings ("Approach," "Overview") for multiple sections; mixes unrelated topics in same section with few bullets/tables/breaks; frequent typos, inconsistent terminology, many undefined acronyms.

F (Fail): Chaotic or incoherent. No discernible structure, extremely difficult to understand. Examples: jumps randomly between topics with no headings; incomplete sentences, copy/paste without cleanup, client name misspelled; blank sections or unresolved "insert text here" notes.

IMPORTANT: Your grade MUST reflect your actual analysis. Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F. Do NOT default to B-range or any particular grade. A truly excellent proposal deserves an A; a poor one deserves a D or F. Use the full range.

OUTPUT FORMAT (JSON only):
{
  "variable": "clarityOrganization",
  "grade": "YOUR LETTER GRADE",
  "reasoning": "2-3 sentences explaining the grade with specific references",
  "strengths": ["specific strength with evidence"],
  "weaknesses": ["specific weakness with evidence"],
  "examples": [
    {"type": "positive", "quote": "well-organized element", "section": "section reference"},
    {"type": "negative", "quote": "clarity or organization issue", "section": "section reference"}
  ],
  "improvement": {
    "title": "Concise improvement title",
    "description": "Specific actionable recommendation"
  },
  "gapItems": []
}`,
  },

  presentationQuality: {
    weight: 0.05,
    name: "Presentation & Professionalism",
    prompt: `You are a Senior Proposal Evaluator (APMP-certified) assessing a vendor's RFP response for PRESENTATION & PROFESSIONALISM.

You have been provided with:
1. RFP DOCUMENTS (Source of Truth) — appearing first in the content
2. VENDOR RESPONSE DOCUMENTS — appearing after the "--- VENDOR RESPONSE DOCUMENTS BELOW ---" separator

DEFINITION: This covers the overall look and polish of the proposal document — formatting, visuals, and professionalism in presentation. A professionally presented proposal is neat, consistent in style, and visually appealing, reflecting a quality brand image. This includes consistent fonts and layout, good use of white space, adherence to formatting requirements, graphic quality, clarity of tables/charts, binder/PDF organization, and correct branding.

EVALUATION CRITERIA:
- Is formatting uniform throughout (fonts, spacing, styles, margins)?
- Is whitespace balanced and the layout not cluttered?
- Are visuals high quality, readable, and purposefully placed?
- Do tables not break awkwardly across pages?
- Are navigation aids professional (tabs/bookmarks, headers/footers, TOC)?
- Does the proposal meet all formatting requirements and still look premium?
- Is the overall impression one of care and attention to detail?

GRADING SCALE:

A (Excellent): Highly polished and visually professional. Formatting uniform, whitespace balanced, visuals high quality and purposeful. Examples: clean cover, consistent header/footer (project name, section, page number), clickable TOC, bookmarks matching section numbering; graphics (Gantt chart, site logistics plan, org chart) high resolution, readable at 100%, with clear captions; meets all formatting requirements exactly and still looks premium with strong hierarchy, generous white space.

B (Good): Clean and professional overall with minor issues. Professional and easy to use with a few small imperfections. Examples: consistent headings and branding with bookmarks/TOC but one section uses slightly different heading style; visuals included and relevant but one image slightly lower resolution; cost table wraps awkwardly to second page.

C (Average): Acceptable presentation but plain or with noticeable flaws. Serviceable but not polished. Examples: mostly black-and-white with basic formatting, minimal visual hierarchy; font size shifts in places, bullet indents vary; visuals mediocre (blurry site photo, low-res plan scan, generic stock photos); schedule as paragraphs instead of clear table.

D (Poor): Subpar presentation with significant professionalism issues. Looks rushed or unreviewed. Examples: multiple fonts/styles appear, headings don't match, pages feel chaotic; missing page numbers, mis-numbered sections, placeholder text left behind; blurry schedule charts, skewed pages, tables split mid-row.

F (Fail): Unacceptably sloppy. Obstructs evaluation or signals serious lack of professionalism. Examples: overlapping text/images, unreadable sections, pages out of order; dozens of typos, visible track-changes, copy/paste remnants from another proposal; mandatory formatting rules ignored (wrong forms, wrong layout).

IMPORTANT: Your grade MUST reflect your actual analysis. Valid grades: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F. Do NOT default to B-range or any particular grade. A truly excellent proposal deserves an A; a poor one deserves a D or F. Use the full range.

OUTPUT FORMAT (JSON only):
{
  "variable": "presentationQuality",
  "grade": "YOUR LETTER GRADE",
  "reasoning": "2-3 sentences explaining the grade with specific references",
  "strengths": ["specific strength with evidence"],
  "weaknesses": ["specific weakness with evidence"],
  "examples": [
    {"type": "positive", "quote": "strong presentation element", "section": "section reference"},
    {"type": "negative", "quote": "presentation issue", "section": "section reference"}
  ],
  "improvement": {
    "title": "Concise improvement title",
    "description": "Specific actionable recommendation"
  },
  "gapItems": []
}`,
  },
};

// Response Synthesis Prompt - generates executive summary, compiled gaps, and evaluator insight
const RESPONSE_SYNTHESIS_PROMPT = `You are a Senior Proposal Evaluator synthesizing the results of a detailed multi-variable evaluation of a vendor's RFP response.

Below are the aggregated grading results from 7 independent evaluations:
{aggregatedGrades}

Individual gap analysis items found across all dimensions:
{gapItems}

Based on these results, generate a comprehensive synthesis. Be specific and reference the individual variable grades and findings.

CRITICAL RULES:
- Do NOT mention any numeric scores or percentages (like "85/100" or "85%") — only use letter grades (A+, A, A-, B+, etc.)
- Your assessment must reflect the ACTUAL quality of this specific proposal — do NOT default to any particular grade range
- Reference specific variable grades and findings, not numeric values

OUTPUT FORMAT (JSON only):
{
  "executiveSummary": "3-4 sentence executive summary of overall proposal quality, key strengths, and primary areas for improvement. Reference the overall grade and most impactful variables.",
  "gapAnalysis": [
    {
      "requirement": "RFP Section/Requirement reference",
      "status": "Missing|Partial|Met",
      "details": "Specific explanation of the gap and its impact"
    }
  ],
  "complianceIssues": [
    "Specific compliance issue 1 with reference to RFP requirement",
    "Specific compliance issue 2"
  ],
  "recommendations": [
    {
      "title": "Actionable recommendation title",
      "description": "Detailed recommendation with specific steps",
      "priority": "high|medium|low",
      "variable": "variableKey this targets"
    }
  ],
  "evaluatorInsight": {
    "overallImpression": "What an experienced evaluator would think upon reading this proposal — 2-3 sentences",
    "competitivePosition": "How this proposal likely stacks up against typical competitors — 1-2 sentences",
    "keyStrength": "The single most compelling element that could win the deal",
    "criticalFix": "The single most important thing to fix before submission"
  }
}`;


// ============================================================
// MULTI-PASS ORCHESTRATION FUNCTIONS
// ============================================================

/**
 * Grade a single variable with retry logic
 * @param {string} key - Variable key (e.g., 'scopePrecision')
 * @param {Object} config - Variable config with prompt
 * @param {Array} fileUris - Array of {fileUri, mimeType} objects
 * @param {Object} genAIClient - Google GenAI client
 * @param {number} maxRetries - Max retry attempts
 * @return {Promise<Object>} Grading result
 */
const gradeVariableWithRetry = async (
    key, config, fileUris, genAIClient, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Build content parts
      const contentParts = [];

      // Add file references
      for (const file of fileUris) {
        contentParts.push({
          fileData: {
            fileUri: file.fileUri,
            mimeType: file.mimeType,
          },
        });
      }

      // Add the variable-specific prompt
      contentParts.push({
        text: config.prompt +
          "\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown, " +
          "no explanations outside the JSON.",
      });

      // Call Gemini API
      const response = await genAIClient.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{
          role: "user",
          parts: contentParts,
        }],
      });

      let analysisText = response.text;
      if (!analysisText) {
        throw new Error("Empty response from API");
      }

      // Clean markdown formatting
      analysisText = analysisText.replace(/```json\n?/g, "")
          .replace(/```\n?/g, "").trim();

      // Parse JSON
      const result = JSON.parse(analysisText);

      // Add metadata and derive numeric score from letter grade
      result.variableKey = key;
      result.variableName = config.name;
      result.weight = config.weight;
      result.score = gradeToScore(result.grade);

      logger.info(`Graded ${key}: ${result.grade}`);
      return result;
    } catch (error) {
      logger.warn(
          `Attempt ${attempt}/${maxRetries} failed for ${key}: ${error.message}`,
      );

      if (attempt === maxRetries) {
        // Return fallback result
        logger.error(`All retries failed for ${key}`);
        return {
          variableKey: key,
          variableName: config.name,
          weight: config.weight,
          grade: "N/A",
          score: 0,
          confidence: 0,
          reasoning: "Grading failed after multiple attempts",
          strengths: [],
          weaknesses: ["Unable to analyze this dimension"],
          examples: [],
          improvement: {
            title: "Analysis Failed",
            description: "Please try again or contact support",
          },
          error: error.message,
        };
      }

      // Exponential backoff
      await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }
};

/**
 * Detect killer clauses in the RFP with retry logic
 * @param {Array} fileUris - Array of {fileUri, mimeType} objects
 * @param {Object} genAIClient - Google GenAI client
 * @param {number} maxRetries - Max retry attempts
 * @return {Promise<Object>} Killer clause analysis
 */
const detectKillerClauses = async (fileUris, genAIClient, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const contentParts = [];
      for (const file of fileUris) {
        contentParts.push({
          fileData: {fileUri: file.fileUri, mimeType: file.mimeType},
        });
      }
      contentParts.push({
        text: KILLER_CLAUSE_PROMPT +
          "\n\nIMPORTANT: Respond with ONLY valid JSON.",
      });

      const response = await genAIClient.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{role: "user", parts: contentParts}],
      });

      let analysisText = response.text;
      if (!analysisText) throw new Error("Empty response");

      analysisText = analysisText.replace(/```json\n?/g, "")
          .replace(/```\n?/g, "").trim();

      const result = JSON.parse(analysisText);
      logger.info(
          `Killer clauses: ${result.found ? result.count : 0} found`,
      );
      return result;
    } catch (error) {
      logger.warn(`Killer clause attempt ${attempt}/${maxRetries} ` +
        `failed: ${error.message}`);
      if (attempt === maxRetries) {
        logger.error("All killer clause retries failed");
        return {
          found: false, count: 0, severity: "unknown", clauses: [],
          overallRisk: "", analysisError: true, error: error.message,
        };
      }
      await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }
};

/**
 * Analyze ambiguity in the RFP with retry logic
 * @param {Array} fileUris - Array of {fileUri, mimeType} objects
 * @param {Object} genAIClient - Google GenAI client
 * @param {number} maxRetries - Max retry attempts
 * @return {Promise<Object>} Ambiguity analysis
 */
const analyzeAmbiguity = async (fileUris, genAIClient, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const contentParts = [];
      for (const file of fileUris) {
        contentParts.push({
          fileData: {fileUri: file.fileUri, mimeType: file.mimeType},
        });
      }
      contentParts.push({
        text: AMBIGUITY_PROMPT +
          "\n\nIMPORTANT: Respond with ONLY valid JSON.",
      });

      const response = await genAIClient.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{role: "user", parts: contentParts}],
      });

      let analysisText = response.text;
      if (!analysisText) throw new Error("Empty response");

      analysisText = analysisText.replace(/```json\n?/g, "")
          .replace(/```\n?/g, "").trim();

      const result = JSON.parse(analysisText);
      logger.info(`Ambiguity index: ${result.index} (${result.category})`);
      return result;
    } catch (error) {
      logger.warn(`Ambiguity attempt ${attempt}/${maxRetries} ` +
        `failed: ${error.message}`);
      if (attempt === maxRetries) {
        logger.error("All ambiguity retries failed");
        return {
          index: 50, category: "unknown", totalIssues: 0,
          issuesByType: {}, topIssues: [],
          summary: "Ambiguity analysis could not be completed.",
          error: error.message,
        };
      }
      await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }
};

/**
 * Aggregate individual variable grades into final score
 * @param {Object} variableResults - Results from 12 grading calls
 * @return {Object} Aggregated grade data
 */
const aggregateGrades = (variableResults) => {
  let weightedSum = 0;
  let totalWeight = 0;
  let simpleSum = 0;
  let validCount = 0;

  const processedResults = {};

  for (const [key, result] of Object.entries(variableResults)) {
    const weight = VARIABLE_WEIGHTS[key] || 0;

    // Skip failed results in weighted calculation
    if (result.score > 0 && result.grade !== "N/A") {
      weightedSum += result.score * weight;
      totalWeight += weight;
      simpleSum += result.score;
      validCount++;
    }

    processedResults[key] = {
      grade: result.grade,
      score: result.score,
      weight: weight,
      name: result.variableName,
      confidence: result.confidence || 0,
      reasoning: result.reasoning,
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      examples: result.examples || [],
      improvement: result.improvement,
    };
  }

  // Calculate scores
  const weightedScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const simpleAverage = validCount > 0 ? simpleSum / validCount : 0;
  const finalGrade = scoreToGrade(weightedScore);

  // Collect and prioritize strengths/weaknesses/improvements
  const allStrengths = [];
  const allWeaknesses = [];
  const allImprovements = [];

  for (const [key, result] of Object.entries(processedResults)) {
    const weight = VARIABLE_WEIGHTS[key] || 0;

    if (result.strengths) {
      result.strengths.forEach((s) => {
        allStrengths.push({text: s, variable: result.name, weight});
      });
    }

    if (result.weaknesses) {
      result.weaknesses.forEach((w) => {
        allWeaknesses.push({text: w, variable: result.name, weight});
      });
    }

    if (result.improvement && result.improvement.title) {
      allImprovements.push({
        ...result.improvement,
        variable: key,
        variableName: result.name,
        weight,
        currentGrade: result.grade,
      });
    }
  }

  // Sort by weight (most important first)
  allStrengths.sort((a, b) => b.weight - a.weight);
  allWeaknesses.sort((a, b) => b.weight - a.weight);
  allImprovements.sort((a, b) => b.weight - a.weight);

  return {
    grade: finalGrade,
    score: Math.round(simpleAverage),
    weightedScore: parseFloat(weightedScore.toFixed(2)),
    variableScores: processedResults,
    topStrengths: allStrengths.slice(0, 5),
    topWeaknesses: allWeaknesses.slice(0, 5),
    prioritizedImprovements: allImprovements.slice(0, 5),
    validVariables: validCount,
    totalVariables: 12,
  };
};

/**
 * Generate dual perspectives based on aggregated data
 * @param {Object} aggregated - Aggregated grades
 * @param {Object} killerClauses - Killer clause analysis
 * @param {Object} ambiguity - Ambiguity analysis
 * @param {Array} fileUris - File URIs
 * @param {Object} genAIClient - GenAI client
 * @return {Promise<Object>} Perspectives
 */
const generatePerspectives = async (
    aggregated, killerClauses, ambiguity, fileUris, genAIClient) => {
  try {
    // Build context for perspective generation
    const contextData = {
      grade: aggregated.grade,
      variableSummary: Object.entries(aggregated.variableScores).map(
          ([key, val]) => ({
            name: val.name,
            grade: val.grade,
            weight: `${(val.weight * 100).toFixed(0)}%`,
          }),
      ),
      topWeaknesses: aggregated.topWeaknesses.slice(0, 3),
      killerClauseSummary: {
        found: killerClauses.found,
        count: killerClauses.count,
        severity: killerClauses.severity,
      },
      ambiguitySummary: {
        index: ambiguity.index,
        category: ambiguity.category,
        totalIssues: ambiguity.totalIssues,
      },
    };

    // Build the prompt with actual data
    const promptWithData = PERSPECTIVE_PROMPT
        .replace("{aggregatedGrades}", JSON.stringify(contextData, null, 2))
        .replace("{killerClauseData}",
            JSON.stringify(killerClauses.clauses?.slice(0, 3) || [], null, 2))
        .replace("{ambiguityData}",
            JSON.stringify(ambiguity.topIssues || [], null, 2));

    const contentParts = [{
      text: promptWithData +
        "\n\nIMPORTANT: Respond with ONLY valid JSON.",
    }];

    const response = await genAIClient.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{role: "user", parts: contentParts}],
    });

    let analysisText = response.text;
    if (!analysisText) {
      throw new Error("Empty response");
    }

    analysisText = analysisText.replace(/```json\n?/g, "")
        .replace(/```\n?/g, "").trim();

    const result = JSON.parse(analysisText);
    logger.info("Perspectives generated successfully");
    return result;
  } catch (error) {
    logger.error(`Perspective generation failed: ${error.message}`);

    // Return default perspectives based on grade
    const grade = aggregated.grade;
    const pwinMap = {
      "A+": {min: 25, max: 35}, "A": {min: 22, max: 32}, "A-": {min: 20, max: 30},
      "B+": {min: 17, max: 22}, "B": {min: 15, max: 20}, "B-": {min: 13, max: 18},
      "C+": {min: 10, max: 14}, "C": {min: 8, max: 12}, "C-": {min: 6, max: 10},
      "D+": {min: 4, max: 7}, "D": {min: 2, max: 5}, "D-": {min: 1, max: 3},
      "F": {min: 0, max: 1},
    };
    const wasteMap = {
      "A+": 1, "A": 1, "A-": 2,
      "B+": 5, "B": 7, "B-": 10,
      "C+": 14, "C": 18, "C-": 25,
      "D+": 30, "D": 37, "D-": 45,
      "F": 65,
    };

    const pwin = pwinMap[grade] || {min: 5, max: 15};
    const waste = wasteMap[grade] || 20;

    return {
      executiveSummary: `This RFP received a grade of ${grade}. ` +
        "See detailed variable analysis for specific areas of improvement.",
      issuerPerspective: {
        gradeJustification: "See variable scores for detailed breakdown.",
        businessImpact: "RFP quality affects bid quality and pricing.",
        costOfWaste: {
          percentage: waste,
          description: "Estimated project waste due to RFP deficiencies.",
        },
        improvements: aggregated.prioritizedImprovements.slice(0, 3).map((i) => ({
          variable: i.variable,
          title: i.title,
          description: i.description,
          businessOutcome: "Improved clarity and reduced risk.",
        })),
        topPriorities: aggregated.topWeaknesses.slice(0, 3).map((w) => w.text),
      },
      bidderPerspective: {
        pWinRate: {
          min: pwin.min,
          max: pwin.max,
          description: `Based on RFP grade of ${grade}.`,
        },
        opportunityRisk: "Review killer clauses and ambiguity analysis.",
        bidRecommendation: {
          action: grade.startsWith("A") || grade.startsWith("B") ?
            "bid" : (grade.startsWith("C") ? "conditional" : "no-bid"),
          reasoning: "Based on overall RFP quality assessment.",
          conditions: grade.startsWith("C") ?
            ["Seek clarification on ambiguous items"] : [],
        },
        clarificationQuestions: ambiguity.topIssues?.map(
            (i) => `Clarify: ${i.term || i.quote}`,
        ) || [],
        pricingStrategy: "Include contingency for identified ambiguities.",
        differentiationOpportunities: [
          "Address RFP weaknesses in your proposal",
        ],
      },
    };
  }
};

/**
 * Main multi-pass grading orchestration function
 * @param {Array} fileUris - Array of {fileUri, mimeType} objects
 * @param {Object} genAIClient - Google GenAI client
 * @return {Promise<Object>} Complete grading result
 */
const gradeRfpMultiPass = async (fileUris, genAIClient) => {
  const startTime = Date.now();
  logger.info("Starting multi-pass RFP grading (15 API calls)...");

  // Phase 2: Grade all 12 variables in staggered batches of 4
  logger.info("Phase 2: Grading 12 variables in staggered batches...");
  const variableEntries = Object.entries(VARIABLE_PROMPTS);
  const batchSize = 4;
  const variableResultsArray = [];
  for (let i = 0; i < variableEntries.length; i += batchSize) {
    const batch = variableEntries.slice(i, i + batchSize);
    const batchPromises = batch.map(
        ([key, config]) =>
          gradeVariableWithRetry(key, config, fileUris, genAIClient),
    );
    const batchResults = await Promise.all(batchPromises);
    variableResultsArray.push(...batchResults);
    if (i + batchSize < variableEntries.length) {
      await sleep(1000); // 1s delay between batches to avoid rate limits
    }
  }

  // Convert array to object
  const variableResults = {};
  variableResultsArray.forEach((result) => {
    variableResults[result.variableKey] = result;
  });

  logger.info("Phase 2 complete: All 12 variables graded");

  // Phase 3: Special analyses in parallel
  logger.info("Phase 3: Running killer clause and ambiguity analysis...");
  const [killerClauses, ambiguity] = await Promise.all([
    detectKillerClauses(fileUris, genAIClient),
    analyzeAmbiguity(fileUris, genAIClient),
  ]);
  logger.info("Phase 3 complete");

  // Phase 4: Aggregate (pure JS, no API)
  logger.info("Phase 4: Aggregating grades...");
  const aggregated = aggregateGrades(variableResults);
  logger.info(`Phase 4 complete: Final grade ${aggregated.grade} ` +
    `(${aggregated.weightedScore})`);

  // Phase 5: Generate perspectives
  logger.info("Phase 5: Generating perspectives...");
  const perspectives = await generatePerspectives(
      aggregated, killerClauses, ambiguity, fileUris, genAIClient,
  );
  logger.info("Phase 5 complete");

  const processingTime = Date.now() - startTime;
  logger.info(`Multi-pass grading complete in ${processingTime}ms`);

  // Combine all results
  return {
    grade: aggregated.grade,
    score: aggregated.score,
    weightedScore: aggregated.weightedScore,
    executiveSummary: perspectives.executiveSummary,
    variableScores: aggregated.variableScores,
    strengths: aggregated.topStrengths.map((s) => s.text),
    weaknesses: aggregated.topWeaknesses.map((w) => w.text),
    improvements: aggregated.prioritizedImprovements,
    killerClauses: killerClauses,
    ambiguityIndex: ambiguity,
    issuerPerspective: perspectives.issuerPerspective,
    bidderPerspective: perspectives.bidderPerspective,
    metadata: {
      processingTimeMs: processingTime,
      apiCallsUsed: 15,
      model: "gemini-2.0-flash",
      validVariables: aggregated.validVariables,
      totalVariables: aggregated.totalVariables,
    },
  };
};

// ============================================================
// END MULTI-PASS ORCHESTRATION
// ============================================================

// ============================================================
// RESPONSE MULTI-PASS ORCHESTRATION
// ============================================================

/**
 * Grade a single response variable with retry logic
 * @param {string} key - Variable key
 * @param {Object} config - Variable config with prompt
 * @param {Array} rfpFiles - RFP file URIs
 * @param {Array} responseFiles - Response file URIs
 * @param {Object} genAIClient - Google GenAI client
 * @param {number} maxRetries - Max retry attempts
 * @return {Promise<Object>} Grading result
 */
const gradeResponseVariableWithRetry = async (
    key, config, rfpFiles, responseFiles, genAIClient, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const contentParts = [];

      // Add RFP files first (source of truth)
      for (const file of rfpFiles) {
        contentParts.push({
          fileData: {
            fileUri: file.fileUri,
            mimeType: file.mimeType,
          },
        });
      }

      // Add separator
      contentParts.push(
          {text: "\n\n--- VENDOR RESPONSE DOCUMENTS BELOW ---\n\n"});

      // Add response files
      for (const file of responseFiles) {
        contentParts.push({
          fileData: {
            fileUri: file.fileUri,
            mimeType: file.mimeType,
          },
        });
      }

      // Add the variable-specific prompt
      contentParts.push({
        text: config.prompt +
          "\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown, " +
          "no explanations outside the JSON.",
      });

      const response = await genAIClient.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{
          role: "user",
          parts: contentParts,
        }],
      });

      let analysisText = response.text;
      if (!analysisText) {
        throw new Error("Empty response from API");
      }

      analysisText = analysisText.replace(/```json\n?/g, "")
          .replace(/```\n?/g, "").trim();

      const result = JSON.parse(analysisText);

      result.variableKey = key;
      result.variableName = config.name;
      result.weight = config.weight;
      result.score = gradeToScore(result.grade);

      logger.info(`Response graded ${key}: ${result.grade}`);
      return result;
    } catch (error) {
      logger.warn(
          `Response attempt ${attempt}/${maxRetries} failed for ` +
          `${key}: ${error.message}`,
      );

      if (attempt === maxRetries) {
        logger.error(`All retries failed for response ${key}`);
        return {
          variableKey: key,
          variableName: config.name,
          weight: config.weight,
          grade: "N/A",
          score: 0,
          confidence: 0,
          reasoning: "Grading failed after multiple attempts",
          strengths: [],
          weaknesses: ["Unable to analyze this dimension"],
          examples: [],
          improvement: {
            title: "Analysis Failed",
            description: "Please try again or contact support",
          },
          gapItems: [],
          error: error.message,
        };
      }

      await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }
};

/**
 * Aggregate response variable grades into final score
 * @param {Object} variableResults - Results from 7 grading calls
 * @return {Object} Aggregated grade data
 */
const aggregateResponseGrades = (variableResults) => {
  let weightedSum = 0;
  let totalWeight = 0;
  let simpleSum = 0;
  let validCount = 0;

  const processedResults = {};

  for (const [key, result] of Object.entries(variableResults)) {
    const weight = RESPONSE_VARIABLE_WEIGHTS[key] || 0;

    if (result.score > 0 && result.grade !== "N/A") {
      weightedSum += result.score * weight;
      totalWeight += weight;
      simpleSum += result.score;
      validCount++;
    }

    processedResults[key] = {
      grade: result.grade,
      score: result.score,
      weight: weight,
      name: result.variableName,
      confidence: result.confidence || 0,
      reasoning: result.reasoning,
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      examples: result.examples || [],
      improvement: result.improvement,
      gapItems: result.gapItems || [],
    };
  }

  const weightedScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const simpleAverage = validCount > 0 ? simpleSum / validCount : 0;
  const finalGrade = scoreToGrade(weightedScore);

  // Collect strengths, weaknesses, improvements, and gaps
  const allStrengths = [];
  const allWeaknesses = [];
  const allImprovements = [];
  const allGapItems = [];

  for (const [key, result] of Object.entries(processedResults)) {
    const weight = RESPONSE_VARIABLE_WEIGHTS[key] || 0;

    if (result.strengths) {
      result.strengths.forEach((s) => {
        allStrengths.push({text: s, variable: result.name, weight});
      });
    }

    if (result.weaknesses) {
      result.weaknesses.forEach((w) => {
        allWeaknesses.push({text: w, variable: result.name, weight});
      });
    }

    if (result.improvement && result.improvement.title) {
      allImprovements.push({
        ...result.improvement,
        variable: key,
        variableName: result.name,
        weight,
        currentGrade: result.grade,
      });
    }

    if (result.gapItems) {
      result.gapItems.forEach((gap) => {
        allGapItems.push({...gap, sourceVariable: result.name});
      });
    }
  }

  allStrengths.sort((a, b) => b.weight - a.weight);
  allWeaknesses.sort((a, b) => b.weight - a.weight);
  allImprovements.sort((a, b) => b.weight - a.weight);

  return {
    grade: finalGrade,
    score: Math.round(simpleAverage),
    weightedScore: parseFloat(weightedScore.toFixed(2)),
    variableScores: processedResults,
    topStrengths: allStrengths.slice(0, 5),
    topWeaknesses: allWeaknesses.slice(0, 5),
    prioritizedImprovements: allImprovements.slice(0, 5),
    allGapItems: allGapItems,
    validVariables: validCount,
    totalVariables: 7,
  };
};

/**
 * Generate synthesis for response grading
 * @param {Object} aggregated - Aggregated grades
 * @param {Object} genAIClient - GenAI client
 * @return {Promise<Object>} Synthesis result
 */
const generateResponseSynthesis = async (aggregated, genAIClient) => {
  try {
    const contextData = {
      grade: aggregated.grade,
      variableSummary: Object.entries(aggregated.variableScores).map(
          ([key, val]) => ({
            name: val.name,
            grade: val.grade,
            weight: `${(val.weight * 100).toFixed(0)}%`,
            reasoning: val.reasoning,
          }),
      ),
      topStrengths: aggregated.topStrengths.slice(0, 3),
      topWeaknesses: aggregated.topWeaknesses.slice(0, 3),
    };

    const promptWithData = RESPONSE_SYNTHESIS_PROMPT
        .replace("{aggregatedGrades}", JSON.stringify(contextData, null, 2))
        .replace("{gapItems}",
            JSON.stringify(aggregated.allGapItems || [], null, 2));

    const contentParts = [{
      text: promptWithData +
        "\n\nIMPORTANT: Respond with ONLY valid JSON.",
    }];

    const response = await genAIClient.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{role: "user", parts: contentParts}],
    });

    let analysisText = response.text;
    if (!analysisText) throw new Error("Empty response");

    analysisText = analysisText.replace(/```json\n?/g, "")
        .replace(/```\n?/g, "").trim();

    const result = JSON.parse(analysisText);
    logger.info("Response synthesis generated successfully");
    return result;
  } catch (error) {
    logger.error(`Response synthesis failed: ${error.message}`);

    return {
      executiveSummary: `This proposal received a grade of ` +
        `${aggregated.grade}. See detailed variable analysis ` +
        "for specific areas of improvement.",
      gapAnalysis: aggregated.allGapItems.filter(
          (g) => g.status !== "Met").slice(0, 10),
      complianceIssues: [],
      recommendations: aggregated.prioritizedImprovements
          .slice(0, 3).map((i) => ({
            title: i.title,
            description: i.description,
            priority: "high",
            variable: i.variable,
          })),
      evaluatorInsight: {
        overallImpression: "See variable scores for detailed breakdown.",
        competitivePosition: "Unable to assess — synthesis failed.",
        keyStrength: aggregated.topStrengths[0]?.text || "N/A",
        criticalFix: aggregated.topWeaknesses[0]?.text || "N/A",
      },
    };
  }
};

/**
 * Main multi-pass response grading orchestration function
 * @param {Array} rfpFiles - RFP file URIs
 * @param {Array} responseFiles - Response file URIs
 * @param {Object} genAIClient - Google GenAI client
 * @return {Promise<Object>} Complete grading result
 */
const gradeResponseMultiPass = async (rfpFiles, responseFiles, genAIClient) => {
  const startTime = Date.now();
  logger.info("Starting multi-pass response grading (8 API calls)...");

  // Phase 1: Grade all 7 variables in staggered batches of 4
  logger.info("Phase 1: Grading 7 response variables...");
  const variableEntries = Object.entries(RESPONSE_VARIABLE_PROMPTS);
  const batchSize = 4;
  const variableResultsArray = [];
  for (let i = 0; i < variableEntries.length; i += batchSize) {
    const batch = variableEntries.slice(i, i + batchSize);
    const batchPromises = batch.map(
        ([key, config]) =>
          gradeResponseVariableWithRetry(
              key, config, rfpFiles, responseFiles, genAIClient),
    );
    const batchResults = await Promise.all(batchPromises);
    variableResultsArray.push(...batchResults);
    if (i + batchSize < variableEntries.length) {
      await sleep(1000);
    }
  }

  const variableResults = {};
  variableResultsArray.forEach((result) => {
    variableResults[result.variableKey] = result;
  });

  logger.info("Phase 1 complete: All 7 variables graded");

  // Phase 2: Aggregate (pure JS, no API)
  logger.info("Phase 2: Aggregating response grades...");
  const aggregated = aggregateResponseGrades(variableResults);
  logger.info(`Phase 2 complete: Final grade ${aggregated.grade} ` +
    `(${aggregated.weightedScore})`);

  // Phase 3: Generate synthesis
  logger.info("Phase 3: Generating response synthesis...");
  const synthesis = await generateResponseSynthesis(aggregated, genAIClient);
  logger.info("Phase 3 complete");

  const processingTime = Date.now() - startTime;
  logger.info(`Multi-pass response grading complete in ${processingTime}ms`);

  return {
    grade: aggregated.grade,
    score: aggregated.score,
    weightedScore: aggregated.weightedScore,
    executiveSummary: synthesis.executiveSummary,
    variableScores: aggregated.variableScores,
    strengths: aggregated.topStrengths.map((s) => s.text),
    weaknesses: aggregated.topWeaknesses.map((w) => w.text),
    improvements: aggregated.prioritizedImprovements,
    gapAnalysis: synthesis.gapAnalysis || [],
    complianceIssues: synthesis.complianceIssues || [],
    recommendations: synthesis.recommendations || [],
    evaluatorInsight: synthesis.evaluatorInsight || {},
    metadata: {
      processingTimeMs: processingTime,
      apiCallsUsed: 8,
      model: "gemini-2.0-flash",
      validVariables: aggregated.validVariables,
      totalVariables: aggregated.totalVariables,
    },
  };
};

// ============================================================
// END RESPONSE MULTI-PASS ORCHESTRATION
// ============================================================


// Helper function to generate email HTML from grading results
const generateRFPGradeEmail = (result, mode) => {
  if (mode === "rfp") {
    // Concise email - full analysis is in the PDF attachment
    const bidder = result.bidderPerspective || {};
    const issuer = result.issuerPerspective || {};
    const bidAction = bidder.bidRecommendation?.action || "conditional";

    // Build compact variable grades table
    const varNames = {
      scopePrecision: "Scope & Deliverables",
      evaluationTransparency: "Evaluation Criteria",
      technicalRequirements: "Technical Requirements",
      fairCompetition: "Fair Competition",
      purposeContext: "Purpose & Context",
      scheduleRealism: "Schedule Realism",
      internalConsistency: "Internal Consistency",
      commercialTerms: "Commercial Terms",
      innovationFlexibility: "Innovation Flexibility",
      complianceRequirements: "Compliance",
      submissionInstructions: "Submission Instructions",
      communicationProcess: "Communication Process",
    };

    const gradesHtml = result.variableScores ?
      Object.entries(varNames).map(([key, name], idx) => {
        const vs = result.variableScores[key];
        if (!vs) return "";
        const bg = idx % 2 === 0 ? "#ffffff" : "#f5f5f5";
        return `<tr style="background: ${bg};">
          <td style="padding: 7px 10px; font-size: 13px;
                     border-bottom: 1px solid #e0e0e0;">${name}</td>
          <td style="padding: 7px 10px; font-weight: bold; color: #000000;
                     text-align: center; font-size: 14px;
                     font-family: 'Helvetica Neue', Arial, sans-serif;
                     border-bottom: 1px solid #e0e0e0;">${vs.grade}</td>
        </tr>`;
      }).join("") : "";

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; background: #ffffff; color: #000000; }
  </style>
</head>
<body>
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;
              font-family: Georgia, 'Times New Roman', serif;">

    <!-- Header -->
    <div style="text-align: center; padding: 32px 0;
                border-bottom: 3px solid #000000;">
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                  font-size: 10px; font-weight: bold; letter-spacing: 2px;
                  text-transform: uppercase; color: #666;">
        PROPAGENT AI // QUALITY AUDIT</div>
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                  font-size: 64px; font-weight: bold; margin: 20px 0 8px 0;
                  color: #000000;">${result.grade}</div>
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                  font-size: 14px; font-weight: bold; letter-spacing: 2px;
                  text-transform: uppercase;">RFP INTELLIGENCE REPORT</div>
    </div>

    <!-- Executive Summary -->
    <div style="padding: 20px 0; border-bottom: 1px solid #cccccc;">
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                  font-size: 10px; font-weight: bold; letter-spacing: 2px;
                  text-transform: uppercase; margin-bottom: 10px;">
        EXECUTIVE SUMMARY</div>
      <p style="margin: 0; font-size: 14px; line-height: 1.5;">
        ${result.executiveSummary || "Analysis complete."}</p>
    </div>

    <!-- Key Metrics -->
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;
                  border: 2px solid #000000;">
      <tr>
        <td style="width: 25%; padding: 14px 10px; text-align: center;
                   border-right: 1px solid #000000;">
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                      font-size: 9px; font-weight: bold; letter-spacing: 1px;
                      text-transform: uppercase; color: #666;">PWIN RATE</div>
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                      font-size: 20px; font-weight: bold; margin-top: 4px;">
            ${bidder.pWinRate?.min || "?"}–${bidder.pWinRate?.max || "?"}%</div>
        </td>
        <td style="width: 25%; padding: 14px 10px; text-align: center;
                   border-right: 1px solid #000000;">
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                      font-size: 9px; font-weight: bold; letter-spacing: 1px;
                      text-transform: uppercase; color: #666;">COST OF WASTE</div>
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                      font-size: 20px; font-weight: bold; margin-top: 4px;">
            ${issuer.costOfWaste?.percentage || "?"}%</div>
        </td>
        <td style="width: 25%; padding: 14px 10px; text-align: center;
                   border-right: 1px solid #000000;">
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                      font-size: 9px; font-weight: bold; letter-spacing: 1px;
                      text-transform: uppercase; color: #666;">KILLER CLAUSES</div>
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                      font-size: 20px; font-weight: bold; margin-top: 4px;">
            ${result.killerClauses?.count || 0}</div>
        </td>
        <td style="width: 25%; padding: 14px 10px; text-align: center;
                   background: #000000; color: #ffffff;">
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                      font-size: 9px; font-weight: bold; letter-spacing: 1px;
                      text-transform: uppercase; color: rgba(255,255,255,0.7);">
            RECOMMENDATION</div>
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                      font-size: 14px; font-weight: bold; margin-top: 4px;">
            ${bidAction.toUpperCase().replace("-", " ")}</div>
        </td>
      </tr>
    </table>

    <!-- Variable Grades -->
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                font-size: 10px; font-weight: bold; letter-spacing: 2px;
                text-transform: uppercase; margin: 20px 0 10px 0;">
      DETAILED EVALUATION</div>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #000000; color: #ffffff;">
          <th style="padding: 8px 10px; text-align: left;
                     font-family: 'Helvetica Neue', Arial, sans-serif;
                     font-size: 10px; font-weight: bold; letter-spacing: 1px;
                     text-transform: uppercase;">VARIABLE</th>
          <th style="padding: 8px 10px; text-align: center;
                     font-family: 'Helvetica Neue', Arial, sans-serif;
                     font-size: 10px; font-weight: bold; letter-spacing: 1px;
                     text-transform: uppercase;">GRADE</th>
        </tr>
      </thead>
      <tbody>${gradesHtml}</tbody>
    </table>

    <!-- Attached PDF -->
    <div style="margin: 24px 0; padding: 16px; border: 2px solid #000000;
                text-align: center;">
      <p style="margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif;
                font-size: 12px; font-weight: bold; letter-spacing: 1px;
                text-transform: uppercase;">FULL ANALYSIS ATTACHED</p>
      <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.4;
                color: #444;">
        Open the attached PDF for the complete report including
        killer clauses, ambiguity index, and detailed recommendations.</p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 16px 0;
                border-top: 1px solid #cccccc;">
      <span style="font-family: 'Helvetica Neue', Arial, sans-serif;
                   font-size: 10px; font-weight: bold; letter-spacing: 2px;
                   text-transform: uppercase; color: #999;">
        PROPAGENT AI</span>
    </div>
  </div>
</body>
</html>
    `;
  } else {
    // Response mode - B&W typographic style matching RFP email
    const respVarNames = {
      complianceCompleteness: "Compliance & Completeness",
      customerFocus: "Customer Focus",
      technicalApproach: "Technical Approach",
      experienceCredibility: "Experience & Credibility",
      valueDifferentiators: "Value & Differentiators",
      clarityOrganization: "Clarity & Organization",
      presentationQuality: "Presentation Quality",
    };

    const respGradesHtml = result.variableScores ?
      Object.entries(respVarNames).map(([key, name], idx) => {
        const vs = result.variableScores[key];
        if (!vs) return "";
        const bg = idx % 2 === 0 ? "#ffffff" : "#f5f5f5";
        return `<tr style="background: ${bg};">
          <td style="padding: 7px 10px; font-size: 13px;
                     border-bottom: 1px solid #e0e0e0;">${name}</td>
          <td style="padding: 7px 10px; font-weight: bold; color: #000;
                     text-align: center; font-size: 14px;
                     font-family: 'Helvetica Neue', Arial, sans-serif;
                     border-bottom: 1px solid #e0e0e0;">${vs.grade}</td>
        </tr>`;
      }).join("") : "";

    const insight = result.evaluatorInsight || {};

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; background: #ffffff; color: #000000; }
  </style>
</head>
<body>
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;
              font-family: Georgia, 'Times New Roman', serif;">

    <!-- Header -->
    <div style="text-align: center; padding: 32px 0;
                border-bottom: 3px solid #000000;">
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                  font-size: 10px; font-weight: bold; letter-spacing: 2px;
                  text-transform: uppercase; color: #666;">
        PROPAGENT AI // RESPONSE AUDIT</div>
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                  font-size: 64px; font-weight: bold; margin: 20px 0 8px 0;
                  color: #000000;">${result.grade}</div>
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                  font-size: 14px; font-weight: bold; letter-spacing: 2px;
                  text-transform: uppercase;">PROPOSAL EVALUATION REPORT</div>
    </div>

    <!-- Executive Summary -->
    <div style="padding: 20px 0; border-bottom: 1px solid #cccccc;">
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                  font-size: 10px; font-weight: bold; letter-spacing: 2px;
                  text-transform: uppercase; margin-bottom: 10px;">
        EXECUTIVE SUMMARY</div>
      <p style="margin: 0; font-size: 14px; line-height: 1.5;">
        ${result.executiveSummary || "Analysis complete."}</p>
    </div>

    <!-- Evaluator Insight -->
    ${insight.keyStrength || insight.criticalFix ? `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;
                  border: 2px solid #000000;">
      <tr>
        <td style="width: 50%; padding: 14px 12px; vertical-align: top;
                   border-right: 1px solid #000000;">
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                      font-size: 9px; font-weight: bold; letter-spacing: 1px;
                      text-transform: uppercase; color: #666;">
            KEY STRENGTH</div>
          <div style="font-size: 13px; margin-top: 6px; line-height: 1.4;">
            ${insight.keyStrength || "N/A"}</div>
        </td>
        <td style="width: 50%; padding: 14px 12px; vertical-align: top;">
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                      font-size: 9px; font-weight: bold; letter-spacing: 1px;
                      text-transform: uppercase; color: #666;">
            CRITICAL FIX</div>
          <div style="font-size: 13px; margin-top: 6px; line-height: 1.4;">
            ${insight.criticalFix || "N/A"}</div>
        </td>
      </tr>
    </table>
    ` : ""}

    <!-- Variable Grades -->
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif;
                font-size: 10px; font-weight: bold; letter-spacing: 2px;
                text-transform: uppercase; margin: 20px 0 10px 0;">
      DETAILED EVALUATION</div>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #000000; color: #ffffff;">
          <th style="padding: 8px 10px; text-align: left;
                     font-family: 'Helvetica Neue', Arial, sans-serif;
                     font-size: 10px; font-weight: bold; letter-spacing: 1px;
                     text-transform: uppercase;">DIMENSION</th>
          <th style="padding: 8px 10px; text-align: center;
                     font-family: 'Helvetica Neue', Arial, sans-serif;
                     font-size: 10px; font-weight: bold; letter-spacing: 1px;
                     text-transform: uppercase;">GRADE</th>
        </tr>
      </thead>
      <tbody>${respGradesHtml}</tbody>
    </table>

    <!-- Attached PDF -->
    <div style="margin: 24px 0; padding: 16px; border: 2px solid #000000;
                text-align: center;">
      <p style="margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif;
                font-size: 12px; font-weight: bold; letter-spacing: 1px;
                text-transform: uppercase;">FULL ANALYSIS ATTACHED</p>
      <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.4;
                color: #444;">
        Open the attached PDF for the complete report including
        gap analysis, compliance issues, and detailed recommendations.</p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 16px 0;
                border-top: 1px solid #cccccc;">
      <span style="font-family: 'Helvetica Neue', Arial, sans-serif;
                   font-size: 10px; font-weight: bold; letter-spacing: 2px;
                   text-transform: uppercase; color: #999;">
        PROPAGENT AI</span>
    </div>
  </div>
</body>
</html>
    `;
  }
};

// PDF REPORT GENERATION - Strict Typographic B&W
// ============================================================

/**
 * Generate a strict B&W typographic PDF report
 * ONLY 4 font sizes: 72pt (hero), 14pt (section), 10pt (label), 10pt (body)
 * Font A: Helvetica-Bold UPPERCASE | Font B: Times-Roman sentence case
 * @param {Object} result - Full grading result from gradeRfpMultiPass
 * @return {Promise<Buffer>} PDF as buffer
 */
const generateRFPGradePDF = (result) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 36, size: "letter", autoFirstPage: true,
      info: {Title: "RFP Intelligence Report", Author: "Propagent AI"},
    });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // STRICT constants
    const BK = "#000000";
    const WH = "#ffffff";
    const GY = "#f2f2f2";
    const FH = "Helvetica-Bold"; // Font A - headers/data
    const FB = "Times-Roman"; // Font B - body copy
    const M = 36; // margin
    const PW = 612; // page width
    const PH = 792; // page height
    const W = PW - (M * 2); // content width 540

    // Helper: check space, add page if needed
    const need = (h) => {
      if (doc.y > PH - h - M) {
        doc.addPage();
        doc.y = M;
      }
    };

    // Level 2: Section header "01 // TITLE" + 3px line
    const secHdr = (num, title) => {
      doc.font(FH).fontSize(14).fillColor(BK);
      doc.text(
          `${String(num).padStart(2, "0")} // ${title.toUpperCase()}`,
          M, doc.y, {width: W, characterSpacing: 2},
      );
      doc.moveDown(0.3);
      doc.moveTo(M, doc.y).lineTo(M + W, doc.y)
          .lineWidth(3).strokeColor(BK).stroke();
      doc.moveDown(0.8);
    };

    // Level 3: Label (10pt Helvetica-Bold UPPERCASE)
    const lbl = (text, x, y, opts) => {
      doc.font(FH).fontSize(10).fillColor(BK);
      if (x !== undefined && y !== undefined) {
        doc.text(text.toUpperCase(), x, y, {characterSpacing: 1, ...opts});
      } else {
        doc.text(text.toUpperCase(), {characterSpacing: 1});
      }
    };

    // Level 4: Body text (10pt Times-Roman)
    const body = (text, opts = {}) => {
      doc.font(FB).fontSize(10).fillColor(BK);
      doc.text(text || "", {lineGap: 4, ...opts});
    };

    // ========== PAGE 1: COVER ==========
    const logoPath = path.join(__dirname, "Inverted Color Logo.png");
    try {
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, M, M, {height: 30});
      } else {
        lbl("PROPAGENT AI // QUALITY AUDIT", M, M);
      }
    } catch (e) {
      lbl("PROPAGENT AI // QUALITY AUDIT", M, M);
    }

    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    }).toUpperCase();
    lbl(dateStr, M, M + 10, {width: W, align: "right"});

    // Grade circle
    const grade = result.grade || "N/A";
    const cx = PW / 2;
    const cy = 340;
    doc.circle(cx, cy, 80).lineWidth(8).strokeColor(BK).stroke();
    doc.font(FH).fontSize(72).fillColor(BK);
    const gw = doc.widthOfString(grade);
    doc.text(grade, cx - (gw / 2), cy - 30);

    // Title (cy+80 = circle bottom, +30 gap)
    doc.font(FH).fontSize(14).fillColor(BK);
    doc.text("RFP INTELLIGENCE REPORT", M, cy + 110, {
      width: W, align: "center", characterSpacing: 2,
    });
    doc.moveDown(0.5);
    lbl("RFP QUALITY ASSESSMENT", M, doc.y, {width: W, align: "center"});

    // Confidential footer
    lbl(
        "CONFIDENTIAL // PREPARED FOR INTERNAL REVIEW",
        M, 680, {width: W, align: "center"},
    );

    // ========== PAGE 2: EXECUTIVE SUMMARY ==========
    doc.addPage();
    doc.y = M;
    secHdr(1, "EXECUTIVE SUMMARY");
    body(result.executiveSummary || "Analysis complete.");
    doc.moveDown(1);

    // Data grid 2x2
    const issuer = result.issuerPerspective || {};
    const bidder = result.bidderPerspective || {};
    const bidAction = (bidder.bidRecommendation?.action || "N/A")
        .toUpperCase().replace("-", " ");
    const gridY = doc.y;
    const cw = W / 2;
    const ch = 44;
    const gridData = [
      ["PWIN RATE",
        `${bidder.pWinRate?.min || "?"}–${bidder.pWinRate?.max || "?"}%`,
        false],
      ["COST OF WASTE",
        `${issuer.costOfWaste?.percentage || "?"}%`, false],
      ["KILLER CLAUSES",
        `${result.killerClauses?.count || 0}`, false],
      ["RECOMMENDATION", bidAction, true],
    ];

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        const idx = row * 2 + col;
        const d = gridData[idx];
        const cellX = M + (col * cw);
        const cellY = gridY + (row * ch);
        doc.rect(cellX, cellY, cw, ch)
            .fillAndStroke(d[2] ? BK : WH, BK);
        doc.font(FH).fontSize(10).fillColor(d[2] ? WH : BK);
        doc.text(d[0], cellX + 8, cellY + 6, {width: cw - 16});
        doc.text(d[1], cellX + 8, cellY + 22, {width: cw - 16});
      }
    }
    doc.x = M;
    doc.y = gridY + (ch * 2) + 16;

    // Strengths
    if (result.strengths && result.strengths.length > 0) {
      need(60);
      lbl("KEY STRENGTHS");
      doc.moveDown(0.3);
      result.strengths.forEach((s) => {
        need(24);
        body(`+ ${s}`);
        doc.moveDown(0.2);
      });
      doc.moveDown(0.5);
    }

    // Weaknesses
    if (result.weaknesses && result.weaknesses.length > 0) {
      need(60);
      lbl("KEY WEAKNESSES");
      doc.moveDown(0.3);
      result.weaknesses.forEach((w) => {
        need(24);
        body(`- ${w}`);
        doc.moveDown(0.2);
      });
    }

    // ========== PAGE 3: KILLER CLAUSES ==========
    doc.addPage();
    doc.y = M;
    secHdr(2, "CRITICAL RISK FACTORS");

    const kc = result.killerClauses || {};
    if (kc.analysisError) {
      body("Killer clause analysis could not be completed for this " +
        "document. Please review commercial terms manually.");
      if (kc.error) {
        doc.moveDown(0.3);
        lbl(`ERROR: ${kc.error}`);
      }
    } else if (kc.found && kc.clauses && kc.clauses.length > 0) {
      lbl(`${kc.count} KILLER CLAUSE(S) — SEVERITY: ${
        (kc.severity || "UNKNOWN").toUpperCase()}`);
      doc.moveDown(0.8);

      kc.clauses.forEach((clause) => {
        need(90);
        const barY = doc.y;
        // Title
        doc.font(FH).fontSize(10).fillColor(BK);
        doc.text(
            `${(clause.title || clause.type || "").toUpperCase()} (${
              clause.section || "N/A"})`,
            M + 14, doc.y, {width: W - 14},
        );
        doc.moveDown(0.3);
        // Quote + explanation
        doc.font(FB).fontSize(10).fillColor(BK);
        doc.text(`"${clause.quote || ""}"`, M + 14, doc.y, {
          width: W - 14, lineGap: 4,
        });
        doc.moveDown(0.2);
        doc.text(clause.explanation || "", M + 14, doc.y, {
          width: W - 14, lineGap: 4,
        });
        doc.moveDown(0.3);
        // Recommendation
        doc.font(FH).fontSize(10).fillColor(BK);
        doc.text("RECOMMENDATION:", M + 14, doc.y, {continued: true});
        doc.font(FB).fontSize(10);
        doc.text(` ${clause.recommendation || "N/A"}`);
        // 4px vertical alert bar
        doc.rect(M, barY, 4, doc.y - barY).fill(BK);
        doc.moveDown(1);
      });
    } else {
      body("No killer clauses identified. " +
        "Commercial terms appear reasonable.");
    }

    if (kc.overallRisk) {
      doc.moveDown(0.5);
      lbl("OVERALL RISK ASSESSMENT");
      doc.moveDown(0.3);
      body(kc.overallRisk);
    }

    // ========== PAGE 4+: AMBIGUITY (ALL INSTANCES) ==========
    doc.addPage();
    doc.y = M;
    secHdr(3, "AMBIGUITY ANALYSIS");

    const amb = result.ambiguityIndex || {};
    lbl(`AMBIGUITY LEVEL: ${
      (amb.category || "UNKNOWN").toUpperCase()} (${
      amb.totalIssues || 0} INSTANCES)`);
    doc.moveDown(0.8);

    if (amb.topIssues && amb.topIssues.length > 0) {
      // Table header
      const cols = [140, 200, 200];
      let tY = doc.y;
      const rH = 24;

      // Header row (black bg)
      doc.rect(M, tY, W, rH).fill(BK);
      doc.font(FH).fontSize(10).fillColor(WH);
      doc.text("TERM", M + 6, tY + 7, {width: cols[0] - 12});
      doc.text("CONTEXT", M + cols[0] + 6, tY + 7, {width: cols[1] - 12});
      doc.text("RISK", M + cols[0] + cols[1] + 6, tY + 7,
          {width: cols[2] - 12});
      tY += rH;

      // ALL data rows — no slicing
      amb.topIssues.forEach((issue, i) => {
        // Measure row height needed
        doc.font(FB).fontSize(10);
        const termText = `"${issue.term || issue.quote || ""}"`;
        const riskText = issue.problem || issue.risk || "";
        const termH = doc.heightOfString(termText, {width: cols[0] - 12});
        const riskH = doc.heightOfString(riskText, {width: cols[2] - 12});
        const rowH = Math.max(rH, termH + 14, riskH + 14);

        // Page break if needed
        if (tY + rowH > PH - M) {
          doc.addPage();
          doc.y = M;
          tY = M;
          // Repeat header
          doc.rect(M, tY, W, rH).fill(BK);
          doc.font(FH).fontSize(10).fillColor(WH);
          doc.text("TERM", M + 6, tY + 7, {width: cols[0] - 12});
          doc.text("CONTEXT", M + cols[0] + 6, tY + 7,
              {width: cols[1] - 12});
          doc.text("RISK", M + cols[0] + cols[1] + 6, tY + 7,
              {width: cols[2] - 12});
          tY += rH;
        }

        const bg = i % 2 === 0 ? WH : GY;
        doc.rect(M, tY, W, rowH).fill(bg);
        // Draw cell borders
        doc.rect(M, tY, cols[0], rowH).stroke(BK);
        doc.rect(M + cols[0], tY, cols[1], rowH).stroke(BK);
        doc.rect(M + cols[0] + cols[1], tY, cols[2], rowH).stroke(BK);

        doc.font(FB).fontSize(10).fillColor(BK);
        doc.text(termText, M + 6, tY + 7, {width: cols[0] - 12});
        doc.text(issue.section || "", M + cols[0] + 6, tY + 7,
            {width: cols[1] - 12});
        doc.text(riskText, M + cols[0] + cols[1] + 6, tY + 7,
            {width: cols[2] - 12});
        tY += rowH;
      });
      doc.x = M;
      doc.y = tY + 10;
    }

    if (amb.summary) {
      need(40);
      doc.moveDown(0.5);
      body(amb.summary);
    }

    // ========== PAGES 5-6: DETAILED EVALUATION ==========
    doc.addPage();
    doc.y = M;
    secHdr(4, "DETAILED EVALUATION");

    const varOrder = [
      "scopePrecision", "evaluationTransparency", "technicalRequirements",
      "fairCompetition", "purposeContext", "scheduleRealism",
      "internalConsistency", "commercialTerms", "innovationFlexibility",
      "complianceRequirements", "submissionInstructions",
      "communicationProcess",
    ];
    const varNames = {
      scopePrecision: "SCOPE OF WORK & DELIVERABLES",
      evaluationTransparency: "EVALUATION CRITERIA TRANSPARENCY",
      technicalRequirements: "TECHNICAL REQUIREMENTS & DRAWINGS",
      fairCompetition: "FAIR COMPETITION & DISCRIMINATORS",
      purposeContext: "PURPOSE, OUTCOMES & CONTEXT",
      scheduleRealism: "SCHEDULE REALISM & MILESTONES",
      internalConsistency: "INTERNAL CONSISTENCY",
      commercialTerms: "COMMERCIAL TERMS & RISK",
      innovationFlexibility: "INNOVATION FLEXIBILITY",
      complianceRequirements: "COMPLIANCE REQUIREMENTS",
      submissionInstructions: "SUBMISSION INSTRUCTIONS",
      communicationProcess: "COMMUNICATION PROCESS (Q&A)",
    };

    const vs = result.variableScores || {};
    varOrder.forEach((key) => {
      const v = vs[key];
      if (!v) return;
      need(60);

      // Dot leaders: NAME ......... [ GRADE ]
      const vName = varNames[key] || key.toUpperCase();
      const gStr = `[ ${v.grade || "N/A"} ]`;
      const nW = doc.font(FH).fontSize(10).widthOfString(vName);
      const gW = doc.font(FH).fontSize(10).widthOfString(gStr);
      const dotsW = W - nW - gW - 10;
      const dots = ".".repeat(Math.max(0, Math.floor(dotsW / 4)));

      doc.font(FH).fontSize(10).fillColor(BK);
      doc.text(`${vName} ${dots} ${gStr}`, M, doc.y, {width: W});
      doc.moveDown(0.2);

      if (v.reasoning) {
        body(v.reasoning, {indent: 10});
      }
      doc.moveDown(0.6);
    });

    // ========== PAGE 7: STAKEHOLDER GUIDANCE ==========
    doc.addPage();
    doc.y = M;
    secHdr(5, "STRATEGIC GUIDANCE");

    const colW = (W - 20) / 2;
    const lX = M;
    const rX = M + colW + 20;
    const csY = doc.y;

    // Left: ISSUER NOTES
    lbl("ISSUER NOTES", lX, csY, {width: colW});
    doc.moveDown(0.5);
    let lY = doc.y;

    const imps = issuer.improvements || result.improvements || [];
    imps.forEach((imp) => {
      doc.font(FB).fontSize(10).fillColor(BK);
      doc.text(`• ${imp.title || imp.description || ""}`,
          lX, lY, {width: colW, lineGap: 4});
      lY = doc.y + 6;
    });
    if (issuer.topPriorities && issuer.topPriorities.length > 0) {
      lY += 8;
      doc.font(FH).fontSize(10).fillColor(BK);
      doc.text("TOP PRIORITIES", lX, lY, {width: colW});
      lY = doc.y + 4;
      issuer.topPriorities.forEach((p) => {
        doc.font(FB).fontSize(10).fillColor(BK);
        doc.text(`• ${p}`, lX, lY, {width: colW, lineGap: 4});
        lY = doc.y + 4;
      });
    }
    lY += 12;
    doc.font(FH).fontSize(10).fillColor(BK);
    doc.text(`COST OF WASTE: ${
      issuer.costOfWaste?.percentage || "?"}%`, lX, lY, {width: colW});

    // Right: BIDDER NOTES
    lbl("BIDDER NOTES", rX, csY, {width: colW});
    let rY = csY + 18;

    const qs = bidder.clarificationQuestions || [];
    qs.forEach((q) => {
      doc.font(FB).fontSize(10).fillColor(BK);
      doc.text(`• ${q}`, rX, rY, {width: colW, lineGap: 4});
      rY = doc.y + 6;
    });
    if (bidder.pricingStrategy) {
      rY += 8;
      doc.font(FH).fontSize(10).fillColor(BK);
      doc.text("PRICING STRATEGY", rX, rY, {width: colW});
      rY = doc.y + 4;
      doc.font(FB).fontSize(10).fillColor(BK);
      doc.text(bidder.pricingStrategy, rX, rY, {width: colW, lineGap: 4});
      rY = doc.y + 4;
    }
    rY += 12;
    doc.font(FH).fontSize(10).fillColor(BK);
    doc.text(`PWIN RATE: ${bidder.pWinRate?.min || "?"}–${
      bidder.pWinRate?.max || "?"}%`, rX, rY, {width: colW});

    // Vertical divider
    const divEnd = Math.max(lY, rY) + 20;
    doc.moveTo(M + colW + 10, csY).lineTo(M + colW + 10, divEnd)
        .lineWidth(2).strokeColor(BK).stroke();

    // Bid recommendation stamp
    doc.y = divEnd + 20;
    need(50);
    const sW = 200;
    const sH = 36;
    const sX = (PW - sW) / 2;
    doc.rect(sX, doc.y, sW, sH).fill(BK);
    doc.font(FH).fontSize(14).fillColor(WH);
    doc.text(bidAction, sX, doc.y + 10, {width: sW, align: "center"});

    doc.end();
  });
};


/**
 * Generate a strict B&W typographic PDF report for response grading
 * Same typography system as RFP PDF: 72pt/14pt/10pt/10pt, B&W only
 * @param {Object} result - Full grading result from gradeResponseMultiPass
 * @return {Promise<Buffer>} PDF as buffer
 */
const generateResponseGradePDF = (result) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 36, size: "letter", autoFirstPage: true,
      info: {
        Title: "Proposal Evaluation Report",
        Author: "Propagent AI",
      },
    });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // STRICT constants (same as RFP PDF)
    const BK = "#000000";
    const WH = "#ffffff";
    const FH = "Helvetica-Bold";
    const FB = "Times-Roman";
    const M = 36;
    const PW = 612;
    const PH = 792;
    const W = PW - (M * 2);

    const need = (h) => {
      if (doc.y > PH - h - M) {
        doc.addPage();
        doc.y = M;
      }
    };

    const secHdr = (num, title) => {
      doc.font(FH).fontSize(14).fillColor(BK);
      doc.text(
          `${String(num).padStart(2, "0")} // ${title.toUpperCase()}`,
          M, doc.y, {width: W, characterSpacing: 2},
      );
      doc.moveDown(0.3);
      doc.moveTo(M, doc.y).lineTo(M + W, doc.y)
          .lineWidth(3).strokeColor(BK).stroke();
      doc.moveDown(0.8);
    };

    const lbl = (text, x, y, opts) => {
      doc.font(FH).fontSize(10).fillColor(BK);
      if (x !== undefined && y !== undefined) {
        doc.text(text.toUpperCase(), x, y,
            {characterSpacing: 1, ...opts});
      } else {
        doc.text(text.toUpperCase(), {characterSpacing: 1});
      }
    };

    const body = (text, opts = {}) => {
      doc.font(FB).fontSize(10).fillColor(BK);
      doc.text(text || "", {lineGap: 4, ...opts});
    };

    // ========== PAGE 1: COVER ==========
    const logoPath = path.join(__dirname, "Inverted Color Logo.png");
    try {
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, M, M, {height: 30});
      } else {
        lbl("PROPAGENT AI // RESPONSE AUDIT", M, M);
      }
    } catch (e) {
      lbl("PROPAGENT AI // RESPONSE AUDIT", M, M);
    }

    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    }).toUpperCase();
    lbl(dateStr, M, M + 10, {width: W, align: "right"});

    // Grade circle
    const grade = result.grade || "N/A";
    const cx = PW / 2;
    const cy = 340;
    doc.circle(cx, cy, 80).lineWidth(8).strokeColor(BK).stroke();
    doc.font(FH).fontSize(72).fillColor(BK);
    const gw = doc.widthOfString(grade);
    doc.text(grade, cx - (gw / 2), cy - 30);

    // Title
    doc.font(FH).fontSize(14).fillColor(BK);
    doc.text("PROPOSAL EVALUATION REPORT", M, cy + 110, {
      width: W, align: "center", characterSpacing: 2,
    });
    doc.moveDown(0.5);
    lbl("RFP RESPONSE QUALITY ASSESSMENT", M, doc.y,
        {width: W, align: "center"});

    lbl(
        "CONFIDENTIAL // PREPARED FOR INTERNAL REVIEW",
        M, 680, {width: W, align: "center"},
    );

    // ========== PAGE 2: EXECUTIVE SUMMARY ==========
    doc.addPage();
    doc.y = M;
    secHdr(1, "EXECUTIVE SUMMARY");
    body(result.executiveSummary || "Analysis complete.");
    doc.moveDown(1);

    // Evaluator insight grid
    const insight = result.evaluatorInsight || {};
    if (insight.keyStrength || insight.criticalFix) {
      const gridY = doc.y;
      const halfW = W / 2;
      const cellH = 56;

      // Key Strength cell
      doc.rect(M, gridY, halfW, cellH)
          .fillAndStroke(WH, BK);
      doc.font(FH).fontSize(10).fillColor(BK);
      doc.text("KEY STRENGTH", M + 8, gridY + 6,
          {width: halfW - 16});
      doc.font(FB).fontSize(10);
      doc.text(insight.keyStrength || "N/A", M + 8, gridY + 22,
          {width: halfW - 16, lineGap: 3});

      // Critical Fix cell (inverted)
      doc.rect(M + halfW, gridY, halfW, cellH)
          .fillAndStroke(BK, BK);
      doc.font(FH).fontSize(10).fillColor(WH);
      doc.text("CRITICAL FIX", M + halfW + 8, gridY + 6,
          {width: halfW - 16});
      doc.font(FB).fontSize(10);
      doc.text(insight.criticalFix || "N/A",
          M + halfW + 8, gridY + 22,
          {width: halfW - 16, lineGap: 3});

      doc.x = M;
      doc.y = gridY + cellH + 16;
    }

    // Strengths
    if (result.strengths && result.strengths.length > 0) {
      need(60);
      lbl("KEY STRENGTHS");
      doc.moveDown(0.3);
      result.strengths.forEach((s) => {
        need(24);
        body(`+ ${s}`);
        doc.moveDown(0.2);
      });
      doc.moveDown(0.5);
    }

    // Weaknesses
    if (result.weaknesses && result.weaknesses.length > 0) {
      need(60);
      lbl("KEY WEAKNESSES");
      doc.moveDown(0.3);
      result.weaknesses.forEach((w) => {
        need(24);
        body(`- ${w}`);
        doc.moveDown(0.2);
      });
    }

    // ========== PAGE 3: GAP ANALYSIS ==========
    doc.addPage();
    doc.y = M;
    secHdr(2, "GAP ANALYSIS");

    const gaps = result.gapAnalysis || [];
    if (gaps.length > 0) {
      lbl(`${gaps.length} GAP(S) IDENTIFIED`);
      doc.moveDown(0.8);

      gaps.forEach((gap) => {
        need(70);
        const barY = doc.y;

        // Requirement + status
        doc.font(FH).fontSize(10).fillColor(BK);
        const statusTag = (gap.status || "").toUpperCase();
        doc.text(
            `${gap.requirement || "REQUIREMENT"} [${statusTag}]`,
            M + 14, doc.y, {width: W - 14},
        );
        doc.moveDown(0.3);

        // Details
        doc.font(FB).fontSize(10).fillColor(BK);
        doc.text(gap.details || "", M + 14, doc.y, {
          width: W - 14, lineGap: 4,
        });

        // 4px vertical bar
        doc.rect(M, barY, 4, doc.y - barY).fill(BK);
        doc.moveDown(0.8);
      });
    } else {
      body("No significant gaps identified between the RFP " +
        "requirements and the proposal response.");
    }

    // Compliance Issues
    const compliance = result.complianceIssues || [];
    if (compliance.length > 0) {
      need(60);
      doc.moveDown(0.5);
      lbl(`COMPLIANCE ISSUES (${compliance.length})`);
      doc.moveDown(0.5);
      compliance.forEach((issue) => {
        need(24);
        body(`- ${issue}`);
        doc.moveDown(0.2);
      });
    }

    // ========== PAGE 4-5: DETAILED EVALUATION ==========
    doc.addPage();
    doc.y = M;
    secHdr(3, "DETAILED EVALUATION");

    const respVarOrder = [
      ["complianceCompleteness", "Compliance & Completeness", "20%"],
      ["customerFocus", "Customer Focus & Responsiveness", "15%"],
      ["technicalApproach", "Technical Solution & Approach", "25%"],
      ["experienceCredibility", "Experience & Credibility", "15%"],
      ["valueDifferentiators", "Value Proposition & Differentiators",
        "10%"],
      ["clarityOrganization", "Clarity & Organization", "10%"],
      ["presentationQuality", "Presentation & Professionalism", "5%"],
    ];

    const vs = result.variableScores || {};

    respVarOrder.forEach(([key, displayName, weight]) => {
      const v = vs[key];
      if (!v) return;

      need(80);

      // Variable header with dot leaders and grade
      const varGrade = v.grade || "N/A";
      const headerText = `${displayName.toUpperCase()} (${weight})`;
      doc.font(FH).fontSize(10).fillColor(BK);
      const textW = doc.widthOfString(headerText);
      const gradeW = doc.widthOfString(`[ ${varGrade} ]`);
      const dotsW = W - textW - gradeW - 10;
      const dots = dotsW > 20 ?
        " " + ".".repeat(Math.floor(dotsW / 4)) + " " : " ";

      doc.text(
          headerText + dots + `[ ${varGrade} ]`,
          M, doc.y, {width: W},
      );
      doc.moveDown(0.3);

      // Reasoning
      if (v.reasoning) {
        doc.font(FB).fontSize(10).fillColor(BK);
        doc.text(v.reasoning, M + 14, doc.y, {
          width: W - 14, lineGap: 4,
        });
        doc.moveDown(0.8);
      }
    });

    // ========== PAGE 6: RECOMMENDATIONS ==========
    doc.addPage();
    doc.y = M;
    secHdr(4, "RECOMMENDATIONS");

    const recs = result.recommendations || [];
    if (recs.length > 0) {
      recs.forEach((rec, i) => {
        need(70);
        const barY = doc.y;

        // Title with priority
        const priority = (rec.priority || "").toUpperCase();
        doc.font(FH).fontSize(10).fillColor(BK);
        doc.text(
            `${i + 1}. ${(rec.title || "").toUpperCase()}` +
            (priority ? ` [${priority}]` : ""),
            M + 14, doc.y, {width: W - 14},
        );
        doc.moveDown(0.3);

        // Description
        doc.font(FB).fontSize(10).fillColor(BK);
        doc.text(rec.description || "", M + 14, doc.y, {
          width: W - 14, lineGap: 4,
        });

        // 4px vertical bar
        doc.rect(M, barY, 4, doc.y - barY).fill(BK);
        doc.moveDown(0.8);
      });
    } else {
      body("No specific recommendations at this time.");
    }

    // ========== PAGE 7: EVALUATOR PERSPECTIVE ==========
    if (insight.overallImpression || insight.competitivePosition) {
      doc.addPage();
      doc.y = M;
      secHdr(5, "EVALUATOR PERSPECTIVE");

      if (insight.overallImpression) {
        lbl("OVERALL IMPRESSION");
        doc.moveDown(0.3);
        body(insight.overallImpression);
        doc.moveDown(0.8);
      }

      if (insight.competitivePosition) {
        need(60);
        lbl("COMPETITIVE POSITION");
        doc.moveDown(0.3);
        body(insight.competitivePosition);
        doc.moveDown(0.8);
      }

      // Two-column layout for key strength / critical fix
      if (insight.keyStrength || insight.criticalFix) {
        need(80);
        const colW = (W - 20) / 2;
        const colY = doc.y;

        // Vertical divider line
        doc.moveTo(M + colW + 10, colY)
            .lineTo(M + colW + 10, colY + 80)
            .lineWidth(2).strokeColor(BK).stroke();

        // Left column: Key Strength
        doc.font(FH).fontSize(10).fillColor(BK);
        doc.text("KEY STRENGTH", M, colY, {width: colW});
        doc.font(FB).fontSize(10);
        doc.text(insight.keyStrength || "N/A", M, colY + 16,
            {width: colW, lineGap: 4});

        // Right column: Critical Fix
        doc.font(FH).fontSize(10).fillColor(BK);
        doc.text("CRITICAL FIX", M + colW + 20, colY,
            {width: colW});
        doc.font(FB).fontSize(10);
        doc.text(insight.criticalFix || "N/A",
            M + colW + 20, colY + 16,
            {width: colW, lineGap: 4});

        doc.x = M;
        doc.y = colY + 90;
      }
    }

    doc.end();
  });
};


// Main handler function with multer middleware
const gradeRfpHandler = async (req, res) => {
  // CORS headers are set in the wrapper function above

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
      details: "This endpoint only accepts POST requests",
    });
  }

  // Validate required secrets are configured
  const requiredSecrets = {
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  };

  const missingSecrets = Object.entries(requiredSecrets)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

  if (missingSecrets.length > 0) {
    logger.error(`Missing required secrets: ${missingSecrets.join(", ")}`);
    return res.status(500).json({
      error: "Server configuration incomplete",
      details: `Missing secrets: ${missingSecrets.join(", ")}.` +
        " Please contact support.",
      missingSecrets: missingSecrets,
    });
  }

  logger.info("All required secrets are configured");

  // Extract form fields and files from JSON body
  const {email, mode, rfpFiles, responseFiles} = req.body;

  try {
    logger.info(
        `Received RFP grading request - Email: ${email}, Mode: ${mode}`);
    logger.info(
        `RFP Files: ${(rfpFiles && rfpFiles.length) || 0}, ` +
      `Response Files: ${(responseFiles && responseFiles.length) || 0}`);

    if (!email || !mode) {
      return res.status(400).json({error: "Email and mode are required"});
    }

    if (!rfpFiles || rfpFiles.length === 0) {
      return res.status(400).json(
          {error: "At least one RFP file is required"});
    }

    if (mode === "response" && (!responseFiles || responseFiles.length === 0)) {
      return res.status(400).json(
          {error: "Response files are required in response mode"});
    }

    // Process files: convert DOCX to PDF, then upload to Cloud Storage
    const uploadedFiles = {rfp: [], response: []};

    /**
     * Process a single file: convert DOCX to PDF if needed,
     * upload to Cloud Storage
     * @param {Object} file - File object with content, name, and mimeType
     * @return {Promise<Object>} Object with fileUri and mimeType
     */
    const processFile = async (file) => {
      let fileContent = file.content; // base64
      let fileName = file.name;
      let mimeType = file.mimeType;

      // If DOCX, convert to PDF first
      if (fileName.toLowerCase().endsWith(".docx")) {
        logger.info(`Converting DOCX file to PDF: ${fileName}`);
        const conversionResponse = await fetch(CONVERTER_URL, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            content: fileContent,
            fileName: fileName,
          }),
        });

        if (!conversionResponse.ok) {
          throw new Error(
              `Conversion failed: ${conversionResponse.statusText}`);
        }

        const converted = await conversionResponse.json();
        fileContent = converted.content; // PDF as base64
        fileName = converted.fileName; // .pdf extension
        mimeType = converted.mimeType; // application/pdf
        logger.info(`Conversion successful: ${fileName}`);
      }

      // Upload to Cloud Storage
      const timestamp = Date.now();
      const storagePath = `rfp-uploads/${timestamp}/${fileName}`;
      const bucket = storage.bucket(bucketName);
      const fileRef = bucket.file(storagePath);

      logger.info(`Uploading file to Cloud Storage: ${storagePath}`);
      await fileRef.save(Buffer.from(fileContent, "base64"), {
        metadata: {contentType: mimeType},
      });

      const gsUri = `gs://${bucketName}/${storagePath}`;
      logger.info(`File uploaded successfully: ${gsUri}`);

      return {
        fileUri: gsUri,
        mimeType: mimeType,
      };
    };

    // Process RFP files
    for (const file of rfpFiles || []) {
      const processed = await processFile(file);
      uploadedFiles.rfp.push(processed);
    }

    // Process response files if in response mode
    if (mode === "response" && responseFiles) {
      for (const file of responseFiles) {
        const processed = await processFile(file);
        uploadedFiles.response.push(processed);
      }
    }

    // Grade based on mode
    let gradingResult;

    if (mode === "rfp") {
      // MULTI-PASS GRADING: 15 parallel API calls for robust analysis
      logger.info("Using multi-pass grading architecture (15 API calls)");
      gradingResult = await gradeRfpMultiPass(uploadedFiles.rfp, genAI);
    } else {
      // RESPONSE MODE: Multi-pass grading (8 API calls)
      logger.info("Using multi-pass grading for response mode (8 API calls)");
      gradingResult = await gradeResponseMultiPass(
          uploadedFiles.rfp, uploadedFiles.response, genAI);
    }

    // Generate email HTML
    const emailHtml = generateRFPGradeEmail(gradingResult, mode);

    // Generate PDF report for both modes
    let pdfBuffer = null;
    try {
      logger.info(`Generating PDF report (${mode} mode)...`);
      if (mode === "rfp") {
        pdfBuffer = await generateRFPGradePDF(gradingResult);
      } else {
        pdfBuffer = await generateResponseGradePDF(gradingResult);
      }
      logger.info(`PDF generated: ${pdfBuffer.length} bytes`);
    } catch (pdfError) {
      logger.error("PDF generation failed:", pdfError);
      // Continue without PDF - email still sends
    }

    // Send email to user (with PDF attachment if available)
    const userMailOptions = {
      from: `Propagent RFP Grader <${process.env.EMAIL_USER}>`,
      to: email,
      subject: mode === "rfp" ?
        `RFP Intelligence Report: Grade ${gradingResult.grade}` :
        `Proposal Evaluation Report: Grade ${gradingResult.grade}`,
      html: emailHtml,
      attachments: pdfBuffer ? [{
        filename: mode === "rfp" ?
          `RFP-Intelligence-Report-${gradingResult.grade}.pdf` :
          `Proposal-Evaluation-Report-${gradingResult.grade}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }] : [],
    };

    await transporter.sendMail(userMailOptions);
    logger.info(`Results email sent to user: ${email}`);

    // Send notification to internal team (with PDF if available)
    const internalMailOptions = {
      from: `Propagent RFP Grader <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New ${mode === "rfp" ? "RFP" : "Response"} ` +
        `Grading Request - Grade ${gradingResult.grade}`,
      html: `
        <h2>New RFP Grading Request Processed</h2>
        <p><strong>User Email:</strong> ${email}</p>
        <p><strong>Mode:</strong> ${mode === "rfp" ?
          "RFP Grader" : "Response Grader"}</p>
        <p><strong>Grade:</strong> ${gradingResult.grade}</p>
        <p><strong>Files Uploaded:</strong>
          ${((rfpFiles && rfpFiles.length) || 0) +
            ((responseFiles && responseFiles.length) || 0)}</p>
        <hr>
        ${emailHtml}
      `,
      attachments: pdfBuffer ? [{
        filename: mode === "rfp" ?
          `RFP-Intelligence-Report-${gradingResult.grade}.pdf` :
          `Proposal-Evaluation-Report-${gradingResult.grade}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }] : [],
    };

    await transporter.sendMail(internalMailOptions);
    logger.info("Notification sent to internal team");

    return res.status(200).json({
      message: "Your submission has been analyzed successfully. " +
        "Results have been sent to your email.",
      grade: gradingResult.grade,
    });
  } catch (error) {
    logger.error("Error processing RFP grading request:", error);

    return res.status(500).json({
      error: "Failed to process your request. Please try again.",
      details: error.message,
    });
  }
};

// Wrapper to set CORS headers and handle requests
const gradeRfp = async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
      details: "This endpoint only accepts POST requests",
    });
  }

  // Call the main handler
  return gradeRfpHandler(req, res);
};

const options = {
  secrets: ["EMAIL_USER", "EMAIL_PASS", "GEMINI_API_KEY"],
  timeoutSeconds: 540,
  memory: "1GiB",
  maxInstances: 10,
};

exports.gradeRfp = onRequest(options, gradeRfp);
