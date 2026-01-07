import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next.js SEO Audits',
  description:
    'SEO audits built for Next.js: metadata validation, OpenGraph, robots tags, heading structure, Core Web Vitals, and App Router best practices.',
  openGraph: {
    title: 'Next.js SEO Audits | RouteRank',
    description:
      'Audit your Next.js site for SEO + performance with App Router-aware checks and actionable fixes.',
    url: '/marketing',
  },
  twitter: {
    title: 'Next.js SEO Audits | RouteRank',
    description:
      'Audit your Next.js site for SEO + performance with App Router-aware checks and actionable fixes.',
  },
};

export default function Home() {
  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            SEO Audits Built for Next.js
          </h1>
          <p className="mt-6 text-xl text-gray-600">
            Generic SEO tools treat Next.js like static HTML. RouteRank
            understands routes, layouts, metadata, images, fonts, and
            client/server boundaries.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-8 py-3 text-lg font-semibold text-white hover:bg-blue-700"
            >
              Start Scanning Free
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-8 py-3 text-lg font-semibold text-gray-900 hover:bg-gray-50"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">
            What We Audit
          </h2>
          <div className="mt-12 grid gap-12 md:grid-cols-3">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                SEO Audits
              </h3>
              <p className="mt-2 text-gray-600">
                Title & meta description validation, OpenGraph tags, robots meta
                tags, heading structure, image alt text, and more.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Performance
              </h3>
              <p className="mt-2 text-gray-600">
                Lighthouse metrics (LCP, CLS, INP), image optimization, font
                loading, script strategies, and resource analysis.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Next.js Best Practices
              </h3>
              <p className="mt-2 text-gray-600">
                Metadata API usage, next/image optimization, next/font
                detection, route depth analysis, and App Router checks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-blue-600 px-8 py-12 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to audit your site?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Free tier includes 1 scan per day. Upgrade to Pro for unlimited
            scans.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-md bg-white px-8 py-3 font-semibold text-blue-600 hover:bg-blue-50"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  );
}
