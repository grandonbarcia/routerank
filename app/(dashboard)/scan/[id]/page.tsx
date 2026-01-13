'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { PDFExport } from '@/components/scan/pdf-export';
import { MDExport } from '@/components/scan/md-export';
import {
  AlertCircle,
  CheckCircle2,
  Loader,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

type PerformanceMetrics = {
  lcpMs?: number;
  clsScore?: number;
  fidMs?: number;
  ttfbMs?: number;
  speedIndex?: number;
};

type SeoMetadata = {
  title?: string | null;
  description?: string | null;
  canonical?: string | null;
  viewport?: string | null;
  lang?: string | null;
};

type NextjsChecks = {
  usesNextImage?: boolean;
  usesNextFont?: boolean;
  usesMetadataApi?: boolean;
  hasServerComponents?: boolean;
};

type AuditMetadata = {
  seo?: SeoMetadata;
  performance?: PerformanceMetrics;
  nextjs?: NextjsChecks;
};

type Suggestion = {
  title: string;
  detail: string;
  category: 'seo' | 'performance' | 'nextjs';
};

type IssueSeverity =
  | 'error'
  | 'warning'
  | 'info'
  // Back-compat with older/internal severities
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

function parseAuditMetadata(lighthouseData: unknown): AuditMetadata {
  if (!isRecord(lighthouseData)) return {};

  // New shape: { seo, performance, nextjs }
  if (
    'seo' in lighthouseData ||
    'performance' in lighthouseData ||
    'nextjs' in lighthouseData
  ) {
    return {
      seo: isRecord(lighthouseData.seo)
        ? (lighthouseData.seo as SeoMetadata)
        : undefined,
      performance: isRecord(lighthouseData.performance)
        ? (lighthouseData.performance as PerformanceMetrics)
        : undefined,
      nextjs: isRecord(lighthouseData.nextjs)
        ? (lighthouseData.nextjs as NextjsChecks)
        : undefined,
    };
  }

  // Back-compat: older scans stored performance metrics directly
  return {
    performance: lighthouseData as PerformanceMetrics,
  };
}

function formatSecondsFromMs(ms?: number): string {
  if (typeof ms !== 'number' || Number.isNaN(ms)) return '-';
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatMs(ms?: number): string {
  if (typeof ms !== 'number' || Number.isNaN(ms)) return '-';
  return `${Math.round(ms)}ms`;
}

function formatNumber(value?: number, digits: number = 2): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return value.toFixed(digits);
}

function formatBool(value?: boolean): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return '-';
}

