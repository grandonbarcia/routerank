export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Settings
      </h1>

      <div className="grid gap-8">
        {/* Account Settings */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences.
          </p>
          <button className="mt-4 rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
            Edit Profile
          </button>
        </div>

        {/* Billing Settings */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Billing
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your subscription and payment method.
          </p>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Current Plan
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Free - 1 scan/day
              </p>
            </div>
            <button className="rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
              Upgrade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
