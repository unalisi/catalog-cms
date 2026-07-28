import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  className?: string;
  /** When true, removes CardContent padding (e.g. full-bleed grids). */
  flush?: boolean;
};

/** Content panel on muted admin canvas (DESIGN admin depth model). */
export function AdminContentCard({ children, className, flush = false }: Props) {
  return (
    <Card className={cn('border-border bg-background shadow-none', className)}>
      {flush ? children : <CardContent className="p-4 md:p-6">{children}</CardContent>}
    </Card>
  );
}
