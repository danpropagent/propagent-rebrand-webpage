const {GoogleGenAI} = require("@google/genai");
const {Storage} = require("@google-cloud/storage");
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const nodemailer = require("nodemailer");

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

// System Prompt A: RFP Grader (Construction-Focused)
const RFP_GRADER_PROMPT = `You are an expert Construction Procurement
Consultant. Your task is to grade the attached Request for Proposal (RFP)
based on the following comprehensive 7-dimension rubric for construction
RFPs.

GRADING FRAMEWORK: Evaluate across these 7 critical dimensions:
1. Purpose, Outcomes, and Project Context
2. Scope of Work and Deliverables Precision
3. Technical Requirements, Drawings, and Information Sufficiency
4. Schedule Realism and Milestones
5. Submission Instructions and Format Clarity
6. Evaluation Criteria Transparency
7. Internal Consistency Between Requirements, Instructions, and Evaluation

DETAILED RUBRIC DEFINITIONS (A-F Scale):

═══════════════════════════════════════════════════════
DIMENSION 1: Purpose, Outcomes, and Project Context
═══════════════════════════════════════════════════════

Grade A (90-100%):
- Crystal-clear purpose statement explaining WHY the project exists
- Specific, measurable desired outcomes with quantified targets
- Rich project context including background, history, stakeholders,
  strategic importance
- Explains the problem/need driving the project
- Provides regulatory or compliance context if applicable
- Cohesive narrative that motivates bidders and aligns them with goals

Grade B (80-89%):
- Clear purpose and goals stated, but with slightly less detail
- Outcomes mentioned but not all are quantified
- Good context provided but may omit some nuances
- Bidders can understand what is needed and why, though not as comprehensive

Grade C (70-79%):
- Some purpose statement but vague or incomplete
- Minimal context (a sentence or two) with little detail
- Outcomes not clearly defined or lacking specificity
- Bidders can infer basics but may not fully grasp significance

Grade D (60-69%):
- Purpose and outcomes unclear or conflicting
- Little to no project context given
- May merely repeat project title without explaining rationale
- Bidders confused about the driving vision

Grade F (Below 60%):
- Fails to communicate project purpose or outcomes
- Jumps to specs without contextualization
- Leaves bidders completely in the dark about the big picture
- May state "outcome: TBD" or "context: N/A"

═══════════════════════════════════════════════════════
DIMENSION 2: Scope of Work and Deliverables Precision
═══════════════════════════════════════════════════════

Grade A (90-100%):
- Unambiguous, thorough Scope of Work (SOW) with detailed task breakdown
- Each major task and sub-task clearly enumerated
- Specific deliverables listed with acceptance criteria
- Quantities, standards, locations specified
- Scope boundaries defined (what's included and excluded)
- Leaves virtually no guesswork for bidders

Grade B (80-89%):
- Well-defined scope with major tasks and deliverables listed
- A few minor specifics may be absent but core requirements clear
- Little ambiguity about main requirements
- Contractors may need clarification on secondary details

Grade C (70-79%):
- Moderately clear but incomplete scope
- General idea of work conveyed but important details missing
- Quantities or specific tasks not fully defined
- Deliverables vague or mentioned in passing
- Bidders must make assumptions

Grade D (60-69%):
- Highly vague or inconsistent scope
- Key components missing or overly broad language
- Deliverables not clearly identified
- May use phrases like "do all necessary work" without detail
- High risk of scope creep

Grade F (Below 60%):
- Practically no usable scope information
- May state "scope: TBD by contractor" or
  "contractor to determine all requirements"
- Contradictory or fragmented information
- Untenable situation for bidders

═══════════════════════════════════════════════════════
DIMENSION 3: Technical Requirements, Drawings, & Information
═══════════════════════════════════════════════════════

Grade A (90-100%):
- Comprehensive technical documentation provided
- Complete drawings (plans, elevations, sections) at appropriate design level
- Detailed specifications with referenced standards (IBC, ACI, ASTM, etc.)
- Site data included (surveys, geotechnical reports, utility maps)
- No significant information gaps
- Clear statement of applicable codes and standards
- Bidders have complete technical picture

Grade B (80-89%):
- Most key technical information provided
- Drawings and specs present though a few minor details may be missing
- Core requirements stated, some details implied
- Missing pieces are not deal-breakers for experienced bidders

Grade C (70-79%):
- Some technical information but with notable gaps
- Perhaps only conceptual sketches or outline specs
- Critical site data missing or generic statements used
- Bidders must make conservative assumptions or request information

Grade D (60-69%):
- Seriously lacking or confusing technical information
- Key drawings or specs missing
- Contradictions between documents
  (e.g., spec says one thing, drawing shows another)
- Bidders would need to conduct own investigations to bid

Grade F (Below 60%):
- Virtually no usable technical information
- Zero drawings for complex construction project
- No specifications beyond "build to code"
- Critical details (dimensions, capacities, conditions) omitted
- May explicitly state "no site data will be provided"

═══════════════════════════════════════════════════════
DIMENSION 4: Schedule Realism and Milestones
═══════════════════════════════════════════════════════

Grade A (90-100%):
- Clear, feasible schedule aligned with project complexity
- Key milestones and dates in logical sequence
- Rationale provided for any aggressive deadlines
- May include Gantt chart or detailed timeline table
- Reasonable time for bidding and proposal preparation
- If firm deadlines exist, they are explained and justified

Grade B (80-89%):
- Generally reasonable schedule though possibly tight
- Final completion date and some interim milestones provided
- Schedule seems achievable with efficient work
- Adequate bidding timeframe

Grade C (70-79%):
- Schedule mentioned but somewhat ambiguous or questionable
- May specify completion date without considering realistic timeline
- Interim milestones may be omitted
- Schedule information scattered or not clearly communicated

Grade D (60-69%):
- Unrealistic or very unclear schedule
- Overly aggressive timeline given scope
- May have contradictory schedule information in different sections
- Very short bidding window
- Qualified bidders likely to be deterred

Grade F (Below 60%):
- No schedule guidance for time-sensitive project OR
- Completely impossible timeline showing lack of understanding
- May require proposal, award, and completion in absurdly short span
- Examples: "all work in 30 days regardless of size" or
  "proposals due 1 day after Q&A"

═══════════════════════════════════════════════════════
DIMENSION 5: Submission Instructions and Format Clarity
═══════════════════════════════════════════════════════

Grade A (90-100%):
- Very clear, concise, well-organized submission instructions
- Specifies exact proposal structure (Section 1: X, Section 2: Y, etc.)
- States format requirements (PDF, page limits, fonts if applicable)
- Clear submission procedure (portal, address, deadline with time zone)
- All required forms and documents enumerated
- No ambiguity about how to prepare and deliver proposal

Grade B (80-89%):
- Generally clear instructions with minor issues
- What to include and how to submit is stated
- May have one or two details that could be clearer
- Diligent bidders can figure out requirements without questions

Grade C (70-79%):
- Instructions exist but lack clarity or completeness
- Some formatting details unclear
- May have contradictory instructions (e.g., email vs portal)
- Due date or time zone may be ambiguous
- Room for misinterpretation

Grade D (60-69%):
- Confusing, contradictory, or seriously incomplete instructions
- May fail to specify where/how to submit
- Conflicting directions in different sections
- Overly complicated format rules that seem unnecessary
- Risk of disqualification due to unclear requirements

Grade F (Below 60%):
- No clear submission instructions OR
- Instructions so erroneous bidders likely to miss the mark
- May not state due date/time or submission method
- Could have wrong contact information or past dates
- Essentially forgot to include instructions

═══════════════════════════════════════════════════════
DIMENSION 6: Evaluation Criteria Transparency
═══════════════════════════════════════════════════════

Grade A (90-100%):
- Clearly outlines all evaluation criteria with weights/percentages
- Each criterion well-described so bidders know what evaluators seek
- States evaluation method (point scoring, committee review)
- Award basis clearly stated (best value vs lowest price)
- Complete transparency - no guesswork required
- May include scoring formulas or examples

Grade B (80-89%):
- Evaluation criteria listed, though may lack explicit weights
- Bidders can discern important factors
- Mostly transparent, just not as detailed as Grade A
- Playing field is clear enough for vendors

Grade C (70-79%):
- Mentions some evaluation considerations but vague
- May use boilerplate like "most advantageous to Owner"
- Criteria listed but imprecise or incomplete
- General sense of factors but not clear picture of weighting

Grade D (60-69%):
- Little to no clarity on evaluation
- May be completely silent on criteria
- Could hint at factors not actually used or vice versa
- Lack of transparency suggests arbitrary decision-making

Grade F (Below 60%):
- Hides criteria or states "sole discretion based on secret factors"
- Misleading or self-contradictory statements
- May introduce criteria after proposals without informing bidders
- Essentially refuses to tell bidders how they'll be judged

═══════════════════════════════════════════════════════
DIMENSION 7: Internal Consistency
═══════════════════════════════════════════════════════

Grade A (90-100%):
- Fully internally consistent across all sections
- Every major requirement reflected in proposal instructions and evaluation
- No conflicting statements or numbers
- May include compliance matrix or cross-reference chart
- Tight alignment between scope, instructions, and criteria

Grade B (80-89%):
- Mostly consistent with only minor lapses
- Perhaps 95% of requirements align properly
- One small element may be missing from instructions or criteria
- No blatant contradictions, just subtle misalignments

Grade C (70-79%):
- Some inconsistencies present
- Requirements, instructions, or evaluation may not fully align
- Bidders notice disconnects but can still respond
- May have contradictory dates or requirements in different sections

Grade D (60-69%):
- Significant inconsistencies throughout
- Requirements don't match what's asked in proposals
- Evaluation criteria include items never mentioned
- Contradictory information common
- Suggests poor document coordination

Grade F (Below 60%):
- Severe internal contradictions rendering RFP confusing or unusable
- Major requirements conflict across sections
- Instructions, scope, and evaluation completely misaligned
- Document appears cobbled from multiple sources without integration

═══════════════════════════════════════════════════════

ANALYSIS INSTRUCTIONS:
1. Evaluate the RFP across all 7 dimensions
2. Assign an overall Letter Grade (A-F) and numeric score (0-100)
3. The overall grade should reflect performance across all dimensions,
   with particular weight on:
   - Scope precision (Dimension 2) - critical for avoiding disputes
   - Technical information (Dimension 3) - prevents costly surprises
   - Evaluation transparency (Dimension 6) - ensures fair competition
4. Provide specific, actionable feedback

OUTPUT FORMAT (JSON):
{
  "grade": "B+",
  "score": 87,
  "executiveSummary": "2-3 sentence executive summary of overall RFP quality",
  "dimensionScores": {
    "purposeAndContext": 85,
    "scopePrecision": 90,
    "technicalInfo": 88,
    "scheduleRealism": 82,
    "submissionClarity": 90,
    "evaluationTransparency": 85,
    "internalConsistency": 88
  },
  "strengths": [
    "Specific strength with dimension reference",
    "Another strength",
    "Third strength"
  ],
  "weaknesses": [
    "Critical weakness with dimension reference",
    "Another weakness",
    "Third weakness"
  ],
  "examples": [
    "Specific quote or reference from document illustrating an issue",
    "Another example if applicable"
  ],
  "improvements": [
    {
      "title": "Improvement for Dimension X",
      "description": "Detailed, actionable recommendation"
    },
    {
      "title": "Improvement for Dimension Y",
      "description": "Detailed, actionable recommendation"
    },
    {
      "title": "Improvement for Dimension Z",
      "description": "Detailed, actionable recommendation"
    }
  ]
}`;

