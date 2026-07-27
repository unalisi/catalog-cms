-- FAZ 1 seed: 1 brand, 2 categories, 5 products (prices in minor units / kuruş)
PRAGMA foreign_keys = ON;

DELETE FROM product_categories;
DELETE FROM product_variants;
DELETE FROM product_media;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM brands;
DELETE FROM seo_meta;
DELETE FROM media;
DELETE FROM settings;

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at) VALUES
  ('med_placeholder', 'seed/placeholder.svg', '/favicon.svg', 64, 64, 'Ürün görseli', 'image/svg+xml', 0, 'seed', '2026-07-27T00:00:00.000Z');

INSERT INTO seo_meta (id, title, description, canonical, og_image_media_id, noindex, robots_extra, created_at, updated_at) VALUES
  ('seo_brand_nord', 'Nord Teknik', 'Nord Teknik marka sayfası', NULL, NULL, 0, NULL, '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('seo_cat_elektronik', 'Elektronik', 'Elektronik ürünleri', NULL, NULL, 0, NULL, '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('seo_cat_aksesuar', 'Aksesuar', 'Aksesuar ürünleri', NULL, NULL, 0, NULL, '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('seo_prod_kulaklik', 'Nord Quiet ANC Kulaklık', 'Gürültü engelleyen kablosuz kulaklık', NULL, NULL, 0, NULL, '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('seo_prod_mouse', 'Nord Pro Mouse', 'Ergonomik kablosuz mouse', NULL, NULL, 0, NULL, '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('seo_prod_klavye', 'Nord Mech Klavye', 'Mekanik ofis klavyesi', NULL, NULL, 0, NULL, '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('seo_prod_hub', 'Nord USB-C Hub', '7 portlu USB-C hub', NULL, NULL, 0, NULL, '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('seo_prod_stand', 'Nord Laptop Stand', 'Alüminyum laptop standı', NULL, NULL, 0, NULL, '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z');

INSERT INTO brands (id, slug, name, description, logo_media_id, seo_id, status, created_at, updated_at) VALUES
  ('brand_nord', 'nord-teknik', 'Nord Teknik', 'Dayanıklı ofis ve üretkenlik ekipmanları.', 'med_placeholder', 'seo_brand_nord', 'published', '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z');

INSERT INTO categories (id, slug, name, parent_id, description, image_media_id, seo_id, position, status, created_at, updated_at) VALUES
  ('cat_elektronik', 'elektronik', 'Elektronik', NULL, 'Bilgisayar çevre birimleri ve ses.', NULL, 'seo_cat_elektronik', 1, 'published', '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z'),
  ('cat_aksesuar', 'aksesuar', 'Aksesuar', NULL, 'Masaüstü ve taşınabilir aksesuarlar.', NULL, 'seo_cat_aksesuar', 2, 'published', '2026-07-27T00:00:00.000Z', '2026-07-27T00:00:00.000Z');

INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at) VALUES
  ('prod_kulaklik', 'nord-quiet-anc', 'NRD-ANC-01', 'Nord Quiet ANC', 'Aktif gürültü engelleme ve 30 saat pil.', 499900, 549900, 'TRY', 42, 'published', 'brand_nord', 'seo_prod_kulaklik', 'med_placeholder', '2026-07-01T10:00:00.000Z', '2026-07-01T10:00:00.000Z', '2026-07-20T10:00:00.000Z'),
  ('prod_mouse', 'nord-pro-mouse', 'NRD-MSE-02', 'Nord Pro Mouse', 'Sessiz tık ve uzun pil ömrü.', 129900, NULL, 'TRY', 120, 'published', 'brand_nord', 'seo_prod_mouse', 'med_placeholder', '2026-07-02T10:00:00.000Z', '2026-07-02T10:00:00.000Z', '2026-07-21T10:00:00.000Z'),
  ('prod_klavye', 'nord-mech-klavye', 'NRD-KEY-03', 'Nord Mech Klavye', 'Hot-swap switch destekli mekanik klavye.', 349900, 379900, 'TRY', 35, 'published', 'brand_nord', 'seo_prod_klavye', 'med_placeholder', '2026-07-03T10:00:00.000Z', '2026-07-03T10:00:00.000Z', '2026-07-22T10:00:00.000Z'),
  ('prod_hub', 'nord-usbc-hub', 'NRD-HUB-04', 'Nord USB-C Hub', 'HDMI, Ethernet ve SD kart okuyucu.', 189900, NULL, 'TRY', 80, 'published', 'brand_nord', 'seo_prod_hub', 'med_placeholder', '2026-07-04T10:00:00.000Z', '2026-07-04T10:00:00.000Z', '2026-07-23T10:00:00.000Z'),
  ('prod_stand', 'nord-laptop-stand', 'NRD-STN-05', 'Nord Laptop Stand', 'Ayarlanabilir yükseklik, kablo yönetimi.', 99900, 119900, 'TRY', 64, 'published', 'brand_nord', 'seo_prod_stand', 'med_placeholder', '2026-07-05T10:00:00.000Z', '2026-07-05T10:00:00.000Z', '2026-07-24T10:00:00.000Z');

INSERT INTO product_categories (product_id, category_id) VALUES
  ('prod_kulaklik', 'cat_elektronik'),
  ('prod_mouse', 'cat_elektronik'),
  ('prod_klavye', 'cat_elektronik'),
  ('prod_hub', 'cat_elektronik'),
  ('prod_hub', 'cat_aksesuar'),
  ('prod_stand', 'cat_aksesuar');

INSERT INTO product_variants (id, product_id, sku, name, price, stock, attributes_json, position, created_at, updated_at) VALUES
  ('var_kulaklik_siyah', 'prod_kulaklik', 'NRD-ANC-01-BLK', 'Siyah', 499900, 22, '{"color":"siyah"}', 1, '2026-07-01T10:00:00.000Z', '2026-07-01T10:00:00.000Z'),
  ('var_kulaklik_beyaz', 'prod_kulaklik', 'NRD-ANC-01-WHT', 'Beyaz', 499900, 20, '{"color":"beyaz"}', 2, '2026-07-01T10:00:00.000Z', '2026-07-01T10:00:00.000Z');

INSERT INTO settings (key, value_json, updated_at) VALUES
  ('site', '{"name":"Catalog CMS","tagline":"Ürün kataloğu. Hızlı. SEO odaklı."}', '2026-07-27T00:00:00.000Z');
