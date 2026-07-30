import { cn } from '@/lib/utils';

export type ContentStatus = 'published' | 'draft' | 'archived' | 'live' | 'hidden';

function normalize(status: ContentStatus): 'live' | 'draft' | 'hidden' {
  if (status === 'published' || status === 'live') return 'live';
  if (status === 'draft') return 'draft';
  return 'hidden';
}

const LABELS = {
  live: 'Yayında',
  draft: 'Taslak',
  hidden: 'Listedışı',
} as const;

type Props = {
  status: ContentStatus;
  label?: string;
  className?: string;
};

export function StatusDot({ status, label, className }: Props) {
  const kind = normalize(status);
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn(
          'size-1.5 shrink-0 rounded-full',
          kind === 'live' && 'bg-success shadow-[0_0_0_3px_color-mix(in_oklch,var(--success)_14%,transparent)]',
          kind === 'draft' && 'bg-warning',
          kind === 'hidden' && 'bg-faint',
        )}
        aria-hidden="true"
      />
      <span className="text-xs text-muted-foreground">{label ?? LABELS[kind]}</span>
    </span>
  );
}
