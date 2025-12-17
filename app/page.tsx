'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { useCart } from '@/lib/cart/cart-context';
import { Product, Category } from '@/lib/supabase/types';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Package, ChevronRight, MessageSquare, Phone } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { AnimatePresence, motion } from 'framer-motion';

// 1. DEFINE THE EXACT MAIN CATEGORIES YOU WANT TO SHOW
const TARGET_CATEGORIES = [
  "Women’s Fashion",
  "Man’s Fashion",
  "Laptop & Computer Accessories",
  "Gadgets",
  "Headphone",
  "Watches",
  "CCTV Camera",
  "Home Appliances",
  "Home Electronics",
  "Home Decor & Textile"
];

export default function HomePage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
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
  const carouselInterval = useRef<NodeJS.Timer>();

  // State for product lightbox
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Floating help button states
  const [showHelpText, setShowHelpText] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Fetch products, categories, featured images
  useEffect(() => {
    const fetchData = async () => {
      const [productsRes, bestSellersRes, categoriesRes, featuredRes] = await Promise.all([
        supabase.from('products').select('*').eq('is_active', true).eq('is_featured', true).limit(12),
        supabase.from('products').select('*').eq('is_active', true).order('total_sales', { ascending: false }).limit(12),
        supabase.from('categories').select('*').eq('is_active', true).limit(50),
        supabase.from('featured_images').select('*').eq('is_active', true).order('sort_order')
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (bestSellersRes.data) setBestSellers(bestSellersRes.data);

      if (categoriesRes.data) {
        const sortMap = new Map(TARGET_CATEGORIES.map((name, i) => [name.toLowerCase(), i]));
        const filteredCategories = categoriesRes.data
          .filter(cat => TARGET_CATEGORIES.some(target => target.toLowerCase() === cat.name.toLowerCase()))
          .sort((a, b) => (sortMap.get(a.name.toLowerCase()) ?? 999) - (sortMap.get(b.name.toLowerCase()) ?? 999));
        setCategories(filteredCategories);
      }

      if (featuredRes.data) setFeaturedImages(featuredRes.data);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Carousel auto-slide every 5 seconds
  useEffect(() => {
    if (!carouselApi || featuredImages.length === 0) return;

    carouselInterval.current = setInterval(() => {
      const nextIndex = (carouselApi.selectedScrollSnap() + 1) % featuredImages.length;
      carouselApi.scrollTo(nextIndex);
    }, 5000);

    return () => {
      if (carouselInterval.current) clearInterval(carouselInterval.current);
    };
  }, [carouselApi, featuredImages]);

  useEffect(() => {
    if (!carouselApi) return;
    setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on('select', () => setCurrentSlide(carouselApi.selectedScrollSnap()));
  }, [carouselApi]);

  // Show help text after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHelpText(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleAddToCart = async (productId: string, productName: string) => {
    try {
      await addToCart(productId, 1);
      toast({ title: 'Added to Cart', description: `${productName} added to your cart` });
    } catch {
      toast({ title: 'Error', description: 'Failed to add to cart', variant: 'destructive' });
    }
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="hover:shadow-lg transition group overflow-hidden h-full flex flex-col border-gray-200">
      <CardContent className="p-0 flex flex-col h-full">
        <div className="aspect-square bg-gray-50 overflow-hidden relative cursor-zoom-in" onClick={() => setViewingProduct(product)}>
          {product.images && product.images.length > 0 ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-gray-300" />
            </div>
          )}
        </div>
        <div className="p-2 space-y-2 flex flex-col flex-1">
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5rem] hover:text-blue-900 hover:underline transition leading-tight">{product.name}</h3>
          </Link>
          <div className="mt-auto space-y-2">
            <p className="text-base md:text-lg font-bold text-blue-900">৳{product.price || product.base_price}</p>
            <Button onClick={(e) => { e.stopPropagation(); handleAddToCart(product.id, product.name); }} className="w-full bg-blue-900 hover:bg-blue-800 h-9 text-xs md:text-sm font-medium" size="sm">
              <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Hero Carousel Section */}
      <section className="bg-white pt-4 pb-2">
        <div className="w-full max-w-[1800px] mx-auto px-4">
          {/* Desktop */}
          <div className="hidden md:block">
            <Carousel className="w-full" opts={{ loop: true }} setApi={setCarouselApi}>
              <CarouselContent>
                {featuredImages.map((item) => (
                  <CarouselItem key={item.id}>
                    <div className="relative h-[380px] w-full rounded-2xl overflow-hidden bg-gray-900 group">
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent flex flex-col justify-center px-16">
                        <div className="max-w-2xl space-y-4 animate-in fade-in slide-in-from-left-8 duration-700">
                          <h2 className="text-5xl font-extrabold text-white tracking-tight leading-tight">{item.title}</h2>
                          <p className="text-lg text-gray-100 font-medium leading-relaxed">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-8 bg-white/10 hover:bg-white/30 border-none text-white h-12 w-12 backdrop-blur-md" />
              <CarouselNext className="right-8 bg-white/10 hover:bg-white/30 border-none text-white h-12 w-12 backdrop-blur-md" />
            </Carousel>
          </div>

          {/* Mobile */}
          <div className="md:hidden">
            <Carousel opts={{ align: "start", loop: true }} className="w-full" setApi={setCarouselApi}>
              <CarouselContent>
                {featuredImages.map((item) => (
                  <CarouselItem key={item.id}>
                    <div className="relative h-[160px] w-full rounded-xl overflow-hidden bg-gray-900">
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover opacity-90" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                        <h3 className="text-xl font-bold text-white leading-tight">{item.title}</h3>
                        <p className="text-xs text-gray-200 line-clamp-1">{item.description}</p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-1.5 mt-2">
                {featuredImages.map((_, index) => (
                  <button key={index} onClick={() => carouselApi?.scrollTo(index)} className={`h-1.5 rounded-full transition-all ${currentSlide === index ? 'w-6 bg-blue-900' : 'w-1.5 bg-gray-300'}`} />
                ))}
              </div>
            </Carousel>
          </div>
        </div>
      </section>

      {/* Category Section */}
      <section className="bg-white py-4 border-b border-gray-100">
        <div className="w-full max-w-[1800px] mx-auto px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Shop by Category</h2>
            <Link href="/products" className="text-sm font-medium text-blue-700 hover:text-orange-700 hover:underline flex items-center">
              See all <ChevronRight className="h-4 w-4 ml-0.5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-24 rounded-full flex-shrink-0" />
              ))}
            </div>
          ) : (
            <Carousel opts={{ align: "start", dragFree: true, containScroll: "trimSnaps" }} className="w-full">
              <CarouselContent className="-ml-3">
                {categories.map((cat) => (
                  <CarouselItem key={cat.id} className="pl-3 basis-[28%] sm:basis-[20%] md:basis-[14%] lg:basis-[10%]">
                    <Link href={`/products?category=${cat.id}`} className="group block text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-50 border border-gray-100 overflow-hidden relative shadow-sm group-hover:shadow-md transition-all">
                          {cat.image_url ? (
                            <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <span className="text-xs md:text-sm font-medium text-gray-900 group-hover:text-blue-700 leading-tight line-clamp-2 px-1">{cat.name}</span>
                      </div>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          )}
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="py-8 bg-gray-50">
        <div className="w-full max-w-[1800px] mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Best Sellers</h2>
              <p className="text-xs md:text-sm text-gray-600">Most popular products</p>
            </div>
            <Link href="/products">
              <Button variant="outline" size="sm" className="h-8 text-xs">View All</Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 md:gap-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-2">
                    <Skeleton className="w-full aspect-square mb-2" />
                    <Skeleton className="w-full h-3 mb-2" />
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 md:gap-3">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-8 bg-white">
        <div className="w-full max-w-[1800px] mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-xs md:text-sm text-gray-600">Check out our top picks</p>
            </div>
            <Link href="/products">
              <Button variant="outline" size="sm" className="h-8 text-xs">View All</Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 md:gap-3">
              {[...Array(12)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-2">
                    <Skeleton className="w-full aspect-square mb-2" />
                    <Skeleton className="w-full h-3 mb-2" />
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 md:gap-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Product Lightbox Modal */}
      <Dialog open={!!viewingProduct} onOpenChange={(open) => !open && setViewingProduct(null)}>
        <DialogContent className="max-w-4xl bg-black/90 border-none text-white p-0 overflow-hidden">
          <div className="relative w-full h-[80vh] flex flex-col items-center justify-center p-4">
            {viewingProduct && viewingProduct.images && viewingProduct.images.length > 0 ? (
              <Carousel className="w-full max-w-2xl">
                <CarouselContent>
                  {viewingProduct.images.map((img, index) => (
                    <CarouselItem key={index} className="flex items-center justify-center h-[70vh]">
                      <img src={img} alt={`${viewingProduct.name} - ${index + 1}`} className="max-h-full max-w-full object-contain" />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white h-10 w-10 rounded-full" />
                <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white h-10 w-10 rounded-full" />
              </Carousel>
            ) : (
              <Package className="w-16 h-16 text-gray-300" />
            )}
            <Button onClick={() => setViewingProduct(null)} className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 text-white">Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Help Button */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-50">
        <AnimatePresence>
          {showHelpText && !expanded && (
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
              className="relative bg-white text-gray-900 px-4 py-2 rounded shadow-md text-sm select-none max-w-xs md:max-w-sm">
              Need help?
            </motion.div>
          )}
        </AnimatePresence>

        <Button onClick={() => setExpanded(prev => !prev)} className="bg-blue-900 hover:bg-blue-800 text-white rounded-full p-4 shadow-lg flex items-center justify-center">
          💬
        </Button>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="flex flex-col gap-2 mt-2">
              <a href="https://m.me/spraxe" target="_blank" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Messenger
              </a>
              <a href="https://wa.me/01606087761" target="_blank" className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 flex items-center gap-2">
                <Phone className="w-4 h-4" /> WhatsApp
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
}
