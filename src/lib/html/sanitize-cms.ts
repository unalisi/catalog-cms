/**
 * Broader HTML allowlist for CMS rich-text sections (page builder customize).
 * Strips script/iframe and event handlers; allows layout tags + images/tables.
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
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'code',
  'pre',
  'hr',
  'span',
  'div',
  'section',
  'article',
  'header',
  'footer',
  'main',
  'aside',
  'figure',
  'figcaption',
  'img',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'sup',
  'sub',
  'small',
]);

const GLOBAL_ATTRS = new Set(['class', 'id', 'title', 'style']);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'rel', 'target', 'class', 'id', 'style']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading', 'class', 'id']),
  td: new Set(['colspan', 'rowspan', 'class', 'id', 'style']),
  th: new Set(['colspan', 'rowspan', 'scope', 'class', 'id', 'style']),
  table: new Set(['class', 'id', 'style']),
  span: new Set(['class', 'id', 'style']),
  div: new Set(['class', 'id', 'style']),
  section: new Set(['class', 'id', 'style']),
  code: new Set(['class']),
  pre: new Set(['class']),
};

/** Safe CSS properties for inline style on imported CMS/HTML descriptions. */
const STYLE_ALLOWED_PROPS = new Set([
  'text-align',
  'font-weight',
  'font-style',
  'text-decoration',
  'color',
  'background-color',
]);

function attrsFor(tag: string): Set<string> {
  return ALLOWED_ATTRS[tag] ?? GLOBAL_ATTRS;
}

function sanitizeStyleValue(value: string): string | null {
  const parts = value.split(';').map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  for (const part of parts) {
    const colon = part.indexOf(':');
    if (colon <= 0) continue;
    const name = part.slice(0, colon).trim().toLowerCase();
    const val = part.slice(colon + 1).trim();
    if (!STYLE_ALLOWED_PROPS.has(name)) continue;
    if (/expression|url\s*\(|javascript|@import|behavior/i.test(val)) continue;
    out.push(`${name}: ${val}`);
  }
  return out.length ? out.join('; ') : null;
}

function sanitizeAttrs(tag: string, attrs: string): string {
  const allowed = attrsFor(tag);
  if (!attrs.trim()) return '';
  const out: string[] = [];
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(attrs))) {
    const name = match[1]!.toLowerCase();
    if (name.startsWith('on')) continue;
    if (!allowed.has(name)) continue;
    let value = match[3] ?? match[4] ?? match[5] ?? '';
    if (name === 'style') {
      const cleaned = sanitizeStyleValue(value);
      if (!cleaned) continue;
      value = cleaned;
    }
    if (name === 'href' || name === 'src') {
      const trimmed = value.trim();
      if (/^(javascript|data|vbscript):/i.test(trimmed)) continue;
      if (
        !(
          trimmed.startsWith('/') ||
          trimmed.startsWith('http://') ||
          trimmed.startsWith('https://') ||
          trimmed.startsWith('mailto:') ||
          trimmed.startsWith('#') ||
          (name === 'src' && trimmed.startsWith('/media/'))
        )
      ) {
        continue;
      }
      if (name === 'href' && trimmed.startsWith('http')) {
        out.push(`rel="noopener noreferrer"`);
        if (!/target=/i.test(attrs)) out.push(`target="_blank"`);
      }
    }
    out.push(`${name}="${value.replace(/"/g, '&quot;')}"`);
  }
  return out.length ? ` ${[...new Set(out)].join(' ')}` : '';
}

/** Sanitize CMS rich-text HTML for public render. */
export function sanitizeCmsHtml(input: string): string {
  if (!input) return '';
  let html = input
    .replace(/<\s*(script|style|iframe|object|embed|link|meta|form|input|button|textarea|select)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed|link|meta|form|input|button|textarea|select)[^>]*\/?\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  html = html.replace(/<\/?([a-zA-Z0-9]+)(\s[^>]*)?>/g, (full, rawTag: string, rawAttrs = '') => {
    const tag = rawTag.toLowerCase();
    const isClose = full.startsWith('</');
    if (!ALLOWED_TAGS.has(tag)) return '';
    if (isClose) return `</${tag}>`;
    if (tag === 'br' || tag === 'hr' || tag === 'img') {
      return `<${tag}${sanitizeAttrs(tag, rawAttrs)} />`;
    }
    return `<${tag}${sanitizeAttrs(tag, rawAttrs)}>`;
  });

  return html.trim();
}

/** Strip dangerous CSS constructs before scoping. */
export function sanitizeCmsCss(input: string): string {
  if (!input) return '';
  let css = input
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@import[^;]+;/gi, '')
    .replace(/expression\s*\([^)]*\)/gi, '')
    .replace(/behavior\s*:/gi, 'behavior-blocked:')
    .replace(/url\s*\(\s*['"]?\s*javascript:[^)]*\)/gi, 'url(about:blank)')
    .replace(/-moz-binding\s*:[^;]+;/gi, '');
  return css.trim();
}

/**
 * Prefix each selector in a CSS block with `#scopeId` (simple rewriter).
 * Supports plain rules and one-level `@media` wrappers.
 */
export function scopeCmsCss(css: string, scopeId: string): string {
  const clean = sanitizeCmsCss(css);
  if (!clean) return '';
  const scope = `#${scopeId}`;

  function scopeBlock(block: string): string {
    return block.replace(/([^{}@]+)\{([^{}]*)\}/g, (_full, selector: string, body: string) => {
      const sel = selector.trim();
      if (!sel) return '';
      const scoped = sel
        .split(',')
        .map((s) => {
          const t = s.trim();
          if (!t) return '';
          if (t.startsWith(scope)) return t;
          return `${scope} ${t}`;
        })
        .filter(Boolean)
        .join(', ');
      return `${scoped}{${body}}`;
    });
  }

  const parts: string[] = [];
  const source = clean;
  const mediaSplit = /(@media[^{]+)\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/gi;
  let cursor = 0;
  let mm: RegExpExecArray | null;
  const mediaMatches: { index: number; length: number; prelude: string; inner: string }[] = [];
  while ((mm = mediaSplit.exec(source))) {
    mediaMatches.push({
      index: mm.index,
      length: mm[0].length,
      prelude: mm[1]!,
      inner: mm[2]!,
    });
  }

  if (mediaMatches.length === 0) {
    return scopeBlock(clean);
  }

  for (const media of mediaMatches) {
    if (media.index > cursor) {
      parts.push(scopeBlock(source.slice(cursor, media.index)));
    }
    parts.push(`${media.prelude}{${scopeBlock(media.inner)}}`);
    cursor = media.index + media.length;
  }
  if (cursor < source.length) {
    parts.push(scopeBlock(source.slice(cursor)));
  }
  return parts.join('\n').trim();
}
