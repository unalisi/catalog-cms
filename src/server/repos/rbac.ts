import { asc, eq } from 'drizzle-orm';
import { rolePermissions, roles, users, type Role, type User } from '../../../db/schema';
import { getDb } from '../db';
import { nowIso } from '../../lib/utils/id';

export type UserWithRole = User & {
  roleName: string;
  roleSlug: string;
  roleIsSystem: boolean;
};

export async function listUsers(): Promise<UserWithRole[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      roleId: users.roleId,
      mustChangePassword: users.mustChangePassword,
      status: users.status,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      roleName: roles.name,
      roleSlug: roles.slug,
      roleIsSystem: roles.isSystem,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .orderBy(asc(users.email));
  return rows;
}

export async function getUserById(id: string): Promise<UserWithRole | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      roleId: users.roleId,
      mustChangePassword: users.mustChangePassword,
      status: users.status,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      roleName: roles.name,
      roleSlug: roles.slug,
      roleIsSystem: roles.isSystem,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, id))
    .limit(1);
  return row ?? null;
}

export async function insertUser(input: {
  id: string;
  email: string;
  passwordHash: string;
  roleId: string;
  mustChangePassword?: boolean;
  status?: 'pending' | 'active';
}): Promise<User> {
  const now = nowIso();
  const db = getDb();
  await db.insert(users).values({
    id: input.id,
    email: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    roleId: input.roleId,
    mustChangePassword: input.mustChangePassword ?? false,
    status: input.status ?? 'pending',
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db.select().from(users).where(eq(users.id, input.id)).limit(1);
  return row!;
}

export async function updateUser(
  id: string,
  fields: {
    email?: string;
    passwordHash?: string;
    roleId?: string;
    mustChangePassword?: boolean;
    status?: 'pending' | 'active';
  },
): Promise<User | null> {
  const db = getDb();
  const patch: Partial<User> = { updatedAt: nowIso() };
  if (fields.email !== undefined) patch.email = fields.email.toLowerCase();
  if (fields.passwordHash !== undefined) patch.passwordHash = fields.passwordHash;
  if (fields.roleId !== undefined) patch.roleId = fields.roleId;
  if (fields.mustChangePassword !== undefined) patch.mustChangePassword = fields.mustChangePassword;
  if (fields.status !== undefined) patch.status = fields.status;
  await db.update(users).set(patch).where(eq(users.id, id));
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

export async function deleteUser(id: string): Promise<boolean> {
  const db = getDb();
  const existing = await getUserById(id);
  if (!existing) return false;
  await db.delete(users).where(eq(users.id, id));
  return true;
}

export async function isEmailTaken(email: string, excludeId?: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  if (!row) return false;
  return excludeId ? row.id !== excludeId : true;
}

export type RoleWithPermissions = Role & { permissions: string[] };

export async function listRoles(): Promise<RoleWithPermissions[]> {
  const db = getDb();
  const roleRows = await db.select().from(roles).orderBy(asc(roles.name));
  const permRows = await db.select().from(rolePermissions);
  const byRole = new Map<string, string[]>();
  for (const p of permRows) {
    const list = byRole.get(p.roleId) ?? [];
    list.push(p.permission);
    byRole.set(p.roleId, list);
  }
  return roleRows.map((r) => ({
    ...r,
    permissions: byRole.get(r.id) ?? [],
  }));
}

export async function getRoleById(id: string): Promise<RoleWithPermissions | null> {
  const db = getDb();
  const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  if (!role) return null;
  const perms = await db
    .select({ permission: rolePermissions.permission })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, id));
  return { ...role, permissions: perms.map((p) => p.permission) };
}

export async function getRoleBySlug(slug: string): Promise<Role | null> {
  const db = getDb();
  const [row] = await db.select().from(roles).where(eq(roles.slug, slug)).limit(1);
  return row ?? null;
}

export async function insertRole(input: {
  id: string;
  name: string;
  slug: string;
  description: string;
  isSystem?: boolean;
  permissions: string[];
}): Promise<RoleWithPermissions> {
  const now = nowIso();
  const db = getDb();
  await db.insert(roles).values({
    id: input.id,
    name: input.name,
    slug: input.slug,
    description: input.description,
    isSystem: input.isSystem ?? false,
    createdAt: now,
    updatedAt: now,
  });
  if (input.permissions.length > 0) {
    await db.insert(rolePermissions).values(
      input.permissions.map((permission) => ({ roleId: input.id, permission })),
    );
  }
  return (await getRoleById(input.id))!;
}

export async function updateRole(
  id: string,
  fields: { name?: string; description?: string; permissions?: string[] },
): Promise<RoleWithPermissions | null> {
  const db = getDb();
  const patch: Partial<Role> = { updatedAt: nowIso() };
  if (fields.name !== undefined) patch.name = fields.name;
  if (fields.description !== undefined) patch.description = fields.description;
  await db.update(roles).set(patch).where(eq(roles.id, id));
  if (fields.permissions !== undefined) {
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
    if (fields.permissions.length > 0) {
      await db.insert(rolePermissions).values(
        fields.permissions.map((permission) => ({ roleId: id, permission })),
      );
    }
  }
  return getRoleById(id);
}

export async function deleteRole(id: string): Promise<boolean> {
  const db = getDb();
  const existing = await getRoleById(id);
  if (!existing) return false;
  await db.delete(roles).where(eq(roles.id, id));
  return true;
}
