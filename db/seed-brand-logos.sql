-- Brand logos from official sites
PRAGMA foreign_keys = ON;

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_nord-teknik_743b278846e5', 'media/2026/08/brand_nord-teknik_743b278846e5.png', '/media/media/2026/08/brand_nord-teknik_743b278846e5.png', NULL, NULL, 'Nord Teknik', 'image/png', 6748, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_nord-teknik_743b278846e5', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='nord-teknik';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_baofeng_2664bab30717', 'media/2026/08/brand_baofeng_2664bab30717.webp', '/media/media/2026/08/brand_baofeng_2664bab30717.webp', NULL, NULL, 'Baofeng', 'image/webp', 4308, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_baofeng_2664bab30717', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='baofeng';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_aselsan-cobra_0ab41bb2b506', 'media/2026/08/brand_aselsan-cobra_0ab41bb2b506.gif', '/media/media/2026/08/brand_aselsan-cobra_0ab41bb2b506.gif', NULL, NULL, 'ASELSAN COBRA', 'image/gif', 2868, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_aselsan-cobra_0ab41bb2b506', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='aselsan-cobra';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_aselsannet_3a0fc8282eaa', 'media/2026/08/brand_aselsannet_3a0fc8282eaa.gif', '/media/media/2026/08/brand_aselsannet_3a0fc8282eaa.gif', NULL, NULL, 'Aselsannet', 'image/gif', 2868, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_aselsannet_3a0fc8282eaa', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='aselsannet';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_talkpod_01c4e453f873', 'media/2026/08/brand_talkpod_01c4e453f873.svg', '/media/media/2026/08/brand_talkpod_01c4e453f873.svg', NULL, NULL, 'Talkpod', 'image/svg+xml', 243, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_talkpod_01c4e453f873', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='talkpod';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_mikrotik_c668066181f3', 'media/2026/08/brand_mikrotik_c668066181f3.png', '/media/media/2026/08/brand_mikrotik_c668066181f3.png', NULL, NULL, 'Mikrotik', 'image/png', 119950, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_mikrotik_c668066181f3', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='mikrotik';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_teltonika_1f632e86a714', 'media/2026/08/brand_teltonika_1f632e86a714.svg', '/media/media/2026/08/brand_teltonika_1f632e86a714.svg', NULL, NULL, 'Teltonika', 'image/svg+xml', 772, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_teltonika_1f632e86a714', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='teltonika';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_zyxel_96145c5a1ed7', 'media/2026/08/brand_zyxel_96145c5a1ed7.png', '/media/media/2026/08/brand_zyxel_96145c5a1ed7.png', NULL, NULL, 'Zyxel', 'image/png', 4944, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_zyxel_96145c5a1ed7', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='zyxel';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_perkon_752b9a7ceb1f', 'media/2026/08/brand_perkon_752b9a7ceb1f.png', '/media/media/2026/08/brand_perkon_752b9a7ceb1f.png', NULL, NULL, 'Perkon', 'image/png', 4457, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_perkon_752b9a7ceb1f', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='perkon';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_zebra_d68cfe88445f', 'media/2026/08/brand_zebra_d68cfe88445f.svg', '/media/media/2026/08/brand_zebra_d68cfe88445f.svg', NULL, NULL, 'Zebra', 'image/svg+xml', 2956, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_zebra_d68cfe88445f', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='zebra';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_honeywell_9759c55c85c9', 'media/2026/08/brand_honeywell_9759c55c85c9.png', '/media/media/2026/08/brand_honeywell_9759c55c85c9.png', NULL, NULL, 'Honeywell', 'image/png', 261, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_honeywell_9759c55c85c9', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='honeywell';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_argox_128050c44be8', 'media/2026/08/brand_argox_128050c44be8.png', '/media/media/2026/08/brand_argox_128050c44be8.png', NULL, NULL, 'Argox', 'image/png', 2768, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_argox_128050c44be8', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='argox';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_efor_7f7820d2366b', 'media/2026/08/brand_efor_7f7820d2366b.svg', '/media/media/2026/08/brand_efor_7f7820d2366b.svg', NULL, NULL, 'Efor', 'image/svg+xml', 7984, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_efor_7f7820d2366b', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='efor';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_tsc_f7c796a99cf4', 'media/2026/08/brand_tsc_f7c796a99cf4.svg', '/media/media/2026/08/brand_tsc_f7c796a99cf4.svg', NULL, NULL, 'TSC', 'image/svg+xml', 12700, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_tsc_f7c796a99cf4', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='tsc';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_logitech_2142118f7bec', 'media/2026/08/brand_logitech_2142118f7bec.svg', '/media/media/2026/08/brand_logitech_2142118f7bec.svg', NULL, NULL, 'Logitech', 'image/svg+xml', 285, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_logitech_2142118f7bec', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='logitech';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_mag-batteries_23527488dfed', 'media/2026/08/brand_mag-batteries_23527488dfed.png', '/media/media/2026/08/brand_mag-batteries_23527488dfed.png', NULL, NULL, 'Mag Batteries', 'image/png', 93596, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_mag-batteries_23527488dfed', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='mag-batteries';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_karel_2aba6adf1f2c', 'media/2026/08/brand_karel_2aba6adf1f2c.svg', '/media/media/2026/08/brand_karel_2aba6adf1f2c.svg', NULL, NULL, 'Karel', 'image/svg+xml', 3022, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_karel_2aba6adf1f2c', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='karel';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_citizen_4d2f7776b0d7', 'media/2026/08/brand_citizen_4d2f7776b0d7.png', '/media/media/2026/08/brand_citizen_4d2f7776b0d7.png', NULL, NULL, 'Citizen', 'image/png', 2108, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_citizen_4d2f7776b0d7', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='citizen';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_elanda_c87cf923b6b6', 'media/2026/08/brand_elanda_c87cf923b6b6.png', '/media/media/2026/08/brand_elanda_c87cf923b6b6.png', NULL, NULL, 'Elanda', 'image/png', 2826, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_elanda_c87cf923b6b6', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='elanda';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_epos_7ae625fec4ea', 'media/2026/08/brand_epos_7ae625fec4ea.svg', '/media/media/2026/08/brand_epos_7ae625fec4ea.svg', NULL, NULL, 'Epos', 'image/svg+xml', 2086, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_epos_7ae625fec4ea', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='epos';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_asus_dc912a5e677a', 'media/2026/08/brand_asus_dc912a5e677a.svg', '/media/media/2026/08/brand_asus_dc912a5e677a.svg', NULL, NULL, 'Asus', 'image/svg+xml', 1127, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_asus_dc912a5e677a', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='asus';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_zkteco_ec61483f30f5', 'media/2026/08/brand_zkteco_ec61483f30f5.png', '/media/media/2026/08/brand_zkteco_ec61483f30f5.png', NULL, NULL, 'ZKTeco', 'image/png', 614, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_zkteco_ec61483f30f5', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='zkteco';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_gwest_f153cbdc020d', 'media/2026/08/brand_gwest_f153cbdc020d.png', '/media/media/2026/08/brand_gwest_f153cbdc020d.png', NULL, NULL, 'Gwest', 'image/png', 5469, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_gwest_f153cbdc020d', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='gwest';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_metrel_4f03d76b90ea', 'media/2026/08/brand_metrel_4f03d76b90ea.png', '/media/media/2026/08/brand_metrel_4f03d76b90ea.png', NULL, NULL, 'Metrel', 'image/png', 75912, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_metrel_4f03d76b90ea', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='metrel';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_ricoh_7a09ebb381a8', 'media/2026/08/brand_ricoh_7a09ebb381a8.svg', '/media/media/2026/08/brand_ricoh_7a09ebb381a8.svg', NULL, NULL, 'RICOH', 'image/svg+xml', 10746, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_ricoh_7a09ebb381a8', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='ricoh';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_huntertec_b9fb43f074c1', 'media/2026/08/brand_huntertec_b9fb43f074c1.png', '/media/media/2026/08/brand_huntertec_b9fb43f074c1.png', NULL, NULL, 'HunterTec', 'image/png', 8733, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_huntertec_b9fb43f074c1', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='huntertec';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_dell_3af22c48955c', 'media/2026/08/brand_dell_3af22c48955c.png', '/media/media/2026/08/brand_dell_3af22c48955c.png', NULL, NULL, 'Dell', 'image/png', 15327, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_dell_3af22c48955c', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='dell';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_somfy_f213f0f13fd3', 'media/2026/08/brand_somfy_f213f0f13fd3.png', '/media/media/2026/08/brand_somfy_f213f0f13fd3.png', NULL, NULL, 'Somfy', 'image/png', 3796, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_somfy_f213f0f13fd3', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='somfy';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_pyrsmian_009080636831', 'media/2026/08/brand_pyrsmian_009080636831.webp', '/media/media/2026/08/brand_pyrsmian_009080636831.webp', NULL, NULL, 'PYRSMIAN', 'image/webp', 2618, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_pyrsmian_009080636831', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='pyrsmian';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_scheppach_a0ea2aaad66a', 'media/2026/08/brand_scheppach_a0ea2aaad66a.png', '/media/media/2026/08/brand_scheppach_a0ea2aaad66a.png', NULL, NULL, 'Scheppach', 'image/png', 21293, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_scheppach_a0ea2aaad66a', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='scheppach';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_hioki_01c6513dd89e', 'media/2026/08/brand_hioki_01c6513dd89e.png', '/media/media/2026/08/brand_hioki_01c6513dd89e.png', NULL, NULL, 'Hioki', 'image/png', 1362, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_hioki_01c6513dd89e', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='hioki';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_benq_3604587fc04a', 'media/2026/08/brand_benq_3604587fc04a.png', '/media/media/2026/08/brand_benq_3604587fc04a.png', NULL, NULL, 'BENQ', 'image/png', 110866, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_benq_3604587fc04a', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='benq';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_bluetti_999570083781', 'media/2026/08/brand_bluetti_999570083781.png', '/media/media/2026/08/brand_bluetti_999570083781.png', NULL, NULL, 'Bluetti', 'image/png', 1994, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_bluetti_999570083781', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='bluetti';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_weintek_a516b90ad4f2', 'media/2026/08/brand_weintek_a516b90ad4f2.png', '/media/media/2026/08/brand_weintek_a516b90ad4f2.png', NULL, NULL, 'Weintek', 'image/png', 2153, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_weintek_a516b90ad4f2', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='weintek';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_siemens_0307173baa44', 'media/2026/08/brand_siemens_0307173baa44.svg', '/media/media/2026/08/brand_siemens_0307173baa44.svg', NULL, NULL, 'Siemens', 'image/svg+xml', 753, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_siemens_0307173baa44', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='siemens';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_perfects_5b77fc1fdf61', 'media/2026/08/brand_perfects_5b77fc1fdf61.svg', '/media/media/2026/08/brand_perfects_5b77fc1fdf61.svg', NULL, NULL, 'Perfects', 'image/svg+xml', 8197, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_perfects_5b77fc1fdf61', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='perfects';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_yaskawa_203c4bb67872', 'media/2026/08/brand_yaskawa_203c4bb67872.png', '/media/media/2026/08/brand_yaskawa_203c4bb67872.png', NULL, NULL, 'Yaskawa', 'image/png', 6236, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_yaskawa_203c4bb67872', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='yaskawa';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_philips_c397990db4ac', 'media/2026/08/brand_philips_c397990db4ac.svg', '/media/media/2026/08/brand_philips_c397990db4ac.svg', NULL, NULL, 'PHILIPS', 'image/svg+xml', 1208, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_philips_c397990db4ac', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='philips';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_niimbot_400b58d5e0bb', 'media/2026/08/brand_niimbot_400b58d5e0bb.png', '/media/media/2026/08/brand_niimbot_400b58d5e0bb.png', NULL, NULL, 'NIIMBOT', 'image/png', 6037, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_niimbot_400b58d5e0bb', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='niimbot';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_viewsonic_96fe3e8f326f', 'media/2026/08/brand_viewsonic_96fe3e8f326f.webp', '/media/media/2026/08/brand_viewsonic_96fe3e8f326f.webp', NULL, NULL, 'ViewSonic', 'image/webp', 3914, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_viewsonic_96fe3e8f326f', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='viewsonic';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_aspilsan_ae3455a0d226', 'media/2026/08/brand_aspilsan_ae3455a0d226.png', '/media/media/2026/08/brand_aspilsan_ae3455a0d226.png', NULL, NULL, 'Aspilsan', 'image/png', 10044, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_aspilsan_ae3455a0d226', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='aspilsan';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_ifm_eb98cff42f86', 'media/2026/08/brand_ifm_eb98cff42f86.svg', '/media/media/2026/08/brand_ifm_eb98cff42f86.svg', NULL, NULL, 'ifm', 'image/svg+xml', 1447, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_ifm_eb98cff42f86', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='ifm';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_bosch_0b0052e21745', 'media/2026/08/brand_bosch_0b0052e21745.png', '/media/media/2026/08/brand_bosch_0b0052e21745.png', NULL, NULL, 'Bosch', 'image/png', 3245, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_bosch_0b0052e21745', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='bosch';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_hasegawa_2473b009fc0b', 'media/2026/08/brand_hasegawa_2473b009fc0b.png', '/media/media/2026/08/brand_hasegawa_2473b009fc0b.png', NULL, NULL, 'Hasegawa', 'image/png', 20248, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_hasegawa_2473b009fc0b', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='hasegawa';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_leuze_a84df424d601', 'media/2026/08/brand_leuze_a84df424d601.svg', '/media/media/2026/08/brand_leuze_a84df424d601.svg', NULL, NULL, 'Leuze', 'image/svg+xml', 1470, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_leuze_a84df424d601', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='leuze';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_lutian_2b3965450520', 'media/2026/08/brand_lutian_2b3965450520.svg', '/media/media/2026/08/brand_lutian_2b3965450520.svg', NULL, NULL, 'Lutian', 'image/svg+xml', 1150, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_lutian_2b3965450520', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='lutian';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_fluke_815aa8b80bc8', 'media/2026/08/brand_fluke_815aa8b80bc8.svg', '/media/media/2026/08/brand_fluke_815aa8b80bc8.svg', NULL, NULL, 'Fluke', 'image/svg+xml', 842, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_fluke_815aa8b80bc8', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='fluke';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_exor_ed951138e1d7', 'media/2026/08/brand_exor_ed951138e1d7.png', '/media/media/2026/08/brand_exor_ed951138e1d7.png', NULL, NULL, 'Exor', 'image/png', 849, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_exor_ed951138e1d7', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='exor';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_moxa_a8cd2d276d57', 'media/2026/08/brand_moxa_a8cd2d276d57.png', '/media/media/2026/08/brand_moxa_a8cd2d276d57.png', NULL, NULL, 'Moxa', 'image/png', 25120, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_moxa_a8cd2d276d57', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='moxa';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_ewon_5ede11358476', 'media/2026/08/brand_ewon_5ede11358476.svg', '/media/media/2026/08/brand_ewon_5ede11358476.svg', NULL, NULL, 'Ewon', 'image/svg+xml', 1981, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_ewon_5ede11358476', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='ewon';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_beijer_698343337174', 'media/2026/08/brand_beijer_698343337174.svg', '/media/media/2026/08/brand_beijer_698343337174.svg', NULL, NULL, 'Beijer', 'image/svg+xml', 16052, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_beijer_698343337174', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='beijer';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_wenglor_8559a02b60b2', 'media/2026/08/brand_wenglor_8559a02b60b2.webp', '/media/media/2026/08/brand_wenglor_8559a02b60b2.webp', NULL, NULL, 'Wenglor', 'image/webp', 19554, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_wenglor_8559a02b60b2', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='wenglor';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_datalogic_5ef536f92c50', 'media/2026/08/brand_datalogic_5ef536f92c50.png', '/media/media/2026/08/brand_datalogic_5ef536f92c50.png', NULL, NULL, 'Datalogic', 'image/png', 2317, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_datalogic_5ef536f92c50', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='datalogic';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_ccs_31d8c32d2577', 'media/2026/08/brand_ccs_31d8c32d2577.png', '/media/media/2026/08/brand_ccs_31d8c32d2577.png', NULL, NULL, 'ÇÇS', 'image/png', 4961, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_ccs_31d8c32d2577', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='ccs';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_aksa-jenerator_aef911f592c7', 'media/2026/08/brand_aksa-jenerator_aef911f592c7.png', '/media/media/2026/08/brand_aksa-jenerator_aef911f592c7.png', NULL, NULL, 'Aksa Jeneratör', 'image/png', 150425, 'import', '2026-08-03T19:37:02.474Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_aksa-jenerator_aef911f592c7', updated_at='2026-08-03T19:37:02.474Z' WHERE slug='aksa-jenerator';

