import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type HeroSlide = {
  imageUrl: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

type Props = {
  slides: HeroSlide[];
  overlay?: 'dark' | 'light';
};

export default function HeroSlider({ slides, overlay = 'dark' }: Props) {
  const [index, setIndex] = useState(0);
  const count = slides.length;
  const dark = overlay === 'dark';

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (count <= 1) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const id = window.setInterval(() => go(index + 1), 5000);
    return () => window.clearInterval(id);
  }, [count, go, index]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') go(index - 1);
      if (e.key === 'ArrowRight') go(index + 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index]);

  if (count === 0) return null;
  const slide = slides[index]!;

  return (
    <section className="relative min-h-[70vh] overflow-hidden md:min-h-[78vh]" aria-roledescription="carousel">
      {slides.map((s, i) => (
        <div
          key={`${s.title}-${i}`}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-hidden={i !== index}
        >
          {s.imageUrl ? (
            <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
          <div
            className={`absolute inset-0 ${
              dark
                ? 'bg-gradient-to-r from-foreground/80 via-foreground/55 to-foreground/25'
                : 'bg-gradient-to-r from-background/90 via-background/70 to-background/40'
            }`}
          />
        </div>
      ))}

      <div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-end gap-5 px-4 py-20 md:min-h-[78vh] md:justify-center md:px-6 md:py-28">
        {slide.eyebrow ? (
          <p
            className={`font-display text-sm font-semibold uppercase tracking-widest ${
              dark ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {slide.eyebrow}
          </p>
        ) : null}
        <h1
          className={`max-w-3xl font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl ${
            dark ? 'text-background' : 'text-foreground'
          }`}
        >
          {slide.title}
        </h1>
        {slide.subtitle ? (
          <p className={`max-w-xl text-lg ${dark ? 'text-background/85' : 'text-muted-foreground'}`}>
            {slide.subtitle}
          </p>
        ) : null}
        {slide.ctaLabel && slide.ctaHref ? (
          <div className="flex flex-wrap gap-3">
            <a
              href={slide.ctaHref}
              className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {slide.ctaLabel}
            </a>
          </div>
        ) : null}
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            aria-label="Önceki slayt"
            className={`absolute top-1/2 left-3 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-md border md:left-5 ${
              dark
                ? 'border-background/30 bg-foreground/20 text-background backdrop-blur-sm hover:bg-foreground/35'
                : 'border-border bg-background/80 text-foreground backdrop-blur-sm hover:bg-muted'
            }`}
            onClick={() => go(index - 1)}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Sonraki slayt"
            className={`absolute top-1/2 right-3 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-md border md:right-5 ${
              dark
                ? 'border-background/30 bg-foreground/20 text-background backdrop-blur-sm hover:bg-foreground/35'
                : 'border-border bg-background/80 text-foreground backdrop-blur-sm hover:bg-muted'
            }`}
            onClick={() => go(index + 1)}
          >
            <ChevronRight className="size-5" />
          </button>
          <div
            className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 md:bottom-8"
            role="tablist"
            aria-label="Slaytlar"
          >
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slayt ${i + 1}`}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  i === index ? 'bg-primary' : dark ? 'bg-background/35' : 'bg-border'
                }`}
                onClick={() => go(i)}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
