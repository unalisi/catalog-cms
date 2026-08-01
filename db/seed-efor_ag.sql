-- Efor ingest efor_ag (idempotent)
PRAGMA foreign_keys = ON;
DELETE FROM product_categories WHERE product_id LIKE 'efor_ag_prod_%';
DELETE FROM product_media WHERE product_id LIKE 'efor_ag_prod_%';
DELETE FROM products WHERE id LIKE 'efor_ag_prod_%';
DELETE FROM media WHERE id LIKE 'efor_ag_med_%';

INSERT INTO categories (id, slug, name, parent_id, description, position, status, created_at, updated_at)
       VALUES ('efor_cat_ag-urunleri', 'ag-urunleri', 'Ağ Ürünleri', NULL, NULL, 0, 'published', '2026-07-30T19:58:02.323Z', '2026-07-30T19:58:02.323Z')
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status='published', updated_at=excluded.updated_at;
INSERT INTO categories (id, slug, name, parent_id, description, position, status, created_at, updated_at)
       VALUES ('efor_cat_fiber-optik-kablo-f-o-k', 'fiber-optik-kablo-f-o-k', 'Fiber Optik Kablo (F.O.K)', NULL, NULL, 0, 'published', '2026-07-30T19:58:02.323Z', '2026-07-30T19:58:02.323Z')
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status='published', updated_at=excluded.updated_at;
INSERT INTO categories (id, slug, name, parent_id, description, position, status, created_at, updated_at)
       VALUES ('efor_cat_router-yonlendirici', 'router-yonlendirici', 'Router (Yönlendirici)', NULL, NULL, 0, 'published', '2026-07-30T19:58:02.323Z', '2026-07-30T19:58:02.323Z')
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status='published', updated_at=excluded.updated_at;
INSERT INTO categories (id, slug, name, parent_id, description, position, status, created_at, updated_at)
       VALUES ('efor_cat_ethernet-swhitch-hub', 'ethernet-swhitch-hub', 'Ethernet Swhitch (Hub)', NULL, NULL, 0, 'published', '2026-07-30T19:58:02.323Z', '2026-07-30T19:58:02.323Z')
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status='published', updated_at=excluded.updated_at;
INSERT INTO categories (id, slug, name, parent_id, description, position, status, created_at, updated_at)
       VALUES ('efor_cat_firewall-urunleri', 'firewall-urunleri', 'Firewall Ürünleri', NULL, NULL, 0, 'published', '2026-07-30T19:58:02.323Z', '2026-07-30T19:58:02.323Z')
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status='published', updated_at=excluded.updated_at;
INSERT INTO categories (id, slug, name, parent_id, description, position, status, created_at, updated_at)
       VALUES ('efor_cat_poe-injector-splitter', 'poe-injector-splitter', 'POE Injector - Splitter', NULL, NULL, 0, 'published', '2026-07-30T19:58:02.323Z', '2026-07-30T19:58:02.323Z')
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status='published', updated_at=excluded.updated_at;
INSERT INTO categories (id, slug, name, parent_id, description, position, status, created_at, updated_at)
       VALUES ('efor_cat_access-point', 'access-point', 'Access Point', NULL, NULL, 0, 'published', '2026-07-30T19:58:02.323Z', '2026-07-30T19:58:02.323Z')
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status='published', updated_at=excluded.updated_at;
INSERT INTO brands (id, slug, name, description, status, created_at, updated_at)
       VALUES ('efor_brand_genel-markalar', 'genel-markalar', 'Genel Markalar', NULL, 'published', '2026-07-30T19:58:02.323Z', '2026-07-30T19:58:02.323Z')
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status='published', updated_at=excluded.updated_at;
INSERT INTO brands (id, slug, name, description, status, created_at, updated_at)
       VALUES ('efor_brand_mikrotik', 'mikrotik', 'Mikrotik', NULL, 'published', '2026-07-30T19:58:02.323Z', '2026-07-30T19:58:02.323Z')
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status='published', updated_at=excluded.updated_at;
INSERT INTO brands (id, slug, name, description, status, created_at, updated_at)
       VALUES ('efor_brand_teltonika', 'teltonika', 'Teltonika', NULL, 'published', '2026-07-30T19:58:02.323Z', '2026-07-30T19:58:02.323Z')
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status='published', updated_at=excluded.updated_at;
INSERT INTO brands (id, slug, name, description, status, created_at, updated_at)
       VALUES ('efor_brand_zyxel', 'zyxel', 'Zyxel', NULL, 'published', '2026-07-30T19:58:02.323Z', '2026-07-30T19:58:02.323Z')
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status='published', updated_at=excluded.updated_at;
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_01', 'media/2026/07/efor_ag_01_09e363d27530.png', '/media/media/2026/07/efor_ag_01_09e363d27530.png', NULL, NULL, 'LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord 20 Metre Kablo Turuncu', 'image/png', 358051, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_01',
         'efor-ag-7895-lc-lc-mm-50-125-om2-duplex-fiber-optik-patch-cord-20-metre-kablo-tu',
         'EFOR-AG-01',
         'LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord 20 Metre Kablo Turuncu',
         'LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord 20 Metre Kablo
&nbsp;

Ürün Açıklaması
LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord, yüksek hızlı veri iletimi gerektiren fiber optik ağlarda güvenilir bağlantı sağlamak amacıyla tasarlanmıştır.

Her iki ucunda LC konnektör bulunan duplex (çift damarlı) yapısı sayesinde switch, sunucu, patch panel, medya dönüştürücü, SFP modülleri ve ağ ekipmanları arasında yüksek performanslı bağlantılar oluşturur.

OM2 50/125 µm multimode fiber yapısı sayesinde Gigabit Ethernet, Fibre Channel ve veri merkezi uygulamalarında düşük ek kayıp ve güvenilir sinyal iletimi sağlar.

Teknik Özellikler

Özellik
Değer

Ürün Tipi
Fiber Optik Patch Cord

Konnektör Tipi
LC – LC

Fiber Tipi
Multimode (MM)

Fiber Standardı
OM2

Fiber Çapı
50/125 µm

Yapı
Duplex (DX)

Kablo Uzunluğu
20 Metre

Dış Kılıf
LSZH / PVC (ürün modeline göre)

Kılıf Rengi
Turuncu

Kullanım Alanı
İç mekan

Uyumluluk
Gigabit Ethernet, Fibre Channel

Kullanım Alanları

• Veri merkezleri

• Server odaları

• Fiber patch paneller

• Switch bağlantıları

• SFP/SFP+ modülleri

• Telekom altyapıları

• Kurumsal ağ sistemleri

• Kampüs ağları

• Fiber optik haberleşme sistemleri

Ürün Avantajları
✔ LC-LC çift uç bağlantı

✔ OM2 Multimode fiber

✔ Düşük sinyal kaybı

✔ Yüksek bant genişliği

✔ Esnek ve dayanıklı yapı

✔ Tak-Çalıştır kullanım

✔ Profesyonel ağ çözümleri için ideal

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_genel-markalar',
         NULL,
         'efor_ag_med_01',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_01', 'efor_ag_med_01', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_01', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_01', 'efor_cat_fiber-optik-kablo-f-o-k');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_02', 'media/2026/07/efor_ag_02_e8057c397bad.png', '/media/media/2026/07/efor_ag_02_e8057c397bad.png', NULL, NULL, 'LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord 15 Metre Kablo Turuncu', 'image/png', 358051, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_02',
         'efor-ag-7893-lc-lc-mm-50-125-om2-duplex-fiber-optik-patch-cord-15-metre-kablo-tu',
         'EFOR-AG-02',
         'LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord 15 Metre Kablo Turuncu',
         'LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord 15 Metre Kablo
&nbsp;

Ürün Açıklaması
LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord, yüksek hızlı veri iletimi gerektiren fiber optik ağlarda güvenilir bağlantı sağlamak amacıyla tasarlanmıştır.

Her iki ucunda LC konnektör bulunan duplex (çift damarlı) yapısı sayesinde switch, sunucu, patch panel, medya dönüştürücü, SFP modülleri ve ağ ekipmanları arasında yüksek performanslı bağlantılar oluşturur.

OM2 50/125 µm multimode fiber yapısı sayesinde Gigabit Ethernet, Fibre Channel ve veri merkezi uygulamalarında düşük ek kayıp ve güvenilir sinyal iletimi sağlar.

Teknik Özellikler

Özellik
Değer

Ürün Tipi
Fiber Optik Patch Cord

Konnektör Tipi
LC – LC

Fiber Tipi
Multimode (MM)

Fiber Standardı
OM2

Fiber Çapı
50/125 µm

Yapı
Duplex (DX)

Kablo Uzunluğu
15 Metre

Dış Kılıf
LSZH / PVC (ürün modeline göre)

Kılıf Rengi
Turuncu

Kullanım Alanı
İç mekan

Uyumluluk
Gigabit Ethernet, Fibre Channel

Kullanım Alanları

• Veri merkezleri

• Server odaları

• Fiber patch paneller

• Switch bağlantıları

• SFP/SFP+ modülleri

• Telekom altyapıları

• Kurumsal ağ sistemleri

• Kampüs ağları

• Fiber optik haberleşme sistemleri

Ürün Avantajları
✔ LC-LC çift uç bağlantı

✔ OM2 Multimode fiber

✔ Düşük sinyal kaybı

✔ Yüksek bant genişliği

✔ Esnek ve dayanıklı yapı

✔ Tak-Çalıştır kullanım

