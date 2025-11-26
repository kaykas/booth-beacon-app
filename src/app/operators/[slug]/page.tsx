import { Metadata } from 'next';

interface OperatorPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: OperatorPageProps): Promise<Metadata> {
  const operatorName = decodeURIComponent(params.slug);
  return {
    title: `${operatorName} | Booth Beacon`,
    description: `Discover the story behind ${operatorName} and find their photo booths around the world.`,
  };
}

export default function OperatorPage({ params }: OperatorPageProps) {
  const operatorSlug = params.slug;

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-neutral-100 rounded-lg flex items-center justify-center">
              <p className="text-neutral-500 text-sm">Logo</p>
            </div>
            <div className="flex-1">
              <h1 className="font-display text-4xl font-semibold text-neutral-900 mb-2">
                Operator Name
              </h1>
              <p className="text-neutral-600 text-lg mb-4">
                Preserving analog photography culture since 1985
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-neutral-700">
                  <span className="font-medium">42</span> booths
                </span>
                <span className="text-neutral-300">•</span>
                <span className="text-neutral-700">
                  <span className="font-medium">8</span> cities
                </span>
                <span className="text-neutral-300">•</span>
                <span className="text-neutral-700">
                  <span className="font-medium">5</span> countries
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Story */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-display text-2xl font-medium mb-4">Our Story</h2>
              <div className="prose prose-neutral max-w-none">
                <p className="text-neutral-700 leading-relaxed">
                  The founding story and mission of this operator will display here. This section tells
                  the story of the people preserving photo booths and their philosophy.
                </p>
              </div>
            </div>

            {/* Map of Locations */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-display text-2xl font-medium mb-4">Our Locations</h2>
              <div className="bg-neutral-100 rounded-lg p-12 text-center mb-4">
                <p className="text-neutral-500">Map showing all operator booth locations</p>
              </div>
            </div>

            {/* Featured Booths */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-display text-2xl font-medium mb-4">Featured Booths</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-neutral-50 rounded-lg p-4">
                    <div className="bg-neutral-200 h-32 rounded mb-3"></div>
                    <h3 className="font-medium text-neutral-900">Booth {i}</h3>
                    <p className="text-sm text-neutral-600">City, Country</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-4">Connect</h3>
              <div className="space-y-3">
                <a
                  href="#"
                  className="block px-4 py-2 text-center border border-neutral-300 rounded-lg hover:bg-neutral-50 transition"
                >
                  Visit Website
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-center border border-neutral-300 rounded-lg hover:bg-neutral-50 transition"
                >
                  Follow on Instagram
                </a>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-4">Statistics</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-neutral-500">Founded</dt>
                  <dd className="text-lg font-medium text-neutral-900">1985</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-500">Headquarters</dt>
                  <dd className="text-lg font-medium text-neutral-900">Berlin, Germany</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-500">Specialization</dt>
                  <dd className="text-lg font-medium text-neutral-900">Chemical B&W</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
