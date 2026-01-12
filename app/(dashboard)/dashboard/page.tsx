'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp,
  Activity,
  RefreshCw,
  BarChart3,
  User,
  LogIn,
} from 'lucide-react';

interface Scan {
  id: string;
  url: string;
  overall_score: number | null;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, profile, loading: userLoading } = useUser();
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
    } else if (!userLoading) {
      setLoading(false);
    }
  }, [user, userLoading, showError]);

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

  // Show logged-out view
  if (!userLoading && !user) {
    return (
      <div className="space-y-8">
        <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-12 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-lg mb-6">
            <BarChart3 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Dashboard Access
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Sign in to access your personalized dashboard, track scan history,
            and monitor your website&apos;s performance over time.
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
          <div className="mt-8 pt-8 border-t border-blue-200 dark:border-blue-900">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Want to try it out first?
            </p>
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              <RefreshCw className="h-4 w-4" />
              Run a free scan without signing up
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <Activity className="h-8 w-8 text-blue-600 mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Track All Scans
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Save and organize all your website audits in one place
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <TrendingUp className="h-8 w-8 text-green-600 mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Monitor Progress
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track improvements and see how your scores change over time
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <BarChart3 className="h-8 w-8 text-purple-600 mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Detailed Reports
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get comprehensive analysis with actionable recommendations
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* User Profile Section */}gradient
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {profile?.full_name || user?.email}!
              </h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Track your website&apos;s SEO, performance, and Next.js
                optimization
              </p>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                  Active account
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {new Date(user?.created_at || new Date()).toLocaleDateString(
                    'en-US',
                    { month: 'long', day: 'numeric', year: 'numeric' }
                  )}
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <User className="h-4 w-4" />
            Edit Profile
          </Link>
        </div>

        {/* Account Info */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Plan
            </p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white capitalize">
              Free
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Email
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.email}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Auth Method
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              {user?.app_metadata?.provider === 'github'
                ? 'GitHub OAuth'
                : 'Email & Password'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Account Status
            </p>
            <p className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">
              Verified
            </p>
          </div>
        </div>
      </div>
      {/* Welcome Section (kept for compatibility) */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Dashboard Overview
        </h2>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Manage your audits and track performance metrics
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
                Free
              </p>
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
            href="/scan"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            New Audit
          </Link>
          <Link
            href="/history"
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
            href="/history"
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
                href={`/scan/${scan.id}`}
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
    </div>
  );
}