✔ Profesyonel ağ çözümleri için ideal

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_genel-markalar',
         NULL,
         'efor_ag_med_02',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_02', 'efor_ag_med_02', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_02', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_02', 'efor_cat_fiber-optik-kablo-f-o-k');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_03', 'media/2026/07/efor_ag_03_b807a394ad10.png', '/media/media/2026/07/efor_ag_03_b807a394ad10.png', NULL, NULL, 'LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord 10 Metre Kablo Turuncu', 'image/png', 358051, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_03',
         'efor-ag-7891-lc-lc-mm-50-125-om2-duplex-fiber-optik-patch-cord-10-metre-kablo-tu',
         'EFOR-AG-03',
         'LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord 10 Metre Kablo Turuncu',
         'LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord 10 Metre Kablo
&nbsp;

Ürün Açıklaması
LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord, yüksek hızlı veri iletimi gerektiren fiber optik ağlarda güvenilir bağlantı sağlamak amacıyla tasarlanmıştır.

Her iki ucunda LC konnektör bulunan duplex (çift damarlı) yapısı sayesinde switch, sunucu, patch panel, medya dönüştürücü, SFP modülleri ve ağ ekipmanları arasında yüksek performanslı bağlantılar oluşturur.

OM2 50/125 µm multimode fiber yapısı sayesinde Gigabit Ethernet, Fibre Channel ve veri merkezi uygulamalarında düşük ek kayıp ve güvenilir sinyal iletimi sağlar.

Teknik Özellikler

Özellik
Değer

Ürün Tipi
Fiber Optik Patch Cord

Konnektör Tipi
LC – LC

Fiber Tipi
Multimode (MM)

Fiber Standardı
OM2

Fiber Çapı
50/125 µm

Yapı
Duplex (DX)

Kablo Uzunluğu
10 Metre

Dış Kılıf
LSZH / PVC (ürün modeline göre)

Kılıf Rengi
Turuncu

Kullanım Alanı
İç mekan

Uyumluluk
Gigabit Ethernet, Fibre Channel

Kullanım Alanları

• Veri merkezleri

• Server odaları

• Fiber patch paneller

• Switch bağlantıları

• SFP/SFP+ modülleri

• Telekom altyapıları

• Kurumsal ağ sistemleri

• Kampüs ağları

• Fiber optik haberleşme sistemleri

Ürün Avantajları
✔ LC-LC çift uç bağlantı

✔ OM2 Multimode fiber

✔ Düşük sinyal kaybı

✔ Yüksek bant genişliği

✔ Esnek ve dayanıklı yapı

✔ Tak-Çalıştır kullanım

✔ Profesyonel ağ çözümleri için ideal

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_genel-markalar',
         NULL,
         'efor_ag_med_03',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_03', 'efor_ag_med_03', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_03', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_03', 'efor_cat_fiber-optik-kablo-f-o-k');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_04', 'media/2026/07/efor_ag_04_5740f1db6e38.png', '/media/media/2026/07/efor_ag_04_5740f1db6e38.png', NULL, NULL, 'LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord 5 Metre Kablo Turuncu', 'image/png', 358051, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_04',
         'efor-ag-7886-lc-lc-mm-50-125-om2-duplex-fiber-optik-patch-cord-5-metre-kablo-tur',
         'EFOR-AG-04',
         'LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord 5 Metre Kablo Turuncu',
         'LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord 5 Metre Kablo
&nbsp;

Ürün Açıklaması
LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord, yüksek hızlı veri iletimi gerektiren fiber optik ağlarda güvenilir bağlantı sağlamak amacıyla tasarlanmıştır.

Her iki ucunda LC konnektör bulunan duplex (çift damarlı) yapısı sayesinde switch, sunucu, patch panel, medya dönüştürücü, SFP modülleri ve ağ ekipmanları arasında yüksek performanslı bağlantılar oluşturur.

OM2 50/125 µm multimode fiber yapısı sayesinde Gigabit Ethernet, Fibre Channel ve veri merkezi uygulamalarında düşük ek kayıp ve güvenilir sinyal iletimi sağlar.

Teknik Özellikler

Özellik
Değer

Ürün Tipi
Fiber Optik Patch Cord

Konnektör Tipi
LC – LC

Fiber Tipi
Multimode (MM)

Fiber Standardı
OM2

Fiber Çapı
50/125 µm

Yapı
Duplex (DX)

Kablo Uzunluğu
5 Metre

Dış Kılıf
LSZH / PVC (ürün modeline göre)

Kılıf Rengi
Turuncu

Kullanım Alanı
İç mekan

Uyumluluk
Gigabit Ethernet, Fibre Channel

Kullanım Alanları

• Veri merkezleri

• Server odaları

• Fiber patch paneller

• Switch bağlantıları

• SFP/SFP+ modülleri

• Telekom altyapıları

• Kurumsal ağ sistemleri

• Kampüs ağları

• Fiber optik haberleşme sistemleri

Ürün Avantajları
✔ LC-LC çift uç bağlantı

✔ OM2 Multimode fiber

✔ Düşük sinyal kaybı

✔ Yüksek bant genişliği

✔ Esnek ve dayanıklı yapı

✔ Tak-Çalıştır kullanım

✔ Profesyonel ağ çözümleri için ideal

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_genel-markalar',
         NULL,
         'efor_ag_med_04',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_04', 'efor_ag_med_04', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_04', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_04', 'efor_cat_fiber-optik-kablo-f-o-k');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_05', 'media/2026/07/efor_ag_05_3d7095ec1a31.png', '/media/media/2026/07/efor_ag_05_3d7095ec1a31.png', NULL, NULL, 'LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord 1,5 Metre Kablo Turuncu', 'image/png', 358051, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_05',
         'efor-ag-7883-lc-lc-mm-50-125-om2-duplex-fiber-optik-patch-cord-1-5-metre-kablo-t',
         'EFOR-AG-05',
         'LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord 1,5 Metre Kablo Turuncu',
         'LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord 1,5 Metre Kablo
&nbsp;

Ürün Açıklaması
LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord, yüksek hızlı veri iletimi gerektiren fiber optik ağlarda güvenilir bağlantı sağlamak amacıyla tasarlanmıştır.

Her iki ucunda LC konnektör bulunan duplex (çift damarlı) yapısı sayesinde switch, sunucu, patch panel, medya dönüştürücü, SFP modülleri ve ağ ekipmanları arasında yüksek performanslı bağlantılar oluşturur.

OM2 50/125 µm multimode fiber yapısı sayesinde Gigabit Ethernet, Fibre Channel ve veri merkezi uygulamalarında düşük ek kayıp ve güvenilir sinyal iletimi sağlar.

Teknik Özellikler

Özellik
Değer

Ürün Tipi
Fiber Optik Patch Cord

Konnektör Tipi
LC – LC

Fiber Tipi
Multimode (MM)

Fiber Standardı
OM2

Fiber Çapı
50/125 µm

Yapı
Duplex (DX)

Kablo Uzunluğu
1,5 Metre

Dış Kılıf
LSZH / PVC (ürün modeline göre)

Kılıf Rengi
Turuncu

Kullanım Alanı
İç mekan

Uyumluluk
Gigabit Ethernet, Fibre Channel

Kullanım Alanları

• Veri merkezleri

• Server odaları

• Fiber patch paneller

• Switch bağlantıları

• SFP/SFP+ modülleri

• Telekom altyapıları

• Kurumsal ağ sistemleri

• Kampüs ağları

• Fiber optik haberleşme sistemleri

Ürün Avantajları
✔ LC-LC çift uç bağlantı

✔ OM2 Multimode fiber

✔ Düşük sinyal kaybı

✔ Yüksek bant genişliği

✔ Esnek ve dayanıklı yapı

✔ Tak-Çalıştır kullanım

✔ Profesyonel ağ çözümleri için ideal

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_genel-markalar',
         NULL,
         'efor_ag_med_05',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_05', 'efor_ag_med_05', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_05', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_05', 'efor_cat_fiber-optik-kablo-f-o-k');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_06', 'media/2026/07/efor_ag_06_0490bacf582d.png', '/media/media/2026/07/efor_ag_06_0490bacf582d.png', NULL, NULL, 'LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord 3 Metre Kablo Turuncu', 'image/png', 358051, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_06',
         'efor-ag-7877-lc-lc-mm-50-125-om2-duplex-fiber-optik-patch-cord-3-metre-kablo-tur',
         'EFOR-AG-06',
         'LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord 3 Metre Kablo Turuncu',
         'LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord 3 Metre Kablo
&nbsp;

Ürün Açıklaması
LC-LC MM 50/125 OM2 Duplex Fiber Optik Patch Cord, yüksek hızlı veri iletimi gerektiren fiber optik ağlarda güvenilir bağlantı sağlamak amacıyla tasarlanmıştır.

Her iki ucunda LC konnektör bulunan duplex (çift damarlı) yapısı sayesinde switch, sunucu, patch panel, medya dönüştürücü, SFP modülleri ve ağ ekipmanları arasında yüksek performanslı bağlantılar oluşturur.

OM2 50/125 µm multimode fiber yapısı sayesinde Gigabit Ethernet, Fibre Channel ve veri merkezi uygulamalarında düşük ek kayıp ve güvenilir sinyal iletimi sağlar.

Teknik Özellikler

Özellik
Değer

Ürün Tipi
Fiber Optik Patch Cord

Konnektör Tipi
LC – LC

Fiber Tipi
Multimode (MM)

Fiber Standardı
OM2

Fiber Çapı
50/125 µm

Yapı
Duplex (DX)

Kablo Uzunluğu
3 Metre

Dış Kılıf
LSZH / PVC (ürün modeline göre)

