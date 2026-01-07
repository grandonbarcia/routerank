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
  },
  twitter: {
    title: 'Pricing | RouteRank',
    description:
      'Start free, upgrade to Pro for unlimited scans, or Agency for white-label reports.',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
