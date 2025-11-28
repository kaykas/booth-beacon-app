'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, PlayCircle, PauseCircle, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

interface GeocodeProgress {
  current: number;
  total: number;
  percentage: number;
}

interface GeocodeStats {
  success: number;
  errors: number;
  skipped: number;
}

interface GeocodeResult {
  name: string;
  success: boolean;
  latitude?: number;
  longitude?: number;
  error?: string;
}

export function GeocodingPanel() {
  const [missingCoordsCount, setMissingCoordsCount] = useState(0);
  const [geocodingRunning, setGeocodingRunning] = useState(false);
  const [geocodingStatus, setGeocodingStatus] = useState('Ready');
  const [geocodingProgress, setGeocodingProgress] = useState<GeocodeProgress>({ current: 0, total: 0, percentage: 0 });
  const [geocodingResults, setGeocodingResults] = useState<GeocodeResult[]>([]);
  const [geocodingStats, setGeocodingStats] = useState<GeocodeStats>({ success: 0, errors: 0, skipped: 0 });
  const [currentEventSource, setCurrentEventSource] = useState<EventSource | null>(null);

  useEffect(() => {
    loadMissingCoordsCount();
  }, []);

  const loadMissingCoordsCount = async () => {
    try {
      const { count } = await supabase
        .from('booths')
        .select('*', { count: 'exact', head: true })
        .or('latitude.is.null,longitude.is.null');

      setMissingCoordsCount(count || 0);
    } catch (error) {
      console.error('Error loading missing coords count:', error);
    }
  };

  const startGeocoding = async (limit: number = 50, dryRun: boolean = false) => {
    if (geocodingRunning) {
      toast.error('Geocoding is already running');
      return;
    }

    setGeocodingRunning(true);
    setGeocodingStatus('Starting geocoding...');
    setGeocodingProgress({ current: 0, total: 0, percentage: 0 });
    setGeocodingResults([]);
    setGeocodingStats({ success: 0, errors: 0, skipped: 0 });
    toast.info('Starting geocoding process...');

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const params = new URLSearchParams({
        limit: limit.toString(),
        dry_run: dryRun.toString(),
      });

      const eventSource = new EventSource(
        `${supabaseUrl}/functions/v1/geocode-booths?${params}`
      );

      setCurrentEventSource(eventSource);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'start':
              setGeocodingStatus(data.message);
              break;

            case 'progress':
              setGeocodingStatus(data.message);
              if (data.data?.total) {
                setGeocodingProgress(prev => ({ ...prev, total: data.data.total }));
              }
              break;

            case 'booth_geocoded':
              setGeocodingStatus(data.message);
              setGeocodingProgress({
                current: data.data.index,
                total: data.data.total,
                percentage: Math.round((data.data.index / data.data.total) * 100)
              });
              setGeocodingStats(prev => ({ ...prev, success: prev.success + 1 }));
              setGeocodingResults(prev => [...prev, {
                name: data.data.name,
                success: true,
                latitude: data.data.latitude,
                longitude: data.data.longitude,
              }].slice(-20));
              break;

            case 'booth_failed':
              setGeocodingStatus(data.message);
              if (data.data?.index) {
                setGeocodingProgress({
                  current: data.data.index,
                  total: data.data.total,
                  percentage: Math.round((data.data.index / data.data.total) * 100)
                });
              }
              const error = data.data?.error || 'Unknown error';
              setGeocodingStats(prev => ({
                ...prev,
                errors: error.includes('missing') ? prev.errors : prev.errors + 1,
                skipped: error.includes('missing') ? prev.skipped + 1 : prev.skipped
              }));
              setGeocodingResults(prev => [...prev, {
                name: data.data.name,
                success: false,
                error,
              }].slice(-20));
              break;

            case 'complete':
              setGeocodingStatus(data.message);
              setGeocodingRunning(false);
              toast.success(data.message);
              eventSource.close();
              setCurrentEventSource(null);
              loadMissingCoordsCount();
              break;

            case 'error':
              throw new Error(data.message);
          }
        } catch (parseError) {
          console.error('Error parsing geocoding event:', parseError);
        }
      };

      eventSource.onerror = (error) => {
        console.error('Geocoding EventSource error:', error);
        setGeocodingStatus('Error during geocoding');
        setGeocodingRunning(false);
        toast.error('Geocoding connection error');
        eventSource.close();
        setCurrentEventSource(null);
      };

    } catch (error: any) {
      console.error('Geocoding error:', error);
      setGeocodingStatus('Error: ' + error.message);
      setGeocodingRunning(false);
      toast.error('Geocoding failed: ' + error.message);
    }
  };

  const stopGeocoding = () => {
    if (currentEventSource) {
      currentEventSource.close();
      setCurrentEventSource(null);
      setGeocodingRunning(false);
      setGeocodingStatus('Geocoding stopped by user');
      toast.info('Geocoding stopped');
    }
  };

  return (
    <Card className="p-6 bg-neutral-800 border-neutral-700">
      <h2 className="font-display text-2xl font-semibold mb-6 text-white">Geocoding Service</h2>

      <div className="space-y-6">
        {/* Status Banner */}
        <div className={`border-4 rounded-xl p-8 transition-all duration-500 ${
          geocodingRunning ? 'bg-blue-950/30 border-blue-500' : 'bg-neutral-900 border-neutral-700'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className={`p-4 rounded-full ${
                geocodingRunning ? 'bg-blue-500/20' : 'bg-neutral-800'
              }`}>
                {geocodingRunning ? (
                  <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                ) : (
                  <Navigation className="w-12 h-12 text-neutral-400" />
                )}
              </div>

              <div>
                <div className="text-4xl font-bold text-white mb-2">
                  {geocodingRunning ? 'RUNNING' : 'READY'}
                </div>
                <div className="text-lg text-neutral-300">{geocodingStatus}</div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-semibold text-white mb-1">
                {missingCoordsCount} booths missing coordinates
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={loadMissingCoordsCount}
                disabled={geocodingRunning}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {geocodingRunning && geocodingProgress.total > 0 && (
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  Progress: {geocodingProgress.current} / {geocodingProgress.total} booths
                </span>
                <span className="text-3xl font-bold text-white">{geocodingProgress.percentage}%</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-6 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-500 ease-out flex items-center justify-end px-2"
                  style={{ width: `${geocodingProgress.percentage}%` }}
                >
                  {geocodingProgress.percentage > 10 && (
                    <span className="text-xs font-bold text-white">{geocodingProgress.percentage}%</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-neutral-900/50 rounded-lg border border-neutral-700">
              <div className="text-3xl font-bold text-green-400 mb-1">{geocodingStats.success}</div>
              <div className="text-xs text-neutral-400">Successful</div>
            </div>
            <div className="text-center p-4 bg-neutral-900/50 rounded-lg border border-neutral-700">
              <div className="text-3xl font-bold text-red-400 mb-1">{geocodingStats.errors}</div>
              <div className="text-xs text-neutral-400">Errors</div>
            </div>
            <div className="text-center p-4 bg-neutral-900/50 rounded-lg border border-neutral-700">
              <div className="text-3xl font-bold text-yellow-400 mb-1">{geocodingStats.skipped}</div>
              <div className="text-xs text-neutral-400">Skipped</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {!geocodingRunning ? (
              <>
                <Button
                  className="flex-1 h-14 text-lg"
                  onClick={() => startGeocoding(50, false)}
                  disabled={missingCoordsCount === 0}
                >
                  <PlayCircle className="w-6 h-6 mr-3" />
                  Start Geocoding (50 booths)
                </Button>
                <Button
                  variant="outline"
                  className="h-14"
                  onClick={() => startGeocoding(10, true)}
                  disabled={missingCoordsCount === 0}
                >
                  Test (Dry Run)
                </Button>
              </>
            ) : (
              <Button
                className="flex-1 h-14 text-lg"
                variant="destructive"
                onClick={stopGeocoding}
              >
                <PauseCircle className="w-6 h-6 mr-3" />
                Stop Geocoding
              </Button>
            )}
          </div>
        </div>

        {/* Recent Results */}
        {geocodingResults.length > 0 && (
          <div className="border border-neutral-700 rounded-lg p-4 bg-neutral-900">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-white">Recent Results</h3>
              <Badge variant="secondary" className="ml-auto">{geocodingResults.length} results</Badge>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {geocodingResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded border-l-4 ${
                    result.success
                      ? 'bg-green-950/20 border-green-500'
                      : 'bg-red-950/20 border-red-500'
                  }`}
                >
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                    result.success ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-white font-medium text-sm">{result.name}</span>
                      {result.success ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    {result.success ? (
                      <p className="text-neutral-300 text-xs">
                        Coordinates: {result.latitude?.toFixed(6)}, {result.longitude?.toFixed(6)}
                      </p>
                    ) : (
                      <p className="text-neutral-300 text-xs">{result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="border border-neutral-700 rounded-lg p-4 bg-neutral-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2">About Geocoding</h3>
              <div className="text-sm text-neutral-400 space-y-2">
                <p>
                  This tool uses OpenStreetMap's Nominatim API to geocode booth addresses into latitude/longitude coordinates.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Rate limited to 1 request per second (per Nominatim usage policy)</li>
                  <li>Free service, no API key required</li>
                  <li>Processes booths with missing coordinates only</li>
                  <li>Use "Test (Dry Run)" to preview results without updating database</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
