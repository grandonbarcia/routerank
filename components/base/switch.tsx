import * as React from 'react';
import { cn } from '@/lib/utils';

export type SwitchProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange'
> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function Switch({
  className,
  checked,
  onCheckedChange,
  disabled,
  ...props
}: SwitchProps) {
  const isChecked = !!checked;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      data-state={isChecked ? 'checked' : 'unchecked'}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!isChecked)}
      className={cn(
        'inline-flex h-5 w-9 items-center rounded-full border border-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        isChecked ? 'bg-primary' : 'bg-background',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-sm ring-0 transition-transform',
          isChecked ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}
