'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BoothCard } from '@/components/booth/BoothCard';
import {
  ArrowLeft,
  Lock,
  Globe,
  Edit,
  Loader2,
  Trash2,
  Plus,
  FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Booth } from '@/types';

interface Collection {
  id: string;
  name: string;
  description: string | null;
  booth_ids: string[];
  is_public: boolean;
  created_at: string;
  user_id: string;
}

export default function CollectionDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddBoothDialogOpen, setIsAddBoothDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Booth[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please sign in to view your collections');
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Fetch collection and booths
  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch collection
        const { data: collectionData, error: collectionError } = await supabase
          .from('collections')
          .select('*')
          .eq('id', collectionId)
          .eq('user_id', user.id)
          .single();

        if (collectionError) throw collectionError;

        if (!collectionData) {
          toast.error('Collection not found');
          router.push('/my-collections');
          return;
        }

        setCollection(collectionData);
        setFormData({
          name: collectionData.name,
          description: collectionData.description || '',
          is_public: collectionData.is_public,
        });

        // Fetch booths if there are any
        if (collectionData.booth_ids && collectionData.booth_ids.length > 0) {
          const { data: boothsData, error: boothsError } = await supabase
            .from('booths')
            .select('*')
            .in('id', collectionData.booth_ids);

          if (boothsError) throw boothsError;

          // Sort booths to match the order in booth_ids
          const sortedBooths = collectionData.booth_ids
            .map((id: string) => boothsData?.find((b) => b.id === id))
            .filter(Boolean) as Booth[];

          setBooths(sortedBooths);
        }
      } catch (error) {
        console.error('Error fetching collection:', error);
        toast.error('Failed to load collection');
      } finally {
        setLoading(false);
      }
    }

    async function refetchBooths(boothIds: string[]) {
      if (boothIds.length === 0) {
        setBooths([]);
        return;
      }

      try {
        const { data: boothsData, error: boothsError } = await supabase
          .from('booths')
          .select('*')
          .in('id', boothIds);

        if (boothsError) throw boothsError;

        // Sort booths to match the order in booth_ids
        const sortedBooths = boothIds
          .map((id: string) => boothsData?.find((b) => b.id === id))
          .filter(Boolean) as Booth[];

        setBooths(sortedBooths);
      } catch (error) {
        console.error('Error fetching booths:', error);
      }
    }

    if (user && collectionId) {
      fetchData();

      // Subscribe to real-time changes for this specific collection
      const collectionChannel = supabase
        .channel(`collection-${collectionId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'collections',
            filter: `id=eq.${collectionId}`,
          },
          (payload) => {
            const updatedCollection = payload.new as Collection;

            // Update collection metadata (name, description, is_public)
            setCollection(updatedCollection);
            setFormData({
              name: updatedCollection.name,
              description: updatedCollection.description || '',
              is_public: updatedCollection.is_public,
            });

            // If booth_ids changed, refetch the booths
            if (JSON.stringify(collection?.booth_ids) !== JSON.stringify(updatedCollection.booth_ids)) {
              refetchBooths(updatedCollection.booth_ids);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'collections',
            filter: `id=eq.${collectionId}`,
          },
          () => {
            // Collection was deleted, redirect to collections page
            toast.info('Collection was deleted');
            router.push('/my-collections');
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(collectionChannel);
      };
    }
  }, [user, collectionId, router, collection?.booth_ids]);

  const handleUpdateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collection || !user) return;

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('collections')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          is_public: formData.is_public,
        })
        .eq('id', collection.id);

      if (error) throw error;

      setCollection({ ...collection, ...formData });
      toast.success('Collection updated successfully');
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating collection:', error);
      toast.error('Failed to update collection');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!collection) return;
    if (!confirm('Are you sure you want to delete this collection? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collection.id);

      if (error) throw error;

      toast.success('Collection deleted successfully');
      router.push('/my-collections');
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('Failed to delete collection');
    }
  };

  const handleSearchBooths = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);

      const { data, error } = await supabase
        .from('booths')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,country.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching booths:', error);
      toast.error('Failed to search booths');
    } finally {
      setSearching(false);
    }
  };

  const handleAddBooth = async (boothId: string) => {
    if (!collection) return;

    if (collection.booth_ids.includes(boothId)) {
      toast.info('This booth is already in the collection');
      return;
    }

    try {
      const newBoothIds = [...collection.booth_ids, boothId];

      const { error } = await supabase
        .from('collections')
        .update({ booth_ids: newBoothIds })
        .eq('id', collection.id);

      if (error) throw error;

      // Update local state
      setCollection({ ...collection, booth_ids: newBoothIds });

      // Fetch the new booth and add it to the list
      const { data: newBooth, error: boothError } = await supabase
        .from('booths')
        .select('*')
        .eq('id', boothId)
        .single();

      if (boothError) throw boothError;
      if (newBooth) {
        setBooths([...booths, newBooth]);
      }

      toast.success('Booth added to collection');
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding booth:', error);
      toast.error('Failed to add booth');
    }
  };

  const handleRemoveBooth = async (boothId: string) => {
    if (!collection) return;

    try {
      const newBoothIds = collection.booth_ids.filter((id) => id !== boothId);

      const { error } = await supabase
        .from('collections')
        .update({ booth_ids: newBoothIds })
        .eq('id', collection.id);

      if (error) throw error;

      setCollection({ ...collection, booth_ids: newBoothIds });
      setBooths(booths.filter((b) => b.id !== boothId));
      toast.success('Booth removed from collection');
    } catch (error) {
      console.error('Error removing booth:', error);
      toast.error('Failed to remove booth');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !collection) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link
            href="/my-collections"
            className="inline-flex items-center text-sm text-neutral-600 hover:text-primary transition mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Collections
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-neutral-900">{collection.name}</h1>
                <Badge variant="secondary" className="flex items-center gap-1">
                  {collection.is_public ? (
                    <Globe className="w-3 h-3" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                  {collection.is_public ? 'Public' : 'Private'}
                </Badge>
              </div>
              {collection.description && (
                <p className="text-neutral-600 mt-1">{collection.description}</p>
              )}
              <p className="text-sm text-neutral-500 mt-2">
                {booths.length} {booths.length === 1 ? 'booth' : 'booths'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={handleDeleteCollection}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Add Booth Section */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Add Booths</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Search booths by name, city, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchBooths()}
              className="flex-1"
            />
            <Button onClick={handleSearchBooths} disabled={searching}>
              {searching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-neutral-600">
                Found {searchResults.length} booths
              </p>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {searchResults.map((booth) => (
                  <div
                    key={booth.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded border border-neutral-200"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">{booth.name}</p>
                      <p className="text-sm text-neutral-600">
                        {booth.city}, {booth.country}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddBooth(booth.id)}
                      disabled={collection.booth_ids.includes(booth.id)}
                    >
                      {collection.booth_ids.includes(booth.id) ? (
                        'Added'
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Booths Grid */}
        {booths.length === 0 ? (
          <Card className="p-12 text-center">
            <FolderOpen className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              No booths in this collection yet
            </h3>
            <p className="text-neutral-600">
              Search and add booths to start building your collection
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {booths.map((booth) => (
              <div key={booth.id} className="relative">
                <BoothCard booth={booth} />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 left-2 z-10 bg-white/90 hover:bg-red-50 text-red-600 hover:text-red-700"
                  onClick={() => handleRemoveBooth(booth.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateCollection}>
            <DialogHeader>
              <DialogTitle>Edit Collection</DialogTitle>
              <DialogDescription>Update your collection details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">
                  Collection Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-2 block">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700">
                  Public Collection
                </label>
                <Switch
                  checked={formData.is_public}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_public: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Collection'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
