'use client';

import Link from 'next/link';
import { signUp } from '@/lib/auth/actions';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOAuthLoading] = useState(false);
  const { error: showError, success: showSuccess } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await signUp({
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    });

    if (result?.error) {
      setError(result.error);
      showError('Error', result.error);
      setLoading(false);
      return;
    }

    if (result?.success) {
      showSuccess(
        'Sign Up Successful!',
        result.message || 'Please check your email to confirm'
      );
      setSuccess(true);
    }
    setLoading(false);
  };

  const handleGitHubSignUp = async () => {
    setOAuthLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        showError('OAuth Error', error.message);
        setOAuthLoading(false);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'GitHub sign up failed';
      showError('Error', message);
      setOAuthLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Check Your Email
        </h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          We&apos;ve sent a confirmation email to verify your account. Please
          click the link in the email to continue.
        </p>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Once confirmed, you&apos;ll be able to sign in to your account.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-2 text-white font-semibold hover:bg-blue-700"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Create Your Account
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Start auditing your Next.js sites for free
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="••••••••"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Minimum 8 characters
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        <label className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            required
            className="mr-2 h-4 w-4 rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-blue-600 focus:ring-blue-500"
          />
          I agree to the Terms of Service and Privacy Policy
        </label>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-950/30 p-3">
            <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 flex items-center">
        <div className="flex-1 border-t border-gray-300 dark:border-gray-700" />
        <span className="px-2 text-sm text-gray-500 dark:text-gray-400">
          Or
        </span>
        <div className="flex-1 border-t border-gray-300 dark:border-gray-700" />
      </div>

      <button
        type="button"
        onClick={handleGitHubSignUp}
        disabled={oauthLoading}
        className="mt-4 w-full flex items-center justify-center gap-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.547 2.914 1.186.092-.923.35-1.546.636-1.901-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.138 18.163 20 14.413 20 10c0-5.523-4.477-10-10-10z"
            clipRule="evenodd"
          />
        </svg>
        {oauthLoading ? 'Connecting...' : 'Sign up with GitHub'}
      </button>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-blue-600 hover:text-blue-500"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
