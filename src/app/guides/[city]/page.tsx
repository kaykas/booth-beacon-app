import { Metadata } from 'next';

interface CityGuidePageProps {
  params: {
    city: string;
  };
}

export async function generateMetadata({ params }: CityGuidePageProps): Promise<Metadata> {
  const cityName = decodeURIComponent(params.city);
  return {
    title: `${cityName} Photo Booth Tour | Booth Beacon`,
    description: `Discover the best analog photo booths in ${cityName} with our curated walking tour guide.`,
  };
}

export default function CityGuidePage({ params }: CityGuidePageProps) {
  const cityName = decodeURIComponent(params.city);

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-7xl mx-auto p-8">
        {/* Hero Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="bg-neutral-100 h-64 flex items-center justify-center">
            <p className="text-neutral-500">City hero image will display here</p>
          </div>
          <div className="p-8">
            <h1 className="font-display text-4xl font-semibold text-neutral-900 mb-2">
              The {cityName} Photo Booth Tour
            </h1>
            <p className="text-neutral-600 text-lg">
              12 booths • 4 neighborhoods • 5 hours
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Route Map */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-display text-2xl font-medium mb-4">Route Map</h2>
              <div className="bg-neutral-100 rounded-lg p-12 text-center">
                <p className="text-neutral-500">Interactive map with numbered markers and walking route</p>
              </div>
            </div>

            {/* Booth Stops */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-display text-2xl font-medium mb-4">Booth Stops</h2>
              <p className="text-neutral-500">Numbered list of booths in recommended order</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Practical Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-4">Practical Info</h3>
              <ul className="space-y-3 text-sm text-neutral-600">
                <li>
                  <span className="font-medium text-neutral-900">Best time:</span> Weekend mornings
                </li>
                <li>
                  <span className="font-medium text-neutral-900">Payment:</span> Bring quarters
                </li>
                <li>
                  <span className="font-medium text-neutral-900">Duration:</span> 4-6 hours
                </li>
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition">
                  Open in Google Maps
                </button>
                <button className="w-full px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition">
                  Download GPX
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
