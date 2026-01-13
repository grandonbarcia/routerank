'use client';

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-16 text-gray-900 dark:text-gray-50">
        <div className="mx-auto max-w-7xl">
          <div className="flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <nav className="space-y-2 p-4">
                <Link
                  href="/dashboard"
                  className={`block rounded-md px-4 py-2 font-medium ${
                    isActive('/dashboard') && pathname === '/dashboard'
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/scan"
                  className={`block rounded-md px-4 py-2 font-medium ${
                    isActive('/scan')
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  New Scan
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
