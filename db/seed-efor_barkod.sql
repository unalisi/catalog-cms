-- Efor ingest efor_barkod (idempotent)
PRAGMA foreign_keys = ON;
DELETE FROM product_categories WHERE product_id LIKE 'efor_barkod_prod_%';
DELETE FROM product_media WHERE product_id LIKE 'efor_barkod_prod_%';
DELETE FROM products WHERE id LIKE 'efor_barkod_prod_%';
DELETE FROM media WHERE id LIKE 'efor_barkod_med_%';

INSERT INTO categories (id, slug, name, parent_id, description, position, status, created_at, updated_at)
       VALUES ('efor_cat_barkod-okuyucular', 'barkod-okuyucular', 'Barkod Okuyucular', NULL, NULL, 0, 'published', '2026-07-30T20:00:51.083Z', '2026-07-30T20:00:51.083Z')
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status='published', updated_at=excluded.updated_at;
INSERT INTO categories (id, slug, name, parent_id, description, position, status, created_at, updated_at)
       VALUES ('efor_cat_fiyat-gor', 'fiyat-gor', 'Fiyat Gör', NULL, NULL, 0, 'published', '2026-07-30T20:00:51.083Z', '2026-07-30T20:00:51.083Z')
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status='published', updated_at=excluded.updated_at;
INSERT INTO brands (id, slug, name, description, status, created_at, updated_at)
       VALUES ('efor_brand_perkon', 'perkon', 'Perkon', NULL, 'published', '2026-07-30T20:00:51.083Z', '2026-07-30T20:00:51.083Z')
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status='published', updated_at=excluded.updated_at;
INSERT INTO brands (id, slug, name, description, status, created_at, updated_at)
       VALUES ('efor_brand_zebra', 'zebra', 'Zebra', NULL, 'published', '2026-07-30T20:00:51.083Z', '2026-07-30T20:00:51.083Z')
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status='published', updated_at=excluded.updated_at;
INSERT INTO brands (id, slug, name, description, status, created_at, updated_at)
       VALUES ('efor_brand_newland', 'newland', 'Newland', NULL, 'published', '2026-07-30T20:00:51.083Z', '2026-07-30T20:00:51.083Z')
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status='published', updated_at=excluded.updated_at;
INSERT INTO brands (id, slug, name, description, status, created_at, updated_at)
       VALUES ('efor_brand_honeywell', 'honeywell', 'Honeywell', NULL, 'published', '2026-07-30T20:00:51.083Z', '2026-07-30T20:00:51.083Z')
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, status='published', updated_at=excluded.updated_at;
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_barkod_med_01', 'media/2026/07/efor_barkod_01_a2971a5f0593.png', '/media/media/2026/07/efor_barkod_01_a2971a5f0593.png', NULL, NULL, 'Perkon FG1200 Fiyat Gör Barkod Cihazı', 'image/png', 466067, 'import', '2026-07-30T20:00:51.083Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_barkod_prod_01',
         'efor-barkod-7115-perkon-fg1200-fiyat-gor-barkod-cihazi',
         'EFOR-BARKOD-01',
         'Perkon FG1200 Fiyat Gör Barkod Cihazı',
         'Perkon FG1200 Fiyat Gör Barkod Cihazı Özellikler
&nbsp;

Teknik Özellikler:

• Boyutlar:140 x 180 x 120 mm

• Ağırlık: 5 kg

• Işık Kaynağı:650 Nm Görünebilir Lazer Diyot (VLD)

• Okuma Derinliği:0 – 200 mm (UPC / EAN %100)

• Tarama Hızı Çift Yönlü:1400 Tarama / sn –

• Tarama Hızı Tek Yönlü:74 Tarama / sn

• Tarama Çizgi Sayısı: 20

• Minimum Bar Genişliği:5 Mil @ PCS %90

• Lazer Sınıfı:CDRH Klas IIa : IEC 60825 Klas 2

• Işık Seviyesi: 4500 Lux

