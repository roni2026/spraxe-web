'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Send, User, Mail, Phone, 
  ShoppingBag, Calendar, AlertTriangle 
} from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TicketPageProps {
  params: { ticketId: string };
}

export default function TicketDetailPage({ params }: TicketPageProps) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [ticket, setTicket] = useState<any>(null);
  const [relatedOrder, setRelatedOrder] = useState<any>(null);
  const [customerStats, setCustomerStats] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchTicketDetails();
  }, [user, profile]);

  const fetchTicketDetails = async () => {
    try {
      // 1. Try to fetch Ticket WITH Profile data
      let { data: ticketData, error } = await supabase
        .from('support_tickets')
        .select(`*, profiles:user_id (*)`)
        .eq('id', params.ticketId)
        .single();

      // 2. Fallback: If JOIN fails (e.g. no profile found), fetch JUST the ticket
      if (error || !ticketData) {
        console.warn("Join fetch failed, trying fallback...", error);
        const { data: rawTicket, error: rawError } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('id', params.ticketId)
          .single();
          
        if (rawError) throw rawError;
        
        // Use raw ticket data, and set profiles to null for now
        ticketData = { ...rawTicket, profiles: null };
        
        // Try to fetch profile manually if user_id exists
        if (rawTicket.user_id) {
           const { data: p } = await supabase
             .from('profiles')
             .select('*')
             .eq('id', rawTicket.user_id)
             .single();
           if (p) ticketData.profiles = p;
        }
      }

      setTicket(ticketData);

      // 3. Fetch Related Order (if exists)
      if (ticketData.order_id) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('id', ticketData.order_id)
          .single();
        setRelatedOrder(orderData);
      }

      // 4. Fetch Customer Stats (if user exists)
      if (ticketData.user_id) {
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', ticketData.user_id);
        
        setCustomerStats({ totalOrders: count });
      }

    } catch (err: any) {
      console.error("Critical Error Fetching Ticket:", err);
      setErrorState(err.message || "Failed to load ticket.");
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status: newStatus })
      .eq('id', ticket.id);

    if (!error) {
      setTicket({ ...ticket, status: newStatus });
      toast({ title: 'Status Updated', description: `Ticket marked as ${newStatus}` });
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;
    setIsSending(true);

    // Determines the email address to send to (Prioritize Profile email, then Ticket email)
    const targetEmail = ticket.profiles?.email || ticket.email;

    if (!targetEmail) {
      toast({ title: 'Error', description: 'No email address found for this ticket.', variant: 'destructive' });
      setIsSending(false);
      return;
    }

    try {
      // 1. Send Email via Brevo API Route
      const response = await fetch('/api/support/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          customerEmail: targetEmail,
          subject: ticket.subject,
          message: replyMessage,
          agentName: profile?.full_name || 'Support Agent'
        }),
      });

      if (!response.ok) throw new Error('Failed to send email');

      // 2. Update Ticket Status to 'resolved'
      await supabase
        .from('support_tickets')
        .update({ status: 'resolved', updated_at: new Date().toISOString() })
        .eq('id', ticket.id);

      setTicket({ ...ticket, status: 'resolved' });
      setReplyMessage('');
      toast({ title: 'Reply Sent', description: 'Email sent to customer & ticket resolved.' });

    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to send email. Check console.', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  if (errorState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
        <AlertTriangle className="w-10 h-10 text-red-500" />
        <h2 className="text-xl font-bold text-gray-800">Error Loading Ticket</h2>
        <p className="text-gray-500">{errorState}</p>
        <Link href="/admin/support">
          <Button variant="outline">Go Back</Button>
        </Link>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
        <p className="text-gray-500">Loading Ticket Details...</p>
      </div>
    );
  }

  const displayEmail = ticket.profiles?.email || ticket.email || 'No Email Provided';
  const displayName = ticket.profiles?.full_name || 'Guest User';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="container mx-auto px-4 py-6 flex-1">
        
        {/* Top Navigation Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/support">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-mono text-sm">#{ticket.ticket_number}</span>
                <Badge variant={ticket.status === 'open' ? 'destructive' : 'default'}>
                  {ticket.status.toUpperCase()}
                </Badge>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{ticket.subject}</h1>
            </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={ticket.status} onValueChange={handleUpdateStatus}>
              <SelectTrigger className="w-full md:w-[160px] bg-white">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Conversation & Reply */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Original Customer Message */}
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
              <CardHeader className="bg-gray-50/50 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold">{displayName}</span>
                    <span className="text-xs text-gray-400">wrote:</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(ticket.created_at).toLocaleString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 text-gray-800 whitespace-pre-wrap leading-relaxed">
                {ticket.message}
              </CardContent>
            </Card>

            {/* 2. Reply Editor */}
            <Card className="shadow-md border-gray-200">
              <CardHeader className="pb-3 border-b bg-gray-50">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  Reply to Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="bg-blue-50 p-3 rounded text-xs text-blue-800 flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  Reply will be sent to: <strong>{displayEmail}</strong>
                </div>
                
                <Textarea 
                  placeholder="Type your response here... (This will be emailed to the customer)" 
                  className="min-h-[200px] text-base"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                />

                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-xs text-gray-400 text-center md:text-left">
                    Pressing send will also mark ticket as <strong>Resolved</strong>.
                  </div>
                  <Button 
                    className="bg-blue-900 hover:bg-blue-800 w-full md:w-auto min-w-[150px]" 
                    onClick={handleSendReply}
                    disabled={isSending}
                  >
                    {isSending ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN: Context Sidebar */}
          <div className="space-y-6">
            
            {/* Customer Profile Card */}
            <Card>
              <CardHeader className="bg-gray-50 pb-3">
                <CardTitle className="text-sm font-semibold">Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                    {displayName.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="font-semibold">{displayName}</div>
                    <div className="text-xs text-gray-500">Customer</div>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-3.5 h-3.5" /> 
                    <span className="truncate max-w-[200px]">{displayEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-3.5 h-3.5" /> {ticket.profiles?.phone || 'No Phone'}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <ShoppingBag className="w-3.5 h-3.5" /> {customerStats?.totalOrders || 0} Total Orders
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Order Card (If exists) */}
            {relatedOrder && (
              <Card>
                <CardHeader className="bg-gray-50 pb-3">
                  <CardTitle className="text-sm font-semibold flex justify-between items-center">
                    Related Order
                    <Link href={`/invoice/${relatedOrder.id}`}>
                      <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">View</Badge>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order #</span>
                    <span className="font-mono font-medium">{relatedOrder.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span>{new Date(relatedOrder.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total</span>
                    <span className="font-bold">৳{relatedOrder.total}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-500">Status</span>
                    <Badge variant="secondary" className="capitalize">{relatedOrder.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Internal Info */}
            <Card className="bg-yellow-50 border-yellow-100">
              <CardContent className="p-4 text-xs text-yellow-800 flex gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <p>
                  <strong>Note:</strong> Replies sent here are final and emailed immediately via Brevo.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
