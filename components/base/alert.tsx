import * as React from 'react';
import { cn } from '@/lib/utils';

export type AlertProps = React.HTMLAttributes<HTMLDivElement>;

export function Alert({ className, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-lg border border-border bg-card p-4 text-card-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function AlertTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'mb-1 font-semibold leading-none tracking-tight',
        className,
      )}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props} />
  );
}
