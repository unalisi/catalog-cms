-- 0011_import_pause_cancel.sql
-- Pause/cancel job statuses (Drizzle enum only; SQLite has no CHECK).
-- Track product_id on import_items for cancel rollback of creates.

ALTER TABLE import_items ADD COLUMN product_id TEXT REFERENCES products(id);

CREATE INDEX idx_import_items_job_product ON import_items(job_id, product_id);
