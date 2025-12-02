'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Category } from '@/lib/supabase/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, X, ChevronDown, ChevronRight } from 'lucide-react';

interface CategorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// ✅ 1. Define your specific order here
// Note: These names must match your Database "name" column EXACTLY.
const CATEGORY_ORDER = [
  "Women's Fashion",
  "Men's Fashion",
  "Gadgets",
  "Watches",
  "Headphone",
  "Laptop & Computer Accessories",
  "CCTV Camera",
  "Home Appliances",
  "Home Electronics",
  "Home Decor & Textile"
];

export function CategorySidebar({ isOpen, onClose }: CategorySidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true);
      // We removed .order('name') because we will sort manually below

    if (data) {
      // ✅ 2. Custom Sorting Logic
      const sortedData = data.sort((a, b) => {
        const indexA = CATEGORY_ORDER.indexOf(a.name);
        const indexB = CATEGORY_ORDER.indexOf(b.name);

        // If both are in the list, sort by the specific order
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        
        // If only A is in the list, put A first
        if (indexA !== -1) return -1;
        
        // If only B is in the list, put B first
        if (indexB !== -1) return 1;
        
        // If neither are in the list, sort alphabetically at the bottom
        return a.name.localeCompare(b.name);
      });

      setCategories(sortedData);
    }
    setLoading(false);
  };

  const toggleCategory = (id: string) => {
    setExpandedCategory(expandedCategory === id ? null : id);
  };

  const mainCategories = categories.filter((cat) => !cat.parent_id);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" />
      )}

      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Shop by Category</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <ScrollArea className="h-[calc(100vh-73px)]">
          <div className="p-4">
            {loading ? (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {mainCategories.map((parent) => {
                  const subcategories = categories.filter((c) => c.parent_id === parent.id);
                  const hasSubcategories = subcategories.length > 0;
                  const isExpanded = expandedCategory === parent.id;

                  return (
                    <div key={parent.id} className="border-b last:border-0 border-gray-100">
                      
                      {/* PARENT ROW LOGIC */}
                      {hasSubcategories ? (
                        // CASE 1: Has Subcategories -> Click expands ONLY
                        <div
                          onClick={() => toggleCategory(parent.id)}
                          className={`flex items-center justify-between p-3 rounded-lg transition cursor-pointer group ${
                            isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            {renderIcon(parent)}
                            <span className="font-medium text-gray-900 group-hover:text-blue-900 transition">
                              {parent.name}
                            </span>
                          </div>
                          <div className="p-1 text-gray-400">
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                        </div>
                      ) : (
                        // CASE 2: No Subcategories -> Click navigates to products
                        <Link
                          href={`/products?category=${parent.id}`}
                          onClick={onClose}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer group"
                        >
                          {renderIcon(parent)}
                          <span className="font-medium text-gray-900 group-hover:text-blue-900 transition">
                            {parent.name}
                          </span>
                        </Link>
                      )}

                      {/* SUBCATEGORIES LIST */}
                      {hasSubcategories && isExpanded && (
                        <div className="bg-gray-50 pl-14 pr-4 py-2 space-y-2">
                          {subcategories.map((child) => (
                            <Link
                              key={child.id}
                              href={`/products?category=${child.id}`}
                              onClick={onClose}
                              className="block py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:translate-x-1 transition-transform"
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}

function renderIcon(category: Category) {
  return (
    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center transition flex-shrink-0 overflow-hidden">
      {category.image_url ? (
        <img
          src={category.image_url}
          alt={category.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <Package className="w-5 h-5 text-blue-900" />
      )}
    </div>
  );
}
