'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Category } from '@/lib/supabase/types';

export default function NewProductPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [parentCategoryId, setParentCategoryId] = useState<string>(''); // Track selected parent
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    sku: '',
    category_id: '',
    price: '',
    retail_price: '',
    stock_quantity: '',
    unit: 'pieces',
    is_featured: false,
    image1: '',
    image2: '',
    image3: '',
    image4: '',
  });

  useEffect(() => {
    // Basic Admin Check
    // Note: You might want to robustly check roles on the server side or RLS policies too
    if (user && profile?.role !== 'admin') {
      // router.push('/'); // Uncomment if you have strict role checks
    }
    fetchCategories();
  }, [user, profile]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (data) setCategories(data);
  };

  // Helper to Filter Categories
  const mainCategories = categories.filter((c) => !c.parent_id);
  const subCategories = categories.filter((c) => c.parent_id === parentCategoryId);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleParentCategoryChange = (value: string) => {
    setParentCategoryId(value);
    setFormData({ ...formData, category_id: '' }); // Reset subcategory when parent changes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.category_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select a subcategory',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const basePrice = parseFloat(formData.price);
    const retailPrice = formData.retail_price ? parseFloat(formData.retail_price) : basePrice;

    const images = [
      formData.image1,
      formData.image2,
      formData.image3,
      formData.image4,
    ].filter(img => img.trim() !== '');

    const { error } = await supabase.from('products').insert({
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      sku: formData.sku,
      category_id: formData.category_id,
      base_price: basePrice,
      price: retailPrice,
      retail_price: retailPrice,
      stock_quantity: parseInt(formData.stock_quantity),
      unit: formData.unit,
      seller_id: user?.id,
      approval_status: 'approved',
      is_featured: formData.is_featured,
      is_active: true,
      images: images,
      tags: [],
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Product created successfully',
      });
      router.push('/admin');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Add New Product</h1>

          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Name & Slug */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                {/* Categories & SKU */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   {/* 1. Main Category Select */}
                   <div>
                    <Label htmlFor="parent_category">Main Category *</Label>
                    <Select
                      value={parentCategoryId}
                      onValueChange={handleParentCategoryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Main Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {mainCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 2. Subcategory Select */}
                  <div>
                    <Label htmlFor="category">Subcategory *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                      disabled={!parentCategoryId} // Disable until parent is chosen
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={!parentCategoryId ? "Select Main First" : "Select Subcategory"} />
                      </SelectTrigger>
                      <SelectContent>
                        {subCategories.length > 0 ? (
                          subCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500">No subcategories found</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (৳) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="retail_price">Retail Price (৳)</Label>
                    <Input
                      id="retail_price"
                      type="number"
                      step="0.01"
                      value={formData.retail_price}
                      onChange={(e) => setFormData({ ...formData, retail_price: e.target.value })}
                    />
                  </div>
                </div>

                {/* Stock & Unit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit *</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      required
                      placeholder="e.g., pieces, kg, boxes"
                    />
                  </div>
                </div>

                {/* Images */}
                <div>
                  <Label>Product Images (URLs)</Label>
                  <div className="space-y-2 mt-2">
                    <Input
                      placeholder="Image URL 1"
                      value={formData.image1}
                      onChange={(e) => setFormData({ ...formData, image1: e.target.value })}
                    />
                    <Input
                      placeholder="Image URL 2 (optional)"
                      value={formData.image2}
                      onChange={(e) => setFormData({ ...formData, image2: e.target.value })}
                    />
                    <Input
                      placeholder="Image URL 3 (optional)"
                      value={formData.image3}
                      onChange={(e) => setFormData({ ...formData, image3: e.target.value })}
                    />
                    <Input
                      placeholder="Image URL 4 (optional)"
                      value={formData.image4}
                      onChange={(e) => setFormData({ ...formData, image4: e.target.value })}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Paste image URLs from Pexels, Unsplash, or your own hosting
                  </p>
                </div>

                {/* Featured Checkbox */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-900 focus:ring-blue-900"
                  />
                  <Label htmlFor="featured" className="cursor-pointer">
                    Feature this product on homepage
                  </Label>
                </div>

                {/* Actions */}
                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    className="bg-blue-900 hover:bg-blue-800"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Product'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin')}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
