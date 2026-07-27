CREATE TABLE `import_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`conflict_policy` text DEFAULT 'skip' NOT NULL,
	`mapping_json` text,
	`summary_json` text,
	`created_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);
--> statement-breakpoint
CREATE TABLE `import_items` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`row_index` integer NOT NULL,
	`raw_json` text NOT NULL,
	`mapped_json` text,
	`action` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`error` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `import_jobs`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `import_items_job_row_idx` ON `import_items` (`job_id`,`row_index`);
