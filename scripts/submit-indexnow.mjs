// Dry-run by default. Only use --submit after an approved production deployment.
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {pageSlugs} from '../content-pages.mjs';
import {indexNowKey, indexNowHost} from '../indexnow-config.mjs';
import {indexabilityErrors} from './search-checks.mjs';

export function preparePayload(inputPaths) {
  const paths = [...new Set(inputPaths)];
  const allowed = new Set(['/', '/rfp-grader/', ...pageSlugs]);
  if (!paths.length || paths.some(path => !allowed.has(path))) throw new Error('Provide only changed canonical paths from the site manifest.');
  return {host:indexNowHost, key:indexNowKey,
    keyLocation:`https://${indexNowHost}/${indexNowKey}.txt`,
    urlList:paths.map(path => `https://${indexNowHost}${path}`)};
}

export async function submitIndexNow(payload, fetchImpl = fetch) {
  const checked = preparePayload(payload.urlList.map(value => new URL(value).pathname));
  if (JSON.stringify(payload) !== JSON.stringify(checked)) throw new Error('Payload does not match the canonical release manifest.');
  const get = url => fetchImpl(url, {redirect:'error', signal:AbortSignal.timeout(15000)});
  const keyResponse = await get(payload.keyLocation);
  if (keyResponse.status !== 200 || (await keyResponse.text()).trim() !== indexNowKey) throw new Error('Public ownership key is not deployed. Nothing submitted.');
  for (const url of payload.urlList) {
    const response = await get(url);
    if (response.status !== 200 || !/\btext\/html\b/i.test(response.headers.get('content-type') ?? '')) throw new Error(`Canonical HTML not live: ${url}. Nothing submitted.`);
    const errors = indexabilityErrors(await response.text(), url, response.headers.get('x-robots-tag'));
    if (errors.length) throw new Error(`${url}: ${errors.join('; ')}. Nothing submitted.`);
  }
  const response = await fetchImpl('https://api.indexnow.org/IndexNow', {
    method:'POST', redirect:'error', headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload), signal:AbortSignal.timeout(20000),
  });
  return {timestamp:new Date().toISOString(), status:response.status, urls:payload.urlList, body:await response.text()};
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const payload = preparePayload(args.filter(arg => arg !== '--submit'));
  if (!args.includes('--submit')) console.log(JSON.stringify({mode:'dry-run', payload}, null, 2));
  else {
    const result = await submitIndexNow(payload);
    const directory = fileURLToPath(new URL('../research/', import.meta.url));
    mkdirSync(directory, {recursive:true});
    writeFileSync(resolve(directory, `indexnow-${result.timestamp.replaceAll(':','-')}.json`), JSON.stringify(result,null,2), {flag:'wx'});
    console.log(JSON.stringify(result,null,2));
    if (![200,202].includes(result.status)) process.exitCode = 1;
  }
}
// 200/202 confirm submission/validation state, never indexing or citation.