Kılıf Rengi
Turuncu

Kullanım Alanı
İç mekan

Uyumluluk
Gigabit Ethernet, Fibre Channel

Kullanım Alanları

• Veri merkezleri

• Server odaları

• Fiber patch paneller

• Switch bağlantıları

• SFP/SFP+ modülleri

• Telekom altyapıları

• Kurumsal ağ sistemleri

• Kampüs ağları

• Fiber optik haberleşme sistemleri

Ürün Avantajları
✔ LC-LC çift uç bağlantı

✔ OM2 Multimode fiber

✔ Düşük sinyal kaybı

✔ Yüksek bant genişliği

✔ Esnek ve dayanıklı yapı

✔ Tak-Çalıştır kullanım

✔ Profesyonel ağ çözümleri için ideal

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_genel-markalar',
         NULL,
         'efor_ag_med_06',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_06', 'efor_ag_med_06', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_06', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_06', 'efor_cat_fiber-optik-kablo-f-o-k');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_07', 'media/2026/07/efor_ag_07_82a7f570a44b.png', '/media/media/2026/07/efor_ag_07_82a7f570a44b.png', NULL, NULL, 'LC-LC Fiber Optik Patch Kablo Turuncu, Multimode OM 1 62.5/125 Duplex, 3.0mm, LSZH, 15 metre', 'image/png', 387444, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_07',
         'efor-ag-7798-lc-lc-fiber-optik-patch-kablo-turuncu-multimode-om-1-62-5-125-duple',
         'EFOR-AG-07',
         'LC-LC Fiber Optik Patch Kablo Turuncu, Multimode OM 1 62.5/125 Duplex, 3.0mm, LSZH, 15 metre',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_genel-markalar',
         NULL,
         'efor_ag_med_07',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_07', 'efor_ag_med_07', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_07', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_07', 'efor_cat_fiber-optik-kablo-f-o-k');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_08', 'media/2026/07/efor_ag_08_87982299ff22.png', '/media/media/2026/07/efor_ag_08_87982299ff22.png', NULL, NULL, 'LC-LC Fiber Optik Patch Kablo Turuncu, Multimode OM 1 62.5/125 Duplex, 3.0mm, LSZH, 10 metre', 'image/png', 387444, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_08',
         'efor-ag-7795-lc-lc-fiber-optik-patch-kablo-turuncu-multimode-om-1-62-5-125-duple',
         'EFOR-AG-08',
         'LC-LC Fiber Optik Patch Kablo Turuncu, Multimode OM 1 62.5/125 Duplex, 3.0mm, LSZH, 10 metre',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_genel-markalar',
         NULL,
         'efor_ag_med_08',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_08', 'efor_ag_med_08', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_08', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_08', 'efor_cat_fiber-optik-kablo-f-o-k');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_09', 'media/2026/07/efor_ag_09_7971a40bba4d.png', '/media/media/2026/07/efor_ag_09_7971a40bba4d.png', NULL, NULL, 'LC-LC Fiber Optik Patch Kablo Turuncu, Multimode OM 1 62.5/125 Duplex, 3.0mm, LSZH, 5 metre', 'image/png', 387444, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_09',
         'efor-ag-7793-lc-lc-fiber-optik-patch-kablo-turuncu-multimode-om-1-62-5-125-duple',
         'EFOR-AG-09',
         'LC-LC Fiber Optik Patch Kablo Turuncu, Multimode OM 1 62.5/125 Duplex, 3.0mm, LSZH, 5 metre',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_genel-markalar',
         NULL,
         'efor_ag_med_09',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_09', 'efor_ag_med_09', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_09', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_09', 'efor_cat_fiber-optik-kablo-f-o-k');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_10', 'media/2026/07/efor_ag_10_9f89cd9edcbe.png', '/media/media/2026/07/efor_ag_10_9f89cd9edcbe.png', NULL, NULL, 'LC-LC Fiber Optik Patch Kablo Turuncu, Multimode OM 1 62.5/125 Duplex, 3.0mm, LSZH, 3 metre', 'image/png', 387444, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_10',
         'efor-ag-7790-lc-lc-fiber-optik-patch-kablo-turuncu-multimode-om-1-62-5-125-duple',
         'EFOR-AG-10',
         'LC-LC Fiber Optik Patch Kablo Turuncu, Multimode OM 1 62.5/125 Duplex, 3.0mm, LSZH, 3 metre',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_genel-markalar',
         NULL,
         'efor_ag_med_10',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_10', 'efor_ag_med_10', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_10', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_10', 'efor_cat_fiber-optik-kablo-f-o-k');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_11', 'media/2026/07/efor_ag_11_160970b452f5.png', '/media/media/2026/07/efor_ag_11_160970b452f5.png', NULL, NULL, 'Mikrotik RB1100AHx4 Router Board Dude Edition', 'image/png', 146310, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_11',
         'efor-ag-7167-mikrotik-rb1100ahx4-router-board-dude-edition',
         'EFOR-AG-11',
         'Mikrotik RB1100AHx4 Router Board Dude Edition',
         'Mikrotik RB1100AHx4 Router Board Dude Edition

MikroTik RB1100AHx4 Router Board Dude Edition, güçlü ağ yönetimi ve yüksek performans gereksinimlerini karşılamak isteyen işletmeler ve ağ yöneticileri için mükemmel bir çözüm sunar. Quad-core işlemci, 10 Gigabit Ethernet portu ve 1 GB RAM gibi gelişmiş özellikleriyle, yüksek hızlı veri iletimi ve çoklu bağlantı desteği sağlar. Dude Edition versiyonu, MikroTik''in Dude ağ yönetim yazılımı ile entegre olarak ağ izleme ve yönetimi konusunda profesyonel çözümler sunar. Bu özellikler, kapsama alanı genişletme, ağ optimizasyonu ve gelişmiş güvenlik sağlamak için idealdir. MikroTik RB1100AHx4, her türlü ağ altyapısı için ideal bir cihazdır ve ağ yöneticilerinin ağlarını verimli bir şekilde yönetmelerine yardımcı olur.

MikroTik RB1100AHx4 Router Board Dude Edition Teknik Özellikler ve Performans

• 4 Çekirdekli Yüksek Performanslı İşlemci

MikroTik RB1100AHx4, 4 çekirdekli ARM Cortex-A53 işlemci ile yüksek hızda veri işleme sunar. Bu sayede, ağ üzerinde yoğun veri trafiği olsa bile cihazınızda herhangi bir performans kaybı yaşanmaz. Quad-core işlemci, çoklu ağ işlemleri ve yüksek performanslı yönlendirme işlemlerini sorunsuz şekilde gerçekleştirir.

• 10 Gigabit Ethernet Portu ve 13 Adet Ethernet Bağlantısı

10 Gigabit Ethernet portu ve 13 Ethernet portu sunarak, çoklu cihazların ve bağlantıların aynı anda sorunsuz çalışmasını sağlar. Yüksek hızda veri iletimi için idealdir ve aynı anda çok sayıda cihazı bağlayarak ağ trafiğinizi yönetmenize olanak tanır. Bu portlar, şirket ağları veya kapsama alanı genişletme ihtiyacı duyan büyük işletmeler için mükemmel bir çözüm sunar.

• Dude Ağ Yönetim Yazılımı

MikroTik RB1100AHx4 Dude Edition, Dude ağ yönetim yazılımı ile entegre çalışır. Bu yazılım, ağ yöneticilerinin ağlarını izlemelerine, kapsama alanını genişletmelerine ve performans optimizasyonu yapmalarına yardımcı olur. Gerçek zamanlı ağ izleme ve problemleri hızlı tespit etme özellikleri sayesinde, ağ yöneticileri herhangi bir bağlantı sorununu anında tespit edebilir ve hızlıca müdahale edebilir.

• Gelişmiş Güvenlik Özellikleri

MikroTik RB1100AHx4, gelişmiş güvenlik özellikleri sunarak ağınızın güvenliğini sağlar. Firewall, IPsec VPN desteği, QoS (Quality of Service) ve NAT (Network Address Translation) gibi özellikler, cihazınızı dış tehditlere karşı korur. Ayrıca, şifreleme protokolleri ile ağ üzerindeki verilerin güvenliği garanti altına alınır.

• Yüksek Depolama Kapasitesi

1 GB RAM ve şahane depolama kapasitesi ile cihaz, ağ üzerindeki veri akışını hızla işler ve çoklu uygulama desteği sağlar. Bu, ağınızı daha hızlı ve verimli bir şekilde yönetmenize olanak tanır. Aynı zamanda, ağ üzerindeki tüm cihazları izleyebilir ve sorunları anında çözebilirsiniz.

MikroTik RB1100AHx4 Router Board Dude Edition Avantajları

• 4 Çekirdekli ARM Cortex-A53 İşlemci: Yüksek işlem gücü ile sorunsuz ağ yönetimi sağlar.

• 10 Gigabit Ethernet Portu: Yüksek hızda veri iletimi ve çoklu cihaz desteği.

• Dude Ağ Yönetim Yazılımı: Ağ yönetimini kolaylaştıran kapsamlı araçlar sunar.

• Gelişmiş Güvenlik Özellikleri: Ağınızı dış tehditlere karşı korur.

• Yüksek Depolama Kapasitesi: Hızlı veri işleme ve ağ yönetimi sağlar.

• Gelişmiş VPN ve Firewall Desteği: Şifreleme ve güvenlik önlemleri ile ağınızın güvenliğini artırır.

MikroTik RB1100AHx4 Router Board Dude Edition Uygulama ve Kullanım Alanları

