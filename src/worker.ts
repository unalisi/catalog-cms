import type { ImportQueueMessage } from './lib/import/types';
import { handle } from '@astrojs/cloudflare/handler';
import { processImportMediaQueue, processImportQueue } from './server/services/import';

export default {
  async fetch(request, env, ctx) {
    return handle(request, env, ctx);
  },
  async queue(batch, _env, _ctx) {
    // catalog-import: prepare/dry-run only
    // catalog-import-media: per-image fetch → publish when product pending=0
    if (batch.queue === 'catalog-import-media') {
      await processImportMediaQueue(batch as MessageBatch<ImportQueueMessage>);
      return;
    }
    await processImportQueue(batch as MessageBatch<ImportQueueMessage>);
  },
} satisfies ExportedHandler<Env>;
