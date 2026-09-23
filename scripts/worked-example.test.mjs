import test from 'node:test';
import assert from 'node:assert/strict';
import { renderWorkedExample, stormwaterResponse, stormwaterQualification } from '../pursuit-example.mjs';
import { buyerGuide, qualificationExample } from '../buyer-guide.mjs';

test('both pages share the same fictional RFQ and source facts', () => {
  assert.equal(stormwaterResponse.requirement, stormwaterQualification.requirement);
  for (const record of stormwaterQualification.sources) {
    assert.deepEqual(record, stormwaterResponse.sources.find(([id]) => id === record[0]));
  }
  assert.equal(buyerGuide.sections[1].workedExample, stormwaterResponse);
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
