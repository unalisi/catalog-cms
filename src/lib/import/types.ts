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
export type ImportItemStatus = 'pending' | 'ok' | 'error' | 'core_done' | 'failed';

export type ImportJobStatus =
  | 'pending'
  | 'validating'
  | 'ready'
  | 'queued'
  | 'processing'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

/** Fast lane (IMPORT_QUEUE) mesaj zarfı — ürün verisi, görsel yok. */
export type ImportCoreMessage = {
  jobId: string;
  itemId: string;
  /** Optional: consumer loads from import_items when omitted (preferred for large jobs). */
  record?: ImportRecord;
  conflictPolicy: ConflictPolicy;
  /** Görseller bitince ürün bu duruma geçer. Overridden from record.status when record is loaded in consumer. */
  targetStatus: 'draft' | 'published';
};

/** Slow lane (IMPORT_MEDIA_QUEUE) — görsel başına bir mesaj. */
export type ImportMediaMessage = {
  jobId: string;
  productId: string;
  importMediaItemId: string;
  sourceUrl: string;
  position: number;
  isPrimary: boolean;
  targetStatus: 'draft' | 'published';
};

/** İki fazlı job özeti (`import_jobs.summary_json`). */
export type ImportJobSummary = {
  total: number;
  core: { done: number; failed: number };
  media: { pending: number; done: number; failed: number };
  published: number;
  startedAt: string;
  coreCompletedAt: string | null;
  mediaCompletedAt: string | null;
  /** Dry-run / hata mesajı (opsiyonel). */
  message?: string;
  create?: number;
  update?: number;
  skip?: number;
  error?: number;
};

/** @deprecated Legacy queue envelope — prefer ImportCoreMessage / ImportMediaMessage. */
export type ImportQueueMessage =
  | ImportCoreMessage
  | ImportMediaMessage
  | { type: 'prepare'; jobId: string }
  | { type: 'apply'; jobId: string; itemIds: string[] }
  | { type: 'media'; jobId: string; itemId: string; productId: string }
  | { jobId: string; itemIds: string[] };

export type ImportAdapter = {
  parseToRecords(input: string, mapping?: MappingProfile): ImportRecord[];
};
