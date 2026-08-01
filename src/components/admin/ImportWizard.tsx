import { useEffect, useMemo, useState } from 'react';
import type { ApiResult } from '../../lib/api';
import type { ImportJobSummary } from '../../lib/import/types';
import { ExportPanel } from './ExportPanel';
import { ImportJobProgress } from './ImportJobProgress';

type Source = 'csv' | 'woo' | 'wxr';
type ConflictPolicy = 'skip' | 'overwrite' | 'merge';

type Mapping = {
  name: string;
  slug: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  description: string;
  brand: string;
  categories: string;
  imageUrl: string;
  status: string;
};

type JobSummary = ImportJobSummary;

type JobRow = {
  id: string;
  source: Source;
  status: string;
  conflictPolicy: ConflictPolicy;
  summaryJson: string | null;
  createdAt: string;
  updatedAt: string;
};

type JobDetail = JobRow & {
  summary: JobSummary;
  progress?: { total: number; processed: number; pending: number; error: number };
  items: {
    id: string;
    rowIndex: number;
    action: string | null;
    status: string;
    error: string | null;
    mappedJson: string | null;
    rawJson?: string | null;
  }[];
};

const DEFAULT_MAPPING: Mapping = {
  name: 'name',
  slug: 'slug',
  sku: 'sku',
  price: 'price',
  compareAtPrice: 'compare_at_price',
  stock: 'stock',
  description: 'description',
  brand: 'brand',
  categories: 'categories',
  imageUrl: 'images',
  status: 'status',
};

const SAMPLE_CSV = `sku,name,slug,price,compare_at_price,currency,stock,description,status,brand,categories,images
IMP-ANC-01,Demo Kulaklık,demo-kulaklik,1299.90,,TRY,25,"Import demo ürünü",published,Nord Teknik,Elektronik|Aksesuar,
IMP-MSE-01,Demo Mouse,demo-mouse,899.00,,TRY,40,Ergonomik mouse,draft,Nord Teknik,Elektronik,
`;

const PROFILES_KEY = 'catalog-import-mapping-profiles';

function itemName(mappedJson: string | null, rawJson?: string | null): string {
  for (const raw of [mappedJson, rawJson]) {
    if (!raw) continue;
    try {
      const name = (JSON.parse(raw) as { name?: string }).name;
      if (name) return name;
    } catch {
      // try next
    }
  }
  return '—';
}

async function readApiJson<T>(res: Response): Promise<ApiResult<T>> {
  const text = await res.text();
  try {
    return JSON.parse(text) as ApiResult<T>;
  } catch {
    return {
      ok: false,
      error: {
        code: 'server_error',
        message: res.ok
          ? 'Sunucu geçersiz yanıt döndü'
          : `Sunucu hatası (${res.status}). ${text.slice(0, 120)}`,
      },
    };
  }
}

function loadProfiles(): Record<string, Mapping> {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, Mapping>;
  } catch {
    return {};
  }
}

function dryRunActionable(summary: JobSummary | undefined): boolean {
  if (!summary) return false;
  return (summary.create ?? 0) + (summary.update ?? 0) > 0;
}

