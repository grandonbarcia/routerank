'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CallbackSuccessPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const handleCallback = async () => {
      try {
        const supabase = createClient();

        // Wait for session to be persisted in storage
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Verify session exists
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (!session) {
          console.error('No session found after OAuth');
          setError('Authentication failed');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }

        console.log('OAuth success, session established');

        // Use window.location.href for a hard navigation
        // This ensures the entire app reloads with the new session
        window.location.href = '/scan';
      } catch (err) {
        if (!mounted) return;
        console.error('Callback error:', err);
        setError('An unexpected error occurred');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    };

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-600 dark:text-red-400 mb-4">
              <svg
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-gray-900 dark:text-gray-100 font-medium">
              {error}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              Redirecting to login...
            </p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Completing sign in...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
