'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, SlidersHorizontal, List, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BoothMap } from '@/components/booth/BoothMap';
import { BoothCard } from '@/components/booth/BoothCard';
import { SearchBar } from '@/components/SearchBar';
import { supabase } from '@/lib/supabase';
import { Booth } from '@/types';

interface Filters {
  location?: string;
  photoType?: 'black-and-white' | 'color' | 'both';
  machineModel?: string;
  operator?: string;
  status?: 'active' | 'unverified' | 'all';
  payment?: 'cash' | 'card' | 'both';
}

export default function MapPage() {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [filteredBooths, setFilteredBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
  });

  // Fetch all booths on mount
  useEffect(() => {
    fetchBooths();
  }, []);

  // Apply filters whenever filters or booths change
  useEffect(() => {
    applyFilters();
  }, [filters, booths]);

  async function fetchBooths() {
    setLoading(true);

    let query = supabase.from('booths').select('*');

    // Apply status filter to the query if not "all"
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching booths:', error);
      setBooths([]);
    } else {
      setBooths((data as Booth[]) || []);
    }

    setLoading(false);
  }

  function applyFilters() {
    let filtered = [...booths];

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

    setFilteredBooths(filtered);
  }

  function clearFilters() {
    setFilters({ status: 'all' });
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-4 z-10">
        <Link href="/" className="font-display text-xl font-semibold text-neutral-900">
          Booth Beacon
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <SearchBar placeholder="Search for a booth, city, or country..." />
        </div>

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
        <div className="flex gap-1 bg-neutral-100 rounded-lg p-1">
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
          <aside className="w-80 bg-white border-r border-neutral-200 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-lg">Filters</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">
                  Status
                </label>
                <Select
                  value={filters.status}
                  onValueChange={(value: any) => setFilters({ ...filters, status: value })}
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
                <label className="text-sm font-medium text-neutral-700 mb-2 block">
                  Photo Type
                </label>
                <Select
                  value={filters.photoType || 'both'}
                  onValueChange={(value: any) =>
                    setFilters({ ...filters, photoType: value === 'both' ? undefined : value })
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
                <label className="text-sm font-medium text-neutral-700 mb-2 block">
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
                <label className="text-sm font-medium text-neutral-700 mb-2 block">
                  Payment Type
                </label>
                <Select
                  value={filters.payment || 'both'}
                  onValueChange={(value: any) =>
                    setFilters({ ...filters, payment: value === 'both' ? undefined : value })
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
              {(filters.location ||
                filters.photoType ||
                filters.machineModel ||
                filters.operator ||
                (filters.status && filters.status !== 'all') ||
                filters.payment) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700">Active Filters</span>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
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
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <div className="text-sm text-neutral-600">
                Showing <span className="font-semibold text-neutral-900">{filteredBooths.length}</span> of{' '}
                <span className="font-semibold text-neutral-900">{booths.length}</span> booths
              </div>
            </div>
          </aside>
        )}

        {/* Map or List View */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-neutral-100">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <p className="text-neutral-600">Loading booths...</p>
              </div>
            </div>
          ) : view === 'map' ? (
            <BoothMap
              booths={filteredBooths}
              showUserLocation={true}
              showClustering={true}
              zoom={4}
            />
          ) : (
            <div className="h-full overflow-y-auto bg-neutral-50 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
                    All Booths
                  </h2>
                  <p className="text-neutral-600">
                    {filteredBooths.length} {filteredBooths.length === 1 ? 'booth' : 'booths'} found
                  </p>
                </div>

                {filteredBooths.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                      No booths found
                    </h3>
                    <p className="text-neutral-600 mb-4">
                      Try adjusting your filters or search term.
                    </p>
                    <Button onClick={clearFilters}>Clear Filters</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredBooths.map((booth) => (
                      <BoothCard key={booth.id} booth={booth} variant="default" />
                    ))}
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
