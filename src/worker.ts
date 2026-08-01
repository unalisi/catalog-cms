import { handle } from '@astrojs/cloudflare/handler';
import type { ImportQueueMessage } from './lib/import/types';
import { processImportMediaQueue, processImportQueue } from './server/services/import';

export default {
  async fetch(request, env, ctx) {
    return handle(request, env, ctx);
  },
  async queue(batch, _env, _ctx) {
    const messages = batch as MessageBatch<ImportQueueMessage>;
    // Product apply/prepare must never share concurrency with slow image downloads.
    if (batch.queue === 'catalog-import-media') {
      await processImportMediaQueue(messages);
      return;
    }
    await processImportQueue(messages);
  },
} satisfies ExportedHandler<Env>;
