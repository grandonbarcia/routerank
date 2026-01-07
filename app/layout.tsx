import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/layout/header';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const siteName = 'RouteRank';
const defaultTitle = 'RouteRank - SEO & Performance Audits for Next.js';
const defaultDescription =
  'Actionable SEO audits and performance insights built specifically for Next.js App Router';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: ['/apple-icon'],
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName,
    title: defaultTitle,
    description: defaultDescription,
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
    images: ['/twitter-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
