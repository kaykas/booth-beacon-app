'use client';

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MapPin, SlidersHorizontal, List, X, Loader2, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BoothMap } from '@/components/booth/BoothMap';
import { BoothCard } from '@/components/booth/BoothCard';
import { SearchBar } from '@/components/SearchBar';
import { supabase } from '@/lib/supabase';
import { Booth, Coordinates } from '@/types';
import { sortBoothsByDistance } from '@/lib/distanceUtils';

interface Filters {
  location?: string;
  photoType?: 'black-and-white' | 'color' | 'both';
  machineModel?: string;
  operator?: string;
  status?: 'active' | 'unverified' | 'all';
  payment?: 'cash' | 'card' | 'both';
}

function MapContent() {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [filteredBooths, setFilteredBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
  });
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [sortingByDistance, setSortingByDistance] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');

  const searchParams = useSearchParams();
  const [autoCenter, setAutoCenter] = useState(false);
  const [shouldCenterOnLoad, setShouldCenterOnLoad] = useState(false);

  useEffect(() => {
    if (searchParams.get('nearme') === 'true') {
      // Don't sort immediately - wait until after map centers to avoid crash
      // setSortByDistance(true); // DEFERRED - will be enabled after centering
      setShouldCenterOnLoad(true);
    }
  }, [searchParams]);

  // Track current viewport for progressive loading
  const [_currentViewport, setCurrentViewport] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);
  const [_isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch booths within viewport bounds
  const fetchBoothsInViewport = useCallback(async (viewport: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => {
    try {
      setIsLoadingMore(true);

      // Build query parameters
      const params = new URLSearchParams({
        north: viewport.north.toString(),
        south: viewport.south.toString(),
        east: viewport.east.toString(),
        west: viewport.west.toString(),
        limit: '1000', // Load more booths per viewport
      });

      // Add filters
      if (filters.status && filters.status !== 'all') {
        params.set('status', filters.status);
      }
      if (filters.photoType && filters.photoType !== 'both') {
        params.set('photoType', filters.photoType);
      }
      if (filters.machineModel) {
        params.set('machineModel', filters.machineModel);
      }
      if (filters.payment) {
        params.set('payment', filters.payment);
      }

      const response = await fetch(`/api/booths/viewport?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch booths');
      }

      const result = await response.json();

      // Merge new booths with existing, avoiding duplicates
      setBooths((prevBooths) => {
        const existingIds = new Set(prevBooths.map(b => b.id));
        const newBooths = result.booths.filter((b: Booth) => !existingIds.has(b.id));
        return [...prevBooths, ...newBooths];
      });

      setCurrentViewport(viewport);
    } catch (error) {
      console.error('Error fetching booths in viewport:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [filters.status, filters.photoType, filters.machineModel, filters.payment]);

  // Initial load: fetch a reasonable starting set of booths using optimized API
  const fetchInitialBooths = useCallback(async () => {
    setLoading(true);

    try {
      // Use viewport API for faster loading with a global viewport
      const params = new URLSearchParams({
        north: '85',
        south: '-85',
        east: '180',
        west: '-180',
        limit: '1000', // Load all booths on initial load
      });

      if (filters.status && filters.status !== 'all') {
        params.set('status', filters.status);
      }

      const response = await fetch(`/api/booths/viewport?${params}`, {
        cache: 'force-cache',
        next: { revalidate: 300 } // Cache for 5 minutes
      });

      if (!response.ok) {
        throw new Error('Failed to fetch booths');
      }

      const result = await response.json();
      setBooths(result.booths || []);
    } catch (error) {
      console.error('Error in fetchInitialBooths:', error);
      setBooths([]);
    } finally {
      setLoading(false);
    }
  }, [filters.status]);

  // Fetch initial booths on mount
  useEffect(() => {
    fetchInitialBooths();
  }, [fetchInitialBooths]);

  // Debounced viewport change handler
  const viewportChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleViewportChange = useCallback((viewport: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => {
    // Clear existing timeout
    if (viewportChangeTimeoutRef.current) {
      clearTimeout(viewportChangeTimeoutRef.current);
    }

    // Set new timeout for debounced fetch (500ms)
    viewportChangeTimeoutRef.current = setTimeout(() => {
      fetchBoothsInViewport(viewport);
    }, 500);
  }, [fetchBoothsInViewport]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (viewportChangeTimeoutRef.current) {
        clearTimeout(viewportChangeTimeoutRef.current);
      }
    };
  }, []);

  // Get user location on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting user location:', error);
        }
      );
    }
  }, []);

  // Enable auto-center once we have user location (for "Near Me" feature)
  useEffect(() => {
    if (shouldCenterOnLoad && userLocation && !autoCenter) {
      setAutoCenter(true);
    }
  }, [shouldCenterOnLoad, userLocation, autoCenter]);

  // Memoized filter application for performance with 100+ booths
  const computedFilteredBooths = useMemo(() => {
    let filtered = [...booths];

    // City filter
    if (selectedCity && selectedCity !== 'all') {
      filtered = filtered.filter((booth) => booth.city === selectedCity);
    }

    // Country filter
    if (selectedCountry && selectedCountry !== 'all') {
      filtered = filtered.filter((booth) => booth.country === selectedCountry);
    }

    // Location filter
    if (filters.location && filters.location.trim()) {
      const searchTerm = filters.location.toLowerCase();
      filtered = filtered.filter(
        (booth) =>
          booth.name.toLowerCase().includes(searchTerm) ||
          booth.city?.toLowerCase().includes(searchTerm) ||
          booth.country.toLowerCase().includes(searchTerm) ||
          booth.address.toLowerCase().includes(searchTerm)
      );
    }

    // Photo type filter
    if (filters.photoType && filters.photoType !== 'both') {
      filtered = filtered.filter((booth) => booth.photo_type === filters.photoType);
    }

    // Machine model filter
    if (filters.machineModel) {
      filtered = filtered.filter((booth) => booth.machine_model === filters.machineModel);
    }

    // Operator filter
    if (filters.operator) {
      filtered = filtered.filter((booth) => booth.operator_name === filters.operator);
    }

    // Payment filter
    if (filters.payment) {
      if (filters.payment === 'cash') {
        filtered = filtered.filter((booth) => booth.accepts_cash);
      } else if (filters.payment === 'card') {
        filtered = filtered.filter((booth) => booth.accepts_card);
      }
    }

    // Sort by distance if enabled and user location available
    if (sortByDistance && userLocation) {
      filtered = sortBoothsByDistance(filtered, userLocation);
    }

    return filtered;
  }, [booths, selectedCity, selectedCountry, filters, sortByDistance, userLocation]);

  // Update filteredBooths when computed value changes - with async handling for distance sorting
  useEffect(() => {
    if (sortByDistance && userLocation && computedFilteredBooths.length > 0) {
      // Show loading state for distance sorting
      setSortingByDistance(true);

      // Defer the state update slightly to allow UI to show loading state
      const timeoutId = setTimeout(() => {
        setFilteredBooths(computedFilteredBooths);
        setSortingByDistance(false);
      }, 50);

      return () => clearTimeout(timeoutId);
    } else {
      setFilteredBooths(computedFilteredBooths);
      setSortingByDistance(false);
    }
  }, [computedFilteredBooths, sortByDistance, userLocation]);

  const clearFilters = useCallback(() => {
    setFilters({ status: 'all' });
    setSelectedCity('all');
    setSelectedCountry('all');
  }, []);

  // Get unique cities and countries for filter dropdowns - memoized for performance
  const cities = useMemo(
    () => Array.from(new Set(booths.map((b) => b.city).filter(Boolean))).sort(),
    [booths]
  );
  const countries = useMemo(
    () => Array.from(new Set(booths.map((b) => b.country).filter(Boolean))).sort(),
    [booths]
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header role="banner" className="bg-card border-b border-primary/10 px-4 py-3 flex items-center gap-4 z-10">
        <Link href="/" className="font-display text-xl font-semibold text-foreground">
          Booth Beacon
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <SearchBar placeholder="Search for a booth, city, or country..." />
        </div>

        {/* Near Me Toggle */}
        <Button
          variant={sortByDistance ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setSortByDistance(!sortByDistance);
            // Center map on user location when enabling Near Me
            if (!sortByDistance && userLocation) {
              setAutoCenter(true);
            }
          }}
          disabled={!userLocation || sortingByDistance}
          title={!userLocation ? 'Enable location to use this feature' : sortingByDistance ? 'Calculating distances...' : 'Sort by distance and center map'}
        >
          {sortingByDistance ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 mr-2" />
          )}
          {sortingByDistance ? 'Calculating...' : 'Near Me'}
        </Button>

        {/* Filter Toggle */}
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
        </Button>

        {/* View Toggle */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={view === 'map' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('map')}
          >
            <MapPin className="w-4 h-4 mr-1" />
            Map
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('list')}
          >
            <List className="w-4 h-4 mr-1" />
            List
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" role="main" className="flex-1 flex overflow-hidden">
        {/* Filter Panel */}
        {showFilters && (
          <aside className="w-80 bg-card border-r border-primary/10 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-lg text-foreground">Filters</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Country Filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Country
                </label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City Filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  City
                </label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Status
                </label>
                <Select
                  value={filters.status}
                  onValueChange={(value: string) => setFilters({ ...filters, status: value as 'active' | 'unverified' | 'all' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Booths</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Photo Type Filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Photo Type
                </label>
                <Select
                  value={filters.photoType || 'both'}
                  onValueChange={(value: string) =>
                    setFilters({ ...filters, photoType: value === 'both' ? undefined : value as 'black-and-white' | 'color' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">All Types</SelectItem>
                    <SelectItem value="black-and-white">Black & White</SelectItem>
                    <SelectItem value="color">Color</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Machine Model Filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Machine Model
                </label>
                <Select
                  value={filters.machineModel || 'all'}
                  onValueChange={(value) =>
                    setFilters({ ...filters, machineModel: value === 'all' ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Models" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    <SelectItem value="Photo-Me Model 9">Photo-Me Model 9</SelectItem>
                    <SelectItem value="Photo-Me Model 11">Photo-Me Model 11</SelectItem>
                    <SelectItem value="Photomatic Deluxe">Photomatic Deluxe</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Payment Type
                </label>
                <Select
                  value={filters.payment || 'both'}
                  onValueChange={(value: string) =>
                    setFilters({ ...filters, payment: value === 'both' ? undefined : value as 'cash' | 'card' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Any Payment</SelectItem>
                    <SelectItem value="cash">Cash Only</SelectItem>
                    <SelectItem value="card">Card Accepted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters */}
              {(selectedCountry !== 'all' ||
                selectedCity !== 'all' ||
                filters.location ||
                filters.photoType ||
                filters.machineModel ||
                filters.operator ||
                (filters.status && filters.status !== 'all') ||
                filters.payment) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Active Filters</span>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCountry !== 'all' && (
                      <Badge variant="secondary">
                        Country: {selectedCountry}
                        <button onClick={() => setSelectedCountry('all')} className="ml-1">
                          ×
                        </button>
                      </Badge>
                    )}
                    {selectedCity !== 'all' && (
                      <Badge variant="secondary">
                        City: {selectedCity}
                        <button onClick={() => setSelectedCity('all')} className="ml-1">
                          ×
                        </button>
                      </Badge>
                    )}
                    {filters.location && (
                      <Badge variant="secondary">
                        Location: {filters.location}
                        <button
                          onClick={() => setFilters({ ...filters, location: undefined })}
                          className="ml-1"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {filters.photoType && (
                      <Badge variant="secondary">
                        {filters.photoType}
                        <button
                          onClick={() => setFilters({ ...filters, photoType: undefined })}
                          className="ml-1"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {filters.machineModel && (
                      <Badge variant="secondary">
                        {filters.machineModel}
                        <button
                          onClick={() => setFilters({ ...filters, machineModel: undefined })}
                          className="ml-1"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Results Count */}
            <div className="mt-6 pt-6 border-t border-primary/10">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filteredBooths.length}</span> of{' '}
                <span className="font-semibold text-foreground">{booths.length}</span> booths
              </div>
            </div>
          </aside>
        )}

        {/* Map or List View */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-background">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading booths...</p>
              </div>
            </div>
          ) : view === 'map' ? (
            <BoothMap
              booths={filteredBooths}
              showUserLocation={true}
              showClustering={true}
              zoom={2}
              externalUserLocation={userLocation}
              autoCenterOnUser={autoCenter}
              onCenterComplete={() => {
                setAutoCenter(false);
                // Enable distance sorting AFTER map has centered (avoids crash on load)
                if (searchParams.get('nearme') === 'true') {
                  setSortByDistance(true);
                }
              }}
              onViewportChange={handleViewportChange}
            />
          ) : (
            <div className="h-full overflow-y-auto bg-background p-6">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-foreground mb-2">
                    All Booths
                  </h2>
                  <p className="text-muted-foreground">
                    {filteredBooths.length} {filteredBooths.length === 1 ? 'booth' : 'booths'} found
                  </p>
                </div>

                {filteredBooths.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      No booths found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your filters or search term.
                    </p>
                    <Button onClick={clearFilters}>Clear Filters</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredBooths.map((booth) => (
                      <BoothCard
                        key={booth.id}
                        booth={booth}
                        variant="default"
                        showDistance={sortByDistance && userLocation !== null}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    }>
      <MapContent />
    </Suspense>
  );
}