import { useEffect, useMemo, useState } from 'react';
import type { ApiResult } from '../../lib/api';

type Source = 'csv' | 'woo' | 'wxr';
type ConflictPolicy = 'skip' | 'overwrite' | 'merge';

type Mapping = {
  name: string;
  slug: string;
  sku: string;
  price: string;
  stock: string;
  description: string;
  brand: string;
  categories: string;
  imageUrl: string;
  status: string;
};

type JobSummary = {
  total: number;
  create: number;
  update: number;
  skip: number;
  error: number;
};

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
  items: {
    id: string;
    rowIndex: number;
    action: string | null;
    status: string;
    error: string | null;
    mappedJson: string | null;
  }[];
};

const DEFAULT_MAPPING: Mapping = {
  name: 'name',
  slug: 'slug',
  sku: 'sku',
  price: 'price',
  stock: 'stock',
  description: 'description',
  brand: 'brand',
  categories: 'categories',
  imageUrl: 'image',
  status: 'status',
};

const SAMPLE_CSV = `name,slug,sku,price,stock,description,brand,categories,image,status
Demo Kulaklık,demo-kulaklik,IMP-ANC-01,1299.90,25,"Import demo ürünü",Nord Teknik,"Elektronik,Aksesuar",,published
Demo Mouse,demo-mouse,IMP-MSE-01,899.00,40,Ergonomik mouse,Nord Teknik,Elektronik,,draft
`;

const PROFILES_KEY = 'catalog-import-mapping-profiles';

function itemName(mappedJson: string | null): string {
  try {
    return mappedJson ? (JSON.parse(mappedJson) as { name?: string }).name ?? '—' : '—';
  } catch {
    return '—';
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
      const res = await fetch(`/api/admin/import/jobs/${jobId}`);
      const json = (await res.json()) as ApiResult<{ job: JobDetail }>;
      if (!cancelled && json.ok) setJob(json.data.job);
    };
    void tick();
    const id = window.setInterval(() => void tick(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [jobId]);

  const summary = useMemo(() => job?.summary, [job]);

  async function refreshJobs() {
    const res = await fetch('/api/admin/import/jobs');
    const json = (await res.json()) as ApiResult<{ jobs: JobRow[] }>;
    if (json.ok) setJobs(json.data.jobs);
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
    const json = (await res.json()) as ApiResult<{ job: JobRow; summary: JobSummary }>;
    setBusy(false);
    if (!json.ok) {
      setError(json.error.message ?? 'Dry-run başarısız');
      return;
    }
    setJobId(json.data.job.id);
    setStep(3);
    await refreshJobs();
  }

  async function runApply() {
    if (!jobId) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/import/jobs/${jobId}/apply`, { method: 'POST' });
    const json = (await res.json()) as ApiResult<{ job: JobRow }>;
    setBusy(false);
    if (!json.ok) {
      setError(json.error.message ?? 'Apply başarısız');
      return;
    }
    setStep(4);
    await refreshJobs();
  }

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <ol className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg border border-border p-3 text-sm sm:flex sm:flex-wrap sm:gap-3 sm:border-0 sm:p-0">
        {[
          '1. Kaynak',
          '2. Eşleme',
          '3. Dry-run',
          '4. Apply',
        ].map((label, i) => (
          <li
            key={label}
            className={
              step === i + 1
                ? 'font-semibold text-foreground'
                : 'text-muted-foreground'
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
              accept={source === 'csv' ? '.csv,text/csv' : source === 'wxr' ? '.xml,text/xml' : '.json,application/json'}
              onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">İçerik (yapıştır)</span>
            <textarea
              className="min-h-48 rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
              value={content}
              onChange={(e) => setContent(e.target.value)}
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
            className="min-h-11 w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground sm:w-fit"
            onClick={() => setStep(source === 'csv' ? 2 : 3)}
            disabled={!content.trim()}
          >
            Devam
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
                if (p) setMapping(p);
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
          {!job && <p className="text-sm">Rapor yükleniyor…</p>}
          {summary && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5 text-sm">
              <li className="rounded-md border border-border p-3">Toplam: <strong>{summary.total}</strong></li>
              <li className="rounded-md border border-border p-3">Create: <strong>{summary.create}</strong></li>
              <li className="rounded-md border border-border p-3">Update: <strong>{summary.update}</strong></li>
              <li className="rounded-md border border-border p-3">Skip: <strong>{summary.skip}</strong></li>
              <li className="rounded-md border border-border p-3">Error: <strong>{summary.error}</strong></li>
            </ul>
          )}
          {job && (
            <>
              <div className="flex flex-col gap-2 md:hidden">
                {job.items.slice(0, 50).map((item) => (
                  <article
                    key={item.id}
                    className="rounded-md border border-border p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{itemName(item.mappedJson)}</p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          #{item.rowIndex + 1}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-medium">{item.status}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>Aksiyon: {item.action ?? '—'}</span>
                      {item.error && (
                        <span className="text-destructive">{item.error}</span>
                      )}
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
                        <td className="px-3 py-2">{itemName(item.mappedJson)}</td>
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
              onClick={() => setStep(1)}
            >
              Yeni iş
            </button>
            {source === 'csv' && step === 3 && !jobId && (
              <button
                type="button"
                className="min-h-11 flex-1 rounded-md border border-border px-3 py-2 text-sm sm:flex-none"
                onClick={() => void runDryRun()}
              >
                Dry-run
              </button>
            )}
            {source !== 'csv' && !jobId && (
              <button
                type="button"
                className="min-h-11 flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground sm:flex-none"
                disabled={busy}
                onClick={() => void runDryRun()}
              >
                {busy ? 'Çalışıyor…' : 'Dry-run'}
              </button>
            )}
            {jobId && (
              <button
                type="button"
                className="min-h-11 flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:flex-none"
                disabled={busy || !summary || summary.create + summary.update === 0}
                onClick={() => void runApply()}
              >
                {busy ? 'Kuyruğa alınıyor…' : 'Apply (Queue)'}
              </button>
            )}
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-semibold">Apply durumu</h2>
          <p className="text-sm text-muted-foreground">
            İş Queue’ya alındı. Durum: <strong>{job?.status ?? '…'}</strong>
          </p>
          {summary && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5 text-sm">
              <li className="rounded-md border border-border p-3">Toplam: <strong>{summary.total}</strong></li>
              <li className="rounded-md border border-border p-3">Create: <strong>{summary.create}</strong></li>
              <li className="rounded-md border border-border p-3">Update: <strong>{summary.update}</strong></li>
              <li className="rounded-md border border-border p-3">Skip: <strong>{summary.skip}</strong></li>
              <li className="rounded-md border border-border p-3">Error: <strong>{summary.error}</strong></li>
            </ul>
          )}
          <button
            type="button"
            className="min-h-11 w-full rounded-md border border-border px-3 py-2 text-sm sm:w-fit"
            onClick={() => setStep(1)}
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
              <li key={j.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2.5 sm:gap-3">
                <span className="font-mono text-xs text-muted-foreground">{j.id.slice(0, 18)}…</span>
                <span>{j.source}</span>
                <span>{j.status}</span>
                <span className="w-full text-xs text-muted-foreground sm:w-auto sm:text-sm">
                  {new Date(j.createdAt).toLocaleString('tr-TR')}
                </span>
                <button
                  type="button"
                  className="min-h-11 px-1 text-sm hover:underline"
                  onClick={() => {
                    setJobId(j.id);
                    setStep(j.status === 'queued' || j.status === 'processing' || j.status === 'completed' ? 4 : 3);
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
