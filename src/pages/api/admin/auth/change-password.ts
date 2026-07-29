import { z } from 'zod';
import { jsonErr, jsonOk } from '../../../../lib/api';
import { zodFieldErrors } from '../../../../lib/validation/admin';
import { hashPassword, verifyPassword } from '../../../../server/auth/password';
import { getSessionUser, setSessionUser } from '../../../../server/auth/session';
import * as repo from '../../../../server/repos/rbac';
import type { APIRoute } from 'astro';

export const prerender = false;

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

export const POST: APIRoute = async (context) => {
  const sessionUser = await getSessionUser(context);
  if (!sessionUser) return jsonErr('unauthorized', 'Giriş gerekli', 401);

  const body = await context.request.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonErr('validation_error', 'Doğrulama hatası', 400, zodFieldErrors(parsed.error));
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return jsonErr('validation_error', 'Yeni parola eskisiyle aynı olamaz', 400, {
      newPassword: 'Yeni parola eskisiyle aynı olamaz',
    });
  }

  const dbUser = await repo.getUserById(sessionUser.id);
  if (!dbUser) return jsonErr('not_found', 'Kullanıcı bulunamadı', 404);

  const ok = await verifyPassword(parsed.data.currentPassword, dbUser.passwordHash);
  if (!ok) {
    return jsonErr('validation_error', 'Mevcut parola hatalı', 400, {
      currentPassword: 'Mevcut parola hatalı',
    });
  }

  await repo.updateUser(sessionUser.id, {
    passwordHash: await hashPassword(parsed.data.newPassword),
    mustChangePassword: false,
  });

  const refreshed = { ...sessionUser, mustChangePassword: false };
  setSessionUser(context, refreshed);

  return jsonOk({ ok: true });
};
