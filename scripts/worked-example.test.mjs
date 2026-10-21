import test from 'node:test';
import assert from 'node:assert/strict';
import { renderWorkedExample, stormwaterResponse, stormwaterQualification } from '../pursuit-example.mjs';
import { buyerGuide, qualificationExample } from '../buyer-guide.mjs';
import { complianceRows, complianceSources, complianceRecords, renderComplianceExample } from '../compliance-example.mjs';
import { readFileSync } from 'node:fs';
import { inputFormats, outputFormats, connectionRows, modelTrainingPolicy, deploymentOptions, retentionPolicy } from '../buyer-capabilities.mjs';

test('founder-confirmed formats and connection types remain distinct', () => {
  assert.equal(inputFormats, 'PDF, DOCX, XLSX, TXT, and Markdown (MD)');
  assert.match(outputFormats, /LaTeX, and IDML for Adobe InDesign/);
  assert.deepEqual(connectionRows[0], ['OpenAsset', 'Built connector']);
  assert.deepEqual(connectionRows[1], ['Deltek and Unanet', 'Integration accelerators']);
  assert.doesNotMatch(outputFormats, /INDD/,'Only IDML was confirmed for InDesign output');
  assert.doesNotMatch(deploymentOptions, /air.gapped|offline|single.tenant|dedicated|sovereign/i);
  assert.doesNotMatch(retentionPolicy, /\b\d+\s*(day|month|year)/i,'No universal retention period was approved');
});

test('machine-readable buyer and trust facts match the page fact set', () => {
  const facts=readFileSync(new URL('../functions/content/site-facts.md',import.meta.url),'utf8').replace(/\s+/g,' ');
  for(const fact of [inputFormats,outputFormats,modelTrainingPolicy,deploymentOptions,retentionPolicy]) assert.ok(facts.includes(fact),fact);
  assert.doesNotMatch(facts,/Everything in (Small|Medium)|Most firms start here|priority response support/);
  for(const name of ['OpenAsset','Deltek','Unanet','OneDrive','SharePoint','Google Drive','Gmail','Outlook']) assert.ok(facts.includes(name),name);
});

test('compliance example preserves sources, distinguishes scored work, and reopens affected rows', () => {
  assert.equal(complianceRows.length, 5);
  assert.equal(new Set(complianceRows.map(r => r.id)).size, 5);
  for (const record of complianceRecords) assert.deepEqual(record, stormwaterResponse.sources.find(([id]) => id === record[0]));
  for (const row of complianceRows) {
    for (const ref of row.source.split('; ')) assert.ok(complianceSources.some(([id]) => id === ref), ref);
    assert.ok(row.owner && row.location && row.evidence && row.action && row.reviewer);
  }
  assert.equal(complianceRows.find(r => r.id === 'M02').status, 'Reopened');
  assert.equal(complianceRows.find(r => r.id === 'M01').status, 'Reviewed');
  assert.equal(complianceRows.find(r => r.id === 'S01').type, 'Mandatory + scored');
  assert.equal(complianceRows.find(r => r.id === 'M04').status, 'Open');
  const html = renderComplianceExample();
  assert.match(html, /not a live product capture or customer result/);
  assert.match(html, /RFQ §3.4/);
  assert.match(html, /M01 and S01 are unchanged/);
  assert.match(html, /A populated matrix is not an approved submission/);
  assert.doesNotMatch(html, /<(script|form|iframe)\b|\bhidden\b/);
});

test('pricing copy and Offer schema preserve approved prices without feature-tier restrictions', () => {
  const home=readFileSync(new URL('../marketing/index.html',import.meta.url),'utf8');
  const graph=JSON.parse(home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const offers=graph.find(item=>item['@type']==='SoftwareApplication').offers;
  assert.deepEqual(offers.slice(0,3).map(o=>o.price),['1000','2000','5000']);
  for(const offer of offers) assert.match(offer.description,/Full proposal workflow included/);
  const pricing=home.split('id="pricing"')[1].split('</section>')[0];
  assert.doesNotMatch(pricing,/Everything in (Small|Medium)|Priority response support|Most firms start here/);
  assert.doesNotMatch(pricing,/data-countup/,'Prices must not briefly display zero or partial amounts');
  assert.match(pricing,/Larger-volume clients receive more hands-on time/);
});

test('both pages share the same fictional RFQ and source facts', () => {
  assert.equal(stormwaterResponse.requirement, stormwaterQualification.requirement);
  for (const record of stormwaterQualification.sources) {
    assert.deepEqual(record, stormwaterResponse.sources.find(([id]) => id === record[0]));
  }
  assert.equal(buyerGuide.sections.find(section => section.id === 'worked-example').responseWalkthrough, true);
  assert.equal(qualificationExample.workedExample, stormwaterQualification);
});

test('core evidence is emitted as HTML without scripts, forms, or external requests', () => {
  for (const example of [stormwaterResponse, stormwaterQualification]) {
    const html = renderWorkedExample(example);
    assert.match(html, /Illustrative pursuit/);
    assert.match(html, /not a live product capture or customer result/);
    assert.match(html, /Hickory Lane/);
    assert.match(html, /Cedar Run/);
    assert.match(html, /<details class="example-sources"/);
    assert.doesNotMatch(html, /<(script|form|iframe)\b|\bhidden\b|https?:/);
    assert.doesNotMatch(html, /North Annex|Jordan Lee|water-facility|library renovation/i);
  }
});

test('response remains concise and separates role, proposed approach, and approval', () => {
  const response = stormwaterResponse.comparison[1].paragraphs.join(' ');
  assert.ok(response.split(/\s+/).length < 180);
  assert.match(response, /drainage design lead/);
  assert.match(response, /we propose/);
  assert.match(stormwaterResponse.comparison[1].note, /Final submission approval/);
  assert.deepEqual(stormwaterQualification.checkpoints.map(([title]) => title.split(' · ')[0]), ['Hold', 'Go', 'No-go']);
  assert.ok(stormwaterQualification.sources.some(([id]) => id === 'E1'));
  assert.match(stormwaterQualification.checkpoints[1][1], /design-lead role is confirmed/);
  assert.match(stormwaterQualification.sources.find(([id]) => id === 'D1')[2], /P3, E1, and C1/);
});

test('example text and identifiers are escaped; absent examples preserve existing sections', () => {
  assert.equal(renderWorkedExample(undefined), '');
  const html = renderWorkedExample({ ...stormwaterResponse, id: '"<script>', requirement: '<img src=x onerror=alert(1)>', checkpoints: [['<b>', '& unsafe']], sources: [['"', '<script>', '<img>']] });
  assert.doesNotMatch(html, /<script>|<img|<b>/);
  assert.match(html, /&lt;img/);
  assert.match(html, /&amp; unsafe/);
});
