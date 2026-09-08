// Pure checks shared by local verification and post-release notification.
// No network, credentials, browser state, or external dependencies.
export const attribute = (tag, name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`(?:^|\\s)${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? (match[1] ?? match[2] ?? match[3]) : null;
};

export const textContent = html => html
  .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&#(x[\da-f]+|\d+);/gi, (_, value) => {
    const code = value[0].toLowerCase() === 'x' ? parseInt(value.slice(1), 16) : Number(value);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ' ';
  })
  .replace(/&(amp|quot|apos|lt|gt|nbsp);/g, (_, entity) => ({amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '})[entity])
  .replace(/\s+/g, ' ').replace(/\s+([.,:;!?])/g, '$1').trim();

export function indexabilityErrors(html, expectedUrl, robotsHeader = '') {
  const errors = [];
  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  const canonicals = links.filter(tag => (attribute(tag, 'rel') ?? '').toLowerCase().split(/\s+/).includes('canonical'));
  if (canonicals.length !== 1 || attribute(canonicals[0], 'href') !== expectedUrl) errors.push('Missing, duplicate, or non-self canonical');
  const directives = [robotsHeader, ...(html.match(/<meta\b[^>]*>/gi) ?? [])
    .filter(tag => /^(robots|googlebot|bingbot)$/i.test(attribute(tag, 'name') ?? ''))
    .map(tag => attribute(tag, 'content') ?? '')];
  if (directives.some(value => /(?:^|[\s,:;])(noindex|none)(?=$|[\s,;])/i.test(value ?? ''))) errors.push('Index-blocking robots directive');
  if (!/<title\b[^>]*>\s*[^<]+<\/title>/i.test(html)) errors.push('Missing page title');
  return errors;
}

export function discoveryDepths(routes, edges) {
  const depth = new Map([['/', 0]]);
  const queue = ['/'];
  for (let i = 0; i < queue.length; i++) {
    for (const target of edges.get(queue[i]) ?? []) {
      if (routes.has(target) && !depth.has(target)) {
        depth.set(target, depth.get(queue[i]) + 1);
        queue.push(target);
      }
    }
  }
  return depth;
}

// The site has ASCII canonical paths. Match the standard *, terminal $, longest-rule
// and Allow-on-tie behavior used by these robots.txt access checks.
export function robotsAllows(robots, agent, path) {
  const groups = [];
  let group = null;
  for (const original of robots.split(/\r?\n/)) {
    const line = original.split('#')[0].trim();
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const name = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (name === 'user-agent') {
      if (!group || group.hasDirectives) {group = {agents:[],rules:[],hasDirectives:false}; groups.push(group);}
      group.agents.push(value.toLowerCase());
    } else if (group && ['allow','disallow'].includes(name)) {
      group.hasDirectives = true;
      if (value) group.rules.push({name,value});
    }
  }
  const specificity = token => token === '*' ? 0 : agent.toLowerCase().startsWith(token.replace(/\*$/, '')) ? token.length : -1;
  const matches = groups.map(item => ({...item, specificity:Math.max(...item.agents.map(specificity))}));
  const best = Math.max(-1, ...matches.map(item=>item.specificity));
  let winner = null;
  for (const item of matches.filter(item=>item.specificity === best && best >= 0)) {
    for (const rule of item.rules) {
      const terminal = rule.value.endsWith('$');
      const body = terminal ? rule.value.slice(0,-1) : rule.value;
      const pattern = body.split('*').map(part=>part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*');
      const length = body.replaceAll('*','').length;
      if (new RegExp(`^${pattern}${terminal?'$':''}`).test(path) &&
        (!winner || length > winner.length || (length === winner.length && rule.name === 'allow'))) winner = {...rule,length};
    }
  }
  return !winner || winner.name === 'allow';
}

export function hostingRobotsHeaders(config, path) {
  const result = [];
  for (const rule of config.headers ?? []) {
    const blockingHeaders = (rule.headers ?? []).filter(header=>header.key.toLowerCase() === 'x-robots-tag');
    if (!blockingHeaders.length) continue;
    let matches;
    if (rule.regex) matches = new RegExp(rule.regex).test(path);
    else {
      const glob = rule.source ?? '';
      // Fail closed for advanced patterns instead of silently misinterpreting them.
      if (!glob || /[{}()[\]!]/.test(glob)) throw new Error(`Unsupported X-Robots-Tag source pattern: ${glob}. Add a verified matcher before release.`);
      let pattern = '';
      for (let i=0; i<glob.length; i++) {
        if (glob.slice(i,i+3) === '**/') {pattern += '(?:.*/)?'; i+=2;}
        else if (glob.slice(i,i+2) === '**') {pattern += '.*'; i++;}
        else if (glob[i] === '*') pattern += '[^/]*';
        else if (glob[i] === '?') pattern += '[^/]';
        else pattern += glob[i].replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      }
      matches = new RegExp(`^${pattern}$`).test(glob.startsWith('/') ? path : path.replace(/^\//,''));
    }
    if (matches) result.push(...blockingHeaders.map(header=>header.value));
  }
  return result.join(', ');
}
