'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PricingTier {
  name: string;
  price: number | 'Custom';
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  stripe_price_id?: string;
}

const tiers: PricingTier[] = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect for trying RouteRank',
    features: [
      '1 scan per day',
      'SEO audit',
      'Next.js best practices check',
      'Basic performance metrics',
      'Email support',
    ],
    cta: 'Get Started',
  },
  {
    name: 'Pro',
    price: 19,
    description: 'For individual developers',
    features: [
      'Unlimited scans',
      'All Free features',
      'Full Lighthouse integration',
      'Core Web Vitals analysis',
      'Export reports (JSON)',
      'Scan history & comparisons',
      'Priority email support',
    ],
    cta: 'Start Free Trial',
    popular: true,
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
  },
  {
    name: 'Agency',
    price: 49,
    description: 'For teams and agencies',
    features: [
      'Unlimited scans',
      'All Pro features',
      'Team workspaces',
      'Client site management',
      'White-label reports',
      'PDF export',
      'API access',
      'Priority phone support',
    ],
    cta: 'Contact Sales',
    stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const { error: showError, success: showSuccess } = useToast();

  const handleCheckout = async (priceId?: string) => {
    if (!priceId) {
      // For free tier or contact sales
      showSuccess('Sign up to get started!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionUrl } = (await response.json()) as {
        sessionId?: string;
        sessionUrl?: string | null;
      };

      if (!sessionUrl) {
        throw new Error('Checkout session URL missing');
      }

      window.location.href = sessionUrl;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Checkout failed';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-16 py-16">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Simple, Transparent Pricing
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Choose the plan that works best for your needs
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-lg border transition-all duration-300 ${
                tier.popular
                  ? 'border-blue-500 bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-blue-500 md:scale-105'
                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
              }`}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8 space-y-6">
                {/* Tier Info */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {tier.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {tier.description}
                  </p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1">
                  {typeof tier.price === 'number' ? (
                    <>
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        ${tier.price}
                      </span>
                      {tier.price > 0 && (
                        <span className="text-gray-600 dark:text-gray-400">
                          /month
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {tier.price}
                    </span>
                  )}
                </div>

                {/* CTA Button */}
                {tier.name === 'Free' ? (
                  <Link
                    href="/signup"
                    className={`block text-center rounded-lg px-4 py-3 font-semibold transition ${
                      tier.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {tier.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() => handleCheckout(tier.stripe_price_id)}
                    disabled={loading}
                    className={`w-full rounded-lg px-4 py-3 font-semibold transition disabled:opacity-50 ${
                      tier.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {loading ? 'Processing...' : tier.cta}
                  </button>
                )}

                {/* Features */}
                <div className="space-y-3 border-t border-gray-200 dark:border-gray-800 pt-6">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {[
            {
              q: 'Can I change my plan anytime?',
              a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
            },
            {
              q: 'Do you offer discounts for annual billing?',
              a: 'Contact our sales team for custom pricing and annual billing options.',
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept all major credit cards, Apple Pay, and Google Pay through Stripe.',
            },
            {
              q: 'Is there a free trial?',
              a: 'Yes! Start with our Free plan with no credit card required. Upgrade anytime.',
            },
          ].map((item, idx) => (
            <details
              key={idx}
              className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 cursor-pointer group"
            >
              <summary className="font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                {item.q}
                <span className="ml-2 inline-block transition group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-400">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
