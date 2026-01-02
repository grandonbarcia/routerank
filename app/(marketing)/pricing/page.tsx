import { PRICING } from '@/lib/constants';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="space-y-20 px-4 py-20 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
          Simple, Transparent Pricing
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Choose the plan that fits your needs. Always upgrade, downgrade, or
          cancel anytime.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
        {Object.entries(PRICING).map(([key, plan]) => (
          <div
            key={key}
            className={`rounded-lg border-2 p-8 ${
              key === 'pro' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
            <div className="mt-4">
              <span className="text-4xl font-bold text-gray-900">
                ${plan.price}
              </span>
              {plan.price > 0 && <span className="text-gray-600">/month</span>}
            </div>
            <p className="mt-2 text-sm text-gray-600">Billed monthly</p>

            <ul className="mt-6 space-y-4">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center text-gray-700">
                  <svg
                    className="mr-2 h-5 w-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href={key === 'free' ? '/scan' : '/signup'}
              className={`mt-8 block rounded-md py-2 text-center font-semibold transition-colors ${
                key === 'pro'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'border-2 border-gray-300 text-gray-900 hover:border-gray-400'
              }`}
            >
              {key === 'free' ? 'Start Scanning' : 'Get Started'}
            </Link>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900">
          Frequently Asked Questions
        </h2>
        <div className="mt-8 space-y-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">
              Can I change my plan anytime?
            </h3>
            <p className="mt-2 text-gray-600">
              Yes! You can upgrade, downgrade, or cancel your subscription at
              any time.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">
              What does the free tier include?
            </h3>
            <p className="mt-2 text-gray-600">
              The free tier includes 1 scan per day with full SEO and
              performance audits.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">
              Do you offer refunds?
            </h3>
            <p className="mt-2 text-gray-600">
              We offer a 30-day money-back guarantee for annual plans. Monthly
              plans can be canceled anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
