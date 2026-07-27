import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { media } from './media';
import { seoMeta } from './seo';

export const brands = sqliteTable('brands', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  logoMediaId: text('logo_media_id').references(() => media.id),
  seoId: text('seo_id').references(() => seoMeta.id),
  status: text('status', { enum: ['draft', 'published', 'archived'] })
    .notNull()
    .default('draft'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const categories = sqliteTable(
  'categories',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    parentId: text('parent_id'),
    description: text('description'),
    imageMediaId: text('image_media_id').references(() => media.id),
    seoId: text('seo_id').references(() => seoMeta.id),
    position: integer('position').notNull().default(0),
    status: text('status', { enum: ['draft', 'published', 'archived'] })
      .notNull()
      .default('draft'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [index('categories_parent_idx').on(t.parentId)],
);

export type Brand = typeof brands.$inferSelect;
export type Category = typeof categories.$inferSelect;
