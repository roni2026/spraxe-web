'use client';

import { Minus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart/cart-context';

interface CartItemProps {
  item: {
    id: string;
    name: string;
    price: number;
    images?: string[];
    quantity: number;
    // Add product_id if needed for links, otherwise id is usually fine
    product_id?: string; 
  };
}

export function CartItem({ item }: CartItemProps) {
  // FIXED: Changed 'removeFromCart' to 'removeItem' to match your Context
  const { updateQuantity, removeItem } = useCart();

  // Handle image URL safely
  const imageUrl = item.images?.[0] || null;

  return (
    <div className="flex gap-4">
      {/* Image */}
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
            No Img
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col">
        <div>
          <div className="flex justify-between text-base font-medium text-gray-900">
            <h3 className="line-clamp-2 text-sm leading-tight pr-4">
              {/* Ensure we link to the product page */}
              <a href={`/products/${item.product_id || item.id}`}>{item.name}</a>
            </h3>
            <p className="ml-4 flex-shrink-0">৳{item.price * item.quantity}</p>
          </div>
          <p className="mt-1 text-sm text-gray-500">Unit: ৳{item.price}</p>
        </div>
        
        <div className="flex flex-1 items-end justify-between text-sm">
          {/* Quantity Controls */}
          <div className="flex items-center border rounded-md h-8">
            <Button
              variant="ghost"
              size="icon"
              className="h-full w-8 rounded-none rounded-l-md px-0"
              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            
            <div className="h-full w-8 flex items-center justify-center border-x text-xs font-medium">
              {item.quantity}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-full w-8 rounded-none rounded-r-md px-0"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2"
            // FIXED: Using removeItem here
            onClick={() => removeItem(item.id)}
          >
            <span className="sr-only">Remove</span>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
