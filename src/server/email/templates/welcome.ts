import { PERMISSION_LABELS, type Permission } from '../../../lib/auth/permissions';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function permissionLabels(permissions: string[]): string[] {
  return permissions.map((p) => PERMISSION_LABELS[p as Permission] ?? p);
}

export function buildWelcomeEmail(input: {
  email: string;
  password: string;
  roleName: string;
  permissions: string[];
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const perms = permissionLabels(input.permissions);
  const permListText = perms.map((l) => `• ${l}`).join('\n');
  const permListHtml = perms.map((l) => `<li>${escapeHtml(l)}</li>`).join('');

  const subject = 'Katalog CMS — hesabınız oluşturuldu';
  const text = [
    'Hoş geldiniz.',
    '',
    `Sistemde size «${input.roleName}» rolü atandı. Artık şu erişimlere sahipsiniz:`,
    permListText || '• (yetki yok)',
    '',
    'Giriş bilgileriniz:',
    `E-posta: ${input.email}`,
    `Geçici parola: ${input.password}`,
    '',
    `Giriş: ${input.loginUrl}`,
    '',
    'İlk girişinizde geçici parolayı değiştirmeniz zorunludur; değiştirmeden panele erişemezsiniz.',
  ].join('\n');

  const html = `
<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px">
  <p>Hoş geldiniz.</p>
  <p>Sistemde size <strong>${escapeHtml(input.roleName)}</strong> rolü atandı. Artık şu erişimlere sahipsiniz:</p>
  <ul>${permListHtml || '<li>(yetki yok)</li>'}</ul>
  <p>Giriş bilgileriniz:</p>
  <p>
    E-posta: <code>${escapeHtml(input.email)}</code><br/>
    Geçici parola: <code>${escapeHtml(input.password)}</code>
  </p>
  <p><a href="${escapeHtml(input.loginUrl)}">Admin paneline giriş yapın</a></p>
  <p style="color:#555;font-size:14px">İlk girişinizde geçici parolayı değiştirmeniz zorunludur; değiştirmeden panele erişemezsiniz.</p>
</div>`.trim();

  return { subject, html, text };
}

export function buildRoleChangeEmail(input: {
  email: string;
  roleName: string;
  permissions: string[];
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const perms = permissionLabels(input.permissions);
  const permListText = perms.map((l) => `• ${l}`).join('\n');
  const permListHtml = perms.map((l) => `<li>${escapeHtml(l)}</li>`).join('');

  const subject = 'Katalog CMS — rolünüz güncellendi';
  const text = [
    'Hesap rolünüz güncellendi.',
    '',
    `Yeni rolünüz: ${input.roleName}`,
    'Artık şu erişimlere sahipsiniz:',
    permListText || '• (yetki yok)',
    '',
    `Giriş: ${input.loginUrl}`,
    `Hesap: ${input.email}`,
  ].join('\n');

  const html = `
<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px">
  <p>Hesap rolünüz güncellendi.</p>
  <p>Yeni rolünüz: <strong>${escapeHtml(input.roleName)}</strong></p>
  <p>Artık şu erişimlere sahipsiniz:</p>
  <ul>${permListHtml || '<li>(yetki yok)</li>'}</ul>
  <p>Hesap: <code>${escapeHtml(input.email)}</code></p>
  <p><a href="${escapeHtml(input.loginUrl)}">Admin paneline git</a></p>
</div>`.trim();

  return { subject, html, text };
}
