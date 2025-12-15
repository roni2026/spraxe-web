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

    console.log(`Sending invoice for ${orderId} to ${email}...`);

    // 1. Fetch Invoice Data
    const invoiceData = await getInvoiceData(orderId);
    if (!invoiceData) {
      console.error(`Invoice data not found for order: ${orderId}`);
      return NextResponse.json({ error: 'Invoice data not found' }, { status: 404 });
    }

    // 2. Generate HTML
    const invoiceHtml = generateInvoiceHTML(invoiceData);

    // 3. Resolve Password (Handle undefined TS error)
    const smtpPassword = process.env.BREVO_SMTP_KEY || process.env.SMTP_PASSWORD;

    if (!smtpPassword) {
      console.error('Missing SMTP Password in Environment Variables');
      return NextResponse.json({ error: 'Server Misconfiguration' }, { status: 500 });
    }

    // 4. Configure Brevo SMTP Transporter
    // We cast to 'any' here to fix the "No overload matches this call" TypeScript error
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 465,
      secure: true,
      auth: {
        user: '9d0a00001@smtp-brevo.com',
        pass: smtpPassword,
      },
      family: 4, // Forces IPv4 (Fixes Render Timeout)
    } as any);

    // 5. Send Email
    const info = await transporter.sendMail({
      from: '"Spraxe Support" <9d0a00001@smtp-brevo.com>',
      to: email,
      subject: `Invoice for Order #${invoiceData.invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Thank you for your order!</h2>
          <p>Hi ${invoiceData.customer.name},</p>
          <p>Your order <strong>#${invoiceData.invoiceNumber}</strong> is now <strong>Processing</strong>.</p>
          <p>Please find your invoice attached.</p>
          <br/>
          <p>Best regards,<br/>Spraxe Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `Invoice-${invoiceData.invoiceNumber}.html`,
          content: invoiceHtml,
          contentType: 'text/html',
        },
      ],
    });

    console.log('Message sent: %s', info.messageId);
    return NextResponse.json({ success: true, messageId: info.messageId });

  } catch (error: any) {
    console.error('Email Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
