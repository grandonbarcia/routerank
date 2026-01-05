import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/layout/header';

export const metadata: Metadata = {
  title: 'RouteRank - SEO & Performance Audits for Next.js',
  description:
    'Actionable SEO audits and performance insights built specifically for Next.js App Router',
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
