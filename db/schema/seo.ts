import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { media } from './media';

export const seoMeta = sqliteTable('seo_meta', {
  id: text('id').primaryKey(),
  title: text('title'),
  description: text('description'),
  canonical: text('canonical'),
  ogImageMediaId: text('og_image_media_id').references(() => media.id),
  ogImageUrl: text('og_image_url'),
  noindex: integer('noindex', { mode: 'boolean' }).notNull().default(false),
  robotsExtra: text('robots_extra'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const redirects = sqliteTable(
  'redirects',
  {
    id: text('id').primaryKey(),
    fromPath: text('from_path').notNull().unique(),
    toPath: text('to_path').notNull(),
    statusCode: integer('status_code').notNull().default(301),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('redirects_from_path_idx').on(t.fromPath)],
);

export type SeoMeta = typeof seoMeta.$inferSelect;
export type Redirect = typeof redirects.$inferSelect;
