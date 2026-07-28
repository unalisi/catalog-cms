import { contactMessages } from '../../../db/schema';
import type { Db } from '../db';
import { newId, nowIso } from '../../lib/utils/id';

export async function insertContactMessage(
  db: Db,
  input: { name: string; email: string; phone: string; message: string },
) {
  const id = newId('cmsg');
  const createdAt = nowIso();
  await db.insert(contactMessages).values({
    id,
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    message: input.message,
    createdAt,
  });
  return { id, createdAt };
}
