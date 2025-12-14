'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { getInvoiceData, generateInvoiceHTML, InvoiceData } from '@/lib/invoice/invoice-generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Download, ArrowLeft, Printer } from 'lucide-react';

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Ref to control the iframe
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (user === undefined) return;
    
    if (!user) {
      router.push('/');
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
          router.push(profile?.role === 'admin' ? '/admin' : '/dashboard');
          return;
        }
        setInvoice(data);
      } catch (error) {
        console.error("Invoice Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [user, profile, params?.orderId, router, toast]);

  // THIS IS THE FIX: Inject HTML into an iframe
  useEffect(() => {
    if (invoice && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(generateInvoiceHTML(invoice));
        doc.close();
      }
    }
  }, [invoice]);

  const handleBack = () => {
    if (profile?.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
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
        {/* Header Controls */}
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

        {/* Invoice Display Area */}
        <Card className="shadow-lg overflow-hidden">
          <CardContent className="p-0 bg-white">
            <iframe
              ref={iframeRef}
              title="Invoice"
              className="w-full h-[1100px] border-none"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
