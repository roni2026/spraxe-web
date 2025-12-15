'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Package, Eye, Phone, Mail, User } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

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
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles (
          full_name,
          email,
          phone 
        )
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
  
  // --- UPDATED FUNCTION WITH EMAIL LOGIC ---
  const handleStatusChange = async (orderId: string, newStatus: string, customerEmail?: string) => {
    // 1. Update Database Status
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
      return;
    } 

    toast({
      title: 'Success',
      description: 'Order status updated',
    });
    
    // Refresh the UI
    fetchOrders();

    // 2. Trigger Email if status is 'processing'
    if (newStatus === 'processing') {
      if (customerEmail) {
        toast({ title: 'Sending Email...', description: 'Generating and sending invoice...' });
        
        try {
          // Call the API route we created
          const response = await fetch('/api/send-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, email: customerEmail }),
          });

          if (response.ok) {
            toast({ title: 'Email Sent', description: `Invoice sent to ${customerEmail}` });
          } else {
            console.error('Email API Failed');
            toast({ title: 'Email Warning', description: 'Status updated, but email failed to send.', variant: 'destructive' });
          }
        } catch (err) {
          console.error("Email Fetch Error:", err);
          toast({ title: 'Email Error', description: 'Could not connect to email server.', variant: 'destructive' });
        }
      } else {
        console.log("No email found for this user, skipping email.");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      processing: 'default',
      shipped: 'outline',
      delivered: 'default',
      cancelled: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Order Management</h1>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
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

        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No orders found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <h3 className="font-bold text-lg">Order #{order.order_number}</h3>
                           <span className="text-xs text-gray-400">
                             {new Date(order.created_at).toLocaleDateString()}
                           </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                          <User className="w-4 h-4 text-gray-500" />
                          {order.profiles?.full_name || 'Unknown Name'}
                        </div>

                        <div className="flex items-center gap-2 text-gray-800 font-medium">
                          <Phone className="w-4 h-4 text-green-600" />
                          {order.contact_number || order.profiles?.phone || 'No Phone'}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {order.profiles?.email || 'No Email'}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className="text-xl font-bold text-blue-900">৳{order.total || order.total_amount}</p>
                        {getStatusBadge(order.status)}
                        
                        <div className="flex gap-2 mt-2">
                          <Select
                            value={order.status}
                            onValueChange={(value) => 
                              // --- PASS EMAIL HERE ---
                              handleStatusChange(order.id, value, order.profiles?.email)
                            }
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
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
                          <Link href={`/invoice/${order.id}`}>
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
