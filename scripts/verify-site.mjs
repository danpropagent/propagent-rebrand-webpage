import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { pageSlugs } from '../content-pages.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const ORIGIN = 'https://www.propagent.ai';
const INTERNAL_HOSTS = new Set(['propagent.ai', 'www.propagent.ai']);
const FAQ_OPTIONAL_ROUTES = new Set(['/press/']);
const VIRTUAL_ROUTES = new Set([
  '/30min-meeting',
  '/60min-meeting',
  '/api/ask',
  '/api/gradeRfp',
]);
const REQUIRED_FILES = [
  '404.html',
  'analytics.js',
  'ask.js',
  'briefing.html',
  'llms-full.txt',
  'llms.txt',
  'logo.svg',
  'og-image-geo-20260814.png',
  'reveal.js',
  'robots.txt',
  'sitemap.xml',
  'styles.css',
];
const FORBIDDEN_PATHS = [
  /(^|\/)\.claude(\/|$)/i,
  /(^|\/)\.git(\/|$)/i,
  /(^|\/)\_explore(\/|$)/i,
  /(^|\/)marketing-v[0-9]+(\/|$)/i,
  /(^|\/)VIDEO_PROMPTS\.md$/i,
  /(^|\/)walkthrough\.html$/i,
];

const errors = [];
const htmlByFile = new Map();
const jsonLdByFile = new Map();