function getScoreSuggestions(params: {
  performance?: PerformanceMetrics;
  seo?: SeoMetadata;
  nextjs?: NextjsChecks;
  limit?: number;
}): Suggestion[] {
  const { performance, seo, nextjs, limit = 5 } = params;
  const suggestions: Suggestion[] = [];

  if (typeof performance?.lcpMs === 'number' && performance.lcpMs > 2500) {
    suggestions.push({
      category: 'performance',
      title: 'Improve Largest Contentful Paint (LCP)',
      detail:
        'Optimize the largest above-the-fold element (often hero image/text), reduce render-blocking resources, and consider preloading critical assets.',
    });
  }

  if (typeof performance?.clsScore === 'number' && performance.clsScore > 0.1) {
    suggestions.push({
      category: 'performance',
      title: 'Reduce Cumulative Layout Shift (CLS)',
      detail:
        'Reserve space for images/ads, set explicit width/height, and avoid injecting content above existing content during load.',
    });
  }

  if (typeof performance?.ttfbMs === 'number' && performance.ttfbMs > 800) {
    suggestions.push({
      category: 'performance',
      title: 'Lower server response time (TTFB)',
      detail:
        'Use caching, reduce server work on initial request, and consider a CDN/edge caching for HTML and static assets.',
    });
  }

  if (
    typeof performance?.speedIndex === 'number' &&
    performance.speedIndex > 4000
  ) {
    suggestions.push({
      category: 'performance',
      title: 'Speed up initial rendering (Speed Index)',
      detail:
        'Reduce JavaScript and CSS payloads, compress images, and defer non-critical scripts to improve how quickly the page looks “ready”.',
    });
  }

  if (!seo?.title) {
    suggestions.push({
      category: 'seo',
      title: 'Add a descriptive page title',
      detail:
        'Aim for ~30–60 characters and include the primary keyword near the front.',
    });
  } else if (seo.title.length < 30 || seo.title.length > 60) {
    suggestions.push({
      category: 'seo',
      title: 'Adjust title length for SERP display',
      detail:
        'Keep the title around 30–60 characters to avoid truncation and improve click-through.',
    });
  }

  if (!seo?.description) {
    suggestions.push({
      category: 'seo',
      title: 'Add a meta description',
      detail:
        'Aim for ~120–160 characters and summarize the page value clearly.',
    });
  } else if (seo.description.length < 120 || seo.description.length > 160) {
    suggestions.push({
      category: 'seo',
      title: 'Tune meta description length',
      detail:
        'Keep the description around 120–160 characters for better search snippets.',
    });
  }

  if (seo && !seo.canonical) {
    suggestions.push({
      category: 'seo',
      title: 'Add a canonical URL',
      detail:
        'Set `rel="canonical"` to the preferred URL to reduce duplicate-content risks.',
    });
  }

  if (nextjs?.usesNextImage === false) {
    suggestions.push({
      category: 'nextjs',
      title: 'Use next/image for images',
      detail:
        'Switch `<img>` to `next/image` to get automatic sizing, optimization, and better LCP potential.',
    });
  }

  if (nextjs?.usesNextFont === false) {
    suggestions.push({
      category: 'nextjs',
      title: 'Use next/font for fonts',
      detail:
        'Move font loading to `next/font` to avoid layout shifts and improve loading behavior.',
    });
  }

  if (nextjs?.usesMetadataApi === false) {
    suggestions.push({
      category: 'nextjs',
      title: 'Adopt the Metadata API',
      detail:
        'Use `generateMetadata` / `metadata` for consistent SEO tags across routes in Next.js 13+.',
    });
  }

  return suggestions.slice(0, limit);
}

function getIssueImpact(issue: {
  category: 'seo' | 'performance' | 'nextjs';
  severity: IssueSeverity;
}): number {
  const severityWeight: Record<IssueSeverity, number> = {
    error: 1.0,
    warning: 0.4,
    info: 0.1,
    // Back-compat
    critical: 1.0,
    high: 0.7,
    medium: 0.4,
    low: 0.1,
  };
  const categoryWeight: Record<string, number> = {
    seo: 0.4,
    performance: 0.4,
    nextjs: 0.2,
  };
  return (
    (severityWeight[issue.severity] || 0) *
    (categoryWeight[issue.category] || 0)
  );
}

function getTopImprovements<
  T extends {
    id: string;
    category: 'seo' | 'performance' | 'nextjs';
    severity: IssueSeverity;
    rule_id?: string | null;
  }
>(issues: T[], limit: number): T[] {
  const seenRules = new Set<string>();
  const ranked = [...issues]
    .sort((a, b) => {
      const impactDiff = getIssueImpact(b) - getIssueImpact(a);
      if (impactDiff !== 0) return impactDiff;
      const aRule = a.rule_id || '';
      const bRule = b.rule_id || '';
      return aRule.localeCompare(bRule);
    })
    .filter((issue) => {
      const key = issue.rule_id || issue.id;
      if (seenRules.has(key)) return false;
      seenRules.add(key);
      return true;
    });

  return ranked.slice(0, limit);
}

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
    lighthouseData: unknown;
  };
  issues: Array<{
    id: string;
    category: 'seo' | 'performance' | 'nextjs';
    severity: IssueSeverity;
    rule_id: string;
    title: string;
    message: string;
    fix_suggestion?: string;
    fix_code?: string;
    metadata?: Record<string, unknown>;
  }>;
}

