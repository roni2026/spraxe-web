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
  console.log("Fetching invoice for order:", orderId);

  // 1. Fetch Order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      user:profiles ( full_name, email, phone ),
      items:order_items ( quantity, price_at_time, product:products ( name ) )
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    console.error("Order Fetch Failed:", orderError);
    return null;
  }

  // 2. Fetch Invoice (Optional)
  const { data: invoice } = await supabase
    .from('invoices')
    .select('invoice_number, issue_date, due_date, notes')
    .eq('order_id', orderId)
    .maybeSingle();

  // 3. Prepare Data
  const invNumber = invoice?.invoice_number || order.order_number || 'INV-TEMP';
  
  // Date Logic
  const issueDateRaw = invoice?.issue_date || order.created_at;
  const dueDateRaw = invoice?.due_date || order.created_at;
  
  // Phone Logic (Order > Profile > N/A)
  const phone = order.contact_number || order.user?.phone || 'N/A';
  
  // Address Logic
  const address = order.shipping_address || order.delivery_location || 'N/A';

  // Items Logic
  const items = order.items?.map((item: any) => ({
    name: item.product?.name || 'Product',
    quantity: safeNum(item.quantity),
    price: safeNum(item.price_at_time),
    total: safeNum(item.price_at_time) * safeNum(item.quantity)
  })) || [];

  const data = {
    invoiceNumber: invNumber,
    issueDate: new Date(issueDateRaw).toLocaleDateString('en-BD'),
    dueDate: new Date(dueDateRaw).toLocaleDateString('en-BD'),
    customer: {
      name: order.user?.full_name || 'Customer',
      phone: phone,
      address: address,
    },
    items: items,
    subtotal: safeNum(order.subtotal),
    discountAmount: safeNum(order.discount),
    shippingCost: safeNum(order.shipping_cost),
    totalAmount: safeNum(order.total),
    notes: invoice?.notes || order.notes || '',
  };

  console.log("Invoice Data Ready:", data);
  return data;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  if (!data) return "<h1>Error: No Data</h1>";

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
        body { font-family: sans-serif; padding: 40px; color: #333; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; color: #1e3a8a; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f8f9fa; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; }
        .totals { width: 300px; margin-left: auto; margin-top: 20px; }
        .row { display: flex; justify-content: space-between; padding: 5px 0; }
        .total { font-weight: bold; border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">SPRAXE</div>
          <div style="font-size: 14px; margin-top: 5px;">Gazipur, Dhaka</div>
          <div style="font-size: 14px;">09638371951</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 20px; font-weight: bold;">INVOICE</div>
          <div>${data.invoiceNumber}</div>
          <div>${data.issueDate}</div>
        </div>
      </div>

      <div style="margin-bottom: 30px; background: #f9f9f9; padding: 15px; border-radius: 5px;">
        <strong>Bill To:</strong><br>
        ${data.customer.name}<br>
        ${data.customer.phone}<br>
        ${data.customer.address}
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
        ${data.discountAmount > 0 ? `<div class="row"><span>Discount:</span><span>-৳${formatCurrency(data.discountAmount)}</span></div>` : ''}
        ${data.shippingCost > 0 ? `<div class="row"><span>Shipping:</span><span>৳${formatCurrency(data.shippingCost)}</span></div>` : ''}
        <div class="row total"><span>Total:</span><span>৳${formatCurrency(data.totalAmount)}</span></div>
      </div>
    </body>
    </html>
  `;
}
