import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'RouteRank pricing for Next.js SEO & performance audits. Start free, upgrade to Pro for unlimited scans, or Agency for white-label reports.',
  openGraph: {
    title: 'Pricing | RouteRank',
    description:
      'Start free, upgrade to Pro for unlimited scans, or Agency for white-label reports.',
    url: '/pricing',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    title: 'Pricing | RouteRank',
    description:
      'Start free, upgrade to Pro for unlimited scans, or Agency for white-label reports.',
    images: ['/twitter-image'],
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
