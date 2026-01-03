'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  CheckCircle2,
  Loader,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

interface ScanData {
  scan: {
    id: string;
    url: string;
    domain: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    seoScore: number | null;
    performanceScore: number | null;
    nextjsScore: number | null;
    overallScore: number | null;
    errorMessage: string | null;
    createdAt: string;
    completedAt: string | null;
    lighthouseData: any;
  };
  issues: Array<{
    id: string;
    category: 'seo' | 'performance' | 'nextjs';
    severity: 'info' | 'warning' | 'error';
    rule_id: string;
    title: string;
    message: string;
    fix_suggestion?: string;
    fix_code?: string;
    metadata?: Record<string, any>;
  }>;
}

export default function ScanResultPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<
    'seo' | 'performance' | 'nextjs'
  >('seo');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const router = useRouter();
  const { error: showError, success: showSuccess } = useToast();

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const response = await fetch(`/api/scans/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch scan');
        }
        const result = await response.json();
        setData(result);

        // Stop polling if completed or failed
        if (
          result.scan.status === 'completed' ||
          result.scan.status === 'failed'
        ) {
          setLoading(false);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load results';
        setError(message);
        showError(message);
        setLoading(false);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(fetchScan, 2000);
    fetchScan();

    return () => clearInterval(interval);
  }, [params.id, showError]);

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    showSuccess('Copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Loading State
  if (loading && !data) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Audit Results</h1>
        <div className="flex flex-col items-center justify-center rounded-lg border border-blue-200 bg-blue-50 py-16">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-4 text-lg text-blue-700">Scanning your website...</p>
          <p className="mt-2 text-sm text-blue-600">
            This may take a couple of minutes. Please don&apos;t refresh the
            page.
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Audit Results</h1>
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-6">
          <AlertCircle className="h-6 w-6 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-red-800">
              {error || 'Scan not found'}
            </p>
            <Link
              href="/dashboard/scan"
              className="mt-3 inline-block text-red-700 hover:underline"
            >
              Start a new audit
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { scan, issues } = data;

  // Pending/Running State
  if (scan.status === 'pending' || scan.status === 'running') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Audit in Progress
          </h1>
          <p className="mt-2 text-gray-600">{scan.url}</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-yellow-200 bg-yellow-50 py-16">
          <Loader className="h-8 w-8 animate-spin text-yellow-600" />
          <p className="mt-4 text-lg text-yellow-700">
            Scanning your website...
          </p>
          <p className="mt-2 text-sm text-yellow-600">
            {scan.status === 'pending' ? 'Starting audit' : 'Analyzing content'}
            ... This page will auto-refresh every 2 seconds.
          </p>
        </div>
      </div>
    );
  }

  // Failed State
  if (scan.status === 'failed') {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Audit Failed</h1>
          <Link
            href="/dashboard/scan"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Link>
        </div>
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-6">
          <AlertCircle className="h-6 w-6 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-red-800">Audit Failed</p>
            <p className="mt-1 text-sm text-red-700">
              {scan.errorMessage || 'Unknown error'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Completed State
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Results</h1>
          <p className="mt-2 text-gray-600">{scan.url}</p>
          <p className="mt-1 text-sm text-gray-500">
            Completed{' '}
            {new Date(scan.completedAt || scan.createdAt).toLocaleString()}
          </p>
        </div>
        <Link
          href="/dashboard/scan"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          New Audit
        </Link>
      </div>

      {/* Overall Score */}
      {scan.overallScore !== null && (
        <div className="rounded-lg border border-gray-200 bg-white p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Score</p>
              <p
                className={`text-5xl font-bold ${getScoreColor(
                  scan.overallScore
                )}`}
              >
                {Math.round(scan.overallScore)}
              </p>
            </div>
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg
                className="w-32 h-32 transform -rotate-90"
                viewBox="0 0 120 120"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeDasharray={`${(scan.overallScore / 100) * 339.3} 339.3`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(scan.overallScore)}
                </p>
                <p className="text-xs text-gray-600">out of 100</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Scores */}
      {scan.seoScore !== null &&
        scan.performanceScore !== null &&
        scan.nextjsScore !== null && (
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'SEO', score: scan.seoScore, key: 'seo' as const },
              {
                label: 'Performance',
                score: scan.performanceScore,
                key: 'performance' as const,
              },
              {
                label: 'Next.js',
                score: scan.nextjsScore,
                key: 'nextjs' as const,
              },
            ].map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedTab(cat.key)}
                className={`rounded-lg border p-6 text-left transition ${
                  selectedTab === cat.key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="text-sm font-medium text-gray-600">{cat.label}</p>
                <p
                  className={`mt-2 text-3xl font-bold ${getScoreColor(
                    cat.score
                  )}`}
                >
                  {Math.round(cat.score)}
                </p>
              </button>
            ))}
          </div>
        )}

      {/* Issues by Category */}
      {issues.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Issues Found</h2>

          {/* Category Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {(['seo', 'performance', 'nextjs'] as const).map((category) => {
              const count = issues.filter(
                (i) => i.category === category
              ).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedTab(category)}
                  className={`px-4 py-2 font-medium transition border-b-2 ${
                    selectedTab === category
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {category === 'nextjs'
                    ? 'Next.js'
                    : category.charAt(0).toUpperCase() + category.slice(1)}{' '}
                  ({count})
                </button>
              );
            })}
          </div>

          {/* Issues List */}
          <div className="space-y-3">
            {issues
              .filter((i) => i.category === selectedTab)
              .map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-lg border border-gray-200 bg-white p-6"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getSeverityColor(
                        issue.severity
                      )}`}
                    >
                      {issue.severity.toUpperCase()}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {issue.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {issue.message}
                      </p>

                      {issue.fix_suggestion && (
                        <div className="mt-3 rounded-md bg-blue-50 p-3">
                          <p className="text-xs font-semibold text-blue-900">
                            Suggestion:
                          </p>
                          <p className="mt-1 text-sm text-blue-800">
                            {issue.fix_suggestion}
                          </p>
                        </div>
                      )}

                      {issue.fix_code && (
                        <div className="mt-3 rounded-md border border-gray-300 bg-gray-50 p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-900">
                              Code Example:
                            </p>
                            <button
                              onClick={() =>
                                copyCode(issue.fix_code!, issue.id)
                              }
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                            >
                              {copiedCode === issue.id ? (
                                <>
                                  <Check className="h-3 w-3" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" /> Copy
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="mt-2 overflow-x-auto rounded bg-gray-900 p-3 text-xs text-gray-100 font-mono">
                            {issue.fix_code}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* No Issues */}
      {issues.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-green-200 bg-green-50 py-12">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
          <p className="mt-4 text-lg font-semibold text-green-800">
            No Major Issues Found!
          </p>
          <p className="mt-2 text-sm text-green-700">
            Your site is in excellent shape.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          href="/dashboard/history"
          className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 font-semibold hover:bg-gray-50"
        >
          View History
        </Link>
        <Link
          href="/dashboard/scan"
          className="rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
        >
          Run Another Audit
        </Link>
      </div>
    </div>
  );
}
