'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { isUserAdmin } from '@/lib/adminAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Image, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface LogEvent {
  type: 'info' | 'error' | 'success' | 'progress';
  message: string;
  data?: unknown;
}

export default function EnrichmentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Venue enrichment state
  const [venueRunning, setVenueRunning] = useState(false);
  const [venueLogs, setVenueLogs] = useState<LogEvent[]>([]);
  const [venueBatchSize, setVenueBatchSize] = useState(25);

  // Image enrichment state
  const [imageRunning, setImageRunning] = useState(false);
  const [imageLogs, setImageLogs] = useState<LogEvent[]>([]);
  const [imageBatchSize, setImageBatchSize] = useState(50);

  // Check admin status
  useEffect(() => {
    async function checkAdmin() {
      if (user) {
        const adminStatus = await isUserAdmin(user);
        setIsAdmin(adminStatus);
        if (!adminStatus) {
          router.push('/');
        }
      }
      setLoading(false);
    }
    checkAdmin();
  }, [user, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const startVenueEnrichment = async () => {
    setVenueRunning(true);
    setVenueLogs([]);

    try {
      const response = await fetch(`/api/enrichment/venue?batchSize=${venueBatchSize}`);

      if (!response.ok) {
        throw new Error('Failed to start venue enrichment');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: LogEvent = JSON.parse(line.slice(6));
              setVenueLogs(prev => [...prev, event]);

              if (event.type === 'error') {
                toast.error(event.message);
              } else if (event.type === 'success') {
                toast.success(event.message);
              }
            } catch (e) {
              console.error('Failed to parse SSE event:', e);
            }
          }
        }
      }
    } catch (error) {
      toast.error('Venue enrichment failed');
      console.error(error);
    } finally {
      setVenueRunning(false);
    }
  };

  const startImageGeneration = async () => {
    setImageRunning(true);
    setImageLogs([]);

    try {
      const response = await fetch(`/api/enrichment/images?batchSize=${imageBatchSize}`);

      if (!response.ok) {
        throw new Error('Failed to start image generation');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: LogEvent = JSON.parse(line.slice(6));
              setImageLogs(prev => [...prev, event]);

              if (event.type === 'error') {
                toast.error(event.message);
              } else if (event.type === 'success') {
                toast.success(event.message);
              }
            } catch (e) {
              console.error('Failed to parse SSE event:', e);
            }
          }
        }
      }
    } catch (error) {
      toast.error('Image generation failed');
      console.error(error);
    } finally {
      setImageRunning(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Data Enrichment</h1>
              <p className="text-muted-foreground">
                Automatically improve booth data quality to 80% target
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Venue Enrichment */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold">Venue Enrichment</h2>
                  <p className="text-sm text-muted-foreground">
                    Google Places API
                  </p>
                </div>
              </div>

              <p className="text-sm mb-4">
                Enriches booths with venue data: address, phone, website, hours, coordinates, photos
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Batch Size</label>
                  <input
                    type="number"
                    value={venueBatchSize}
                    onChange={(e) => setVenueBatchSize(parseInt(e.target.value))}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    min="1"
                    max="100"
                    disabled={venueRunning}
                  />
                </div>

                <Button
                  onClick={startVenueEnrichment}
                  disabled={venueRunning}
                  className="w-full"
                >
                  {venueRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enriching...
                    </>
                  ) : (
                    'Start Venue Enrichment'
                  )}
                </Button>

                {venueLogs.length > 0 && (
                  <div className="max-h-60 overflow-y-auto space-y-1 text-sm">
                    {venueLogs.map((log, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Badge variant={
                          log.type === 'error' ? 'destructive' :
                          log.type === 'success' ? 'default' :
                          'secondary'
                        } className="text-xs">
                          {log.type}
                        </Badge>
                        <span className="flex-1">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Image Generation */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Image className="h-6 w-6 text-primary" aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-semibold">AI Image Generation</h2>
                  <p className="text-sm text-muted-foreground">
                    DALL-E 3 ($0.04/image)
                  </p>
                </div>
              </div>

              <p className="text-sm mb-4">
                Generates vintage photobooth aesthetic images for booths without photos
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Batch Size</label>
                  <input
                    type="number"
                    value={imageBatchSize}
                    onChange={(e) => setImageBatchSize(parseInt(e.target.value))}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    min="1"
                    max="200"
                    disabled={imageRunning}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Est. cost: ${(imageBatchSize * 0.04).toFixed(2)}
                  </p>
                </div>

                <Button
                  onClick={startImageGeneration}
                  disabled={imageRunning}
                  className="w-full"
                >
                  {imageRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Start Image Generation'
                  )}
                </Button>

                {imageLogs.length > 0 && (
                  <div className="max-h-60 overflow-y-auto space-y-1 text-sm">
                    {imageLogs.map((log, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Badge variant={
                          log.type === 'error' ? 'destructive' :
                          log.type === 'success' ? 'default' :
                          'secondary'
                        } className="text-xs">
                          {log.type}
                        </Badge>
                        <span className="flex-1">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">How It Works</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                • <strong>Data Quality Scoring:</strong> Each booth is scored 0-100% based on completeness
              </p>
              <p>
                • <strong>80% Target:</strong> Enrichment runs until booths reach 80% data quality
              </p>
              <p>
                • <strong>Smart Enrichment:</strong> Only processes booths needing specific data types
              </p>
              <p>
                • <strong>Auto-Enrichment:</strong> New booths from crawlers are automatically enriched
              </p>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
