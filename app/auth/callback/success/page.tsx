'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CallbackSuccessPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;
    let redirectTimeout: NodeJS.Timeout;
    let authSubscription: any;

    const handleCallback = async () => {
      try {
        console.log('Starting OAuth callback handling...');

        // First check if session already exists
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session && mounted) {
          console.log('Session already exists! Redirecting to /scan...');
          redirectTimeout = setTimeout(() => {
            router.push('/scan');
            router.refresh();
          }, 100);
          return;
        }

        // If no session yet, listen for auth state change
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          console.log(
            'Auth callback - event:',
            event,
            'has session:',
            !!session
          );

          if (!mounted) return;

          if (event === 'SIGNED_IN' && session) {
            console.log('Sign in confirmed! Redirecting to /scan...');
            redirectTimeout = setTimeout(() => {
              router.push('/scan');
              router.refresh();
            }, 100);
          }
        });

        authSubscription = subscription;

        // Set a timeout in case auth state change doesn't fire
        if (!session && mounted) {
          redirectTimeout = setTimeout(() => {
            if (mounted) {
              console.error('Timeout waiting for session');
              setError('Authentication timeout');
              setTimeout(() => {
                router.push('/login');
              }, 2000);
            }
          }, 5000);
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Callback error:', err);
        setError('An unexpected error occurred');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    };

    handleCallback();

    return () => {
      mounted = false;
      if (redirectTimeout) clearTimeout(redirectTimeout);
      if (authSubscription) authSubscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
