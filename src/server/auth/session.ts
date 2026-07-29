import { eq, inArray } from 'drizzle-orm';
import { rolePermissions, roles, users, type Role, type User } from '../../../db/schema';
import {
  ALL_PERMISSIONS,
  SYSTEM_ROLE_IDS,
  SYSTEM_ROLE_SEEDS,
  type Permission,
} from '../../lib/auth/permissions';
import { getDb } from '../db';
import { hashPassword, verifyPassword } from './password';
import { newId, nowIso } from '../../lib/utils/id';
import { env } from 'cloudflare:workers';
import { rateLimit } from '../../lib/security/rate-limit';
import type { APIContext, AstroGlobal } from 'astro';

export type SessionUser = {
  id: string;
  email: string;
  roleId: string;
  roleSlug: string;
  roleName: string;
  permissions: Permission[];
  mustChangePassword: boolean;
};

type SessionHost = Pick<APIContext, 'session'> | Pick<AstroGlobal, 'session'>;

const SESSION_USER_KEY = 'user';

/** Coalesce concurrent ensureSystemRoles (SSR + parallel API calls). */
let ensureSystemRolesInFlight: Promise<void> | null = null;

export async function ensureSystemRoles(): Promise<void> {
  if (ensureSystemRolesInFlight) return ensureSystemRolesInFlight;
  ensureSystemRolesInFlight = (async () => {
    const db = getDb();
    const now = nowIso();
    for (const seed of SYSTEM_ROLE_SEEDS) {
      const [existing] = await db.select().from(roles).where(eq(roles.id, seed.id)).limit(1);
      if (!existing) {
        await db.insert(roles).values({
          id: seed.id,
          name: seed.name,
          slug: seed.slug,
          description: seed.description,
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        });
        if (seed.permissions.length > 0) {
          await db.insert(rolePermissions).values(
            seed.permissions.map((permission) => ({ roleId: seed.id, permission })),
          );
        }
        continue;
      }
      // Admin always has the full registry; sync only when out of date
      if (seed.id === SYSTEM_ROLE_IDS.admin) {
        const current = await getPermissionsForRole(seed.id);
        const needed = ALL_PERMISSIONS;
        const inSync =
          current.length === needed.length && needed.every((p) => current.includes(p));
        if (!inSync) {
          await db.delete(rolePermissions).where(eq(rolePermissions.roleId, seed.id));
          await db.insert(rolePermissions).values(
            needed.map((permission) => ({ roleId: seed.id, permission })),
          );
        }
      }
    }
  })().finally(() => {
    ensureSystemRolesInFlight = null;
  });
  return ensureSystemRolesInFlight;
}

export async function getPermissionsForRole(roleId: string): Promise<Permission[]> {
  const db = getDb();
  const rows = await db
    .select({ permission: rolePermissions.permission })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, roleId));
  return rows
    .map((r) => r.permission)
    .filter((p): p is Permission => (ALL_PERMISSIONS as string[]).includes(p));
}

export async function loadSessionUserById(userId: string): Promise<SessionUser | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      roleId: users.roleId,
      roleSlug: roles.slug,
      roleName: roles.name,
      mustChangePassword: users.mustChangePassword,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) return null;
  const permissions = await getPermissionsForRole(row.roleId);
  return {
    id: row.id,
    email: row.email,
    roleId: row.roleId,
    roleSlug: row.roleSlug,
    roleName: row.roleName,
    permissions,
    mustChangePassword: Boolean(row.mustChangePassword),
  };
}

export async function getSessionUser(host: SessionHost): Promise<SessionUser | null> {
  const session = host.session;
  if (!session) return null;
  const raw = await session.get(SESSION_USER_KEY);
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as { id?: string };
  if (!candidate.id) return null;
  // Fresh permissions from DB so role edits apply without re-login
  return loadSessionUserById(candidate.id);
}

export function setSessionUser(host: SessionHost, user: SessionUser): void {
  if (!host.session) throw new Error('Session unavailable');
  host.session.set(SESSION_USER_KEY, {
    id: user.id,
    email: user.email,
    roleId: user.roleId,
    roleSlug: user.roleSlug,
    roleName: user.roleName,
    permissions: user.permissions,
    mustChangePassword: user.mustChangePassword,
  });
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

export async function findRoleById(roleId: string): Promise<Role | null> {
  const db = getDb();
  const [row] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
  return row ?? null;
}

export async function ensureBootstrapAdmin(): Promise<void> {
  await ensureSystemRoles();
  const existing = await findUserByEmail('admin@catalog.local');
  if (existing) {
    // Ensure bootstrap user stays on admin role if somehow detached
    if (existing.roleId !== SYSTEM_ROLE_IDS.admin) {
      await getDb()
        .update(users)
        .set({ roleId: SYSTEM_ROLE_IDS.admin, updatedAt: nowIso() })
        .where(eq(users.id, existing.id));
    }
    return;
  }

  const password =
    ((env as { ADMIN_BOOTSTRAP_PASSWORD?: string }).ADMIN_BOOTSTRAP_PASSWORD ?? '').trim() ||
    'ChangeMeNow!';
  const now = nowIso();
  await getDb().insert(users).values({
    id: newId('user'),
    email: 'admin@catalog.local',
    passwordHash: await hashPassword(password),
    roleId: SYSTEM_ROLE_IDS.admin,
    mustChangePassword: false,
    status: 'active',
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
  if (user.status === 'pending') {
    await getDb()
      .update(users)
      .set({ status: 'active', updatedAt: nowIso() })
      .where(eq(users.id, user.id));
  }
  return loadSessionUserById(user.id);
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!host) return false;
  if (!origin) {
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

export async function countUsersWithPermission(permission: Permission): Promise<number> {
  const db = getDb();
  const roleRows = await db
    .select({ roleId: rolePermissions.roleId })
    .from(rolePermissions)
    .where(eq(rolePermissions.permission, permission));
  const roleIds = [...new Set(roleRows.map((r) => r.roleId))];
  if (roleIds.length === 0) return 0;
  const userRows = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.roleId, roleIds));
  return userRows.length;
}

export async function countUsersWithRole(roleId: string): Promise<number> {
  const db = getDb();
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.roleId, roleId));
  return rows.length;
}
