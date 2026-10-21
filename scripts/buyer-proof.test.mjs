import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderContentPages, renderSitemap, pageSlugs } from '../content-pages.mjs';
import { customerStoryPath } from '../buyer-proof.mjs';
import { submissionAnswer, connectionAnswer, pricingAnswer, inputFormats, outputFormats } from '../buyer-capabilities.mjs';
import { fictionalPacket, packetText, renderResponseWalkthrough } from '../response-walkthrough.mjs';
// Fingerprints of the approved fictional preview. CI must not depend on private research.
const sha256 = value => createHash('sha256').update(value).digest('hex');
const approvedPacketSha256 = '9007899f232070ec90d4f950b0318000eb8ee1eacb7e0a324484ce2b44403918';
const approvedTextSha256 = '1d131020bc7410ae0520332b75aded617ab7c1929244d82e4607ec7da764c6dc';

const directory = mkdtempSync(join(tmpdir(), 'propagent-public-proof-test-'));
after(() => rmSync(directory, { recursive: true, force: true }));
renderContentPages(directory);
renderSitemap(directory);
const read = path => readFileSync(join(directory, path, 'index.html'), 'utf8');
const story = read(customerStoryPath.slice(1));
const guide = read('aec-proposal-software-guide');

test('published customer story preserves approved results and measurement boundaries', () => {
  for (const text of ['An initial draft in 30 minutes', 'research, evidence preparation, and later reviews were separate', '43 minutes, 42 seconds', '14 were fully implemented and 15 partly implemented', 'not the final submitted file', '12 of the 14', 'The team was shortlisted.', 'confirmed shortlisting']) assert.ok(story.includes(text), text);
  assert.doesNotMatch(story, /72\.5%|98\.75%|80×|founder.?reported|contract win|awarded the contract|mail\.google|drive\.google/i);
  assert.match(story, /The customer and project are anonymized/);
  assert.equal((story.match(/<h1>/g) || []).length, 1);
  assert.doesNotMatch(story, /noindex|Private local preview|href="\/workflow\//);
});

test('story metadata describes a dated article, not a customer rating or FAQ', () => {
  const graph = JSON.parse(story.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const article = graph.find(item => item['@type'] === 'Article');
  assert.equal(article.datePublished, '2026-10-04');
  assert.equal(article.dateModified, '2026-10-06');
  assert.equal(article.author['@id'], 'https://www.propagent.ai/#org');
  assert.ok(graph.every(item => !['Review', 'AggregateRating', 'FAQPage'].includes(item['@type'])));
  const crumbs = graph.find(item => item['@type'] === 'BreadcrumbList').itemListElement;
  assert.equal(crumbs[1].item, 'https://www.propagent.ai/resources/');
});

test('customer story is reachable through existing buyer paths and included in the sitemap', () => {
  assert.ok(pageSlugs.includes(customerStoryPath));
  for (const slug of ['resources', 'ai-proposal-management-aec', 'aec-proposal-software-guide', 'rfp-compliance-matrix']) assert.ok(read(slug).includes(`href="${customerStoryPath}"`), slug);
  const home = readFileSync(new URL('../marketing/index.html', import.meta.url), 'utf8');
  assert.ok(home.includes(`href="${customerStoryPath}"`));
  assert.ok(readFileSync(join(directory, 'sitemap.xml'), 'utf8').includes(`https://www.propagent.ai${customerStoryPath}`));
  assert.doesNotMatch(story.match(/<nav class="topbar-nav[\s\S]*?<\/nav>/)[0], /customer-stories|workflow/);
});

test('implementation proof replaces the risk-count headline across public summaries', () => {
  const home = readFileSync(new URL('../marketing/index.html', import.meta.url), 'utf8');
  const facts = readFileSync(new URL('../functions/content/site-facts.md', import.meta.url), 'utf8');
  for (const html of [home, story]) {
    assert.match(html, /Recommendations implemented/);
    assert.match(html, /<strong>29 of 40<\/strong>/);
    assert.match(html, /14 fully and 15 partly implemented in later drafts\./);
  }
  for (const text of [home, story, guide, read('resources'), facts]) {
    assert.match(text.replace(/\s+/g, ' '), /29 of 40/);
    assert.doesNotMatch(text, /eight high-priority|High-priority risk areas identified|11-category gap register/i);
  }
  assert.match(facts, /14 fully and 15 partly/);
  assert.match(story, /40 recommendations include those whose outcomes could be assessed across later drafts/);
});

test('fictional packet is identical to the approved preview and every citation resolves', () => {
  assert.equal(sha256(JSON.stringify(fictionalPacket)), approvedPacketSha256);
  assert.equal(sha256(packetText), approvedTextSha256);
  const html = renderResponseWalkthrough();
  for (const [, ref] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${ref}"`), ref);
  assert.match(html, /not a live product capture or customer result/);
  assert.doesNotMatch(html, /<(script|form|iframe)\b/);
  assert.equal((guide.match(/data-worked-example="stormwater-response"/g) || []).length, 1);
  assert.match(guide, /In a municipal design-build pursuit/);
});

test('buyer pages state all four confirmed submission types and known integrations directly', () => {
  const product = read('ai-proposal-management-aec');
  for (const html of [guide, product]) {
    assert.ok(html.includes(submissionAnswer));
    assert.ok(html.includes(connectionAnswer));
    assert.ok(html.includes(inputFormats));
    assert.ok(html.includes(outputFormats));
    assert.doesNotMatch(html, /do not assume a named integration|If you need native SF 330 assembly/);
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
    const faq = graph.find(item => item['@type'] === 'FAQPage');
    assert.ok(faq.mainEntity.some(item => item.acceptedAnswer.text === submissionAnswer));
    assert.ok(faq.mainEntity.some(item => item.acceptedAnswer.text === connectionAnswer));
  }
  const facts = readFileSync(new URL('../functions/content/site-facts.md', import.meta.url), 'utf8').replace(/\s+/g, ' ');
  assert.ok(facts.includes(submissionAnswer));
  assert.doesNotMatch(product, /Mature the content|matures source-grounded/);
  assert.ok(product.indexOf('<strong>Response memory.</strong>') > product.indexOf('<h3>Response Development</h3>'));
});

test('guide connects published pricing and real proof to buying decisions before the long example', () => {
  assert.ok(guide.includes(pricingAnswer));
  assert.match(guide, /href="\/#pricing"/);
  assert.match(guide, /Customer results that matter when choosing proposal software/);
  assert.ok(guide.indexOf('id="customer-results"') < guide.indexOf('id="worked-example"'));
  assert.ok(guide.indexOf('id="scope-and-cost"') < guide.indexOf('id="worked-example"'));
  assert.match(guide, /fictional stormwater worked example below/);
  for (const html of [guide, read('ai-proposal-management-aec')]) {
    assert.match(html, /29 of 40/);
    assert.match(html, /14 fully and 15 partly/);
    assert.match(html, /href="\/customer-stories\/aec-design-build-proposal\/"/);
  }
});

test('compliance page connects requirement parsing to actions and real submission evidence', () => {
  const compliance = read('rfp-compliance-matrix');
  assert.match(compliance, /id="requirements-parser"/);
  assert.match(compliance, /From a parsed instruction to a controlled response/);
  assert.match(compliance, /The correction remained in the submitted response/);
  assert.match(compliance, /Download the editable Excel matrix/);
});

test('production entrypoints never import private review artifacts', () => {
  for (const file of ['build.mjs', 'content-pages.mjs', 'buyer-guide.mjs', 'buyer-proof.mjs', 'response-walkthrough.mjs', 'site-routes.mjs']) {
    const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /from\s+['"][^'"]*research|buyer-proof-review|preview-buyer-proof/);
  }
});
