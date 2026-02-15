'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CallbackSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Finishing up...</p>
          </div>
        </div>
      }
    >
      <CallbackSuccessInner />
    </Suspense>
  );
}

function CallbackSuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackError = useMemo(() => {
    const errorParam = searchParams.get('error');
    const description =
      searchParams.get('error_description') ||
      searchParams.get('error_description'.replace('_', '-'));

    if (!errorParam && !description) return null;
    return (description || errorParam || '').replace(/\+/g, ' ').trim();
  }, [searchParams]);

  useEffect(() => {
    let redirectTimeout: ReturnType<typeof setTimeout> | undefined;

    if (callbackError) {
      redirectTimeout = setTimeout(() => {
        router.replace('/');
      }, 2000);
      return () => {
        if (redirectTimeout) clearTimeout(redirectTimeout);
      };
    }

    // Note: This app currently does not include the OAuth code-exchange route.
    // If you add Supabase auth later, do the code exchange server-side at /auth/callback.
    redirectTimeout = setTimeout(() => {
      router.replace('/scan');
    }, 700);

    return () => {
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [callbackError, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        {callbackError ? (
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
              {callbackError}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              Redirecting...
            </p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Finishing up...</p>
          </>
        )}
      </div>
    </div>
  );
}
