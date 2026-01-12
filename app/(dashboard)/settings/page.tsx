'use client';

import { useUser } from '@/hooks/use-user';
import { Loader, LogOut, Copy, Check, LogIn, Settings } from 'lucide-react';
import { signOut } from '@/lib/auth/actions';
import { useState } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, profile, loading } = useUser();
  const [copied, setCopied] = useState(false);

  const scansToday = profile?.scans_today || 0;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Show logged-out view
  if (!user) {
    return (
      <div className="space-y-8">
        <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-12 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-lg mb-6">
            <Settings className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Account Settings
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Sign in to manage your account settings, view usage statistics, and
            customize your experience.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <LogIn className="h-5 w-5" />
              Log In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition shadow-md hover:shadow-lg"
            >
              Create Free Account
            </Link>
          </div>
        </div>

        {/* Settings Preview */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 opacity-60">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            What You&apos;ll Get
          </h2>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Manage your account information</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Track your usage and scan statistics</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Customize your profile settings</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Unlimited scans - completely free</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your account
        </p>
      </div>

      <div className="grid gap-8">
        {/* Account Settings */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Account Information
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {user?.email || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                User ID
              </p>
              <div className="mt-1 flex items-center gap-2">
                <p className="font-mono text-sm text-gray-900 dark:text-white">
                  {user?.id ? user.id.substring(0, 20) + '...' : 'N/A'}
                </p>
                {user?.id && (
                  <button
                    onClick={() => copyToClipboard(user.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                    title="Copy User ID"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
            {profile?.full_name && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Full Name
                </p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">
                  {profile.full_name}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Member Since
              </p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Usage */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Usage
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            RouteRank is free for everyone. Scans are unlimited.
          </p>
          <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Scans Today
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {scansToday}
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-6">
          <h2 className="text-lg font-semibold text-red-900 dark:text-red-200">
            Danger Zone
          </h2>
          <p className="mt-2 text-sm text-red-800 dark:text-red-300">
            These actions cannot be undone.
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="mt-4 flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-white font-semibold hover:bg-red-700 transition"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
