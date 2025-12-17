'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  ShoppingBag, 
  Users, 
  AlertCircle, 
  PlusCircle, 
  List, 
  Image as ImageIcon, 
  FileText,
  Settings,
  ChevronRight,
  MessageSquare, 
  LifeBuoy,
  Clock // Icon for Pending Tickets
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
    unresolvedTickets: 0, // Status: 'open'
    pendingTickets: 0,    // Status: 'in_progress'
  });
  
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchDashboardData();
  }, [user, profile]);

  const fetchDashboardData = async () => {
    setLoading(true);
    // 1. Fetch Stats
    const [products, orders, customers, pendingOrders, openTickets, inProgressTickets] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      
      // Support Stats
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
    ]);

    setStats({
      products: products.count || 0,
      orders: orders.count || 0,
      customers: customers.count || 0,
      pendingOrders: pendingOrders.count || 0,
      unresolvedTickets: openTickets.count || 0,
      pendingTickets: inProgressTickets.count || 0,
    });

    // 2. Fetch Recent Orders (Last 10)
    const { data: recentOrdersData } = await supabase
      .from('orders')
      .select(`
        id, 
        order_number, 
        total, 
        status, 
        created_at, 
        contact_number,
        profiles ( full_name, email, phone )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentOrdersData) {
      setRecentOrders(recentOrdersData);
    }
    setLoading(false);
  };

  const adminName = profile?.full_name || user?.email?.split('@')[0] || 'Admin';

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
              
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-1">Sales</div>

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

              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">Support</div>
              
              <Link href="/admin/support" className="block">
                <Button variant="outline" className="w-full justify-start hover:bg-blue-50 hover:text-blue-700" size="sm">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Support Tickets
                </Button>
              </Link>

              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">Catalog</div>
              
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

            </CardContent>
          </Card>
        </aside>

        {/* --- RIGHT MAIN CONTENT --- */}
        <main className="flex-1 space-y-8">
          
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <span className="text-base font-medium text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Welcome, {adminName}
            </span>
          </div>

          {/* Stats Grid (Updated to 3 columns to fit 6 items nicely) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
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

            {/* Unresolved Tickets (Status: Open) */}
            <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Unresolved Tickets</CardTitle>
                <LifeBuoy className="w-4 h-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.unresolvedTickets}</div>
              </CardContent>
            </Card>

            {/* NEW: Pending Tickets (Status: In Progress) */}
            <Card className="border-l-4 border-l-blue-400 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pending Tickets</CardTitle>
                <Clock className="w-4 h-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.pendingTickets}</div>
              </CardContent>
            </Card>

          </div>

          {/* RECENT ORDERS TABLE */}
          <Card className="shadow-md border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl text-gray-800">Recent Orders</CardTitle>
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                  View All Orders <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-10 text-gray-500">Loading orders...</div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No orders found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3">Order ID</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {order.order_number || order.id.slice(0, 8)}
                          </td>
                          <td className="px-4 py-3">
                            {order.profiles?.full_name || order.profiles?.email || 'Guest'}
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-600">
                             {order.contact_number || order.profiles?.phone || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            ৳{order.total}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link href={`/invoice/${order.id}`}>
                              <Button variant="outline" size="sm" className="h-7 text-xs">
                                Details
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

        </main>
      </div>
    </div>
  );
}
