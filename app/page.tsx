'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { useCart } from '@/lib/cart/cart-context'; // 1. Added Import
import { Product, Category } from '@/lib/supabase/types';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Package } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

export default function HomePage() {
  const { user } = useAuth();
  const { addToCart } = useCart(); // 2. Get addToCart from context
  const router = useRouter();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Carousel states
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredImages, setFeaturedImages] = useState<any[]>([]);

  // State for the Image Lightbox/Modal
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [productsRes, bestSellersRes, categoriesRes, featuredRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .eq('is_featured', true)
          .limit(12),
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('total_sales', { ascending: false })
          .limit(12),
        supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .is('parent_id', null)
          .order('sort_order')
          .limit(6),
        supabase
          .from('featured_images')
          .select('*')
          .eq('is_active', true)
          .order('sort_order')
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (bestSellersRes.data) setBestSellers(bestSellersRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (featuredRes.data) setFeaturedImages(featuredRes.data);
      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!carouselApi) return;
    setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on('select', () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  // 3. UPDATED: Now supports Guest Cart
  const handleAddToCart = async (productId: string, productName: string) => {
    // ❌ Login check REMOVED to allow guests
    // if (!user) { router.push('/auth/login'); return; }

    try {
      // ✅ Use Context (Handles LocalStorage for guests automatically)
      await addToCart(productId, 1);
      
      toast({
        title: 'Added to Cart',
        description: `${productName} added to your cart`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add to cart',
        variant: 'destructive',
      });
    }
  };

  // Helper component to render a product card
  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="hover:shadow-lg transition group overflow-hidden h-full flex flex-col">
      <CardContent className="p-0 flex flex-col h-full">
        {/* IMAGE CLICKABLE AREA - OPENS MODAL */}
        <div 
          className="aspect-square bg-gray-100 overflow-hidden relative cursor-zoom-in"
          onClick={() => setViewingProduct(product)}
        >
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-300" />
            </div>
          )}
        </div>

        <div className="p-3 space-y-2 flex flex-col flex-1">
          {/* TITLE CLICKABLE AREA - GOES TO PAGE */}
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5rem] hover:text-blue-900 hover:underline transition">
              {product.name}
            </h3>
          </Link>

          <div className="mt-auto space-y-2">
            <p className="text-lg font-bold text-blue-900">
              ৳{product.price || product.base_price}
            </p>
            <Button
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering other clicks
                handleAddToCart(product.id, product.name);
              }}
              className="w-full bg-blue-900 hover:bg-blue-800 h-9"
              size="sm"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="hidden md:grid md:grid-cols-3 gap-4">
            {featuredImages.map((item) => (
              <div key={item.id} className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/20 transition cursor-pointer">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-32 object-cover"
                />
                <div className="p-3">
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="text-sm text-blue-100">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="md:hidden">
            <Carousel opts={{ align: "start" }} className="w-full" setApi={setCarouselApi}>
              <CarouselContent>
                {featuredImages.map((item) => (
                  <CarouselItem key={item.id}>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="text-xl font-bold">{item.title}</h3>
                        <p className="text-sm text-blue-100">{item.description}</p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-2 mt-4">
                {featuredImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => carouselApi?.scrollTo(index)}
                    className={`h-2 rounded-full transition-all ${
                      currentSlide === index ? 'w-8 bg-white' : 'w-2 bg-white/50'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </Carousel>
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Best Sellers</h2>
              <p className="text-sm text-gray-600">Most popular products</p>
            </div>
            <Link href="/products">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-3">
                    <Skeleton className="w-full aspect-square mb-3" />
                    <Skeleton className="w-full h-4 mb-2" />
                    <Skeleton className="w-3/4 h-3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : bestSellers.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">No best sellers yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-sm text-gray-600">Check out our top picks</p>
            </div>
            <Link href="/products">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-3">
                    <Skeleton className="w-full aspect-square mb-3" />
                    <Skeleton className="w-full h-4 mb-2" />
                    <Skeleton className="w-3/4 h-3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Yet</h3>
              <p className="text-gray-600 mb-4">Products will appear here once they are added.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* IMAGE VIEWER MODAL (LIGHTBOX) */}
      <Dialog open={!!viewingProduct} onOpenChange={(open) => !open && setViewingProduct(null)}>
        <DialogContent className="max-w-4xl bg-black/90 border-none text-white p-0 overflow-hidden">
          <div className="relative w-full h-[80vh] flex flex-col items-center justify-center p-4">
            
            {viewingProduct && viewingProduct.images && viewingProduct.images.length > 0 ? (
               <Carousel className="w-full max-w-2xl">
                 <CarouselContent>
                   {viewingProduct.images.map((img, index) => (
                     <CarouselItem key={index} className="flex items-center justify-center h-[70vh]">
                       <img 
                         src={img} 
                         alt={`${viewingProduct.name} - ${index + 1}`} 
                         className="max-h-full max-w-full object-contain"
                       />
                     </CarouselItem>
                   ))}
                 </CarouselContent>
                 <CarouselPrevious className="left-2 bg-white/20 hover:bg-white/40 border-none text-white" />
                 <CarouselNext className="right-2 bg-white/20 hover:bg-white/40 border-none text-white" />
               </Carousel>
            ) : (
               <div className="flex flex-col items-center text-gray-400">
                  <Package className="w-24 h-24 mb-4" />
                  <p>No images available</p>
               </div>
            )}
            
            {/* Product Details overlay in modal */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
               <h2 className="text-xl font-bold">{viewingProduct?.name}</h2>
               <p className="text-lg font-semibold text-blue-300">৳{viewingProduct?.price || viewingProduct?.base_price}</p>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
