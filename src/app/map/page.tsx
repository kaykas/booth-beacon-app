'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MapPin, SlidersHorizontal, List, X, Loader2, Navigation, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BoothMap } from '@/components/booth/BoothMap';
import { BoothCard } from '@/components/booth/BoothCard';
import { SearchBar } from '@/components/SearchBar';
import { Booth, Coordinates } from '@/types';
import { sortBoothsByDistance } from '@/lib/distanceUtils';
import { Switch } from '@/components/ui/switch';

interface Filters {
  location?: string;
  photoType?: 'black-and-white' | 'color' | 'both';
  machineModel?: string;
  operator?: string;
  status?: 'active' | 'unverified' | 'all';
  payment?: 'cash' | 'card' | 'both';
  analogOnly?: boolean;
  verifiedWindow?: number;
}

function MapContent() {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [filteredBooths, setFilteredBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
  });
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [serverCount, setServerCount] = useState<number | null>(null);
  const pageSize = 150;
  
  const searchParams = useSearchParams();
  const [autoCenter, setAutoCenter] = useState(false);

  useEffect(() => {
    if (searchParams.get('nearme') === 'true') {
      setSortByDistance(true);
      setAutoCenter(true);
    }
  }, [searchParams]);

  const fetchBooths = useCallback(
    async (reset = false) => {
      const nextPage = reset ? 0 : page;
      if (reset) {
        setLoading(true);
        setHasMore(true);
        setPage(0);
      } else {
        setIsLoadingMore(true);
      }

      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: (nextPage * pageSize).toString(),
        status: filters.status || 'all',
      });

      if (filters.analogOnly) {
        params.set('analogOnly', 'true');
      }

      if (filters.machineModel && filters.machineModel !== 'all') {
        params.set('machineModel', filters.machineModel);
      }

      if (filters.operator && filters.operator !== 'all') {
        params.set('operator', filters.operator);
      }

      if (filters.verifiedWindow) {
        const since = new Date();
        since.setDate(since.getDate() - filters.verifiedWindow);
        params.set('verifiedSince', since.toISOString());
      }

      try {
        const response = await fetch(`/api/booths/map?${params.toString()}`);
        const payload = (await response.json()) as { data: Booth[]; hasMore: boolean; count?: number };

        setBooths((prev) => (reset ? payload.data : [...prev, ...payload.data]));
        setHasMore(payload.hasMore);
        setServerCount(payload.count ?? payload.data?.length ?? null);
        setPage(nextPage + 1);
      } catch (error) {
        console.error('Error fetching booths:', error);
        if (reset) {
          setBooths([]);
        }
      } finally {
        setLoading(false);
        setIsLoadingMore(false);
      }
    },
    [filters.analogOnly, filters.machineModel, filters.operator, filters.status, filters.verifiedWindow, page, pageSize]
  );

  // Fetch all booths on mount
  useEffect(() => {
    fetchBooths(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.analogOnly, filters.machineModel, filters.operator, filters.status, filters.verifiedWindow]);

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

  // Memoized filter application for performance with 100+ booths
  const computedFilteredBooths = useMemo(() => {
    let filtered = [...booths];

    if (filters.analogOnly) {
      filtered = filtered.filter((booth) => booth.booth_type === 'analog' || booth.booth_type === 'chemical');
    }

    if (filters.verifiedWindow) {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - filters.verifiedWindow);
      filtered = filtered.filter((booth) => {
        const lastVerified = booth.last_verified || booth.source_verified_date || booth.last_checked_at;
        return lastVerified ? new Date(lastVerified) >= threshold : false;
      });
    }

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

  // Update filteredBooths when computed value changes
  useEffect(() => {
    setFilteredBooths(computedFilteredBooths);
  }, [computedFilteredBooths]);

  const clearFilters = useCallback(() => {
    setFilters({ status: 'all' });
    setSelectedCity('all');
    setSelectedCountry('all');
    setPage(0);
    setHasMore(true);
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
  const machineModels = useMemo(
    () => Array.from(new Set(booths.map((b) => b.machine_model).filter(Boolean))).sort(),
    [booths]
  );
  const operators = useMemo(
    () => Array.from(new Set(booths.map((b) => b.operator_name).filter(Boolean))).sort(),
    [booths]
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b border-primary/10 px-4 py-3 flex items-center gap-4 z-10">
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
          onClick={() => setSortByDistance(!sortByDistance)}
          disabled={!userLocation}
          title={!userLocation ? 'Enable location to use this feature' : 'Sort by distance'}
        >
          <Navigation className="w-4 h-4 mr-2" />
          Near Me
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
      <div className="flex-1 flex overflow-hidden">
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

              {/* Verification freshness */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Verified recently
                  </label>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <Select
                  value={(filters.verifiedWindow ?? 0).toString()}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      verifiedWindow: value === '0' ? undefined : Number(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any recency</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="180">Last 6 months</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Prioritize booths with fresh checks and verified primary sources.
                </p>
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

              {/* Analog & Chemical Only */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Analog & chemical only</p>
                  <p className="text-xs text-muted-foreground">Hide digital and instant booths.</p>
                </div>
                <Switch
                  checked={filters.analogOnly ?? false}
                  onCheckedChange={(checked) => setFilters({ ...filters, analogOnly: checked })}
                />
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
                    {machineModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Operator Filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Operator</label>
                <Select
                  value={filters.operator || 'all'}
                  onValueChange={(value) =>
                    setFilters({ ...filters, operator: value === 'all' ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All operators" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Operators</SelectItem>
                    {operators.map((operator) => (
                      <SelectItem key={operator} value={operator}>
                        {operator}
                      </SelectItem>
                    ))}
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
                filters.analogOnly ||
                filters.verifiedWindow ||
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
                    {filters.analogOnly && (
                      <Badge variant="secondary">
                        Analog & chemical
                        <button onClick={() => setFilters({ ...filters, analogOnly: false })} className="ml-1">
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
                    {filters.verifiedWindow && (
                      <Badge variant="secondary">
                        Verified &lt; {filters.verifiedWindow} days
                        <button
                          onClick={() => setFilters({ ...filters, verifiedWindow: undefined })}
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
                    {filters.operator && (
                      <Badge variant="secondary">
                        Operator: {filters.operator}
                        <button
                          onClick={() => setFilters({ ...filters, operator: undefined })}
                          className="ml-1"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {filters.status && filters.status !== 'all' && (
                      <Badge variant="secondary">
                        Status: {filters.status}
                        <button onClick={() => setFilters({ ...filters, status: 'all' })} className="ml-1">
                          ×
                        </button>
                      </Badge>
                    )}
                    {filters.payment && (
                      <Badge variant="secondary">
                        Payment: {filters.payment}
                        <button onClick={() => setFilters({ ...filters, payment: undefined })} className="ml-1">
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
                <span className="font-semibold text-foreground">{serverCount ?? booths.length}</span> booths
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
                      Help Alexandra find the next booth by widening the search or clearing filters.
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
                {hasMore && filteredBooths.length > 0 && (
                  <div className="mt-8 text-center">
                    <Button onClick={fetchBooths} disabled={isLoadingMore} variant="outline">
                      {isLoadingMore ? 'Loading more booths...' : 'Load more verified booths'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
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