'use client';

import { useUser } from '@/hooks/use-user';
import Link from 'next/link';
import { Loader, LogOut, Bell, Shield, Copy, Check } from 'lucide-react';
import { signOut } from '@/lib/auth/actions';
import { useState } from 'react';

export default function SettingsPage() {
  const { user, profile, loading } = useUser();
  const [copied, setCopied] = useState(false);

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

  const planLimits = {
    free: { name: 'Free', scansPerDay: 1, price: '$0/month' },
    pro: { name: 'Pro', scansPerDay: 'Unlimited', price: '$19/month' },
    agency: {
      name: 'Agency',
      scansPerDay: 'Unlimited',
      price: '$49/month',
    },
  };

  const currentPlan =
    planLimits[profile?.subscription_tier as keyof typeof planLimits] ||
    planLimits.free;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your account and subscription
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

        {/* Subscription Settings */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Subscription
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your subscription and billing
          </p>
          <div className="mt-6 space-y-4">
            {/* Current Plan */}
            <div className="flex items-center justify-between rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Current Plan
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {currentPlan.name}
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {currentPlan.price} • {currentPlan.scansPerDay} scans/day
                </p>
              </div>
              {profile?.subscription_tier !== 'agency' && (
                <Link
                  href="/marketing/pricing"
                  className="rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition whitespace-nowrap"
                >
                  {profile?.subscription_tier === 'pro'
                    ? 'Upgrade to Agency'
                    : 'Upgrade Plan'}
                </Link>
              )}
            </div>

            {/* Billing Portal */}
            {profile?.stripe_subscription_id && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your billing method and view invoices in the Stripe
                  customer portal.
                </p>
                <button className="mt-3 rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800">
                  Open Billing Portal
                </button>
              </div>
            )}

            {/* Usage */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Daily Scan Usage
              </p>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{
                        width: `${Math.min(
                          ((profile?.scans_today || 0) /
                            (profile?.subscription_tier === 'free' ? 1 : 10)) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                  {profile?.scans_today || 0} scan
                  {(profile?.scans_today || 0) !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
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
