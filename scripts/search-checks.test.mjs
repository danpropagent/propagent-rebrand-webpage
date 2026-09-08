import test from 'node:test';
import assert from 'node:assert/strict';
import {attribute, textContent, indexabilityErrors, discoveryDepths, robotsAllows, hostingRobotsHeaders} from './search-checks.mjs';
import {preparePayload, submitIndexNow} from './submit-indexnow.mjs';
import {indexNowKey} from '../indexnow-config.mjs';

const origin = 'https://www.propagent.ai';
const html = url => `<title>Page</title><link href="${url}" rel="canonical"><h1>Page</h1>`;
test('attribute and visible-text parsing exclude JSON-LD, support reordered attributes and punctuation', () => {
  assert.equal(attribute('<link href="/" data-rel="wrong" rel="canonical">', 'rel'), 'canonical');
  assert.equal(textContent('<script>{"secret":"not visible"}</script><p>A &amp; B <a>guide</a>.</p>'), 'A & B guide.');
});
test('self-canonical HTML is indexable', () => assert.deepEqual(indexabilityErrors(html(origin), origin), []));
for (const directive of ['noindex', 'NONE', 'noindex, follow', 'googlebot: noindex']) {
  test(`blocks response-header directive: ${directive}`, () => assert.ok(indexabilityErrors(html(origin), origin, directive).length));
}
test('blocks reordered and engine-specific robots meta tags', () => {
  assert.ok(indexabilityErrors(`${html(origin)}<meta content='noindex' name='bingbot'>`, origin).length);
});
test('rejects missing, duplicate, and mismatched canonicals', () => {
  for (const body of ['<title>Page</title>', html(origin)+html(origin), html(origin+'/wrong/')]) assert.ok(indexabilityErrors(body, origin).length);
});
test('finds reachable routes and leaves orphans out', () => {
  const depths = discoveryDepths(new Set(['/', '/a/', '/b/', '/orphan/']), new Map([['/', ['/a/']], ['/a/', ['/b/', '/']]]));
  assert.equal(depths.get('/b/'), 2); assert.equal(depths.has('/orphan/'), false);
});
test('notification paths cannot include drafts, query strings, absolute URLs or alternate hosts', () => {
  for (const path of ['/research/example/', '/?test=1', origin+'/', '//elsewhere.test/', '/worksheets/compliance.html']) assert.throws(() => preparePayload([path]));
  assert.throws(() => preparePayload([]));
  assert.equal(preparePayload(['/', '/']).urlList.length, 1);
});

function mockFetch(change = {}) {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({url, options});
    if (options.method === 'POST') return new Response('', {status:202});
    assert.equal(options.redirect, 'error');
    if (url.endsWith('.txt')) return new Response(change.key ?? indexNowKey);
    if (change.reject) throw new Error('redirect rejected');
    return new Response(change.html ?? html(url), {status:change.status ?? 200, headers:{'content-type':change.type ?? 'text/html', ...change.headers}});
  };
  return {fetcher, calls};
}
for (const [name, change] of Object.entries({
  'wrong ownership key':{key:'wrong'}, '404 page':{status:404}, 'non-HTML body':{type:'text/plain'},
  'noindex header':{headers:{'x-robots-tag':'noindex'}}, 'missing canonical':{html:'<title>Soft 404</title>'},
  'redirect':{reject:true},
})) {
  test(`never notifies IndexNow for ${name}`, async () => {
    const mock = mockFetch(change);
    await assert.rejects(() => submitIndexNow(preparePayload(['/']), mock.fetcher));
    assert.equal(mock.calls.some(call => call.options.method === 'POST'), false);
  });
}
test('notifies only after all canonical preflight checks pass', async () => {
  const mock = mockFetch();
  const result = await submitIndexNow(preparePayload(['/', '/resources/']), mock.fetcher);
  assert.equal(result.status, 202);
  assert.equal(mock.calls.length, 4);
  assert.equal(mock.calls.at(-1).options.method, 'POST');
});
test('exported submit function cannot bypass the manifest', async () => {
  const payload = preparePayload(['/']); payload.host = 'elsewhere.test';
  const mock = mockFetch();
  await assert.rejects(() => submitIndexNow(payload, mock.fetcher));
  assert.equal(mock.calls.length, 0);
});
test('robots blocks global and crawler-specific exclusions', () => {
  assert.equal(robotsAllows('User-agent: *\nDisallow: /', 'Googlebot', '/resources/'), false);
  assert.equal(robotsAllows('User-agent: *\nAllow: /\nUser-agent: Bingbot\nDisallow: /', 'Bingbot', '/resources/'), false);
});
test('empty Disallow is unrestricted but still separates the following crawler group', () => {
  const robots='User-agent: *\nDisallow:\n\nUser-agent: GPTBot\nDisallow: /';
  assert.equal(robotsAllows(robots,'Googlebot','/resources/'),true);
  assert.equal(robotsAllows(robots,'Bingbot','/resources/'),true);
  assert.equal(robotsAllows(robots,'GPTBot','/resources/'),false);
});
test('robots respects specificity, merged groups, wildcard and Allow ties', () => {
  assert.equal(robotsAllows('User-agent: *\nDisallow: /\nUser-agent: Bingbot\nDisallow: /api/', 'Bingbot', '/resources/'), true);
  assert.equal(robotsAllows('User-agent: *\nDisallow: /\nAllow: /resources/', 'Googlebot', '/resources/'), true);
  assert.equal(robotsAllows('User-agent: *\nDisallow: /*.xml$', 'Googlebot', '/sitemap.xml'), false);
  assert.equal(robotsAllows('User-agent: Googlebot\nDisallow: /resources/\nUser-agent: Googlebot\nAllow: /resources/', 'Googlebot', '/resources/'), true);
});
test('Hosting wildcard noindex headers block before deployment', () => {
  const headers = hostingRobotsHeaders({headers:[{source:'**',headers:[{key:'X-Robots-Tag',value:'noindex'}]}]}, '/resources/');
  assert.ok(indexabilityErrors(html(origin+'/resources/'),origin+'/resources/',headers).length);
});
test('Hosting header matching preserves noncanonical utility exceptions', () => {
  const config={headers:[{source:'/downloads/**',headers:[{key:'x-robots-tag',value:'noindex'}]}]};
  assert.equal(hostingRobotsHeaders(config,'/resources/'),'');
  assert.equal(hostingRobotsHeaders(config,'/downloads/sheet.html'),'noindex');
  assert.equal(hostingRobotsHeaders({headers:[{regex:'^/resources/$',headers:[{key:'X-Robots-Tag',value:'none'}]}]},'/resources/'),'none');
});
test('unknown complex Hosting robots patterns fail closed', () => {
  assert.throws(()=>hostingRobotsHeaders({headers:[{source:'/{a,b}/**',headers:[{key:'X-Robots-Tag',value:'noindex'}]}]},'/resources/'));
});
