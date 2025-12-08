export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-50 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="h-8 bg-neutral-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded w-64"></div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image skeleton */}
          <div className="h-96 bg-neutral-200 rounded-lg"></div>

          {/* Details skeleton */}
          <div className="space-y-4">
            <div className="h-6 bg-neutral-200 rounded w-3/4"></div>
            <div className="h-4 bg-neutral-200 rounded w-full"></div>
            <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
            <div className="h-4 bg-neutral-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}