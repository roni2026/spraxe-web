'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  MessageSquare,
  Phone,
  CheckCircle2,
} from 'lucide-react';

export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Show "Need help?" after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHelp(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const [formData, setFormData] = useState({
    type: 'inquiry',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please log in to submit a support ticket.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const generatedTicket = `TICKET-${Date.now()}`;

    // 1️⃣ Insert ticket into Supabase
    const { error } = await supabase.from('support_tickets').insert({
      user_id: user.id,
      ticket_number: generatedTicket,
      email: formData.email,
      type: formData.type,
      subject: formData.subject,
      message: formData.message,
      status: 'open',
      priority: 'medium',
    });

    setLoading(false);

    if (error) {
      toast({
        title: 'Submission failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    // 2️⃣ Call auto-confirmation API (fire-and-forget)
    fetch('/api/support/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketNumber: generatedTicket,
        customerEmail: formData.email,
        subject: formData.subject,
      }),
    }).catch(console.error);

    // 3️⃣ Show floating success modal
    setTicketNumber(generatedTicket);

    // 4️⃣ Reset form
    setFormData({
      type: 'inquiry',
      email: '',
      subject: '',
      message: '',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-14">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Support Center
            </h1>
            <p className="text-gray-600 text-lg">
              Need help? Our team is ready to assist you.
            </p>
          </div>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <SupportCard
              icon={<Mail />}
              title="Email"
              value="spraxcare@gmail.com"
            />
            <SupportCard
              icon={<Phone />}
              title="Phone"
              value="09638-371951"
            />
            <SupportCard
              icon={<MessageSquare />}
              title="Live Chat"
              value="8 AM – 11 PM"
            />
          </div>

          {/* Ticket Form */}
          <Card className="shadow-lg border border-gray-200">
            <CardHeader>
              <CardTitle>Submit a Support Ticket</CardTitle>
              <CardDescription>
                Please provide accurate details so we can assist you faster.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label>Request Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inquiry">General Inquiry</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                      <SelectItem value="refund">Refund Request</SelectItem>
                      <SelectItem value="issue">Technical Issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Subject</Label>
                  <Input
                    required
                    placeholder="Short summary of your issue"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Message</Label>
                  <Textarea
                    rows={6}
                    required
                    placeholder="Describe your issue in detail"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-900 hover:bg-blue-800"
                  disabled={loading}
                >
                  {loading ? 'Submitting…' : 'Submit Ticket'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Floating Messenger & WhatsApp */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-50 items-end">
        
        {/* Help Text */}
        <div className={`transition-all duration-500 ease-in-out transform ${showHelp ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'} absolute right-16 top-1`}>
          <div className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg text-sm font-semibold whitespace-nowrap border border-gray-100 flex items-center">
            Need help?
            {/* Arrow pointing to icons */}
            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-t border-r border-gray-100 transform rotate-45"></div>
          </div>
        </div>

        {/* Messenger Button */}
        <a
          href="https://m.me/spraxe"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center bg-white overflow-hidden"
          title="Chat on Messenger"
        >
          {/* Messenger SVG */}
          <svg viewBox="0 0 28 28" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 0C6.18 0 0 5.66 0 12.81c0 3.85 1.8 7.23 4.7 9.55V28l4.3-2.36c1.55.43 3.2.66 4.9.66 7.82 0 14-5.66 14-12.81S21.82 0 14 0zm1.7 17.5l-2.8-2.9-5.5 2.9 6-6.4 2.9 2.9 5.4-2.9-6 6.4z" fill="#0084FF"/>
          </svg>
        </a>

        {/* WhatsApp Button */}
        <a
          href="https://wa.me/01606087761"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center bg-[#25D366] overflow-hidden p-2"
          title="Chat on WhatsApp"
        >
          {/* WhatsApp SVG */}
          <svg viewBox="0 0 24 24" className="w-full h-full" fill="#FFF" xmlns="http://www.w3.org/2000/svg">
             <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        </a>
      </div>

      {/* Success Modal */}
      {ticketNumber && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-xl transform transition-all scale-100">
            <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Ticket Received
            </h2>
            <p className="text-gray-600 mb-4">
              Your support request has been submitted successfully.
            </p>
            <p className="font-mono bg-gray-100 p-2 rounded mb-6 select-all">
              {ticketNumber}
            </p>
            <Button onClick={() => setTicketNumber(null)}>
              Close
            </Button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function SupportCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <Card className="text-center hover:shadow-md transition">
      <CardContent className="p-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-700">
          {icon}
        </div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}
