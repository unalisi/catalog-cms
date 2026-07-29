import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  SYSTEM_ROLE_IDS,
  SYSTEM_ROLE_SLUGS,
  type Permission,
} from '../../lib/auth/permissions';
import { roleCreateSchema, roleUpdateSchema, userCreateSchema, userUpdateSchema } from '../../lib/validation/users';
import { zodFieldErrors } from '../../lib/validation/admin';
import { newId, slugify } from '../../lib/utils/id';
import { hashPassword } from '../auth/password';
import {
  countUsersWithPermission,
  countUsersWithRole,
  ensureSystemRoles,
} from '../auth/session';
import * as repo from '../repos/rbac';
import { sendEmail } from '../email/resend';
import { buildRoleChangeEmail, buildWelcomeEmail } from '../email/templates/welcome';

export async function listAdminUsers() {
  await ensureSystemRoles();
  const rows = await repo.listUsers();
  return rows.map((u) => ({
    id: u.id,
    email: u.email,
    roleId: u.roleId,
    roleName: u.roleName,
    roleSlug: u.roleSlug,
    status: u.status,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));
}

export async function createAdminUser(
  input: unknown,
  actorId: string,
  opts?: { loginOrigin?: string },
) {
  const parsed = userCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  await ensureSystemRoles();
  if (await repo.isEmailTaken(parsed.data.email)) {
    return { ok: false as const, fields: { email: 'Bu e-posta zaten kayıtlı' } };
  }
  const role = await repo.getRoleById(parsed.data.roleId);
  if (!role) return { ok: false as const, fields: { roleId: 'Rol bulunamadı' } };

  const user = await repo.insertUser({
    id: newId('user'),
    email: parsed.data.email,
    passwordHash: await hashPassword(parsed.data.password),
    roleId: parsed.data.roleId,
    mustChangePassword: true,
    status: 'pending',
  });
  void actorId;
  const full = await repo.getUserById(user.id);
  const loginOrigin = (opts?.loginOrigin ?? '').replace(/\/$/, '');
  const loginUrl = loginOrigin ? `${loginOrigin}/admin/login` : '/admin/login';
  const mail = buildWelcomeEmail({
    email: user.email,
    password: parsed.data.password,
    roleName: full?.roleName ?? role.name,
    permissions: role.permissions,
    loginUrl,
  });
  const emailResult = await sendEmail({
    to: user.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });

  return {
    ok: true as const,
    data: {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: full?.roleName ?? role.name,
      roleSlug: full?.roleSlug ?? role.slug,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      emailSent: emailResult.ok,
      emailError: emailResult.ok ? undefined : emailResult.error,
    },
  };
}

export async function updateAdminUser(
  id: string,
  input: unknown,
  actorId: string,
  opts?: { loginOrigin?: string },
) {
  const parsed = userUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  const existing = await repo.getUserById(id);
  if (!existing) return { ok: false as const, notFound: true as const };

  if (parsed.data.email && (await repo.isEmailTaken(parsed.data.email, id))) {
    return { ok: false as const, fields: { email: 'Bu e-posta zaten kayıtlı' } };
  }

  const roleChanging =
    parsed.data.roleId !== undefined && parsed.data.roleId !== existing.roleId;

  if (parsed.data.roleId) {
    const role = await repo.getRoleById(parsed.data.roleId);
    if (!role) return { ok: false as const, fields: { roleId: 'Rol bulunamadı' } };

    const losingManage =
      existing.roleId !== parsed.data.roleId &&
      (await roleHasPermission(existing.roleId, 'users.manage')) &&
      !(await roleHasPermission(parsed.data.roleId, 'users.manage'));
    if (losingManage) {
      const count = await countUsersWithPermission('users.manage');
      if (count <= 1) {
        return {
          ok: false as const,
          fields: { roleId: 'Son kullanıcı yöneticisi rolü değiştirilemez' },
        };
      }
    }
    if (id === actorId && losingManage) {
      return {
        ok: false as const,
        fields: { roleId: 'Kendi kullanıcı yönetimi yetkinizi kaldıramazsınız' },
      };
    }
  }

  const user = await repo.updateUser(id, {
    email: parsed.data.email,
    roleId: parsed.data.roleId,
    passwordHash: parsed.data.password
      ? await hashPassword(parsed.data.password)
      : undefined,
    mustChangePassword: parsed.data.password ? true : undefined,
  });
  if (!user) return { ok: false as const, notFound: true as const };
  const full = await repo.getUserById(user.id);

  let emailSent: boolean | undefined;
  let emailError: string | undefined;
  if (roleChanging && full) {
    const newRole = await repo.getRoleById(full.roleId);
    const loginOrigin = (opts?.loginOrigin ?? '').replace(/\/$/, '');
    const loginUrl = loginOrigin ? `${loginOrigin}/admin/login` : '/admin/login';
    const mail = buildRoleChangeEmail({
      email: full.email,
      roleName: full.roleName,
      permissions: newRole?.permissions ?? [],
      loginUrl,
    });
    const emailResult = await sendEmail({
      to: full.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    emailSent = emailResult.ok;
    emailError = emailResult.ok ? undefined : emailResult.error;
  }

  return {
    ok: true as const,
    data: {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: full?.roleName ?? '',
      roleSlug: full?.roleSlug ?? '',
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      emailSent,
      emailError,
    },
  };
}

export async function removeAdminUser(id: string, actorId: string) {
  if (id === actorId) {
    return { ok: false as const, fields: { _form: 'Kendinizi silemezsiniz' } };
  }
  const existing = await repo.getUserById(id);
  if (!existing) return { ok: false as const, notFound: true as const };

  if (await roleHasPermission(existing.roleId, 'users.manage')) {
    const count = await countUsersWithPermission('users.manage');
    if (count <= 1) {
      return { ok: false as const, fields: { _form: 'Son kullanıcı yöneticisi silinemez' } };
    }
  }

  await repo.deleteUser(id);
  return { ok: true as const, data: { id } };
}

async function roleHasPermission(roleId: string, permission: Permission): Promise<boolean> {
  const role = await repo.getRoleById(roleId);
  return Boolean(role?.permissions.includes(permission));
}

export async function listAdminRoles() {
  await ensureSystemRoles();
  return repo.listRoles();
}

export async function createAdminRole(input: unknown) {
  const parsed = roleCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  await ensureSystemRoles();
  const slug = parsed.data.slug?.trim() || slugify(parsed.data.name);
  if (!slug) return { ok: false as const, fields: { name: 'Geçerli bir isim gerekli' } };
  if (await repo.getRoleBySlug(slug)) {
    return { ok: false as const, fields: { slug: 'Bu slug zaten kullanılıyor' } };
  }
  // Reserve system slugs
  if ((Object.values(SYSTEM_ROLE_SLUGS) as string[]).includes(slug)) {
    return { ok: false as const, fields: { slug: 'Sistem rol slug’ı kullanılamaz' } };
  }

  const permissions = parsed.data.permissions.filter((p) =>
    (ALL_PERMISSIONS as string[]).includes(p),
  );
  const role = await repo.insertRole({
    id: newId('role'),
    name: parsed.data.name,
    slug,
    description: parsed.data.description ?? '',
    isSystem: false,
    permissions,
  });
  return { ok: true as const, data: role };
}

export async function updateAdminRole(id: string, input: unknown) {
  const parsed = roleUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, fields: zodFieldErrors(parsed.error) };
  const existing = await repo.getRoleById(id);
  if (!existing) return { ok: false as const, notFound: true as const };

  if (existing.isSystem && existing.slug === SYSTEM_ROLE_SLUGS.admin) {
    if (parsed.data.permissions !== undefined) {
      return {
        ok: false as const,
        fields: { permissions: 'Admin rolünün yetkileri değiştirilemez' },
      };
    }
  }

  // Non-admin system roles: allow permission/name edits except slug
  if (existing.isSystem && existing.id === SYSTEM_ROLE_IDS.admin && parsed.data.name) {
    // allow renaming display? plan says permission set locked - name can stay editable lightly
  }

  const permissions = parsed.data.permissions?.filter((p) =>
    (ALL_PERMISSIONS as string[]).includes(p),
  );

  const role = await repo.updateRole(id, {
    name: parsed.data.name,
    description: parsed.data.description,
    permissions:
      existing.isSystem && existing.slug === SYSTEM_ROLE_SLUGS.admin
        ? undefined
        : permissions,
  });
  return { ok: true as const, data: role };
}

export async function removeAdminRole(id: string) {
  const existing = await repo.getRoleById(id);
  if (!existing) return { ok: false as const, notFound: true as const };
  if (existing.isSystem) {
    return { ok: false as const, fields: { _form: 'Sistem rolleri silinemez' } };
  }
  const userCount = await countUsersWithRole(id);
  if (userCount > 0) {
    return {
      ok: false as const,
      fields: { _form: 'Bu role atanmış kullanıcılar var; önce rolü değiştirin' },
    };
  }
  await repo.deleteRole(id);
  return { ok: true as const, data: { id } };
}

export function listPermissionCatalog() {
  return ALL_PERMISSIONS.map((key) => ({
    key,
    label: PERMISSION_LABELS[key],
  }));
}
