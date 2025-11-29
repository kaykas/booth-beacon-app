'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Home, MapPin, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Booth page error:', error);

    // In production, you could send this to an error tracking service
    if (process.env.NODE_ENV === 'production' && error.digest) {
      console.error('Error digest:', error.digest);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>

          <h1 className="font-display text-2xl font-semibold text-neutral-900 mb-2">
            Something Went Wrong
          </h1>

          <p className="text-neutral-600 mb-6">
            We encountered an error while loading this booth page. This might be a temporary issue.
          </p>

          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="w-full mb-6 p-4 bg-neutral-100 rounded-lg text-left">
              <p className="text-xs text-neutral-600 font-mono break-words">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-neutral-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              onClick={reset}
              className="flex-1"
              variant="default"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>

            <Button
              asChild
              variant="outline"
              className="flex-1"
            >
              <Link href="/map">
                <MapPin className="w-4 h-4 mr-2" />
                Browse Map
              </Link>
            </Button>
          </div>

          <Button
            asChild
            variant="ghost"
            className="mt-4"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
