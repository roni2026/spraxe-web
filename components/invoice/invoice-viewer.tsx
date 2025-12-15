// components/invoice/invoice-viewer.tsx
'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download, ArrowLeft, Printer } from 'lucide-react';

interface InvoiceViewerProps {
  invoiceHTML: string;
  invoiceNumber: string;
}

export default function InvoiceViewer({ invoiceHTML, invoiceNumber }: InvoiceViewerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  const handleDownload = () => {
    if (!invoiceHTML) return;
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Success', description: 'Invoice downloaded' });
  };

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
