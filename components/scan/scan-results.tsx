'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import type { AuditReport } from '@/lib/audit/execute';
import { MDExport } from '@/components/scan/md-export';
import { PDFExport } from '@/components/scan/pdf-export';
import { TechBadge } from '@/components/scan/tech-badge';
import { cn } from '@/lib/utils';

// Type definitions (reused)
type PerformanceMetrics = {
  lcpMs?: number;
  clsScore?: number;
  fidMs?: number;
  ttfbMs?: number;
  speedIndex?: number;
};

type NextjsMetadata = {
  // Current shape (from lib/audit/execute.ts): metadata.nextjs = nextjsResult.checks
  detected?: boolean;
  usesNextImage?: boolean;
  usesNextFont?: boolean;
  usesMetadataApi?: boolean;
  hasServerComponents?: boolean;

  // Back-compat: some callers may wrap checks under a `checks` key
  checks?: {
    detected?: boolean;
    usesNextImage?: boolean;
    usesNextFont?: boolean;
    usesMetadataApi?: boolean;
    hasServerComponents?: boolean;
  };
};

type SeoIndexability = {
  robotsMeta?: string | null;
  googlebotMeta?: string | null;
  xRobotsTag?: string | null;
  resolvedCanonical?: string | null;
  canonicalSameOrigin?: boolean | null;
  isNoindex?: boolean;
  isNofollow?: boolean;
};

type SeoSecurity = {
  score?: number;
  present?: Record<string, boolean>;
  xFrameOptions?: boolean;
  xContentTypeOptions?: boolean;
  strictTransportSecurity?: boolean;
  contentSecurityPolicy?: boolean;
};

type SeoAccessibility = {
  imagesMissingAlt?: number;
  formControlsMissingLabel?: number;
  buttonsMissingName?: number;
};

type SerializedSeoMetadata = {
  title?: string | null;
  description?: string | null;
  canonical?: string | null;
  viewport?: string | null;
  lang?: string | null;
  indexability?: SeoIndexability;
  security?: SeoSecurity;
  accessibility?: SeoAccessibility;
};

type TechTag = {
  name: string;
  category?: string;
  confidence?: string;
  version?: string;
  evidence?: string;
  evidenceList?: string[];
};

type TechStackResult = {
  tags?: TechTag[];
  signals?: {
    generator?: string;
    server?: string;
    poweredBy?: string;
  };
};

const TECH_CATEGORY_CONFIG: Record<
  string,
  {
    label: string;
    priority: number;
  }
> = {
  framework: { label: 'Frameworks', priority: 1 },
  cms: { label: 'CMS', priority: 2 },
  ecommerce: { label: 'E-commerce', priority: 3 },
  analytics: { label: 'Analytics', priority: 4 },
  server: { label: 'Server', priority: 5 },
  hosting: { label: 'Hosting', priority: 6 },
  cdn: { label: 'CDN', priority: 7 },
  language: { label: 'Languages', priority: 8 },
  library: { label: 'Libraries', priority: 9 },
  other: { label: 'Other', priority: 10 },
};

type MetricStatus = 'good' | 'needs-work' | 'bad' | 'unknown';

function getStatusLabel(status: MetricStatus): string {
  switch (status) {
    case 'good':
      return 'Good';
    case 'needs-work':
      return 'Improve';
    case 'bad':
      return 'Bad';
    default:
      return '—';
  }
}

function getStatusPillClass(status: MetricStatus): string {
  switch (status) {
    case 'good':
      return 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200';
    case 'needs-work':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200';
    case 'bad':
      return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200';
  }
}

