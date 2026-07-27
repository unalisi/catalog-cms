import { useState } from 'react';

type Image = { src: string; alt: string };

export default function GalleryLightbox({ images }: { images: Image[] }) {
  const [active, setActive] = useState<number | null>(null);

  if (images.length === 0) {
    return <p className="text-sm text-muted-foreground">Görsel yok.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {images.map((img, index) => (
          <button
            key={`${img.src}-${index}`}
            type="button"
            className="aspect-square overflow-hidden border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setActive(index)}
          >
            <img src={img.src} alt={img.alt || ''} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      {active != null && images[active] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-accent/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Galeri önizleme"
          onClick={() => setActive(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setActive(null);
          }}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
            onClick={() => setActive(null)}
          >
            Kapat
          </button>
          <img
            src={images[active].src}
            alt={images[active].alt || ''}
            className="max-h-[85vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
