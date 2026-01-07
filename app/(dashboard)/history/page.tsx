'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreVertical,
  RefreshCw,
  Trash2,
} from 'lucide-react';

interface Scan {
  id: string;
  url: string;
  domain: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  seo_score: number | null;
  performance_score: number | null;
  nextjs_score: number | null;
  overall_score: number | null;
  created_at: string;
  completed_at: string | null;
}

export default function HistoryPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { error: showError, success: showSuccess } = useToast();

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const response = await fetch('/api/scans');
        if (!response.ok) {
          throw new Error('Failed to fetch scans');
        }
        const data = await response.json();
        setScans(data.scans || []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load history';
        setError(message);
        showError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, [showError]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'running':
      case 'pending':
        return <Clock className="h-5 w-5 animate-spin text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'running':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400 dark:text-gray-500';
    if (score >= 90) return 'text-green-600 dark:text-green-400 font-bold';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400 font-bold';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400 font-bold';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400 font-bold';
    return 'text-red-600 dark:text-red-400 font-bold';
  };

  const handleRescan = async (id: string) => {
    const scan = scans.find((s) => s.id === id);
    if (scan) {
      try {
        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: scan.url, fullAudit: true }),
        });

        if (!response.ok) {
          const data = await response.json();
          showError(data.error || 'Failed to start scan');
          return;
        }

        showSuccess('New scan started!');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Failed to start scan');
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Scan History
        </h1>
        <div className="flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 py-12 bg-white dark:bg-gray-800">
          <div className="text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-gray-600 dark:text-gray-400" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading history...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Scan History
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {scans.length} audits completed
          </p>
        </div>
        <Link
          href="/scan"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          New Audit
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex gap-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {scans.length === 0 && !error && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
            <Clock className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            No scans yet
          </p>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Start by running your first website audit
          </p>
          <Link
            href="/scan"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Start Your First Audit
          </Link>
        </div>
      )}

      {/* Scans Table */}
      {scans.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Website
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Overall Score
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    SEO
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Performance
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Next.js
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {scans.map((scan) => (
                  <tr
                    key={scan.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {scan.url}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {scan.domain}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {scan.overall_score !== null ? (
                        <span
                          className={`text-lg ${getScoreColor(
                            scan.overall_score
                          )}`}
                        >
                          {Math.round(scan.overall_score)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {scan.seo_score !== null ? (
                        <span className={getScoreColor(scan.seo_score)}>
                          {Math.round(scan.seo_score)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {scan.performance_score !== null ? (
                        <span className={getScoreColor(scan.performance_score)}>
                          {Math.round(scan.performance_score)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {scan.nextjs_score !== null ? (
                        <span className={getScoreColor(scan.nextjs_score)}>
                          {Math.round(scan.nextjs_score)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(scan.status)}
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                            scan.status
                          )}`}
                        >
                          {scan.status.charAt(0).toUpperCase() +
                            scan.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(scan.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {scan.status === 'completed' ? (
                        <Link
                          href={`/scan/${scan.id}`}
                          className="inline-flex items-center gap-1 rounded px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        >
                          View
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          Processing...
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
