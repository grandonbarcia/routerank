'use client';

import Link from 'next/link';
import { Activity, BarChart3, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          RouteRank is fully free — no login, no saved scan history.
        </p>
        <div className="mt-6">
          <Link
            href="/scan"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
          >
            Run a Scan
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <Activity className="h-8 w-8 text-blue-600 mb-4" />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Quick Insights
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Audit SEO, performance, and Next.js best practices.
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <TrendingUp className="h-8 w-8 text-green-600 mb-4" />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Actionable Fixes
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Clear suggestions you can apply immediately.
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <BarChart3 className="h-8 w-8 text-purple-600 mb-4" />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Detailed Reports
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Full report output is available right after each scan.
          </p>
        </div>
      </div>
    </div>
  );
}
