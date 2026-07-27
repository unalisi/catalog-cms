import { handle } from '@astrojs/cloudflare/handler';
import type { ImportQueueMessage } from './lib/import/types';
import { processImportQueue } from './server/services/import';

export default {
  async fetch(request, env, ctx) {
    return handle(request, env, ctx);
  },
  async queue(batch, _env, _ctx) {
    await processImportQueue(batch as MessageBatch<ImportQueueMessage>);
  },
} satisfies ExportedHandler<Env>;
