// app/invoice/[orderId]/page.tsx
import { getInvoiceData, generateEmailInvoiceHTML } from '@/lib/invoice/invoice-generator';
import InvoiceViewer from '@/components/invoice/invoice-viewer';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    orderId: string;
  };
}

export default async function InvoicePage({ params }: Props) {
  // 1. Fetch data securely on the SERVER (This works with your Admin Key)
  const invoiceData = await getInvoiceData(params.orderId);

  if (!invoiceData) {
    return notFound();
  }

  // 2. Generate the HTML string
  const invoiceHTML = generateEmailInvoiceHTML(invoiceData);

  // 3. Pass data to the Client Component to render the UI (Buttons, Iframe, etc.)
  return (
    <InvoiceViewer 
      invoiceHTML={invoiceHTML} 
      invoiceNumber={invoiceData.invoiceNumber} 
    />
  );
}
