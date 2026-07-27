import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const media = sqliteTable('media', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  url: text('url').notNull(),
  width: integer('width'),
  height: integer('height'),
  alt: text('alt').notNull().default(''),
  mime: text('mime').notNull().default('image/jpeg'),
  sizeBytes: integer('size_bytes'),
  source: text('source').notNull().default('upload'),
  createdAt: text('created_at').notNull(),
});

export type Media = typeof media.$inferSelect;
