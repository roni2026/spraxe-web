'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  order_count?: number;
  total_spent?: number;
}

export default function CustomersManagement() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchCustomers();
  }, [user, profile]);

  const fetchCustomers = async () => {
    setLoading(true);

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (profilesError) {
      toast({
        title: 'Error',
        description: 'Failed to fetch customers',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (profilesData) {
      const customersWithStats = await Promise.all(
        profilesData.map(async (customer) => {
          const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', customer.id);

          const { data: orders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('user_id', customer.id);

          const totalSpent = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

          return {
            ...customer,
            order_count: count || 0,
            total_spent: totalSpent,
          };
        })
      );

      setCustomers(customersWithStats);
    }
    setLoading(false);
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
            <h1 className="text-3xl font-bold">Customer Management</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : customers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No customers yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{customer.full_name}</h3>
                          <Badge variant="outline">{customer.role}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                        {customer.phone && (
                          <p className="text-sm text-gray-600">{customer.phone}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Joined {new Date(customer.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <ShoppingBag className="w-4 h-4 text-gray-500" />
                          <span>{customer.order_count} orders</span>
                        </div>
                        <p className="text-lg font-bold text-blue-900">
                          ৳{customer.total_spent?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-xs text-gray-500">Total spent</p>
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
