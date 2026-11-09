import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { comparisonPages, comparisonReviewDate } from '../comparison-pages.mjs';
import { renderContentPages, renderSitemap, llmsResourceLinks } from '../content-pages.mjs';
import { inputFormats, outputFormats, connectionAnswer, pricingAnswer, pursuitPlatformAnswer, pursuitPlatformCapabilities } from '../buyer-capabilities.mjs';
import { textContent } from './search-checks.mjs';

const directory = mkdtempSync(join(tmpdir(), 'propagent-comparisons-'));
after(() => rmSync(directory, { recursive: true, force: true }));
renderContentPages(directory);
renderSitemap(directory);
const read = slug => readFileSync(join(directory, slug, 'index.html'), 'utf8');

test('both comparisons are discoverable with dated, canonical article and FAQ markup', () => {
  const sitemap = readFileSync(join(directory, 'sitemap.xml'), 'utf8');
  for (const page of comparisonPages) {
    const html = read(page.slug);
    const canonical = `https://www.propagent.ai/${page.slug}/`;
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`));
    assert.ok(html.includes(`datetime="${comparisonReviewDate}"`));
    assert.ok(sitemap.includes(`<loc>${canonical}</loc>\n    <lastmod>${comparisonReviewDate}</lastmod>`));
    assert.ok(llmsResourceLinks.includes(canonical));
    for (const hub of ['resources', 'aec-proposal-software-guide']) assert.ok(read(hub).includes(`href="/${page.slug}/"`));
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
    const article = graph.find(node => node['@type'] === 'Article');
    assert.equal(article.datePublished, page.datePublished);
    assert.equal(article.datePublished, '2026-11-06');
    assert.equal(article.dateModified, comparisonReviewDate);
    assert.deepEqual(article.about.map(item => item.name), ['Propagent', page.competitor.name]);
    assert.equal(article.author['@id'], 'https://www.propagent.ai/#org');
    assert.ok(graph.every(node => !['Review', 'AggregateRating'].includes(node['@type'])));
    const faq = graph.find(node => node['@type'] === 'FAQPage');
    for (const q of faq.mainEntity) {
      assert.ok(textContent(html).includes(q.name));
      assert.ok(textContent(html).includes(q.acceptedAnswer.text));
    }
  }
});

test('every table claim has a real source and all on-page citation targets resolve', () => {
  for (const page of comparisonPages) {
    const html = read(page.slug);
    const sourceIds = new Set(page.sources.map(source => source.id));
    assert.equal(sourceIds.size, page.sources.length);
    const table = page.sections.find(section => section.comparisonTable).comparisonTable;
    for (const [, ours, theirs] of table.rows) {
      for (const claim of [ours, theirs]) {
        assert.ok(claim.refs.length > 0, claim.text);
        for (const ref of claim.refs) assert.ok(sourceIds.has(ref), ref);
      }
    }
    for (const [, id] of html.matchAll(/href="#([^\"]+)"/g)) assert.ok(html.includes(`id="${id}"`), id);
    for (const s of page.sources) assert.ok(html.includes(`href="${s.url}"`), s.url);
    const article = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'].find(n => n['@type'] === 'Article');
    assert.deepEqual(article.citation, page.sources.map(s => new URL(s.url, 'https://www.propagent.ai').href));
  }
});

test('Propagent implementation and commercial facts reuse the confirmed production corpus', () => {
  for (const page of comparisonPages) {
    const visible = textContent(read(page.slug));
    for (const fact of [inputFormats, outputFormats, connectionAnswer, pricingAnswer]) assert.ok(visible.includes(fact), fact);
    assert.match(visible, /not currently ISO-certified and does not claim independent SOC 2 assurance/);
    assert.doesNotMatch(visible, /native Deltek connector|guaranteed win|independent head-to-head|Propagent is SOC 2 certified/i);
  }
});

test('real customer outcomes stay separate from the fictional example and exclude unsupported speed comparisons', () => {
  for (const page of comparisonPages) {
    const visible = textContent(read(page.slug));
    assert.ok(visible.includes('not a live product capture or customer result'));
    assert.ok(visible.includes('one anonymized engagement, not a head-to-head trial or a guaranteed result'));
    assert.match(visible, /research, evidence preparation and later reviews were separate/i);
    assert.ok(visible.includes('29 of 40'));
    assert.doesNotMatch(visible, /faster than (Kantiv|Loopio)|guaranteed[^.!?]{0,60}(shortlist|win)|30 minutes[^.!?]*complete proposal lifecycle/i);
  }
});

test('both pages make an explicit Propagent-led case before the sourced comparison', () => {
  for (const page of comparisonPages) {
    assert.match(page.answer, /^Choose Propagent/);
    for (const feature of ['knowledge graphs', 'workspaces', 'agents']) assert.ok(page.answer.includes(feature), feature);
    assert.equal(page.sections[0].eyebrow, 'Why choose Propagent');
    assert.equal(page.sections[1].id, 'customer-evidence');
    const fit = page.sections[0];
    assert.equal(fit.cards.length, 3);
    assert.ok(fit.links.some(([href]) => href === '#customer-evidence'));
    assert.ok(page.sections.findIndex(section => section.id === 'platform') < page.sections.findIndex(section => section.comparisonTable));
    assert.ok(page.sections[1].cards.some(([heading]) => heading.includes('29 of 40')));
    assert.ok(page.faqs[0][0].startsWith('Why choose Propagent'));
    assert.doesNotMatch(textContent(read(page.slug)), /Evaluate (?:Kantiv|Loopio) when/);
  }
});

test('confirmed knowledge graphs, workspaces and agents are explicit in both pages and the canonical source', () => {
  const canonical = textContent(read('ai-proposal-management-aec'));
  assert.ok(read('ai-proposal-management-aec').includes('id="platform"'));
  for (const page of comparisonPages) {
    const visible = textContent(read(page.slug));
    for (const text of [pursuitPlatformAnswer, ...pursuitPlatformCapabilities.flat()]) {
      assert.ok(visible.includes(text), text);
      assert.ok(canonical.includes(text), text);
    }
    const rows = page.sections.find(section => section.comparisonTable).comparisonTable.rows;
    for (const term of ['knowledge graphs', 'workspaces', 'agents']) {
      assert.ok(rows.some(([, ours]) => ours.text.toLowerCase().includes(term)), term);
    }
    assert.match(visible, /People own strategy, sensitive decisions and final approval/);
  }
});

test('real proof does not claim that the engagement measured the complete platform or competitor performance', () => {
  for (const page of comparisonPages) {
    const visible = textContent(read(page.slug));
    assert.ok(visible.includes('not that every platform capability was measured in this engagement'));
    assert.ok(visible.includes('we do not claim a lower total cost without a like-for-like quote'));
    assert.doesNotMatch(visible, /(?:only Propagent (?:has|can|offers)|Propagent outperforms (?:Kantiv|Loopio)|guaranteed savings|unlimited seats|autonomously submits)/i);
    assert.ok(page.sources.some(source => source.id === 'P9' && source.url.includes('/customer-stories/')));
  }
});

test('both worked examples show how the graph, agents, workspace and reusable memory carry the response', () => {
  for (const page of comparisonPages) {
    const html = read(page.slug);
    const trace = html.match(/<ol class="comparison-trace">([\s\S]*?)<\/ol>/)[1];
    assert.equal((trace.match(/<li>/g) || []).length, 4);
    for (const role of ['Knowledge graph:', 'Agents:', 'Workspace:', 'Operational memory:']) assert.ok(trace.includes(role), role);
    assert.match(trace, /revalidate pursuit-specific availability/);
  }
});

test('comparisons credit documented competitor capabilities and distinguish roadmap status', () => {
  const kantiv = textContent(read('propagent-vs-kantiv'));
  const loopio = textContent(read('propagent-vs-loopio'));
  assert.match(kantiv, /dedicated Go\/No-Go Agent is labeled coming soon/);
  assert.match(kantiv, /connected firm knowledge, visible sources and human review/);
  assert.match(loopio, /citations and confidence scores.*Recommended Experts/);
  assert.match(loopio, /10-seat Foundations starting tier and unlimited projects/);
  assert.doesNotMatch(loopio, /Loopio (?:cannot|does not|lacks) (?:cite|route|ground|review)/i);
});

test('buyer-decision rows separate sourced product statements from editorial interpretations', () => {
  for (const page of comparisonPages) {
    const table = page.sections.find(section => section.comparisonTable).comparisonTable;
    assert.equal(table.rows.length, 10);
    for (const [question, ours, theirs, implication] of table.rows) {
      assert.ok(question.endsWith('?'), question);
      assert.ok(ours.refs.length && theirs.refs.length);
      assert.ok(implication.label && implication.text.length > 60, question);
      assert.deepEqual(implication.refs, []);
    }
    const html = read(page.slug);
    assert.match(html, /Buying implication &amp; evidence limit/);
    assert.match(html, /editorial buying interpretation, not test results/);
    assert.match(textContent(html), /neither column is an independent product test/);
    assert.match(textContent(html), /Shared capability/);
  }
});

test('claim citations open labeled primary sources directly and source notes explain the evidence reviewed', () => {
  for (const page of comparisonPages) {
    const html = read(page.slug);
    const tableHtml = html.match(/<table class="guide-table comparison-table">([\s\S]*?)<\/table>/)[1];
    assert.doesNotMatch(tableHtml, /href="#source-/);
    const table = page.sections.find(section => section.comparisonTable).comparisonTable;
    const referenced = new Set(table.rows.flatMap(([, ours, theirs]) => [...ours.refs, ...theirs.refs]));
    for (const source of page.sources) {
      assert.ok(source.detail && source.label);
      assert.equal(source.reviewed, comparisonReviewDate);
      assert.ok(textContent(html).includes(source.detail), source.id);
      if (referenced.has(source.id)) {
        const escapedUrl = source.url.replaceAll('&', '&amp;');
        assert.ok(tableHtml.includes(`href="${escapedUrl}"`), source.id);
        assert.ok(tableHtml.includes(`${source.id} · ${source.label}`), source.id);
      }
    }
    const connections = table.rows.find(([question]) => question.includes('existing records'));
    assert.ok(connections[1].refs.includes('P10'));
    assert.ok(page.sources.find(s => s.id === 'P10').url.endsWith('#connections'));
  }
});

test('governance, assurance and missing public detail are not converted into unsupported capability claims', () => {
  const kantiv = textContent(read('propagent-vs-kantiv'));
  const loopio = textContent(read('propagent-vs-loopio'));
  assert.ok(comparisonPages[0].sources.some(source => source.id === 'K4' && source.url === 'https://trust.kantiv.com/'));
  assert.match(kantiv, /Their underlying scope and applicability were not reviewed/);
  assert.match(kantiv, /Coming soon does not mean Kantiv has no decision support/);
  assert.match(loopio, /Enhanced lists confidential projects\/multi-step reviews; Enterprise adds separate business units/);
  assert.match(loopio, /missing public detail is not evidence of an absent feature/i);
  assert.match(loopio, /Loopio publishes an assurance claim that Propagent does not currently make/);
  for (const visible of [kantiv, loopio]) assert.match(visible, /not a measured performance ranking|neither column is an independent product test/);
});

test('incumbent buyers get migration, usage-definition and procurement checks without invented promises', () => {
  for (const page of comparisonPages) {
    const visible = textContent(read(page.slug));
    assert.ok(page.sections.some(section => section.id === 'before-you-commit'));
    for (const question of ['export/rollback plan', 'what counts as a response', 'overages', 'multi-step approval', 'renewal', 'sync direction']) assert.ok(visible.includes(question), question);
    assert.match(visible, /do not assume automatic migration/);
    assert.doesNotMatch(visible, /guaranteed migration|unlimited annual responses|free onboarding|zero setup|no overages|SSO included in every Propagent plan/i);
  }
});
