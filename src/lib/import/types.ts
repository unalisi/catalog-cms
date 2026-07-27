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
};

/** Message shape sent to the `IMPORT_QUEUE` (catalog-import) queue. */
export type ImportQueueMessage = {
  jobId: string;
  itemIds: string[];
};

export type ImportAdapter = {
  parseToRecords(input: string, mapping?: MappingProfile): ImportRecord[];
};
