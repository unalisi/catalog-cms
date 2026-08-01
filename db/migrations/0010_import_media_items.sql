-- 0010_import_media_items.sql
-- İki fazlı import: görsel bazında granüler takip.

CREATE TABLE import_media_items (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_primary INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  media_id TEXT REFERENCES media(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_import_media_job_product ON import_media_items(job_id, product_id);
CREATE INDEX idx_import_media_status ON import_media_items(status);
