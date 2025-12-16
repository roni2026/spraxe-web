'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Search, Filter, Clock, CheckCircle, AlertCircle, ChevronRight, User, Mail
} from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SupportDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user || profile?.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchTickets();
  }, [user, profile, statusFilter]);

  const fetchTickets = async () => {
    setLoading(true);
    
    // Attempt to fetch tickets with profile data
    // We select 'email' from the ticket table AND from the profile relation
    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        profiles:user_id ( full_name, email, phone )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Fetch Error:", error);
      // Fallback: Fetch without join if the relationship is broken
      const { data: fallbackData } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (fallbackData) setTickets(fallbackData);
    } else if (data) {
      const filtered = statusFilter === 'all' 
        ? data 
        : data.filter((t: any) => t.status === statusFilter);
      setTickets(filtered);
    }
    
    setLoading(false);
  };

  // Stats Calculation
  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    highPriority: tickets.filter(t => t.priority === 'high' && t.status !== 'resolved').length,
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (s: string) => {
    switch(s) {
      case 'open': return <Badge variant="destructive">Open</Badge>;
      case 'in_progress': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">In Progress</Badge>;
      case 'resolved': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Resolved</Badge>;
      case 'closed': return <Badge variant="outline">Closed</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  // Filter by Search Query (Safe search that checks both ticket email and profile email)
  const displayedTickets = tickets.filter(t => {
    const searchLower = searchQuery.toLowerCase();
    const email = t.email || t.profiles?.email || '';
    const subject = t.subject || '';
    const ticketNum = t.ticket_number || '';
    
    return (
      subject.toLowerCase().includes(searchLower) || 
      ticketNum.toLowerCase().includes(searchLower) ||
      email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-1">
        
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search subject or email..." 
                className="pl-9 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-white">
                <Filter className="w-4 h-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-red-500 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Open Tickets</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.open}</h3>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500 opacity-20" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.inProgress}</h3>
              </div>
              <Clock className="h-8 w-8 text-blue-500 opacity-20" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Resolved</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.resolved}</h3>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">High Priority</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.highPriority}</h3>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500 opacity-20" />
            </CardContent>
          </Card>
        </div>

        {/* Tickets Table */}
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50 border-b px-6 py-4">
            <CardTitle className="text-base font-semibold">All Tickets</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-10 text-center text-gray-500">Loading tickets...</div>
            ) : displayedTickets.length === 0 ? (
              <div className="p-10 text-center text-gray-500">No tickets found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b">
                    <tr>
                      <th className="px-6 py-3">Ticket Info</th>
                      <th className="px-6 py-3">Customer</th>
                      <th className="px-6 py-3">Subject</th>
                      <th className="px-6 py-3">Priority</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayedTickets.map((ticket) => (
                      <tr key={ticket.id} className="bg-white hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs text-gray-500">{ticket.ticket_number}</div>
                          <div className="text-xs text-gray-400">{new Date(ticket.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                             <User className="w-3 h-3 text-gray-400" />
                             {ticket.profiles?.full_name || 'Guest User'}
                          </div>
                          <div className="text-xs text-gray-500 pl-5">
                            {/* Fallback to ticket.email if profile email is missing */}
                            {ticket.profiles?.email || ticket.email || 'No Email'}
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate font-medium text-gray-800">
                          {ticket.subject}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(ticket.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/admin/support/${ticket.id}`}>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
                              Manage <ChevronRight className="w-4 h-4 ml-1" />
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
      </div>
    </div>
  );
}
