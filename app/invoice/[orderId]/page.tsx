'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context'; // Ensure this provides 'profile'
import { getInvoiceData, generateInvoiceHTML, InvoiceData } from '@/lib/invoice/invoice-generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Download, ArrowLeft, Printer } from 'lucide-react';

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth(); // <--- Get profile to check role
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If auth is still loading, wait (optional safety check)
    if (user === undefined) return; 
    
    if (!user) {
      router.push('/login'); // Redirect to login, not just home
      return;
    }

    const fetchInvoice = async () => {
      const orderId = params?.orderId as string;
      if (!orderId) return;

      try {
        const data = await getInvoiceData(orderId);
        if (!data) {
          toast({
            title: 'Error',
            description: 'Invoice details not found.',
            variant: 'destructive',
          });
          // Redirect based on role if not found
          router.push(profile?.role === 'admin' ? '/admin' : '/dashboard');
          return;
        }
        setInvoice(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [user, profile, params?.orderId, router, toast]);

  const handleBack = () => {
    // Smart Redirect: Admins go to Admin Panel, Customers go to Dashboard
    if (profile?.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const handlePrint = () => {
    if (!invoice) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(generateInvoiceHTML(invoice));
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleDownload = () => {
    if (!invoice) return;
    const html = generateInvoiceHTML(invoice);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Success', description: 'Invoice downloaded' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="w-full h-96" />
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <Button variant="ghost" onClick={handleBack} className="gap-2 self-start md:self-auto">
            <ArrowLeft className="w-4 h-4" />
            {profile?.role === 'admin' ? 'Back to Orders' : 'Back to Dashboard'}
          </Button>
          
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={handleDownload} className="gap-2 flex-1 md:flex-none">
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button onClick={handlePrint} className="gap-2 bg-blue-900 hover:bg-blue-800 flex-1 md:flex-none">
              <Printer className="w-4 h-4" />
              Print
            </Button>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-0 overflow-hidden rounded-lg">
            {/* Render the Invoice HTML safely */}
            <div
              dangerouslySetInnerHTML={{ __html: generateInvoiceHTML(invoice) }}
              className="bg-white"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
