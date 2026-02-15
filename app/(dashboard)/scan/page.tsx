'use client';

import { ScanForm } from '@/components/scan/scan-form';
import { ScoreCard } from '@/components/scan/score-card';
import { IssueCard, type IssueData } from '@/components/scan/issue-card';
import { MDExport } from '@/components/scan/md-export';
import type { AuditReport } from '@/lib/audit/execute';
import { useState } from 'react';
import { Search, Code2, Zap, CheckCircle2 } from 'lucide-react';

type PerformanceMetrics = {
  lcpMs?: number;
  clsScore?: number;
  fidMs?: number;
  ttfbMs?: number;
  speedIndex?: number;
};

type TechTag = {
  name: string;
  category?: string;
  confidence?: string;
};

type TechStackResult = {
  tags?: TechTag[];
};

export default function ScanPage() {
  const [guestReport, setGuestReport] = useState<{
    report: AuditReport;
    url: string;
  } | null>(null);
  const [selectedTab, setSelectedTab] = useState<
    'seo' | 'performance' | 'nextjs'
  >('seo');

  const handleGuestScanComplete = (report: AuditReport, url: string) => {
    setGuestReport({ report, url });
  };

  if (!guestReport) {
    return (
      <div className="space-y-6">
        {/* User Status Banner */}
        <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-4 border border-green-200 dark:border-green-900">
          <p className="text-sm text-green-800 dark:text-green-200">
            <CheckCircle2 className="inline h-4 w-4 mr-2" />
            Free mode: no login required.
          </p>
        </div>
        <ScanForm onGuestScanComplete={handleGuestScanComplete} />
      </div>
    );
  }

  // Guest results view
  const { report, url } = guestReport;
  const totalIssues = report.totalIssues ?? report.issues.length;
  const criticalIssues =
    report.criticalIssues ??
    report.issues.filter((i) => i.severity === 'critical').length;

  const severityCounts = {
    critical: report.issues.filter((i) => i.severity === 'critical').length,
    high: report.issues.filter((i) => i.severity === 'high').length,
    medium: report.issues.filter((i) => i.severity === 'medium').length,
    low: report.issues.filter((i) => i.severity === 'low').length,
  };

  const performanceMetrics = (report.metadata?.performance ??
    {}) as PerformanceMetrics;

  const tech = (report.metadata?.tech ?? {}) as TechStackResult;
  const techTags = Array.isArray(tech.tags) ? tech.tags : [];

  const nextjsDetected =
    (report.metadata?.nextjs as { detected?: boolean } | undefined)
      ?.detected === true;

  const activeTab =
    nextjsDetected || selectedTab !== 'nextjs' ? selectedTab : 'seo';

  const formatMs = (ms?: number) =>
    typeof ms === 'number' && Number.isFinite(ms)
      ? `${(ms / 1000).toFixed(1)}s`
      : '—';

  const formatNumber = (val?: number, digits: number = 3) =>
    typeof val === 'number' && Number.isFinite(val) ? val.toFixed(digits) : '—';
  const issuesByCategory = {
    seo: report.issues.filter((i) => i.category === 'seo'),
    performance: report.issues.filter((i) => i.category === 'performance'),
    nextjs: report.issues.filter((i) => i.category === 'nextjs'),
  };

  const currentIssues = issuesByCategory[activeTab];

  const mapIssueToData = (issue: (typeof report.issues)[0]): IssueData => ({
    id: issue.rule,
    category: issue.category,
    severity: issue.severity as 'critical' | 'high' | 'medium' | 'low',
    rule_id: issue.rule,
    title: issue.message,
    message: issue.suggestion,
    fix_suggestion: issue.suggestion,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Scan Results
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Scanned: <span className="font-mono text-sm">{url}</span>
          </p>

          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tech stack (detected)
            </p>
            {techTags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {techTags.map((tag) => (
                  <span
                    key={`${tag.name}-${tag.category ?? 'other'}`}
                    className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-700 dark:text-gray-300"
                    title={
                      tag.category
                        ? `${tag.name} • ${tag.category}${tag.confidence ? ` • ${tag.confidence}` : ''}`
                        : tag.name
                    }
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Not detected
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <MDExport mode="report" report={report} url={url} />
          <button
            onClick={() => setGuestReport(null)}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            New Scan
          </button>
        </div>
      </div>

      {/* Score Cards */}
      <div
        className={`grid gap-6 ${nextjsDetected ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}
      >
        <ScoreCard
          label="SEO"
          score={report.scores.seo}
          icon={<Search className="h-8 w-8 text-blue-600" />}
        />
        <ScoreCard
          label="Performance"
          score={report.scores.performance}
          icon={<Zap className="h-8 w-8 text-orange-500" />}
        />
        {nextjsDetected && (
          <ScoreCard
            label="Next.js"
            score={report.scores.nextjs}
            icon={<Code2 className="h-8 w-8 text-purple-600" />}
          />
        )}
      </div>

      {/* Overall Summary */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Overall Score: {Math.round(report.scores.overall)}/100 (Grade:{' '}
          {report.scores.grade})
        </h2>
        <p className="text-gray-600 dark:text-gray-400">{report.summary}</p>
      </div>

      {/* Detailed Metrics */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Detailed Metrics
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Checked{' '}
              {report.checkedAt
                ? new Date(report.checkedAt).toLocaleString()
                : '—'}
              {report.isQuickAudit ? ' • Quick audit' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total issues
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalIssues}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {criticalIssues} critical
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Severity
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-500">Critical</p>
                <p className="font-semibold text-red-600 dark:text-red-400">
                  {severityCounts.critical}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-500">High</p>
                <p className="font-semibold text-orange-600 dark:text-orange-400">
                  {severityCounts.high}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-500">Medium</p>
                <p className="font-semibold text-yellow-700 dark:text-yellow-300">
                  {severityCounts.medium}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-500">Low</p>
                <p className="font-semibold text-blue-600 dark:text-blue-400">
                  {severityCounts.low}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Categories
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">SEO</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {issuesByCategory.seo.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Performance
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {issuesByCategory.performance.length}
                </span>
              </div>
              {nextjsDetected && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Next.js
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {issuesByCategory.nextjs.length}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Core Web Vitals
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">LCP</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {formatMs(performanceMetrics.lcpMs)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">CLS</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {formatNumber(performanceMetrics.clsScore, 3)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">TTFB</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {formatMs(performanceMetrics.ttfbMs)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Performance
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Speed Index
                </span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {formatMs(performanceMetrics.speedIndex)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Audit mode
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {report.isQuickAudit ? 'Quick' : 'Full'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Report issues
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {totalIssues}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Issues Tabs */}
      <div>
        <div className="border-b border-gray-200 dark:border-gray-800">
          <nav className="flex gap-8">
            <button
              onClick={() => setSelectedTab('seo')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'seo'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              SEO Issues ({issuesByCategory.seo.length})
            </button>
            <button
              onClick={() => setSelectedTab('performance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'performance'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Performance Issues ({issuesByCategory.performance.length})
            </button>
            {nextjsDetected && (
              <button
                onClick={() => setSelectedTab('nextjs')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === 'nextjs'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Next.js Issues ({issuesByCategory.nextjs.length})
              </button>
            )}
          </nav>
        </div>

        {/* Issues List */}
        <div className="mt-6 space-y-4">
          {currentIssues.length === 0 ? (
            <div className="text-center py-12 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No {activeTab} issues found! Great job! 🎉
              </p>
            </div>
          ) : (
            currentIssues.map((issue) => (
              <IssueCard key={issue.rule} issue={mapIssueToData(issue)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
