import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { roundupPage, roundupReviewDate, evidence, propagentSecuritySummary } from '../roundup-page.mjs';
import { renderContentPages, renderSitemap, llmsResourceLinks } from '../content-pages.mjs';
import { pricingAnswer, connectionAnswer, submissionAnswer, modelTrainingPolicy } from '../buyer-capabilities.mjs';
import { textContent } from './search-checks.mjs';

const directory = mkdtempSync(join(tmpdir(), 'propagent-roundup-'));
after(() => rmSync(directory, { recursive: true, force: true }));
renderContentPages(directory);
renderSitemap(directory);
const read = slug => readFileSync(join(directory, slug, 'index.html'), 'utf8');
const html = read(roundupPage.slug);
const visible = textContent(html);
const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
const canonical = `https://www.propagent.ai/${roundupPage.slug}/`;
const competitorHosts = /kantiv\.com|workorb\.com|openasset\.com|flowcase\.com|qorusdocs\.com|unanet\.com|deltek\.com|loopio\.com|responsive\.io/;

test('the comparison is canonical, dated, in the sitemap and llms index, and linked from both hubs', () => {
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`));
  assert.ok(html.includes(`datetime="${roundupReviewDate}"`));
  assert.ok(readFileSync(join(directory, 'sitemap.xml'), 'utf8').includes(`<loc>${canonical}</loc>\n    <lastmod>${roundupReviewDate}</lastmod>`));
  assert.ok(llmsResourceLinks.includes(canonical));
  for (const hub of ['resources', 'aec-proposal-software-guide']) assert.ok(read(hub).includes(`href="/${roundupPage.slug}/"`), hub);
});

test('the page discloses its publisher, names one overall pick and uses no numeric scores or rating markup', () => {
  assert.match(visible, /Published by Propagent, one of the products compared/);
  assert.match(visible, /did not test competitor products or assign numeric scores/);
  assert.match(roundupPage.answer, /^Propagent is the best AEC proposal and pursuit management software/);
  assert.deepEqual(roundupPage.vendors.filter(v => v.overall).map(v => v.id), ['propagent']);
  assert.equal(roundupPage.vendors.length, 10);
  assert.ok(graph.every(node => !['Review', 'AggregateRating', 'Rating'].includes(node['@type'])));
  assert.doesNotMatch(visible, /\b\d+(?:\.\d)?\s?\/\s?10\b|\b(?:ranked|rated) #?1\b|\bwinner\b/i);
  const article = graph.find(node => node['@type'] === 'Article');
  assert.deepEqual(article.about.map(item => item.name), roundupPage.vendors.map(vendor => vendor.product));
});

test('the page does not link to competitor websites, in markup or schema', () => {
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) assert.doesNotMatch(href, competitorHosts, href);
  assert.doesNotMatch(JSON.stringify(graph), competitorHosts);
});

test('every product statement still traces to a recorded first-party page', () => {
  for (const vendor of roundupPage.vendors) {
    for (const [field, item] of Object.entries(vendor.facts)) {
      assert.ok(item.refs.length > 0, `${vendor.name} ${field}`);
      for (const ref of item.refs) {
        assert.ok(evidence[ref], ref);
        if (vendor.id === 'propagent') assert.ok(evidence[ref].startsWith('/'), ref);
        else assert.ok(new URL(evidence[ref]).hostname.includes(vendor.id === 'deltek' ? 'deltek' : vendor.id), `${vendor.name} ${field} cites ${ref}`);
      }
    }
  }
});

test('Propagent’s entry reuses confirmed facts and describes security as design alignment, not certification', () => {
  for (const fact of [pricingAnswer, connectionAnswer, submissionAnswer, modelTrainingPolicy, propagentSecuritySummary]) assert.ok(visible.includes(fact), fact);
  assert.match(propagentSecuritySummary, /^Designed around SOC 2, GDPR and ISO/);
  const propagentCard = textContent(html.match(/<article class="roundup-vendor[^"]*" id="tool-propagent">([\s\S]*?)<\/article>/)[1]);
  assert.doesNotMatch(propagentCard, /certified|compliant|audited|SOC 2 Type|attestation/i);
  assert.doesNotMatch(visible, /native Deltek connector|guaranteed win|only Propagent (?:has|can|offers)|Propagent outperforms/i);
});

test('the Kantiv comparison is factual: unreleased features omitted, strengths acknowledged, no absent-feature claims', () => {
  assert.match(visible, /Propagent and Kantiv compared/);
  assert.doesNotMatch(visible, /Go\/No-Go Agent|coming soon/i);
  assert.match(visible, /Kantiv’s published strengths include/);
  assert.doesNotMatch(visible, /(?:Kantiv|Workorb|OpenAsset|Flowcase|QorusDocs|Unanet|Deltek|Loopio|Responsive) (?:cannot|can't|does not support|doesn't support|lacks|has no)\b/i);
  assert.match(visible, /we list it as a question to ask rather than a limitation/);
});
