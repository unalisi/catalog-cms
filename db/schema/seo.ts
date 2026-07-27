import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { media } from './media';

export const seoMeta = sqliteTable('seo_meta', {
  id: text('id').primaryKey(),
  title: text('title'),
  description: text('description'),
  canonical: text('canonical'),
  ogImageMediaId: text('og_image_media_id').references(() => media.id),
  noindex: integer('noindex', { mode: 'boolean' }).notNull().default(false),
  robotsExtra: text('robots_extra'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type SeoMeta = typeof seoMeta.$inferSelect;
