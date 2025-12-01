'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { useCart } from '@/lib/cart/cart-context';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Trash2, Plus, Minus, Package, Tag } from 'lucide-react';

export default function CartPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { items, loading, updateQuantity, removeItem, subtotal } = useCart();
  const [customerNote, setCustomerNote] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleRemoveItem = async (itemId: string, productName: string) => {
    await removeItem(itemId);
    toast({
      title: 'Removed from cart',
      description: `${productName} has been removed from your cart.`,
    });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setApplyingCoupon(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      if (couponCode.toUpperCase() === 'WELCOME10') {
        setDiscount(subtotal * 0.1);
        toast({
          title: 'Coupon applied',
          description: 'You saved 10% on your order!',
        });
      } else {
        toast({
          title: 'Invalid coupon',
          description: 'The coupon code you entered is not valid.',
          variant: 'destructive',
        });
      }
    } finally {
      setApplyingCoupon(false);
    }
  };

  const total = subtotal - discount;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">Loading...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
              <p className="text-gray-600 mb-4">Add products to your cart to continue</p>
              <Link href="/products">
                <Button className="bg-blue-900 hover:bg-blue-800">Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.product?.images && item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="w-12 h-12 text-gray-300" />
                        )}
                      </div>

                      <div className="flex-1">
                        <Link href={`/products/${item.product?.slug}`}>
                          <h3 className="font-semibold text-lg mb-1 hover:text-blue-900 transition">
                            {item.product?.name}
                          </h3>
                        </Link>
                        <p className="text-gray-600 text-sm mb-2">
                          ৳{item.product?.price} each
                        </p>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              updateQuantity(item.id, val);
                            }}
                            className="w-20 h-8 text-center"
                            min="1"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-900 mb-2">
                          ৳{((item.product?.price || 0) * item.quantity).toFixed(2)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id, item.product?.name || 'Product')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card>
                <CardContent className="p-6">
                  <Label htmlFor="customer-note" className="text-base font-semibold mb-2 block">
                    Note for Seller (Optional)
                  </Label>
                  <Textarea
                    id="customer-note"
                    placeholder="Add any special instructions or comments about your order..."
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    className="min-h-[100px]"
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <Label htmlFor="coupon-code" className="text-base font-semibold mb-2 block">
                    Discount Code
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="coupon-code"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon || !couponCode.trim()}
                    >
                      <Tag className="h-4 w-4 mr-2" />
                      {applyingCoupon ? 'Applying...' : 'Apply'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Order Summary</h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">৳{subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span className="font-semibold">-৳{discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="text-sm font-semibold">Calculated at checkout</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-lg font-bold">Total:</span>
                        <span className="text-lg font-bold text-blue-900">
                          ৳{total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button className="w-full bg-blue-900 hover:bg-blue-800" size="lg">
                      Check Out
                    </Button>

                    <Link href="/products">
                      <Button variant="outline" className="w-full">
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