• Barkod Türleri:Bilinen tüm lineer barkod türleri

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_perkon',
         NULL,
         'efor_barkod_med_01',
         '2026-07-30T20:00:51.083Z',
         '2026-07-30T20:00:51.083Z',
         '2026-07-30T20:00:51.083Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_barkod_prod_01', 'efor_barkod_med_01', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_barkod_prod_01', 'efor_cat_barkod-okuyucular');
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_barkod_prod_01', 'efor_cat_fiyat-gor');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_barkod_med_02', 'media/2026/07/efor_barkod_02_28806e457d10.png', '/media/media/2026/07/efor_barkod_02_28806e457d10.png', NULL, NULL, 'ZEBRA DS2208 2D KABLOLU BARKOD OKUYUCU', 'image/png', 332678, 'import', '2026-07-30T20:00:51.083Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_barkod_prod_02',
         'efor-barkod-5944-zebra-ds2208-2d-kablolu-barkod-okuyucu',
         'EFOR-BARKOD-02',
         'ZEBRA DS2208 2D KABLOLU BARKOD OKUYUCU',
         'ZEBRA DS2208 2D KABLOLU BARKOD OKUYUCU ÖZELLİKLERİ

• Bir boyutlu (1D) ve iki boyutlu-karekod (2D) barkod okuma

• 1 Megapiksel (640×480) görüntü

• Seri, PS/2 ve USB ve bağlantı

• 1.5 metreden betona düşme dayanıklılığı

• Stand ünitesi dahil

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_zebra',
         NULL,
         'efor_barkod_med_02',
         '2026-07-30T20:00:51.083Z',
         '2026-07-30T20:00:51.083Z',
         '2026-07-30T20:00:51.083Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_barkod_prod_02', 'efor_barkod_med_02', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_barkod_prod_02', 'efor_cat_barkod-okuyucular');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_barkod_med_03', 'media/2026/07/efor_barkod_03_dae0d18039b4.png', '/media/media/2026/07/efor_barkod_03_dae0d18039b4.png', NULL, NULL, 'RS232 SERİ PORT HABERLEŞMELİ HAT TİPİ BARKOD OKUYUCU NEWLAND ADAPTÖRÜ İLE BİRLİKTE FM 431 PRO', 'image/png', 242157, 'import', '2026-07-30T20:00:51.083Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_barkod_prod_03',
         'efor-barkod-5903-rs232-seri-port-haberlesmeli-hat-tipi-barkod-okuyucu-newland-ad',
         'EFOR-BARKOD-03',
         'RS232 SERİ PORT HABERLEŞMELİ HAT TİPİ BARKOD OKUYUCU NEWLAND ADAPTÖRÜ İLE BİRLİKTE FM 431 PRO',
         'Ürün açıklaması kaynak sitede eksik; listedışı olarak eklendi.',
         0,
         NULL,
         'TRY',
         10,
         'archived',
         'efor_brand_newland',
         NULL,
         'efor_barkod_med_03',
         NULL,
         '2026-07-30T20:00:51.083Z',
         '2026-07-30T20:00:51.083Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_barkod_prod_03', 'efor_barkod_med_03', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_barkod_prod_03', 'efor_cat_barkod-okuyucular');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_barkod_med_04', 'media/2026/07/efor_barkod_04_079473948005.png', '/media/media/2026/07/efor_barkod_04_079473948005.png', NULL, NULL, 'HONEYWELL 1472G 2D KABLOSUZ BARKOD OKUYUCU', 'image/png', 313424, 'import', '2026-07-30T20:00:51.083Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_barkod_prod_04',
         'efor-barkod-5895-honeywell-1472g-2d-kablosuz-barkod-okuyucu',
         'EFOR-BARKOD-04',
         'HONEYWELL 1472G 2D KABLOSUZ BARKOD OKUYUCU',
         'HONEYWELL 1472G 2D KABLOSUZ BARKOD OKUYUCU ÖZELLİKLER

• Marka: Honeywell

• Model: 1472G

• Beyaz ışık teknolojisi

• Çözünürlük: 1040 X 720 pixel

• Dayanıklılık: Suya ve toza karşı IP42 standartlarında ve 1.8 Metre düşme dayanıklılığı

• Okuma mesafesi: 400 mm

• Yıpranmış barkodları okuyabilme özelliği

• 30 Metre Haberleşme Mesafesi

