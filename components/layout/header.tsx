'use client';

import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import { signOut } from '@/lib/auth/actions';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, profile, loading } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="border-b border-gray-200">
      <nav className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            RouteRank
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-gray-700 hover:text-gray-900">
              Pricing
            </Link>
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="text-gray-700 hover:text-gray-900"
                    >
                      Dashboard
                    </Link>
                    <div className="flex items-center gap-4 border-l border-gray-200 pl-4">
                      <span className="text-sm text-gray-700">
                        {profile?.full_name || user.email}
                      </span>
                      <button
                        onClick={handleLogout}
                        className="text-sm text-gray-700 hover:text-gray-900"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-gray-700 hover:text-gray-900"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
