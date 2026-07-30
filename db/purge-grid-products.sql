-- Purge FAZ 3 grid demo products (~1000)
PRAGMA foreign_keys = ON;
DELETE FROM product_categories WHERE product_id LIKE 'grid_prod_%';
DELETE FROM product_variants WHERE product_id LIKE 'grid_prod_%';
DELETE FROM product_media WHERE product_id LIKE 'grid_prod_%';
DELETE FROM products WHERE id LIKE 'grid_prod_%';
