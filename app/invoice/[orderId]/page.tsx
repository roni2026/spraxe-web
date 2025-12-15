// app/invoice/[orderId]/page.tsx
import { getInvoiceData, generateInvoiceHTML } from '@/lib/invoice/invoice-generator'; // <--- CHANGED THIS IMPORT
import InvoiceViewer from '@/components/invoice/invoice-viewer';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    orderId: string;
  };
}

export default async function InvoicePage({ params }: Props) {
  // 1. Fetch data securely
  const invoiceData = await getInvoiceData(params.orderId);

  if (!invoiceData) {
    return notFound();
  }

  // 2. Generate the HTML using the WEB layout (Wider, better design)
  // ❌ WAS: const invoiceHTML = generateEmailInvoiceHTML(invoiceData);
  const invoiceHTML = generateInvoiceHTML(invoiceData); 

  // 3. Pass to viewer
  return (
    <InvoiceViewer 
      invoiceHTML={invoiceHTML} 
      invoiceNumber={invoiceData.invoiceNumber} 
    />
  );
}
