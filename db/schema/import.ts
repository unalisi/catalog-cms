import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './auth';

export const importJobs = sqliteTable('import_jobs', {
  id: text('id').primaryKey(),
  source: text('source', { enum: ['csv', 'woo', 'wxr'] }).notNull(),
  status: text('status', {
    enum: ['pending', 'validating', 'ready', 'queued', 'processing', 'completed', 'failed'],
  })
    .notNull()
    .default('pending'),
  conflictPolicy: text('conflict_policy', { enum: ['skip', 'overwrite', 'merge'] })
    .notNull()
    .default('skip'),
  mappingJson: text('mapping_json'),
  summaryJson: text('summary_json'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const importItems = sqliteTable(
  'import_items',
  {
    id: text('id').primaryKey(),
    jobId: text('job_id')
      .notNull()
      .references(() => importJobs.id, { onDelete: 'cascade' }),
    rowIndex: integer('row_index').notNull(),
    rawJson: text('raw_json').notNull(),
    mappedJson: text('mapped_json'),
    action: text('action', { enum: ['create', 'update', 'skip', 'error'] }),
    status: text('status', { enum: ['pending', 'ok', 'error'] })
      .notNull()
      .default('pending'),
    error: text('error'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('import_items_job_row_idx').on(t.jobId, t.rowIndex)],
);

export type ImportJob = typeof importJobs.$inferSelect;
export type ImportItem = typeof importItems.$inferSelect;
