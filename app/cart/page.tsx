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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Phone, MapPin, Truck, Home, Pencil, CheckCircle2 } from 'lucide-react';

const SHIPPING_INSIDE_DHAKA = 60;
const SHIPPING_OUTSIDE_DHAKA = 120;

export default function CartPage() {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const { items, removeItem, updateQuantity, subtotal, clearCart, loading: cartLoading } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  const [deliveryLocation, setDeliveryLocation] = useState<'inside' | 'outside'>('inside');
  const [manualAddress, setManualAddress] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Sync state with profile (fallback)
  useEffect(() => {
    if (profile) {
      if (profile.phone) setManualPhone(profile.phone);
      // @ts-ignore
      if (profile.address) setManualAddress(profile.address);
    }
  }, [profile]);

  const shippingCost = deliveryLocation === 'inside' ? SHIPPING_INSIDE_DHAKA : SHIPPING_OUTSIDE_DHAKA;
  const total = subtotal + shippingCost;

  const handleSavePhone = async () => {
    if (!user) return;
    if (manualPhone.length < 11) {
      toast({ title: "Invalid Phone", description: "Phone number must be at least 11 digits.", variant: "destructive" });
      return;
    }
    setIsSavingPhone(true);
    const { error } = await supabase.from('profiles').update({ phone: manualPhone }).eq('id', user.id);
    if (error) {
      toast({ title: "Error", description: "Failed to save phone number.", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Phone number saved successfully." });
      await refreshProfile(); 
    }
    setIsSavingPhone(false);
  };

  const handleConfirmOrder = async () => {
    if (!user) return router.push('/login');
    
    // Determine final data (Profile > Manual)
    const finalPhone = profile?.phone || manualPhone;
    // @ts-ignore
    const finalAddress = profile?.address || manualAddress;

    // Validation
    if (!finalPhone) {
      toast({ title: "Phone Required", description: "Please add a contact number.", variant: "destructive" });
      return;
    }
    if (!finalAddress || !finalAddress.trim()) {
      toast({ title: "Address Required", description: "Please add a delivery address.", variant: "destructive" });
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Generate Order Number
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
          order_number: orderNumber // Using generated order number
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create Order Items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price || 0,
        total_price: (item.product.price || 0) * item.quantity
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Success
      await clearCart();
      toast({ title: "Order Confirmed!", description: `Order #${orderNumber} placed successfully.` });
      router.push('/dashboard'); 

    } catch (error: any) {
      console.error(error);
      toast({ title: "Order Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Loading State (Prevents Flash/Redirect Loop)
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
            
            {/* --- LEFT SIDE: CART ITEMS ONLY --- */}
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

            {/* --- RIGHT SIDE: ORDER SUMMARY (INCLUDES PHONE & ADDRESS) --- */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20 shadow-lg border-blue-100">
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>

                  {/* 1. CONTACT INFO */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" /> Contact Number
                      </Label>
                      {hasPhone && (
                        <Link href="/dashboard" className="text-xs text-blue-600 hover:underline">
                          Edit
                        </Link>
                      )}
                    </div>
                    {hasPhone ? (
                      <div className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded border flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        {profile.phone}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input 
                          placeholder="01XXXXXXXXX" 
                          value={manualPhone}
                          onChange={(e) => setManualPhone(e.target.value)}
                          className="bg-white h-9"
                        />
                        <Button size="sm" onClick={handleSavePhone} disabled={isSavingPhone}>
                          Save
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* 2. DELIVERY ADDRESS */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="flex items-center gap-2 text-gray-600">
                        <Home className="h-4 w-4" /> Delivery Address
                      </Label>
                      {hasAddress && (
                        <Link href="/dashboard" className="text-xs text-blue-600 hover:underline">
                          Edit
                        </Link>
                      )}
                    </div>
                    {hasAddress ? (
                      <div className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded border whitespace-pre-wrap">
                        {/* @ts-ignore */}
                        {profile.address}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Textarea 
                          placeholder="House, Road, City..." 
                          value={manualAddress}
                          onChange={(e) => setManualAddress(e.target.value)}
                          className="bg-white min-h-[60px]"
                        />
                        <Link href="/dashboard" className="text-xs text-blue-600 hover:underline block text-right">
                          Add details in Profile
                        </Link>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* 3. SHIPPING AREA */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" /> Shipping Area
                    </Label>
                    <RadioGroup 
                      value={deliveryLocation} 
                      onValueChange={(val: 'inside' | 'outside') => setDeliveryLocation(val)}
                      className="flex flex-col gap-2"
                    >
                      <div className={`flex items-center justify-between p-2 px-3 border rounded-lg cursor-pointer text-sm ${deliveryLocation === 'inside' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : ''}`}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="inside" id="inside" />
                          <Label htmlFor="inside" className="cursor-pointer">Inside Dhaka</Label>
                        </div>
                        <span className="font-bold">৳{SHIPPING_INSIDE_DHAKA}</span>
                      </div>
                      <div className={`flex items-center justify-between p-2 px-3 border rounded-lg cursor-pointer text-sm ${deliveryLocation === 'outside' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : ''}`}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="outside" id="outside" />
                          <Label htmlFor="outside" className="cursor-pointer">Outside Dhaka</Label>
                        </div>
                        <span className="font-bold">৳{SHIPPING_OUTSIDE_DHAKA}</span>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* 4. TOTALS */}
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

                  {/* 5. CONFIRM BUTTON */}
                  <Button 
                    className="w-full bg-blue-900 hover:bg-blue-800 h-12 text-lg shadow-md" 
                    onClick={handleConfirmOrder}
                    disabled={isPlacingOrder || !user || !hasPhone || (!hasAddress && !manualAddress)} 
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
