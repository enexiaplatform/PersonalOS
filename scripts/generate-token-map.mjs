/** Build the published token catalog from the same stylesheets the app loads. */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const directory = new URL('../apps/personal-os-v1/design-system/', import.meta.url);
const output = new URL('token-map.json', directory);
const sources = {
  reference: 'primitives.css',
  semantic: 'semantic.css',
  component: 'components/tokens.css',
  compatibility: 'compatibility.css',
};

const compact = '[data-density="compact"]';
const rootSelectors = new Set([':root', ':root, [data-theme="nocturne"]', compact, ':root, '+compact]);
const touch = '(pointer: coarse), (max-width: 600px)';
const tablet = '(max-width: 1100px)';
const mobile = '(max-width: 760px)';
const reduced = '(prefers-reduced-motion: reduce)';
const modes = {
  normal: { label: 'Tiêu chuẩn', media: [] },
  compact: { label: 'Gọn', compact: true, media: [] },
  touch: { label: 'Cảm ứng', media: [touch] },
  'compact-touch': { label: 'Gọn · cảm ứng', compact: true, media: [touch] },
  tablet: { label: 'Máy tính bảng', media: [tablet] },
  phone: { label: 'Điện thoại', media: [touch, tablet, mobile] },
  'reduced-motion': { label: 'Giảm chuyển động', media: [reduced] },
};

function readRules(css, media = null) {
  const rules = [];
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // The foundation uses root selectors and one level of media queries.
  const stylesheetRule = /@media\s*([^{}]+)\{((?:\s*[^{}]+\{[^{}]*\}\s*)+)\}|([^{}]+)\{([^{}]*)\}/g;
  let position = 0;
  for (const match of source.matchAll(stylesheetRule)) {
    if (source.slice(position, match.index).trim()) throw new Error('Unexpected token stylesheet syntax');
    position = match.index + match[0].length;
    const [, query, children, selector, body] = match;
    if (query) {
      rules.push(...readRules(children, query.trim()));
      continue;
    }
    const scope = selector.trim();
    if (!rootSelectors.has(scope)) throw new Error('Unknown token selector: '+scope);
    const declarations = Object.fromEntries(
      [...body.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)].map(([, name, value]) => [name, value.trim()]),
    );
    rules.push({ selector: scope, media, declarations });
  }
  if (source.slice(position).trim()) throw new Error('Unexpected token stylesheet syntax');
  return rules;
}

function resolve(name, tokens, path = []) {
  if (path.includes(name)) throw new Error('Token cycle: '+[...path, name].join(' → '));
  if (!Object.hasOwn(tokens, name)) throw new Error('Unknown token '+name);
  return tokens[name].replace(/var\((--[\w-]+)\)/g, (_, dependency) =>
    resolve(dependency, tokens, [...path, name]));
}

function applyMode(rules, mode) {
  const active = rules.filter(rule =>
    (!rule.media || mode.media.includes(rule.media)) &&
    (rule.selector !== compact || mode.compact));
  return Object.assign({}, ...active.map(rule => rule.declarations));
}

export async function generateTokenMap() {
  const groups = await Promise.all(Object.entries(sources).map(async ([tier, file]) => ({
    tier,
    rules: readRules(await readFile(new URL(file, directory), 'utf8')),
  })));
  const rules = groups.flatMap(group => group.rules);
  for (const rule of rules) {
    if (rule.media && !Object.values(modes).some(mode => mode.media.includes(rule.media))) {
      throw new Error('Token media query has no inspection mode: '+rule.media);
    }
  }
  const values = Object.fromEntries(Object.entries(modes).map(([name, mode]) => [name, applyMode(rules, mode)]));
  const base = values.normal;
  const tokens = {};
  const ramps = {};
  const semantic = {};

  for (const {tier, rules: tierRules} of groups) {
    for (const name of new Set(tierRules.flatMap(rule => Object.keys(rule.declarations)))) {
      if (Object.hasOwn(tokens, name)) throw new Error('Token declared in multiple tiers: '+name);
      const resolved = resolve(name, base);
      const variants = {};
      for (const [mode, definitions] of Object.entries(values)) {
        if (mode === 'normal') continue;
        const value = resolve(name, definitions);
        if (resolved !== value) variants[mode] = value;
      }
      tokens[name] = {tier, value: base[name], resolved, ...(Object.keys(variants).length ? {variants} : {})};
      const ramp = /^--ref-(neutral|violet|blue|cyan|jade|bronze|success|warning|danger)-(\d+)$/.exec(name);
      if (ramp) (ramps[ramp[1]] ??= {})[ramp[2]] = resolved;
      if (tier === 'semantic') {
        semantic[name.slice(6)] = /^var\(--ref-([\w-]+)\)$/.exec(base[name])?.[1] ?? base[name];
      }
    }
  }

  return {
    version: 3, theme: 'nocturne', ramps, semantic, density: ['normal', 'compact'],
    modes: Object.fromEntries(Object.entries(modes).map(([name, mode]) => [name, mode.label])),
    overrides: rules.filter(rule => rule.media || rule.selector === compact),
    tokens,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const current = JSON.stringify(await generateTokenMap(), null, 2)+'\n';
  if (process.argv.includes('--check')) {
    if (await readFile(output, 'utf8') !== current) {
      throw new Error('Token map is stale. Run node scripts/generate-token-map.mjs.');
    }
  } else {
    await writeFile(output, current);
  }
}
