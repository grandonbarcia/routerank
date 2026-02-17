import * as React from 'react';
import { cn } from '@/lib/utils';

export function Progress({
  value,
  className,
}: {
  value?: number;
  className?: string;
}) {
  const clamped =
    typeof value === 'number' ? Math.min(100, Math.max(0, value)) : 0;

  return (
    <div
      className={cn(
        'h-2 w-full overflow-hidden rounded-full bg-secondary',
        className,
      )}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      role="progressbar"
    >
      <div
        className="h-full bg-primary transition-[width]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
