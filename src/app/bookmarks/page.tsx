'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { BoothBookmark, Collection } from '@/types';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BoothImage } from '@/components/booth/BoothImage';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bookmark, MapPin, Plus, FolderOpen, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState<BoothBookmark[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!authLoading && user) {
      loadBookmarks();
      loadCollections();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadBookmarks = async () => {
    try {
      const { data, error } = await supabase
        .from('booth_bookmarks')
        .select(`
          *,
          booth:booths(*)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const loadCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  };

  const removeBookmark = async (bookmarkId: string) => {
    try {
      const { error } = await supabase
        .from('booth_bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) throw error;

      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
      toast.success('Bookmark removed');
    } catch (error) {
      console.error('Error removing bookmark:', error);
      toast.error('Failed to remove bookmark');
    }
  };


  const filteredBookmarks = bookmarks.filter((b) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'visited') return b.visited;
    if (activeTab === 'to-visit') return !b.visited;
    // Filter by collection
    return b.collection_id === activeTab;
  });

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-neutral-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
              <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-64 bg-neutral-200 rounded-lg"></div>
                ))}
              </div>
            </div>
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
            <Bookmark className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
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
      <main className="min-h-screen bg-neutral-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-4xl font-semibold text-neutral-900 mb-2">
              My Bookmarks
            </h1>
            <p className="text-neutral-600">
              {bookmarks.length} saved booth{bookmarks.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList>
              <TabsTrigger value="all">All ({bookmarks.length})</TabsTrigger>
              <TabsTrigger value="to-visit">
                To Visit ({bookmarks.filter((b) => !b.visited).length})
              </TabsTrigger>
              <TabsTrigger value="visited">
                Visited ({bookmarks.filter((b) => b.visited).length})
              </TabsTrigger>
              {collections.map((collection) => (
                <TabsTrigger key={collection.id} value={collection.id}>
                  <FolderOpen className="w-4 h-4 mr-1" />
                  {collection.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Bookmarks Grid */}
          {filteredBookmarks.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">No bookmarks yet</h3>
              <p className="text-neutral-600 mb-6">
                Start exploring and save your favorite photo booths!
              </p>
              <Link href="/map">
                <Button>
                  <MapPin className="w-4 h-4 mr-2" />
                  Explore Map
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  {/* Image */}
                  <Link href={`/booth/${bookmark.booth?.id}`}>
                    <div className="aspect-[4/3] relative overflow-hidden bg-neutral-100">
                      {bookmark.booth && (
                        <BoothImage booth={bookmark.booth} size="card" />
                      )}
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="p-4">
                    <Link href={`/booth/${bookmark.booth?.id}`}>
                      <h3 className="font-display text-lg font-semibold mb-1 hover:text-primary transition">
                        {bookmark.booth?.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-neutral-600 mb-3 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {bookmark.booth?.city}, {bookmark.booth?.country}
                    </p>

                    {bookmark.notes && (
                      <p className="text-sm text-neutral-700 mb-3 italic">{bookmark.notes}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link href={`/booth/${bookmark.booth?.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeBookmark(bookmark.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {bookmark.visited && bookmark.visited_at && (
                      <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
                        <Calendar className="w-3 h-3" />
                        Visited on {new Date(bookmark.visited_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
