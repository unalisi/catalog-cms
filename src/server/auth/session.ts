import type { APIContext, AstroGlobal } from 'astro';
import { eq } from 'drizzle-orm';
import { users, type User } from '../../../db/schema';
import { getDb } from '../db';
import { hashPassword, verifyPassword } from './password';
import { newId, nowIso } from '../../lib/utils/id';
import { env } from 'cloudflare:workers';
import { rateLimit } from '../../lib/security/rate-limit';

export type SessionUser = {
  id: string;
  email: string;
  role: User['role'];
};

type SessionHost = Pick<APIContext, 'session'> | Pick<AstroGlobal, 'session'>;

const SESSION_USER_KEY = 'user';

export async function getSessionUser(host: SessionHost): Promise<SessionUser | null> {
  const session = host.session;
  if (!session) return null;
  const user = await session.get(SESSION_USER_KEY);
  if (!user || typeof user !== 'object') return null;
  const candidate = user as SessionUser;
  if (!candidate.id || !candidate.email || !candidate.role) return null;
  return candidate;
}

export function setSessionUser(host: SessionHost, user: SessionUser): void {
  if (!host.session) throw new Error('Session unavailable');
  host.session.set(SESSION_USER_KEY, user);
}

export function clearSession(host: SessionHost): void {
  if (!host.session) return;
  host.session.destroy();
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return row ?? null;
}

export async function countUsers(): Promise<number> {
  const db = getDb();
  const rows = await db.select({ id: users.id }).from(users).limit(1);
  return rows.length;
}

export async function ensureBootstrapAdmin(): Promise<void> {
  const existing = await findUserByEmail('admin@catalog.local');
  if (existing) return;

  const password =
    ((env as { ADMIN_BOOTSTRAP_PASSWORD?: string }).ADMIN_BOOTSTRAP_PASSWORD ?? '').trim() ||
    'ChangeMeNow!';
  const now = nowIso();
  await getDb().insert(users).values({
    id: newId('user'),
    email: 'admin@catalog.local',
    passwordHash: await hashPassword(password),
    role: 'admin',
    createdAt: now,
    updatedAt: now,
  });
}

export async function authenticate(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  await ensureBootstrapAdmin();
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  return { id: user.id, email: user.email, role: user.role };
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!host) return false;
  if (!origin) {
    // Same-origin form navigations may omit Origin; require Referer match.
    const referer = request.headers.get('referer');
    if (!referer) return true;
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function rateLimitLogin(ip: string): Promise<boolean> {
  return rateLimit('login', ip, 20, 60);
}
