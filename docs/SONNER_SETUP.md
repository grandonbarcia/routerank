# Toast Notifications Setup - Sonner Integration

## Overview

RouteRank uses **Sonner** for toast notifications instead of the deprecated shadcn/ui toast component. Sonner provides:

- ✅ Modern, beautiful toast UI
- ✅ Full TypeScript support
- ✅ Rich notifications with custom content
- ✅ Promise-based notifications for async operations
- ✅ Customizable styling with Tailwind

## Files Added/Modified

### 1. **app/providers.tsx** (New)

```typescript
'use client';

import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  );
}
```

Provides the Sonner Toaster at the root level. Position can be adjusted:

- `top-left`, `top-center`, `top-right`
- `bottom-left`, `bottom-center`, `bottom-right`

### 2. **hooks/use-toast.ts** (New)

Custom hook for convenient toast usage throughout the app.

### 3. **app/layout.tsx** (Modified)

Updated to wrap children with the `Providers` component.

## Usage Examples

### Basic Usage

```typescript
'use client';

import { useToast } from '@/hooks/use-toast';

export function MyComponent() {
  const { success, error, info, warning } = useToast();

  const handleClick = () => {
    success('Success!', 'Your action was successful');
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

### Success Toast

```typescript
const { success } = useToast();
success('Success!', 'Scan completed successfully');
```

### Error Toast

```typescript
const { error } = useToast();
error('Error!', 'Failed to start scan');
```

### Info Toast

```typescript
const { info } = useToast();
info('Info', 'Your message here');
```

### Warning Toast

```typescript
const { warning } = useToast();
warning('Warning', 'Please review before proceeding');
```

### Loading Toast

```typescript
const { loading } = useToast();
const toastId = loading('Processing your request...');
// Later, you can dismiss it using sonner directly
```

### Promise-based Notifications

Perfect for async operations like scans, API calls, etc:

```typescript
const { promise } = useToast();

const scanPromise = fetch('/api/scan', { method: 'POST' });

promise(scanPromise, {
  loading: 'Starting scan...',
  success: 'Scan completed!',
  error: 'Scan failed',
});
```

### Advanced: Custom Content

```typescript
import { toast } from 'sonner';

toast.custom((t) => (
  <div className="bg-white p-4 rounded-lg shadow-lg">
    <h3>Custom Toast</h3>
    <p>You can put any React component here</p>
    <button onClick={() => toast.dismiss(t)}>Close</button>
  </div>
));
```

## Common Use Cases in RouteRank

### 1. Scan Creation

```typescript
'use client';

import { useToast } from '@/hooks/use-toast';

export function ScanForm() {
  const { promise } = useToast();

  const handleSubmit = async (url: string) => {
    const scanPromise = fetch('/api/scan', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });

    promise(scanPromise, {
      loading: 'Initiating audit...',
      success: 'Audit started! Redirecting to results...',
      error: 'Failed to start audit',
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 2. Authentication

```typescript
'use client';

import { useToast } from '@/hooks/use-toast';

export function LoginForm() {
  const { error, success } = useToast();

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        success('Welcome!', 'You are now signed in');
      } else {
        error('Login failed', 'Invalid credentials');
      }
    } catch {
      error('Error', 'An unexpected error occurred');
    }
  };

  return <form onSubmit={handleLogin}>...</form>;
}
```

### 3. Copy to Clipboard

```typescript
'use client';

import { useToast } from '@/hooks/use-toast';

export function CodeSnippet({ code }: { code: string }) {
  const { success } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    success('Copied!', 'Code copied to clipboard');
  };

  return (
    <>
      <pre>{code}</pre>
      <button onClick={handleCopy}>Copy</button>
    </>
  );
}
```

## Styling & Customization

### Theme

Sonner supports dark/light themes. The app will automatically use the system theme:

```typescript
<Toaster
  theme="light" // or 'dark' or 'system'
  position="top-right"
  richColors
/>
```

### Custom Styling

Override in `globals.css`:

```css
[data-sonner-toaster] {
  /* Custom styles */
}

[data-sonner-toast] {
  /* Toast styles */
}
```

## API Reference

### useToast() Hook

Returns an object with the following methods:

| Method    | Parameters                                              | Description              |
| --------- | ------------------------------------------------------- | ------------------------ |
| `success` | (message: string, description?: string)                 | Show success toast       |
| `error`   | (message: string, description?: string)                 | Show error toast         |
| `info`    | (message: string, description?: string)                 | Show info toast          |
| `warning` | (message: string, description?: string)                 | Show warning toast       |
| `loading` | (message: string)                                       | Show loading toast       |
| `promise` | (promise: Promise, messages: {loading, success, error}) | Show promise-based toast |

## Migration from shadcn/ui toast

If you were using the old shadcn/ui toast:

**Old (Deprecated):**

```typescript
import { useToast } from '@/components/ui/use-toast';

const { toast } = useToast();
toast({ title: 'Success!', description: '...' });
```

**New (Sonner):**

```typescript
import { useToast } from '@/hooks/use-toast';

const { success } = useToast();
success('Success!', '...');
```

## Best Practices

1. **Always use the custom hook** - Maintains consistency across the app
2. **Use appropriate toast types** - `success` for wins, `error` for failures
3. **Keep messages brief** - Toasts are temporary notifications
4. **Use promises for async** - Automatically handles loading/success/error states
5. **Close important toasts manually** - Use custom content for critical information
6. **Test accessibility** - Screen readers should read toast messages

## Troubleshooting

### Toasts not showing?

- Ensure `Providers` component wraps children in root layout
- Check that `<Toaster />` is rendered in providers.tsx

### Styling issues?

- Import `sonner/toast.css` if default styles don't apply
- Check z-index conflicts with other elements
- Verify Tailwind CSS is properly configured

### TypeScript errors?

- Import `useToast` from `@/hooks/use-toast` (not from sonner directly)
- The custom hook provides proper typing

## Resources

- [Sonner Documentation](https://sonner.emilkowal.ski)
- [Example Components](./components/examples/toast-example.tsx)
