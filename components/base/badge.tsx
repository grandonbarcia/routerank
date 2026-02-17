import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'outline';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'border border-border bg-transparent text-foreground',
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