MikroTik RB1100AHx4 Dude Edition, büyük işletmeler ve ağ yöneticileri için yüksek performanslı ağ yönetimi çözümleri sunar. Dude ağ yönetim yazılımı ile ağ izleme ve performans optimizasyonu yaparak ağınızı kolayca yönetebilirsiniz. 10 Gigabit Ethernet portları, çoklu cihazların bağlanmasını sağlar ve yüksek hızda veri iletimi gerektiren uygulamalarda mükemmel performans gösterir. Gelişmiş güvenlik özellikleri ile ağınızda güvenliği sağlayarak, VPN ve firewall desteği ile dış tehditlere karşı koruma sağlar. Hem ofislerde hem de kapsama alanı genişletme gereksinimi olan büyük ağlarda idealdir.

Sonuç

MikroTik RB1100AHx4 Router Board Dude Edition, yüksek performanslı ağ yönetimi sağlayan, gelişmiş özellikler sunan bir cihazdır. 4 çekirdekli işlemci, 10 Gigabit Ethernet portları, Dude ağ yönetim yazılımı entegrasyonu ve gelişmiş güvenlik önlemleri, cihazı profesyonel ağ yöneticileri ve büyük işletmeler için mükemmel bir çözüm haline getirir. Hızlı ve güvenilir ağ bağlantıları sunan bu cihaz, ağ yönetiminde verimliliği artırır ve güvenliği sağlamlaştırır. MikroTik RB1100AHx4, ağ altyapınızı profesyonel bir şekilde yönetmek isteyenler için ideal bir tercihtir.

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_mikrotik',
         NULL,
         'efor_ag_med_11',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_11', 'efor_ag_med_11', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_11', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_11', 'efor_cat_router-yonlendirici');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_12', 'media/2026/07/efor_ag_12_6c28e8d64fd5.png', '/media/media/2026/07/efor_ag_12_6c28e8d64fd5.png', NULL, NULL, 'Mikrotik Router Board RB4011iGS+RM', 'image/png', 114337, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_12',
         'efor-ag-7162-mikrotik-router-board-rb4011igs-rm',
         'EFOR-AG-12',
         'Mikrotik Router Board RB4011iGS+RM',
         'Mikrotik Router Board RB4011iGS+RM
MikroTik RouterBoard RB4011iGS+RM

MikroTik RouterBoard RB4011iGS+RM, güçlü performansı ve kapsamlı özellikleri ile gelişmiş ağ yönetimi gereksinimlerini karşılayan bir yönlendirici cihazdır. 10 Gigabit Ethernet portu, 1.4 GHz dört çekirdekli işlemcisi ve 1 GB RAM kapasitesi ile yüksek hızda veri iletimi ve düşük gecikme süreleri sunar. RouterBoard RB4011iGS+RM, özellikle ev kullanıcıları, küçük ve orta ölçekli işletmeler, ISP''ler (Internet Servis Sağlayıcıları) ve gelişmiş ağ yöneticileri için mükemmel bir çözüm sunar. RouterOS işletim sistemi ile donatılmış olan bu cihaz, gelişmiş ağ yapılandırması ve yönetimi için güçlü araçlar sunar. Gigabit Ethernet portları ile hızlı veri aktarımı sağlarken, sınırsız VPN bağlantıları, gelişmiş güvenlik özellikleri ve yüksek bant genişliği desteği sunarak, her türlü ağ ortamında güvenilir ve stabil bir internet deneyimi sağlar.

MikroTik RouterBoard RB4011iGS+RM Teknik Özellikler ve Performans

• Güçlü İşlemci ve Yüksek RAM Kapasitesi

MikroTik RouterBoard RB4011iGS+RM, 1.4 GHz dört çekirdekli işlemci ve 1 GB RAM ile donatılmıştır. Bu özellikler, yüksek bant genişliği ve çok sayıda bağlantı gereksinimini karşılayarak, cihazın sorunsuz ve hızlı çalışmasını sağlar.

• 10 Gigabit Ethernet Portu

Cihazda bulunan 10 Gigabit Ethernet portu, yüksek hızda veri iletimi sağlar. 1 Gbps hızına kadar olan geleneksel Ethernet bağlantılarının ötesine geçerek, ağınızda çok daha yüksek hızlar elde edebilirsiniz. 10 Gbps Ethernet desteği, büyük dosya transferleri, yüksek çözünürlüklü video akışı ve yoğun ağ trafiği gereksinimlerini sorunsuzca karşılar.

• RouterOS ile Esnek Ağ Yönetimi

RouterOS, MikroTik’in güçlü ve esnek işletim sistemidir. RouterBoard RB4011iGS+RM, bu işletim sistemiyle donatıldığından, ağ yöneticilerine gelişmiş yapılandırma, izleme ve yönetim araçları sunar. VPN oluşturma, gelişmiş güvenlik duvarı kuralları, trafik şekillendirme, QOS (Quality of Service), NAT ve VLAN gibi özelliklerle ağ yönetimi daha kolay ve verimli hale gelir.

• Yüksek Güvenlik Özellikleri

RouterBoard RB4011iGS+RM, gelişmiş güvenlik özellikleri sunarak, ağınıza yönelik tehditleri engeller. DoS (Denial of Service) saldırıları, DDoS koruması ve gelişmiş firewall yönetimi ile ağınız her türlü dış tehditten korunur.

• Fanlı Soğutma Sistemi ve Dayanıklı Tasarım

Cihazın fanlı soğutma sistemi, cihazın yüksek performanslı çalışmasını sağlar ve aşırı ısınma gibi sorunları önler. Dış mekan kullanımı için dayanıklı bir yapıya sahip olan RouterBoard RB4011iGS+RM, 19 inçlik rack mount desteği ile sunucu odası gibi ortamlarda kolayca kurulabilir.

MikroTik RouterBoard RB4011iGS+RM Avantajları

• 1.4 GHz Dört Çekirdekli İşlemci: Yüksek işlem gücü ve hızlı veri iletimi sağlar.

• 10 Gigabit Ethernet Portu: Yüksek hızda veri aktarımı ve ağ bağlantıları sunar.

• RouterOS İle Esnek Yönetim: Gelişmiş ağ yönetimi ve yapılandırma araçları.

• Yüksek Güvenlik Özellikleri: DDoS koruması, firewall ve VPN desteği ile güvenli ağ yapısı.

• Fanlı Soğutma Sistemi: Isınma sorunlarını önleyerek cihazın stabil çalışmasını sağlar.

• 19 İnç Rack Mount Desteği: Sunucu odalarına kolay kurulum imkanı.

MikroTik RouterBoard RB4011iGS+RM Uygulama ve Kullanım Alanları

MikroTik RouterBoard RB4011iGS+RM, özellikle küçük ve orta ölçekli işletmeler ve ISP’ler (Internet Servis Sağlayıcıları) için mükemmel bir ağ yönetim çözümüdür. Yüksek trafik gereksinimlerine sahip ağlar ve veri merkezleri için idealdir. 10 Gigabit Ethernet portları sayesinde yüksek hızda veri iletimi ve gelişmiş VPN çözümleri sunar. RouterOS işletim sistemi, cihazın ağ yapılandırmasını ve yönetimini kolaylaştırarak, işletmelerin ağlarını verimli bir şekilde yönetmesine olanak tanır. Ayrıca, güvenlik ve ağ trafiği izleme ihtiyaçlarını karşılar.

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_mikrotik',
         NULL,
         'efor_ag_med_12',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_12', 'efor_ag_med_12', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_12', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_12', 'efor_cat_router-yonlendirici');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_13', 'media/2026/07/efor_ag_13_e41f8b72f864.png', '/media/media/2026/07/efor_ag_13_e41f8b72f864.png', NULL, NULL, 'Mikrotik RB260GS5 5 Port Gigabit – 1 Port SFP Switch', 'image/png', 221422, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_13',
         'efor-ag-7156-mikrotik-rb260gs5-5-port-gigabit-1-port-sfp-switch',
         'EFOR-AG-13',
         'Mikrotik RB260GS5 5 Port Gigabit – 1 Port SFP Switch',
         'Mikrotik RB260GS5 5 Port Gigabit – 1 Port SFP Switch
Mikrotik RB260GS5 5 Port Gigabit  – 1 Port SFP Switch, küçük ve orta ölçekli ağlar için yüksek hızda güvenilir ağ bağlantısı sağlayan kompakt bir switch modelidir. 5 x Gigabit Ethernet portu ve 1 x SFP portu ile esnek bağlantı seçenekleri sunar. SwOS (Switch OS) işletim sistemi ile donatılmış bu cihaz, ağ yönetimi ve yapılandırma konusunda kullanıcı dostu bir deneyim sunar. Düşük güç tüketimi ve yüksek performansı sayesinde, MikroTik RB260GS5, ofislerde, evlerde ve küçük işletmelerde ağ altyapısını güçlendirmek için mükemmel bir çözüm sunar.

Mikrotik RB260GS5 5 Port Gigabit  – 1 Port SFP Switch Teknik Özellikler ve Performans

• Yüksek Hızda Gigabit Ethernet Bağlantıları

MikroTik RB260GS5, 5 x Gigabit Ethernet portu ile ağınıza yüksek hızda veri iletimi sağlar. Bu, internet bağlantılarının hızını artırarak, video akışı, dosya transferleri ve diğer bant genişliği gereksinimlerini karşılamak için idealdir.

• SFP Portu ile Fiber Bağlantı Seçeneği

