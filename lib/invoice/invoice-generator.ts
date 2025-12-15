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

const safeNum = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export async function getInvoiceData(orderId: string): Promise<InvoiceData | null> {
  console.log("Fetching invoice data for:", orderId);

  // 1. Fetch Order (Fixed: Removed 'addresses' join which was causing crashes)
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      profiles ( full_name, email, phone ),
      items:order_items (
        quantity,
        price_at_time,
        product:products ( name )
      )
    `)
    .eq('id', orderId)
    .maybeSingle();

  if (orderError) {
    console.error("Supabase Error:", orderError.message);
    return null;
  }
  
  if (!order) {
    console.error("Order not found.");
    return null;
  }

  // 2. Try to fetch Invoice
  let { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  // 3. GENERATE VIRTUAL INVOICE (Fail-safe)
  // If invoice row is missing, we create one in memory so the user still sees data.
  const invNumber = invoice?.invoice_number || order.order_number || 'INV-PREVIEW';
  const issueDate = invoice?.issue_date ? new Date(invoice.issue_date) : new Date(order.created_at);
  const dueDate = invoice?.due_date ? new Date(invoice.due_date) : new Date(order.created_at);

  // Handle Profile Data
  const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
  
  // Data Mapping (Using Order Table Columns)
  const customerName = profile?.full_name || 'Customer';
  const customerPhone = order.contact_number || profile?.phone || 'N/A';
  const customerAddress = order.shipping_address || order.delivery_location || 'Address not provided';

  const items = order.items?.map((item: any) => ({
    name: item.product?.name || 'Product',
    quantity: safeNum(item.quantity),
    price: safeNum(item.price_at_time),
    total: safeNum(item.price_at_time) * safeNum(item.quantity)
  })) || [];

  // Return the data object
  return {
    invoiceNumber: invNumber,
    issueDate: issueDate.toLocaleDateString('en-BD'),
    dueDate: dueDate.toLocaleDateString('en-BD'),
    customer: {
      name: customerName,
      phone: customerPhone,
      address: customerAddress,
    },
    items: items,
    subtotal: safeNum(order.subtotal),
    discountAmount: safeNum(order.discount),
    shippingCost: safeNum(order.shipping_cost),
    totalAmount: safeNum(order.total), 
    notes: invoice?.notes || order.notes || '',
  };
}

export function generateInvoiceHTML(data: InvoiceData): string {
  if (!data) return "<h1>No Invoice Data</h1>";

  const itemsHTML = data.items.map(item => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #eee;">${item.name}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">৳${formatCurrency(item.price)}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">৳${formatCurrency(item.total)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 28px; font-weight: bold; color: #1e3a8a; margin: 0; }
        .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
        .invoice-box { text-align: right; }
        .invoice-label { font-size: 24px; font-weight: bold; color: #1e3a8a; }
        .info-card { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #1e3a8a; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #475569; }
        .totals { width: 300px; margin-left: auto; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .total-row { display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #1e3a8a; margin-top: 10px; font-weight: bold; font-size: 18px; color: #1e3a8a; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #eee; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">SPRAXE</h1>
          <div class="subtitle">Gazipur, Dhaka, Bangladesh</div>
          <div class="subtitle">09638371951</div>
        </div>
        <div class="invoice-box">
          <div class="invoice-label">INVOICE</div>
          <div>${data.invoiceNumber}</div>
          <div>${data.issueDate}</div>
        </div>
      </div>

      <div class="info-card">
        <div style="font-size:12px; text-transform:uppercase; color:#64748b; font-weight:bold; margin-bottom:5px;">Bill To</div>
        <div style="font-size:16px; font-weight:500;">${data.customer.name}</div>
        <div>${data.customer.phone}</div>
        <div style="margin-top:5px; color:#475569;">${data.customer.address}</div>
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
        <div class="row"><span>Subtotal</span><span>৳${formatCurrency(data.subtotal)}</span></div>
        ${data.discountAmount > 0 ? `<div class="row" style="color:#ef4444;"><span>Discount</span><span>-৳${formatCurrency(data.discountAmount)}</span></div>` : ''}
        ${data.shippingCost > 0 ? `<div class="row"><span>Shipping</span><span>৳${formatCurrency(data.shippingCost)}</span></div>` : ''}
        <div class="total-row"><span>Total</span><span>৳${formatCurrency(data.totalAmount)}</span></div>
      </div>

      <div class="footer">
        Thank you for shopping with Spraxe!
      </div>
    </body>
    </html>
  `;
}
