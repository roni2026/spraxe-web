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
  console.log("Fetching invoice for Order ID:", orderId);

  // STEP 1: Fetch Order
  const { data: orderData } = await supabase
    .from('orders')
    .select(`*, profiles ( full_name, email, phone )`)
    .eq('id', orderId)
    .maybeSingle();

  const order = orderData || {
    id: orderId,
    order_number: 'ORD-MISSING',
    created_at: new Date().toISOString(),
    subtotal: 0,
    total: 0,
    discount: 0,
    shipping_cost: 0,
    contact_number: '',
    shipping_address: ''
  };

  // STEP 2: Fetch Items
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('product_name, quantity, unit_price, total_price')
    .eq('order_id', orderId);

  const items = orderItems?.map((item: any) => ({
    name: item.product_name || 'Product',
    quantity: safeNum(item.quantity),
    price: safeNum(item.unit_price),
    total: safeNum(item.total_price)
  })) || [];

  if (!orderData && items.length > 0) {
    const calculatedSubtotal = items.reduce((acc, item) => acc + item.total, 0);
    order.subtotal = calculatedSubtotal;
    order.total = calculatedSubtotal;
  }

  // STEP 3: Fetch or Create Invoice
  let { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (!invoice) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newInvoiceNumber = `INV-${dateStr}-${randomSuffix}`;

    const newInvoiceObj = {
      order_id: orderId,
      invoice_number: newInvoiceNumber,
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      subtotal: order.subtotal,
      total_amount: order.total,
      notes: 'Thank you for shopping with Spraxe!'
    };

    const { data: saved } = await supabase
      .from('invoices')
      .insert(newInvoiceObj)
      .select()
      .maybeSingle();

    invoice = saved || newInvoiceObj;
  }

  // STEP 4: Customer Details
  const profile = order.profiles && (Array.isArray(order.profiles) ? order.profiles[0] : order.profiles);
  const customerName = profile?.full_name || 'Valued Customer';
  const customerPhone = order.contact_number || profile?.phone || 'N/A';
  const customerAddress = order.shipping_address || order.delivery_location || 'Address not provided';

  return {
    invoiceNumber: invoice.invoice_number,
    issueDate: new Date(invoice.issue_date).toLocaleDateString('en-BD'),
    dueDate: new Date(invoice.due_date).toLocaleDateString('en-BD'),
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
    notes: invoice.notes || '',
  };
}

