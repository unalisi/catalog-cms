import { defineConfig } from 'drizzle-kit';

/** FAZ 0: schema empty. FAZ 1 generates SQL into db/migrations. */
export default defineConfig({
  schema: './db/schema/index.ts',
  out: './db/migrations',
  dialect: 'sqlite',
});
