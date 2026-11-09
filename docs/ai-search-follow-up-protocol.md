# AI-search diagnostic follow-ups

Standing collection rule for future AEO / GEO / SEO search-result audits: after each generated answer, ask the two diagnostic follow-ups in `FOLLOW_UP_QUESTIONS` in `scripts/search-benchmark.mjs`. The benchmark template includes them for every query.

1. Save the original query, complete generated answer, products listed, citations and screenshot before introducing Propagent in a follow-up. Set `follow_up_diagnostics.initial_answer_saved` to true.
2. In that same conversation, ask why Propagent was included or omitted and how the AI classified it. Retain the exact answer and citations.
3. Ask which capabilities, buyer context and evidence the original question called for, and which Propagent facts or proof remain unverified. Retain the exact answer and citations, distinguishing newly retrieved sources from original ones.
4. Record the perceived entity, selection criteria, evidence gaps and a proposed action for each gap. An action should name the page or evidence to check, its owner and the original query to rerun after any change.
5. Check the suggested gap against actual product capabilities, published pages and independently observable retrieval/indexing evidence. An AI's explanation is a diagnostic hypothesis, not proof of the ranking algorithm's cause. A missing product capability and a missing public explanation are different problems.
6. Start a fresh conversation for the next original query. Never count a follow-up mention, new citation or changed recommendation toward the original visibility result. Do not rewrite historical answers or scores.

If no generated answer appears, or follow-ups are unavailable, record the limitation in `status`/`notes`; do not fabricate an explanation. The template is a collection scaffold, not an automatic search runner or proof that follow-ups were completed.

Existing historical runs without follow-ups remain historical observations. No diagnostic insight should be inferred from an empty field. Actual conversation captures stay in the private research/review artifacts, not the public marketing build.
