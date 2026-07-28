-- FAZ 4+: home page + premium section starter set (idempotent)
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
   '{"variant":"slider","overlay":"dark","eyebrow":"Catalog CMS","title":"Ürün kataloğu. Hızlı. SEO odaklı.","subtitle":"Cloudflare Workers + D1 + KV ile yayınlanan katalog.","ctaLabel":"Kataloğa git","ctaHref":"/catalog","secondaryCtaLabel":"İletişim","secondaryCtaHref":"/iletisim","imageUrl":"","imageAlt":"","slides":[{"imageUrl":"","imageAlt":"","eyebrow":"Endüstriyel çözüm","title":"Otomasyon ve kontrol ürünleri","subtitle":"Markalı ürünler, hızlı yayın, SEO odaklı katalog.","ctaLabel":"Kataloğa git","ctaHref":"/catalog"},{"imageUrl":"","imageAlt":"","eyebrow":"Teknik destek","title":"Doğru ürünü hızlı bulun","subtitle":"Kategori ve marka filtreleriyle keşfedin.","ctaLabel":"Kategoriler","ctaHref":"/catalog"},{"imageUrl":"","imageAlt":"","eyebrow":"Güvenilir tedarik","title":"Referanslı B2B katalog","subtitle":"Kurumsal iletişime hazır anasayfa bölümleri.","ctaLabel":"Teklif alın","ctaHref":"/iletisim"}]}',
   '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('sec_home_categories', 'page_home', 'category-grid', 1, 1,
   '{"title":"Kategoriler","columns":3}',
   '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('sec_home_brands', 'page_home', 'brand-strip', 2, 1,
   '{"title":"Markalar"}',
   '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('sec_home_why', 'page_home', 'why-us', 3, 1,
   '{"title":"Neden biz?","subtitle":"B2B katalog deneyimini hız ve netlik üzerine kuruyoruz.","items":[{"icon":"H","title":"Hızlı yayın","body":"Edge üzerinde SSR ve KV cache ile düşük gecikme."},{"icon":"S","title":"SEO odaklı","body":"Sayfa, ürün ve blog için yapılandırılmış meta ve sitemap."},{"icon":"T","title":"Teknik içerik","body":"Ürün, marka ve kategori verisi tek panelden yönetilir."},{"icon":"D","title":"Doğrudan iletişim","body":"Telefon, WhatsApp ve form kanalları anasayfada."}]}',
   '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('sec_home_featured', 'page_home', 'featured-products', 4, 1,
   '{"title":"Öne çıkan ürünler","limit":6}',
   '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('sec_home_channels', 'page_home', 'contact-channels', 5, 1,
   '{"title":"Bize ulaşın","items":[{"type":"phone","label":"Satış hattı","value":"+90 212 000 00 00"},{"type":"whatsapp","label":"WhatsApp","value":"902120000000"},{"type":"form","label":"Teklif formu","value":"/iletisim"}]}',
   '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('sec_home_refs', 'page_home', 'references', 6, 1,
   '{"title":"Referanslar","logos":[]}',
   '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('sec_home_blog', 'page_home', 'blog-preview', 7, 1,
   '{"title":"Blog","limit":3}',
   '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('sec_home_map', 'page_home', 'map-contact', 8, 1,
   '{"title":"İletişim","address":"Örnek Mah. Sanayi Cad. No:1, İstanbul","phone":"+90 212 000 00 00","email":"info@example.com","mapEmbedUrl":"","ctaLabel":"İletişim sayfası","ctaHref":"/iletisim"}',
   '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('sec_home_faq', 'page_home', 'faq', 9, 1,
   '{"title":"Sık sorulan sorular","items":[{"question":"Ürün fiyatları güncel mi?","answer":"Yayınlanan ürün fiyatları panelden yönetilir ve anında yayınlanır."},{"question":"Teklif nasıl alırım?","answer":"İletişim kanallarından telefon, WhatsApp veya form üzerinden ulaşabilirsiniz."},{"question":"Katalog hangi ürünleri kapsar?","answer":"Marka ve kategori ağacındaki yayınlanmış ürünler public kataloğa düşer."}]}',
   '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z');
