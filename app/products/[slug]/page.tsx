'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Added for Breadcrumbs
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { useCart } from '@/lib/cart/cart-context';
import { Product, Category } from '@/lib/supabase/types';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Package, Minus, Plus, CreditCard, MessageCircle, ChevronRight, Home } from 'lucide-react';

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { user } = useAuth();
  const { addToCart: addToCartContext } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [categoryChain, setCategoryChain] = useState<Category[]>([]); // To store [Parent, Child]
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [params.slug]);

  const fetchProduct = async () => {
    setLoading(true);
    
    // 1. Fetch Product
    const { data: productData, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', params.slug)
      .eq('is_active', true)
      .maybeSingle();

    if (productData) {
      setProduct(productData);
      setQuantity(1);

      // 2. Fetch Category Hierarchy (Breadcrumbs)
      if (productData.category_id) {
        await fetchCategoryHierarchy(productData.category_id);
      }
    }
    setLoading(false);
  };

  // Helper to fetch current category and its parent
  const fetchCategoryHierarchy = async (categoryId: string) => {
    try {
      // Get the immediate category
      const { data: currentCat } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (!currentCat) return;

      const chain = [currentCat];

      // If it has a parent, fetch the parent
      if (currentCat.parent_id) {
        const { data: parentCat } = await supabase
          .from('categories')
          .select('*')
          .eq('id', currentCat.parent_id)
          .single();
        
        if (parentCat) {
          chain.unshift(parentCat); // Add parent to the start of the array
        }
      }
      setCategoryChain(chain);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

const handleAddToCart = async () => {
    // REMOVED THE LOGIN CHECK HERE
    // The CartContext will handle saving to localStorage automatically!
    
    if (!product) return;

    setAdding(true);
    try {
      await addToCartContext(product.id, quantity);
      toast({
        title: 'Added to Cart',
        description: `${product.name} (${quantity} ${product.unit}) added to your cart`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add to cart. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    await handleAddToCart();
    router.push('/cart');
  };

  const handleContactSeller = () => {
    const message = `Hi, I'm interested in ${product?.name}`;
    const whatsappUrl = `https://wa.me/8801XXXXXXXXX?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
            <p className="text-gray-600">The product you're looking for doesn't exist.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 flex-1">
        
        {/* BREADCRUMBS SECTION */}
        <nav className="flex items-center text-sm text-gray-500 mb-6 overflow-x-auto whitespace-nowrap pb-2">
          <Link href="/" className="hover:text-blue-900 flex items-center">
            <Home className="w-4 h-4 mr-1" />
            Home
          </Link>
          
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          
          <Link href="/products" className="hover:text-blue-900">
            Products
          </Link>

          {/* Dynamic Categories */}
          {categoryChain.map((cat) => (
            <div key={cat.id} className="flex items-center">
              <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
              <Link 
                href={`/products?category=${cat.id}`} 
                className="hover:text-blue-900 font-medium"
              >
                {cat.name}
              </Link>
            </div>
          ))}

          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <span className="text-gray-900 font-semibold truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg p-6">
            <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center mb-4 overflow-hidden relative">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-contain" // Changed to contain to see full product
                />
              ) : (
                <Package className="w-24 h-24 text-gray-300" />
              )}
              {/* Optional: Add badge if low stock */}
              {product.stock_quantity === 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow">
                  Out of Stock
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-4">
              <Badge variant="secondary" className="mb-4">
                SKU: {product.sku}
              </Badge>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-gray-600 leading-relaxed">
                {product.description || 'Quality wholesale product for your business needs.'}
              </p>
            </div>

            <Card className="mb-6 border-blue-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-baseline space-x-3 mb-4">
                  <span className="text-4xl font-bold text-blue-900">
                    ৳{product.base_price}
                  </span>
                  {product.retail_price && (
                    <span className="text-xl text-gray-500 line-through">
                      ৳{product.retail_price}
                    </span>
                  )}
                  <span className="text-sm text-gray-600">per {product.unit}</span>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between border-b pb-2">
                    <span>Stock Available:</span>
                    <span className="font-medium text-gray-900">{product.stock_quantity} {product.unit}</span>
                  </div>
                  {/* You can add more specs here easily */}
                </div>
              </CardContent>
            </Card>

            <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
              <Label className="mb-2 block text-gray-700">Quantity ({product.unit})</Label>
              <div className="flex items-center space-x-4 mb-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQuantity(Math.max(1, val));
                  }}
                  className="text-center w-24 h-10"
                  min={1}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="mb-4 p-4 bg-blue-50 rounded-lg flex justify-between items-center">
                <span className="font-semibold text-blue-900">Total Price:</span>
                <span className="text-xl font-bold text-blue-900">
                  ৳{((product.price || product.base_price || 0) * quantity).toFixed(2)}
                </span>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full bg-blue-900 hover:bg-blue-800 h-12 text-lg"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={adding || product.stock_quantity === 0}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {adding ? 'Adding...' : 'Add to Cart'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleBuyNow}
                    disabled={adding || product.stock_quantity === 0}
                    className="border-blue-900 text-blue-900 hover:bg-blue-50 h-11"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Buy Now
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleContactSeller}
                    className="border-green-600 text-green-600 hover:bg-green-50 h-11"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            </div>

            {product.stock_quantity === 0 && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mt-4 text-center">
                <p className="font-bold">Out of Stock</p>
                <p className="text-sm">We are restocking soon. Check back later!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
