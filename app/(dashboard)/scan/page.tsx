'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ScanPage() {
  const [url, setUrl] = useState('');
  const [fullAudit, setFullAudit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const router = useRouter();
  const { error: showError, success: showSuccess } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, fullAudit }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to start audit';
        setError(errorMessage);
        showError(errorMessage);
        setLoading(false);
        return;
      }

      setScanId(data.scanId);
      showSuccess(`Scan started! ID: ${data.scanId}`);

      // Redirect to the scan results page
      setTimeout(() => {
        router.push(`/dashboard/scan/${data.scanId}`);
      }, 1000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to start audit';
      setError(message);
      showError(message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Audit Your Website
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Get comprehensive SEO, performance, and Next.js insights
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="url"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Website URL
                </label>
                <input
                  type="text"
                  id="url"
                  name="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  placeholder="example.com or https://example.com"
                  disabled={loading}
                  className="mt-2 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Enter the full URL (https:// is optional). We&apos;ll audit
                  SEO, performance, and Next.js best practices.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="fullAudit"
                  checked={fullAudit}
                  onChange={(e) => setFullAudit(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="fullAudit"
                  className="text-sm text-gray-700 dark:text-gray-200"
                >
                  Full audit (includes performance metrics - takes ~2-3 minutes)
                </label>
              </div>

              {error && (
                <div className="flex gap-3 rounded-md bg-red-50 dark:bg-red-950/30 p-4">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-700 dark:text-red-200">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="w-full rounded-md bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Starting Audit...' : 'Start Audit'}
              </button>
            </form>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          {/* What We Audit */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              What We Audit
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                <span>SEO metadata &amp; structure</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                <span>Core Web Vitals</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                <span>Next.js best practices</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                <span>Image optimization</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                <span>Font &amp; script loading</span>
              </li>
            </ul>
          </div>

          {/* How It Works */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              How It Works
            </h3>
            <ol className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <span className="font-semibold text-gray-900 dark:text-white">
                  1.
                </span>{' '}
                Enter your URL
              </li>
              <li>
                <span className="font-semibold text-gray-900 dark:text-white">
                  2.
                </span>{' '}
                We analyze the page
              </li>
              <li>
                <span className="font-semibold text-gray-900 dark:text-white">
                  3.
                </span>{' '}
                Get detailed results
              </li>
              <li>
                <span className="font-semibold text-gray-900 dark:text-white">
                  4.
                </span>{' '}
                View recommendations
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
