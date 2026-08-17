import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  llmsResourceLinks,
  renderContentPages,
  renderSitemap,
} from './content-pages.mjs';
import {
  marketingDirectories,
  marketingFiles,
  staticFiles,
} from './site-routes.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const dist = resolve(root, 'dist');
const marketing = resolve(root, 'marketing');
const siteStatic = resolve(root, 'site-static');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const file of marketingFiles) {
  cpSync(resolve(marketing, file), resolve(dist, file));
}

for (const directory of marketingDirectories) {
  cpSync(resolve(marketing, directory), resolve(dist, directory), { recursive: true });
}

for (const file of staticFiles) {
  cpSync(resolve(siteStatic, file), resolve(dist, file));
}

renderContentPages(dist);
renderSitemap(dist);

const content = resolve(root, 'functions', 'content');
const llmsBase = readFileSync(resolve(content, 'llms.txt'), 'utf8').trimEnd();
const llmsIndex = `${llmsBase}\n\n${llmsResourceLinks.trim()}\n`;
const siteFacts = readFileSync(resolve(content, 'site-facts.md'), 'utf8');

writeFileSync(resolve(dist, 'llms.txt'), llmsIndex);
writeFileSync(
  resolve(dist, 'llms-full.txt'),
  `${llmsIndex.trimEnd()}\n\n---\n\n${siteFacts}`,
);

execFileSync(
  process.execPath,
  [resolve(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'],
  { stdio: 'inherit', cwd: root },
);
execFileSync(process.execPath, ['scripts/verify-site.mjs'], { stdio: 'inherit', cwd: root });

console.log('\nBuild complete: static marketing pages and the RFP Grader are ready in dist/.');
