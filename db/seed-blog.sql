-- FAZ 6: sample blog posts (sanitized HTML content)
PRAGMA foreign_keys = ON;

DELETE FROM post_tags WHERE post_id LIKE 'post_%';
DELETE FROM posts WHERE id LIKE 'post_%';
DELETE FROM seo_meta WHERE id LIKE 'seo_post_%';

INSERT INTO seo_meta (id, title, description, canonical, og_image_media_id, og_image_url, noindex, robots_extra, created_at, updated_at) VALUES
  ('seo_post_welcome', 'Catalog CMS’e hoş geldiniz', 'Blog modülünün ilk yazısı.', NULL, NULL, NULL, 0, NULL, '2026-07-20T10:00:00.000Z', '2026-07-20T10:00:00.000Z'),
  ('seo_post_edge', 'Edge’de katalog yayınlamak', 'Workers + D1 + KV ile hızlı katalog.', NULL, NULL, NULL, 0, NULL, '2026-07-22T10:00:00.000Z', '2026-07-22T10:00:00.000Z');

INSERT INTO posts (id, slug, title, excerpt, content, status, published_at, author_id, cover_media_id, seo_id, created_at, updated_at) VALUES
  (
    'post_welcome',
    'hosgeldiniz',
    'Catalog CMS’e hoş geldiniz',
    'Blog modülü FAZ 6 ile açıldı. İçerik formatı sanitize edilmiş HTML.',
    '<p>Catalog CMS artık blog yazılarını da yönetiyor.</p><p>İçerik <strong>sanitize edilmiş HTML</strong> olarak saklanır (MDX yok).</p><ul><li>Taslak / yayın / planlı yayın</li><li>Etiketler</li><li>Article JSON-LD + RSS</li></ul>',
    'published',
    '2026-07-20T10:00:00.000Z',
    NULL,
    NULL,
    'seo_post_welcome',
    '2026-07-20T10:00:00.000Z',
    '2026-07-20T10:00:00.000Z'
  ),
  (
    'post_edge',
    'edge-katalog',
    'Edge’de katalog yayınlamak',
    'Cloudflare Workers üzerinde SSR + KV cache-first yaklaşımı.',
    '<p>Public sayfalar KV cache-first okur; yazımlarda hedefli invalidation yapılır.</p><p>Bu yazı blog-preview section’ını da besler.</p>',
    'published',
    '2026-07-22T12:00:00.000Z',
    NULL,
    NULL,
    'seo_post_edge',
    '2026-07-22T10:00:00.000Z',
    '2026-07-22T12:00:00.000Z'
  ),
  (
    'post_draft',
    'taslak-yazi',
    'Taslak yazı',
    'Henüz yayınlanmadı.',
    '<p>Bu yazı yalnızca admin’de görünür.</p>',
    'draft',
    NULL,
    NULL,
    NULL,
    NULL,
    '2026-07-25T10:00:00.000Z',
    '2026-07-25T10:00:00.000Z'
  );

INSERT INTO post_tags (post_id, tag) VALUES
  ('post_welcome', 'duyuru'),
  ('post_welcome', 'cms'),
  ('post_edge', 'cloudflare'),
  ('post_edge', 'performans');

-- Wire home blog-preview section when home page exists
DELETE FROM page_sections WHERE id = 'sec_home_blog';
INSERT INTO page_sections (id, page_id, type, position, is_visible, config_json, created_at, updated_at)
SELECT
  'sec_home_blog',
  'page_home',
  'blog-preview',
  4,
  1,
  '{"title":"Blog","limit":3}',
  '2026-07-27T00:00:00.000Z',
  '2026-07-27T00:00:00.000Z'
WHERE EXISTS (SELECT 1 FROM pages WHERE id = 'page_home');

UPDATE page_sections SET position = 5 WHERE id = 'sec_home_cta' AND position = 4;
