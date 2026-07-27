/**
 * Lightweight HTML allowlist sanitizer for blog post bodies.
 * Format choice (FAZ 6): sanitized HTML — not MDX.
 */
const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'em',
  'b',
  'i',
  'u',
  'a',
  'ul',
  'ol',
  'li',
  'h2',
  'h3',
  'h4',
  'blockquote',
  'code',
  'pre',
  'hr',
  'span',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'rel', 'target']),
  span: new Set(['class']),
  code: new Set(['class']),
  pre: new Set(['class']),
};

function sanitizeAttrs(tag: string, attrs: string): string {
  const allowed = ALLOWED_ATTRS[tag];
  if (!allowed || !attrs.trim()) return '';
  const out: string[] = [];
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(attrs))) {
    const name = match[1]!.toLowerCase();
    if (!allowed.has(name)) continue;
    if (name.startsWith('on')) continue;
    let value = match[3] ?? match[4] ?? match[5] ?? '';
    if (name === 'href') {
      const trimmed = value.trim();
      if (/^(javascript|data|vbscript):/i.test(trimmed)) continue;
      if (!(trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('mailto:') || trimmed.startsWith('#'))) {
        continue;
      }
      if (trimmed.startsWith('http')) {
        out.push(`rel="noopener noreferrer"`);
        if (!/target=/i.test(attrs)) out.push(`target="_blank"`);
      }
    }
    out.push(`${name}="${value.replace(/"/g, '&quot;')}"`);
  }
  return out.length ? ` ${[...new Set(out)].join(' ')}` : '';
}

export function sanitizeHtml(input: string): string {
  if (!input) return '';
  let html = input
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  html = html.replace(/<\/?([a-zA-Z0-9]+)(\s[^>]*)?>/g, (full, rawTag: string, rawAttrs = '') => {
    const tag = rawTag.toLowerCase();
    const isClose = full.startsWith('</');
    if (!ALLOWED_TAGS.has(tag)) return '';
    if (isClose) return `</${tag}>`;
    if (full.endsWith('/>') && (tag === 'br' || tag === 'hr')) return `<${tag} />`;
    if (tag === 'br' || tag === 'hr') return `<${tag} />`;
    return `<${tag}${sanitizeAttrs(tag, rawAttrs)}>`;
  });

  return html.trim();
}

export function normalizeTags(tags: string[] | string | null | undefined): string[] {
  const list = Array.isArray(tags)
    ? tags
    : typeof tags === 'string'
      ? tags.split(',')
      : [];
  const normalized = list
    .map((t) =>
      t
        .trim()
        .toLocaleLowerCase('tr-TR')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9ğüşıöç-]+/gi, '')
        .slice(0, 40),
    )
    .filter(Boolean);
  return [...new Set(normalized)].slice(0, 20);
}
