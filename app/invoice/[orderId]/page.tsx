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
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) { router.push('/'); return; }

    const fetchInvoice = async () => {
      const data = await getInvoiceData(params.orderId as string);
      if (!data) {
        toast({ title: 'Error', description: 'Invoice not found', variant: 'destructive' });
        router.push(profile?.role === 'admin' ? '/admin' : '/dashboard');
        return;
      }
      setInvoiceData(data);
      // Generate the full HTML string here
      setInvoiceHTML(generateInvoiceHTML(data));
      setLoading(false);
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

  if (loading) return <div className="p-8"><Skeleton className="w-full h-96" /></div>;
  if (!invoiceData) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push(profile?.role === 'admin' ? '/admin' : '/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Print Invoice
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0 bg-white">
            {/* The srcDoc is CRITICAL here. It makes the styles work. */}
            <iframe
              ref={iframeRef}
              srcDoc={invoiceHTML}
              title="Invoice"
              className="w-full h-[1000px] border-none"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
