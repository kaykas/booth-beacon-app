'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { BoothCard } from '@/components/booth/BoothCard';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Booth } from '@/types';

interface SearchFilters {
  query: string;
  city: string;
  country: string;
  machineModel: string;
  status: string[];
  hasPhotos: boolean | null;
  acceptsCash: boolean | null;
  acceptsCard: boolean | null;
}

interface FilterOptions {
  cities: string[];
  countries: string[];
  machineModels: string[];
}

interface PaginationInfo {
  page: number;
  perPage: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  from: number;
  to: number;
}

function SearchPageContent() {
  const searchParams = useSearchParams();

  // State
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    city: searchParams.get('city') || '',
    country: searchParams.get('country') || '',
    machineModel: searchParams.get('model') || '',
    status: searchParams.get('status')?.split(',').filter(Boolean) || [],
    hasPhotos: searchParams.get('hasPhotos') === 'true' ? true : searchParams.get('hasPhotos') === 'false' ? false : null,
    acceptsCash: searchParams.get('cash') === 'true' ? true : null,
    acceptsCard: searchParams.get('card') === 'true' ? true : null,
  });

  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [booths, setBooths] = useState<Booth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter options state
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    cities: [],
    countries: [],
    machineModels: [],
  });
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);

  // Load filter options on mount (cached server-side)
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const response = await fetch('/api/search/filter-options');
        if (!response.ok) throw new Error('Failed to fetch filter options');
        const data = await response.json();
        setFilterOptions(data);
      } catch (error) {
        console.error('Error loading filter options:', error);
      } finally {
        setIsLoadingFilters(false);
      }
    }

    loadFilterOptions();
  }, []);

  // Perform search with pagination
  const performSearch = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (filters.query.trim()) params.set('q', filters.query.trim());
      if (filters.city) params.set('city', filters.city);
      if (filters.country) params.set('country', filters.country);
      if (filters.machineModel) params.set('model', filters.machineModel);
      if (filters.status.length > 0) params.set('status', filters.status.join(','));
      if (filters.hasPhotos !== null) params.set('hasPhotos', String(filters.hasPhotos));
      if (filters.acceptsCash !== null) params.set('cash', String(filters.acceptsCash));
      if (filters.acceptsCard !== null) params.set('card', String(filters.acceptsCard));
      params.set('page', String(page));

      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setBooths(data.booths || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Search error:', error);
      setBooths([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Search with debounce for text queries, immediate for filter changes
  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);

    // Debounce text search, immediate for other filters
    const hasTextQuery = filters.query.trim().length > 0;
    const delay = hasTextQuery ? 300 : 0;

    const searchTimeout = setTimeout(() => {
      performSearch(1);
    }, delay);

    return () => clearTimeout(searchTimeout);
  }, [filters, performSearch]);

  // Handle page changes
  useEffect(() => {
    performSearch(currentPage);
  }, [currentPage, performSearch]);

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.query) params.set('q', filters.query);
    if (filters.city) params.set('city', filters.city);
    if (filters.country) params.set('country', filters.country);
    if (filters.machineModel) params.set('model', filters.machineModel);
    if (filters.status.length > 0) params.set('status', filters.status.join(','));
    if (filters.hasPhotos !== null) params.set('hasPhotos', String(filters.hasPhotos));
    if (filters.acceptsCash !== null) params.set('cash', String(filters.acceptsCash));
    if (filters.acceptsCard !== null) params.set('card', String(filters.acceptsCard));
    if (currentPage > 1) params.set('page', String(currentPage));

    const queryString = params.toString();
    const newUrl = queryString ? `/search?${queryString}` : '/search';

    window.history.replaceState({}, '', newUrl);
  }, [filters, currentPage]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      query: '',
      city: '',
      country: '',
      machineModel: '',
      status: [],
      hasPhotos: null,
      acceptsCash: null,
      acceptsCard: null,
    });
    setCurrentPage(1);
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.city) count++;
    if (filters.country) count++;
    if (filters.machineModel) count++;
    if (filters.status.length > 0) count += filters.status.length;
    if (filters.hasPhotos !== null) count++;
    if (filters.acceptsCash !== null) count++;
    if (filters.acceptsCard !== null) count++;
    return count;
  }, [filters]);

  // Toggle status filter
  const toggleStatus = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }));
  };

  // Pagination controls
  const goToPage = (page: number) => {
    if (pagination && page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 bg-background">
        {/* Search Header */}
        <section className="bg-card border-b border-border py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Search Photo Booths</h1>
            <p className="text-muted-foreground mb-6">
              Find authentic analog photo booths worldwide
            </p>

            {/* Search Input */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by booth name, city, country, or address..."
                  value={filters.query}
                  onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                  className="pl-10 pr-10 h-12 text-base"
                />
                {filters.query && (
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, query: '' }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </span>
                ) : pagination ? (
                  <span>
                    Showing {pagination.from}-{pagination.to} of {pagination.totalCount} {pagination.totalCount === 1 ? 'booth' : 'booths'}
                  </span>
                ) : (
                  <span>No results</span>
                )}
              </p>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear all filters
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Filters Panel */}
        {showFilters && (
          <section className="border-b border-border bg-card">
            <div className="max-w-6xl mx-auto px-4 py-6">
              {isLoadingFilters ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading filters...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Location Filters */}
                  <div>
                    <Label className="mb-2 block font-semibold">Location</Label>
                    <div className="space-y-2">
                      <Select
                        value={filters.country}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, country: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Countries</SelectItem>
                          {filterOptions.countries.map(country => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={filters.city}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, city: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="City" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Cities</SelectItem>
                          {filterOptions.cities.map(city => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Machine Model Filter */}
                  <div>
                    <Label className="mb-2 block font-semibold">Machine Type</Label>
                    <Select
                      value={filters.machineModel}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, machineModel: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Models" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Models</SelectItem>
                        {filterOptions.machineModels.map(model => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <Label className="mb-2 block font-semibold">Status</Label>
                    <div className="space-y-2">
                      {['active', 'unverified', 'inactive'].map(status => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={`status-${status}`}
                            checked={filters.status.includes(status)}
                            onCheckedChange={() => toggleStatus(status)}
                          />
                          <label
                            htmlFor={`status-${status}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment & Photos */}
                  <div>
                    <Label className="mb-2 block font-semibold">Features</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="has-photos"
                          checked={filters.hasPhotos === true}
                          onCheckedChange={(checked) =>
                            setFilters(prev => ({ ...prev, hasPhotos: checked ? true : null }))
                          }
                        />
                        <label
                          htmlFor="has-photos"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Has Photos
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="accepts-cash"
                          checked={filters.acceptsCash === true}
                          onCheckedChange={(checked) =>
                            setFilters(prev => ({ ...prev, acceptsCash: checked ? true : null }))
                          }
                        />
                        <label
                          htmlFor="accepts-cash"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Accepts Cash
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="accepts-card"
                          checked={filters.acceptsCard === true}
                          onCheckedChange={(checked) =>
                            setFilters(prev => ({ ...prev, acceptsCard: checked ? true : null }))
                          }
                        />
                        <label
                          htmlFor="accepts-card"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Accepts Card
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Results Grid */}
        <section className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : booths.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {booths.map(booth => (
                    <BoothCard key={booth.id} booth={booth} variant="default" />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {/* Show first page */}
                      {currentPage > 3 && (
                        <>
                          <Button
                            variant={1 === currentPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => goToPage(1)}
                          >
                            1
                          </Button>
                          {currentPage > 4 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                        </>
                      )}

                      {/* Show pages around current */}
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          const distance = Math.abs(page - currentPage);
                          return distance <= 2 || page === 1 || page === pagination.totalPages;
                        })
                        .filter(page => page !== 1 && page !== pagination.totalPages)
                        .map(page => (
                          <Button
                            key={page}
                            variant={page === currentPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => goToPage(page)}
                          >
                            {page}
                          </Button>
                        ))}

                      {/* Show last page */}
                      {currentPage < pagination.totalPages - 2 && (
                        <>
                          {currentPage < pagination.totalPages - 3 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={pagination.totalPages === currentPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => goToPage(pagination.totalPages)}
                          >
                            {pagination.totalPages}
                          </Button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-2">No booths found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search or filters
                </p>
                {activeFilterCount > 0 && (
                  <Button onClick={clearFilters} variant="outline">
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
