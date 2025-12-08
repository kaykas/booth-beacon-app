'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Booth page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Something went wrong
        </h2>

        <p className="text-neutral-600 mb-6">
          We encountered an error while loading this booth. This booth may have been removed or there may be a temporary issue.
        </p>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Try again
          </button>

          <Link
            href="/map"
            className="block w-full bg-neutral-100 text-neutral-900 py-3 px-4 rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Browse all booths
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-neutral-400">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}