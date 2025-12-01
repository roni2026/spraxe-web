'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Order } from '@/lib/supabase/types';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, User, MapPin, Package, FileText, Pencil, Save, X, Phone, Home } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Phone Editing State
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  
  // Address Editing State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchOrders();
  }, [user]);

  // Sync inputs with profile data when it loads
  useEffect(() => {
    if (profile) {
      if (profile.phone) setPhoneInput(profile.phone);
      // @ts-ignore (Ignore TS error if address column isn't in types yet)
      if (profile.address) setAddressInput(profile.address);
    }
  }, [profile]);

  const fetchOrders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setOrders(data);
    setLoading(false);
  };

  const handleSavePhone = async () => {
    if (!user) return;
    if (phoneInput.length < 11) {
      toast({ title: "Invalid Phone", description: "Phone number must be at least 11 digits", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.from('profiles').update({ phone: phoneInput }).eq('id', user.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update phone number", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Phone number updated successfully" });
      await refreshProfile();
      setIsEditingPhone(false);
    }
    setIsSaving(false);
  };

  const handleSaveAddress = async () => {
    if (!user) return;
    if (!addressInput.trim()) {
      toast({ title: "Invalid Address", description: "Address cannot be empty", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({ address: addressInput }) // Ensure 'address' column exists in DB
      .eq('id', user.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update address", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Address updated successfully" });
      await refreshProfile();
      setIsEditingAddress(false);
    }
    setIsSaving(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-blue-100 text-blue-900',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">My Dashboard</h1>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders"><ShoppingBag className="w-4 h-4 mr-2" />Orders</TabsTrigger>
            <TabsTrigger value="profile"><User className="w-4 h-4 mr-2" />Profile</TabsTrigger>
            <TabsTrigger value="addresses"><MapPin className="w-4 h-4 mr-2" />Addresses</TabsTrigger>
          </TabsList>

          {/* ORDERS TAB */}
          <TabsContent value="orders">
            <Card>
              <CardHeader><CardTitle>My Orders</CardTitle></CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                    <Link href="/products"><Button className="bg-blue-900 hover:bg-blue-800">Browse Products</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-semibold mb-1">Order #{order.id.slice(0, 8)}</p>
                              <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right flex items-center gap-4 justify-between md:justify-end w-full md:w-auto">
                              <div>
                                <p className="font-bold text-blue-900 mb-1">৳{order.total}</p>
                                <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                              </div>
                              <Link href={`/invoice/${order.id}`}>
                                <Button variant="outline" size="sm" className="gap-2"><FileText className="w-4 h-4" />Invoice</Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROFILE TAB (Phone Edit) */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Manage your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-lg font-medium text-gray-900 mt-1">{profile?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-lg font-medium text-gray-900 mt-1">{user?.email}</p>
                  </div>
                </div>
                <div className="h-px bg-gray-200" />
                
                {/* Editable Phone */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Phone className="h-4 w-4" /> Contact Phone
                    </label>
                    {!isEditingPhone && (
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingPhone(true)} className="text-blue-600 hover:text-blue-700">
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </Button>
                    )}
                  </div>
                  {isEditingPhone ? (
                    <div className="flex items-center gap-2 max-w-sm">
                      <Input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="01XXXXXXXXX" className="bg-white" />
                      <Button onClick={handleSavePhone} disabled={isSaving} size="sm" className="bg-blue-900">
                        {isSaving ? 'Saving...' : <Save className="w-4 h-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setIsEditingPhone(false); setPhoneInput(profile?.phone || ''); }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className={`text-lg font-medium mt-1 ${!profile?.phone ? 'text-red-500' : 'text-gray-900'}`}>
                      {profile?.phone || 'No phone number added'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ADDRESSES TAB (Address Edit - UPDATED) */}
          <TabsContent value="addresses">
            <Card>
              <CardHeader>
                <CardTitle>Saved Addresses</CardTitle>
                <CardDescription>This address will be pre-filled during checkout.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="max-w-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Home className="h-4 w-4" /> Default Delivery Address
                      </label>
                      {!isEditingAddress && (
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingAddress(true)} className="text-blue-600 hover:text-blue-700">
                          <Pencil className="w-3 h-3 mr-1" /> {profile?.address ? 'Edit Address' : 'Add Address'}
                        </Button>
                      )}
                    </div>

                    {isEditingAddress ? (
                      <div className="space-y-3">
                         <Textarea 
                            value={addressInput} 
                            onChange={(e) => setAddressInput(e.target.value)} 
                            placeholder="House #, Road #, Area, City..."
                            className="bg-white min-h-[100px]"
                         />
                         <div className="flex gap-2">
                           <Button onClick={handleSaveAddress} disabled={isSaving} className="bg-blue-900">
                             {isSaving ? 'Saving...' : 'Save Address'}
                           </Button>
                           <Button variant="outline" onClick={() => { setIsEditingAddress(false); setAddressInput(profile?.address || ''); }}>
                             Cancel
                           </Button>
                         </div>
                      </div>
                    ) : (
                      <div className={`p-4 rounded-lg border ${profile?.address ? 'bg-gray-50 border-gray-200' : 'bg-yellow-50 border-yellow-200 border-dashed'}`}>
                         {profile?.address ? (
                           <p className="text-gray-900 whitespace-pre-wrap">{profile.address}</p>
                         ) : (
                           <div className="text-center py-4 text-gray-500">
                             <p>You haven't saved an address yet.</p>
                             <Button variant="link" onClick={() => setIsEditingAddress(true)}>Add one now</Button>
                           </div>
                         )}
                      </div>
                    )}
                 </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
