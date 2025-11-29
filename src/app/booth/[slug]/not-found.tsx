import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Search, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-neutral-600">
            <Link href="/" className="hover:text-primary transition">
              Home
            </Link>
            <span>/</span>
            <Link href="/map" className="hover:text-primary transition">
              Booths
            </Link>
            <span>/</span>
            <span className="text-neutral-900">Not Found</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card className="p-8 text-center">
          <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-neutral-400" />
          </div>

          <h1 className="font-display text-3xl font-semibold text-neutral-900 mb-3">
            Booth Not Found
          </h1>

          <p className="text-neutral-600 mb-8 max-w-md mx-auto">
            We couldn&apos;t find the photo booth you&apos;re looking for. It might have been removed,
            or the link might be incorrect.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="default">
              <Link href="/map">
                <MapPin className="w-4 h-4 mr-2" />
                Browse All Booths
              </Link>
            </Button>

            <Button asChild variant="outline">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
          </div>

          <div className="mt-8 pt-8 border-t border-neutral-200">
            <p className="text-sm text-neutral-500 mb-4">
              Know a booth that should be listed?
            </p>
            <Button asChild variant="ghost" size="sm">
              <Link href="/submit">Submit a Booth</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
