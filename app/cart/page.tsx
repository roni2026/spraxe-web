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
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Phone, MapPin, Truck, AlertCircle, CheckCircle2 } from 'lucide-react';

// Shipping Constants
const SHIPPING_INSIDE_DHAKA = 60;
const SHIPPING_OUTSIDE_DHAKA = 120;

export default function CartPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { items, removeItem, updateQuantity, subtotal, clearCart, loading: cartLoading } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [deliveryLocation, setDeliveryLocation] = useState<'inside' | 'outside'>('inside');
  const [manualPhone, setManualPhone] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Sync manual input with profile phone if it exists
  useEffect(() => {
    if (profile?.phone) {
      setManualPhone(profile.phone);
    }
  }, [profile]);

  // Calculate Totals
  const shippingCost = deliveryLocation === 'inside' ? SHIPPING_INSIDE_DHAKA : SHIPPING_OUTSIDE_DHAKA;
  const total = subtotal + shippingCost;

  // --- 1. MANUAL PHONE SAVE (No OTP) ---
  const handleSavePhone = async () => {
    if (!user) return;
    
    // Basic validation
    if (manualPhone.length < 11) {
      toast({ title: "Invalid Phone", description: "Phone number must be at least 11 digits.", variant: "destructive" });
      return;
    }

    setIsSavingPhone(true);
    
    // Directly update the profile table
    const { error } = await supabase
      .from('profiles')
      .update({ phone: manualPhone })
      .eq('id', user.id);

    if (error) {
      toast({ title: "Error", description: "Failed to save phone number.", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Phone number saved successfully." });
      await refreshProfile(); // Refresh context so the "Restrict Order" logic updates
    }
    setIsSavingPhone(false);
  };

  // --- 2. PLACE ORDER (With Restriction) ---
  const handleConfirmOrder = async () => {
    if (!user) return router.push('/login');
    
    // RESTRICTION CHECK
    if (!profile?.phone) {
      toast({ 
        title: "Phone Required", 
        description: "Please save your phone number before confirming the order.", 
        variant: "destructive" 
      });
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Create the Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          status: 'pending',
          payment_status: 'pending',
          shipping_address: deliveryLocation === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka',
          delivery_location: deliveryLocation,
          shipping_cost: shippingCost,
          payment_method: 'Cash on Delivery',
          contact_number: profile.phone // Save the confirmed phone number
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create Order Items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.product.price || item.product.base_price || 0,
        total_price: (item.product.price || item.product.base_price || 0) * item.quantity
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Success
      await clearCart();
      toast({ title: "Order Confirmed!", description: "We will contact you soon." });
      
      // Redirect (to dashboard or home)
      router.push('/dashboard'); 

    } catch (error: any) {
      toast({ title: "Order Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cartLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

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
            
            {/* LEFT SIDE: Cart Items & Profile Check */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Phone Number Requirement Section */}
              <Card className={!profile?.phone ? "border-red-300 bg-red-50" : "border-green-200 bg-green-50"}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Phone className="h-5 w-5 text-gray-700" />
                    <h3 className="font-bold text-gray-900">Contact Phone Number (Required)</h3>
                  </div>
                  
                  <div className="flex gap-3">
                    <Input 
                      placeholder="01XXXXXXXXX" 
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      className="bg-white max-w-xs"
                    />
                    <Button 
                      onClick={handleSavePhone} 
                      disabled={isSavingPhone || manualPhone === profile?.phone}
                      variant={!profile?.phone ? "default" : "outline"}
                    >
                      {isSavingPhone ? "Saving..." : !profile?.phone ? "Save Number" : "Update"}
                    </Button>
                  </div>
                  {!profile?.phone && (
                    <p className="text-red-600 text-sm mt-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1"/> 
                      You cannot confirm the order without saving a phone number.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Cart Items List */}
              <Card>
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

            {/* RIGHT SIDE: Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20 shadow-lg border-blue-100">
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>

                  {/* 1. Location Selector */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" /> Shipping Area
                    </Label>
                    <RadioGroup 
                      value={deliveryLocation} 
                      onValueChange={(val: 'inside' | 'outside') => setDeliveryLocation(val)}
                      className="flex flex-col gap-2"
                    >
                      <div className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${deliveryLocation === 'inside' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="inside" id="inside" />
                          <Label htmlFor="inside" className="cursor-pointer">Inside Dhaka</Label>
                        </div>
                        <span className="font-bold text-gray-900">৳{SHIPPING_INSIDE_DHAKA}</span>
                      </div>
                      
                      <div className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${deliveryLocation === 'outside' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="outside" id="outside" />
                          <Label htmlFor="outside" className="cursor-pointer">Outside Dhaka</Label>
                        </div>
                        <span className="font-bold text-gray-900">৳{SHIPPING_OUTSIDE_DHAKA}</span>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* 2. Payment Method (Fixed) */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-gray-600">
                      <Truck className="h-4 w-4" /> Payment Method
                    </Label>
                    <div className="flex items-center justify-center p-3 bg-gray-100 rounded-lg border border-gray-200 text-gray-700 font-medium">
                      Cash on Delivery (COD)
                    </div>
                  </div>

                  <Separator />

                  {/* 3. Calculations */}
                  <div className="space-y-2 text-sm">
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
                      <span>Total to Pay</span>
                      <span>৳{total}</span>
                    </div>
                  </div>

                  {/* 4. Confirm Button */}
                  <Button 
                    className="w-full bg-blue-900 hover:bg-blue-800 h-12 text-lg shadow-md" 
                    onClick={handleConfirmOrder}
                    disabled={isPlacingOrder || !user || !profile?.phone} // DISABLED IF NO PHONE
                  >
                    {isPlacingOrder ? 'Processing...' : 'Confirm Order'}
                  </Button>
                  
                  {/* Login Warning */}
                  {!user && (
                    <p className="text-xs text-center text-red-500">
                      You must <Link href="/login" className="underline font-bold">login</Link> to place an order.
                    </p>
                  )}
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