export default function ImportWizard() {
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<Source>('csv');
  const [content, setContent] = useState(SAMPLE_CSV);
  const [mapping, setMapping] = useState<Mapping>(DEFAULT_MAPPING);
  const [conflictPolicy, setConflictPolicy] = useState<ConflictPolicy>('skip');
  const [profileName, setProfileName] = useState('');
  const [profiles, setProfiles] = useState<Record<string, Mapping>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [jobs, setJobs] = useState<JobRow[]>([]);

  useEffect(() => {
    setProfiles(loadProfiles());
    void refreshJobs();
  }, []);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/admin/import/jobs/${jobId}`);
        const json = await readApiJson<{ job: JobDetail }>(res);
        if (cancelled || !json.ok) return;
        setJob(json.data.job);
        if (json.data.job.status === 'failed') {
          const msg = json.data.job.summary?.message;
          setError(msg || 'Dry-run başarısız');
        }
        if (
          json.data.job.status === 'ready' ||
          json.data.job.status === 'failed' ||
          json.data.job.status === 'completed'
        ) {
          void refreshJobs();
        }
      } catch {
        // transient network — next poll retries
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 1500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [jobId]);

  const summary = useMemo(() => job?.summary, [job]);
  const isPreparing =
    busy ||
    job?.status === 'validating' ||
    job?.status === 'pending' ||
    (Boolean(jobId) && !job);
  const dryRunReady = job?.status === 'ready';

  async function refreshJobs() {
    try {
      const res = await fetch('/api/admin/import/jobs');
      const json = await readApiJson<{ jobs: JobRow[] }>(res);
      if (json.ok) setJobs(json.data.jobs);
    } catch {
      // ignore list refresh errors
    }
  }

  async function onFile(file: File | null) {
    if (!file) return;
    const text = await file.text();
    setContent(text);
  }

  function saveProfile() {
    const name = profileName.trim();
    if (!name) return;
    const next = { ...profiles, [name]: mapping };
    localStorage.setItem(PROFILES_KEY, JSON.stringify(next));
    setProfiles(next);
  }

  async function runDryRun() {
    setBusy(true);
    setError(null);
    setJob(null);
    setStep(3);
    try {
      const payload = {
        source,
        content,
        conflictPolicy,
        mapping: source === 'csv' ? mapping : undefined,
      };
      const res = await fetch('/api/admin/import/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await readApiJson<{ job: JobRow; summary: JobSummary }>(res);
      if (!json.ok) {
        setError(json.error.message ?? 'Dry-run başlatılamadı');
        return;
      }
      setJobId(json.data.job.id);
      await refreshJobs();
    } catch {
      setError('Dry-run isteği gönderilemedi (ağ veya sunucu hatası)');
    } finally {
      setBusy(false);
    }
  }

  async function continueFromSource() {
    if (source === 'csv') {
      setStep(2);
      return;
    }
    await runDryRun();
  }

  async function runApply() {
    if (!jobId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/import/jobs/${jobId}/apply`, { method: 'POST' });
      const json = await readApiJson<{ job: JobRow }>(res);
      if (!json.ok) {
        setError(json.error.message ?? 'Apply başarısız');
        if (job?.status === 'queued' || job?.status === 'processing') setStep(4);
        return;
      }
      setStep(4);
      setJob((prev) =>
        prev && json.data.job
          ? { ...prev, ...json.data.job, summary: prev.summary, items: prev.items }
          : prev,
      );
      await refreshJobs();
    } catch {
      setError('Apply isteği gönderilemedi');
    } finally {
      setBusy(false);
    }
  }

  async function runPause() {
    if (!jobId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/import/jobs/${jobId}/pause`, { method: 'POST' });
      const json = await readApiJson<{ job: JobRow }>(res);
      if (!json.ok) {
        setError(json.error.message ?? 'Durdurulamadı');
        return;
      }
      setJob((prev) =>
        prev && json.data.job
          ? { ...prev, ...json.data.job, summary: prev.summary, items: prev.items }
          : prev,
      );
      await refreshJobs();
    } catch {
      setError('Durdurma isteği gönderilemedi');
    } finally {
      setBusy(false);
    }
  }

  async function runResume() {
    if (!jobId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/import/jobs/${jobId}/resume`, { method: 'POST' });
      const json = await readApiJson<{ job: JobRow }>(res);
      if (!json.ok) {
        setError(json.error.message ?? 'Devam ettirilemedi');
        return;
      }
      setJob((prev) =>
        prev && json.data.job
          ? { ...prev, ...json.data.job, summary: prev.summary, items: prev.items }
          : prev,
      );
      await refreshJobs();
    } catch {
      setError('Devam ettirme isteği gönderilemedi');
    } finally {
      setBusy(false);
    }
  }

  async function runCancel() {
    if (!jobId) return;
    const confirmed = window.confirm(
      'Import iptal edilsin mi? Bu işte yeni oluşturulan ürünler silinecek. Mevcut ürünlere yapılan güncellemeler kalır.',
    );
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/import/jobs/${jobId}/cancel`, { method: 'POST' });
      const json = await readApiJson<{ job: JobRow; deleted?: number }>(res);
      if (!json.ok) {
        setError(json.error.message ?? 'İptal edilemedi');
        return;
      }
      setJob((prev) =>
        prev && json.data.job
          ? {
              ...prev,
              ...json.data.job,
              summary: prev.summary,
              items: prev.items,
            }
          : prev,
      );
      // Refresh full job for updated summary message
      const detailRes = await fetch(`/api/admin/import/jobs/${jobId}`);
      const detail = await readApiJson<{ job: JobDetail }>(detailRes);
      if (detail.ok) setJob(detail.data.job);
      await refreshJobs();
    } catch {
      setError('İptal isteği gönderilemedi');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <ExportPanel />

      <ol className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg border border-border p-3 text-sm sm:flex sm:flex-wrap sm:gap-3 sm:border-0 sm:p-0">
        {['1. Kaynak', '2. Eşleme', '3. Dry-run', '4. Apply'].map((label, i) => (
          <li
            key={label}
            className={
              step === i + 1 ? 'font-semibold text-foreground' : 'text-muted-foreground'
            }
          >
            {label}
          </li>
        ))}
      </ol>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {step === 1 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-semibold">Kaynak seç</h2>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['csv', 'CSV'],
                ['woo', 'WooCommerce JSON'],
                ['wxr', 'WXR (WordPress)'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`min-h-11 rounded-md border px-3 py-2 text-sm ${
                  source === value ? 'border-foreground bg-muted' : 'border-border hover:bg-muted'
                }`}
                onClick={() => {
                  setSource(value);
                  if (value === 'csv' && !content.trim()) setContent(SAMPLE_CSV);
                  if (value !== 'csv' && content === SAMPLE_CSV) setContent('');
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Dosya yükle</span>
            <input
              type="file"
              accept={
                source === 'csv'
                  ? '.csv,text/csv'
                  : source === 'wxr'
                    ? '.xml,text/xml'
                    : '.json,application/json'
              }
              onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">İçerik (yapıştır)</span>
            <textarea
              className="min-h-48 rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                source === 'woo'
                  ? 'WooCommerce products JSON dizisini yapıştırın…'
                  : undefined
              }
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Çakışma politikası</span>
            <select
              className="min-h-11 rounded-md border border-input bg-background px-3 py-2"
              value={conflictPolicy}
              onChange={(e) => setConflictPolicy(e.target.value as ConflictPolicy)}
            >
              <option value="skip">skip — mevcut kaydı atla</option>
              <option value="overwrite">overwrite — üzerine yaz</option>
              <option value="merge">merge — boş alanları doldur</option>
            </select>
          </label>
          <button
            type="button"
            className="min-h-11 w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:w-fit"
            onClick={() => void continueFromSource()}
            disabled={!content.trim() || busy}
          >
            {busy
              ? 'Dry-run…'
              : source === 'csv'
                ? 'Devam'
                : 'Dry-run başlat'}
          </button>
        </section>
      )}

      {step === 2 && source === 'csv' && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-semibold">CSV sütun eşleme</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(mapping) as (keyof Mapping)[]).map((key) => (
              <label key={key} className="flex flex-col gap-1 text-sm">
                <span className="font-medium">{key}</span>
                <input
                  className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                  value={mapping[key]}
                  onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm sm:min-w-[12rem] sm:flex-none">
              <span className="font-medium">Profil adı</span>
              <input
                className="min-h-11 rounded-md border border-input bg-background px-3 py-2"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="varsayılan-csv"
              />
            </label>
            <button
              type="button"
              className="min-h-11 rounded-md border border-border px-3 py-2 text-sm"
              onClick={saveProfile}
            >
              Profil kaydet
            </button>
            <select
              className="min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue=""
              onChange={(e) => {
                const p = profiles[e.target.value];
                if (p) setMapping({ ...DEFAULT_MAPPING, ...p });
              }}
            >
              <option value="" disabled>
                Kayıtlı profil yükle
              </option>
              {Object.keys(profiles).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <button
              type="button"
              className="min-h-11 flex-1 rounded-md border border-border px-3 py-2 text-sm sm:flex-none"
              onClick={() => setStep(1)}
            >
              Geri
            </button>
            <button
              type="button"
              className="min-h-11 flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:flex-none"
              disabled={busy}
              onClick={() => void runDryRun()}
            >
              {busy ? 'Çalışıyor…' : 'Dry-run'}
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-semibold">Dry-run raporu</h2>
          <p className="text-sm text-muted-foreground">
            Ürün tablosuna yazılmaz. SKU/slug ile mevcut kayıtlar tarandı.
          </p>
          {isPreparing && job?.status !== 'failed' && (
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
                <span className="font-medium">
                  {busy && !jobId
                    ? 'Dosya yükleniyor…'
                    : 'Dosya kuyrukta ayrıştırılıyor…'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Büyük WooCommerce JSON dosyalarında bu adım birkaç saniye sürebilir. Sayfayı
                kapatmadan bekleyin — durum otomatik güncellenir.
              </p>
              {job?.status && (
                <p className="font-mono text-xs text-muted-foreground">Durum: {job.status}</p>
              )}
            </div>
          )}
          {job?.status === 'failed' && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {summary?.message || 'Dry-run başarısız'}
            </p>
          )}
          {dryRunReady && summary && (
            <ul className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
              <li className="rounded-md border border-border p-3">
                Toplam: <strong>{summary.total}</strong>
              </li>
              <li className="rounded-md border border-border p-3">
                Create: <strong>{summary.create}</strong>
              </li>
              <li className="rounded-md border border-border p-3">
                Update: <strong>{summary.update}</strong>
              </li>
              <li className="rounded-md border border-border p-3">
                Skip: <strong>{summary.skip}</strong>
              </li>
              <li className="rounded-md border border-border p-3">
                Error: <strong>{summary.error}</strong>
              </li>
            </ul>
          )}
          {dryRunReady && job && (
            <>
              <div className="flex flex-col gap-2 md:hidden">
                {job.items.slice(0, 50).map((item) => (
                  <article key={item.id} className="rounded-md border border-border p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {itemName(item.mappedJson, item.rawJson)}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          #{item.rowIndex + 1}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-medium">{item.status}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>Aksiyon: {item.action ?? '—'}</span>
                      {item.error && <span className="text-destructive">{item.error}</span>}
                    </div>
                  </article>
                ))}
              </div>
              <div className="hidden overflow-x-auto rounded-md border border-border md:block">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Ad</th>
                      <th className="px-3 py-2">Aksiyon</th>
                      <th className="px-3 py-2">Durum</th>
                      <th className="px-3 py-2">Hata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.items.slice(0, 50).map((item) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="px-3 py-2 font-mono">{item.rowIndex + 1}</td>
                        <td className="px-3 py-2">{itemName(item.mappedJson, item.rawJson)}</td>
                        <td className="px-3 py-2">{item.action}</td>
                        <td className="px-3 py-2">{item.status}</td>
                        <td className="px-3 py-2 text-destructive">{item.error ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-11 flex-1 rounded-md border border-border px-3 py-2 text-sm sm:flex-none"
              onClick={() => {
                setJobId(null);
                setJob(null);
                setError(null);
                setStep(1);
              }}
            >
              Yeni iş
            </button>
            {jobId &&
              (dryRunReady ||
                job?.status === 'queued' ||
                job?.status === 'processing') && (
              <button
                type="button"
                className="min-h-11 flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:flex-none"
                disabled={
                  busy ||
                  (!dryRunActionable(summary) &&
                    job?.status !== 'queued' &&
                    job?.status !== 'processing')
                }
                onClick={() => void runApply()}
              >
                {busy
                  ? 'Kuyruğa alınıyor…'
                  : job?.status === 'queued' || job?.status === 'processing'
                    ? 'Apply’e devam et'
                    : 'Apply (Queue)'}
              </button>
            )}
            {jobId && (job?.status === 'queued' || job?.status === 'processing') && (
              <button
                type="button"
                className="min-h-11 flex-1 rounded-md border border-border px-3 py-2 text-sm sm:flex-none"
                disabled={busy}
                onClick={() => {
                  setStep(4);
                  setError(null);
                }}
              >
                İlerlemeyi göster
              </button>
            )}
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-semibold">Apply durumu</h2>
          {jobId && summary && (
            <ImportJobProgress
              jobId={jobId}
              initialSummary={summary}
              status={job?.status ?? 'processing'}
              onSummaryChange={(next, nextStatus) => {
                setJob((prev) =>
                  prev
                    ? { ...prev, summary: next, status: nextStatus }
                    : prev,
                );
              }}
            />
          )}
          {(job?.status === 'queued' ||
            job?.status === 'processing' ||
            job?.status === 'paused') && (
            <div className="flex flex-wrap gap-2">
              {(job.status === 'queued' || job.status === 'processing') && (
                <button
                  type="button"
                  className="min-h-11 rounded-md border border-border px-4 py-2 text-sm font-medium disabled:opacity-60"
                  disabled={busy}
                  onClick={() => void runPause()}
                >
                  Durdur
                </button>
              )}
              {job.status === 'paused' && (
                <button
                  type="button"
                  className="min-h-11 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                  disabled={busy}
                  onClick={() => void runResume()}
                >
                  Devam Et
                </button>
              )}
              <button
                type="button"
                className="min-h-11 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive disabled:opacity-60"
                disabled={busy}
                onClick={() => void runCancel()}
              >
                İptal Et
              </button>
            </div>
          )}
          {summary?.message && (
            <p className="text-sm text-muted-foreground">{summary.message}</p>
          )}
          {summary && (
            <ul className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
              <li className="rounded-md border border-border p-3">
                Toplam: <strong>{summary.total}</strong>
              </li>
              <li className="rounded-md border border-border p-3">
                Create: <strong>{summary.create ?? 0}</strong>
              </li>
              <li className="rounded-md border border-border p-3">
                Update: <strong>{summary.update ?? 0}</strong>
              </li>
              <li className="rounded-md border border-border p-3">
                Skip: <strong>{summary.skip ?? 0}</strong>
              </li>
              <li className="rounded-md border border-border p-3">
                Error: <strong>{summary.error ?? summary.core?.failed ?? 0}</strong>
              </li>
            </ul>
          )}
          <button
            type="button"
            className="min-h-11 w-full rounded-md border border-border px-3 py-2 text-sm sm:w-fit"
            onClick={() => {
              setJobId(null);
              setJob(null);
              setStep(1);
            }}
          >
            Yeni import
          </button>
        </section>
      )}

      <section className="border-t border-border pt-6">
        <h2 className="mb-3 font-display text-lg font-semibold">Son işler</h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz iş yok.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {jobs.slice(0, 10).map((j) => (
              <li
                key={j.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2.5 sm:gap-3"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {j.id.slice(0, 18)}…
                </span>
                <span>{j.source}</span>
                <span>{j.status}</span>
                <span className="w-full text-xs text-muted-foreground sm:w-auto sm:text-sm">
                  {new Date(j.createdAt).toLocaleString('tr-TR')}
                </span>
                <button
                  type="button"
                  className="min-h-11 px-1 text-sm hover:underline"
                  onClick={() => {
                    setError(null);
                    setJobId(j.id);
                    setStep(
                      j.status === 'queued' ||
                        j.status === 'processing' ||
                        j.status === 'completed'
                        ? 4
                        : 3,
                    );
                  }}
                >
                  Aç
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
