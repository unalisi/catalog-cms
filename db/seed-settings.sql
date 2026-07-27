-- FAZ 8: expanded site settings (idempotent upsert)
PRAGMA foreign_keys = ON;

INSERT INTO settings (key, value_json, updated_at) VALUES
  (
    'site',
    '{"name":"Catalog CMS","tagline":"Ürün kataloğu. Hızlı. SEO odaklı.","logoMediaId":null,"faviconMediaId":null,"contactEmail":null,"contactPhone":null,"address":null,"social":{},"analytics":{},"navigation":[{"label":"Katalog","href":"/catalog"},{"label":"Blog","href":"/blog"}],"footerText":null}',
    '2026-07-27T00:00:00.000Z'
  )
ON CONFLICT(key) DO UPDATE SET
  value_json = excluded.value_json,
  updated_at = excluded.updated_at;
