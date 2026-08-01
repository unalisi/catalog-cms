import * as React from 'react';
import type { ImportJobSummary } from '../../lib/import/types';

type Props = {
  jobId: string;
  initialSummary: ImportJobSummary;
  status?: string;
  pollIntervalMs?: number;
  onSummaryChange?: (summary: ImportJobSummary, status: string) => void;
};

/**
 * Two-phase import progress: product core (fast) + media (background).
 */
export function ImportJobProgress({
  jobId,
  initialSummary,
  status = 'processing',
  pollIntervalMs = 2000,
  onSummaryChange,
}: Props) {
  const [summary, setSummary] = React.useState(initialSummary);
  const [jobStatus, setJobStatus] = React.useState(status);

  React.useEffect(() => {
    setSummary(initialSummary);
  }, [initialSummary]);

  React.useEffect(() => {
    setJobStatus(status);
  }, [status]);

  React.useEffect(() => {
    const terminal =
      jobStatus === 'paused' ||
      jobStatus === 'cancelled' ||
      jobStatus === 'failed' ||
      jobStatus === 'completed' ||
      (Boolean(summary.mediaCompletedAt) &&
        (Boolean(summary.coreCompletedAt) ||
          (summary.core?.done ?? 0) + (summary.core?.failed ?? 0) >= summary.total));
    if (terminal) return;

    const interval = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/import/jobs/${jobId}`);
        const json = (await res.json()) as {
          ok?: boolean;
          data?: { job?: { summary?: ImportJobSummary; status?: string } };
        };
        if (!json.ok || !json.data?.job?.summary) return;
        setSummary(json.data.job.summary);
        if (json.data.job.status) setJobStatus(json.data.job.status);
        onSummaryChange?.(json.data.job.summary, json.data.job.status ?? jobStatus);
      } catch {
        // next tick
      }
    }, pollIntervalMs);

    return () => window.clearInterval(interval);
  }, [
    jobId,
    pollIntervalMs,
    summary.mediaCompletedAt,
    summary.coreCompletedAt,
    onSummaryChange,
    jobStatus,
  ]);

  const coreTotal = summary.total;
  const coreDone = (summary.core?.done ?? 0) + (summary.core?.failed ?? 0);
  const corePct = coreTotal > 0 ? Math.round((coreDone / coreTotal) * 100) : 0;

  const mediaPending = summary.media?.pending ?? 0;
  const mediaDoneCount = summary.media?.done ?? 0;
  const mediaFailed = summary.media?.failed ?? 0;
  const mediaTotal = mediaPending + mediaDoneCount + mediaFailed;
  const mediaDone = mediaDoneCount + mediaFailed;
  const mediaPct = mediaTotal > 0 ? Math.round((mediaDone / mediaTotal) * 100) : 100;

  return (
    <div className="space-y-4 rounded-lg border border-border bg-background p-5">
      <ProgressRow
        done={corePct === 100}
        label="Ürün verileri"
        detail={`${coreDone}/${coreTotal} ürün · ${jobStatus}`}
        percent={corePct}
      />
      <ProgressRow
        done={mediaPct === 100}
        label="Görseller (arka planda)"
        detail={
          mediaTotal === 0
            ? 'Görsel yok'
            : `${mediaDone}/${mediaTotal} görsel${mediaFailed > 0 ? ` — ${mediaFailed} başarısız` : ''}`
        }
        percent={mediaPct}
      />

      {jobStatus === 'processing' && corePct === 100 && mediaPct < 100 && (
        <p className="text-xs text-muted-foreground">
          Ürünler draft olarak yazıldı; görseller arka planda indiriliyor. Her ürünün görselleri
          bitince otomatik yayınlanır.
        </p>
      )}
      {jobStatus === 'processing' && corePct < 100 && (
        <p className="text-xs text-muted-foreground">
          Ürün kayıtları draft olarak veritabanına yazılıyor…
        </p>
      )}
      {jobStatus === 'paused' && (
        <p className="text-xs text-muted-foreground">
          Import duraklatıldı. Devam Et ile kalan ürünler ve görseller işlenmeye devam eder.
        </p>
      )}
      {jobStatus === 'cancelled' && (
        <p className="text-xs text-muted-foreground">
          Import iptal edildi. Bu işte oluşturulan ürünler silindi.
        </p>
      )}
    </div>
  );
}

function ProgressRow({
  done,
  label,
  detail,
  percent,
}: {
  done: boolean;
  label: string;
  detail: string;
  percent: number;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
              done
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground'
            }`}
            aria-hidden
          >
            {done ? '✓' : '…'}
          </span>
          {label}
        </div>
        <span className="text-xs text-muted-foreground">{detail}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full bg-primary transition-all duration-500 ${done ? '' : 'animate-pulse'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
