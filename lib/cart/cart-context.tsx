'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    stock_quantity: number;
  };
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  items: [],
  itemCount: 0,
  subtotal: 0,
  loading: true,
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeItem: async () => {},
  clearCart: async () => {},
  refreshCart: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    if (!user) {
      const localCart = localStorage.getItem('cart');
      if (localCart) {
        const localItems = JSON.parse(localCart);
        const productIds = localItems.map((item: any) => item.product_id);

        if (productIds.length > 0) {
          const { data: products } = await supabase
            .from('products')
            .select('id, name, slug, price, images, stock_quantity')
            .in('id', productIds);

          if (products) {
            const cartItems = localItems.map((item: any) => {
              const product = products.find(p => p.id === item.product_id);
              return {
                id: item.product_id,
                product_id: item.product_id,
                quantity: item.quantity,
                product: product || null,
              };
            }).filter((item: any) => item.product !== null);

            setItems(cartItems);
          }
        }
      }
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        product:products!inner (
          id,
          name,
          slug,
          price,
          images,
          stock_quantity
        )
      `)
      .eq('user_id', user.id);

    if (data) {
      const cartItems = data.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: Array.isArray(item.product) ? item.product[0] : item.product,
      }));
      setItems(cartItems);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user) {
      const localCart = localStorage.getItem('cart');
      const cart = localCart ? JSON.parse(localCart) : [];
      const existingItem = cart.find((item: any) => item.product_id === productId);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.push({ product_id: productId, quantity });
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      await fetchCart();
      return;
    }

    const existingItem = items.find(item => item.product_id === productId);

    if (existingItem) {
      await updateQuantity(existingItem.id, existingItem.quantity + quantity);
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: productId,
          quantity,
        });

      if (!error) {
        await fetchCart();
      }
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    if (!user) {
      const localCart = localStorage.getItem('cart');
      if (localCart) {
        const cart = JSON.parse(localCart);
        const item = cart.find((item: any) => item.product_id === itemId);
        if (item) {
          item.quantity = quantity;
          localStorage.setItem('cart', JSON.stringify(cart));
          await fetchCart();
        }
      }
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);

    if (!error) {
      await fetchCart();
    }
  };

  const removeItem = async (itemId: string) => {
    if (!user) {
      const localCart = localStorage.getItem('cart');
      if (localCart) {
        const cart = JSON.parse(localCart);
        const filtered = cart.filter((item: any) => item.product_id !== itemId);
        localStorage.setItem('cart', JSON.stringify(filtered));
        await fetchCart();
      }
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (!error) {
      await fetchCart();
    }
  };

  const clearCart = async () => {
    if (!user) {
      localStorage.removeItem('cart');
      setItems([]);
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (!error) {
      setItems([]);
    }
  };

  const refreshCart = async () => {
    await fetchCart();
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        loading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
