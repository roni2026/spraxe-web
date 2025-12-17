'use client';

import { useState } from 'react';
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

    setTicketNumber(generatedTicket);
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
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        <a
          href="https://m.me/spraxe"
          target="_blank"
          className="bg-blue-600 p-3 rounded-full shadow-lg hover:scale-105 transition"
        >
          <MessageSquare className="text-white" />
        </a>

        <a
          href="https://wa.me/01606087761"
          target="_blank"
          className="bg-green-600 p-3 rounded-full shadow-lg hover:scale-105 transition"
        >
          <Phone className="text-white" />
        </a>
      </div>

      {/* Success Modal */}
      {ticketNumber && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full text-center shadow-xl">
            <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Ticket Received
            </h2>
            <p className="text-gray-600 mb-4">
              Your support request has been submitted successfully.
            </p>
            <p className="font-mono bg-gray-100 p-2 rounded mb-6">
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
