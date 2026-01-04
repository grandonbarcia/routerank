'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Activity, RefreshCw, BarChart3 } from 'lucide-react';

interface Scan {
  id: string;
  url: string;
  overall_score: number | null;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, profile } = useUser();
  const { error: showError } = useToast();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const response = await fetch('/api/scans');
        if (response.ok) {
          const data = await response.json();
          setScans(data.scans || []);
        }
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to load scans');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchScans();
    }
  }, [user, showError]);

  const completedScans = scans.filter((s) => s.status === 'completed');
  const averageScore =
    completedScans.length > 0
      ? Math.round(
          completedScans.reduce((acc, s) => acc + (s.overall_score || 0), 0) /
            completedScans.length
        )
      : 0;
  const recentScans = scans.slice(0, 5);

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {profile?.full_name || user?.email}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Track your website's SEO, performance, and Next.js optimization
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Audits
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {completedScans.length}
              </p>
            </div>
            <Activity className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Average Score
              </p>
              <p
                className={`mt-2 text-3xl font-bold ${
                  averageScore >= 80
                    ? 'text-green-600'
                    : averageScore >= 60
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {averageScore}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Plan
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white capitalize">
                {profile?.subscription_tier || 'Free'}
              </p>
              {profile?.subscription_tier === 'free' && (
                <Link
                  href="/pricing"
                  className="mt-3 text-sm text-blue-600 hover:underline"
                >
                  Upgrade Plan →
                </Link>
              )}
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Quick Actions
        </h2>
        <div className="mt-4 flex gap-3">
          <Link
            href="/dashboard/scan"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            New Audit
          </Link>
          <Link
            href="/dashboard/history"
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <BarChart3 className="h-4 w-4" />
            View History
          </Link>
        </div>
      </div>

      {/* Recent Scans */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Audits
          </h2>
          <Link
            href="/dashboard/history"
            className="text-sm text-blue-600 hover:underline"
          >
            View All
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : recentScans.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400 py-8">
            No audits yet. Start your first scan to see results here.
          </p>
        ) : (
          <div className="space-y-3">
            {recentScans.map((scan) => (
              <Link
                key={scan.id}
                href={`/dashboard/scan/${scan.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {scan.url}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(scan.created_at).toLocaleDateString()}
                  </p>
                </div>
                {scan.status === 'completed' && scan.overall_score !== null ? (
                  <span
                    className={`text-lg font-bold ${getScoreColor(
                      scan.overall_score
                    )}`}
                  >
                    {Math.round(scan.overall_score)}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-200">
                    {scan.status}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade Prompt */}
      {profile?.subscription_tier === 'free' && completedScans.length >= 1 && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200">
            Ready to audit more?
          </h3>
          <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
            Upgrade to Pro for unlimited audits, detailed code suggestions, and
            PDF exports.
          </p>
          <Link
            href="/pricing"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
          >
            <TrendingUp className="h-4 w-4" />
            View Plans
          </Link>
        </div>
      )}
    </div>
  );
}
