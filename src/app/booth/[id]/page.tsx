import { Metadata } from 'next';

interface BoothDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: BoothDetailPageProps): Promise<Metadata> {
  // TODO: Fetch booth data to generate metadata
  return {
    title: `Booth Details | Booth Beacon`,
    description: 'Discover details about this analog photo booth',
  };
}

export default function BoothDetailPage({ params }: BoothDetailPageProps) {
  const { id } = params;

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="font-display text-4xl font-semibold text-neutral-900 mb-4">
          Booth Detail
        </h1>
        <p className="text-neutral-700 mb-8">
          Booth ID: <span className="font-mono text-sm">{id}</span>
        </p>

        <div className="space-y-8">
          {/* Hero Gallery Placeholder */}
          <div className="bg-neutral-100 rounded-lg p-12 text-center">
            <p className="text-neutral-500">Hero photo gallery will be rendered here</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Key Info Card */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="font-display text-2xl font-medium mb-4">Machine Details</h2>
                <p className="text-neutral-500">Machine information will display here</p>
              </div>

              {/* Description */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="font-display text-2xl font-medium mb-4">About This Booth</h2>
                <p className="text-neutral-500">Description and historical notes</p>
              </div>

              {/* Photo Gallery */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="font-display text-2xl font-medium mb-4">Photos</h2>
                <p className="text-neutral-500">User-submitted photos and sample strips</p>
              </div>

              {/* Reviews */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="font-display text-2xl font-medium mb-4">Reviews & Tips</h2>
                <p className="text-neutral-500">Community reviews will display here</p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Location & Directions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-lg mb-4">Location</h3>
                <p className="text-neutral-500">Map and directions</p>
              </div>

              {/* Operator Info */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-lg mb-4">Operator</h3>
                <p className="text-neutral-500">Operator information</p>
              </div>

              {/* Nearby Booths */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-lg mb-4">Nearby Booths</h3>
                <p className="text-neutral-500">Other booths within 5km</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
