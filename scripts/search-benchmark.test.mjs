import test from 'node:test';
import assert from 'node:assert/strict';
import {makeTemplate, summarize, validateRows, sourceUrls} from './search-benchmark.mjs';
const baseline = {schema_version:'2.0',audit_date:'2026-09-03',surface:'Bing',authentication:'anonymous',run_design:'one per prompt',
  rows:Array.from({length:50},(_,i)=>({id:i+1,category:i<40?'discovery':'comparison',query:i<46?`query ${i+1}`:`Propagent query ${i+1}`,
    status:'ok',timestamp_utc:'2026-09-03T12:00:00Z',propagent:i>=46?1:0,propagent_narrative:i>=46?1:0,propagent_ai_citation:0,cited_source_urls:'',
    answer_text:i>=46?'Propagent is mentioned.':'Other answer.', answer_area_text:i>=46?'Propagent is mentioned.':'Other answer.'}))};
const changed = edit => {const run=structuredClone(baseline);edit(run);return run;};
test('keeps 40, 50 and 46 denominators distinct', () => {
  const result=summarize(baseline,baseline);
  assert.equal(result.discovery.planned,40); assert.equal(result.all_prompts.planned,50); assert.equal(result.not_named_in_prompt.planned,46);
  assert.equal(result.all_prompts.mentions,4); assert.equal(result.paired_mentions.unchanged,50);
});
test('template is incomplete, not a zero-performance result', () => {
  const result=summarize(makeTemplate(baseline),baseline);
  assert.equal(result.complete,false); assert.equal(result.all_prompts.observed,0); assert.equal(result.discovery.mention_rate,null); assert.equal(result.paired_mentions,null);
});
for(const [name,edit] of Object.entries({
  'missing prompt':run=>run.rows.pop(), 'duplicate prompt':run=>run.rows[1]=run.rows[0],
  'changed query':run=>run.rows[0].query+=' changed', 'changed category':run=>run.rows[0].category='wrong',
  'missing flag':run=>delete run.rows[0].propagent, 'narrative mismatch':run=>run.rows[0].propagent_narrative=1,
  'unobserved zero':run=>run.rows[0].status='not_run',
  'citation mismatch':run=>run.rows[0].propagent_ai_citation=1,
  'ordinary-result contamination':run=>{run.rows[46].status='no_generated_answer';},
})) test(`rejects ${name}`,()=>assert.throws(()=>validateRows(changed(edit),baseline)));
test('no generated answer remains in denominator',()=>{
  const result=summarize(changed(run=>run.rows[12].status='no_generated_answer'),baseline);
  assert.equal(result.generated_answers,49);assert.equal(result.discovery.planned,40);assert.equal(result.no_generated_answer,1);
});
test('hostname matching rejects a lookalike domain',()=>{
  assert.throws(()=>validateRows(changed(run=>{run.rows[0].propagent_ai_citation=1;run.rows[0].cited_source_urls='https://propagent.ai.evil.test/';}),baseline));
});
test('counts repeated citation within one answer once',()=>{
  const result=summarize(changed(run=>{run.rows[0].propagent_ai_citation=1;run.rows[0].cited_source_urls=['https://www.propagent.ai/','https://www.propagent.ai/'];}),baseline);
  assert.equal(result.all_prompts.citations,1);assert.equal(result.cited_sources[0].prompt_count,1);
});
test('protocol change cannot silently join comparable series',()=>{
  assert.equal(summarize(changed(run=>run.surface='Other engine'),baseline).paired_mentions,null);
});
test('rejects undecoded redirects and credential-bearing source URLs',()=>{
  for(const url of ['https://www.bing.com/ck/a?u=123','https://name:password@example.test/']) assert.throws(()=>sourceUrls({id:1,cited_source_urls:url}));
});
test('new captures require full narrative and answer-area evidence',()=>{
  assert.throws(()=>validateRows(changed(run=>delete run.rows[0].answer_text),baseline));
});
test('missing, unknown and changed legacy versions cannot bypass evidence requirements',()=>{
  for(const version of [undefined,'3.0','1.0']) assert.throws(()=>validateRows(changed(run=>{run.schema_version=version;run.audit_date='2026-09-17';delete run.rows[0].answer_text;}),baseline));
  const legacy={...structuredClone(baseline),schema_version:'1.0'};
  assert.doesNotThrow(()=>validateRows(legacy,legacy));
});