// System Prompt B: Response Grader (Construction Proposal Evaluation)
const RESPONSE_GRADER_PROMPT = `You are a Senior RFP
Evaluator following APMP standards. You have been provided with:
1. The RFP Requirements (Source of Truth)
2. The Vendor's Proposal Response (Target to Grade)

TASK: Evaluate the proposal's quality across 12 critical success
dimensions for construction proposals.

GRADING FRAMEWORK: Evaluate across these 6 dimensions:
1. Compliance & Completeness
2. Client Focus & Responsiveness
3. Technical Solution & Project Approach
4. Differentiators & Value Proposition
5. Experience & Team Qualifications
6. Clarity & Presentation Quality

DETAILED RUBRIC DEFINITIONS (A-F Scale):

═══════════════════════════════════════════════════════
DIMENSION 1: Compliance & Completeness
═══════════════════════════════════════════════════════

Grade A (90-100%):
- 100% compliant with all RFP requirements
- All required sections, forms, and attachments included and
  properly filled
- Format strictly follows instructions (page limits, layout, numbering)
- Includes compliance matrix cross-referencing every RFP clause
- Evaluators find zero compliance issues

Grade B (80-89%):
- Minor omissions or trivial deviations
- 99% of requirements met
- Small formatting guideline overlooked or form signed by wrong person
- Issues are not fatal and easily correctable

Grade C (70-79%):
- Some compliance issues present
- Section only partially addressed or minor required document missing
- Noticeable formatting issues
- Could lower score or require clarification

Grade D (60-69%):
- Multiple compliance gaps
- Several instructions ignored: missing sections, exceeding page limits,
  not following outline
- Scores very low on compliance and professionalism
- May still be evaluated if not disqualifying

Grade F (Below 60%):
- Non-compliant to point of rejection
- Flagrant violation of RFP requirements
- Missing mandatory items (bid bond, cost proposal, security deposit)
- Submitted late or so incomplete it cannot be evaluated

═══════════════════════════════════════════════════════
DIMENSION 2: Client Focus & Responsiveness
═══════════════════════════════════════════════════════

Grade A (90-100%):
- Highly customer-focused and tailored to specific client/project
- Directly addresses stated and implied client needs throughout
- Uses client's language and terms
- Maps solution to each client objective
- Demonstrates understanding of explicit and implicit needs
- Client feels "they heard us"

Grade B (80-89%):
- Generally responsive with minor lapses
- Solid understanding with some specific references to client/project
- Addresses major concerns
- A few sections may feel slightly generic
- Bidder clearly did homework on client

Grade C (70-79%):
- Some client focus mixed with generic content
- Partial project understanding
- Basic coverage but much text could apply to any client
- Doesn't fully reference unique project challenges
- Not fully convinced bidder grasps project nuances

Grade D (60-69%):
- Mostly generic, barely addresses client specifics
- Little insight into client needs
- Reads like stock proposal with project name plugged in
- Key client concerns glossed over or not addressed
- Fails to answer "Why us for this client?"

Grade F (Below 60%):
- Not responsive; ignores client priorities
- Could be for completely different project
- May reference wrong client or project name
- Completely misses what client asked for
- Very low technical score or outright elimination

═══════════════════════════════════════════════════════
DIMENSION 3: Technical Solution & Project Approach
═══════════════════════════════════════════════════════

Grade A (90-100%):
- Outstanding and credible comprehensive project approach
- Deep understanding of technical challenges with clear solutions
- Detailed, achievable schedule with key milestones and buffer
- Construction methodology tailored to specific site/project
- Risks identified with mitigation strategies
- May include innovative solutions with past project validation
- Graphics like phasing diagrams or Gantt charts included
- Addresses site-specific challenges explicitly
- Earns top technical evaluation marks

Grade B (80-89%):
- Solid approach with minor weaknesses
- Detailed, sound plan addressing all major elements
- Reasonable schedule and proven methods
- All required plans provided (safety, quality, staffing)
- May lack some optimization or minor detail
- Client would have confidence in execution

Grade C (70-79%):
- Acceptable but lacks depth
- Covers basics with limited detail or generic methods
- May have minor inconsistencies (e.g., schedule vs narrative mismatch)
- No "wow" factor or clear differentiation
- States standard practices any contractor would do
- Technically addresses requirements but mostly policy-level

Grade D (60-69%):
- Unconvincing or incomplete approach
- Significant gaps (no clear schedule, one-paragraph safety plan)
- May be unrealistic (aggressive schedule without explanation)
- Fails to address critical constraints
- Raises credibility concerns
- High perceived performance risk

Grade F (Below 60%):
- Inadequate or infeasible approach
- So insufficient would not meet requirements or puts project at risk
- Ignores fundamental scope aspects
- Proposes non-compliant methods with industry standards
- No real plan - just marketing fluff
- Lacks schedule entirely or uses unproven methods

═══════════════════════════════════════════════════════
DIMENSION 4: Differentiators & Value Proposition
═══════════════════════════════════════════════════════

Grade A (90-100%):
- Compelling and unique value proposition
- Clear win themes consistently highlighted throughout
- Truly differentiating factors (not generic claims)
- Specific, quantified benefits with proof
- Uses feature→benefit→proof structure
- Executive summary answers "Why us?" persuasively
- Unique strengths jump off the page

Grade B (80-89%):
- Clear differentiators, moderately persuasive
- Identifies relevant key strengths
- Value proposition present though not sharply quantified
- Differentiators add value (e.g., great safety record, experienced team)
- Convincing but not exceptional

Grade C (70-79%):
- Some strengths mentioned but not differentiated
- Lists qualifications without translating to value proposition
- Generic claims ("highly qualified team") without evidence
- No unifying win theme tailored to client
- Firm is capable but no clear unique value

Grade D (60-69%):
- No clear differentiators; "me-too" proposal
- Fails to articulate any meaningful advantage
- Just compliant response with resumes and project lists
- Vague, unsupported claims ("best quality")
- No persuasive angle evident

Grade F (Below 60%):
- Detracting factors or false claims present
- Reveals weaknesses or makes clearly untrue claims
- Lists notorious past failures without addressing lessons
- Makes impossible promises undermining trust
- Gives reasons NOT to choose them

═══════════════════════════════════════════════════════
DIMENSION 5: Experience & Team Qualifications
═══════════════════════════════════════════════════════

Grade A (90-100%):
- Highly qualified team with exemplary relevant experience
- Multiple successful past projects of similar scope/size with data
- Performance metrics beat industry benchmarks
- Key personnel have done very similar projects
- Required licenses/certifications met and exceeded
- May highlight awards or special distinctions
- Dream team with track record indicating success

Grade B (80-89%):
- Very good qualifications with minor gaps
- Strong general experience including some relevant projects
- Key staff have substantial experience
- One role might be slightly less experienced but competent
- May be larger/smaller scale than past but shows understanding
- Evaluators confident with slight reservation

Grade C (70-79%):
- Acceptable experience meeting minimum requirements
- Related but not exact project types or smaller scale
- Required roles filled but some with limited direct experience
- Lists projects without elaborating on outcomes
- Not unqualified but not standout
- Passes threshold but won't impress

Grade D (60-69%):
- Limited or irrelevant experience; team weaknesses
- Projects of completely different type or much smaller scale
- Firm may be new with few projects
- Team resumes show spotty records or lack key expertise
- Raises doubts about capacity
- Hard to overcome if RFP weights experience heavily

Grade F (Below 60%):
- Non-compliant qualifications or demonstrably insufficient
- Does not meet minimum experience requirements
- Proposal reveals disqualifying lack of qualifications
- Key personnel lack required licenses
- Known track record of failures not addressed
- Company never done remotely similar work

═══════════════════════════════════════════════════════
DIMENSION 6: Clarity & Presentation Quality
═══════════════════════════════════════════════════════

Grade A (90-100%):
- Extremely clear, well-organized, and polished
- Reader-friendly and professional
- Coherent outline mirroring RFP sections
- Helpful elements: TOC, section dividers, compliance matrix
- Concise writing free of jargon (or explained)
- No typos or grammatical errors
- Visual aids used appropriately with captions
- Descriptive headings incorporating win themes
- Highly professional attention to detail

Grade B (80-89%):
- Clear and well-presented with minor issues
- Easy to read and well-formatted
- Mostly clear writing with few minor awkward phrases or typos
- Professional appearance though not "designer" level
- Adheres to format and page limits
- Can find information without much effort

Grade C (70-79%):
- Adequate clarity but room for improvement
- Communicates necessary information but not smoothly
- Some organizational issues (sections out of order, topic mixing)
- Generally understandable but long-winded or repetitive
- Minor grammar mistakes
- Acceptable but inconsistent formatting
- Some typos or editing errors
- Doesn't impair evaluation but doesn't impress

Grade D (60-69%):
- Unclear writing or disorganized format hampering readability
- Disjointed with no clear RFP-aligned structure
- Verbose, rambling, or filled with unexplained jargon
- Noticeable spelling/grammar/formatting errors
- May lack TOC or have one not matching content
- Copy-paste errors (wrong project name referenced)
- Frustrates evaluators; may miss key points

Grade F (Below 60%):
- Chaotic, incomprehensible, or non-professional
- Extremely poor presentation raising professionalism doubts
- No logical order, missing section headings
- Confusing figures, extensive typos
- Content in wrong places
- May be handwritten scans or unformatted text dumps
- Breaks all formatting rules
- Could trigger compliance rejection

═══════════════════════════════════════════════════════

ANALYSIS INSTRUCTIONS:
1. Evaluate the proposal across all 6 dimensions against the RFP requirements
2. Assign an overall Letter Grade (A-F) and numeric score (0-100)
3. The overall grade should reflect performance across all dimensions,
   with particular weight on:
   - Compliance (Dimension 1) - foundational; non-compliance can
     disqualify
   - Technical approach (Dimension 3) - often 70-80% of evaluation
     weight
   - Experience (Dimension 5) - proves capability
4. Perform detailed gap analysis identifying missing or insufficient
   responses
5. Assess compliance with mandatory requirements
6. Provide specific, actionable recommendations for improvement

OUTPUT FORMAT (JSON):
{
  "grade": "B+",
  "score": 87,
  "executiveSummary": "2-3 sentence executive summary of overall
proposal quality and alignment with RFP",
  "dimensionScores": {
    "complianceCompleteness": 90,
    "clientFocus": 85,
    "technicalApproach": 88,
    "differentiators": 82,
    "experienceQualifications": 90,
    "clarityPresentation": 88
  },
  "strengths": [
    "Specific strength with dimension reference (e.g., 'Excellent
compliance with all format requirements - Dimension 1')",
    "Another strength with evidence",
    "Third strength"
  ],
  "weaknesses": [
    "Critical weakness with dimension reference and impact",
    "Another weakness",
    "Third weakness"
  ],
  "gapAnalysis": [
    {
      "requirement": "RFP Section X.Y - Safety Plan",
      "status": "Missing",
      "details": "RFP requires detailed site-specific safety plan with
OSHA compliance. Proposal provides only generic safety policy statement."
    },
    {
      "requirement": "RFP Section X.Z - Schedule",
      "status": "Incomplete",
      "details": "Proposal provides overall timeline but missing interim
milestones and critical path analysis requested in RFP Section 3.4."
    }
  ],
  "complianceIssues": [
    "Missing required Attachment A (Bid Bond Certificate)",
    "Exceeds 50-page limit by 12 pages",
    "Project manager resume does not show required 15 years experience
(shows only 10)"
  ],
  "recommendations": [
    {
      "title": "Strengthen Technical Approach (Dimension 3)",
      "description": "Add detailed phasing plan with Gantt chart showing
how you'll maintain facility operations during construction. Reference RFP
Section 3.2 requirement."
    },
    {
      "title": "Enhance Differentiators (Dimension 4)",
      "description": "Quantify your value proposition. Instead of stating
'excellent safety record,' provide specific metrics: 'Zero lost-time
incidents over 500,000 work hours' with comparison to industry average."
    },
    {
      "title": "Address Compliance Gaps (Dimension 1)",
      "description": "Include all required attachments and forms. Create
compliance matrix cross-referencing each RFP requirement to proposal
response page."
    }
  ]
}`;

