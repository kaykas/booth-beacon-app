import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Booth Beacon',
  description: 'Manage booths, moderate content, and monitor system health.',
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="font-display text-4xl font-semibold text-neutral-900 mb-8">
          Admin Dashboard
        </h1>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-neutral-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {['Dashboard', 'Health', 'Queue', 'Logs', 'Moderation', 'Settings'].map((tab) => (
                <button
                  key={tab}
                  className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Booths', value: '742', change: '+12 this week' },
            { label: 'Active Crawlers', value: '3', change: 'All healthy' },
            { label: 'Pending Moderation', value: '8', change: '2 new today' },
            { label: 'System Health', value: '98%', change: 'Excellent' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-neutral-500 mb-2">{stat.label}</h3>
              <p className="text-3xl font-bold text-neutral-900 mb-1">{stat.value}</p>
              <p className="text-sm text-neutral-600">{stat.change}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="font-display text-2xl font-medium mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-3 pb-4 border-b border-neutral-100 last:border-0">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-neutral-900">
                      New booth added: <span className="font-medium">Booth Name</span>
                    </p>
                    <p className="text-xs text-neutral-500">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Source Health */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="font-display text-2xl font-medium mb-4">Source Health</h2>
            <div className="space-y-4">
              {[
                { name: 'Classic Photo Booth', status: 'healthy', lastCrawl: '2 hours ago' },
                { name: 'Photomatica', status: 'healthy', lastCrawl: '4 hours ago' },
                { name: 'Photo-Me Locations', status: 'warning', lastCrawl: '2 days ago' },
              ].map((source) => (
                <div key={source.name} className="flex items-center justify-between pb-4 border-b border-neutral-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{source.name}</p>
                    <p className="text-xs text-neutral-500">Last crawl: {source.lastCrawl}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      source.status === 'healthy'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {source.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Moderation Queue */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="font-display text-2xl font-medium mb-4">Moderation Queue</h2>
          <div className="text-center py-12 text-neutral-500">
            <p>User-submitted photos and reviews will appear here for moderation</p>
          </div>
        </div>
      </div>
    </div>
  );
}
