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

// Helper to safely convert to number (prevents NaN)
const safeNum = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Helper to format currency (e.g., 1,500.00)
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export async function getInvoiceData(orderId: string): Promise<InvoiceData | null> {
  // 1. Fetch Order Data (Primary Source for Money, Items & Contact)
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

  // 2. Fetch Invoice Data (Primary Source for Invoice # & Dates)
  const { data: invoice } = await supabase
    .from('invoices')
    .select('invoice_number, issue_date, due_date, notes')
    .eq('order_id', orderId)
    .maybeSingle();

  // 3. Construct Final Data (Hybrid Approach)
  
  // Invoice Number & Dates (Fallback to Order data if Invoice missing)
  const invNumber = invoice?.invoice_number || order.order_number || 'INV-PENDING';
  const issueDate = invoice?.issue_date ? new Date(invoice.issue_date) : new Date(order.created_at);
  const dueDate = invoice?.due_date ? new Date(invoice.due_date) : new Date(order.created_at);

  // Address Logic: Prefer 'shipping_address' (text), fallback to 'delivery_location'
  const finalAddress = order.shipping_address || order.delivery_location || 'Address not provided';

  // Phone Logic: Prefer 'contact_number' (Orders) -> 'phone' (Profiles)
  const finalPhone = order.contact_number || order.user?.phone || 'N/A';

  // Process Items
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
    
    // --- MONEY COLUMNS (From Orders Table) ---
    subtotal: safeNum(order.subtotal),
    discountAmount: safeNum(order.discount),
    shippingCost: safeNum(order.shipping_cost),
    totalAmount: safeNum(order.total), 
    // -----------------------------------------
    
    notes: invoice?.notes || order.notes || 'Thank you for shopping with Spraxe!',
  };
}

// Function to generate the HTML string for display/print
export function generateInvoiceHTML(data: InvoiceData): string {
  const itemsHTML = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">৳${formatCurrency(item.price)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">৳${formatCurrency(item.total)}</td>
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
    body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 3px solid #1e3a8a; padding-bottom: 20px; }
    .company-name { font-size: 32px; font-weight: 800; color: #1e3a8a; margin: 0; }
    .company-details { font-size: 14px; color: #666; margin-top: 5px; }
    .invoice-title { text-align: right; }
    .invoice-title h2 { font-size: 24px; color: #1e3a8a; margin: 0; }
    .meta-data { font-size: 14px; color: #666; margin-top: 5px; }
    
    .bill-to { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #1e3a8a; }
    .bill-to h3 { margin: 0 0 10px 0; color: #1e3a8a; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; }
    .bill-to p { margin: 3px 0; font-size: 14px; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #1e3a8a; color: white; padding: 12px; text-align: left; font-size: 14px; font-weight: 600; text-transform: uppercase; }
    td { padding: 12px; font-size: 14px; color: #444; }
    
    .totals { width: 300px; margin-left: auto; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .row.total { border-top: 2px solid #1e3a8a; margin-top: 10px; padding-top: 10px; font-weight: 700; font-size: 18px; color: #1e3a8a; }
    
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="company-name">SPRAXE</h1>
      <div class="company-details">
        Vatara, Dhaka, Bangladesh<br>
        Phone: 09638371951<br>
        Email: support.spraxe@gmail.com
      </div>
    </div>
    <div class="invoice-title">
      <h2>INVOICE</h2>
      <div class="meta-data">
        <b>${data.invoiceNumber}</b><br>
        Date: ${data.issueDate}<br>
        Due: ${data.dueDate}
      </div>
    </div>
  </div>

  <div class="bill-to">
    <h3>Bill To</h3>
    <p><strong>${data.customer.name}</strong></p>
    <p>Phone: ${data.customer.phone}</p>
    <p>Address: ${data.customer.address}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th width="50%">Item Description</th>
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
    <div class="row">
      <span>Subtotal</span>
      <span>৳${formatCurrency(data.subtotal)}</span>
    </div>
    ${data.discountAmount > 0 ? `
    <div class="row" style="color: #dc2626;">
      <span>Discount</span>
      <span>-৳${formatCurrency(data.discountAmount)}</span>
    </div>` : ''}
    ${data.shippingCost > 0 ? `
    <div class="row">
      <span>Shipping</span>
      <span>৳${formatCurrency(data.shippingCost)}</span>
    </div>` : ''}
    <div class="row total">
      <span>Total</span>
      <span>৳${formatCurrency(data.totalAmount)}</span>
    </div>
  </div>

  ${data.notes ? `
  <div style="margin-top: 30px; padding: 15px; background: #fffbeb; border-radius: 6px; font-size: 13px; color: #92400e;">
    <strong>Note:</strong> ${data.notes}
  </div>` : ''}

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>Spraxe E-Commerce &bull; www.spraxe.com</p>
  </div>
</body>
</html>
  `;
}