-- retry pass
INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_newland_b86837e516b3', 'media/2026/08/brand_newland_b86837e516b3.svg', '/media/media/2026/08/brand_newland_b86837e516b3.svg', NULL, NULL, 'Newland', 'image/svg+xml', 13182, 'import', '2026-08-03T19:44:49.262Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_newland_b86837e516b3', updated_at='2026-08-03T19:44:49.262Z' WHERE slug='newland';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_ledrox_16be236e4c35', 'media/2026/08/brand_ledrox_16be236e4c35.png', '/media/media/2026/08/brand_ledrox_16be236e4c35.png', NULL, NULL, 'Ledrox', 'image/png', 4707, 'import', '2026-08-03T19:44:49.262Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_ledrox_16be236e4c35', updated_at='2026-08-03T19:44:49.262Z' WHERE slug='ledrox';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_turck_f890a32fd074', 'media/2026/08/brand_turck_f890a32fd074.png', '/media/media/2026/08/brand_turck_f890a32fd074.png', NULL, NULL, 'Turck', 'image/png', 6777, 'import', '2026-08-03T19:44:49.262Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_turck_f890a32fd074', updated_at='2026-08-03T19:44:49.262Z' WHERE slug='turck';

INSERT INTO media (id, key, url, width, height, alt, mime, size_bytes, source, created_at)
         VALUES ('med_brand_sigma_b6eb1c732429', 'media/2026/08/brand_sigma_b6eb1c732429.png', '/media/media/2026/08/brand_sigma_b6eb1c732429.png', NULL, NULL, 'Sigma', 'image/png', 1175, 'import', '2026-08-03T19:44:49.262Z')
         ON CONFLICT(id) DO UPDATE SET key=excluded.key, url=excluded.url, alt=excluded.alt, mime=excluded.mime, size_bytes=excluded.size_bytes;
UPDATE brands SET logo_media_id='med_brand_sigma_b6eb1c732429', updated_at='2026-08-03T19:44:49.262Z' WHERE slug='sigma';

