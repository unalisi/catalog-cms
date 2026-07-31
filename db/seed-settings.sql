-- Default site settings (seed). Katalog = dinamik kategoriler paneli.
INSERT INTO settings (key, value_json, updated_at)
VALUES (
  'site',
  '{"name":"Catalog CMS","tagline":"Ürün kataloğu. Hızlı. SEO odaklı.","logoMediaId":null,"faviconMediaId":null,"contactEmail":null,"contactPhone":null,"address":null,"social":{},"analytics":{},"navbarLayout":"classic","navbarCtas":[{"label":"İletişim","href":"/iletisim","variant":"solid"}],"navigation":[{"kind":"categories","label":"Katalog","href":"/catalog"},{"kind":"link","label":"Blog","href":"/blog"}],"footerText":null}',
  datetime('now')
)
ON CONFLICT(key) DO NOTHING;
