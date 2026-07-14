import { rmSync, cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = resolve(__dirname, 'dist');
const marketing = resolve(__dirname, 'marketing');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

cpSync(marketing, dist, { recursive: true });

// Site-wide agent/crawler files (robots, sitemaps, 404, .well-known) —
// independent of which marketing dir ships.
cpSync(resolve(__dirname, 'site-static'), dist, { recursive: true });

// Agent-readable text endpoints, rendered from the canonical corpus in
// functions/content/ (canonical there so the ask function's deploy is
// self-contained; hosting builds always re-render from it).
const content = resolve(__dirname, 'functions', 'content');
const llmsIndex = readFileSync(resolve(content, 'llms.txt'), 'utf8');
const siteFacts = readFileSync(resolve(content, 'site-facts.md'), 'utf8');
writeFileSync(resolve(dist, 'llms.txt'), llmsIndex);
writeFileSync(
  resolve(dist, 'llms-full.txt'),
  `${llmsIndex.trimEnd()}\n\n---\n\n${siteFacts}`,
);

execSync('npx vite build', { stdio: 'inherit', cwd: __dirname });

console.log('\n✓ Build complete. dist/ now contains v15 marketing + dist/rfp-grader/ (React subapp).');