function StatusPill(props: { status: MetricStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${getStatusPillClass(
        props.status,
      )}`}
    >
      {getStatusLabel(props.status)}
    </span>
  );
}

function lcpStatus(lcpMs?: number): MetricStatus {
  if (typeof lcpMs !== 'number' || !Number.isFinite(lcpMs)) return 'unknown';
  if (lcpMs <= 2500) return 'good';
  if (lcpMs <= 4000) return 'needs-work';
  return 'bad';
}

function clsStatus(cls?: number): MetricStatus {
  if (typeof cls !== 'number' || !Number.isFinite(cls)) return 'unknown';
  if (cls <= 0.1) return 'good';
  if (cls <= 0.25) return 'needs-work';
  return 'bad';
}

function ttfbStatus(ttfbMs?: number): MetricStatus {
  if (typeof ttfbMs !== 'number' || !Number.isFinite(ttfbMs)) return 'unknown';
  if (ttfbMs <= 800) return 'good';
  if (ttfbMs <= 1800) return 'needs-work';
  return 'bad';
}

function speedIndexStatus(speedIndexMs?: number): MetricStatus {
  if (typeof speedIndexMs !== 'number' || !Number.isFinite(speedIndexMs))
    return 'unknown';
  if (speedIndexMs <= 3400) return 'good';
  if (speedIndexMs <= 5000) return 'needs-work';
  return 'bad';
}

function lengthStatus(params: {
  length?: number | null;
  min: number;
  max: number;
}): MetricStatus {
  const { length, min, max } = params;
  if (typeof length !== 'number' || !Number.isFinite(length)) return 'unknown';
  if (length >= min && length <= max) return 'good';
  return 'needs-work';
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

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-yellow-600';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
}

type Suggestion = {
  title: string;
  detail: string;
  category: 'seo' | 'performance' | 'nextjs';
};

function getScoreSuggestions(params: {
  performance?: PerformanceMetrics;
  seo?: SerializedSeoMetadata;
  nextjs?: NextjsMetadata;
  limit?: number;
}): Suggestion[] {
  const { performance, seo, nextjs, limit = 5 } = params;
  const suggestions: Suggestion[] = [];

  const nextjsDetected =
    nextjs?.detected === true || nextjs?.checks?.detected === true;

  const usesNextImage = nextjs?.usesNextImage ?? nextjs?.checks?.usesNextImage;
  const usesNextFont = nextjs?.usesNextFont ?? nextjs?.checks?.usesNextFont;
  const usesMetadataApi =
    nextjs?.usesMetadataApi ?? nextjs?.checks?.usesMetadataApi;

  if (typeof performance?.lcpMs === 'number' && performance.lcpMs > 2500) {
    suggestions.push({
      category: 'performance',
      title: 'Improve Largest Contentful Paint (LCP)',
      detail:
        'Optimize the largest above-the-fold element, reduce render-blocking resources, and preload critical assets.',
    });
  }

  if (typeof performance?.clsScore === 'number' && performance.clsScore > 0.1) {
    suggestions.push({
      category: 'performance',
      title: 'Reduce Cumulative Layout Shift (CLS)',
      detail:
        'Reserve space for images, set explicit width/height, and avoid injecting content above existing content during load.',
    });
  }

  if (typeof performance?.ttfbMs === 'number' && performance.ttfbMs > 800) {
    suggestions.push({
      category: 'performance',
      title: 'Lower server response time (TTFB)',
      detail:
        'Use caching, reduce server work on initial request, and consider CDN/edge caching for HTML and static assets.',
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
        'Reduce JavaScript and CSS payloads, compress images, and defer non-critical scripts to improve perceived speed.',
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
        'Set rel="canonical" to the preferred URL to reduce duplicate-content risks.',
    });
  }

  if (nextjsDetected) {
    if (usesNextImage === false) {
      suggestions.push({
        category: 'nextjs',
        title: 'Use next/image for images',
        detail:
          'Switch <img> to next/image to get automatic sizing, optimization, and better LCP potential.',
      });
    }

    if (usesNextFont === false) {
      suggestions.push({
        category: 'nextjs',
        title: 'Use next/font for fonts',
        detail:
          'Move font loading to next/font to avoid layout shifts and improve loading behavior.',
      });
    }

    if (usesMetadataApi === false) {
      suggestions.push({
        category: 'nextjs',
        title: 'Adopt the Metadata API',
        detail:
          'Use metadata/generateMetadata for consistent SEO tags across routes in modern Next.js.',
      });
    }
  }

  return suggestions.slice(0, limit);
}

function getIssueImpact(issue: {
  category: 'seo' | 'performance' | 'nextjs';
  severity: 'critical' | 'high' | 'medium' | 'low';
}): number {
  const severityWeight: Record<string, number> = {
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

function getTopImprovements(
  issues: AuditReport['issues'],
  limit: number,
): AuditReport['issues'] {
  const seenRules = new Set<string>();
  const ranked = [...issues]
    .sort((a, b) => {
      const impactDiff = getIssueImpact(b) - getIssueImpact(a);
      if (impactDiff !== 0) return impactDiff;
      return a.rule.localeCompare(b.rule);
    })
    .filter((issue) => {
      if (seenRules.has(issue.rule)) return false;
      seenRules.add(issue.rule);
      return true;
    });

  return ranked.slice(0, limit);
}

type ScanResultsProps = {
  report: AuditReport;
  url: string;
  scanId?: string; // Optional if guest
  onRescan?: () => void;
};

export function ScanResults({
  report,
  url,
  scanId,
  onRescan,
}: ScanResultsProps) {
  const [selectedTab, setSelectedTab] = useState<
    'seo' | 'performance' | 'nextjs'
  >('seo');

  const performance = (report.metadata?.performance ??
    {}) as PerformanceMetrics;
  const seo = (report.metadata?.seo ?? {}) as SerializedSeoMetadata;
  const nextjs = (report.metadata?.nextjs ?? {}) as NextjsMetadata;
  const tech = (report.metadata?.tech ?? {}) as TechStackResult;

  const nextjsDetected =
    nextjs?.detected === true || nextjs?.checks?.detected === true;

  const usesNextImage = nextjs?.usesNextImage ?? nextjs?.checks?.usesNextImage;
  const usesNextFont = nextjs?.usesNextFont ?? nextjs?.checks?.usesNextFont;
  const usesMetadataApi =
    nextjs?.usesMetadataApi ?? nextjs?.checks?.usesMetadataApi;

  const techTags: TechTag[] = useMemo(() => {
    const raw = tech?.tags;
    if (!Array.isArray(raw)) return [];
    // Filter invalid entries + de-dupe by name/category
    const seen = new Set<string>();
    const normalized = raw
      .filter((t): t is TechTag => !!t && typeof t.name === 'string')
      .map((t) => ({
        name: t.name,
        category: t.category,
        confidence: t.confidence,
      }))
      .filter((t) => {
        const key = `${t.name}::${t.category ?? ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    // Sort: category then name for stable display
    normalized.sort((a, b) => {
      const catA = a.category ?? 'other';
      const catB = b.category ?? 'other';
      if (catA !== catB) return catA.localeCompare(catB);
      return a.name.localeCompare(b.name);
    });
    return normalized;
  }, [tech?.tags]);

  const techGroups = useMemo(() => {
    if (techTags.length === 0)
      return [] as Array<{
        key: string;
        label: string;
        tags: TechTag[];
      }>;

    const grouped: Record<string, TechTag[]> = {};
    for (const tag of techTags) {
      const category = tag.category || 'other';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push({ ...tag, category });
    }

    const keys = Object.keys(grouped);
    keys.sort((a, b) => {
      const priA = TECH_CATEGORY_CONFIG[a]?.priority ?? 999;
      const priB = TECH_CATEGORY_CONFIG[b]?.priority ?? 999;
      if (priA !== priB) return priA - priB;
      return a.localeCompare(b);
    });

    return keys.map((key) => ({
      key,
      label: TECH_CATEGORY_CONFIG[key]?.label ?? key,
      tags: grouped[key],
    }));
  }, [techTags]);

  const activeTab =
    nextjsDetected || selectedTab !== 'nextjs' ? selectedTab : 'seo';

  const severityCounts = useMemo(() => {
    return report.issues.reduce(
      (acc, issue) => {
        acc[issue.severity] = (acc[issue.severity] || 0) + 1;
        return acc;
      },
      {} as Partial<Record<'critical' | 'high' | 'medium' | 'low', number>>,
    );
  }, [report.issues]);

  const indexabilityStatus: MetricStatus = seo?.indexability
    ? seo.indexability.isNoindex === true
      ? 'bad'
      : seo.canonical
        ? seo.indexability.isNofollow === true
          ? 'needs-work'
          : 'good'
        : 'needs-work'
    : 'unknown';

  const securityStatus: MetricStatus =
    typeof seo?.security?.score === 'number'
      ? seo.security.score >= 90
        ? 'good'
        : seo.security.score >= 60
          ? 'needs-work'
          : 'bad'
      : 'unknown';

  const a11yStatus: MetricStatus = seo?.accessibility
    ? (seo.accessibility.formControlsMissingLabel ?? 0) >= 1 ||
      (seo.accessibility.buttonsMissingName ?? 0) >= 1 ||
      (seo.accessibility.imagesMissingAlt ?? 0) >= 5
      ? 'bad'
      : (seo.accessibility.imagesMissingAlt ?? 0) >= 1
        ? 'needs-work'
        : 'good'
    : 'unknown';

  const lcpPill = lcpStatus(performance?.lcpMs);
  const clsPill = clsStatus(performance?.clsScore);
  const ttfbPill = ttfbStatus(performance?.ttfbMs);
  const speedIndexPill = speedIndexStatus(performance?.speedIndex);

  const titlePill = lengthStatus({
    length: seo?.title ? seo.title.length : null,
    min: 30,
    max: 60,
  });
  const descriptionPill = lengthStatus({
    length: seo?.description ? seo.description.length : null,
    min: 120,
    max: 160,
  });
  const canonicalPill: MetricStatus = seo
    ? seo.canonical
      ? 'good'
      : 'needs-work'
    : 'unknown';

  const issues = report.issues;
  const topImprovements = getTopImprovements(issues, 5);
  const metricSuggestions = getScoreSuggestions({
    performance,
    seo,
    nextjs,
    limit: 5,
  });

  const [copiedIssueRule, setCopiedIssueRule] = useState<string | null>(null);

  const jumpToIssue = (
    rule: string,
    category: 'seo' | 'performance' | 'nextjs',
  ) => {
    setSelectedTab(category);
    setTimeout(() => {
      const el = document.getElementById(`issue-${rule}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200';
    }
  };

  const checkedAtLabel = useMemo(() => {
    const raw = report.checkedAt;
    if (!raw) return null;
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return raw;
    return dt.toLocaleString();
  }, [report.checkedAt]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Audit Results
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300 break-all">
            {url}
          </p>
          {checkedAtLabel ? (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Completed {checkedAtLabel}
            </p>
          ) : null}
        </div>

        {onRescan ? (
          <button
            type="button"
            onClick={onRescan}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            New Audit
          </button>
        ) : null}
      </div>

      {/* Overall Score */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Overall Score
            </p>
            <p
              className={`text-5xl font-bold ${getScoreColor(report.scores.overall)}`}
            >
              {Math.round(report.scores.overall)}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Grade {report.scores.grade}
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
                strokeDasharray={`${(report.scores.overall / 100) * 339.3} 339.3`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.round(report.scores.overall)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                out of 100
              </p>
            </div>
          </div>
        </div>

        {report.summary ? (
          <p className="mt-6 text-sm text-gray-600 dark:text-gray-300">
            {report.summary}
          </p>
        ) : null}
      </div>

      {/* Tech Stack */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Tech Stack
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Detected frameworks, libraries, and infrastructure.
            </p>
          </div>
        </div>

        {techGroups.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {techGroups.map((group) => (
              <div
                key={group.key}
                className="rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {group.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {group.tags.length}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.tags.map((tag) => (
                    <TechBadge
                      key={`${tag.name}-${tag.category ?? 'other'}`}
                      tag={tag}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            No technologies detected.
          </p>
        )}

        {tech?.signals?.server ||
        tech?.signals?.poweredBy ||
        tech?.signals?.generator ? (
          <div className="mt-4 grid gap-2 text-sm text-gray-700 dark:text-gray-300 md:grid-cols-3">
            <div className="rounded-md border border-gray-200 dark:border-gray-800 p-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Server
              </p>
              <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                {tech?.signals?.server || '-'}
              </p>
            </div>
            <div className="rounded-md border border-gray-200 dark:border-gray-800 p-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                X-Powered-By
              </p>
              <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                {tech?.signals?.poweredBy || '-'}
              </p>
            </div>
            <div className="rounded-md border border-gray-200 dark:border-gray-800 p-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Generator
              </p>
              <p className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                {tech?.signals?.generator || '-'}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Category Scores */}
      <div
        className={cn(
          'grid gap-4',
          nextjsDetected ? 'md:grid-cols-3' : 'md:grid-cols-2',
        )}
      >
        {(
          [
            { label: 'SEO', score: report.scores.seo, key: 'seo' as const },
            {
              label: 'Performance',
              score: report.scores.performance,
              key: 'performance' as const,
            },
            ...(nextjsDetected
              ? [
                  {
                    label: 'Next.js',
                    score: report.scores.nextjs,
                    key: 'nextjs' as const,
                  },
                ]
              : []),
          ] as const
        ).map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedTab(cat.key)}
            className={`rounded-lg border p-6 text-left transition ${
              activeTab === cat.key
                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700'
            }`}
            type="button"
          >
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {cat.label}
            </p>
            <p
              className={`mt-2 text-3xl font-bold ${getScoreColor(cat.score)}`}
            >
              {Math.round(cat.score)}
            </p>
          </button>
        ))}
      </div>

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
                <span title="Total number of issues detected across all categories.">
                  Total issues
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {report.totalIssues ?? issues.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span title="Count of issues with critical or high severity.">
                  Critical
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {(severityCounts.critical || 0) + (severityCounts.high || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span title="Count of issues with medium severity.">
                  Warnings
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {severityCounts.medium || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span title="Count of issues with low severity.">Info</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {severityCounts.low || 0}
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
                <span title="Largest Contentful Paint measures how quickly main content loads.">
                  LCP
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatSecondsFromMs(performance?.lcpMs)}
                  </span>
                  <StatusPill status={lcpPill} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span title="Cumulative Layout Shift measures unexpected visual movement.">
                  CLS
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatNumber(performance?.clsScore, 3)}
                  </span>
                  <StatusPill status={clsPill} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span title="Time to First Byte measures server response time.">
                  TTFB
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatMs(performance?.ttfbMs)}
                  </span>
                  <StatusPill status={ttfbPill} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span title="Speed Index estimates how quickly the page appears visually.">
                  Speed Index
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatSecondsFromMs(performance?.speedIndex)}
                  </span>
                  <StatusPill status={speedIndexPill} />
                </div>
              </div>
            </div>
          </div>

          {/* SEO / Next.js */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {nextjsDetected ? 'SEO & Next.js' : 'SEO'}
            </p>
            <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  SEO
                </p>
                <div className="flex items-center justify-between">
                  <span title="Title tag length is checked against common search snippet guidelines.">
                    Title
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {seo?.title ? `${seo.title.length} chars` : '-'}
                    </span>
                    <StatusPill status={titlePill} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span title="Meta description length is checked against common search snippet guidelines.">
                    Description
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {seo?.description
                        ? `${seo.description.length} chars`
                        : '-'}
                    </span>
                    <StatusPill status={descriptionPill} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span title="Canonical indicates the preferred URL for this page.">
                    Canonical
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {seo?.canonical ? 'Present' : seo ? 'Missing' : '-'}
                    </span>
                    <StatusPill status={canonicalPill} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span title="Whether search engines are allowed to index this page.">
                    Indexable
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {seo?.indexability?.isNoindex === true
                        ? 'No (noindex)'
                        : seo?.indexability
                          ? 'Yes'
                          : '-'}
                    </span>
                    <StatusPill status={indexabilityStatus} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span title="Security headers score reflects the presence of key browser protections.">
                    Security headers
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {typeof seo?.security?.score === 'number'
                        ? `${seo.security.score}%`
                        : '-'}
                    </span>
                    <StatusPill status={securityStatus} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span title="Accessibility snapshot flags missing alt text and labels.">
                    Accessibility
                  </span>
                  <StatusPill status={a11yStatus} />
                </div>
                <div className="flex items-center justify-between">
                  <span title="Count of images missing alternative text.">
                    Images w/o alt
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {typeof seo?.accessibility?.imagesMissingAlt === 'number'
                      ? seo.accessibility.imagesMissingAlt
                      : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span title="Count of form controls missing an accessible label.">
                    Controls w/o label
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {typeof seo?.accessibility?.formControlsMissingLabel ===
                    'number'
                      ? seo.accessibility.formControlsMissingLabel
                      : '-'}
                  </span>
                </div>
              </div>

              {nextjsDetected ? (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Next.js
                  </p>
                  <div className="flex items-center justify-between">
                    <span title="Detects whether the site uses Next.js Image optimization.">
                      Uses next/image
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatBool(usesNextImage)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span title="Detects whether the site uses Next.js font optimization.">
                      Uses next/font
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatBool(usesNextFont)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span title="Detects whether the site uses Next.js Metadata API for SEO.">
                      Uses Metadata API
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatBool(usesMetadataApi)}
                    </span>
                  </div>
                </div>
              ) : null}
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
                key={issue.rule}
                className="rounded-lg border border-gray-200 dark:border-gray-800 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getSeverityColor(
                          issue.severity,
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
                      <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500">
                        {issue.rule}
                      </span>
                    </div>

                    <p className="mt-2 font-semibold text-gray-900 dark:text-gray-100">
                      {issue.message}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {issue.suggestion}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => jumpToIssue(issue.rule, issue.category)}
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
      {issues.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Issues Found
          </h2>

          {/* Category Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
            {(nextjsDetected
              ? (['seo', 'performance', 'nextjs'] as const)
              : (['seo', 'performance'] as const)
            ).map((category) => {
              const count = issues.filter(
                (i) => i.category === category,
              ).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedTab(category)}
                  className={`px-4 py-2 font-medium transition border-b-2 ${
                    activeTab === category
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
                  }`}
                  type="button"
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
              .filter((i) => i.category === activeTab)
              .map((issue) => (
                <div
                  key={issue.rule}
                  id={`issue-${issue.rule}`}
                  className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getSeverityColor(
                        issue.severity,
                      )}`}
                    >
                      {issue.severity.toUpperCase()}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {issue.message}
                        </h3>
                        <button
                          type="button"
                          className="text-xs text-blue-600 hover:text-blue-700"
                          onClick={() => {
                            void navigator.clipboard.writeText(issue.rule);
                            setCopiedIssueRule(issue.rule);
                            setTimeout(() => setCopiedIssueRule(null), 1500);
                          }}
                          title="Copy rule id"
                        >
                          {copiedIssueRule === issue.rule
                            ? 'Copied'
                            : 'Copy rule'}
                        </button>
                      </div>
                      <p className="mt-1 text-xs font-mono text-gray-500 dark:text-gray-400">
                        {issue.rule}
                      </p>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {issue.suggestion}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
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
      <div className="flex flex-wrap gap-4">
        {scanId ? <PDFExport scanId={scanId} /> : null}
        {scanId ? (
          <MDExport mode="scanId" scanId={scanId} />
        ) : (
          <MDExport mode="report" report={report} url={url} />
        )}

        {onRescan ? (
          <button
            type="button"
            onClick={onRescan}
            className="rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
          >
            Run Another Audit
          </button>
        ) : null}
      </div>
    </div>
  );
}
