import type { APIRoute } from 'astro';
import { getRssPosts } from '../server/services/posts';
import { getSeoDefaults } from '../server/services/seo';

export const prerender = false;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export const GET: APIRoute = async ({ url }) => {
  const [{ data: posts, status }, { data: defaults }] = await Promise.all([
    getRssPosts(),
    getSeoDefaults(),
  ]);
  const origin = url.origin;
  const siteName = defaults?.siteName ?? 'Catalog CMS';
  const description = defaults?.defaultDescription ?? 'Blog';
  const items = posts ?? [];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)} Blog</title>
    <link>${origin}/blog</link>
    <description>${escapeXml(description)}</description>
    <language>tr</language>
    <atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml" />
${items
  .map((post) => {
    const link = `${origin}/blog/${post.slug}`;
    const desc = post.excerpt || stripHtml(post.content).slice(0, 280);
    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${post.publishedAt ? new Date(post.publishedAt).toUTCString() : new Date(post.updatedAt).toUTCString()}</pubDate>
      <description>${escapeXml(desc)}</description>
    </item>`;
  })
  .join('\n')}
  </channel>
</rss>`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'X-Cache': status,
    },
  });
};
