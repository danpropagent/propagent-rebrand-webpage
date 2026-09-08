// Internal, offline scoring. Never queries an engine or changes production.
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export const BASELINE_SHA256 = 'eab37503b7f622885a61d29b260f22f9b4d8bc324d7d04cf25b2a044be4db964';
const flags = ['propagent', 'propagent_narrative', 'propagent_ai_citation'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const requireValue = (condition, message) => {if (!condition) throw new Error(message);};
export function loadBaseline(path) {
  const bytes = readFileSync(path);
  requireValue(hash(bytes) === BASELINE_SHA256, 'Baseline file differs from the preserved September 3 evidence. Do not silently replace it.');
  return JSON.parse(bytes);
}
export function sourceUrls(row) {
  const raw = row.cited_source_urls;
  requireValue(Array.isArray(raw) || typeof raw === 'string', `Prompt ${row.id}: cited_source_urls must be an array or semicolon-separated string`);
  return (Array.isArray(raw) ? raw : raw.split(';')).map(value => value.trim()).filter(Boolean).map(value => {
    const url = new URL(value);
    requireValue(['https:', 'http:'].includes(url.protocol), `Prompt ${row.id}: invalid source scheme`);
    requireValue(!url.username && !url.password, `Prompt ${row.id}: source URL must not contain credentials`);
    requireValue(!(url.hostname.endsWith('bing.com') && /^\/(?:ck|aclick)\//.test(url.pathname)), `Prompt ${row.id}: decode answer-source redirect URLs before scoring`);
    return url.href;
  });
}
const ownSource = value => {const host = new URL(value).hostname; return host === 'propagent.ai' || host.endsWith('.propagent.ai');};

export function validateRows(run, baseline) {
  requireValue(['1.0','2.0'].includes(run.schema_version), 'Missing or unsupported benchmark schema version. New captures require version 2.0.');
  if (run.schema_version === '1.0') requireValue(JSON.stringify(run) === JSON.stringify(baseline), 'Legacy input must equal the preserved, hash-verified baseline. New observations require version 2.0 and retained answers.');
  requireValue(Array.isArray(run.rows) && run.rows.length === 50, 'Keep exactly 50 rows, including not_run and no_generated_answer rows.');
  const seen = new Set();
  for (const row of run.rows) {
    const expected = baseline.rows.find(item => item.id === row.id);
    requireValue(expected && !seen.has(row.id), `Unknown or duplicate prompt ID: ${row.id}`);
    seen.add(row.id);
    requireValue(row.query === expected.query && row.category === expected.category, `Prompt ${row.id}: corpus text/category drift`);
    requireValue(['ok', 'no_generated_answer', 'not_run', 'error'].includes(row.status), `Prompt ${row.id}: invalid status`);
    if (['not_run', 'error'].includes(row.status)) {
      requireValue(flags.every(flag => row[flag] === null), `Prompt ${row.id}: unobserved flags must be null, not zero`);
      requireValue(sourceUrls(row).length === 0, `Prompt ${row.id}: unobserved row cannot have answer sources`);
      continue;
    }
    requireValue(flags.every(flag => row[flag] === 0 || row[flag] === 1), `Prompt ${row.id}: flags must be numeric 0 or 1`);
    requireValue(typeof row.timestamp_utc === 'string' && Number.isFinite(Date.parse(row.timestamp_utc)), `Prompt ${row.id}: missing observation timestamp`);
    requireValue(row.propagent_narrative <= row.propagent, `Prompt ${row.id}: narrative inclusion cannot exceed answer-area inclusion`);
    const sources = sourceUrls(row);
    requireValue(row.propagent_ai_citation === Number(sources.some(ownSource)), `Prompt ${row.id}: own-domain flag disagrees with decoded source URLs`);
    if (row.status === 'no_generated_answer') {
      requireValue(flags.every(flag => row[flag] === 0) && sources.length === 0, `Prompt ${row.id}: ordinary search results cannot count as AI visibility`);
    }
    if (run.schema_version === '2.0' && row.status === 'ok') {
      requireValue(typeof row.answer_text === 'string' && row.answer_text.trim(), `Prompt ${row.id}: retain the complete generated narrative`);
      requireValue(typeof row.answer_area_text === 'string' && row.answer_area_text.trim(), `Prompt ${row.id}: retain the generated-answer area, excluding ordinary results`);
      requireValue(row.propagent_narrative === Number(/\bpropagent\b/i.test(row.answer_text)), `Prompt ${row.id}: narrative flag disagrees with retained text`);
      requireValue(row.propagent === Number(/\bpropagent\b/i.test(row.answer_area_text)), `Prompt ${row.id}: answer-area flag disagrees with retained text`);
    }
  }
}

export function summarize(run, baseline) {
  validateRows(run, baseline);
  const observed = run.rows.filter(row => ['ok','no_generated_answer'].includes(row.status));
  const metric = rows => {
    const done = rows.filter(row => ['ok','no_generated_answer'].includes(row.status));
    const mentions = done.reduce((sum,row) => sum + row.propagent, 0);
    const citations = done.reduce((sum,row) => sum + row.propagent_ai_citation, 0);
    return {planned:rows.length, observed:done.length, mentions, citations,
      mention_rate:done.length === rows.length ? mentions/rows.length : null,
      citation_rate:done.length === rows.length ? citations/rows.length : null};
  };
  const comparable = observed.length === 50 && ['surface','authentication','run_design'].every(key => run[key] === baseline[key]);
  const sources = new Map();
  for (const row of observed) for (const url of new Set(sourceUrls(row))) {
    const ids = sources.get(url) ?? []; ids.push(row.id); sources.set(url, ids);
  }
  const gained = [], lost = [];
  if (comparable) for (const row of run.rows) {
    const before = baseline.rows.find(item => item.id === row.id);
    if (row.propagent > before.propagent) gained.push(row.id);
    if (row.propagent < before.propagent) lost.push(row.id);
  }
  return {audit_date:run.audit_date, surface:run.surface, complete:observed.length === 50,
    comparable_protocol:comparable, observed:observed.length,
    generated_answers:observed.filter(row=>row.status==='ok').length,
    no_generated_answer:observed.filter(row=>row.status==='no_generated_answer').length,
    discovery:metric(run.rows.filter(row=>row.id<=40)), all_prompts:metric(run.rows),
    not_named_in_prompt:metric(run.rows.filter(row=>!/\bpropagent\b/i.test(row.query))),
    by_category:Object.fromEntries([...new Set(run.rows.map(row=>row.category))].map(category=>[category,metric(run.rows.filter(row=>row.category===category))])),
    mention_ids:observed.filter(row=>row.propagent).map(row=>row.id).sort((a,b)=>a-b),
    citation_ids:observed.filter(row=>row.propagent_ai_citation).map(row=>row.id).sort((a,b)=>a-b),
    paired_mentions:comparable ? {gained,lost,unchanged:50-gained.length-lost.length} : null,
    cited_sources:[...sources].map(([url,prompt_ids])=>({url,prompt_ids,prompt_count:prompt_ids.length})).sort((a,b)=>b.prompt_count-a.prompt_count),
    limitations:[
      'One observation per prompt is directional, not a causal or statistically stable estimate.',
      'Citations and exact-name inclusion do not establish recommendation rank, sentiment, or correct entity description.',
      'The 40-prompt discovery denominator stays fixed; the separate not-named set has 46 prompts.',
      'Unobserved/error rows remain null and make a run incomplete; no-generated-answer observations remain in the denominator.',
      run.schema_version === '2.0' ? 'Full-text flags are checked, but answer-area boundaries and entity accuracy still require human review.' : 'Legacy flags are preserved; truncated answer excerpts cannot independently validate full-answer inclusion.',
      'Protocol equality does not remove region/device uncertainty in the historical baseline. Keep other engines and repeated panels in separate series.',
    ]};
}

export function makeTemplate(baseline) {
  return {schema_version:'2.0', benchmark_name:'Propagent comparable 50-prompt AI-search benchmark', audit_date:null,
    surface:null, authentication:null, run_design:null,
    expected_protocol:Object.fromEntries(['surface','authentication','run_design'].map(key=>[key,baseline[key]])),
    collection_context:{region:null, locale:null, browser:null, device:null, engine_mode:null},
    baseline_sha256:BASELINE_SHA256,
    rows:baseline.rows.map(({id,category,query})=>({id,category,query,status:'not_run',timestamp_utc:null,result_url:null,
      propagent:null,propagent_narrative:null,propagent_ai_citation:null,
      answer_text:null,answer_area_text:null,cited_source_urls:[],entity_accuracy:null,recommendation_position:null,review_notes:''}))};
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [command, ...args] = process.argv.slice(2);
  const value = key => args[args.indexOf(key)+1];
  requireValue(['template','summarize'].includes(command) && args.includes('--baseline'), 'Use template|summarize --baseline <Sept-3.json> [--run <run.json>] [--out <new.json>]');
  const baseline = loadBaseline(value('--baseline'));
  requireValue(command === 'template' || args.includes('--run'), 'summarize requires --run');
  const runBytes = command === 'summarize' ? readFileSync(value('--run')) : null;
  const output = command === 'template' ? makeTemplate(baseline) : {...summarize(JSON.parse(runBytes),baseline), input_sha256:hash(runBytes), baseline_sha256:BASELINE_SHA256};
  if (args.includes('--out')) {
    const path = resolve(value('--out')); mkdirSync(dirname(path),{recursive:true});
    writeFileSync(path,JSON.stringify(output,null,2)+'\n',{flag:'wx'});
    console.log(`Saved ${path}`);
  } else console.log(JSON.stringify(output,null,2));
}
