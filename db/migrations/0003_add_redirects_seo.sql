ALTER TABLE `seo_meta` ADD COLUMN `og_image_url` text;
--> statement-breakpoint
CREATE TABLE `redirects` (
	`id` text PRIMARY KEY NOT NULL,
	`from_path` text NOT NULL,
	`to_path` text NOT NULL,
	`status_code` integer DEFAULT 301 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `redirects_from_path_unique` ON `redirects` (`from_path`);
--> statement-breakpoint
CREATE INDEX `redirects_from_path_idx` ON `redirects` (`from_path`);
