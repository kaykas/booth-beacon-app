import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore the Map | Booth Beacon',
  description: 'Discover analog photo booths around the world on our interactive map.',
};

export default function MapPage() {
  return (
    <div className="min-h-screen bg-secondary">
      {/* Header will go here */}
      <div className="p-8">
        <h1 className="font-display text-4xl font-semibold text-neutral-900 mb-4">
          Explore the Map
        </h1>
        <p className="text-neutral-700 mb-8">
          Full-screen interactive map with booth discovery
        </p>

        <div className="bg-neutral-100 rounded-lg p-12 text-center">
          <p className="text-neutral-500">Map component will be rendered here</p>
          <p className="text-sm text-neutral-400 mt-2">
            Google Maps integration with custom markers, clustering, and filter panel
          </p>
        </div>
      </div>
    </div>
  );
}
