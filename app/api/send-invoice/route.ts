// app/api/send-invoice/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getInvoiceData, generateInvoiceHTML } from '@/lib/invoice/invoice-generator';

export async function POST(req: Request) {
  try {
    const { orderId, email } = await req.json();

    if (!orderId || !email) {
      return NextResponse.json({ error: 'Missing orderId or email' }, { status: 400 });
    }

    console.log(`Sending inline invoice for ${orderId} to ${email}...`);

    // 1. Fetch Invoice Data
    const invoiceData = await getInvoiceData(orderId);
    if (!invoiceData) {
      return NextResponse.json({ error: 'Invoice data not found' }, { status: 404 });
    }

    // 2. Generate HTML
    // We wrap the invoice in a centered container for better email viewing
    const rawInvoiceHtml = generateInvoiceHTML(invoiceData);
    
    // Email clients usually need a specific wrapper to look good
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #${invoiceData.invoiceNumber}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: Arial, sans-serif;">
        <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
            ${rawInvoiceHtml} 
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
           <p>Thank you for shopping with Spraxe.</p>
           <a href="${process.env.NEXT_PUBLIC_APP_URL}/invoice/${orderId}" style="color: #1e3a8a;">View in Browser</a>
        </div>
      </body>
      </html>
    `;

    // 3. Configure Transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 465,
      secure: true,
      auth: {
        user: '9d0a00001@smtp-brevo.com',
        pass: process.env.BREVO_SMTP_KEY || process.env.SMTP_PASSWORD,
      },
      family: 4, 
    } as any);

    // 4. Send Email (NO ATTACHMENTS, JUST HTML)
    const info = await transporter.sendMail({
      from: '"Spraxe Support" <9d0a00001@smtp-brevo.com>',
      to: email,
      subject: `Order #${invoiceData.invoiceNumber} Confirmation`,
      html: emailBody, // <--- The invoice is now the body of the email
    });

    console.log('Message sent: %s', info.messageId);
    return NextResponse.json({ success: true, messageId: info.messageId });

  } catch (error: any) {
    console.error('Email Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
