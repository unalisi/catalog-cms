import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { media } from './media';
import { seoMeta } from './seo';
import { users } from './auth';

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

/** Blog post body is sanitized HTML (not MDX). See README FAZ 6. */
export const posts = sqliteTable(
  'posts',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    content: text('content').notNull().default(''),
    status: text('status', { enum: ['draft', 'published', 'archived'] })
      .notNull()
      .default('draft'),
    publishedAt: text('published_at'),
    authorId: text('author_id').references(() => users.id),
    coverMediaId: text('cover_media_id').references(() => media.id),
    seoId: text('seo_id').references(() => seoMeta.id),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [index('posts_status_published_idx').on(t.status, t.publishedAt)],
);

export const postTags = sqliteTable(
  'post_tags',
  {
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tag] }), index('post_tags_tag_idx').on(t.tag)],
);

export type Page = typeof pages.$inferSelect;
export type PageSection = typeof pageSections.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type PostTag = typeof postTags.$inferSelect;
