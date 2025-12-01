import { supabase } from '@/lib/supabase/client';

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes: string;
}

export async function getInvoiceData(orderId: string): Promise<InvoiceData | null> {
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      *,
      order:orders (
        *,
        user:profiles (*),
        shipping_address:addresses (*),
        items:order_items (
          *,
          product:products (name)
        )
      )
    `)
    .eq('order_id', orderId)
    .maybeSingle();

  if (invoiceError || !invoice) {
    return null;
  }

  const order = invoice.order as any;

  return {
    invoiceNumber: invoice.invoice_number,
    issueDate: new Date(invoice.issue_date).toLocaleDateString('en-BD'),
    dueDate: new Date(invoice.due_date).toLocaleDateString('en-BD'),
    customer: {
      name: order.user?.full_name || 'Customer',
      phone: order.user?.phone || '',
      address: order.shipping_address
        ? `${order.shipping_address.street_address}, ${order.shipping_address.city}, ${order.shipping_address.postal_code}`
        : 'N/A',
    },
    items: order.items?.map((item: any) => ({
      name: item.product?.name || 'Product',
      quantity: item.quantity,
      price: parseFloat(item.price_at_time),
      total: parseFloat(item.price_at_time) * item.quantity,
    })) || [],
    subtotal: parseFloat(invoice.subtotal),
    taxAmount: parseFloat(invoice.tax_amount),
    discountAmount: parseFloat(invoice.discount_amount),
    totalAmount: parseFloat(invoice.total_amount),
    notes: invoice.notes || '',
  };
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const itemsHTML = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">৳${item.price.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">৳${item.total.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${data.invoiceNumber}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #1e3a8a;
    }
    .company-info h1 {
      color: #1e3a8a;
      margin: 0 0 10px 0;
      font-size: 32px;
    }
    .invoice-details {
      text-align: right;
    }
    .invoice-number {
      font-size: 24px;
      font-weight: bold;
      color: #1e3a8a;
      margin-bottom: 5px;
    }
    .customer-info {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .customer-info h3 {
      margin: 0 0 10px 0;
      color: #1e3a8a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background: #1e3a8a;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    th:nth-child(2), th:nth-child(3), th:nth-child(4) {
      text-align: right;
    }
    .totals {
      margin-left: auto;
      width: 300px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .totals-row.total {
      border-top: 2px solid #1e3a8a;
      margin-top: 8px;
      padding-top: 12px;
      font-size: 18px;
      font-weight: bold;
      color: #1e3a8a;
    }
    .notes {
      background: #fef3c7;
      padding: 15px;
      border-radius: 8px;
      margin-top: 30px;
      border-left: 4px solid #f59e0b;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <h1>SPRAXE</h1>
      <p style="margin: 0;">Vatara, Dhaka, Bangladesh</p>
      <p style="margin: 0;">Phone: 09638371951</p>
      <p style="margin: 0;">Email: support.spraxe@gmail.com</p>
    </div>
    <div class="invoice-details">
      <div class="invoice-number">${data.invoiceNumber}</div>
      <p style="margin: 5px 0;">Issue Date: ${data.issueDate}</p>
      <p style="margin: 5px 0;">Due Date: ${data.dueDate}</p>
    </div>
  </div>

  <div class="customer-info">
    <h3>Bill To:</h3>
    <p style="margin: 5px 0;"><strong>${data.customer.name}</strong></p>
    <p style="margin: 5px 0;">${data.customer.phone}</p>
    <p style="margin: 5px 0;">${data.customer.address}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align: center;">Quantity</th>
        <th style="text-align: right;">Price</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>৳${data.subtotal.toFixed(2)}</span>
    </div>
    ${
      data.discountAmount > 0
        ? `
    <div class="totals-row">
      <span>Discount:</span>
      <span>-৳${data.discountAmount.toFixed(2)}</span>
    </div>
    `
        : ''
    }
    ${
      data.taxAmount > 0
        ? `
    <div class="totals-row">
      <span>Tax:</span>
      <span>৳${data.taxAmount.toFixed(2)}</span>
    </div>
    `
        : ''
    }
    <div class="totals-row total">
      <span>Total Amount:</span>
      <span>৳${data.totalAmount.toFixed(2)}</span>
    </div>
  </div>

  ${
    data.notes
      ? `
  <div class="notes">
    <strong>Notes:</strong><br>
    ${data.notes}
  </div>
  `
      : ''
  }

  <div class="footer">
    <p>Thank you for shopping with Spraxe!</p>
    <p>For any questions, contact us at support.spraxe@gmail.com or call 09638371951</p>
  </div>
</body>
</html>
  `;
}