• 14 Saat Çalışma Süresi

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_honeywell',
         NULL,
         'efor_barkod_med_04',
         '2026-07-30T20:00:51.083Z',
         '2026-07-30T20:00:51.083Z',
         '2026-07-30T20:00:51.083Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_barkod_prod_04', 'efor_barkod_med_04', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_barkod_prod_04', 'efor_cat_barkod-okuyucular');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_barkod_med_05', 'media/2026/07/efor_barkod_05_7b6cdcbd39a0.png', '/media/media/2026/07/efor_barkod_05_7b6cdcbd39a0.png', NULL, NULL, 'NEWLAND FM431 FIXED MOUNT HAT TİPİ BARKOD OKUYUCU', 'image/png', 133227, 'import', '2026-07-30T20:00:51.083Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_barkod_prod_05',
         'efor-barkod-5886-newland-fm431-fixed-mount-hat-tipi-barkod-okuyucu',
         'EFOR-BARKOD-05',
         'NEWLAND FM431 FIXED MOUNT HAT TİPİ BARKOD OKUYUCU',
         'NEWLAND FM431 FIXED MOUNT HAT TİPİ BARKOD OKUYUCU ÖZELLİKLER
● 2D Karekod Okuyucu

● 1280 x 800 Piksel CMOS Sensor

● 3 mil çözünürlük

● 56 Gram Ağırlık

● Kolay Monte / Demonte edebilme

● Seri Port ve USB Bağlantı Seçenekleri

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_newland',
         NULL,
         'efor_barkod_med_05',
         '2026-07-30T20:00:51.083Z',
         '2026-07-30T20:00:51.083Z',
         '2026-07-30T20:00:51.083Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_barkod_prod_05', 'efor_barkod_med_05', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_barkod_prod_05', 'efor_cat_barkod-okuyucular');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_barkod_med_06', 'media/2026/07/efor_barkod_06_bc2a0321d8c1.png', '/media/media/2026/07/efor_barkod_06_bc2a0321d8c1.png', NULL, NULL, 'NEWLAND FR 80 MASAÜSTÜ BARKOD OKUYUCU', 'image/png', 246915, 'import', '2026-07-30T20:00:51.083Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_barkod_prod_06',
         'efor-barkod-5645-newland-fr-80-masaustu-barkod-okuyucu',
         'EFOR-BARKOD-06',
         'NEWLAND FR 80 MASAÜSTÜ BARKOD OKUYUCU',
         'NEWLAND FR 80 MASAÜSTÜ BARKOD OKUYUCU ÖZELLİKLERİ
TEKNİK ÖZELLİKLER:

• 2D Karekod Okuyucu

• 1280 x 1080 Piksel CMOS Sensor

• LCD Ekrandan Okuyabilme

• RS-232 ve USB Bağlantı Seçenekleri

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_newland',
         NULL,
         'efor_barkod_med_06',
         '2026-07-30T20:00:51.083Z',
         '2026-07-30T20:00:51.083Z',
         '2026-07-30T20:00:51.083Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_barkod_prod_06', 'efor_barkod_med_06', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_barkod_prod_06', 'efor_cat_barkod-okuyucular');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_barkod_med_07', 'media/2026/07/efor_barkod_07_98fce5f27d7a.png', '/media/media/2026/07/efor_barkod_07_98fce5f27d7a.png', NULL, NULL, 'NEWLAND BS80 KABLOSUZ BARKOD OKUYUCU (EL TİPİ)', 'image/png', 383053, 'import', '2026-07-30T20:00:51.083Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_barkod_prod_07',
         'efor-barkod-5641-newland-bs80-kablosuz-barkod-okuyucu-el-tipi',
         'EFOR-BARKOD-07',
         'NEWLAND BS80 KABLOSUZ BARKOD OKUYUCU (EL TİPİ)',
         'NEWLAND BS80 KABLOSUZ BARKOD OKUYUCU (EL TİPİ) ÖZELLİKLERİ
TEKNİK ÖZELLİKLER:
● 1D ve 2D Barkod Okuyucu

● Kablosuz (Bluetooth) iletişim

● Max. 50 metre aktarma mesafesi

● 63 gram ağırlık

● Max. 6 veya 11 saat kullanım ömrü