// Helper function to generate email HTML from grading results
const generateRFPGradeEmail = (result, mode) => {
  const gradeColor = result.score >= 90 ? "#22c55e" :
                    result.score >= 80 ? "#3b82f6" :
                    result.score >= 70 ? "#eab308" :
                    result.score >= 60 ? "#f97316" : "#ef4444";

  if (mode === "rfp") {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Arial', sans-serif; line-height: 1.6;
           color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #b026ff 0%,
              #00f0ff 100%); color: white; padding: 30px;
              text-align: center; border-radius: 10px 10px 0 0; }
    .grade-badge { font-size: 72px; font-weight: bold;
                   margin: 20px 0; color: ${gradeColor}; }
    .score { font-size: 24px; color: #666; }
    .section { background: #f9f9f9; padding: 20px; margin: 20px 0;
               border-radius: 8px; }
    .section-title { font-size: 20px; font-weight: bold;
                     color: #b026ff; margin-bottom: 10px; }
    .list-item { background: white; padding: 12px; margin: 8px 0;
                 border-left: 4px solid #00f0ff;
                 border-radius: 4px; }
    .improvement { background: white; padding: 15px; margin: 10px 0;
                   border-radius: 6px;
                   border: 2px solid #b026ff; }
    .improvement-title { font-weight: bold; color: #b026ff;
                         margin-bottom: 8px; }
    .footer { text-align: center; padding: 20px; color: #666;
              font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>RFP Grading Results</h1>
      <div class="grade-badge">${result.grade}</div>
      <div class="score">Score: ${result.score}/100</div>
    </div>

    <div class="section">
      <div class="section-title">Executive Summary</div>
      <p>${result.executiveSummary}</p>
    </div>

    <div class="section">
      <div class="section-title">Strengths</div>
      ${result.strengths.map((s) =>
    `<div class="list-item">${s}</div>`).join("")}
    </div>

    <div class="section">
      <div class="section-title">Weaknesses</div>
      ${result.weaknesses.map((w) =>
    `<div class="list-item">${w}</div>`).join("")}
    </div>

    ${result.examples && result.examples.length > 0 ? `
    <div class="section">
      <div class="section-title">Specific Examples</div>
      ${result.examples.map((e) =>
  `<div class="list-item">${e}</div>`).join("")}
    </div>
    ` : ""}

    <div class="section">
      <div class="section-title">Recommended Improvements</div>
      ${result.improvements.map((imp) => `
        <div class="improvement">
          <div class="improvement-title">${imp.title}</div>
          <div>${imp.description}</div>
        </div>
      `).join("")}
    </div>

    <div class="footer">
      <p>Powered by Propagent AI RFP Grader</p>
      <p>This analysis was generated using advanced AI technology</p>
    </div>
  </div>
</body>
</html>
    `;
  } else {
    // Response mode
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Arial', sans-serif; line-height: 1.6;
           color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #b026ff 0%,
              #00f0ff 100%); color: white; padding: 30px;
              text-align: center; border-radius: 10px 10px 0 0; }
    .grade-badge { font-size: 72px; font-weight: bold;
                   margin: 20px 0; color: ${gradeColor}; }
    .score { font-size: 24px; color: #666; }
    .section { background: #f9f9f9; padding: 20px; margin: 20px 0;
               border-radius: 8px; }
    .section-title { font-size: 20px; font-weight: bold;
                     color: #b026ff; margin-bottom: 10px; }
    .list-item { background: white; padding: 12px; margin: 8px 0;
                 border-left: 4px solid #00f0ff;
                 border-radius: 4px; }
    .gap-item { background: white; padding: 15px; margin: 10px 0;
                border-radius: 6px;
                border-left: 4px solid #ef4444; }
    .gap-requirement { font-weight: bold; color: #ef4444; }
    .gap-status { display: inline-block; padding: 4px 12px;
                  background: #fee; color: #c00; border-radius: 12px;
                  font-size: 12px; margin: 8px 0; }
    .recommendation { background: white; padding: 15px;
                      margin: 10px 0; border-radius: 6px;
                      border: 2px solid #b026ff; }
    .recommendation-title { font-weight: bold; color: #b026ff;
                            margin-bottom: 8px; }
    .footer { text-align: center; padding: 20px; color: #666;
              font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>RFP Response Grading Results</h1>
      <div class="grade-badge">${result.grade}</div>
      <div class="score">Score: ${result.score}/100</div>
    </div>

    <div class="section">
      <div class="section-title">Executive Summary</div>
      <p>${result.executiveSummary}</p>
    </div>

    <div class="section">
      <div class="section-title">Strengths</div>
      ${result.strengths.map((s) =>
    `<div class="list-item">${s}</div>`).join("")}
    </div>

    <div class="section">
      <div class="section-title">Weaknesses</div>
      ${result.weaknesses.map((w) =>
    `<div class="list-item">${w}</div>`).join("")}
    </div>

    ${result.gapAnalysis && result.gapAnalysis.length > 0 ? `
    <div class="section">
      <div class="section-title">Gap Analysis</div>
      ${result.gapAnalysis.map((gap) => `
        <div class="gap-item">
          <div class="gap-requirement">${gap.requirement}</div>
          <div class="gap-status">${gap.status}</div>
          <div>${gap.details}</div>
        </div>
      `).join("")}
    </div>
    ` : ""}

    ${result.complianceIssues && result.complianceIssues.length > 0 ? `
    <div class="section">
      <div class="section-title">Compliance Issues</div>
      ${result.complianceIssues.map((issue) =>
  `<div class="list-item">${issue}</div>`).join("")}
    </div>
    ` : ""}

    <div class="section">
      <div class="section-title">Recommendations</div>
      ${result.recommendations.map((rec) => `
        <div class="recommendation">
          <div class="recommendation-title">${rec.title}</div>
          <div>${rec.description}</div>
        </div>
      `).join("")}
    </div>

    <div class="footer">
      <p>Powered by Propagent AI RFP Grader</p>
      <p>This analysis was generated using advanced AI technology</p>
    </div>
  </div>
</body>
</html>
    `;
  }
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

    // Construct the prompt based on mode
    const systemPrompt = mode === "rfp" ?
      RFP_GRADER_PROMPT : RESPONSE_GRADER_PROMPT;

    // Build content parts with gs:// URIs
    const contentParts = [];

    // Add RFP files
    for (const file of uploadedFiles.rfp) {
      contentParts.push({
        fileData: {
          fileUri: file.fileUri, // gs://bucket/path format
          mimeType: file.mimeType,
        },
      });
    }

    // Add separator and response files if in response mode
    if (mode === "response") {
      contentParts.push(
          {text: "\n\n--- VENDOR RESPONSE DOCUMENTS BELOW ---\n\n"});

      for (const file of uploadedFiles.response) {
        contentParts.push({
          fileData: {
            fileUri: file.fileUri, // gs://bucket/path format
            mimeType: file.mimeType,
          },
        });
      }
    }

    // Add system prompt as text at the end with explicit JSON instruction
    contentParts.push({
      text: systemPrompt +
        "\n\nIMPORTANT: You MUST respond with ONLY valid JSON. " +
        "Do not include any markdown formatting, explanations, " +
        "or text outside the JSON object.",
    });

    // Generate content with gs:// file references using new SDK
    logger.info("Calling Gemini API with gs:// URIs...");

    // Call generateContent with correct pattern - model inside request
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        role: "user",
        parts: contentParts,
      }],
    });

    // Access text as property, not method
    logger.info("Response object keys:", Object.keys(response));
    logger.info("Response.text value:", response.text);

    let analysisText = response.text;

    if (!analysisText) {
      logger.error("response.text is undefined or null");
      logger.error("Full response object:", JSON.stringify(response));
      throw new Error("Failed to get text from AI response");
    }

    // Clean up markdown code blocks if present
    analysisText = analysisText.replace(/```json\n?/g, "")
        .replace(/```\n?/g, "").trim();

    logger.info("Raw Gemini response:", analysisText);

    // Parse the JSON response
    let gradingResult;
    try {
      gradingResult = JSON.parse(analysisText);
    } catch (parseError) {
      logger.error("Failed to parse Gemini response as JSON:", parseError);
      logger.error("Response text:", analysisText);
      throw new Error("Failed to parse AI response");
    }

    // Generate email HTML
    const emailHtml = generateRFPGradeEmail(gradingResult, mode);

    // Send email to user
    const userMailOptions = {
      from: `Propagent RFP Grader <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `RFP Grading Results: ${gradingResult.grade} ` +
        `(${gradingResult.score}/100)`,
      html: emailHtml,
    };

    await transporter.sendMail(userMailOptions);
    logger.info(`Results email sent to user: ${email}`);

    // Send notification to internal team
    const internalMailOptions = {
      from: `Propagent RFP Grader <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New RFP Grading Request - ${gradingResult.grade}`,
      html: `
        <h2>New RFP Grading Request Processed</h2>
        <p><strong>User Email:</strong> ${email}</p>
        <p><strong>Mode:</strong> ${mode === "rfp" ?
          "RFP Grader" : "Response Grader"}</p>
        <p><strong>Grade:</strong> ${gradingResult.grade}
          (${gradingResult.score}/100)</p>
        <p><strong>Files Uploaded:</strong>
          ${((rfpFiles && rfpFiles.length) || 0) +
            ((responseFiles && responseFiles.length) || 0)}</p>
        <hr>
        ${emailHtml}
      `,
    };

    await transporter.sendMail(internalMailOptions);
    logger.info("Notification sent to internal team");

    return res.status(200).json({
      message: "Your RFP has been analyzed successfully. " +
        "Results have been sent to your email.",
      grade: gradingResult.grade,
      score: gradingResult.score,
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
