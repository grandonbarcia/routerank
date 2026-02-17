'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  CheckCircle2,
  Globe,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import type { AuditReport } from '@/lib/audit/execute';

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
  deepTechDetect: z.boolean().default(false),
});

type ScanFormInputs = z.input<typeof scanFormSchema>;
type ScanFormData = z.output<typeof scanFormSchema>;

interface ScanFormProps {
  onGuestScanComplete?: (report: AuditReport, url: string) => void;
}

export function ScanForm({ onGuestScanComplete }: ScanFormProps = {}) {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const { success, error } = useToast();

  const form = useForm<ScanFormInputs>({
    resolver: zodResolver(scanFormSchema),
    defaultValues: {
      url: '',
      fullAudit: true,
      deepTechDetect: false,
    },
  });

  const urlValue = useWatch({ control: form.control, name: 'url' });
  const fullAudit = useWatch({ control: form.control, name: 'fullAudit' });
  const deepTechDetect = useWatch({
    control: form.control,
    name: 'deepTechDetect',
  });

  const onSubmit = async (values: ScanFormInputs) => {
    setLoading(true);
    setSubmitError(null);

    try {
      const data: ScanFormData = scanFormSchema.parse(values);

      const normalizedUrl = data.url.startsWith('http')
        ? data.url
        : `https://${data.url}`;

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: normalizedUrl,
          fullAudit: data.fullAudit,
          deepTechDetect: data.deepTechDetect,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || 'Failed to start scan';
        setSubmitError(errorMessage);
        error(errorMessage);
        setLoading(false);
        return;
      }

      // Guest scan (immediate report returned)
      if (result.guest && result.report) {
        const remaining = result?.rateLimit?.daily?.remaining;

        success(
          'Analysis complete',
          typeof remaining === 'number'
            ? `${Math.max(0, remaining)} free scans remaining today.`
            : 'Scan results ready.',
        );

        setLoading(false);
        if (onGuestScanComplete) {
          onGuestScanComplete(result.report, result.url || normalizedUrl);
        }
        return;
      }

      // Background scan mode fallback
      if (result.scanId) {
        success('Scan initiated', 'Redirecting to detailed report...');
        setTimeout(() => router.push(`/scan/${result.scanId}`), 500);
        return;
      }

      setSubmitError('Unexpected response from server');
      error('Error', 'Unexpected response from server');
      setLoading(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to start scan';
      setSubmitError(message);
      error('Scan failed', message);
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label
                  htmlFor="url"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Website URL
                </label>
                <div className="relative mt-2">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    id="url"
                    placeholder="example.com or https://example.com"
                    disabled={loading}
                    autoComplete="url"
                    inputMode="url"
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 pl-9 pr-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    {...form.register('url')}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Enter the full URL (https:// is optional). We&apos;ll audit
                  SEO, performance, and Next.js best practices.
                </p>
                {form.formState.errors.url?.message ? (
                  <p className="mt-2 text-sm font-medium text-red-700 dark:text-red-200">
                    {String(form.formState.errors.url.message)}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="fullAudit"
                    checked={!!fullAudit}
                    onChange={(e) =>
                      form.setValue('fullAudit', e.target.checked, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                    disabled={loading}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="fullAudit"
                    className="text-sm text-gray-700 dark:text-gray-200"
                  >
                    Full audit (includes performance metrics - takes ~2-3
                    minutes)
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="deepTechDetect"
                    checked={!!deepTechDetect}
                    onChange={(e) =>
                      form.setValue('deepTechDetect', e.target.checked, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                    disabled={loading}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="deepTechDetect"
                    className="text-sm text-gray-700 dark:text-gray-200"
                  >
                    Deep tech detection (slower, detects JS frameworks)
                  </label>
                </div>
              </div>

              {submitError ? (
                <div className="flex gap-3 rounded-md bg-red-50 dark:bg-red-950/30 p-4">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-700 dark:text-red-200">
                    {submitError}
                  </p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading || !urlValue?.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting Audit...
                  </>
                ) : (
                  <>
                    Start Audit <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
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
                <span>Tech stack detection</span>
              </li>
            </ul>
          </div>

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
