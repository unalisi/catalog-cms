import { useCallback, useEffect, useId, useState } from 'react';

export type ProductGalleryImage = {
  id: string;
  url: string;
  alt: string;
};

type Props = {
  images: ProductGalleryImage[];
  /** vertical thumbs on the left (thumbs-aside layout) */
  thumbsPosition?: 'bottom' | 'left';
  className?: string;
};

export default function ProductImageGallery({
  images,
  thumbsPosition = 'bottom',
  className = '',
}: Props) {
  const labelId = useId();
  const [index, setIndex] = useState(0);
  const count = images.length;
  const current = images[index] ?? images[0];
  const multi = count > 1;

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (!multi) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') go(index - 1);
      if (e.key === 'ArrowRight') go(index + 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index, multi]);

  if (!current) {
    return (
      <div
        className={`flex aspect-square items-center justify-center rounded-md border border-border bg-muted text-sm text-muted-foreground ${className}`}
        data-product-image="empty"
      >
        Görsel yok
      </div>
    );
  }

  const thumbs = (
    <div
      className={
        thumbsPosition === 'left'
          ? 'flex max-h-[min(28rem,70vw)] flex-col gap-2 overflow-y-auto'
          : 'mt-3 flex gap-2 overflow-x-auto'
      }
      role="tablist"
      aria-label="Ürün görselleri"
    >
      {images.map((img, i) => (
        <button
          key={img.id}
          type="button"
          role="tab"
          aria-selected={i === index}
          aria-label={`Görsel ${i + 1}`}
          className={`shrink-0 overflow-hidden rounded-md border-2 transition ${
            i === index ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
          } ${thumbsPosition === 'left' ? 'h-16 w-16' : 'h-16 w-16'}`}
          onClick={() => setIndex(i)}
        >
          <img src={img.url} alt="" className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  );

  const main = (
    <div className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
      <img
        key={current.id}
        src={current.url}
        alt={current.alt}
        className="h-full w-full object-contain"
        data-product-image="main"
      />
      {multi && (
        <>
          <button
            type="button"
            className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-lg shadow-sm hover:bg-background"
            aria-label="Önceki görsel"
            onClick={() => go(index - 1)}
          >
            ‹
          </button>
          <button
            type="button"
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-lg shadow-sm hover:bg-background"
            aria-label="Sonraki görsel"
            onClick={() => go(index + 1)}
          >
            ›
          </button>
          <p className="absolute bottom-2 right-2 rounded bg-background/80 px-2 py-0.5 font-mono text-xs">
            {index + 1}/{count}
          </p>
        </>
      )}
    </div>
  );

  if (thumbsPosition === 'left' && multi) {
    return (
      <div
        className={`grid grid-cols-[auto_1fr] gap-3 ${className}`}
        data-product-image="gallery"
        aria-labelledby={labelId}
      >
        <span id={labelId} className="sr-only">
          Ürün görsel galerisi
        </span>
        {thumbs}
        {main}
      </div>
    );
  }

  return (
    <div className={className} data-product-image="gallery" aria-labelledby={labelId}>
      <span id={labelId} className="sr-only">
        Ürün görsel galerisi
      </span>
      {main}
      {multi && thumbs}
    </div>
  );
}
