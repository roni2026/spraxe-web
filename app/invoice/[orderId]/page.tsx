'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { getInvoiceData, generateInvoiceHTML, InvoiceData } from '@/lib/invoice/invoice-generator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Download, Mail, ArrowLeft } from 'lucide-react';

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    const fetchInvoice = async () => {
      const data = await getInvoiceData(params.orderId as string);
      if (!data) {
        toast({
          title: 'Error',
          description: 'Invoice not found',
          variant: 'destructive',
        });
        router.push('/dashboard');
        return;
      }
      setInvoice(data);
      setLoading(false);
    };

    fetchInvoice();
  }, [user, params.orderId, router, toast]);

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

    toast({
      title: 'Success',
      description: 'Invoice downloaded successfully',
    });
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

  if (!invoice) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button onClick={handlePrint} className="gap-2 bg-blue-900 hover:bg-blue-800">
              Print Invoice
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
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
