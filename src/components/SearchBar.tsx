'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Booth } from '@/types';

interface SearchBarProps {
  placeholder?: string;
  onSelect?: (booth: Booth) => void;
  className?: string;
  autoFocus?: boolean;
}

interface SearchResult {
  id: string;
  name: string;
  city: string;
  country: string;
  type: 'booth' | 'city' | 'country';
}

export function SearchBar({
  placeholder = 'Search by city, country, or booth name...',
  onSelect,
  className = '',
  autoFocus = false,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search function with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const searchTerm = query.toLowerCase().trim();

        // Search booths
        const { data: booths, error } = await supabase
          .from('booths')
          .select('id, name, city, country')
          .or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`)
          .limit(10);

        if (error) throw error;

        // Process results
        const boothResults: SearchResult[] = (
          booths as Array<{ id: string; name: string; city: string; country: string }>
        )?.map((b) => ({
          id: b.id,
          name: b.name,
          city: b.city || '',
          country: b.country || '',
          type: 'booth' as const,
        })) || [];

        // Extract unique cities
        const cities = Array.from(
          new Set(
            (booths as Array<{ id: string; name: string; city: string; country: string }>)
              ?.map((b) => `${b.city}, ${b.country}`)
              .filter(Boolean) || []
          )
        )
          .slice(0, 3)
          .map((location, idx) => {
            const [city, country] = location.split(', ');
            return {
              id: `city-${idx}`,
              name: city,
              city,
              country,
              type: 'city' as const,
            };
          });

        // Extract unique countries
        const countries = Array.from(
          new Set(
            (booths as Array<{ id: string; name: string; city: string; country: string }>)
              ?.map((b) => b.country)
              .filter(Boolean) || []
          )
        )
          .slice(0, 2)
          .map((country, idx) => ({
            id: `country-${idx}`,
            name: country,
            city: '',
            country,
            type: 'country' as const,
          }));

        // Combine and deduplicate
        const allResults = [...boothResults, ...cities, ...countries];
        setResults(allResults);
        setIsOpen(allResults.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(searchTimeout);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    if (result.type === 'booth') {
      // Navigate to booth detail page
      router.push(`/booth/${result.id}`);
    } else if (result.type === 'city') {
      // Navigate to map with city filter
      router.push(`/map?location=${encodeURIComponent(`${result.city}, ${result.country}`)}`);
    } else if (result.type === 'country') {
      // Navigate to map with country filter
      router.push(`/map?location=${encodeURIComponent(result.country)}`);
    }

    setIsOpen(false);
    setQuery('');
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          autoFocus={autoFocus}
          className="pl-10 pr-10 h-12 text-base"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full px-4 py-3 text-left hover:bg-neutral-50 transition flex items-center gap-3 border-b border-neutral-100 last:border-b-0 ${
                  selectedIndex === index ? 'bg-neutral-50' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    result.type === 'booth'
                      ? 'bg-primary/10 text-primary'
                      : result.type === 'city'
                      ? 'bg-accent/10 text-accent'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {result.type === 'booth' ? (
                    <MapPin className="w-4 h-4" />
                  ) : result.type === 'city' ? (
                    <MapPin className="w-4 h-4" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-neutral-900 truncate">{result.name}</div>
                  {result.type === 'booth' && (
                    <div className="text-sm text-neutral-500 truncate">
                      {result.city}, {result.country}
                    </div>
                  )}
                  {result.type === 'city' && (
                    <div className="text-sm text-neutral-500">
                      City in {result.country}
                    </div>
                  )}
                  {result.type === 'country' && (
                    <div className="text-sm text-neutral-500">Country</div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <div className="text-xs text-neutral-400 uppercase tracking-wider">
                    {result.type}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-200 text-xs text-neutral-500 flex items-center justify-between">
            <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
            <span>{results.length} results</span>
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && query && !isLoading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-xl border border-neutral-200 p-6 text-center">
          <Search className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-600 mb-1">No results found</p>
          <p className="text-sm text-neutral-500">
            Try searching for a city, country, or booth name
          </p>
        </div>
      )}
    </div>
  );
}
