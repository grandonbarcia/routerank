'use client';

import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useEffect, useState, useMemo } from 'react';
import type { Profile } from '@/types/database';

interface UseUserReturn {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true);

        // Fast path: read session from storage (avoids a network round-trip)
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError);
          setUser(null);
          setProfile(null);
          return;
        }

        if (!session?.user) {
          setUser(null);
          setProfile(null);
          return;
        }

        setUser(session.user);

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          setError(profileError);
          setProfile(null);
        } else {
          setProfile(profileData as Profile);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);

        // Fetch updated profile on auth change
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData as Profile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  return { user, profile, loading, error };
}
