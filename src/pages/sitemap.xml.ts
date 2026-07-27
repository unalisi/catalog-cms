import type { APIRoute } from 'astro';
import { getSitemapUrls } from '../server/services/catalog';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const { data: entries, status } = await getSitemapUrls();
  const origin = url.origin;
  const urls = entries ?? [];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (entry) => `  <url>
    <loc>${origin}${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'X-Cache': status,
    },
  });
};
