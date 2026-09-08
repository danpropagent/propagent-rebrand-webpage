// Read-only HTTP evidence capture. Usage: node scripts/audit-live.mjs [origin]
import { mkdirSync, writeFileSync } from 'node:fs';
const origin = process.argv[2] || 'https://www.propagent.ai';
const fetchedAt = new Date().toISOString();
const fetchPage = async path => {
  const response = await fetch(new URL(path, origin), {signal: AbortSignal.timeout(20000)});
  const html = await response.text();
  return {path, url:response.url, status:response.status, contentType:response.headers.get('content-type'), robotsHeader:response.headers.get('x-robots-tag'), bytes:Buffer.byteLength(html), title:html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1], canonical:html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1], h1Count:(html.match(/<h1\b/gi)||[]).length, noindex:/<meta[^>]+content=["'][^"']*noindex/i.test(html), html};
};
const sitemap = await fetchPage('/sitemap.xml');
const paths = [...sitemap.html.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1]).pathname);
const requested = [...paths, '/robots.txt', '/llms.txt', '/does-not-exist-audit-20260907/', '/rfp-grader/does-not-exist-audit-20260907/'];
const settled = await Promise.allSettled(requested.map(fetchPage));
const rows = settled.map((r,i)=>r.status === 'fulfilled' ? r.value : {path:requested[i], error:String(r.reason)});
const report = {fetchedAt, origin, sitemap, rows};
mkdirSync('research', {recursive:true});
const file = `research/http-audit-${fetchedAt.replaceAll(':','-')}.json`;
writeFileSync(file, JSON.stringify(report,null,2), {flag:'wx'});
console.log(JSON.stringify({file,rows:rows.map(({html,...rest})=>rest)},null,2));
