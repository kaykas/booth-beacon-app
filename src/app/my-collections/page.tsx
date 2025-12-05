'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, FolderOpen, Lock, Globe, Trash2, Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Collection {
  id: string;
  name: string;
  description: string | null;
  booth_ids: string[];
  is_public: boolean;
  created_at: string;
}

export default function MyCollectionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false,
  });
  const [submitting, setSubmitting] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please sign in to view your collections');
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Fetch collections
  useEffect(() => {
    async function fetchCollections() {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('collections')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCollections(data || []);
      } catch (error) {
        console.error('Error fetching collections:', error);
        toast.error('Failed to load collections');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchCollections();

      // Subscribe to real-time changes for user's collections
      const collectionsChannel = supabase
        .channel(`user-collections-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'collections',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Add new collection to the list
            setCollections((prev) => [payload.new as Collection, ...prev]);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'collections',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Update existing collection
            setCollections((prev) =>
              prev.map((c) => (c.id === payload.new.id ? (payload.new as Collection) : c))
            );
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'collections',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Remove deleted collection
            setCollections((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(collectionsChannel);
      };
    }
  }, [user]);

  const handleOpenDialog = (collection?: Collection) => {
    if (collection) {
      setEditingCollection(collection);
      setFormData({
        name: collection.name,
        description: collection.description || '',
        is_public: collection.is_public,
      });
    } else {
      setEditingCollection(null);
      setFormData({ name: '', description: '', is_public: false });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name.trim()) {
      toast.error('Collection name is required');
      return;
    }

    try {
      setSubmitting(true);

      if (editingCollection) {
        // Update existing collection
        const { error } = await supabase
          .from('collections')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            is_public: formData.is_public,
          })
          .eq('id', editingCollection.id);

        if (error) throw error;
        toast.success('Collection updated successfully');
      } else {
        // Create new collection
        const { error } = await supabase.from('collections').insert({
          user_id: user.id,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          booth_ids: [],
          is_public: formData.is_public,
        });

        if (error) throw error;
        toast.success('Collection created successfully');
      }

      // Refresh collections
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollections(data || []);
      setIsDialogOpen(false);
      setFormData({ name: '', description: '', is_public: false });
    } catch (error) {
      console.error('Error saving collection:', error);
      toast.error('Failed to save collection');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (collectionId: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;

    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId);

      if (error) throw error;

      setCollections(collections.filter((c) => c.id !== collectionId));
      toast.success('Collection deleted successfully');
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('Failed to delete collection');
    }
  };

  if (authLoading || (loading && !collections.length)) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">My Collections</h1>
              <p className="text-neutral-600 mt-1">
                Organize your favorite photo booths into collections
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Collection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCollection ? 'Edit Collection' : 'Create New Collection'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCollection
                        ? 'Update your collection details'
                        : 'Create a new collection to organize your favorite booths'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-700 mb-2 block">
                        Collection Name
                      </label>
                      <Input
                        placeholder="e.g., NYC Favorites, Must Visit"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-700 mb-2 block">
                        Description (optional)
                      </label>
                      <Textarea
                        placeholder="What makes this collection special?"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_public"
                        checked={formData.is_public}
                        onChange={(e) =>
                          setFormData({ ...formData, is_public: e.target.checked })
                        }
                        className="rounded border-neutral-300"
                      />
                      <label htmlFor="is_public" className="text-sm text-neutral-700">
                        Make this collection public
                      </label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : editingCollection ? (
                        'Update'
                      ) : (
                        'Create'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {collections.length === 0 ? (
          <Card className="p-12 text-center">
            <FolderOpen className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              No collections yet
            </h3>
            <p className="text-neutral-600 mb-6">
              Start organizing your favorite photo booths by creating your first collection
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Collection
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Card
                key={collection.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Link
                      href={`/my-collections/${collection.id}`}
                      className="text-lg font-semibold text-neutral-900 hover:text-primary transition-colors"
                    >
                      {collection.name}
                    </Link>
                    {collection.description && (
                      <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                        {collection.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="ml-2 flex items-center gap-1">
                    {collection.is_public ? (
                      <Globe className="w-3 h-3" />
                    ) : (
                      <Lock className="w-3 h-3" />
                    )}
                    {collection.is_public ? 'Public' : 'Private'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm text-neutral-600 mb-4">
                  <span>{collection.booth_ids.length} booths</span>
                  <span>
                    Created {new Date(collection.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <Link href={`/my-collections/${collection.id}`}>
                      View
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(collection)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(collection.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