const report = (message) => errors.push(message);
const posix = (value) => value.replaceAll('\\', '/');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stripTags = (value) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const getAttribute = (tag, name) => {
  const pattern = new RegExp(
    `\\b${escapeRegExp(name)}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'i',
  );
  const match = tag.match(pattern);
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : null;
};

const readDistFile = (file) => {
  const fullPath = resolve(DIST, file);
  if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
    report(`Missing required file: ${file}`);
    return null;
  }
  return readFileSync(fullPath, 'utf8');
};

const walkFiles = (directory, prefix = '') => {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...walkFiles(join(directory, entry.name), rel));
    if (entry.isFile()) files.push(posix(rel));
  }
  return files;
};

const normalizeSlug = (slug) => {
  if (typeof slug !== 'string') {
    report(`pageSlugs entries must be strings; received ${typeof slug}`);
    return null;
  }
  const normalized = slug.trim().replace(/^\/+|\/+$/g, '');
  if (!normalized || normalized === 'rfp-grader' || normalized.includes('..')) {
    report(`Invalid or reserved page slug: ${JSON.stringify(slug)}`);
    return null;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    report(`Page slug must be lowercase kebab-case: ${JSON.stringify(slug)}`);
    return null;
  }
  return normalized;
};

if (!existsSync(DIST) || !statSync(DIST).isDirectory()) {
  console.error('Site verification failed:\n- dist/ does not exist; run npm run build first.');
  process.exit(1);
}

if (!Array.isArray(pageSlugs)) {
  console.error('Site verification failed:\n- content-pages.mjs must export pageSlugs as an array.');
  process.exit(1);
}

const slugs = pageSlugs.map(normalizeSlug).filter(Boolean);
if (new Set(slugs).size !== slugs.length) report('pageSlugs contains duplicate routes.');

const canonicalRoutes = [
  { route: '/', file: 'index.html' },
  ...slugs.map((slug) => ({ route: `/${slug}/`, file: `${slug}/index.html` })),
  { route: '/rfp-grader/', file: 'rfp-grader/index.html' },
];
const routeByFile = new Map(canonicalRoutes.map((entry) => [entry.file, entry]));

const extractJsonLd = (html, file) => {
  const blocks = [];
  for (const match of html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)) {
    const tag = match[0].slice(0, match[0].indexOf('>') + 1);
    const type = getAttribute(tag, 'type');
    if (type?.toLowerCase() !== 'application/ld+json') continue;
    const body = match[0]
      .slice(match[0].indexOf('>') + 1, match[0].toLowerCase().lastIndexOf('</script>'))
      .trim();
    try {
      blocks.push(JSON.parse(body));
    } catch (error) {
      report(`${file}: invalid JSON-LD (${error.message})`);
    }
  }
  if (blocks.length === 0) report(`${file}: missing parseable JSON-LD`);
  return blocks;
};

const canonicalUrls = new Set();
for (const entry of canonicalRoutes) {
  const html = readDistFile(entry.file);
  if (html === null) continue;
  htmlByFile.set(entry.file, html);

  const titles = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
  if (titles.length !== 1 || !stripTags(titles[0]?.[1] ?? '')) {
    report(`${entry.file}: expected exactly one non-empty <title>`);
  }

  const descriptionTags = (html.match(/<meta\b[^>]*>/gi) ?? []).filter(
    (tag) => getAttribute(tag, 'name')?.toLowerCase() === 'description',
  );
  if (
    descriptionTags.length !== 1 ||
    !getAttribute(descriptionTags[0], 'content')?.trim()
  ) {
    report(`${entry.file}: expected exactly one non-empty meta description`);
  }

  const canonicalTags = (html.match(/<link\b[^>]*>/gi) ?? []).filter((tag) =>
    (getAttribute(tag, 'rel') ?? '')
      .toLowerCase()
      .split(/\s+/)
      .includes('canonical'),
  );
  const expectedCanonical = new URL(entry.route, `${ORIGIN}/`).href;
  const actualCanonical = canonicalTags.length === 1
    ? getAttribute(canonicalTags[0], 'href')
    : null;
  if (actualCanonical !== expectedCanonical) {
    report(
      `${entry.file}: canonical must be ${expectedCanonical}; found ${actualCanonical ?? 'none'}`,
    );
  } else if (canonicalUrls.has(actualCanonical)) {
    report(`${entry.file}: duplicate canonical URL ${actualCanonical}`);
  } else {
    canonicalUrls.add(actualCanonical);
  }

  const h1Count = (html.match(/<h1\b[^>]*>/gi) ?? []).length;
  if (h1Count !== 1) report(`${entry.file}: expected exactly one H1; found ${h1Count}`);

  const hasDirectAnswer =
    /\bdata-direct-answer(?:\s*=|\s|>)/i.test(html) ||
    /<(?:article|aside|div|section)\b[^>]*(?:id|class)\s*=\s*["'][^"']*\bdirect-answer\b/i.test(html);
  if (!hasDirectAnswer) report(`${entry.file}: missing visible direct-answer block`);

  const hasFaqContainer =
    /<(?:article|div|section)\b[^>]*(?:id|class)\s*=\s*["'][^"']*\bfaq(?:\b|-)/i.test(html) ||
    /<h[2-3]\b[^>]*>[^<]*(?:frequently asked questions|faq)\b/i.test(html);
  const hasFaqQuestion =
    /<details\b/i.test(html) ||
    /\bclass\s*=\s*["'][^"']*\bfaq-(?:item|question)\b/i.test(html);
  if ((!hasFaqContainer || !hasFaqQuestion) && !FAQ_OPTIONAL_ROUTES.has(entry.route)) {
    report(`${entry.file}: missing visible FAQ section with at least one question`);
  }

  jsonLdByFile.set(entry.file, extractJsonLd(html, entry.file));
}

const pressHtml = htmlByFile.get('press/index.html');
if (pressHtml) {
  const pressTags = pressHtml.match(/<[^>]+\bdata-press-url\s*=\s*(?:"[^"]*"|'[^']*')[^>]*>/gi) ?? [];
  const visibleUrls = pressTags.map((tag) => getAttribute(tag, 'data-press-url')).filter(Boolean);
  const visibleUrlSet = new Set(visibleUrls);
  if (visibleUrlSet.size !== visibleUrls.length) {
    report('press/index.html: featured and archive entries must not duplicate media URLs');
  }

  const classTags = pressHtml.match(/<[^>]+\bclass\s*=\s*(?:"[^"]*"|'[^']*')[^>]*>/gi) ?? [];
  const countClass = (className) => classTags.filter((tag) =>
    (getAttribute(tag, 'class') ?? '').split(/\s+/).includes(className)
  ).length;
  if (countClass('press-featured-lead') !== 1) {
    report('press/index.html: expected exactly one featured lead');
  }
  const secondaryCount = countClass('press-featured-secondary');
  if (secondaryCount < 1 || secondaryCount > 3) {
    report('press/index.html: expected one to three compact featured items');
  }
  if (countClass('press-archive-item') !== visibleUrls.length - 1 - secondaryCount) {
    report('press/index.html: archive count must equal all visible press items minus the featured items');
  }

  const pressGraph = (jsonLdByFile.get('press/index.html') ?? [])
    .flatMap((block) => block?.['@graph'] ?? []);
  const mediaList = pressGraph.find((item) => item?.['@type'] === 'ItemList' && item?.['@id']?.endsWith('#media'));
  const schemaUrls = (mediaList?.itemListElement ?? []).map((entry) => entry?.item?.url).filter(Boolean);
  const schemaUrlSet = new Set(schemaUrls);
  if (!mediaList) {
    report('press/index.html: missing press ItemList JSON-LD');
  } else if (mediaList.numberOfItems !== schemaUrls.length) {
    report('press/index.html: ItemList numberOfItems does not match its entries');
  }
  if (schemaUrlSet.size !== schemaUrls.length) {
    report('press/index.html: ItemList contains duplicate media URLs');
  }
  if (
    visibleUrlSet.size !== schemaUrlSet.size ||
    [...visibleUrlSet].some((url) => !schemaUrlSet.has(url))
  ) {
    report('press/index.html: visible press items and ItemList JSON-LD must contain the same URLs');
  }
  if (visibleUrls.some((url, index) => schemaUrls[index] !== url)) {
    report('press/index.html: ItemList JSON-LD order must match the visible press order');
  }
}

const sitemap = readDistFile('sitemap.xml');
if (sitemap !== null) {
  const sitemapUrls = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map(
    (match) => match[1].replaceAll('&amp;', '&').trim(),
  );
  const sitemapSet = new Set(sitemapUrls);
  if (sitemapSet.size !== sitemapUrls.length) report('sitemap.xml contains duplicate <loc> URLs.');
  for (const canonical of canonicalUrls) {
    if (!sitemapSet.has(canonical)) report(`sitemap.xml is missing canonical ${canonical}`);
  }
  for (const sitemapUrl of sitemapSet) {
    if (!canonicalUrls.has(sitemapUrl)) {
      report(`sitemap.xml contains a URL without a matching canonical page: ${sitemapUrl}`);
    }
  }
}

const briefing = readDistFile('briefing.html');
if (briefing !== null) {
  htmlByFile.set('briefing.html', briefing);
  const robotsTags = (briefing.match(/<meta\b[^>]*>/gi) ?? []).filter(
    (tag) => getAttribute(tag, 'name')?.toLowerCase() === 'robots',
  );
  const isNoindex = robotsTags.some((tag) =>
    (getAttribute(tag, 'content') ?? '')
      .toLowerCase()
      .split(/[\s,]+/)
      .includes('noindex'),
  );
  if (!isNoindex) report('briefing.html: must include a robots meta tag containing noindex');
}

const notFound = readDistFile('404.html');
if (notFound !== null) htmlByFile.set('404.html', notFound);
for (const required of REQUIRED_FILES) readDistFile(required);

const normalizeInternalUrl = (reference, baseRoute) => {
  const cleaned = reference.trim().replaceAll('&amp;', '&');
  if (!cleaned || cleaned.startsWith('#')) return null;
  if (/^(?:data|javascript|mailto|tel):/i.test(cleaned)) return null;
  let url;
  try {
    url = new URL(cleaned, new URL(baseRoute, `${ORIGIN}/`));
  } catch {
    return { error: `invalid URL ${JSON.stringify(reference)}` };
  }
  if (!['http:', 'https:'].includes(url.protocol)) return null;
  if (!INTERNAL_HOSTS.has(url.hostname.toLowerCase())) return null;
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname).replace(/\/{2,}/g, '/');
  } catch {
    return { error: `invalid URL encoding in ${JSON.stringify(reference)}` };
  }
  return { pathname, hash: url.hash ? decodeURIComponent(url.hash.slice(1)) : '' };
};

const candidateFilesForPath = (pathname) => {
  const clean = pathname.replace(/^\/+/, '');
  if (!clean) return ['index.html'];
  if (pathname.endsWith('/')) return [`${clean}index.html`];
  return [clean, `${clean}/index.html`];
};

const idsForFile = (file) => {
  const html = htmlByFile.get(file);
  if (!html) return new Set();
  return new Set(
    [...html.matchAll(/\bid\s*=\s*(?:"([^"]+)"|'([^']+)')/gi)].map(
      (match) => match[1] ?? match[2],
    ),
  );
};

for (const entry of canonicalRoutes) {
  const html = htmlByFile.get(entry.file);
  if (!html) continue;
  for (const anchor of html.match(/<a\b[^>]*>/gi) ?? []) {
    const href = getAttribute(anchor, 'href');
    if (!href) continue;
    if (href.startsWith('#')) {
      const fragment = href.slice(1);
      if (fragment && !idsForFile(entry.file).has(fragment)) {
        report(`${entry.file}: unresolved fragment link ${href}`);
      }
      continue;
    }
    const target = normalizeInternalUrl(href, entry.route);
    if (!target) continue;
    if (target.error) {
      report(`${entry.file}: ${target.error}`);
      continue;
    }
    if (VIRTUAL_ROUTES.has(target.pathname)) continue;
    const targetFile = candidateFilesForPath(target.pathname).find((file) =>
      existsSync(resolve(DIST, file)),
    );
    if (!targetFile) {
      report(`${entry.file}: unresolved internal link ${href}`);
      continue;
    }
    if (target.hash && targetFile.endsWith('.html') && !idsForFile(targetFile).has(target.hash)) {
      report(`${entry.file}: unresolved fragment in internal link ${href}`);
    }
  }
}

const approvedFiles = new Set([
  ...canonicalRoutes.map((entry) => entry.file),
  ...REQUIRED_FILES,
]);

const approveLocalReference = (reference, baseRoute, sourceFile) => {
  const target = normalizeInternalUrl(reference, baseRoute);
  if (!target || target.error || VIRTUAL_ROUTES.has(target.pathname)) return;
  const targetFile = candidateFilesForPath(target.pathname).find((file) =>
    existsSync(resolve(DIST, file)) && statSync(resolve(DIST, file)).isFile(),
  );
  if (!targetFile) {
    report(`${sourceFile}: missing referenced local asset ${reference}`);
    return;
  }
  approvedFiles.add(posix(targetFile));
};

for (const [file, html] of htmlByFile) {
  const route = routeByFile.get(file)?.route ?? `/${file}`;
  for (const tag of html.match(/<(?:audio|iframe|img|link|script|source|video)\b[^>]*>/gi) ?? []) {
    for (const attribute of ['href', 'poster', 'src']) {
      const reference = getAttribute(tag, attribute);
      if (reference) approveLocalReference(reference, route, file);
    }
    const srcset = getAttribute(tag, 'srcset');
    if (srcset) {
      for (const item of srcset.split(',')) {
        const reference = item.trim().split(/\s+/)[0];
        if (reference) approveLocalReference(reference, route, file);
      }
    }
  }
}

const checkedCss = new Set();
const cssQueue = [...approvedFiles].filter((file) => file.endsWith('.css'));
while (cssQueue.length) {
  const file = cssQueue.shift();
  if (checkedCss.has(file)) continue;
  checkedCss.add(file);
  const css = readDistFile(file);
  if (css === null) continue;
  const baseRoute = `/${posix(dirname(file)).replace(/^\.$/, '')}/`.replace('//', '/');
  for (const match of css.matchAll(/url\(\s*(?:"([^"]+)"|'([^']+)'|([^)'"\s]+))\s*\)/gi)) {
    const reference = match[1] ?? match[2] ?? match[3];
    const before = new Set(approvedFiles);
    approveLocalReference(reference, baseRoute, file);
    for (const approved of approvedFiles) {
      if (!before.has(approved) && approved.endsWith('.css')) cssQueue.push(approved);
    }
  }
}

const allFiles = walkFiles(DIST);
for (const file of allFiles) {
  if (FORBIDDEN_PATHS.some((pattern) => pattern.test(file))) {
    report(`Forbidden artifact published: ${file}`);
    continue;
  }
  if (!approvedFiles.has(file)) report(`Unapproved artifact published: ${file}`);
}

const graderFiles = allFiles.filter((file) => file.startsWith('rfp-grader/assets/'));
if (!graderFiles.some((file) => file.endsWith('.js'))) {
  report('rfp-grader/assets/: missing built JavaScript bundle');
}
if (!graderFiles.some((file) => file.endsWith('.css'))) {
  report('rfp-grader/assets/: missing built CSS bundle');
}

if (errors.length) {
  console.error(`Site verification failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Site verification passed: ${canonicalRoutes.length} canonical routes, ` +
  `${allFiles.length} approved files, sitemap and internal links valid.`,
);
