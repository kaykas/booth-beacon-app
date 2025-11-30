'use client';

import { useEffect } from 'react';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
const fraunces = Fraunces({ subsets: ['latin'] });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-neutral-900 flex items-center justify-center p-4`}>
        <div className="bg-white p-12 rounded-2xl shadow-2xl max-w-md w-full text-center">
          <h2 className={`${fraunces.className} text-3xl font-bold text-red-600 mb-4`}>
            Critical System Failure
          </h2>
          <p className="text-neutral-600 mb-8">
            The application encountered a critical error and cannot recover automatically.
          </p>
          <button
            onClick={() => reset()}
            className="bg-neutral-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-neutral-800 transition w-full"
          >
            Reboot System
          </button>
        </div>
      </body>
    </html>
  );
}