Bu modelde bulunan 1 x SFP portu, fiber bağlantı ile ağınızı daha da güçlendirmenize olanak tanır. SFP portu, özellikle veri merkezleri ve yüksek bant genişliği gereksinimlerinizi karşılamak isteyen kullanıcılar için önemlidir. Fiber bağlantı kullanarak ağınızda daha uzun mesafelerde yüksek hızda veri iletimi sağlanabilir.

• Kullanıcı Dostu SwOS İşletim Sistemi

SwOS (Switch OS), MikroTik’in kullanıcı dostu ve kolay yönetilen bir işletim sistemidir. Bu sistem, port bazlı ağ yönetimi, VLAN desteği, QoS (Quality of Service) ve daha birçok ağ yönetim özelliği sunar. Web tabanlı arayüzü sayesinde cihazınızı hızlı bir şekilde yapılandırabilir ve yönetebilirsiniz.

• Kompakt ve Verimli Tasarım

MikroTik RB260GS5, 113 x 58 x 28 mm boyutlarında kompakt bir tasarıma sahiptir. Masaüstü veya duvar montajı ile kullanabileceğiniz bu cihaz, ofislerde, evlerde veya küçük işyerlerinde minimal alan gereksinimi ile yerleştirilebilir.

• Dayanıklı Yapı ve Çalışma Koşulları

Bu switch, -20°C ile +60°C arasındaki geniş sıcaklık aralığında güvenli bir şekilde çalışabilir. MikroTik RB260GS5, dayanıklı yapısı ile zorlu çevre koşullarına karşı dirençlidir ve ağ performansını uzun süreli kullanımlarda sürdürülebilir bir şekilde sağlar.

Mikrotik RB260GS5 5 Port Gigabit  – 1 Port SFP Switch Avantajlari

• 5 x Gigabit Ethernet Portu: Yüksek hızda veri iletimi için 5 x Gigabit Ethernet portu.

• Esnek SFP Portu: 1 x SFP portu ile fiber bağlantı seçeneği, uzun mesafelerde yüksek hızda ağ bağlantıları sağlar.

• Kullanıcı Dostu SwOS: Web tabanlı yönetim arayüzü ile kolay ve hızlı cihaz yönetimi.

• Kompakt Tasarım: Küçük boyutlar ve esnek montaj seçenekleri ile her türlü ortama uyum sağlar.

• Düşük Güç Tüketimi: Maksimum 5W güç tüketimi ile enerji verimli kullanım.

• Dayanıklı Yapı: Geniş çalışma sıcaklığı aralığı ile zorlu çevre koşullarına dayanıklı.

Sonuç

Mikrotik RB260GS5 5 Port Gigabit  – 1 Port SFP Switch, kompakt yapısı ve güçlü özellikleriyle küçük ve orta ölçekli ağlar için mükemmel bir çözüm sunar. 5 x Gigabit Ethernet portu ve 1 x SFP portu, esnek ağ bağlantıları sağlar ve yüksek hızda veri iletimi sunar. SwOS işletim sistemi ile ağ yönetimini kolaylaştırır, kullanımı basit ve verimlidir. Düşük güç tüketimi ve dayanıklı yapısı ile uzun süreli kullanım için ideal bir seçimdir. MikroTik RB260GS5, ağ altyapınızı güçlendirmek ve verimli hale getirmek için mükemmel bir tercihtir.

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_mikrotik',
         NULL,
         'efor_ag_med_13',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_13', 'efor_ag_med_13', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_13', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_13', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_14', 'media/2026/07/efor_ag_14_10608fb01d5f.png', '/media/media/2026/07/efor_ag_14_10608fb01d5f.png', NULL, NULL, 'Mikrotik RB951Ui-2HnD Router – Firewall – Loglama', 'image/png', 249638, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_14',
         'efor-ag-7153-mikrotik-rb951ui-2hnd-router-firewall-loglama',
         'EFOR-AG-14',
         'Mikrotik RB951Ui-2HnD Router – Firewall – Loglama',
         'Mikrotik RB951Ui-2HnD Router – Firewall – Loglama
Mikrotik RB951Ui-2HnD Router – Firewall – Loglama, güvenilir ve yüksek performanslı bir kablosuz router olup, Firewall ve loglama özellikleri ile ağ güvenliğini ve yönetimini en üst seviyeye çıkarır. MikroTik''in güçlü RouterOS işletim sistemi ile donatılan bu cihaz, ağınızı güvenle yönetmenizi sağlar. 5 Ethernet portu, 2.4GHz Wi-Fi desteği ve USB 2.0 portu ile esnek ağ bağlantıları sunar. Bu router, küçük ofisler, ev ağları ve daha geniş ağlar için ideal bir çözümdür. MikroTik RB951Ui-2HnD, ağ trafiğini izlemek, yönetmek ve güvenliğini sağlamak için ihtiyacınız olan her şeyi sunar.

Mikrotik RB951Ui-2HnD Router – Firewall – Loglama Teknik Özellikler ve Performans

• Yüksek Performanslı İşlemci ve Güçlü Bellek

MikroTik RB951Ui-2HnD, 600 MHz, 1 çekirdekli işlemci ve 128 MB RAM ile ağ trafiğini hızlı ve verimli bir şekilde yönetir. 128 MB flash bellek, cihazın stabil çalışmasını ve ağ yapılandırmalarının güvenli bir şekilde depolanmasını sağlar

• 2.4GHz Kablosuz Bağlantı Desteği

2.4GHz Wi-Fi desteği sayesinde, 802.11b/g/n Wi-Fi standardı ile 300 Mbps hızına kadar kablosuz ağ bağlantısı sağlar. Cihazın Wi-Fi kapsama alanı, ev veya küçük ofislerde internet bağlantınızın her köşeye ulaşmasını sağlar.

• 5 Ethernet Portu ile Esnek Bağlantı Seçenekleri

MikroTik RB951Ui-2HnD, 5 x 10/100 Mbps Ethernet portu sunar. Bu portlar, cihazlar arasında hızlı veri iletimi ve yerel ağ bağlantıları için kullanılır. Ethernet bağlantıları, kablolu ağlar için daha stabil ve hızlı bağlantılar sunarak, yüksek hızda veri transferi ve güvenli internet erişimi sağlar.

• Firewall (Güvenlik Duvarı) Özellikleri

MikroTik RB951Ui-2HnD, gelişmiş Firewall özellikleri ile ağınızı dış tehditlere karşı korur. RouterOS üzerinden yapılandırılabilen güvenlik duvarı, IP filtreleme, port yönlendirme, NAT ve VPN bağlantıları gibi çeşitli güvenlik önlemleri almanızı sağlar.

• Loglama Özelliği ile Ağ İzleme

Loglama özelliği, ağ aktivitelerinin izlenmesi ve kaydedilmesi için önemli bir araçtır. MikroTik RB951Ui-2HnD, RouterOS işletim sistemi üzerinden tüm ağ trafiğini loglar ve kullanıcıların geçmiş aktivitelerini incelemenize olanak tanır.

• USB 2.0 Portu ile Ekstra Cihaz Bağlantısı

MikroTik RB951Ui-2HnD, 1 x USB 2.0 portu ile harici cihazların bağlanmasına olanak tanır. USB 2.0 portu, 3G/4G modemler, harici depolama cihazları veya ağ üzerindeki diğer donanımlar ile bağlantı kurmanıza imkan verir.

• Dayanıklı Yapı ve Geniş Çalışma Sıcaklığı

MikroTik RB951Ui-2HnD, -30°C ile +70°C arasındaki geniş çalışma sıcaklığı aralığı ile çeşitli çevre koşullarında güvenli bir şekilde çalışabilir. Cihazın sağlam yapısı, zorlu çalışma koşullarında bile güvenilir performans sunar.

• Düşük Güç Tüketimi

MikroTik RB951Ui-2HnD, maksimum 10W güç tüketimi ile enerji verimliliği sağlar. Bu özellik, cihazın uzun süreli kullanımda çevre dostu ve düşük maliyetli bir çözüm olmasını sağlar. 10-30V DC güç kaynağı ile çalışabilmesi, esnek kurulum seçenekleri sunar.

Mikrotik RB951Ui-2HnD Router – Firewall – Loglama Avantajları

• Yüksek Performans: 600 MHz işlemci ve 128 MB RAM ile hızlı ağ yönetimi.

• Kablosuz Bağlantı: 2.4GHz Wi-Fi ile 300 Mbps hızında kablosuz internet erişimi.

• Esnek Bağlantılar: 5 x 10/100 Mbps Ethernet portu ile stabil ağ bağlantıları.

• Firewall ve Güvenlik: Gelişmiş güvenlik duvarı özellikleri ile ağ koruması.

• Loglama Desteği: Ağ aktivitelerini izleme ve loglama özelliği.

• USB Portu: Ekstra cihazlarla entegrasyon için USB 2.0 portu.

• Dayanıklı Yapı: -30°C ile +70°C arasında geniş çalışma sıcaklığı aralığı.

• Düşük Güç Tüketimi: Maksimum 10W enerji tüketimi ile verimli kullanım.

Sonuç