// =======================================================
// 1. WEB VERSION (For Dashboard View - Uses Flexbox)
// =======================================================
export function generateInvoiceHTML(data: InvoiceData): string {
  if (!data) return "<h1>No Data</h1>";

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
        <tbody>${itemsHTML}</tbody>
      </table>

      <div class="totals">
        <div class="row"><span>Subtotal</span><span>৳${formatCurrency(data.subtotal)}</span></div>
        ${data.discountAmount > 0 ? `<div class="row" style="color:#ef4444;"><span>Discount</span><span>-৳${formatCurrency(data.discountAmount)}</span></div>` : ''}
        ${data.shippingCost > 0 ? `<div class="row"><span>Shipping</span><span>৳${formatCurrency(data.shippingCost)}</span></div>` : ''}
        <div class="total-row"><span>Total</span><span>৳${formatCurrency(data.totalAmount)}</span></div>
      </div>

      <div class="footer">Thank you for shopping with Spraxe!</div>
    </body>
    </html>
  `;
}

// =======================================================
// 2. EMAIL VERSION (Uses Tables for Outlook/Gmail support)
// =======================================================
export function generateEmailInvoiceHTML(data: InvoiceData): string {
  if (!data) return "<h1>No Data</h1>";

  const itemsHTML = data.items.map(item => `
    <tr>
      <td style="padding:10px; border-bottom:1px solid #eee; font-family: sans-serif;">${item.name}</td>
      <td style="padding:10px; border-bottom:1px solid #eee; text-align:center; font-family: sans-serif;">${item.quantity}</td>
      <td style="padding:10px; border-bottom:1px solid #eee; text-align:right; font-family: sans-serif;">৳${formatCurrency(item.price)}</td>
      <td style="padding:10px; border-bottom:1px solid #eee; text-align:right; font-family: sans-serif;">৳${formatCurrency(item.total)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${data.invoiceNumber}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5;">
        <tr>
          <td align="center" style="padding: 20px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
              
              <tr>
                <td style="padding: 30px 30px 0 30px; border-bottom: 3px solid #1e3a8a;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td valign="top" style="padding-bottom: 20px;">
                        <h1 style="margin: 0; font-size: 28px; color: #1e3a8a; font-weight: bold;">SPRAXE</h1>
                        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Gazipur, Dhaka, Bangladesh</p>
                        <p style="margin: 0; color: #666; font-size: 14px;">09638371951</p>
                      </td>
                      <td valign="top" align="right" style="padding-bottom: 20px;">
                        <p style="margin: 0; font-size: 24px; color: #1e3a8a; font-weight: bold;">INVOICE</p>
                        <p style="margin: 5px 0 0 0; font-size: 16px; color: #333;">${data.invoiceNumber}</p>
                        <p style="margin: 0; font-size: 14px; color: #666;">${data.issueDate}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 30px;">
                  <table width="100%" bgcolor="#f8fafc" cellpadding="20" style="border-radius: 8px; border-left: 4px solid #1e3a8a;">
                    <tr>
                      <td>
                        <p style="margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold;">Bill To</p>
                        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #333;">${data.customer.name}</p>
                        <p style="margin: 5px 0 0 0; color: #333;">${data.customer.phone}</p>
                        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">${data.customer.address}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 0 30px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <thead>
                      <tr style="background-color: #f1f5f9;">
                        <th align="left" style="padding: 12px; font-size: 12px; text-transform: uppercase; color: #475569; font-family: sans-serif;">Item</th>
                        <th align="center" style="padding: 12px; font-size: 12px; text-transform: uppercase; color: #475569; font-family: sans-serif;">Qty</th>
                        <th align="right" style="padding: 12px; font-size: 12px; text-transform: uppercase; color: #475569; font-family: sans-serif;">Price</th>
                        <th align="right" style="padding: 12px; font-size: 12px; text-transform: uppercase; color: #475569; font-family: sans-serif;">Total</th>
                      </tr>
                    </thead>
                    <tbody>${itemsHTML}</tbody>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 20px 30px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td width="60%"></td>
                      <td width="40%">
                        <table width="100%" border="0" cellspacing="0" cellpadding="5">
                          <tr>
                            <td style="color: #666; font-size: 14px;">Subtotal</td>
                            <td align="right" style="font-weight: 500;">৳${formatCurrency(data.subtotal)}</td>
                          </tr>
                          ${data.discountAmount > 0 ? `<tr><td style="color: #ef4444; font-size: 14px;">Discount</td><td align="right" style="color: #ef4444;">-৳${formatCurrency(data.discountAmount)}</td></tr>` : ''}
                          ${data.shippingCost > 0 ? `<tr><td style="color: #666; font-size: 14px;">Shipping</td><td align="right">৳${formatCurrency(data.shippingCost)}</td></tr>` : ''}
                          <tr>
                            <td style="padding-top: 10px; border-top: 2px solid #1e3a8a; color: #1e3a8a; font-weight: bold; font-size: 16px;">Total</td>
                            <td align="right" style="padding-top: 10px; border-top: 2px solid #1e3a8a; color: #1e3a8a; font-weight: bold; font-size: 16px;">৳${formatCurrency(data.totalAmount)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding: 30px; background-color: #ffffff; border-top: 1px solid #eee;">
                  <p style="margin: 0; color: #94a3b8; font-size: 12px;">Thank you for shopping with Spraxe!</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
