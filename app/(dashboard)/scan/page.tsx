'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function ScanPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const {
    error: showError,
    success: showSuccess,
    loading: showLoading,
  } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      showLoading('Starting audit... This may take a few moments');

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, fullAudit: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data.error || 'Failed to start audit';
        setError(errorMessage);
        showError('Error', errorMessage);
        setLoading(false);
        return;
      }

      const data = await response.json();
      showSuccess('Audit Started', 'Check your dashboard or email for results');

      // Redirect to history page or specific scan page
      setTimeout(() => {
        router.push('/dashboard/history');
      }, 2000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to start audit';
      setError(message);
      showError('Error', message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">New Site Audit</h1>

      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-gray-200 bg-white p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-gray-700"
              >
                Website URL
              </label>
              <input
                type="url"
                id="url"
                name="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                placeholder="https://example.com"
                disabled={loading}
                className="mt-2 block w-full rounded-md border border-gray-300 px-4 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
              <p className="mt-2 text-sm text-gray-500">
                Enter the full URL of the website you want to audit. We&apos;ll
                check SEO, performance, and Next.js best practices.
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !url}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Starting Audit...' : 'Start Audit'}
            </button>
          </form>

          <div className="mt-8 border-t border-gray-200 pt-8">
            <h3 className="text-sm font-semibold text-gray-900">
              What we audit:
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>✓ SEO metadata and structure</li>
              <li>✓ Core Web Vitals and performance metrics</li>
              <li>✓ Next.js App Router best practices</li>
              <li>✓ Image optimization</li>
              <li>✓ Font and script loading strategies</li>
            </ul>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-8">
            <h3 className="text-sm font-semibold text-gray-900">
              How it works:
            </h3>
            <ol className="mt-4 space-y-2 text-sm text-gray-600">
              <li>1. Enter your website URL above</li>
              <li>2. We&apos;ll fetch your page and analyze it</li>
              <li>
                3. Results show within 2-3 minutes (performance check takes
                time)
              </li>
              <li>4. Get detailed recommendations for improvement</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