Mikrotik RB951Ui-2HnD Router – Firewall – Loglama, güçlü özellikleri ve uygun fiyatıyla kablosuz ağ yöneticileri için mükemmel bir çözüm sunar. 5 Ethernet portu, 2.4GHz Wi-Fi desteği ve USB portu ile esnek bağlantı seçenekleri sağlar. Firewall ve loglama özellikleri ile ağ güvenliğini sağlar ve ağ yönetimini daha verimli hale getirir. RouterOS işletim sistemi sayesinde ağınızı özelleştirebilir ve gelişmiş ağ yönetimi seçeneklerinden faydalanabilirsiniz. Düşük güç tüketimi ve dayanıklı yapısı ile uzun süreli kullanım için uygun bir çözümdür.

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_mikrotik',
         NULL,
         'efor_ag_med_14',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_14', 'efor_ag_med_14', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_14', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_14', 'efor_cat_firewall-urunleri');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_15', 'media/2026/07/efor_ag_15_794317f6c9b3.png', '/media/media/2026/07/efor_ag_15_794317f6c9b3.png', NULL, NULL, 'Mikrotik RB5009UG+S+IN Firewall Router', 'image/png', 247892, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_15',
         'efor-ag-7149-mikrotik-rb5009ug-s-in-firewall-router',
         'EFOR-AG-15',
         'Mikrotik RB5009UG+S+IN Firewall Router',
         'Mikrotik RB5009UG+S+IN Firewall Router
&nbsp;

Mikrotik RB5009UG+S+IN Firewall Router her zamanki performansı ikiye katlayın: Mükemmel ev laboratuvarı yönlendiricisini oluşturmak için MikroTik Kullanıcı Toplantılarından geri bildiriminizi aldık: kompakt, güçlü, çoklu güç seçenekleri ve verimli soğutma. Mikrotik RB5009UG+S+IN Firewall Router''da hepsi ve daha fazlası var!

Kartta 9 kablolu bağlantı noktası ve tam boyutlu bir USB 3.0 bulunur. Bağlantı noktalarından yedisi Gigabit Ethernet, diğeri 2.5 Gigabit Ethernet ve sonuncusu 10G SFP+ kafesi. Tüm bağlantı noktaları, Marvell Armada Dört çekirdekli ARMv8 1,4 GHz CPU''ya giden 10 Gb/sn tam çift yönlü hat ile güçlü bir Marvell Amethyst ailesi anahtar yongasına bağlıdır. Hem CPU hem de anahtar yongası, kartın alt kısmında bulunur; bu nedenle kasa, devasa bir soğutucu görevi görür!

Mikrotik RB5009UG+S+IN Firewall Router, 3 farklı şekilde güç alabilir:

• a) Ethernet bağlantı noktası #1''den PoE-in

• b) DC Jakı

• c) Yan taraftaki 2 pimli terminal

Mikrotik RB5009UG+S+IN Firewall Router cihazı ile kartlar, 1 GB DDR4 RAM ve 1 GB NAND depolama ile birlikte gelir. Benzer form faktöründeki diğer ürünlerimizle karşılaştırıldığında bu bağlantı noktası ve bileşen kombinasyonu, ağır CPU yükü olan yapılandırmalarda neredeyse iki kat performans sağlar.

Mikrotik RB5009UG+S+IN Firewall Router basit bir montaj aksesuarları seti ile bu yönlendiricilerden DÖRT tanesini tek bir 1U raf montaj alanına monte edebilirsiniz! Artık sunucu odası Tetris yok, sadece saf üretkenlik.

Özellikler

Detaylar

Ürün Kodu
RB5009UG+S+IN

Mimari
ARM 64bit

İşlemci
88F7040

CPU çekirdek sayısı
4

CPU nominal frekansı
350-1400 (otomatik) MHz

Çip modelini değiştir
88E6393

RouterOS lisansı
5

İşletim sistemi
RouterOS (yalnızca v7)

RAM boyutu
1 GB

Depolama boyutu
1 GB

Depolama türü
NAND

MTBF
25C''de yaklaşık 200''000 saat

Test edilen ortam sıcaklığı
-40°C ila 60°C

IPsec donanım hızlandırması
Evet

&nbsp;
&nbsp;

Güçlendirme

Detaylar

DC giriş sayısı
3 (DC jakı, PoE-IN, 2 pimli terminal)

DC jak girişi Gerilimi
24-57 Volt

2 pinli terminal girişi Gerilimi
24-57 Volt

Maksimum Güç Tüketimi
20W

Ataşmanlar olmadan maksimum güç tüketimi
14W

soğutma tipi
Pasif

PoE girişi
802.3af/de

Giriş Voltajında PoE
24-57 Volt

Ethernet

Detaylar

10/100/1000 Ethernet bağlantı noktaları
7

2.5G Ethernet bağlantı noktası sayısı
1

Lif

Detaylar

SFP+ bağlantı noktaları
1

çevre birimleri

Detaylar

USB bağlantı noktası sayısı
1

USB Güç Sıfırlama
Evet

USB yuvası tipi
USB 3.0 tip A

Maks USB akımı (A)
1

Diğer

Detaylar

CPU sıcaklık monitörü
Evet

Sertifikasyon ve Onaylar

Detaylar

Sertifikasyon
CE, EAC, ROHS

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_mikrotik',
         NULL,
         'efor_ag_med_15',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_15', 'efor_ag_med_15', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_15', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_15', 'efor_cat_firewall-urunleri');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_16', 'media/2026/07/efor_ag_16_373c38baf34a.png', '/media/media/2026/07/efor_ag_16_373c38baf34a.png', NULL, NULL, 'Teltonika RUTX08 Endüstriyel Ethernet Yönlendirici Router', 'image/png', 214314, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_16',
         'efor-ag-7109-teltonika-rutx08-endustriyel-ethernet-yonlendirici-router',
         'EFOR-AG-16',
         'Teltonika RUTX08 Endüstriyel Ethernet Yönlendirici Router',
         'Teltonika RUTX08 Endüstriyel Ethernet Yönlendirici Router Özellikler
Ürün Özellikleri:

• GIGABIT ETH: 128''e kadar port/etiket tabanlı VLAN''a sahip 4 x Gigabit Ethernet portu destekleni

• VPN: OpenVPN, IPsec, PPTP, L2TP ve DMVPN dahil olmak üzere çok sayıda VPN Protokolü desteklenir

• Protokoller: MQTT, Modbus TCP, BGP, GRE dahil olmak üzere birden fazla protokol desteklenir

