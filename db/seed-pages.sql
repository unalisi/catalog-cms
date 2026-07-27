-- FAZ 4: home page + starter sections (idempotent)
PRAGMA foreign_keys = ON;

DELETE FROM page_sections WHERE page_id = 'page_home';
DELETE FROM pages WHERE id = 'page_home';
DELETE FROM seo_meta WHERE id = 'seo_page_home';

INSERT INTO seo_meta (id, title, description, canonical, og_image_media_id, noindex, robots_extra, created_at, updated_at) VALUES
  ('seo_page_home', 'Catalog CMS', 'Ürün kataloğu. Hızlı. SEO odaklı.', NULL, NULL, 0, NULL, '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z');

INSERT INTO pages (id, slug, title, status, seo_id, created_at, updated_at) VALUES
  ('page_home', 'home', 'Ana Sayfa', 'published', 'seo_page_home', '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z');

INSERT INTO page_sections (id, page_id, type, position, is_visible, config_json, created_at, updated_at) VALUES
  ('sec_home_hero', 'page_home', 'hero', 0, 1,
   '{"eyebrow":"Catalog CMS","title":"Ürün kataloğu. Hızlı. SEO odaklı.","subtitle":"Cloudflare Workers + D1 + KV ile yayınlanan katalog.","ctaLabel":"Kataloğa git","ctaHref":"/catalog","secondaryCtaLabel":"Admin paneli","secondaryCtaHref":"/admin"}',
   '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('sec_home_featured', 'page_home', 'featured-products', 1, 1,
   '{"title":"Öne çıkan ürünler","limit":5}',
   '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('sec_home_brands', 'page_home', 'brand-strip', 2, 1,
   '{"title":"Markalar"}',
   '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('sec_home_categories', 'page_home', 'category-grid', 3, 1,
   '{"title":"Kategoriler","columns":2}',
   '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('sec_home_cta', 'page_home', 'banner-cta', 4, 1,
   '{"title":"Kataloğu keşfedin","body":"Ürünleri inceleyin, marka ve kategorilere göz atın.","ctaLabel":"Kataloğa git","ctaHref":"/catalog"}',
   '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z');
