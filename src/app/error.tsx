'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl max-w-lg w-full border border-neutral-200">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        <h2 className="font-display text-3xl font-semibold text-neutral-900 mb-2">
          Something went wrong!
        </h2>

        <p className="text-neutral-500 mb-8">
          The machine jammed. We apologize for the inconvenience. 
          Our technicians have been notified.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} size="lg" className="w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>

          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Link>
          </Button>
        </div>

        {error.digest && (
          <div className="mt-8 p-3 bg-neutral-100 rounded text-xs text-neutral-400 font-mono break-all">
            Reference ID: {error.digest}
          </div>
        )}
      </div>
    </div>
  );
}
