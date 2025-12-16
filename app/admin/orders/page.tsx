'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Package, Eye, Phone, Mail, User, Calendar, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
}

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  total: number;
  total_amount: number;
  created_at: string;
  contact_number: string;
  profiles: {
    full_name: string;
    email: string;
    phone: string;
  };
  order_items: OrderItem[]; // <--- Added Order Items
}

export default function OrdersManagement() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchOrders();
  }, [user, profile, filter]);

  const fetchOrders = async () => {
    setLoading(true);
    
    // 1. Updated Query to fetch 'order_items'
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles ( full_name, email, phone ),
        order_items ( id, product_name, quantity )
      `)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase Fetch Error:", error);
      toast({
        title: 'Error',
        description: `Failed to fetch orders: ${error.message}`,
        variant: 'destructive',
      });
    } else if (data) {
      setOrders(data as any);
    }
    setLoading(false);
  };
  
  const handleStatusChange = async (orderId: string, newStatus: string, customerEmail?: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
      return;
    } 

    toast({ title: 'Success', description: 'Order status updated' });
    fetchOrders();

    // Trigger Email if status is 'processing'
    if (newStatus === 'processing') {
      if (customerEmail) {
        toast({ title: 'Sending Email...', description: 'Generating invoice...' });
        try {
          await fetch('/api/send-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, email: customerEmail }),
          });
          toast({ title: 'Email Sent', description: `Invoice sent to ${customerEmail}` });
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 flex-1">
        
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Link href="/admin">
              <Button variant="outline" size="sm" className="h-9">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order Management</h1>
          </div>
          
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-white">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="shadow-sm border-gray-200 overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b px-6 py-4">
            <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
              <Package className="w-4 h-4" />
              All Orders ({orders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mb-2"></div>
                 <p>Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-lg font-medium text-gray-900">No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 font-medium w-[20%]">Order Info</th>
                      <th className="px-6 py-3 font-medium w-[20%]">Customer</th>
                      <th className="px-6 py-3 font-medium w-[30%]">Items</th> {/* New Column */}
                      <th className="px-6 py-3 font-medium w-[10%] text-right">Total</th>
                      <th className="px-6 py-3 font-medium w-[20%] text-right">Status & Action</th> {/* Combined */}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => (
                      <tr key={order.id} className="bg-white hover:bg-gray-50/80 transition-colors">
                        
                        {/* 1. Order Info */}
                        <td className="px-6 py-4 align-top">
                          <div className="font-bold text-gray-900 text-base mb-1">
                            {order.order_number || order.id.slice(0, 8).toUpperCase()}
                          </div>
                          <div className="flex items-center text-xs text-gray-500 gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </td>

                        {/* 2. Customer Info */}
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col gap-1">
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              {order.profiles?.full_name || 'Guest User'}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              {order.profiles?.email || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              <Phone className="w-3 h-3" />
                              {order.contact_number || order.profiles?.phone || 'N/A'}
                            </div>
                          </div>
                        </td>

                        {/* 3. Items Column (New) */}
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col gap-1">
                            {order.order_items && order.order_items.length > 0 ? (
                              order.order_items.map((item) => (
                                <div key={item.id} className="text-sm text-gray-700 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                  <span className="font-medium">{item.product_name}</span>
                                  <span className="text-gray-500 text-xs">x{item.quantity}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-gray-400 italic text-xs">No items found</span>
                            )}
                          </div>
                        </td>

                        {/* 4. Total */}
                        <td className="px-6 py-4 align-top text-right">
                          <div className="font-bold text-blue-900 text-base">
                            ৳{(order.total || order.total_amount).toLocaleString()}
                          </div>
                        </td>

                        {/* 5. Status & Invoice (Stacked) */}
                        <td className="px-6 py-4 align-top text-right">
                          <div className="flex flex-col gap-2 items-end">
                            {/* Status Dropdown */}
                            <Select 
                              value={order.status} 
                              onValueChange={(value) => handleStatusChange(order.id, value, order.profiles?.email)}
                            >
                              <SelectTrigger className={`w-[130px] h-8 text-xs font-medium border capitalize ${getStatusColor(order.status)}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Invoice Button */}
                            <Link href={`/invoice/${order.id}`}>
                              <Button variant="outline" size="sm" className="h-8 w-[130px] text-xs hover:bg-blue-50 hover:text-blue-700">
                                <Eye className="w-3 h-3 mr-1.5" />
                                Invoice
                              </Button>
                            </Link>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
