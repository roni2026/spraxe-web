'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  ShoppingBag, 
  Users, 
  AlertCircle, 
  PlusCircle, 
  List, 
  Image as ImageIcon, 
  FileText,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    customers: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchStats();
  }, [user, profile]);

  const fetchStats = async () => {
    const [products, orders, customers, pending] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    setStats({
      products: products.count || 0,
      orders: orders.count || 0,
      customers: customers.count || 0,
      pendingOrders: pending.count || 0,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8 flex-1">
        
        {/* --- LEFT SIDEBAR (Quick Actions) --- */}
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
          <Card className="sticky top-4 border-blue-100 shadow-md">
            <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
              <CardTitle className="text-lg font-bold text-blue-900 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-1">Catalog</div>
              
              <Link href="/admin/products/new" className="block">
                <Button className="w-full justify-start bg-blue-900 hover:bg-blue-800" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Product
                </Button>
              </Link>
              
              <Link href="/admin/categories" className="block">
                <Button variant="outline" className="w-full justify-start hover:bg-blue-50 hover:text-blue-700" size="sm">
                  <List className="mr-2 h-4 w-4" />
                  Manage Categories
                </Button>
              </Link>
              
              <Link href="/admin/featured" className="block">
                <Button variant="outline" className="w-full justify-start hover:bg-blue-50 hover:text-blue-700" size="sm">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Featured Images
                </Button>
              </Link>

              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">Sales</div>

              <Link href="/admin/orders" className="block">
                <Button variant="outline" className="w-full justify-start hover:bg-blue-50 hover:text-blue-700" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  View All Orders
                </Button>
              </Link>

               <Link href="/admin/customers" className="block">
                <Button variant="outline" className="w-full justify-start hover:bg-blue-50 hover:text-blue-700" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  View Customers
                </Button>
              </Link>

            </CardContent>
          </Card>
        </aside>

        {/* --- RIGHT MAIN CONTENT --- */}
        <main className="flex-1 space-y-8">
          
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <span className="text-sm text-gray-500">Welcome back, Admin</span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
                <Package className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.products}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-600 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
                <ShoppingBag className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.orders}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-600 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Customers</CardTitle>
                <Users className="w-4 h-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.customers}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pending Orders</CardTitle>
                <AlertCircle className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</div>
              </CardContent>
            </Card>
          </div>

          {/* Management Tabs */}
          <Tabs defaultValue="products" className="space-y-6">
            <TabsList className="bg-white border p-1 h-auto">
              <TabsTrigger value="products" className="px-6 py-2">Products</TabsTrigger>
              <TabsTrigger value="orders" className="px-6 py-2">Orders</TabsTrigger>
              <TabsTrigger value="customers" className="px-6 py-2">Customers</TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>Product Management</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                  <Package className="w-12 h-12 text-gray-300" />
                  <p className="text-gray-600 max-w-sm">Manage your inventory, update prices, and organize your catalog.</p>
                  <Link href="/admin/products/new">
                    <Button variant="outline">Create New Product</Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Order Management</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                  <ShoppingBag className="w-12 h-12 text-gray-300" />
                  <p className="text-gray-600 max-w-sm">Process new orders, handle shipping, and manage returns.</p>
                  <Link href="/admin/orders">
                    <Button variant="outline">View All Orders</Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Management</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                  <Users className="w-12 h-12 text-gray-300" />
                  <p className="text-gray-600 max-w-sm">View customer profiles and order history.</p>
                  <Link href="/admin/customers">
                    <Button variant="outline">View Customer List</Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </main>
      </div>
    </div>
  );
}
