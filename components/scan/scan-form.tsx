'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { AuditReport } from '@/lib/audit/execute';

// Validation schema
const scanFormSchema = z.object({
  url: z
    .string()
    .min(1, 'URL is required')
    .transform((val) => {
      if (!val.startsWith('http://') && !val.startsWith('https://')) {
        return `https://${val}`;
      }
      return val;
    })
    .pipe(z.string().url('Please enter a valid URL'))
    .refine((url) => {
      try {
        const urlObj = new URL(url);
        return urlObj.hostname && !urlObj.hostname.includes('localhost');
      } catch {
        return false;
      }
    }, 'Please enter a valid public URL (localhost is not supported)'),
  fullAudit: z.boolean().default(true),
});

type ScanFormInputs = z.input<typeof scanFormSchema>;
type ScanFormData = z.output<typeof scanFormSchema>;

interface ScanFormProps {
  onGuestScanComplete?: (report: AuditReport, url: string) => void;
}

export function ScanForm({ onGuestScanComplete }: ScanFormProps = {}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { error: showError, success: showSuccess } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ScanFormInputs>({
    resolver: zodResolver(scanFormSchema),
    defaultValues: {
      url: '',
      fullAudit: true,
    },
  });

  const fullAudit = watch('fullAudit');

  const onSubmit = async (values: ScanFormInputs) => {
    setLoading(true);
    try {
      const data: ScanFormData = scanFormSchema.parse(values);

      // Normalize URL
      const normalizedUrl = data.url.startsWith('http')
        ? data.url
        : `https://${data.url}`;

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: normalizedUrl,
          fullAudit: data.fullAudit,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || 'Failed to start scan';
        showError(errorMessage);
        setLoading(false);
        return;
      }

      // Guest scan (immediate report returned)
      if (result.guest && result.report) {
        showSuccess('Scan complete!');
        setLoading(false);
        if (onGuestScanComplete) {
          onGuestScanComplete(result.report, result.url || normalizedUrl);
        }
        return;
      }

      // Authenticated scan (background processing with scanId)
      if (result.scanId) {
        showSuccess(`Scan started! Analyzing your site...`);
        setTimeout(() => {
          router.push(`/scan/${result.scanId}`);
        }, 500);
        return;
      }

      showError('Unexpected response from server');
      setLoading(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to start scan';
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* URL Input */}
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
                  placeholder="example.com or https://example.com"
                  disabled={isSubmitting}
                  {...register('url')}
                  className={`mt-2 block w-full rounded-md border px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition ${
                    errors.url
                      ? 'border-red-500 dark:border-red-500 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-blue-500'
                  }`}
                />
                {errors.url && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.url.message}
                  </p>
                )}
                {!errors.url && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Enter the full URL (https:// is optional). We&apos;ll audit
                    SEO, performance, and Next.js best practices.
                  </p>
                )}
              </div>

              {/* Full Audit Checkbox */}
              <div className="flex items-center gap-3 rounded-md bg-blue-50 dark:bg-blue-950/20 p-4">
                <input
                  type="checkbox"
                  id="fullAudit"
                  disabled={isSubmitting}
                  {...register('fullAudit')}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <label
                    htmlFor="fullAudit"
                    className="text-sm font-medium text-gray-900 dark:text-gray-100 block"
                  >
                    Full Audit (Includes Performance Metrics)
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {fullAudit
                      ? 'Includes Lighthouse analysis (takes ~2-3 minutes)'
                      : 'Quick SEO and Next.js checks only (~30 seconds)'}
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full rounded-md bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isSubmitting || loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Starting Audit...
                  </span>
                ) : (
                  'Start Audit'
                )}
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
