-- RBAC: roles + role_permissions; migrate users.role → role_id
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`is_system` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_slug_unique` ON `roles` (`slug`);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` text NOT NULL,
	`permission` text NOT NULL,
	PRIMARY KEY(`role_id`, `permission`),
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `roles` (`id`, `name`, `slug`, `description`, `is_system`, `created_at`, `updated_at`) VALUES
	('role_admin', 'Admin', 'admin', 'Tüm yetkilere sahip sistem yöneticisi', 1, '2026-07-28T00:00:00.000Z', '2026-07-28T00:00:00.000Z'),
	('role_product_manager', 'Ürün Düzenleyici', 'product-manager', 'Ürün, marka, kategori ve medya yönetimi', 1, '2026-07-28T00:00:00.000Z', '2026-07-28T00:00:00.000Z'),
	('role_blog_writer', 'Blog Yazarı', 'blog-writer', 'Blog yazıları ve medya', 1, '2026-07-28T00:00:00.000Z', '2026-07-28T00:00:00.000Z'),
	('role_site_designer', 'Site Tasarımcısı', 'site-designer', 'Sayfa builder, medya ve SEO', 1, '2026-07-28T00:00:00.000Z', '2026-07-28T00:00:00.000Z');
--> statement-breakpoint
INSERT INTO `role_permissions` (`role_id`, `permission`) VALUES
	('role_admin', 'dashboard.access'),
	('role_admin', 'products.manage'),
	('role_admin', 'brands.manage'),
	('role_admin', 'categories.manage'),
	('role_admin', 'pages.manage'),
	('role_admin', 'blog.manage'),
	('role_admin', 'media.manage'),
	('role_admin', 'seo.manage'),
	('role_admin', 'import.manage'),
	('role_admin', 'settings.manage'),
	('role_admin', 'users.manage'),
	('role_product_manager', 'dashboard.access'),
	('role_product_manager', 'products.manage'),
	('role_product_manager', 'brands.manage'),
	('role_product_manager', 'categories.manage'),
	('role_product_manager', 'media.manage'),
	('role_blog_writer', 'dashboard.access'),
	('role_blog_writer', 'blog.manage'),
	('role_blog_writer', 'media.manage'),
	('role_site_designer', 'dashboard.access'),
	('role_site_designer', 'pages.manage'),
	('role_site_designer', 'media.manage'),
	('role_site_designer', 'seo.manage');
--> statement-breakpoint
CREATE TABLE `users_new` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `users_new` (`id`, `email`, `password_hash`, `role_id`, `created_at`, `updated_at`)
SELECT
	`id`,
	`email`,
	`password_hash`,
	CASE WHEN `role` = 'editor' THEN 'role_product_manager' ELSE 'role_admin' END,
	`created_at`,
	`updated_at`
FROM `users`;
--> statement-breakpoint
DROP TABLE `users`;
--> statement-breakpoint
ALTER TABLE `users_new` RENAME TO `users`;
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
