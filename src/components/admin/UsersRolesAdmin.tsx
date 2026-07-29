import { useCallback, useEffect, useState } from 'react';
import type { ApiResult } from '../../lib/api';
import { Button } from '@/components/ui/button';

type UserStatus = 'pending' | 'active';

type UserRow = {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
  roleSlug: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
};

type RoleRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
};

type PermItem = { key: string; label: string };

type Tab = 'users' | 'roles';

type UsersRolesAdminProps = {
  initialUsers?: UserRow[];
  initialRoles?: RoleRow[];
  initialPermissions?: PermItem[];
};

/** 8-char temp password; excludes ambiguous 0 O I l 1 */
function generateTempPassword(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i]! % chars.length]!;
  }
  return out;
}

function statusLabel(status: UserStatus): string {
  return status === 'active' ? 'Aktif' : 'Onay Bekliyor';
}

function toUserRow(u: {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
  roleSlug: string;
  status?: UserStatus;
  createdAt: string;
  updatedAt: string;
}): UserRow {
  return {
    id: u.id,
    email: u.email,
    roleId: u.roleId,
    roleName: u.roleName,
    roleSlug: u.roleSlug,
    status: u.status ?? 'pending',
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

export default function UsersRolesAdmin({
  initialUsers = [],
  initialRoles = [],
  initialPermissions = [],
}: UsersRolesAdminProps) {
  const hasInitial =
    initialUsers.length > 0 || initialRoles.length > 0 || initialPermissions.length > 0;
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [roles, setRoles] = useState<RoleRow[]>(initialRoles);
  const [permissions, setPermissions] = useState<PermItem[]>(initialPermissions);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!hasInitial);

  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    roleId: initialRoles[0]?.id ?? '',
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    const errors: string[] = [];
    try {
      const [uRes, rRes, pRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/roles'),
        fetch('/api/admin/permissions'),
      ]);

      let uJson: ApiResult<{ users: UserRow[] }> | null = null;
      let rJson: ApiResult<{ roles: RoleRow[] }> | null = null;
      let pJson: ApiResult<{ permissions: PermItem[] }> | null = null;

      try {
        uJson = (await uRes.json()) as ApiResult<{ users: UserRow[] }>;
      } catch {
        errors.push('Kullanıcı listesi okunamadı');
      }
      try {
        rJson = (await rRes.json()) as ApiResult<{ roles: RoleRow[] }>;
      } catch {
        errors.push('Rol listesi okunamadı');
      }
      try {
        pJson = (await pRes.json()) as ApiResult<{ permissions: PermItem[] }>;
      } catch {
        errors.push('Yetki listesi okunamadı');
      }

      if (uJson?.ok) {
        setUsers(uJson.data.users.map(toUserRow));
      } else if (uJson && !uJson.ok) {
        errors.push(uJson.error.message);
      }

      if (rJson?.ok) {
        setRoles(rJson.data.roles);
        setUserForm((f) => (f.roleId ? f : { ...f, roleId: rJson.data.roles[0]?.id ?? '' }));
      } else if (rJson && !rJson.ok) {
        errors.push(rJson.error.message);
      }

      if (pJson?.ok) {
        setPermissions(pJson.data.permissions);
      } else if (pJson && !pJson.ok) {
        errors.push(pJson.error.message);
      }

      if (errors.length > 0) setError(errors.join(' · '));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Liste yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load({ silent: hasInitial });
  }, [load, hasInitial]);

  function resetUserForm() {
    setEditingUserId(null);
    setUserForm({
      email: '',
      password: '',
      roleId: roles[0]?.id ?? '',
    });
  }

  function resetRoleForm() {
    setEditingRoleId(null);
    setRoleForm({ name: '', description: '', permissions: [] });
  }

  function upsertUser(row: UserRow) {
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === row.id);
      if (idx === -1) return [...prev, row].sort((a, b) => a.email.localeCompare(b.email));
      const next = [...prev];
      next[idx] = row;
      return next;
    });
  }

  function upsertRole(row: RoleRow) {
    setRoles((prev) => {
      const idx = prev.findIndex((r) => r.id === row.id);
      if (idx === -1) return [...prev, row].sort((a, b) => a.name.localeCompare(b.name));
      const next = [...prev];
      next[idx] = row;
      return next;
    });
  }

  async function saveUser() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (editingUserId) {
        const body: Record<string, string> = {};
        if (userForm.email) body.email = userForm.email;
        if (userForm.password) body.password = userForm.password;
        if (userForm.roleId) body.roleId = userForm.roleId;
        const res = await fetch(`/api/admin/users/${editingUserId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = (await res.json()) as ApiResult<{
          user: UserRow & { emailSent?: boolean; emailError?: string };
        }>;
        if (!json.ok) {
          setError(json.error.message + (json.error.fields ? `: ${Object.values(json.error.fields).join(', ')}` : ''));
          return;
        }
        upsertUser(toUserRow(json.data.user));
        if (json.data.user.emailSent === false) {
          setNotice(`Kullanıcı güncellendi; e-posta gönderilemedi: ${json.data.user.emailError ?? ''}`);
        }
      } else {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userForm),
        });
        const json = (await res.json()) as ApiResult<{
          user: UserRow & { emailSent?: boolean; emailError?: string };
        }>;
        if (!json.ok) {
          setError(json.error.message + (json.error.fields ? `: ${Object.values(json.error.fields).join(', ')}` : ''));
          return;
        }
        upsertUser(toUserRow(json.data.user));
        if (json.data.user.emailSent) {
          setNotice('Kullanıcı oluşturuldu; hoş geldin e-postası gönderildi.');
        } else {
          setNotice(
            `Kullanıcı oluşturuldu; e-posta gönderilemedi: ${json.data.user.emailError ?? 'yapılandırma eksik'}`,
          );
        }
      }
      resetUserForm();
      await load({ silent: true });
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(id: string) {
    if (!confirm('Bu kullanıcı silinsin mi?')) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const json = (await res.json()) as ApiResult<unknown>;
      if (!json.ok) {
        setError(json.error.message);
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      await load({ silent: true });
    } finally {
      setBusy(false);
    }
  }

  async function saveRole() {
    setBusy(true);
    setError(null);
    try {
      if (editingRoleId) {
        const res = await fetch(`/api/admin/roles/${editingRoleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(roleForm),
        });
        const json = (await res.json()) as ApiResult<{ role: RoleRow }>;
        if (!json.ok) {
          setError(json.error.message + (json.error.fields ? `: ${Object.values(json.error.fields).join(', ')}` : ''));
          return;
        }
        if (json.data.role) upsertRole(json.data.role);
      } else {
        const res = await fetch('/api/admin/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(roleForm),
        });
        const json = (await res.json()) as ApiResult<{ role: RoleRow }>;
        if (!json.ok) {
          setError(json.error.message + (json.error.fields ? `: ${Object.values(json.error.fields).join(', ')}` : ''));
          return;
        }
        if (json.data.role) upsertRole(json.data.role);
      }
      resetRoleForm();
      await load({ silent: true });
    } finally {
      setBusy(false);
    }
  }

  async function deleteRole(id: string) {
    if (!confirm('Bu rol silinsin mi?')) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: 'DELETE' });
      const json = (await res.json()) as ApiResult<unknown>;
      if (!json.ok) {
        setError(json.error.message);
        return;
      }
      setRoles((prev) => prev.filter((r) => r.id !== id));
      await load({ silent: true });
    } finally {
      setBusy(false);
    }
  }

  function togglePerm(key: string) {
    setRoleForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }));
  }

  const editingRole = editingRoleId ? roles.find((r) => r.id === editingRoleId) : null;
  const rolePermsLocked = editingRole?.slug === 'admin';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          className={`border-b-2 px-3 py-2 text-sm font-medium ${
            tab === 'users' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
          }`}
          onClick={() => setTab('users')}
        >
          Kullanıcılar
        </button>
        <button
          type="button"
          className={`border-b-2 px-3 py-2 text-sm font-medium ${
            tab === 'roles' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
          }`}
          onClick={() => setTab('roles')}
        >
          Roller
        </button>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
          {notice}
        </p>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Yükleniyor…
        </p>
      )}

      {tab === 'users' && (
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">E-posta</th>
                  <th className="px-3 py-2 font-medium">Rol</th>
                  <th className="px-3 py-2 font-medium">Durum</th>
                  <th className="px-3 py-2 font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {!loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                      Henüz kullanıcı yok.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2.5 font-medium">{u.email}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{u.roleName}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={
                            u.status === 'active'
                              ? 'text-xs font-medium text-foreground'
                              : 'text-xs font-medium text-muted-foreground'
                          }
                        >
                          {statusLabel(u.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-xs font-medium hover:underline"
                            onClick={() => {
                              setEditingUserId(u.id);
                              setUserForm({ email: u.email, password: '', roleId: u.roleId });
                            }}
                          >
                            Düzenle
                          </button>
                          <button
                            type="button"
                            className="text-xs font-medium text-destructive hover:underline"
                            onClick={() => void deleteUser(u.id)}
                            disabled={busy}
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <form
            className="flex flex-col gap-3 rounded-lg border border-border p-4"
            onSubmit={(e) => {
              e.preventDefault();
              void saveUser();
            }}
          >
            <h2 className="font-display text-base font-semibold">
              {editingUserId ? 'Kullanıcıyı düzenle' : 'Yeni kullanıcı'}
            </h2>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">E-posta</span>
              <input
                className="rounded-md border border-input bg-background px-3 py-2"
                type="email"
                required
                value={userForm.email}
                onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">
                Parola{editingUserId ? ' (boş = değişmez)' : ''}
              </span>
              <div className="flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                  type="text"
                  autoComplete="new-password"
                  minLength={8}
                  required={!editingUserId}
                  value={userForm.password}
                  onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() =>
                    setUserForm((f) => ({ ...f, password: generateTempPassword() }))
                  }
                >
                  Üret
                </Button>
              </div>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Rol</span>
              <select
                className="rounded-md border border-input bg-background px-3 py-2"
                value={userForm.roleId}
                onChange={(e) => setUserForm((f) => ({ ...f, roleId: e.target.value }))}
                required
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={busy} size="sm">
                {editingUserId ? 'Kaydet' : 'Oluştur'}
              </Button>
              {editingUserId && (
                <Button type="button" variant="outline" size="sm" onClick={resetUserForm}>
                  İptal
                </Button>
              )}
            </div>
          </form>
        </div>
      )}

      {tab === 'roles' && (
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="flex flex-col gap-3">
            {!loading && roles.length === 0 ? (
              <p className="rounded-lg border border-border px-3 py-8 text-center text-sm text-muted-foreground">
                Henüz rol yok.
              </p>
            ) : (
              roles.map((r) => (
                <div key={r.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base font-semibold">
                        {r.name}
                        {r.isSystem && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">sistem</span>
                        )}
                      </h3>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">{r.slug}</p>
                      {r.description && (
                        <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {r.permissions.length} yetki
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs font-medium hover:underline"
                        onClick={() => {
                          setEditingRoleId(r.id);
                          setRoleForm({
                            name: r.name,
                            description: r.description ?? '',
                            permissions: [...r.permissions],
                          });
                        }}
                      >
                        Düzenle
                      </button>
                      {!r.isSystem && (
                        <button
                          type="button"
                          className="text-xs font-medium text-destructive hover:underline"
                          onClick={() => void deleteRole(r.id)}
                          disabled={busy}
                        >
                          Sil
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <form
            className="flex flex-col gap-3 rounded-lg border border-border p-4"
            onSubmit={(e) => {
              e.preventDefault();
              void saveRole();
            }}
          >
            <h2 className="font-display text-base font-semibold">
              {editingRoleId ? 'Rolü düzenle' : 'Yeni rol'}
            </h2>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Ad</span>
              <input
                className="rounded-md border border-input bg-background px-3 py-2"
                required
                value={roleForm.name}
                onChange={(e) => setRoleForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Açıklama</span>
              <textarea
                className="min-h-16 rounded-md border border-input bg-background px-3 py-2"
                value={roleForm.description}
                onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <fieldset className="flex flex-col gap-2" disabled={rolePermsLocked}>
              <legend className="text-sm font-medium">Yetkiler</legend>
              {rolePermsLocked && (
                <p className="text-xs text-muted-foreground">Admin rolünün yetkileri kilitlidir.</p>
              )}
              <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
                {permissions.map((p) => (
                  <label key={p.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={roleForm.permissions.includes(p.key)}
                      onChange={() => togglePerm(p.key)}
                      disabled={rolePermsLocked}
                    />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={busy} size="sm">
                {editingRoleId ? 'Kaydet' : 'Oluştur'}
              </Button>
              {editingRoleId && (
                <Button type="button" variant="outline" size="sm" onClick={resetRoleForm}>
                  İptal
                </Button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
