import { rmSync, cpSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = resolve(__dirname, 'dist');
const marketing = resolve(__dirname, 'marketing');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

cpSync(marketing, dist, { recursive: true });

execSync('npx vite build', { stdio: 'inherit', cwd: __dirname });

console.log('\n✓ Build complete. dist/ now contains v15 marketing + dist/rfp-grader/ (React subapp).');
