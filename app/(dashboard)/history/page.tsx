'use client';

import Link from 'next/link';
import { History } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function HistoryPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8">
        <div className="flex items-center gap-3 mb-2">
          <History className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Scan History
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          User accounts and saved scan history have been removed. Run scans
          freely anytime.
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
    </div>
  );
}
