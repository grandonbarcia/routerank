export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-500">Total Scans</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-500">Average SEO Score</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">--</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-500">Scans Today</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">0/1</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <p className="mt-2 text-sm text-gray-600">
          Start a new scan or view your recent audit results.
        </p>
        <div className="mt-4 flex gap-4">
          <a
            href="/scan"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
          >
            New Scan
          </a>
          <a
            href="/history"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-gray-700 font-semibold hover:bg-gray-50"
          >
            View History
          </a>
        </div>
      </div>

      {/* Recent Scans */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Recent Scans</h2>
        <p className="mt-2 text-sm text-gray-600">
          No scans yet. Start your first audit to see results here.
        </p>
      </div>
    </div>
  );
}
