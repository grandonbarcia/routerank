'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface ScanResult {
  id: string;
  url: string;
  status: string;
  scores?: {
    seo: number;
    performance: number;
    nextjs: number;
    overall: number;
  };
  grade?: string;
  issues?: Array<{
    category: string;
    severity: string;
    issue: string;
    recommendation: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function ScanResultPage({ params }: { params: { id: string } }) {
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { error: showError } = useToast();

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const response = await fetch(`/api/scans/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch scan results');
        }
        const data = await response.json();
        setScan(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load results';
        setError(message);
        showError('Error', message);
      } finally {
        setLoading(false);
      }
    };

    // Poll for results if status is in_progress
    const interval = setInterval(fetchScan, 2000);
    fetchScan();

    return () => clearInterval(interval);
  }, [params.id, showError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading scan results...</p>
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Scan Results</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">{error || 'Scan not found'}</p>
          <Link
            href="/dashboard/scan"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            Start new audit
          </Link>
        </div>
      </div>
    );
  }

  if (scan.status === 'in_progress') {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Scan in Progress</h1>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-700">
            Your audit of <code className="bg-white px-2 py-1">{scan.url}</code>{' '}
            is still running.
          </p>
          <p className="mt-2 text-sm text-yellow-600">
            This page will automatically refresh every 2 seconds. Full audits
            typically take 2-3 minutes due to performance analysis. Please
            wait...
          </p>
          <div className="mt-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-yellow-300 border-t-yellow-600"></div>
        </div>
      </div>
    );
  }

  const getGradeColor = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case 'A':
        return 'text-green-600';
      case 'B':
        return 'text-blue-600';
      case 'C':
        return 'text-yellow-600';
      case 'D':
        return 'text-orange-600';
      default:
        return 'text-red-600';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 80) return 'bg-blue-50 border-blue-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    if (score >= 60) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scan Results</h1>
          <p className="mt-2 text-gray-600">{scan.url}</p>
        </div>
        <Link
          href="/dashboard/scan"
          className="rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
        >
          Run Another Audit
        </Link>
      </div>

      {/* Overall Score */}
      {scan.scores && (
        <div
          className={`rounded-lg border p-8 ${getScoreColor(
            scan.scores.overall
          )}`}
        >
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Score</p>
              <p
                className={`text-5xl font-bold ${getGradeColor(
                  scan.grade || 'F'
                )}`}
              >
                {Math.round(scan.scores.overall)}
              </p>
            </div>
            <div
              className={`text-6xl font-bold ${getGradeColor(
                scan.grade || 'F'
              )}`}
            >
              {scan.grade || 'F'}
            </div>
          </div>
        </div>
      )}

      {/* Category Scores */}
      {scan.scores && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'SEO', score: scan.scores.seo, icon: '📊' },
            {
              label: 'Performance',
              score: scan.scores.performance,
              icon: '⚡',
            },
            { label: 'Next.js', score: scan.scores.nextjs, icon: '▲' },
          ].map((cat) => (
            <div
              key={cat.label}
              className={`rounded-lg border p-6 ${getScoreColor(cat.score)}`}
            >
              <p className="text-sm font-medium text-gray-600">
                {cat.icon} {cat.label}
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {Math.round(cat.score)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Issues List */}
      {scan.issues && scan.issues.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Issues Found</h2>
          {scan.issues.map((issue, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getSeverityColor(
                    issue.severity
                  )}`}
                >
                  {issue.severity.toUpperCase()}
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{issue.issue}</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {issue.recommendation}
                  </p>
                  <p className="mt-2 text-xs text-gray-500 uppercase tracking-wide">
                    {issue.category}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {scan.issues && scan.issues.length === 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
          <p className="text-green-700">
            🎉 No major issues found! Your site is in great shape.
          </p>
        </div>
      )}

      {/* Metadata */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <p className="text-xs text-gray-600">
          Audited on {new Date(scan.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
