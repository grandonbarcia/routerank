import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant =
  | 'default'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline:
    'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'bg-transparent hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-white hover:bg-destructive/90',
  link: 'bg-transparent text-primary underline-offset-4 hover:underline',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 px-3 py-1.5 text-sm',
  lg: 'h-10 px-6 py-2.5 text-base',
  icon: 'h-9 w-9 p-0',
};

export function Button({
  className,
  variant = 'default',
  size = 'default',
  type,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={cn(
        base,
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
