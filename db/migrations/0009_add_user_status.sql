ALTER TABLE `users` ADD `status` text DEFAULT 'pending' NOT NULL;
UPDATE `users` SET `status` = 'active';
