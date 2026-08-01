import type {
  ConflictPolicyInput,
  ImportRecordInput,
  MappingProfileInput,
} from '../validation/import';

export type ImportRecord = ImportRecordInput;
export type MappingProfile = MappingProfileInput;
export type ConflictPolicy = ConflictPolicyInput;
export type ImportSource = 'csv' | 'woo' | 'wxr';

export type ImportItemAction = 'create' | 'update' | 'skip' | 'error';
export type ImportItemStatus = 'pending' | 'ok' | 'error';

export type ImportJobStatus =
  | 'pending'
  | 'validating'
  | 'ready'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

export type ImportJobSummary = {
  total: number;
  create: number;
  update: number;
  skip: number;
  error: number;
  /** Human-readable failure reason when job status is `failed`. */
  message?: string;
  /** Background media import counters (products may complete before media). */
  mediaTotal?: number;
  mediaDone?: number;
  mediaError?: number;
};

/**
 * Messages for `IMPORT_QUEUE` (catalog-import) and `IMPORT_MEDIA_QUEUE` (catalog-import-media).
 * - `prepare` / `apply` → product queue only
 * - `media` → dedicated media queue (never competes with product apply concurrency)
 */
export type ImportQueueMessage =
  | { type: 'prepare'; jobId: string }
  | { type: 'apply'; jobId: string; itemIds: string[] }
  | { type: 'media'; jobId: string; itemId: string; productId: string }
  | { jobId: string; itemIds: string[] };

export type ImportAdapter = {
  parseToRecords(input: string, mapping?: MappingProfile): ImportRecord[];
};
