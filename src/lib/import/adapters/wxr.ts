import { slugify } from '../../utils/id';
import type { ImportRecord, MappingProfile } from '../types';

function decodeXmlEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function extractTagContent(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(re);
  if (!match) return null;
  return decodeXmlEntities(match[1].trim());
}

function extractItems(xml: string): string[] {
  const items: string[] = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) items.push(m[1]);
  return items;
}

function extractPostMeta(itemXml: string): Map<string, string> {
  const meta = new Map<string, string>();
  const re = /<wp:postmeta>([\s\S]*?)<\/wp:postmeta>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(itemXml))) {
    const block = m[1];
    const key = extractTagContent(block, 'wp:meta_key');
    const value = extractTagContent(block, 'wp:meta_value');
    if (key) meta.set(key, value ?? '');
  }
  return meta;
}

function extractCategories(itemXml: string, domain: string): string[] {
  const names: string[] = [];
  const re = /<category([^>]*)>([\s\S]*?)<\/category>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(itemXml))) {
    const attrs = m[1];
    if (!attrs.includes(`domain="${domain}"`) && !attrs.includes(`domain='${domain}'`)) continue;
    const name = decodeXmlEntities(m[2].trim());
    if (name) names.push(name);
  }
  return names;
}

function extractImagesFromContent(html: string | null): { url: string }[] {
  if (!html) return [];
  const images: { url: string }[] = [];
  const re = /<img[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) images.push({ url: m[1] });
  return images;
}

function extractEnclosureUrl(itemXml: string): string | null {
  const match = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function stripHtml(html: string | null): string | null {
  if (!html) return null;
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text || null;
}

function normalizeStatus(raw: string | undefined): ImportRecord['status'] {
  const value = (raw || '').trim().toLowerCase();
  if (value === 'publish' || value === 'published') return 'published';
  if (value === 'private' || value === 'trash') return 'archived';
  return 'draft';
}

function priceToMinorUnits(raw: string | undefined): number {
  if (!raw) return 0;
  const major = Number.parseFloat(raw.trim().replace(',', '.'));
  if (!Number.isFinite(major) || major < 0) return 0;
  return Math.round(major * 100);
}

/**
 * Lightweight, tolerant WXR (WordPress eXtended RSS) parser for `<item>` nodes whose
 * `wp:post_type` is `product`. Uses regex/string scanning instead of a DOM parser
 * (no DOM available in Workers). Not a full XML parser — pragmatic, not perfect.
 */
export function parseToRecords(input: string, _mapping?: MappingProfile): ImportRecord[] {
  const items = extractItems(input);
  const records: ImportRecord[] = [];

  for (const itemXml of items) {
    const postType = extractTagContent(itemXml, 'wp:post_type');
    if (postType && postType.trim() !== 'product') continue;

    const title = extractTagContent(itemXml, 'title');
    if (!title) continue;

    const postName = extractTagContent(itemXml, 'wp:post_name');
    const slug = postName?.trim() || slugify(title);

    const meta = extractPostMeta(itemXml);
    const sku = meta.get('_sku')?.trim() || null;
    const price = priceToMinorUnits(meta.get('_regular_price') || meta.get('_price'));
    const stock = Math.max(0, Math.trunc(Number(meta.get('_stock')) || 0));

    const status = normalizeStatus(extractTagContent(itemXml, 'wp:status') ?? undefined);

    const contentHtml = extractTagContent(itemXml, 'content:encoded');
    const description = stripHtml(contentHtml);

    const categories = extractCategories(itemXml, 'product_cat');
    const brand = extractCategories(itemXml, 'product_brand')[0] || null;

    const images = extractImagesFromContent(contentHtml);
    const enclosureUrl = extractEnclosureUrl(itemXml);
    if (enclosureUrl && !images.some((img) => img.url === enclosureUrl)) {
      images.unshift({ url: enclosureUrl });
    }

    records.push({
      name: title,
      slug,
      sku,
      description,
      price,
      stock,
      status,
      brand,
      categories,
      media: images,
    });
  }

  return records;
}
