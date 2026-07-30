import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  className?: string;
};

/** Sticky save/cancel row on mobile (above bottom nav); static footer on md+. */
export function AdminFormStickyBar({ children, className }: Props) {
  return (
    <>
      <div className="h-[4.5rem] md:hidden" aria-hidden="true" />
      <div
        className={cn(
          'fixed inset-x-0 z-30 flex gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/90',
          'bottom-[calc(3.5rem+env(safe-area-inset-bottom))] pb-3',
          'md:static md:inset-auto md:z-auto md:mt-0 md:border-t md:bg-transparent md:p-0 md:pt-6 md:pb-0 md:backdrop-blur-none',
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}
