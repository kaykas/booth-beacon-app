import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Camera, MapPin, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl max-w-lg w-full border border-neutral-200">
        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Camera className="w-10 h-10 text-neutral-400" />
        </div>
        
        <h1 className="font-display text-4xl font-semibold text-neutral-900 mb-2">
          Page Not Found
        </h1>
        
        <p className="text-neutral-500 mb-8 text-lg">
          Looks like this photo booth has moved or doesn't exist anymore. 
          Let's get you back to developing some memories.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/map">
              <MapPin className="w-4 h-4 mr-2" />
              Find a Booth
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="mt-8 text-sm text-neutral-400 font-mono">
        Error 404 • Booth Beacon
      </div>
    </div>
  );
}
