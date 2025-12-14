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
  // 1. Fetch Order Data (Source of Truth)
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      profiles (
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
    .maybeSingle();

  if (orderError || !order) {
    console.error("Order fetch error:", orderError);
    return null;
  }

  // 2. Try to fetch existing Invoice
  let { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  // 3. AUTO-GENERATE if Invoice is missing
  if (!invoice) {
    console.log("Invoice missing for order. Generating new one...");
    
    // Generate a unique invoice number: INV-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    const newInvoiceNumber = `INV-${dateStr}-${randomSuffix}`;

    const { data: newInvoice, error: createError } = await supabase
      .from('invoices')
      .insert({
        order_id: orderId,
        invoice_number: newInvoiceNumber,
        issue_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days
        subtotal: order.subtotal || 0,
        tax_amount: 0,
        discount_amount: order.discount || 0, // Using 'discount' from orders
        total_amount: order.total || 0,       // Using 'total' from orders
        notes: 'Thank you for shopping with Spraxe!'
      })
      .select()
      .single();

    if (createError) {
      console.error("Failed to auto-create invoice:", createError);
      // Fallback: Create a temporary object so the user still sees the invoice view
      invoice = {
        invoice_number: newInvoiceNumber,
        issue_date: new Date().toISOString(),
        due_date: new Date().toISOString(),
        notes: 'Preview (Unsaved)'
      };
    } else {
      invoice = newInvoice;
    }
  }

  // 4. Prepare Return Data
  const profileData = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;

  const items = order.items?.map((item: any) => ({
    name: item.product?.name || 'Product',
    quantity: safeNum(item.quantity),
    price: safeNum(item.price_at_time),
    total: safeNum(item.price_at_time) * safeNum(item.quantity)
  })) || [];

  return {
    invoiceNumber: invoice.invoice_number,
    issueDate: new Date(invoice.issue_date).toLocaleDateString('en-BD'),
    dueDate: new Date(invoice.due_date).toLocaleDateString('en-BD'),
    customer: {
      name: profileData?.full_name || 'Customer',
      phone: order.contact_number || profileData?.phone || 'N/A',
      address: order.shipping_address || order.delivery_location || 'Address not provided',
    },
    items: items,
    // Use Order money values as source of truth
    subtotal: safeNum(order.subtotal),
    discountAmount: safeNum(order.discount),
    shippingCost: safeNum(order.shipping_cost),
    totalAmount: safeNum(order.total),
    notes: invoice.notes || '',
  };
}

export function generateInvoiceHTML(data: InvoiceData): string {
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
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 28px; font-weight: bold; color: #1e3a8a; margin: 0; }
        .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
        .invoice-box { text-align: right; }
        .invoice-label { font-size: 24px; font-weight: bold; color: #1e3a8a; }
        
        .info-card { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #1e3a8a; }
        .info-label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 5px; }
        .info-value { font-size: 16px; font-weight: 500; }

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
        <div class="info-label">Bill To</div>
        <div class="info-value">${data.customer.name}</div>
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
