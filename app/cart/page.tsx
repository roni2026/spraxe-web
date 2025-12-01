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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Phone, MapPin, Truck, AlertCircle, Home, Pencil, CheckCircle2 } from 'lucide-react';

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
  
  // Local state for inputs (only used if profile data is missing)
  const [manualAddress, setManualAddress] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Sync state with profile (Just in case they need to edit initially)
  useEffect(() => {
    if (profile) {
      if (profile.phone) setManualPhone(profile.phone);
      // @ts-ignore
      if (profile.address) setManualAddress(profile.address);
    }
  }, [profile]);

  // Calculate Totals
  const shippingCost = deliveryLocation === 'inside' ? SHIPPING_INSIDE_DHAKA : SHIPPING_OUTSIDE_DHAKA;
  const total = subtotal + shippingCost;

  // --- SAVE PHONE (For users who don't have one yet) ---
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

  // --- PLACE ORDER ---
  const handleConfirmOrder = async () => {
    if (!user) return router.push('/login');
    
    // 1. Determine final data (Profile takes priority)
    const finalPhone = profile?.phone || manualPhone;
    // @ts-ignore
    const finalAddress = profile?.address || manualAddress;

    // 2. Validation
    if (!finalPhone) {
      toast({ title: "Phone Required", description: "Please add a contact number.", variant: "destructive" });
      return;
    }
    if (!finalAddress.trim()) {
      toast({ title: "Address Required", description: "Please add a delivery address.", variant: "destructive" });
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Create the Order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: total,
          status: 'pending',
          payment_status: 'pending',
          shipping_address: finalAddress, // Use the detected address
          delivery_location: deliveryLocation,
          shipping_cost: shippingCost,
          payment_method: 'Cash on Delivery',
          contact_number: finalPhone
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create Order Items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.product.price || 0,
        total_price: (item.product.price || 0) * item.quantity
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Success
      await clearCart();
      toast({ title: "Order Confirmed!", description: "We will ship your items soon." });
      router.push('/dashboard'); 

    } catch (error: any) {
      toast({ title: "Order Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cartLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  // Helper to check if we have data
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
            
            {/* LEFT SIDE: Info & Items */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* 1. CONTACT INFO SECTION */}
              <Card className={hasPhone ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Phone className={`h-5 w-5 ${hasPhone ? "text-green-700" : "text-red-600"}`} />
                      <h3 className="font-bold text-gray-900">Contact Number</h3>
                    </div>
                    {hasPhone && (
                      <Link href="/dashboard">
                        <Button variant="outline" size="sm" className="h-8 bg-white hover:bg-gray-50">
                          <Pencil className="w-3 h-3 mr-2" /> Edit
                        </Button>
                      </Link>
                    )}
                  </div>
                  
                  {hasPhone ? (
                    // READ ONLY VIEW
                    <div className="flex items-center gap-2 text-lg font-medium text-green-900 bg-white p-3 rounded border border-green-200 shadow-sm">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      {profile.phone}
                    </div>
                  ) : (
                    // INPUT VIEW (If missing)
                    <div className="flex gap-3">
                      <Input 
                        placeholder="01XXXXXXXXX" 
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        className="bg-white max-w-xs"
                      />
                      <Button onClick={handleSavePhone} disabled={isSavingPhone}>
                        {isSavingPhone ? "Saving..." : "Save Number"}
                      </Button>
                    </div>
                  )}
                  {!hasPhone && <p className="text-red-600 text-xs mt-2">* Required to place order</p>}
                </CardContent>
              </Card>

              {/* 2. ADDRESS SECTION */}
              <Card className={hasAddress ? "border-gray-200" : "border-red-200 bg-red-50/50"}>
                <CardContent className="p-6">
                   <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Home className={`h-5 w-5 ${hasAddress ? "text-gray-700" : "text-red-600"}`} />
                      <h3 className="font-bold text-gray-900">Delivery Address</h3>
                    </div>
                    {hasAddress && (
                      <Link href="/dashboard">
                        <Button variant="outline" size="sm" className="h-8 hover:bg-gray-50">
                          <Pencil className="w-3 h-3 mr-2" /> Edit
                        </Button>
                      </Link>
                    )}
                  </div>

                  {hasAddress ? (
                    // READ ONLY VIEW
                    <div className="bg-gray-50 p-4 rounded-lg border text-gray-800 whitespace-pre-wrap">
                      {/* @ts-ignore */}
                      {profile.address}
                    </div>
                  ) : (
                    // INPUT VIEW (If missing - technically they should go to profile, but we allow temp input)
                    <>
                      <Textarea 
                        placeholder="House #, Road #, Area, City..." 
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                        className="bg-white min-h-[80px]"
                      />
                      <p className="text-red-600 text-xs mt-2">* Required. Please add address in your profile for better experience.</p>
                      <Link href="/dashboard" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
                        Go to Profile to add address
                      </Link>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* 3. CART ITEMS */}
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

            {/* RIGHT SIDE: Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20 shadow-lg border-blue-100">
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" /> Shipping Area
                    </Label>
                    <RadioGroup 
                      value={deliveryLocation} 
                      onValueChange={(val: 'inside' | 'outside') => setDeliveryLocation(val)}
                      className="flex flex-col gap-2"
                    >
                      <div className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${deliveryLocation === 'inside' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : ''}`}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="inside" id="inside" />
                          <Label htmlFor="inside" className="cursor-pointer">Inside Dhaka</Label>
                        </div>
                        <span className="font-bold text-gray-900">৳{SHIPPING_INSIDE_DHAKA}</span>
                      </div>
                      <div className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${deliveryLocation === 'outside' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : ''}`}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="outside" id="outside" />
                          <Label htmlFor="outside" className="cursor-pointer">Outside Dhaka</Label>
                        </div>
                        <span className="font-bold text-gray-900">৳{SHIPPING_OUTSIDE_DHAKA}</span>
                      </div>
                    </RadioGroup>
                  </div>

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

                  <Button 
                    className="w-full bg-blue-900 hover:bg-blue-800 h-12 text-lg shadow-md" 
                    onClick={handleConfirmOrder}
                    disabled={isPlacingOrder || !user || !hasPhone || (!hasAddress && !manualAddress)} 
                  >
                    {isPlacingOrder ? 'Processing...' : 'Confirm Order'}
                  </Button>
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