• RMS: MQTT, Modbus TCP, BGP, GRE dahil olmak üzere birden fazla protokol desteklenir

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_teltonika',
         NULL,
         'efor_ag_med_16',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_16', 'efor_ag_med_16', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_16', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_16', 'efor_cat_router-yonlendirici');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_17', 'media/2026/07/efor_ag_17_4e4a29a25300.png', '/media/media/2026/07/efor_ag_17_4e4a29a25300.png', NULL, NULL, 'ZyXEL GS1900-48HP V2 — 48 Port, Gigabit, 24 Port PoE 170W, 2 Port Gigabit SFP, Yönetilebilir, Rackmount Switch', 'image/png', 206905, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_17',
         'efor-ag-7034-zyxel-gs1900-48hp-v2-48-port-gigabit-24-port-poe-170w-2-port-gigabi',
         'EFOR-AG-17',
         'ZyXEL GS1900-48HP V2 — 48 Port, Gigabit, 24 Port PoE 170W, 2 Port Gigabit SFP, Yönetilebilir, Rackmount Switch',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_17',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_17', 'efor_ag_med_17', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_17', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_17', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_18', 'media/2026/07/efor_ag_18_af553e79d559.png', '/media/media/2026/07/efor_ag_18_af553e79d559.png', NULL, NULL, 'ZyXEL GS1350-26HP — 24 Port, Gigabit, PoE 375W, 2 Port Gigabit SFP, Yönetilebilir, Rackmount Switch', 'image/png', 254133, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_18',
         'efor-ag-7033-zyxel-gs1350-26hp-24-port-gigabit-poe-375w-2-port-gigabit-sfp-yonet',
         'EFOR-AG-18',
         'ZyXEL GS1350-26HP — 24 Port, Gigabit, PoE 375W, 2 Port Gigabit SFP, Yönetilebilir, Rackmount Switch',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_18',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_18', 'efor_ag_med_18', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_18', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_18', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_19', 'media/2026/07/efor_ag_19_1180f32a513b.png', '/media/media/2026/07/efor_ag_19_1180f32a513b.png', NULL, NULL, 'ZyXEL GS1900-24HP V2 — 24 Port, Gigabit, PoE 170W, 2 Port Gigabit SFP, Yönetilebilir, Rackmount Switch', 'image/png', 185421, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_19',
         'efor-ag-7032-zyxel-gs1900-24hp-v2-24-port-gigabit-poe-170w-2-port-gigabit-sfp-yo',
         'EFOR-AG-19',
         'ZyXEL GS1900-24HP V2 — 24 Port, Gigabit, PoE 170W, 2 Port Gigabit SFP, Yönetilebilir, Rackmount Switch',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_19',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_19', 'efor_ag_med_19', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_19', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_19', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_20', 'media/2026/07/efor_ag_20_879814541c68.png', '/media/media/2026/07/efor_ag_20_879814541c68.png', NULL, NULL, 'ZyXEL GS1915-24EP — 24 Port, Gigabit, 12 Port PoE, Yönetilebilir, Sessiz, Masaüstü Switch', 'image/png', 350715, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_20',
         'efor-ag-7031-zyxel-gs1915-24ep-24-port-gigabit-12-port-poe-yonetilebilir-sessiz-',
         'EFOR-AG-20',
         'ZyXEL GS1915-24EP — 24 Port, Gigabit, 12 Port PoE, Yönetilebilir, Sessiz, Masaüstü Switch',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_20',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_20', 'efor_ag_med_20', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_20', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_20', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_21', 'media/2026/07/efor_ag_21_024e2d051448.png', '/media/media/2026/07/efor_ag_21_024e2d051448.png', NULL, NULL, 'ZyXEL GS1100-10HP — 8 Port, Gigabit, PoE 130W, 2 Port Gigabit SFP, Yönetilemez, Masaüstü Switch', 'image/png', 421959, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_21',
         'efor-ag-7030-zyxel-gs1100-10hp-8-port-gigabit-poe-130w-2-port-gigabit-sfp-yoneti',
         'EFOR-AG-21',
         'ZyXEL GS1100-10HP — 8 Port, Gigabit, PoE 130W, 2 Port Gigabit SFP, Yönetilemez, Masaüstü Switch',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_21',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_21', 'efor_ag_med_21', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_21', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_21', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_22', 'media/2026/07/efor_ag_22_4e5aa59a7784.png', '/media/media/2026/07/efor_ag_22_4e5aa59a7784.png', NULL, NULL, 'ZyXEL GS1915-24E — 24 Port, Gigabit, Yönetilebilir, Sessiz, Masaüstü Switch', 'image/png', 316562, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_22',
         'efor-ag-7029-zyxel-gs1915-24e-24-port-gigabit-yonetilebilir-sessiz-masaustu-swit',
         'EFOR-AG-22',
         'ZyXEL GS1915-24E — 24 Port, Gigabit, Yönetilebilir, Sessiz, Masaüstü Switch',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_22',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_22', 'efor_ag_med_22', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_22', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_22', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_23', 'media/2026/07/efor_ag_23_eaac7492c189.png', '/media/media/2026/07/efor_ag_23_eaac7492c189.png', NULL, NULL, 'ZyXEL GS1900-24E — 24 Port, Gigabit, Yönetilebilir, Sessiz, Masaüstü Switch', 'image/png', 241563, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_23',
         'efor-ag-7028-zyxel-gs1900-24e-24-port-gigabit-yonetilebilir-sessiz-masaustu-swit',
         'EFOR-AG-23',
         'ZyXEL GS1900-24E — 24 Port, Gigabit, Yönetilebilir, Sessiz, Masaüstü Switch',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_23',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_23', 'efor_ag_med_23', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_23', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_23', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_24', 'media/2026/07/efor_ag_24_45b7ed931f3b.png', '/media/media/2026/07/efor_ag_24_45b7ed931f3b.png', NULL, NULL, 'ZyXEL MG-105 — 5 Port, Multi-Gigabit, 2.5 Gbps, Metal Kasa, Yönetilemez, Masaüstü Switch', 'image/png', 236141, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_24',
         'efor-ag-7027-zyxel-mg-105-5-port-multi-gigabit-2-5-gbps-metal-kasa-yonetilemez-m',
         'EFOR-AG-24',
         'ZyXEL MG-105 — 5 Port, Multi-Gigabit, 2.5 Gbps, Metal Kasa, Yönetilemez, Masaüstü Switch',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_24',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_24', 'efor_ag_med_24', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_24', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_24', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_25', 'media/2026/07/efor_ag_25_8a43369960ee.png', '/media/media/2026/07/efor_ag_25_8a43369960ee.png', NULL, NULL, 'ZyXEL GS1100-24E V3 — 24 Port, Gigabit, Yönetilemez, Sessiz, Rackmount Switch', 'image/png', 407760, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_25',
         'efor-ag-7026-zyxel-gs1100-24e-v3-24-port-gigabit-yonetilemez-sessiz-rackmount-sw',
         'EFOR-AG-25',
         'ZyXEL GS1100-24E V3 — 24 Port, Gigabit, Yönetilemez, Sessiz, Rackmount Switch',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_25',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_25', 'efor_ag_med_25', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_25', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_25', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_26', 'media/2026/07/efor_ag_26_f98c65240b1a.png', '/media/media/2026/07/efor_ag_26_f98c65240b1a.png', NULL, NULL, 'ZyXEL GS1900-48HP V2 — 48 Port, Gigabit, PoE 170W, 2 Port Gigabit SFP, Yönetilebilir, Rackmount Switch', 'image/png', 199891, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_26',
         'efor-ag-7011-zyxel-gs1900-48hp-v2-48-port-gigabit-poe-170w-2-port-gigabit-sfp-yo',
         'EFOR-AG-26',
         'ZyXEL GS1900-48HP V2 — 48 Port, Gigabit, PoE 170W, 2 Port Gigabit SFP, Yönetilebilir, Rackmount Switch',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_26',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_26', 'efor_ag_med_26', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_26', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_26', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_27', 'media/2026/07/efor_ag_27_21f4fa7224b3.png', '/media/media/2026/07/efor_ag_27_21f4fa7224b3.png', NULL, NULL, 'ZyXEL GS1350-26HP — 24 Port, Gigabit, PoE 375W, 2 Port Gigabit SFP, Yönetilebilir, Rackmount Switch', 'image/png', 323035, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_27',
         'efor-ag-7010-zyxel-gs1350-26hp-24-port-gigabit-poe-375w-2-port-gigabit-sfp-yonet',
         'EFOR-AG-27',
         'ZyXEL GS1350-26HP — 24 Port, Gigabit, PoE 375W, 2 Port Gigabit SFP, Yönetilebilir, Rackmount Switch',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_27',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_27', 'efor_ag_med_27', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_27', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_27', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_28', 'media/2026/07/efor_ag_28_f8d3cdcd7dec.png', '/media/media/2026/07/efor_ag_28_f8d3cdcd7dec.png', NULL, NULL, 'ZyXEL GS1900-24HP V2 — 24 Port, Gigabit, PoE 170W, 2 Port Gigabit SFP, Yönetilebilir, Rackmount', 'image/png', 162442, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_28',
         'efor-ag-7008-zyxel-gs1900-24hp-v2-24-port-gigabit-poe-170w-2-port-gigabit-sfp-yo',
         'EFOR-AG-28',
         'ZyXEL GS1900-24HP V2 — 24 Port, Gigabit, PoE 170W, 2 Port Gigabit SFP, Yönetilebilir, Rackmount',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_28',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_28', 'efor_ag_med_28', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_28', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_28', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_29', 'media/2026/07/efor_ag_29_13e9406bf6cf.png', '/media/media/2026/07/efor_ag_29_13e9406bf6cf.png', NULL, NULL, 'ZyXEL GS1915-24EP — 24 Port Gigabit, 12 Port PoE, Yönetilebilir, Sessiz, Masaüstü Switch', 'image/png', 252601, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_29',
         'efor-ag-7006-zyxel-gs1915-24ep-24-port-gigabit-12-port-poe-yonetilebilir-sessiz-',
         'EFOR-AG-29',
         'ZyXEL GS1915-24EP — 24 Port Gigabit, 12 Port PoE, Yönetilebilir, Sessiz, Masaüstü Switch',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_29',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_29', 'efor_ag_med_29', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_29', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_29', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_30', 'media/2026/07/efor_ag_30_6bb61628e4ac.png', '/media/media/2026/07/efor_ag_30_6bb61628e4ac.png', NULL, NULL, 'ZyXEL GS1100-10HP — 8 Port, Gigabit, PoE 130W, 2 Port Gigabit SFP, Yönetilemez, Masaüstü Switch', 'image/png', 306805, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_30',
         'efor-ag-7004-zyxel-gs1100-10hp-8-port-gigabit-poe-130w-2-port-gigabit-sfp-yoneti',
         'EFOR-AG-30',
         'ZyXEL GS1100-10HP — 8 Port, Gigabit, PoE 130W, 2 Port Gigabit SFP, Yönetilemez, Masaüstü Switch',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_30',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_30', 'efor_ag_med_30', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_30', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_30', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_31', 'media/2026/07/efor_ag_31_a6cc5468e11a.png', '/media/media/2026/07/efor_ag_31_a6cc5468e11a.png', NULL, NULL, 'ZyXEL GS1915-24E — 24 Port, Gigabit, Yönetilebilir, Sessiz, Masaüstü Switch', 'image/png', 241558, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_31',
         'efor-ag-6999-zyxel-gs1915-24e-24-port-gigabit-yonetilebilir-sessiz-masaustu-swit',
         'EFOR-AG-31',
         'ZyXEL GS1915-24E — 24 Port, Gigabit, Yönetilebilir, Sessiz, Masaüstü Switch',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_31',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_31', 'efor_ag_med_31', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_31', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_31', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_32', 'media/2026/07/efor_ag_32_91ff2a7e5db9.png', '/media/media/2026/07/efor_ag_32_91ff2a7e5db9.png', NULL, NULL, 'ZyXEL GS1900-24E — 24 Port, Gigabit, Yönetilebilir, Sessiz, Masaüstü Switch', 'image/png', 241558, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_32',
         'efor-ag-6992-zyxel-gs1900-24e-24-port-gigabit-yonetilebilir-sessiz-masaustu-swit',
         'EFOR-AG-32',
         'ZyXEL GS1900-24E — 24 Port, Gigabit, Yönetilebilir, Sessiz, Masaüstü Switch',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_32',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_32', 'efor_ag_med_32', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_32', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_32', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_33', 'media/2026/07/efor_ag_33_6d09c0d9348f.png', '/media/media/2026/07/efor_ag_33_6d09c0d9348f.png', NULL, NULL, 'ZyXEL MG-105 — 5 Port, Multi-Gigabit 2.5 Gbps, Metal Kasa, Yönetilemez, Masaüstü Switch', 'image/png', 198079, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_33',
         'efor-ag-6987-zyxel-mg-105-5-port-multi-gigabit-2-5-gbps-metal-kasa-yonetilemez-m',
         'EFOR-AG-33',
         'ZyXEL MG-105 — 5 Port, Multi-Gigabit 2.5 Gbps, Metal Kasa, Yönetilemez, Masaüstü Switch',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_33',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_33', 'efor_ag_med_33', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_33', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_33', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_34', 'media/2026/07/efor_ag_34_703c3c054834.png', '/media/media/2026/07/efor_ag_34_703c3c054834.png', NULL, NULL, 'ZyXEL GS1100-24E V3 — 24 Port, Gigabit, Yönetilemez, Sessiz, Rackmount Switch', 'image/png', 311545, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_34',
         'efor-ag-6983-zyxel-gs1100-24e-v3-24-port-gigabit-yonetilemez-sessiz-rackmount-sw',
         'EFOR-AG-34',
         'ZyXEL GS1100-24E V3 — 24 Port, Gigabit, Yönetilemez, Sessiz, Rackmount Switch',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_34',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_34', 'efor_ag_med_34', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_34', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_34', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_35', 'media/2026/07/efor_ag_35_678c0d336876.png', '/media/media/2026/07/efor_ag_35_678c0d336876.png', NULL, NULL, 'ZyXEL GS1008HP — 8 Port, Gigabit, PoE Switch, Yönetilemez, Masaüstü', 'image/png', 158279, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_35',
         'efor-ag-6978-zyxel-gs1008hp-8-port-gigabit-poe-switch-yonetilemez-masaustu',
         'EFOR-AG-35',
         'ZyXEL GS1008HP — 8 Port, Gigabit, PoE Switch, Yönetilemez, Masaüstü',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_35',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_35', 'efor_ag_med_35', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_35', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_35', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_36', 'media/2026/07/efor_ag_36_ede737354176.png', '/media/media/2026/07/efor_ag_36_ede737354176.png', NULL, NULL, 'ZyXEL GS1100-16 V3 — 16 Port, Gigabit, Yönetilemez, Masaüstü Switch', 'image/png', 359193, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_36',
         'efor-ag-6971-zyxel-gs1100-16-v3-16-port-gigabit-yonetilemez-masaustu-switch',
         'EFOR-AG-36',
         'ZyXEL GS1100-16 V3 — 16 Port, Gigabit, Yönetilemez, Masaüstü Switch',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_36',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_36', 'efor_ag_med_36', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_36', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_36', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_37', 'media/2026/07/efor_ag_37_171fa37a4e67.png', '/media/media/2026/07/efor_ag_37_171fa37a4e67.png', NULL, NULL, 'ZyXEL GS-105S V2 — 5 Port, Gigabit, Yönetilemez, Masaüstü Switch', 'image/png', 156983, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_37',
         'efor-ag-6966-zyxel-gs-105s-v2-5-port-gigabit-yonetilemez-masaustu-switch',
         'EFOR-AG-37',
         'ZyXEL GS-105S V2 — 5 Port, Gigabit, Yönetilemez, Masaüstü Switch',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_37',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_37', 'efor_ag_med_37', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_37', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_37', 'efor_cat_ethernet-swhitch-hub');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_38', 'media/2026/07/efor_ag_38_84908e5dc626.png', '/media/media/2026/07/efor_ag_38_84908e5dc626.png', NULL, NULL, 'ZyXEL ZYWALL USG FLEX100 — Firewall Cihazı, +1 Yıllık Lisans Dahil (50 Kullanıcı)', 'image/png', 503352, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_38',
         'efor-ag-6962-zyxel-zywall-usg-flex100-firewall-cihazi-1-yillik-lisans-dahil-50-k',
         'EFOR-AG-38',
         'ZyXEL ZYWALL USG FLEX100 — Firewall Cihazı, +1 Yıllık Lisans Dahil (50 Kullanıcı)',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_38',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_38', 'efor_ag_med_38', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_38', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_38', 'efor_cat_firewall-urunleri');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_39', 'media/2026/07/efor_ag_39_a402272938b2.png', '/media/media/2026/07/efor_ag_39_a402272938b2.png', NULL, NULL, 'ZyXEL USG LITE 60AX — 5 Port, AX6000, 1150–4800 Mbps, Dual Band WiFi 6, Security Firewall, Access Point Router', 'image/png', 201475, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_39',
         'efor-ag-6958-zyxel-usg-lite-60ax-5-port-ax6000-1150-4800-mbps-dual-band-wifi-6-s',
         'EFOR-AG-39',
         'ZyXEL USG LITE 60AX — 5 Port, AX6000, 1150–4800 Mbps, Dual Band WiFi 6, Security Firewall, Access Point Router',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_39',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_39', 'efor_ag_med_39', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_39', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_39', 'efor_cat_firewall-urunleri');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_40', 'media/2026/07/efor_ag_40_e80246b39462.png', '/media/media/2026/07/efor_ag_40_e80246b39462.png', NULL, NULL, 'ZyXEL POE12-30W — 30W PoE Plus Gigabit 2.5 Gigabit PoE Injector', 'image/png', 394736, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_40',
         'efor-ag-6951-zyxel-poe12-30w-30w-poe-plus-gigabit-2-5-gigabit-poe-injector',
         'EFOR-AG-40',
         'ZyXEL POE12-30W — 30W PoE Plus Gigabit 2.5 Gigabit PoE Injector',
         'ZyXEL POE12-30W — 30W PoE Plus Gigabit 2.5 Gigabit PoE Injector
