type Props = {
  title: string;
  description: string;
  path: string;
  siteName: string;
  ogImageUrl?: string;
};

export default function SeoPreview({ title, description, path, siteName, ogImageUrl }: Props) {
  const displayTitle = title.slice(0, 70);
  const displayDesc = description.slice(0, 160) || 'Meta description henüz girilmedi.';
  const url = `https://ornek.site${path.startsWith('/') ? path : `/${path}`}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-border bg-muted/20 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          SERP önizleme
        </p>
        <p className="truncate text-sm text-muted-foreground">{url}</p>
        <p className="mt-1 text-lg font-medium text-[#1a0dab]" style={{ color: 'oklch(0.45 0.12 250)' }}>
          {displayTitle || siteName}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{displayDesc}</p>
      </div>
      <div className="overflow-hidden rounded-md border border-border">
        <p className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Open Graph
        </p>
        <div className="aspect-[1.91/1] bg-muted">
          {ogImageUrl ? (
            <img src={ogImageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              OG görsel yok
            </div>
          )}
        </div>
        <div className="space-y-1 p-3">
          <p className="text-xs uppercase text-muted-foreground">{siteName}</p>
          <p className="font-display text-base font-semibold">{displayTitle || siteName}</p>
          <p className="line-clamp-2 text-sm text-muted-foreground">{displayDesc}</p>
        </div>
      </div>
    </div>
  );
}
