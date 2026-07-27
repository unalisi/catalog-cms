import { drizzle } from 'drizzle-orm/d1';
import { env } from 'cloudflare:workers';

/** D1 client. Schema wiring lands in FAZ 1. */
export function getDb() {
  return drizzle(env.DB);
}
