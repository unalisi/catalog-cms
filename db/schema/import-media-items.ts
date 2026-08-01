import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { importJobs } from './import';
import { products } from './products';
import { media } from './media';

export const importMediaItems = sqliteTable('import_media_items', {
  id: text('id').primaryKey(),
  jobId: text('job_id')
    .notNull()
    .references(() => importJobs.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  sourceUrl: text('source_url').notNull(),
  position: integer('position').notNull().default(0),
  isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
  status: text('status', { enum: ['pending', 'done', 'failed'] })
    .notNull()
    .default('pending'),
  attempts: integer('attempts').notNull().default(0),
  error: text('error'),
  mediaId: text('media_id').references(() => media.id),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export type ImportMediaItem = typeof importMediaItems.$inferSelect;
export type NewImportMediaItem = typeof importMediaItems.$inferInsert;
