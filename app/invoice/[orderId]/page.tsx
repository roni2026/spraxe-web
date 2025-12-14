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
  
  const [invoiceHTML, setInvoiceHTML] = useState<string>('');
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Ref for the iframe (allows printing)
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // 1. Wait for user to be logged in
    if (user === undefined) return;
    if (!user) {
      router.push('/');
      return;
    }

    const fetchInvoice = async () => {
      const orderId = params?.orderId as string;
      if (!orderId) return;

      try {
        // 2. Fetch (and Auto-Generate) the Invoice
        const data = await getInvoiceData(orderId);
        
        if (!data) {
          toast({
            title: 'Error',
            description: 'Could not load invoice data.',
            variant: 'destructive',
          });
          return;
        }

        // 3. Set Data
        setInvoiceData(data);
        setInvoiceHTML(generateInvoiceHTML(data));
      } catch (error) {
        console.error("Invoice Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [user, profile, params?.orderId, router, toast]);

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  const handleDownload = () => {
    if (!invoiceData) return;
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceData.invoiceNumber}.html`;
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

  if (!invoiceData) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold text-red-600">Order Not Found</h2>
        <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="gap-2 self-start md:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
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

        <Card className="shadow-lg overflow-hidden">
          <CardContent className="p-0 bg-white">
            {/* The srcDoc is CRITICAL. It makes the styles show up correctly. */}
            <iframe
              ref={iframeRef}
              srcDoc={invoiceHTML}
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
