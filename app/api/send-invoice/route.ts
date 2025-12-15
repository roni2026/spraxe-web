// app/api/send-invoice/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
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

    // 2. Generate Email HTML
    const emailHtml = generateEmailInvoiceHTML(invoiceData);

    // 3. Configure Transporter (Aggressive Render Fixes)
    const transporter = nodemailer.createTransport({
      // Try legacy hostname if main one times out
      host: 'smtp-relay.sendinblue.com', 
      port: 465,
      secure: true,
      auth: {
        user: '9d0a00001@smtp-brevo.com',
        pass: process.env.BREVO_SMTP_KEY || process.env.SMTP_PASSWORD,
      },
      // NETWORK FIXES
      family: 4,              // Force IPv4
      connectionTimeout: 60000, // Wait 60 seconds (Render can be slow)
      greetingTimeout: 30000,   // Wait 30s for server greeting
      socketTimeout: 60000,     // Keep socket open longer
      logger: true,           // Log SMTP traffic to console
      debug: true             // Include debug info
    } as any);

    // 4. Send Email
    const info = await transporter.sendMail({
      from: '"Spraxe Support" <9d0a00001@smtp-brevo.com>',
      to: email,
      subject: `Order #${invoiceData.invoiceNumber} Confirmation`,
      html: emailHtml,
    });

    console.log('Message sent: %s', info.messageId);
    return NextResponse.json({ success: true, messageId: info.messageId });

  } catch (error: any) {
    console.error('Email Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