&nbsp;

2,5 Gigabit Yüksek Ağ Hızını Destekleyin
PoE12-30W, 2,5Gbps''ye kadar ağ hızlarını destekleyen bir Multi-Gigabit PoE enjektördür. Elektrikli cihazların mevcut Cat 5e veya üzeri kablo üzerinden bağlanmasına izin verilir.

Yüksek PoE Gücü
PoE12-30W, 30 watt''a kadar PoE güç bütçesi sağlayan PoE+ ile uyumludur. Ayrıca diğer standart tabanlı PoE cihazlarıyla birlikte çalışabilirlik ve uyumluluk sunar.

Tak ve Çalıştır-Kullanım Kolaylığı
PoE12-30W, ağ cihazlarını herhangi bir yapılandırma yapmadan bağlamak kolaydır. Duvara montaj ve masaüstü tasarımı çoğu kurulum senaryosuna uygundur.

•

•

Uygulama Şeması

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_40',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_40', 'efor_ag_med_40', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_40', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_40', 'efor_cat_poe-injector-splitter');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_41', 'media/2026/07/efor_ag_41_0d9f702e9940.png', '/media/media/2026/07/efor_ag_41_0d9f702e9940.png', NULL, NULL, 'ZyXEL NWA110BE BE6500 — 4 Stream 6500 Mbps WiFi 7 2.5 Gbit LAN Dual Radyo NebulaFlex Access Point', 'image/png', 103642, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_41',
         'efor-ag-6946-zyxel-nwa110be-be6500-4-stream-6500-mbps-wifi-7-2-5-gbit-lan-dual-r',
         'EFOR-AG-41',
         'ZyXEL NWA110BE BE6500 — 4 Stream 6500 Mbps WiFi 7 2.5 Gbit LAN Dual Radyo NebulaFlex Access Point',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_41',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_41', 'efor_ag_med_41', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_41', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_41', 'efor_cat_access-point');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_42', 'media/2026/07/efor_ag_42_19ee73e2474b.png', '/media/media/2026/07/efor_ag_42_19ee73e2474b.png', NULL, NULL, 'ZyXEL NWA50AX PRO — 1 Port 2975 Mbps Dual Band WiFi 6 Tavan Tipi PoE Access Point', 'image/png', 132704, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_42',
         'efor-ag-6941-zyxel-nwa50ax-pro-1-port-2975-mbps-dual-band-wifi-6-tavan-tipi-poe-',
         'EFOR-AG-42',
         'ZyXEL NWA50AX PRO — 1 Port 2975 Mbps Dual Band WiFi 6 Tavan Tipi PoE Access Point',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_42',
         NULL,
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_42', 'efor_ag_med_42', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_42', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_42', 'efor_cat_access-point');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_ag_med_43', 'media/2026/07/efor_ag_43_686f357e90ef.png', '/media/media/2026/07/efor_ag_43_686f357e90ef.png', NULL, NULL, 'ZyXEL NWA55AXE – 1 Port 1775 Mbps Dual Band WiFi 6 Duvar Tipi PoE Outdoor Access Point', 'image/png', 46541, 'import', '2026-07-30T19:58:02.323Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_ag_prod_43',
         'efor-ag-6934-zyxel-nwa55axe-1-port-1775-mbps-dual-band-wifi-6-duvar-tipi-poe-out',
         'EFOR-AG-43',
         'ZyXEL NWA55AXE – 1 Port 1775 Mbps Dual Band WiFi 6 Duvar Tipi PoE Outdoor Access Point',
         'ZyXEL NWA55AXE – 1 Port 1775 Mbps Dual Band WiFi 6 Duvar Tipi PoE Outdoor Access Point Özellikler
&nbsp;

TEKNİK ÖZELLİKLER:

• Kablosuz Standart: IEEE802.11 ax/ac/n/g/b/a

• MIMO: MU-MIMO

• Kablosuz Hızı: 2.4 GHz: 1150Mbps / 5 GHz:2400Mbps

• Anten Türü: 2&#215;2 MIMO Akıllı Anten

• Anten Güç Kazancı: 2.4GHz: 5 dBi / 5GHz: 5 dBi

• Çalıştırma Modu: Bulut Yönetimli

• Ethernet Portu: 2x 1 Gbps LAN(PoE PSE dahil)

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_zyxel',
         NULL,
         'efor_ag_med_43',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z',
         '2026-07-30T19:58:02.323Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_ag_prod_43', 'efor_ag_med_43', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_43', 'efor_cat_ag-urunleri');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_ag_prod_43', 'efor_cat_access-point');
