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
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
  notes: string;
}

// Helper: Safety check for numbers
const safeNum = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Helper: Currency formatting (e.g. 1,200.00)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export async function getInvoiceData(orderId: string): Promise<InvoiceData | null> {
  // 1. Fetch Order Data (This is where your Money & Contact info lives)
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      user:profiles (
        full_name,
        email,
        phone
      ),
      items:order_items (
        quantity,
        price_at_time,
        product:products (name)
      )
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    console.error('Order Fetch Error:', orderError);
    return null;
  }

  // 2. Fetch Invoice Data (Just for the Invoice Number & Dates)
  const { data: invoice } = await supabase
    .from('invoices')
    .select('invoice_number, issue_date, due_date, notes')
    .eq('order_id', orderId)
    .maybeSingle();

  // 3. Build the Data Object
  const invNumber = invoice?.invoice_number || order.order_number || 'INV-PENDING';
  
  // Date Logic
  const issueDate = invoice?.issue_date ? new Date(invoice.issue_date) : new Date(order.created_at);
  const dueDate = invoice?.due_date ? new Date(invoice.due_date) : new Date(order.created_at);

  // Address Logic: Use the text column from your CSV
  const finalAddress = order.shipping_address || order.delivery_location || 'Address not provided';

  // Phone Logic: Use contact_number from Orders (per your CSV)
  const finalPhone = order.contact_number || order.user?.phone || 'N/A';

  // Items Logic
  const items = order.items?.map((item: any) => {
    const qty = safeNum(item.quantity) || 1;
    const price = safeNum(item.price_at_time);
    return {
      name: item.product?.name || 'Product',
      quantity: qty,
      price: price,
      total: price * qty,
    };
  }) || [];

  return {
    invoiceNumber: invNumber,
    issueDate: issueDate.toLocaleDateString('en-BD'),
    dueDate: dueDate.toLocaleDateString('en-BD'),
    customer: {
      name: order.user?.full_name || 'Valued Customer',
      phone: finalPhone,
      address: finalAddress,
    },
    items: items,
    
    // --- MONEY MAPPING (Fixing the 0.00 issue) ---
    subtotal: safeNum(order.subtotal),
    discountAmount: safeNum(order.discount),
    shippingCost: safeNum(order.shipping_cost),
    totalAmount: safeNum(order.total), 
    // ---------------------------------------------
    
    notes: invoice?.notes || order.notes || 'Thank you for shopping with Spraxe!',
  };
}

// Generates the HTML string
export function generateInvoiceHTML(data: InvoiceData): string {
  const itemsHTML = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">৳${formatCurrency(item.price)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">৳${formatCurrency(item.total)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${data.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 30px; }
        .company-name { font-size: 32px; font-weight: bold; color: #1e3a8a; margin: 0; }
        .bill-to { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 5px solid #1e3a8a; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #1e3a8a; color: white; padding: 12px; text-align: left; }
        .totals { width: 300px; margin-left: auto; }
        .row { display: flex; justify-content: space-between; padding: 5px 0; }
        .total { border-top: 2px solid #1e3a8a; margin-top: 10px; padding-top: 10px; font-weight: bold; color: #1e3a8a; font-size: 18px; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="company-name">SPRAXE</h1>
          <div>Vatara, Dhaka, Bangladesh</div>
          <div>09638371951</div>
        </div>
        <div style="text-align: right;">
          <h2 style="color: #1e3a8a; margin: 0;">INVOICE</h2>
          <div><b>${data.invoiceNumber}</b></div>
          <div>Date: ${data.issueDate}</div>
        </div>
      </div>

      <div class="bill-to">
        <h3 style="margin: 0 0 10px 0; color: #1e3a8a;">BILL TO:</h3>
        <div><strong>${data.customer.name}</strong></div>
        <div>${data.customer.phone}</div>
        <div>${data.customer.address}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th width="50%">Item</th>
            <th width="15%" style="text-align: center;">Qty</th>
            <th width="15%" style="text-align: right;">Price</th>
            <th width="20%" style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div class="totals">
        <div class="row"><span>Subtotal:</span><span>৳${formatCurrency(data.subtotal)}</span></div>
        ${data.discountAmount > 0 ? `<div class="row" style="color:red;"><span>Discount:</span><span>-৳${formatCurrency(data.discountAmount)}</span></div>` : ''}
        ${data.shippingCost > 0 ? `<div class="row"><span>Shipping:</span><span>৳${formatCurrency(data.shippingCost)}</span></div>` : ''}
        <div class="row total"><span>Total:</span><span>৳${formatCurrency(data.totalAmount)}</span></div>
      </div>

      <div class="footer">
        Thank you for shopping with Spraxe!
      </div>
    </body>
    </html>
  `;
}
