-- FAZ 5: SEO defaults setting (idempotent upsert)
PRAGMA foreign_keys = ON;

INSERT INTO settings (key, value_json, updated_at)
VALUES (
  'seo',
  '{"siteName":"Catalog CMS","titleTemplate":"%s · Catalog CMS","defaultDescription":"Ürün kataloğu. Hızlı. SEO odaklı.","defaultOgImageUrl":"/favicon.svg","organizationName":"Catalog CMS","twitterHandle":null}',
  '2026-07-27T00:00:00.000Z'
)
ON CONFLICT(key) DO UPDATE SET
  value_json = excluded.value_json,
  updated_at = excluded.updated_at;
