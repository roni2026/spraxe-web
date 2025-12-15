'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { useCart } from '@/lib/cart/cart-context';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Phone, MapPin, Truck, Home, AlertCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const SHIPPING_INSIDE_DHAKA = 60;
const SHIPPING_OUTSIDE_DHAKA = 120;

export default function CartPage() {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const { items, removeItem, updateQuantity, subtotal, clearCart, loading: cartLoading } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  const [deliveryLocation, setDeliveryLocation] = useState<'inside' | 'outside'>('inside');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    if (user) refreshProfile();
  }, [user]);

  const shippingCost = deliveryLocation === 'inside' ? SHIPPING_INSIDE_DHAKA : SHIPPING_OUTSIDE_DHAKA;
  const total = subtotal + shippingCost;

  const handleConfirmOrder = async () => {
    if (!user) return router.push('/login');
    
    const finalPhone = profile?.phone;
    // @ts-ignore
    const finalAddress = profile?.address;

    if (!finalPhone) {
      toast({ title: "Phone Missing", description: "Please add your phone number in your Profile.", variant: "destructive" });
      return;
    }
    if (!finalAddress) {
      toast({ title: "Address Missing", description: "Please add your address in your Profile.", variant: "destructive" });
      return;
    }

    setIsPlacingOrder(true);

    try {
      const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;

      // Create Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: total,
          total_amount: 0,
          subtotal: subtotal,
          tax_amount: 0,
          discount_amount: 0,
          status: 'pending',
          payment_status: 'pending',
          shipping_address: finalAddress, 
          delivery_location: deliveryLocation,
          shipping_cost: shippingCost,
          payment_method: 'Cash on Delivery',
          contact_number: finalPhone,
          order_number: orderNumber 
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product.name,
        product_sku: (item.product as any).sku || item.product_id,
        quantity: item.quantity,
        unit_price: item.product.price || 0,
        total_price: (item.product.price || 0) * item.quantity
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      await clearCart();
      
      // Trigger Invoice Email
      fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, email: user.email }),
      });

      toast({ title: "Order Confirmed!", description: `Order #${orderNumber} placed successfully.` });
      router.push('/dashboard'); 

    } catch (error: any) {
      console.error(error);
      toast({ title: "Order Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  const hasPhone = !!profile?.phone;
  // @ts-ignore
  const hasAddress = !!profile?.address;
  const isProfileComplete = hasPhone && hasAddress;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Checkout</h1>

        {items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Your cart is empty</h2>
            <Link href="/products"><Button>Start Shopping</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* --- LEFT SIDE: CART ITEMS --- */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cart Items ({items.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-6 divide-y">
                  {items.map((item) => (
                    <div key={item.id} className="flex py-4">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                        {item.product?.images?.[0] && (
                          <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="ml-4 flex flex-1 flex-col justify-between">
                        <div className="flex justify-between font-medium text-gray-900">
                          <h3>{item.product?.name}</h3>
                          <p>৳{(item.product?.price || 0) * item.quantity}</p>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <div className="flex items-center gap-2 border rounded-md p-1">
                            <button className="px-2" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                            <span>{item.quantity}</span>
                            <button className="px-2" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="text-red-600 flex items-center hover:underline">
                            <Trash2 className="h-4 w-4 mr-1" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* --- RIGHT SIDE: ORDER SUMMARY --- */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20 shadow-lg border-blue-100">
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>

                  {/* 1. CONTACT INFO */}
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="flex items-center gap-2 text-gray-600 font-medium">
                        <Phone className="h-4 w-4" /> Phone Number
                      </Label>
                      {hasPhone && (
                        <Link href="/dashboard" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> Change
                        </Link>
                      )}
                    </div>
                    {hasPhone ? (
                      <div className="text-sm font-bold text-gray-900 pl-6">{profile.phone}</div>
                    ) : (
                      <div className="text-sm text-red-600 pl-6 flex flex-col gap-2">
                        <span>Phone number missing.</span>
                        <Link href="/dashboard">
                           <Button size="sm" variant="outline" className="w-full h-8 text-xs border-red-200 bg-red-50 hover:bg-red-100 text-red-700">Add Phone in Profile</Button>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* 2. ADDRESS INFO */}
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="flex items-center gap-2 text-gray-600 font-medium">
                        <Home className="h-4 w-4" /> Delivery Address
                      </Label>
                      {hasAddress && (
                         <Link href="/dashboard" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                           <ExternalLink className="h-3 w-3" /> Change
                         </Link>
                      )}
                    </div>
                    {hasAddress ? (
                      <div className="text-sm font-medium text-gray-900 pl-6 whitespace-pre-wrap leading-relaxed">
                        {/* @ts-ignore */}
                        {profile.address}
                      </div>
                    ) : (
                      <div className="text-sm text-red-600 pl-6 flex flex-col gap-2">
                        <span>Address missing.</span>
                        <Link href="/dashboard">
                           <Button size="sm" variant="outline" className="w-full h-8 text-xs border-red-200 bg-red-50 hover:bg-red-100 text-red-700">Add Address in Profile</Button>
                        </Link>
                      </div>
                    )}
                  </div>

                  {!isProfileComplete && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Profile Incomplete</AlertTitle>
                      <AlertDescription className="text-xs">
                        You must update your profile with a Phone Number and Address to place an order.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Separator />

                  {/* 3. SHIPPING & TOTALS (FIXED CLICKABLE AREA) */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" /> Shipping Area
                    </Label>
                    
                    <RadioGroup 
                      value={deliveryLocation} 
                      onValueChange={(val: 'inside' | 'outside') => setDeliveryLocation(val)}
                      className="flex flex-col gap-2"
                    >
                      {/* OPTION 1: INSIDE DHAKA */}
                      <div 
                        onClick={() => setDeliveryLocation('inside')} // Makes entire box clickable
                        className={`flex items-center justify-between p-2 px-3 border rounded-lg cursor-pointer transition-all text-sm ${
                          deliveryLocation === 'inside' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600 shadow-sm' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2 pointer-events-none">
                          <RadioGroupItem value="inside" id="inside" />
                          <Label htmlFor="inside" className="cursor-pointer">Inside Dhaka</Label>
                        </div>
                        <span className="font-bold">৳{SHIPPING_INSIDE_DHAKA}</span>
                      </div>

                      {/* OPTION 2: OUTSIDE DHAKA */}
                      <div 
                        onClick={() => setDeliveryLocation('outside')} // Makes entire box clickable
                        className={`flex items-center justify-between p-2 px-3 border rounded-lg cursor-pointer transition-all text-sm ${
                          deliveryLocation === 'outside' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600 shadow-sm' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2 pointer-events-none">
                          <RadioGroupItem value="outside" id="outside" />
                          <Label htmlFor="outside" className="cursor-pointer">Outside Dhaka</Label>
                        </div>
                        <span className="font-bold">৳{SHIPPING_OUTSIDE_DHAKA}</span>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2 text-sm pt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>৳{subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span>৳{shippingCost}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg font-bold text-blue-900">
                      <span>Total</span>
                      <span>৳{total}</span>
                    </div>
                  </div>

                  {/* 4. CONFIRM BUTTON */}
                  <Button 
                    className="w-full bg-blue-900 hover:bg-blue-800 h-12 text-lg shadow-md" 
                    onClick={handleConfirmOrder}
                    disabled={isPlacingOrder || !user || !isProfileComplete} 
                  >
                    {isPlacingOrder ? 'Processing...' : 'Confirm Order'}
                  </Button>
                  
                  <div className="text-center">
                    <span className="text-xs text-gray-500 flex items-center justify-center gap-1">
                      <Truck className="h-3 w-3" /> Cash on Delivery Available
                    </span>
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
