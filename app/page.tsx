import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Gauge,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import { Footer } from '@/components/layout/footer';

const features = [
  {
    title: 'SEO Foundation',
    description:
      'Titles, meta descriptions, OpenGraph tags, headings, and semantic structure — tailored for Next.js.',
    icon: Gauge,
    iconBg: 'bg-blue-100 dark:bg-blue-950',
    iconFg: 'text-blue-600 dark:text-blue-400',
    bullets: ['Metadata validation', 'OpenGraph tags', 'Heading hierarchy'],
  },
  {
    title: 'Performance Metrics',
    description:
      'Lighthouse-oriented performance checks plus practical guidance to improve real-world UX.',
    icon: Zap,
    iconBg: 'bg-orange-100 dark:bg-orange-950',
    iconFg: 'text-orange-600 dark:text-orange-400',
    bullets: [
      'Core Web Vitals signals',
      'Image & resource checks',
      'Actionable recommendations',
    ],
  },
  {
    title: 'Next.js Best Practices',
    description:
      'App Router-aware checks for common pitfalls and patterns that affect SEO and performance.',
    icon: Code2,
    iconBg: 'bg-purple-100 dark:bg-purple-950',
    iconFg: 'text-purple-600 dark:text-purple-400',
    bullets: [
      'App Router structure',
      'Metadata API usage',
      'Rendering & caching cues',
    ],
  },
] as const;

const steps = [
  {
    title: 'Enter a URL',
    description: 'Paste a link and start a scan.',
  },
  {
    title: 'Review the report',
    description: 'See scores, issues, and key metrics.',
  },
  {
    title: 'Fix and re-scan',
    description: 'Apply recommendations and confirm improvements.',
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50 pt-16">
      <section className="relative overflow-hidden px-4 pt-20 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/30 px-4 py-2 w-fit">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                  Built for Next.js developers
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight">
                Your Next.js Site Deserves{' '}
                <span className="bg-linear-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Better SEO
                </span>
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
                RouteRank is Next.js-aware auditing for SEO and performance. Get
                actionable insights that turn into real fixes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/scan"
                  className="group inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-blue-600 to-blue-700 px-8 py-4 text-lg font-semibold text-white hover:shadow-lg transition-all duration-200"
                >
                  Start Scanning Free
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-8 py-4 text-lg font-semibold text-gray-900 dark:text-gray-100 hover:border-blue-600 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Learn More
                </a>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <div className="flex gap-1" aria-label="Five star rating">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Trusted by 500+ developers worldwide
                </p>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-950/40 dark:to-purple-950/40 rounded-2xl blur-2xl opacity-50" />
              <div className="relative bg-linear-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-950 rounded-2xl p-8 border border-blue-100 dark:border-gray-800 shadow-xl">
                <div className="space-y-4">
                  <div className="h-4 bg-linear-to-r from-blue-200 to-blue-300 dark:from-blue-900/40 dark:to-blue-800/40 rounded w-3/4" />
                  <div className="h-4 bg-linear-to-r from-blue-200 to-blue-300 dark:from-blue-900/40 dark:to-blue-800/40 rounded w-2/3" />
                  <div className="pt-8 grid grid-cols-3 gap-4">
                    {['SEO', 'Performance', 'Next.js'].map((label) => (
                      <div
                        key={label}
                        className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-blue-200 dark:border-gray-800"
                      >
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          92
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="px-4 py-20 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Everything We Check
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Built specifically for Next.js — not a generic SEO checklist.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 hover:shadow-lg transition-shadow duration-300"
                >
                  <div
                    className={`h-12 w-12 rounded-lg ${feature.iconBg} flex items-center justify-center mb-6`}
                  >
                    <Icon className={`h-6 w-6 ${feature.iconFg}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {feature.bullets.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="px-4 py-20 sm:px-6 lg:px-8 bg-white dark:bg-gray-950"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              How it works in{' '}
              <span className="bg-linear-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                3 simple steps
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Paste a URL, get a report, apply fixes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <div
                key={step.title}
                className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-linear-to-br from-blue-600 to-blue-700 text-white font-bold flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/scan"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-blue-600 to-blue-700 px-8 py-4 text-lg font-semibold text-white hover:shadow-lg transition-all duration-200"
            >
              Run Your First Audit
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-gray-900 dark:bg-black">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Ready to improve your Next.js SEO?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Get a report in minutes — no signup required.
            </p>
            <Link
              href="/scan"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-gray-900 px-8 py-4 text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Scanning
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
