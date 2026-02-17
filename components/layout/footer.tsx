export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Product
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a
                  href="#features"
                  className="hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Features
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Company
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a
                  href="#"
                  className="hover:text-gray-900 dark:hover:text-gray-100"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Blog
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Legal
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a
                  href="#"
                  className="hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Terms
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Social
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a
                  href="#"
                  className="hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-gray-900 dark:hover:text-gray-100"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-8">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            © 2026 RouteRank. All rights reserved. Built with Next.js.
          </p>
        </div>
      </div>
    </footer>
  );
}
