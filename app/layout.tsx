import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/layout/header';

const siteName = 'RouteRank';
const defaultTitle = 'RouteRank - SEO & Performance Audits for Next.js';
const defaultDescription =
  'Next.js-specific SEO audits and performance insights with actionable fixes for metadata, Core Web Vitals, and App Router best practices.';

async function resolveSiteUrl(): Promise<URL> {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return new URL(envUrl);

  const hdrs = await headers();
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host');
  const proto = hdrs.get('x-forwarded-proto') ?? 'https';

  if (host) return new URL(`${proto}://${host}`);
  return new URL('http://localhost:3000');
}

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = await resolveSiteUrl();

  return {
    metadataBase: siteUrl,
    applicationName: siteName,
    title: {
      default: defaultTitle,
      template: `%s | ${siteName}`,
    },
    description: defaultDescription,
    keywords: [
      'Next.js SEO',
      'Next.js audit',
      'Core Web Vitals',
      'technical SEO',
      'App Router',
      'performance audit',
      'RouteRank',
    ],
    creator: siteName,
    publisher: siteName,
    alternates: {
      canonical: './',
    },
    icons: {
      icon: [
        { url: '/icon.svg', type: 'image/svg+xml' },
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon.ico' },
      ],
      apple: ['/apple-icon'],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = (await resolveSiteUrl()).origin;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl.replace(/\/$/, '')}/#organization`,
        name: siteName,
        url: siteUrl,
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl.replace(/\/$/, '')}/#website`,
        url: siteUrl,
        name: siteName,
        publisher: { '@id': `${siteUrl.replace(/\/$/, '')}/#organization` },
      },
      {
        '@type': 'SoftwareApplication',
        name: siteName,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          category: 'Free',
        },
      },
    ],
  };

  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <Script
          id="structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
