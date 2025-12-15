// app/api/send-invoice/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
// 👇 IMPORTANT: Import the Email version, not the standard version
import { getInvoiceData, generateEmailInvoiceHTML } from '@/lib/invoice/invoice-generator';

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

    // 2. Generate Email-Safe HTML (Tables instead of Flexbox)
    // The function generateEmailInvoiceHTML already includes <html>, <body>, etc.
    const emailHtml = generateEmailInvoiceHTML(invoiceData);

    // 3. Configure Transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 465,
      secure: true,
      auth: {
        user: '9d0a00001@smtp-brevo.com', // Brevo Login
        pass: process.env.BREVO_SMTP_KEY || process.env.SMTP_PASSWORD,
      },
      family: 4, // Forces IPv4 (Critical for Render/Brevo timeouts)
    } as any);

    // 4. Send Email
    const info = await transporter.sendMail({
      from: '"Spraxe Support" <9d0a00001@smtp-brevo.com>',
      to: email,
      subject: `Order #${invoiceData.invoiceNumber} Confirmation`,
      html: emailHtml, // <--- Send the generated HTML directly
    });

    console.log('Message sent: %s', info.messageId);
    return NextResponse.json({ success: true, messageId: info.messageId });

  } catch (error: any) {
    console.error('Email Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
