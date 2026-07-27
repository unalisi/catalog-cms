import SeoPreview from './SeoPreview';

export type SeoFormValue = {
  title: string;
  description: string;
  canonical: string;
  ogImageUrl: string;
  noindex: boolean;
  robotsExtra: string;
};

type Props = {
  value: SeoFormValue;
  onChange: (value: SeoFormValue) => void;
  fallbackTitle?: string;
  fallbackDescription?: string;
  pathPreview?: string;
  siteName?: string;
};

export const emptySeoForm = (): SeoFormValue => ({
  title: '',
  description: '',
  canonical: '',
  ogImageUrl: '',
  noindex: false,
  robotsExtra: '',
});

export function seoFormFromMeta(
  seo?: {
    title?: string | null;
    description?: string | null;
    canonical?: string | null;
    ogImageUrl?: string | null;
    noindex?: boolean | null;
    robotsExtra?: string | null;
  } | null,
): SeoFormValue {
  return {
    title: seo?.title ?? '',
    description: seo?.description ?? '',
    canonical: seo?.canonical ?? '',
    ogImageUrl: seo?.ogImageUrl ?? '',
    noindex: Boolean(seo?.noindex),
    robotsExtra: seo?.robotsExtra ?? '',
  };
}

export default function SeoFields({
  value,
  onChange,
  fallbackTitle = '',
  fallbackDescription = '',
  pathPreview = '/',
  siteName = 'Catalog CMS',
}: Props) {
  function patch(partial: Partial<SeoFormValue>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">SEO title</span>
            <input
              className="rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              value={value.title}
              maxLength={70}
              placeholder={fallbackTitle}
              onChange={(e) => patch({ title: e.target.value })}
            />
            <span className="text-xs text-muted-foreground">{value.title.length}/70</span>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Meta description</span>
            <textarea
              className="min-h-24 rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              value={value.description}
              maxLength={160}
              placeholder={fallbackDescription}
              onChange={(e) => patch({ description: e.target.value })}
            />
            <span className="text-xs text-muted-foreground">{value.description.length}/160</span>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Canonical</span>
            <input
              className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={value.canonical}
              placeholder={`https://…${pathPreview}`}
              onChange={(e) => patch({ canonical: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">OG image URL</span>
            <input
              className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={value.ogImageUrl}
              placeholder="/favicon.svg"
              onChange={(e) => patch({ ogImageUrl: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">robots extra</span>
            <input
              className="rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={value.robotsExtra}
              placeholder="max-image-preview:large"
              onChange={(e) => patch({ robotsExtra: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.noindex}
              onChange={(e) => patch({ noindex: e.target.checked })}
            />
            <span>noindex (sitemap dışı + robots)</span>
          </label>
        </div>
        <SeoPreview
          title={value.title || fallbackTitle || siteName}
          description={value.description || fallbackDescription}
          path={pathPreview}
          siteName={siteName}
          ogImageUrl={value.ogImageUrl || undefined}
        />
      </div>
    </div>
  );
}
