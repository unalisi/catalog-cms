import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { seoMeta } from './seo';

export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  status: text('status', { enum: ['draft', 'published', 'archived'] })
    .notNull()
    .default('draft'),
  seoId: text('seo_id').references(() => seoMeta.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const pageSections = sqliteTable(
  'page_sections',
  {
    id: text('id').primaryKey(),
    pageId: text('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    position: integer('position').notNull().default(0),
    isVisible: integer('is_visible', { mode: 'boolean' }).notNull().default(true),
    configJson: text('config_json').notNull().default('{}'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [index('page_sections_page_position_idx').on(t.pageId, t.position)],
);

export type Page = typeof pages.$inferSelect;
export type PageSection = typeof pageSections.$inferSelect;
