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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, User, MapPin, Package, FileText, Pencil, Save, X, Phone, Home } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

// --- BANGLADESH LOCATION DATA ---
const BD_DIVISIONS = [
  "Barisal", "Chittagong", "Dhaka", "Khulna", "Mymensingh", "Rajshahi", "Rangpur", "Sylhet"
];

const BD_DISTRICTS: Record<string, string[]> = {
  Barisal: ["Barguna", "Barisal", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur"],
  Chittagong: ["Bandarban", "Brahmanbaria", "Chandpur", "Chittagong", "Comilla", "Cox's Bazar", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Rangamati"],
  Dhaka: ["Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail"],
  Khulna: ["Bagerhat", "Chuadanga", "Jessore", "Jhenaidah", "Khulna", "Kushtia", "Magura", "Meherpur", "Narail", "Satkhira"],
  Mymensingh: ["Jamalpur", "Mymensingh", "Netrokona", "Sherpur"],
  Rajshahi: ["Bogra", "Chapainawabganj", "Joypurhat", "Naogaon", "Natore", "Pabna", "Rajshahi", "Sirajganj"],
  Rangpur: ["Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Rangpur", "Thakurgaon"],
  Sylhet: ["Habiganj", "Moulvibazar", "Sunamganj", "Sylhet"]
};

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
  const [isSaving, setIsSaving] = useState(false);

  // Structured Address State
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [road, setRoad] = useState('');
  const [zipCode, setZipCode] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchOrders();
  }, [user]);

  // Sync inputs with profile data
  useEffect(() => {
    if (profile) {
      if (profile.phone) setPhoneInput(profile.phone);
      
      // Load structured address fields if they exist
      // Using 'as any' to bypass TS check until types are regenerated
      const p = profile as any;
      if (p.division) setDivision(p.division);
      if (p.district) setDistrict(p.district);
      if (p.city) setCity(p.city);
      if (p.road) setRoad(p.road);
      if (p.zip_code) setZipCode(p.zip_code);
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
      toast({ title: "Invalid Phone", description: "Must be at least 11 digits", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.from('profiles').update({ phone: phoneInput }).eq('id', user.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to update phone", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Phone updated" });
      await refreshProfile();
      setIsEditingPhone(false);
    }
    setIsSaving(false);
  };

  const handleSaveAddress = async () => {
    if (!user) return;
    if (!division || !district || !city || !road) {
      toast({ title: "Missing Fields", description: "Please fill all address fields", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    
    // Create the full formatted string for display/cart
    const fullAddress = `${road}, ${city}, ${zipCode ? zipCode + ', ' : ''}${district}, ${division}`;

    const updates = {
      division,
      district,
      city,
      road,
      zip_code: zipCode,
      address: fullAddress // We save the formatted string too!
    };
    
    const { error } = await supabase
      .from('profiles')
      .update(updates) 
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

          {/* PROFILE TAB */}
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
                
                {/* Phone Section */}
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

          {/* ADDRESSES TAB (Cascading Dropdown Logic) */}
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
                          <Pencil className="w-3 h-3 mr-1" /> {(profile as any)?.address ? 'Edit Address' : 'Add Address'}
                        </Button>
                      )}
                    </div>

                    {isEditingAddress ? (
                      <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
                         {/* Division Dropdown */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <Label>Division</Label>
                             <Select value={division} onValueChange={(val) => { setDivision(val); setDistrict(''); }}>
                               <SelectTrigger className="bg-white">
                                 <SelectValue placeholder="Select Division" />
                               </SelectTrigger>
                               <SelectContent>
                                 {BD_DIVISIONS.map(div => (
                                   <SelectItem key={div} value={div}>{div}</SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                           </div>

                           {/* District Dropdown (Dependent) */}
                           <div className="space-y-2">
                             <Label>District</Label>
                             <Select value={district} onValueChange={setDistrict} disabled={!division}>
                               <SelectTrigger className="bg-white">
                                 <SelectValue placeholder="Select District" />
                               </SelectTrigger>
                               <SelectContent>
                                 {division && BD_DISTRICTS[division]?.map(dist => (
                                   <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                           </div>
                         </div>

                         {/* City & Zip */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <Label>City / Area</Label>
                             <Input 
                               placeholder="e.g. Uttara" 
                               value={city} 
                               onChange={(e) => setCity(e.target.value)} 
                               className="bg-white"
                             />
                           </div>
                           <div className="space-y-2">
                             <Label>Zip Code</Label>
                             <Input 
                               placeholder="e.g. 1230" 
                               value={zipCode} 
                               onChange={(e) => setZipCode(e.target.value)} 
                               className="bg-white"
                             />
                           </div>
                         </div>

                         {/* Road / Street */}
                         <div className="space-y-2">
                           <Label>Road / House No / Details</Label>
                           <Input 
                             placeholder="e.g. House 12, Road 5, Sector 4" 
                             value={road} 
                             onChange={(e) => setRoad(e.target.value)} 
                             className="bg-white"
                           />
                         </div>

                         {/* Buttons */}
                         <div className="flex gap-2 pt-2">
                           <Button onClick={handleSaveAddress} disabled={isSaving} className="bg-blue-900">
                             {isSaving ? 'Saving...' : 'Save Address'}
                           </Button>
                           <Button variant="outline" onClick={() => setIsEditingAddress(false)}>
                             Cancel
                           </Button>
                         </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className={`p-4 rounded-lg border ${(profile as any)?.address ? 'bg-gray-50 border-gray-200' : 'bg-yellow-50 border-yellow-200 border-dashed'}`}>
                         {(profile as any)?.address ? (
                           <div className="space-y-1">
                             <p className="text-gray-900 font-medium whitespace-pre-wrap">{(profile as any).address}</p>
                             {/* Show individual fields if available just to confirm */}
                             {(profile as any).division && (
                               <p className="text-xs text-gray-500 mt-2 border-t pt-2">
                                 Detailed: {(profile as any).road}, {(profile as any).city}, {(profile as any).district}
                               </p>
                             )}
                           </div>
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
