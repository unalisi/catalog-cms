/**
 * @deprecated Product writes moved to sync batch apply (`apply-product-draft` + `import-apply`).
 * IMPORT_QUEUE is prepare-only. Kept so accidental core messages are safely acked.
 */
import type { ImportCoreMessage } from '../../lib/import/types';

export async function handleImportCoreBatch(
  batch: MessageBatch<ImportCoreMessage>,
): Promise<void> {
  for (const msg of batch.messages) {
    // Legacy product-core messages: discard. Media is handled on catalog-import-media.
    msg.ack();
  }
}
