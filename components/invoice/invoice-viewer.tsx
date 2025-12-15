// components/invoice/invoice-viewer.tsx
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download, ArrowLeft, Printer, Loader2 } from 'lucide-react';

interface InvoiceViewerProps {
  invoiceHTML: string;
  invoiceNumber: string;
}

export default function InvoiceViewer({ invoiceHTML, invoiceNumber }: InvoiceViewerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  const handleDownload = async () => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    setIsDownloading(true);

    try {
      // 1. Get the content inside the iframe (The Invoice)
      const element = iframe.contentWindow.document.body;

      // 2. Load html2pdf dynamically (Client-side only)
      // @ts-ignore
      const html2pdf = (await import('html2pdf.js')).default;

      // 3. Configure PDF settings
      const opt = {
        margin:       10, // Margin in mm
        filename:     `${invoiceNumber}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true }, // Higher scale = Better quality
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // 4. Save the PDF
      await html2pdf().set(opt).from(element).save();
      
      toast({ title: 'Success', description: 'Invoice downloaded as PDF' });

    } catch (error) {
      console.error("PDF Download Error:", error);
      toast({ title: 'Error', description: 'Failed to generate PDF', variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
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
            <Button 
              variant="outline" 
              onClick={handleDownload} 
              disabled={isDownloading}
              className="gap-2 flex-1 md:flex-none"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isDownloading ? 'Generating...' : 'Download PDF'}
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
              // Ensure scripts are allowed so html2pdf can access it safely
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
