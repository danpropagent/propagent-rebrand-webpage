import assert from 'node:assert/strict';
import {pageSlugs} from '../content-pages.mjs';
import {worksheetFiles} from '../worksheets.mjs';
import {indexNowKey} from '../indexnow-config.mjs';
import {complianceWorkbook} from '../compliance-example.mjs';
import {fictionalPacketPath,packetText} from '../response-walkthrough.mjs';
import {readFileSync} from 'node:fs';
const origin=process.env.SMOKE_ORIGIN || 'http://127.0.0.1:5000';
for (const path of ['/', '/rfp-grader/', ...pageSlugs, ...worksheetFiles.map(p=>'/'+p), `/${indexNowKey}.txt`]) {
  const response=await fetch(origin+path);
  assert.equal(response.status,200,path);
  assert.equal(response.headers.get('x-robots-tag'),null,`Preview-only noindex header leaked: ${path}`);
}
for(const path of ['/missing-hosting-smoke/', '/rfp-grader/missing-hosting-smoke/', '/research/buyer-proof-review.mjs', '/research/buyer-proof-verification-2026-10-01.json', '/workflow/']) {
  const response=await fetch(origin+path); assert.equal(response.status,404,path);
}
const workbook=await fetch(origin+'/'+complianceWorkbook);
assert.equal(workbook.status,200);
assert.match(workbook.headers.get('content-type'),/application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet/);
assert.deepEqual(Buffer.from(await workbook.arrayBuffer()),readFileSync(new URL('../dist/'+complianceWorkbook,import.meta.url)));
const packet=await fetch(origin+'/'+fictionalPacketPath);
assert.equal(packet.status,200);
assert.match(packet.headers.get('content-type'),/text\/plain/);
assert.equal(await packet.text(),packetText);
const grader=await (await fetch(origin+'/rfp-grader/')).text();
const assets=[...grader.matchAll(/(?:src|href)="(\/rfp-grader\/assets\/[^"]+)"/g)].map(m=>m[1]);
assert.ok(assets.some(p=>p.endsWith('.js')) && assets.some(p=>p.endsWith('.css')),'Grader assets');
for(const asset of assets) assert.equal((await fetch(origin+asset)).status,200,asset);
const bookingDestinations = {
  '/30min-meeting': 'https://calendar.google.com/appointments/schedules/AcZssZ17Ntcm0gE6uKMbImPTu2l2zdINy7NvWTo3n3Q4qzyjeawRS9-WbZGgvKqY1AyZos8LfSU5DRlS',
  '/60min-meeting': 'https://calendar.app.google/6FZpR1n3KAQGgoNS8',
};
for(const [path, destination] of Object.entries(bookingDestinations)) {
  const booking=await fetch(origin+path,{redirect:'manual'});
  assert.equal(booking.status,302);assert.equal(booking.headers.get('location'),destination);
}
console.log('Firebase hosting smoke passed: canonical pages, worksheets, public ownership key, grader assets, 404s, booking redirect, and production indexability.');
