import { Metadata } from 'next';

interface MachineModelPageProps {
  params: {
    model: string;
  };
}

export async function generateMetadata({ params }: MachineModelPageProps): Promise<Metadata> {
  const modelName = decodeURIComponent(params.model);
  return {
    title: `${modelName} | Booth Beacon`,
    description: `Learn about the ${modelName} photo booth model, its history, and where to find them.`,
  };
}

export default function MachineModelPage({ params }: MachineModelPageProps) {
  const modelName = decodeURIComponent(params.model);

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h1 className="font-display text-4xl font-semibold text-neutral-900 mb-4">
                {modelName}
              </h1>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-neutral-900">Manufacturer</dt>
                  <dd className="text-neutral-600 font-mono">Photo-Me International</dd>
                </div>
                <div>
                  <dt className="font-medium text-neutral-900">Years Produced</dt>
                  <dd className="text-neutral-600 font-mono">1982-1995</dd>
                </div>
                <div>
                  <dt className="font-medium text-neutral-900">Photo Type</dt>
                  <dd className="text-neutral-600 font-mono">Black & White (chemical)</dd>
                </div>
              </dl>
            </div>
            <div className="bg-neutral-100 rounded-lg flex items-center justify-center h-64">
              <p className="text-neutral-500">Reference photo</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-display text-2xl font-medium mb-4">About This Model</h2>
              <p className="text-neutral-700 leading-relaxed">
                Technical specifications and historical significance will display here.
              </p>
            </div>

            {/* Notable Features */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-display text-2xl font-medium mb-4">Notable Features</h2>
              <ul className="list-disc list-inside space-y-2 text-neutral-700">
                <li>Feature 1</li>
                <li>Feature 2</li>
                <li>Feature 3</li>
              </ul>
            </div>

            {/* Collector's Notes */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-display text-2xl font-medium mb-4">Collector's Notes</h2>
              <p className="text-neutral-700">Rarity, value, and preservation information</p>
            </div>

            {/* Map of Locations */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-display text-2xl font-medium mb-4">Where to Find This Model</h2>
              <div className="bg-neutral-100 rounded-lg p-12 text-center mb-4">
                <p className="text-neutral-500">Map showing all booths with this model</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-4">Quick Stats</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-neutral-500">Total Booths</dt>
                  <dd className="text-2xl font-bold text-primary">47</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Countries</dt>
                  <dd className="text-2xl font-bold text-primary">12</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Rarity</dt>
                  <dd className="text-lg font-medium text-accent">Uncommon</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
