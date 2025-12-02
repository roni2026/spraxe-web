'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Product, Category } from '@/lib/supabase/types';
import { useCart } from '@/lib/cart/cart-context';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'; // Import Sheet
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Package, Search, ChevronDown, ChevronRight, ChevronLeft, Filter } from 'lucide-react';

const PRODUCTS_PER_PAGE = 12;

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [priceRange, setPriceRange] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  
  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1); 
  }, [selectedCategory, priceRange, search]);

  useEffect(() => {
    if (categories.length > 0 && selectedCategory) {
      const current = categories.find(c => c.id === selectedCategory);
      if (current && current.parent_id) {
        setExpandedFilter(current.parent_id);
      } else if (current && !current.parent_id) {
        setExpandedFilter(current.id);
      }
    }
  }, [categories, selectedCategory]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchProducts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }); // Ensure correct order

    if (data) setCategories(data);
  };

  const fetchProducts = async (page: number) => {
    setLoading(true);
    
    const from = (page - 1) * PRODUCTS_PER_PAGE;
    const to = from + PRODUCTS_PER_PAGE - 1;

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, count } = await query;

    if (data) {
      let filteredData = data;
      if (priceRange !== 'all') {
        filteredData = data.filter((product) => {
          const price = product.price || product.base_price || 0;
          if (priceRange === 'under-500') return price < 500;
          if (priceRange === '500-1000') return price >= 500 && price <= 1000;
          if (priceRange === '1000-2000') return price >= 1000 && price <= 2000;
          if (priceRange === 'over-2000') return price > 2000;
          return true;
        });
      }
      setProducts(filteredData);
      setTotalProducts(count || 0);
    }
    setLoading(false);
  };

  const handleCategoryClick = (categoryId: string) => {
    const newCategory = selectedCategory === categoryId ? null : categoryId;
    setSelectedCategory(newCategory);
    
    const url = new URL(window.location.href);
    if (newCategory) {
      url.searchParams.set('category', newCategory);
    } else {
      url.searchParams.delete('category');
    }
    window.history.pushState({}, '', url);
  };

  const toggleFilterExpand = (categoryId: string) => {
    setExpandedFilter(prev => prev === categoryId ? null : categoryId);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setExpandedFilter(null);
    setPriceRange('all');
    setSearch('');
    
    const url = new URL(window.location.href);
    url.searchParams.delete('category');
    window.history.pushState({}, '', url);
  };

  const handleQuickAdd = async (productId: string, productName: string) => {
    setAddingToCart(productId);
    try {
      await addToCart(productId, 1);
      toast({
        title: 'Added to cart',
        description: `${productName} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add item to cart.',
        variant: 'destructive',
      });
    } finally {
      setAddingToCart(null);
    }
  };

  const mainCategories = categories.filter(c => !c.parent_id);
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

  // Reusable Filter Content Component
  const FilterContent = () => (
    <Card className="border-none shadow-none md:border md:shadow-sm">
      <CardContent className="p-0 md:p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-gray-900">Filters</h3>
          {(selectedCategory || priceRange !== 'all' || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs text-blue-900 hover:text-blue-800 h-7"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Search is handled in main header for mobile, but kept here for desktop */}
        <div className="relative mb-4 hidden md:block">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-9 text-sm"
          />
        </div>

        <Separator className="my-4 hidden md:block" />

        <div>
          <h4 className="font-semibold text-sm text-gray-900 mb-3">Categories</h4>
          <ScrollArea className="h-[60vh] md:h-96">
            <div className="space-y-1 pr-3">
              {mainCategories.map((parent) => {
                const subcategories = categories.filter(c => c.parent_id === parent.id);
                const hasSubs = subcategories.length > 0;
                const isExpanded = expandedFilter === parent.id;
                const isSelected = selectedCategory === parent.id;

                return (
                  <div key={parent.id} className="select-none">
                    <div className="flex items-center justify-between py-1 group">
                      <button
                        onClick={() => {
                          handleCategoryClick(parent.id);
                          setExpandedFilter(parent.id);
                        }}
                        className={`text-sm text-left flex-1 transition-colors ${
                          isSelected ? 'font-bold text-blue-900' : 'text-gray-700 hover:text-blue-900'
                        }`}
                      >
                        {parent.name}
                      </button>
                      
                      {hasSubs && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFilterExpand(parent.id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      )}
                    </div>

                    {hasSubs && isExpanded && (
                      <div className="ml-2 pl-2 border-l-2 border-gray-100 space-y-1 mt-1">
                        {subcategories.map(child => {
                          const isChildSelected = selectedCategory === child.id;
                          return (
                            <button
                              key={child.id}
                              onClick={() => handleCategoryClick(child.id)}
                              className={`block w-full text-left text-xs py-1 transition-colors ${
                                isChildSelected ? 'font-bold text-blue-900' : 'text-gray-600 hover:text-blue-900'
                              }`}
                            >
                              {child.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <Separator className="my-4" />

        <div>
          <h4 className="font-semibold text-sm text-gray-900 mb-3">Price Range</h4>
          <div className="space-y-1">
            {[
              { value: 'all', label: 'All Prices' },
              { value: 'under-500', label: 'Under ৳500' },
              { value: '500-1000', label: '৳500 - ৳1,000' },
              { value: '1000-2000', label: '৳1,000 - ৳2,000' },
              { value: 'over-2000', label: 'Over ৳2,000' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPriceRange(option.value)}
                className={`block w-full text-left text-sm py-1 ${
                  priceRange === option.value ? 'font-bold text-blue-900' : 'text-gray-700 hover:text-blue-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-6 flex-1">
        
        {/* MOBILE FILTER BAR (Visible only on small screens) */}
        <div className="md:hidden mb-6 flex gap-3 sticky top-[72px] z-30 bg-gray-50 pb-2">
           <Sheet>
             <SheetTrigger asChild>
               <Button variant="outline" className="gap-2 bg-white flex-shrink-0">
                 <Filter className="h-4 w-4" /> Filters
               </Button>
             </SheetTrigger>
             <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
               <div className="mt-4">
                 <FilterContent />
               </div>
             </SheetContent>
           </Sheet>
           
           <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 text-sm bg-white"
              />
           </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          
          {/* DESKTOP SIDEBAR (Hidden on mobile) */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <FilterContent />
            </div>
          </aside>

          <div className="flex-1 min-w-0 flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">All Products</h1>
                <p className="text-sm text-gray-600">
                  Showing {products.length} of {totalProducts} products
                </p>
              </div>
            </div>

            {loading ? (
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
               </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
                <p className="text-gray-600">Try adjusting your filters</p>
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {products.map((product) => (
                    <Card key={product.id} className="hover:shadow-lg transition group flex flex-col h-full">
                      <CardContent className="p-0 flex-1 flex flex-col">
                        <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden relative">
                          {product.stock_quantity === 0 && (
                             <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase z-10">Out of Stock</div>
                          )}
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
                        <div className="p-3 flex flex-col flex-1">
                          <Link href={`/products/${product.slug}`} className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem] hover:text-blue-900 transition">
                              {product.name}
                            </h3>
                          </Link>
                          <div className="flex items-baseline space-x-1 mb-3">
                            <span className="text-lg font-bold text-blue-900">
                              ৳{product.price || product.base_price}
                            </span>
                            {product.retail_price && (
                              <span className="text-xs text-gray-500 line-through">
                                ৳{product.retail_price}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-auto">
                            <Button
                              className="flex-1 bg-blue-900 hover:bg-blue-800 h-8 text-xs"
                              size="sm"
                              onClick={() => handleQuickAdd(product.id, product.name)}
                              disabled={addingToCart === product.id || product.stock_quantity === 0}
                            >
                              <ShoppingCart className="mr-1 h-3 w-3" />
                              {addingToCart === product.id ? '...' : 'Add'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="w-10 h-10 p-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600 font-medium px-2">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 p-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