● IP42 Endüstriyel Standartı

● Windows, Android ve iOS Cihazlar ile Uyumlu

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_newland',
         NULL,
         'efor_barkod_med_07',
         '2026-07-30T20:00:51.083Z',
         '2026-07-30T20:00:51.083Z',
         '2026-07-30T20:00:51.083Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_barkod_prod_07', 'efor_barkod_med_07', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_barkod_prod_07', 'efor_cat_barkod-okuyucular');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_barkod_med_08', 'media/2026/07/efor_barkod_08_073a1960d006.png', '/media/media/2026/07/efor_barkod_08_073a1960d006.png', NULL, NULL, 'NEWLAND HR 23 BT / HR 33 ВТ KABLOSUZ KAREKOD OKUYUCU USB BAĞLANTILI', 'image/png', 248925, 'import', '2026-07-30T20:00:51.083Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_barkod_prod_08',
         'efor-barkod-5631-newland-hr-23-bt-hr-33-kablosuz-karekod-okuyucu-usb-baglantili',
         'EFOR-BARKOD-08',
         'NEWLAND HR 23 BT / HR 33 ВТ KABLOSUZ KAREKOD OKUYUCU USB BAĞLANTILI',
         'NEWLAND HR 23 BT / HR 33 ВТ KABLOSUZ KAREKOD OKUYUCU ÖZELLİKLERİ
&nbsp;

TEKNİK ÖZELLİKLER:

• 2D Karekod Okuyucu

• 640 x 480 Piksel Imager Sensor

• Kablosuz (Bluetooth) iletişim

• 100 metre aktarma mesafesi

• IP52 Koruma Standardı

• 1,5 Metreden düşmeye dayanıklı

(Fiyat için iletişime geçin — kaynak sitede fiyat belirtilmemiş.)',
         0,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_newland',
         NULL,
         'efor_barkod_med_08',
         '2026-07-30T20:00:51.083Z',
         '2026-07-30T20:00:51.083Z',
         '2026-07-30T20:00:51.083Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_barkod_prod_08', 'efor_barkod_med_08', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_barkod_prod_08', 'efor_cat_barkod-okuyucular');
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
           VALUES ('efor_barkod_med_09', 'media/2026/07/efor_barkod_09_d22da676b705.png', '/media/media/2026/07/efor_barkod_09_d22da676b705.png', NULL, NULL, 'NEWLAND HR 23 / HR 33 KABLOLU KAREKOD OKUYUCU + AYAK', 'image/png', 146803, 'import', '2026-07-30T20:00:51.083Z');
INSERT INTO products (id, slug, sku, name, description, price, compare_at_price, currency, stock, status, brand_id, seo_id, primary_media_id, published_at, created_at, updated_at)
       VALUES (
         'efor_barkod_prod_09',
         'efor-barkod-5264-newland-hr-23-hr-33-kablolu-karekod-okuyucu-ayak',
         'EFOR-BARKOD-09',
         'NEWLAND HR 23 / HR 33 KABLOLU KAREKOD OKUYUCU + AYAK',
         'NEWLAND HR 23 / HR 33 Karekod Okuyucu USB Bağlantılı 2D Kablolu Okuyucu Usb + Stand (Ayaklı) Özellikler
TEKNİK ÖZELLİKLER:

• 2D Karekod Okuyucu

• 640 x 480 Piksel Imager Sensör

• 1D Barkodlarda 3 mil çözünürlük

• 30 ~ 280 mm okuma mesafesi

• 1,5 Metreden düşmeye dayanıklı

• IP52 Koruma Standartı

• USB Kablolu Bağlantı',
         295000,
         NULL,
         'TRY',
         10,
         'published',
         'efor_brand_newland',
         NULL,
         'efor_barkod_med_09',
         '2026-07-30T20:00:51.083Z',
         '2026-07-30T20:00:51.083Z',
         '2026-07-30T20:00:51.083Z'
       );
INSERT INTO product_media (product_id, media_id, position) VALUES ('efor_barkod_prod_09', 'efor_barkod_med_09', 0);
INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES ('efor_barkod_prod_09', 'efor_cat_barkod-okuyucular');
