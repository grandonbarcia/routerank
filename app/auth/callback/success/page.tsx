'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function CallbackSuccessPage() {
  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();

      // Get the current session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('OAuth callback error:', error);
        window.location.href = '/login?error=auth_failed';
        return;
      }

      if (session) {
        // Use window.location.href for a hard navigation
        // This ensures all client-side state is refreshed
        window.location.href = '/scan';
      } else {
        window.location.href = '/login';
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">
          Completing sign in...
        </p>
      </div>
    </div>
  );
}
