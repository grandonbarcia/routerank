'use client';

import { Header } from '@/components/layout/header';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl">
          <div className="flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-200 bg-white">
              <nav className="space-y-2 p-4">
                <Link
                  href="/dashboard"
                  className={`block rounded-md px-4 py-2 font-medium ${
                    isActive('/dashboard') && pathname === '/dashboard'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/scan"
                  className={`block rounded-md px-4 py-2 font-medium ${
                    isActive('/scan')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  New Scan
                </Link>
                <Link
                  href="/history"
                  className={`block rounded-md px-4 py-2 font-medium ${
                    isActive('/history')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  History
                </Link>
                <Link
                  href="/settings"
                  className={`block rounded-md px-4 py-2 font-medium ${
                    isActive('/settings')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Settings
                </Link>
              </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">{children}</main>
          </div>
        </div>
      </div>
    </>
  );
}
