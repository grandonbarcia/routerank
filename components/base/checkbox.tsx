import * as React from 'react';
import { cn } from '@/lib/utils';

export type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'checked' | 'onChange'
> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function Checkbox({
  className,
  checked,
  onCheckedChange,
  disabled,
  ...props
}: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cn(
        'h-4 w-4 rounded border border-input bg-background text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      checked={!!checked}
      disabled={disabled}
      onChange={(e) => onCheckedChange?.(e.currentTarget.checked)}
      {...props}
    />
  );
}
