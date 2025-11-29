import { Card } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Breadcrumbs Skeleton */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-4 w-12 bg-neutral-200 rounded animate-pulse" />
            <span>/</span>
            <div className="h-4 w-16 bg-neutral-200 rounded animate-pulse" />
            <span>/</span>
            <div className="h-4 w-20 bg-neutral-200 rounded animate-pulse" />
            <span>/</span>
            <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Hero Section Skeleton */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image Skeleton */}
            <div className="relative h-96 lg:h-[600px]">
              <div className="w-full h-full bg-neutral-200 animate-pulse" />
            </div>

            {/* Info Skeleton */}
            <div className="p-8 lg:p-12">
              <div className="mb-4">
                <div className="h-10 w-3/4 bg-neutral-200 rounded animate-pulse mb-4" />
                <div className="h-5 w-1/2 bg-neutral-200 rounded animate-pulse" />
              </div>

              {/* Actions Skeleton */}
              <div className="flex gap-2 mb-8">
                <div className="h-10 w-24 bg-neutral-200 rounded animate-pulse" />
                <div className="h-10 w-24 bg-neutral-200 rounded animate-pulse" />
                <div className="h-10 w-24 bg-neutral-200 rounded animate-pulse" />
              </div>

              {/* Details Skeleton */}
              <div className="space-y-6">
                <div>
                  <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse mb-3" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-neutral-200 rounded animate-pulse" />
                    <div className="h-4 w-full bg-neutral-200 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-neutral-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="h-6 w-48 bg-neutral-200 rounded animate-pulse mb-4" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-neutral-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-neutral-200 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-neutral-200 rounded animate-pulse" />
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="h-5 w-24 bg-neutral-200 rounded animate-pulse mb-4" />
              <div className="h-64 bg-neutral-200 rounded animate-pulse mb-4" />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
