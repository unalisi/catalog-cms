/**
 * Whitelist sanitizer for product descriptions.
 * Must stay in sync with ProductDescriptionEditor Tiptap schema:
 * p, br, strong/em/b/i/u, a, ul/ol/li, h2, h3 — no style/image/table/script.
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
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'rel', 'target']),
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
      if (
        !(
          trimmed.startsWith('/') ||
          trimmed.startsWith('http://') ||
          trimmed.startsWith('https://') ||
          trimmed.startsWith('mailto:') ||
          trimmed.startsWith('#')
        )
      ) {
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

/** Sanitize product description HTML for storage and public render. */
export function sanitizeProductDescription(input: string): string {
  if (!input) return '';
  let html = input
    .replace(
      /<\s*(script|style|iframe|object|embed|link|meta|form|input|button|textarea|select)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
      '',
    )
    .replace(
      /<\s*(script|style|iframe|object|embed|link|meta|form|input|button|textarea|select)[^>]*\/?\s*>/gi,
      '',
    )
    .replace(/<!--[\s\S]*?-->/g, '');

  html = html.replace(/<\/?([a-zA-Z0-9]+)(\s[^>]*)?>/g, (full, rawTag: string, rawAttrs = '') => {
    const tag = rawTag.toLowerCase();
    const isClose = full.startsWith('</');
    if (!ALLOWED_TAGS.has(tag)) return '';
    if (isClose) return `</${tag}>`;
    if (tag === 'br') return '<br />';
    return `<${tag}${sanitizeAttrs(tag, rawAttrs)}>`;
  });

  const trimmed = html.trim();
  if (!trimmed || trimmed === '<p></p>' || trimmed === '<p><br></p>' || trimmed === '<p><br /></p>') {
    return '';
  }
  return trimmed;
}

/** Strip tags for SEO fallbacks and list previews. */
export function stripHtmlToText(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|h2|h3|li|div)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
