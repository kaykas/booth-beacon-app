'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { useBookmarks, useMarkVisited, useUpdateNotes } from '@/hooks/useBookmarks';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BoothImage } from '@/components/booth/BoothImage';
import { StatusBadge } from '@/components/booth/StatusBadge';
import { BookmarkButton } from '@/components/BookmarkButton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MapPin, Navigation, Camera, Loader2 } from 'lucide-react';

type FilterType = 'all' | 'visited' | 'not-visited';

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth();
  const { bookmarks, loading: bookmarksLoading, refetch } = useBookmarks();
  const { markVisited, loading: visitedLoading } = useMarkVisited();
  const { updateNotes, loading: notesLoading } = useUpdateNotes();

  const [filter, setFilter] = useState<FilterType>('all');
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({});

  const loading = authLoading || bookmarksLoading;

  // Filter bookmarks based on selected filter
  const filteredBookmarks = useMemo(() => {
    if (filter === 'all') return bookmarks;
    if (filter === 'visited') return bookmarks.filter((b) => b.visited);
    if (filter === 'not-visited') return bookmarks.filter((b) => !b.visited);
    return bookmarks;
  }, [bookmarks, filter]);

  const handleVisitedChange = async (bookmarkId: string, visited: boolean) => {
    const success = await markVisited(bookmarkId, visited);
    if (success) {
      await refetch();
    }
  };

  const handleNotesChange = (bookmarkId: string, notes: string) => {
    setEditingNotes((prev) => ({ ...prev, [bookmarkId]: notes }));
  };

  const handleSaveNotes = async (bookmarkId: string) => {
    const notes = editingNotes[bookmarkId] ?? '';

    setSavingNotes((prev) => ({ ...prev, [bookmarkId]: true }));
    const success = await updateNotes(bookmarkId, notes);
    setSavingNotes((prev) => ({ ...prev, [bookmarkId]: false }));

    if (success) {
      await refetch();
      // Clear editing state
      setEditingNotes((prev) => {
        const newState = { ...prev };
        delete newState[bookmarkId];
        return newState;
      });
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-neutral-600">Loading your bookmarks...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-neutral-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Heart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h1 className="font-display text-3xl font-semibold mb-4">Sign in to view bookmarks</h1>
            <p className="text-neutral-600 mb-6">
              Create an account to save your favorite booths and organize them into collections.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-8 h-8 text-pink-600 fill-current" />
              <h1 className="font-display text-3xl font-semibold text-neutral-900">
                My Saved Booths
              </h1>
            </div>
            <p className="text-neutral-600">
              {bookmarks.length === 0
                ? 'Start saving booths to plan your photo adventures'
                : `${bookmarks.length} saved booth${bookmarks.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {bookmarks.length === 0 ? (
            // Empty state
            <Card className="p-12 text-center">
              <Heart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-2">
                No saved booths yet
              </h2>
              <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                Start exploring and save your favorite photo booths to keep track of places you
                want to visit or have visited.
              </p>
              <Button asChild>
                <Link href="/map">Explore Booths</Link>
              </Button>
            </Card>
          ) : (
            <>
              {/* Filters */}
              <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)} className="mb-6">
                <TabsList>
                  <TabsTrigger value="all">
                    All ({bookmarks.length})
                  </TabsTrigger>
                  <TabsTrigger value="not-visited">
                    To Visit ({bookmarks.filter((b) => !b.visited).length})
                  </TabsTrigger>
                  <TabsTrigger value="visited">
                    Visited ({bookmarks.filter((b) => b.visited).length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Bookmarks List */}
              <div className="space-y-6">
                {filteredBookmarks.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-neutral-600">No booths in this category</p>
                  </Card>
                ) : (
                  filteredBookmarks.map((bookmark) => {
                    const booth = bookmark.booth;
                    if (!booth) return null;

                    const currentNotes = editingNotes[bookmark.id] ?? bookmark.notes ?? '';
                    const hasUnsavedNotes = editingNotes[bookmark.id] !== undefined &&
                      editingNotes[bookmark.id] !== (bookmark.notes ?? '');

                    return (
                      <Card key={bookmark.id} className="overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Left: Booth Preview */}
                          <div className="lg:col-span-1">
                            <Link href={`/booth/${booth.id}`}>
                              <div className="relative aspect-[4/3] lg:aspect-square">
                                <BoothImage booth={booth} size="card" showAiBadge />
                              </div>
                            </Link>
                          </div>

                          {/* Right: Details & Actions */}
                          <div className="lg:col-span-2 p-6 lg:p-8">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <Link href={`/booth/${booth.id}`}>
                                  <h3 className="font-display text-2xl font-semibold text-neutral-900 hover:text-primary transition">
                                    {booth.name}
                                  </h3>
                                </Link>
                                <div className="flex items-center gap-2 mt-2">
                                  <MapPin className="w-4 h-4 text-neutral-500" />
                                  <span className="text-neutral-600">
                                    {booth.city}, {booth.country}
                                  </span>
                                </div>
                                {booth.machine_model && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <Camera className="w-4 h-4 text-neutral-500" />
                                    <span className="text-sm text-neutral-600">
                                      {booth.machine_model}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <StatusBadge status={booth.status} />
                            </div>

                            {/* Visited Checkbox */}
                            <div className="flex items-center gap-3 mb-4 p-3 bg-neutral-50 rounded-lg">
                              <Checkbox
                                id={`visited-${bookmark.id}`}
                                checked={bookmark.visited}
                                onCheckedChange={(checked) =>
                                  handleVisitedChange(bookmark.id, checked as boolean)
                                }
                                disabled={visitedLoading}
                              />
                              <label
                                htmlFor={`visited-${bookmark.id}`}
                                className="text-sm font-medium text-neutral-700 cursor-pointer"
                              >
                                {bookmark.visited ? 'Visited' : 'Mark as visited'}
                              </label>
                              {bookmark.visited_at && (
                                <span className="text-xs text-neutral-500 ml-auto">
                                  {new Date(bookmark.visited_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>

                            {/* Notes */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Notes
                              </label>
                              <textarea
                                value={currentNotes}
                                onChange={(e) => handleNotesChange(bookmark.id, e.target.value)}
                                placeholder="Add notes about this booth..."
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                rows={3}
                              />
                              {hasUnsavedNotes && (
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveNotes(bookmark.id)}
                                  disabled={savingNotes[bookmark.id] || notesLoading}
                                  className="mt-2"
                                >
                                  {savingNotes[bookmark.id] ? (
                                    <>
                                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    'Save Notes'
                                  )}
                                </Button>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2">
                              <Button variant="default" asChild className="flex-1 sm:flex-none">
                                <Link href={`/booth/${booth.id}`}>View Details</Link>
                              </Button>
                              <Button variant="outline" asChild className="flex-1 sm:flex-none">
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${booth.latitude},${booth.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Navigation className="w-4 h-4 mr-2" />
                                  Directions
                                </a>
                              </Button>
                              <BookmarkButton
                                boothId={booth.id}
                                variant="outline"
                                size="default"
                                showText={true}
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
