'use client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-16 text-gray-900 dark:text-gray-50">
      <div className="mx-auto max-w-7xl">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