export default function ScanResultPage() {
  const params = useParams<{ id?: string | string[] }>();
  const scanId =
    typeof params.id === 'string'
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : '';

  const [data, setData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<
    'seo' | 'performance' | 'nextjs'
  >('seo');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { error: showError, success: showSuccess } = useToast();

  useEffect(() => {
    if (!scanId) return;

    let interval: ReturnType<typeof setInterval> | null = null;
    let stopped = false;

    const fetchScan = async () => {
      if (stopped) return;
      try {
        const response = await fetch(`/api/scans/${scanId}`);
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
          stopped = true;
          if (interval) clearInterval(interval);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load results';
        setError(message);
        showError(message);
        setLoading(false);
        stopped = true;
        if (interval) clearInterval(interval);
      }
    };

    // Poll every 2 seconds
    interval = setInterval(fetchScan, 2000);
    fetchScan();

    return () => {
      stopped = true;
      if (interval) clearInterval(interval);
    };
  }, [scanId, showError]);

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
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200';
      case 'warning':
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200';
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    showSuccess('Copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const jumpToIssue = (
    issueId: string,
    category: 'seo' | 'performance' | 'nextjs'
  ) => {
    setSelectedTab(category);
    setTimeout(() => {
      const el = document.getElementById(`issue-${issueId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Loading State
  if (loading && !data) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Audit Results
        </h1>
        <div className="flex flex-col items-center justify-center rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 py-16">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-4 text-lg text-blue-700 dark:text-blue-200">
            Scanning your website...
          </p>
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-300">
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Audit Results
        </h1>
        <div className="flex gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-6">
          <AlertCircle className="h-6 w-6 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-200">
              {error || 'Scan not found'}
            </p>
            <Link
              href="/scan"
              className="mt-3 inline-block text-red-700 dark:text-red-300 hover:underline"
            >
              Start a new audit
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { scan, issues } = data;

  const auditMetadata = parseAuditMetadata(scan.lighthouseData);
  const performance = auditMetadata.performance;
  const seo = auditMetadata.seo;
  const nextjs = auditMetadata.nextjs;

  const severityCounts = issues.reduce((acc, issue) => {
    const key = issue.severity;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Partial<Record<IssueSeverity, number>>);

  const topImprovements = getTopImprovements(issues, 5);
  const metricSuggestions = getScoreSuggestions({
    performance,
    seo,
    nextjs,
    limit: 5,
  });

  // Pending/Running State
  if (scan.status === 'pending' || scan.status === 'running') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Audit in Progress
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">{scan.url}</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30 py-16">
          <Loader className="h-8 w-8 animate-spin text-yellow-600" />
          <p className="mt-4 text-lg text-yellow-700 dark:text-yellow-200">
            Scanning your website...
          </p>
          <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-300">
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Audit Failed
          </h1>
          <Link
            href="/scan"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Link>
        </div>
        <div className="flex gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-6">
          <AlertCircle className="h-6 w-6 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-200">
              Audit Failed
            </p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Audit Results
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">{scan.url}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Completed{' '}
            {new Date(scan.completedAt || scan.createdAt).toLocaleString()}
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

      {/* Overall Score */}
      {scan.overallScore !== null && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Overall Score
              </p>
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
                  stroke="currentColor"
                  className="text-gray-200 dark:text-gray-700"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="currentColor"
                  className="text-blue-600 dark:text-blue-500"
                  strokeWidth="8"
                  strokeDasharray={`${(scan.overallScore / 100) * 339.3} 339.3`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(scan.overallScore)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  out of 100
                </p>
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
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700'
                }`}
              >
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {cat.label}
                </p>
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

      {/* Detailed Metrics */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Detailed Metrics
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Overview */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Overview
            </p>
            <div className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center justify-between">
                <span>Total issues</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {issues.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Critical</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {(severityCounts.error || 0) +
                    (severityCounts.critical || 0) +
                    (severityCounts.high || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Warnings</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {(severityCounts.warning || 0) + (severityCounts.medium || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Info</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {(severityCounts.info || 0) + (severityCounts.low || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Performance
            </p>
            <div className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center justify-between">
                <span>LCP</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatSecondsFromMs(performance?.lcpMs)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>CLS</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatNumber(performance?.clsScore, 3)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>TTFB</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatMs(performance?.ttfbMs)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Speed Index</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatSecondsFromMs(performance?.speedIndex)}
                </span>
              </div>
            </div>
          </div>

          {/* SEO / Next.js */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              SEO & Next.js
            </p>
            <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  SEO
                </p>
                <div className="flex items-center justify-between">
                  <span>Title</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {seo?.title ? `${seo.title.length} chars` : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Description</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {seo?.description ? `${seo.description.length} chars` : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Canonical</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {seo?.canonical ? 'Present' : seo ? 'Missing' : '-'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Next.js
                </p>
                <div className="flex items-center justify-between">
                  <span>Uses next/image</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatBool(nextjs?.usesNextImage)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Uses next/font</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatBool(nextjs?.usesNextFont)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Uses Metadata API</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatBool(nextjs?.usesMetadataApi)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How to improve score */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            How to get a higher score
          </h2>
          {topImprovements.length > 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Top {topImprovements.length} highest-impact fixes
            </p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Suggestions based on metrics
            </p>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {topImprovements.length > 0 ? (
            topImprovements.map((issue) => (
              <div
                key={issue.id}
                className="rounded-lg border border-gray-200 dark:border-gray-800 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getSeverityColor(
                          issue.severity
                        )}`}
                      >
                        {issue.severity.toUpperCase()}
                      </span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {issue.category === 'nextjs'
                          ? 'Next.js'
                          : issue.category.charAt(0).toUpperCase() +
                            issue.category.slice(1)}
                      </span>
                    </div>

                    <p className="mt-2 font-semibold text-gray-900 dark:text-gray-100">
                      {issue.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {issue.fix_suggestion || issue.message}
                    </p>
                  </div>

                  <button
                    onClick={() => jumpToIssue(issue.id, issue.category)}
                    className="shrink-0 text-sm text-blue-600 hover:underline"
                  >
                    View issue
                  </button>
                </div>
              </div>
            ))
          ) : metricSuggestions.length > 0 ? (
            metricSuggestions.map((s) => (
              <div
                key={`${s.category}-${s.title}`}
                className="rounded-lg border border-gray-200 dark:border-gray-800 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {s.category === 'nextjs'
                          ? 'Next.js'
                          : s.category.charAt(0).toUpperCase() +
                            s.category.slice(1)}
                      </span>
                    </div>
                    <p className="mt-2 font-semibold text-gray-900 dark:text-gray-100">
                      {s.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {s.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              No specific improvement opportunities detected from the available
              metrics.
            </p>
          )}
        </div>
      </div>

      {/* Issues by Category */}
      {issues.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Issues Found
          </h2>

          {/* Category Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
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
                      : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
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
                  id={`issue-${issue.id}`}
                  className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6"
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
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {issue.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        {issue.message}
                      </p>

                      {issue.fix_suggestion && (
                        <div className="mt-3 rounded-md bg-blue-50 dark:bg-blue-950/30 p-3">
                          <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                            Suggestion:
                          </p>
                          <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                            {issue.fix_suggestion}
                          </p>
                        </div>
                      )}

                      {issue.fix_code && (
                        <div className="mt-3 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
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
        <div className="flex flex-col items-center justify-center rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 py-12">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
          <p className="mt-4 text-lg font-semibold text-green-800 dark:text-green-200">
            No Major Issues Found!
          </p>
          <p className="mt-2 text-sm text-green-700 dark:text-green-300">
            Your site is in excellent shape.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <PDFExport scanId={scan.id} />
        <MDExport mode="scanId" scanId={scan.id} />
        <Link
          href="/history"
          className="rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          View History
        </Link>
        <Link
          href="/scan"
          className="rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
        >
          Run Another Audit
        </Link>
      </div>
    </div>
  );
}
