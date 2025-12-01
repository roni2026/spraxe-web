'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';

interface FeaturedImage {
  id: number;
  title: string;
  description: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

export default function FeaturedImagesManagement() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<FeaturedImage[]>([]);

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      router.push('/');
      return;
    }
    loadImages();
  }, [user, profile]);

  const loadImages = async () => {
    const { data, error } = await supabase
      .from('featured_images')
      .select('*')
      .order('sort_order');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load featured images',
        variant: 'destructive',
      });
    } else if (data) {
      setImages(data);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    const updates = images.map(img =>
      supabase
        .from('featured_images')
        .update({
          title: img.title,
          description: img.description,
          image_url: img.image_url,
          sort_order: img.sort_order,
          is_active: img.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', img.id)
    );

    const results = await Promise.all(updates);
    const hasError = results.some(r => r.error);

    if (hasError) {
      toast({
        title: 'Error',
        description: 'Failed to update some images',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Featured images updated successfully',
      });
      loadImages();
    }

    setLoading(false);
  };

  const handleImageChange = (id: number, field: keyof FeaturedImage, value: string | number | boolean) => {
    setImages(images.map(img =>
      img.id === id ? { ...img, [field]: value } : img
    ));
  };

  const handleAddNew = async () => {
    const maxOrder = Math.max(...images.map(img => img.sort_order), 0);

    const { data, error } = await supabase
      .from('featured_images')
      .insert({
        title: 'New Featured Section',
        description: 'Add description',
        image_url: 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=600',
        sort_order: maxOrder + 1,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add new image',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'New featured image added',
      });
      loadImages();
    }
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase
      .from('featured_images')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete image',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Featured image deleted',
      });
      loadImages();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Manage Featured Images</h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAddNew}
              variant="outline"
              className="bg-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-900 hover:bg-blue-800"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {images.map((image) => (
            <Card key={image.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Featured Image #{image.sort_order}</CardTitle>
                {images.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(image.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`title-${image.id}`}>Title</Label>
                    <Input
                      id={`title-${image.id}`}
                      value={image.title}
                      onChange={(e) => handleImageChange(image.id, 'title', e.target.value)}
                      placeholder="e.g., Electronics"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`sort-${image.id}`}>Sort Order</Label>
                    <Input
                      id={`sort-${image.id}`}
                      type="number"
                      value={image.sort_order}
                      onChange={(e) => handleImageChange(image.id, 'sort_order', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`description-${image.id}`}>Description</Label>
                  <Input
                    id={`description-${image.id}`}
                    value={image.description}
                    onChange={(e) => handleImageChange(image.id, 'description', e.target.value)}
                    placeholder="e.g., Latest gadgets & devices"
                  />
                </div>
                <div>
                  <Label htmlFor={`image-${image.id}`}>Image URL</Label>
                  <Input
                    id={`image-${image.id}`}
                    value={image.image_url}
                    onChange={(e) => handleImageChange(image.id, 'image_url', e.target.value)}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste image URL from Pexels, Unsplash, or your own hosting
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`active-${image.id}`}
                    checked={image.is_active}
                    onCheckedChange={(checked) => handleImageChange(image.id, 'is_active', checked)}
                  />
                  <Label htmlFor={`active-${image.id}`}>Active</Label>
                </div>
                {image.image_url && (
                  <div>
                    <Label>Preview</Label>
                    <img
                      src={image.image_url}
                      alt={image.title}
                      className="w-full h-48 object-cover rounded-lg mt-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
